#!/usr/bin/env node
// ============================================================
// 이야기 항목 유형 재분류 → t=Folktale
//
// 크롤러가 설화·민담·동화 '작품 자체'를 생물 유형으로 등록해왔다.
// 예: 목도령(구전설화)=Fairy, 여우 누이(민담)=Demon,
//     그림 형제 「영리한 엘제」=Fairy.
// 도감에는 이미 Folktale 유형이 있으므로 삭제가 아니라 라벨을 고친다.
//
// 판정 근거: scratchpad의 A-verdict.json / B-verdict.json (Sonnet 전수 판정)
// 단, 존재 이름이기도 한 애매 3건은 감독 검토로 제외했다:
//   iq-labbu(뱀 괴물 이름), co-el-hombre-caim-n(악어인간),
//   cl-legend-of-trentren-vilu-and-caicai-vilu(마푸체 두 뱀신)
//
// 사용법: node scripts/apply-folktale-reclass.mjs [--dry]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SP = '/private/tmp/claude-501/-Users-leechangyeop/e91821c5-edff-4c4f-9203-2b1bb3b104d6/scratchpad';
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', (process.argv.indexOf('--log') > -1 ? process.argv[process.argv.indexOf('--log') + 1] : 'folktale-reclass-20260824.jsonl'));
const DRY = process.argv.includes('--dry');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

// 존재 이름이기도 해서 재분류에서 뺀 항목
const EXCLUDE = new Set([
  'iq-labbu',
  'co-el-hombre-caim-n',
  'cl-legend-of-trentren-vilu-and-caicai-vilu',
]);

const ids = new Set();
const argOf2 = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const SOURCES = argOf2('--from')
  ? argOf2('--from').split(',').map(x => { const [f, w] = x.split(':'); return [f, w]; })
  : [['A-verdict.json', 'folktale'], ['B-verdict.json', 'reclass']];
for (const [file, want] of SOURCES) {
  const p = path.join(SP, file);
  if (!fs.existsSync(p)) throw new Error('판정 파일 없음: ' + p);
  for (const v of JSON.parse(fs.readFileSync(p, 'utf8'))) {
    if (v.verdict === want && !EXCLUDE.has(v.id)) ids.add(v.id);
  }
}
console.log(`재분류 대상: ${ids.size}건 (제외 ${EXCLUDE.size}건)`);

const src = fs.readFileSync(DATA_PATH, 'utf8');
const idx = src.indexOf(MARKER);
const start = idx + MARKER.length;
let end = src.indexOf('\n', start);
if (end < 0) end = src.length;
let body = src.slice(start, end).trim();
if (body.endsWith(';')) body = body.slice(0, -1);
const data = JSON.parse(body);

const changed = [];
let already = 0;
for (const country of data) {
  for (const c of country.b) {
    if (!ids.has(c.id)) continue;
    if (c.t === 'Folktale') { already++; continue; }
    changed.push({ id: c.id, n: c.n, from: c.t, to: 'Folktale', iso: country.i });
    if (!DRY) c.t = 'Folktale';
  }
}
const notFound = ids.size - changed.length - already;
console.log(`변경: ${changed.length}건 / 이미 Folktale: ${already}건 / 데이터에 없음: ${notFound}건`);

const dist = {};
changed.forEach(c => (dist[c.from] = (dist[c.from] || 0) + 1));
console.log('기존 유형 분포:', JSON.stringify(dist));
changed.slice(0, 5).forEach(c => console.log(`  [${c.iso}] ${c.n}: ${c.from} → Folktale`));

if (DRY) { console.log('--dry: 파일 미변경'); process.exit(0); }
if (!changed.length) { console.log('변경 없음'); process.exit(0); }

fs.writeFileSync(DATA_PATH, src.slice(0, start) + JSON.stringify(data) + ';' + src.slice(end));
fs.mkdirSync(path.dirname(RUNLOG), { recursive: true });
const ts = new Date().toISOString();
fs.writeFileSync(RUNLOG, changed.map(c => JSON.stringify({ ...c, ts })).join('\n') + '\n');
console.log(`완료. 런로그: ${RUNLOG}`);
