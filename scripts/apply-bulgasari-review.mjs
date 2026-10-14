import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
assert.ok(args.every(a => ['--dry', '--apply'].includes(a)) && args.length <= 1, 'use --dry (default) or --apply');
const apply = args.includes('--apply');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const review = JSON.parse(read('content/reviews/bulgasari-20261014.json'));
const ids = new Set(review.ids);
assert.equal(ids.size, 3);
const canonicalFile = 'lib/folklore-data.ts';
const marker = 'export const FOLKLORE_DATA: CountryData[] = ';
function parseCanonical(text) {
  assert.equal(text.split(marker).length, 2, 'canonical marker must be unique');
  const start = text.indexOf(marker) + marker.length;
  const end = text.indexOf('\n', start);
  assert.ok(end > start);
  const suffix = text.slice(start, end).match(/;?\s*$/)[0];
  return { start, end, suffix, data: JSON.parse(text.slice(start, end).replace(/;\s*$/, '')) };
}
function treeDigest(directory, exclude = () => false) {
  const entries = [];
  function visit(relative) {
    for (const item of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = `${relative}/${item.name}`;
      if (item.isDirectory()) visit(file);
      else if (!exclude(file)) entries.push([file, hash(fs.readFileSync(path.join(root, file)))]);
    }
  }
  visit(directory);
  return { files: entries.length, sha256: hash(JSON.stringify(entries)) };
}
function snapshot() {
  const text = read(canonicalFile);
  const { start, end, data } = parseCanonical(text);
  const all = data.flatMap(country => country.b);
  assert.equal(new Set(all.map(c => c.id)).size, all.length, 'unique IDs');
  for (const creature of all) for (const field of ['n', 't', 'f', 'd', 'id']) assert.ok(creature[field] !== undefined, `missing ${field}`);
  for (const id of ids) assert.equal(all.filter(c => c.id === id).length, 1, `missing or duplicate ${id}`);
  const i18n = {};
  for (const locale of ['ko', 'ja', 'zh']) {
    const translated = JSON.parse(read(`public/i18n/creatures-${locale}.json`));
    assert.deepEqual(Object.keys(translated).sort(), all.map(c => c.id).sort(), `${locale}: IDs must match canonical`);
    i18n[locale] = { count: Object.keys(translated).length, nonTargets: hash(JSON.stringify(Object.fromEntries(Object.entries(translated).filter(([id]) => !ids.has(id))))) };
  }
  const imageLine = text.split('\n').find(s => s.startsWith('export const CREATURE_IMAGE_MAP:'));
  assert.ok(imageLine, 'image map exists');
  const imageMap = JSON.parse(imageLine.slice(imageLine.indexOf('= ') + 2).replace(/;\s*$/, ''));
  return {
    countries: data.length, creatures: all.length, types: [...new Set(all.map(c => c.t))].sort(),
    scores: Object.fromEntries(all.filter(c => ids.has(c.id)).map(c => [c.id, c.f])),
    nonTargets: hash(JSON.stringify(data.map(c => ({ ...c, b: c.b.filter(b => !ids.has(b.id)) })))),
    canonicalSurroundings: hash(text.slice(0, start) + text.slice(end)),
    imageMap: { count: Object.keys(imageMap).length, sha256: hash(imageLine) },
    images: treeDigest('public/creatures'),
    otherArticles: treeDigest('content/articles', file => ids.has(path.basename(file, '.json'))),
    i18n
  };
}
const before = snapshot();
const originals = new Map();
const writes = new Map();
const changes = [];
function queue(file, oldText, newText) {
  originals.set(file, oldText);
  if (oldText !== newText) writes.set(file, newText);
}
function record(file, id, old, next) {
  if (JSON.stringify(old) !== JSON.stringify(next)) changes.push({ file, id, old, new: next });
}
const canonicalText = read(canonicalFile);
const parsed = parseCanonical(canonicalText);
for (const country of parsed.data) {
  country.b = country.b.map(creature => {
    if (!ids.has(creature.id)) return creature;
    const next = { ...creature, ...review.canonical, src: review.sources.map(s => s.url) };
    assert.equal(next.f, creature.f);
    record(canonicalFile, creature.id, creature, next);
    return next;
  });
}
queue(canonicalFile, canonicalText, canonicalText.slice(0, parsed.start) + JSON.stringify(parsed.data) + parsed.suffix + canonicalText.slice(parsed.end));
for (const locale of ['ko', 'ja', 'zh']) {
  const file = `public/i18n/creatures-${locale}.json`;
  const oldText = read(file);
  const translated = JSON.parse(oldText);
  for (const id of ids) {
    const next = { ...translated[id], ...review.translations[locale] };
    record(file, id, translated[id], next);
    translated[id] = next;
  }
  const indent = oldText.includes('\n') ? 2 : undefined;
  queue(file, oldText, JSON.stringify(translated, null, indent) + (oldText.endsWith('\n') ? '\n' : ''));
}
const article = {
  sourceTitle: '불가사리 / 불가사리 설화', sourceLang: 'ko', factBased: true,
  sources: review.sources, researchNotes: review.researchNotes,
  reviewedAt: review.reviewedAt, locales: review.articleLocales
};
for (const id of ids) {
  const file = `content/articles/${id}.json`;
  const oldText = fs.existsSync(path.join(root, file)) ? read(file) : null;
  record(file, id, oldText === null ? null : JSON.parse(oldText), article);
  queue(file, oldText, JSON.stringify(article, null, 2) + '\n');
}
if (!changes.length) {
  assert.equal(writes.size, 0, 'no formatting-only mutation');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry', status: 'no-op', preserved: before }));
} else if (!apply) {
  console.log(JSON.stringify({ mode: 'dry', entries: changes.length, files: [...writes.keys()], preserved: before }));
} else {
  // Check the planned inputs once more before any write; never overwrite a concurrent edit.
  for (const [file, oldText] of originals) assert.equal(fs.existsSync(path.join(root, file)) ? read(file) : null, oldText, `changed while planning: ${file}`);
  const timestamp = new Date().toISOString();
  const log = path.join(root, 'scripts/runlogs/bulgasari-review-20261014.jsonl');
  fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.appendFileSync(log, changes.map(change => JSON.stringify({ timestamp, status: 'planned', reason: 'AKS encyclopedia review; distinguish variants and creative hooks', ...change })).join('\n') + '\n');
  for (const [file, text] of writes) fs.writeFileSync(path.join(root, file), text);
  const after = snapshot();
  assert.deepEqual(after, before, 'counts, scores, non-target content and all image bytes must be preserved');
  fs.appendFileSync(log, JSON.stringify({ timestamp, status: 'verified', preserved: after }) + '\n');
  console.log(JSON.stringify({ mode: 'apply', entries: changes.length, files: writes.size, preserved: after }));
}
