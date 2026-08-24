#!/usr/bin/env node
// ============================================================
// 이미지맵 고아 키 정리
//
// 종이 삭제돼도 CREATURE_IMAGE_MAP 항목이 남아 고아 키가 쌓였다.
// getCreatureImage()는 3글자벗김 → 2글자벗김 → 원본id 순으로 찾으므로
// 세 형태 중 하나라도 살아있는 종이 쓰면 그 키는 살아있는 키다.
//
// 파일 처리 방침: **이미지 파일은 지우지 않는다.**
// 이미지는 크레딧을 들여 생성한 자산이고, 고아 파일 총량은 2MB에
// 불과하다. quetzalcoatl·mahakala 같은 유명 존재는 앞으로 크롤로
// 다시 들어올 수 있고, 그때 파일이 남아 있으면 맵에 등록만 하면 된다.
// 지우면 재생성에 다시 크레딧이 든다. 맵 키만 정리한다.
//
// 사용법: node scripts/cleanup-image-map-final.mjs [--dry]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', 'image-map-cleanup-20260824.jsonl');
const DRY = process.argv.includes('--dry');
const IMG_MARKER = 'export const CREATURE_IMAGE_MAP: Record<string, string> = ';
const DATA_MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

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
const imgS = sliceOf(IMG_MARKER);
const IMG = imgS.value;
const data = sliceOf(DATA_MARKER).value;

const all = [];
for (const c of data) for (const b of c.b) all.push(b);

// 폴백 체인이 실제로 사용하는 키만 살아있다
const used = new Set();
for (const c of all) {
  const id = c.id;
  if (!id.includes('-')) { if (IMG[id]) used.add(id); continue; }
  for (const k of [id.replace(/^[a-z]{2,3}-/, ''), id.replace(/^[a-z]{2}-/, ''), id]) {
    if (IMG[k]) { used.add(k); break; }
  }
}

const usedPaths = new Set([...used].map(k => IMG[k]));
const removed = [];
for (const k of Object.keys(IMG)) {
  if (used.has(k)) continue;
  const p = IMG[k];
  const fileExists = fs.existsSync(path.join(ROOT, 'public', p));
  const reason = !fileExists ? 'broken-link'
    : usedPaths.has(p) ? 'duplicate-alias'
    : 'orphan-file-kept';
  removed.push({ key: k, path: p, reason, fileKept: fileExists });
  if (!DRY) delete IMG[k];
}

const byReason = {};
removed.forEach(r => (byReason[r.reason] = (byReason[r.reason] || 0) + 1));
console.log(`종 ${all.length} / 맵 ${Object.keys(imgS.value).length + (DRY ? 0 : removed.length)} → 사용중 ${used.size}`);
console.log(`제거할 고아 키: ${removed.length}건`, JSON.stringify(byReason));
console.log('  broken-link      = 가리키는 파일이 없음');
console.log('  duplicate-alias  = 같은 파일을 살아있는 다른 키가 참조 중');
console.log('  orphan-file-kept = 참조하는 종이 없음 (파일은 자산으로 보존)');

if (DRY) { console.log('--dry: 파일 미변경'); process.exit(0); }
if (!removed.length) { console.log('정리할 것 없음'); process.exit(0); }

fs.writeFileSync(DATA_PATH, src.slice(0, imgS.start) + JSON.stringify(IMG) + ';' + src.slice(imgS.end));
fs.mkdirSync(path.dirname(RUNLOG), { recursive: true });
const ts = new Date().toISOString();
fs.writeFileSync(RUNLOG, removed.map(r => JSON.stringify({ act: 'remove-imagemap-key', ...r, ts })).join('\n') + '\n');
console.log(`완료. 맵 항목 ${Object.keys(IMG).length}건. 런로그: ${RUNLOG}`);
