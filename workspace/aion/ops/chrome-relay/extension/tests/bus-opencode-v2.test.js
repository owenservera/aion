// Bus V2 OpenCode 2.0 service adapter against a FAKE loopback service that
// implements the documented endpoints. Proves the HTTP contract, the
// no-send/unknown classification, durable reconciliation after a restart and
// that the volatile event stream is only ever a hint. NOT live OpenCode evidence.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createBus } from '../src/bus/bus.js';
import { REASON } from '../src/bus/contracts.js';
import { createOpenCodeHttpClient, createOpenCodeV2Adapter, extractAssistant, extractSession } from '../src/bus/adapters/opencode-v2.js';
import { createExampleChat } from './fixtures/bus-example-chat.js';
import { memoryStorage } from './fixtures/bus-memory.js';

const BASE = 'http://127.0.0.1:4096';
const T0 = Date.parse('2026-10-19T14:00:00.000Z');

/** Fake OpenCode V2 service: documented paths, in-memory sessions, scripted faults. */
function fakeService() {
  const sessions = new Map();
  const calls = [];
  const faults = { create: null, prompt: null };
  let n = 0;
  let pushEvent = null;
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, async text() { return JSON.stringify(body); }, body: null });
  async function fetch(url, init = {}) {
    const { pathname, search } = new URL(url);
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: pathname + search, body });
    if (pathname === '/api/event') {
      const queue = []; let wake = null;
      pushEvent = (ev) => { queue.push(ev); wake?.(); };
      return { ok: true, status: 200, body: (async function* () {
        for (;;) {
          while (queue.length) { const ev = queue.shift(); if (ev === 'END') return; yield `event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`; }
          await new Promise((r) => { wake = r; });
        }
      })() };
    }
    if (method === 'POST' && pathname === '/api/session') {
      if (faults.create) return faults.create === 'net' ? Promise.reject(new TypeError('fetch failed')) : json(faults.create, { error: 'x' });
      const id = `ses_${String(n += 1).padStart(4, '0')}`;
      sessions.set(id, { id, location: body.location, title: body.title, inputs: [], messages: [] });
      return json(200, { data: { id, title: body.title } });
    }
    const m = /^\/api\/session\/([^/]+)\/(prompt|message|interrupt)$/.exec(pathname);
    if (m) {
      const s = sessions.get(decodeURIComponent(m[1]));
      if (!s) return json(404, { error: 'SessionNotFoundError' });
      if (m[2] === 'prompt') {
        if (faults.prompt === 'net') { s.inputs.push(body.text); return Promise.reject(new TypeError('socket hang up')); }
        if (faults.prompt) return json(faults.prompt, { error: 'x' });
        s.inputs.push(body.text);
        s.clock = (s.clock ?? 1000) + 1;
        s.messages.unshift({ id: `msg_u${s.inputs.length}`, time: { created: s.clock }, type: 'user', text: body.text });
        return json(200, { data: { id: `msg_${s.inputs.length}`, sessionID: s.id, type: 'user', payload: { text: body.text }, delivery: 'queued' } });
      }
      if (m[2] === 'message') return json(200, { data: s.messages, cursor: { next: null } });
      if (m[2] === 'interrupt') { s.interrupted = true; return json(200, { data: { ok: true } }); }
    }
    return json(404, { error: 'not found' });
  }
  // Real 2.0.32 shape: newest-first; assistant `content[]`; an `idle` item marks the loop stop.
  const answer = (id, text, complete = true) => {
    const s = sessions.get(id); s.clock = (s.clock ?? 1000) + 1;
    s.messages.unshift({ id: `msg_a${s.clock}`, time: { created: s.clock, completed: s.clock }, type: 'assistant', content: [{ type: 'text', text }], finish: 'stop' });
    if (complete) { s.clock += 1; s.messages.unshift({ id: `msg_i${s.clock}`, time: { created: s.clock }, type: 'idle', outcome: 'completed' }); }
  };
  return { fetch, sessions, calls, faults, answer, push: (ev) => pushEvent?.(ev) };
}

async function world(svc = fakeService(), { cwd = 'C:/work/aion' } = {}) {
  const client = createOpenCodeHttpClient({ baseUrl: BASE, fetch: svc.fetch, timeoutMs: 2000 });
  const chat = createExampleChat();
  const storage = memoryStorage();
  let tick = 0, n = 0;
  const make = () => createBus({ storage, adapters: [chat, createOpenCodeV2Adapter({ client })],
    now: () => new Date(T0 + (tick += 1000)).toISOString(), randomId: () => `oc${String(n += 1).padStart(10, '0')}`,
    initialConfig: { ops_enabled: ['send', 'status', 'cancel'] } });
  const bus = make();
  await bus.bind('aion', { adapter: 'example-chat', ref: 'example://room/commander', confirmed_by: 'owner:test' });
  await bus.bind('opencode', { adapter: 'opencode-v2', ref: 'opencode', confirmed_by: 'owner:test' });
  await bus.designateCommander('aion');
  await bus.grant({ grant_id: 'g-v2', ref: 'owner', agents: ['aion', 'opencode'], ops: ['send', 'status', 'cancel'], max_count: 20,
    rate_per_hour: 20, expires_utc: '2026-10-20T14:00:00.000Z', cwd });
  return { svc, chat, bus, make, client };
}
const go = (w, text, nonce) => w.bus.ingestStructured({ op: 'send', to: 'opencode', text, nonce }).then((r) => { assert.equal(r.accepted, true, JSON.stringify(r)); return r.command_id; });

test('HTTP contract: session at the grant directory, prompt text, loopback only', async () => {
  const w = await world();
  const id = await go(w, 'run the suite', 'v2-000001');
  const d = await w.bus.dispatch(id);
  assert.equal(d.state, 'SUBMISSION_OBSERVED');
  assert.deepEqual(w.svc.calls.map((c) => `${c.method} ${c.path}`), ['POST /api/session', 'POST /api/session/ses_0001/prompt']);
  assert.deepEqual(w.svc.calls[0].body.location, { directory: 'C:/work/aion' });
  assert.match(w.svc.calls[1].body.text, /^run the suite\n\n\(AION bus command/);
  assert.equal((await w.bus.readCommand(id)).executor_ref, 'ses_0001', 'session reference is durable');
  assert.throws(() => createOpenCodeHttpClient({ baseUrl: 'http://10.0.0.5:4096', fetch: w.svc.fetch }), /loopback/);
  assert.throws(() => createOpenCodeHttpClient({ baseUrl: 'https://example.com', fetch: w.svc.fetch }), /loopback/);
});

test('completion is read from server state; the report carries the executor text', async () => {
  const w = await world();
  const id = await go(w, 'summarise', 'v2-000002');
  await w.bus.dispatch(id);
  assert.equal((await w.bus.observe(id)).changed, false, 'no answer yet');
  w.svc.answer('ses_0001', 'all 12 tests pass');
  const o = await w.bus.observe(id);
  assert.equal(o.state, 'REPLY_CHECKED');
  assert.equal(o.report.state, 'REPORTED');
  assert.match(w.chat.rooms.get('example://room/commander').inbox[0], /all 12 tests pass/);
});

test('restart: a new runner reconciles from the server using the persisted session id', async () => {
  const w = await world();
  const id = await go(w, 'long job', 'v2-000003');
  await w.bus.dispatch(id);
  w.svc.answer('ses_0001', 'done after restart');
  const restarted = w.make();
  const rec = await restarted.reconcile();
  assert.equal(rec.observed[0].state, 'REPLY_CHECKED');
  assert.equal(w.svc.sessions.get('ses_0001').inputs.length, 1, 'never re-prompted');
});

test('event stream is a hint: idle event plus messages completes; a stream gap costs nothing', async () => {
  const svc = fakeService();
  const w = await world(svc);
  const adapter = w.bus.adapters['opencode-v2'];
  const watching = adapter.watchEvents();
  const id = await go(w, 'x', 'v2-000004');
  await w.bus.dispatch(id);
  w.svc.answer('ses_0001', 'partial text', false);
  await new Promise((r) => setTimeout(r, 10));
  w.svc.push({ type: 'session.idle', sessionID: 'ses_0001' });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal((await w.bus.observe(id)).state, 'REPLY_CHECKED');
  w.svc.push('END');
  assert.deepEqual(await watching, { ended: true, gap: true });
});

test('fault classification: create failure and 4xx/409 are NOT_SENT; prompt network loss is OUTCOME_UNKNOWN', async () => {
  for (const [where, fault, state, reason] of [
    ['create', 500, 'REJECTED', REASON.TARGET_REFUSED],
    ['create', 'net', 'REJECTED', REASON.TRANSPORT_LOST],
    ['prompt', 409, 'REJECTED', REASON.EXECUTOR_BUSY],
    ['prompt', 400, 'REJECTED', REASON.TARGET_REFUSED],
    ['prompt', 'net', 'UNRESOLVED', REASON.TRANSPORT_LOST],
  ]) {
    const svc = fakeService();
    svc.faults[where] = fault;
    const w = await world(svc);
    const id = await go(w, 'x', `v2-f-${where}-${fault}`);
    const d = await w.bus.dispatch(id);
    assert.equal(d.state, state, `${where} ${fault}`);
    assert.equal((await w.bus.readCommand(id)).reason, reason, `${where} ${fault}`);
  }
});

test('missing grant cwd is refused before any HTTP call', async () => {
  const svc = fakeService();
  const w = await world(svc, { cwd: null });
  const id = await go(w, 'x', 'v2-000005');
  const d = await w.bus.dispatch(id);
  assert.equal(d.state, 'REJECTED');
  assert.equal(svc.calls.length, 0);
});

test('cancel interrupts the target session by its persisted reference', async () => {
  const w = await world();
  const id = await go(w, 'long', 'v2-000006');
  await w.bus.dispatch(id);
  const c = await w.bus.ingestStructured({ op: 'cancel', to: 'opencode', nonce: 'v2-000007' });
  assert.equal(c.accepted, true, JSON.stringify(c));
  const d = await w.bus.dispatch(c.command_id);
  assert.equal(d.state, 'REPLY_CHECKED');
  assert.equal(w.svc.sessions.get('ses_0001').interrupted, true);
  assert.ok(w.svc.calls.some((x) => x.path === '/api/session/ses_0001/interrupt?resume=false'));
});

test('real 2.0.32 message shape: newest-first, idle item with provider.auth error is a FAILURE, not an empty success', async () => {
  const real = JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures/opencode-v2-real-messages.json', import.meta.url), 'utf8'));
  const x = extractAssistant(real);
  assert.deepEqual({ complete: x.complete, outcome: x.outcome, error: x.error?.type, count: x.count }, { complete: true, outcome: 'failed', error: 'provider.auth', count: 1 });
  const adapter = createOpenCodeV2Adapter({ client: { messages: async () => real } });
  const o = await adapter.observe({ executor_ref: 'ses_x' });
  assert.equal(o.outcome, 'reply');
  assert.equal(o.reason, REASON.EXECUTOR_AUTH_REQUIRED);
  assert.match(o.reply, /outcome=failed error=provider\.auth/);
  // Before the idle item exists (loop still running) nothing is concluded.
  const running = { data: real.data.slice(1).map((i) => (i.type === 'assistant' ? { ...i, finish: undefined, error: undefined, time: { created: i.time.created } } : i)) };
  assert.equal((await createOpenCodeV2Adapter({ client: { messages: async () => running } }).observe({ executor_ref: 'ses_x' })).outcome, 'pending');
});

test('tolerant schema readers', () => {
  assert.equal(extractSession({ data: { id: 'ses_1' } }), 'ses_1');
  assert.equal(extractSession({ data: { sessionID: 'ses_2' } }), 'ses_2');
  assert.equal(extractSession({ data: { id: '../evil' } }), null);
  const a = extractAssistant({ data: { items: [{ role: 'user', text: 'q' }, { info: { role: 'assistant', time: { completed: 3 } }, parts: [{ type: 'text', text: 'A' }, { type: 'tool', text: 'no' }] }] } });
  assert.deepEqual({ count: a.count, text: a.text, complete: a.complete, error: a.error }, { count: 1, text: 'A', complete: true, error: null });
});
