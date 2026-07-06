#!/usr/bin/env node
// ============================================================
// 크리처 유형(t)·공포지수(f) 전면 재분류 — GPT-4o-mini 배치
//
// 배경: 휴리스틱 분류가 '흥부전→Serpent' 같은 오분류를 양산했고
//       공포지수가 5/7 기본값에 몰려 있음 (347종 유형 난립)
// 타깃 분류: i18n-names.ts TYPE_NAMES에 존재하는 28종 고정 목록
//
// 사용법: OPENAI_API_KEY=... node scripts/reclassify-types.mjs [--apply] [--batch N]
// ============================================================

import fs from 'fs';
import path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('Set OPENAI_API_KEY');

const TYPES = [
  'Deity', 'Spirit', 'Ghost', 'Vengeful Ghost', 'Demon', 'Beast', 'Divine Beast',
  'Serpent', 'Dragon', 'Fairy', 'Giant', 'Vampire', 'Undead', 'Witch', 'Sorcerer',
  'Trickster', 'Sea Creature', 'Water Spirit', 'Forest Spirit', 'Bird', 'Shapeshifter',
  'Werewolf', 'Cryptid', 'Monster', 'Hero', 'Creature', 'Urban Legend', 'Folktale',
];

function findRange(c) {
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
  return { s, e };
}

const content = fs.readFileSync(DATA_PATH, 'utf8');
const { s, e } = findRange(content);
const data = JSON.parse(content.substring(s, e));

const all = [];
for (const co of data) for (const b of co.b) all.push({ b, country: co.c });
console.log(`재분류 대상: ${all.length}마리`);

async function classifyBatch(items) {
  const payload = items.map(x => ({
    id: x.b.id, name: x.b.n, local_name: x.b.ln,
    desc: (x.b.d || '').slice(0, 220), country: x.country,
  }));
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `각 설화 존재를 분류하세요.

type: 다음 목록에서만 선택 — ${TYPES.join(', ')}
 - 신격은 Deity, 원혼은 Vengeful Ghost, 일반 귀신·유령은 Ghost
 - 현대 도시전설·괴담(장소·현상 포함)은 Urban Legend
 - 특정 존재가 아닌 옛날이야기 자체(심청전 등)는 Folktale
 - 판단 불가 시 Creature

fear (1~10): 1-2 무해·우호적 / 3-4 장난·기묘 / 5-6 불길·으스스 / 7-8 위협적·무서움 / 9-10 극도의 공포·치명적

JSON 반환: {"<id>": {"t": "...", "f": N}, ...}`,
        },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  return JSON.parse((await res.json()).choices[0].message.content);
}

const verdicts = {};
const BATCH = 40;
const CONCURRENCY = 6;
const chunks = [];
for (let i = 0; i < all.length; i += BATCH) chunks.push(all.slice(i, i + BATCH));

let done = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (chunks.length) {
    const chunk = chunks.shift();
    try {
      Object.assign(verdicts, await classifyBatch(chunk));
    } catch (err) {
      await new Promise(r => setTimeout(r, 10000));
      try { Object.assign(verdicts, await classifyBatch(chunk)); }
      catch (e2) { console.log(`   ⚠️ 배치 실패: ${e2.message}`); }
    }
    done += chunk.length;
    if (done % 400 < BATCH) console.log(`   ... ${done}/${all.length}`);
  }
}));

// 적용 통계
let typeChanged = 0, fearChanged = 0, invalid = 0;
const typeMoves = {};
for (const { b } of all) {
  const v = verdicts[b.id];
  if (!v || !TYPES.includes(v.t) || !(v.f >= 1 && v.f <= 10)) { invalid++; continue; }
  if (v.t !== b.t) {
    typeMoves[`${b.t}→${v.t}`] = (typeMoves[`${b.t}→${v.t}`] || 0) + 1;
    typeChanged++;
    if (APPLY) b.t = v.t;
  }
  if (v.f !== b.f) {
    fearChanged++;
    if (APPLY) b.f = v.f;
  }
}

console.log(`\n유형 변경: ${typeChanged} / 공포 변경: ${fearChanged} / 무효 응답: ${invalid}`);
console.log('주요 유형 이동:');
Object.entries(typeMoves).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, n]) => console.log(`   ${k}: ${n}`));

if (APPLY) {
  fs.writeFileSync(DATA_PATH, content.substring(0, s) + JSON.stringify(data) + content.substring(e));
  const dist = {};
  for (const co of data) for (const b of co.b) dist[b.t] = (dist[b.t] || 0) + 1;
  console.log(`\n💾 저장 — 유형 종류: ${Object.keys(dist).length}`);
  console.log(Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t, n]) => `${t}:${n}`).join(', '));
} else {
  console.log('\n(드라이런 — 반영하려면 --apply)');
}
