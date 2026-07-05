#!/usr/bin/env node
// ============================================================
// 이미지 미생성 크리처 선별 → /tmp/creatures-to-generate.json
// generate-images.mjs의 입력을 만드는 선행 단계.
// 우선순위: 공포 지수 높은 순 → 설명 긴 순 (관심도 프록시)
// 사용법: IMAGE_BATCH=10 node scripts/select-images-to-generate.mjs
// ============================================================

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BATCH = parseInt(process.env.IMAGE_BATCH || "10", 10);

const src = readFileSync(resolve(ROOT, "lib/folklore-data.ts"), "utf-8");

function extractBalanced(marker, open, close) {
  const startIdx = src.indexOf(marker) + marker.length;
  let depth = 0, endIdx = startIdx, inString = false, escape = false;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    if (ch === close) { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  return JSON.parse(src.substring(startIdx, endIdx));
}

const data = extractBalanced("export const FOLKLORE_DATA: CountryData[] = ", "[", "]");
const imageMap = extractBalanced("export const CREATURE_IMAGE_MAP: Record<string, string> = ", "{", "}");

// 진행 파일에 있는 것도 제외 (생성됐지만 아직 맵 미반영일 수 있음)
const progressPath = resolve(ROOT, "scripts/image-gen-progress.json");
const progress = existsSync(progressPath) ? JSON.parse(readFileSync(progressPath, "utf-8")) : {};

const shortId = (id) => id.replace(/^[a-z]{2,3}-/, "");

const missing = [];
for (const country of data) {
  for (const b of country.b) {
    if (imageMap[shortId(b.id)] || progress[b.id]) continue;
    missing.push({
      id: b.id,
      name: b.n,
      type: b.t,
      fear: b.f,
      d: b.d,
      country: country.c,
      region: country.r,
    });
  }
}

missing.sort((a, b) => (b.fear - a.fear) || ((b.d || "").length - (a.d || "").length));
const selected = missing.slice(0, BATCH);

writeFileSync("/tmp/creatures-to-generate.json", JSON.stringify(selected, null, 2));
console.log(`🎨 이미지 미보유: ${missing.length}마리 중 ${selected.length}마리 선별 (배치: ${BATCH})`);
selected.forEach(c => console.log(`   [f:${c.fear}] ${c.name} (${c.country})`));
