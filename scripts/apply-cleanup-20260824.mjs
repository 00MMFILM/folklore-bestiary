#!/usr/bin/env node
// ============================================================
// 비생물 33종 삭제 (2026-08-24)
//
// 생물 도감에 들어와선 안 되는 항목들이다:
//   각국 folklore/religion 개론 문서, 장르 총론(본풀이·일본 도시전설 등),
//   서적·선집(고금소총, 오스카 와일드 동화집, 1935년 민속 채록집 …),
//   현대 창작 작품(1921년 희곡 「골렘」, 오페라 「Koroghlu」 …),
//   기관(에스토니아 민속 기록보관소), 관념(Grandfather Ivan).
//
// 판정: 크롤 게이트 역적용 49건 + 이야기 후보 297건을 전수 검토해 확정.
// 2026-08-16에 "진짜 존재"로 결론난 21종은 한 건도 포함되지 않았음을
// 교차 확인했다.
//
// 파생물까지 함께 정리한다 — 8월 정리 때 이미지·맵 잔여물이 남아
// 고아 항목이 쌓였던 전례가 있다.
//   정본 / 이미지맵+이미지파일 / i18n 3종 / 아티클
//
// 사용법: node scripts/apply-cleanup-20260824.mjs [--dry]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SP = '/private/tmp/claude-501/-Users-leechangyeop/e91821c5-edff-4c4f-9203-2b1bb3b104d6/scratchpad';
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const DRY = process.argv.includes('--dry');
// 2차 이후 실행분은 목록·런로그를 따로 지정한다 (1차 런로그를 덮어쓰지 않게)
const argOf = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const IDS_FILE = argOf('--ids') || 'delete-ids.json';
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', argOf('--log') || 'cleanup-20260824.jsonl');

const DATA_MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';
const IMG_MARKER = 'export const CREATURE_IMAGE_MAP: Record<string, string> = ';

const targets = new Set(JSON.parse(fs.readFileSync(path.join(SP, IDS_FILE), 'utf8')));
console.log(`삭제 대상: ${targets.size}종`);

// ── 정본 로드 (마커별로 그 줄만 교체한다) ──
const src = fs.readFileSync(DATA_PATH, 'utf8');
function sliceOf(marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('마커 없음: ' + marker);
  const start = i + marker.length;
  let end = src.indexOf('\n', start);
  if (end < 0) end = src.length;
  let body = src.slice(start, end).trim();
  if (body.endsWith(';')) body = body.slice(0, -1);
  return { start, end, value: JSON.parse(body) };
}
const dataSlice = sliceOf(DATA_MARKER);
const imgSlice = sliceOf(IMG_MARKER);
const data = dataSlice.value;
const IMG = imgSlice.value;

// ── 1. 정본에서 종 제거 ──
const removed = [];
for (const country of data) {
  const before = country.b.length;
  country.b = country.b.filter(c => {
    if (!targets.has(c.id)) return true;
    removed.push({ id: c.id, n: c.n, t: c.t, iso: country.i, country: country.c });
    return false;
  });
  if (country.b.length !== before) { /* 국가는 비어도 유지 */ }
}
console.log(`정본에서 제거: ${removed.length}종`);
const missing = [...targets].filter(id => !removed.some(r => r.id === id));
if (missing.length) console.log(`  데이터에 없던 id: ${missing.length}건 — ${missing.join(', ')}`);

// ── 2. 이미지맵 키 + 이미지 파일 ──
// getCreatureImage는 3글자벗김 → 2글자벗김 → 원본id 순으로 찾는다. 세 형태 모두 확인.
const keyForms = id => [id.replace(/^[a-z]{2,3}-/, ''), id.replace(/^[a-z]{2}-/, ''), id];
const survivingKeys = new Set();
for (const country of data) for (const c of country.b) keyForms(c.id).forEach(k => survivingKeys.add(k));

const imgRemoved = [], fileRemoved = [];
let bytes = 0;
for (const r of removed) {
  for (const k of new Set(keyForms(r.id))) {
    if (!(k in IMG)) continue;
    if (survivingKeys.has(k)) continue;          // 살아있는 다른 종이 같은 키를 쓴다
    const p = IMG[k];
    imgRemoved.push({ id: r.id, key: k, path: p });
    delete IMG[k];
    const abs = path.join(ROOT, 'public', p);
    // 다른 키가 같은 파일을 가리키면 파일은 남긴다
    const stillUsed = Object.values(IMG).includes(p);
    if (!stillUsed && fs.existsSync(abs)) {
      bytes += fs.statSync(abs).size;
      fileRemoved.push(abs);
      if (!DRY) fs.unlinkSync(abs);
    }
  }
}
console.log(`이미지맵 키 제거: ${imgRemoved.length}건 / 이미지 파일 삭제: ${fileRemoved.length}개 (${(bytes/1024).toFixed(1)} KB)`);

// ── 3. i18n ──
const i18nStats = {};
for (const lg of ['ko', 'zh', 'ja']) {
  const p = path.join(ROOT, 'public', 'i18n', `creatures-${lg}.json`);
  if (!fs.existsSync(p)) continue;
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const r of removed) if (t[r.id]) { delete t[r.id]; n++; }
  i18nStats[lg] = n;
  if (!DRY && n) fs.writeFileSync(p, JSON.stringify(t, null, 0));
}
console.log('i18n 제거:', JSON.stringify(i18nStats));

// ── 4. 아티클 ──
const artDir = path.join(ROOT, 'content', 'articles');
const artRemoved = [];
if (fs.existsSync(artDir)) {
  for (const r of removed) {
    const p = path.join(artDir, r.id + '.json');
    if (!fs.existsSync(p)) continue;
    artRemoved.push(p);
    if (!DRY) fs.unlinkSync(p);
  }
}
console.log(`아티클 제거: ${artRemoved.length}건`);

console.log('\n--- 삭제 종 목록 ---');
removed.forEach(r => console.log(`  [${r.iso}] ${r.n} (${r.t})`));

if (DRY) { console.log('\n--dry: 파일 미변경'); process.exit(0); }

// ── 기록 ──
let out = src.slice(0, dataSlice.start) + JSON.stringify(data) + ';' + src.slice(dataSlice.end);
// 이미지맵 줄은 정본 줄보다 앞에 있다 — 오프셋이 밀리지 않게 다시 계산한다
const i2 = out.indexOf(IMG_MARKER);
const s2 = i2 + IMG_MARKER.length;
let e2 = out.indexOf('\n', s2);
if (e2 < 0) e2 = out.length;
out = out.slice(0, s2) + JSON.stringify(IMG) + ';' + out.slice(e2);
fs.writeFileSync(DATA_PATH, out);

fs.mkdirSync(path.dirname(RUNLOG), { recursive: true });
const ts = new Date().toISOString();
const logs = [
  ...removed.map(r => ({ act: 'remove-creature', ...r, ts })),
  ...imgRemoved.map(r => ({ act: 'remove-imagemap', ...r, ts })),
  ...fileRemoved.map(f => ({ act: 'delete-file', path: f.replace(ROOT, ''), ts })),
  ...artRemoved.map(f => ({ act: 'delete-article', path: f.replace(ROOT, ''), ts })),
];
fs.writeFileSync(RUNLOG, logs.map(l => JSON.stringify(l)).join('\n') + '\n');
console.log(`\n완료. 런로그: ${RUNLOG}`);
