#!/usr/bin/env node
// ============================================================
// 사실 기반 심화 아티클 생성 — 위키백과에 문서가 없는 유명 크리처용
//
// 소스: (1) 큐레이션된 사실 블록(뉴스·공개 자료에서 수집한 사실) +
//        (2) 크리처 자체 데이터(d/ab/wk/sh)
// 위키 파이프라인(generate-articles.mjs)과 동일한 근거 검증 패스 적용.
// 결과는 같은 위치(content/articles/{id}.json)에 저장돼 페이지가 그대로 렌더.
//
// 사용법: OPENAI_API_KEY=... node scripts/generate-fact-articles.mjs [--apply]
// ============================================================

import fs from 'fs';
import path from 'path';
import { loadData } from './crawl-wikipedia-folklore.mjs';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'content', 'articles');
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('Set OPENAI_API_KEY');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 큐레이션 사실 블록 (id → {facts, source}) ──
// 위키에 없는 유명 한국 요괴·괴담. 뉴스/공개 자료의 '사실'만 종합(표현은 우리 것).
const FACT_BLOCKS = {
  '어둑시니': {
    source: '표준국어대사전, 한국 민담 채록',
    facts: `어둑시니는 한국 민담에 등장하는 어둠의 요괴로, '어둑서니·아둑시니'라고도 한다.
- 표준국어대사전에 '어둑서니'로 등재되어 있으며 '어두운 밤에 보이는 헛것'으로 풀이된다.
- 조선 시대부터 요괴로 정착한 것으로 전해진다.
- 어둠을 상징하며, 사람이 계속 지켜보거나 올려다볼수록 점점 커진다.
- 끝까지 올려다보면 한없이 커져 결국 사람을 깔아뭉갠다고 한다.
- 반대로 시선을 아래로 내리면 작아져 사라진다 하여, 심리적 공포를 이용하는 존재로 묘사된다.`,
  },
  '그슨대': {
    source: '한국 전통 요괴 채록',
    facts: `그슨대는 어둠을 실체화한 한국의 요괴로, '그늘·그믐'에서 이름을 딴 '어둠 속에 선 거대한 것'으로 추정된다.
- 사람을 놀래키는 데 그치는 어둑시니와 달리, 그슨대는 사람을 직접 해치는 악귀에 가깝다.
- 본모습인 그림자를 드러내면 물리 공격으로는 퇴치할 수 없고, 공격받을수록 점점 거대해진다.
- 다만 어둠이 없으면 힘을 쓰지 못해, 여럿이 횃불을 들고 그림자의 본체를 없애면 물리칠 수 있다.
- 어둠과 밤에 대한 원초적 공포가 형상화된 존재다.`,
  },
  '창귀': {
    source: '박지원 「호질」 등 문헌·구전 채록',
    facts: `창귀(倀鬼)는 호랑이에게 죽은 사람의 혼이 호랑이의 종이 되어 새 희생자를 유인한다는 한국·동북아의 요괴다.
- 호랑이에게 잡아먹힌 원혼이 자유로워지려면 다른 사람을 대신 호랑이에게 데려다줘야 한다.
- 밤에 사람의 이름을 세 번까지 부르는데, 세 번 안에 대답하면 홀려서 호랑이에게 걸어간다고 한다.
- 박지원의 「호질」에는 호랑이가 처음 잡아먹은 사람은 굴각(屈閣), 두 번째는 이올(彛兀), 세 번째는 육혼(鬻渾)이라는 창귀가 된다고 나온다.
- 굴각은 집주인을 부엌으로 유인하고, 이올은 사냥꾼의 함정을 망가뜨리며, 육혼은 친했던 사람을 꾀어낸다.
- '위호작창(爲虎作倀)'은 호랑이의 창귀가 된다는 뜻으로, 악한 자의 앞잡이 노릇을 비유하는 고사성어다.`,
  },
  '두억시니': {
    source: '한국 전통 요괴 채록',
    facts: `두억시니는 한국 전설에 등장하는 사나운 귀신으로, 야차(夜叉)의 일종으로 여겨진다.
- 고려 시대의 수호신이었으나 조선에 들어 악하게 변했다는 전승이 있다.
- 사람에게 가위눌림(수면 마비)과 억누르는 듯한 공포를 일으킨다고 한다.
- 몸집을 키우거나 모습을 바꾸는 능력이 있다고 전해진다.`,
  },
  '강철이': {
    source: '한국 속담·전설 채록',
    facts: `강철이는 이무기가 용이 되지 못하고 변한 불의 괴물로, '강철(强鐵)'이라고도 한다.
- 지나가는 곳마다 극심한 열기를 뿜어 초목을 말리고 구름을 증발시켜 가뭄을 일으킨다.
- '강철이 지나간 곳은 가을도 봄'이라는 속담이 전하는데, 곡식이 다 타 죽어 봄처럼 헐벗는다는 뜻이다.
- 용이 되려다 실패한 좌절과 재앙을 상징하는 존재다.`,
  },
  '손각시': {
    source: '한국 무속·민간신앙 채록',
    facts: `손각시는 혼인하지 못하고 죽은 처녀의 원귀로, '왕신·처녀귀신'이라고도 불린다.
- 시집가지 못한 한을 품고 죽어, 혼기의 다른 처녀를 질투해 해코지한다고 여겨졌다.
- 짚으로 만든 인형(제웅)에 깃들어 나타난다고 전해진다.
- 미혼 남성 원귀인 몽달귀신과 짝지어 사혼(영혼결혼식)으로 한을 풀어주는 민속이 있었다.`,
  },
  '자유로 귀신': {
    source: '수도권 도시전설 채록',
    facts: `자유로 귀신은 경기도 자유로에서 목격된다는 현대 도시전설 속 귀신이다.
- 밤중에 자유로를 달리는 운전자 앞에 소복 입은 여성이 갑자기 나타나거나 차에 올라탄다는 목격담이 전한다.
- 태워 달라고 하거나 뒷좌석에 앉아 있다가 사라진다는 이야기가 대표적이다.
- 1990년대~2000년대 수도권에서 운전자들 사이에 퍼진 대표적 고속도로 괴담이다.`,
  },
  '홍콩할매귀신': {
    source: '1990년대 도시전설 채록',
    facts: `홍콩할매귀신은 1990년대 초 한국에서 크게 유행한 도시전설 속 귀신이다.
- 홍콩에서 죽은 할머니가 고양이와 합쳐져 반은 사람 반은 고양이의 모습이 되었다는 이야기가 퍼졌다.
- 빠른 속도로 기어다니며 아이들을 잡아간다는 소문이 초등학생들 사이에 공포로 번졌다.
- 1990년대 학교 괴담의 대표적 사례로, 당시 등하교 공포의 상징이었다.`,
  },
  '장산범': {
    source: '부산일보·경인일보 보도, 목격담 채록',
    facts: `장산범은 부산 해운대구 장산에 출몰한다고 전해지는 괴생명체로, 1990~2000년대 부산 지역을 중심으로 목격담이 퍼진 현대 괴담이다.
- '장산에 나타나는 범'이라는 뜻이며 '와호', '개여시'라는 별칭으로도 불린다.
- 온몸이 여성의 생머리처럼 부드럽고 긴 흰 털로 덮여 있어 얼핏 보면 사람으로 착각한다고 전해진다.
- 목격자들은 '희고 긴 털, 눈코입이 일그러진 모습'이라고 증언했다(부산일보 2019년 보도).
- 사람 목소리를 비롯해 시냇물·바람·개·고양이·아기 울음 등 온갖 소리를 흉내 내 사람을 홀려 유인하는 것이 핵심 특징이다.
- 목격담은 부산 장산에서 시작됐으나 영남·강원·충청·경기까지 광범위하게 퍼졌다.
- 2017년 허정 감독의 공포영화 '장산범'으로 영화화되며 전국적으로 유명해졌다.`,
  },
  '인면견': {
    source: '1990년대 도시전설 채록',
    facts: `인면견은 사람의 얼굴을 한 개의 모습이라는 한국 도시전설 속 존재로, 1980년대 말~1990년대에 크게 유행했다.
- 몸은 개이지만 얼굴이 사람이며 말을 한다고 전해진다.
- 고속도로에서 달리는 자동차를 시속 100km 이상으로 따라와 나란히 달리며 운전자를 쳐다본다는 목격담이 대표적이다.
- 마주친 사람에게 '왜 쳐다봐'라고 말을 걸었다는 이야기가 유명하다.
- 일본의 진멘켄(人面犬) 도시전설과 같은 시기에 유행한 동아시아 공통 괴담 유형이다.`,
  },
  '콩콩귀신': {
    source: '학교괴담 채록',
    facts: `콩콩귀신은 한국 학교괴담에 등장하는 귀신으로, 두 발이 묶이거나 다리가 없어 콩콩 뛰어다닌다 해서 붙은 이름이다.
- 주로 학교 건물·복도·계단에서 밤에 콩콩 뛰는 소리로 존재를 드러낸다.
- 소리는 들리지만 모습이 보이지 않거나, 소복을 입고 뛰어다니는 모습으로 묘사된다.
- 1990~2000년대 초등학교를 중심으로 구전된 대표적 학교괴담이다.`,
  },
  '몽달귀신': {
    source: '한국 전통 귀신 설화 채록',
    facts: `몽달귀신은 결혼하지 못하고 죽은 총각의 귀신으로, '총각귀신'이라고도 하는 한국 전통 귀신이다.
- 혼인하지 못한 채 죽어 이승에 한을 품고 떠도는 원귀의 일종이다.
- 여성 원귀인 처녀귀신(손각시)과 대응되는 남성 짝으로 여겨진다.
- 몽달귀신과 처녀귀신을 혼인시키는 사혼(死婚), 즉 영혼결혼식으로 한을 풀어준다는 민속이 전한다.
- 후사 없이 죽은 이의 한을 달래려는 유교적 관념이 반영된 존재다.`,
  },
  '객귀': {
    source: '한국 무속·민간신앙 채록',
    facts: `객귀는 객지에서 떠돌다 죽거나 제사를 받지 못해 떠도는 잡귀로, 한국 무속·민간신앙에 등장한다.
- 집 밖을 떠도는 무주고혼(無主孤魂)으로, 사람에게 병이나 탈을 일으킨다고 여겨졌다.
- 갑자기 병이 나면 '객귀가 들렸다'며 바가지에 밥과 나물을 담아 물리치는 '객귀물리기(푸닥거리)'를 행했다.
- 객귀물리기는 칼로 위협하고 문밖에 음식을 던지며 침을 뱉는 절차로 이루어진다.
- 제사를 받는 조상신과 대비되는, 돌봄받지 못한 떠돌이 혼령이다.`,
  },
  '에밀레종 설화': {
    source: '성덕대왕신종 관련 구전 설화',
    facts: `에밀레종 설화는 신라 성덕대왕신종(봉덕사종) 주조에 얽힌 구전 설화이다.
- 종을 만들 때 자꾸 실패하자 한 아이를 시주받아 쇳물에 넣어 완성했다는 이야기가 전한다.
- 완성된 종이 울릴 때 '에밀레(어미 때문에)'라고 우는 아이 소리처럼 들린다 하여 '에밀레종'이라 불린다는 것이 설화의 핵심이다.
- 인신공양 모티프가 담긴 대표적 한국 구전 설화이며, 실제 성덕대왕신종은 771년 완성된 통일신라 범종이다.
- 학계에서는 실제 인신공양의 근거는 없고 후대에 덧붙여진 설화로 본다.`,
  },
  '삼두구미': {
    source: '제주도 민간전승 채록',
    facts: `삼두구미는 제주도 민간전승에 등장하는 요호(여우 요괴)의 일종으로, 머리가 셋에 꼬리가 아홉 달린 괴물이다.
- 무덤을 파헤쳐 시신을 파먹는 존재로 전해진다.
- 사람으로 둔갑해 여인을 아내로 삼으려는 등 인간을 홀린다.
- 약점은 무쇳덩이·달걀·동쪽으로 뻗은 버드나무 가지다.
- 무쇠는 불에 넣어도 변하지 않아 삼두구미의 조화가 통하지 않고 가슴을 맞으면 먹먹해진다.
- 달걀을 얼굴에 맞아 범벅이 되면 앞을 못 보게 되어 물리칠 수 있다.`,
  },
  '지네각시': {
    source: '이물교구 설화 채록',
    facts: `지네각시는 지네가 여인으로 둔갑해 사람과 부부의 연을 맺는다는 한국의 이물교구(異物交媾) 설화 속 존재다.
- 가난한 남자가 아름다운 여인을 만나 함께 살며 부유해지는데, 그 여인이 실은 지네의 화신이다.
- 여인의 본모습(지네)을 보아서는 안 된다는 금기가 핵심이며, 남자가 금기를 어기면 인연이 깨진다.
- '팔백이 설화'로도 알려져 있으며 인간이 되려는 요물로 지네가 등장하는 대표 유형이다.
- 은혜와 배신, 금기 위반이라는 설화적 모티프가 담겨 있다.`,
  },
  '노고할미': {
    source: '한국 창세신화 채록',
    facts: `노고할미(노구할미)는 제주도를 비롯한 여러 지역에 전하는 창세신화 속 거인 여신으로, 대지모신적 성격을 지닌다.
- 몸집이 산과 강을 만들 만큼 거대한 창조신으로 묘사된다.
- 산·바위·섬 같은 자연 지형을 만들었다는 지형 창조 설화가 각지에 전한다.
- 제주의 설문대할망, 지리산 마고할미 등과 같은 계열의 거인 여신 신화로 여겨진다.
- 태초의 창조와 풍요를 관장하는 대모신(大母神) 관념이 반영된 존재다.`,
  },
  '혹부리 영감': {
    source: '한국 전래 설화 채록',
    facts: `혹부리 영감은 도깨비를 속여 혹을 떼고 부자가 된 노인의 이야기로, 한국 전역에 전승되는 대표적 도깨비 설화다.
- 착한 혹부리 영감이 산에서 길을 잃고 도깨비 소굴에서 노래를 부르는데, 도깨비들이 '그 좋은 소리가 혹에서 나온다'고 믿는다.
- 도깨비들은 혹을 떼어 가고 그 대가로 보물을 잔뜩 준다.
- 이를 들은 심술궂은 혹부리 영감이 흉내 내지만, 혹을 하나 더 붙이고 매만 맞고 돌아온다.
- 착한 이는 복을 받고 욕심부린 이는 벌을 받는 권선징악의 구조를 지닌다.`,
  },
  '팥죽 할멈과 호랑이': {
    source: '한국 누적형 전래 설화 채록',
    facts: `〈팥죽 할멈과 호랑이〉는 할머니를 잡아먹으려는 호랑이를 여러 사물이 협력해 물리치는 한국의 누적형(연쇄) 전래 설화다.
- 호랑이가 팥죽을 쑤는 할머니를 잡아먹으려 하자 할머니는 팥죽을 다 쑤어 먹을 때까지 기다려 달라고 한다.
- 알밤·자라·물찌똥·송곳·지게·멍석 등이 할머니의 사연을 듣고 도와주기로 한다.
- 밤은 호랑이 눈에 튀고, 자라는 손을 물고, 물찌똥에 미끄러지며, 멍석에 말려 지게에 실려 물에 버려진다.
- 작고 하찮은 것들이 힘을 합쳐 강자를 이긴다는 주제를 담은 대표적 누적담이다.`,
  },
};

// ── 데이터 로드 ──
const data = loadData();
const byName = {};
for (const co of data) for (const b of co.b) { byName[b.n] = b; byName[b.ln] = b; }

// ── OpenAI ──
async function chat(messages) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      return JSON.parse((await res.json()).choices[0].message.content);
    } catch (e) { if (i === 2) throw e; await new Promise(r => setTimeout(r, 4000)); }
  }
}

async function generate(creature, factSource) {
  const gen = await chat([
    {
      role: 'system',
      content: `제공된 사실 자료만 사용해 "${creature.ln || creature.n}"의 심화 아티클을 한국어로 작성하세요.
절대 규칙: 자료에 있는 내용만 사용, 없는 사실 추가·추측 금지. 자료에 없는 섹션은 빈 문자열("").
담백한 백과사전체. 자료가 허용하는 한 상세하게.
JSON: {"origin":"기원·유래","legend":"전승 내용","variants":"이형·별칭(없으면 \\"\\")","culture":"문헌·현대 수용(없으면 \\"\\")"}`,
    },
    { role: 'user', content: `[대상: ${creature.ln || creature.n}]\n${factSource}` },
  ]);
  const body = ['origin', 'legend', 'variants', 'culture'].map(k => gen[k]).filter(Boolean).join('\n\n');
  if (body.length < 150) return null;
  const v = await chat([
    { role: 'system', content: '아티클의 각 주장이 자료에 근거하는지 검증. 자료에 없는 창작·추측이 있으면 불합격. JSON: {"grounded":true|false}' },
    { role: 'user', content: `[자료]\n${factSource}\n\n[아티클]\n${body}` },
  ]);
  return v.grounded === true ? gen : null;
}

async function translate(koArticle, locale) {
  const names = { en: 'English', zh: 'Simplified Chinese', ja: 'Japanese' };
  return chat([
    { role: 'system', content: `Translate this Korean folklore article JSON to ${names[locale]}. Keep keys and structure. Empty strings stay empty. Proper nouns recognizable. Return only JSON.` },
    { role: 'user', content: JSON.stringify(koArticle) },
  ]);
}

// ── 실행 ──
let ok = 0, skip = 0, fail = 0;
for (const [name, block] of Object.entries(FACT_BLOCKS)) {
  const creature = byName[name];
  if (!creature) { console.log(`   ❓ ${name} — 데이터에 없음`); skip++; continue; }
  if (fs.existsSync(path.join(OUT_DIR, `${creature.id}.json`))) { console.log(`   ⏭️ ${name} — 아티클 이미 있음`); skip++; continue; }
  // 사실 블록 + 크리처 자체 데이터 결합
  const own = [creature.d, (creature.ab || []).length ? '능력: ' + creature.ab.join(', ') : '',
    (creature.wk || []).length ? '약점: ' + creature.wk.join(', ') : ''].filter(Boolean).join('\n');
  const factSource = `${block.facts}\n\n[도감 기록]\n${own}`;
  try {
    const ko = await generate(creature, factSource);
    if (!ko) { console.log(`   ❌ ${name} — 검증 탈락/내용 부족`); fail++; continue; }
    const [en, zh, ja] = await Promise.all([translate(ko, 'en'), translate(ko, 'zh'), translate(ko, 'ja')]);
    const out = { sourceTitle: block.source, sourceLang: 'ko', factBased: true, generatedAt: new Date().toISOString(), locales: { ko, en, zh, ja } };
    if (APPLY) fs.writeFileSync(path.join(OUT_DIR, `${creature.id}.json`), JSON.stringify(out, null, 1));
    console.log(`   ✅ ${name} (${creature.id})`);
    ok++;
  } catch (e) { console.log(`   ⚠️ ${name} — ${e.message}`); fail++; }
}

console.log(`\n생성 ${ok} / 스킵 ${skip} / 실패 ${fail}${APPLY ? '' : '  (드라이런 — --apply로 저장)'}`);
