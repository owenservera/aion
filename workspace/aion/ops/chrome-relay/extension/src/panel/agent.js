// AION Relay Station — machine view.
//
// A read-only page for agents (computer use, browser use, ACP tooling) and for
// anyone who wants the relay state as plain structured data.
//
// Read-only on purpose, and enforced three ways:
//   1. The only worker message this page can post is { type: 'aion/status' }, and
//      it is built inside readStatus() in view-model.js, not here.
//   2. This file contains no other message type. A test scans for them.
//   3. The page has no field that accepts text and no button that acts. The only
//      controls are Read now, Copy snapshot and an opt-in re-read toggle.
//
// Truth contract: a value nobody observed is the string UNKNOWN, never idle or 0.
// If the worker does not answer, or refuses this sender, the snapshot says
// observed:false and why. It never guesses a plausible state.

import {
  ACTION_CATALOG,
  READING_RULES,
  diffSnapshots,
  readStatus,
  snapshotFromStatus,
  snapshotJson,
  snapshotRows,
  stateLine
} from './view-model.js';

const WATCH_INTERVAL_MS = 5000;
const MAX_CHANGES = 50;

const runtime = typeof chrome !== 'undefined' && chrome && chrome.runtime ? chrome.runtime : null;

function el(id) {
  return document.getElementById(id);
}

function cell(tag, text, attributes) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (attributes) {
    for (const key of Object.keys(attributes)) node.setAttribute(key, attributes[key]);
  }
  return node;
}

let previous = null;
let latestJson = '{}';
let busy = false;
let watchTimer = null;

/* ------------------------------------------------------------------ *
 * Rendering (textContent only; nothing from the worker becomes markup)
 * ------------------------------------------------------------------ */

function renderSnapshot(snapshot) {
  const line = el('state-line');
  if (line) line.textContent = stateLine(snapshot);

  const stamp = el('read-stamp');
  if (stamp) {
    stamp.textContent = snapshot.observed
      ? 'Read at ' + snapshot.taken_at + '. One observation, not a continuing guarantee.'
      : 'Read attempted at ' + snapshot.taken_at + '. Nothing was observed.';
  }

  const problem = el('problem');
  if (problem) {
    problem.hidden = snapshot.problem === null;
    problem.textContent = snapshot.problem === null
      ? ''
      : snapshot.problem + ' Every field below is UNKNOWN, which is not the same as idle.';
  }

  const body = el('fields-body');
  if (body) {
    body.textContent = '';
    for (const row of snapshotRows(snapshot)) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-field', row.path);
      tr.append(cell('th', row.path, { scope: 'row' }), cell('td', row.value));
      body.append(tr);
    }
  }

  latestJson = snapshotJson(snapshot);
  const pre = el('snapshot-json');
  if (pre) pre.textContent = latestJson;
  const script = el('aion-snapshot');
  if (script) script.textContent = latestJson;
}

function renderChanges(changes, takenAt) {
  if (changes.length === 0) return;
  const list = el('changes');
  const empty = el('changes-empty');
  if (!list) return;
  if (empty) empty.hidden = true;

  const item = document.createElement('li');
  item.setAttribute('data-read-at', takenAt);
  item.append(cell('span', takenAt + ' '));
  item.append(cell('span', changes.map((c) => c.path + ': ' + c.from + ' → ' + c.to).join('; ')));
  list.prepend(item);
  while (list.children.length > MAX_CHANGES) list.removeChild(list.lastChild);
}

function renderStatic() {
  const catalog = el('catalog-body');
  if (catalog) {
    catalog.textContent = '';
    for (const action of ACTION_CATALOG) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-action-type', action.type);
      tr.setAttribute('data-kind', action.kind);
      tr.setAttribute('data-machine-callable', String(action.machine_view));
      const name = cell('th', action.type, { scope: 'row' });
      name.append(document.createElement('br'), cell('span', action.summary, { class: 'catalog__summary' }));
      tr.append(name, cell('td', action.kind), cell('td', action.machine_view ? 'Yes, read only' : 'No. A person, from the view for people.'));
      catalog.append(tr);
    }
  }

  const rules = el('rules');
  if (rules) {
    rules.textContent = '';
    for (const rule of READING_RULES) rules.append(cell('li', rule));
  }
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

async function read() {
  if (busy) return;
  busy = true;
  const button = el('btn-refresh');
  if (button) button.setAttribute('aria-busy', 'true');
  try {
    const status = await readStatus(runtime);
    const snapshot = snapshotFromStatus(status, Date.now());
    renderChanges(diffSnapshots(previous, snapshot), snapshot.taken_at);
    previous = snapshot;
    renderSnapshot(snapshot);
  } finally {
    busy = false;
    if (button) button.removeAttribute('aria-busy');
  }
}

function setWatching(on) {
  if (watchTimer !== null) {
    clearInterval(watchTimer);
    watchTimer = null;
  }
  if (on) {
    watchTimer = setInterval(() => {
      if (document.visibilityState === 'visible') read();
    }, WATCH_INTERVAL_MS);
  }
}

async function copySnapshot() {
  const note = el('copy-json-note');
  try {
    await navigator.clipboard.writeText(latestJson);
    if (note) note.textContent = 'Copied the snapshot.';
  } catch (error) {
    if (note) {
      note.textContent = 'Could not copy (' + String(error && error.message ? error.message : error) + '). Open Snapshot as JSON and copy it by hand.';
    }
  }
}

function boot() {
  renderStatic();

  const refresh = el('btn-refresh');
  if (refresh) refresh.addEventListener('click', () => { read(); });

  const copy = el('btn-copy-json');
  if (copy) copy.addEventListener('click', () => { copySnapshot(); });

  const watch = el('watch-toggle');
  if (watch) watch.addEventListener('change', () => setWatching(watch.checked === true));

  // One read when the page opens: it observes and changes nothing.
  read();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && watch && watch.checked) read();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
