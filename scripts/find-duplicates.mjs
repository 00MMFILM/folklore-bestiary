#!/usr/bin/env node
// ============================================================
// 중복/저품질 크리처 검수 스크립트
// - 같은 나라 안의 중복 (자동 제거 후보): core name 완전 일치
// - 나라 간 동명 (리포트만): 같은 존재가 여러 나라에 있을 수 있음
// - 발음 구별 기호 무시 매칭 (Ārohirohi vs Arohirohi 류)
// 사용법: node scripts/find-duplicates.mjs [--fix]
//   --fix: 같은 나라 내 중복을 자동 제거 (설명 긴 쪽 유지)
// ============================================================

import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'lib', 'folklore-data.ts');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

function findDataRange(content) {
  const startIdx = content.indexOf(MARKER) + MARKER.length;
  let depth = 0, endIdx = startIdx, inString = false, escape = false;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  return { startIdx, endIdx };
}

// core name: 괄호 제거 + 소문자 + 발음 구별 기호 제거
const coreName = (name) => (name || '')
  .replace(/\s*\(.*?\)\s*/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

const content = fs.readFileSync(DATA_PATH, 'utf8');
const { startIdx, endIdx } = findDataRange(content);
const data = JSON.parse(content.substring(startIdx, endIdx));

const total = data.reduce((s, c) => s + c.b.length, 0);
console.log(`🔎 검수 대상: ${data.length}개국 ${total}마리\n`);

// ── 1) 같은 나라 내 중복 ──
const sameCountryDups = [];
for (const country of data) {
  const seen = new Map(); // core → index
  country.b.forEach((b, idx) => {
    const key = coreName(b.n) || coreName(b.ln);
    if (!key) return;
    if (seen.has(key)) {
      sameCountryDups.push({ iso: country.i, country: country.c, key, keepIdx: seen.get(key), dropIdx: idx, keep: country.b[seen.get(key)].n, drop: b.n });
    } else {
      seen.set(key, idx);
    }
  });
}
console.log(`── 같은 나라 내 중복: ${sameCountryDups.length}건 ──`);
sameCountryDups.slice(0, 30).forEach(d => console.log(`   [${d.iso}] "${d.keep}" ↔ "${d.drop}"`));
if (sameCountryDups.length > 30) console.log(`   ... 외 ${sameCountryDups.length - 30}건`);

// ── 2) 나라 간 동명 (리포트만) ──
const globalMap = new Map();
for (const country of data) {
  for (const b of country.b) {
    const key = coreName(b.n);
    if (!key) continue;
    if (!globalMap.has(key)) globalMap.set(key, []);
    globalMap.get(key).push({ iso: country.i, n: b.n });
  }
}
const crossDups = [...globalMap.entries()].filter(([, v]) => new Set(v.map(x => x.iso)).size > 1);
console.log(`\n── 나라 간 동명: ${crossDups.length}건 (검토용, 자동 제거 안 함) ──`);
crossDups.slice(0, 20).forEach(([k, v]) => console.log(`   "${k}": ${v.map(x => x.iso).join(', ')}`));
if (crossDups.length > 20) console.log(`   ... 외 ${crossDups.length - 20}건`);

// ── 리포트 저장 ──
const report = {
  scannedAt: new Date().toISOString(),
  total,
  sameCountry: sameCountryDups.map(({ iso, keep, drop }) => ({ iso, keep, drop })),
  crossCountry: crossDups.map(([key, v]) => ({ name: key, countries: v.map(x => x.iso) })),
};
fs.writeFileSync(path.join(process.cwd(), 'scripts', 'dup-report.json'), JSON.stringify(report, null, 2));
console.log('\n📄 scripts/dup-report.json 저장');

// ── --fix: 같은 나라 내 중복 제거 ──
if (process.argv.includes('--fix') && sameCountryDups.length > 0) {
  let removed = 0;
  for (const country of data) {
    const seen = new Map(); // core → creature (설명 긴 쪽 유지)
    const kept = [];
    for (const b of country.b) {
      const key = coreName(b.n) || coreName(b.ln);
      if (!key) { kept.push(b); continue; }
      if (seen.has(key)) {
        const prev = seen.get(key);
        if ((b.d || '').length > (prev.d || '').length) {
          kept[kept.indexOf(prev)] = b;
          seen.set(key, b);
        }
        removed++;
      } else {
        seen.set(key, b);
        kept.push(b);
      }
    }
    country.b = kept;
  }
  const newContent = content.substring(0, startIdx) + JSON.stringify(data) + content.substring(endIdx);
  fs.writeFileSync(DATA_PATH, newContent, 'utf8');
  const after = data.reduce((s, c) => s + c.b.length, 0);
  console.log(`\n🧹 중복 제거: ${removed}마리 (${total} → ${after})`);
}
