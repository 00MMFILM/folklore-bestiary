#!/usr/bin/env node
// ============================================================
// 설명(d) 절단 재현 테스트
//   버그: generateKoreanDescription이 extract를 substring(0,100)으로
//         하드컷 → "is one type of supernatura"처럼 단어 중간에서 끊김.
//         실측 3,300여 건이 119~124자 구간에 몰려 있었음.
//   성공기준:
//     (A) 단어 중간에서 끊기지 않는다
//     (B) 가능하면 문장 경계에서 끝난다
//     (C) 잘렸으면 말줄임표(…)로 잘렸음을 표시한다
//     (D) 원문이 짧으면 그대로 두고 …를 붙이지 않는다
// 사용법: node scripts/test-description-truncation.mjs
// ============================================================

import { clipExtract } from './crawl-wikipedia-folklore.mjs';

const CASES = [
  {
    name: '단어 중간 절단 (Cherub 실제 사례)',
    input: 'A cherub (; pl.: cherubim; Hebrew: כְּרוּב kərūḇ) is one type of supernatural being in the Judeo-Christian angelic hierarchy.',
    check: out => !/supernatura$/.test(out.replace(/…$/, '')),
  },
  {
    name: '문장 경계에서 끝남',
    input: 'Ashi-magari is a ghostly phenomenon from Kagawa Prefecture. It feels like cotton wrapping around the leg while walking at night.',
    check: out => /Prefecture\.$/.test(out),
  },
  {
    name: '잘렸으면 … 표시',
    input: 'The tengutsubute is a phenomenon in which stones suddenly fall from the sky or from trees, attributed to tengu in Japanese folklore and reported across many prefectures over centuries.',
    check: out => out.endsWith('…') || /[.!?]$/.test(out),
  },
  {
    name: '짧은 원문은 그대로, … 없음',
    input: 'Kappa is a river creature.',
    check: out => out === 'Kappa is a river creature.',
  },
  {
    name: '단어 경계 보존 (마지막 토큰이 온전한 단어)',
    input: 'Gogeumsochong is a collection of eleven different anthologies of stories collected throughout the Joseon dynasty by unknown compilers.',
    check: out => { const t = out.replace(/…$/, '').trim().split(/\s+/).pop(); return /^[\w'’.,;:()-]+$/.test(t); },
  },
  {
    name: '빈 입력 안전',
    input: '',
    check: out => out === '',
  },
  {
    name: '개행 제거',
    input: 'Line one about a spirit.\nLine two about the same spirit and its many deeds.',
    check: out => !out.includes('\n'),
  },
  {
    name: '약어 마침표를 문장 끝으로 오인하지 않음',
    input: 'Abzu (Sumerian: ab = water) is the name for fresh water from underground aquifers in Mesopotamian mythology, personified as a primeval god.',
    check: out => !/\b(?:c|e\.g|i\.e|pl|lit|var|Gr|St|Mt)\.$/.test(out.replace(/…$/, '')),
  },
];

let pass = 0, fail = 0;
for (const c of CASES) {
  const out = clipExtract(c.input, 100);
  const ok = c.check(out);
  if (ok) { pass++; console.log(`✅ ${c.name}`); }
  else { fail++; console.log(`❌ ${c.name}\n   출력: ${JSON.stringify(out)}`); }
}
console.log(`\n결과: pass ${pass} / fail ${fail}`);
process.exit(fail ? 1 : 0);
