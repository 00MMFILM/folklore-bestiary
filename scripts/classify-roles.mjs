#!/usr/bin/env node
/**
 * classify-roles.mjs
 *
 * GPT-4o-mini로 크리처의 서사 역할(protagonist/helper/episodic/villain)을 자동 분류하여
 * folklore-data.ts의 각 크리처에 `rl` 필드로 삽입합니다.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/classify-roles.mjs
 *
 * Options:
 *   --dry   API 호출 없이 통계만 출력
 */

import fs from "fs";
import path from "path";

// ─── Config ───
const DATA_PATH = path.join(process.cwd(), "lib", "folklore-data.ts");
const DATA_MARKER = "export const FOLKLORE_DATA: CountryData[] = ";
const PROGRESS_PATH = path.join(process.cwd(), "scripts", "role-classification-progress.json");
const BATCH_SIZE = 20;
const DELAY_MS = 500;
const VALID_ROLES = ["protagonist", "helper", "episodic", "villain"];

const args = process.argv.slice(2);
const dry = args.includes("--dry");

// ─── Data load/save (same pattern as crawl-wikipedia-folklore.mjs) ───
function findDataRange(content) {
  const startIdx = content.indexOf(DATA_MARKER) + DATA_MARKER.length;
  let depth = 0, endIdx = startIdx;
  let inString = false, escape = false;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "[") depth++;
    if (ch === "]") { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  return { startIdx, endIdx };
}

function loadData() {
  const content = fs.readFileSync(DATA_PATH, "utf8");
  const { startIdx, endIdx } = findDataRange(content);
  return JSON.parse(content.substring(startIdx, endIdx));
}

function saveData(data) {
  let content = fs.readFileSync(DATA_PATH, "utf8");
  const { startIdx, endIdx } = findDataRange(content);
  content = content.substring(0, startIdx) + JSON.stringify(data) + content.substring(endIdx);
  fs.writeFileSync(DATA_PATH, content, "utf8");
}

// ─── Progress tracking ───
function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf8"));
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), "utf8");
}

// ─── Heuristic fallback ───
function heuristicRole(creature) {
  const f = creature.f || 5;
  const t = (creature.t || "").toLowerCase();
  const d = (creature.d || "").toLowerCase();

  // Villain: high fear or hostile types
  if (f >= 8) return "villain";
  if (t.includes("demon") || t.includes("evil") || t.includes("vengeful") ||
      t.includes("possessing") || t.includes("vampire") || t.includes("undead")) return "villain";
  if (d.includes("evil") || d.includes("devour") || d.includes("kill") ||
      d.includes("destroy") || d.includes("terroriz")) return "villain";

  // Protagonist: central mythological figures
  if (t.includes("deity") || t.includes("god") || t.includes("hero") ||
      t.includes("divine") || t.includes("titan") || t.includes("cosmic")) return "protagonist";
  if (d.includes("creator") || d.includes("creation") || d.includes("hero") ||
      d.includes("legendary king") || d.includes("legendary warrior")) return "protagonist";

  // Helper: benevolent or low fear
  if (f <= 3) return "helper";
  if (t.includes("guardian") || t.includes("fairy") || t.includes("healer") ||
      t.includes("protector") || t.includes("benevolent")) return "helper";
  if (d.includes("protect") || d.includes("help") || d.includes("guide") ||
      d.includes("guardian") || d.includes("benevolent")) return "helper";

  // Default: episodic
  return "episodic";
}

// ─── OpenAI API ───
async function classifyBatch(creatures) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY environment variable");

  const input = creatures.map(c => ({
    id: c.id,
    name: c.n,
    type: c.t,
    fear: c.f,
    desc: (c.d || "").substring(0, 200),
    ct: c.ct || "",
  }));

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
          content: `You classify folklore creatures by their narrative role. For each creature, assign exactly one role:
- protagonist: Central figure of stories, hero, deity, legendary ruler — the story revolves around them
- helper: Benevolent being that aids humans — guardian spirit, fairy godmother, protective animal
- episodic: Appears in brief/single episodes, neither clearly good nor evil — mysterious encounters, local legends
- villain: Antagonist, hostile entity — monsters that terrorize, demons, evil spirits

Return a JSON object mapping creature id to role. Example: {"kr-gumiho":"villain","jp-kitsune":"episodic"}
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: JSON.stringify(input),
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
  const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

// ─── Main ───
async function main() {
  console.log("Loading folklore data...");
  const data = loadData();

  // Flatten all creatures with country context
  const allCreatures = [];
  for (const country of data) {
    for (const b of country.b) {
      allCreatures.push(b);
    }
  }
  console.log(`Total creatures: ${allCreatures.length}`);

  // Check existing progress
  const progress = loadProgress();
  const alreadyClassified = Object.keys(progress).length;
  const needClassification = allCreatures.filter(c => !progress[c.id] && !c.rl);

  console.log(`Already classified (progress): ${alreadyClassified}`);
  console.log(`Already have rl field: ${allCreatures.filter(c => c.rl).length}`);
  console.log(`Need classification: ${needClassification.length}`);

  if (dry) {
    console.log("\n── Dry run stats ──");
    const batches = Math.ceil(needClassification.length / BATCH_SIZE);
    console.log(`  Batches needed: ${batches}`);
    console.log(`  Est. API calls: ${batches}`);
    const totalChars = needClassification.reduce((s, c) => s + (c.n?.length || 0) + (c.t?.length || 0) + Math.min(c.d?.length || 0, 200), 0);
    console.log(`  Total input chars: ~${totalChars}`);
    console.log(`  Est. tokens: ~${Math.round(totalChars / 3)}`);
    console.log(`  Est. cost: ~$${(totalChars / 3 / 1000000 * 0.15 * 3).toFixed(4)}`);

    // Show heuristic fallback distribution
    const heurDist = { protagonist: 0, helper: 0, episodic: 0, villain: 0 };
    allCreatures.forEach(c => { heurDist[heuristicRole(c)]++; });
    console.log("\n── Heuristic fallback distribution ──");
    Object.entries(heurDist).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    return;
  }

  // Process in batches
  let processed = 0;
  for (let i = 0; i < needClassification.length; i += BATCH_SIZE) {
    const batch = needClassification.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needClassification.length / BATCH_SIZE);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} creatures)...`);

    let results;
    try {
      results = await classifyBatch(batch);
    } catch (err) {
      console.error(`  API error: ${err.message}`);
      console.log("  Falling back to heuristics for this batch...");
      results = {};
      for (const c of batch) {
        results[c.id] = heuristicRole(c);
      }
    }

    // Validate and save results
    for (const c of batch) {
      const role = results[c.id];
      if (role && VALID_ROLES.includes(role)) {
        progress[c.id] = role;
      } else {
        // Invalid or missing — use heuristic
        progress[c.id] = heuristicRole(c);
        console.log(`  ${c.id}: heuristic fallback → ${progress[c.id]}`);
      }
      processed++;
    }

    saveProgress(progress);
    console.log(`  Saved progress (${Object.keys(progress).length} total)`);

    if (i + BATCH_SIZE < needClassification.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Apply roles to data
  console.log("\nApplying roles to folklore-data.ts...");
  let applied = 0;
  for (const country of data) {
    for (const b of country.b) {
      if (progress[b.id]) {
        b.rl = progress[b.id];
        applied++;
      } else if (!b.rl) {
        // No progress entry — use heuristic
        b.rl = heuristicRole(b);
        applied++;
      }
    }
  }

  saveData(data);
  console.log(`Applied rl field to ${applied} creatures`);

  // Summary
  const dist = { protagonist: 0, helper: 0, episodic: 0, villain: 0 };
  for (const country of data) {
    for (const b of country.b) {
      if (b.rl) dist[b.rl]++;
    }
  }
  console.log("\n── Role distribution ──");
  Object.entries(dist).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log("\nDone!");
}

main().catch(console.error);
