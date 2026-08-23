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

// ─── 문체 규칙 ───
// 기존 번역 4,800여 건이 평서체(~이다/~한다)로 쌓여 있다. 존댓말로 번역하면
// 사이트 안에서 문체가 뒤섞이므로 언어별로 도감 문체를 못박는다.
const STYLE_RULES = {
  ko: '- 반드시 평서체(~이다 / ~한다 / ~이었다)로 쓴다. 존댓말(~입니다 / ~습니다 / ~해요)은 절대 쓰지 않는다.\n- 백과사전 항목처럼 간결하게 쓴다.',
  ja: '- 必ず常体(だ・である体)で書く。敬体(です・ます)は使わない。\n- 百科事典の項目のように簡潔に書く。',
  zh: '- 使用书面语，简洁客观，如百科全书词条。\n- 不要使用口语或敬语表达。',
};

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
          content: `You are a professional translator specializing in folklore and mythology. Translate the following JSON from ${langNames[fromLang]} to ${langNames[toLang]}. Preserve JSON structure exactly. The JSON keys are database IDs (e.g. "br-headless-mule", "gb-실낙원") — copy every key VERBATIM, byte for byte. NEVER translate, transliterate, or alter a key. Keep proper nouns (creature names) in their original form. Return only valid JSON.

STYLE (must follow — this is an encyclopedia/bestiary, not a conversation):
${STYLE_RULES[toLang] || ""}

TERMINOLOGY:
- Creature type labels stay in English exactly as written: Deity, Creature, Spirit, Fairy, Serpent, Demon, Beast, Sea Creature, Giant, Bird, Vengeful Ghost, Folktale, Vampire, Monster, Sorcerer, Urban Legend, Ghost, Witch, Water Spirit, Trickster, Cryptid, Hero, Undead, Shapeshifter, Dragon, Divine Beast, Werewolf, Forest Spirit.
  They are classification labels used by the site's filters, and the existing 4,800+ translations keep them in English.
  e.g. "한국 설화에 등장하는 Spirit." stays "한국 설화에 등장하는 Spirit." — never "영혼" or "정령".

ACCURACY:
- Translate place names by meaning, not by literal word. e.g. "Heaven Lake" is the lake 천지/天池, not "the sky".
- If the source text ends mid-thought with an ellipsis (… or ...), keep it at the end. Do not invent an ending.`,
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
  let jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // LLM이 문자열 리터럴 안에 raw 개행/제어문자를 넣어 깨뜨리는 경우가 잦다.
    // 따옴표 안에 있는 제어문자만 이스케이프해서 한 번 더 시도한다.
    let out = "", inStr = false, esc = false;
    for (const ch of jsonStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && ch === "\n") { out += "\\n"; continue; }
      if (inStr && ch === "\r") { out += "\\r"; continue; }
      if (inStr && ch === "\t") { out += "\\t"; continue; }
      out += ch;
    }
    return JSON.parse(out);
  }
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

      // 청크가 실패하면 그 20건이 통째로 유실된다(무효화 후 재번역이라 빈 자리가 남는다).
      // 재시도하고, 그래도 안 되면 반으로 쪼개 시도한다 — 작은 청크일수록 LLM이
      // 온전한 JSON을 낼 확률이 높다.
      const runChunk = async (data, depth = 0) => {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const translated = await translateBatch(data, "en", locale);
            // LLM이 키(id)까지 번역해버리는 일이 실제로 있었다
            // ("br-headless-mule" → "br-无头骡"). 요청한 키가 아니면 버린다.
            // 버려진 항목은 미번역으로 남아 다음 실행에서 자연히 재시도된다.
            let bad = 0;
            for (const [id, trans] of Object.entries(translated)) {
              if (!(id in data)) { bad++; continue; }
              result[id] = trans;
            }
            if (bad) console.error(`  키 변조 ${bad}건 폐기`);
            return true;
          } catch (err) {
            console.error(`  chunk 실패(${attempt}/3, ${Object.keys(data).length}건): ${err.message}`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
        const keys = Object.keys(data);
        if (depth < 3 && keys.length > 1) {
          const mid = Math.ceil(keys.length / 2);
          const a = {}, b = {};
          keys.slice(0, mid).forEach(k => (a[k] = data[k]));
          keys.slice(mid).forEach(k => (b[k] = data[k]));
          console.error(`  → ${keys.length}건을 ${mid}/${keys.length - mid}로 쪼개 재시도`);
          const ra = await runChunk(a, depth + 1);
          const rb = await runChunk(b, depth + 1);
          return ra && rb;
        }
        console.error(`  → 포기: ${keys.join(", ")}`);
        return false;
      };
      await runChunk(chunkData);
      writeFileSync(outPath, JSON.stringify(result, null, 0));

      // Small delay between chunks
      if (i + CHUNK_SIZE < batch.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`${locale}: Done! ${Object.keys(result).length} total translations saved to ${outPath}`);
  }
}

main().catch(console.error);
