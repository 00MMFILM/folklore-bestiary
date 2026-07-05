#!/usr/bin/env node
// ============================================================
// image-gen-progress.json → lib/folklore-data.ts의 CREATURE_IMAGE_MAP 병합
// generate-images.mjs 실행 후 콘솔 출력을 수동 복사하던 단계를 자동화.
// ============================================================

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_PATH = resolve(ROOT, "lib/folklore-data.ts");
const MARKER = "export const CREATURE_IMAGE_MAP: Record<string, string> = ";

const src = readFileSync(DATA_PATH, "utf-8");
const startIdx = src.indexOf(MARKER) + MARKER.length;
let depth = 0, endIdx = startIdx, inString = false, escape = false;
for (let i = startIdx; i < src.length; i++) {
  const ch = src[i];
  if (escape) { escape = false; continue; }
  if (ch === "\\") { escape = true; continue; }
  if (ch === '"') { inString = !inString; continue; }
  if (inString) continue;
  if (ch === "{") depth++;
  if (ch === "}") { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}

const imageMap = JSON.parse(src.substring(startIdx, endIdx));
const progress = JSON.parse(readFileSync(resolve(ROOT, "scripts/image-gen-progress.json"), "utf-8"));

const shortId = (id) => id.replace(/^[a-z]{2,3}-/, "");
let added = 0;
for (const [fullId, path] of Object.entries(progress)) {
  const key = shortId(fullId);
  if (!imageMap[key]) {
    imageMap[key] = path;
    added++;
  }
}

if (added > 0) {
  const newSrc = src.substring(0, startIdx) + JSON.stringify(imageMap) + src.substring(endIdx);
  writeFileSync(DATA_PATH, newSrc, "utf-8");
}
console.log(`🗺️ CREATURE_IMAGE_MAP: +${added}건 병합 (총 ${Object.keys(imageMap).length}건)`);
