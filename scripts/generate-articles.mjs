#!/usr/bin/env node
// ============================================================
// 크리처 심화 아티클 생성 파이프라인
//
// 흐름: 위키백과 전문 수집 → (소스 충분할 때만) ko 아티클 생성
//       → 근거 검증 패스 → 통과 시 en/zh/ja 번역 → content/articles/{id}.json
//
// 할루시네이션 통제:
//  - 소스 1,500자 미만이면 생성 스킵 (부풀리기 방지)
//  - "소스에 있는 내용만" 강제, 검증 패스 불합격 시 폐기
//
// 사용법:
//   OPENAI_API_KEY=... node scripts/generate-articles.mjs [옵션]
//   --country KR     특정 국가만
//   --batch 30       최대 생성 수 (기본 30)
//   --concurrency 8  동시 처리 수 (기본 6)
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'content', 'articles');
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';
const MIN_SOURCE_CHARS = 1500;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('Set OPENAI_API_KEY');

const argIdx = (name) => process.argv.indexOf(name);
const argVal = (name, def) => (argIdx(name) !== -1 ? process.argv[argIdx(name) + 1] : def);
const COUNTRY = argVal('--country', null);
const BATCH = parseInt(argVal('--batch', '30'), 10);
const CONCURRENCY = parseInt(argVal('--concurrency', '6'), 10);

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 데이터 로드 ──
function loadData() {
  const c = fs.readFileSync(DATA_PATH, 'utf8');
  const s = c.indexOf(MARKER) + MARKER.length;
  let d = 0, e = s, inStr = false, esc = false;
  for (let i = s; i < c.length; i++) {
    const ch = c[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '[') d++;
    if (ch === ']') { d--; if (d === 0) { e = i + 1; break; } }
  }
  return JSON.parse(c.substring(s, e));
}

// ── 위키 전문 수집: n/ln 양쪽 이름을 ko/en 위키에 조회, 가장 긴 문서 채택 ──
const stripParen = (s) => (s || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();

// 위키 요청은 전역 직렬화 + 간격 유지 (동시 요청 시 레이트리밋으로 차단됨)
let wikiChain = Promise.resolve();
function throttledWikiFetch(url) {
  const run = wikiChain.then(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'FolkloreBestiary/1.0 (leechan0415@gmail.com; article pipeline)' },
        });
        const text = await res.text();
        if (text.startsWith('{')) return JSON.parse(text);
        // 레이트리밋/차단 응답 — 대기 후 재시도
        console.log(`   ⏳ 위키 레이트리밋 감지 — ${15 * (attempt + 1)}초 대기`);
        await new Promise(r => setTimeout(r, 15000 * (attempt + 1)));
      } catch {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    return null;
  });
  wikiChain = run.catch(() => {});
  return run;
}

async function fetchFullExtract(lang, titles) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext` +
    `&exlimit=${titles.length}&titles=${encodeURIComponent(titles.join('|'))}` +
    `&format=json&origin=*&redirects=1`;
  const json = await throttledWikiFetch(url);
  if (!json) return null;
  const pages = Object.values(json?.query?.pages || {});
  let best = null;
  for (const p of pages) {
    if (!p?.extract) continue;
    if (!best || p.extract.length > best.extract.length) best = p;
  }
  return best ? { title: best.title, lang, text: best.extract } : null;
}

async function findBestSource(creature) {
  const names = [...new Set([creature.n, stripParen(creature.n), creature.ln, stripParen(creature.ln)].filter(Boolean))];
  const [ko, en] = await Promise.all([
    fetchFullExtract('ko', names),
    fetchFullExtract('en', names),
  ]);
  const cands = [ko, en].filter(Boolean);
  if (cands.length === 0) return null;
  cands.sort((a, b) => b.text.length - a.text.length);
  return cands[0];
}

// ── OpenAI ──
async function chat(messages, maxRetry = 2) {
  for (let i = 0; i <= maxRetry; i++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const json = await res.json();
      return JSON.parse(json.choices[0].message.content);
    } catch (e) {
      if (i === maxRetry) throw e;
      await new Promise(r => setTimeout(r, 5000 * (i + 1)));
    }
  }
}

async function generateKoArticle(creature, source) {
  return chat([
    {
      role: 'system',
      content: `당신은 세계 설화 전문 편집자입니다. 아래에 제공되는 위키백과 원문만을 근거로, "${creature.ln || creature.n}"에 대한 한국어 아티클을 작성하세요.

절대 규칙:
- 제공된 원문에 명시된 내용만 사용하세요. 원문에 없는 사실을 추가하거나 추측하지 마세요.
- 원문에 해당 내용이 없는 섹션은 빈 문자열("")로 두세요. 억지로 채우지 마세요.
- 단, 원문이 풍부하다면 각 섹션을 충실하고 상세하게 채우세요 (섹션당 2~4문단).
  구체적 일화, 문헌명, 지명, 시대 정보는 원문에 있는 한 최대한 살리세요.
- 백과사전적이고 담백한 문체. 과장·수식 금지.

JSON으로 반환:
{
  "origin": "기원과 역사적 배경 (원문에 있을 때만)",
  "legend": "전승 내용 — 어떤 존재이고 무엇을 한다고 전해지는가",
  "variants": "지역별·문헌별 변형 (원문에 있을 때만, 없으면 \\"\\")",
  "culture": "대중문화·현대적 수용 (원문에 있을 때만, 없으면 \\"\\")"
}`,
    },
    { role: 'user', content: `위키백과 원문 (${source.lang}: "${source.title}"):\n\n${source.text.slice(0, 24000)}` },
  ]);
}

async function verifyArticle(article, source) {
  const body = ['origin', 'legend', 'variants', 'culture'].map(k => article[k]).filter(Boolean).join('\n\n');
  if (body.length < 200) return { pass: false, reason: '내용 부족' };
  const v = await chat([
    {
      role: 'system',
      content: `당신은 팩트체커입니다. 아래 아티클의 주장들이 제공된 원문에 근거하는지 검증하세요.
원문에 없는 사실(창작·추측·다른 지식 혼입)이 하나라도 실질적으로 포함되어 있으면 불합격입니다.
표현을 다듬거나 요약한 것은 합격입니다.
JSON 반환: {"grounded": true|false, "issues": "문제가 있다면 한 줄 설명"}`,
    },
    { role: 'user', content: `[원문]\n${source.text.slice(0, 24000)}\n\n[아티클]\n${body}` },
  ]);
  return { pass: v.grounded === true, reason: v.issues || '' };
}

async function translateArticle(koArticle, targetLocale) {
  const langNames = { en: 'English', zh: 'Simplified Chinese', ja: 'Japanese' };
  return chat([
    {
      role: 'system',
      content: `Translate the following Korean folklore article JSON to ${langNames[targetLocale]}. Keep the JSON structure and keys exactly. Keep proper nouns recognizable (add romanization if helpful). Empty strings stay empty. Return only JSON.`,
    },
    { role: 'user', content: JSON.stringify(koArticle) },
  ]);
}

// ── 후보 선정 ──
const data = loadData();
const candidates = [];
for (const country of data) {
  if (COUNTRY && country.i !== COUNTRY) continue;
  for (const b of country.b) {
    if (fs.existsSync(path.join(OUT_DIR, `${b.id}.json`))) continue;
    candidates.push(b);
  }
}
// 공포지수 → 설명 길이 순 (관심도 프록시)
candidates.sort((a, b) => (b.f - a.f) || ((b.d || '').length - (a.d || '').length));
const targets = candidates.slice(0, BATCH);
console.log(`📝 아티클 생성 대상: ${targets.length}마리 (전체 미보유 ${candidates.length}${COUNTRY ? `, 국가=${COUNTRY}` : ''})`);

// ── 동시 처리 풀 ──
let ok = 0, skipThin = 0, skipNoSrc = 0, failVerify = 0, failErr = 0;

async function processOne(b) {
  try {
    const source = await findBestSource(b);
    if (!source) { skipNoSrc++; console.log(`   ⏭️ ${b.id} — 위키 문서 없음`); return; }
    if (source.text.length < MIN_SOURCE_CHARS) {
      skipThin++;
      console.log(`   ⏭️ ${b.id} — 소스 부족 (${source.text.length}자)`);
      return;
    }
    const ko = await generateKoArticle(b, source);
    const verdict = await verifyArticle(ko, source);
    if (!verdict.pass) {
      failVerify++;
      console.log(`   ❌ ${b.id} — 검증 불합격: ${verdict.reason}`);
      return;
    }
    const [en, zh, ja] = await Promise.all([
      translateArticle(ko, 'en'),
      translateArticle(ko, 'zh'),
      translateArticle(ko, 'ja'),
    ]);
    const out = {
      sourceTitle: source.title,
      sourceLang: source.lang,
      sourceChars: source.text.length,
      generatedAt: new Date().toISOString(),
      locales: { ko, en, zh, ja },
    };
    fs.writeFileSync(path.join(OUT_DIR, `${b.id}.json`), JSON.stringify(out, null, 1));
    ok++;
    console.log(`   ✅ ${b.id} — "${source.title}" (${source.lang}, ${source.text.length}자)`);
  } catch (e) {
    failErr++;
    console.log(`   ⚠️ ${b.id} — 오류: ${e.message}`);
  }
}

const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      await processOne(queue.shift());
    }
  })
);

console.log(`\n완료: 생성 ${ok} / 소스없음 ${skipNoSrc} / 소스부족 ${skipThin} / 검증탈락 ${failVerify} / 오류 ${failErr}`);
