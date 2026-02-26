"use client"
import React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { CREATURE_IMAGE_MAP, FOLKLORE_DATA, getCreatureImage } from "@/lib/folklore-data";

// 크롤 스크립트가 자동 갱신 (아래 한 줄만 교체)
const LAST_UPDATED = "2026-02-26T12:37:12.654Z";


// ═══════════════════════════════════════════════════════════════
//  GLOBAL FOLKLORE BESTIARY — 151 Countries · 600 Beings
//  Interactive World Map + Card Explorer
// ═══════════════════════════════════════════════════════════════

const CONTINENT_MAP = {
  "East Asia": "Asia",
  "Southeast Asia": "Asia",
  "South Asia": "Asia",
  "Central Asia": "Asia",
  "West Asia": "Asia",
  "Northern Europe": "Europe",
  "Western Europe": "Europe",
  "Southern Europe": "Europe",
  "Eastern Europe": "Europe",
  "North Africa": "Africa",
  "West Africa": "Africa",
  "East Africa": "Africa",
  "Southern Africa": "Africa",
  "Central Africa": "Africa",
  "North America": "Americas",
  "Central America": "Americas",
  "South America": "Americas",
  "Caribbean": "Americas",
  "Oceania": "Oceania",
};

const CONTINENT_COLORS = {
  Asia: { bg: "#1a0a0a", accent: "#ff3b3b", glow: "#ff000044", card: "#2a0f0f", text: "#ffcccc", border: "#661111" },
  Europe: { bg: "#0a0a1a", accent: "#6b8aff", glow: "#0044ff44", card: "#0f0f2a", text: "#ccd0ff", border: "#112266" },
  Africa: { bg: "#1a140a", accent: "#ffaa2b", glow: "#ff880044", card: "#2a1f0f", text: "#ffeedd", border: "#664411" },
  Americas: { bg: "#0a1a0f", accent: "#3bff6b", glow: "#00ff4444", card: "#0f2a14", text: "#ccffdd", border: "#116622" },
  Oceania: { bg: "#0a161a", accent: "#3bdfff", glow: "#00ccff44", card: "#0f222a", text: "#ccf0ff", border: "#115566" },
};

const CONTINENT_EMOJI = { Asia: "🐉", Europe: "🧛", Africa: "🦁", Americas: "👹", Oceania: "🦈" };

const FEAR_LABELS = ["", "평화", "장난", "불안", "긴장", "위험", "공포", "경악", "악몽", "재앙", "종말"];

const CT_LABELS = { myth: "신화", legend: "전설", folktale: "민담" };
const CT_COLORS = { myth: "#f59e0b", legend: "#6b8aff", folktale: "#3bff6b" };
const CT_ICONS = { myth: "🏛", legend: "📜", folktale: "📖" };

// ── Helper: Aggregate type stats across all data ──
const getTypeStats = (data) => {
  const map = {};
  data.forEach(c => c.b.forEach(b => {
    const t = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
    map[t] = (map[t] || 0) + 1;
  }));
  return Object.entries(map).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({ name, value }));
};

// ── Helper: Top 5 scariest per continent ──
const getTop5ByContinent = (data) => {
  const byContinent = {};
  data.forEach(c => {
    const cont = CONTINENT_MAP[c.r];
    if (!byContinent[cont]) byContinent[cont] = [];
    c.b.forEach(b => byContinent[cont].push({ ...b, country: c.c, continent: cont }));
  });
  const result = {};
  Object.entries(byContinent).forEach(([cont, beings]) => {
    result[cont] = beings.sort((a,b) => b.f - a.f || a.n.localeCompare(b.n)).slice(0, 5);
  });
  return result;
};

// ── Helper: Random encounter ──
const getRandomEncounter = (data) => {
  const country = data[Math.floor(Math.random() * data.length)];
  const being = country.b[Math.floor(Math.random() * country.b.length)];
  return { country, being };
};

// ── 매일 자동 회전하는 특집 카드 시스템 ──
const CONTINENT_GRADIENTS = {
  Asia: [["#1a0000","#330011"],["#1a0505","#2a0015"],["#200008","#180020"]],
  Europe: [["#0a0a1a","#1a1033"],["#0d0008","#1a0020"],["#080818","#1a0a30"]],
  Africa: [["#001a0a","#0a1a00"],["#1a140a","#1a0f00"],["#0f1a08","#0a1a0a"]],
  Americas: [["#1a0f00","#1a0500"],["#0a1a0f","#001a15"],["#0f1a0a","#051a0f"]],
  Oceania: [["#0a161a","#0a1a1a"],["#081a1a","#0a1520"],["#0a101a","#0a1a18"]],
};
const CONTINENT_ART = {
  Asia: ["🏯","🐉","🎌","🗡️","👺","🌸"],
  Europe: ["🏰","⚔️","🧛","🗝️","🐺","🌑"],
  Africa: ["🌿","🦁","🌍","🌙","🔱","🏺"],
  Americas: ["💀","🗿","🌵","🦅","🐍","🌋"],
  Oceania: ["🌊","🦈","🏝️","🐚","🌺","🐊"],
};
const SPOTLIGHT_TAGLINES = {
  Asia: ["고대 전설이 숨 쉬는 땅","요괴의 그림자가 드리우는 곳","영혼과 인간이 교차하는 밤","천년의 어둠이 서린 곳"],
  Europe: ["안개 속에서 전설이 깨어난다","고성에 울리는 비명","달빛 아래 늑대가 울부짖는 곳","봉인된 어둠이 풀리는 밤"],
  Africa: ["정령의 숲이 속삭이는 곳","고대 영혼의 메아리","대지의 저주가 살아 숨 쉰다","밤의 사냥꾼이 깨어나는 땅"],
  Americas: ["죽은 자가 쉬지 않는 곳","정글 깊은 곳의 포식자","고대 문명의 어둠","대륙을 뒤흔든 전설"],
  Oceania: ["깊은 바다의 공포","태고의 땅에서 온 존재","섬에 봉인된 전설","파도 너머의 괴물"],
};
function getDailyFeatured(data) {
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  // Simple deterministic hash from seed
  const hash = (seed, idx) => {
    let h = seed * 2654435761 + idx * 40503;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    return (h >>> 16) ^ h;
  };
  // Group countries by continent
  const byContinent = {};
  data.forEach(c => {
    const cont = CONTINENT_MAP[c.r];
    if (!byContinent[cont]) byContinent[cont] = [];
    byContinent[cont].push(c);
  });
  const continents = Object.keys(byContinent).sort();
  const cards = [];
  // Pick 1 from each continent + 1 bonus = 6 cards
  continents.forEach((cont, ci) => {
    const pool = byContinent[cont];
    const pick = Math.abs(hash(daySeed, ci)) % pool.length;
    const country = pool[pick];
    const gradients = CONTINENT_GRADIENTS[cont];
    const arts = CONTINENT_ART[cont];
    const taglines = SPOTLIGHT_TAGLINES[cont];
    const topBeing = [...country.b].sort((a,b) => b.f - a.f)[0];
    const beingNames = country.b.slice(0, 3).map(b => b.n).join(", ");
    cards.push({
      iso: country.i,
      title: country.c,
      tagline: taglines[Math.abs(hash(daySeed, ci + 100)) % taglines.length],
      art: arts[Math.abs(hash(daySeed, ci + 200)) % arts.length],
      gradient: gradients[Math.abs(hash(daySeed, ci + 300)) % gradients.length],
      lore: `${country.c}의 민담 속에서 ${beingNames} 등 ${country.b.length}개의 존재가 어둠 속에 도사린다. 가장 두려운 ${topBeing.n}(공포 ${topBeing.f}/10)이(가) 이 땅의 전설을 지배한다.`,
    });
  });
  // Bonus: 6th card from random continent
  const bonusCont = continents[Math.abs(hash(daySeed, 999)) % continents.length];
  const bonusPool = byContinent[bonusCont];
  // Pick a different country than the one already chosen for this continent
  const existingIso = cards.find(c => CONTINENT_MAP[data.find(d => d.i === c.iso)?.r] === bonusCont)?.iso;
  const filtered = bonusPool.filter(c => c.i !== existingIso);
  if (filtered.length > 0) {
    const pick2 = Math.abs(hash(daySeed, 777)) % filtered.length;
    const country2 = filtered[pick2];
    const gradients = CONTINENT_GRADIENTS[bonusCont];
    const arts = CONTINENT_ART[bonusCont];
    const taglines = SPOTLIGHT_TAGLINES[bonusCont];
    const topBeing = [...country2.b].sort((a,b) => b.f - a.f)[0];
    const beingNames = country2.b.slice(0, 3).map(b => b.n).join(", ");
    cards.push({
      iso: country2.i,
      title: country2.c,
      tagline: taglines[Math.abs(hash(daySeed, 888)) % taglines.length],
      art: arts[Math.abs(hash(daySeed, 888)) % arts.length],
      gradient: gradients[Math.abs(hash(daySeed, 888)) % gradients.length],
      lore: `${country2.c}의 민담 속에서 ${beingNames} 등 ${country2.b.length}개의 존재가 어둠 속에 도사린다. 가장 두려운 ${topBeing.n}(공포 ${topBeing.f}/10)이(가) 이 땅의 전설을 지배한다.`,
    });
  }
  return cards;
}

// ═══════════════════════════════════════════════════════════════
//  CREATIVE STUDIO DATA — Scenario Generator, Character Builder, Webtoon IP
// ═══════════════════════════════════════════════════════════════

const SCENARIO_TEMPLATES = [
  { id: "horror", label: "🩸 공포", name: "어둠의 조우", desc: "공포와 생존의 시나리오",
    settings: ["폐허가 된 신사/사원", "안개 낀 산골 마을", "버려진 지하 묘지", "달 없는 밤의 숲길", "홍수로 고립된 섬", "폐교의 지하실"],
    hooks: ["주인공이 금기를 어기며 시작된다", "실종된 친구를 찾으러 간다", "의문의 편지/지도를 받는다", "귀향했더니 마을이 변해있다", "밤마다 같은 악몽을 꾼다"],
    twists: ["퇴치한 줄 알았던 존재가 주인공 안에 있었다", "마을 사람들이 이미 존재의 하수인이었다", "존재는 사실 수호자였고 진짜 위협은 인간이었다", "시간 루프에 갇혀 있었다", "존재를 없애면 더 큰 봉인이 풀린다"] },
  { id: "romance", label: "💜 로맨스", name: "금단의 연", desc: "인간과 초자연 존재의 사랑 이야기",
    settings: ["벚꽃이 지는 고대 궁궐", "비밀의 온천 마을", "달빛 비치는 해변 동굴", "천년 된 도서관", "신계와 인간계의 경계"],
    hooks: ["정체를 숨기고 인간 세계에 온 존재", "어릴 때 구해준 은인을 찾는다", "꿈에서만 만나던 상대를 현실에서 만난다", "금기된 의식 중 눈이 마주친다"],
    twists: ["서로의 존재가 상대를 소멸시킨다", "과거 생의 비극이 반복된다", "사랑이 봉인의 열쇠였다", "한쪽이 기억을 잃어야 상대가 산다"] },
  { id: "adventure", label: "⚔️ 모험", name: "전설의 탐색", desc: "초자연 존재와 함께하는 퀘스트",
    settings: ["다섯 대륙을 잇는 영적 통로", "하늘 위 떠다니는 고대 도시", "심해의 잊혀진 문명", "세계수의 뿌리 속 미궁", "화산 속 용의 무덤"],
    hooks: ["세계의 봉인이 하나씩 풀리고 있다", "각 대륙의 수호 존재가 실종된다", "금지된 소환서를 손에 넣었다", "자신이 고대 퇴마사의 후손임을 알게 된다"],
    twists: ["적이었던 존재가 진정한 동맹이 된다", "수호자들이 스스로 봉인을 해제한 것이었다", "주인공 자체가 봉인의 일부였다", "최종 보스가 미래의 자신이었다"] },
  { id: "mystery", label: "🔮 미스터리", name: "기이한 사건", desc: "초자연 탐정 이야기",
    settings: ["100년 전 시간이 멈춘 저택", "현대 도시의 뒷골목 요괴 거리", "국제 민속학 연구소", "사라진 마을의 폐허", "심야 운행 열차"],
    hooks: ["사건마다 특정 민담 존재의 패턴이 나타난다", "피해자들이 모두 같은 전설을 들었다", "고대 유물이 경매에 나타난 후 연쇄 사건", "민속학 교수가 자신의 연구 대상에 의해 사라진다"],
    twists: ["사건의 범인이 인간이고 존재는 증인이었다", "모든 사건이 하나의 소환 의식이었다", "탐정 자신이 존재에게 선택받은 후계자", "사건은 존재들 간의 영토 전쟁이었다"] },
  { id: "comedy", label: "😂 코미디", name: "소동극", desc: "초자연 존재와 일상의 충돌",
    settings: ["현대 서울의 원룸 아파트", "요괴도 다니는 편의점", "초자연 존재 전용 SNS", "민속 박물관 야간 근무", "국제 민담 서밋 회의장"],
    hooks: ["소환을 잘못해서 집에 눌러앉은 존재", "존재가 인간 사회에 취직을 원한다", "여러 나라 존재들이 한 집에 모인다", "SNS 인플루언서 요괴"],
    twists: ["존재가 인간보다 인간적이었다", "코미디였던 상황이 세계적 위기로 확대", "모든 소동의 원인이 문화적 오해", "존재들의 리얼리티 쇼로 끝난다"] },
];

const CHARACTER_CLASSES = [
  { id: "exorcist", name: "퇴마사", icon: "⚡", desc: "고대의 의식과 봉인술로 존재를 제압", stats: { str: 3, int: 4, cha: 2, spd: 3, spr: 5 } },
  { id: "medium", name: "영매", icon: "👁", desc: "존재와 소통하며 영적 세계를 중재", stats: { str: 1, int: 3, cha: 5, spd: 2, spr: 5 } },
  { id: "hunter", name: "사냥꾼", icon: "🏹", desc: "물리적 힘과 함정으로 존재를 추적", stats: { str: 5, int: 3, cha: 1, spd: 5, spr: 2 } },
  { id: "scholar", name: "민속학자", icon: "📚", desc: "지식과 기록으로 존재의 약점을 파악", stats: { str: 1, int: 5, cha: 4, spd: 2, spr: 4 } },
  { id: "shaman", name: "무당/샤먼", icon: "🔮", desc: "자연의 힘을 빌려 존재와 교감", stats: { str: 2, int: 3, cha: 3, spd: 2, spr: 5 } },
  { id: "trickster", name: "사기꾼", icon: "🃏", desc: "기지와 속임수로 존재를 출 넘김", stats: { str: 2, int: 4, cha: 5, spd: 4, spr: 1 } },
  { id: "guardian", name: "수호자", icon: "🛡", desc: "신성한 유물과 결계로 사람들을 보호", stats: { str: 4, int: 2, cha: 3, spd: 2, spr: 5 } },
  { id: "cursed", name: "저주받은 자", icon: "🌑", desc: "존재의 힘이 깃든 반인반요 전사", stats: { str: 4, int: 2, cha: 1, spd: 4, spr: 4 } },
];

const STAT_NAMES = { str: "근력", int: "지능", cha: "매력", spd: "속도", spr: "영력" };
const STAT_COLORS = { str: "#ff4444", int: "#44aaff", cha: "#ff44aa", spd: "#44ff88", spr: "#aa44ff" };

const CHARACTER_ORIGINS = [
  "고아로 자란 후 은사의 가르침으로 각성",
  "가문 대대로 내려오는 퇴마 혈통",
  "어린 시절 존재와의 조우로 능력 획득",
  "사고로 임사 체험 후 영안이 열림",
  "고대 유물을 우연히 발견하여 계약",
  "존재에게 저주받았지만 그 힘을 역이용",
  "꿈에서 고대 존재에게 선택받음",
  "학술 연구 중 금기의 텍스트를 해독",
];

const CHARACTER_MOTIVATIONS = [
  "가족의 복수", "세계의 균형 수호", "잃어버린 기억 회복",
  "존재와의 공존 방법 모색", "최강의 존재 사냥",
  "고대 봉인의 진실 규명", "저주 해제", "사라진 동료 수색",
];

const WEBTOON_GENRES = [
  { id: "dark_fantasy", name: "다크 판타지", icon: "⚔️", color: "#ff4444", desc: "어둠과 공포 속 영웅의 서사" },
  { id: "horror", name: "호러/스릴러", icon: "👻", color: "#aa44ff", desc: "독자의 등골을 서늘하게" },
  { id: "romance_fantasy", name: "로맨스 판타지", icon: "💜", color: "#ff44aa", desc: "인간과 요괴의 금단의 사랑" },
  { id: "action", name: "액션/배틀", icon: "💥", color: "#ff8844", desc: "존재와의 전투와 성장" },
  { id: "comedy", name: "일상 코미디", icon: "😂", color: "#44ff88", desc: "요괴와 인간의 좌충우돌" },
  { id: "mystery", name: "추리/미스터리", icon: "🔍", color: "#44aaff", desc: "초자연 사건의 진실을 추적" },
];

const WEBTOON_STRUCTURES = [
  { name: "에피소드형", desc: "매화 독립된 사건, 종적 메타 서사 연결", episodes: "50~100화" },
  { name: "시즌제", desc: "시즌별 주요 아크, 시즌 간 캐릭터 성장", episodes: "시즌당 20~30화" },
  { name: "원샷 옴니버스", desc: "매화 다른 나라/존재 중심, 세계관 공유", episodes: "30~50화" },
  { name: "장편 연재", desc: "하나의 큰 서사를 장기 연재", episodes: "100화+" },
];

const IP_EXPANSION = [
  { name: "웹소설", icon: "📖", desc: "웹툰의 프리퀄/사이드 스토리 소설화" },
  { name: "게임화", icon: "🎮", desc: "RPG/수집형 게임으로 IP 확장" },
  { name: "애니메이션", icon: "🎬", desc: "시즌제 애니메이션 제작" },
  { name: "굿즈/MD", icon: "🧸", desc: "캐릭터 굿즈 및 아트북" },
  { name: "오디오드라마", icon: "🎧", desc: "음성 콘텐츠로 2차 확장" },
  { name: "메타버스", icon: "🌐", desc: "가상 세계 내 민담 체험" },
];

const PIE_COLORS = ["#ff4444","#ff8844","#ffcc44","#44ff88","#44aaff","#aa44ff","#ff44aa","#88ff44","#ff6644","#44ffcc","#8888ff","#ff88cc"];

// ── Helper: Radar chart data (continent comparison) ──
const getRadarData = (data) => {
  const stats = {};
  Object.keys(CONTINENT_COLORS).forEach(cont => { stats[cont] = { beings: 0, countries: 0, fearSum: 0, types: new Set(), maxFear: 0 }; });
  data.forEach(c => {
    const cont = CONTINENT_MAP[c.r];
    if (!stats[cont]) return;
    stats[cont].countries++;
    c.b.forEach(b => {
      stats[cont].beings++;
      stats[cont].fearSum += b.f;
      stats[cont].types.add(b.t);
      if (b.f > stats[cont].maxFear) stats[cont].maxFear = b.f;
    });
  });
  const metrics = ["존재 수", "국가 수", "평균 공포도", "타입 다양성", "최대 공포 밀도"];
  // Normalize each metric 0-100
  const maxBeings = Math.max(...Object.values(stats).map(s => s.beings));
  const maxCountries = Math.max(...Object.values(stats).map(s => s.countries));
  const maxTypes = Math.max(...Object.values(stats).map(s => s.types.size));
  return metrics.map(m => {
    const row = { metric: m };
    Object.entries(stats).forEach(([cont, s]) => {
      if (m === "존재 수") row[cont] = Math.round(s.beings / maxBeings * 100);
      else if (m === "국가 수") row[cont] = Math.round(s.countries / maxCountries * 100);
      else if (m === "평균 공포도") row[cont] = s.beings ? Math.round((s.fearSum / s.beings) / 10 * 100) : 0;
      else if (m === "타입 다양성") row[cont] = Math.round(s.types.size / maxTypes * 100);
      else if (m === "최대 공포 밀도") {
        const f5count = 0;
        row[cont] = s.beings ? Math.round(s.beings > 0 ? (s.fearSum / s.beings / 10 * 100) * (s.maxFear / 10) : 0) : 0;
      }
    });
    return row;
  });
};

// ── Helper: Fear spectrum data ──
const getFearSpectrum = (data) => {
  const buckets = [
    { level: 2, label: "장난", color: "#88ccff", beings: [] },
    { level: 4, label: "불안", color: "#44aaff", beings: [] },
    { level: 5, label: "위험", color: "#44ddaa", beings: [] },
    { level: 7, label: "공포", color: "#ffcc44", beings: [] },
    { level: 8, label: "악몽", color: "#ff8844", beings: [] },
    { level: 9, label: "재앙", color: "#ff4444", beings: [] },
    { level: 10, label: "종말", color: "#cc00ff", beings: [] },
  ];
  data.forEach(c => c.b.forEach(b => {
    const bucket = buckets.find(bk => bk.level === b.f);
    if (bucket) bucket.beings.push({ ...b, country: c.c, continent: CONTINENT_MAP[c.r] });
  }));
  return buckets;
};

const TYPE_ICONS = {
  Ghost: "👻", "Vengeful Ghost": "👻", "Vengeful Spirit": "👻", Spirit: "👻", "Evil Spirit": "👻",
  Demon: "😈", "Water Demon": "🌊", Shapeshifter: "🦊", Vampire: "🧛", Undead: "💀",
  Witch: "🧙", Sorcerer: "🧙", Beast: "🐺", Cryptid: "👁", "Wild Man": "🦍",
  Dragon: "🐲", Trickster: "🃏", "Trickster Spirit": "🃏", Giant: "🗿",
  Fairy: "🧚", "Forest Spirit": "🌲", "Nature Spirit": "🌿", "Water Spirit": "💧",
  Predator: "🐾", Ogre: "👹", Serpent: "🐍", "Sea Monster": "🐙",
  default: "☠️",
};
const getTypeIcon = (type) => {
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return TYPE_ICONS.default;
};

// ═══════════════════════════════════════════════════════════════
//  SVG CREATURE PORTRAIT SYSTEM
// ═══════════════════════════════════════════════════════════════
const CPORT = {
"Gumiho (구미호)":(c)=><g><path d="M50,28 C42,28 36,35 36,45 C36,55 40,62 44,68 L44,78 L56,78 L56,68 C60,62 64,55 64,45 C64,35 58,28 50,28Z" fill={c} opacity="0.85"/><path d="M40,30 L34,12 L44,26Z" fill={c} opacity="0.9"/><path d="M60,30 L66,12 L56,26Z" fill={c} opacity="0.9"/><path d="M40,30 L37,16 L43,27Z" fill="#fff" opacity="0.15"/><path d="M60,30 L63,16 L57,27Z" fill="#fff" opacity="0.15"/><ellipse cx="44" cy="40" rx="3" ry="2" fill="#000" opacity="0.7"/><ellipse cx="56" cy="40" rx="3" ry="2" fill="#000" opacity="0.7"/><path d="M48,47 Q50,49 52,47" stroke="#000" strokeWidth="1" fill="none" opacity="0.5"/><path d="M50,72 Q30,65 20,50" stroke={c} strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/><path d="M50,72 Q28,68 16,58" stroke={c} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M50,72 Q32,72 22,68" stroke={c} strokeWidth="3" fill="none" opacity="0.65" strokeLinecap="round"/><path d="M50,72 Q35,78 24,78" stroke={c} strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round"/><path d="M50,72 Q70,65 80,50" stroke={c} strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/><path d="M50,72 Q72,68 84,58" stroke={c} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M50,72 Q68,72 78,68" stroke={c} strokeWidth="3" fill="none" opacity="0.65" strokeLinecap="round"/><path d="M50,72 Q58,82 68,86" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Dokkaebi (도깨비)":(c)=><g><path d="M50,25 C40,25 33,34 33,46 C33,58 38,66 42,72 L42,82 L58,82 L58,72 C62,66 67,58 67,46 C67,34 60,25 50,25Z" fill={c} opacity="0.8"/><path d="M42,28 Q38,18 44,14 Q50,10 56,14 Q62,18 58,28" fill={c} opacity="0.9"/><circle cx="42" cy="42" r="4" fill="#000" opacity="0.6"/><circle cx="42" cy="41" r="2" fill="#fff" opacity="0.3"/><circle cx="58" cy="42" r="4" fill="#000" opacity="0.6"/><circle cx="58" cy="41" r="2" fill="#fff" opacity="0.3"/><path d="M42,52 Q50,60 58,52" stroke="#000" strokeWidth="2" fill="none" opacity="0.5"/><rect x="68" y="30" width="8" height="36" rx="4" fill={c} opacity="0.7" transform="rotate(15,72,48)"/><circle cx="72" cy="30" r="6" fill={c} opacity="0.8" transform="rotate(15,72,48)"/></g>,
"Cheonyeo Gwishin (처녀귀신)":(c)=><g><path d="M36,20 Q34,40 30,65 Q28,80 32,90" stroke="#333" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M64,20 Q66,40 70,65 Q72,80 68,90" stroke="#333" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round"/><ellipse cx="50" cy="30" rx="14" ry="16" fill={c} opacity="0.7"/><path d="M38,44 L36,90 Q50,95 64,90 L62,44 Q50,48 38,44Z" fill={c} opacity="0.5"/><ellipse cx="46" cy="32" rx="2" ry="3" fill="#000" opacity="0.8"/><ellipse cx="54" cy="32" rx="2" ry="3" fill="#000" opacity="0.8"/><path d="M46,35 L45,42" stroke={c} strokeWidth="0.8" opacity="0.6"/><path d="M54,35 L55,42" stroke={c} strokeWidth="0.8" opacity="0.6"/><path d="M36,85 Q50,92 64,85 Q62,95 50,98 Q38,95 36,85Z" fill={c} opacity="0.2"/></g>,
"Haetae (해태)":(c)=><g><path d="M26,50 C26,38 36,28 50,28 C64,28 74,38 74,50 C74,62 64,72 50,72 C36,72 26,62 26,50Z" fill={c} opacity="0.75"/><path d="M34,32 Q28,22 36,18 Q44,14 50,18 Q56,14 64,18 Q72,22 66,32" fill={c} opacity="0.9"/><circle cx="42" cy="42" r="5" fill="#fff" opacity="0.3"/><circle cx="42" cy="42" r="3" fill="#000" opacity="0.7"/><circle cx="58" cy="42" r="5" fill="#fff" opacity="0.3"/><circle cx="58" cy="42" r="3" fill="#000" opacity="0.7"/><rect x="32" y="66" width="8" height="14" rx="4" fill={c} opacity="0.7"/><rect x="60" y="66" width="8" height="14" rx="4" fill={c} opacity="0.7"/></g>,
"Imugi (이무기)":(c)=><g><path d="M70,80 Q75,70 70,60 Q65,50 58,48 Q50,46 44,50 Q38,54 36,62 Q34,70 38,76 Q42,82 48,80 Q54,78 56,72 Q58,66 54,62" stroke={c} strokeWidth="8" fill="none" opacity="0.8" strokeLinecap="round"/><ellipse cx="44" cy="56" rx="10" ry="8" fill={c} opacity="0.9"/><circle cx="40" cy="54" r="2.5" fill="#fff" opacity="0.4"/><circle cx="40" cy="54" r="1.5" fill="#000" opacity="0.8"/><circle cx="48" cy="54" r="2.5" fill="#fff" opacity="0.4"/><circle cx="48" cy="54" r="1.5" fill="#000" opacity="0.8"/><circle cx="44" cy="36" r="5" fill={c} opacity="0.3"/><circle cx="44" cy="36" r="3" fill="#fff" opacity="0.15"/></g>,
"Jeoseung Saja (저승사자)":(c)=><g><rect x="38" y="10" width="24" height="20" rx="2" fill="#111" opacity="0.9"/><ellipse cx="50" cy="30" rx="20" ry="4" fill="#111" opacity="0.8"/><ellipse cx="50" cy="36" rx="10" ry="8" fill={c} opacity="0.4"/><ellipse cx="46" cy="35" rx="1.5" ry="2" fill="#fff" opacity="0.6"/><ellipse cx="54" cy="35" rx="1.5" ry="2" fill="#fff" opacity="0.6"/><path d="M38,42 L32,92 Q50,96 68,92 L62,42 Q50,46 38,42Z" fill="#111" opacity="0.85"/><path d="M38,52 Q50,56 62,52" stroke={c} strokeWidth="1.5" fill="none" opacity="0.4"/><path d="M66,55 L78,50 L80,54 L76,58 L80,62" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Bulgasari (불가사리)":(c)=><g><path d="M28,42 C28,30 38,22 50,22 C62,22 72,30 72,42 C72,56 64,66 58,74 L42,74 C36,66 28,56 28,42Z" fill={c} opacity="0.85"/><path d="M34,26 L28,14 L38,22Z" fill={c} opacity="0.7"/><path d="M66,26 L72,14 L62,22Z" fill={c} opacity="0.7"/><circle cx="42" cy="38" r="4" fill="#000" opacity="0.6"/><circle cx="58" cy="38" r="4" fill="#000" opacity="0.6"/><path d="M42,50 L46,46 L50,50 L54,46 L58,50" stroke="#444" strokeWidth="2" fill="none" opacity="0.6"/><rect x="36" y="70" width="10" height="10" rx="3" fill={c} opacity="0.6"/><rect x="54" y="70" width="10" height="10" rx="3" fill={c} opacity="0.6"/></g>,
"Jangsanbum (장산범)":(c)=><g><path d="M50,14 C42,14 36,22 36,34 C36,48 40,60 44,70 L44,88 L56,88 L56,70 C60,60 64,48 64,34 C64,22 58,14 50,14Z" fill={c} opacity="0.75"/><path d="M36,20 Q30,30 28,50 Q26,70 30,88" stroke={c} strokeWidth="3" fill="none" opacity="0.3"/><path d="M64,20 Q70,30 72,50 Q74,70 70,88" stroke={c} strokeWidth="3" fill="none" opacity="0.3"/><circle cx="44" cy="32" r="3" fill="#000" opacity="0.8"/><circle cx="56" cy="32" r="3" fill="#000" opacity="0.8"/><path d="M44,42 Q50,48 56,42" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/></g>,
"Kuchisake-onna":(c)=><g><path d="M34,20 Q30,45 28,75" stroke="#222" strokeWidth="5" fill="none" opacity="0.7"/><path d="M66,20 Q70,45 72,75" stroke="#222" strokeWidth="5" fill="none" opacity="0.7"/><ellipse cx="50" cy="36" rx="14" ry="16" fill={c} opacity="0.65"/><ellipse cx="44" cy="32" rx="3" ry="2" fill="#000" opacity="0.8"/><ellipse cx="56" cy="32" rx="3" ry="2" fill="#000" opacity="0.8"/><path d="M36,40 Q50,44 64,40" stroke="#ff0000" strokeWidth="1.5" fill="none" opacity="0.7"/><path d="M72,50 L78,42 M72,50 L78,58" stroke={c} strokeWidth="2" opacity="0.6" strokeLinecap="round"/></g>,
"Oni":(c)=><g><path d="M30,40 C30,28 38,20 50,20 C62,20 70,28 70,40 C70,55 65,68 60,76 L40,76 C35,68 30,55 30,40Z" fill={c} opacity="0.85"/><path d="M40,22 L36,6 L42,18Z" fill="#fff" opacity="0.4"/><path d="M60,22 L64,6 L58,18Z" fill="#fff" opacity="0.4"/><path d="M38,36 L46,38 L40,40Z" fill="#000" opacity="0.7"/><path d="M62,36 L54,38 L60,40Z" fill="#000" opacity="0.7"/><path d="M40,48 L48,44 L56,48 L60,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/><rect x="70" y="24" width="8" height="48" rx="3" fill={c} opacity="0.6" transform="rotate(10,74,48)"/></g>,
"Jiangshi":(c)=><g><rect x="36" y="18" width="28" height="34" rx="4" fill={c} opacity="0.8"/><rect x="32" y="14" width="36" height="8" rx="2" fill={c} opacity="0.6"/><rect x="40" y="6" width="20" height="10" rx="2" fill="#ddcc44" opacity="0.5"/><circle cx="44" cy="30" r="2.5" fill="#000" opacity="0.7"/><circle cx="56" cy="30" r="2.5" fill="#000" opacity="0.7"/><path d="M36,52 L36,82 L42,82 L42,58" fill={c} opacity="0.7"/><path d="M64,52 L64,82 L58,82 L58,58" fill={c} opacity="0.7"/></g>,
"Krasue":(c)=><g><ellipse cx="50" cy="28" rx="14" ry="16" fill={c} opacity="0.8"/><path d="M36,18 Q32,10 36,6 Q42,2 46,8" stroke="#222" strokeWidth="3" fill="none" opacity="0.5"/><path d="M64,18 Q68,10 64,6 Q58,2 54,8" stroke="#222" strokeWidth="3" fill="none" opacity="0.5"/><ellipse cx="44" cy="26" rx="3" ry="3.5" fill="#000" opacity="0.7"/><ellipse cx="56" cy="26" rx="3" ry="3.5" fill="#000" opacity="0.7"/><path d="M44,42 Q40,56 42,72 Q44,82 46,90" stroke="#aa0000" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M50,42 Q50,60 48,76" stroke="#aa0000" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M56,42 Q60,56 58,72" stroke="#aa0000" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Strigoi":(c)=><g><path d="M50,16 C40,16 32,24 32,36 C32,48 40,56 42,62 L42,80 L58,80 L58,62 C60,56 68,48 68,36 C68,24 60,16 50,16Z" fill={c} opacity="0.75"/><path d="M32,36 L22,70 Q50,80 78,70 L68,36" fill={c} opacity="0.25"/><path d="M46,46 L47,52 L48,46" fill="#fff" opacity="0.7"/><path d="M52,46 L53,52 L54,46" fill="#fff" opacity="0.7"/></g>,
"Draugr":(c)=><g><path d="M50,10 C38,10 28,20 28,34 C28,42 32,48 32,48 L28,50 L34,52 L34,64 L30,70 L36,68 L40,78 L50,82 L60,78 L64,68 L70,70 L66,64 L66,52 L72,50 L68,48 C68,48 72,42 72,34 C72,20 62,10 50,10Z" fill={c} opacity="0.8"/><rect x="38" y="28" width="8" height="12" rx="2" fill="#4488ff" opacity="0.5"/><rect x="54" y="28" width="8" height="12" rx="2" fill="#4488ff" opacity="0.5"/><path d="M40,48 L46,44 L52,48 L58,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/></g>,
"Wendigo":(c)=><g><path d="M50,10 C42,10 36,18 36,28 L36,60 C36,68 40,74 44,78 L44,90 L56,90 L56,78 C60,74 64,68 64,60 L64,28 C64,18 58,10 50,10Z" fill={c} opacity="0.8"/><path d="M40,14 L34,4 L28,2" stroke={c} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M60,14 L66,4 L72,2" stroke={c} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/><circle cx="44" cy="28" r="4" fill="#000" opacity="0.7"/><circle cx="56" cy="28" r="4" fill="#000" opacity="0.7"/><path d="M36,44 L28,42 L24,50" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M64,44 L72,42 L76,50" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Dullahan":(c)=><g><path d="M50,40 C42,40 36,46 36,54 L36,82 L64,82 L64,54 C64,46 58,40 50,40Z" fill={c} opacity="0.7"/><path d="M36,48 L28,76 Q50,82 72,76 L64,48" fill={c} opacity="0.25"/><circle cx="32" cy="26" r="12" fill={c} opacity="0.8"/><circle cx="28" cy="24" r="2.5" fill="#000" opacity="0.7"/><circle cx="36" cy="24" r="2.5" fill="#000" opacity="0.7"/><path d="M36,38 L36,48" stroke={c} strokeWidth="1.5" opacity="0.4"/></g>,
"Baba Yaga":(c)=><g><path d="M50,4 L38,28 L62,28Z" fill={c} opacity="0.8"/><ellipse cx="50" cy="28" rx="14" ry="4" fill={c} opacity="0.6"/><ellipse cx="50" cy="40" rx="10" ry="12" fill={c} opacity="0.65"/><circle cx="46" cy="38" r="2" fill="#000" opacity="0.6"/><circle cx="54" cy="38" r="2" fill="#000" opacity="0.6"/><path d="M38,52 L32,88 Q50,92 68,88 L62,52Z" fill={c} opacity="0.4"/><path d="M42,88 L42,96 M50,90 L50,98 M58,88 L58,96" stroke={c} strokeWidth="2" opacity="0.5" strokeLinecap="round"/></g>,
"La Llorona":(c)=><g><path d="M36,16 Q32,36 30,60 Q28,78 32,92" stroke="#333" strokeWidth="3" fill="none" opacity="0.5"/><path d="M64,16 Q68,36 70,60 Q72,78 68,92" stroke="#333" strokeWidth="3" fill="none" opacity="0.5"/><ellipse cx="50" cy="28" rx="12" ry="14" fill={c} opacity="0.65"/><path d="M38,40 L34,92 Q50,96 66,92 L62,40Z" fill={c} opacity="0.45"/><ellipse cx="46" cy="28" rx="2" ry="3" fill="#000" opacity="0.7"/><ellipse cx="54" cy="28" rx="2" ry="3" fill="#000" opacity="0.7"/><path d="M46,32 L44,40" stroke="#6688cc" strokeWidth="0.8" opacity="0.5"/><path d="M54,32 L56,40" stroke="#6688cc" strokeWidth="0.8" opacity="0.5"/></g>,
"Ammit":(c)=><g><path d="M30,36 C30,24 38,18 50,18 C62,18 70,24 70,36 L70,58 C70,66 62,72 50,72 C38,72 30,66 30,58Z" fill={c} opacity="0.8"/><ellipse cx="42" cy="34" rx="4" ry="5" fill="#fff" opacity="0.3"/><circle cx="42" cy="34" r="2.5" fill="#000" opacity="0.7"/><ellipse cx="58" cy="34" rx="4" ry="5" fill="#fff" opacity="0.3"/><circle cx="58" cy="34" r="2.5" fill="#000" opacity="0.7"/><path d="M36,50 L44,44 L52,50 L60,44 L64,50" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5"/><rect x="30" y="68" width="10" height="16" rx="4" fill={c} opacity="0.6"/><rect x="60" y="68" width="10" height="16" rx="4" fill={c} opacity="0.6"/></g>,
"Aswang":(c)=><g><path d="M50,18 C42,18 36,26 36,36 C36,46 40,54 44,60 L44,78 L56,78 L56,60 C60,54 64,46 64,36 C64,26 58,18 50,18Z" fill={c} opacity="0.8"/><circle cx="44" cy="34" r="3" fill="#000" opacity="0.7"/><circle cx="56" cy="34" r="3" fill="#000" opacity="0.7"/><path d="M46,44 L48,50 L50,44" fill="#fff" opacity="0.6"/><path d="M50,44 L52,50 L54,44" fill="#fff" opacity="0.6"/><path d="M36,36 L26,32 Q28,38 24,42" stroke={c} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M64,36 L74,32 Q72,38 76,42" stroke={c} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/></g>,
"Manananggal":(c)=><g><ellipse cx="50" cy="28" rx="12" ry="14" fill={c} opacity="0.8"/><ellipse cx="44" cy="26" rx="2.5" ry="3" fill="#000" opacity="0.7"/><ellipse cx="56" cy="26" rx="2.5" ry="3" fill="#000" opacity="0.7"/><path d="M46,34 L47,38 L48,34" fill="#fff" opacity="0.6"/><path d="M52,34 L53,38 L54,34" fill="#fff" opacity="0.6"/><path d="M38,30 L24,18 L30,32 L18,24 L28,36" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M62,30 L76,18 L70,32 L82,24 L72,36" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M44,42 Q40,56 42,72 Q44,82 46,90" stroke="#880000" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M56,42 Q60,56 58,72 Q56,82 54,90" stroke="#880000" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/></g>,
"Skinwalker":(c)=><g><path d="M50,14 C42,14 36,22 36,34 C36,48 42,58 46,66 L46,84 L54,84 L54,66 C58,58 64,48 64,34 C64,22 58,14 50,14Z" fill={c} opacity="0.6"/><path d="M36,28 C28,24 24,32 30,38" stroke={c} strokeWidth="2" fill="none" opacity="0.3"/><path d="M64,28 C72,24 76,32 70,38" stroke={c} strokeWidth="2" fill="none" opacity="0.3"/><circle cx="44" cy="30" r="3" fill="#ff4444" opacity="0.5"/><circle cx="56" cy="30" r="3" fill="#ff4444" opacity="0.5"/><path d="M44,42 Q50,46 56,42" stroke="#000" strokeWidth="1" fill="none" opacity="0.4"/><path d="M42,14 L38,8 L44,12Z" fill={c} opacity="0.4"/><path d="M58,14 L62,8 L56,12Z" fill={c} opacity="0.4"/><path d="M34,50 Q26,52 22,58" stroke={c} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="3,3"/><path d="M66,50 Q74,52 78,58" stroke={c} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="3,3"/></g>,
};
// Type-based fallbacks
const TPORT = {
ghost:(c)=><g><path d="M50,18 C38,18 30,28 30,42 L30,62 C30,64 32,66 34,64 L38,60 C40,58 42,60 44,62 L48,66 C50,68 52,66 56,62 C58,60 60,58 62,60 L66,64 C68,66 70,64 70,62 L70,42 C70,28 62,18 50,18Z" fill={c} opacity="0.7"/><ellipse cx="42" cy="36" rx="5" ry="6" fill="#000" opacity="0.6"/><ellipse cx="58" cy="36" rx="5" ry="6" fill="#000" opacity="0.6"/><ellipse cx="50" cy="48" rx="4" ry="5" fill="#000" opacity="0.4"/></g>,
vampire:(c)=><g><path d="M50,16 C40,16 32,24 32,36 C32,48 40,56 42,62 L42,80 L58,80 L58,62 C60,56 68,48 68,36 C68,24 60,16 50,16Z" fill={c} opacity="0.75"/><path d="M32,36 L22,70 Q50,80 78,70 L68,36" fill={c} opacity="0.25"/><path d="M46,46 L47,52 L48,46" fill="#fff" opacity="0.7"/><path d="M52,46 L53,52 L54,46" fill="#fff" opacity="0.7"/></g>,
demon:(c)=><g><path d="M50,8 C38,8 28,20 28,36 C28,52 36,66 42,74 L58,74 C64,66 72,52 72,36 C72,20 62,8 50,8Z" fill={c} opacity="0.8"/><path d="M38,14 L30,0 L40,10Z" fill={c} opacity="0.9"/><path d="M62,14 L70,0 L60,10Z" fill={c} opacity="0.9"/><path d="M42,46 L50,42 L58,46" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.5"/></g>,
beast:(c)=><g><path d="M50,12 C36,12 24,24 24,40 C24,56 34,68 44,76 L56,76 C66,68 76,56 76,40 C76,24 64,12 50,12Z" fill={c} opacity="0.8"/><path d="M34,18 L28,6 L38,14Z" fill={c} opacity="0.7"/><path d="M66,18 L72,6 L62,14Z" fill={c} opacity="0.7"/><circle cx="40" cy="36" r="3" fill="#000" opacity="0.7"/><circle cx="60" cy="36" r="3" fill="#000" opacity="0.7"/><path d="M42,50 L50,46 L58,50" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/></g>,
undead:(c)=><g><path d="M50,10 C38,10 28,20 28,34 C28,42 32,48 32,48 L28,50 L34,52 L34,64 L30,70 L36,68 L40,78 L50,82 L60,78 L64,68 L70,70 L66,64 L66,52 L72,50 L68,48 C68,48 72,42 72,34 C72,20 62,10 50,10Z" fill={c} opacity="0.8"/><rect x="38" y="28" width="8" height="10" rx="2" fill="#000" opacity="0.7"/><rect x="54" y="28" width="8" height="10" rx="2" fill="#000" opacity="0.7"/></g>,
witch:(c)=><g><path d="M50,2 L38,28 L62,28Z" fill={c} opacity="0.85"/><ellipse cx="50" cy="40" rx="10" ry="12" fill={c} opacity="0.65"/><circle cx="46" cy="38" r="2" fill="#000" opacity="0.6"/><circle cx="54" cy="38" r="2" fill="#000" opacity="0.6"/><path d="M38,52 L32,88 Q50,92 68,88 L62,52Z" fill={c} opacity="0.4"/></g>,
water:(c)=><g><path d="M20,50 Q30,30 50,30 Q70,30 80,50 Q70,70 50,75 Q30,70 20,50Z" fill={c} opacity="0.6"/><circle cx="40" cy="42" r="3" fill="#000" opacity="0.5"/><circle cx="60" cy="42" r="3" fill="#000" opacity="0.5"/><circle cx="24" cy="60" r="2" fill={c} opacity="0.2"/><circle cx="76" cy="58" r="3" fill={c} opacity="0.15"/></g>,
serpent:(c)=><g><path d="M25,80 Q20,68 28,56 Q36,44 48,40 Q60,36 68,42 Q76,48 74,60 Q72,72 62,72 Q52,72 52,62" stroke={c} strokeWidth="7" fill="none" opacity="0.75" strokeLinecap="round"/><ellipse cx="68" cy="40" rx="8" ry="6" fill={c} opacity="0.9"/><circle cx="65" cy="38" r="2" fill="#000" opacity="0.7"/><circle cx="71" cy="38" r="2" fill="#000" opacity="0.7"/></g>,
trickster:(c)=><g><path d="M50,12 C42,12 34,20 34,32 C34,44 38,54 42,62 L42,80 L58,80 L58,62 C62,54 66,44 66,32 C66,20 58,12 50,12Z" fill={c} opacity="0.75"/><path d="M40,16 L36,6 L42,14Z" fill={c} opacity="0.6"/><path d="M60,16 L64,6 L58,14Z" fill={c} opacity="0.6"/><path d="M42,44 Q50,52 58,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.5"/></g>,
fairy:(c)=><g><ellipse cx="50" cy="42" rx="8" ry="12" fill={c} opacity="0.7"/><path d="M42,36 C34,26 30,32 38,42Z" fill={c} opacity="0.35"/><path d="M58,36 C66,26 70,32 62,42Z" fill={c} opacity="0.35"/><circle cx="47" cy="38" r="1.5" fill="#fff" opacity="0.6"/><circle cx="53" cy="38" r="1.5" fill="#fff" opacity="0.6"/></g>,
df:(c)=><g><circle cx="50" cy="42" r="18" fill={c} opacity="0.6"/><circle cx="44" cy="38" r="3" fill="#000" opacity="0.5"/><circle cx="56" cy="38" r="3" fill="#000" opacity="0.5"/></g>,
};

const getPortrait = (name, type, color) => {
  if (CPORT[name]) return CPORT[name](color);
  const t = type.toLowerCase();
  if (t.includes("ghost") || (t.includes("spirit") && !t.includes("water") && !t.includes("forest") && !t.includes("nature"))) return TPORT.ghost(color);
  if (t.includes("vampire")) return TPORT.vampire(color);
  if (t.includes("demon") || t.includes("devil")) return TPORT.demon(color);
  if (t.includes("beast") || t.includes("wolf") || t.includes("predator") || t.includes("werewolf")) return TPORT.beast(color);
  if (t.includes("undead") || t.includes("zombie")) return TPORT.undead(color);
  if (t.includes("witch") || t.includes("hag") || t.includes("sorcerer")) return TPORT.witch(color);
  if (t.includes("water") || t.includes("sea") || t.includes("river")) return TPORT.water(color);
  if (t.includes("serpent") || t.includes("dragon") || t.includes("snake")) return TPORT.serpent(color);
  if (t.includes("trickster") || t.includes("goblin") || t.includes("imp")) return TPORT.trickster(color);
  if (t.includes("fairy") || t.includes("nymph")) return TPORT.fairy(color);
  return TPORT.df(color);
};

const Portrait = ({ name, type, color, size = 60, glow = false, animate = false }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{
    filter: glow ? `drop-shadow(0 0 ${size/5}px ${color}88)` : "none",
    animation: animate ? "creatureFloat 3.5s ease-in-out infinite" : "none",
    flexShrink: 0,
  }}>
    {getPortrait(name, type, color)}
  </svg>
);

// ── Detailed World Map SVG paths (realistic continent outlines) ──────
const CONTINENT_PATHS = {
  NorthAmerica: "M130,28 L155,25 170,30 195,28 225,32 250,28 268,35 275,48 262,55 258,62 270,68 265,78 248,85 240,95 235,108 228,118 222,128 218,138 210,148 202,158 195,168 188,178 185,185 190,192 198,188 208,185 215,192 210,198 205,205 208,212 215,218 222,225 228,232 232,238 225,242 218,238 210,235 200,232 195,228 188,225 182,220 175,215 170,210 165,218 158,215 148,210 142,202 138,195 135,188 128,178 122,168 120,155 118,142 115,128 112,115 115,102 118,92 122,82 128,72 135,62 140,52 138,42 Z",
  SouthAmerica: "M225,245 L232,248 240,252 248,258 258,262 268,265 275,272 280,280 285,290 290,298 295,308 298,318 300,328 298,338 295,348 290,358 285,365 278,372 272,378 268,385 262,390 255,395 248,398 242,395 238,388 235,378 230,368 225,358 222,348 218,338 215,328 212,318 210,308 212,298 215,288 218,278 222,268 225,258 Z",
  Europe: "M430,28 L438,25 448,28 458,32 468,30 478,35 488,38 498,35 508,38 518,42 528,48 535,55 538,62 540,72 542,82 540,92 538,98 535,105 530,112 525,118 520,125 515,132 508,138 502,142 495,145 488,142 480,138 472,135 465,132 458,128 452,125 448,120 442,115 438,110 435,105 432,98 430,92 428,85 425,78 422,70 420,62 418,55 420,48 422,42 425,35 Z",
  Africa: "M428,162 L435,158 442,155 450,158 458,162 468,165 478,168 488,172 498,178 505,185 510,192 515,200 518,210 520,220 522,232 524,242 525,255 524,268 522,280 520,292 518,305 515,318 512,330 508,342 502,352 498,362 492,370 485,378 478,382 470,385 462,382 455,378 448,372 442,365 438,355 435,345 432,335 430,325 428,315 425,305 422,295 420,285 418,275 418,265 420,255 422,242 425,230 428,218 430,208 432,198 430,188 428,178 Z",
  Asia: "M540,25 L555,22 570,25 585,28 600,30 618,28 635,32 650,28 668,25 685,30 700,35 715,38 728,42 740,48 752,55 760,62 768,72 775,82 780,95 782,108 780,118 775,128 768,140 760,152 752,165 748,175 742,185 735,195 728,205 720,215 712,225 705,232 698,238 690,242 682,238 675,232 668,228 660,232 652,240 645,250 640,260 632,268 625,272 618,268 610,260 602,255 595,260 588,268 580,270 572,265 565,258 558,252 550,248 545,242 542,232 540,222 538,212 535,200 532,190 530,180 532,168 535,158 538,148 540,138 542,128 544,118 545,108 544,98 542,88 540,78 538,68 535,58 534,48 535,38 Z",
  Oceania: "M718,280 L728,278 742,282 755,285 768,288 778,292 788,298 798,305 808,312 815,320 820,330 822,340 818,348 812,355 805,360 798,365 790,368 780,370 770,368 760,365 752,360 745,355 738,348 732,340 728,332 725,322 722,312 720,302 718,292 Z",
  // Islands and additional landmasses
  Japan: "M718,120 L722,115 728,118 732,125 730,135 726,142 722,148 718,142 716,135 715,128 Z",
  UKIsland: "M448,68 L455,65 460,70 458,78 455,85 450,82 447,76 Z",
  Indonesia: "M665,255 L675,252 688,255 700,258 712,260 722,258 732,262 740,268 735,272 725,275 715,272 705,268 695,265 685,262 675,260 Z",
  NewZealand: "M798,372 L802,368 808,372 806,380 802,385 798,380 Z",
  Madagascar: "M548,320 L552,315 556,318 558,328 555,338 550,335 548,328 Z",
  SriLanka: "M628,240 L632,238 635,242 633,248 630,245 Z",
  Philippines: "M708,198 L712,195 716,200 714,208 710,205 Z",
  Taiwan: "M702,172 L706,170 708,175 705,180 702,177 Z",
};

// Country positions (Mercator-projected, viewBox 80 10 780 400)
const COUNTRY_POSITIONS = {
  // East Asia
  KR:[695,138],JP:[722,132],CN:[662,148],MN:[652,108],TW:[703,172],
  // Southeast Asia
  VN:[672,198],TH:[662,208],PH:[710,205],ID:[698,260],MY:[680,242],
  KH:[667,212],MM:[652,198],LA:[662,202],SG:[682,250],BN:[696,238],
  // South Asia
  IN:[618,208],NP:[622,182],LK:[630,242],PK:[598,180],BD:[636,198],AF:[590,162],BT:[636,188],MV:[615,258],
  // Central Asia
  KZ:[600,108],UZ:[592,128],KG:[612,130],TJ:[607,138],TM:[587,140],
  // West Asia
  IR:[577,168],TR:[535,148],SA:[558,208],IQ:[555,172],IL:[528,190],
  LB:[528,182],JO:[533,192],YE:[563,228],OM:[578,218],AE:[575,212],GE:[555,138],AM:[550,142],AZ:[558,138],
  // Northern Europe
  NO:[472,42],SE:[488,42],DK:[478,72],FI:[508,38],IS:[418,32],
  // Western Europe
  GB:[452,72],IE:[440,72],FR:[462,105],DE:[482,88],NL:[472,78],BE:[470,88],AT:[490,100],CH:[476,102],
  // Southern Europe  
  SCT:[450,62],WLS:[448,78],
  GR:[510,138],IT:[490,120],ES:[448,128],PT:[438,132],MT:[488,142],CY:[535,158],AL:[505,132],BA:[500,122],
  // Eastern Europe
  RO:[510,112],RU:[580,68],PL:[498,85],CZ:[492,90],HU:[502,105],
  UA:[528,95],RS:[505,115],HR:[496,112],BG:[515,118],LT:[503,68],LV:[507,65],EE:[510,58],SK:[498,96],SI:[492,108],MK:[508,125],
  // North Africa
  EG:[530,198],MA:[438,178],TN:[475,165],DZ:[460,172],LY:[492,182],SD:[538,222],
  // West Africa
  NG:[470,228],GH:[455,235],SN:[422,225],ML:[445,218],CI:[450,238],CM:[480,238],BJ:[468,232],TG:[462,234],GN:[435,232],SL:[432,238],BF:[455,222],
  // East Africa
  ET:[542,232],KE:[542,258],TZ:[538,270],UG:[532,252],RW:[530,262],SO:[558,242],ER:[542,218],
  // Southern Africa  
  ZA:[498,375],ZW:[518,338],BW:[508,340],NA:[488,345],MG:[553,328],MZ:[538,330],AO:[482,300],ZM:[518,312],MU:[568,315],
  // Central Africa
  CD:[510,278],
  // North America
  US:[205,128],CA:[195,72],GL:[345,28],
  // Central America
  MX:[185,188],GT:[200,210],HN:[210,212],SV:[205,215],CR:[212,225],PA:[222,230],NI:[208,218],BZ:[205,205],
  // Caribbean
  CU:[228,195],HT:[245,198],JM:[232,202],DO:[252,200],TT:[268,218],PR:[258,200],
  // South America
  BR:[278,310],AR:[262,378],CO:[248,252],PE:[245,288],CL:[252,368],VE:[262,242],EC:[238,268],BO:[265,318],PY:[275,340],UY:[278,365],GY:[270,248],SR:[275,245],
  // Oceania
  AU:[758,345],NZ:[800,378],PG:[758,282],FJ:[808,312],WS:[828,302],TO:[818,318],VU:[795,302],SB:[778,290],
};

// ── Styles ──────────────────────────────────────────────────
const createStyles = (theme) => ({
  app: {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${theme.bg} 0%, #000000 100%)`,
    color: theme.text,
    fontFamily: "'Crimson Text', 'Noto Serif KR', Georgia, serif",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    textAlign: "center",
    padding: "32px 16px 16px",
    position: "relative",
    zIndex: 2,
  },
  title: {
    fontSize: "clamp(24px, 5vw, 42px)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: `linear-gradient(135deg, ${theme.accent}, #ffffff, ${theme.accent})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "none",
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "clamp(11px, 2vw, 14px)",
    opacity: 0.5,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    marginTop: 8,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
    fontSize: "clamp(11px, 1.8vw, 13px)",
    opacity: 0.6,
  },
  continentNav: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "12px 16px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 2,
  },
  continentBtn: (active, color) => ({
    padding: "8px 16px",
    borderRadius: 20,
    border: `1px solid ${active ? color : "#333"}`,
    background: active ? color + "22" : "transparent",
    color: active ? color : "#888",
    cursor: "pointer",
    fontSize: "clamp(11px, 1.8vw, 13px)",
    fontFamily: "'Crimson Text', serif",
    fontWeight: active ? 700 : 400,
    transition: "all 0.3s",
    letterSpacing: "0.05em",
  }),
  mapContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 16px",
    zIndex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
    padding: "16px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  card: (theme, highlighted) => ({
    background: highlighted ? theme.card : "#111111",
    border: `1px solid ${highlighted ? theme.border : "#222"}`,
    borderRadius: 12,
    padding: 16,
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  }),
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  countryName: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.03em",
  },
  iso: {
    fontSize: 11,
    opacity: 0.4,
    fontFamily: "monospace",
  },
  regionTag: (color) => ({
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 10,
    background: color + "22",
    color: color,
    letterSpacing: "0.05em",
  }),
  beingItem: {
    padding: "8px 0",
    borderBottom: "1px solid #ffffff08",
  },
  beingName: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  beingType: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  beingDesc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    lineHeight: 1.4,
  },
  fearBar: (level, color) => ({
    display: "flex",
    gap: 2,
    marginTop: 4,
  }),
  fearDot: (filled, color) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: filled ? color : "#333",
    transition: "all 0.3s",
  }),
  searchBar: {
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 8px",
    position: "relative",
    zIndex: 2,
  },
  searchInput: (color) => ({
    width: "100%",
    maxWidth: 500,
    padding: "10px 16px",
    borderRadius: 24,
    border: `1px solid ${color}44`,
    background: "#00000066",
    color: "#fff",
    fontSize: 14,
    fontFamily: "'Crimson Text', serif",
    outline: "none",
    backdropFilter: "blur(10px)",
  }),
  filterRow: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "4px 16px 12px",
    flexWrap: "wrap",
    zIndex: 1,
    position: "relative",
  },
  filterBtn: (active, color) => ({
    padding: "4px 10px",
    borderRadius: 12,
    border: `1px solid ${active ? color : "#333"}`,
    background: active ? color + "18" : "transparent",
    color: active ? color : "#666",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "'Crimson Text', serif",
    transition: "all 0.2s",
  }),
  modal: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000000cc",
    backdropFilter: "blur(8px)",
    padding: 16,
  },
  modalContent: (theme) => ({
    background: `linear-gradient(145deg, ${theme.card}, #0a0a0a)`,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    maxWidth: 520,
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto",
    position: "relative",
  }),
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "none",
    border: "none",
    color: "#888",
    fontSize: 20,
    cursor: "pointer",
  },
});

// ── Main Component ──────────────────────────────────────────
export default function FolkloreMap() {
  const [activeContinent, setActiveContinent] = useState("All");
  const [search, setSearch] = useState("");
  const [fearFilter, setFearFilter] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState("fear"); // "fear", "density", "type"
  const [viewMode, setViewMode] = useState("map"); // "map" or "grid"
  const [activeTab, setActiveTab] = useState("explore"); // "explore","stats","ranking","featured"
  const [showCreativeMenu, setShowCreativeMenu] = useState(false);
  const creativeMenuRef = useRef(null);
  useEffect(() => {
    if (!showCreativeMenu) return;
    const handler = (e) => {
      if (creativeMenuRef.current && !creativeMenuRef.current.contains(e.target)) setShowCreativeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCreativeMenu]);
  const [encounter, setEncounter] = useState(null);
  const [encounterAnim, setEncounterAnim] = useState(false);
  // Creative Studio states
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioGenre, setScenarioGenre] = useState(null);
  const [scenarioBeings, setScenarioBeings] = useState([]);
  const [charClass, setCharClass] = useState(null);
  const [charCompanion, setCharCompanion] = useState(null);
  const [charOrigin, setCharOrigin] = useState(null);
  const [charMotivation, setCharMotivation] = useState(null);
  const [charName, setCharName] = useState("");
  const [charBuilt, setCharBuilt] = useState(null);
  const [webtoonGenre, setWebtoonGenre] = useState(null);
  const [webtoonBeings, setWebtoonBeings] = useState([]);
  const [webtoonStructure, setWebtoonStructure] = useState(null);
  const [webtoonResult, setWebtoonResult] = useState(null);
  const [loglineMode, setLoglineMode] = useState("auto"); // "auto" or "custom"
  const [customLogline, setCustomLogline] = useState("");
  // Creature Character Builder states
  const [builderBeing, setBuilderBeing] = useState(null);
  const [builderCharName, setBuilderCharName] = useState("");
  const [builderAppearance, setBuilderAppearance] = useState("");
  const [builderPersonality, setBuilderPersonality] = useState("");
  const [builderMotivation, setBuilderMotivation] = useState("");
  const [builderArc, setBuilderArc] = useState("");
  const [builderResult, setBuilderResult] = useState(null);
  // Synopsis Generator states
  const [synopsisBeings, setSynopsisBeings] = useState([]);
  const [synopsisGenre, setSynopsisGenre] = useState(null);
  const [synopsisEra, setSynopsisEra] = useState(null);
  const [synopsisLack, setSynopsisLack] = useState(null);
  const [synopsisRelation, setSynopsisRelation] = useState(null);
  const [synopsisTheme, setSynopsisTheme] = useState(null);
  const [synopsisEnding, setSynopsisEnding] = useState(null);
  const [synopsisResult, setSynopsisResult] = useState(null);
  const [synopsisCopied, setSynopsisCopied] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  // Creature Profile state
  const [profileBeing, setProfileBeing] = useState(null);
  const [profileCountry, setProfileCountry] = useState(null);
  const [profileAnim, setProfileAnim] = useState(false);
  // Compare mode states
  const [compareList, setCompareList] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  // Advanced filter states
  const [abilityFilter, setAbilityFilter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [visualFilter, setVisualFilter] = useState(null);
  const [ipFilter, setIpFilter] = useState(false);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const mapRef = useRef(null);

  const theme = activeContinent === "All"
    ? { bg: "#0a0a0a", accent: "#cc8844", glow: "#cc884422", card: "#1a1410", text: "#eed8c0", border: "#443322" }
    : CONTINENT_COLORS[activeContinent];

  const styles = useMemo(() => createStyles(theme), [activeContinent]);

  const DATA = useMemo(() => FOLKLORE_DATA, []);

  const continents = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];

  // Compute unique filter options from data
  const filterOptions = useMemo(() => {
    const abilities = new Map();
    const genres = new Map();
    const types = new Map();
    const visuals = new Map();
    DATA.forEach(c => c.b.forEach(b => {
      if (b.ab) b.ab.forEach(a => { if (a !== "불명") abilities.set(a, (abilities.get(a)||0)+1); });
      if (b.gf) b.gf.forEach(g => genres.set(g, (genres.get(g)||0)+1));
      const t = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
      types.set(t, (types.get(t)||0)+1);
      if (b.vk) b.vk.forEach(v => visuals.set(v, (visuals.get(v)||0)+1));
    }));
    const sortMap = (m) => [...m.entries()].sort((a,b) => b[1]-a[1]);
    return {
      abilities: sortMap(abilities).slice(0, 20),
      genres: sortMap(genres),
      types: sortMap(types).slice(0, 25),
      visuals: sortMap(visuals).slice(0, 20),
    };
  }, [DATA]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (abilityFilter) c++;
    if (genreFilter) c++;
    if (typeFilter) c++;
    if (visualFilter) c++;
    if (ipFilter) c++;
    return c;
  }, [abilityFilter, genreFilter, typeFilter, visualFilter, ipFilter]);

  const filtered = useMemo(() => {
    return DATA.filter((c) => {
      if (activeContinent !== "All" && CONTINENT_MAP[c.r] !== activeContinent) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.c.toLowerCase().includes(q) &&
          !c.i.toLowerCase().includes(q) &&
          !c.b.some((b) => b.n.toLowerCase().includes(q) || b.t.toLowerCase().includes(q) || (b.ln && b.ln.toLowerCase().includes(q)))
        )
          return false;
      }
      if (fearFilter > 0) {
        if (!c.b.some((b) => b.f >= fearFilter)) return false;
      }
      // Advanced filters — at least one being in this country must match ALL active filters
      if (abilityFilter || genreFilter || typeFilter || visualFilter || ipFilter) {
        const hasMatch = c.b.some(b => {
          if (abilityFilter && !(b.ab && b.ab.includes(abilityFilter))) return false;
          if (genreFilter && !(b.gf && b.gf.includes(genreFilter))) return false;
          if (typeFilter) {
            const bt = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
            if (bt !== typeFilter) return false;
          }
          if (visualFilter && !(b.vk && b.vk.includes(visualFilter))) return false;
          if (ipFilter && !b.ip) return false;
          return true;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [DATA, activeContinent, search, fearFilter, abilityFilter, genreFilter, typeFilter, visualFilter, ipFilter]);

  const totalBeings = useMemo(() => filtered.reduce((s, c) => s + c.b.length, 0), [filtered]);
  const typeStats = useMemo(() => getTypeStats(DATA), [DATA]);
  const top5Map = useMemo(() => getTop5ByContinent(DATA), [DATA]);
  const radarData = useMemo(() => getRadarData(DATA), [DATA]);
  const fearSpectrum = useMemo(() => getFearSpectrum(DATA), [DATA]);

  // Fear heatmap intensity per country
  const fearIntensity = useMemo(() => {
    const map = {};
    DATA.forEach(c => {
      const avg = c.b.reduce((s, b) => s + b.f, 0) / c.b.length;
      map[c.i] = avg;
    });
    return map;
  }, [DATA]);

  // Heatmap color helper: interpolate between colors based on value 0-1
  const heatColor = useCallback((value) => {
    // 5-stop gradient: deep blue → cyan → yellow → orange → crimson
    const stops = [
      { pos: 0.0, r: 20, g: 60, b: 180 },  // cool blue
      { pos: 0.25, r: 40, g: 180, b: 200 }, // cyan
      { pos: 0.5, r: 255, g: 210, b: 60 },  // gold
      { pos: 0.75, r: 255, g: 120, b: 30 }, // orange
      { pos: 1.0, r: 220, g: 30, b: 30 },   // crimson
    ];
    const t = Math.max(0, Math.min(1, value));
    let i = 0;
    for (; i < stops.length - 1; i++) {
      if (t <= stops[i + 1].pos) break;
    }
    const s0 = stops[i], s1 = stops[Math.min(i + 1, stops.length - 1)];
    const localT = s0.pos === s1.pos ? 0 : (t - s0.pos) / (s1.pos - s0.pos);
    const r = Math.round(s0.r + (s1.r - s0.r) * localT);
    const g = Math.round(s0.g + (s1.g - s0.g) * localT);
    const b = Math.round(s0.b + (s1.b - s0.b) * localT);
    return `rgb(${r},${g},${b})`;
  }, []);

  // Country heatmap data by mode
  const countryHeatData = useMemo(() => {
    const map = {};
    DATA.forEach(c => {
      const avgFear = c.b.reduce((s, b) => s + b.f, 0) / c.b.length;
      const density = c.b.length; // num beings
      const maxFear = Math.max(...c.b.map(b => b.f));
      map[c.i] = { avgFear, density, maxFear, count: c.b.length };
    });
    // Normalize density
    const maxDensity = Math.max(...Object.values(map).map(v => v.density));
    Object.values(map).forEach(v => { v.normDensity = v.density / maxDensity; });
    return map;
  }, [DATA]);

  // Get heatmap value (0-1) for a country based on current mode
  const getHeatValue = useCallback((iso) => {
    const d = countryHeatData[iso];
    if (!d) return 0;
    if (heatmapMode === "fear") return (d.avgFear - 1) / 9; // 1-10 → 0-1
    if (heatmapMode === "density") return d.normDensity;
    return (d.maxFear - 1) / 4;
  }, [countryHeatData, heatmapMode]);

  const triggerRandomEncounter = useCallback(() => {
    setEncounterAnim(true);
    setTimeout(() => {
      setEncounter(getRandomEncounter(DATA));
      setTimeout(() => setEncounterAnim(false), 50);
    }, 400);
  }, [DATA]);

  const handleCountryClick = useCallback((country) => {
    setSelectedCountry(country);
  }, []);

  // Compare mode helpers
  const toggleCompare = useCallback((being, country) => {
    setCompareList(prev => {
      const key = `${being.id || being.n}-${country}`;
      const exists = prev.find(x => `${x.being.id || x.being.n}-${x.country}` === key);
      if (exists) return prev.filter(x => `${x.being.id || x.being.n}-${x.country}` !== key);
      if (prev.length >= 4) return prev;
      return [...prev, { being, country, continent: CONTINENT_MAP[DATA.find(c => c.c === country)?.r] || "Asia" }];
    });
  }, [DATA]);

  const isInCompare = useCallback((being, country) => {
    return compareList.some(x => (x.being.id || x.being.n) === (being.id || being.n) && x.country === country);
  }, [compareList]);

  // Fear bar component
  const FearBar = ({ level, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: i <= level ? 8 + (i <= level ? Math.min(i, level) * 0.5 : 0) : 6,
              borderRadius: 1,
              background: i <= level ? (level >= 9 ? "#ff2222" : level >= 7 ? "#ff6633" : color) : "#333",
              boxShadow: i <= level && level >= 9 ? "0 0 4px #ff3b3b" : "none",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2, fontWeight: level >= 9 ? 700 : 400, color: level >= 9 ? "#ff4444" : "inherit" }}>{level}/10</span>
    </div>
  );

  // Being card in modal — enriched with GFS database fields
  const TagPill = ({ text, color, icon }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 7px", borderRadius: 8, background: color + "18", color: color, border: `1px solid ${color}30`, marginRight: 4, marginBottom: 3 }}>
      {icon && <span style={{ fontSize: 11 }}>{icon}</span>}{text}
    </span>
  );

  const BeingDetail = ({ being, color, country }) => {
    const [expanded, setExpanded] = React.useState(false);
    const hasExtras = being.ab || being.wk || being.src || being.gf || being.sh || being.vk;
    const inCompare = country ? isInCompare(being, country) : false;
    const creatureImg = getCreatureImage(being.id);
    return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #ffffff0a", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.06 }}>
        {creatureImg ? <img src={creatureImg} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: "50%" }} /> : <Portrait name={being.n} type={being.t} color={color} size={90} />}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", position: "relative" }}>
        <div style={{ background: color + "15", borderRadius: 10, padding: 4, flexShrink: 0, overflow: "hidden" }}>
          {creatureImg ? <img src={creatureImg} alt={being.n} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} /> : <Portrait name={being.n} type={being.t} color={color} size={36} glow={being.f >= 4} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{being.n}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {country && (
                <button onClick={(e) => { e.stopPropagation(); toggleCompare(being, country); }}
                  style={{
                    padding: "2px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${inCompare ? "#ff8844" : "#333"}`,
                    background: inCompare ? "#ff884422" : "transparent",
                    color: inCompare ? "#ff8844" : "#666",
                    transition: "all 0.2s", fontFamily: "'Crimson Text', serif",
                  }}>
                  {inCompare ? "⚔ 비교중" : "⚔ 비교"}
                </button>
              )}
              <FearBar level={being.f} color={color} />
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{being.t}{being.ln ? <span style={{ marginLeft: 6, opacity: 0.7 }}>({being.ln})</span> : null}</span>
            {being.ct && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: (CT_COLORS[being.ct] || "#888") + "18", color: CT_COLORS[being.ct] || "#888", border: `1px solid ${(CT_COLORS[being.ct] || "#888")}33`, opacity: 1 }}>{CT_ICONS[being.ct]} {CT_LABELS[being.ct]}</span>}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, lineHeight: 1.6 }}>{being.d}</div>
          
          {hasExtras && (
            <div style={{ marginTop: 8 }}>
              <div 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{ fontSize: 11, color: color, cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {expanded ? "▾" : "▸"} {expanded ? "접기" : "상세 정보"}
                {being.ip && <span style={{ fontSize: 9, background: "#4caf5030", color: "#4caf50", padding: "1px 5px", borderRadius: 4, marginLeft: 4 }}>IP Ready</span>}
              </div>
              {expanded && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "#ffffff06", borderRadius: 8, borderLeft: `2px solid ${color}40` }}>
                  {being.ab && being.ab.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>⚔️ 능력</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.ab.map((a,i) => <TagPill key={i} text={a} color={color} />)}</div>
                    </div>
                  )}
                  {being.wk && being.wk.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🛡️ 약점</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.wk.map((w,i) => <TagPill key={i} text={w} color="#ff9800" />)}</div>
                    </div>
                  )}
                  {being.vk && being.vk.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>👁️ 외형</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.vk.map((v,i) => <TagPill key={i} text={v} color="#9c27b0" />)}</div>
                    </div>
                  )}
                  {being.gf && being.gf.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🎬 장르</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.gf.map((g,i) => <TagPill key={i} text={g} color="#2196f3" />)}</div>
                    </div>
                  )}
                  {being.sh && being.sh.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📖 스토리 훅</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.sh.map((s,i) => <TagPill key={i} text={s} color="#00bcd4" />)}</div>
                    </div>
                  )}
                  {being.src && being.src.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📜 출처</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{being.src.join(", ")}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );};

  // World Map SVG — Detailed realistic version
  const WorldMap = () => {
    const filteredIsos = new Set(filtered.map((c) => c.i));
    
    // Continent path mapping for fill
    const continentPathMap = {
      NorthAmerica: "Americas", SouthAmerica: "Americas",
      Europe: "Europe", Africa: "Africa", Asia: "Asia", Oceania: "Oceania",
      Japan: "Asia", UKIsland: "Europe", Indonesia: "Asia",
      NewZealand: "Oceania", Madagascar: "Africa", SriLanka: "Asia",
      Philippines: "Asia", Taiwan: "Asia",
    };
    
    return (
      <div style={styles.mapContainer}>
        <svg viewBox="80 5 770 405" style={{ width: "100%", height: "auto", borderRadius: 16, overflow: "hidden" }}>
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softBlur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <filter id="heatBlur">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="heatBlurMed">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#060d18" />
              <stop offset="50%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#060d18" />
            </linearGradient>
            {/* Dynamic heatmap radial gradients for each country */}
            {DATA.map(country => {
              const hVal = getHeatValue(country.i);
              const col = heatColor(hVal);
              return (
                <radialGradient key={`hg-${country.i}`} id={`heatGrad-${country.i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={col} stopOpacity={0.45 + hVal * 0.25} />
                  <stop offset="40%" stopColor={col} stopOpacity={0.18 + hVal * 0.12} />
                  <stop offset="100%" stopColor={col} stopOpacity="0" />
                </radialGradient>
              );
            })}
          </defs>

          {/* Ocean background */}
          <rect x="80" y="5" width="770" height="405" fill="url(#oceanGrad)" rx="0" />
          
          {/* Atmospheric glow */}
          <rect x="80" y="5" width="770" height="405" fill="url(#mapGlow)" />

          {/* Latitude / Longitude grid */}
          {[60,100,140,180,220,260,300,340,380].map((y,i) => (
            <line key={`lat${i}`} x1="80" y1={y} x2="850" y2={y} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          {[120,180,240,300,360,420,480,540,600,660,720,780,840].map((x,i) => (
            <line key={`lng${i}`} x1={x} y1="5" x2={x} y2="410" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          
          {/* Equator line */}
          <line x1="80" y1="235" x2="850" y2="235" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="0.8" strokeDasharray="6 4" />
          <text x="85" y="232" fill="#ffffff" fillOpacity="0.08" fontSize="6" fontFamily="monospace">EQUATOR</text>

          {/* Continent land masses */}
          {Object.entries(CONTINENT_PATHS).map(([name, path]) => {
            const contKey = continentPathMap[name] || name;
            const isActive = activeContinent === "All" || activeContinent === contKey;
            const cColor = CONTINENT_COLORS[contKey]?.accent || "#444";
            return (
              <g key={name}>
                {/* Shadow layer */}
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? cColor : "#333"}
                  strokeOpacity={isActive ? 0.08 : 0.03}
                  strokeWidth="8"
                  filter="url(#softBlur)"
                  style={{ transition: "all 0.8s ease" }}
                />
                {/* Main landmass */}
                <path
                  d={path}
                  fill={isActive ? cColor + "12" : "#ffffff05"}
                  stroke={isActive ? cColor + "50" : "#ffffff12"}
                  strokeWidth={isActive ? "1.2" : "0.6"}
                  strokeLinejoin="round"
                  style={{ transition: "all 0.8s ease" }}
                />
                {/* Inner glow for active */}
                {isActive && (
                  <path
                    d={path}
                    fill={cColor + "06"}
                    stroke="none"
                    style={{ transition: "all 0.8s ease" }}
                  />
                )}
              </g>
            );
          })}

          {/* Continent labels */}
          {activeContinent === "All" && [
            { label: "NORTH AMERICA", x: 175, y: 105, cont: "Americas" },
            { label: "SOUTH AMERICA", x: 262, y: 310, cont: "Americas" },
            { label: "EUROPE", x: 480, y: 68, cont: "Europe" },
            { label: "AFRICA", x: 478, y: 270, cont: "Africa" },
            { label: "ASIA", x: 650, y: 110, cont: "Asia" },
            { label: "OCEANIA", x: 768, y: 335, cont: "Oceania" },
          ].map(({ label, x, y, cont }) => (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              fill={CONTINENT_COLORS[cont]?.accent || "#666"}
              fillOpacity={0.15}
              fontSize="9"
              fontFamily="'Crimson Text', serif"
              fontWeight="700"
              letterSpacing="3"
              style={{ pointerEvents: "none" }}
            >
              {label}
            </text>
          ))}

          {/* ── HEATMAP LAYER: Radial heat zones per country ── */}
          <g style={{ mixBlendMode: "screen" }}>
            {DATA.map((country) => {
              const pos = COUNTRY_POSITIONS[country.i];
              if (!pos) return null;
              const isFiltered = filteredIsos.has(country.i);
              if (!isFiltered) return null;
              const hVal = getHeatValue(country.i);
              const baseR = 18 + hVal * 22; // radius 18-40 based on intensity
              return (
                <circle
                  key={`heat-${country.i}`}
                  cx={pos[0]} cy={pos[1]}
                  r={baseR}
                  fill={`url(#heatGrad-${country.i})`}
                  style={{ transition: "all 0.6s ease", pointerEvents: "none" }}
                />
              );
            })}
          </g>

          {/* ── HEATMAP LAYER 2: Soft ambient underlay (blurred large circles) ── */}
          <g style={{ mixBlendMode: "screen" }} filter="url(#heatBlur)">
            {DATA.map((country) => {
              const pos = COUNTRY_POSITIONS[country.i];
              if (!pos) return null;
              const isFiltered = filteredIsos.has(country.i);
              if (!isFiltered) return null;
              const hVal = getHeatValue(country.i);
              const col = heatColor(hVal);
              return (
                <circle
                  key={`heatAmb-${country.i}`}
                  cx={pos[0]} cy={pos[1]}
                  r={14 + hVal * 12}
                  fill={col}
                  opacity={0.06 + hVal * 0.08}
                  style={{ transition: "all 0.6s ease", pointerEvents: "none" }}
                />
              );
            })}
          </g>

          {/* Country dots with heatmap */}
          {DATA.map((country) => {
            const pos = COUNTRY_POSITIONS[country.i];
            if (!pos) return null;
            const isFiltered = filteredIsos.has(country.i);
            const continent = CONTINENT_MAP[country.r];
            const color = CONTINENT_COLORS[continent]?.accent || "#888";
            const isHovered = hoveredCountry === country.i;
            const hVal = getHeatValue(country.i);
            const hCol = heatColor(hVal);
            const avgFear = fearIntensity[country.i] || 0;
            const dotRadius = isHovered ? 7 : (3 + hVal * 3);

            return (
              <g key={country.i} style={{ cursor: isFiltered ? "pointer" : "default" }}>
                {isFiltered ? (
                  <>
                    {/* Outer pulse ring for high intensity */}
                    {hVal >= 0.7 && (
                      <circle
                        cx={pos[0]} cy={pos[1]}
                        r={dotRadius + 6}
                        fill="none"
                        stroke={hCol}
                        strokeOpacity="0.15"
                        strokeWidth="1"
                        style={{ transition: "all 0.4s ease" }}
                      >
                        <animate attributeName="r" from={String(dotRadius + 3)} to={String(dotRadius + 10)} dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.2" to="0" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Focused heatmap glow (mid-blur) */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={isHovered ? dotRadius + 12 : dotRadius + 5}
                      fill={hCol}
                      opacity={isHovered ? 0.25 : 0.1 + hVal * 0.06}
                      filter="url(#heatBlurMed)"
                      style={{ transition: "all 0.3s ease", pointerEvents: "none" }}
                    />
                    {/* Main dot */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={dotRadius}
                      fill={hCol}
                      opacity={0.92}
                      stroke={isHovered ? "#fff" : hCol}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      strokeOpacity={isHovered ? 0.9 : 0.3}
                      style={{ transition: "all 0.25s ease" }}
                      onMouseEnter={() => setHoveredCountry(country.i)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => handleCountryClick(country)}
                    />
                    {/* Inner bright core */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={dotRadius * 0.35}
                      fill="#fff"
                      opacity={isHovered ? 0.8 : 0.45}
                      style={{ pointerEvents: "none", transition: "all 0.25s ease" }}
                    />
                    {/* Hover tooltip */}
                    {isHovered && (
                      <g style={{ pointerEvents: "none" }}>
                        <rect
                          x={pos[0] - 52}
                          y={pos[1] - 34}
                          width={104}
                          height={26}
                          rx={6}
                          fill="#000000dd"
                          stroke={hCol}
                          strokeWidth="0.8"
                          strokeOpacity="0.6"
                        />
                        <text
                          x={pos[0]}
                          y={pos[1] - 20}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="8"
                          fontFamily="'Crimson Text', serif"
                          fontWeight="600"
                        >
                          {country.c}
                        </text>
                        <text
                          x={pos[0]}
                          y={pos[1] - 11}
                          textAnchor="middle"
                          fill={hCol}
                          fontSize="6.5"
                          fontFamily="'Crimson Text', serif"
                          fontWeight="400"
                          opacity="0.8"
                        >
                          {country.b.length}개 존재 · {heatmapMode === "fear" ? `공포 avg ${avgFear.toFixed(1)}` : heatmapMode === "density" ? `밀도 ${country.b.length}` : `최대 ${countryHeatData[country.i]?.maxFear || 0}`}
                        </text>
                      </g>
                    )}
                  </>
                ) : (
                  <circle cx={pos[0]} cy={pos[1]} r={1.8} fill="#ffffff" opacity={0.08} />
                )}
              </g>
            );
          })}

          {/* Map legend — dynamic heatmap scale */}
          <g transform="translate(90, 358)">
            <rect x="0" y="0" width="170" height="44" rx="8" fill="#000000cc" stroke="#ffffff15" strokeWidth="0.5" />
            <text x="8" y="12" fill="#888" fontSize="5.5" fontFamily="'Crimson Text', serif" fontWeight="600" letterSpacing="1">
              {heatmapMode === "fear" ? "공포도 히트맵" : heatmapMode === "density" ? "존재 밀도 히트맵" : "최대 공포 히트맵"}
            </text>
            {/* Gradient bar */}
            <defs>
              <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(20,60,180)" />
                <stop offset="25%" stopColor="rgb(40,180,200)" />
                <stop offset="50%" stopColor="rgb(255,210,60)" />
                <stop offset="75%" stopColor="rgb(255,120,30)" />
                <stop offset="100%" stopColor="rgb(220,30,30)" />
              </linearGradient>
            </defs>
            <rect x="8" y="17" width="100" height="6" rx="3" fill="url(#legendGrad)" />
            <text x="8" y="32" fill="#666" fontSize="5" fontFamily="monospace">낮음</text>
            <text x="48" y="32" fill="#666" fontSize="5" fontFamily="monospace" textAnchor="middle">중간</text>
            <text x="108" y="32" fill="#666" fontSize="5" fontFamily="monospace" textAnchor="end">높음</text>
            {/* Mode toggle buttons */}
            {[
              { mode: "fear", label: "공포", x: 116 },
              { mode: "density", label: "밀도", x: 136 },
              { mode: "type", label: "최대", x: 156 },
            ].map(({ mode, label, x }) => (
              <g key={mode} style={{ cursor: "pointer" }} onClick={() => setHeatmapMode(mode)}>
                <rect
                  x={x} y="16" width={16} height={12} rx={3}
                  fill={heatmapMode === mode ? theme.accent + "44" : "#ffffff08"}
                  stroke={heatmapMode === mode ? theme.accent : "#ffffff22"}
                  strokeWidth="0.5"
                />
                <text
                  x={x + 8} y={24.5}
                  textAnchor="middle"
                  fill={heatmapMode === mode ? theme.accent : "#666"}
                  fontSize="4.5"
                  fontFamily="'Crimson Text', serif"
                  fontWeight={heatmapMode === mode ? "700" : "400"}
                >
                  {label}
                </text>
              </g>
            ))}
            <text x="135" y="38" fill="#555" fontSize="4" fontFamily="monospace" textAnchor="middle">모드 전환</text>
          </g>
        </svg>
      </div>
    );
  };

  // Country Card
  const CountryCard = ({ country }) => {
    const continent = CONTINENT_MAP[country.r];
    const cTheme = CONTINENT_COLORS[continent] || CONTINENT_COLORS.Asia;
    const maxFear = Math.max(...country.b.map((b) => b.f));

    return (
      <div
        style={{
          ...styles.card(cTheme, true),
          ...(maxFear >= 5 ? { boxShadow: `0 0 20px ${cTheme.accent}15` } : {}),
        }}
        onClick={() => handleCountryClick(country)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = cTheme.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = cTheme.border;
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${cTheme.accent}, transparent)`,
            opacity: 0.6,
          }}
        />

        <div style={styles.cardHeader}>
          <div>
            <div style={styles.countryName}>
              {CONTINENT_EMOJI[continent]} {country.c}
            </div>
            <span style={styles.iso}>{country.i}</span>
          </div>
          <span style={styles.regionTag(cTheme.accent)}>{country.r}</span>
        </div>
        {/* Portrait watermark */}
        <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: getCreatureImage(country.b[0]?.id) ? 0.12 : 0.05 }}>
          {getCreatureImage(country.b[0]?.id) ? <img src={getCreatureImage(country.b[0]?.id)} alt="" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%" }} /> : <Portrait name={country.b[0]?.n || ""} type={country.b[0]?.t || "Ghost"} color={cTheme.accent} size={120} />}
        </div>

        {country.b.slice(0, 2).map((being, i) => (
          <div key={i} style={styles.beingItem}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {getCreatureImage(being.id) ? <img src={getCreatureImage(being.id)} alt={being.n} style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 4 }} /> : <Portrait name={being.n} type={being.t} color={cTheme.accent} size={20} />}
              <span style={{ fontSize: 14, fontWeight: 600 }}>{being.n}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={styles.beingType}>{being.t}</span>
              <FearBar level={being.f} color={cTheme.accent} />
            </div>
          </div>
        ))}
        {country.b.length > 2 && (
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6, textAlign: "center" }}>
            +{country.b.length - 2} 더 보기 — 탭하세요
          </div>
        )}
      </div>
    );
  };

  // ── Stats Panel: Type Distribution + Radar + Spectrum ──
  const StatsPanel = () => {
    const [spectrumHover, setSpectrumHover] = useState(null);
    const totalAll = DATA.reduce((s,c)=>s+c.b.length,0);
    return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
      {/* Section 1: Type Distribution */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        📊 존재 유형별 분포
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        전체 {totalAll}개 존재의 유형별 분류
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ width: 280, height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={typeStats.slice(0,12)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} stroke="none">
                {typeStats.slice(0,12).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <ResponsiveContainer width="100%" height={Math.min(typeStats.length * 28, 400)}>
            <BarChart data={typeStats.slice(0,15)} layout="vertical" margin={{ left: 90, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} axisLine={false} tickLine={false} width={85} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeStats.slice(0,15).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #ffffff15, transparent)", margin: "32px 0" }} />

      {/* Section 2: Continent Radar */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🕸 대륙별 비교 레이더
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        대륙별 민담 풍부도 비교 — 존재 수, 국가 수, 평균 공포도, 타입 다양성
      </p>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#ffffff15" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            {Object.entries(CONTINENT_COLORS).map(([cont, c], i) => (
              <Radar key={cont} name={cont} dataKey={cont} stroke={c.accent} fill={c.accent} fillOpacity={0.12} strokeWidth={2} />
            ))}
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #ffffff15, transparent)", margin: "32px 0" }} />

      {/* Section 3: Fear Spectrum */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🌡 공포도 스펙트럼
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        전체 {totalAll}개 존재의 공포도 분포 — 호버하여 탐색하세요
      </p>

      {/* Spectrum Bar */}
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* The bar */}
        <div style={{ display: "flex", height: 56, borderRadius: 12, overflow: "hidden", border: "1px solid #ffffff15", position: "relative" }}>
          {fearSpectrum.map((bucket) => {
            const pct = (bucket.beings.length / totalAll) * 100;
            const isHovered = spectrumHover === bucket.level;
            return (
              <div
                key={bucket.level}
                onMouseEnter={() => setSpectrumHover(bucket.level)}
                onMouseLeave={() => setSpectrumHover(null)}
                style={{
                  width: `${pct}%`,
                  minWidth: pct > 0 ? 24 : 0,
                  background: isHovered
                    ? `linear-gradient(180deg, ${bucket.color}dd, ${bucket.color}88)`
                    : `linear-gradient(180deg, ${bucket.color}88, ${bucket.color}44)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  position: "relative",
                  transform: isHovered ? "scaleY(1.08)" : "scaleY(1)",
                  zIndex: isHovered ? 2 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{bucket.level <= 4 ? "😏" : bucket.level <= 5 ? "😨" : bucket.level <= 7 ? "☠️" : bucket.level <= 8 ? "💀" : bucket.level <= 9 ? "🔥" : "⚡"}</span>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{bucket.beings.length}</span>
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div style={{ display: "flex", marginTop: 6 }}>
          {fearSpectrum.map((bucket) => {
            const pct = (bucket.beings.length / totalAll) * 100;
            return (
              <div key={bucket.level} style={{ width: `${pct}%`, minWidth: pct > 0 ? 24 : 0, textAlign: "center" }}>
                <span style={{ fontSize: 10, color: bucket.color, fontWeight: spectrumHover === bucket.level ? 700 : 400 }}>
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover detail: show sample beings */}
        {spectrumHover && (() => {
          const bucket = fearSpectrum.find(b => b.level === spectrumHover);
          if (!bucket) return null;
          const samples = bucket.beings.slice(0, 8);
          return (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: `${bucket.color}0a`,
              border: `1px solid ${bucket.color}33`,
              borderRadius: 12,
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: bucket.color, marginBottom: 8 }}>
                {bucket.label} — 공포 레벨 {bucket.level} ({bucket.beings.length}개 존재)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {samples.map((b, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 10,
                    background: bucket.color + "15", color: bucket.color,
                    border: `1px solid ${bucket.color}22`,
                  }}>
                    {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                  </span>
                ))}
                {bucket.beings.length > 8 && (
                  <span style={{ fontSize: 11, padding: "3px 10px", opacity: 0.4 }}>
                    +{bucket.beings.length - 8}개 더
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
  };

  // ── Ranking Panel: Top 5 Scariest per Continent ──
  const RankingPanel = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🏆 대륙별 가장 무서운 존재
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        각 대륙에서 공포도가 가장 높은 존재 TOP 5
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {Object.entries(top5Map).map(([cont, beings]) => {
          const cTheme = CONTINENT_COLORS[cont];
          return (
            <div key={cont} style={{ background: cTheme.card, border: `1px solid ${cTheme.border}`, borderRadius: 12, padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cTheme.accent}, transparent)` }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: cTheme.accent, marginBottom: 12 }}>
                {CONTINENT_EMOJI[cont]} {cont}
              </h3>
              {beings.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #ffffff08" : "none" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#555", width: 26, textAlign: "center", fontFamily: "monospace" }}>
                    {i + 1}
                  </span>
                  {getCreatureImage(b.id) ? <img src={getCreatureImage(b.id)} alt={b.n} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : null}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {!getCreatureImage(b.id) && getTypeIcon(b.t)} {b.n}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{b.country} · {b.t}{b.ct ? ` · ${CT_LABELS[b.ct]}` : ''}</div>
                  </div>
                  <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(j => (
                      <div key={j} style={{ width: 4, height: j <= b.f ? 6 + j * 0.4 : 5, borderRadius: 1, background: j <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : cTheme.accent) : "#333", boxShadow: j <= b.f && b.f >= 9 ? "0 0 4px #ff3b3b" : "none" }} />
                    ))}
                    <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>{b.f}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Featured Illustrated Cards (매일 자동 회전 + 외부 발굴) ──
  const dailyFeatured = useMemo(() => getDailyFeatured(DATA), [DATA]);
  const [spotlight, setSpotlight] = useState(null);
  const [spotlightLoading, setSpotlightLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/daily-spotlight')
      .then(r => r.json())
      .then(data => { if (!cancelled) setSpotlight(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSpotlightLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const FeaturedCards = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
    return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🎴 특집 민담 스포트라이트
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        매일 새로운 전설을 만나보세요 — {dateStr}
      </p>

      {/* ── 1) 오늘의 민담 발견 (Wikipedia) ── */}
      {spotlightLoading ? (
        <div style={{ textAlign: "center", padding: 30, opacity: 0.5 }}>
          <div style={{ fontSize: 28, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🔍</div>
          <div style={{ fontSize: 13 }}>전 세계 민담을 탐색하는 중...</div>
        </div>
      ) : spotlight && spotlight.discoveries && spotlight.discoveries.length > 0 ? (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>📜</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>오늘의 민담 발견</h3>
            {spotlight.date && (
              <span style={{ fontSize: 10, color: "#888", background: "#ffffff08", padding: "2px 8px", borderRadius: 8 }}>
                🕐 {spotlight.date}
              </span>
            )}
            <div style={{ flex: 1, height: 1, background: theme.accent + "22" }} />
            {spotlight.categories && (
              <div style={{ display: "flex", gap: 4 }}>
                {spotlight.categories.map((cat, i) => (
                  <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: theme.accent + "15", color: theme.accent, border: `1px solid ${theme.accent}33` }}>
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {spotlight.discoveries.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: `linear-gradient(145deg, ${theme.card || "#1a1a2e"}, ${theme.bg || "#0d0d1a"})`,
                  border: `1px solid ${theme.accent}22`,
                  borderRadius: 14,
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = theme.accent + "55"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = theme.accent + "22"; }}
              >
                {d.thumbnail && (
                  <div style={{ width: "100%", height: 140, overflow: "hidden", position: "relative" }}>
                    <img src={d.thumbnail} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(transparent, ${theme.bg || "#0d0d1a"})` }} />
                  </div>
                )}
                <div style={{ padding: "12px 16px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: d.lang === 'ko' ? "#3b82f622" : "#f59e0b22", color: d.lang === 'ko' ? "#60a5fa" : "#fbbf24" }}>
                      {d.lang === 'ko' ? '한국어' : 'English'}
                    </span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: theme.accent + "15", color: theme.accent }}>
                      {d.category}
                    </span>
                    <span style={{ fontSize: 9, opacity: 0.4, marginLeft: "auto" }}>Wikipedia</span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{d.title}</h4>
                  <p style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.6, margin: 0 }}>
                    {d.extract.length > 150 ? d.extract.substring(0, 150) + '...' : d.extract}
                  </p>
                  <div style={{ marginTop: 10, fontSize: 11, color: theme.accent, opacity: 0.8 }}>
                    자세히 읽기 →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── 2) 관련 뉴스 (Google News) ── */}
      {spotlight && spotlight.news && spotlight.news.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>📰</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>민담 · 신화 관련 뉴스</h3>
            <div style={{ flex: 1, height: 1, background: theme.accent + "22" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {spotlight.news.map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: theme.card || "#1a1a2e",
                  border: `1px solid ${theme.accent}15`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  textDecoration: "none",
                  color: "inherit",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent + "44"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.accent + "15"; }}
              >
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>{n.title}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.4 }}>
                  <span>{n.source}</span>
                  <span>{n.pubDate ? new Date(n.pubDate).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : ''}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── 3) 오늘의 추천 국가 (기존 크리처 데이터 회전) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>🌍</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>오늘의 추천 국가</h3>
        <div style={{ flex: 1, height: 1, background: theme.accent + "22" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {dailyFeatured.map((card) => {
          const countryData = DATA.find(c => c.i === card.iso);
          const cont = countryData ? CONTINENT_MAP[countryData.r] : "Asia";
          const cTheme = CONTINENT_COLORS[cont];
          return (
            <div
              key={card.iso}
              onClick={() => countryData && handleCountryClick(countryData)}
              style={{
                background: `linear-gradient(145deg, ${card.gradient[0]}, ${card.gradient[1]})`,
                border: `1px solid ${cTheme.border}`,
                borderRadius: 16,
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s",
                position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${cTheme.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Art header */}
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, background: `radial-gradient(circle at 50% 80%, ${cTheme.accent}15, transparent 60%)`, position: "relative" }}>
                <span style={{ filter: "drop-shadow(0 4px 12px #00000088)" }}>{card.art}</span>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${card.gradient[1]})` }} />
              </div>
              {/* Content */}
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ fontSize: 11, color: cTheme.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                  {card.tagline}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.7, marginBottom: 12 }}>{card.lore}</p>
                {countryData && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {countryData.b.map((b, bi) => (
                      <span key={bi} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: cTheme.accent + "18", color: cTheme.accent, border: `1px solid ${cTheme.accent}33` }}>
                        {getTypeIcon(b.t)} {b.n} {"☠".repeat(b.f >= 7 ? b.f - 6 : 0)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );};

  // ═══════════════════════════════════════════════════════════════
  //  🎬 SCENARIO GENERATOR
  // ═══════════════════════════════════════════════════════════════
  const ScenarioGenerator = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i })));
      return arr;
    }, [DATA]);

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const generateScenario = () => {
      const template = scenarioGenre || pickRandom(SCENARIO_TEMPLATES);
      // Pick 2-3 beings (user-selected or random)
      let beings = scenarioBeings.length >= 1 ? [...scenarioBeings] : [];
      while (beings.length < 2) {
        const b = pickRandom(allBeings);
        if (!beings.find(x => x.n === b.n)) beings.push(b);
      }
      const setting = pickRandom(template.settings);
      const hook = pickRandom(template.hooks);
      const twist = pickRandom(template.twists);
      // Generate chapters
      const chapters = [
        { num: 1, title: "서막 — 균열의 징조", desc: `${setting}에서 ${hook}. ${beings[0].n}의 그림자가 드리워지기 시작한다.` },
        { num: 2, title: "발단 — 첫 번째 조우", desc: `${beings[0].n}(${beings[0].t})과 마주하다. "${beings[0].d}" — 이 존재의 본질이 서서히 드러난다.` },
        { num: 3, title: "전개 — 얽히는 실타래", desc: `${beings.length > 1 ? beings[1].n : "미지의 존재"}(이)가 등장하며 상황이 복잡해진다. ${beings.length > 1 ? beings[1].country : "알 수 없는 땅"}의 전승이 단서가 된다.` },
        { num: 4, title: "위기 — 반전의 순간", desc: twist + ". 모든 것이 뒤집힌다." },
        { num: 5, title: "절정과 결말", desc: `${beings.map(b => b.n).join(", ")}와(과)의 최종 대결. 결말은 열려 있다...` },
      ];
      setScenarioResult({ template, beings, setting, hook, twist, chapters });
    };

    const toggleBeing = (b) => {
      setScenarioBeings(prev => {
        const exists = prev.find(x => x.n === b.n && x.country === b.country);
        if (exists) return prev.filter(x => !(x.n === b.n && x.country === b.country));
        if (prev.length >= 4) return prev;
        return [...prev, b];
      });
    };

    const [beingSearch, setBeingSearch] = useState("");
    const searchedBeings = useMemo(() => {
      if (!beingSearch) return allBeings.slice(0, 20);
      const q = beingSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || b.t.toLowerCase().includes(q)).slice(0, 20);
    }, [allBeings, beingSearch]);

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          🎬 시나리오 생성기
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          장르와 존재를 선택하면 자동으로 시나리오 플롯이 생성됩니다
        </p>

        {/* Genre Selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent, letterSpacing: "0.1em" }}>① 장르 선택</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SCENARIO_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setScenarioGenre(scenarioGenre?.id === t.id ? null : t)}
                style={{
                  padding: "10px 16px", borderRadius: 12, border: `1px solid ${scenarioGenre?.id === t.id ? theme.accent : "#333"}`,
                  background: scenarioGenre?.id === t.id ? theme.accent + "22" : "#111", color: scenarioGenre?.id === t.id ? theme.accent : "#888",
                  cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
                }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Being Selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent, letterSpacing: "0.1em" }}>
            ② 등장 존재 선택 ({scenarioBeings.length}/4)
          </div>
          {scenarioBeings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {scenarioBeings.map((b, i) => (
                <span key={i} onClick={() => toggleBeing(b)} style={{
                  padding: "5px 12px", borderRadius: 16, background: "#ff444422", border: "1px solid #ff444466",
                  color: "#ff8888", fontSize: 12, cursor: "pointer", transition: "all 0.3s",
                }}>
                  {getTypeIcon(b.t)} {b.n} · {b.country} ✕
                </span>
              ))}
            </div>
          )}
          <input value={beingSearch} onChange={e => setBeingSearch(e.target.value)}
            placeholder="존재 이름, 국가, 유형 검색..."
            style={{ width: "100%", maxWidth: 400, padding: "8px 14px", borderRadius: 20, border: `1px solid ${theme.accent}33`,
              background: "#0a0a0a", color: "#fff", fontSize: 13, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 8 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflow: "auto" }}>
            {searchedBeings.map((b, i) => {
              const selected = scenarioBeings.find(x => x.n === b.n && x.country === b.country);
              return (
                <span key={i} onClick={() => toggleBeing(b)} style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer", transition: "all 0.2s",
                  background: selected ? theme.accent + "22" : "#161616",
                  border: `1px solid ${selected ? theme.accent : "#282828"}`,
                  color: selected ? theme.accent : "#888",
                }}>
                  {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={generateScenario} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", letterSpacing: "0.05em", transition: "all 0.3s",
          }}>
            ⚡ 시나리오 생성
          </button>
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>장르 미선택 시 랜덤 · 존재 미선택 시 자동 배정</div>
        </div>

        {/* Result */}
        {scenarioResult && (
          <div style={{ background: "linear-gradient(145deg, #1a1008, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 20%, ${theme.accent}08, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{scenarioResult.template.label.split(" ")[0]}</span>
                <div>
                  <div style={{ fontSize: 11, color: theme.accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>{scenarioResult.template.name}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                    "{scenarioResult.setting}"
                  </h3>
                </div>
              </div>

              {/* Cast */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {scenarioResult.beings.map((b, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff12", flex: "1 1 200px", minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{getTypeIcon(b.t)} {b.n}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{b.country} · {b.t}{b.ct ? ` · ${CT_LABELS[b.ct]}` : ''}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{b.d}</div>
                    <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(j => <div key={j} style={{ width: 3, height: 3, borderRadius: "50%", background: j <= b.f ? (b.f >= 9 ? "#ff2222" : "#ff6633") : "#333" }} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chapters */}
              <div style={{ borderLeft: `2px solid ${theme.accent}33`, paddingLeft: 20, marginBottom: 16 }}>
                {scenarioResult.chapters.map((ch, i) => (
                  <div key={i} style={{ marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", left: -27, top: 2, width: 12, height: 12, borderRadius: "50%",
                      background: i === 3 ? "#ff3b3b" : theme.accent, border: "2px solid #0a0a0a" }} />
                    <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, letterSpacing: "0.1em" }}>
                      CHAPTER {ch.num}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ch.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>{ch.desc}</div>
                  </div>
                ))}
              </div>

              {/* Twist highlight */}
              <div style={{ padding: 16, borderRadius: 12, background: "#ff3b3b0a", border: "1px solid #ff3b3b33", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#ff3b3b", letterSpacing: "0.2em", marginBottom: 4 }}>🔥 핵심 반전</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ffaaaa" }}>{scenarioResult.twist}</div>
              </div>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={generateScenario} style={{
                  padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                  background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                  fontFamily: "'Crimson Text', serif",
                }}>
                  🎲 다시 생성
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  🧙 CHARACTER BUILDER
  // ═══════════════════════════════════════════════════════════════
  const CharacterBuilder = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r })));
      return arr;
    }, [DATA]);

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const buildCharacter = () => {
      const cls = charClass || pickRandom(CHARACTER_CLASSES);
      const comp = charCompanion || pickRandom(allBeings);
      const origin = charOrigin || pickRandom(CHARACTER_ORIGINS);
      const motivation = charMotivation || pickRandom(CHARACTER_MOTIVATIONS);
      const name = charName || `${cls.icon} 이름 없는 ${cls.name}`;
      // Companion synergy
      const synergy = (() => {
        if (cls.id === "medium" || cls.id === "shaman") return { label: "영적 공명", desc: `${comp.n}과(와) 깊은 교감을 나누며 그 힘을 빌릴 수 있다`, bonus: "spr" };
        if (cls.id === "hunter") return { label: "사냥 본능", desc: `${comp.n}의 습성을 완벽히 파악해 약점을 공략한다`, bonus: "str" };
        if (cls.id === "scholar") return { label: "지식의 열쇠", desc: `${comp.n}에 대한 고대 기록을 해독해 비밀을 밝힌다`, bonus: "int" };
        if (cls.id === "trickster") return { label: "속임수의 거래", desc: `${comp.n}과(와) 위험한 거래를 맺어 상호 이득을 취한다`, bonus: "cha" };
        if (cls.id === "cursed") return { label: "저주의 공명", desc: `${comp.n}의 어둠과 내면의 저주가 공명하여 강화된다`, bonus: "spr" };
        return { label: "운명적 유대", desc: `${comp.n}과(와) 예기치 못한 유대가 형성된다`, bonus: "cha" };
      })();
      // Boost stats
      const finalStats = { ...cls.stats };
      finalStats[synergy.bonus] = Math.min(5, finalStats[synergy.bonus] + 1);
      setCharBuilt({ name, cls, companion: comp, origin, motivation, synergy, stats: finalStats });
    };

    const [compSearch, setCompSearch] = useState("");
    const searchedComps = useMemo(() => {
      if (!compSearch) return allBeings.slice(0, 16);
      const q = compSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q)).slice(0, 16);
    }, [allBeings, compSearch]);

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          🧙 캐릭터 빌더
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          직업, 동료 존재, 배경을 조합하여 나만의 캐릭터를 생성하세요
        </p>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>이름 (선택)</div>
          <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="캐릭터 이름을 입력하세요..."
            style={{ width: "100%", maxWidth: 300, padding: "8px 14px", borderRadius: 20, border: `1px solid ${theme.accent}33`,
              background: "#0a0a0a", color: "#fff", fontSize: 14, fontFamily: "'Crimson Text', serif", outline: "none" }} />
        </div>

        {/* Class */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>① 직업 선택</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {CHARACTER_CLASSES.map(c => (
              <div key={c.id} onClick={() => setCharClass(charClass?.id === c.id ? null : c)}
                style={{
                  padding: 12, borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                  background: charClass?.id === c.id ? theme.accent + "18" : "#111",
                  border: `1px solid ${charClass?.id === c.id ? theme.accent : "#222"}`,
                  textAlign: "center",
                }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: charClass?.id === c.id ? theme.accent : "#ccc" }}>{c.name}</div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{c.desc}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 6 }}>
                  {Object.entries(c.stats).map(([k, v]) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: STAT_COLORS[k], opacity: 0.7 }}>{STAT_NAMES[k]}</div>
                      <div style={{ display: "flex", gap: 1 }}>
                        {[1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: i <= v ? STAT_COLORS[k] : "#333" }} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companion Being */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>② 동료/관계 존재</div>
          {charCompanion && (
            <div style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "6px 14px", borderRadius: 16,
              background: "#ff444418", border: "1px solid #ff444444", marginBottom: 8, cursor: "pointer" }}
              onClick={() => setCharCompanion(null)}>
              <span>{getTypeIcon(charCompanion.t)} {charCompanion.n} · {charCompanion.country}</span>
              <span style={{ opacity: 0.5, fontSize: 11 }}>✕</span>
            </div>
          )}
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="존재 검색..."
            style={{ width: "100%", maxWidth: 300, padding: "6px 12px", borderRadius: 16, border: `1px solid #333`,
              background: "#0a0a0a", color: "#fff", fontSize: 12, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 6, display: "block" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflow: "auto" }}>
            {searchedComps.map((b, i) => (
              <span key={i} onClick={() => setCharCompanion(b)} style={{
                padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                background: charCompanion?.n === b.n && charCompanion?.country === b.country ? theme.accent + "22" : "#161616",
                border: `1px solid ${charCompanion?.n === b.n && charCompanion?.country === b.country ? theme.accent : "#222"}`,
                color: "#999", transition: "all 0.2s",
              }}>
                {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Origin & Motivation */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>③ 기원</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CHARACTER_ORIGINS.map((o, i) => (
                <div key={i} onClick={() => setCharOrigin(charOrigin === o ? null : o)} style={{
                  padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, transition: "all 0.2s",
                  background: charOrigin === o ? theme.accent + "18" : "#111", border: `1px solid ${charOrigin === o ? theme.accent + "66" : "#222"}`,
                  color: charOrigin === o ? theme.accent : "#888",
                }}>
                  {o}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>④ 동기</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CHARACTER_MOTIVATIONS.map((m, i) => (
                <div key={i} onClick={() => setCharMotivation(charMotivation === m ? null : m)} style={{
                  padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, transition: "all 0.2s",
                  background: charMotivation === m ? theme.accent + "18" : "#111", border: `1px solid ${charMotivation === m ? theme.accent + "66" : "#222"}`,
                  color: charMotivation === m ? theme.accent : "#888",
                }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={buildCharacter} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
          }}>
            ⚔️ 캐릭터 생성
          </button>
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>미선택 항목은 랜덤 배정</div>
        </div>

        {/* Result Card */}
        {charBuilt && (
          <div style={{ background: "linear-gradient(145deg, #0f0f1a, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Character Header */}
            <div style={{ padding: "28px 28px 0", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${theme.accent}15, transparent 60%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 56, marginBottom: 8, position: "relative" }}>{charBuilt.cls.icon}</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", position: "relative" }}>{charBuilt.name}</h3>
              <div style={{ fontSize: 14, color: theme.accent, position: "relative" }}>{charBuilt.cls.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4, position: "relative" }}>{charBuilt.cls.desc}</div>
            </div>

            {/* Stats Radar-like display */}
            <div style={{ padding: "20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                {Object.entries(charBuilt.stats).map(([k, v]) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: STAT_COLORS[k], fontWeight: 600, marginBottom: 4 }}>{STAT_NAMES[k]}</div>
                    <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 2, height: 50 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          width: 20, height: 8, borderRadius: 3,
                          background: i <= v ? STAT_COLORS[k] : "#222",
                          boxShadow: i <= v ? `0 0 6px ${STAT_COLORS[k]}44` : "none",
                          transition: "all 0.3s",
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: STAT_COLORS[k], marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio sections */}
            <div style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>기원</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.origin}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>동기</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.motivation}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#ff444408", border: "1px solid #ff444422" }}>
                <div style={{ fontSize: 10, color: "#ff8888", letterSpacing: "0.15em", marginBottom: 4 }}>
                  동료 존재 — {charBuilt.companion.n}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {getTypeIcon(charBuilt.companion.t)} {charBuilt.companion.n} ({charBuilt.companion.t}) · {charBuilt.companion.country}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{charBuilt.companion.d}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: `${theme.accent}08`, border: `1px solid ${theme.accent}22` }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>
                  🔗 시너지 — {charBuilt.synergy.label}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.synergy.desc}</div>
                <div style={{ fontSize: 11, color: STAT_COLORS[charBuilt.synergy.bonus], marginTop: 4 }}>
                  +1 {STAT_NAMES[charBuilt.synergy.bonus]} 보너스
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <button onClick={buildCharacter} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🎲 다시 생성
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  📱 WEBTOON IP DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════
  const WebtoonIPDev = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r })));
      return arr;
    }, [DATA]);
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const [wBeingSearch, setWBeingSearch] = useState("");
    const wSearched = useMemo(() => {
      if (!wBeingSearch) return allBeings.slice(0, 16);
      const q = wBeingSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q)).slice(0, 16);
    }, [allBeings, wBeingSearch]);

    const toggleWBeing = (b) => {
      setWebtoonBeings(prev => {
        const exists = prev.find(x => x.n === b.n && x.country === b.country);
        if (exists) return prev.filter(x => !(x.n === b.n && x.country === b.country));
        if (prev.length >= 5) return prev;
        return [...prev, b];
      });
    };

    const generateWebtoonIP = () => {
      const genre = webtoonGenre || pickRandom(WEBTOON_GENRES);
      const structure = webtoonStructure || pickRandom(WEBTOON_STRUCTURES);
      let beings = webtoonBeings.length >= 1 ? [...webtoonBeings] : [];
      while (beings.length < 3) {
        const b = pickRandom(allBeings);
        if (!beings.find(x => x.n === b.n)) beings.push(b);
      }
      // Generate title
      const titles = [
        `${beings[0].n}의 마지막 밤`, `봉인 해제: ${beings[0].country} 편`, `달빛 아래 ${beings[0].t}`,
        `${beings[0].n} — 천 번째 환생`, `어둠의 계약서`, `${beings[0].country}에서 온 그림자`,
        `퇴마록: ${beings.map(b => b.country).filter((v,i,a)=>a.indexOf(v)===i).join("×")}`, `붉은 달이 뜨는 밤`,
      ];
      const title = pickRandom(titles);

      // ── LOGLINE ──
      const loglineTemplates = {
        dark_fantasy: [
          `${beings[0].country}의 봉인이 풀린 밤, ${beings[0].n}의 저주를 받은 주인공이 세계의 균형을 되찾기 위해 대륙을 넘나드는 여정을 시작한다.`,
          `천 년간 잠들어있던 ${beings[0].n}이(가) 깨어나고, 그것을 막을 수 있는 건 ${beings[0].country}의 마지막 퇴마사 혈통뿐이다.`,
          `${beings[1].n}에게 반쪽 영혼을 빼앗긴 주인공이, ${beings[0].n}과 금지된 동맹을 맺고 세계의 어둠에 맞선다.`,
        ],
        horror: [
          `매일 밤 3시, ${beings[0].n}의 목소리가 들린다. 그 소리를 따라간 사람은 아무도 돌아오지 못했다 — 나를 제외하고.`,
          `${beings[0].country}의 폐마을에 도착한 다큐멘터리 팀. 카메라에 찍힌 것은 ${beings[0].n}이 아니라, 자신들의 과거였다.`,
          `실종된 언니를 찾아 ${beings[0].country}에 온 주인공. 마을 사람들은 모두 ${beings[0].n}을(를) 섬기고 있었다.`,
        ],
        romance_fantasy: [
          `인간이 되고 싶은 ${beings[0].n}과, 존재를 사냥하는 퇴마사 집안의 마지막 후손 — 금지된 만남이 시작된다.`,
          `${beings[0].n}은(는) 전생에 사랑했던 인간을 매 환생마다 찾아온다. 이번 생이 마지막 기회.`,
          `빗속에서 만난 ${beings[0].n}. 그의 정체를 알았을 때, 나는 이미 돌이킬 수 없었다.`,
        ],
        action: [
          `전 세계의 봉인이 동시에 풀렸다. ${beings.map(b=>b.country).join(", ")}에서 깨어난 존재들을 상대할 글로벌 퇴마 태스크포스 결성.`,
          `${beings[0].n}의 힘을 몸에 품은 주인공이, 더 강한 존재들을 하나씩 사냥하며 최강의 퇴마사로 성장한다.`,
          `${beings[0].country}의 지하 투기장, 포획된 초자연 존재들의 배틀 로얄. 주인공은 ${beings[0].n}과 팀을 이뤄야 살아남는다.`,
        ],
        comedy: [
          `${beings[0].n}이(가) 현대 서울에 소환됐다. 원룸 월세, 편의점 알바, 배달앱까지 — 공포의 존재의 좌충우돌 인간 적응기.`,
          `다국적 민담 존재 셰어하우스. ${beings.map(b => `${b.country}의 ${b.n}`).join(", ")}이 한 지붕 아래서 벌이는 문화충돌 코미디.`,
          `SNS 인플루언서가 된 ${beings[0].n}. 팔로워 100만 달성하면 인간이 될 수 있다는 전설을 믿고 콘텐츠 제작에 나선다.`,
        ],
        mystery: [
          `연쇄 실종 사건의 현장마다 ${beings[0].n}의 흔적이 남아있다. 민속학 교수 출신 형사의 초자연 수사극.`,
          `${beings[0].country}에서 온 의문의 고서에는 ${beings.map(b=>b.n).join(", ")}의 소환법이 적혀있었다. 고서를 읽은 자들이 하나씩 사라진다.`,
          `국제 민담 학술 회의에서 발표자가 무대 위에서 소멸. 유일한 증거는 ${beings[0].n}을 묘사한 손 그림 한 장.`,
        ],
      };
      const genreKey = genre.id === "romance_fantasy" ? "romance_fantasy" : genre.id;
      const templates = loglineTemplates[genreKey] || loglineTemplates.dark_fantasy;
      const autoLogline = pickRandom(templates);
      const logline = loglineMode === "custom" && customLogline.trim() ? customLogline.trim() : autoLogline;

      // ── TARGETING ──
      const targetingData = {
        dark_fantasy: { primary: "18-34세 남녀", secondary: "판타지/게임 유저", tone: "어둡고 몰입감 있는", platforms: ["네이버웹툰", "카카오페이지", "레진코믹스"], comparable: ["나 혼자만 레벨업", "전지적 독자 시점", "신의 탑"] },
        horror: { primary: "18-30세 남녀", secondary: "공포/스릴러 매니아", tone: "서늘하고 긴장감 있는", platforms: ["네이버웹툰", "봄툰", "투믹스"], comparable: ["스위트홈", "사신소년", "타인은 지옥이다"] },
        romance_fantasy: { primary: "18-35세 여성", secondary: "로맨스판타지 독자", tone: "신비롭고 감성적인", platforms: ["카카오페이지", "리디", "시리즈"], comparable: ["재혼 황후", "어느 날 공주가 되어버렸다", "여주인공의 오빠를 지키는 방법"] },
        action: { primary: "15-30세 남성", secondary: "액션/배틀만화 독자", tone: "열혈 성장 서사", platforms: ["네이버웹툰", "카카오페이지", "레진코믹스"], comparable: ["갓 오브 하이스쿨", "언오디너리", "더 복서"] },
        comedy: { primary: "15-35세 남녀", secondary: "일상/힐링 웹툰 독자", tone: "유쾌하고 따뜻한", platforms: ["네이버웹툰", "카카오웹툰"], comparable: ["유미의 세포들", "놓지마 정신줄", "외모지상주의"] },
        mystery: { primary: "20-40세 남녀", secondary: "추리/미스터리 독자", tone: "지적이고 서스펜스한", platforms: ["네이버웹툰", "카카오페이지", "리디"], comparable: ["살인자ㅇ난감", "모범택시", "D.P"] },
      };
      const targeting = targetingData[genreKey] || targetingData.dark_fantasy;

      // ── CHARACTERS ──
      const charRoles = {
        dark_fantasy: [
          { role: "주인공", archetype: "각성한 퇴마사", traits: ["고독한 과거", "강한 의지", "숨겨진 혈통"], arc: "평범한 인간에서 전설의 퇴마사로" },
          { role: "히로인/히어로", archetype: "존재의 중재자", traits: ["공감 능력", "양면적 충성", "비밀을 품은 자"], arc: "인간과 존재 사이의 다리가 되는 여정" },
          { role: "라이벌", archetype: "타락한 퇴마사", traits: ["뛰어난 재능", "어두운 동기", "비극적 과거"], arc: "적에서 아군으로, 또는 최종 보스로" },
          { role: "멘토", archetype: "은퇴한 전설", traits: ["압도적 지식", "숨겨진 트라우마", "자기희생"], arc: "제자에게 모든 것을 물려주는 최후" },
        ],
        horror: [
          { role: "주인공", archetype: "일반인 생존자", traits: ["평범함", "직관력", "끈질긴 생명력"], arc: "공포를 직면하고 진실을 밝히는 여정" },
          { role: "동료", archetype: "회의적 합리주의자", traits: ["논리적 사고", "감정 억제", "숨겨진 상처"], arc: "믿지 않던 것을 목격하고 무너지는 과정" },
          { role: "경고자", archetype: "미치광이 예언자", traits: ["진실을 아는 자", "아무도 믿지 않는 증인", "과거 피해자"], arc: "무시당하던 경고가 현실이 되는 비극" },
        ],
        romance_fantasy: [
          { role: "주인공", archetype: "운명에 엮인 인간", traits: ["순수한 마음", "강한 호기심", "전생의 기억 편린"], arc: "금지된 사랑을 선택하는 용기" },
          { role: "상대역 (존재)", archetype: "인간을 동경하는 존재", traits: ["아름다운 외모", "고독한 영혼", "치명적 약점"], arc: "사랑을 통해 인간성을 획득/상실" },
          { role: "조연", archetype: "현실의 닻", traits: ["유머 감각", "든든한 지원군", "숨겨진 능력"], arc: "친구에서 핵심 조력자로 성장" },
        ],
        action: [
          { role: "주인공", archetype: "성장형 전사", traits: ["무모한 용기", "숨겨진 잠재력", "정의감"], arc: "약한 신인에서 최강의 퇴마사로" },
          { role: "파트너", archetype: "전략가", traits: ["냉철한 판단", "광범위한 지식", "신체적 약점 보완"], arc: "두뇌로 전투를 뒤집는 참모" },
          { role: "라이벌", archetype: "천재 전사", traits: ["압도적 실력", "고만한 태도", "인정 욕구"], arc: "적에서 최고의 동맹으로" },
        ],
        comedy: [
          { role: "주인공", archetype: "평범한 현대인", traits: ["상식인 대표", "츳코미 담당", "숨은 리더십"], arc: "비일상을 일상으로 받아들이는 과정" },
          { role: "메인 존재", archetype: "순수한 괴물", traits: ["세상 물정 모르는", "엉뚱한 매력", "의외의 먹성"], arc: "인간 세계 적응기와 성장" },
          { role: "조연", archetype: "오타쿠 덕후", traits: ["민담 마니아", "정보통", "사교성 제로"], arc: "존재를 만나 인생이 바뀌는 성장기" },
        ],
        mystery: [
          { role: "주인공", archetype: "민속학 탐정", traits: ["집요한 탐구심", "직감과 논리의 공존", "과거의 트라우마"], arc: "사건을 풀수록 자신의 비밀에 다가감" },
          { role: "파트너", archetype: "영적 감응자", traits: ["존재를 감지하는 능력", "정서적 불안정", "핵심 증거 제공"], arc: "능력의 대가를 치르며 성장" },
          { role: "흑막", archetype: "가면의 조종자", traits: ["뛰어난 카리스마", "이중적 정체성", "거대한 목적"], arc: "반전의 중심에 서는 최종 적" },
        ],
      };
      const charTemplates = charRoles[genreKey] || charRoles.dark_fantasy;
      const characters = charTemplates.map((tmpl, idx) => {
        const relatedBeing = beings[idx] || beings[0];
        return {
          ...tmpl,
          name: idx === 0 ? `주인공 (플레이어 설정)` : tmpl.role,
          relatedBeing: relatedBeing.n,
          relatedCountry: relatedBeing.country,
        };
      });

      // ── EPISODES (enhanced with logline connection) ──
      const eps = [
        { num: "1~3화", title: "프롤로그 — 균열", desc: `평범한 일상에 ${beings[0].n}의 그림자가 침입한다. 주인공은 자신의 능력을 자각하기 시작한다.` },
        { num: "4~10화", title: "제1아크 — 각성", desc: `${beings[0].n}(${beings[0].country})과의 첫 조우와 대결. 주인공의 과거와 존재의 연결이 드러난다.` },
        { num: "11~20화", title: "제2아크 — 확장", desc: `${beings[1].n}(${beings[1].country})이 등장하며 세계관이 확장. 대륙 간 영적 네트워크의 존재를 알게 된다.` },
        { num: "21~30화", title: "제3아크 — 전환", desc: `${beings[2].n}(${beings[2].country})의 등장으로 모든 갈등이 절정. 반전과 함께 시즌 클라이막스.` },
        { num: "시즌2", title: "확장 — 글로벌 서사", desc: `${beings.map(b => b.country).filter((v,i,a)=>a.indexOf(v)===i).join(", ")}를 넘어 전 세계의 존재들이 연결되는 대서사시.` },
      ];
      // Monetization
      const monetization = [
        { item: "웹툰 연재 수익", desc: "플랫폼 유료화/광고 수익 분배", potential: "★★★★☆" },
        { item: "단행본 출간", desc: "시즌별 단행본 + 특별판", potential: "★★★☆☆" },
        { item: "캐릭터 굿즈", desc: `${beings[0].n}, ${beings[1].n} 피규어/아크릴 등`, potential: "★★★★☆" },
        { item: "게임화", desc: "수집형 RPG / 비주얼노벨", potential: "★★★★★" },
        { item: "드라마/애니", desc: "영상화 IP 라이센싱", potential: "★★★★★" },
      ];
      setWebtoonResult({ genre, structure, beings, title, logline, targeting, characters, episodes: eps, monetization });
    };

    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          📱 웹툰 IP 개발
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          민담 존재를 활용한 웹툰 기획서를 자동 생성합니다
        </p>

        {/* Logline Mode */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>⓪ 로그라인 모드</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setLoglineMode("auto")}
              style={{
                padding: "10px 20px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                border: `1px solid ${loglineMode === "auto" ? theme.accent : "#333"}`,
                background: loglineMode === "auto" ? theme.accent + "18" : "#111",
                color: loglineMode === "auto" ? theme.accent : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
              }}>
              🎲 자동 생성
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>존재 기반 로그라인 자동 생성</div>
            </button>
            <button onClick={() => setLoglineMode("custom")}
              style={{
                padding: "10px 20px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                border: `1px solid ${loglineMode === "custom" ? "#ff8844" : "#333"}`,
                background: loglineMode === "custom" ? "#ff884418" : "#111",
                color: loglineMode === "custom" ? "#ff8844" : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
              }}>
              ✍️ 직접 입력
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>나만의 로그라인으로 기획서 생성</div>
            </button>
          </div>
          {loglineMode === "custom" && (
            <textarea value={customLogline} onChange={e => setCustomLogline(e.target.value)}
              placeholder="로그라인을 입력하세요... (예: 현대 서울에 소환된 구미호가 퇴마사와 손잡고 도시의 어둠에 맞서는 다크 판타지)"
              style={{
                width: "100%", minHeight: 70, padding: "10px 14px", borderRadius: 12, border: `1px solid #ff884444`,
                background: "#0a0a0a", color: "#fff", fontSize: 13, fontFamily: "'Crimson Text', serif",
                outline: "none", resize: "vertical", lineHeight: 1.6,
              }} />
          )}
        </div>

        {/* Genre */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>① 장르</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WEBTOON_GENRES.map(g => (
              <button key={g.id} onClick={() => setWebtoonGenre(webtoonGenre?.id === g.id ? null : g)}
                style={{
                  padding: "10px 16px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                  border: `1px solid ${webtoonGenre?.id === g.id ? g.color : "#333"}`,
                  background: webtoonGenre?.id === g.id ? g.color + "18" : "#111",
                  color: webtoonGenre?.id === g.id ? g.color : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
                }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span> {g.name}
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Structure */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>② 연재 구조</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WEBTOON_STRUCTURES.map((s, i) => (
              <div key={i} onClick={() => setWebtoonStructure(webtoonStructure?.name === s.name ? null : s)}
                style={{
                  padding: "10px 14px", borderRadius: 12, cursor: "pointer", flex: "1 1 180px", minWidth: 160, transition: "all 0.3s",
                  border: `1px solid ${webtoonStructure?.name === s.name ? theme.accent : "#333"}`,
                  background: webtoonStructure?.name === s.name ? theme.accent + "18" : "#111",
                  color: webtoonStructure?.name === s.name ? theme.accent : "#888",
                }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{s.desc}</div>
                <div style={{ fontSize: 10, color: theme.accent, marginTop: 4, opacity: 0.7 }}>{s.episodes}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Beings */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>③ 핵심 존재 ({webtoonBeings.length}/5)</div>
          {webtoonBeings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {webtoonBeings.map((b, i) => (
                <span key={i} onClick={() => toggleWBeing(b)} style={{
                  padding: "4px 10px", borderRadius: 14, background: "#ff444418", border: "1px solid #ff444444",
                  color: "#ff8888", fontSize: 11, cursor: "pointer",
                }}>
                  {getTypeIcon(b.t)} {b.n} · {b.country} ✕
                </span>
              ))}
            </div>
          )}
          <input value={wBeingSearch} onChange={e => setWBeingSearch(e.target.value)} placeholder="존재 검색..."
            style={{ width: "100%", maxWidth: 300, padding: "6px 12px", borderRadius: 16, border: "1px solid #333",
              background: "#0a0a0a", color: "#fff", fontSize: 12, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflow: "auto" }}>
            {wSearched.map((b, i) => {
              const sel = webtoonBeings.find(x => x.n === b.n && x.country === b.country);
              return (
                <span key={i} onClick={() => toggleWBeing(b)} style={{
                  padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                  background: sel ? theme.accent + "22" : "#161616", border: `1px solid ${sel ? theme.accent : "#222"}`,
                  color: "#999", transition: "all 0.2s",
                }}>
                  {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Generate */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={generateWebtoonIP} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
          }}>
            📱 IP 기획서 생성
          </button>
        </div>

        {/* Result */}
        {webtoonResult && (
          <div style={{ background: "linear-gradient(145deg, #0a0f1a, #0a0a0a)", border: `1px solid ${webtoonResult.genre.color}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: 28, textAlign: "center", position: "relative",
              background: `linear-gradient(180deg, ${webtoonResult.genre.color}12, transparent)` }}>
              <div style={{ fontSize: 11, color: webtoonResult.genre.color, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                WEBTOON IP PROPOSAL
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 8, marginBottom: 4 }}>
                {webtoonResult.title}
              </h3>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                <span style={{ padding: "4px 12px", borderRadius: 12, background: webtoonResult.genre.color + "22",
                  color: webtoonResult.genre.color, fontSize: 12, border: `1px solid ${webtoonResult.genre.color}44` }}>
                  {webtoonResult.genre.icon} {webtoonResult.genre.name}
                </span>
                <span style={{ padding: "4px 12px", borderRadius: 12, background: "#ffffff08", color: "#aaa", fontSize: 12, border: "1px solid #ffffff15" }}>
                  📐 {webtoonResult.structure.name} · {webtoonResult.structure.episodes}
                </span>
              </div>
            </div>

            {/* LOGLINE */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                📝 로그라인
              </div>
              <div style={{
                padding: 20, borderRadius: 14,
                background: `linear-gradient(135deg, ${webtoonResult.genre.color}08, #0a0a0a)`,
                border: `1px solid ${webtoonResult.genre.color}33`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 10, left: 16, fontSize: 32, opacity: 0.08, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#eee", fontStyle: "italic", margin: 0, position: "relative", paddingLeft: 4 }}>
                  {webtoonResult.logline}
                </p>
                <div style={{ position: "absolute", bottom: 6, right: 16, fontSize: 32, opacity: 0.08, lineHeight: 1 }}>"</div>
              </div>
            </div>

            {/* TARGETING */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                🎯 타겟팅
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>주요 타겟층</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{webtoonResult.targeting.primary}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>부타겟: {webtoonResult.targeting.secondary}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>작품 톤</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{webtoonResult.targeting.tone}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>추천 플랫폼: {webtoonResult.targeting.platforms.join(", ")}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>비교 작품</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                    {webtoonResult.targeting.comparable.map((c, i) => (
                      <span key={i} style={{ padding: "3px 8px", borderRadius: 8, background: webtoonResult.genre.color + "15", border: `1px solid ${webtoonResult.genre.color}30`, color: webtoonResult.genre.color, fontSize: 11 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHARACTERS */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                👥 주요 등장인물
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {webtoonResult.characters.map((ch, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 14,
                    background: i === 0 ? `linear-gradient(135deg, ${webtoonResult.genre.color}10, #0a0a0a)` : "#ffffff04",
                    border: `1px solid ${i === 0 ? webtoonResult.genre.color + "44" : "#ffffff0a"}`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: i === 0 ? webtoonResult.genre.color + "22" : "#ffffff0a", color: i === 0 ? webtoonResult.genre.color : "#888", fontWeight: 600, marginRight: 8 }}>
                          {ch.role}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{ch.archetype}</span>
                      </div>
                      <span style={{ fontSize: 10, opacity: 0.4 }}>연관: {ch.relatedBeing} ({ch.relatedCountry})</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                      {ch.traits.map((trait, j) => (
                        <span key={j} style={{ padding: "2px 8px", borderRadius: 6, background: "#ffffff08", color: "#aaa", fontSize: 10, border: "1px solid #ffffff0a" }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5, fontStyle: "italic" }}>
                      캐릭터 아크: {ch.arc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cast (beings) */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                🐉 등장 존재 (크리처 캐스팅)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {webtoonResult.beings.map((b, i) => (
                  <div key={i} style={{ flex: "1 1 160px", padding: 12, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a", minWidth: 150 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{getTypeIcon(b.t)} {b.n}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{b.country} · {b.t} · 공포 {b.f}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3, lineHeight: 1.4 }}>{b.d?.slice(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Episode Arc */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                에피소드 구성
              </div>
              <div style={{ borderLeft: `2px solid ${webtoonResult.genre.color}33`, paddingLeft: 16 }}>
                {webtoonResult.episodes.map((ep, i) => (
                  <div key={i} style={{ marginBottom: 14, position: "relative" }}>
                    <div style={{ position: "absolute", left: -23, top: 2, width: 10, height: 10, borderRadius: "50%",
                      background: i <= 3 ? webtoonResult.genre.color : "#666", border: "2px solid #0a0a0a" }} />
                    <div style={{ fontSize: 11, color: webtoonResult.genre.color, fontWeight: 600 }}>{ep.num}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{ep.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>{ep.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* IP Expansion */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                IP 확장 & 수익화
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {webtoonResult.monetization.map((m, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: "#ffffff04", border: "1px solid #ffffff0a" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{m.item}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{m.desc}</div>
                    <div style={{ fontSize: 12, color: "#ffcc44", marginTop: 4 }}>{m.potential}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-media expansion */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                멀티미디어 확장 로드맵
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {IP_EXPANSION.map((ip, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a",
                    textAlign: "center", flex: "1 1 100px", minWidth: 90 }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{ip.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc" }}>{ip.name}</div>
                    <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{ip.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <button onClick={generateWebtoonIP} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${webtoonResult.genre.color}66`,
                background: "transparent", color: webtoonResult.genre.color, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🎲 다시 생성
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  🛠 CREATURE CHARACTER BUILDER
  // ═══════════════════════════════════════════════════════════════
  const CreatureCharBuilder = () => {
    const [bSearch, setBSearch] = useState("");
    const [bTypeFilter, setBTypeFilter] = useState(null);

    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i, continent: CONTINENT_MAP[c.r] })));
      return arr;
    }, [DATA]);

    const types = useMemo(() => {
      const s = new Set();
      allBeings.forEach(b => s.add(b.t));
      return [...s].sort();
    }, [allBeings]);

    const filteredBeings = useMemo(() => {
      let list = allBeings;
      if (bTypeFilter) list = list.filter(b => b.t === bTypeFilter);
      if (bSearch) {
        const q = bSearch.toLowerCase();
        list = list.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q));
      }
      return list.slice(0, 24);
    }, [allBeings, bSearch, bTypeFilter]);

    const generateSheet = () => {
      if (!builderBeing) return;
      const b = builderBeing;
      const name = builderCharName || `이름 없는 ${b.n} 계열 캐릭터`;
      const appearance = builderAppearance || (b.vk && b.vk.length > 0 ? b.vk.join(", ") + "의 특징을 지닌 존재" : "알 수 없는 외형");
      const personality = builderPersonality || "미스터리한 성격";
      const motivation = builderMotivation || "알 수 없는 동기";
      const arc = builderArc || "운명에 이끌려 변화의 여정을 시작한다";

      const abilities = b.ab ? b.ab.filter(a => a !== "불명") : [];
      const weaknesses = b.wk ? b.wk.filter(w => !w.includes("불명")) : [];
      const genres = b.gf || [];
      const storyHooks = b.sh || [];
      const visuals = b.vk || [];

      // Generate narrative hooks combining creature data + user input
      const narrativeHooks = [];
      if (abilities.length > 0) narrativeHooks.push(`${abilities[0]}의 힘을 지닌 ${name}은(는) ${motivation}을(를) 위해 나아간다.`);
      if (weaknesses.length > 0) narrativeHooks.push(`그러나 ${weaknesses[0]}이(가) 치명적 약점이 되어 갈등의 원인이 된다.`);
      if (storyHooks.length > 0) narrativeHooks.push(storyHooks[0]);

      setBuilderResult({
        name, appearance, personality, motivation, arc,
        baseBeing: b,
        abilities, weaknesses, genres, storyHooks, visuals,
        narrativeHooks,
      });
    };

    const resetBuilder = () => {
      setBuilderBeing(null);
      setBuilderCharName("");
      setBuilderAppearance("");
      setBuilderPersonality("");
      setBuilderMotivation("");
      setBuilderArc("");
      setBuilderResult(null);
    };

    const inputStyle = {
      width: "100%", padding: "8px 14px", borderRadius: 12,
      border: `1px solid ${theme.accent}33`, background: "#0a0a0a",
      color: "#fff", fontSize: 13, fontFamily: "'Crimson Text', serif", outline: "none",
    };

    const textareaStyle = {
      ...inputStyle, minHeight: 60, resize: "vertical", borderRadius: 12,
    };

    const sectionLabel = (text, color) => (
      <div style={{ fontSize: 11, fontWeight: 600, color: color || theme.accent, letterSpacing: "0.1em", marginBottom: 6 }}>{text}</div>
    );

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          🛠 크리처 캐릭터 빌더
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          크리처를 선택하고, 그 능력과 특성을 기반으로 캐릭터 시트를 생성하세요
        </p>

        {/* ─── Creature Selection ─── */}
        <div style={{ marginBottom: 20 }}>
          {sectionLabel("① 크리처 선택")}
          {builderBeing && (
            <div style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "6px 14px", borderRadius: 16,
              background: theme.accent + "18", border: `1px solid ${theme.accent}44`, marginBottom: 8, cursor: "pointer" }}
              onClick={() => { setBuilderBeing(null); setBuilderResult(null); }}>
              <span>{getTypeIcon(builderBeing.t)} {builderBeing.n} · {builderBeing.country}</span>
              <span style={{ opacity: 0.5, fontSize: 11 }}>✕</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <input value={bSearch} onChange={e => setBSearch(e.target.value)} placeholder="이름 또는 국가로 검색..."
              style={{ ...inputStyle, maxWidth: 240 }} />
            <select value={bTypeFilter || ""} onChange={e => setBTypeFilter(e.target.value || null)}
              style={{ padding: "6px 10px", borderRadius: 12, border: "1px solid #333", background: "#0a0a0a", color: "#999", fontSize: 12, outline: "none", cursor: "pointer" }}>
              <option value="">모든 유형</option>
              {types.map(t => <option key={t} value={t}>{getTypeIcon(t)} {t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflow: "auto" }}>
            {filteredBeings.map((b, i) => (
              <span key={i} onClick={() => { setBuilderBeing(b); setBuilderResult(null); }} style={{
                padding: "4px 10px", borderRadius: 10, fontSize: 11, cursor: "pointer",
                background: builderBeing?.n === b.n && builderBeing?.country === b.country ? theme.accent + "22" : "#111",
                border: `1px solid ${builderBeing?.n === b.n && builderBeing?.country === b.country ? theme.accent : "#222"}`,
                color: builderBeing?.n === b.n && builderBeing?.country === b.country ? theme.accent : "#999",
                transition: "all 0.2s",
              }}>
                {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ─── Creature Reference Panel ─── */}
        {builderBeing && (
          <div style={{ marginBottom: 20, padding: 16, borderRadius: 16, background: "#0d0d0d", border: `1px solid ${theme.accent}22` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
              {getTypeIcon(builderBeing.t)} {builderBeing.n}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 10 }}>
              {builderBeing.country} · {builderBeing.t} · {builderBeing.region}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>{builderBeing.d}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {builderBeing.ab && builderBeing.ab.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginBottom: 3 }}>능력</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>{builderBeing.ab.map((a, i) => <TagPill key={i} text={a} color={theme.accent} />)}</div>
                </div>
              )}
              {builderBeing.wk && builderBeing.wk.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 3 }}>약점</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>{builderBeing.wk.map((w, i) => <TagPill key={i} text={w} color="#ff9800" />)}</div>
                </div>
              )}
              {builderBeing.vk && builderBeing.vk.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#9c27b0", fontWeight: 600, marginBottom: 3 }}>외형 키워드</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>{builderBeing.vk.map((v, i) => <TagPill key={i} text={v} color="#9c27b0" />)}</div>
                </div>
              )}
              {builderBeing.gf && builderBeing.gf.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#2196f3", fontWeight: 600, marginBottom: 3 }}>적합 장르</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>{builderBeing.gf.map((g, i) => <TagPill key={i} text={g} color="#2196f3" />)}</div>
                </div>
              )}
              {builderBeing.sh && builderBeing.sh.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#00bcd4", fontWeight: 600, marginBottom: 3 }}>스토리 훅</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>{builderBeing.sh.map((s, i) => <TagPill key={i} text={s} color="#00bcd4" />)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Character Input Fields ─── */}
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {sectionLabel("② 캐릭터 정보 입력")}
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>캐릭터 이름</div>
            <input value={builderCharName} onChange={e => setBuilderCharName(e.target.value)} placeholder="캐릭터 이름을 입력하세요..."
              style={{ ...inputStyle, maxWidth: 320 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>외형 묘사</div>
            <textarea value={builderAppearance} onChange={e => setBuilderAppearance(e.target.value)}
              placeholder="캐릭터의 외형을 묘사하세요... (비워두면 크리처 외형 키워드 기반으로 자동 생성)"
              style={textareaStyle} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>성격</div>
              <input value={builderPersonality} onChange={e => setBuilderPersonality(e.target.value)} placeholder="예: 냉정하지만 내면은 따뜻한..."
                style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>동기</div>
              <input value={builderMotivation} onChange={e => setBuilderMotivation(e.target.value)} placeholder="예: 잃어버린 기억을 되찾기 위해..."
                style={inputStyle} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>캐릭터 아크</div>
            <textarea value={builderArc} onChange={e => setBuilderArc(e.target.value)}
              placeholder="캐릭터가 겪을 변화와 성장의 여정을 묘사하세요..."
              style={textareaStyle} />
          </div>
        </div>

        {/* ─── Generate Button ─── */}
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", justifyContent: "center", gap: 10 }}>
          <button onClick={generateSheet} disabled={!builderBeing} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${builderBeing ? theme.accent : "#333"}`,
            background: builderBeing ? `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)` : "#111",
            color: builderBeing ? theme.accent : "#555", cursor: builderBeing ? "pointer" : "not-allowed",
            fontSize: 16, fontWeight: 700, fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
            opacity: builderBeing ? 1 : 0.5,
          }}>
            📋 캐릭터 시트 생성
          </button>
          {builderResult && (
            <button onClick={resetBuilder} style={{
              padding: "14px 20px", borderRadius: 28, border: "1px solid #444",
              background: "transparent", color: "#888", cursor: "pointer",
              fontSize: 13, fontFamily: "'Crimson Text', serif",
            }}>
              🔄 초기화
            </button>
          )}
        </div>
        {!builderBeing && (
          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.4, marginTop: -16, marginBottom: 16 }}>
            크리처를 먼저 선택해주세요
          </div>
        )}

        {/* ─── Result Character Sheet Card ─── */}
        {builderResult && (
          <div style={{ background: "linear-gradient(145deg, #0f0f1a, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "28px 28px 16px", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${theme.accent}15, transparent 60%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 48, marginBottom: 8, position: "relative" }}>{getTypeIcon(builderResult.baseBeing.t)}</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", position: "relative", marginBottom: 4 }}>{builderResult.name}</h3>
              <div style={{ display: "inline-flex", gap: 4, position: "relative" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: theme.accent + "18", color: theme.accent, border: `1px solid ${theme.accent}33` }}>
                  {builderResult.baseBeing.n}
                </span>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#ffffff08", color: "#888", border: "1px solid #ffffff15" }}>
                  {builderResult.baseBeing.country}
                </span>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#ffffff08", color: "#888", border: "1px solid #ffffff15" }}>
                  {builderResult.baseBeing.t}
                </span>
              </div>
            </div>

            {/* Bio Sections */}
            <div style={{ padding: "0 28px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Appearance */}
              <div style={{ padding: 14, borderRadius: 12, background: "#9c27b008", border: "1px solid #9c27b022" }}>
                <div style={{ fontSize: 10, color: "#9c27b0", letterSpacing: "0.15em", marginBottom: 4 }}>외형</div>
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>{builderResult.appearance}</div>
                {builderResult.visuals.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
                    {builderResult.visuals.map((v, i) => <TagPill key={i} text={v} color="#9c27b0" />)}
                  </div>
                )}
              </div>

              {/* Personality */}
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>성격</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{builderResult.personality}</div>
              </div>

              {/* Motivation */}
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>동기</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{builderResult.motivation}</div>
              </div>

              {/* Arc */}
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>캐릭터 아크</div>
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>{builderResult.arc}</div>
              </div>

              {/* Abilities */}
              {builderResult.abilities.length > 0 && (
                <div style={{ padding: 14, borderRadius: 12, background: `${theme.accent}08`, border: `1px solid ${theme.accent}22` }}>
                  <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 6 }}>기반 능력</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {builderResult.abilities.map((a, i) => <TagPill key={i} text={a} color={theme.accent} />)}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {builderResult.weaknesses.length > 0 && (
                <div style={{ padding: 14, borderRadius: 12, background: "#ff980008", border: "1px solid #ff980022" }}>
                  <div style={{ fontSize: 10, color: "#ff9800", letterSpacing: "0.15em", marginBottom: 6 }}>약점</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {builderResult.weaknesses.map((w, i) => <TagPill key={i} text={w} color="#ff9800" />)}
                  </div>
                </div>
              )}

              {/* Genres */}
              {builderResult.genres.length > 0 && (
                <div style={{ padding: 14, borderRadius: 12, background: "#2196f308", border: "1px solid #2196f322" }}>
                  <div style={{ fontSize: 10, color: "#2196f3", letterSpacing: "0.15em", marginBottom: 6 }}>적합 장르</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {builderResult.genres.map((g, i) => <TagPill key={i} text={g} color="#2196f3" />)}
                  </div>
                </div>
              )}

              {/* Narrative Hooks */}
              {builderResult.narrativeHooks.length > 0 && (
                <div style={{ padding: 14, borderRadius: 12, background: "#00bcd408", border: "1px solid #00bcd422" }}>
                  <div style={{ fontSize: 10, color: "#00bcd4", letterSpacing: "0.15em", marginBottom: 6 }}>내러티브 훅</div>
                  {builderResult.narrativeHooks.map((h, i) => (
                    <div key={i} style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #00bcd433", lineHeight: 1.5 }}>{h}</div>
                  ))}
                </div>
              )}

              {/* Original Story Hooks */}
              {builderResult.storyHooks.length > 0 && (
                <div style={{ padding: 14, borderRadius: 12, background: "#00bcd405", border: "1px solid #00bcd415" }}>
                  <div style={{ fontSize: 10, color: "#00bcd4", letterSpacing: "0.15em", marginBottom: 6, opacity: 0.7 }}>원본 스토리 훅</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {builderResult.storyHooks.map((s, i) => <TagPill key={i} text={s} color="#00bcd4" />)}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ textAlign: "center", paddingBottom: 20, display: "flex", justifyContent: "center", gap: 8 }}>
              <button onClick={generateSheet} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🔄 다시 생성
              </button>
              <button onClick={resetBuilder} style={{
                padding: "8px 20px", borderRadius: 20, border: "1px solid #444",
                background: "transparent", color: "#888", cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🗑 초기화
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  📖 SYNOPSIS GENERATOR — 3-Act Structure Synopsis from Creature Data
  // ═══════════════════════════════════════════════════════════════
  const SynopsisGenerator = () => {
    const [synSearch, setSynSearch] = useState("");

    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i })));
      return arr;
    }, [DATA]);

    const searchedBeings = useMemo(() => {
      if (!synSearch) return allBeings.slice(0, 20);
      const q = synSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || b.t.toLowerCase().includes(q)).slice(0, 20);
    }, [allBeings, synSearch]);

    const GENRES = ["호러", "로맨스", "액션", "다크판타지", "미스터리"];
    const ERAS = ["고대", "중세", "조선시대", "근현대", "현대", "미래"];
    const LACKS = ["사랑", "가족", "정체성", "복수", "생존"];
    const RELATIONS = ["적", "조력자", "연인", "계약자"];
    const THEMES = ["복수", "성장", "구원", "희생", "공존"];
    const ENDINGS = ["비극", "열린결말", "해피엔딩", "반전"];

    const toggleBeing = (b) => {
      const exists = synopsisBeings.find(x => x.n === b.n && x.country === b.country);
      if (exists) {
        setSynopsisBeings(synopsisBeings.filter(x => !(x.n === b.n && x.country === b.country)));
      } else if (synopsisBeings.length < 3) {
        setSynopsisBeings([...synopsisBeings, b]);
      }
      setSynopsisResult(null);
    };

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const generateSynopsis = () => {
      if (synopsisBeings.length === 0) return;
      const genre = synopsisGenre || pickRandom(GENRES);
      const era = synopsisEra || pickRandom(ERAS);
      const lack = synopsisLack || pickRandom(LACKS);
      const relation = synopsisRelation || pickRandom(RELATIONS);
      const thm = synopsisTheme || pickRandom(THEMES);
      const ending = synopsisEnding || pickRandom(ENDINGS);

      const main = synopsisBeings[0];
      const sub = synopsisBeings.length > 1 ? synopsisBeings[1] : null;
      const third = synopsisBeings.length > 2 ? synopsisBeings[2] : null;

      const mainAb = main.ab ? main.ab.filter(a => a !== "불명") : [];
      const mainWk = main.wk ? main.wk.filter(w => !w.includes("불명")) : [];
      const mainSh = main.sh || [];
      const mainGf = main.gf || [];

      // Era-based setting
      const eraSettings = {
        "고대": "신화와 전설이 살아 숨쉬는 고대의 땅",
        "중세": "영주와 기사, 그리고 어둠이 지배하는 중세",
        "조선시대": "유교적 질서 아래 은밀한 초자연이 공존하는 조선",
        "근현대": "급변하는 시대의 소용돌이 속 근현대",
        "현대": "네온과 콘크리트 사이로 고대의 존재가 깨어나는 현대 도시",
        "미래": "기술과 초자연이 융합된 먼 미래의 세계",
      };

      // Genre-based tone
      const genreTones = {
        "호러": { mood: "공포와 불안이 스며드는", conflict: "생존을 위한 처절한", climax: "숨막히는 공포 속" },
        "로맨스": { mood: "운명적 이끌림이 시작되는", conflict: "금기된 감정과의", climax: "마침내 진심이 드러나는" },
        "액션": { mood: "긴장감이 폭발하는", conflict: "치명적인 대결의", climax: "최후의 결전 속" },
        "다크판타지": { mood: "어둠과 신비가 교차하는", conflict: "빛과 어둠의 경계에서", climax: "금기를 넘어서는 순간" },
        "미스터리": { mood: "의문과 단서가 얽히는", conflict: "진실에 다가갈수록 깊어지는", climax: "모든 퍼즐이 맞춰지는 순간" },
      };

      // Relation dynamics
      const relationDynamics = {
        "적": { intro: `${main.n}은(는) 주인공에게 있어 가장 위험한 존재다.`, mid: `${main.n}과(와)의 대립은 점점 격화되고`, resolve: `숙명의 적 ${main.n}과(와)의 최종 대결에서` },
        "조력자": { intro: `${main.n}은(는) 뜻밖에도 주인공의 편에 선다.`, mid: `${main.n}의 도움으로 서서히 길이 열리지만`, resolve: `${main.n}과(와) 쌓아온 신뢰를 바탕으로` },
        "연인": { intro: `${main.n}과(와)의 만남은 운명처럼 찾아온다.`, mid: `${main.n}을(를) 향한 감정은 금기를 넘어서고`, resolve: `${main.n}과(와)의 사랑이 시험받는 순간` },
        "계약자": { intro: `${main.n}과(와)의 계약은 대가를 요구한다.`, mid: `계약의 조건이 점점 가혹해지면서`, resolve: `${main.n}과(와)의 계약이 종결되는 순간` },
      };

      // Theme arcs
      const themeArcs = {
        "복수": "피로 물든 복수의 칼날은 결국 자신을 향한다",
        "성장": "시련을 통해 진정한 자신을 발견하게 된다",
        "구원": "어둠 속에서도 구원의 빛은 존재한다는 것을 깨닫는다",
        "희생": "사랑하는 것을 지키기 위해 가장 소중한 것을 내려놓는다",
        "공존": "다름을 인정할 때 비로소 진정한 평화가 찾아온다",
      };

      // Ending variations
      const endingTexts = {
        "비극": "그러나 운명은 잔혹했다. 모든 것을 잃은 자리에 남은 것은 쓸쓸한 바람뿐이다. 그 이름은 전설이 되어 후대에 경고로 전해진다.",
        "열린결말": "이야기는 끝나지 않았다. 새로운 여정의 시작점에 서서, 주인공은 아직 오지 않은 내일을 바라본다. 진정한 결말은 아직 쓰이지 않았다.",
        "해피엔딩": "오랜 고난 끝에 마침내 평화가 찾아온다. 상처는 아물고, 잃었던 것들이 새로운 형태로 되돌아온다. 이것이 그들이 원한 결말이다.",
        "반전": "그러나 모든 것이 계획대로였다. 진정한 흑막은 처음부터 가장 가까운 곳에 있었으며, 이제야 그 얼굴을 드러낸다. 진짜 이야기는 이제 시작이다.",
      };

      const tone = genreTones[genre];
      const rel = relationDynamics[relation];

      // ── ACT 1: Setup ──
      let act1 = `${eraSettings[era]}에서, ${lack}을(를) 잃은 주인공은 공허한 나날을 보내고 있다. `;
      act1 += `${tone.mood} 분위기 속에서, ${rel.intro} `;
      if (mainAb.length > 0) act1 += `${main.n}은(는) '${mainAb[0]}'의 능력을 지닌 ${main.t}으로, `;
      act1 += `${main.country}의 전승에서 전해지는 존재다. `;
      if (sub) {
        act1 += `한편, ${sub.country}에서 전해지는 ${sub.n}의 그림자가 드리우기 시작한다. `;
      }
      if (mainSh.length > 0) act1 += mainSh[0] + " ";

      // ── ACT 2: Confrontation ──
      let act2 = `${tone.conflict} 갈등이 깊어진다. ${rel.mid}, `;
      act2 += `주인공은 ${thm}의 의미를 묻기 시작한다. `;
      if (mainWk.length > 0) act2 += `${main.n}의 약점인 '${mainWk[0]}'이(가) 드러나면서 전세가 뒤바뀐다. `;
      if (mainAb.length > 1) act2 += `동시에 '${mainAb[1]}'의 힘이 폭주하며 상황은 걷잡을 수 없이 치닫는다. `;
      if (sub) {
        const subAb = sub.ab ? sub.ab.filter(a => a !== "불명") : [];
        if (subAb.length > 0) act2 += `${sub.n}은(는) '${subAb[0]}'의 능력으로 사태에 개입하고, `;
        act2 += `두 존재의 충돌은 주인공을 극한으로 몰아간다. `;
      }
      if (third) {
        act2 += `그리고 ${third.country}의 ${third.n}까지 나타나면서, 삼파전의 양상을 띠기 시작한다. `;
      }
      if (mainSh.length > 1) act2 += mainSh[1] + " ";

      // ── ACT 3: Resolution ──
      let act3 = `${tone.climax}, ${rel.resolve} `;
      act3 += `${themeArcs[thm]}. `;
      if (mainGf.length > 0) act3 += `이 이야기는 ${mainGf.join(", ")} 장르의 결을 따라 흐른다. `;
      act3 += endingTexts[ending];

      const title = (() => {
        const titles = {
          "호러": [`${main.n}의 저주`, `어둠 속의 ${main.n}`, `${era}, 금기의 문`],
          "로맨스": [`${main.n}에게 바치는 노래`, `금기된 연`, `${main.n}과(와)의 계절`],
          "액션": [`${main.n} 토벌기`, `${era}의 전쟁`, `최후의 ${main.t}`],
          "다크판타지": [`${main.n}의 왕좌`, `어둠의 계약`, `${era}, 신들의 황혼`],
          "미스터리": [`${main.n} 사건`, `${era}의 비밀`, `사라진 ${main.t}의 흔적`],
        };
        return pickRandom(titles[genre]);
      })();

      setSynopsisResult({
        title,
        genre, era, lack, relation, theme: thm, ending,
        beings: synopsisBeings,
        act1, act2, act3,
        fullText: `[제목] ${title}\n\n[1막 — 설정]\n${act1}\n\n[2막 — 대립]\n${act2}\n\n[3막 — 해결]\n${act3}`,
      });
      setSynopsisCopied(false);
    };

    const copyToClipboard = () => {
      if (!synopsisResult) return;
      navigator.clipboard.writeText(synopsisResult.fullText).then(() => {
        setSynopsisCopied(true);
        setTimeout(() => setSynopsisCopied(false), 2000);
      });
    };

    const resetSynopsis = () => {
      setSynopsisBeings([]);
      setSynopsisGenre(null);
      setSynopsisEra(null);
      setSynopsisLack(null);
      setSynopsisRelation(null);
      setSynopsisTheme(null);
      setSynopsisEnding(null);
      setSynopsisResult(null);
    };

    const OptionGrid = ({ label, options, value, setter, color }) => (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: color || theme.accent, marginBottom: 6 }}>{label}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map(opt => (
            <button key={opt} onClick={() => { setter(value === opt ? null : opt); setSynopsisResult(null); }} style={{
              padding: "6px 14px", borderRadius: 14, fontSize: 12, cursor: "pointer",
              border: `1px solid ${value === opt ? (color || theme.accent) : "#333"}`,
              background: value === opt ? (color || theme.accent) + "18" : "#111",
              color: value === opt ? (color || theme.accent) : "#777",
              fontFamily: "'Crimson Text', serif", fontWeight: value === opt ? 600 : 400,
              transition: "all 0.2s",
            }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          📖 시놉시스 생성기
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          크리처와 설정을 조합하여 3막 구조 시놉시스를 자동 생성합니다
        </p>

        {/* ─── Creature Selection ─── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent, marginBottom: 6 }}>
            ① 크리처 선택 <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>(1~3개)</span>
          </div>
          {synopsisBeings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {synopsisBeings.map((b, i) => (
                <div key={i} onClick={() => toggleBeing(b)} style={{
                  display: "inline-flex", gap: 6, alignItems: "center", padding: "5px 12px", borderRadius: 14,
                  background: [theme.accent + "18", "#ff980018", "#9c27b018"][i],
                  border: `1px solid ${[theme.accent, "#ff9800", "#9c27b0"][i]}44`,
                  cursor: "pointer", fontSize: 12,
                  color: [theme.accent, "#ff9800", "#9c27b0"][i],
                }}>
                  {getTypeIcon(b.t)} {b.n} · {b.country}
                  <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
                </div>
              ))}
            </div>
          )}
          <input value={synSearch} onChange={e => setSynSearch(e.target.value)} placeholder="이름, 국가, 유형으로 검색..."
            style={{ width: "100%", maxWidth: 280, padding: "7px 14px", borderRadius: 14, border: `1px solid ${theme.accent}33`,
              background: "#0a0a0a", color: "#fff", fontSize: 12, fontFamily: "'Crimson Text', serif", outline: "none", display: "block", marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 110, overflow: "auto" }}>
            {searchedBeings.map((b, i) => {
              const selected = synopsisBeings.find(x => x.n === b.n && x.country === b.country);
              return (
                <span key={i} onClick={() => toggleBeing(b)} style={{
                  padding: "4px 10px", borderRadius: 10, fontSize: 11, cursor: synopsisBeings.length >= 3 && !selected ? "not-allowed" : "pointer",
                  background: selected ? theme.accent + "22" : "#111",
                  border: `1px solid ${selected ? theme.accent : "#222"}`,
                  color: selected ? theme.accent : "#999",
                  opacity: synopsisBeings.length >= 3 && !selected ? 0.4 : 1,
                  transition: "all 0.2s",
                }}>
                  {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ─── Options Grid ─── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent, marginBottom: 12 }}>② 설정 선택 <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>(미선택 시 랜덤)</span></div>
          <OptionGrid label="장르" options={GENRES} value={synopsisGenre} setter={setSynopsisGenre} color={theme.accent} />
          <OptionGrid label="시대배경" options={ERAS} value={synopsisEra} setter={setSynopsisEra} color="#2196f3" />
          <OptionGrid label="주인공 결핍" options={LACKS} value={synopsisLack} setter={setSynopsisLack} color="#ff9800" />
          <OptionGrid label="크리처와의 관계" options={RELATIONS} value={synopsisRelation} setter={setSynopsisRelation} color="#e91e63" />
          <OptionGrid label="테마" options={THEMES} value={synopsisTheme} setter={setSynopsisTheme} color="#9c27b0" />
          <OptionGrid label="결말 톤" options={ENDINGS} value={synopsisEnding} setter={setSynopsisEnding} color="#00bcd4" />
        </div>

        {/* ─── Generate Button ─── */}
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", justifyContent: "center", gap: 10 }}>
          <button onClick={generateSynopsis} disabled={synopsisBeings.length === 0} style={{
            padding: "14px 36px", borderRadius: 28,
            border: `2px solid ${synopsisBeings.length > 0 ? theme.accent : "#333"}`,
            background: synopsisBeings.length > 0 ? `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)` : "#111",
            color: synopsisBeings.length > 0 ? theme.accent : "#555",
            cursor: synopsisBeings.length > 0 ? "pointer" : "not-allowed",
            fontSize: 16, fontWeight: 700, fontFamily: "'Crimson Text', serif",
            transition: "all 0.3s", opacity: synopsisBeings.length > 0 ? 1 : 0.5,
          }}>
            📖 시놉시스 생성
          </button>
          {synopsisResult && (
            <button onClick={resetSynopsis} style={{
              padding: "14px 20px", borderRadius: 28, border: "1px solid #444",
              background: "transparent", color: "#888", cursor: "pointer",
              fontSize: 13, fontFamily: "'Crimson Text', serif",
            }}>
              🔄 초기화
            </button>
          )}
        </div>
        {synopsisBeings.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.4, marginTop: -16, marginBottom: 16 }}>크리처를 최소 1개 선택해주세요</div>
        )}

        {/* ─── Result Synopsis Card ─── */}
        {synopsisResult && (
          <div style={{ background: "linear-gradient(145deg, #0f0f1a, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Title Header */}
            <div style={{ padding: "28px 28px 16px", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${theme.accent}15, transparent 60%)`, pointerEvents: "none" }} />
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff", position: "relative", marginBottom: 8 }}>{synopsisResult.title}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4, position: "relative" }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: theme.accent + "18", color: theme.accent }}>{synopsisResult.genre}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "#2196f318", color: "#2196f3" }}>{synopsisResult.era}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "#ff980018", color: "#ff9800" }}>결핍: {synopsisResult.lack}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "#e91e6318", color: "#e91e63" }}>관계: {synopsisResult.relation}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "#9c27b018", color: "#9c27b0" }}>{synopsisResult.theme}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "#00bcd418", color: "#00bcd4" }}>{synopsisResult.ending}</span>
              </div>
              {/* Being tags */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, position: "relative" }}>
                {synopsisResult.beings.map((b, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 10,
                    background: [theme.accent + "15", "#ff980015", "#9c27b015"][i],
                    border: `1px solid ${[theme.accent, "#ff9800", "#9c27b0"][i]}33`,
                    color: [theme.accent, "#ff9800", "#9c27b0"][i],
                  }}>
                    {getTypeIcon(b.t)} {b.n}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Acts */}
            <div style={{ padding: "0 28px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "1막 — 설정", text: synopsisResult.act1, color: "#4caf50", icon: "🌅" },
                { label: "2막 — 대립", text: synopsisResult.act2, color: "#ff9800", icon: "⚔️" },
                { label: "3막 — 해결", text: synopsisResult.act3, color: "#f44336", icon: "🌙" },
              ].map((act, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 14, background: act.color + "06", border: `1px solid ${act.color}20` }}>
                  <div style={{ fontSize: 11, color: act.color, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>
                    {act.icon} {act.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>{act.text}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ textAlign: "center", paddingBottom: 20, display: "flex", justifyContent: "center", gap: 8 }}>
              <button onClick={copyToClipboard} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${synopsisCopied ? "#4caf50" : theme.accent}66`,
                background: synopsisCopied ? "#4caf5015" : "transparent",
                color: synopsisCopied ? "#4caf50" : theme.accent,
                cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
              }}>
                {synopsisCopied ? "✓ 복사됨!" : "📋 시놉시스 복사"}
              </button>
              <button onClick={generateSynopsis} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🎲 다시 생성
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  ⚔ COMPARE PANEL — Side-by-side Creature Comparison
  // ═══════════════════════════════════════════════════════════════
  const ComparePanel = () => {
    const [compSearch, setCompSearch] = useState("");
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i, continent: CONTINENT_MAP[c.r] })));
      return arr;
    }, [DATA]);

    const searchedBeings = useMemo(() => {
      if (!compSearch) return allBeings.slice(0, 24);
      const q = compSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || b.t.toLowerCase().includes(q) || (b.ln && b.ln.toLowerCase().includes(q))).slice(0, 24);
    }, [allBeings, compSearch]);

    const addToCompare = (b) => {
      setCompareList(prev => {
        if (prev.length >= 4) return prev;
        if (prev.find(x => (x.being.id || x.being.n) === (b.id || b.n) && x.country === b.country)) return prev;
        return [...prev, { being: b, country: b.country, continent: b.continent }];
      });
    };

    const removeFromCompare = (idx) => {
      setCompareList(prev => prev.filter((_, i) => i !== idx));
    };

    // Build compare radar data
    const compareRadar = useMemo(() => {
      if (compareList.length < 2) return [];
      const metrics = ["공포도", "능력 수", "약점 수", "장르 수", "스토리훅 수"];
      return metrics.map(m => {
        const row = { metric: m };
        compareList.forEach((item, i) => {
          const b = item.being;
          if (m === "공포도") row[`c${i}`] = (b.f / 10) * 100;
          else if (m === "능력 수") row[`c${i}`] = b.ab ? Math.min((b.ab.filter(a=>a!=="불명").length / 5) * 100, 100) : 0;
          else if (m === "약점 수") row[`c${i}`] = b.wk ? Math.min((b.wk.filter(w=>w!=="없음(수호수 계열)"&&w!=="없음(절대적 존재)"&&w!=="불명"&&w!=="없음(현대 도시전설)"&&w!=="불명(통제 불능이 핵심)").length / 4) * 100, 100) : 0;
          else if (m === "장르 수") row[`c${i}`] = b.gf ? Math.min((b.gf.length / 4) * 100, 100) : 0;
          else if (m === "스토리훅 수") row[`c${i}`] = b.sh ? Math.min((b.sh.length / 4) * 100, 100) : 0;
        });
        return row;
      });
    }, [compareList]);

    const COMP_COLORS = ["#ff4466", "#44aaff", "#44ff88", "#ffaa44"];

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          ⚔ 크리처 비교 · VS Mode
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          최대 4개 존재를 선택하여 능력·약점·장르를 비교하세요
        </p>

        {/* Search & Add */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)}
            placeholder="존재 이름, 국가, 유형으로 검색..."
            style={{ width: "100%", maxWidth: 480, padding: "10px 16px", borderRadius: 24,
              border: `1px solid ${theme.accent}33`, background: "#0a0a0a", color: "#fff",
              fontSize: 13, fontFamily: "'Crimson Text', serif", outline: "none" }} />
        </div>

        {/* Being picker */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20, maxHeight: 160, overflow: "auto", padding: "4px 0" }}>
          {searchedBeings.map((b, i) => {
            const inList = compareList.find(x => (x.being.id || x.being.n) === (b.id || b.n) && x.country === b.country);
            return (
              <span key={`${b.id||b.n}-${b.country}-${i}`} onClick={() => inList ? removeFromCompare(compareList.indexOf(inList)) : addToCompare(b)}
                style={{
                  padding: "5px 11px", borderRadius: 14, fontSize: 11, cursor: "pointer", transition: "all 0.2s",
                  background: inList ? theme.accent + "22" : "#111",
                  border: `1px solid ${inList ? theme.accent : "#282828"}`,
                  color: inList ? theme.accent : "#888",
                }}>
                {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                {b.f >= 8 && <span style={{ marginLeft: 3, fontSize: 9 }}>{"🔥".repeat(Math.min(b.f - 7, 3))}</span>}
              </span>
            );
          })}
        </div>

        {/* Selected slots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {[0,1,2,3].map(i => {
            const item = compareList[i];
            return (
              <div key={i} style={{
                width: 160, height: 48, borderRadius: 12,
                border: `2px dashed ${item ? COMP_COLORS[i] : "#333"}`,
                background: item ? COMP_COLORS[i] + "10" : "#0a0a0a",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, fontSize: 12, color: item ? COMP_COLORS[i] : "#444",
                transition: "all 0.3s", cursor: item ? "pointer" : "default",
              }} onClick={() => item && removeFromCompare(i)}>
                {item ? (
                  <>
                    {getCreatureImage(item.being.id) ? <img src={getCreatureImage(item.being.id)} alt={item.being.n} style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 6 }} /> : <Portrait name={item.being.n} type={item.being.t} color={COMP_COLORS[i]} size={28} />}
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{item.being.n.split("(")[0].trim()}</div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>{item.country} · ✕제거</div>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 18 }}>+</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison content */}
        {compareList.length >= 2 && (
          <div>
            {/* VS Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.1em",
                background: `linear-gradient(90deg, ${COMP_COLORS[0]}, ${COMP_COLORS[1]}${compareList.length > 2 ? `, ${COMP_COLORS[2]}` : ""}${compareList.length > 3 ? `, ${COMP_COLORS[3]}` : ""})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {compareList.map((x, i) => x.being.n.split("(")[0].trim()).join(" vs ")}
              </div>
            </div>

            {/* Radar Chart */}
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto 32px", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={compareRadar} cx="50%" cy="50%" outerRadius="68%">
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  {compareList.map((_, i) => (
                    <Radar key={i} name={compareList[i].being.n.split("(")[0].trim()} dataKey={`c${i}`}
                      stroke={COMP_COLORS[i]} fill={COMP_COLORS[i]} fillOpacity={0.15} strokeWidth={2.5} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail comparison cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(compareList.length, 4)}, 1fr)`, gap: 12 }}>
              {compareList.map((item, i) => {
                const b = item.being;
                const cTheme = CONTINENT_COLORS[item.continent] || CONTINENT_COLORS.Asia;
                return (
                  <div key={i} style={{
                    background: `linear-gradient(145deg, ${COMP_COLORS[i]}08, #0a0a0a)`,
                    border: `1px solid ${COMP_COLORS[i]}44`,
                    borderRadius: 16, padding: 16, position: "relative", overflow: "hidden",
                  }}>
                    {/* Accent top */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: COMP_COLORS[i] }} />

                    {/* Portrait */}
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <div style={{ display: "inline-block", background: COMP_COLORS[i] + "15", borderRadius: 16, padding: 8, overflow: "hidden" }}>
                        {getCreatureImage(b.id) ? <img src={getCreatureImage(b.id)} alt={b.n} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 12 }} /> : <Portrait name={b.n} type={b.t} color={COMP_COLORS[i]} size={56} glow={b.f >= 7} />}
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COMP_COLORS[i] }}>{b.n}</div>
                      {b.ln && <div style={{ fontSize: 11, opacity: 0.5 }}>{b.ln}</div>}
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{item.country} · {b.t}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 6 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: j <= b.f ? (b.f >= 8 ? "#ff3b3b" : COMP_COLORS[i]) : "#333", boxShadow: j <= b.f && b.f >= 9 ? "0 0 6px #ff3b3b" : "none" }} />)}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.5, marginBottom: 10, textAlign: "center" }}>{b.d}</div>

                    {/* Attributes */}
                    {b.ab && b.ab.length > 0 && b.ab[0] !== "불명" && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>⚔️ 능력</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.ab.filter(a=>a!=="불명").map((a,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: COMP_COLORS[i]+"15", color: COMP_COLORS[i], border: `1px solid ${COMP_COLORS[i]}25` }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    {b.wk && b.wk.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🛡️ 약점</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.wk.map((w,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#ff980015", color: "#ff9800", border: "1px solid #ff980025" }}>{w}</span>)}
                        </div>
                      </div>
                    )}
                    {b.gf && b.gf.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🎬 장르</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.gf.map((g,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#2196f315", color: "#2196f3", border: "1px solid #2196f325" }}>{g}</span>)}
                        </div>
                      </div>
                    )}
                    {b.sh && b.sh.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📖 스토리훅</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.sh.map((s,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#00bcd415", color: "#00bcd4", border: "1px solid #00bcd425" }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {b.ip && <div style={{ textAlign: "center", marginTop: 8 }}><span style={{ fontSize: 9, background: "#4caf5025", color: "#4caf50", padding: "2px 8px", borderRadius: 6 }}>✅ IP Ready</span></div>}
                  </div>
                );
              })}
            </div>

            {/* Shared traits analysis */}
            {compareList.length >= 2 && (() => {
              const allAb = compareList.map(x => new Set(x.being.ab?.filter(a=>a!=="불명") || []));
              const allGf = compareList.map(x => new Set(x.being.gf || []));
              const allSh = compareList.map(x => new Set(x.being.sh || []));
              const sharedAb = [...allAb[0]].filter(a => allAb.every(s => s.has(a)));
              const sharedGf = [...allGf[0]].filter(g => allGf.every(s => s.has(g)));
              const sharedSh = [...allSh[0]].filter(s => allSh.every(set => set.has(s)));
              const hasShared = sharedAb.length > 0 || sharedGf.length > 0 || sharedSh.length > 0;
              if (!hasShared) return null;
              return (
                <div style={{ marginTop: 24, padding: 20, background: "#ffffff04", border: "1px solid #ffffff12", borderRadius: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 12 }}>
                    🔗 공통 특성
                  </div>
                  {sharedAb.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 능력: </span>
                      {sharedAb.map((a,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: theme.accent + "18", color: theme.accent, margin: "0 3px" }}>{a}</span>)}
                    </div>
                  )}
                  {sharedGf.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 장르: </span>
                      {sharedGf.map((g,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#2196f318", color: "#2196f3", margin: "0 3px" }}>{g}</span>)}
                    </div>
                  )}
                  {sharedSh.length > 0 && (
                    <div>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 스토리훅: </span>
                      {sharedSh.map((s,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#00bcd418", color: "#00bcd4", margin: "0 3px" }}>{s}</span>)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {compareList.length < 2 && (
          <div style={{ textAlign: "center", padding: 48, opacity: 0.3 }}>
            <div style={{ fontSize: 56 }}>⚔</div>
            <div style={{ marginTop: 12, fontSize: 14 }}>위에서 2개 이상의 존재를 선택하면 비교 분석이 표시됩니다</div>
          </div>
        )}
      </div>
    );
  };

  // ── Random Encounter Overlay ──
  const RandomEncounterOverlay = () => {
    if (!encounter) return null;
    const cont = CONTINENT_MAP[encounter.country.r];
    const cTheme = CONTINENT_COLORS[cont];
    return (
      <div style={{ ...styles.modal, zIndex: 120 }} onClick={() => setEncounter(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: `linear-gradient(145deg, ${cTheme.card}, #000)`,
          border: `1px solid ${cTheme.accent}66`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          opacity: encounterAnim ? 0 : 1,
          transform: encounterAnim ? "scale(0.8) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          {/* Dramatic background glow */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${cTheme.accent}20, transparent 60%)`, pointerEvents: "none" }} />
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: cTheme.accent, marginBottom: 16, position: "relative" }}>
            ⚡ 랜덤 조우 ⚡
          </div>
          <div style={{ position: "relative", marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${cTheme.accent}15, transparent 65%)`, animation: "fearPulse 2.5s ease-in-out infinite" }} />
            {getCreatureImage(encounter.being.id) ? (
              <div style={{ width: 110, height: 110, borderRadius: "50%", overflow: "hidden", border: `3px solid ${cTheme.accent}66`, boxShadow: `0 0 30px ${cTheme.accent}33` }}>
                <img src={getCreatureImage(encounter.being.id)} alt={encounter.being.n} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Portrait name={encounter.being.n} type={encounter.being.t} color={cTheme.accent} size={110} glow={true} animate={true} />
            )}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", position: "relative", marginBottom: 4 }}>
            {encounter.being.n}
          </h2>
          <div style={{ fontSize: 13, color: cTheme.accent, marginBottom: 4 }}>{encounter.being.t}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
            {CONTINENT_EMOJI[cont]} {encounter.country.c} · {encounter.country.r}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 16 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i <= encounter.being.f ? (encounter.being.f >= 9 ? "#ff2222" : "#ff6633") : "#333", boxShadow: i <= encounter.being.f && encounter.being.f >= 9 ? "0 0 6px #ff3b3b" : "none", transition: "all 0.3s" }} />
            ))}
            <span style={{ fontSize: 11, marginLeft: 6, color: "#ff3b3b" }}>{FEAR_LABELS[encounter.being.f]}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, position: "relative", marginBottom: 12 }}>
            {encounter.being.d}
          </p>
          {/* Extra GFS fields in encounter */}
          {(encounter.being.ab || encounter.being.gf) && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4, marginBottom: 16 }}>
              {encounter.being.ab && encounter.being.ab.map((a,i) => (
                <span key={`a${i}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: cTheme.accent + "18", color: cTheme.accent, border: `1px solid ${cTheme.accent}30` }}>⚔️ {a}</span>
              ))}
              {encounter.being.gf && encounter.being.gf.map((g,i) => (
                <span key={`g${i}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "#2196f318", color: "#64b5f6", border: "1px solid #2196f330" }}>🎬 {g}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={triggerRandomEncounter} style={{
              padding: "10px 20px", borderRadius: 24, border: `1px solid ${cTheme.accent}`, background: cTheme.accent + "22",
              color: cTheme.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", fontWeight: 600
            }}>
              🎲 다시 뽑기
            </button>
            <button onClick={() => { setEncounter(null); handleCountryClick(encounter.country); }} style={{
              padding: "10px 20px", borderRadius: 24, border: "1px solid #444", background: "transparent",
              color: "#aaa", cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif"
            }}>
              📖 국가 보기
            </button>
            <button onClick={() => { setEncounter(null); openProfile(encounter.being, encounter.country); }} style={{
              padding: "10px 20px", borderRadius: 24, border: `1px solid ${cTheme.accent}88`, background: `${cTheme.accent}11`,
              color: cTheme.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", fontWeight: 600
            }}>
              🔍 프로필
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Open creature fullscreen profile
  const openProfile = useCallback((being, country) => {
    setProfileBeing(being);
    setProfileCountry(country);
    setProfileAnim(true);
    setTimeout(() => setProfileAnim(false), 50);
  }, []);

  // ─── Deep-link: ?creature=kr-gumiho → auto-open profile ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const creatureId = params.get("creature");
    if (!creatureId) return;
    for (const country of FOLKLORE_DATA) {
      const found = country.b.find(b => b.id === creatureId);
      if (found) {
        openProfile(found, country);
        break;
      }
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cinematic Fullscreen Creature Profile ──
  const CreatureProfile = () => {
    if (!profileBeing) return null;
    const b = profileBeing;
    const country = profileCountry;
    const cont = CONTINENT_MAP[country?.r] || "Asia";
    const cTheme = CONTINENT_COLORS[cont];
    const c = cTheme.accent;
    const [section, setSection] = useState("lore");
    const [particleSeed] = useState(() => Array.from({length:24}, (_,i) => ({
      x: Math.random()*100, y: Math.random()*100, s: 0.5+Math.random()*2, d: 2+Math.random()*6, o: 0.1+Math.random()*0.4
    })));
    // Find related beings (same type or shared abilities)
    const related = useMemo(() => {
      const arr = [];
      DATA.forEach(co => co.b.forEach(be => {
        if (be.n === b.n && co.c === country?.c) return;
        const sameType = be.t === b.t;
        const sharedAb = b.ab && be.ab && b.ab.some(a => a !== "불명" && be.ab.includes(a));
        if (sameType || sharedAb) arr.push({ ...be, country: co.c, iso: co.i, region: co.r });
      }));
      return arr.slice(0, 8);
    }, [b, country, DATA]);
    
    const sections = [
      { id: "lore", label: "📜 전승", icon: "📜" },
      { id: "combat", label: "⚔ 전투", icon: "⚔" },
      { id: "visual", label: "👁 외형", icon: "👁" },
      { id: "story", label: "📖 IP", icon: "📖" },
      { id: "related", label: "🔗 유사", icon: "🔗" },
    ];

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#000",
        overflow: "auto",
        opacity: profileAnim ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}>
        {/* Particle field */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {particleSeed.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s,
              borderRadius: "50%",
              background: c,
              opacity: p.o,
              animation: `profileFloat ${p.d}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>

        {/* Giant atmospheric gradient */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(ellipse at 50% 20%, ${c}18, transparent 55%), radial-gradient(ellipse at 80% 80%, ${c}08, transparent 40%)`,
        }} />

        {/* Close button */}
        <button onClick={() => setProfileBeing(null)} style={{
          position: "fixed", top: 20, right: 20, zIndex: 210,
          background: "#00000088", backdropFilter: "blur(12px)",
          border: `1px solid ${c}44`, borderRadius: 12,
          color: "#fff", fontSize: 14, padding: "8px 16px",
          cursor: "pointer", fontFamily: "'Crimson Text', serif",
          transition: "all 0.3s",
        }}>
          ✕ 닫기
        </button>

        {/* Hero Section */}
        <div style={{
          position: "relative", minHeight: "70vh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 24px 40px",
          background: `linear-gradient(180deg, #000 0%, ${c}06 40%, ${c}03 70%, #000 100%)`,
        }}>
          {/* Concentric rings */}
          {[120, 180, 260].map((r, i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              width: r * 2, height: r * 2,
              transform: "translate(-50%, -55%)",
              border: `1px solid ${c}${["15","0a","06"][i]}`,
              borderRadius: "50%",
              animation: `profileRing ${6 + i * 2}s linear infinite`,
            }} />
          ))}

          {/* Main portrait - LARGE */}
          <div style={{
            position: "relative", marginBottom: 32,
            animation: "profilePortraitEnter 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
            <div style={{
              position: "absolute", inset: -30,
              background: `radial-gradient(circle, ${c}25, transparent 65%)`,
              borderRadius: "50%",
              animation: "fearPulse 3s ease-in-out infinite",
            }} />
            {getCreatureImage(b.id) ? (
              <div style={{
                width: 160, height: 160, borderRadius: "50%", overflow: "hidden",
                border: `3px solid ${c}66`,
                boxShadow: `0 0 40px ${c}33, 0 0 80px ${c}15`,
              }}>
                <img src={getCreatureImage(b.id)} alt={b.n}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Portrait name={b.n} type={b.t} color={c} size={160} glow={true} animate={true} />
            )}
          </div>

          {/* Fear level bar */}
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginBottom: 20, animation: "profileFadeUp 0.6s 0.3s both" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{
                width: 8, height: i <= b.f ? 8 + i * 1.2 : 8, borderRadius: 2,
                background: i <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : c) : "#222",
                boxShadow: i <= b.f ? `0 0 8px ${b.f >= 9 ? "#ff3b3b88" : b.f >= 7 ? "#ff663388" : c + "66"}` : "none",
                transition: "all 0.3s",
                animation: i <= b.f ? `fearDotPulse 2s ease-in-out infinite` : "none",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
            <span style={{ fontSize: 14, color: b.f >= 9 ? "#ff3b3b" : b.f >= 7 ? "#ff6633" : c, fontWeight: 700, marginLeft: 6 }}>
              {b.f}/10 {FEAR_LABELS[b.f]}
            </span>
          </div>

          {/* Name */}
          <h1 style={{
            fontSize: "clamp(32px, 7vw, 56px)", fontWeight: 700,
            background: `linear-gradient(135deg, #fff, ${c}, #fff)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textAlign: "center", lineHeight: 1.1, marginBottom: 8,
            fontFamily: "'Crimson Text', serif", letterSpacing: "0.04em",
            animation: "profileFadeUp 0.6s 0.2s both",
          }}>
            {b.n}
          </h1>

          {b.ln && (
            <div style={{ fontSize: 18, opacity: 0.4, marginBottom: 8, fontFamily: "'Crimson Text', serif", animation: "profileFadeUp 0.6s 0.35s both" }}>
              {b.ln}
            </div>
          )}

          {/* Type + Country badge */}
          <div style={{
            display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
            animation: "profileFadeUp 0.6s 0.4s both",
          }}>
            <span style={{
              padding: "6px 16px", borderRadius: 20,
              background: `${c}18`, border: `1px solid ${c}44`,
              color: c, fontSize: 13, fontWeight: 600,
              fontFamily: "'Crimson Text', serif",
            }}>
              {getTypeIcon(b.t)} {b.t}
            </span>
            {b.ct && <span style={{
              padding: "6px 14px", borderRadius: 20,
              background: (CT_COLORS[b.ct] || "#888") + "15", border: `1px solid ${(CT_COLORS[b.ct] || "#888")}44`,
              color: CT_COLORS[b.ct] || "#888", fontSize: 13, fontWeight: 600,
              fontFamily: "'Crimson Text', serif",
            }}>
              {CT_ICONS[b.ct]} {CT_LABELS[b.ct]}
            </span>}
            <span style={{
              padding: "6px 16px", borderRadius: 20,
              background: "#ffffff08", border: "1px solid #ffffff18",
              color: "#aaa", fontSize: 13,
              fontFamily: "'Crimson Text', serif",
            }}>
              {CONTINENT_EMOJI[cont]} {country?.c} · {country?.r}
            </span>
            {b.ip && (
              <span style={{
                padding: "6px 12px", borderRadius: 20,
                background: "#4caf5018", border: "1px solid #4caf5044",
                color: "#4caf50", fontSize: 11, fontWeight: 600,
              }}>
                ✅ IP Ready
              </span>
            )}
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            animation: "profileBounce 2s ease-in-out infinite",
            opacity: 0.3, fontSize: 20,
          }}>
            ▾
          </div>
        </div>

        {/* Section Navigation */}
        <div style={{
          position: "sticky", top: 0, zIndex: 205,
          display: "flex", justifyContent: "center", gap: 6, padding: "12px 16px",
          background: "linear-gradient(180deg, #000000ee 60%, #00000000 100%)",
          backdropFilter: "blur(16px)",
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding: "8px 16px", borderRadius: 20,
              border: `1px solid ${section === s.id ? c : "#333"}`,
              background: section === s.id ? `${c}22` : "transparent",
              color: section === s.id ? c : "#666",
              cursor: "pointer", fontSize: 12, fontWeight: section === s.id ? 700 : 400,
              fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px", position: "relative", zIndex: 1 }}>

          {/* LORE SECTION */}
          {section === "lore" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              <div style={{
                padding: 28, borderRadius: 20,
                background: `linear-gradient(145deg, ${c}08, #0a0a0a)`,
                border: `1px solid ${c}22`,
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 11, color: c, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>전승 기록</div>
                <p style={{ fontSize: 17, lineHeight: 1.8, color: "#ddd", fontFamily: "'Crimson Text', serif" }}>
                  {b.d}
                </p>
              </div>

              {b.src && b.src.length > 0 && (
                <div style={{ padding: 20, borderRadius: 16, background: "#ffffff04", border: "1px solid #ffffff0a", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.15em", marginBottom: 8 }}>📚 출처</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {b.src.map((s, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 12, background: "#ffffff08",
                        border: "1px solid #ffffff15", color: "#ccc", fontSize: 13,
                        fontFamily: "'Crimson Text', serif", fontStyle: "italic",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMBAT SECTION */}
          {section === "combat" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {b.ab && b.ab.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: c, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚔️</span> 능력
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {b.ab.map((a, i) => (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 14,
                        background: `linear-gradient(135deg, ${c}12, ${c}06)`,
                        border: `1px solid ${c}25`,
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c }}>{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.wk && b.wk.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#ff9800", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🛡️</span> 약점
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {b.wk.map((w, i) => (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 14,
                        background: "linear-gradient(135deg, #ff980012, #ff980006)",
                        border: "1px solid #ff980025",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#ff9800" }}>{w}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fear analysis */}
              <div style={{
                padding: 24, borderRadius: 16,
                background: b.f >= 7 ? "linear-gradient(135deg, #ff3b3b08, #0a0a0a)" : "#ffffff04",
                border: `1px solid ${b.f >= 7 ? "#ff3b3b22" : "#ffffff0a"}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.f >= 7 ? "#ff3b3b" : "#888", marginBottom: 12 }}>
                  🌡 공포 등급 분석
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} style={{
                        width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                        background: i <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : c) : "#1a1a1a",
                        color: i <= b.f ? "#fff" : "#444", fontSize: 9, fontWeight: 700,
                        boxShadow: i <= b.f && b.f >= 9 ? "0 0 8px #ff3b3b44" : "none",
                      }}>
                        {i}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: b.f >= 9 ? "#ff3b3b" : b.f >= 7 ? "#ff6633" : c }}>{FEAR_LABELS[b.f]}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>10단계 중 {b.f}단계</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISUAL SECTION */}
          {section === "visual" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {/* Large portrait showcase */}
              <div style={{
                display: "flex", justifyContent: "center", marginBottom: 32,
                padding: 40, borderRadius: 20,
                background: `radial-gradient(circle at 50% 50%, ${c}12, transparent 60%)`,
                border: `1px solid ${c}15`,
              }}>
                {getCreatureImage(b.id) ? (
                  <div style={{
                    width: 280, height: 280, borderRadius: 20, overflow: "hidden",
                    border: `2px solid ${c}44`,
                    boxShadow: `0 0 60px ${c}22, 0 8px 32px rgba(0,0,0,0.5)`,
                  }}>
                    <img src={getCreatureImage(b.id)} alt={b.n}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <Portrait name={b.n} type={b.t} color={c} size={200} glow={true} animate={true} />
                )}
              </div>

              {b.vk && b.vk.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: "#9c27b0", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>👁</span> 외형 키워드
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {b.vk.map((v, i) => (
                      <div key={i} style={{
                        padding: "12px 20px", borderRadius: 16,
                        background: "linear-gradient(135deg, #9c27b010, #9c27b005)",
                        border: "1px solid #9c27b025",
                        fontSize: 14, color: "#ce93d8", fontWeight: 500,
                        fontFamily: "'Crimson Text', serif",
                      }}>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!b.vk || b.vk.length === 0) && (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👁</div>
                  <div>외형 키워드가 기록되지 않았습니다</div>
                </div>
              )}
            </div>
          )}

          {/* STORY/IP SECTION */}
          {section === "story" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {b.gf && b.gf.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#2196f3", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎬</span> 적합 장르
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {b.gf.map((g, i) => (
                      <div key={i} style={{
                        padding: "12px 20px", borderRadius: 16,
                        background: "linear-gradient(135deg, #2196f310, #2196f305)",
                        border: "1px solid #2196f325",
                        fontSize: 14, color: "#64b5f6", fontWeight: 500,
                      }}>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.sh && b.sh.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#00bcd4", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📖</span> 스토리 훅
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {b.sh.map((s, i) => (
                      <div key={i} style={{
                        padding: "16px 20px", borderRadius: 14,
                        background: "linear-gradient(135deg, #00bcd408, #0a0a0a)",
                        border: "1px solid #00bcd420",
                        borderLeft: `3px solid #00bcd4`,
                      }}>
                        <div style={{ fontSize: 14, color: "#80deea", fontFamily: "'Crimson Text', serif" }}>
                          「{s}」
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.ip && (
                <div style={{
                  padding: 24, borderRadius: 16,
                  background: "linear-gradient(135deg, #4caf5008, #0a0a0a)",
                  border: "1px solid #4caf5022",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#4caf50", marginBottom: 4 }}>IP 개발 적합</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>이 존재는 게임, 웹툰, 영상 등 IP 개발에 적합한 요소를 갖추고 있습니다</div>
                </div>
              )}
            </div>
          )}

          {/* RELATED SECTION */}
          {section === "related" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              <div style={{ fontSize: 13, color: c, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>
                🔗 유사 존재 ({related.length}개)
              </div>
              {related.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {related.map((r, i) => {
                    const rCont = CONTINENT_MAP[r.region];
                    const rC = CONTINENT_COLORS[rCont]?.accent || "#888";
                    return (
                      <div key={i} onClick={() => {
                        const cData = DATA.find(co => co.c === r.country);
                        if (cData) openProfile(r, cData);
                      }} style={{
                        padding: 16, borderRadius: 14,
                        background: "#ffffff04", border: "1px solid #ffffff0a",
                        cursor: "pointer", transition: "all 0.3s",
                        display: "flex", gap: 12, alignItems: "center",
                      }}>
                        <div style={{ background: rC + "12", borderRadius: 10, padding: 4, flexShrink: 0, overflow: "hidden" }}>
                          {getCreatureImage(r.id) ? <img src={getCreatureImage(r.id)} alt={r.n} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} /> : <Portrait name={r.n} type={r.t} color={rC} size={40} glow={r.f >= 4} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>{r.n}</div>
                          <div style={{ fontSize: 11, color: rC }}>{r.t}</div>
                          <div style={{ fontSize: 11, opacity: 0.4 }}>{CONTINENT_EMOJI[rCont]} {r.country}</div>
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5,6,7,8,9,10].map(j => (
                            <div key={j} style={{ width: 3, height: 3, borderRadius: 1, background: j <= r.f ? (r.f >= 9 ? "#ff2222" : "#ff6633") : "#333" }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                  <div>유사 존재를 찾을 수 없습니다</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal (country view)
  const Modal = () => {
    if (!selectedCountry) return null;
    const continent = CONTINENT_MAP[selectedCountry.r];
    const cTheme = CONTINENT_COLORS[continent] || CONTINENT_COLORS.Asia;

    return (
      <div style={styles.modal} onClick={() => setSelectedCountry(null)}>
        <div style={styles.modalContent(cTheme)} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeBtn} onClick={() => setSelectedCountry(null)}>✕</button>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: cTheme.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {selectedCountry.r}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0", color: "#fff" }}>
              {CONTINENT_EMOJI[continent]} {selectedCountry.c}
            </h2>
            <div style={{ fontSize: 12, opacity: 0.4 }}>
              {selectedCountry.b.length}개 신화 속 존재 수록 · 클릭하여 상세 프로필 보기
            </div>
          </div>

          {selectedCountry.b.map((being, i) => (
            <div key={i} onClick={() => { setSelectedCountry(null); openProfile(being, selectedCountry); }}
              style={{ cursor: "pointer", transition: "all 0.2s", borderRadius: 12, margin: "0 -8px", padding: "0 8px" }}
              onMouseEnter={e => e.currentTarget.style.background = `${cTheme.accent}08`}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <BeingDetail being={being} color={cTheme.accent} country={selectedCountry.c} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.app}>
      {/* Atmospheric background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${theme.glow}, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Update banner */}
      <div style={{
        textAlign: "center", padding: "6px 16px",
        background: theme.accent + "12", borderBottom: `1px solid ${theme.accent}22`,
        fontSize: 12, color: theme.accent,
      }}>
        🆕 마지막 업데이트: {new Date(LAST_UPDATED).toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hour12: false,
        })} · 총 {FOLKLORE_DATA.reduce((a, c) => a + c.b.length, 0)}종
      </div>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>세계 민담 도감</h1>
        <div style={styles.subtitle}>전 세계 민담과 신화 속 존재들을 탐험하세요</div>
        <div style={styles.stats}>
          <span>{filtered.length}개국</span>
          <span>·</span>
          <span>{totalBeings}개 존재</span>
          <span>·</span>
          <span>{Object.keys(CONTINENT_MAP).length}개 지역</span>
        </div>
        <a
          href="/ko/creatures"
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "8px 20px",
            borderRadius: 20,
            background: theme.accent + "18",
            color: theme.accent,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            border: `1px solid ${theme.accent}33`,
          }}
        >
          📖 크리처 도감 보기
        </a>
      </header>

      {/* Continent nav */}
      <nav style={styles.continentNav}>
        {continents.map((c) => {
          const color = c === "All" ? theme.accent : CONTINENT_COLORS[c]?.accent;
          return (
            <button
              key={c}
              style={styles.continentBtn(activeContinent === c, color)}
              onClick={() => setActiveContinent(c)}
            >
              {c !== "All" && CONTINENT_EMOJI[c]} {c}
            </button>
          );
        })}
      </nav>

      {/* Search */}
      <div style={styles.searchBar}>
        <input
          style={styles.searchInput(theme.accent)}
          placeholder="국가, 존재, 유형으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "4px 16px 8px", flexWrap: "wrap", zIndex: 10, position: "relative" }}>
        {[
          { id: "explore", label: "🗺 탐험" },
          { id: "stats", label: "📊 통계" },
          { id: "ranking", label: "🏆 랭킹" },
          { id: "featured", label: "🎴 특집" },
          ...(compareList.length > 0 ? [{ id: "compare", label: `⚔ 비교 (${compareList.length})` }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "6px 14px", borderRadius: 16,
            border: `1px solid ${activeTab === tab.id ? theme.accent : "#333"}`,
            background: activeTab === tab.id ? theme.accent + "22" : "transparent",
            color: activeTab === tab.id ? theme.accent : "#666",
            cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
            fontWeight: activeTab === tab.id ? 700 : 400, transition: "all 0.3s",
          }}>
            {tab.label}
          </button>
        ))}

        {/* 창작 도구 드롭다운 */}
        <div ref={creativeMenuRef} style={{ position: "relative", zIndex: 200 }}>
          <button onClick={() => setShowCreativeMenu(!showCreativeMenu)} style={{
            padding: "6px 14px", borderRadius: 16,
            border: `1px solid ${["scenario","character","webtoon","builder","synopsis"].includes(activeTab) ? theme.accent : "#333"}`,
            background: ["scenario","character","webtoon","builder","synopsis"].includes(activeTab) ? theme.accent + "22" : "transparent",
            color: ["scenario","character","webtoon","builder","synopsis"].includes(activeTab) ? theme.accent : "#666",
            cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
            fontWeight: ["scenario","character","webtoon","builder","synopsis"].includes(activeTab) ? 700 : 400, transition: "all 0.3s",
          }}>
            🎨 창작 도구 ▾
          </button>
          {showCreativeMenu && (
            <div style={{
              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
              marginTop: 6, background: "#1a1a2e", border: "1px solid #333", borderRadius: 12,
              padding: 6, zIndex: 300, minWidth: 140,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}>
              {[
                { id: "scenario", label: "🎬 시나리오" },
                { id: "character", label: "🧙 캐릭터" },
                { id: "webtoon", label: "📱 웹툰 IP" },
                { id: "builder", label: "🛠 빌더" },
                { id: "synopsis", label: "📖 시놉시스" },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowCreativeMenu(false); }} style={{
                  display: "block", width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "none", textAlign: "left",
                  background: activeTab === tab.id ? theme.accent + "22" : "transparent",
                  color: activeTab === tab.id ? theme.accent : "#999",
                  cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
                  fontWeight: activeTab === tab.id ? 700 : 400,
                }}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={triggerRandomEncounter} style={{
          padding: "6px 14px", borderRadius: 16,
          border: "1px solid #ff444488",
          background: "#ff444418",
          color: "#ff6666",
          cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
          fontWeight: 700, transition: "all 0.3s",
          animation: "pulse 2s infinite",
        }}>
          🎲 랜덤 조우
        </button>

        <a href="/ko/community" style={{
          padding: "6px 14px", borderRadius: 16,
          border: "1px solid #cc884488",
          background: "#cc884418",
          color: "#cc8844",
          textDecoration: "none", fontSize: 12, fontFamily: "'Crimson Text', serif",
          fontWeight: 700, transition: "all 0.3s",
        }}>
          ☕ 창작 카페
        </a>
      </div>

      {/* Sub filter (only on explore tab) */}
      {activeTab === "explore" && (
      <div style={styles.filterRow}>
        <button
          style={styles.filterBtn(viewMode === "map", theme.accent)}
          onClick={() => setViewMode(viewMode === "map" ? "grid" : "map")}
        >
          {viewMode === "map" ? "⊞ 그리드" : "🗺 지도"}
        </button>
        {viewMode === "map" && (
          <>
            <span style={{ color: "#333", fontSize: 11, padding: "0 2px" }}>│</span>
            <button
              style={styles.filterBtn(heatmapMode === "fear", heatmapMode === "fear" ? "#ff8844" : theme.accent)}
              onClick={() => setHeatmapMode("fear")}
            >
              🌡 공포도
            </button>
          </>
        )}
        <span style={{ color: "#333", fontSize: 11, padding: "0 2px" }}>│</span>
        <button
          style={{
            ...styles.filterBtn(showAdvFilters || activeFilterCount > 0, activeFilterCount > 0 ? "#ff8844" : theme.accent),
            position: "relative",
          }}
          onClick={() => setShowAdvFilters(!showAdvFilters)}
        >
          🔬 필터{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>
      )}

      {/* Advanced Filters Panel */}
      {activeTab === "explore" && showAdvFilters && (
        <div style={{
          maxWidth: 900, margin: "0 auto 12px", padding: "16px 20px",
          background: "linear-gradient(145deg, #111108, #0a0a0a)",
          border: `1px solid ${theme.accent}22`, borderRadius: 16,
          position: "relative", zIndex: 2,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>🔬 고급 필터</div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setAbilityFilter(null); setGenreFilter(null); setTypeFilter(null); setVisualFilter(null); setIpFilter(false); }}
                style={{ padding: "3px 10px", borderRadius: 10, border: "1px solid #ff444444", background: "#ff444412", color: "#ff6666", cursor: "pointer", fontSize: 11, fontFamily: "'Crimson Text', serif" }}>
                ✕ 초기화
              </button>
            )}
          </div>

          {/* Type filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>🏷 유형 (Type)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.types.map(([t, cnt]) => (
                <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${typeFilter === t ? "#ff8844" : "#222"}`,
                    background: typeFilter === t ? "#ff884418" : "#0e0e0e",
                    color: typeFilter === t ? "#ff8844" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {getTypeIcon(t)} {t} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ability filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>⚔️ 능력 (Ability)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.abilities.map(([a, cnt]) => (
                <button key={a} onClick={() => setAbilityFilter(abilityFilter === a ? null : a)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${abilityFilter === a ? "#e91e63" : "#222"}`,
                    background: abilityFilter === a ? "#e91e6318" : "#0e0e0e",
                    color: abilityFilter === a ? "#e91e63" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {a} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>🎬 장르 (Genre)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.genres.map(([g, cnt]) => (
                <button key={g} onClick={() => setGenreFilter(genreFilter === g ? null : g)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${genreFilter === g ? "#2196f3" : "#222"}`,
                    background: genreFilter === g ? "#2196f318" : "#0e0e0e",
                    color: genreFilter === g ? "#2196f3" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {g} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual tag filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>👁 외형 태그 (Visual)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.visuals.map(([v, cnt]) => (
                <button key={v} onClick={() => setVisualFilter(visualFilter === v ? null : v)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${visualFilter === v ? "#9c27b0" : "#222"}`,
                    background: visualFilter === v ? "#9c27b018" : "#0e0e0e",
                    color: visualFilter === v ? "#9c27b0" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {v} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* IP Ready filter */}
          <div>
            <button onClick={() => setIpFilter(!ipFilter)}
              style={{
                padding: "5px 14px", borderRadius: 12, fontSize: 11, cursor: "pointer",
                border: `1px solid ${ipFilter ? "#4caf50" : "#222"}`,
                background: ipFilter ? "#4caf5018" : "#0e0e0e",
                color: ipFilter ? "#4caf50" : "#777",
                fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
              }}>
              ✅ IP Ready만 보기
            </button>
          </div>

          {/* Active filter summary */}
          {activeFilterCount > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#ffffff06", borderRadius: 10, fontSize: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ opacity: 0.5, fontSize: 11 }}>활성 필터:</span>
              {typeFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#ff884415", color: "#ff8844", fontSize: 10 }}>유형: {typeFilter} ✕</span>}
              {abilityFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#e91e6315", color: "#e91e63", fontSize: 10 }}>능력: {abilityFilter} ✕</span>}
              {genreFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#2196f315", color: "#2196f3", fontSize: 10 }}>장르: {genreFilter} ✕</span>}
              {visualFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#9c27b015", color: "#9c27b0", fontSize: 10 }}>외형: {visualFilter} ✕</span>}
              {ipFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#4caf5015", color: "#4caf50", fontSize: 10 }}>IP Ready ✕</span>}
              <span style={{ opacity: 0.4, fontSize: 11, marginLeft: 6 }}>→ {filtered.length}개국 / {totalBeings}개 존재</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "explore" && (
        <>
      {/* Map or Grid */}
      {viewMode === "map" && <WorldMap />}

      <div style={styles.grid}>
        {filtered.map((country) => (
          <CountryCard key={country.i} country={country} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.4 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ marginTop: 12 }}>검색 결과가 없습니다</div>
        </div>
      )}
        </>
      )}

      {activeTab === "stats" && <StatsPanel />}
      {activeTab === "ranking" && <RankingPanel />}
      {activeTab === "featured" && <FeaturedCards />}
      {activeTab === "compare" && <ComparePanel />}
      {activeTab === "scenario" && <ScenarioGenerator />}
      {activeTab === "character" && <CharacterBuilder />}
      {activeTab === "webtoon" && <WebtoonIPDev />}
      {activeTab === "builder" && <CreatureCharBuilder />}
      {activeTab === "synopsis" && <SynopsisGenerator />}

      {/* Modal */}
      <Modal />

      {/* Fullscreen Creature Profile */}
      <CreatureProfile />

      {/* Random Encounter Overlay */}
      <RandomEncounterOverlay />

      {/* Credits Modal */}
      {showCredits && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,
          display:"flex",alignItems:"center",justifyContent:"center",
          backdropFilter:"blur(8px)"
        }} onClick={()=>setShowCredits(false)}>
          <div style={{
            background:"linear-gradient(145deg,#1a1a2e,#16213e)",
            border:"1px solid #333",borderRadius:16,padding:"36px 32px",
            maxWidth:560,width:"90%",maxHeight:"80vh",overflowY:"auto",
            boxShadow:"0 24px 80px rgba(0,0,0,0.6)"
          }} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{color:"#e8d5b7",fontSize:22,fontFamily:"Crimson Text,serif",margin:0}}>
                📜 Sources & Credits
              </h2>
              <button onClick={()=>setShowCredits(false)} style={{
                background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer"
              }}>✕</button>
            </div>

            <div style={{color:"#ccc",fontSize:14,lineHeight:1.8}}>
              <div style={{
                background:"rgba(255,200,100,0.08)",border:"1px solid rgba(255,200,100,0.15)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#e8d5b7",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🇰🇷 한국 괴물 자료 (Korean Monsters)
                </div>
                <div style={{marginBottom:8}}>
                  <strong style={{color:"#ffd700"}}>곽재식의 옛날 이야기 밭: 괴물백과</strong>
                </div>
                <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>
                  Author: Jaesik Kwak (곽재식) — 280+ Korean monsters catalogued from pre-18th century historical records including 삼국유사, 삼국사기, 용재총화, 어우야담, and other classical texts.
                </div>
                <a href="https://oldstory.postype.com" target="_blank" rel="noopener noreferrer" style={{
                  color:"#6cb4ee",fontSize:13,textDecoration:"none",wordBreak:"break-all"
                }}>
                  🔗 https://oldstory.postype.com
                </a>
                <div style={{fontSize:12,color:"#777",marginTop:8,fontStyle:"italic"}}>
                  Licensed for free creative use (commercial & non-commercial) with attribution.
                  Book: 「한국 괴물 백과」 (Workroom Press, 2018)
                </div>
              </div>

              <div style={{
                background:"rgba(100,180,255,0.06)",border:"1px solid rgba(100,180,255,0.12)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#8bb8e8",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🌍 Global Folklore Data
                </div>
                <div style={{fontSize:13,color:"#aaa",lineHeight:1.7}}>
                  Creature data compiled from public domain folklore, mythology encyclopedias, 
                  academic ethnographic records, and cultural heritage databases across 150+ countries. 
                  Individual creature entries reference traditional oral histories, classical literature, 
                  and anthropological field studies.
                </div>
              </div>

              <div style={{
                background:"rgba(100,255,150,0.06)",border:"1px solid rgba(100,255,150,0.1)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#8be8a8",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🎨 Project Information
                </div>
                <div style={{fontSize:13,color:"#aaa",lineHeight:1.7}}>
                  <strong>Global Folklore Studio — Creature Codex</strong><br/>
                  An interactive encyclopedia bridging traditional folklore with modern creative applications.
                  Built for game developers, writers, illustrators, and cultural researchers.
                </div>
              </div>

              <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#555"}}>
                This project respects cultural heritage and strives for authentic representation.<br/>
                All folklore data is used for educational and creative purposes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Bar */}
      {compareList.length > 0 && activeTab !== "compare" && (
        <div style={{
          position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #1a1208, #111)", border: "1px solid #ff884444",
          borderRadius: 20, padding: "8px 16px", zIndex: 90,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px #ff884422",
          backdropFilter: "blur(12px)",
        }}>
          <span style={{ fontSize: 12, color: "#ff8844", fontWeight: 700 }}>⚔ {compareList.length}개 선택</span>
          <div style={{ display: "flex", gap: 4 }}>
            {compareList.map((item, i) => (
              <div key={i} style={{ position: "relative" }}>
                <Portrait name={item.being.n} type={item.being.t} color={["#ff4466","#44aaff","#44ff88","#ffaa44"][i]} size={28} />
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab("compare")} style={{
            padding: "5px 14px", borderRadius: 12, border: "1px solid #ff8844",
            background: "#ff884422", color: "#ff8844", cursor: "pointer",
            fontSize: 11, fontWeight: 700, fontFamily: "'Crimson Text', serif",
          }}>
            비교하기 →
          </button>
          <button onClick={() => setCompareList([])} style={{
            padding: "5px 8px", borderRadius: 8, border: "1px solid #444",
            background: "transparent", color: "#666", cursor: "pointer", fontSize: 10,
          }}>
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign:"center",padding:"20px 16px 28px",
        borderTop:"1px solid #1a1a2e",marginTop:32
      }}>
        <span style={{color:"#444",fontSize:12}}>
          Global Folklore Studio — Creature Codex · {DATA.length} Countries · {DATA.reduce((a,c)=>a+c.b.length,0)} Creatures
        </span>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <a href="/ko/creatures" style={{color:"#6cb4ee",fontSize:12,textDecoration:"none"}}>
          📖 크리처 도감
        </a>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <a href="/en/creatures" style={{color:"#6cb4ee",fontSize:12,textDecoration:"none"}}>
          📖 Bestiary
        </a>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <a href="/ko/community" style={{color:"#cc8844",fontSize:12,textDecoration:"none"}}>
          ☕ 창작 카페
        </a>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <a href="/en/community" style={{color:"#cc8844",fontSize:12,textDecoration:"none"}}>
          ☕ Creative Cafe
        </a>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <button onClick={()=>setShowCredits(true)} style={{
          background:"none",border:"none",color:"#6cb4ee",fontSize:12,
          cursor:"pointer",textDecoration:"underline",padding:0
        }}>
          📜 Sources & Credits
        </button>
      </div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input::placeholder { color: #555; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 #ff444444; }
          50% { box-shadow: 0 0 12px 4px #ff444422; }
        }
        @keyframes creatureFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fearPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.06); }
        }
        @keyframes profileFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.2; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes profileRing {
          0% { transform: translate(-50%, -55%) rotate(0deg); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translate(-50%, -55%) rotate(360deg); opacity: 0.3; }
        }
        @keyframes profilePortraitEnter {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; filter: blur(20px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        @keyframes profileFadeUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes profileBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes fearDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes cardShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
