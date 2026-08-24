#!/usr/bin/env node
// ============================================================
// 2026-08 비생물 94종 삭제 후 방치된 CREATURE_IMAGE_MAP 잔여물 정리.
// - 고아 맵 항목(대응 종 없음) 제거 + 파일 삭제
// - 깨진 맵 항목(파일 없음) 제거
// - 맵에 없는 파일 중 실제 살아있는 종에 연결 가능한 것만 등록
//   (키 충돌 등 애매한 경우는 등록하지 않고 로그만 남김 — 임의 결정 금지)
// 런로그: scripts/runlogs/image-map-cleanup-20260824.jsonl (영구, 액션당 1줄)
// 사용법: node scripts/cleanup-image-map.mjs [--dry]  (기본은 실제 적용)
// ============================================================

import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync, appendFileSync, mkdirSync } from "fs";
import { resolve, dirname, join, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_PATH = resolve(ROOT, "lib/folklore-data.ts");
const PUBLIC_DIR = resolve(ROOT, "public");
const CREATURES_DIR = resolve(PUBLIC_DIR, "creatures");
const RUNLOG_PATH = resolve(ROOT, "scripts/runlogs/image-map-cleanup-20260824.jsonl");

const DRY = process.argv.includes("--dry");

function extractBalanced(src, marker, open, close) {
  const start = src.indexOf(marker) + marker.length;
  let depth = 0, end = start, inStr = false, esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === open) depth++;
    if (ch === close) { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return { value: JSON.parse(src.substring(start, end)), start, end };
}

const src = readFileSync(DATA_PATH, "utf-8");
const MAP_MARKER = "export const CREATURE_IMAGE_MAP: Record<string, string> = ";
const map = extractBalanced(src, MAP_MARKER, "{", "}");
const DATA_MARKER = "export const FOLKLORE_DATA: CountryData[] = ";
const data = extractBalanced(src, DATA_MARKER, "[", "]");

const allCreatures = [];
for (const country of data.value) for (const c of country.b) allCreatures.push(c);

// getCreatureImage()의 실제 조회 규칙 (2글자 접두사만 제거) — 등록 시 사용
const shortId = (id) => (id.includes("-") ? id.replace(/^[a-z]{2}-/, "") : id);

// "종이 데이터에 존재하는가"를 판단하는 기준: 첫 하이픈 세그먼트(국가 코드, 2~3글자 모두 포함)만
// 제거한 진짜 베이스 슬러그. getCreatureImage()는 2글자 접두사만 벗기는 버그가 있어(wls-, sct- 등
// 3글자 국가코드 종은 이미지가 안 뜨는 별개 문제) 이 값과 다를 수 있지만, "종이 존재하는지"는
// 이 기준으로 판단해야 한다 — 그렇지 않으면 실존 종(wls-arawn 등 48건)의 이미지까지 잘못 삭제한다.
const trueBaseSlug = (id) => (id.includes("-") ? id.slice(id.indexOf("-") + 1) : id);
const liveBaseSlugs = new Set(allCreatures.map((c) => trueBaseSlug(c.id)));

const liveByRealFn = new Set(allCreatures.map((c) => shortId(c.id)));

const imageMap = { ...map.value };
const removed = [];
const added = [];
const skipped = [];
const preserved = []; // 실존 종이지만 이 키가 유일한 이미지 연결고리 — 절대 건드리지 않음

// 1) 고아 + 깨진 + 중복 항목 제거 (실존 종의 유일한 연결고리는 보존)
for (const [key, relPath] of Object.entries(map.value)) {
  if (liveByRealFn.has(key)) continue; // getCreatureImage()가 실제로 도달하는 키 — 유지

  const filePath = join(PUBLIC_DIR, relPath.replace(/^\//, ""));
  const fileExists = existsSync(filePath);
  const matches = allCreatures.filter((c) => trueBaseSlug(c.id) === key);

  if (matches.length === 0) {
    // 대응 종이 데이터 어디에도 없음 — 진짜 고아
    delete imageMap[key];
    removed.push({ key, path: relPath, reason: fileExists ? "orphan-no-creature" : "broken-no-file", fileDeleted: fileExists, filePath });
    continue;
  }

  // 종은 실존하지만 키가 getCreatureImage()의 2글자 접두사 규칙과 안 맞음(wls-/sct- 등 3글자 국가코드).
  // 같은 파일을 가리키는, 실제로 동작하는 키(cc-slug 형태)가 이미 따로 있으면 이 키는 중복 별칭이므로
  // 제거해도 무방(파일은 그 키가 계속 참조하므로 삭제하지 않음). 없으면 유일한 연결고리이므로 보존.
  const dupKey = matches.map((c) => shortId(c.id)).find((sid) => sid !== key && map.value[sid] === relPath);
  if (dupKey) {
    delete imageMap[key];
    removed.push({ key, path: relPath, reason: "redundant-duplicate-key", fileDeleted: false, dupKey });
  } else {
    preserved.push({ key, path: relPath, liveCreatureIds: matches.map((c) => c.id) });
  }
}

// 2) 맵에 등록되지 않은 파일 스캔 → 연결 가능한 것만 등록
function walkWebp(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkWebp(full));
    else if (extname(entry) === ".webp") out.push(full);
  }
  return out;
}

const mappedValues = new Set(Object.values(map.value)); // 원본 맵 기준 (제거 전)
const allFiles = walkWebp(CREATURES_DIR);
for (const absPath of allFiles) {
  const relPath = "/" + absPath.slice(PUBLIC_DIR.length + 1).split("\\").join("/");
  if (mappedValues.has(relPath)) continue; // 이미 어떤 항목의 값으로 등록됨

  const slug = basename(absPath, ".webp");
  const matchingCreatures = allCreatures.filter((c) => shortId(c.id) === slug);

  if (matchingCreatures.length === 0) {
    skipped.push({ path: relPath, slug, reason: "no-live-creature-match" });
    continue;
  }
  if (Object.prototype.hasOwnProperty.call(map.value, slug)) {
    skipped.push({
      path: relPath,
      slug,
      reason: "key-collision",
      existingPath: map.value[slug],
      liveCreatureIds: matchingCreatures.map((c) => c.id),
    });
    continue;
  }

  imageMap[slug] = relPath;
  added.push({ key: slug, path: relPath, liveCreatureIds: matchingCreatures.map((c) => c.id) });
}

// ── 로그 출력 ──
console.log(`제거 예정 맵 항목: ${removed.length}건 (파일 삭제 대상: ${removed.filter((r) => r.fileDeleted).length}건)`);
console.log(`  - 진짜 고아(파일 있음): ${removed.filter((r) => r.reason === "orphan-no-creature").length}건`);
console.log(`  - 깨진 링크(파일 없음): ${removed.filter((r) => r.reason === "broken-no-file").length}건`);
console.log(`  - 중복 별칭(실존 종, 동작하는 키가 따로 있음): ${removed.filter((r) => r.reason === "redundant-duplicate-key").length}건`);
console.log(`추가 예정 맵 항목: ${added.length}건`);
console.log(`건너뜀(연결 불가/충돌): ${skipped.length}건`);
console.log(`보존(실존 종의 유일한 이미지 연결고리 — 손대지 않음): ${preserved.length}건`);
const totalBytes = removed
  .filter((r) => r.fileDeleted)
  .reduce((sum, r) => sum + statSync(r.filePath).size, 0);
console.log(`회수 예정 디스크 용량: ${(totalBytes / 1024).toFixed(1)} KB`);

if (skipped.length > 0) {
  console.log("\n건너뛴 항목:");
  for (const s of skipped) console.log(`  - ${s.path} (${s.reason})`);
}

if (preserved.length > 0) {
  console.log(`\n보존된 항목 (실존 종이지만 getCreatureImage()가 3글자 국가코드를 못 벗겨 현재 이미지가 안 뜸 — 별도 앱 버그, 이 스크립트 범위 밖):`);
  for (const p of preserved) console.log(`  - ${p.key} (${p.liveCreatureIds.join(", ")})`);
}

if (DRY) {
  console.log("\n[--dry] 미리보기만 실행. 실제 파일/데이터는 변경하지 않았습니다.");
  process.exit(0);
}

// ── 실제 적용 ──
mkdirSync(dirname(RUNLOG_PATH), { recursive: true });
const now = new Date().toISOString();

for (const r of removed) {
  if (r.fileDeleted) unlinkSync(r.filePath);
  appendFileSync(
    RUNLOG_PATH,
    JSON.stringify({ ts: now, action: "remove", key: r.key, path: r.path, reason: r.reason, fileDeleted: r.fileDeleted }) + "\n"
  );
}
for (const a of added) {
  appendFileSync(
    RUNLOG_PATH,
    JSON.stringify({ ts: now, action: "add", key: a.key, path: a.path, liveCreatureIds: a.liveCreatureIds }) + "\n"
  );
}
for (const s of skipped) {
  appendFileSync(RUNLOG_PATH, JSON.stringify({ ts: now, action: "skip", ...s }) + "\n");
}

const newSrc = src.substring(0, map.start) + JSON.stringify(imageMap) + src.substring(map.end);
writeFileSync(DATA_PATH, newSrc, "utf-8");

console.log(`\n적용 완료. CREATURE_IMAGE_MAP 총 ${Object.keys(imageMap).length}건. 런로그: ${RUNLOG_PATH}`);
