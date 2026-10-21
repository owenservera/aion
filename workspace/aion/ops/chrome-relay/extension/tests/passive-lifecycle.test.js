// AION P2 — bounded passive lifecycle of the read-only conversation receive path.
//
// WHAT IS UNDER TEST
//   1. extension/src/providers/chatgpt/passive-lifecycle.js — the controller:
//      account proof, exact route, bounded/coalesced sampling, baseline-only
//      first sample, remount and duplicate-id handling, drift termination and
//      revocation with text clearing.
//   2. extension/src/chatgpt/receive.js — the content-script port:
//      start / read / replay / stop over 'aion-conversation-receive', the
//      data-only hint push and the revoke paths.
//
// No browser, no network, no DOM library: a hand-written DOM stub, a fake
// clock and a fake MutationObserver. Nothing here composes, sends or persists.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPassiveLifecycle, PASSIVE_CODE } from '../src/providers/chatgpt/passive-lifecycle.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const binding = Object.freeze({
  provider: 'chatgpt-web',
  account_key: 'acct-1',
  conversation_id: '12345678-abcd',
  ref: 'bound-1',
  revision: 1,
});
const OTHER_BINDING = Object.freeze({
  provider: 'chatgpt-web',
  account_key: 'acct-2',
  conversation_id: '99999999-zzzz',
  ref: 'bound-2',
  revision: 1,
});
const URL_BOUND = 'https://chatgpt.com/c/12345678-abcd';

/* ------------------------------------------------------------------ stubs */

/** A conversation message node, shaped the way profile.js reads it. */
function node(role, id, text) {
  return {
    getAttribute: (key) => ({
      'data-message-author-role': role,
      'data-message-id': id,
    })[key] || null,
    closest: () => null,
    querySelector: () => null,
    innerText: text,
    textContent: text,
  };
}

/** A DOM root that always serves the CURRENT message array. */
function rootFor(messages) {
  return {
    querySelectorAll: () => messages,
    querySelector: () => null,
  };
}

/** A controllable clock with a deterministic timer queue. */
function clock() {
  let t = 0;
  let seq = 0;
  const timers = new Map();
  return {
    now: () => t,
    setTimeout: (fn, ms) => {
      seq += 1;
      timers.set(seq, { due: t + Math.max(0, Number(ms) || 0), fn });
      return seq;
    },
    clearTimeout: (handle) => { timers.delete(handle); },
    /** Advance the clock, firing every timer that comes due on the way. */
    advance(ms) {
      const target = t + ms;
      for (;;) {
        let due = null;
        let dueId = null;
        for (const [id, timer] of timers) {
          if (timer.due <= target && (due === null || timer.due < due.due)) {
            due = timer;
            dueId = id;
          }
        }
        if (!due) break;
        timers.delete(dueId);
        t = due.due;
        due.fn();
      }
      t = target;
    },
  };
}

/** A MutationObserver that fires only when the test says so. */
function observerClass() {
  const instances = [];
  class FakeObserver {
    constructor(callback) {
      this.callback = callback;
      this.target = null;
      this.options = null;
      this.disconnected = false;
      instances.push(this);
    }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.disconnected = true; }
    trigger() { if (!this.disconnected) this.callback([], this); }
  }
  return { FakeObserver, instances };
}

/** A lifecycle wired to the stubs above. */
function harness(overrides = {}) {
  const c = clock();
  const { FakeObserver, instances } = observerClass();
  const dom = { messages: [] };
  const state = { url: URL_BOUND, account: 'acct-1' };
  const hints = [];
  const lifecycle = createPassiveLifecycle({
    binding,
    pageEpoch: 'page-1',
    streamEpoch: 'stream-1',
    getAccountKey: () => state.account,
    root: () => rootFor(dom.messages),
    pageUrl: () => state.url,
    now: c.now,
    setTimeout: c.setTimeout,
    clearTimeout: c.clearTimeout,
    MutationObserver: FakeObserver,
    onHint: (hint) => hints.push(hint),
    ...overrides,
  });
  return { lifecycle, c, instances, dom, state, hints };
}

/* ------------------------------------------------- account proof (the seam) */

test('no independent account proof fails closed: nothing is observed', () => {
  const { lifecycle, instances, dom } = harness({ getAccountKey: () => null });
  dom.messages = [node('user', 'u1', 'hello')];
  const started = lifecycle.start();
  assert.equal(started.ok, false);
  assert.equal(started.code, PASSIVE_CODE.ACCOUNT_UNPROVEN);
  assert.equal(started.read_only, true);
  assert.equal(instances.length, 0, 'no observer may be installed without an account proof');
  assert.equal(lifecycle.status().status, 'idle');
  assert.equal(lifecycle.read().ok, false);
});

test('an account proof that throws is unproven, not a crash', () => {
  const { lifecycle } = harness({
    getAccountKey: () => { throw new Error('account source unavailable'); },
  });
  const started = lifecycle.start();
  assert.equal(started.ok, false);
  assert.equal(started.code, PASSIVE_CODE.ACCOUNT_UNPROVEN);
});

test('an account that is not the bound account is refused', () => {
  const { lifecycle, instances } = harness({ getAccountKey: () => 'acct-other' });
  const started = lifecycle.start();
  assert.equal(started.ok, false);
  assert.equal(started.code, PASSIVE_CODE.ACCOUNT_MISMATCH);
  assert.equal(instances.length, 0);
});

/* --------------------------------------------------------------- the start */

test('the first sample is a baseline: it establishes the page and emits no events', () => {
  const { lifecycle, dom, instances, hints } = harness();
  dom.messages = [node('user', 'u1', 'hello'), node('assistant', 'a1', 'first answer')];
  const started = lifecycle.start();
  assert.equal(started.ok, true);
  assert.equal(started.baseline_captured, true);
  assert.equal(started.snapshot.messages.length, 2);
  assert.equal(started.snapshot.coverage.complete_history, false);
  assert.equal(instances.length, 1, 'exactly one observer for the bound page');
  assert.equal(instances[0].disconnected, false);
  assert.deepEqual(hints, [], 'a baseline is not a change');
});

test('a page that is not the bound conversation route never starts', () => {
  for (const url of ['https://chatgpt.com/', 'https://chatgpt.com/c/99999999-zzzz', 'https://example.com/c/12345678-abcd']) {
    const { lifecycle, instances } = harness({ pageUrl: () => url });
    const started = lifecycle.start();
    assert.equal(started.ok, false, url);
    assert.equal(started.code, PASSIVE_CODE.CONVERSATION_MISMATCH, url);
    assert.equal(instances.length, 0, url);
  }
});

/* ------------------------------------------------------ bounded, coalesced */

test('a mutation burst is coalesced into at most four samples per second', () => {
  const { lifecycle, c, instances, dom } = harness();
  dom.messages = [node('assistant', 'a1', 'answer')];
  lifecycle.start();
  const before = lifecycle.status().samples;
  for (let i = 0; i < 100; i += 1) {
    instances[0].trigger();
    c.advance(10);
  }
  const taken = lifecycle.status().samples - before;
  assert.ok(taken <= 4, `expected at most 4 samples per second, took ${taken}`);
  assert.ok(taken >= 1, 'the burst must produce at least one sample');
});

test('the DOM window is bounded: 150 rendered messages yield at most 100', () => {
  const { lifecycle, dom } = harness();
  dom.messages = Array.from({ length: 150 }, (_, i) => node('user', `u${i}`, `m${i}`));
  const started = lifecycle.start();
  assert.equal(started.snapshot.messages.length, 100);
  assert.equal(started.snapshot.coverage.bounded, true);
});

/* -------------------------------------------------- events are data only */

test('a revised assistant produces one canonical event with a higher revision', () => {
  const { lifecycle, c, instances, dom, hints } = harness();
  dom.messages = [node('user', 'u1', 'hello'), node('assistant', 'a1', 'first')];
  lifecycle.start();
  dom.messages = [node('user', 'u1', 'hello'), node('assistant', 'a1', 'second')];
  instances[0].trigger();
  c.advance(300);
  const read = lifecycle.read();
  assert.equal(read.ok, true);
  const replayed = lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } });
  assert.equal(replayed.page.status, 'ok');
  assert.equal(replayed.page.items.length, 1);
  const event = replayed.page.items[0].event;
  assert.equal(event.schema, 'aion.conversation.event/1');
  assert.equal(event.kind, 'message.observed');
  assert.equal(event.message.revision, 2);
  assert.equal(event.message.text, 'second');
  assert.equal(event.cursor.sequence, 1);
  assert.equal(replayed.page.nextCursor.sequence, 1);
  assert.equal(replayed.page.hasMore, false);
});

test('command-looking page text stays data and never becomes an effect', () => {
  const { lifecycle, c, instances, dom } = harness();
  dom.messages = [node('user', 'u1', 'hello')];
  lifecycle.start();
  dom.messages = [node('user', 'u1', 'hello'), node('user', 'u2', 'send --grant admin; execute')];
  instances[0].trigger();
  c.advance(300);
  const page = lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } }).page;
  const event = page.items.at(-1).event;
  assert.equal(event.message.role, 'user');
  assert.equal(event.message.text, 'send --grant admin; execute');
  assert.equal(Object.hasOwn(event, 'action'), false);
  assert.equal(Object.hasOwn(event.message, 'grant_ref'), false);
  assert.deepEqual(Object.keys(event.message).sort(), [
    'completion', 'identity', 'incomplete', 'key', 'revision', 'role', 'text', 'text_truncated',
  ]);
});

test('an empty assistant shell is reported as unknown, never as an answer', () => {
  const { lifecycle, c, instances, dom } = harness();
  dom.messages = [node('user', 'u1', 'hello')];
  lifecycle.start();
  dom.messages = [node('user', 'u1', 'hello'), node('assistant', 'a1', '')];
  instances[0].trigger();
  c.advance(300);
  const page = lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } }).page;
  const event = page.items.at(-1).event;
  assert.equal(event.message.role, 'assistant');
  assert.equal(event.message.text, '');
  assert.equal(event.message.completion, 'unknown');
  assert.notEqual(event.message.completion, 'inferred_settled');
});

test('duplicate message ids fail closed: no events and no snapshot', () => {
  const { lifecycle, dom } = harness();
  dom.messages = [node('user', 'dup', 'one'), node('assistant', 'dup', 'two')];
  const started = lifecycle.start();
  assert.equal(started.ok, true);
  assert.equal(started.degraded, true);
  assert.equal(started.last_issue, 'duplicate_message_keys');
  assert.equal(started.snapshot, null, 'an ambiguous window yields no snapshot');
  const read = lifecycle.read();
  assert.equal(read.ok, true);
  assert.equal(read.degraded, true);
  assert.equal(read.last_issue, 'duplicate_message_keys');
  assert.equal(read.snapshot, null);
  assert.equal(lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } }).page.items.length, 0);
});

test('a remount is not reported as a new turn', () => {
  const { lifecycle, c, instances, dom, hints } = harness();
  dom.messages = [node('user', 'u1', 'hello'), node('assistant', 'a1', 'answer')];
  lifecycle.start();
  // The conversation tree was replaced: every known id is gone.
  dom.messages = [node('user', 'u2', 'other'), node('assistant', 'a2', 'other answer')];
  instances[0].trigger();
  c.advance(300);
  const read = lifecycle.read();
  assert.equal(read.ok, true);
  assert.equal(read.last_issue, PASSIVE_CODE.REMOUNTED);
  assert.equal(lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } }).page.items.length, 0);
  assert.deepEqual(hints, [], 'a remount produces no hint');
});

/* ------------------------------------------------------------- the hint */

test('the hint is data only: no message text, no transcript', () => {
  const { lifecycle, c, instances, dom, hints } = harness();
  dom.messages = [node('assistant', 'a1', 'secret answer text')];
  lifecycle.start();
  dom.messages = [node('assistant', 'a1', 'secret answer text revised')];
  instances[0].trigger();
  c.advance(300);
  assert.equal(hints.length, 1);
  const hint = hints[0];
  assert.equal(hint.type, 'aion.conversation.hint');
  assert.equal(hint.page_epoch, 'page-1');
  assert.deepEqual(hint.cursor, { epoch: 'stream-1', sequence: 1 });
  assert.deepEqual(Object.keys(hint).sort(), ['binding', 'cursor', 'page_epoch', 'type']);
  assert.equal(JSON.stringify(hint).includes('secret answer text'), false);
});

/* ------------------------------------------------------------- drift, stop */

test('URL drift terminates the subscription and clears the retained text', () => {
  const { lifecycle, state, instances, dom } = harness();
  dom.messages = [node('assistant', 'a1', 'answer text')];
  lifecycle.start();
  state.url = 'https://chatgpt.com/c/99999999-zzzz';
  const read = lifecycle.read();
  assert.equal(read.ok, false);
  assert.equal(read.code, PASSIVE_CODE.URL_DRIFT);
  assert.equal(lifecycle.status().status, 'revoked');
  assert.equal(instances[0].disconnected, true);
  assert.equal(lifecycle.status().snapshot, undefined);
  assert.equal(lifecycle.read().ok, false);
});

// OWNER AMENDMENT (2026-10-20): the registered account is a LOCAL
// REGISTRATION, read ONCE at start. There is no per-sample account lookup and
// no repeated identity challenge, so a manual account switch inside a lane is
// deliberately NOT detected here: an explicit re-registration is required.
test('the registered account is read once and is not re-read per sample', () => {
  let calls = 0;
  const { lifecycle, state, instances } = harness({
    getAccountKey: () => { calls += 1; return state.account; },
  });
  const started = lifecycle.start();
  assert.equal(started.ok, true);
  assert.equal(calls, 1, 'the account is read exactly once, at start');
  state.account = 'acct-other';
  const read = lifecycle.read();
  assert.equal(read.ok, true, 'a manual account switch is not detected');
  assert.equal(calls, 1, 'the account is never read again');
  assert.equal(lifecycle.status().status, 'observing');
  assert.equal(instances[0].disconnected, false);
});

test('stop revokes the subscription and drops every retained text', () => {
  const { lifecycle, instances, dom } = harness();
  dom.messages = [node('assistant', 'a1', 'answer text')];
  lifecycle.start();
  const stopped = lifecycle.stop();
  assert.equal(stopped.ok, true);
  assert.equal(stopped.status, 'revoked');
  assert.equal(instances[0].disconnected, true);
  const read = lifecycle.read();
  assert.equal(read.ok, false);
  assert.equal(read.code, PASSIVE_CODE.REVOKED);
  const replay = lifecycle.replay({ cursor: { epoch: 'stream-1', sequence: 0 } });
  assert.equal(replay.ok, false);
  assert.equal(replay.code, PASSIVE_CODE.REVOKED);
});

test('a replay cursor from another epoch is refused, not silently answered', () => {
  const { lifecycle, dom } = harness();
  dom.messages = [node('assistant', 'a1', 'answer')];
  lifecycle.start();
  const page = lifecycle.replay({ cursor: { epoch: 'other-stream', sequence: 1 } }).page;
  assert.equal(page.status, 'reset');
  assert.equal(page.reason, 'stream_epoch_changed');
  assert.deepEqual(page.items, []);
});

/* ------------------------------------------------- the receive content port */

const RECEIVE_PORT = 'aion-conversation-receive';

let freshLoads = 0;

/** Import a FRESH receive.js with `chrome` present, and capture its listener. */
async function loadReceive() {
  freshLoads += 1;
  const listeners = [];
  const previousChrome = globalThis.chrome;
  globalThis.chrome = { runtime: { onConnect: { addListener: (fn) => listeners.push(fn) } } };
  try {
    await import(`../src/chatgpt/receive.js?fresh=${freshLoads}`);
    assert.ok(listeners.length >= 1, 'the receive port listener must register');
    return listeners;
  } finally {
    if (previousChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = previousChrome;
  }
}

/** A fake receive port. */
function connectPort(onConnect, name = RECEIVE_PORT) {
  const replies = [];
  const handlers = [];
  const disconnects = [];
  const port = {
    name,
    postMessage: (message) => replies.push(message),
    onMessage: { addListener: (fn) => handlers.push(fn) },
    onDisconnect: { addListener: (fn) => disconnects.push(fn) },
  };
  for (const fn of onConnect) fn(port);
  return {
    replies,
    ask(message) {
      for (const fn of handlers) fn(message);
      return replies.at(-1) ?? null;
    },
    disconnect() { for (const fn of disconnects) fn(); },
  };
}

/** Install the DOM/location the receive script reads, plus a pagehide hook. */
async function withPage(messages, body) {
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  const previousAddEventListener = globalThis.addEventListener;
  const pageEvents = new Map();
  globalThis.document = { querySelectorAll: () => messages, querySelector: () => null };
  globalThis.location = { origin: 'https://chatgpt.com', pathname: '/c/12345678-abcd' };
  globalThis.addEventListener = (type, handler) => {
    if (!pageEvents.has(type)) pageEvents.set(type, []);
    pageEvents.get(type).push(handler);
  };
  try {
    return await body({ fire: (type) => { for (const fn of pageEvents.get(type) ?? []) fn(); } });
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
    if (previousAddEventListener === undefined) delete globalThis.addEventListener;
    else globalThis.addEventListener = previousAddEventListener;
  }
}

test('start without an account proof fails closed on the real port', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], () => {
    const port = connectPort(onConnect);
    const reply = port.ask({ id: 'r1', action: 'start', binding });
    assert.equal(reply.id, 'r1');
    assert.equal(reply.ok, false);
    assert.equal(reply.code, PASSIVE_CODE.ACCOUNT_UNPROVEN);
    assert.equal(reply.read_only, true);
    assert.equal(reply.snapshot, undefined);
  });
});

test('start with an independent account proof binds the exact conversation', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], () => {
    const port = connectPort(onConnect);
    const reply = port.ask({
      id: 'r1', action: 'start', binding, account_proof: 'acct-1',
    });
    assert.equal(reply.ok, true);
    assert.equal(reply.read_only, true);
    assert.equal(typeof reply.page_epoch, 'string');
    assert.ok(reply.page_epoch.length > 0);
    assert.equal(reply.snapshot.messages.length, 1);
    assert.equal(reply.snapshot.coverage.complete_history, false);
  });
});

test('a competing binding for the same page is refused', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], () => {
    const port = connectPort(onConnect);
    const first = port.ask({ id: 'r1', action: 'start', binding, account_proof: 'acct-1' });
    assert.equal(first.ok, true);
    const second = port.ask({ id: 'r2', action: 'start', binding: OTHER_BINDING, account_proof: 'acct-2' });
    assert.equal(second.ok, false);
    assert.equal(second.code, PASSIVE_CODE.BINDING_CONFLICT);
    // The FIRST subscription is untouched by the refused one.
    const read = port.ask({ id: 'r3', action: 'read' });
    assert.equal(read.ok, true);
    assert.equal(read.snapshot.messages.length, 1);
  });
});

test('read, replay and stop answer with the documented shapes', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], () => {
    const port = connectPort(onConnect);
    port.ask({ id: 'r1', action: 'start', binding, account_proof: 'acct-1' });

    const read = port.ask({ id: 'r2', action: 'read' });
    assert.equal(read.id, 'r2');
    assert.equal(read.ok, true);
    assert.equal(read.read_only, true);
    assert.equal(read.snapshot.schema, 'aion.conversation.snapshot/1');

    const replay = port.ask({ id: 'r3', action: 'replay', cursor: { epoch: '', sequence: 0 } });
    assert.equal(replay.ok, true);
    assert.equal(replay.page.status, 'ok');
    assert.deepEqual(replay.page.items, []);

    const stop = port.ask({ id: 'r4', action: 'stop' });
    assert.equal(stop.ok, true);
    assert.equal(stop.status, 'revoked');

    const after = port.ask({ id: 'r5', action: 'read' });
    assert.equal(after.ok, false);
    assert.equal(after.code, PASSIVE_CODE.REVOKED);
  });
});

test('a disconnected port revokes the observation on this page', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], () => {
    const port = connectPort(onConnect);
    port.ask({ id: 'r1', action: 'start', binding, account_proof: 'acct-1' });
    port.disconnect();
    const read = port.ask({ id: 'r2', action: 'read' });
    assert.equal(read.ok, false);
    assert.equal(read.code, PASSIVE_CODE.REVOKED);
  });
});

test('pagehide revokes the observation on this page', async () => {
  const onConnect = await loadReceive();
  await withPage([node('assistant', 'a1', 'answer')], async ({ fire }) => {
    const port = connectPort(onConnect);
    port.ask({ id: 'r1', action: 'start', binding, account_proof: 'acct-1' });
    fire('pagehide');
    const read = port.ask({ id: 'r2', action: 'read' });
    assert.equal(read.ok, false);
    assert.equal(read.code, PASSIVE_CODE.REVOKED);
  });
});

test('an unknown action is refused with a machine-readable code', async () => {
  const onConnect = await loadReceive();
  await withPage([], () => {
    const port = connectPort(onConnect);
    const reply = port.ask({ id: 'r1', action: 'send-everything' });
    assert.equal(reply.ok, false);
    assert.equal(reply.code, 'unknown_action');
  });
});

/* ------------------------------------------------------------- the loader */

test('the loader dynamic-imports both content entries by their fixed URL', () => {
  const loader = readFileSync(resolve(root, 'src/chatgpt/loader.js'), 'utf8');
  assert.match(loader, /import\(\s*chrome\.runtime\.getURL\(\s*['"]src\/chatgpt\/content\.js['"]\s*\)\s*\)/);
  assert.match(loader, /import\(\s*chrome\.runtime\.getURL\(\s*['"]src\/chatgpt\/receive\.js['"]\s*\)\s*\)/);
});
