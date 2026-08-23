#!/usr/bin/env node
// ============================================================
// 잘린 설명(d) 복구 — 2단계: 적용
//
// 1단계(repair-truncated-desc.mjs)가 남긴 런로그를 읽어
// 크롤러와 동일한 clipExtract()로 다시 자른 뒤 데이터에 반영한다.
//
// id 기반 목록 적용이라 봇이 그 사이 종을 추가/삭제해도 안전하다
// (없어진 id는 건너뛰고 런로그에 남긴다).
//
// 파생물 동기화:
//   i18n creatures-{ko,zh,ja}.json 중 값이 정본 d와 '동일'했던 항목만
//   새 정본 d로 함께 갱신한다. 그 항목들은 번역이 아니라 영문 원문이
//   그대로 복사된 것이라 무손실이다.
//   실제로 번역된 항목은 건드리지 않는다 — 재번역은 OpenAI 크레딧이
//   드는 별도 작업이며 translate-creatures.mjs는 기존 번역이 있으면
//   건너뛴다(:185). 그쪽은 감독 승인 후 별도로 처리한다.
//
// 사용법:
//   node scripts/apply-desc-repair.mjs --dry     (변경 미리보기)
//   node scripts/apply-desc-repair.mjs           (실제 적용)
// ============================================================

import fs from 'fs';
import path from 'path';
import { clipExtract } from './crawl-wikipedia-folklore.mjs';

const ROOT = process.cwd();
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', 'desc-repair-20260822.jsonl');
const APPLYLOG = path.join(ROOT, 'scripts', 'runlogs', 'desc-repair-apply-20260822.jsonl');
const DATA_PATH = path.join(ROOT, 'lib', 'folklore-data.ts');
const DRY = process.argv.includes('--dry');

const MARKER = 'export const FOLKLORE_DATA: CountryData[] = ';

function loadRaw() {
  const src = fs.readFileSync(DATA_PATH, 'utf8');
  const idx = src.indexOf(MARKER);
  if (idx < 0) throw new Error('FOLKLORE_DATA 마커를 찾을 수 없다');
  const start = idx + MARKER.length;
  let end = src.indexOf('\n', start);
  if (end < 0) end = src.length;
  let body = src.slice(start, end).trim();
  if (body.endsWith(';')) body = body.slice(0, -1);
  return { src, start, end, data: JSON.parse(body) };
}

// weak 매칭 + 검색 폴백 조합은 제외한다.
// 97건을 육안 검증한 결과 오매칭이 딱 이 조합에서 나왔다 —
//   Grani(시구르드의 '말')에 Sigurd(영웅) 문서를,
//   Decima(로마 파르카이)에 Moirai(그리스 운명의 세 여신) 문서를 가져왔다.
// 제목 직접 조회는 weak여도 안전했고(같은 문서가 편집된 경우), prefix가
// 완전일치하는 strong은 검색 폴백이어도 안전하다. 이 조합만 버린다.
// 버려지는 5건 중 3건은 실제로 옳은 매칭이지만, 그쪽 손실은 '현상 유지'일
// 뿐이고 오매칭은 잘못된 설명이 박히므로 이 교환이 맞다.
const allRecords = fs.readFileSync(RUNLOG, 'utf8').trim().split('\n')
  .filter(Boolean).map(l => JSON.parse(l)).filter(r => r.extract);
const isRisky = r => r.match && r.match.startsWith('weak') && /^search\//.test(r.src || '');
const excluded = allRecords.filter(isRisky);
const records = allRecords.filter(r => !isRisky(r));
if (excluded.length) console.log(`제외(weak+검색폴백): ${excluded.length}건 — ${excluded.map(r => r.n).join(', ')}`);

const byId = new Map(records.map(r => [r.id, r]));
console.log(`런로그 수집 성공분: ${records.length}건`);

const { src, start, end, data } = loadRaw();

let applied = 0, skippedSame = 0, notFound = 0, changedIds = new Map();
for (const country of data) {
  for (const c of country.b) {
    const r = byId.get(c.id);
    if (!r) continue;
    // 런로그 기록 시점의 설명과 지금이 다르면 (봇이 이미 갱신) 건드리지 않는다
    if (c.d !== r.oldD) { skippedSame++; continue; }
    const clipped = clipExtract(r.extract, r.max);
    const newD = (r.prefix || '') + clipped;
    if (newD === c.d) { skippedSame++; continue; }
    changedIds.set(c.id, { old: c.d, neu: newD, match: r.match, src: r.src });
    c.d = newD;
    applied++;
  }
}
for (const id of byId.keys()) {
  if (!changedIds.has(id)) notFound++;
}

console.log(`적용 대상: ${applied}건 / 변경 불필요·불일치: ${skippedSame}건 / 데이터에 없거나 미변경: ${notFound}건`);

if (applied) {
  const samples = [...changedIds.entries()].slice(0, 5);
  console.log('\n--- 변경 샘플 ---');
  for (const [id, v] of samples) {
    console.log(`[${id}] (${v.match})`);
    console.log(`  전: …${v.old.slice(-70)}`);
    console.log(`  후: …${v.neu.slice(-70)}`);
  }
}

if (DRY) { console.log('\n--dry 이므로 파일을 쓰지 않았다.'); process.exit(0); }
if (!applied) { console.log('변경 없음.'); process.exit(0); }

// ── 정본 기록 (한 줄 JSON 유지) ──
const newBody = JSON.stringify(data) + ';';
const newSrc = src.slice(0, start) + newBody + src.slice(end);
fs.writeFileSync(DATA_PATH, newSrc);

// ── 파생물: '정본과 동일했던' 번역만 동기화 ──
const i18nStats = {};
for (const lg of ['ko', 'zh', 'ja']) {
  const p = path.join(ROOT, 'public', 'i18n', `creatures-${lg}.json`);
  if (!fs.existsSync(p)) continue;
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const [id, v] of changedIds) {
    if (t[id] && t[id].d === v.old) { t[id].d = v.neu; n++; }
  }
  if (n) fs.writeFileSync(p, JSON.stringify(t, null, 0));
  i18nStats[lg] = n;
}
console.log('i18n 동기화(영문 복사분만):', JSON.stringify(i18nStats));

// ── 적용 런로그 ──
fs.mkdirSync(path.dirname(APPLYLOG), { recursive: true });
const ts = new Date().toISOString();
const out = [...changedIds.entries()].map(([id, v]) =>
  JSON.stringify({ id, oldD: v.old, newD: v.neu, match: v.match, src: v.src, ts }));
fs.writeFileSync(APPLYLOG, out.join('\n') + '\n');
console.log(`적용 런로그: ${APPLYLOG}`);
console.log(`\n완료: ${applied}건 반영.`);
