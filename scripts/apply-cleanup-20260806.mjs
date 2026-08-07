#!/usr/bin/env node
// ============================================================
// 2026-08-06 데이터 정리 적용 — 대표 승인분 (삭제 25 · 이동 6 · 병합 1)
// 근거: noncreature-report.json + misattribution-report.json(--deep) + dup-report.json
// 런로그: scripts/runlogs/cleanup-20260806.jsonl (영구, 액션당 1줄)
// 사용법: node scripts/apply-cleanup-20260806.mjs [--apply]  (기본 드라이런)
// ============================================================

import fs from 'fs';
import path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');

// ── 승인된 작업 목록 ──
const DELETE_IDS = [
  // 서적
  'cn-miscellaneous-morsels-from-youyang', 'gb-arthurian-literature-book-series',
  'ca-bluenose-ghosts', 'jm-jamaica-anansi-stories', 'py-ayvu-rapyta',
  // 장소
  'kr-kiringul', 'in-ayodhya-ramayana', 'gr-mount-zas', 'lt-sventaragis-valley',
  'no-jarnvi-r', 'ru-blockula', 'si-heathen-maiden',
  // 풍습·의례·개념
  'jp-devil-s-sword-dance', 'jp-inau', 'cn-chinese-spirit-possession',
  'in-durga-puja-in-west-bengal', 'in-devakkoothu', 'ru-wawel-chakra',
  // 실존 인물
  'ng-ofinran', 'in-sakanoue-no-tamuramaro',
  // 사물·용어
  'ie-bullaun', 'gr-baetyl', 'ru-alatyr-mythology', 'il-qippoz', 'gb-lake-monster',
];
const MOVES = [
  { id: 'us-afanc', to: 'WLS' },
  { id: 'us-apu-god', to: 'PE' },
  { id: 'nz-abraxas', to: 'EG' },
  { id: 'ie-fenodyree', to: 'GB' },
  { id: 'ie-bedivere', to: 'GB' },
  { id: 'in-thanh-giong', to: 'VN' },
];
// 병합: IN의 Brahmā (Buddhism) ↔ Brahma — 설명 긴 쪽 유지
const MERGE = { iso: 'IN', names: ['Brahmā (Buddhism)', 'Brahma'] };

// ── 데이터 파싱 유틸 ──
function findRange(content, marker, open, close) {
  const s = content.indexOf(marker) + marker.length;
  let depth = 0, e = s, inStr = false, esc = false;
  for (let i = s; i < content.length; i++) {
    const ch = content[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === open) depth++;
    if (ch === close) { depth--; if (depth === 0) { e = i + 1; break; } }
  }
  return { s, e };
}
const coreName = (name) => (name || '')
  .replace(/\s*\(.*?\)\s*/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();
const slugOf = (id) => id.replace(/^[a-z]{2,3}-/, '');

let content = fs.readFileSync(DATA_PATH, 'utf8');
const dataRange = findRange(content, 'export const FOLKLORE_DATA: CountryData[] = ', '[', ']');
const data = JSON.parse(content.substring(dataRange.s, dataRange.e));
const imgRange = findRange(content, 'export const CREATURE_IMAGE_MAP: Record<string, string> = ', '{', '}');
const imageMap = JSON.parse(content.substring(imgRange.s, imgRange.e));

const byId = new Map();
for (const co of data) for (const b of co.b) byId.set(b.id, { b, co });
const isoMap = new Map(data.map(c => [c.i, c]));

// ── 사전 검증: 대상 전부 실재해야 진행 ──
const missing = [...DELETE_IDS, ...MOVES.map(m => m.id)].filter(id => !byId.has(id));
if (missing.length) {
  console.error(`❌ 대상 부재 ${missing.length}건 — 중단:\n${missing.join('\n')}`);
  process.exit(1);
}
for (const mv of MOVES) if (!isoMap.has(mv.to)) { console.error(`❌ 대상 국가 없음: ${mv.to}`); process.exit(1); }

const before = data.reduce((s, c) => s + c.b.length, 0);
const runlog = [];
const idMap = {}; // oldId → newId|null (파생 파일 키 갱신용)
const log = (action, detail) => runlog.push({ ts: new Date().toISOString(), action, ...detail });

// ── 1) 삭제 ──
for (const id of DELETE_IDS) {
  const { b, co } = byId.get(id);
  co.b.splice(co.b.indexOf(b), 1);
  idMap[id] = null;
  log('delete', { id, name: b.n, iso: co.i, reason: 'non-creature (승인 2026-08-06)' });
}

// ── 2) 이동 ──
for (const mv of MOVES) {
  const { b, co } = byId.get(mv.id);
  const target = isoMap.get(mv.to);
  co.b.splice(co.b.indexOf(b), 1);
  if (target.b.some(x => coreName(x.n) === coreName(b.n))) {
    idMap[mv.id] = null;
    log('move-dropped-dup', { id: mv.id, name: b.n, from: co.i, to: mv.to });
    continue;
  }
  const newId = `${mv.to.toLowerCase()}-${slugOf(mv.id)}`;
  idMap[mv.id] = newId;
  b.id = newId;
  target.b.push(b);
  log('move', { id: mv.id, newId, name: b.n, from: co.i, to: mv.to });
}

// ── 3) 병합 ──
{
  const co = isoMap.get(MERGE.iso);
  const pair = MERGE.names.map(n => co.b.find(x => x.n === n)).filter(Boolean);
  if (pair.length === 2) {
    const drop = (pair[0].d || '').length >= (pair[1].d || '').length ? pair[1] : pair[0];
    co.b.splice(co.b.indexOf(drop), 1);
    idMap[drop.id] = null;
    log('merge-drop', { id: drop.id, name: drop.n, iso: MERGE.iso, kept: (drop === pair[0] ? pair[1] : pair[0]).id });
  } else {
    console.log(`⚠️ 병합 쌍 미발견 (${pair.length}/2) — 건너뜀`);
  }
}

// ── 4) 이미지 정리 (삭제분만, 슬러그 공유 시 보존) ──
const liveSlugsAfter = new Set();
for (const co of data) for (const b of co.b) liveSlugsAfter.add(slugOf(b.id));
const imageDeletes = [];
for (const [oldId, newId] of Object.entries(idMap)) {
  if (newId !== null) continue; // 이동은 슬러그 불변 → 이미지 유지
  const slug = slugOf(oldId);
  if (liveSlugsAfter.has(slug)) continue; // 다른 생물이 같은 슬러그 사용 → 보존
  if (imageMap[slug]) {
    const file = imageMap[slug];
    imageDeletes.push({ slug, file });
    delete imageMap[slug];
    log('image-delete', { slug, file, path: `public${file}` });
  }
}

// ── 요약 ──
const after = data.reduce((s, c) => s + c.b.length, 0);
console.log(`대상 검증 통과. ${before} → ${after}마리 (${before - after} 감소)`);
console.log(`  삭제 ${runlog.filter(r => r.action === 'delete').length} / 이동 ${runlog.filter(r => r.action === 'move').length} / 이동중복제거 ${runlog.filter(r => r.action === 'move-dropped-dup').length} / 병합 ${runlog.filter(r => r.action === 'merge-drop').length} / 이미지 ${imageDeletes.length}`);

if (!APPLY) { console.log('\n(드라이런 — 반영하려면 --apply)'); process.exit(0); }

// ── 저장: folklore-data.ts (FOLKLORE_DATA + CREATURE_IMAGE_MAP, 위치 역순으로 치환) ──
const ranges = [
  { ...dataRange, json: JSON.stringify(data) },
  { ...imgRange, json: JSON.stringify(imageMap) },
].sort((a, b) => b.s - a.s);
for (const r of ranges) content = content.substring(0, r.s) + r.json + content.substring(r.e);
fs.writeFileSync(DATA_PATH, content, 'utf8');

// ── 파생 파일 키 갱신 (i18n 3종 + 이미지 진행) ──
function renameKeys(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let touched = 0;
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (!(oldId in obj)) continue;
    if (newId) obj[newId] = obj[oldId];
    delete obj[oldId];
    touched++;
  }
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 0));
  return touched;
}
for (const loc of ['ko', 'zh', 'ja']) {
  const n = renameKeys(path.join(ROOT, `public/i18n/creatures-${loc}.json`));
  console.log(`   i18n(${loc}) 키 갱신: ${n}`);
}
console.log(`   image-gen-progress 키 갱신: ${renameKeys(path.join(ROOT, 'scripts/image-gen-progress.json'))}`);

// public/creatures/image-map.json (슬러그 키)
{
  const p = path.join(ROOT, 'public/creatures/image-map.json');
  if (fs.existsSync(p)) {
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    let n = 0;
    for (const { slug } of imageDeletes) if (slug in m) { delete m[slug]; n++; }
    fs.writeFileSync(p, JSON.stringify(m, null, 2));
    console.log(`   image-map.json 키 삭제: ${n}`);
  }
}

// 이미지 파일·아티클 파일 삭제
for (const { file } of imageDeletes) {
  const p = path.join(ROOT, 'public', file);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(`   이미지 파일 삭제: ${file}`); }
}
for (const [oldId, newId] of Object.entries(idMap)) {
  if (newId !== null) continue;
  const p = path.join(ROOT, 'content/articles', `${oldId}.json`);
  if (fs.existsSync(p)) { fs.unlinkSync(p); log('article-delete', { id: oldId }); console.log(`   아티클 삭제: ${oldId}.json`); }
}

// ── 런로그 저장 (영구 JSONL, append) ──
const logDir = path.join(ROOT, 'scripts/runlogs');
fs.mkdirSync(logDir, { recursive: true });
fs.appendFileSync(path.join(logDir, 'cleanup-20260806.jsonl'), runlog.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`\n✅ 적용 완료. 런로그: scripts/runlogs/cleanup-20260806.jsonl (${runlog.length}줄)`);
console.log('다음: node scripts/build-tale-links.mjs 재실행 + next build 검증');
