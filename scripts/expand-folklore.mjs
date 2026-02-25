#!/usr/bin/env node
// ============================================================
// 설화 대확장 스크립트
// 1) 기존 609개 크리처에 ct(설화분류) 태그 추가
// 2) 150+ 새 크리처 추가 (신화/전설/민담 전 영역)
// 3) UI 표시용 ct 필드: "myth" | "legend" | "folktale"
// ============================================================

import fs from 'fs';
import path from 'path';

// ─── 데이터 로드 ───
function loadData() {
  const content = fs.readFileSync(path.join(process.cwd(), 'components', 'FolkloreMap.jsx'), 'utf8');
  const startIdx = content.indexOf('const FOLKLORE_DATA = ') + 'const FOLKLORE_DATA = '.length;
  let depth = 0, endIdx = startIdx;
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  return JSON.parse(content.substring(startIdx, endIdx));
}

// ─── 데이터 저장 ───
function saveData(data) {
  const fmPath = path.join(process.cwd(), 'components', 'FolkloreMap.jsx');
  let content = fs.readFileSync(fmPath, 'utf8');
  const startIdx = content.indexOf('const FOLKLORE_DATA = ') + 'const FOLKLORE_DATA = '.length;
  let depth = 0, endIdx = startIdx;
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  const newDataStr = JSON.stringify(data);
  content = content.substring(0, startIdx) + newDataStr + content.substring(endIdx);
  fs.writeFileSync(fmPath, content, 'utf8');
}

// ─── 크리처 생성 헬퍼 ───
function mk(iso, ln, n, t, f, d, ab, wk, vk, src, ct) {
  const slug = ln.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    n, t, f, d,
    id: `${iso.toLowerCase()}-${slug}`,
    ln, src,
    ab, wk, vk,
    gf: f >= 8 ? ["Horror","Dark Fantasy"] : f >= 6 ? ["Fantasy","Drama"] : f >= 4 ? ["Fantasy","Adventure"] : ["Fantasy","Family"],
    sh: d.substring(0, 60),
    ip: `${n}(${ln}) — ${ct === 'myth' ? '신화' : ct === 'folktale' ? '민담' : '전설'} 기반 ${t} IP. ${f >= 7 ? '공포/스릴러' : f >= 5 ? '판타지/드라마' : '모험/가족'} 장르.`,
    ct,
  };
}

// ═══════════════════════════════════════════════════════════════
//  PART 1: 기존 크리처 분류 (ct 태그)
// ═══════════════════════════════════════════════════════════════

// 수동 분류 (잘 알려진 존재들)
const MANUAL_CT = {
  // Korea - myth
  'kr-haetae': 'myth', 'kr-imugi': 'myth', 'kr-yeomra-daewang': 'myth',
  'kr-jeoseung-saja': 'myth', 'kr-samsinghalmi': 'myth', 'kr-sansin-horangi': 'myth',
  'kr-cheoyong': 'myth', 'kr-baekho': 'myth', 'kr-gyeryong': 'myth',
  'kr-geumgapjanggun': 'myth', 'kr-yeongnoh': 'myth', 'kr-geoin': 'myth',
  // Korea - folktale
  'kr-dokkaebi': 'folktale', 'kr-gumiho': 'folktale', 'kr-dokkaebibul': 'folktale',
  'kr-duduri': 'folktale', 'kr-bulgasari': 'folktale', 'kr-ineo': 'folktale',
  'kr-songgaksi': 'folktale', 'kr-gildar': 'folktale', 'kr-hongnansamnyo': 'folktale',
  // Japan
  'jp-kappa': 'folktale', 'jp-oni': 'myth', 'jp-tengu': 'myth',
  'jp-yurei': 'legend', 'jp-kuchisake-onna': 'legend', 'jp-jorogumo': 'legend',
  // China
  'cn-jiangshi': 'legend', 'cn-mogwai': 'folktale', 'cn-nian': 'myth',
  'cn-yaoguai': 'legend', 'cn-hundun': 'myth', 'cn-taotie': 'myth',
  // Norway - myth
  'no-fenrir': 'myth', 'no-jormungandr': 'myth', 'no-sleipnir': 'myth',
  'no-hugin-munin': 'myth', 'no-nidhogg': 'myth', 'no-helhest': 'myth',
  'no-kraken': 'legend', 'no-draugr': 'legend', 'no-troll': 'folktale',
  'no-huldra': 'folktale', 'no-nokken': 'folktale', 'no-nisse': 'folktale',
  // Greece
  'gr-vrykolakas': 'legend', 'gr-lamia': 'myth', 'gr-empusa': 'myth',
  // Egypt
  'eg-ammit': 'myth', 'eg-apep': 'myth', 'eg-sphinx': 'myth',
  // India
  'in-rakshasa': 'myth', 'in-vetala': 'legend', 'in-churel': 'legend',
  // Ireland
  'ie-dullahan': 'legend', 'ie-changeling': 'folktale',
  // Americas - myth
  'mx-quetzalcoatl': 'myth', 'mx-cihuateteo': 'myth', 'mx-tzitzimimeh': 'myth',
  'pe-supay': 'myth', 'pe-amaru': 'myth',
  // Mesopotamia
  'iq-pazuzu': 'myth', 'iq-utukku': 'myth', 'iq-lamashtu': 'myth',
  // Iran
  'ir-div': 'myth', 'ir-jinn': 'myth', 'ir-manticore': 'myth',
  // Australia
  'au-rainbow-serpent': 'myth', 'au-bunyip': 'legend',
  // NZ
  'nz-taniwha': 'myth', 'nz-patupaiarehe': 'myth',
  // West Africa
  'gh-anansi': 'folktale', 'ng-mami-wata': 'legend',
  // Americas
  'us-wendigo': 'legend', 'us-thunderbird': 'myth',
  'br-curupira': 'folktale', 'br-iara': 'folktale',
};

function autoClassify(creature) {
  if (MANUAL_CT[creature.id]) return MANUAL_CT[creature.id];

  const t = (creature.t || '').toLowerCase();
  const d = (creature.d || '').toLowerCase();
  const n = (creature.n || '') + ' ' + (creature.ln || '').toLowerCase();

  // Myth indicators
  if (t.includes('deity') || t.includes('divine') || t.includes('god') ||
      t.includes('primordial') || t.includes('titan') || t.includes('cosmic')) return 'myth';
  if (d.includes('창세') || d.includes('creation') || d.includes('세계를 ') ||
      d.includes('primordial') || d.includes('세상의 시작')) return 'myth';

  // Folktale indicators
  if (t.includes('trickster') || t.includes('fairy') || t === 'fairy') return 'folktale';
  if (d.includes('민담') || d.includes('옛날이야기') || d.includes('fairy tale') ||
      d.includes('folktale') || d.includes('교훈') || d.includes('이야기에 등장')) return 'folktale';

  // Default to legend
  return 'legend';
}

// ═══════════════════════════════════════════════════════════════
//  PART 2: 새 크리처 데이터
// ═══════════════════════════════════════════════════════════════

const NEW_BY_COUNTRY = {

  // ──────────── GREECE (Southern Europe) ────────────
  GR: [
    mk('gr','Medusa','메두사','Gorgon',8,
      '뱀 머리카락과 돌로 만드는 시선을 가진 고르곤 세 자매 중 하나. 한때 아름다운 여인이었으나 아테나의 저주로 괴물이 되었다. 페르세우스에 의해 목이 잘렸으며, 그 머리는 잘린 후에도 석화의 힘을 간직했다.',
      ['석화 시선','뱀 머리카락 공격','불멸의 두부'],['거울 반사','목 절단','페르세우스의 방패'],
      ['snake hair','stone gaze','female monster','green skin'],'그리스 신화','myth'),
    mk('gr','Minotaur','미노타우로스','Beast',8,
      '크레타 미궁 깊숙이 갇힌 반인반우의 괴물. 미노스 왕의 아내 파시파에와 황소 사이에서 태어났다. 매년 아테네에서 바쳐진 젊은이들을 잡아먹었으며, 영웅 테세우스에 의해 쓰러졌다.',
      ['괴력','미궁 탐지','돌진 공격'],['아리아드네의 실','테세우스의 검'],
      ['bull head','human body','labyrinth','horns'],'그리스 신화','myth'),
    mk('gr','Cerberus','케르베로스','Beast',9,
      '하데스의 명계 입구를 지키는 세 머리 개. 산 자의 입장과 죽은 자의 탈출을 막는다. 뱀으로 이루어진 갈기와 독사 꼬리를 가졌다. 헤라클레스가 열두 과업의 마지막으로 생포했다.',
      ['세 머리 공격','독 이빨','명계 수호'],['음악(오르페우스의 리라)','꿀 케이크','헤라클레스의 힘'],
      ['three heads','dog','hellhound','chains','dark'],'그리스 신화','myth'),
    mk('gr','Hydra','히드라','Serpent',9,
      '레르나 늪에 사는 머리 아홉 개의 물뱀. 머리 하나를 잘라도 그 자리에서 둘이 자라나며, 가운데 머리는 불멸이다. 헤라클레스가 이올라오스의 도움으로 잘린 목을 불로 지져 퇴치했다.',
      ['재생 머리','맹독 숨결','불멸의 중앙 머리'],['불로 지지기','중앙 머리 봉인'],
      ['nine heads','serpent','swamp','regenerating'],'그리스 신화','myth'),
    mk('gr','Cyclops','퀴클롭스','Giant',7,
      '이마 한가운데에 거대한 눈 하나만 가진 외눈 거인족. 제우스의 번개, 포세이돈의 삼지창, 하데스의 투명 투구를 만든 대장장이이기도 하다. 오디세우스는 폴리페모스의 눈을 불에 달군 말뚝으로 찔러 탈출했다.',
      ['괴력','바위 투척','대장간 기술'],['눈 공격','지혜로운 속임수'],
      ['one eye','giant','forge','boulder'],'그리스 신화','myth'),
    mk('gr','Chimera','키마이라','Monster',8,
      '사자의 머리, 염소의 몸, 뱀의 꼬리를 가진 합성 괴물. 불을 내뿜으며 리키아 지방을 공포에 몰아넣었다. 영웅 벨레로폰이 천마 페가수스를 타고 하늘에서 납덩이 창을 던져 퇴치했다.',
      ['화염 숨결','세 동물의 능력','비행(날개 변종)'],['하늘 공격','납 용해 전략'],
      ['lion head','goat body','snake tail','fire breath'],'그리스 신화','myth'),
    mk('gr','Siren','세이렌','Spirit',7,
      '아름다운 노래로 뱃사람을 유혹해 바위에 난파시키는 바다의 요녀. 반인반조의 모습으로 묘사된다. 오디세우스는 자신을 돛대에 묶어 노래를 듣고도 살아남은 유일한 인간이다.',
      ['매혹의 노래','환각 유발','바람 조종'],['귀마개(밀랍)','속박','오르페우스의 노래'],
      ['bird woman','singing','rocky shore','feathers'],'그리스 신화','myth'),
    mk('gr','Harpy','하르피아이','Monster',6,
      '여인의 얼굴에 독수리의 몸을 가진 바람의 정령. 악취를 풍기며 음식을 더럽히고 약탈한다. 제우스의 명으로 예언자 피네우스를 괴롭히는 형벌 집행자로 보내졌다.',
      ['급습 비행','음식 오염','발톱 공격','악취'],['보레아데스 형제','금속 무기'],
      ['bird body','woman face','talons','wings'],'그리스 신화','myth'),
    mk('gr','Centaur','켄타우로스','Beast',6,
      '상반신은 인간, 하반신은 말인 종족. 대부분 야만적이고 술에 취해 폭력적이나, 케이론은 현명한 스승으로 아킬레우스와 아스클레피오스를 가르쳤다.',
      ['궁술','돌진','약초학(케이론)'],['술','함정'],
      ['half horse','half human','bow','wild'],'그리스 신화','myth'),
    mk('gr','Pegasus','페가수스','Divine Beast',4,
      '메두사가 참수당할 때 목에서 태어난 순백의 날개 달린 말. 벨레로폰을 태우고 키마이라를 물리쳤다. 후에 올림포스로 올라가 제우스의 번개를 나르는 역할을 맡았다.',
      ['비행','번개 운반','신성한 속도'],['오만한 기수(추락)','제우스의 명령'],
      ['white horse','wings','flying','divine'],'그리스 신화','myth'),
    mk('gr','Typhon','티폰','Primordial',10,
      '가이아와 타르타로스의 아들, 올림포스 신들조차 두려워한 최강의 괴물. 백 개의 용 머리에서 불을 내뿜으며, 허리 아래는 거대한 뱀 두 마리로 이루어져 있다. 제우스와의 최후의 전투 끝에 에트나 산 아래 봉인되었다.',
      ['화염 숨결','지진 유발','태풍 소환','신을 압도하는 힘'],['제우스의 번개','에트나 산 봉인'],
      ['hundred dragon heads','giant serpent','volcanic','storm'],'그리스 신화','myth'),
    mk('gr','Scylla','스킬라','Sea Monster',8,
      '메시나 해협의 바위 동굴에 사는 여섯 머리 괴물. 각 머리에 세 줄의 이빨이 있으며, 지나가는 배에서 선원 여섯을 한 번에 낚아챈다. 반대편에는 소용돌이 카리브디스가 있어 양쪽 모두 피할 수 없다.',
      ['여섯 머리 공격','선원 포획','바위 위장'],['접근 불가','오디세우스의 선택'],
      ['six heads','sea cave','tentacles','teeth'],'그리스 신화','myth'),
  ],

  // ──────────── NORWAY (Northern Europe) — 추가 ────────────
  NO: [
    mk('no','Valkyrie','발키리','Divine',7,
      '오딘의 전사 처녀들. 전장을 날아다니며 전사할 영웅을 선택하고, 그들의 영혼을 발할라로 인도한다. 갑옷과 창으로 무장하며, 그들이 지나가면 오로라가 하늘을 비춘다.',
      ['전사 선택','발할라 인도','전투 축복','비행'],['오딘의 명령','룬 마법'],
      ['armored maiden','wings','spear','aurora','battlefield'],'노르드 신화','myth'),
    mk('no','Surt','수르트','Primordial',10,
      '무스펠헤임(불의 세계)의 지배자. 라그나로크 때 불의 검을 들고 비프로스트(무지개 다리)를 건너 아스가르드를 불태운다. 프레이와의 전투에서 승리하고, 세계를 화염으로 뒤덮는다.',
      ['불의 검','세계 소각','불멸의 육체'],['운명(라그나로크)','프레이의 검'],
      ['fire giant','flaming sword','lava','ragnarok'],'노르드 신화','myth'),
    mk('no','Jotun','요툰','Giant',7,
      '서리 거인족. 신들보다 먼저 존재했으며, 아스가르드와 끊임없이 대립한다. 이미르의 후손으로, 거대한 체구와 원소의 힘을 가졌다. 토르의 주적이다.',
      ['서리 마법','괴력','원소 조종','변신'],['토르의 망치','신들의 마법'],
      ['frost giant','ice','massive','ancient'],'노르드 신화','myth'),
  ],

  // ──────────── KOREA (East Asia) — 신화/민담 확장 ────────────
  KR: [
    mk('kr','Dangun','단군','Demigod',3,
      '한민족의 시조. 환웅과 웅녀(곰에서 인간이 된 여인) 사이에서 태어나 고조선을 건국했다. 1500년간 나라를 다스린 후 산신이 되었다. 한국 건국신화의 중심 인물.',
      ['신성한 통치','불멸','산신 변화'],['없음'],
      ['ancient king','divine light','mountain','bear totem'],'한국 건국신화','myth'),
    mk('kr','Ungnyeo','웅녀','Divine',3,
      '쑥과 마늘만 먹으며 100일간 동굴에서 버텨 인간 여인이 된 곰. 환웅과 혼인하여 단군을 낳았다. 인내와 변화의 상징으로, 한국 건국신화의 핵심 존재.',
      ['변신(곰→인간)','신성한 인내','생명 창조'],['빛을 보면 실패'],
      ['bear woman','cave','garlic','divine transformation'],'한국 건국신화','myth'),
    mk('kr','Samjogo','삼족오','Divine Beast',4,
      '태양 안에 산다는 세 발 달린 까마귀. 고구려의 상징으로, 태양의 정기를 품고 있다. 고구려 고분벽화에 자주 등장하며, 천상계와 지상을 잇는 신성한 메신저이다.',
      ['태양 에너지','비행','신성한 메시지 전달'],['달의 힘(월식)'],
      ['three-legged crow','sun','golden','divine bird'],'고구려 신화','myth'),
    mk('kr','Bonghwang','봉황','Divine Beast',3,
      '다섯 가지 색의 깃털을 가진 신성한 새. 어진 군주가 세상을 다스릴 때만 나타난다. 머리는 하늘, 눈은 태양, 등은 달, 날개는 바람, 꼬리는 별을 상징한다.',
      ['상서로운 출현','불의 정화','평화의 기운'],['부당한 세상에는 나타나지 않음'],
      ['phoenix','five colors','divine bird','auspicious'],'동양 신화','myth'),
    mk('kr','Yongwang','용왕','Dragon King',5,
      '바다를 다스리는 신. 수정궁에 거주하며, 비와 홍수를 관장한다. 별주부전에서 토끼의 간을 구하러 자라를 보낸 용왕으로 유명하다. 어부와 항해자들의 숭배 대상.',
      ['바다 지배','폭풍 소환','수중 궁전'],['육지에서의 약화','속임수에 약함'],
      ['dragon king','ocean palace','crown','underwater throne'],'한국 신화/민담','myth'),
    mk('kr','Seonnyeo','선녀','Celestial Fairy',3,
      '하늘에서 내려와 목욕하는 천상의 여인. 나무꾼이 날개옷을 숨기면 하늘로 돌아가지 못한다. 「선녀와 나무꾼」의 주인공으로, 한국 대표 민담의 상징.',
      ['비행(날개옷)','천상의 아름다움','승천'],['날개옷 분실','지상의 인연'],
      ['celestial maiden','feathered robe','bathing','waterfall'],'한국 민담','folktale'),
    mk('kr','Byeoljubu','별주부','Trickster',3,
      '용왕의 신하인 충직한 자라. 용왕의 병을 고치기 위해 토끼의 간을 구하러 육지로 올라온다. 「별주부전(토끼전)」의 핵심 캐릭터로, 충성과 속임수의 갈등을 보여준다.',
      ['설득력','수륙 양용','충성심'],['토끼의 기지에 당함'],
      ['turtle','messenger','loyal servant','amphibious'],'별주부전','folktale'),
    mk('kr','Janghwa-Hongryeon','장화홍련','Vengeful Ghost',7,
      '계모의 학대로 죽임당한 두 자매의 원귀. 매 부임하는 원님의 꿈에 나타나 억울함을 호소한다. 조선시대 실화를 바탕으로 한 대표적 원귀담으로, 여러 차례 영화화되었다.',
      ['꿈 침투','원한의 울음','진실 폭로'],['원한 해소(범인 처벌)'],
      ['two sister ghosts','white hanbok','weeping','vengeful'],'장화홍련전','folktale'),
    mk('kr','Cheonma','천마','Divine Beast',4,
      '하늘을 나는 신성한 말. 천마총 출토 장니에 그려진 백마로 유명하다. 신라 왕족의 기마 문화와 연결되며, 천상과 지상을 오가는 신성한 교통수단이다.',
      ['비행','초자연적 속도','신성한 기운'],['지상에 오래 머물 수 없음'],
      ['white winged horse','divine','flying','celestial'],'신라 신화','myth'),
    mk('kr','Bulgae','불개','Cosmic Beast',6,
      '가름나라(어둠의 나라)의 불개. 해와 달을 잡아먹으려고 쫓아가지만, 해는 너무 뜨겁고 달은 너무 차가워 매번 뱉어낸다. 일식과 월식의 원인으로 전해진다.',
      ['해/달 추격','화염 털','천체 포식'],['극한 온도','실패의 운명'],
      ['fire dog','chasing sun','eclipse','cosmic'],'한국 창세신화','myth'),
  ],

  // ──────────── JAPAN (East Asia) — 신화/민담 확장 ────────────
  JP: [
    mk('jp','Amaterasu','아마테라스','Sun Deity',3,
      '일본 신화 최고의 여신, 태양의 신. 스사노오의 행패에 분노하여 아마노이와토(천암호)에 숨어 세계를 암흑으로 만들었다. 야타노카가미(팔지경)로 유인해 다시 세상에 빛을 가져왔다.',
      ['태양 지배','신성한 빛','거울의 힘'],['분노로 인한 은둔'],
      ['sun goddess','golden light','mirror','radiant'],'일본 신화(고사기)','myth'),
    mk('jp','Susanoo','스사노오','Storm Deity',7,
      '폭풍과 바다의 신. 아마테라스의 동생으로, 난폭한 성격으로 천상에서 추방되었다. 이즈모에서 야마타노오로치(八岐大蛇)를 퇴치하고 쿠시나다히메를 구했다.',
      ['폭풍 소환','검술','용 퇴치'],['감정 기복','신들의 추방'],
      ['storm god','wild hair','sword','lightning'],'일본 신화(고사기)','myth'),
    mk('jp','Izanami','이자나미','Death Deity',9,
      '이자나기와 함께 일본 열도를 창조한 여신. 불의 신 카구츠치를 낳다 죽어 황천국(黃泉國)으로 갔다. 이자나기가 찾아왔을 때 부패한 모습이 드러나 분노하여 하루에 천 명을 죽이겠다 맹세했다.',
      ['죽음의 저주','하루 천 명 살해','황천국 지배'],['이자나기의 봉인'],
      ['rotting goddess','underworld queen','dark','maggots'],'일본 신화(고사기)','myth'),
    mk('jp','Yamata no Orochi','야마타노오로치','Dragon',10,
      '머리 여덟, 꼬리 여덟의 거대한 뱀. 매년 소녀 한 명을 제물로 요구했다. 스사노오가 술에 취하게 한 뒤 참수하여 퇴치했으며, 꼬리에서 천총운검(아메노무라쿠모노츠루기)이 나왔다.',
      ['여덟 머리 공격','산과 골짜기를 뒤덮는 거체','맹독'],['술(酒)','스사노오의 검술'],
      ['eight heads','giant serpent','mountain-sized','red eyes'],'일본 신화(고사기)','myth'),
    mk('jp','Nue','누에','Chimera',7,
      '원숭이의 얼굴, 너구리의 몸, 뱀의 꼬리, 호랑이의 사지를 가진 합성 괴물. 밤마다 검은 구름을 타고 나타나 천황을 괴롭혔다. 미나모토노 요리마사가 활로 쏘아 퇴치했다.',
      ['흑운 소환','질병 유발','변신'],['활의 명사수','신성한 화살'],
      ['monkey face','raccoon body','snake tail','black cloud'],'헤이케 모노가타리','legend'),
    mk('jp','Tsuchigumo','쓰치구모','Giant Spider',8,
      '산 속에 사는 거대한 거미 요괴. 아름다운 여인이나 승려로 변신하여 무사를 유인한 뒤 거미줄로 옭아맨다. 라이코(미나모토노 요리미쓰)에 의해 퇴치된 것으로 유명하다.',
      ['거대 거미줄','변신','독 공격'],['명검','불'],
      ['giant spider','shape-shifting','web','cave'],'일본 전설','legend'),
    mk('jp','Kaguya-hime','카구야히메','Celestial Being',3,
      '빛나는 대나무 속에서 발견된 아름다운 소녀. 자라서 천하제일의 미녀가 되었으나, 다섯 귀족의 구혼을 불가능한 과제로 거절했다. 보름달에 달의 사자들이 데려가 승천했다.',
      ['불멸의 약','달의 귀환','초자연적 아름다움'],['달의 소환(보름달)'],
      ['moon princess','bamboo','luminous','celestial robe'],'다케토리 모노가타리','folktale'),
    mk('jp','Umibōzu','우미보즈','Sea Monster',8,
      '폭풍우 치는 바다에서 솟아오르는 거대한 검은 그림자. 둥근 대머리 머리만 수면 위에 보이며, 배를 뒤집거나 국자를 달라고 해서 물을 퍼넣어 침몰시킨다.',
      ['배 전복','폭풍 동반','해수 공격'],['바닥 빠진 국자','회피'],
      ['giant black shadow','bald head','ocean','storm'],'일본 해양 전설','legend'),
    mk('jp','Momotaro','모모타로','Hero',3,
      '거대한 복숭아에서 태어난 소년 영웅. 개, 원숭이, 꿩을 동료로 삼아 오니가시마(鬼ヶ島)로 가서 오니를 퇴치하고 보물을 되찾았다. 일본 가장 유명한 민담의 주인공.',
      ['초인적 힘','동물 동료 소환','용기'],['순수함'],
      ['boy hero','peach','dog monkey pheasant','treasure'],'일본 5대 민담','folktale'),
  ],

  // ──────────── CHINA (East Asia) — 신화 확장 ────────────
  CN: [
    mk('cn','Sun Wukong','손오공','Divine Trickster',8,
      '화과산의 돌에서 태어난 원숭이 왕. 72가지 변신술과 근두운(筋斗雲)으로 천궁을 뒤집어놓았다. 오백 년간 오행산에 봉인된 후 삼장법사와 서역 취경길에 올랐다.',
      ['72변신','근두운(구름 타기)','여의봉','불멸의 육체'],['긴고아(머리띠 주문)','부처의 손바닥'],
      ['monkey king','golden armor','staff','cloud riding'],'서유기/중국 신화','myth'),
    mk('cn','Nuwa','여와','Creator Deity',4,
      '인류를 창조한 여신. 황토로 인간을 빚었으며, 공공이 부주산을 들이받아 하늘이 무너졌을 때 오색석으로 하늘을 꿰맸다. 반인반사(半人半蛇)의 모습으로 묘사된다.',
      ['인류 창조','하늘 수복','만물 변화'],['없음'],
      ['snake body woman','five colored stones','creation','serpentine'],'중국 창세신화','myth'),
    mk('cn','Pangu','반고','Primordial',5,
      '혼돈의 알에서 태어나 천지를 분리한 최초의 존재. 1만 8천 년 동안 하늘과 땅 사이에서 자라며 둘을 밀어냈다. 죽은 후 몸이 산, 강, 바람, 구름이 되어 세계를 이루었다.',
      ['천지 분리','우주 창조','육체의 세계화'],['수명 한계'],
      ['giant primordial','axe','cosmic egg','mountains forming'],'중국 창세신화','myth'),
    mk('cn','Qilin','기린','Divine Beast',2,
      '성인이 태어날 때 나타나는 상서로운 동물. 사슴의 몸에 용의 머리, 소의 꼬리를 가졌다. 풀 한 포기도 밟지 않을 만큼 자비롭다. 공자 탄생 시 나타났다고 전해진다.',
      ['상서로운 출현','악을 감지','평화의 기운'],['나타남 자체가 드묾'],
      ['deer body','dragon head','gentle','auspicious','golden'],'중국 신화','myth'),
    mk('cn','Fenghuang','봉황(鳳凰)','Divine Bird',3,
      '중국의 불사조. 수컷 봉(鳳)과 암컷 황(凰)의 합체로, 모든 새의 왕이다. 오동나무에만 앉고 대나무 열매만 먹는다. 황후의 상징으로, 용과 함께 제왕의 쌍벽을 이룬다.',
      ['불의 정화','상서로운 출현','모든 새의 지휘'],['태평성대에만 출현'],
      ['phoenix','five colors','flames','regal bird'],'중국 신화','myth'),
    mk('cn','Bai She','백사','Serpent Spirit',6,
      '천 년 수련한 백사 요정. 인간 남자 허선을 사랑하여 미녀로 변신해 결혼했다. 파해승 법해에 의해 정체가 드러나 뇌봉탑 아래 봉인되었다. 중국 4대 민간 전설 중 하나.',
      ['인간 변신','수술(水術)','뇌우 소환'],['법해의 금산사 법력','뇌봉탑 봉인','웅황주(술)'],
      ['white snake','beautiful woman','rain','pagoda'],'백사전','folktale'),
    mk('cn','Nezha','나타','Divine Hero',7,
      '탁탑천왕 이정의 셋째 아들. 어머니 뱃속에서 3년 6개월 만에 태어났으며, 동해용왕의 아들을 죽이고 자결했다 연꽃으로 부활했다. 풍화륜과 혼천릉을 무기로 쓴다.',
      ['풍화륜(불바퀴)','혼천릉(비단)','삼두육비 변신','비행'],['아버지의 탑'],
      ['child warrior','fire wheels','silk sash','lotus rebirth'],'봉신연의','myth'),
    mk('cn','Tiangou','천구','Cosmic Beast',7,
      '하늘의 개. 해와 달을 삼켜 일식과 월식을 일으킨다. 사람들이 냄비와 북을 두드려 소리를 내면 놀라 뱉어낸다고 전해진다. 한국의 불개와 유사한 존재.',
      ['천체 포식','비행','재앙 유발'],['시끄러운 소리','폭죽'],
      ['celestial dog','swallowing moon','eclipse','black fur'],'중국 신화','myth'),
  ],

  // ──────────── INDIA (South Asia) — 신화 확장 ────────────
  IN: [
    mk('in','Garuda','가루다','Divine Bird',6,
      '비슈누 신의 기마(바하나). 독수리의 몸에 인간의 상체를 가진 새들의 왕. 나가(뱀)족의 천적으로, 어머니를 구하기 위해 신들의 불사약 암리타를 훔쳤다.',
      ['초고속 비행','뱀 퇴치','태양에 필적하는 광휘'],['비슈누의 명령'],
      ['eagle man','golden wings','serpent enemy','divine mount'],'힌두 신화(마하바라타)','myth'),
    mk('in','Naga','나가','Serpent',6,
      '반인반사(半人半蛇)의 신성한 뱀 족. 지하세계 파탈라를 지배하며 보석과 지혜를 수호한다. 바수키는 세계의 뱀왕으로 유해교반(乳海攪拌)에서 밧줄 역할을 했다.',
      ['독 공격','물 조종','변신','지혜 수호'],['가루다','만트라'],
      ['cobra hood','jewel forehead','serpentine','underground palace'],'힌두/불교 신화','myth'),
    mk('in','Hanuman','하누만','Divine',5,
      '원숭이 신. 라마야나에서 라마의 가장 충실한 종자로, 시타를 구하기 위해 바다를 뛰어넘어 랑카로 갔다. 산을 통째로 들어올리는 괴력과 자유자재로 몸 크기를 바꾸는 능력을 가졌다.',
      ['괴력','비행','몸 크기 변화','불멸'],['라마에 대한 절대 충성'],
      ['monkey god','flying','mountain lifting','devoted warrior'],'라마야나','myth'),
    mk('in','Ravana','라바나','Demon King',9,
      '랑카의 십두 마왕. 열 개의 머리와 스무 개의 팔을 가진 라크샤사의 왕. 시바 신에게서 불사의 축복을 받았으나, "인간에게는 죽을 수 있다"는 약점을 간과했다. 라마에 의해 쓰러졌다.',
      ['십두이십비','비행 전차(푸쉬파카)','시바의 축복','막강한 주력'],['인간(라마)','배꼽의 암리타'],
      ['ten heads','twenty arms','demon king','golden palace'],'라마야나','myth'),
    mk('in','Asura','아수라','Demon',7,
      '신(데바)과 대립하는 반신적 존재 종족. 권력과 물질적 욕망으로 가득 차 있으나, 가공할 수행력으로 브라흐마에게 축복을 받기도 한다. 선과 악의 이분법을 넘어서는 복잡한 존재.',
      ['수행으로 얻은 특수 능력','괴력','마법'],['데바(신)의 전략','비슈누의 개입'],
      ['powerful demon','multiple arms','golden armor','fierce'],'힌두 신화(베다)','myth'),
    mk('in','Gandharva','간다르바','Celestial Being',4,
      '천상의 음악가. 하늘 궁전에서 신들을 위해 연주하며, 소마주를 수호한다. 아름다운 외모와 음악으로 인간 세계에도 영향을 미치며, 압사라와 짝을 이룬다.',
      ['천상의 음악','환각 유발','비행'],['특정 만트라'],
      ['celestial musician','golden skin','flying','ethereal'],'힌두 신화(베다)','myth'),
    mk('in','Makara','마카라','Sea Monster',6,
      '악어와 물고기의 합성 해양 괴물. 바루나(수신)의 바하나이자 갠지스강 여신의 수호자. 사원 입구의 수호상으로 흔히 조각되며, 수중 보물의 수호자이다.',
      ['수중 전투','강력한 턱','물 조종'],['건조한 환경'],
      ['crocodile fish hybrid','jeweled','water guardian','temple'],'힌두 신화','myth'),
  ],

  // ──────────── EGYPT (North Africa) — 신화 확장 ────────────
  EG: [
    mk('eg','Anubis','아누비스','Death Deity',6,
      '자칼 머리의 죽음과 미라화의 신. 죽은 자의 영혼을 심판의 전당으로 인도하고, 심장을 마아트의 깃털과 저울에 달아 무게를 재는 의식을 집행한다.',
      ['영혼 인도','미라화 기술','심판 의식'],['라의 명령','마아트의 규칙'],
      ['jackal head','scales','mummy wrapping','golden'],'이집트 신화','myth'),
    mk('eg','Sekhmet','세크메트','War Deity',9,
      '사자 머리의 전쟁과 역병의 여신. 라의 딸로, 인류를 멸망시키려 할 만큼 강력하다. 라가 맥주를 피처럼 붉게 물들여 취하게 만들어 겨우 막았다. 치유의 여신이기도 하다.',
      ['전쟁 광기','역병 유발','화염 숨결','치유'],['붉은 맥주','라의 명령'],
      ['lion head woman','war crown','fire breath','blood red'],'이집트 신화','myth'),
    mk('eg','Sobek','소베크','Deity',7,
      '악어 머리의 나일강 신. 파라오의 군사력과 왕권의 상징이자, 나일강의 비옥함을 관장한다. 공격적이고 식욕이 왕성하지만, 혼돈으로부터 세계를 수호하는 역할도 한다.',
      ['악어의 힘','나일강 지배','재생력'],['세트의 계략'],
      ['crocodile head','golden armor','nile river','pharaoh'],'이집트 신화','myth'),
    mk('eg','Bastet','바스테트','Deity',4,
      '고양이 머리의 가정과 출산의 여신. 원래 사자 머리의 전쟁 여신이었으나, 시간이 지나며 온화한 고양이 여신으로 변했다. 고양이는 이집트에서 성스러운 동물로 숭배되었다.',
      ['고양이 민첩성','가정 수호','달의 힘'],['없음'],
      ['cat head woman','elegant','moonlight','protective'],'이집트 신화','myth'),
    mk('eg','Set','세트','Chaos Deity',9,
      '사막과 폭풍, 혼돈의 신. 형 오시리스를 살해하고 왕위를 찬탈했다. 하지만 라의 태양 배를 지키며 혼돈의 뱀 아펩과 매일 밤 싸우는 수호자이기도 하다. 선악의 경계에 있는 존재.',
      ['사막 폭풍','혼돈의 힘','괴력','아펩 퇴치'],['호루스의 눈','오시리스의 부활'],
      ['animal head','red skin','desert storm','chaos'],'이집트 신화','myth'),
  ],

  // ──────────── IRELAND (Western Europe) ────────────
  IE: [
    mk('ie','Morrigan','모리건','War Deity',8,
      '전쟁과 운명, 죽음의 삼중 여신. 까마귀로 변신하여 전장 위를 날며, 죽을 전사를 선택한다. 쿠 훌린의 죽음을 예언했으며, 그의 어깨 위에 앉아 최후를 알렸다.',
      ['변신(까마귀)','운명 예언','전장의 공포'],['예언의 규칙'],
      ['crow goddess','triple form','battlefield','dark wings'],'아일랜드 신화','myth'),
    mk('ie','Balor','발로르','Giant',9,
      '포모르족의 왕. 거대한 외눈에서 나오는 시선으로 닿는 것은 무엇이든 파괴한다. 눈이 너무 거대해 네 명의 전사가 들어올려야만 뜬다. 손자 루에 의해 눈에 창이 박혀 쓰러졌다.',
      ['파괴의 시선','괴력','불멸에 가까운 육체'],['자신의 눈(관통 시 역효과)','루의 창'],
      ['one giant eye','destruction beam','massive','dark king'],'아일랜드 신화(투아허 데 다난)','myth'),
    mk('ie','Pooka','푸카','Shapeshifter',5,
      '검은 말, 토끼, 염소, 개 등 다양한 동물로 변신하는 정령. 밤에 나타나 여행자를 등에 태운 후 험악한 곳으로 질주한다. 장난스럽지만 때로 위험한 존재.',
      ['동물 변신','야간 질주','인간 언어'],['해뜨기 전 사라짐','성스러운 물'],
      ['black horse','shapeshifter','night rider','glowing eyes'],'아일랜드 민담','folktale'),
    mk('ie','Leprechaun','레프리콘','Fairy',2,
      '무지개 끝에 금화 항아리를 숨긴 작은 요정. 구두를 만드는 장인으로, 붙잡으면 보물의 위치를 알려주지만 눈을 떼면 순식간에 사라진다. 아일랜드의 가장 유명한 민담 캐릭터.',
      ['순간이동','환각','보물 숨기기'],['붙잡힘','시선 고정'],
      ['small green man','pot of gold','rainbow','cobbler'],'아일랜드 민담','folktale'),
    mk('ie','Selkie','셀키','Shapeshifter',4,
      '바다에서는 물범, 육지에서는 아름다운 인간의 모습을 취하는 존재. 물범 가죽을 벗어 인간으로 변하며, 누군가 가죽을 숨기면 바다로 돌아갈 수 없다. 슬픈 사랑 이야기의 주인공.',
      ['물범⇄인간 변신','바다의 노래','해양 능력'],['물범 가죽 분실'],
      ['seal skin','beautiful human','ocean','sad love'],'켈틱 민담','folktale'),
  ],

  // ──────────── IRAN (West Asia) — 페르시아 신화 ────────────
  IR: [
    mk('ir','Simurgh','시무르그','Divine Bird',5,
      '고대 페르시아의 신성한 새. 모든 지식을 가졌으며, 엘부르즈 산 꼭대기의 세계수 위에 둥지를 틀고 있다. 샤나메(왕서)에서 영웅 잘을 키우고 치유하는 현명한 존재로 등장한다.',
      ['치유 능력','모든 지식','비행','불사'],['세계의 균형이 깨질 때 개입'],
      ['giant bird','peacock tail','lion claws','wise eyes'],'샤나메(페르시아 신화)','myth'),
    mk('ir','Azi Dahaka','아지다하카','Dragon',10,
      '세 머리, 여섯 눈, 세 턱의 용. 인간의 어깨에서 뱀 두 마리가 자라나며, 매일 젊은이 두 명의 뇌를 먹어야 한다. 영웅 페리둔에 의해 다마반드 산에 봉인되었으나, 세계 종말 때 풀려난다.',
      ['세 머리 공격','뱀 소환','독 숨결','불멸'],['페리둔의 쇠곤봉','다마반드 산 봉인'],
      ['three headed dragon','shoulder snakes','chained','mountain'],'샤나메(페르시아 신화)','myth'),
    mk('ir','Peri','페리','Fairy',3,
      '아름답고 선한 날개 달린 여성 정령. 원래 천국에서 추방된 존재로, 선행을 통해 다시 천국에 돌아가려 한다. 인간을 돕고 사랑하지만, 디브(악마)의 방해를 받는다.',
      ['비행','치유','환각 미모'],['디브의 방해','철 새장'],
      ['winged fairy','luminous','beautiful','ethereal'],'페르시아 민담','folktale'),
  ],

  // ──────────── IRAQ (West Asia) — 메소포타미아 신화 ────────────
  IQ: [
    mk('iq','Tiamat','티아마트','Primordial',10,
      '메소포타미아 창세신화의 원초적 혼돈의 여신. 바닷물을 의인화한 존재로, 남편 압수(민물)와 함께 최초의 신들을 낳았다. 마르둑과의 전투에서 쓰러졌으며, 그 시체로 하늘과 땅이 만들어졌다.',
      ['혼돈 지배','괴물 군단 창조','원초적 바다의 힘'],['마르둑의 바람과 창'],
      ['dragon goddess','ocean chaos','massive','primordial sea'],'에누마 엘리시','myth'),
    mk('iq','Lamassu','라마수','Guardian',5,
      '인간의 머리, 황소의 몸, 독수리의 날개를 가진 수호 존재. 아시리아와 바빌로니아의 궁전 입구를 지키며 악을 막는다. 다섯 다리로 조각되어 정면과 측면 어디서 보든 완전한 모습을 보인다.',
      ['궁전 수호','악 퇴치','예지력'],['특정 마법 의식'],
      ['human head','bull body','eagle wings','five legs','guardian'],'메소포타미아 신화','myth'),
    mk('iq','Humbaba','훔바바','Giant',8,
      '삼나무 숲의 수호자. 엔릴 신이 숲을 지키도록 임명했다. 포효로 산이 무너지고, 숨결로 홍수가 일어난다. 길가메시와 엔키두에 의해 쓰러졌으며, 그 죽음은 신들의 분노를 샀다.',
      ['파괴적 포효','홍수 숨결','숲의 지배'],['길가메시의 힘','엔키두의 전략'],
      ['terrifying face','cedar forest','giant','roaring'],'길가메시 서사시','myth'),
  ],

  // ──────────── UK (Western Europe) ────────────
  GB: [
    mk('gb','Morgan le Fay','모건 르 페이','Sorceress',7,
      '아서 왕의 이복누이이자 강력한 마녀. 아발론의 여주인으로, 치유와 파괴의 마법을 모두 구사한다. 아서의 적이자 동시에 그의 죽음 뒤 아발론으로 데려간 수호자.',
      ['강력한 마법','변신','치유와 저주'],['엑스칼리버','멀린의 마법'],
      ['dark sorceress','avalon','crown','mystical'],'아서왕 전설','legend'),
    mk('gb','Green Knight','녹색 기사','Supernatural Knight',6,
      '초록색 피부와 갑옷의 불사의 기사. 아서 왕의 궁정에 나타나 목을 베어보라 도전했다. 목이 잘려도 머리를 들어올려 되돌아갔다. 가웨인 경의 명예와 정직을 시험하는 존재.',
      ['불사','재생','시험 제시'],['정직함 앞에서 물러남'],
      ['green skin','giant axe','headless','mystical armor'],'가웨인 경과 녹색 기사','legend'),
    mk('gb','Black Dog','블랙 독','Phantom',7,
      '영국 전역의 야간 도로와 교차로에 나타나는 거대한 검은 유령 개. 불타는 붉은 눈을 가졌으며, 목격하면 곧 죽음이 임박했다는 징조이다. 블랙 숙, 바게스트 등 지역마다 다른 이름으로 불린다.',
      ['죽음의 전조','순간이동','공포 유발'],['새벽','성스러운 장소'],
      ['giant black dog','red glowing eyes','phantom','crossroads'],'영국 전설','legend'),
  ],

  // ──────────── FRANCE (Western Europe) ────────────
  FR: [
    mk('fr','Melusine','멜뤼진','Shapeshifter',5,
      '상반신은 아름다운 여인, 하반신은 뱀(또는 물고기)인 요정. 매주 토요일 목욕할 때만 본모습이 드러난다. 남편에게 절대 목욕을 보지 말라 했으나 약속이 깨져 영원히 떠났다.',
      ['반사반인 변신','예언','건축 마법'],['정체 발각(목욕 엿보기)'],
      ['half woman half serpent','bathing','castle','wings'],'프랑스 전설','legend'),
  ],

  // ──────────── GERMANY (Western Europe) ────────────
  DE: [
    mk('de','Erlkonig','마왕(에를쾨니히)','Dark Fairy',8,
      '독일 민담의 요정 왕. 안개 낀 숲에서 아이들을 유혹하여 데려간다. 괴테의 시에서 아버지가 말을 타고 달리며 아들을 구하려 하지만, 도착했을 때 아이는 이미 죽어있었다.',
      ['아이 유혹','안개 조종','보이지 않는 접근'],['아버지의 의지(불완전)'],
      ['dark fairy king','mist','forest','pale','crown'],'독일 민담/괴테의 시','folktale'),
    mk('de','Lorelei','로렐라이','Siren',6,
      '라인강의 로렐라이 절벽 위에서 노래하는 아름다운 여인. 그 노래에 홀린 뱃사람들이 바위에 부딪혀 난파한다. 실연의 슬픔으로 자신을 강에 던진 여인의 영혼이라 전해진다.',
      ['매혹의 노래','환각 유발'],['귀를 막기','여명'],
      ['beautiful woman','golden hair','river cliff','singing'],'독일 전설','legend'),
  ],

  // ──────────── RUSSIA (Eastern Europe) ────────────
  RU: [
    mk('ru','Firebird','불새(자르프티차)','Divine Bird',4,
      '빛나는 황금-붉은 깃털의 신비로운 새. 깃털 하나만으로도 방을 밝힐 수 있다. 이반 왕자가 불새를 잡는 여정은 러시아에서 가장 유명한 민담 중 하나이다.',
      ['빛나는 깃털','불의 축복','부활'],['새장','속임수'],
      ['golden red bird','glowing feathers','fire','magical'],'러시아 민담','folktale'),
    mk('ru','Koschei','코시체이','Lich',9,
      '러시아 민담의 불사의 악당. 그의 영혼(죽음)은 바늘 속에 있고, 바늘은 달걀 속에, 달걀은 오리 속에, 오리는 토끼 속에, 토끼는 상자 속에, 상자는 떡갈나무 위에 있다.',
      ['불사','흑마법','여인 납치','마법 감옥'],['바늘 파괴(중첩된 봉인 해제)'],
      ['skeletal sorcerer','chains','dark tower','immortal'],'러시아 민담','folktale'),
    mk('ru','Chernobog','체르노보그','Dark Deity',8,
      '슬라브 신화의 흑신(黑神). 밤과 어둠, 죽음을 관장한다. 백신 벨로보그와 영원한 대립 관계로, 겨울과 불행을 가져온다. 기독교 전래 후 악마와 동일시되었다.',
      ['어둠 지배','저주','겨울 소환'],['벨로보그(백신)','봄의 도래'],
      ['dark god','black robes','skull face','night'],'슬라브 신화','myth'),
  ],

  // ──────────── TURKEY (West Asia) ────────────
  TR: [
    mk('tr','Zümrüdüanka','쥠뤼드위안카','Divine Bird',4,
      '튀르키예 전설의 불사조. 에메랄드빛 깃털을 가졌으며, 재에서 다시 태어난다. 소원을 들어주는 힘이 있다고 전해지며, 전통 문양과 장식에 자주 등장한다.',
      ['부활','소원 성취','불의 정화'],['포획 불가'],
      ['emerald phoenix','fire rebirth','green feathers','mythical'],'튀르키예 전설','myth'),
  ],

  // ──────────── UNITED STATES (North America) ────────────
  US: [
    mk('us','Coyote','코요테','Trickster Spirit',4,
      '아메리카 원주민 신화의 트릭스터이자 문화 영웅. 인간에게 불을 가져다주기도 하고, 장난으로 세상을 어지럽히기도 한다. 나바호, 주니 등 여러 부족의 창세 이야기에 등장한다.',
      ['변신','불멸','장난','문화 창조'],['자만심','자신의 장난에 당함'],
      ['coyote','trickster','desert','shapeshifting'],'아메리카 원주민 신화','myth'),
    mk('us','Raven','까마귀 정령','Trickster Spirit',4,
      '태평양 북서부 원주민(하이다, 틀링깃)의 창조적 트릭스터. 세상에 빛을 가져온 존재로, 태양을 훔쳐 하늘에 걸었다. 교활하지만 세상을 만든 문화 영웅이다.',
      ['변신','빛 운반','장난','지혜'],['자만심'],
      ['raven','black bird','light bringer','totem'],'태평양 북서부 원주민 신화','myth'),
    mk('us','Bigfoot','빅풋(사스콰치)','Cryptid',5,
      '북미 태평양 연안 숲에서 목격되는 거대한 유인원형 미확인 생물. 키 2-3미터에 온몸이 갈색/검은 털로 덮여 있으며, 거대한 발자국을 남긴다. 원주민들은 오래전부터 그 존재를 알고 있었다.',
      ['은신','괴력','숲 이동'],['증거 부족','카메라'],
      ['giant ape','forest','big footprint','hairy'],'북미 전설/현대 민담','legend'),
  ],

  // ──────────── BRAZIL (South America) ────────────
  BR: [
    mk('br','Saci','사시','Trickster',3,
      '한 다리에 빨간 모자를 쓴 장난꾸러기 소년 정령. 회오리바람을 타고 나타나 물건을 숨기고, 음식을 태우고, 말의 갈기를 엉키게 한다. 빨간 모자를 뺏으면 소원을 들어준다.',
      ['회오리바람','물건 숨기기','장난'],['빨간 모자 빼앗기','십자가'],
      ['one-legged boy','red cap','whirlwind','pipe'],'브라질 민담','folktale'),
    mk('br','Boitata','보이타타','Fire Serpent',7,
      '불타는 눈의 거대한 뱀. 대홍수에서 살아남아 죽은 동물들의 눈을 먹어 빛나게 되었다. 숲을 불태우는 자들을 쫓아가 불로 징벌한다. 브라질 숲의 수호자.',
      ['화염 시선','불 면역','숲 수호'],['물','대낮'],
      ['fire serpent','glowing eyes','forest fire','guardian'],'브라질 투피 전설','legend'),
  ],

  // ──────────── PERU (South America) ────────────
  PE: [
    mk('pe','Mictlantecuhtli','미크틀란테쿠틀리','Death Deity',9,
      '아즈텍 죽음의 신이자 미크틀란(지하 세계) 9층의 지배자. 피 묻은 해골 얼굴에 인간 눈알 목걸이를 걸었다. 케찰코아틀이 인간의 뼈를 되찾으러 왔을 때 속이려 했다.',
      ['죽음 지배','해골 군대','영혼 포획'],['케찰코아틀의 지혜','옥수수 의식'],
      ['skull face','bone necklace','underworld throne','death god'],'아즈텍 신화','myth'),
  ],

  // ──────────── MEXICO (Central America) ────────────
  MX: [
    mk('mx','Tezcatlipoca','테스카틀리포카','Deity',9,
      '연기나는 거울의 주인, 밤과 운명의 신. 흑요석 거울로 모든 것을 보며, 재규어로 변신한다. 케찰코아틀과 영원한 라이벌로, 톨텍 문명의 멸망을 이끌었다.',
      ['흑요석 거울(투시)','재규어 변신','운명 조종'],['케찰코아틀','새벽'],
      ['obsidian mirror','jaguar','smoking','dark god'],'아즈텍 신화','myth'),
  ],

  // ──────────── NIGERIA (West Africa) ────────────
  NG: [
    mk('ng','Ogun','오군','Deity',7,
      '요루바 신화의 철과 전쟁, 기술의 오리샤(신). 인간에게 철기를 가져다준 문화 영웅이자, 전사와 대장장이의 수호신. 격렬하고 정의로우며, 서약의 증인으로 불린다.',
      ['철의 지배','전쟁 기술','길 개척'],['자신의 분노'],
      ['iron god','warrior','forge','machete'],'요루바 신화','myth'),
    mk('ng','Anansi','아난시','Trickster',3,
      '거미의 모습을 한 트릭스터 신. 지혜와 이야기의 수호자로, 하늘신 냔쿠폰에게서 모든 이야기의 소유권을 따냈다. 작지만 교활함으로 거대한 상대를 이기는 민담의 대표적 영웅.',
      ['거미줄 함정','변신','지혜','이야기의 힘'],['자만심'],
      ['spider man','web','trickster','storyteller'],'아샨티/서아프리카 민담','folktale'),
  ],

  // ──────────── SOUTH AFRICA (Southern Africa) ────────────
  ZA: [
    mk('za','Inkanyamba','인칸얌바','Sea Serpent',8,
      '콰줄루나탈의 호이크 폭포에 사는 거대한 뱀. 분노하면 폭풍과 토네이도를 일으키며, 계절이 바뀔 때 짝을 찾아 하늘로 올라간다. 줄루족은 이 존재를 경외한다.',
      ['폭풍 소환','토네이도','수중 이동'],['전통 의식','산고마(주술사)'],
      ['giant serpent','waterfall','storm','tornado'],'줄루 전설','legend'),
  ],

  // ──────────── ETHIOPIA (East Africa) ────────────
  ET: [
    mk('et','Solomon Eagle','솔로몬의 독수리','Divine Bird',5,
      '시바의 여왕과 솔로몬 왕의 전설에 등장하는 신성한 독수리. 에티오피아 왕가의 수호자이자, 언약궤를 지키는 존재로 전해진다. 에티오피아 건국 신화와 깊이 연결되어 있다.',
      ['수호','신성한 비행','언약궤 보호'],['없음'],
      ['golden eagle','crown','divine light','guardian'],'에티오피아 건국 전설','myth'),
  ],

  // ──────────── AUSTRALIA (Oceania) ────────────
  AU: [
    mk('au','Tiddalik','티달릭','Cosmic Frog',5,
      '세상의 모든 물을 마셔버린 거대한 개구리. 동물들이 목마름으로 죽어가자, 뱀장어 나부눔이 우스꽝스러운 춤을 추어 티달릭을 웃게 만들었고, 물이 모두 쏟아져 나왔다.',
      ['물 흡수','홍수 유발','거대 체구'],['웃음'],
      ['giant frog','swollen','water','laughing'],'호주 원주민 민담','folktale'),
  ],

  // ──────────── NEW ZEALAND (Oceania) ────────────
  NZ: [
    mk('nz','Maui','마우이','Demigod',5,
      '폴리네시아 전역에서 숭배되는 반신 트릭스터. 갈고리로 뉴질랜드 북섬을 바다에서 끌어올렸고, 올가미로 태양을 잡아 하루를 늘렸다. 불멸을 얻으려다 힌느이테포에게 죽었다.',
      ['초인적 힘','갈고리 마법','태양 포획','변신'],['힌느이테포(죽음의 여신)'],
      ['demigod','magic hook','sun lasso','trickster'],'폴리네시아 신화','myth'),
  ],

  // ──────────── MONGOLIA (East Asia) ────────────
  MN: [
    mk('mn','Mangas','망가스','Demon Giant',8,
      '몽골 신화의 거대 악마. 여러 개의 머리를 가진 괴물로, 영웅에게 퇴치된다. 간(Khan) 영웅 서사시의 주적으로, 95개의 머리를 가진 망가스도 있다. 마지막 머리를 잘라야 죽는다.',
      ['다두','괴력','재생','마법'],['마지막 머리 절단','영웅의 검'],
      ['multi-headed giant','demon','mongolian warrior','steppe'],'몽골 서사시','myth'),
  ],

  // ──────────── THAILAND (Southeast Asia) ────────────
  TH: [
    mk('th','Naga Thai','나가(태국)','Serpent',6,
      '메콩강에 사는 거대한 뱀 신. 불교와 힌두교가 융합된 태국의 나가는 사원 입구를 지키며, 매년 안거 끝에 메콩강에서 불을 뿜는다(방파이나가 축제). 왕실의 수호자.',
      ['불 발사','수중 지배','사원 수호'],['가루다'],
      ['serpent','temple guardian','mekong','fire balls'],'태국 불교/힌두 신화','myth'),
  ],

  // ──────────── CAMBODIA (Southeast Asia) ────────────
  KH: [
    mk('kh','Ap','압','Vampire Spirit',8,
      '캄보디아의 무서운 뱀파이어 정령. 밤에 머리와 내장만 분리되어 날아다니며 피를 빨아먹는다. 낮에는 평범한 여성으로 살지만, 밤이 되면 목에서 분리된다.',
      ['머리 분리 비행','흡혈','야간 활동'],['소금과 마늘(내장에)','새벽'],
      ['flying head','entrails','night predator','female'],'크메르 전설','legend'),
  ],

  // ──────────── VIETNAM (Southeast Asia) ────────────
  VN: [
    mk('vn','Lac Long Quan','락롱꽌','Dragon King',5,
      '베트남 건국 신화의 용왕. 선녀 어우꺼(Au Co)와 결혼하여 100개의 알을 낳았고, 50명은 아버지와 바다로, 50명은 어머니와 산으로 갔다. 베트남 민족의 시조.',
      ['용 변신','바다 지배','문명 창건'],['없음'],
      ['dragon king','ocean','eggs','founder'],'베트남 건국 신화','myth'),
  ],

  // ──────────── PHILIPPINES (Southeast Asia) ────────────
  PH: [
    mk('ph','Bakunawa','바쿠나와','Cosmic Serpent',9,
      '일곱 개의 달을 삼킨 거대한 바다뱀. 달의 아름다움에 반해 하나씩 삼켰으며, 마지막 달마저 삼키려 할 때 사람들이 냄비를 두드려 쫓아냈다. 필리핀의 월식 설명 신화.',
      ['달 포식','해일 유발','거대 체구'],['시끄러운 소리','기도'],
      ['giant sea serpent','swallowing moon','eclipse','ocean'],'필리핀 신화','myth'),
  ],

  // ──────────── INDONESIA (Southeast Asia) ────────────
  ID: [
    mk('id','Batara Kala','바타라 칼라','Deity',8,
      '자바 신화의 시간과 파괴의 신. 시바의 아들로, 인간을 잡아먹는 거대한 존재. 아이가 태어날 때 루왓(정화 의식)을 하지 않으면 바타라 칼라에게 잡혀간다고 전해진다.',
      ['시간 지배','인간 포식','파괴'],['루왓(정화 의식)','와양 공연'],
      ['giant deity','time god','devouring','javanese'],'자바 신화','myth'),
  ],

  // ──────────── SCOTLAND (Western Europe) ────────────
  SCT: [
    mk('sct','Kelpie','켈피','Water Spirit',7,
      '아름다운 말로 변신하여 강가에서 사람을 유혹하는 수마(水馬). 등에 올라타면 피부가 달라붙어 떨어질 수 없고, 강속으로 끌고 들어가 익사시킨다. 스코틀랜드 전역의 호수에 출몰.',
      ['말 변신','점착 피부','수중 질주'],['은 고삐','이름 부르기'],
      ['water horse','beautiful','sticky skin','loch'],'스코틀랜드 전설','legend'),
    mk('sct','Loch Ness Monster','네시','Cryptid',5,
      '스코틀랜드 네스호에 산다는 거대 수중 생물. 긴 목과 작은 머리, 혹이 있는 등의 목격담이 1933년부터 이어지고 있다. 세계에서 가장 유명한 미확인 생물 중 하나.',
      ['은신','심해 잠수','거대 체구'],['증거 부족'],
      ['long neck','lake creature','humps','mysterious'],'스코틀랜드 현대 전설','legend'),
  ],

  // ──────────── ROMANIA (Eastern Europe) ────────────
  RO: [
    mk('ro','Zmeu','즈메우','Dragon',8,
      '루마니아 민담의 용인(龍人). 인간의 모습을 취할 수 있으며, 공주를 납치하는 적대적 존재. 팻프루모시(용감한 자)에 의해 퇴치되는 것이 전형적인 서사이다.',
      ['불 숨결','비행','인간 변신','초인적 힘'],['영웅의 마법검','전략'],
      ['dragon man','fire breath','castle','treasure'],'루마니아 민담','folktale'),
  ],

  // ──────────── POLAND (Eastern Europe) ────────────
  PL: [
    mk('pl','Wawel Dragon','바벨 용','Dragon',8,
      '크라쿠프 바벨 언덕 동굴에 살던 용. 가축과 처녀를 잡아먹었다. 구두장이 스쿠바가 유황을 채운 양을 미끼로 주어, 물을 너무 많이 마시다 폭발해 죽었다. 크라쿠프의 상징.',
      ['화염 숨결','가축 포식','날개 비행'],['유황','과음(물)'],
      ['dragon','cave','fire','wawel hill'],'폴란드 전설','legend'),
  ],

  // ──────────── COLOMBIA (South America) ────────────
  CO: [
    mk('co','Mohán','모한','Water Spirit',6,
      '막달레나강에 사는 긴 머리카락과 수염의 주술사. 빨래하러 온 여인들을 유혹하고, 어부의 그물을 엉키게 한다. 물에 빠진 사람의 영혼을 가두기도 한다.',
      ['수중 매복','그물 방해','여인 유혹','영혼 포획'],['담배 연기','주문'],
      ['long hair sorcerer','river','fishing','mysterious'],'콜롬비아 전설','legend'),
  ],

  // ──────────── CHILE (South America) ────────────
  CL: [
    mk('cl','Caleuche','칼레우체','Ghost Ship',7,
      '칠로에 섬 근해에 나타나는 유령선. 밤에 환하게 빛나며 음악 소리가 들린다. 익사한 선원들의 영혼이 타고 있으며, 잠수하여 사라지고 다른 곳에서 다시 나타난다.',
      ['순간이동','해저 잠수','영혼 수집','매혹의 음악'],['특정 마법 의식'],
      ['ghost ship','glowing','music','underwater','night'],'칠로에 전설','legend'),
  ],

  // ──────────── ARGENTINA (South America) ────────────
  AR: [
    mk('ar','Nahuelito','나우엘리토','Cryptid',5,
      '아르헨티나 나우엘우아피 호수에 사는 거대 수중 생물. 네시와 유사한 목격담이 1922년부터 이어진다. 파타고니아 원주민의 전설에서 호수의 수호자로 여겨진다.',
      ['심해 잠수','은신','거대 체구'],['증거 부족'],
      ['lake monster','long neck','patagonia','mysterious'],'아르헨티나 현대 전설','legend'),
  ],

  // ──────────── PAKISTAN (South Asia) ────────────
  PK: [
    mk('pk','Churail','추레일','Vengeful Ghost',8,
      '출산 중 죽은 여성의 원귀. 발이 뒤로 돌아가 있으며, 아름다운 여인으로 나타나 남자를 유혹한 뒤 생명력을 빨아먹는다. 파키스탄과 인도 북부 전역에서 두려움의 대상.',
      ['유혹','생명력 흡수','변신'],['종교 기도','부적'],
      ['reversed feet','beautiful ghost','white clothes','seductive'],'남아시아 전설','legend'),
  ],

  // ──────────── NEPAL (South Asia) ────────────
  NP: [
    mk('np','Yeti','예티','Cryptid',6,
      '히말라야 설산에 사는 거대한 유인원형 생물. "히말라야의 눈사람"으로 불리며, 셰르파 문화에서 오래전부터 전해져 왔다. 거대한 발자국이 눈 위에서 여러 차례 발견되었다.',
      ['극한 환경 적응','괴력','은신'],['따뜻한 기후'],
      ['white fur','mountain','snow footprints','ape-like'],'히말라야 전설','legend'),
  ],

  // ──────────── SAUDI ARABIA (West Asia) ────────────
  SA: [
    mk('sa','Roc','록새(루크)','Giant Bird',7,
      '신밧드 모험에 등장하는 초거대 새. 코끼리를 발톱으로 채가는 크기이며, 날개를 펼치면 하늘을 가린다. 마다가스카르 근처의 섬에 둥지를 틀고 있다고 전해진다.',
      ['초거대 체구','코끼리 포획','폭풍 날개'],['알 파괴'],
      ['giant bird','elephant-carrying','enormous wings','nest'],'천일야화(아라비안나이트)','folktale'),
  ],
};

// ═══════════════════════════════════════════════════════════════
//  메인 실행
// ═══════════════════════════════════════════════════════════════

function main() {
  const data = loadData();
  const beforeCount = data.reduce((s, c) => s + c.b.length, 0);

  // ── STEP 1: 기존 크리처 ct 분류 ──
  let classified = 0;
  data.forEach(country => {
    country.b.forEach(creature => {
      if (!creature.ct) {
        creature.ct = autoClassify(creature);
        classified++;
      }
    });
  });
  console.log(`✅ 기존 크리처 ${classified}개에 ct 분류 태그 추가`);

  // ── STEP 2: 새 크리처 추가 ──
  let added = 0;
  for (const [iso, creatures] of Object.entries(NEW_BY_COUNTRY)) {
    const country = data.find(c => c.i === iso);
    if (!country) {
      console.log(`  ⚠️ ${iso} 국가를 데이터에서 찾을 수 없음 — 스킵`);
      continue;
    }
    const existingIds = new Set(country.b.map(b => b.id));
    const existingNames = new Set(country.b.map(b => b.ln?.toLowerCase()));
    for (const creature of creatures) {
      if (existingIds.has(creature.id) || existingNames.has(creature.ln?.toLowerCase())) {
        console.log(`  ⏭️ ${creature.n}(${creature.ln}) — 이미 존재, 스킵`);
        continue;
      }
      country.b.push(creature);
      added++;
    }
  }
  console.log(`✅ 새 크리처 ${added}개 추가`);

  // ── STEP 3: 저장 ──
  saveData(data);

  const afterCount = data.reduce((s, c) => s + c.b.length, 0);

  // ── 통계 ──
  const ctStats = { myth: 0, legend: 0, folktale: 0, unknown: 0 };
  data.forEach(c => c.b.forEach(b => {
    ctStats[b.ct] = (ctStats[b.ct] || 0) + 1;
  }));

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  📊 설화 확장 완료                               ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  국가: ${data.length}개`);
  console.log(`║  크리처: ${beforeCount} → ${afterCount}개 (+${afterCount - beforeCount})`);
  console.log(`║  ─────────────────────────`);
  console.log(`║  🏛 신화(myth): ${ctStats.myth}개`);
  console.log(`║  📜 전설(legend): ${ctStats.legend}개`);
  console.log(`║  📖 민담(folktale): ${ctStats.folktale}개`);
  console.log('╚══════════════════════════════════════════════════╝');
}

main();
