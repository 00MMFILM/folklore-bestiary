#!/usr/bin/env node
// ============================================================
// 재번역 대상 무효화
//
// 정본 d가 복구된 항목(desc-repair-apply 런로그)의 i18n 엔트리를 지운다.
// translate-creatures.mjs 는 `if (result[c.id]) continue`(:185)로
// 기존 번역이 있으면 건너뛰기 때문에, 지워야 다시 번역한다.
//
// 이미 새 정본 d와 값이 같은 항목(영문이 복사돼 있던 것)은 건드리지 않는다.
//
// 사용법:
//   node scripts/invalidate-translations.mjs --locale ko [--limit 20] [--dry]
// ============================================================

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const APPLYLOG = path.join(ROOT, 'scripts', 'runlogs', 'desc-repair-apply-20260822.jsonl');
const RUNLOG = path.join(ROOT, 'scripts', 'runlogs', 'retranslate-20260823.jsonl');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const arg = k => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const locales = arg('--locale') ? [arg('--locale')] : ['ko', 'zh', 'ja'];
const limit = arg('--limit') ? parseInt(arg('--limit'), 10) : Infinity;

const applied = fs.readFileSync(APPLYLOG, 'utf8').trim().split('\n')
  .filter(Boolean).map(l => JSON.parse(l));

const stamp = new Date().toISOString();
for (const lg of locales) {
  const p = path.join(ROOT, 'public', 'i18n', `creatures-${lg}.json`);
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  const targets = [];
  for (const r of applied) {
    const v = t[r.id];
    if (!v) continue;
    if (v.d === r.newD) continue;          // 이미 새 정본과 동일 (영문 복사분)
    targets.push(r.id);
    if (targets.length >= limit) break;
  }
  console.log(`${lg}: 무효화 대상 ${targets.length}건`);
  if (DRY) continue;
  for (const id of targets) delete t[id];
  fs.writeFileSync(p, JSON.stringify(t, null, 0));
  fs.mkdirSync(path.dirname(RUNLOG), { recursive: true });
  fs.appendFileSync(RUNLOG, targets.map(id =>
    JSON.stringify({ act: 'invalidate', locale: lg, id, ts: stamp })).join('\n') + '\n');
}
console.log(DRY ? '--dry: 파일 미변경' : `런로그: ${RUNLOG}`);
