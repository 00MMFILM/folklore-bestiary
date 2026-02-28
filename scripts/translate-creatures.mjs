#!/usr/bin/env node
/**
 * translate-creatures.mjs
 *
 * Batch translates creature descriptions, abilities, and weaknesses
 * from folklore-data.ts into ko/zh/ja JSON files.
 *
 * Data shape:
 *   d  = English description
 *   ab = Korean abilities
 *   wk = Korean weaknesses
 *   sh = Korean story hooks (string or string[])
 *
 * Output (public/i18n/creatures-{locale}.json):
 *   { "kr-gumiho": { "d": "...", "ab": [...], "wk": [...], "sh": [...] }, ... }
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/translate-creatures.mjs
 *
 * Options:
 *   --locale ko|zh|ja   Translate only one locale (default: all three)
 *   --dry               Print stats without calling API
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Parse args ───
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const localeArg = args.find((_, i, a) => a[i - 1] === "--locale");
const targetLocales = localeArg ? [localeArg] : ["ko", "zh", "ja"];

// ─── Extract creatures from folklore-data.ts ───
function extractCreatures() {
  const src = readFileSync(resolve(ROOT, "lib/folklore-data.ts"), "utf-8");

  // Extract FOLKLORE_DATA by finding the balanced array
  const marker = "export const FOLKLORE_DATA: CountryData[] = ";
  const startIdx = src.indexOf(marker);
  if (startIdx === -1) throw new Error("FOLKLORE_DATA not found");

  const jsonStart = startIdx + marker.length;

  // Track brackets carefully, handling strings
  let depth = 0;
  let jsonEnd = jsonStart;
  let inString = false;
  let escapeNext = false;

  for (let i = jsonStart; i < src.length; i++) {
    const ch = src[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === "\\") { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }

  let jsonStr = src.slice(jsonStart, jsonEnd);

  // The data may have TS-specific syntax that isn't valid JSON
  // Fix: remove trailing commas before ] or }
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON parse failed, trying eval fallback...");
    // Fallback: evaluate as JS
    data = (0, eval)("(" + jsonStr + ")");
  }

  const creatures = [];
  for (const country of data) {
    for (const b of country.b) {
      creatures.push({
        id: b.id,
        d: b.d || null,
        ab: b.ab || null,
        wk: b.wk || null,
        sh: b.sh ? (Array.isArray(b.sh) ? b.sh : [b.sh]) : null,
      });
    }
  }

  return creatures;
}

// ─── OpenAI Translation ───
async function translateBatch(texts, fromLang, toLang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY environment variable");

  const langNames = { ko: "Korean", zh: "Simplified Chinese", ja: "Japanese", en: "English" };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in folklore and mythology. Translate the following JSON from ${langNames[fromLang]} to ${langNames[toLang]}. Preserve JSON structure exactly. Keep proper nouns (creature names) in their original form. Return only valid JSON.`,
        },
        {
          role: "user",
          content: JSON.stringify(texts),
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

// ─── Main ───
async function main() {
  console.log("Extracting creatures from folklore-data.ts...");
  const creatures = extractCreatures();
  console.log(`Found ${creatures.length} creatures`);

  if (dry) {
    const withDesc = creatures.filter(c => c.d);
    const withAb = creatures.filter(c => c.ab);
    const withWk = creatures.filter(c => c.wk);
    const withSh = creatures.filter(c => c.sh);
    console.log(`  With descriptions: ${withDesc.length}`);
    console.log(`  With abilities: ${withAb.length}`);
    console.log(`  With weaknesses: ${withWk.length}`);
    console.log(`  With story hooks: ${withSh.length}`);
    console.log(`  Target locales: ${targetLocales.join(", ")}`);

    // Estimate tokens
    const totalChars = creatures.reduce((s, c) => {
      return s + (c.d?.length || 0) +
        (c.ab?.join("").length || 0) +
        (c.wk?.join("").length || 0) +
        (c.sh?.join("").length || 0);
    }, 0);
    console.log(`  Total chars: ~${totalChars}`);
    console.log(`  Est. tokens: ~${Math.round(totalChars / 3)}`);
    console.log(`  Est. cost (per locale): ~$${(totalChars / 3 / 1000000 * 0.15 * 2).toFixed(2)}`);
    return;
  }

  for (const locale of targetLocales) {
    const outPath = resolve(ROOT, `public/i18n/creatures-${locale}.json`);

    // Load existing translations to resume
    let existing = {};
    if (existsSync(outPath)) {
      existing = JSON.parse(readFileSync(outPath, "utf-8"));
      console.log(`Loaded ${Object.keys(existing).length} existing translations for ${locale}`);
    }

    const result = { ...existing };
    const batch = [];

    for (const c of creatures) {
      if (result[c.id]) continue; // Skip already translated

      const entry = {};
      if (locale === "ko") {
        // ko: translate English description to Korean (ab/wk already Korean)
        if (c.d) entry.d = c.d; // will be translated en→ko
      } else {
        // zh/ja: translate description en→target, abilities/weaknesses ko→target
        if (c.d) entry.d = c.d;
        if (c.ab) entry.ab = c.ab;
        if (c.wk) entry.wk = c.wk;
        if (c.sh) entry.sh = c.sh;
      }

      if (Object.keys(entry).length > 0) {
        batch.push({ id: c.id, ...entry });
      }
    }

    if (batch.length === 0) {
      console.log(`${locale}: All ${creatures.length} creatures already translated`);
      continue;
    }

    console.log(`${locale}: Translating ${batch.length} creatures...`);

    // Process in chunks of 20
    const CHUNK_SIZE = 20;
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);
      const chunkData = {};
      for (const c of chunk) {
        const { id, ...rest } = c;
        chunkData[id] = rest;
      }

      console.log(`  [${locale}] Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(batch.length / CHUNK_SIZE)} (${chunk.length} creatures)...`);

      try {
        const fromLang = locale === "ko" ? "en" : "en"; // d is always English
        const translated = await translateBatch(chunkData, fromLang, locale);

        for (const [id, trans] of Object.entries(translated)) {
          result[id] = trans;
        }

        // Save progress after each chunk
        writeFileSync(outPath, JSON.stringify(result, null, 0));
      } catch (err) {
        console.error(`  Error in chunk: ${err.message}`);
        // Save what we have
        writeFileSync(outPath, JSON.stringify(result, null, 0));
      }

      // Small delay between chunks
      if (i + CHUNK_SIZE < batch.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`${locale}: Done! ${Object.keys(result).length} total translations saved to ${outPath}`);
  }
}

main().catch(console.error);
