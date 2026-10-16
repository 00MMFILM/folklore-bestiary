// Deterministic visibility/lifecycle checks using the installed analytics SDK.
// This exercises collection eligibility, not browser layout or server delivery.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const sdk = require("@vercel/analytics");

const originalGlobals = Object.fromEntries(
  ["window", "document", "IntersectionObserver", "setTimeout", "clearTimeout"].map(key => [key, global[key]]),
);
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

let refs = [];
let refIndex = 0;
let effects = [];
let now = 0;
let nextTimer = 0;
let timers = new Map();
let observers = [];
let listeners = new Set();
let scripts = [];
let denyInjection = false;

class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.targets = new Set();
    this.queued = [];
    observers.push(this);
  }
  observe(target) { this.target = target; this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  takeRecords() { return this.queued.splice(0); }
  entry(ratio) { return { target: this.target, isIntersecting: ratio > 0, intersectionRatio: ratio }; }
  emit(ratio) { this.callback([this.entry(ratio)]); }
}

function freshDocument({ hidden = false, unsupported = false, blocked = false } = {}) {
  refs = [];
  refIndex = 0;
  effects = [];
  now = 0;
  nextTimer = 0;
  timers = new Map();
  observers = [];
  listeners = new Set();
  scripts = [];
  denyInjection = blocked;
  global.window = {};
  global.document = {
    visibilityState: hidden ? "hidden" : "visible",
    addEventListener(type, callback) {
      assert.equal(type, "visibilitychange");
      listeners.add(callback);
    },
    removeEventListener(type, callback) {
      assert.equal(type, "visibilitychange");
      listeners.delete(callback);
    },
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
  if (unsupported) delete global.IntersectionObserver;
  else global.IntersectionObserver = FakeIntersectionObserver;
  global.setTimeout = (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + delay });
    return id;
  };
  global.clearTimeout = id => timers.delete(id);
}

function tick(milliseconds) {
  const end = now + milliseconds;
  let count = 0;
  while (true) {
    const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
    if (!next) break;
    assert.ok(++count < 100, "timer must not reschedule indefinitely");
    now = next[1].at;
    timers.delete(next[0]);
    next[1].callback();
  }
  now = end;
}

function visibility(state) {
  document.visibilityState = state;
  for (const callback of [...listeners]) callback();
}

function events() {
  return (window.vaq || []).filter(([type]) => type === "event").map(([, { name, data }]) => ({ name, data }));
}

const NextLink = props => React.createElement("a", props);
function loadComponent() {
  const filename = path.join(__dirname, "../components/EncounterAnalytics.tsx");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (id === "react") return {
      ...React,
      useEffect: (callback, dependencies) => effects.push({ callback, dependencies }),
      useRef: initial => refs[refIndex++] ||= { current: initial },
    };
    if (id === "@vercel/analytics") return sdk;
    if (id === "next/link") return NextLink;
    return require(id);
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  return module.exports;
}

function mountSurface(component, props = { locale: "en", placement: "home", children: "Card" }) {
  refIndex = 0;
  effects = [];
  const element = component(props);
  assert.equal(element.type, "div", "observe a real wrapper without changing the card's semantics");
  assert.equal(element.props.children, props.children);
  const target = {};
  element.props.ref.current = target;
  let callbacks = effects.slice();
  let cleanups = [];
  const setup = () => {
    cleanups = callbacks.map(effect => effect.callback());
    for (const observer of observers) if (observer.targets.has(target)) observer.target = target;
  };
  const cleanup = () => {
    for (const callback of cleanups) if (typeof callback === "function") callback();
  };
  setup();
  const update = nextProps => {
    refIndex = 0;
    effects = [];
    const nextElement = component(nextProps);
    nextElement.props.ref.current = target;
    const nextEffects = effects.slice();
    const changed = nextEffects.some((effect, index) => !effect.dependencies ||
      !callbacks[index].dependencies ||
      effect.dependencies.some((dependency, i) => !Object.is(dependency, callbacks[index].dependencies[i])));
    if (changed) {
      cleanup();
      callbacks = nextEffects;
      setup();
    }
  };
  return { element, target, cleanup, update, replay: () => { cleanup(); setup(); } };
}

try {
  const analytics = loadComponent();
  assert.equal(typeof analytics.EncounterPromoSurface, "function", "promo surface must be exported");
  assert.equal(typeof analytics.EncounterPromoLink, "function", "promo link must be exported");

  freshDocument();
  let surface = mountSurface(analytics.EncounterPromoSurface);
  let observer = observers.at(-1);
  assert.deepEqual([observer.options.threshold].flat(), [0.5]);
  assert.ok(observer.targets.has(surface.target));
  assert.equal(events().length, 0, "mounting is not an impression");
  observer.emit(0.49);
  tick(2000);
  assert.equal(events().length, 0, "less than half visible must not count");
  observer.emit(0.5);
  tick(999);
  assert.equal(events().length, 0, "one uninterrupted second is required");
  tick(1);
  assert.deepEqual(events(), [{ name: "encounter_promo_view", data: { sample_id: "bulgasari-01", placement: "home_en" } }]);
  assert.equal(scripts.length, 1, "first impression uses the real SDK queue before the root effect");
  assert.equal(scripts[0].dataset.disableAutoTrack, "1");
  observer.emit(0);
  observer.emit(1);
  tick(2000);
  assert.equal(events().length, 1, "a card counts once per locale/placement in this mount");
  assert.equal(observer.targets.size, 0);
  assert.equal(listeners.size, 0);
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface, { locale: "ko", placement: "home", children: "Card" });
  observer = observers.at(-1);
  observer.emit(1);
  tick(600);
  surface.update({ locale: "en", placement: "home", children: "Card" });
  observer.emit(1);
  tick(1000);
  assert.equal(events().length, 0, "locale synchronization must cancel the initial Korean exposure timer");
  observers.at(-1).emit(1);
  tick(1000);
  assert.deepEqual(events().map(event => event.data.placement), ["home_en"]);
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  tick(600);
  observer.emit(0.49);
  tick(2000);
  assert.equal(events().length, 0, "a quick scroll must cancel the pending impression");
  observer.emit(1);
  tick(999);
  assert.equal(events().length, 0, "separate visits must not accumulate exposure time");
  tick(1);
  assert.equal(events().length, 1);
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  tick(999);
  observer.queued.push(observer.entry(0));
  tick(1);
  assert.equal(events().length, 0, "a queued exit at the timer boundary must prevent an impression");
  observer.emit(1);
  tick(1000);
  assert.equal(events().length, 1);
  surface.cleanup();

  freshDocument({ hidden: true });
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  tick(5000);
  assert.equal(events().length, 0, "an initially hidden tab must never count");
  visibility("visible");
  observer.emit(1);
  tick(900);
  visibility("hidden");
  tick(5000);
  assert.equal(events().length, 0);
  visibility("visible");
  tick(2000);
  assert.equal(events().length, 0, "tab return must obtain a fresh intersection, not reuse stale geometry");
  observer.emit(0.5);
  tick(999);
  assert.equal(events().length, 0, "time before hiding cannot count toward the next exposure");
  tick(1);
  assert.equal(events().length, 1);
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  document.visibilityState = "hidden";
  tick(1000);
  assert.equal(events().length, 0, "the timer must recheck visibility even before its change event is delivered");
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  tick(600);
  surface.cleanup();
  observer.emit(1); // A stale callback delivered after unmount.
  tick(2000);
  assert.equal(events().length, 0, "unmount cancels timers and ignores queued observer callbacks");
  assert.equal(timers.size, 0);
  assert.equal(listeners.size, 0);
  assert.equal(observer.targets.size, 0);

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observer = observers.at(-1);
  observer.emit(1);
  tick(600);
  surface.replay();
  observer.emit(1); // The first Strict Mode effect is already disposed.
  tick(1000);
  assert.equal(events().length, 0, "Strict Mode cleanup must discard the first effect's timer");
  observers.at(-1).emit(1);
  tick(1000);
  assert.equal(events().length, 1);
  surface.replay();
  tick(2000);
  assert.equal(events().length, 1, "Strict Mode effect replay must preserve the impression guard");
  surface.cleanup();

  freshDocument();
  surface = mountSurface(analytics.EncounterPromoSurface);
  observers.at(-1).emit(1);
  tick(1000);
  surface.cleanup();
  surface = mountSurface(analytics.EncounterPromoSurface, { locale: "ko", placement: "korea", children: "Card" });
  observers.at(-1).emit(1);
  tick(1000);
  assert.deepEqual(events().map(event => event.data.placement), ["home_en", "korea_ko"]);
  surface.cleanup();
  surface = mountSurface(analytics.EncounterPromoSurface);
  tick(2000);
  assert.equal(events().length, 2, "returning to a previously counted locale/placement must not duplicate it");
  surface.cleanup();

  freshDocument({ unsupported: true });
  surface = mountSurface(analytics.EncounterPromoSurface);
  tick(5000);
  assert.equal(events().length, 0, "unsupported observers must not fall back to page-load impressions");
  assert.equal(listeners.size, 0);
  const link = analytics.EncounterPromoLink({ locale: "ko", placement: "korea", className: "promo-link", children: "Read" });
  assert.equal(link.type, NextLink);
  assert.equal(link.props.href, "/en/encounters/bulgasari");
  assert.equal(link.props.prefetch, false);
  assert.equal(link.props.className, "promo-link");
  const click = { preventDefault: () => assert.fail("tracking must not prevent native navigation") };
  link.props.onClick(click);
  assert.deepEqual(events(), [{ name: "encounter_promo_click", data: { sample_id: "bulgasari-01", placement: "korea_ko" } }]);
  link.props.onClick(click);
  assert.equal(events().length, 2, "distinct activations remain distinct clicks");
  surface.cleanup();

  freshDocument({ blocked: true });
  assert.doesNotThrow(() => link.props.onClick(click), "script injection failure must leave the link usable");
  assert.equal(link.props.href, "/en/encounters/bulgasari");
  freshDocument();
  window.va = () => { throw new Error("tracking blocked"); };
  assert.doesNotThrow(() => link.props.onClick(click), "track failure must leave the link usable");

  console.log("PASS: real SDK promo events; 50%/1-second continuous exposure; fast scroll, hidden tab, queued exit, unmount and Strict Mode; two properties; native links with blocked/unsupported analytics");
} finally {
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete global[key];
    else global[key] = value;
  }
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}
