#!/usr/bin/env node
// ============================================================
// i18n 접두사 교정
//
// 정본 설명은 "{국가} 설화에 등장하는 {Type}. {영문}" 템플릿이다.
// 번역기가 한국어 '설화'를 뜻이 아니라 소리/한자로 옮겨버린 결과가 쌓였다:
//   zh: "世界设话中出现的" — 设话는 중국어에 없는 말 (设定/设法도 같은 오역)
//   ja: "世界設話に登場する" — 일본어 표기는 説話이고, 조사 の도 빠졌다
// 재번역 이전 데이터에도 있던 결함이라 전량을 함께 고친다.
//
// 사용법: node scripts/fix-i18n-prefix.mjs [--dry]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', 'i18n-prefix-fix-20260823.jsonl');

const RULES = {
  // 设话/设定/设法 → 传说 (전설). 앞의 국가명은 그대로 둔다.
  zh: [[/^(.{0,8}?)设(?:话|定|法)中出现的/, '$1传说中出现的'],
       [/^(.{0,8}?)设(?:话|定|法)中的/, '$1传说中的'],
       [/^(.{0,8}?)设(?:话|定|法)/, '$1传说']],
  // 設話 → の伝説. 이미 の가 붙어 있으면 중복시키지 않는다.
  ja: [[/^(.{0,8}?)の設話に登場する/, '$1の伝説に登場する'],
       [/^(.{0,8}?)設話に登場する/, '$1の伝説に登場する'],
       [/^(.{0,8}?)の設話/, '$1の伝説'],
       [/^(.{0,8}?)設話/, '$1の伝説']],
};

const stamp = new Date().toISOString();
const logs = [];
for (const [lg, rules] of Object.entries(RULES)) {
  const p = path.join(ROOT, 'public', 'i18n', `creatures-${lg}.json`);
  if (!fs.existsSync(p)) continue;
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  const samples = [];
  for (const [id, v] of Object.entries(t)) {
    if (!v || typeof v.d !== 'string') continue;
    const before = v.d;
    let after = before;
    for (const [re, rep] of rules) {
      if (re.test(after)) { after = after.replace(re, rep); break; }
    }
    if (after === before) continue;
    if (samples.length < 4) samples.push([before.slice(0, 46), after.slice(0, 46)]);
    if (!DRY) v.d = after;
    logs.push({ locale: lg, id, before: before.slice(0, 60), after: after.slice(0, 60), ts: stamp });
    n++;
  }
  console.log(`${lg}: ${n}건 교정`);
  samples.forEach(([b, a]) => console.log(`   전: ${b}\n   후: ${a}`));
  if (!DRY && n) fs.writeFileSync(p, JSON.stringify(t, null, 0));
}
if (!DRY && logs.length) {
  fs.mkdirSync(path.dirname(RUNLOG), { recursive: true });
  fs.writeFileSync(RUNLOG, logs.map(l => JSON.stringify(l)).join('\n') + '\n');
  console.log(`런로그: ${RUNLOG}`);
}
console.log(DRY ? '--dry: 파일 미변경' : '완료');
