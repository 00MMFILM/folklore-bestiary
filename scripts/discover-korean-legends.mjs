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
  {
    koName: '몽달귀신',
    enName: 'Mongdal Gwishin (Bachelor Ghost)',
    src: '한국 전통 귀신 설화 채록',
    facts: `몽달귀신은 결혼하지 못하고 죽은 총각(미혼 남성)의 귀신으로, '총각귀신'이라고도 불리는 한국 전통 귀신이다.
- 혼인을 하지 못한 채 죽어 이승에 한을 품고 떠도는 원귀(寃鬼)의 일종이다.
- 여성 원귀인 처녀귀신(손각시)과 대응되는 남성 짝으로 여겨진다.
- 전통적으로 몽달귀신과 처녀귀신을 혼인시키는 사혼(死婚), 즉 영혼결혼식을 치러 한을 풀어준다는 민속이 전해진다.
- 결혼과 자손을 중시한 유교적 관념에서, 후사 없이 죽은 이의 한을 달래려는 관념이 반영된 존재다.`,
  },
  {
    koName: '객귀',
    enName: 'Gaekgwi (Wandering Ghost)',
    src: '한국 무속·민간신앙 채록',
    facts: `객귀는 객지에서 떠돌다 죽거나 제사를 받지 못해 떠도는 잡귀로, 한국 무속과 민간신앙에 등장한다.
- 집 밖을 떠도는 무주고혼(無主孤魂)으로, 사람에게 병이나 탈을 일으킨다고 여겨졌다.
- 갑자기 병이 나면 '객귀가 들렸다'고 하여, 바가지에 밥과 나물을 담아 물리치는 '객귀물리기(푸닥거리)' 의식을 행했다.
- 객귀물리기는 칼로 위협하며 문밖에 음식을 던지고 침을 뱉는 등의 절차로 이루어진다.
- 제사를 받는 조상신과 대비되는, 돌봄받지 못한 떠돌이 혼령이라는 점이 특징이다.`,
  },
  {
    koName: '에밀레종 설화',
    enName: 'Emille Bell Legend',
    src: '성덕대왕신종 관련 구전 설화',
    facts: `에밀레종 설화는 신라의 성덕대왕신종(봉덕사종) 주조에 얽힌 구전 설화이다.
- 종을 만들 때 자꾸 실패하자, 한 아이를 시주받아 쇳물에 넣어 완성했다는 이야기가 전해진다.
- 완성된 종이 울릴 때 '에밀레(어미 때문에)'라고 우는 아이 소리처럼 들린다 하여 '에밀레종'이라 불린다는 것이 설화의 핵심이다.
- 인신공양 모티프가 담긴 대표적 한국 구전 설화로, 실제 성덕대왕신종은 771년 완성된 통일신라의 범종이다.
- 학계에서는 인신공양이 실제로 있었다는 근거는 없으며 후대에 덧붙여진 설화로 본다.`,
  },
  {
    koName: '아랑',
    enName: 'Arang (Vengeful Maiden Ghost)',
    src: '밀양 아랑 전설 채록',
    facts: `아랑은 경상남도 밀양에 전해지는 원귀 설화의 주인공으로, 억울하게 죽은 처녀의 원혼이다.
- 밀양 부사의 딸 아랑(윤동옥)이 통인(관아 하급 관리)의 흉계로 정절을 지키려다 살해되어 대나무숲에 버려졌다는 이야기다.
- 원한을 풀지 못한 아랑의 혼령이 밤마다 새로 부임하는 부사 앞에 나타나, 부사들이 놀라 죽는다.
- 마침내 담대한 부사가 아랑의 사연을 듣고 범인을 잡아 원한을 풀어주었다는 것이 결말이다.
- 밀양 영남루 아래에 아랑을 기리는 아랑각(阿娘閣)이 세워져 있으며, 억울한 원혼이 산 자에게 호소해 한을 푸는 한국 원귀 설화의 전형이다.`,
  },
  {
    koName: '삼두구미',
    enName: 'Samdugumi (Three-Headed Nine-Tailed Fox)',
    src: '제주도 민간전승 채록',
    facts: `삼두구미는 제주도 민간전승에 등장하는 요호(여우 요괴)의 일종으로, 이름처럼 머리가 셋에 꼬리가 아홉 달린 괴물이다.
- 무덤을 파헤쳐 시신을 파먹는 존재로 전해진다.
- 사람으로 둔갑해 여인을 아내로 삼으려 하는 등 인간을 홀린다.
- 약점은 무쇳덩이, 달걀, 동쪽으로 뻗은 버드나무 가지다.
- 무쇠는 불에 넣어도 변하지 않아 삼두구미의 조화가 통하지 않고, 가슴을 맞으면 먹먹해진다.
- 달걀을 얼굴에 맞아 범벅이 되면 앞을 못 보게 되어 물리칠 수 있다.`,
  },
  {
    koName: '지네각시',
    enName: 'Jinae-gaksi (Centipede Bride)',
    src: '이물교구 설화 채록',
    facts: `지네각시는 지네가 여인으로 둔갑해 사람과 부부의 연을 맺는다는 한국의 이물교구(異物交媾) 설화 속 존재다.
- 가난한 남자가 아름다운 여인을 만나 함께 살며 부유해지는데, 그 여인이 실은 지네의 화신이라는 이야기다.
- 여인의 본모습(지네)을 보아서는 안 된다는 금기가 핵심이며, 남자가 금기를 어기면 인연이 깨진다.
- '팔백이 설화'로도 알려져 있으며, 인간이 되려는 요물로 지네가 등장하는 대표적 유형이다.
- 은혜와 배신, 금기 위반이라는 설화적 모티프가 담겨 있다.`,
  },
  {
    koName: '노고할미',
    enName: 'Nogo Halmi (Giant Creator Goddess)',
    src: '한국 창세신화 채록',
    facts: `노고할미(노구할미)는 제주도를 비롯한 여러 지역에 전하는 창세신화 속 거인 여신으로, 대지모신적 성격을 지닌다.
- 몸집이 산과 강을 만들 만큼 거대한 창조신으로 묘사된다.
- 산·바위·섬 같은 자연 지형을 만들었다는 지형 창조 설화가 각지에 전한다.
- 제주의 설문대할망, 지리산·마고할미 등과 같은 계열의 거인 여신 신화로 여겨진다.
- 태초의 창조와 풍요를 관장하는 대모신(大母神) 관념이 반영된 존재다.`,
  },
  {
    koName: '혹부리 영감',
    enName: 'Hokbuli Yeonggam (The Old Man with a Lump)',
    src: '한국 전래 설화 채록',
    facts: `혹부리 영감은 도깨비를 속여 혹을 떼고 부자가 된 노인의 이야기로, 한국 전역에 전승되는 대표적 도깨비 설화다.
- 착한 혹부리 영감이 산에서 길을 잃고 도깨비 소굴에서 노래를 부르는데, 도깨비들이 '그 좋은 소리가 혹에서 나온다'고 믿는다.
- 도깨비들은 혹을 떼어 가고 그 대가로 보물을 잔뜩 준다.
- 이를 들은 심술궂은 혹부리 영감이 흉내 내지만, 도깨비에게 혹을 하나 더 붙이고 매만 맞고 돌아온다.
- 착한 이는 복을 받고 욕심부린 이는 벌을 받는 권선징악의 구조를 지닌다.`,
  },
  {
    koName: '팥죽 할멈과 호랑이',
    enName: 'Patjuk Halmeom (Red-Bean Porridge Granny)',
    src: '한국 누적형 전래 설화 채록',
    facts: `〈팥죽 할멈과 호랑이〉는 할머니를 잡아먹으려는 호랑이를 여러 사물이 협력해 물리치는 한국의 누적형(연쇄) 전래 설화다.
- 호랑이가 팥죽을 쑤는 할머니를 잡아먹으려 하자, 할머니는 팥죽을 다 쑤고 먹을 때까지 기다려 달라고 한다.
- 알밤·자라·물찌똥·송곳·지게·멍석 등이 할머니의 사연을 듣고 도와주기로 한다.
- 밤은 호랑이 눈에 튀고, 자라는 손을 물고, 물찌똥에 미끄러지고, 멍석에 말려 지게에 실려 물에 버려진다.
- 작고 하찮은 것들이 힘을 합쳐 강자를 이긴다는 주제를 담은 대표적 누적담이다.`,
  },
  {
    koName: '성주신',
    enName: 'Seongjusin (House Guardian God)',
    src: '한국 가신신앙 채록',
    facts: `성주신(성줏대감)은 집을 지키는 한국 가신(家神) 신앙의 으뜸 신으로, 집안의 안녕과 번영을 관장한다.
- 집의 대들보나 상량(마룻대)에 깃든다고 여겨져, 집을 새로 지으면 성주신을 모시는 성주받이 굿을 했다.
- 한지를 접어 쌀과 함께 대들보에 붙이거나 항아리에 모시는 성주단지 형태로 신체(神體)를 삼았다.
- 조왕신(부엌)·터주신(집터)·업신(재물) 등 여러 가신 가운데 집안을 총괄하는 가장(家長) 격의 신이다.
- 〈성주풀이〉 등 무가에서 성주신의 내력과 집 짓는 과정을 노래한다.`,
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
