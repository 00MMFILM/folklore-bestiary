#!/usr/bin/env node
// ============================================================
// Wikipedia 설화 자동 크롤링 스크립트
// - 6시간마다 GitHub Actions에서 실행
// - Wikipedia API로 새 크리처 발굴 → FOLKLORE_DATA에 추가
// - 라운드 로빈으로 카테고리 순환, 1회 최대 5개 추가
// ============================================================

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

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
  saveSiteStats(data);
}

// 메타 설명 등에 쓰는 빌드 타임 통계 — 데이터 저장 때마다 자동 갱신
function saveSiteStats(data) {
  const creatureCount = data.reduce((s, c) => s + c.b.length, 0);
  const statsPath = path.join(process.cwd(), 'lib', 'site-stats.ts');
  const content = `// 자동 생성 파일 — scripts/crawl-wikipedia-folklore.mjs가 갱신. 직접 수정 금지.
export const CREATURE_COUNT = ${creatureCount};
export const COUNTRY_COUNT = ${data.length};
`;
  fs.writeFileSync(statsPath, content, 'utf8');
}

// ─── 크리처 생성 헬퍼 (expand-folklore.mjs와 동일) ───
function mk(iso, ln, n, t, f, d, ab, wk, vk, src, ct) {
  // \uc720\ub2c8\ucf54\ub4dc \uc2ac\ub7ec\uadf8: \ub77c\ud2f4 \ubc1c\uc74c\ubd80\ud638\ub294 \uc81c\uac70, \ud55c\uae00\u00b7\ud55c\uc790 \ub4f1 CJK\ub294 \uc720\uc9c0
  // (\ud55c\uae00 \uc804\uc6a9 \uc774\ub984\uc774 \ube48 \uc2ac\ub7ec\uadf8 \u2192 id \ucda9\ub3cc\uc744 \uc77c\uc73c\ud0a4\ub358 \ubc84\uadf8 \uc218\uc815)
  let slug = ln.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  if (!slug) slug = 'unnamed';
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
  { lang: 'ko', cat: '분류:한국의_전설의_생물', iso: 'KR', label: '한국 전설의 생물' },
  { lang: 'ko', cat: '분류:한국_신화', iso: 'KR', label: '한국 신화' },
  { lang: 'ko', cat: '분류:한국_신화의_인물', iso: 'KR', label: '한국 신화 인물' },
  { lang: 'ko', cat: '분류:한국의_민담', iso: 'KR', label: '한국 민담' },
  { lang: 'ko', cat: '분류:한국의_설화', iso: 'KR', label: '한국 설화' },
  { lang: 'ko', cat: '분류:무속의_신', iso: 'KR', label: '한국 무속 신' },
  { lang: 'ko', cat: '분류:한국의_신', iso: 'KR', label: '한국 신' },
  // ─ 한국 지역·왕조별 설화 (2026-07-05 추가: 제주/지방 커버리지 확대) ─
  { lang: 'ko', cat: '분류:제주_신화', iso: 'KR', label: '제주 신화' },
  { lang: 'ko', cat: '분류:탐라_신화', iso: 'KR', label: '탐라 신화' },
  { lang: 'ko', cat: '분류:서사무가', iso: 'KR', label: '서사무가' },
  { lang: 'ko', cat: '분류:한국의_귀신', iso: 'KR', label: '한국 귀신' },
  { lang: 'ko', cat: '분류:한국의_용', iso: 'KR', label: '한국의 용' },
  { lang: 'ko', cat: '분류:신라_신화', iso: 'KR', label: '신라 신화' },
  { lang: 'ko', cat: '분류:고구려_신화', iso: 'KR', label: '고구려 신화' },
  { lang: 'ko', cat: '분류:백제_신화', iso: 'KR', label: '백제 신화' },
  { lang: 'ko', cat: '분류:가야_신화', iso: 'KR', label: '가야 신화' },
  { lang: 'ko', cat: '분류:고조선_신화', iso: 'KR', label: '고조선 신화' },
  { lang: 'ko', cat: '분류:부여_신화', iso: 'KR', label: '부여 신화' },
  { lang: 'ko', cat: '분류:고려_신화', iso: 'KR', label: '고려 신화' },
  { lang: 'ko', cat: '분류:조선_신화', iso: 'KR', label: '조선 신화' },
  // ─ 괴담·도시전설 (2026-07-06 추가: 자유로 귀신·홍콩할매귀신류 현대 괴담 커버) ─
  { lang: 'ko', cat: '분류:대한민국의_도시전설', iso: 'KR', label: '한국 도시전설' },
  { lang: 'ko', cat: '분류:괴담', iso: '_MULTI', label: '괴담' },
  { lang: 'ko', cat: '분류:학교괴담', iso: '_MULTI', label: '학교괴담' },
  { lang: 'ko', cat: '분류:도시전설', iso: '_MULTI', label: '도시전설' },
  { lang: 'ko', cat: '분류:일본의_도시전설', iso: 'JP', label: '일본 도시전설' },
  { lang: 'en', cat: 'Category:Korean_ghosts', iso: 'KR', label: 'Korean ghosts' },
  { lang: 'en', cat: 'Category:Urban_legends', iso: '_MULTI', label: 'Urban legends' },
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
  { lang: 'en', cat: 'Category:Korean_folklore', iso: 'KR', label: 'Korean folklore' },
  { lang: 'en', cat: 'Category:Korean_shamanism', iso: 'KR', label: 'Korean shamanism' },
  { lang: 'en', cat: 'Category:Characters_in_Korean_mythology', iso: 'KR', label: 'Korean myth characters' },
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

  // ── 3차 확장 (2026-06): 풀 고갈 대응 ──

  // 슬라브/동유럽 세분화
  { lang: 'en', cat: 'Category:Russian_folklore', iso: 'RU', label: 'Russian folklore' },
  { lang: 'en', cat: 'Category:Russian_mythology', iso: 'RU', label: 'Russian mythology' },
  { lang: 'en', cat: 'Category:Ukrainian_mythology', iso: 'UA', label: 'Ukrainian mythology' },
  { lang: 'en', cat: 'Category:Bulgarian_mythology', iso: 'BG', label: 'Bulgarian mythology' },
  { lang: 'en', cat: 'Category:Czech_folklore', iso: 'CZ', label: 'Czech folklore' },
  { lang: 'en', cat: 'Category:Albanian_mythology', iso: 'AL', label: 'Albanian mythology' },
  { lang: 'en', cat: 'Category:Latvian_mythology', iso: 'LV', label: 'Latvian mythology' },
  { lang: 'en', cat: 'Category:Estonian_mythology', iso: 'EE', label: 'Estonian mythology' },
  { lang: 'en', cat: 'Category:Sami_mythology', iso: 'NO', label: 'Sami mythology' },

  // 라틴 아메리카 보강
  { lang: 'en', cat: 'Category:Aztec_mythology', iso: 'MX', label: 'Aztec mythology' },
  { lang: 'en', cat: 'Category:Maya_mythology', iso: 'MX', label: 'Maya mythology' },
  { lang: 'en', cat: 'Category:Inca_mythology', iso: 'PE', label: 'Inca mythology' },
  { lang: 'en', cat: 'Category:Guatemalan_legendary_creatures', iso: 'GT', label: 'Guatemalan creatures' },
  { lang: 'en', cat: 'Category:Chilean_legendary_creatures', iso: 'CL', label: 'Chilean creatures' },
  { lang: 'en', cat: 'Category:Venezuelan_legendary_creatures', iso: 'VE', label: 'Venezuelan creatures' },

  // 인도/남아시아 세분화
  { lang: 'en', cat: 'Category:Rakshasas', iso: 'IN', label: 'Rakshasas' },
  { lang: 'en', cat: 'Category:Asuras', iso: 'IN', label: 'Asuras' },
  { lang: 'en', cat: 'Category:Nagas', iso: 'IN', label: 'Nagas' },
  { lang: 'en', cat: 'Category:Apsaras', iso: 'IN', label: 'Apsaras' },
  { lang: 'en', cat: 'Category:Yakshas', iso: 'IN', label: 'Yakshas' },
  { lang: 'en', cat: 'Category:Buddhist_legendary_creatures', iso: '_MULTI', label: 'Buddhist creatures' },
  { lang: 'en', cat: 'Category:Hindu_deities', iso: 'IN', label: 'Hindu deities' },

  // 아프리카 보강
  { lang: 'en', cat: 'Category:Akan_religion', iso: 'GH', label: 'Akan religion' },
  { lang: 'en', cat: 'Category:Igbo_mythology', iso: 'NG', label: 'Igbo mythology' },
  { lang: 'en', cat: 'Category:Dahomey_mythology', iso: 'BJ', label: 'Dahomey mythology' },
  { lang: 'en', cat: 'Category:Berber_mythology', iso: 'MA', label: 'Berber mythology' },

  // 북미 원주민 세분화
  { lang: 'en', cat: 'Category:Inuit_mythology', iso: 'CA', label: 'Inuit mythology' },
  { lang: 'en', cat: 'Category:Hawaiian_mythology', iso: 'US', label: 'Hawaiian mythology' },
  { lang: 'en', cat: 'Category:Navajo_mythology', iso: 'US', label: 'Navajo mythology' },
  { lang: 'en', cat: 'Category:Hopi_mythology', iso: 'US', label: 'Hopi mythology' },
  { lang: 'en', cat: 'Category:Iroquois_mythology', iso: 'US', label: 'Iroquois mythology' },

  // 동남아 추가
  { lang: 'en', cat: 'Category:Hmong_mythology', iso: 'VN', label: 'Hmong mythology' },
  { lang: 'en', cat: 'Category:Malaysian_legendary_creatures', iso: 'MY', label: 'Malaysian creatures' },

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
// 사이트가 지원하는 전체 국가(145개) 기준. 단어 경계(\b) 매칭이므로 완전한 단어로 표기.
// 동점 시 먼저 정의된 국가가 승리 — 구체적 문화권을 앞에, 광역 키워드(US 등)를 뒤에 배치.
const COUNTRY_KEYWORDS = {
  // ─ 동아시아 ─
  KR: ['korea', 'korean', 'joseon', 'goryeo', 'silla', 'baekje'],
  JP: ['japan', 'japanese', 'shinto', 'yokai', 'ainu', 'okinawan'],
  CN: ['china', 'chinese', 'taoist', 'daoist', 'tibetan', 'tibet'],
  MN: ['mongol', 'mongolia', 'mongolian'],
  TW: ['taiwan', 'taiwanese'],
  // ─ 동남아시아 ─
  VN: ['vietnam', 'vietnamese'],
  TH: ['thai', 'thailand', 'siam', 'siamese'],
  PH: ['philippine', 'philippines', 'filipino', 'tagalog', 'visayan'],
  ID: ['indonesia', 'indonesian', 'javanese', 'balinese', 'sundanese', 'bali'],
  MY: ['malay', 'malaysia', 'malaysian', 'bornean'],
  KH: ['khmer', 'cambodia', 'cambodian'],
  MM: ['burmese', 'myanmar', 'burma'],
  LA: ['lao', 'laotian', 'laos'],
  SG: ['singapore', 'singaporean'],
  BN: ['brunei'],
  // ─ 남아시아 ─
  IN: ['india', 'indian', 'hindu', 'vedic', 'sanskrit', 'tamil', 'puranic'],
  NP: ['nepal', 'nepali', 'nepalese', 'newar'],
  LK: ['sri lanka', 'sri lankan', 'sinhala', 'sinhalese'],
  PK: ['pakistan', 'pakistani'],
  BD: ['bangladesh', 'bangladeshi', 'bengali', 'bengal'],
  AF: ['afghan', 'afghanistan'],
  BT: ['bhutan', 'bhutanese'],
  MV: ['maldives', 'maldivian'],
  // ─ 중동·코카서스·중앙아시아 ─
  IR: ['persia', 'persian', 'iran', 'iranian', 'zoroastrian'],
  TR: ['turkish', 'turkey', 'turkic', 'ottoman', 'anatolia', 'anatolian'],
  IQ: ['iraq', 'iraqi', 'mesopotamia', 'mesopotamian', 'sumerian', 'babylonian', 'akkadian', 'assyrian'],
  IL: ['israel', 'israeli', 'jewish', 'hebrew', 'kabbalah', 'talmudic'],
  LB: ['lebanon', 'lebanese', 'phoenician', 'canaanite'],
  SA: ['arab', 'arabian', 'arabic', 'islam', 'islamic', 'bedouin'],
  OM: ['oman', 'omani'],
  EG: ['egypt', 'egyptian', 'pharaoh', 'pharaonic', 'coptic', 'nile'],
  KZ: ['kazakh', 'kazakhstan'],
  UZ: ['uzbek', 'uzbekistan'],
  GE: ['georgian'],
  AM: ['armenia', 'armenian'],
  AZ: ['azerbaijan', 'azerbaijani', 'azeri'],
  KG: ['kyrgyz', 'kyrgyzstan'],
  TJ: ['tajik', 'tajikistan'],
  TM: ['turkmen', 'turkmenistan'],
  // ─ 유럽 ─
  SCT: ['scotland', 'scottish', 'hebrides', 'orkney', 'shetland'],
  WLS: ['wales', 'welsh'],
  GB: ['british', 'english', 'england', 'cornish', 'arthurian', 'manx'],
  IE: ['irish', 'ireland', 'celtic', 'gaelic'],
  FR: ['france', 'french', 'breton', 'gaulish', 'gaul', 'occitan'],
  DE: ['german', 'germany', 'germanic', 'teutonic', 'bavarian'],
  NL: ['dutch', 'netherlands', 'holland', 'frisian'],
  BE: ['belgian', 'belgium', 'flemish', 'walloon'],
  AT: ['austria', 'austrian', 'tyrolean', 'tyrol'],
  CH: ['swiss', 'switzerland'],
  NO: ['norse', 'norway', 'norwegian', 'viking', 'scandinavian', 'sami'],
  SE: ['sweden', 'swedish'],
  DK: ['danish', 'denmark'],
  FI: ['finland', 'finnish', 'kalevala', 'karelian'],
  IS: ['iceland', 'icelandic'],
  FO: ['faroese', 'faroe'],
  RO: ['romania', 'romanian', 'transylvania', 'transylvanian', 'dacian'],
  GR: ['greek', 'greece', 'hellenic', 'olympian', 'minoan', 'cretan'],
  RU: ['russia', 'russian', 'slavic', 'slav', 'siberian', 'tatar'],
  PL: ['poland', 'polish'],
  CZ: ['czech', 'bohemian', 'moravian'],
  SK: ['slovak', 'slovakia', 'slovakian'],
  SI: ['slovene', 'slovenia', 'slovenian'],
  RS: ['serbia', 'serbian', 'serb'],
  HR: ['croatia', 'croatian', 'croat'],
  BA: ['bosnia', 'bosnian', 'herzegovina'],
  MK: ['macedonian', 'macedonia'],
  BG: ['bulgaria', 'bulgarian'],
  HU: ['hungary', 'hungarian', 'magyar'],
  IT: ['italy', 'italian', 'roman', 'rome', 'etruscan', 'sicilian', 'sardinian'],
  ES: ['spain', 'spanish', 'iberian', 'basque', 'catalan', 'galician', 'asturian'],
  PT: ['portugal', 'portuguese', 'lusitanian'],
  UA: ['ukraine', 'ukrainian'],
  AL: ['albania', 'albanian'],
  LT: ['lithuania', 'lithuanian', 'baltic'],
  LV: ['latvia', 'latvian'],
  EE: ['estonia', 'estonian'],
  MT: ['malta', 'maltese'],
  CY: ['cyprus', 'cypriot'],
  GL: ['greenland', 'greenlandic'],
  // ─ 아프리카 ─
  MA: ['morocco', 'moroccan', 'berber', 'amazigh'],
  TN: ['tunisia', 'tunisian'],
  DZ: ['algeria', 'algerian', 'kabyle'],
  NG: ['nigeria', 'nigerian', 'yoruba', 'igbo', 'hausa'],
  GH: ['ghana', 'ghanaian', 'akan', 'ashanti'],
  SN: ['senegal', 'senegalese', 'wolof', 'serer'],
  ML: ['mali', 'malian', 'bambara', 'dogon', 'mandinka'],
  CI: ['ivorian', 'ivory coast'],
  CM: ['cameroon', 'cameroonian'],
  BJ: ['benin', 'beninese', 'vodun', 'fon'],
  GN: ['guinean'],
  SL: ['sierra leone', 'sierra leonean'],
  BF: ['burkina faso', 'burkinabe'],
  ET: ['ethiopia', 'ethiopian', 'amharic', 'oromo'],
  KE: ['kenya', 'kenyan', 'kikuyu', 'maasai'],
  TZ: ['tanzania', 'tanzanian', 'swahili', 'zanzibar'],
  UG: ['uganda', 'ugandan'],
  RW: ['rwanda', 'rwandan'],
  MG: ['madagascar', 'malagasy'],
  MZ: ['mozambique', 'mozambican'],
  ZA: ['south africa', 'south african', 'zulu', 'xhosa'],
  ZW: ['zimbabwe', 'zimbabwean', 'shona'],
  BW: ['botswana', 'tswana'],
  NA: ['namibia', 'namibian'],
  CD: ['congo', 'congolese'],
  AO: ['angola', 'angolan'],
  SD: ['sudan', 'sudanese', 'nubian'],
  ZM: ['zambia', 'zambian'],
  SO: ['somalia', 'somali'],
  MU: ['mauritius', 'mauritian'],
  // ─ 아메리카 (라틴 → 북미 순서: 동점 시 구체적 문화권 우선) ─
  MX: ['mexico', 'mexican', 'aztec', 'maya', 'mayan', 'nahuatl', 'nahua', 'mesoamerican'],
  GT: ['guatemala', 'guatemalan'],
  HN: ['honduras', 'honduran'],
  SV: ['el salvador', 'salvadoran'],
  CR: ['costa rica', 'costa rican'],
  PA: ['panama', 'panamanian'],
  CU: ['cuba', 'cuban', 'santeria'],
  HT: ['haiti', 'haitian', 'vodou', 'voodoo'],
  JM: ['jamaica', 'jamaican'],
  DO: ['dominican republic', 'dominican'],
  TT: ['trinidad', 'tobago', 'trinidadian'],
  PR: ['puerto rico', 'puerto rican', 'taino'],
  NI: ['nicaragua', 'nicaraguan'],
  BZ: ['belize', 'belizean'],
  BR: ['brazil', 'brazilian', 'tupi', 'amazonian'],
  AR: ['argentina', 'argentine', 'argentinian'],
  CO: ['colombia', 'colombian', 'muisca'],
  PE: ['peru', 'peruvian', 'inca', 'incan', 'quechua', 'andean'],
  CL: ['chile', 'chilean', 'mapuche', 'chilote'],
  VE: ['venezuela', 'venezuelan'],
  EC: ['ecuador', 'ecuadorian'],
  BO: ['bolivia', 'bolivian', 'aymara'],
  PY: ['paraguay', 'paraguayan', 'guarani'],
  UY: ['uruguay', 'uruguayan'],
  GY: ['guyana', 'guyanese'],
  SR: ['suriname', 'surinamese'],
  CA: ['canada', 'canadian', 'inuit', 'ojibwe', 'cree', 'first nations'],
  US: ['american', 'united states', 'native american', 'navajo', 'cherokee', 'iroquois', 'algonquin', 'algonquian', 'hopi', 'lakota', 'sioux', 'apache', 'hawaii', 'hawaiian', 'appalachian'],
  // ─ 오세아니아 ─
  AU: ['australia', 'australian', 'aboriginal', 'dreamtime'],
  NZ: ['maori', 'new zealand'],
  PG: ['papua new guinea', 'new guinea', 'papua', 'papuan', 'melanesian'],
  FJ: ['fiji', 'fijian'],
  WS: ['samoa', 'samoan'],
  TO: ['tonga', 'tongan'],
  VU: ['vanuatu'],
  SB: ['solomon islands'],
};

// 한국어 위키 기사 본문 판정용 CJK 키워드 (ko-wiki _MULTI 카테고리 대응)
const COUNTRY_KEYWORDS_CJK = {
  KR: ['한국', '대한민국', '한반도', '제주도'],
  JP: ['일본'],
  CN: ['중국'],
  TW: ['대만'],
  VN: ['베트남'],
  TH: ['태국'],
  IN: ['인도의', '인도에서'],
  US: ['미국'],
  GB: ['영국'],
  FR: ['프랑스'],
  DE: ['독일'],
  RU: ['러시아'],
  MX: ['멕시코'],
};
for (const [iso, kws] of Object.entries(COUNTRY_KEYWORDS_CJK)) {
  COUNTRY_KEYWORDS[iso] = [...(COUNTRY_KEYWORDS[iso] || []), ...kws];
}

// 키워드를 단어 경계 정규식으로 사전 컴파일 ('roman'이 'romanian'에 걸리는 오매칭 방지)
// CJK 키워드는 \b가 동작하지 않으므로 경계 없이 매칭
const COUNTRY_PATTERNS = Object.entries(COUNTRY_KEYWORDS).map(([iso, kws]) => ({
  iso,
  patterns: kws.map(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return /[^\x00-\x7F]/.test(kw) ? new RegExp(escaped) : new RegExp(`\\b${escaped}\\b`);
  }),
}));

// 국가별 매칭 점수 (0점 국가는 생략)
function countryScores(text) {
  if (!text) return {};
  // 대륙 수식어 제거 — 'South American folklore'가 US 'american'에 오매칭되는 것 방지
  const cleaned = text.toLowerCase()
    .replace(/\b(south|latin|central|north)\s+america(?:n|s)?\b/g, ' ');
  const scores = {};
  for (const { iso, patterns } of COUNTRY_PATTERNS) {
    let score = 0;
    for (const p of patterns) {
      if (p.test(cleaned)) score++;
    }
    if (score > 0) scores[iso] = score;
  }
  return scores;
}

function guessCountryFromText(text) {
  const scores = countryScores(text);
  let best = null;
  let bestScore = 0;
  for (const [iso, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = iso; }
  }
  return best;
}

// ═══════════════════════════════════════════════════════════════
//  Wikipedia API 호출
// ═══════════════════════════════════════════════════════════════
let apiCallCount = 0;
const MAX_API_CALLS = parseInt(process.env.CRAWL_MAX_API || '80', 10);

async function fetchJSON(url) {
  if (apiCallCount >= MAX_API_CALLS) return null;
  apiCallCount++;
  // 호출량 증가에 따른 예의상 딜레이
  await new Promise(r => setTimeout(r, 120));
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

// 서브카테고리까지 1단계 재귀로 탐색 (위키 페이지 풀 확장)
async function fetchCategoryMembersDeep(lang, cat, limit = 50, maxSubcats = 3) {
  // 1) 본 카테고리의 페이지 + 서브카테고리 동시 조회
  const url = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}` +
    `&cmlimit=${limit}&cmtype=page|subcat&format=json&origin=*`;
  const data = await fetchJSON(url);
  const members = data?.query?.categorymembers || [];

  const pages = members.filter(m => m.ns === 0);
  const subcats = members.filter(m => m.ns === 14).slice(0, maxSubcats);

  // 2) 각 서브카테고리에서 페이지만 추가 수집
  for (const subcat of subcats) {
    if (apiCallCount >= MAX_API_CALLS - 5) break; // API 예산 보호
    const subPages = await fetchCategoryMembers(lang, subcat.title, limit);
    pages.push(...subPages);
  }

  // 3) pageid 기준 dedup
  const seen = new Set();
  return pages.filter(p => {
    if (seen.has(p.pageid)) return false;
    seen.add(p.pageid);
    return true;
  });
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
  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    state = {};
  }
  // 누락 필드 기본값 주입 (마이그레이션)
  return {
    lastCategoryIndex: 0,
    processedPageIds: [],
    discoveredCategories: [],  // [{lang, cat, iso, label, discoveredFrom, discoveredAt}]
    totalAdded: 0,
    runs: 0,
    lastRun: null,
    ...state,
  };
}

function saveState(state) {
  // 처리된 페이지 ID는 최근 8000개만 유지 (무한 증가 방지)
  if (state.processedPageIds.length > 8000) {
    state.processedPageIds = state.processedPageIds.slice(-8000);
  }
  // 발굴된 카테고리는 최근 3000개까지 유지 (이후 가장 오래된 것부터 폐기)
  if (state.discoveredCategories.length > 3000) {
    state.discoveredCategories = state.discoveredCategories.slice(-3000);
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════
//  자가 발굴: 기사가 속한 카테고리에서 새 시드 추출
// ═══════════════════════════════════════════════════════════════
const SEED_CATEGORY_KEYS = new Set(
  CATEGORY_COUNTRY_MAP.map(c => `${c.lang}|${c.cat}`)
);

// 카테고리 제목이 설화/신화 관련인지 (휴리스틱)
function isFolkloreRelatedCategory(catTitle) {
  // 메타/위키 운영 카테고리 제외
  if (/^(Category|분류):(Articles|Wikipedia|All|Pages|Stubs?|CS1|Use\s|Webarchive|Wikidata)/i.test(catTitle)) return false;
  if (/disambiguation|stub|cleanup|redirect|template/i.test(catTitle)) return false;
  if (/^(Category|분류):.+lists?$/i.test(catTitle)) return false;

  // 설화 관련 키워드
  return /folklore|mytholog|legendary|legend|creature|spirit|demon|deity|god(?:dess)?|mythical|cryptid|monster|shaman|supernatural|fairy|witch|vampire|ghost|undead|hero|yokai|yōkai|요괴|신화|전설|민담|괴물|정령|신앙|민속|설화/i.test(catTitle);
}

function discoverCategoriesFromArticle(article, sourceIso, state, knownKeys) {
  if (!article?.categories) return 0;
  const lang = article.lang || 'en';
  let added = 0;

  for (const catTitle of article.categories) {
    if (!isFolkloreRelatedCategory(catTitle)) continue;
    const key = `${lang}|${catTitle}`;
    if (knownKeys.has(key)) continue;

    // ISO 추정: 카테고리 제목에서 국가 키워드 매칭 → 실패 시 _MULTI
    // (source 기사 ISO 상속은 'Dutch folklore'→AL 같은 오배정을 낳아 폐기.
    //  _MULTI는 크리처 추가 시점에 기사 본문으로 재추정하므로 안전)
    const guessed = guessCountryFromText(catTitle);
    const iso = guessed || '_MULTI';

    state.discoveredCategories.push({
      lang,
      cat: catTitle,
      iso,
      label: catTitle.replace(/^(Category|분류):/, '').replace(/_/g, ' '),
      discoveredFrom: article.title,
      discoveredAt: state.runs,
    });
    knownKeys.add(key);
    added++;
  }
  return added;
}

// ═══════════════════════════════════════════════════════════════
//  기사 → 크리처 빌더 (크롤러·발굴 스크립트 공용)
// ═══════════════════════════════════════════════════════════════
function buildCreatureFromArticle(article, iso, lang, label) {
  const koName = generateKoreanName(article);
  const enName = lang === 'ko'
    ? ((article.langlinks || []).find(l => l.lang === 'en')?.['*'] || article.title)
    : article.title;
  const type = guessType(article.title, article.extract);
  const fear = guessFear(type, article.extract);
  const abilities = guessAbilities(article.extract);
  const weaknesses = guessWeaknesses(article.extract);
  const visualKw = guessVisualKeywords(article.title, type, article.extract);
  const ct = autoClassify(type, article.extract);
  const desc = generateKoreanDescription(article, type, iso);
  const srcLabel = lang === 'ko' ? '위키백과' : `Wikipedia (${label})`;
  return mk(iso, enName, koName, type, fear, desc, abilities, weaknesses, visualKw, srcLabel, ct);
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
  // 한국어 미디어 기사 (드라마/방송 에피소드 목록 등 — '전설의 고향 - 1996년' 류)
  if (/방영|드라마|시리즈|영화화|애니메이션/.test(text) && /KBS|MBC|SBS|tvN|채널/.test(text)) return false;
  // 존재(being)가 아닌 것들: 인물·천체·조형물·서적·식물·유사과학 등
  if (/\b(asteroid|obelisk|statue|sculpture|monument|fountain|novelist|author|writer|historian|essayist|non-?fiction|pseudoscien|proverb|execution method|ekadashi|cultivar)\b/.test(text)) return false;
  if (/소설가|作家|평론가|저술가|천문학|소행성|기념비|조각상|출판사|단행본/.test(text)) return false;
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

  // ── 카테고리 풀: 시드 + 자가 발굴 카테고리 ──
  const allCats = [...CATEGORY_COUNTRY_MAP, ...state.discoveredCategories];
  const totalCats = allCats.length;
  const batchSize = 6;

  // 시드 / 발굴 카테고리 혼합 선택 (시드 3 + 발굴 3, 발굴 풀이 비었으면 시드만)
  const seedSize = CATEGORY_COUNTRY_MAP.length;
  const discoveredSize = state.discoveredCategories.length;
  const seedSlots = discoveredSize > 0 ? 3 : 6;
  const discoveredSlots = batchSize - seedSlots;

  // CRAWL_SEED_START: 특정 시드부터 강제 시작 (일회성 수확용 — 로테이션 위치는 보존)
  const seedOverride = process.env.CRAWL_SEED_START;
  const seedStart = seedOverride !== undefined
    ? parseInt(seedOverride, 10) % seedSize
    : state.lastCategoryIndex % seedSize;
  const discoveredStart = (state.lastDiscoveredIndex || 0) % Math.max(discoveredSize, 1);
  const selectedCats = [];
  for (let i = 0; i < seedSlots; i++) {
    selectedCats.push(CATEGORY_COUNTRY_MAP[(seedStart + i) % seedSize]);
  }
  for (let i = 0; i < discoveredSlots && discoveredSize > 0; i++) {
    selectedCats.push(state.discoveredCategories[(discoveredStart + i) % discoveredSize]);
  }
  if (seedOverride === undefined) {
    state.lastCategoryIndex = (seedStart + seedSlots) % seedSize;
  }
  if (discoveredSize > 0) {
    state.lastDiscoveredIndex = (discoveredStart + discoveredSlots) % discoveredSize;
  }

  console.log(`\n📂 이번 크롤 카테고리 (시드:${seedStart}, 발굴:${discoveredStart}, 발굴풀:${discoveredSize}):`);
  selectedCats.forEach((c, i) => {
    const tag = i < seedSlots ? '시드' : '발굴';
    console.log(`   - [${tag}][${c.iso}] ${c.label} (${c.lang})`);
  });

  // ── 자가 발굴용: 알려진 카테고리 키 집합 ──
  const knownCatKeys = new Set(SEED_CATEGORY_KEYS);
  for (const c of state.discoveredCategories) knownCatKeys.add(`${c.lang}|${c.cat}`);

  // ── 각 카테고리에서 기사 수집 ──
  const MAX_NEW = parseInt(process.env.CRAWL_MAX_NEW || '15', 10);
  let added = 0;
  let newCatsFound = 0;
  const addedIds = []; // IndexNow 제출용 — 이번 실행에서 추가된 크리처 id
  const processedIds = new Set(state.processedPageIds);

  for (const catDef of selectedCats) {
    if (added >= MAX_NEW) break;
    if (apiCallCount >= MAX_API_CALLS) break;

    console.log(`\n🔍 [${catDef.iso}] ${catDef.label} 크롤 중...`);
    const members = await fetchCategoryMembersDeep(catDef.lang, catDef.cat, 50, 3);

    if (members.length === 0) {
      console.log('   ⚠️ 카테고리에서 기사를 찾지 못함');
      continue;
    }
    console.log(`   📄 ${members.length}개 기사 발견 (서브카테고리 포함)`);

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

      // 상세 정보 가져오기 (성공해야만 영구 블랙리스트에 추가)
      const article = await fetchArticleDetail(catDef.lang, member.title);
      if (!article) {
        console.log(`   ⏭️ ${member.title} — 상세 정보 없음 (재시도 가능)`);
        continue;
      }

      // 영구 블랙리스트는 fetch 성공 후에만 기록 (transient 실패 보호)
      processedIds.add(member.pageid);
      state.processedPageIds.push(member.pageid);

      // 자가 발굴: 이 기사가 속한 카테고리에서 새 시드 추출
      article.lang = catDef.lang;
      const discovered = discoverCategoriesFromArticle(article, catDef.iso, state, knownCatKeys);
      newCatsFound += discovered;

      // 크리처 관련 기사인지 필터
      if (!isCreatureArticle(article)) {
        console.log(`   ⏭️ ${member.title} — 크리처 관련 아님`);
        continue;
      }

      // 크리처 생성 (공용 빌더 — discover 스크립트에서도 재사용)
      const creature = buildCreatureFromArticle(article, catDef.iso, catDef.lang, catDef.label);

      // 중복 체크
      if (isDuplicate(creature, data, state)) {
        console.log(`   ⏭️ ${creature.n}(${creature.ln}) — 중복, 스킵`);
        continue;
      }

      // 해당 국가 찾기 (_MULTI 카테고리는 본문에서 추정)
      let targetIso = catDef.iso;
      if (targetIso === '_MULTI') {
        const guessed = guessCountryFromText(article.extract);
        if (!guessed) {
          console.log(`   ⏭️ ${creature.n}(${creature.ln}) — 국가 추정 불가, 스킵`);
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
        // id 재작성 후 재검사 — 최초 isDuplicate는 옛 id로 실행됐으므로
        // 재배정된 id가 대상 국가의 기존 크리처와 충돌할 수 있음 (예: Black Shuck 중복)
        if (isDuplicate(creature, data, state)) {
          console.log(`   ⏭️ ${creature.n}(${creature.ln}) — 국가 재배정 후 중복, 스킵`);
          continue;
        }
      }

      country.b.push(creature);
      added++;
      addedIds.push(creature.id);
      console.log(`   ✅ 추가: ${creature.n}(${creature.ln}) [${creature.t}, 공포:${creature.f}, ${creature.ct}]`);
    }
  }

  // ── 결과 저장 (실제 추가됐을 때만) ──
  if (added > 0) {
    saveData(data);
    console.log(`\n💾 데이터 저장 완료`);

    // IndexNow 제출용 신규 id 목록 (워크플로우의 후속 단계에서 사용, 커밋 안 함)
    fs.writeFileSync(
      path.join(process.cwd(), 'scripts', '.last-added.json'),
      JSON.stringify(addedIds), 'utf8'
    );

    // LAST_UPDATED 타임스탬프는 실제 추가된 경우에만 갱신 (빈 커밋 방지)
    const fmPath = path.join(process.cwd(), 'components', 'FolkloreMap.jsx');
    let fmContent = fs.readFileSync(fmPath, 'utf8');
    fmContent = fmContent.replace(
      /const LAST_UPDATED = "[^"]*";/,
      `const LAST_UPDATED = "${new Date().toISOString()}";`
    );
    fs.writeFileSync(fmPath, fmContent, 'utf8');
    console.log(`🕐 LAST_UPDATED 갱신: ${new Date().toISOString()}`);
  } else {
    console.log(`\n⏸️  변경 없음 — 커밋 스킵`);
  }

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
  console.log(`║  새 카테고리 발굴: +${newCatsFound}개 (누적 발굴: ${state.discoveredCategories.length}개)`);
  console.log(`║  API 호출: ${apiCallCount}/${MAX_API_CALLS}`);
  console.log(`║  누적 추가: ${state.totalAdded}개 (${state.runs}회 실행)`);
  console.log(`║  다음 시드: ${CATEGORY_COUNTRY_MAP[state.lastCategoryIndex]?.label || '처음부터'}`);
  console.log('╚══════════════════════════════════════════════════╝');

  // GitHub Actions에서 변경 여부 판단용 종료 코드
  // 추가된 크리처가 없으면 종료 코드 0 (정상), 있어도 0 (커밋은 workflow에서 처리)
  process.exit(0);
}

// 직접 실행 시에만 main() 구동 — 다른 스크립트에서 import하면 함수만 노출
const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectRun) {
  main().catch(err => {
    console.error('❌ 크롤링 실패:', err);
    process.exit(1);
  });
}

export {
  guessCountryFromText, countryScores, COUNTRY_KEYWORDS, isFolkloreRelatedCategory,
  buildCreatureFromArticle, fetchArticleDetail, isCreatureArticle, isDuplicate,
  loadData, saveData, mk,
};
