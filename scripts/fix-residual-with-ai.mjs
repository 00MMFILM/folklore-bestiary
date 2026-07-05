#!/usr/bin/env node
// ============================================================
// 잔여 오배정 AI 분류 — 텍스트 규칙으로 판정 불가한 크리처를
// GPT-4o-mini에게 이름+설명을 주고 출신 국가를 판정시킴
//
// 대상: src가 "Wikipedia (라벨)"이고 라벨에서 국가 추정이 안 되는 크리처
// 규칙: GPT가 확신 없으면 UNKNOWN → 이동 안 함.
//       GPT 응답이 지원 국가 목록에 없으면 무시.
//
// 사용법: OPENAI_API_KEY=... node scripts/fix-residual-with-ai.mjs [--apply]
// ============================================================

import fs from 'fs';
import path from 'path';
import { guessCountryFromText } from './crawl-wikipedia-folklore.mjs';

const APPLY = process.argv.includes('--apply');
const FROM_REPORT = process.argv.includes('--from-report'); // 저장된 리포트로 재분류 없이 적용
const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && !FROM_REPORT) throw new Error('Set OPENAI_API_KEY');

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

const AMBIGUOUS_TERMS = /\b(scandinavian|baltic|slavic|slav|celtic|gaelic|germanic|teutonic|arab|arabian|arabic|islam|islamic|bedouin|turkic|amazonian|andean)\b/g;
const stripAmbiguous = (t) => (t || '').toLowerCase().replace(AMBIGUOUS_TERMS, ' ');

const coreName = (name) => (name || '')
  .replace(/\s*\(.*?\)\s*/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

const content = fs.readFileSync(DATA_PATH, 'utf8');
const { startIdx, endIdx } = findDataRange(content);
const data = JSON.parse(content.substring(startIdx, endIdx));
const isoSet = new Map(data.map(c => [c.i, c]));
const countryList = data.map(c => `${c.i}=${c.c}`).join(', ');

// ── 후보 수집: 라벨 판정 불가 크리처 ──
const candidates = [];
for (const country of data) {
  for (const b of country.b) {
    const m = /^Wikipedia \((.+)\)$/.exec(b.src || '');
    if (!m) continue;
    if (guessCountryFromText(stripAmbiguous(m[1]))) continue; // 라벨로 확정된 건 스킵
    candidates.push({ b, from: country.i, label: m[1] });
  }
}
console.log(`AI 분류 대상: ${candidates.length}마리`);

// ── GPT-4o-mini 배치 분류 ──
async function classifyBatch(items) {
  const payload = items.map(c => ({
    id: c.b.id,
    name: c.b.n,
    korean_name: c.b.ln || undefined,
    description: (c.b.d || '').slice(0, 350),
    source_category: c.label,
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a folklore expert. For each creature/deity/legendary figure, determine which single country's folklore tradition it PRIMARILY belongs to.

Allowed country codes (use EXACTLY these): ${countryList}

Rules:
- Answer with the code of the country of ORIGIN of the folklore tradition.
- Scotland=SCT and Wales=WLS are separate from GB (GB = England/general British).
- If the tradition spans multiple countries with no clear primary origin, or you are not confident, answer "UNKNOWN".
- If the origin country is not in the list (e.g. Cook Islands, Tahiti), answer "UNKNOWN".
- Return a JSON object mapping each id to its code: {"id1":"KR","id2":"UNKNOWN",...}`,
        },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

const verdicts = {}; // id → iso
if (FROM_REPORT) {
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'ai-reattribution-report.json'), 'utf8'));
  for (const r of report) verdicts[r.id] = r.to;
  console.log(`리포트에서 ${report.length}건 판정 로드 (재분류 스킵)`);
}
const BATCH = 25;
for (let i = 0; !FROM_REPORT && i < candidates.length; i += BATCH) {
  const chunk = candidates.slice(i, i + BATCH);
  try {
    const result = await classifyBatch(chunk);
    Object.assign(verdicts, result);
  } catch (e) {
    console.log(`   ⚠️ 배치 실패 (${i}~): ${e.message} — 20초 후 재시도`);
    await new Promise(r => setTimeout(r, 20000));
    try {
      Object.assign(verdicts, await classifyBatch(chunk));
    } catch (e2) {
      console.log(`   ❌ 재시도 실패 (${i}~): ${e2.message}`);
    }
  }
  if ((i / BATCH) % 5 === 4) console.log(`   ... ${Math.min(i + BATCH, candidates.length)}/${candidates.length} 분류`);
  await new Promise(r => setTimeout(r, 300));
}

// ── 이동 계획 ──
const moves = [];
let unknown = 0, confirmed = 0, invalid = 0;
for (const cand of candidates) {
  const verdict = verdicts[cand.b.id];
  if (!verdict || verdict === 'UNKNOWN') { unknown++; continue; }
  if (!isoSet.has(verdict)) { invalid++; continue; }
  if (verdict === cand.from) { confirmed++; continue; }
  moves.push({ b: cand.b, from: cand.from, to: verdict, reason: `AI 분류 (라벨 "${cand.label}")` });
}

console.log(`\n판정 결과: 이동 ${moves.length} / 현위치 확인 ${confirmed} / UNKNOWN ${unknown} / 무효 응답 ${invalid}`);
const pairCount = {};
for (const mv of moves) pairCount[`${mv.from}→${mv.to}`] = (pairCount[`${mv.from}→${mv.to}`] || 0) + 1;
for (const [k, v] of Object.entries(pairCount).sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`   ${k}: ${v}마리`);
console.log('\n샘플 15건:');
for (const mv of moves.slice(0, 15)) console.log(`   ${mv.b.n} [${mv.from}→${mv.to}]`);

fs.writeFileSync(
  path.join(ROOT, 'scripts', 'ai-reattribution-report.json'),
  JSON.stringify(moves.map(m => ({ name: m.b.n, id: m.b.id, from: m.from, to: m.to })), null, 2)
);
console.log('📄 scripts/ai-reattribution-report.json 저장');

if (!APPLY) {
  console.log('\n(드라이런 — 반영하려면 --apply)');
  process.exit(0);
}

// ── 적용 (fix-misattributed-creatures.mjs와 동일 기제) ──
const idMap = {};
let moved = 0, dropped = 0;
for (const mv of moves) {
  const fromCountry = isoSet.get(mv.from);
  const toCountry = isoSet.get(mv.to);
  if (!fromCountry || !toCountry) continue;
  const idx = fromCountry.b.indexOf(mv.b);
  if (idx === -1) continue;
  fromCountry.b.splice(idx, 1);
  const core = coreName(mv.b.n);
  if (toCountry.b.some(x => coreName(x.n) === core)) {
    idMap[mv.b.id] = null;
    dropped++;
    continue;
  }
  const oldId = mv.b.id;
  mv.b.id = `${mv.to.toLowerCase()}-${oldId.replace(/^[a-z]{2,3}-/, '')}`;
  idMap[oldId] = mv.b.id;
  toCountry.b.push(mv.b);
  moved++;
}

const newContent = content.substring(0, startIdx) + JSON.stringify(data) + content.substring(endIdx);
fs.writeFileSync(DATA_PATH, newContent, 'utf8');

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
  console.log(`   번역 키 갱신 (${loc}): ${renameKeys(path.join(ROOT, `public/i18n/creatures-${loc}.json`))}건`);
}
console.log(`   이미지 진행 키 갱신: ${renameKeys(path.join(ROOT, 'scripts/image-gen-progress.json'))}건`);

const total = data.reduce((s, c) => s + c.b.length, 0);
console.log(`\n✅ 적용 완료: ${moved}마리 이동, ${dropped}마리 중복 제거 (총 ${total}마리)`);
