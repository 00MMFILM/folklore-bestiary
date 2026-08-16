#!/usr/bin/env node
// 회귀 검증: 게이트를 기존 전체 데이터의 영어 설명에 돌려
// '진짜 생물인데 reject될' 오차단 후보를 뽑는다 (데이터 변경 없음).
// 판정 입력: 저장된 d 필드의 영어 부분(한국어 접두어 뒤) ≈ 원본 extract 근사.
import fs from 'fs';
import { looksNonCreatureSubject } from './crawl-wikipedia-folklore.mjs';

const c = fs.readFileSync('lib/folklore-data.ts', 'utf8');
const M = 'export const FOLKLORE_DATA: CountryData[] = ';
const s = c.indexOf(M) + M.length;
let d = 0, e = s, inS = false, esc = false;
for (let i = s; i < c.length; i++) {
  const ch = c[i];
  if (esc) { esc = false; continue; }
  if (ch === '\\') { esc = true; continue; }
  if (ch === '"') { inS = !inS; continue; }
  if (inS) continue;
  if (ch === '[') d++;
  if (ch === ']') { d--; if (d === 0) { e = i + 1; break; } }
}
const data = JSON.parse(c.substring(s, e));

// d 필드에서 영어 부분만 추출: "…설화에 등장하는 <Type>. <영어…>"
const engOf = (desc) => {
  const m = (desc || '').match(/등장하는 [^.]*\.\s*(.*)$/s);
  return m ? m[1] : desc;
};

const flagged = [];
let total = 0;
for (const co of data) for (const b of co.b) {
  total++;
  const eng = engOf(b.d);
  if (looksNonCreatureSubject(eng)) flagged.push({ iso: co.i, id: b.id, n: b.n, t: b.t, eng: (eng || '').slice(0, 120) });
}
console.log(`전체 ${total}종 중 게이트가 reject할 항목: ${flagged.length}건\n`);
for (const f of flagged) console.log(`[${f.iso}] ${f.n} (${f.t}) — ${f.eng}`);
fs.writeFileSync('scripts/gate-regression.json', JSON.stringify(flagged, null, 2));
