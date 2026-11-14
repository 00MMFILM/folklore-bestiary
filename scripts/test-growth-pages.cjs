const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { load, root, plain, visibleMarkup } = require('./test-editorial-creatures.cjs');
const campaign = require('../content/growth-campaign.json');

async function main() {
  const detail = load(path.join(root, 'app/[locale]/creatures/[id]/page.tsx'));
  const country = load(path.join(root, 'app/[locale]/creatures/country/[code]/page.tsx'));
  const { getEditorialCreature } = load(path.join(root, 'lib/editorial-creatures.ts'));
  const { getEditorialCountry } = load(path.join(root, 'lib/editorial-countries.ts'));
  const { getCreatureById } = load(path.join(root, 'lib/folklore-data.ts'));
  assert.equal(campaign.targetPaths.length, 20);
  assert.equal(new Set(campaign.targetPaths).size, 20);
  for (const target of campaign.targetPaths) {
    const [, locale, , segment, code] = target.split('/');
    const isCountry = segment === 'country';
    const entry = isCountry ? getEditorialCountry(code, locale) : getEditorialCreature(segment, locale);
    assert.ok(entry, `${target}: reviewed text missing`);
    const params = Promise.resolve(isCountry ? { locale, code } : { locale, id: segment });
    const page = isCountry ? country : detail;
    const html = renderToStaticMarkup(await page.default({ params }));
    const visible = visibleMarkup(html);
    const metadata = await page.generateMetadata({ params });
    assert.equal(metadata.title, entry.title);
    assert.equal(metadata.description, entry.metaDescription);
    assert.equal(metadata.openGraph.title, entry.title);
    assert.equal(metadata.alternates.canonical, `https://folklore-bestiary.vercel.app${target}`);
    assert.ok(visible.includes(plain(entry.title)));
    assert.ok(visible.includes(plain(entry.intro || entry.description)));
    assert.equal((visible.match(/<h1\b/g) || []).length, 1);
    assert.doesNotMatch(visible, /Supernatural power|Certain rituals|초자연적 능력|특정 의식/);
    for (const source of entry.sources) assert.ok(visible.includes(plain(source.url)));
    for (const qa of entry.questions) assert.ok(visible.includes(plain(qa.answer)));
    for (const id of isCountry ? entry.picks.map(p => p.id) : entry.relatedIds) {
      assert.ok(getCreatureById(id), `${target}: broken related ID ${id}`);
      assert.ok(visible.includes(`href="/${locale}/creatures/${id}"`));
    }
    if (!isCountry) {
      const imageOffset = visible.indexOf('<img');
      if (imageOffset >= 0) assert.ok(visible.indexOf('<h1') < imageOffset, `${target}: answer hidden below hero image`);
      for (const text of Object.values(entry.sections)) {
        for (const para of text.split(/\n+/)) assert.ok(visible.includes(plain(para)));
      }
      const article = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map(m => JSON.parse(m[1])).find(d => d['@type'] === 'Article');
      assert.equal(article.dateModified, entry.reviewedAt);
      assert.equal(article.headline, entry.title);
    }
    assert.ok(visible.includes(locale === 'ko' ? 'href="/ko/studio"' : 'href="/en/encounters/bulgasari"'));
  }
  // The new country guide and filtering must not leak into other languages.
  for (const [code, locales] of [['jm', ['ko', 'ja', 'zh']], ['kr', ['en', 'ja', 'zh']]]) {
    for (const locale of locales) assert.equal(getEditorialCountry(code, locale), null);
  }
  console.log('PASS: all 20 rendered pages, metadata, sources, real related targets, first-screen answer order, creative links and locale boundaries');
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
