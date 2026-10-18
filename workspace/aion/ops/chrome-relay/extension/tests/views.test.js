// Human guide (guide.js) and machine view (agent.js, agent.html).
//
// A small DOM stub and a chrome.* stub: no browser, no Playwright, no Puppeteer.
// What these tests protect:
//   - the guide only moves focus and fills EMPTY fields on a click; it never
//     clicks, confirms, selects, calls the worker or sends;
//   - the machine view can only ever post { type: 'aion/status' };
//   - both pages keep their markup consistent with their scripts and styles.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ACTION_CATALOG, IDENTIFIER_PATTERN } from '../src/panel/view-model.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const panelDir = resolve(root, 'src', 'panel');
const read = (name) => readFileSync(resolve(panelDir, name), 'utf8');

const humanHtml = read('sidepanel.html');
const agentHtml = read('agent.html');
const guideSource = read('guide.js');
const agentSource = read('agent.js');
const viewModelSource = read('view-model.js');
const css = read('panel.css') + '\n' + read('agent.css');

const strip = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const idsOf = (html) => [...strip(html).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

/* ------------------------------------------------------------------ *
 * DOM stub
 * ------------------------------------------------------------------ */

function makeWorld() {
  const docClicks = [];
  const registry = new Map();

  class StubEl extends EventTarget {
    constructor(tag = 'div', id = '') {
      super();
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.hidden = false;
      this.focused = false;
      this.clicks = 0;
      this._text = '';
      this.addEventListener('click', () => { this.clicks += 1; });
    }
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
    set textContent(value) { this._text = String(value); this.children.length = 0; }
    get lastChild() { return this.children[this.children.length - 1] || null; }
    append(...kids) { this.children.push(...kids); }
    prepend(...kids) { this.children.unshift(...kids); }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); return child; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null; }
    hasAttribute(key) { return Object.prototype.hasOwnProperty.call(this.attributes, key); }
    removeAttribute(key) { delete this.attributes[key]; }
    querySelectorAll(selector) { return selector === 'option' ? this.children.filter((c) => c.tagName === 'OPTION') : []; }
    closest(selector) { return selector === '[data-copy-target]' && this.hasAttribute('data-copy-target') ? this : null; }
    focus() { this.focused = true; }
    scrollIntoView() {}
    dispatchEvent(event) {
      const result = super.dispatchEvent(event);
      if (event.type === 'click') for (const fn of docClicks) fn({ target: this });
      return result;
    }
  }

  const document = {
    readyState: 'complete',
    visibilityState: 'visible',
    steps: [],
    getElementById: (id) => registry.get(id) || null,
    createElement: (tag) => new StubEl(tag),
    querySelectorAll: (selector) => (selector === '.step' ? document.steps : []),
    addEventListener: (type, fn) => { if (type === 'click') docClicks.push(fn); }
  };

  const add = (id, tag = 'div') => {
    const node = new StubEl(tag, id);
    registry.set(id, node);
    return node;
  };

  return { StubEl, document, add, registry };
}

const savedGlobals = {};
function install(names) {
  for (const [key, value] of Object.entries(names)) {
    savedGlobals[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
}
function restore() {
  for (const [key, descriptor] of Object.entries(savedGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
    delete savedGlobals[key];
  }
}

let importCounter = 0;
const load = (file) => import(pathToFileURL(resolve(panelDir, file)).href + '?t=' + (importCounter += 1));
const settle = async () => { for (let i = 0; i < 30; i += 1) await Promise.resolve(); };

/* ------------------------------------------------------------------ *
 * Human guide
 * ------------------------------------------------------------------ */

async function loadGuide({ clipboard } = {}) {
  const world = makeWorld();
  const { add, document } = world;

  const nodes = {};
  for (const id of [
    'next-step', 'next-step-text', 'next-step-go', 'btn-generate-ids', 'probe-text-count', 'review-tab',
    'review-length', 'review-token', 'result-native', 'result-chatgpt', 'result-run', 'probe-hold',
    'copy-status', 'btn-native-ping', 'btn-chatgpt-tabs', 'btn-chatgpt-ping', 'btn-probe-reconcile',
    'probe-blockers', 'probe-text', 'probe-correlation', 'probe-token'
  ]) nodes[id] = add(id);
  nodes['probe-confirm'] = add('probe-confirm', 'input');
  nodes['btn-chatgpt-run'] = add('btn-chatgpt-run', 'button');
  nodes['btn-chatgpt-run'].disabled = true;
  nodes['tab-select'] = add('tab-select', 'select');
  nodes['next-step-go'].hidden = true;
  nodes['probe-hold'].dataset.hold = 'clear';
  nodes['probe-text-count'].textContent = '0 / 2000';
  document.steps = [new world.StubEl('li'), new world.StubEl('li'), new world.StubEl('li')];

  const placeholder = new world.StubEl('option');
  placeholder.value = '';
  nodes['tab-select'].append(placeholder);

  install({ document, navigator: { clipboard } });
  await load('guide.js');
  return { world, nodes, document };
}

function addTab(world, nodes, id, label) {
  const option = new world.StubEl('option');
  option.value = String(id);
  option.textContent = label;
  nodes['tab-select'].append(option);
}

test('the guide starts at the first step and offers to take you there', async () => {
  const { nodes, document } = await loadGuide();
  try {
    assert.match(nodes['next-step-text'].textContent, /relay host/i);
    assert.equal(nodes['next-step'].dataset.tone, 'go');
    assert.equal(nodes['next-step-go'].hidden, false);
    assert.deepEqual(document.steps.map((s) => s.dataset.reach), ['current', 'later', 'later']);
    assert.equal(nodes['review-tab'].textContent, 'No tab selected');
  } finally { restore(); }
});

test('"take me there" moves focus only and activates nothing', async () => {
  const { nodes } = await loadGuide();
  try {
    nodes['next-step-go'].dispatchEvent(new Event('click'));
    assert.equal(nodes['btn-native-ping'].focused, true);
    for (const id of ['btn-native-ping', 'btn-chatgpt-run', 'btn-chatgpt-tabs', 'btn-chatgpt-ping']) {
      assert.equal(nodes[id].clicks, 0, id + ' must not be clicked');
    }
  } finally { restore(); }
});

test('the guide advances from results the panel wrote, and from nothing else', async () => {
  const { world, nodes } = await loadGuide();
  try {
    nodes['result-native'].dataset.state = 'ok';
    nodes['tab-select'].dispatchEvent(new Event('change'));
    assert.match(nodes['next-step-text'].textContent, /ChatGPT tabs/);

    addTab(world, nodes, 4, 'tab 4: chatgpt.com/');
    nodes['tab-select'].dispatchEvent(new Event('change'));
    assert.match(nodes['next-step-text'].textContent, /Choose which/);

    nodes['tab-select'].value = '4';
    nodes['tab-select'].dispatchEvent(new Event('change'));
    assert.match(nodes['next-step-text'].textContent, /message/i);
    assert.equal(nodes['review-tab'].textContent, 'tab 4: chatgpt.com/');
  } finally { restore(); }
});

test('a failed host check is shown as needing attention', async () => {
  const { nodes } = await loadGuide();
  try {
    nodes['result-native'].dataset.state = 'error';
    nodes['probe-text'].dispatchEvent(new Event('input'));
    assert.equal(nodes['next-step'].dataset.tone, 'stop');
    assert.match(nodes['next-step-text'].textContent, /did not succeed/);
  } finally { restore(); }
});

test('generate fills only empty fields, raises input events, and does not confirm or send', async () => {
  const { nodes } = await loadGuide();
  try {
    const inputs = [];
    for (const id of ['probe-text', 'probe-correlation', 'probe-token']) {
      nodes[id].addEventListener('input', () => inputs.push(id));
    }
    nodes['btn-generate-ids'].dispatchEvent(new Event('click'));

    const c = nodes['probe-correlation'].value;
    const t = nodes['probe-token'].value;
    assert.match(c, IDENTIFIER_PATTERN);
    assert.match(t, IDENTIFIER_PATTERN);
    assert.ok(nodes['probe-text'].value.includes(c) && nodes['probe-text'].value.includes(t));
    assert.deepEqual(new Set(inputs), new Set(['probe-text', 'probe-correlation', 'probe-token']));

    // The same events a keystroke raises, and nothing more.
    assert.equal(nodes['probe-confirm'].checked, false);
    assert.equal(nodes['btn-chatgpt-run'].disabled, true);
    assert.equal(nodes['btn-chatgpt-run'].clicks, 0);
    assert.equal(nodes['probe-text'].focused, true);
    assert.match(nodes['review-token'].textContent, /contains both/);
  } finally { restore(); }
});

test('generate never overwrites what the person typed', async () => {
  const { nodes } = await loadGuide();
  try {
    nodes['probe-correlation'].value = 'mine-1';
    nodes['probe-text'].value = 'my own words';
    nodes['btn-generate-ids'].dispatchEvent(new Event('click'));
    assert.equal(nodes['probe-correlation'].value, 'mine-1');
    assert.equal(nodes['probe-text'].value, 'my own words');
    assert.match(nodes['probe-token'].value, IDENTIFIER_PATTERN);

    // An empty message is filled around the id the person already chose.
    nodes['probe-text'].value = '';
    nodes['btn-generate-ids'].dispatchEvent(new Event('click'));
    assert.ok(nodes['probe-text'].value.includes('mine-1'));
  } finally { restore(); }
});

test('the character count and the send review follow the fields', async () => {
  const { nodes } = await loadGuide();
  try {
    nodes['probe-text'].value = 'x'.repeat(2001);
    nodes['probe-text'].dispatchEvent(new Event('input'));
    assert.equal(nodes['probe-text-count'].textContent, '2001 / 2000');
    assert.equal(nodes['probe-text-count'].dataset.over, 'yes');
    assert.match(nodes['review-length'].textContent, /Over the 2000 limit/);

    nodes['probe-correlation'].value = 'id-1';
    nodes['probe-token'].value = 'tok-1';
    nodes['probe-text'].value = 'please say hello';
    nodes['probe-text'].dispatchEvent(new Event('input'));
    assert.match(nodes['review-token'].textContent, /does not ask for both/);
  } finally { restore(); }
});

test('copy writes the result text to the clipboard, and says so honestly on failure', async () => {
  const written = [];
  const { world, nodes } = await loadGuide({ clipboard: { writeText: async (text) => { written.push(text); } } });
  try {
    nodes['result-run'].textContent = 'NOT SENT — nothing dispatched';
    const button = new world.StubEl('button');
    button.setAttribute('data-copy-target', 'result-run');
    button.dispatchEvent(new Event('click'));
    await settle();
    assert.deepEqual(written, ['NOT SENT — nothing dispatched']);
    assert.equal(nodes['copy-status'].textContent, 'Copied.');
  } finally { restore(); }

  const failing = await loadGuide({ clipboard: { writeText: async () => { throw new Error('denied'); } } });
  try {
    const button = new failing.world.StubEl('button');
    button.setAttribute('data-copy-target', 'result-run');
    button.dispatchEvent(new Event('click'));
    await settle();
    assert.match(failing.nodes['copy-status'].textContent, /^Could not copy \(denied\)/);
  } finally { restore(); }
});

test('guide.js cannot act: no clicks, no confirmation, no worker, no HTML sinks', () => {
  for (const [pattern, why] of [
    [/\.click\(/, 'programmatic click'],
    [/\.checked\s*=(?!=)/, 'ticking a checkbox'],
    [/sendMessage|chrome\.|runtime\./, 'worker or chrome access'],
    [/innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'HTML sink'],
    [/setInterval|setTimeout/, 'timers'],
    [/aion\/(native|chatgpt|refresh)/, 'act endpoints']
  ]) {
    assert.equal(pattern.test(guideSource.replace(/\/\/.*$/gm, '')), false, 'guide.js must not use ' + why);
  }
});

/* ------------------------------------------------------------------ *
 * Machine view
 * ------------------------------------------------------------------ */

const OBSERVED = {
  observed: true,
  observed_at: '2026-10-18T13:00:00.000Z',
  relay: { status: 'CONNECTED', name: 'native', enabled: true, detail: 'ok', boot_count: 1, worker_started_at: 't' },
  fallback: { mode: 'A', reason: 'native host answered' },
  proof: { last_evidence_at: null },
  outbox: { count: 0, cursor: 1 },
  approval: { pending: 0 }
};

async function loadAgent(reply) {
  const world = makeWorld();
  const { add, document } = world;
  const nodes = {};
  for (const id of [
    'state-line', 'read-stamp', 'problem', 'fields-body', 'snapshot-json', 'aion-snapshot', 'changes',
    'changes-empty', 'catalog-body', 'rules', 'btn-refresh', 'btn-copy-json', 'copy-json-note'
  ]) nodes[id] = add(id);
  nodes['watch-toggle'] = add('watch-toggle', 'input');
  nodes.problem.hidden = true;

  const sent = [];
  const intervals = [];
  const cleared = [];
  const chromeStub = {
    runtime: {
      id: 'ext-id',
      lastError: undefined,
      sendMessage(message, callback) {
        sent.push(message);
        callback(typeof reply === 'function' ? reply(sent.length) : reply);
      }
    }
  };
  install({
    document,
    chrome: chromeStub,
    navigator: { clipboard: { writeText: async () => {} } },
    setInterval: (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; },
    clearInterval: (id) => { cleared.push(id); }
  });
  await load('agent.js');
  await settle();
  return { world, nodes, sent, intervals, cleared };
}

test('the machine view reads once on open and posts only the status message', async () => {
  const { nodes, sent, intervals } = await loadAgent(OBSERVED);
  try {
    assert.deepEqual(sent, [{ type: 'aion/status' }]);
    assert.equal(intervals.length, 0, 'no polling until a person turns it on');
    assert.match(nodes['state-line'].textContent, /^HOST_LINK=CONNECTED MODE=A APPROVALS=CLEAR PROOF=NONE_OBSERVED OUTBOX=0$/);
    assert.equal(nodes.problem.hidden, true);

    const rows = nodes['fields-body'].children;
    const byPath = Object.fromEntries(rows.map((r) => [r.getAttribute('data-field'), r.children[1].textContent]));
    assert.equal(byPath['link.transport'], 'CONNECTED');
    assert.equal(byPath['approval.state'], 'CLEAR');
    assert.equal(byPath['proof.state'], 'NONE_OBSERVED');

    const snapshot = JSON.parse(nodes['aion-snapshot'].textContent);
    assert.equal(snapshot.schema, 'aion.relay-view.v1');
    assert.equal(nodes['snapshot-json'].textContent, nodes['aion-snapshot'].textContent);
  } finally { restore(); }
});

test('the catalog is rendered from the shared list and only status is machine-callable', async () => {
  const { nodes } = await loadAgent(OBSERVED);
  try {
    const rows = nodes['catalog-body'].children;
    assert.equal(rows.length, ACTION_CATALOG.length);
    const callable = rows.filter((r) => r.getAttribute('data-machine-callable') === 'true');
    assert.deepEqual(callable.map((r) => r.getAttribute('data-action-type')), ['aion/status']);
    assert.ok(nodes.rules.children.length >= 5);
  } finally { restore(); }
});

test('a refused or silent worker leaves everything UNKNOWN and says why', async () => {
  const { nodes } = await loadAgent({ observed: false, error: 'SENDER_UNTRUSTED: sender_is_a_tab' });
  try {
    assert.equal(nodes['state-line'].textContent, 'HOST_LINK=UNKNOWN MODE=UNKNOWN APPROVALS=UNKNOWN PROOF=UNKNOWN OUTBOX=UNKNOWN');
    assert.equal(nodes.problem.hidden, false);
    assert.match(nodes.problem.textContent, /sender_is_a_tab/);
    assert.match(nodes.problem.textContent, /not the same as idle/);
    assert.match(nodes['read-stamp'].textContent, /Nothing was observed/);
  } finally { restore(); }
});

test('reading again records what changed, and every read stays read-only', async () => {
  const { nodes, sent } = await loadAgent((n) => (n === 1
    ? OBSERVED
    : { ...OBSERVED, relay: { ...OBSERVED.relay, status: 'DEGRADED' } }));
  try {
    assert.equal(nodes['changes-empty'].hidden, false);
    nodes['btn-refresh'].dispatchEvent(new Event('click'));
    await settle();
    nodes['btn-refresh'].dispatchEvent(new Event('click'));
    await settle();
    assert.equal(nodes['changes-empty'].hidden, true);
    assert.equal(nodes.changes.children.length, 1);
    assert.match(nodes.changes.textContent, /link\.transport: CONNECTED → DEGRADED/);
    assert.ok(sent.length >= 3);
    for (const message of sent) assert.deepEqual(message, { type: 'aion/status' });
  } finally { restore(); }
});

test('re-reading on a timer happens only after a person turns it on, and stops when they turn it off', async () => {
  const { nodes, intervals, cleared } = await loadAgent(OBSERVED);
  try {
    nodes['watch-toggle'].checked = true;
    nodes['watch-toggle'].dispatchEvent(new Event('change'));
    assert.equal(intervals.length, 1);
    assert.equal(intervals[0].ms, 5000);

    nodes['watch-toggle'].checked = false;
    nodes['watch-toggle'].dispatchEvent(new Event('change'));
    assert.equal(cleared.length, 1);
  } finally { restore(); }
});

test('agent.js and view-model.js can post nothing but the status message', () => {
  const code = (source) => source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const agent = code(agentSource);
  for (const [pattern, why] of [
    [/aion\/(native|chatgpt|refresh)/, 'an act endpoint'],
    [/innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'an HTML sink'],
    [/\.click\(/, 'a programmatic click'],
    [/sendMessage/, 'a direct worker call (it goes through readStatus)']
  ]) {
    assert.equal(pattern.test(agent), false, 'agent.js must not contain ' + why);
  }
  // The one place a message is built.
  const posts = [...code(viewModelSource).matchAll(/sendMessage\(\{ type: '([^']+)' \}/g)].map((m) => m[1]);
  assert.deepEqual(posts, ['aion/status']);
});

/* ------------------------------------------------------------------ *
 * Markup, for both pages
 * ------------------------------------------------------------------ */

for (const [name, html] of [['sidepanel.html', humanHtml], ['agent.html', agentHtml]]) {
  test(`${name}: ids are unique and every reference resolves`, () => {
    const ids = idsOf(html);
    assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
    const clean = strip(html);
    for (const m of clean.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) assert.ok(ids.includes(m[1]), 'label target ' + m[1]);
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      for (const m of clean.matchAll(new RegExp(`\\s${attr}="([^"]+)"`, 'g'))) {
        for (const ref of m[1].split(/\s+/).filter(Boolean)) assert.ok(ids.includes(ref), `${attr} target ${ref}`);
      }
    }
    const labelled = new Set([...clean.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
    for (const m of clean.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
      const id = (m[0].match(/\sid="([^"]+)"/) || [])[1];
      assert.ok(id && labelled.has(id), 'control needs a label: ' + m[0].slice(0, 60));
    }
  });

  test(`${name}: every class is styled, nothing is loaded from outside, and the view switch is present`, () => {
    const clean = strip(html);
    const classes = new Set([...clean.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
    for (const cls of classes) assert.ok(css.includes('.' + cls), 'unstyled class ' + cls);
    assert.equal(/(src|href)=["']https?:/i.test(html), false);
    assert.match(clean, /id="view-human"/);
    assert.match(clean, /id="view-machine"/);
    const current = [...clean.matchAll(/<a [^>]*aria-current="page"[^>]*>/g)];
    assert.equal(current.length, 1);
  });
}

test('every element the guide and the machine view look up exists in their page', () => {
  const hooks = (source) => new Set([
    ...[...source.matchAll(/\bel\('([^']+)'\)/g)].map((m) => m[1]),
    ...[...source.matchAll(/(?:valueOf|stateOf|setField)\('([^']+)'/g)].map((m) => m[1]),
    ...[...source.matchAll(/for \(const id of \[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]))
  ]);
  const human = new Set(idsOf(humanHtml));
  for (const id of hooks(guideSource)) assert.ok(human.has(id), 'guide.js looks up #' + id + ' which sidepanel.html lacks');
  const agent = new Set(idsOf(agentHtml));
  for (const id of hooks(agentSource)) assert.ok(agent.has(id), 'agent.js looks up #' + id + ' which agent.html lacks');
});

test('the human page loads the guide separately, so a guide fault cannot reach the controls', () => {
  assert.match(humanHtml, /<script type="module" src="panel\.js"><\/script>/);
  assert.match(humanHtml, /<script type="module" src="guide\.js"><\/script>/);
  assert.equal(/import[^;]*guide/.test(read('panel.js')), false, 'panel.js must not import the guide');
});

test('the machine page is read-only: one opt-in checkbox, two safe buttons, no text inputs', () => {
  const clean = strip(agentHtml);
  assert.equal(/<(textarea|select)\b/.test(clean), false);
  const inputs = [...clean.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(inputs.length, 1);
  assert.match(inputs[0], /type="checkbox"/);
  assert.match(inputs[0], /id="watch-toggle"/);
  const buttons = [...clean.matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(buttons.sort(), ['btn-copy-json', 'btn-refresh']);
  assert.match(clean, /data-guarantee="read-only"/);
});

test('agent.html embeds the snapshot as inert JSON and loads its stylesheets and script', () => {
  assert.match(agentHtml, /<script type="application\/json" id="aion-snapshot">/);
  assert.match(agentHtml, /href="panel\.css"/);
  assert.match(agentHtml, /href="agent\.css"/);
  assert.match(agentHtml, /<script type="module" src="agent\.js"><\/script>/);
});

test('copy about the manifest stays true: chatgpt.com only, passive, no credentials', () => {
  assert.doesNotMatch(humanHtml, /no content scripts|no host permissions/i);
  assert.match(humanHtml, /chatgpt\.com only/);
});
