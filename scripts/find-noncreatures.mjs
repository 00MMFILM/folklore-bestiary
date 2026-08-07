#!/usr/bin/env node
// ============================================================
// 비생물(도감 부적합) 후보 스캔 — 리포트만, 데이터 변경 없음
// 대상: 실존 인물 / 풍습·의례·개념 / 장소 / 사물
// 주의: 신화적 인물(단군·헤라클레스류 Deity/Hero)은 도감 범위 안이므로
//       "실존·역사적" 신호가 있을 때만 인물로 플래그
// 사용법: node scripts/find-noncreatures.mjs
// ============================================================

import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'lib', 'folklore-data.ts');
const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

function findDataRange(content) {
  const startIdx = content.indexOf(MARKER) + MARKER.length;
  let depth = 0, endIdx = startIdx, inString = false, escape = false;
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

const content = fs.readFileSync(DATA_PATH, 'utf8');
const { startIdx, endIdx } = findDataRange(content);
const data = JSON.parse(content.substring(startIdx, endIdx));

// 카테고리별 검출 규칙 — 설명(d) 첫 문장 위주의 보수적 패턴
const RULES = [
  {
    cat: 'historical-person',
    label: '실존/역사 인물',
    re: /\b(historical (figure|person|king|ruler)|was a (\d+(st|nd|rd|th)[- ]century|medieval|roman|romano-british|anglo-saxon) (king|ruler|queen|prince|bishop|saint|monk|abbot|poet|chronicler|historian|warrior|leader|nobleman)|(king|queen|ruler|bishop|saint|abbot) of [A-Z][a-z]+ (from|between|in) (ad|\d)|reigned (from|between|c\.)|\(r\.\s*\d|(born|died) (c\.\s*)?(ad\s*)?\d{3,4}\b|\b(ad|circa) \d{3,4}[),.\s].{0,40}\b(king|ruler|saint|bishop))/i,
  },
  {
    cat: 'practice-concept',
    label: '풍습·의례·개념',
    re: /\b(is a (traditional |folk |religious )?(practice|ritual|ceremony|festival|custom|dance|holiday|celebration|divination)|refers to (a|the) (practice|custom|ritual|concept|belief system)|is (a|the) (concept|term|word) (of|for|used)|is an? (annual|seasonal) (event|festival))/i,
  },
  {
    cat: 'place',
    label: '장소',
    re: /\bis a (small |large |sacred )?(village|town|city|mountain|hill|lake|river|cave|island|forest|valley|region|castle|ruin|archaeological site|rock formation)\b/i,
  },
  {
    cat: 'object',
    label: '사물',
    re: /\bis a (legendary |magical |sacred )?(sword|stone|bell|mirror|book|manuscript|painting|statue|artifact|relic|crown|jewel)\b/i,
  },
];

const flags = [];
for (const country of data) {
  for (const b of country.b) {
    const text = `${b.n}. ${b.d || ''}`;
    for (const rule of RULES) {
      const m = rule.re.exec(text);
      if (m) {
        flags.push({
          cat: rule.cat, iso: country.i, id: b.id, name: b.n, type: b.t,
          evidence: m[0], desc: (b.d || '').slice(0, 160),
        });
        break; // 첫 매칭 카테고리만
      }
    }
  }
}

const byCat = {};
for (const f of flags) (byCat[f.cat] ||= []).push(f);

const total = data.reduce((s, c) => s + c.b.length, 0);
console.log(`🔎 스캔: ${total}마리 → 비생물 후보 ${flags.length}건\n`);
for (const rule of RULES) {
  const list = byCat[rule.cat] || [];
  console.log(`── ${rule.label}: ${list.length}건 ──`);
  list.slice(0, 15).forEach(f => console.log(`   [${f.iso}] ${f.name} (${f.type}) — "${f.evidence}"`));
  if (list.length > 15) console.log(`   ... 외 ${list.length - 15}건`);
  console.log('');
}

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'noncreature-report.json'),
  JSON.stringify({ scannedAt: new Date().toISOString(), total, flags }, null, 2)
);
console.log('📄 scripts/noncreature-report.json 저장 (데이터 변경 없음)');
