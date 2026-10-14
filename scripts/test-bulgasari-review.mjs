import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => fs.readFileSync(root + path, 'utf8');
const ids = ['kr-bulgasari', 'kr-balgasari', 'kr-bulgasari-creature'];
const line = read('lib/folklore-data.ts').split('\n').find(s => s.startsWith('export const FOLKLORE_DATA:'));
const data = JSON.parse(line.slice(line.indexOf('= ') + 2).replace(/;\s*$/, ''));
const all = data.flatMap(country => country.b);
const creatures = ids.map(id => {
  const matches = all.filter(c => c.id === id);
  assert.equal(matches.length, 1, `preserve one entry for ${id}`);
  return matches[0];
});
assert.ok(!creatures.some(c => /distinct from|truly immortal|무한 성장|물리 무적/.test(JSON.stringify(c))), 'alternate names must not be represented as a separate immortal species');
assert.deepEqual(creatures.map(c => c.f), [8, 10, 5], 'preserve existing scores');
assert.equal(new Set(creatures.map(c => c.d)).size, 1, 'all aliases share the reviewed account');
for (const creature of creatures) {
  assert.match(creature.d, /vary/);
  assert.ok(creature.sh.every(hook => hook.startsWith('창작 훅:')));
  assert.deepEqual(creature.vk, ['전승마다 다른 모습']);
}
for (const locale of ['ko', 'ja', 'zh']) {
  const translated = JSON.parse(read(`public/i18n/creatures-${locale}.json`));
  assert.equal(Object.keys(translated).length, all.length);
  assert.equal(new Set(ids.map(id => translated[id].d)).size, 1);
  for (const id of ids) {
    for (const field of ['d', 'ab', 'wk', 'sh']) assert.ok(translated[id][field]?.length);
  }
}
for (const id of ids) {
  const article = JSON.parse(read(`content/articles/${id}.json`));
  assert.equal(article.sourceLang, 'ko');
  assert.equal(article.factBased, true);
  assert.equal(article.reviewedAt, '2026-10-14');
  assert.deepEqual(article.sources.map(s => s.url), ['https://encykorea.aks.ac.kr/Article/E0024904', 'https://encykorea.aks.ac.kr/Article/E0030766']);
  assert.doesNotMatch(JSON.stringify(article.locales), /Nam-hyeong|남형|南亨|1962|1985|不可思议/);
  for (const locale of ['ko', 'en', 'ja', 'zh']) {
    assert.ok(article.researchNotes[locale]?.length);
    for (const field of ['origin', 'legend', 'variants', 'culture']) assert.ok(article.locales[locale][field]?.length);
  }
}
console.log(`PASS: reviewed aliases, translations and articles; ${data.length} countries / ${all.length} entries preserved`);
