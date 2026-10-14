// Reproduces the first-view race with the installed SDK, without a browser or network.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const sdk = require("@vercel/analytics");

const originalWindow = global.window;
const originalDocument = global.document;
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

let effects = [];
let refs = [];
let refIndex = 0;

function freshDocument({ denyInjection = false } = {}) {
  const scripts = [];
  global.window = {};
  global.document = {
    head: {
      querySelector(selector) {
        const src = selector.match(/^script\[src\*="(.*)"\]$/)?.[1];
        assert.ok(src, `unexpected SDK selector: ${selector}`);
        return scripts.find(script => script.src.includes(src)) || null;
      },
      appendChild(script) {
        if (denyInjection) throw new Error("analytics script blocked");
        scripts.push(script);
        return script;
      },
    },
    createElement(tag) {
      assert.equal(tag, "script");
      return { dataset: {} };
    },
  };
  effects = [];
  refs = [];
  refIndex = 0;
  return scripts;
}

function loadComponent() {
  const filename = path.join(__dirname, "../components/EncounterAnalytics.tsx");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (id === "react") return {
      ...React,
      useEffect: callback => effects.push(callback),
      useRef: initial => refs[refIndex++] ||= { current: initial },
    };
    if (id === "@vercel/analytics") return sdk;
    if (id === "next/link") return props => React.createElement("a", props);
    return require(id);
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}

function renderView(component, props) {
  refIndex = 0;
  effects = [];
  component(props);
  const pending = effects.slice();
  for (const effect of pending) effect();
  return pending;
}

function events() {
  return (window.vaq || []).filter(([type]) => type === "event");
}

try {
  const analytics = loadComponent();
  const scripts = freshDocument();

  // The child effect runs before the root Analytics effect on a fresh document.
  const initialEffects = renderView(analytics.EncounterView, {
    stage: "detail", locale: "en", creatureId: "kr-bulgasari",
  });
  assert.equal(events().length, 1, "fresh-document detail view must be queued before root Analytics injects");
  assert.equal(events()[0][1].name, "encounter_detail_view");
  assert.deepEqual(events()[0][1].data, { sample_id: "bulgasari-01", locale: "en" });

  // Strict Mode re-runs the same mounted effect; its ref must prevent duplication.
  for (const effect of initialEffects) effect();
  assert.equal(events().length, 1, "Strict Mode effect replay must not duplicate the view");

  // These are the public calls used by @vercel/analytics/next's root effects.
  sdk.inject({
    framework: "next",
    disableAutoTrack: true,
    basePath: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH,
  });
  sdk.pageview({ route: "/[locale]/creatures/[id]", path: "/en/creatures/kr-bulgasari" });
  assert.equal(scripts.length, 1, "child initialization and root initialization must share one script");
  assert.equal(scripts[0].dataset.disableAutoTrack, "1", "Next owns pageview tracking");
  assert.equal(scripts[0].dataset.sdkn, "@vercel/analytics/next");
  assert.equal(window.vaq.filter(([type]) => type === "pageview").length, 1, "initializing the queue must not add an extra pageview");
  assert.equal(events().length, 1, "root initialization must preserve the first custom event");

  renderView(analytics.EncounterView, { stage: "sample", locale: "en" });
  assert.deepEqual(events().map(([, event]) => event.name), ["encounter_detail_view", "encounter_sample_view"]);

  // A click can also happen before the root effect; protect every record() call.
  const clickScripts = freshDocument();
  const download = analytics.EncounterDownloadLink({ children: "Download", placement: "sample_footer" });
  download.props.onClick();
  assert.equal(events().length, 1, "an early PDF click must also initialize the queue");
  assert.equal(events()[0][1].name, "encounter_pdf_click");
  assert.equal(events()[0][1].data.placement, "sample_footer");
  assert.equal(clickScripts.length, 1);
  assert.equal(download.props.href, "/samples/bulgasari-free-sample.pdf");
  assert.equal(download.props.download, "bulgasari-free-sample.pdf");

  // A slow/blocked request leaves the SDK queue in place without blocking links.
  assert.doesNotThrow(() => download.props.onClick());
  assert.equal(clickScripts.length, 1, "an unloaded script must not be injected repeatedly");
  assert.equal(events().length, 2, "distinct user clicks are distinct events");

  // Even an injection failure must not throw into a native download click.
  freshDocument({ denyInjection: true });
  assert.doesNotThrow(() => download.props.onClick(), "blocked analytics must leave native PDF navigation usable");
  assert.equal(download.props.href, "/samples/bulgasari-free-sample.pdf");
  assert.equal(download.props.download, "bulgasari-free-sample.pdf");
  console.log("PASS: real SDK first-view queue; Strict Mode dedupe; one script/pageview; early PDF click; blocked analytics preserves native download");
} finally {
  if (originalWindow === undefined) delete global.window;
  else global.window = originalWindow;
  if (originalDocument === undefined) delete global.document;
  else global.document = originalDocument;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}
