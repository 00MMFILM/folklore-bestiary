#!/usr/bin/env node
// ============================================================
// Wikipedia 설화 자동 크롤링 스크립트
// - 6시간마다 GitHub Actions에서 실행
// - Wikipedia API로 새 크리처 발굴 → FOLKLORE_DATA에 추가
// - 라운드 로빈으로 카테고리 순환, 1회 최대 5개 추가
// ============================================================

import fs from 'fs';
import path from 'path';

// ─── 데이터 로드/저장 (expand-folklore.mjs와 동일) ───
const DATA_PATH = path.join(process.cwd(), 'lib', 'folklore-data.ts');
const DATA_MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

function findDataRange(content) {
  const startIdx = content.indexOf(DATA_MARKER) + DATA_MARKER.length;
  let depth = 0, endIdx = startIdx;
  let inString = false, escape = false;
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

function loadData() {
  const content = fs.readFileSync(DATA_PATH, 'utf8');
  const { startIdx, endIdx } = findDataRange(content);
  return JSON.parse(content.substring(startIdx, endIdx));
}

function saveData(data) {
  let content = fs.readFileSync(DATA_PATH, 'utf8');
  const { startIdx, endIdx } = findDataRange(content);
  content = content.substring(0, startIdx) + JSON.stringify(data) + content.substring(endIdx);
  fs.writeFileSync(DATA_PATH, content, 'utf8');
}

// ─── 크리처 생성 헬퍼 (expand-folklore.mjs와 동일) ───
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
    rl: autoRole(t, d, f),
  };
}

// ─── 서사 역할 자동 분류 ───
function autoRole(t, d, f) {
  const tl = (t || '').toLowerCase();
  const dl = (d || '').toLowerCase();
  if (f >= 8 || tl.includes('demon') || tl.includes('evil') || tl.includes('vengeful') || tl.includes('vampire') || tl.includes('undead')) return 'villain';
  if (tl.includes('deity') || tl.includes('god') || tl.includes('hero') || tl.includes('divine')) return 'protagonist';
  if (f <= 3 || tl.includes('guardian') || tl.includes('fairy') || tl.includes('protector') || dl.includes('protect') || dl.includes('guardian')) return 'helper';
  return 'episodic';
}

// ─── 자동 분류 (expand-folklore.mjs와 동일) ───
function autoClassify(t, d) {
  const tl = (t || '').toLowerCase();
  const dl = (d || '').toLowerCase();
  if (tl.includes('deity') || tl.includes('divine') || tl.includes('god') ||
      tl.includes('primordial') || tl.includes('titan') || tl.includes('cosmic')) return 'myth';
  if (dl.includes('creation') || dl.includes('primordial') || dl.includes('창세') ||
      dl.includes('세계를 ') || dl.includes('세상의 시작')) return 'myth';
  if (tl.includes('trickster') || tl.includes('fairy') || tl === 'fairy') return 'folktale';
  if (dl.includes('민담') || dl.includes('옛날이야기') || dl.includes('fairy tale') ||
      dl.includes('folktale') || dl.includes('교훈') || dl.includes('이야기에 등장')) return 'folktale';
  return 'legend';
}

// ═══════════════════════════════════════════════════════════════
//  Wikipedia 카테고리 → ISO 국가 매핑
// ═══════════════════════════════════════════════════════════════
const CATEGORY_COUNTRY_MAP = [
  // Korean wiki categories
  { lang: 'ko', cat: '분류:한국의_전설', iso: 'KR', label: '한국 전설' },
  { lang: 'ko', cat: '분류:한국의_요괴', iso: 'KR', label: '한국 요괴' },
  { lang: 'ko', cat: '분류:한국_신화', iso: 'KR', label: '한국 신화' },
  { lang: 'ko', cat: '분류:일본의_요괴', iso: 'JP', label: '일본 요괴' },
  { lang: 'ko', cat: '분류:중국_신화', iso: 'CN', label: '중국 신화' },

  // English wiki - by country
  { lang: 'en', cat: 'Category:Korean_legendary_creatures', iso: 'KR', label: 'Korean creatures' },
  { lang: 'en', cat: 'Category:Japanese_legendary_creatures', iso: 'JP', label: 'Japanese creatures' },
  { lang: 'en', cat: 'Category:Chinese_mythology', iso: 'CN', label: 'Chinese mythology' },
  { lang: 'en', cat: 'Category:Yōkai', iso: 'JP', label: 'Yōkai' },
  { lang: 'en', cat: 'Category:Creatures_in_Greek_mythology', iso: 'GR', label: 'Greek creatures' },
  { lang: 'en', cat: 'Category:Creatures_in_Norse_mythology', iso: 'NO', label: 'Norse creatures' },
  { lang: 'en', cat: 'Category:Egyptian_legendary_creatures', iso: 'EG', label: 'Egyptian creatures' },
  { lang: 'en', cat: 'Category:Hindu_legendary_creatures', iso: 'IN', label: 'Hindu creatures' },
  { lang: 'en', cat: 'Category:Celtic_legendary_creatures', iso: 'IE', label: 'Celtic creatures' },
  { lang: 'en', cat: 'Category:Slavic_legendary_creatures', iso: 'RU', label: 'Slavic creatures' },
  { lang: 'en', cat: 'Category:Mesopotamian_legendary_creatures', iso: 'IQ', label: 'Mesopotamian creatures' },
  { lang: 'en', cat: 'Category:Persian_legendary_creatures', iso: 'IR', label: 'Persian creatures' },
  { lang: 'en', cat: 'Category:Philippine_legendary_creatures', iso: 'PH', label: 'Philippine creatures' },
  { lang: 'en', cat: 'Category:Indonesian_legendary_creatures', iso: 'ID', label: 'Indonesian creatures' },
  { lang: 'en', cat: 'Category:Thai_legendary_creatures', iso: 'TH', label: 'Thai creatures' },
  { lang: 'en', cat: 'Category:Vietnamese_legendary_creatures', iso: 'VN', label: 'Vietnamese creatures' },
  { lang: 'en', cat: 'Category:Brazilian_legendary_creatures', iso: 'BR', label: 'Brazilian creatures' },
  { lang: 'en', cat: 'Category:Mexican_legendary_creatures', iso: 'MX', label: 'Mexican creatures' },
  { lang: 'en', cat: 'Category:Australian_legendary_creatures', iso: 'AU', label: 'Australian creatures' },
  { lang: 'en', cat: 'Category:Māori_legendary_creatures', iso: 'NZ', label: 'Māori creatures' },
  { lang: 'en', cat: 'Category:Yoruba_mythology', iso: 'NG', label: 'Yoruba mythology' },
  { lang: 'en', cat: 'Category:Ghanaian_legendary_creatures', iso: 'GH', label: 'Ghanaian creatures' },
  { lang: 'en', cat: 'Category:Zulu_mythology', iso: 'ZA', label: 'Zulu mythology' },
  { lang: 'en', cat: 'Category:Romanian_legendary_creatures', iso: 'RO', label: 'Romanian creatures' },
  { lang: 'en', cat: 'Category:French_legendary_creatures', iso: 'FR', label: 'French creatures' },
  { lang: 'en', cat: 'Category:German_legendary_creatures', iso: 'DE', label: 'German creatures' },
  { lang: 'en', cat: 'Category:Italian_legendary_creatures', iso: 'IT', label: 'Italian creatures' },
  { lang: 'en', cat: 'Category:Spanish_legendary_creatures', iso: 'ES', label: 'Spanish creatures' },
  { lang: 'en', cat: 'Category:Scandinavian_folklore', iso: 'SE', label: 'Scandinavian folklore' },
  { lang: 'en', cat: 'Category:Scottish_legendary_creatures', iso: 'SCT', label: 'Scottish creatures' },
  { lang: 'en', cat: 'Category:Turkish_legendary_creatures', iso: 'TR', label: 'Turkish creatures' },
  { lang: 'en', cat: 'Category:Arabian_mythology', iso: 'SA', label: 'Arabian mythology' },
  { lang: 'en', cat: 'Category:Mongolian_mythology', iso: 'MN', label: 'Mongolian mythology' },
  { lang: 'en', cat: 'Category:Native_American_legendary_creatures', iso: 'US', label: 'Native American creatures' },
  { lang: 'en', cat: 'Category:Mapuche_mythology', iso: 'CL', label: 'Mapuche mythology' },
  { lang: 'en', cat: 'Category:Colombian_legendary_creatures', iso: 'CO', label: 'Colombian creatures' },
  { lang: 'en', cat: 'Category:Argentine_legendary_creatures', iso: 'AR', label: 'Argentine creatures' },
  { lang: 'en', cat: 'Category:Peruvian_mythology', iso: 'PE', label: 'Peruvian mythology' },
  { lang: 'en', cat: 'Category:Ethiopian_mythology', iso: 'ET', label: 'Ethiopian mythology' },
  { lang: 'en', cat: 'Category:Cambodian_legendary_creatures', iso: 'KH', label: 'Cambodian creatures' },
  { lang: 'en', cat: 'Category:Hungarian_legendary_creatures', iso: 'HU', label: 'Hungarian creatures' },
  { lang: 'en', cat: 'Category:Polish_legendary_creatures', iso: 'PL', label: 'Polish creatures' },

  // ── 추가 카테고리 (2차 확장) ──

  // 유럽 추가
  { lang: 'en', cat: 'Category:Portuguese_legendary_creatures', iso: 'PT', label: 'Portuguese creatures' },
  { lang: 'en', cat: 'Category:Finnish_legendary_creatures', iso: 'FI', label: 'Finnish creatures' },
  { lang: 'en', cat: 'Category:Cornish_legendary_creatures', iso: 'GB', label: 'Cornish creatures' },
  { lang: 'en', cat: 'Category:Icelandic_folklore', iso: 'IS', label: 'Icelandic folklore' },
  { lang: 'en', cat: 'Category:Welsh_mythology', iso: 'GB', label: 'Welsh mythology' },
  { lang: 'en', cat: 'Category:Lithuanian_mythology', iso: 'LT', label: 'Lithuanian mythology' },
  { lang: 'en', cat: 'Category:Basque_legendary_creatures', iso: 'ES', label: 'Basque creatures' },
  { lang: 'en', cat: 'Category:Georgian_mythology', iso: 'GE', label: 'Georgian mythology' },
  { lang: 'en', cat: 'Category:Armenian_mythology', iso: 'AM', label: 'Armenian mythology' },

  // 아시아 추가
  { lang: 'en', cat: 'Category:Chinese_legendary_creatures', iso: 'CN', label: 'Chinese creatures' },
  { lang: 'en', cat: 'Category:Korean_mythology', iso: 'KR', label: 'Korean mythology' },
  { lang: 'en', cat: 'Category:Japanese_folklore', iso: 'JP', label: 'Japanese folklore' },
  { lang: 'en', cat: 'Category:Burmese_legendary_creatures', iso: 'MM', label: 'Burmese creatures' },
  { lang: 'en', cat: 'Category:Laotian_legendary_creatures', iso: 'LA', label: 'Laotian creatures' },
  { lang: 'en', cat: 'Category:Sri_Lankan_legendary_creatures', iso: 'LK', label: 'Sri Lankan creatures' },
  { lang: 'en', cat: 'Category:Nepalese_legendary_creatures', iso: 'NP', label: 'Nepalese creatures' },
  { lang: 'en', cat: 'Category:Balinese_mythology', iso: 'ID', label: 'Balinese mythology' },
  { lang: 'en', cat: 'Category:Tibetan_legendary_creatures', iso: 'CN', label: 'Tibetan creatures' },
  { lang: 'en', cat: 'Category:Oni', iso: 'JP', label: 'Oni' },
  { lang: 'en', cat: 'Category:Tengu', iso: 'JP', label: 'Tengu' },

  // 오세아니아 추가
  { lang: 'en', cat: 'Category:Polynesian_legendary_creatures', iso: 'NZ', label: 'Polynesian creatures' },
  { lang: 'en', cat: 'Category:Samoan_mythology', iso: 'WS', label: 'Samoan mythology' },

  // 아메리카 추가
  { lang: 'en', cat: 'Category:Algonquian_mythology', iso: 'US', label: 'Algonquian mythology' },
  { lang: 'en', cat: 'Category:Caribbean_mythology', iso: 'JM', label: 'Caribbean mythology' },

  // 아프리카 추가 (기존 나이지리아/가나/남아공 외)

  // 타입별 크로스컷 카테고리
  { lang: 'en', cat: 'Category:Legendary_serpents', iso: '_MULTI', label: 'Legendary serpents' },
  { lang: 'en', cat: 'Category:Legendary_birds', iso: '_MULTI', label: 'Legendary birds' },
  { lang: 'en', cat: 'Category:Mythological_canines', iso: '_MULTI', label: 'Mythological canines' },
  { lang: 'en', cat: 'Category:Mythological_horses', iso: '_MULTI', label: 'Mythological horses' },
  { lang: 'en', cat: 'Category:Water_spirits', iso: '_MULTI', label: 'Water spirits' },
  { lang: 'en', cat: 'Category:Werewolves', iso: '_MULTI', label: 'Werewolves' },
  { lang: 'en', cat: 'Category:Trolls', iso: '_MULTI', label: 'Trolls' },
  { lang: 'en', cat: 'Category:Banshees', iso: 'IE', label: 'Banshees' },
  { lang: 'en', cat: 'Category:Shapeshifting', iso: '_MULTI', label: 'Shapeshifters' },
  { lang: 'en', cat: 'Category:Cryptids', iso: '_MULTI', label: 'Cryptids' },
  { lang: 'en', cat: 'Category:Fairy_tale_stock_characters', iso: '_MULTI', label: 'Fairy tale characters' },
];

// ═══════════════════════════════════════════════════════════════
//  _MULTI 카테고리용 국가 추정
// ═══════════════════════════════════════════════════════════════
const COUNTRY_KEYWORDS = {
  GR: ['greek', 'greece', 'hellenic', 'olymp', 'athen'],
  NO: ['norse', 'norway', 'norwegian', 'viking', 'scandinavian'],
  JP: ['japan', 'japanese', 'shinto', 'edo', 'yokai'],
  CN: ['china', 'chinese', 'taoist', 'tang dynasty', 'ming'],
  KR: ['korea', 'korean', 'joseon', 'goryeo'],
  IN: ['india', 'indian', 'hindu', 'vedic', 'sanskrit'],
  EG: ['egypt', 'egyptian', 'pharao', 'nile'],
  IE: ['irish', 'ireland', 'celtic', 'gaelic'],
  RU: ['russia', 'russian', 'slavic', 'slav'],
  DE: ['german', 'germany', 'germanic', 'teutonic'],
  FR: ['france', 'french', 'gaul'],
  IT: ['italy', 'italian', 'roman', 'rome'],
  GB: ['british', 'english', 'england', 'scotland', 'scottish', 'welsh', 'wales'],
  ES: ['spain', 'spanish', 'iberian', 'basque'],
  TR: ['turk', 'ottoman', 'anatoli'],
  IR: ['persia', 'persian', 'iran'],
  MX: ['mexico', 'mexican', 'aztec', 'maya'],
  BR: ['brazil', 'brazilian', 'tupi'],
  US: ['america', 'native american', 'navajo', 'cherokee', 'iroquois', 'algonquin'],
  PH: ['philippin', 'filipino', 'tagalog'],
  ID: ['indonesia', 'indonesian', 'java', 'bali'],
  TH: ['thai', 'thailand', 'siam'],
  RO: ['romania', 'romanian', 'transylvan'],
  SE: ['sweden', 'swedish'],
  FI: ['finland', 'finnish', 'kalevala'],
  PL: ['poland', 'polish'],
  SA: ['arab', 'arabian', 'islam', 'bedouin'],
  AU: ['australia', 'australian', 'aboriginal'],
  NZ: ['maori', 'new zealand', 'polynesia'],
};

function guessCountryFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [iso, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) { bestScore = score; best = iso; }
  }
  return bestScore > 0 ? best : null;
}

// ═══════════════════════════════════════════════════════════════
//  Wikipedia API 호출
// ═══════════════════════════════════════════════════════════════
let apiCallCount = 0;
const MAX_API_CALLS = 50;

async function fetchJSON(url) {
  if (apiCallCount >= MAX_API_CALLS) return null;
  apiCallCount++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FolkloreBestiary/1.0 (https://github.com/folklore-bestiary)' },
    });
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCategoryMembers(lang, cat, limit = 50) {
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}` +
    `&cmlimit=${limit}&cmtype=page&format=json&origin=*`;
  const data = await fetchJSON(url);
  return data?.query?.categorymembers || [];
}

async function fetchArticleDetail(lang, title) {
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=query&prop=extracts|categories|langlinks&exintro&explaintext&exsentences=6` +
    `&lllimit=10&cllimit=20` +
    `&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const data = await fetchJSON(url);
  if (!data?.query?.pages) return null;
  const page = Object.values(data.query.pages)[0];
  if (!page?.pageid || !page?.extract) return null;
  return {
    title: page.title,
    pageid: page.pageid,
    extract: page.extract,
    categories: (page.categories || []).map(c => c.title),
    langlinks: page.langlinks || [],
  };
}

// ═══════════════════════════════════════════════════════════════
//  크리처 스키마 변환 (휴리스틱)
// ═══════════════════════════════════════════════════════════════

// 타입 추정
function guessType(title, extract) {
  const text = `${title} ${extract}`.toLowerCase();
  if (/dragon|serpent|wyrm|뱀|용/.test(text)) return 'Serpent';
  if (/ghost|spirit|phantom|유령|귀신|원귀/.test(text)) return 'Spirit';
  if (/demon|devil|악마|마왕/.test(text)) return 'Demon';
  if (/giant|거인|titan/.test(text)) return 'Giant';
  if (/fairy|faerie|요정|선녀/.test(text)) return 'Fairy';
  if (/god|goddess|deity|신|여신/.test(text)) return 'Deity';
  if (/wolf|bear|beast|짐승|animal/.test(text)) return 'Beast';
  if (/witch|sorcerer|마녀|주술/.test(text)) return 'Sorcerer';
  if (/vampire|blood|흡혈/.test(text)) return 'Vampire';
  if (/sea|ocean|water|lake|바다|호수|강/.test(text)) return 'Sea Creature';
  if (/bird|eagle|hawk|crow|새|까마귀/.test(text)) return 'Bird';
  if (/trickster|장난/.test(text)) return 'Trickster';
  return 'Creature';
}

// 공포 레벨 추정 (1-10)
function guessFear(type, extract) {
  const text = extract.toLowerCase();
  let fear = 5;
  if (/death|kill|devour|eat|blood|죽|피|잡아먹|살해|공포/.test(text)) fear += 2;
  if (/terrify|horror|nightmare|monster|무서|끔찍|흉측/.test(text)) fear += 2;
  if (/gentle|kind|protect|guardian|benevolent|착한|온화|수호/.test(text)) fear -= 2;
  if (/beautiful|grace|선한|아름/.test(text)) fear -= 1;
  if (/demon|devil|악마/.test(type.toLowerCase())) fear += 1;
  if (/fairy|선녀/.test(type.toLowerCase())) fear -= 1;
  return Math.max(1, Math.min(10, fear));
}

// 능력 추정
function guessAbilities(extract) {
  const abilities = [];
  const text = extract.toLowerCase();
  if (/fly|flight|비행|날/.test(text)) abilities.push('비행');
  if (/transform|shape.?shift|변신/.test(text)) abilities.push('변신');
  if (/fire|flame|불|화염/.test(text)) abilities.push('화염');
  if (/poison|venom|독/.test(text)) abilities.push('독');
  if (/magic|spell|마법|주술/.test(text)) abilities.push('마법');
  if (/strength|strong|힘|괴력/.test(text)) abilities.push('괴력');
  if (/invisible|disappear|은신|사라/.test(text)) abilities.push('은신');
  if (/immortal|undying|불멸|불사/.test(text)) abilities.push('불멸');
  if (/heal|cure|치유|치료/.test(text)) abilities.push('치유');
  if (/water|ocean|sea|물|바다/.test(text)) abilities.push('수중 활동');
  if (abilities.length === 0) abilities.push('초자연적 능력');
  return abilities.slice(0, 4);
}

// 약점 추정
function guessWeaknesses(extract) {
  const text = extract.toLowerCase();
  const wk = [];
  if (/hero|warrior|영웅|전사/.test(text)) wk.push('영웅의 무기');
  if (/iron|steel|철|쇠/.test(text)) wk.push('철');
  if (/sun|daylight|태양|햇빛|새벽/.test(text)) wk.push('햇빛');
  if (/pray|holy|sacred|기도|신성/.test(text)) wk.push('신성한 힘');
  if (/trick|deceive|속임|기지/.test(text)) wk.push('지혜/속임수');
  if (wk.length === 0) wk.push('특정 의식');
  return wk.slice(0, 3);
}

// 비주얼 키워드 추정
function guessVisualKeywords(title, type, extract) {
  const vk = [];
  const text = `${title} ${type} ${extract}`.toLowerCase();
  if (/red|붉|빨/.test(text)) vk.push('red');
  if (/green|녹|초록/.test(text)) vk.push('green');
  if (/black|dark|검|어두/.test(text)) vk.push('dark');
  if (/white|흰|백/.test(text)) vk.push('white');
  if (/golden|gold|금|황금/.test(text)) vk.push('golden');
  if (/horn|뿔/.test(text)) vk.push('horns');
  if (/wing|날개/.test(text)) vk.push('wings');
  if (/claw|talon|발톱/.test(text)) vk.push('claws');
  if (/eye|눈/.test(text)) vk.push('glowing eyes');
  if (/scale|비늘/.test(text)) vk.push('scales');
  vk.push(type.toLowerCase().replace(/\s+/g, '-'));
  return [...new Set(vk)].slice(0, 5);
}

// 한국어 설명 생성 (한국어 위키 기사면 직접 사용, 아니면 템플릿)
function generateKoreanDescription(article, type, iso) {
  if (article.lang === 'ko' && article.extract) {
    // 한국어 위키 기사 → 직접 사용 (최대 200자)
    return article.extract.replace(/\n/g, ' ').substring(0, 200);
  }
  // 영어 기사 → 템플릿 기반 한국어 설명
  const regionMap = {
    KR: '한국', JP: '일본', CN: '중국', IN: '인도', GR: '그리스', NO: '노르웨이',
    EG: '이집트', IE: '아일랜드', IR: '이란', IQ: '이라크', GB: '영국', FR: '프랑스',
    DE: '독일', RU: '러시아', TR: '터키', SA: '아라비아', MX: '멕시코', BR: '브라질',
    US: '미국', AU: '호주', NZ: '뉴질랜드', PH: '필리핀', ID: '인도네시아',
    TH: '태국', VN: '베트남', NG: '나이지리아', GH: '가나', ZA: '남아프리카',
    RO: '루마니아', PL: '폴란드', IT: '이탈리아', ES: '스페인', SE: '스웨덴',
    SCT: '스코틀랜드', MN: '몽골', CO: '콜롬비아', CL: '칠레', AR: '아르헨티나',
    PE: '페루', ET: '에티오피아', KH: '캄보디아', HU: '헝가리',
  };
  const region = regionMap[iso] || '세계';
  const engDesc = (article.extract || '').substring(0, 100).replace(/\n/g, ' ');
  return `${region} 설화에 등장하는 ${type}. ${engDesc}`;
}

// 한국어 이름 생성 (영어 제목 → 음역 근사)
function generateKoreanName(article) {
  if (article.koTitle) return article.koTitle;
  // langlinks에서 한국어가 있으면 사용
  const koLink = (article.langlinks || []).find(l => l.lang === 'ko');
  if (koLink) return koLink['*'] || koLink.title || article.title;
  // 없으면 영어 이름 그대로 (한글 음역은 LLM 없이 불가)
  return article.title;
}

// ═══════════════════════════════════════════════════════════════
//  상태 관리
// ═══════════════════════════════════════════════════════════════
const STATE_PATH = path.join(process.cwd(), 'scripts', 'crawl-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {
      lastCategoryIndex: 0,
      processedPageIds: [],
      totalAdded: 0,
      runs: 0,
      lastRun: null,
    };
  }
}

function saveState(state) {
  // 처리된 페이지 ID는 최근 5000개만 유지 (무한 증가 방지)
  if (state.processedPageIds.length > 5000) {
    state.processedPageIds = state.processedPageIds.slice(-5000);
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════
//  중복 방지 (4중 체크)
// ═══════════════════════════════════════════════════════════════
function isDuplicate(creature, data, state) {
  // Helper: extract core name without parenthetical (e.g. "Gumiho (구미호)" → "gumiho")
  const coreName = (name) => (name || '').replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();

  // 1) ID 중복
  for (const country of data) {
    if (country.b.some(b => b.id === creature.id)) return true;
  }

  // 2) 영어 이름 (n) 중복 — exact + core name
  const nLower = (creature.n || '').toLowerCase();
  const nCore = coreName(creature.n);
  for (const country of data) {
    if (country.b.some(b => {
      const bLower = (b.n || '').toLowerCase();
      const bCore = coreName(b.n);
      return bLower === nLower || (nCore && bCore && nCore === bCore);
    })) return true;
  }

  // 3) 한국어 이름 (ln) 중복 — exact + core name
  const lnLower = (creature.ln || '').toLowerCase();
  const lnCore = coreName(creature.ln);
  if (lnLower) {
    for (const country of data) {
      if (country.b.some(b => {
        const bLnLower = (b.ln || '').toLowerCase();
        const bLnCore = coreName(b.ln);
        return bLnLower === lnLower || (lnCore && bLnCore && lnCore === bLnCore);
      })) return true;
    }
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
//  필터링: 크리처/설화 관련 기사인지 확인
// ═══════════════════════════════════════════════════════════════
function isCreatureArticle(article) {
  const title = article.title;
  const text = `${title} ${article.extract}`.toLowerCase();

  // 명확히 비관련 (인물 전기, 지역, 영화, TV, 목록, 메타 기사 등) 제외
  if (/\b(born|died|population|census|municipality|film|album|novel|video game)\b/.test(text)) return false;
  if (/\b(television|tv series|anime|manga)\b/.test(text) && !/\b(legend|myth|folk|creature)\b/.test(text)) return false;
  // 연도로 시작하는 제목 (TV 프로그램 등)
  if (/^\d{4}\s/.test(title)) return false;
  // 목록/개요/분류 류 기사 제외
  if (/^(list of|분류:|틀:|category:)/i.test(title)) return false;
  // "XX 신화", "XX의 XX" 등 메타/개론 기사 제외
  if (/^(한국|일본|중국|그리스|이집트|인도|북유럽)\s*(신화|전설|민담|설화)$/.test(title)) return false;
  if (/mythology$|^mythology of/i.test(title)) return false;
  // 시가, 문학, 역사 등 비생물 기사 제외
  if (/시가|문학|역사서|연구|론$|학$/.test(title)) return false;

  // 너무 짧은 기사 제외
  if ((article.extract || '').length < 80) return false;

  // 설화/생물 관련 키워드 포함 확인
  const creatureIndicators = /creature|monster|spirit|demon|ghost|beast|dragon|serpent|fairy|deity|god|mytholog|folklore|legend|supernatural|cryptid|요괴|귀신|신화|전설|민담|괴물|정령|악마|용|뱀|유령/;
  return creatureIndicators.test(text);
}

// ═══════════════════════════════════════════════════════════════
//  메인 실행
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('🕷️  Wikipedia 설화 크롤러 시작');
  console.log(`📅 ${new Date().toISOString()}`);

  const data = loadData();
  const state = loadState();
  const beforeCount = data.reduce((s, c) => s + c.b.length, 0);

  // ── 라운드 로빈: 2~3개 카테고리 선택 ──
  const totalCats = CATEGORY_COUNTRY_MAP.length;
  const batchSize = 6;
  const startIdx = state.lastCategoryIndex % totalCats;
  const selectedCats = [];
  for (let i = 0; i < batchSize; i++) {
    selectedCats.push(CATEGORY_COUNTRY_MAP[(startIdx + i) % totalCats]);
  }
  state.lastCategoryIndex = (startIdx + batchSize) % totalCats;

  console.log(`\n📂 이번 크롤 카테고리 (${startIdx}~):`);
  selectedCats.forEach(c => console.log(`   - [${c.iso}] ${c.label} (${c.lang})`));

  // ── 각 카테고리에서 기사 수집 ──
  const MAX_NEW = 15;
  let added = 0;
  const processedIds = new Set(state.processedPageIds);

  for (const catDef of selectedCats) {
    if (added >= MAX_NEW) break;
    if (apiCallCount >= MAX_API_CALLS) break;

    console.log(`\n🔍 [${catDef.iso}] ${catDef.label} 크롤 중...`);
    const members = await fetchCategoryMembers(catDef.lang, catDef.cat, 50);

    if (members.length === 0) {
      console.log('   ⚠️ 카테고리에서 기사를 찾지 못함');
      continue;
    }
    console.log(`   📄 ${members.length}개 기사 발견`);

    // 아직 처리 안 한 기사만 필터
    const unprocessed = members.filter(m => !processedIds.has(m.pageid));
    if (unprocessed.length === 0) {
      console.log('   ✅ 이미 모든 기사 처리됨');
      continue;
    }

    // 랜덤 셔플 대신 순서대로 최대 10개 시도
    const candidates = unprocessed.slice(0, 10);

    for (const member of candidates) {
      if (added >= MAX_NEW) break;
      if (apiCallCount >= MAX_API_CALLS) break;

      // 이미 처리한 pageid 기록
      processedIds.add(member.pageid);
      state.processedPageIds.push(member.pageid);

      // 상세 정보 가져오기
      const article = await fetchArticleDetail(catDef.lang, member.title);
      if (!article) {
        console.log(`   ⏭️ ${member.title} — 상세 정보 없음`);
        continue;
      }

      // 크리처 관련 기사인지 필터
      article.lang = catDef.lang;
      if (!isCreatureArticle(article)) {
        console.log(`   ⏭️ ${member.title} — 크리처 관련 아님`);
        continue;
      }

      // 한국어 이름 찾기
      const koName = generateKoreanName(article);
      const enName = catDef.lang === 'ko'
        ? ((article.langlinks || []).find(l => l.lang === 'en')?.['*'] || article.title)
        : article.title;

      // 타입/공포/능력 추정
      const type = guessType(article.title, article.extract);
      const fear = guessFear(type, article.extract);
      const abilities = guessAbilities(article.extract);
      const weaknesses = guessWeaknesses(article.extract);
      const visualKw = guessVisualKeywords(article.title, type, article.extract);
      const ct = autoClassify(type, article.extract);
      const desc = generateKoreanDescription(article, type, catDef.iso);
      const srcLabel = catDef.lang === 'ko' ? '위키백과' : `Wikipedia (${catDef.label})`;

      // 크리처 생성
      const creature = mk(catDef.iso, enName, koName, type, fear, desc, abilities, weaknesses, visualKw, srcLabel, ct);

      // 중복 체크
      if (isDuplicate(creature, data, state)) {
        console.log(`   ⏭️ ${koName}(${enName}) — 중복, 스킵`);
        continue;
      }

      // 해당 국가 찾기 (_MULTI 카테고리는 본문에서 추정)
      let targetIso = catDef.iso;
      if (targetIso === '_MULTI') {
        const guessed = guessCountryFromText(article.extract);
        if (!guessed) {
          console.log(`   ⏭️ ${koName}(${enName}) — 국가 추정 불가, 스킵`);
          continue;
        }
        targetIso = guessed;
      }
      const country = data.find(c => c.i === targetIso);
      if (!country) {
        console.log(`   ⚠️ ${targetIso} 국가를 데이터에서 찾을 수 없음`);
        continue;
      }
      // _MULTI일 경우 creature의 ISO도 교정
      if (catDef.iso === '_MULTI') {
        creature.id = `${targetIso.toLowerCase()}-${creature.id.split('-').slice(1).join('-')}`;
      }

      country.b.push(creature);
      added++;
      console.log(`   ✅ 추가: ${koName}(${enName}) [${type}, 공포:${fear}, ${ct}]`);
    }
  }

  // ── 결과 저장 ──
  if (added > 0) {
    saveData(data);
    console.log(`\n💾 데이터 저장 완료`);
  }

  // ── LAST_UPDATED 타임스탬프 갱신 (FolkloreMap 배너용) ──
  const fmPath = path.join(process.cwd(), 'components', 'FolkloreMap.jsx');
  let fmContent = fs.readFileSync(fmPath, 'utf8');
  fmContent = fmContent.replace(
    /const LAST_UPDATED = "[^"]*";/,
    `const LAST_UPDATED = "${new Date().toISOString()}";`
  );
  fs.writeFileSync(fmPath, fmContent, 'utf8');
  console.log(`🕐 LAST_UPDATED 갱신: ${new Date().toISOString()}`);

  // ── 상태 업데이트 ──
  state.totalAdded += added;
  state.runs++;
  state.lastRun = new Date().toISOString();
  saveState(state);

  const afterCount = data.reduce((s, c) => s + c.b.length, 0);

  // ── 결과 출력 ──
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Wikipedia 설화 크롤링 완료                      ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  이번 실행: +${added}개 크리처`);
  console.log(`║  총 크리처: ${beforeCount} → ${afterCount}개`);
  console.log(`║  API 호출: ${apiCallCount}/${MAX_API_CALLS}`);
  console.log(`║  누적 추가: ${state.totalAdded}개 (${state.runs}회 실행)`);
  console.log(`║  다음 카테고리: ${CATEGORY_COUNTRY_MAP[state.lastCategoryIndex]?.label || '처음부터'}`);
  console.log('╚══════════════════════════════════════════════════╝');

  // GitHub Actions에서 변경 여부 판단용 종료 코드
  // 추가된 크리처가 없으면 종료 코드 0 (정상), 있어도 0 (커밋은 workflow에서 처리)
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 크롤링 실패:', err);
  process.exit(1);
});
