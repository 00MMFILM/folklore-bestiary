#!/usr/bin/env node
// ============================================================
// 잘린 설명(d) 복구 — 1단계: 수집
//
// 배경: generateKoreanDescription이 위키 extract를 substring(0,100)
//   (한국어 위키는 200)으로 하드컷해 단어 중간에서 끊긴 설명이 대량 생성됐다.
//   커밋 3492c60에서 clipExtract()로 크롤러는 고쳤으나 기존 데이터는 그대로다.
//
// 이 스크립트는 데이터를 수정하지 않는다. 위키 원문을 다시 받아
//   scripts/runlogs/desc-repair-<날짜>.jsonl 에만 기록한다.
//   적용은 2단계 apply-desc-repair.mjs 가 한다.
//
// 안전장치:
//   - prefix 검증: 받아온 원문이 기존 잘린 조각으로 시작할 때만 채택한다.
//     (오매칭 원천 차단 — 다른 문서를 잘못 가져오면 조각이 안 맞는다)
//   - 재개 가능: 이미 런로그에 있는 id는 건너뛴다.
//   - 실패도 런로그에 남긴다 (why 필드).
//
// 사용법: node scripts/repair-truncated-desc.mjs [--limit N]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const RUNLOG_DIR = path.join(ROOT, 'scripts', 'runlogs');
const RUNLOG = path.join(RUNLOG_DIR, 'desc-repair-20260822.jsonl');
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');

const argLimit = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? parseInt(process.argv[i+1], 10) : Infinity; })();

// ── 데이터 로드 ──
function loadCreatures() {
  const lines = fs.readFileSync(DATA_PATH, 'utf8').split('\n');
  const line = lines.find(l => l.startsWith('export const FOLKLORE_DATA'));
  let body = line.slice(line.indexOf('= ') + 2).trim();
  if (body.endsWith(';')) body = body.slice(0, -1);
  const data = JSON.parse(body);
  const out = [];
  for (const country of data) for (const c of country.b) out.push({ ...c, _iso: country.i });
  return out;
}

// ── 하드컷 대상 식별 ──
// 영문 템플릿: "{국가} 설화에 등장하는 {Type}. {extract 100자}"  → 영문부가 정확히 100자
// 한국어 위키: extract 200자 그대로            → 전체가 정확히 200자
const TPL = /^(.*?설화에 등장하는\s+[A-Za-z ]+\.\s*)/;
function findTargets(all) {
  const targets = [];
  for (const c of all) {
    const m = c.d.match(TPL);
    if (m) {
      const eng = c.d.slice(m[1].length);
      if (eng.length === 100) targets.push({ c, prefix: m[1], frag: eng, lang: 'en', max: 100 });
    } else if (c.d.length === 200) {
      targets.push({ c, prefix: '', frag: c.d, lang: 'ko', max: 200 });
    }
  }
  return targets;
}

// ── 위키 API ──
const UA = 'folklore-bestiary/1.0 (data repair; https://github.com/00MMFILM/folklore-bestiary)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').replace(/\s+/g, ' ').trim();

// ── 일치 판정 ──
// 위키 문서는 크롤 이후에도 편집된다 (실측: "A kumiho or gumiho" → "A gumiho or kumiho",
// Seonangshin은 이표기가 추가됨). 그래서 prefix 완전일치만 요구하면 정당한 문서도 놓친다.
// 반대로 판정을 느슨하게 하면 엉뚱한 문서를 가져온다 — 실측 사례로, 영문 위키의 'Arang'은
// 지금 한국 설화가 아니라 인도 차티스가르의 마을 문서다.
// 그래서 2단으로 본다: prefix 완전일치(strong) → 실패하면 고유 토큰 겹침(weak, 0.65 이상).
function tokens(s) {
  return [...new Set((norm(s).toLowerCase().match(/[a-z]{4,}|[가-힣]{2,}|[\u4e00-\u9fff]{2,}/g) || []))];
}
function tokenOverlap(frag, extract) {
  const ft = tokens(frag.slice(0, 120));
  if (!ft.length) return 0;
  const et = new Set(tokens(extract.slice(0, 500)));
  return ft.filter(t => et.has(t)).length / ft.length;
}
const WEAK_THRESHOLD = 0.65;
function judge(frag, extract) {
  const e = norm(extract);
  if (e.startsWith(frag.slice(0, 40))) return { ok: true, how: 'strong' };
  const sim = tokenOverlap(frag, e);
  if (sim >= WEAK_THRESHOLD) return { ok: true, how: `weak:${sim.toFixed(2)}` };
  return { ok: false, sim };
}

let apiErrors = 0;
async function api(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status === 503) { await sleep(2500 * (i + 1)); continue; }
      if (!r.ok) { apiErrors++; return { err: 'HTTP ' + r.status }; }
      return { data: await r.json() };
    } catch (e) {
      if (i === tries - 1) { apiErrors++; return { err: e.message }; }
      await sleep(1000 * (i + 1));
    }
  }
  apiErrors++;
  return { err: 'rate-limited' };
}

async function getExtract(lang, title) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&exsentences=6` +
    `&titles=${encodeURIComponent(title)}&format=json&redirects=1&origin=*`;
  const { data, err } = await api(url);
  if (err) return { err };
  const pages = data?.query?.pages;
  if (!pages) return { extract: null };
  const p = Object.values(pages)[0];
  return { extract: p?.extract || null, title: p?.title };
}

async function searchTitles(lang, q) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}` +
    `&srlimit=3&format=json&origin=*`;
  const { data, err } = await api(url);
  if (err) return [];
  return (data?.query?.search || []).map(s => s.title);
}

// ── 후보 제목 생성 ──
function leadTitle(frag) {
  const m = frag.match(/^(.{2,90}?)\s+(?:is|was|are|were|refers|means|denotes)\b/);
  let lead = m ? m[1] : frag.split(/[(,;:]/)[0];
  return lead.replace(/\s*\([^)]*\)/g, ' ').replace(/[,;:].*$/, '').trim();
}
function candidates(t) {
  const frag = norm(t.frag);
  const n = t.c.n;
  const out = [n];
  const bare = n.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (bare !== n) out.push(bare);
  const lead = leadTitle(frag);
  if (lead && lead.length < 70) {
    out.push(lead);                                    // 관사 포함 원형
    const noArt = lead.replace(/^(?:The|A|An)\s+/i, '').trim();
    if (noArt !== lead) out.push(noArt);
    if (/s$/.test(lead)) out.push(lead.replace(/s$/, ''));   // 단복수 변형
  }
  return [...new Set(out.filter(Boolean))];
}

// ── 런로그 ──
function loadDone() {
  if (!fs.existsSync(RUNLOG)) return new Set();
  const done = new Set();
  for (const line of fs.readFileSync(RUNLOG, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch {}
  }
  return done;
}
function appendLog(rec) {
  fs.mkdirSync(RUNLOG_DIR, { recursive: true });
  fs.appendFileSync(RUNLOG, JSON.stringify(rec) + '\n');
}

// ── 메인 ──
const all = loadCreatures();
const targets = findTargets(all);
const done = loadDone();
const todo = targets.filter(t => !done.has(t.c.id)).slice(0, argLimit);

console.log(`대상 ${targets.length}건 / 완료기록 ${done.size}건 / 이번 실행 ${todo.length}건`);

let ok = 0, fail = 0, i = 0;
for (const t of todo) {
  i++;
  const frag = norm(t.frag);
  const key = frag.slice(0, 40);                  // prefix 검증 키
  const langs = t.lang === 'ko' ? ['ko', 'en'] : ['en', 'ko'];
  let found = null;

  outer:
  for (const cand of candidates(t)) {
    for (const lg of langs) {
      const { extract, title } = await getExtract(lg, cand);
      await sleep(180);
      if (!extract) continue;
      const v = judge(frag, extract);
      if (v.ok) { found = { extract: norm(extract), src: `${lg}:${title}`, match: v.how }; break outer; }
    }
  }
  // 검색 폴백 — 잘린 조각 앞부분을 그대로 질의
  if (!found) {
    const lg = t.lang === 'ko' ? 'ko' : 'en';
    const hits = await searchTitles(lg, frag.slice(0, 80));
    await sleep(180);
    for (const h of hits) {
      const { extract, title } = await getExtract(lg, h);
      await sleep(180);
      if (!extract) continue;
      const v = judge(frag, extract);
      if (v.ok) { found = { extract: norm(extract), src: `search/${lg}:${title}`, match: v.how }; break; }
    }
  }

  if (found) {
    ok++;
    appendLog({ id: t.c.id, iso: t.c._iso, n: t.c.n, lang: t.lang, max: t.max,
                prefix: t.prefix, oldD: t.c.d, extract: found.extract, src: found.src, match: found.match, ts: new Date().toISOString() });
  } else {
    fail++;
    appendLog({ id: t.c.id, iso: t.c._iso, n: t.c.n, lang: t.lang, max: t.max,
                oldD: t.c.d, extract: null, why: 'prefix-mismatch-or-not-found',
                tried: candidates(t), ts: new Date().toISOString() });
  }
  if (i % 100 === 0) console.log(`  ${i}/${todo.length} — 성공 ${ok} 실패 ${fail} (API오류 ${apiErrors})`);
}
console.log(`\n완료: 성공 ${ok} / 실패 ${fail} / API오류 ${apiErrors}`);
console.log(`런로그: ${RUNLOG}`);
