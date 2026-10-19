// Bus panel page: markup hygiene (same rules as the other views), hooks resolve,
// only real bus endpoints are called, and gated endpoints carry the gesture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUS_ENDPOINTS } from '../src/background/bus.js';

const read = (f) => readFileSync(new URL(`../src/panel/${f}`, import.meta.url), 'utf8');
const html = read('bus.html');
const js = read('bus.js');
const css = read('panel.css') + read('bus.css');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

test('ids unique, every control labelled, every class styled, nothing remote, one current view', () => {
  assert.equal(new Set(ids).size, ids.length);
  const labelled = new Set([...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const id = (m[0].match(/\sid="([^"]+)"/) || [])[1];
    assert.ok(id && labelled.has(id), m[0]);
  }
  for (const cls of new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))) assert.ok(css.includes(`.${cls}`), cls);
  assert.equal(/(src|href)=["']https?:/i.test(html), false);
  assert.equal([...html.matchAll(/aria-current="page"/g)].length, 1);
  for (const a of ['view-human', 'view-machine', 'view-bus']) assert.ok(ids.includes(a));
});

test('every element bus.js looks up exists', () => {
  for (const m of js.matchAll(/el\('([^']+)'\)/g)) assert.ok(ids.includes(m[1]), m[1]);
  for (const a of ['start', 'sample', 'reload', 'finish']) assert.ok(ids.includes(`sync-${a}`));
});

test('only declared bus endpoints are called; gated ones always go through act() with the gesture', () => {
  const used = [...js.matchAll(/'(aion\/bus-[a-z0-9-]+)'/g)].map((m) => m[1]);
  for (const t of used) assert.ok(BUS_ENDPOINTS.includes(t), t);
  for (const gated of ['aion/bus-resume', 'aion/bus-scan', 'aion/bus-agent', 'aion/bus-commander', 'aion/bus-grant', 'aion/bus-config', 'aion/bus-dispose', 'aion/bus-archive']) {
    assert.match(js, new RegExp(`act\\('${gated}'`), gated);
  }
  assert.match(js, /const act = \(type, extra = \{\}\) => send\(\{ type, user_gesture: true/);
  assert.equal(/innerHTML/.test(js), false, 'worker data is never rendered as markup');
});
