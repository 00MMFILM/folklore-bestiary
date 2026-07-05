#!/usr/bin/env node
// ============================================================
// 기존 크리처 국가 오배정 정리 (2026-07-05 크롤러 수정 이전 데이터)
//
// 1차: src의 카테고리 라벨("Wikipedia (X)")을 새 로직으로 재판정
// 2차(--deep): 라벨이 일반적인 크리처는 en.wikipedia에서 intro를
//              재조회해 본문 기반 재판정
//
// 이동 시 id 접두사·번역 JSON·이미지 진행 파일의 키도 함께 갱신.
// 이동 대상 국가에 동명 크리처가 있으면 중복으로 판단해 제거.
//
// 사용법: node scripts/fix-misattributed-creatures.mjs [--deep] [--apply]
//   기본은 드라이런(리포트만). --apply 시 실제 반영.
// ============================================================

import fs from 'fs';
import path from 'path';
import { guessCountryFromText, countryScores } from './crawl-wikipedia-folklore.mjs';

const DEEP = process.argv.includes('--deep');
const APPLY = process.argv.includes('--apply');

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
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

const content = fs.readFileSync(DATA_PATH, 'utf8');
const { startIdx, endIdx } = findDataRange(content);
const data = JSON.parse(content.substring(startIdx, endIdx));
const isoSet = new Map(data.map(c => [c.i, c]));

const coreName = (name) => (name || '')
  .replace(/\s*\(.*?\)\s*/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

// 여러 나라에 걸치는 문화권 용어 — 이런 단어만으로는 "이동"의 근거가 될 수 없음
// (예: Scandinavian은 SE/NO/DK 공통이므로 스웨덴에 있는 걸 노르웨이로 옮기면 안 됨)
const AMBIGUOUS_TERMS = /\b(scandinavian|baltic|slavic|slav|celtic|gaelic|germanic|teutonic|arab|arabian|arabic|islam|islamic|bedouin|turkic|amazonian|andean)\b/g;
const stripAmbiguous = (text) => (text || '').toLowerCase().replace(AMBIGUOUS_TERMS, ' ');
// 이동 판정 전용: 애매한 용어 제거 후 추정
const guessForMove = (text) => guessCountryFromText(stripAmbiguous(text));

// ── 이동 계획 수집 ──
const moves = [];   // {creature, from, to, reason}
const deepCandidates = [];

for (const country of data) {
  for (const b of country.b) {
    const m = /^Wikipedia \((.+)\)$/.exec(b.src || '');
    if (!m) continue; // 수작업 데이터/ko-wiki는 건드리지 않음
    const label = m[1];
    const guess = guessForMove(label);
    if (guess && guess !== country.i) {
      moves.push({ b, from: country.i, to: guess, reason: `라벨 "${label}"` });
    } else if (!guess) {
      deepCandidates.push({ b, from: country.i, label });
    }
  }
}

console.log(`1차(라벨 기반) 이동 대상: ${moves.length}마리`);
console.log(`2차(재조회) 후보: ${deepCandidates.length}마리 ${DEEP ? '— 재조회 실행' : '(--deep 시 실행)'}`);

// ── 2차: 위키 본문 재조회 ──
if (DEEP && deepCandidates.length > 0) {
  const BATCH = 20;
  let checked = 0;
  for (let i = 0; i < deepCandidates.length; i += BATCH) {
    const chunk = deepCandidates.slice(i, i + BATCH);
    const titles = chunk.map(c => c.b.n).join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&exlimit=${BATCH}` +
      `&titles=${encodeURIComponent(titles)}&format=json&origin=*&redirects=1`;
    try {
      let res = await fetch(url, { headers: { 'User-Agent': 'FolkloreBestiary/1.0 (leechan0415@gmail.com; one-time cleanup)' } });
      let text = await res.text();
      if (!text.startsWith('{')) {
        // 레이트리밋 등 — 15초 대기 후 1회 재시도
        await new Promise(r => setTimeout(r, 15000));
        res = await fetch(url, { headers: { 'User-Agent': 'FolkloreBestiary/1.0 (leechan0415@gmail.com; one-time cleanup)' } });
        text = await res.text();
      }
      const json = JSON.parse(text);
      const pages = Object.values(json?.query?.pages || {});
      // 리다이렉트 매핑 반영
      const redirects = {};
      for (const r of json?.query?.redirects || []) redirects[r.to] = r.from;
      const byTitle = new Map();
      for (const p of pages) {
        if (!p.title || !p.extract) continue;
        byTitle.set(p.title, p.extract);
        if (redirects[p.title]) byTitle.set(redirects[p.title], p.extract);
      }
      for (const cand of chunk) {
        const extract = byTitle.get(cand.b.n);
        checked++;
        if (!extract) continue;
        // 보수적 이동 규칙: 현재 국가의 텍스트 근거가 0이고,
        // 새 국가의 근거가 2점 이상일 때만 이동 (스치는 언급으로 옮기지 않음)
        const scores = countryScores(stripAmbiguous(extract));
        const currentScore = scores[cand.from] || 0;
        let best = null, bestScore = 0;
        for (const [iso, sc] of Object.entries(scores)) {
          if (sc > bestScore) { bestScore = sc; best = iso; }
        }
        if (best && best !== cand.from && currentScore === 0 && bestScore >= 2) {
          moves.push({ b: cand.b, from: cand.from, to: best, reason: `본문 재판정 ${bestScore}점 (라벨 "${cand.label}")` });
        }
      }
    } catch (e) {
      console.log(`   ⚠️ 재조회 실패 (${i}~): ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
    if ((i / BATCH) % 10 === 9) console.log(`   ... ${checked}/${deepCandidates.length} 재조회`);
  }
  console.log(`2차 재조회 완료: ${checked}마리 검사`);
}

// ── 리포트 ──
const pairCount = {};
for (const mv of moves) {
  const k = `${mv.from}→${mv.to}`;
  pairCount[k] = (pairCount[k] || 0) + 1;
}
console.log(`\n총 이동 대상: ${moves.length}마리`);
for (const [k, v] of Object.entries(pairCount).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`   ${k}: ${v}마리`);
}
console.log('\n샘플 20건:');
for (const mv of moves.slice(0, 20)) {
  console.log(`   ${mv.b.n} [${mv.from}→${mv.to}] ${mv.reason}`);
}

// 전체 이동 내역 리포트 저장
fs.writeFileSync(
  path.join(ROOT, 'scripts', 'misattribution-report.json'),
  JSON.stringify(moves.map(m => ({ name: m.b.n, id: m.b.id, from: m.from, to: m.to, reason: m.reason })), null, 2)
);
console.log('📄 scripts/misattribution-report.json 저장');

if (!APPLY) {
  console.log('\n(드라이런 — 반영하려면 --apply)');
  process.exit(0);
}

// ── 적용 ──
const idMap = {}; // oldId → newId (제거된 경우 null)
let moved = 0, dropped = 0;

for (const mv of moves) {
  const fromCountry = isoSet.get(mv.from);
  const toCountry = isoSet.get(mv.to);
  if (!fromCountry || !toCountry) continue;

  const idx = fromCountry.b.indexOf(mv.b);
  if (idx === -1) continue; // 이미 처리됨
  fromCountry.b.splice(idx, 1);

  // 대상 국가에 동명이 있으면 중복 제거
  const core = coreName(mv.b.n);
  const dup = toCountry.b.some(x => coreName(x.n) === core);
  if (dup) {
    idMap[mv.b.id] = null;
    dropped++;
    continue;
  }

  const oldId = mv.b.id;
  const slug = oldId.replace(/^[a-z]{2,3}-/, '');
  mv.b.id = `${mv.to.toLowerCase()}-${slug}`;
  idMap[oldId] = mv.b.id;
  toCountry.b.push(mv.b);
  moved++;
}

// 데이터 저장
const newContent = content.substring(0, startIdx) + JSON.stringify(data) + content.substring(endIdx);
fs.writeFileSync(DATA_PATH, newContent, 'utf8');

// 번역 JSON·이미지 진행 파일 키 갱신
function renameKeys(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let renamed = 0;
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (!(oldId in obj)) continue;
    if (newId) { obj[newId] = obj[oldId]; renamed++; }
    delete obj[oldId];
  }
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 0));
  return renamed;
}
for (const loc of ['ko', 'zh', 'ja']) {
  const n = renameKeys(path.join(ROOT, `public/i18n/creatures-${loc}.json`));
  console.log(`   번역 키 갱신 (${loc}): ${n}건`);
}
const nProg = renameKeys(path.join(ROOT, 'scripts/image-gen-progress.json'));
console.log(`   이미지 진행 키 갱신: ${nProg}건`);

const total = data.reduce((s, c) => s + c.b.length, 0);
console.log(`\n✅ 적용 완료: ${moved}마리 이동, ${dropped}마리 중복 제거 (총 ${total}마리)`);
