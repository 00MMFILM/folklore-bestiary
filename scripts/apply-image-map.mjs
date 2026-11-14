#!/usr/bin/env node
// ============================================================
// image-gen-progress.json → lib/folklore-data.ts의 CREATURE_IMAGE_MAP 병합
// generate-images.mjs 실행 후 콘솔 출력을 수동 복사하던 단계를 자동화.
// ============================================================

import { readFileSync, writeFileSync, existsSync } from "fs";
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
const progressFile=resolve(ROOT, "scripts/image-gen-progress.json");
const progress = existsSync(progressFile) ? JSON.parse(readFileSync(progressFile, "utf-8")) : {};
const dataLine=src.split('\n').find(l=>l.startsWith('export const FOLKLORE_DATA: CountryData[] = '));
const ids=new Set(JSON.parse(dataLine.slice(dataLine.indexOf('= ')+2).replace(/;$/,'')).flatMap(c=>c.b.map(b=>b.id)));

const shortId = (id) => id.replace(/^[a-z]{2,3}-/, "");
let added = 0;
const addedIds=[];
for (const [fullId, path] of Object.entries(progress)) {
  if (!ids.has(fullId) || !existsSync(resolve(ROOT,'public',path.replace(/^\//,'')))) continue;
  const existing=[imageMap[shortId(fullId)],imageMap[fullId.replace(/^[a-z]{2}-/,'')],imageMap[fullId]];
  if (!existing.some(p=>p && existsSync(resolve(ROOT,'public',p.replace(/^\//,''))))) {
    imageMap[fullId] = path;
    added++;
    addedIds.push(fullId);
  }
}

if (added > 0 && !process.argv.includes('--dry')) {
  const newSrc = src.substring(0, startIdx) + JSON.stringify(imageMap) + src.substring(endIdx);
  writeFileSync(DATA_PATH, newSrc, "utf-8");
}
console.log(`🗺️ CREATURE_IMAGE_MAP: +${added}건 병합 (총 ${Object.keys(imageMap).length}건)`);
console.log(`${process.argv.includes('--dry') ? 'DRY' : 'APPLIED'}: ${addedIds.join(', ')}`);
