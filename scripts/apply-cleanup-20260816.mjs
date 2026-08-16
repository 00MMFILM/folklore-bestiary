#!/usr/bin/env node
// ============================================================
// 2026-08-16 데이터 정리 — 게이트 회귀(gate-regression.json)에서
// 전문 검토해 '비생물'로 확정한 69종 삭제. 진짜 존재 21종은 유지.
// 런로그: scripts/runlogs/cleanup-20260816.jsonl (영구, 액션당 1줄)
// 사용법: node scripts/apply-cleanup-20260816.mjs [--apply]  (기본 드라이런)
// ============================================================

import fs from 'fs';
import path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');

// ── 삭제 확정 69종 (비생물) ──
const DELETE_IDS = [
  // 서적·간행물 (15)
  'jp-the-allies-fairy-book', 'my-alluring-monsters', 'bd-puthi', 'il-legends-of-the-jews',
  'fr-on-the-demonomania-of-the-sorcerers', 'de-deutsche-sagen', 'de-deutsche-mythologie',
  'wls-british-goblins', 'gr-all-things-are-full-of-gods', 'gr-damian-and-the-dragon-modern-greek-folk-tales',
  'it-de-daemonialitate-et-incubis-et-succubis', 'it-iron-john-a-book-about-men', 'us-the-inland-whale',
  'au-the-giant-devil-dingo', 'ws-norse-gods-and-giants', 'ee-monumenta-estoniae-antiquae',
  // 장소·도시·섬·동굴·유령마을 (22)
  'kr-asadal', 'jp-biringan', 'cn-kalapa', 'th-kham-chanot', 'in-himavanta',
  'gb-astolat', 'gb-camelot', 'ie-isle-of-the-dead-mythology', 'ru-antillia', 'ru-brittia',
  'es-el-dorado', 'lt-anapilis', 'us-bell-witch-cave', 'us-daniels-maryland',
  'mx-cerro-colorado-arizona', 'mx-alamocita-new-mexico', 'mx-balankanche',
  'cl-piedra-santa', 'cl-cueva-del-pirata', 'ee-ukko-island', 'il-andromeda-s-rock', 'is-husafell-stone',
  // 의례·축제·무용·관습·practice (8)
  'kr-igong-maji', 'kr-jeju-chilmeoridang-yeongdeunggut', 'jp-chinkon-kishin', 'cn-egg-balancing',
  'my-ulek-mayang', 'gr-bendidia', 'pe-inti-raymi', 'lt-interpretatio-slavica',
  // 개념·현상·용어·kenning (11)
  'kr-gawp', 'jp-kitsune-no-yomeiri', 'cn-chronomancy', 'gb-wyrd', 'fi-metsanpeitto',
  'it-axis-mundi', 'pe-pacha-inca-mythology', 'pe-paqarina', 'au-anzac-spirit', 'nz-alfro-ull', 'ws-fagogo',
  // 명명 무기 (5)
  'jp-ame-no-ohabari', 'gb-cortain', 'ie-caladbolg', 'fr-durendal', 'ru-sword-kladenets',
  // 실존인물·사건 (2)
  'ie-murder-of-mary-gallagher', /* Si Pitung은 유지 */
  // 사물·용어(신 아님) (3): 부적/일반명사 god·shaman
  'id-agimat', 'id-dukun', 'sa-ilah', 'it-deus',
  // 조형물 (1)
  'in-parkham-yaksha',
  // 비설화(현대 로봇공학) (1)
  'lv-necrobotics',
];

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
const slugOf = (id) => id.replace(/^[a-z]{2,3}-/, '');

let content = fs.readFileSync(DATA_PATH, 'utf8');
const dataRange = findRange(content, 'export const FOLKLORE_DATA: CountryData[] = ', '[', ']');
const data = JSON.parse(content.substring(dataRange.s, dataRange.e));
const imgRange = findRange(content, 'export const CREATURE_IMAGE_MAP: Record<string, string> = ', '{', '}');
const imageMap = JSON.parse(content.substring(imgRange.s, imgRange.e));

const byId = new Map();
for (const co of data) for (const b of co.b) byId.set(b.id, { b, co });

// ── 사전 검증: 중복 없고 전부 실재 ──
const dupe = DELETE_IDS.filter((id, i) => DELETE_IDS.indexOf(id) !== i);
if (dupe.length) { console.error(`❌ 목록 중복: ${dupe.join(', ')}`); process.exit(1); }
const missing = DELETE_IDS.filter(id => !byId.has(id));
if (missing.length) { console.error(`❌ 대상 부재 ${missing.length}건 — 중단:\n${missing.join('\n')}`); process.exit(1); }

const before = data.reduce((s, c) => s + c.b.length, 0);
const runlog = [];
const idMap = {};
const log = (action, detail) => runlog.push({ ts: new Date().toISOString(), action, ...detail });

// ── 삭제 ──
for (const id of DELETE_IDS) {
  const { b, co } = byId.get(id);
  co.b.splice(co.b.indexOf(b), 1);
  idMap[id] = null;
  log('delete', { id, name: b.n, iso: co.i, type: b.t, reason: 'non-creature (승인 2026-08-16)' });
}

// ── 이미지 정리 (삭제분, 슬러그 공유 시 보존) ──
const liveSlugs = new Set();
for (const co of data) for (const b of co.b) liveSlugs.add(slugOf(b.id));
const imageDeletes = [];
for (const id of DELETE_IDS) {
  const slug = slugOf(id);
  if (liveSlugs.has(slug)) continue;
  if (imageMap[slug]) {
    const file = imageMap[slug];
    imageDeletes.push({ slug, file });
    delete imageMap[slug];
    log('image-delete', { slug, file, path: `public${file}` });
  }
}

const after = data.reduce((s, c) => s + c.b.length, 0);
console.log(`대상 검증 통과. ${before} → ${after}마리 (삭제 ${before - after} / 이미지 ${imageDeletes.length})`);

if (!APPLY) { console.log('\n(드라이런 — 반영하려면 --apply)'); process.exit(0); }

// ── 저장: folklore-data.ts (위치 역순 치환) ──
const ranges = [
  { ...dataRange, json: JSON.stringify(data) },
  { ...imgRange, json: JSON.stringify(imageMap) },
].sort((a, b) => b.s - a.s);
for (const r of ranges) content = content.substring(0, r.s) + r.json + content.substring(r.e);
fs.writeFileSync(DATA_PATH, content, 'utf8');

// site-stats.ts 갱신 (크롤러 saveSiteStats와 동일 포맷)
fs.writeFileSync(path.join(ROOT, 'lib', 'site-stats.ts'),
  `// 자동 생성 파일 — scripts/crawl-wikipedia-folklore.mjs가 갱신. 직접 수정 금지.\nexport const CREATURE_COUNT = ${after};\nexport const COUNTRY_COUNT = ${data.length};\n`);

// ── 파생 파일 키 삭제 ──
function dropKeys(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let n = 0;
  for (const id of DELETE_IDS) if (id in obj) { delete obj[id]; n++; }
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 0));
  return n;
}
for (const loc of ['ko', 'zh', 'ja']) {
  console.log(`   i18n(${loc}) 키 삭제: ${dropKeys(path.join(ROOT, `public/i18n/creatures-${loc}.json`))}`);
}
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
for (const { file } of imageDeletes) {
  const p = path.join(ROOT, 'public', file);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(`   이미지 파일 삭제: ${file}`); }
}
for (const id of DELETE_IDS) {
  const p = path.join(ROOT, 'content/articles', `${id}.json`);
  if (fs.existsSync(p)) { fs.unlinkSync(p); log('article-delete', { id }); console.log(`   아티클 삭제: ${id}.json`); }
}

const logDir = path.join(ROOT, 'scripts/runlogs');
fs.mkdirSync(logDir, { recursive: true });
fs.appendFileSync(path.join(logDir, 'cleanup-20260816.jsonl'), runlog.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`\n✅ 적용 완료. 런로그: scripts/runlogs/cleanup-20260816.jsonl (${runlog.length}줄)`);
