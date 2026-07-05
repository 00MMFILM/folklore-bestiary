#!/usr/bin/env node
// ============================================================
// 일회성: public/creatures/**의 PNG-위장 .webp 파일을 진짜 WebP로 변환
// (기존 생성 파이프라인이 PNG 바이트를 .webp 이름으로 저장했음 — 장당 ~2MB)
// ============================================================

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASE = resolve(ROOT, "public/creatures");

const files = [];
for (const dir of readdirSync(BASE, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const f of readdirSync(join(BASE, dir.name))) {
    if (f.endsWith(".webp")) files.push(join(BASE, dir.name, f));
  }
}

console.log(`🖼️ 검사 대상: ${files.length}개 파일`);
let converted = 0, skipped = 0, before = 0, after = 0;

for (const file of files) {
  const buf = readFileSync(file);
  // 진짜 WebP는 'RIFF....WEBP' 시그니처
  const isWebp = buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  if (isWebp) { skipped++; continue; }

  const out = await sharp(buf).webp({ quality: 82 }).toBuffer();
  before += buf.length;
  after += out.length;
  writeFileSync(file, out);
  converted++;
  if (converted % 100 === 0) console.log(`   ${converted}개 변환 중...`);
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`✅ 변환: ${converted}개, 이미 WebP: ${skipped}개`);
if (converted) console.log(`📉 용량: ${mb(before)}MB → ${mb(after)}MB (-${(100 - after / before * 100).toFixed(0)}%)`);
