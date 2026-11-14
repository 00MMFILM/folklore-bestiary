import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('lib/folklore-data.ts','utf8');
function read(marker) {
  const line=src.split('\n').find(l=>l.startsWith(marker));
  return JSON.parse(line.slice(line.indexOf('= ')+2).replace(/;$/,''));
}
const data=read('export const FOLKLORE_DATA:');
const images=read('export const CREATURE_IMAGE_MAP:');
const creatures=data.flatMap(c=>c.b), ids=new Set(creatures.map(c=>c.id));
assert.equal(ids.size,creatures.length,'duplicate creature ids');
for(const c of creatures) for(const key of ['id','n','t','f','d']) assert.notEqual(c[key],undefined,`${c.id}: missing ${key}`);
for(const locale of ['ko','ja','zh']) {
  const translations=JSON.parse(fs.readFileSync(`public/i18n/creatures-${locale}.json`,'utf8'));
  assert.equal(Object.keys(translations).length,ids.size,`${locale}: translation count mismatch`);
  for(const id of ids) assert.ok(translations[id]?.d,`${locale}/${id}: missing translation`);
}
for(const c of creatures) {
  const p=images[c.id.replace(/^[a-z]{2,3}-/,'')] || images[c.id.replace(/^[a-z]{2}-/,'')] || images[c.id];
  if(p) assert.ok(fs.existsSync(`public${p}`),`Missing image: ${c.id} ${p}`);
}
console.log(`Validated: ${data.length} countries, ${ids.size} creatures, 3 complete translations, ${Object.keys(images).length} image links`);
