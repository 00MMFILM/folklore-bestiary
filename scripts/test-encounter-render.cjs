// Server-render contracts; does not claim browser layout or analytics delivery.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();
const events = [];
let analyticsBlocked = false;

function load(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = id => {
    if (id === "@vercel/analytics") return { inject: () => {}, track: (...args) => {
      if (analyticsBlocked) throw new Error("analytics unavailable");
      events.push(args);
    } };
    if (id.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith("@/") || id.startsWith(".")) {
      const base = id.startsWith("@/") ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!resolved) throw new Error(`Missing import: ${id}`);
      if (/\.tsx?$/.test(resolved)) return load(resolved);
      return require(resolved);
    }
    return require(id);
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}

async function main() {
  process.chdir(root);
  const page = load(path.join(root, "app/[locale]/encounters/bulgasari/page.tsx"));
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ locale: "en" }) }));
  const sample = require("../content/encounters/bulgasari.json");
  const text = value => renderToStaticMarkup(React.createElement("span", null, value)).slice(6, -7);
  const paragraphs = [sample.description, sample.format_note, sample.boundary, sample.opening, sample.truth, sample.map_note, sample.clue_policy, sample.clock_rule, sample.improvisation, sample.research_note, sample.credits_note];
  for (const key of ["folklore", "game_rules", "clock", "aftermath"]) paragraphs.push(...sample[key].map(item => item.body));
  for (const key of ["npcs", "locations", "resolutions"]) for (const item of sample[key]) paragraphs.push(...Object.values(item));
  for (const paragraph of paragraphs) assert.ok(html.includes(text(paragraph)), `Missing published text: ${paragraph.slice(0, 70)}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, "unique accessible IDs");
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), `broken anchor #${anchor}`);
  assert.doesNotMatch(html, /href="\/en"/, "home route must exist");
  assert.match(html, /lang="en"/);
  assert.match(html, /href="\/samples\/bulgasari-free-sample.pdf"/);
  assert.equal(fs.readFileSync(path.join(root, "public/samples/bulgasari-free-sample.pdf")).subarray(0, 5).toString(), "%PDF-");
  for (const locale of ["ko", "ja", "zh"]) await assert.rejects(page.default({ params: Promise.resolve({ locale }) }), error => error.digest?.includes("NEXT_REDIRECT") && error.digest.includes("/en/encounters/bulgasari"));
  await assert.rejects(page.default({ params: Promise.resolve({ locale: "xx" }) }), error => error.digest?.includes("404"));

  const detail = load(path.join(root, "app/[locale]/creatures/[id]/page.tsx"));
  const translations = load(path.join(root, "lib/creature-translations.ts"));
  for (const id of ["kr-bulgasari", "kr-balgasari", "kr-bulgasari-creature"]) {
    for (const locale of ["en", "ko", "ja", "zh"]) {
      const rendered = renderToStaticMarkup(await detail.default({ params: Promise.resolve({ locale, id }) }));
      assert.match(rendered, /href="\/en\/encounters\/bulgasari"/);
      assert.match(rendered, /encykorea.aks.ac.kr\/Article\/E0024904/);
      assert.match(rendered, /encykorea.aks.ac.kr\/Article\/E0030766/);
      assert.doesNotMatch(rendered, /wikipedia.org\/wiki\/Bulgasari|Nam-hyeong|Nam Hyeong|不可思议/);
      const translated = translations.getCreatureTranslation(id, locale);
      if (locale === "en") for (const field of ["ab", "wk", "sh"]) assert.doesNotMatch(translated[field].join(" "), /[가-힣]/, `untranslated English ${field}`);
    }
  }
  const analytics = load(path.join(root, "components/EncounterAnalytics.tsx"));
  const download = analytics.EncounterDownloadLink({ children: "Download", placement: "sample_footer" });
  assert.equal(download.props.href, "/samples/bulgasari-free-sample.pdf");
  assert.equal(download.props.download, "bulgasari-free-sample.pdf");
  download.props.onClick();
  assert.deepEqual(events, [["encounter_pdf_click", { sample_id: "bulgasari-01", placement: "sample_footer" }]]);
  analyticsBlocked = true;
  assert.doesNotThrow(() => download.props.onClick(), "analytics failure must leave native download usable");
  console.log(`PASS: sample renders ${paragraphs.length} content fragments; anchors/PDF/locale redirects; 12 localized detail pages; English tags; download click and analytics failure`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
