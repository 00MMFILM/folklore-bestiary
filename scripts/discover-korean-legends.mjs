#!/usr/bin/env node
// ============================================================
// 한국 설화·민담·괴담 표적 발굴 (Phase 1)
//
// 두 트랙:
//  A) WIKI_CANDIDATES — 표제어를 ko.wikipedia 검색 API로 조회,
//     문서가 있으면 크롤러 공용 빌더로 크리처 생성
//  B) FACT_CANDIDATES — 위키에 없는 괴담(장산범 등).
//     수집된 사실 자료를 근거로 GPT가 설명 생성 (근거 검증 패스 포함)
//
// 사용법: OPENAI_API_KEY=... node scripts/discover-korean-legends.mjs [--apply]
// ============================================================

import fs from 'fs';
import {
  buildCreatureFromArticle, fetchArticleDetail,
  isDuplicate, loadData, saveData, mk,
} from './crawl-wikipedia-folklore.mjs';

const APPLY = process.argv.includes('--apply');
const apiKey = process.env.OPENAI_API_KEY;

// ── A) 위키백과 표제어 후보 — 정확한 ko.wikipedia 문서명 (검색 없이 직접 조회) ──
//    검색 API는 스로틀링·퍼지 오탐이 잦아 정확 제목 직접 fetch로 전환
const WIKI_TITLES = [
  '우렁각시', '선녀와 나무꾼', '해와 달이 된 오누이', '바리공주', '콩쥐팥쥐전',
  '여우 누이', '아기장수 우투리', '비형랑', '연오랑과 세오녀', '처용',
  '만파식적', '호랑이와 곶감', '분신사바', '오늘이', '조신',
  '삼신할미', '동명성왕',
];

// ── B) 사실 자료 기반 후보 (위키 부재 괴담) ──
const FACT_CANDIDATES = [
  {
    koName: '장산범',
    enName: 'Jangsan-beom (Jangsan Tiger)',
    src: '부산일보·경인일보 보도, 목격담 채록',
    facts: `장산범은 부산 해운대구 장산에 출몰한다고 전해지는 괴생명체로, 1990년대부터 2000년대까지 부산 지역을 중심으로 목격담이 퍼진 현대 괴담이다.
- '장산에 나타나는 범'이라는 뜻이며 '와호', '개여시'라는 별칭으로도 불린다.
- 온몸이 여성의 생머리처럼 부드럽고 긴 흰 털로 덮여 있어 얼핏 보면 사람으로 착각한다고 전해진다.
- 목격자들은 '희고 긴 털, 눈코입이 일그러진 모습'이라고 증언했다(부산일보 2019년 보도).
- 사람 목소리를 포함해 시냇물, 바람, 개, 고양이, 아기 울음 등 온갖 소리를 흉내 내서 사람을 홀려 유인한다는 것이 핵심 특징이다.
- 목격담은 부산 장산 일대에서 시작됐지만 영남 지역, 강원도, 충청도, 경기도까지 광범위하게 퍼졌다.
- 2017년 허정 감독의 공포영화 '장산범'으로 영화화되며 전국적으로 유명해졌다.
- 인터넷 커뮤니티에 '미생명체'라는 제목의 목격글이 올라오며 처음 널리 알려졌다.`,
  },
  {
    koName: '인면견',
    enName: 'Inmyeon-gyeon (Human-faced Dog)',
    src: '1990년대 도시전설 채록',
    facts: `인면견은 사람의 얼굴을 한 개의 모습을 했다는 한국의 도시전설 속 존재로, 1980년대 말~1990년대에 크게 유행했다.
- 몸은 개이지만 얼굴이 사람이며, 말을 한다고 전해진다.
- 고속도로에서 달리는 자동차를 시속 100km 이상으로 따라와 나란히 달리며 운전자를 쳐다본다는 목격담이 대표적이다.
- 마주친 사람에게 '왜 쳐다봐'라고 말을 걸었다는 이야기가 유명하다.
- 일본의 진멘켄(人面犬) 도시전설과 같은 시기에 유행한 동아시아 공통 괴담 유형이다.
- 1990년대 학교와 잡지, 만화를 통해 널리 퍼졌다.`,
  },
  {
    koName: '콩콩귀신',
    enName: 'Kongkong Gwishin (Hopping Ghost)',
    src: '학교괴담 채록',
    facts: `콩콩귀신은 한국 학교괴담에 등장하는 귀신으로, 두 발이 묶이거나 다리가 없어 콩콩 뛰어다닌다고 해서 붙은 이름이다.
- 주로 학교 건물이나 복도, 계단에서 밤에 콩콩 뛰는 소리로 존재를 드러낸다고 전해진다.
- 소리는 들리지만 모습이 보이지 않거나, 소복을 입은 채 뛰어다니는 모습으로 묘사된다.
- 1990년대~2000년대 초등학교를 중심으로 구전된 대표적 학교괴담 중 하나다.
- 건물 옥상이나 과학실, 음악실 등 학교괴담의 전형적 장소와 결합되어 전승된다.`,
  },
];

// ── OpenAI (사실 기반 생성 + 검증) ──
async function chat(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  return JSON.parse((await res.json()).choices[0].message.content);
}

async function buildFromFacts(cand) {
  const gen = await chat([
    {
      role: 'system',
      content: `제공된 사실 자료만 사용해 이 한국 괴담의 도감 항목을 JSON으로 작성하세요. 자료에 없는 내용 추가 금지.
{
 "d": "4~6문장의 한국어 설명 (백과사전체)",
 "t": "존재 유형 — Spirit/Ghost/Beast/Creature/Demon 중 택1",
 "f": 공포지수 1~10 정수,
 "ab": ["능력 2~4개 (한국어 명사구)"],
 "wk": ["약점 1~3개 — 자료에 없으면 빈 배열"],
 "vk": ["영어 시각 키워드 배열 (이미지 생성용)"]
}`,
    },
    { role: 'user', content: `[괴담: ${cand.koName}]\n${cand.facts}` },
  ]);
  const verify = await chat([
    { role: 'system', content: '아래 설명의 각 주장이 자료에 근거하는지 검증. JSON: {"grounded": true|false}' },
    { role: 'user', content: `[자료]\n${cand.facts}\n\n[설명]\n${gen.d}` },
  ]);
  if (!verify.grounded) return null;
  const vk = Array.isArray(gen.vk) ? gen.vk : String(gen.vk || '').split(',').map(x => x.trim()).filter(Boolean);
  return mk('KR', cand.enName, cand.koName, gen.t || 'Ghost', gen.f || 6, gen.d,
    gen.ab || [], gen.wk || [], vk, cand.src, 'legend');
}

// ── ko 위키 본문 전체 조회 (인트로 요약이 짧은 설화 대응) ──
async function fetchFullKoArticle(title) {
  const url = `https://ko.wikipedia.org/w/api.php?action=query&prop=extracts|langlinks&explaintext` +
    `&lllimit=10&titles=${encodeURIComponent(title)}&format=json&origin=*&redirects=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'FolkloreBestiary/1.0 (leechan0415@gmail.com; discovery)' } });
    const j = await res.json();
    const p = Object.values(j?.query?.pages || {})[0];
    if (!p?.pageid || !p?.extract) return null;
    return {
      title: p.title,
      pageid: p.pageid,
      // 본문 앞부분을 문장 경계로 잘라 설명 소스로 사용 (섹션 헤더 == 제거)
      extract: p.extract.replace(/={2,}[^=]+={2,}/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600),
      langlinks: p.langlinks || [],
    };
  } catch { return null; }
}

// ── 실행 ──
const data = loadData();
const state = { processedPageIds: [] }; // isDuplicate 시그니처용
const results = { added: [], dup: [], notFound: [], notCreature: [], failed: [] };

// A) 위키 후보 — 정확한 문서명으로 본문 전체 조회 (검색 스로틀링·오탐·짧은 인트로 회피).
//    큐레이션 목록이므로 isCreatureArticle 자동 필터는 우회
//    (콩쥐팥쥐전/분신사바처럼 영화·소설 언급으로 오탐되는 설화가 많음)
// 미디어물·동음이의어 등 설화 아님을 걸러내는 가드 (제목이 영화/소설 등과 겹치는 경우)
const NON_FOLK = /개봉(한|된|일)|영화(이다|다|제)|애니메이션이다|드라마이다|텔레비전|앨범이다|가수|배우|성우|출연|다른 뜻은|동음이의|본 문서는.*(영화|드라마|소설|만화|게임)|비디오 게임|위키(백과|미디어)/;
for (const title of WIKI_TITLES) {
  await new Promise(r => setTimeout(r, 1500));
  const article = await fetchFullKoArticle(title);
  if (!article || article.extract.length < 120) { results.notFound.push(title); continue; }
  if (NON_FOLK.test(article.extract)) { results.notCreature.push(`${title} (미디어/동음이의)`); continue; }
  article.lang = 'ko';
  const creature = buildCreatureFromArticle(article, 'KR', 'ko', '한국 설화 발굴');
  if (isDuplicate(creature, data, state)) { results.dup.push(title); continue; }
  data.find(c => c.i === 'KR').b.push(creature);
  results.added.push(`${creature.n} (위키:${title})`);
}

// B) 사실 기반 후보
for (const cand of FACT_CANDIDATES) {
  if (!apiKey) { results.failed.push(cand.koName + ' (API키 없음)'); continue; }
  const probe = mk('KR', cand.enName, cand.koName, 'Ghost', 5, 'x', [], [], '', '', 'legend');
  if (isDuplicate(probe, data, state)) { results.dup.push(cand.koName); continue; }
  try {
    const creature = await buildFromFacts(cand);
    if (!creature) { results.failed.push(cand.koName + ' (검증 탈락)'); continue; }
    data.find(c => c.i === 'KR').b.push(creature);
    results.added.push(`${creature.n} (사실자료 기반)`);
  } catch (e) {
    results.failed.push(`${cand.koName} (${e.message})`);
  }
}

console.log(`\n✅ 추가 (${results.added.length}):`); results.added.forEach(x => console.log('  ', x));
console.log(`⏭️ 중복 (${results.dup.length}):`, results.dup.join(', '));
console.log(`❓ 위키 없음 (${results.notFound.length}):`, results.notFound.join(', '));
console.log(`🚫 크리처 아님 (${results.notCreature.length}):`, results.notCreature.join(', '));
if (results.failed.length) console.log(`⚠️ 실패:`, results.failed.join(', '));

if (APPLY) {
  saveData(data);
  const total = data.reduce((s, c) => s + c.b.length, 0);
  console.log(`\n💾 저장 완료 — 총 ${total}마리, 한국 ${data.find(c => c.i === 'KR').b.length}마리`);
} else {
  console.log('\n(드라이런 — 저장하려면 --apply)');
}
