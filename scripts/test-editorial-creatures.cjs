// Exercise the real detail page and metadata without a running Next server.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();
const ids = [
  "cn-tenghuang", "br-boiuna", "cn-biyiniao",
  "eg-apesh", "wls-gwenddydd", "cn-xiaotian-quan",
];
const plain = value => renderToStaticMarkup(React.createElement("span", null, value)).slice(6, -7);
// JSON-LD may contain text that is missing from the actual reader-facing page.
const visibleMarkup = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

function load(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true, target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const localRequire = id => {
    if (id.startsWith("@/") || id.startsWith(".")) {
      const base = id.startsWith("@/") ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
      const found = [base, `${base}.ts`, `${base}.tsx`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (!found) throw new Error(`Missing import ${id}`);
      return /\.tsx?$/.test(found) ? load(found) : require(found);
    }
    return require(id);
  };
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

async function main() {
  process.chdir(root);
  const page = load(path.join(root, "app/[locale]/creatures/[id]/page.tsx"));
  const { getCreatureById } = load(path.join(root, "lib/folklore-data.ts"));
  const { getCreatureTranslation } = load(path.join(root, "lib/creature-translations.ts"));
  const { getCreatureArticle } = load(path.join(root, "lib/articles.ts"));
  const { getDictionary } = load(path.join(root, "lib/i18n.ts"));
  const { getCountryName, getTypeName } = load(path.join(root, "lib/i18n-names.ts"));
  const { localizeDescription } = load(path.join(root, "lib/tag-i18n.ts"));
  const failures = [];
  for (const id of ids) {
    const params = Promise.resolve({ locale: "en", id });
    const html = renderToStaticMarkup(await page.default({ params }));
    try {
      assert.doesNotMatch(html, /Supernatural power|Certain rituals/, `${id}: placeholder claims remain`);
      assert.match(html, /Creative prompts/, `${id}: creative material must be labelled`);
      assert.match(html, /Research notes/, `${id}: source limits must be visible`);
      assert.doesNotMatch(html, /Similar creature types/, `${id}: old classification must not label unrelated creatures`);
      const entry = JSON.parse(fs.readFileSync(path.join(root, "content/editorial/en", `${id}.json`), "utf8"));
      const metadata = await page.generateMetadata({ params });
      assert.equal(metadata.title, entry.title);
      assert.equal(metadata.description, entry.metaDescription);
      assert.equal(metadata.openGraph.title, entry.title);
      assert.equal(metadata.twitter.description, entry.metaDescription);
      assert.equal(metadata.alternates.canonical, `https://folklore-bestiary.vercel.app/en/creatures/${id}`);
      assert.equal(Object.keys(metadata.alternates.languages).length, 4);
      for (const source of entry.sources) {
        assert.equal(new URL(source.url).protocol, "https:");
        const escaped = renderToStaticMarkup(React.createElement("a", { href: source.url }, "source"));
        assert.ok(html.includes(escaped.match(/href="[^"]+"/)[0]), `${id}: source not linked`);
      }
      assert.ok(html.includes(plain(entry.description)), `${id}: complete definition missing`);
      const visible = visibleMarkup(html);
      for (const field of ["abilities", "weaknesses", "storyHooks"]) {
        for (const value of entry[field]) {
          assert.ok(visible.includes(plain(value)), `${id}: visible ${field} text missing`);
        }
      }
      assert.ok(visible.includes(plain(entry.researchNote)), `${id}: visible research limits missing`);
      if (entry.abilities.length === 0) {
        assert.doesNotMatch(visible, /Traits in the sources/, `${id}: empty traits must not fall back to generated claims`);
      }
      if (entry.weaknesses.length === 0) {
        assert.doesNotMatch(visible, /Limits in these accounts/, `${id}: empty limits must not fall back to generated claims`);
      }
      for (const section of Object.values(entry.sections)) {
        for (const para of section.split(/\n+/).filter(Boolean)) assert.ok(html.includes(plain(para)), `${id}: article missing`);
      }
      for (const relatedId of entry.relatedIds) {
        assert.ok(html.includes(`href="/en/creatures/${relatedId}"`), `${id}: related link missing`);
      }
      const article = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map(match => JSON.parse(match[1])).find(item => item["@type"] === "Article");
      assert.equal(article.description, entry.description);
      assert.equal(article.headline, entry.title);
      assert.ok(article.keywords.startsWith(`${entry.displayType}, `), `${id}: structured-data type must match the page`);
      assert.ok(article.articleBody.length > entry.description.length);
      assert.equal(article.citation.length, entry.sources.length);
      assert.equal(article.dateModified, entry.reviewedAt);
      const koMetadata = await page.generateMetadata({ params: Promise.resolve({ locale: "ko", id }) });
      assert.notEqual(koMetadata.title, entry.title, `${id}: English override leaked into Korean`);
    } catch (error) {
      failures.push(`${id}: ${error.message.split("\n")[0]}`);
    }
  }
  assert.deepEqual(failures, [], failures.join("\n"));

  // The editorial layer must leave an ordinary English entry and the Korean
  // edition of a reviewed entry on their existing data/article paths.
  for (const { id, locale } of [
    { id: "kr-gumiho", locale: "en" },
    { id: "cn-tenghuang", locale: "ko" },
  ]) {
    const params = Promise.resolve({ locale, id });
    const html = renderToStaticMarkup(await page.default({ params }));
    const visible = visibleMarkup(html);
    const creature = getCreatureById(id);
    assert.ok(creature, `${locale}/${id}: legacy fixture missing`);
    const translation = getCreatureTranslation(id, locale);
    const expectedDescription = localizeDescription(
      translation?.d || creature.d,
      locale,
      getCountryName(creature.country, locale),
      getTypeName(creature.t, locale)
    );
    assert.ok(expectedDescription, `${locale}/${id}: legacy definition fixture is empty`);
    assert.ok(visible.includes(plain(expectedDescription)), `${locale}/${id}: existing definition was replaced`);
    assert.equal(visible.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1], plain(creature.n), `${locale}/${id}: existing title was replaced`);
    assert.ok(visible.includes(`lang="${locale}"`), `${locale}/${id}: reader language missing`);
    assert.ok(visible.includes(plain(getDictionary(locale)["creature.storyHooks"])), `${locale}/${id}: existing story-hook label missing`);
    assert.doesNotMatch(visible, /Creative prompts|Research notes/, `${locale}/${id}: English editorial UI leaked into a legacy page`);
    if (locale === "en") {
      const legacyArticle = getCreatureArticle(id, locale);
      assert.ok(legacyArticle?.sections.origin, `${id}: fixture must exercise the existing article path`);
      assert.ok(visible.includes(plain(legacyArticle.sections.origin)), `${id}: existing article disappeared`);
    } else {
      const editorial = JSON.parse(fs.readFileSync(path.join(root, "content/editorial/en", `${id}.json`), "utf8"));
      for (const value of [editorial.description, editorial.researchNote, ...editorial.storyHooks, ...Object.values(editorial.sections)]) {
        assert.ok(!visible.includes(plain(value)), `${locale}/${id}: English editorial copy leaked into Korean body`);
      }
    }
  }
  await assert.rejects(page.default({ params: Promise.resolve({ locale: "xx", id: ids[0] }) }));
  await assert.rejects(page.default({ params: Promise.resolve({ locale: "en", id: "missing-creature" }) }));
  console.log("PASS: six rendered English entries and visible editorial fields, linked sources and related pages, metadata/JSON-LD, legacy English article and Korean body isolation, and 404 handling");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
