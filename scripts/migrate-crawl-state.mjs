#!/usr/bin/env node
// ============================================================
// 일회성 마이그레이션: crawl-state.json 정리
// 1) 발굴 카테고리 ISO 재분류 — 확장된 COUNTRY_KEYWORDS + 단어 경계
//    매칭으로 재추정. 추정 불가 시 _MULTI (source 상속 오배정 제거)
// 2) 레거시 블랙리스트 해제 — 버그 시절(fetch 실패도 영구 기록)
//    쌓인 pageId 제거 → 정상 로테이션에서 재시도됨
// 사용법: node scripts/migrate-crawl-state.mjs [legacy-ids.json]
// ============================================================

import fs from 'fs';
import path from 'path';
import { guessCountryFromText } from './crawl-wikipedia-folklore.mjs';

const STATE_PATH = path.join(process.cwd(), 'scripts', 'crawl-state.json');
const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

// ── 1) 발굴 카테고리 ISO 재분류 ──
let changed = 0;
const changes = {};
for (const cat of state.discoveredCategories || []) {
  const title = cat.label || cat.cat || '';
  const guessed = guessCountryFromText(title);
  const newIso = guessed || '_MULTI';
  if (cat.iso !== newIso) {
    const key = `${cat.iso}→${newIso}`;
    changes[key] = (changes[key] || 0) + 1;
    cat.iso = newIso;
    changed++;
  }
}
console.log(`📂 발굴 카테고리 ${state.discoveredCategories.length}개 중 ${changed}개 ISO 재분류`);
const sorted = Object.entries(changes).sort((a, b) => b[1] - a[1]);
for (const [k, v] of sorted.slice(0, 25)) console.log(`   ${k}: ${v}개`);
if (sorted.length > 25) console.log(`   ... 외 ${sorted.length - 25}종`);

// ── 2) 레거시 블랙리스트 해제 ──
const legacyPath = process.argv[2];
if (legacyPath && fs.existsSync(legacyPath)) {
  const legacyIds = new Set(JSON.parse(fs.readFileSync(legacyPath, 'utf8')));
  const before = state.processedPageIds.length;
  state.processedPageIds = state.processedPageIds.filter(id => !legacyIds.has(id));
  console.log(`🔓 레거시 블랙리스트 해제: ${before} → ${state.processedPageIds.length} (-${before - state.processedPageIds.length})`);
} else {
  console.log('ℹ️ 레거시 ID 파일 미지정 — 블랙리스트 해제 스킵');
}

fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
console.log('💾 crawl-state.json 저장 완료');
