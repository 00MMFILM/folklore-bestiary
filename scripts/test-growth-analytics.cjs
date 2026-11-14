const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const file = require('node:path').join(__dirname, '../components/GrowthAnalytics.tsx');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
}).outputText;
let search = '', referrer = '', blocked = false;
const events = [];
const moduleUnderTest = { exports: {} };
const requireForTest = id => {
  if (id === '@vercel/analytics') return {
    inject: () => { if (blocked) throw Error('analytics blocked'); },
    track: (...args) => events.push(args)
  };
  if (id === 'next/link') return { __esModule: true, default: () => null };
  if (id === 'react') return { ...React, useEffect: fn => fn(), useRef: () => ({ current: null }) };
  return require(id);
};
new Function('require', 'module', 'exports', 'window', 'document', code)(
  requireForTest, moduleUnderTest, moduleUnderTest.exports,
  { location: { get search() { return search; }, hostname: 'folklore-bestiary.vercel.app' } },
  { get referrer() { return referrer; } }
);
const { GrowthView, GrowthLink } = moduleUnderTest.exports;
const props = { page: '/en/creatures/cn-biyiniao', campaign: 'growth20_20261114' };
search = '?utm_source=threads&email=should-not-be-recorded';
GrowthView(props);
assert.equal(events[0][0], 'growth_page_view');
assert.equal(events[0][1].source, 'threads');
assert.doesNotMatch(JSON.stringify(events), /email|should-not/);
const link = GrowthLink({ ...props, href: '/en/creatures/cn-qingniao', children: 'Read next' });
link.props.onClick();
assert.equal(events[1][0], 'growth_next_click');
assert.equal(events[1][1].target, link.props.href);
search = '?growth_qa=1';
GrowthView(props); link.props.onClick();
assert.equal(events.length, 2, 'QA must not count as campaign traffic');
search = ''; referrer = 'https://www.google.com/search?q=private-search-term';
GrowthView(props);
assert.equal(events[2][1].source, 'search');
assert.doesNotMatch(JSON.stringify(events), /private-search-term/);
blocked = true;
assert.doesNotThrow(() => link.props.onClick());
assert.equal(link.props.href, '/en/creatures/cn-qingniao');
console.log('PASS: Threads attribution, next-click tracking, QA exclusion, data minimization and blocked analytics navigation');
