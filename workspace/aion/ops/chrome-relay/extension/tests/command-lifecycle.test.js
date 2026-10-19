import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_POLICY, COMMAND_WORK, resolveCommandDeadline } from '../src/lib/command-deadlines.js';
import { createBoundedLifecycle } from '../src/lib/bounded-lifecycle.js';
import { createChatGPTPortDriver, DISPATCH_KEY, DISPATCH_SCHEMA } from '../src/background/chatgpt-port.js';
import { __testing as worker } from '../src/background/service-worker.js';

const tiny = Object.fromEntries(Object.keys(COMMAND_POLICY).map((key) => [key, 10]));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function drain() { for (let i = 0; i < 80; i++) await Promise.resolve(); }
function clock() {
  let now = 0, id = 0;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, delay) { timers.set(++id, { fn, at: now + delay }); return id; },
    clearTimeout(key) { timers.delete(key); },
    get pending() { return timers.size; },
    async advance(ms) {
      const end = now + ms;
      await drain();
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await drain();
      }
      now = end; await drain();
    },
  };
}

for (const command of Object.keys(COMMAND_WORK)) {
  test(`deadline plan ${command}: defaults, minima, maxima and panel margin`, () => {
    for (const requestedWorkMs of [undefined, 1, COMMAND_WORK[command], COMMAND_WORK[command] + 1, Number.MAX_SAFE_INTEGER]) {
      const plan = resolveCommandDeadline({ command, requestedWorkMs });
      assert.equal(plan.workMs, requestedWorkMs === undefined ? COMMAND_WORK[command] : Math.min(requestedWorkMs, COMMAND_WORK[command]));
      assert.equal(plan.inactivity, null);
      assert.equal(plan.absoluteMs, Object.values(plan.stages).reduce((a, b) => a + b));
      assert.equal(plan.panelMs, plan.absoluteMs + COMMAND_POLICY.responseMargin);
      assert.ok(plan.panelMs > plan.absoluteMs);
      assert.ok(Object.isFrozen(plan.stages));
    }
  });
}

test('budgets reject malformed, overflow and unknown commands/policy', () => {
  for (const requestedWorkMs of [NaN, Infinity, -Infinity, '300000', null, false, {}, 0, -1, 1.1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => resolveCommandDeadline({ command: 'run-turn', requestedWorkMs }));
  }
  for (const command of ['unknown', '__proto__', undefined]) assert.throws(() => resolveCommandDeadline({ command }));
  for (const overrides of [{ hydration: 0 }, { responseMargin: Infinity }, { grace: '5' }, { surprise: 1 }, { setup: 401 }]) {
    assert.throws(() => resolveCommandDeadline({ command: 'ping' }, overrides));
  }
  assert.equal(resolveCommandDeadline({ command: 'run-turn', requestedWorkMs: 1 }, tiny).stages.exchange, 21);
});

test('lifecycle shares elapsed absolute budget and finishes once, cleaning timers', async () => {
  const time = clock();
  const plan = resolveCommandDeadline({ command: 'ping', requestedWorkMs: 5 }, tiny);
  const life = createBoundedLifecycle(plan, time);
  let cleaned = 0;
  life.addCleanup(() => { cleaned++; throw new Error('cleanup'); });
  await life.wait('hydration', () => 'ready');
  await time.advance(8);
  assert.equal(life.remainingMs(), plan.absoluteMs - 8);
  assert.equal(await life.wait('exchange', () => 'reply'), 'reply');
  assert.equal(time.pending, 0);
  assert.equal(life.finish(), true);
  assert.equal(life.finish(), false);
  assert.equal(life.cleanup(), false);
  assert.equal(cleaned, 1);
  assert.throws(() => life.assertActive());
});

test('stage timeout consumes token; late success/rejection cannot start the next effect', async () => {
  for (const rejectLate of [false, true]) {
    const time = clock(), gate = deferred();
    const life = createBoundedLifecycle(resolveCommandDeadline({ command: 'ping' }, tiny), time);
    let effects = 0;
    const operation = (async () => {
      await life.wait('hydration', () => gate.promise);
      return life.wait('exchange', () => effects++);
    })();
    const failed = assert.rejects(operation, (error) => error.stage === 'hydration');
    await time.advance(10); await failed;
    if (rejectLate) gate.reject(new Error('late')); else gate.resolve('late');
    await drain();
    assert.equal(effects, 0);
    assert.equal(time.pending, 0);
  }
});

test('synchronous timer expiry and timer setup error start no operation', async () => {
  for (const setTimeout of [(fn) => { fn(); return 1; }, () => { throw new Error('timer setup'); }]) {
    let effects = 0;
    const life = createBoundedLifecycle(resolveCommandDeadline({ command: 'ping' }, tiny), { setTimeout, clearTimeout() { throw new Error('cleanup'); } });
    await assert.rejects(life.wait('exchange', () => effects++));
    assert.equal(effects, 0);
    assert.equal(life.active, false);
  }
});

test('elapsed stage cutoff blocks late continuations even before its timer callback runs', async () => {
  let now = 0, effects = 0;
  const gate = deferred();
  const life = createBoundedLifecycle(resolveCommandDeadline({ command: 'ping' }, tiny), {
    now: () => now, setTimeout: () => 1, clearTimeout() {},
  });
  const pending = life.wait('hydration', async () => {
    await gate.promise;
    life.assertActive();
    effects++;
  });
  const rejected = assert.rejects(pending, (error) => error.stage === 'hydration');
  now = 11; gate.resolve(); await rejected;
  assert.equal(effects, 0);
});

test('elapsed absolute budget limits the next stage instead of granting a fresh full wait', async () => {
  const time = clock();
  const plan = resolveCommandDeadline({ command: 'ping', requestedWorkMs: 5 }, tiny);
  const life = createBoundedLifecycle(plan, time);
  await time.advance(plan.absoluteMs - 2);
  const pending = life.wait('exchange', () => new Promise(() => {}));
  const rejected = assert.rejects(pending, (error) => error.stage === 'exchange');
  await time.advance(2); await rejected;
  assert.equal(life.remainingMs(), 0);
});

const GATE = { user_gesture: true, approved_scope_ref: 'existing-test-scope', text: 'test', correlation_id: 'one', timeout_ms: 20 };
function fixture(options = {}) {
  const bag = {};
  const posted = [], ports = [];
  const api = {
    storage: { local: {
      get: options.get ?? (async (key) => Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}),
      set: options.set ?? (async (value) => Object.assign(bag, structuredClone(value))),
    } },
    tabs: {
      query: options.query ?? (async () => [{ id: 7, url: 'https://chatgpt.com/c/test' }]),
      connect() {
        const listeners = { message: new Set(), disconnect: new Set() };
        let disconnected = 0;
        const port = {
          onMessage: {
            addListener(fn) {
              listeners.message.add(fn);
              if (options.registration === 'message') fn({ action: 'ping', ok: true });
              if (options.registration === 'throw') throw new Error('registration');
            },
            removeListener(fn) { listeners.message.delete(fn); if (options.cleanupThrows) throw new Error('remove'); },
          },
          onDisconnect: {
            addListener(fn) { listeners.disconnect.add(fn); if (options.registration === 'disconnect') fn(); },
            removeListener(fn) { listeners.disconnect.delete(fn); },
          },
          postMessage(message) {
            posted.push(message);
            if (options.silent === message.action) return;
            const response = message.action === 'ping'
              ? { action: 'ping', ok: true, state: { composer_visible_count: 1, sendPresent: true, generating: false } }
              : { action: message.action, ok: false, submitted: false, reason: 'test_refusal' };
            for (const fn of [...listeners.message]) fn(response);
          },
          disconnect() { disconnected++; for (const fn of [...listeners.disconnect]) fn(); if (options.cleanupThrows) throw new Error('disconnect'); },
          get disconnected() { return disconnected; }, listeners,
        };
        ports.push(port); return port;
      },
    },
  };
  const time = clock();
  const make = () => createChatGPTPortDriver({ chrome: api, policy: tiny,
    digest: async () => new Uint8Array(32).buffer, ...time });
  return { api, time, posted, ports, bag, make, driver: make() };
}

test('worker bounds shared hydration before driver access; late hydration sends nothing', async () => {
  const time = clock(), hydration = deferred();
  const pending = worker.runChatGPTCommand({ type: 'aion/chatgpt-run', command: GATE }, { ...time, policy: tiny, hydrate: () => hydration.promise });
  await time.advance(10);
  const result = await pending;
  assert.equal(result.code, 'content_timeout'); assert.equal(result.stage, 'hydration');
  hydration.resolve(); await drain();
  assert.equal(time.pending, 0);
});

for (const stage of ['resolveTab', 'preflight', 'reservationRead', 'reservationWrite', 'exchange', 'settlement']) {
  test(`hanging ${stage} terminates and late preparation never dispatches`, async () => {
    const gate = deferred();
    let gets = 0, sets = 0;
    const options = {};
    if (stage === 'resolveTab') options.query = () => gate.promise;
    if (stage === 'preflight') options.silent = 'ping';
    if (stage === 'reservationRead') options.get = () => gate.promise;
    // The store reads three keys per pass (dispatch, tasks, archive): gets 1-3 are
    // the reservationRead pass, get 4 is the first read inside the reserving write.
    if (stage === 'reservationWrite') options.get = async () => ++gets === 4 ? gate.promise : {};
    if (stage === 'exchange') options.silent = 'run-turn';
    if (stage === 'settlement') options.set = async (value) => { if (++sets === 4) return gate.promise; Object.assign(f.bag, structuredClone(value)); };
    const f = fixture(options);
    const pending = f.driver.runTurn(GATE);
    await f.time.advance(stage === 'exchange' ? 40 : 10);
    const result = await pending;
    assert.equal(result.code, 'content_timeout', JSON.stringify(result));
    assert.equal(result.stage, stage);
    const sends = f.posted.filter((m) => m.action === 'run-turn').length;
    assert.equal(sends, ['exchange', 'settlement'].includes(stage) ? 1 : 0);
    if (sends) { assert.equal(result.submitted, true); assert.equal(result.uncertain, true); }
    gate.resolve(stage === 'resolveTab' ? [{ id: 7, url: 'https://chatgpt.com/c/test' }] : {});
    await drain();
    assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, sends);
    assert.equal(f.time.pending, 0);
  });
}

test('an issued storage write holds mutation barrier after timeout, across drivers', async () => {
  const gate = deferred();
  let sets = 0;
  const f = fixture({ set: async (value) => { sets++; await gate.promise; Object.assign(f.bag, value); } });
  const first = f.driver.runTurn(GATE);
  await f.time.advance(10);
  assert.equal((await first).stage, 'reservationWrite');
  const second = await f.make().runTurn({ ...GATE, correlation_id: 'two' });
  assert.equal(second.code, 'reservation_failed');
  assert.match(second.error, /reservation_store_busy/);
  assert.equal(sets, 1);
  gate.resolve(); await drain();
  assert.equal(f.bag[DISPATCH_KEY].schema, DISPATCH_SCHEMA);
  assert.equal(f.bag[DISPATCH_KEY].reservations.one.state, 'IN_FLIGHT');
  assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, 0);
  const duplicate = await f.make().runTurn(GATE);
  assert.equal(duplicate.code, 'dispatch_in_flight');
  assert.equal(sets, 1, 'never rewrite/delete the tombstone');
});

test('missing storage and false writes refuse before RUN; corrupt storage is not empty', async () => {
  for (const mode of ['missing', 'false', 'malformed', 'schema']) {
    const f = fixture({ set: mode === 'false' ? async () => false : undefined });
    if (mode === 'missing') delete f.api.storage;
    if (mode === 'malformed') f.bag[DISPATCH_KEY] = null;
    if (mode === 'schema') f.bag[DISPATCH_KEY] = { schema: 'future', reservations: {} };
    const result = await f.make().runTurn(GATE);
    assert.equal(result.code, 'reservation_failed', mode);
    assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, 0);
  }
});

test('concurrent drivers never rewrite a stale ledger or erase original tombstones', async () => {
  const f = fixture();
  const old = { correlation_id: 'historical', state: 'COMPLETED', started_at: 'old', captured: null, original_field: 'preserve', url: 'https://chatgpt.com/c/other' };
  f.bag[DISPATCH_KEY] = { schema: DISPATCH_SCHEMA, reservations: { historical: old } };
  const results = await Promise.all([f.driver.runTurn(GATE), f.make().runTurn(GATE)]);
  assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, 1);
  assert.ok(results.some((result) => ['reservation_failed', 'dispatch_in_flight', 'already_dispatched'].includes(result.code)));
  assert.deepEqual(f.bag[DISPATCH_KEY].reservations.historical, old);
  assert.equal(f.bag[DISPATCH_KEY].reservations.one.state, 'COMPLETED');
});

for (const registration of ['message', 'disconnect', 'throw']) {
  test(`synchronous ${registration} listener path cannot post after finish`, async () => {
    const f = fixture({ registration, cleanupThrows: true });
    await f.driver.ping();
    assert.equal(f.posted.length, 0);
    assert.equal(f.ports[0].disconnected, 1);
    assert.equal(f.ports[0].listeners.message.size, 0);
    assert.equal(f.ports[0].listeners.disconnect.size, 0);
    assert.equal(f.time.pending, 0);
  });
}

test('exchange timeout removes listeners, disconnects once and ignores late events', async () => {
  const f = fixture({ silent: 'run-turn', cleanupThrows: true });
  const pending = f.driver.runTurn(GATE);
  await f.time.advance(40);
  assert.equal((await pending).code, 'content_timeout');
  assert.equal(f.ports.length, 2);
  for (const port of f.ports) {
    assert.equal(port.disconnected, 1);
    assert.equal(port.listeners.message.size, 0);
    assert.equal(port.listeners.disconnect.size, 0);
  }
  assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, 1);
});

test('post failure is uncertain after possible send, disconnects once and never retries', async () => {
  const f = fixture();
  const connect = f.api.tabs.connect;
  f.api.tabs.connect = () => {
    const port = connect();
    const post = port.postMessage;
    port.postMessage = (message) => {
      if (message.action === 'run-turn') { f.posted.push(message); throw new Error('post failure'); }
      post(message);
    };
    return port;
  };
  const result = await f.driver.runTurn(GATE);
  assert.equal(result.code, 'post_failed');
  assert.equal(result.submitted, true);
  assert.equal(f.posted.filter((m) => m.action === 'run-turn').length, 1);
  assert.equal(f.ports[1].disconnected, 1);
  assert.equal(f.time.pending, 0);
  const duplicate = await f.driver.runTurn(GATE);
  assert.equal(duplicate.code, 'already_dispatched');
});

test('budget overrides are validated at driver construction and command entry', async () => {
  for (const extra of [{ graceMs: 0 }, { graceMs: Infinity }, { timeouts: { run: '50' } }, { timeouts: { other: 5 } }]) {
    assert.throws(() => createChatGPTPortDriver(extra));
  }
  const f = fixture();
  for (const timeout_ms of [null, NaN, Infinity, '20', 1.1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal((await f.driver.runTurn({ ...GATE, timeout_ms })).code, 'bad_argument');
  }
  assert.equal(f.posted.length, 0);
});
