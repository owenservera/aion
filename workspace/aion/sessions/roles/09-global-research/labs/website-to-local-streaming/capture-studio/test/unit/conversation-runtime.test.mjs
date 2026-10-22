import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createConversationRuntime } from '../../src/capture/conversation-runtime.mjs';
import { acquireDriveLease } from '../../src/capture/drive-lease.mjs';
import { createConversationBrowserAdapter, readUserTurns } from '../../src/capture/conversation-browser-adapter.mjs';
import { Recorder } from '../../src/capture/recorder.mjs';
import { RawLog } from '../../src/store/raw-log.mjs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
function fixture(t, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'conversation-runtime-'));
  const paths = { root, sessions: path.join(root, 'sessions') }, calls = [], adapters = [];
  const site = { id: 'chatgpt', url: 'https://chatgpt.com/' };
  let observe = true, releaseReply = deferred();
  const dependencies = {
    leaseRoot: path.join(root, 'leases'), listSessions: () => [],
    getAdapter: async (value) => value === 'chatgpt' || String(value).startsWith('https://chatgpt.com') ? site : null,
    listTargets: async () => [{ id: 'selected', type: 'page', url: site.url }],
    createAdapter(options) {
      const adapter = {
        mayOwnResources: false, bytesWritten: 40, integrity: null,
        async connect(binding, hooks) { calls.push('connect'); adapter.mayOwnResources = true;
          if (options.freshTab) { binding.targetId = 'fresh'; hooks.bind(binding); }
          adapter.binding = binding; adapter.sessionId = `session-${adapters.length}`; hooks.ownSession(adapter.sessionId);
          return { binding, sessionId: adapter.sessionId }; },
        async preflight(binding) { calls.push('preflight'); return { binding, draft: { present: false, chars: 0 }, boundary: { sequence: 10, transcriptCount: 1 } }; },
        async type() { calls.push('type'); },
        async submit(args) { calls.push('submit'); return observe ? { binding: args.binding, evidence: { ...args, sessionId: adapter.sessionId, sequence: 11, kind: 'new-user-turn', source: 'page' } } : null; },
        async reconcile() { calls.push('reconcile'); return null; },
        async readReply() { calls.push('reply'); await releaseReply.promise; return { state: 'ready', text: 'private answer' }; },
        stopWaiting() { calls.push('stop-wait'); releaseReply.resolve(); },
        async stop() { calls.push('stop'); adapter.mayOwnResources = false; adapter.integrity = { ok: true }; },
        async closeTab() { calls.push('close-tab'); },
      };
      adapters.push(adapter); return adapter;
    }, ...overrides,
  };
  const runtime = createConversationRuntime({ paths, port: 19222, dependencies });
  t.after(async () => { await runtime.close().catch(() => {}); fs.rmSync(root, { recursive: true, force: true }); });
  const connect = (body = {}) => runtime.connect({ site: 'chatgpt', targetId: 'selected', ...body });
  const submit = (c, body = {}) => runtime.submit(c.id, { key: 'one', prompt: 'private prompt', confirm: true, expectedRevision: c.revision, ...body });
  const settle = async (id) => { for (let n = 0; n < 200; n++) { const c = await runtime.get(id); if (c.reply.state === 'ready' || c.turn?.send.state === 'uncertain') return c; await new Promise(setImmediate); } throw new Error('Background job did not settle'); };
  return { runtime, paths, dependencies, calls, adapters, connect, submit, settle, releaseReply, setObserve: (v) => { observe = v; } };
}

test('§15 connect/submit promptly/poll/read-local/list-private/finish with lease', async (t) => {
  const f = fixture(t), c = await f.connect();
  assert.equal(c.site, 'chatgpt'); assert.equal(c.binding.targetId, 'selected'); assert.equal(c.capture.maxBytes, 256 * 1024 * 1024);
  assert.equal(f.runtime.isSessionActive(c.sessionId), true);
  const registered = await f.submit(c); assert.equal(registered.turn.phase, 'preparing');
  const readCalls = [...f.calls]; await f.runtime.get(c.id); await f.runtime.list(); assert.deepEqual(f.calls, readCalls);
  f.releaseReply.resolve(); const replied = await f.settle(c.id);
  assert.equal(replied.turn.send.state, 'observed'); assert.equal(replied.reply.text, 'private answer');
  assert.equal(replied.reply.source, 'page'); assert.equal(replied.reply.completion, 'unknown');
  const list = await f.runtime.list(); assert.equal(JSON.stringify(list).includes('private answer'), false); assert.equal(JSON.stringify(list).includes('private prompt'), false);
  const finished = await f.runtime.finish(c.id, { closeTab: true });
  assert.equal(finished.capture.state, 'incomplete'); assert.equal(finished.capture.integrity.ok, true);
  assert.equal(f.calls.includes('close-tab'), false); assert.equal(f.runtime.isSessionActive(c.sessionId), false);
  acquireDriveLease({ root: f.dependencies.leaseRoot, port: 19222 }).release();
});

test('concurrent duplicate keys register once; changed payload conflicts before stale revision', async (t) => {
  const f = fixture(t), c = await f.connect();
  const [a, b] = await Promise.all([f.submit(c), f.submit(c)]);
  assert.equal(a.turn.id, b.turn.id);
  await assert.rejects(f.submit(c, { prompt: 'changed' }), (e) => e.status === 409 && e.code === 'IDEMPOTENCY_CONFLICT');
  await f.runtime.finish(c.id);
  assert.equal(f.calls.filter((v) => v === 'submit').length, 1);
});

test('existing/fresh tab ownership, safe close and no lease bypass', async (t) => {
  const f = fixture(t), c = await f.connect({ freshTab: true, targetId: undefined });
  assert.equal(c.binding.ownedByStudio, true); assert.equal(c.binding.targetId, 'fresh');
  await assert.rejects(f.connect(), (e) => e.status === 409 && e.code === 'DRIVE_LEASE_BUSY');
  await f.submit(c); f.releaseReply.resolve(); await f.settle(c.id);
  await Promise.all([f.runtime.finish(c.id, { closeTab: true }), f.runtime.finish(c.id, { closeTab: true })]);
  assert.equal(f.calls.filter((v) => v === 'stop').length, 1); assert.equal(f.calls.filter((v) => v === 'close-tab').length, 1);
});

test('uncertain send does not retry/read reply/close own tab, persists through restart', async (t) => {
  const f = fixture(t); f.setObserve(false);
  const c = await f.connect({ freshTab: true, targetId: undefined }); await f.submit(c); await f.settle(c.id);
  await f.submit(c); const done = await f.runtime.finish(c.id, { closeTab: true });
  assert.equal(done.turn.send.state, 'uncertain'); assert.equal(f.calls.includes('close-tab'), false); assert.equal(f.calls.includes('reply'), false);
  assert.equal(f.calls.filter((v) => v === 'submit').length, 1);
  const before = [...f.calls], restarted = createConversationRuntime({ paths: f.paths, port: 19222, dependencies: f.dependencies });
  assert.equal((await restarted.get(c.id)).turn.send.state, 'uncertain'); assert.deepEqual(f.calls, before);
  await assert.rejects(restarted.submit(c.id, { key: 'different', prompt: 'x', confirm: true, expectedRevision: done.revision }), (e) => e.status === 409);
  await restarted.close();
});

test('invalid/stale/unknown resources return appropriate errors without actions', async (t) => {
  const f = fixture(t);
  await assert.rejects(f.connect({ site: 'unknown' }), (e) => e.status === 400);
  await assert.rejects(f.connect({ targetId: 'missing' }), (e) => e.status === 404);
  await assert.rejects(f.runtime.get('missing'), (e) => e.status === 404);
  const c = await f.connect();
  await assert.rejects(f.submit(c, { expectedRevision: -1 }), (e) => e.status === 409);
  await assert.rejects(f.submit(c, { confirm: false }), (e) => e.status === 400);
  assert.deepEqual(f.calls, ['connect']);
});

test('duration budget stops waiting, finalizes incomplete and releases lease', async (t) => {
  const f = fixture(t, { maxDurationMs: 15 }); const c = await f.connect(); await f.submit(c);
  for (let i = 0; i < 100; i++) {
    const state = await f.runtime.get(c.id); if (state.state === 'closed') break;
    await new Promise((r) => setTimeout(r, 5));
  }
  const done = await f.runtime.get(c.id); assert.equal(done.state, 'closed'); assert.equal(done.capture.limitReason, 'duration-budget');
  assert.equal(done.capture.state, 'incomplete'); acquireDriveLease({ root: f.dependencies.leaseRoot, port: 19222 }).release();
});

test('failed capture stop preserves lease and prevents tab close', async (t) => {
  const f = fixture(t), c = await f.connect({ freshTab: true, targetId: undefined });
  f.adapters[0].stop = async () => { f.calls.push('stop'); throw new Error('failed'); };
  const done = await f.runtime.finish(c.id, { closeTab: true }); assert.equal(done.state, 'needs-reconciliation');
  assert.equal(f.calls.includes('close-tab'), false);
  assert.throws(() => acquireDriveLease({ root: f.dependencies.leaseRoot, port: 19222 }), /lease is held/);
});

test('failed attach with no effects releases lease', async (t) => {
  const f = fixture(t, { createAdapter: () => ({ mayOwnResources: false, async connect() { throw new Error('no effect'); } }) });
  await assert.rejects(f.connect(), /ATTACHMENT_FAILED/);
  acquireDriveLease({ root: f.dependencies.leaseRoot, port: 19222 }).release();
});

test('owner metadata recovers attach/save window without reattaching or dispatching', async (t) => {
  let owner;
  const f = fixture(t, { ownerIsAlive: () => false, listSessions: () => owner ? [{ id: 'recoverable-session', conversationOwner: { conversationId: owner } }] : [] });
  const c = await f.connect(); owner = c.id; await f.runtime.finish(c.id);
  const file = path.join(f.paths.root, 'conversations', `${c.id}.conversation.json`), disk = JSON.parse(fs.readFileSync(file));
  disk.sessionId = null; disk.state = 'attaching'; disk.finish = { requested: false, phase: 'idle', error: null };
  fs.writeFileSync(file, JSON.stringify(disk));
  const before = [...f.calls], restarted = createConversationRuntime({ paths: f.paths, dependencies: f.dependencies });
  const recovered = await restarted.get(c.id);
  assert.equal(recovered.sessionId, 'recoverable-session'); assert.equal(recovered.state, 'needs-reconciliation'); assert.equal(recovered.capture.state, 'incomplete');
  assert.deepEqual(f.calls, before); await restarted.close();
});

test('another runtime can read a live owner snapshot without rewriting it or finishing its capture', async (t) => {
  const f = fixture(t), c = await f.connect();
  const file = path.join(f.paths.root, 'conversations', `${c.id}.conversation.json`), before = fs.readFileSync(file, 'utf8');
  const second = createConversationRuntime({ paths: f.paths, port: 19222, dependencies: f.dependencies });
  assert.equal((await second.get(c.id)).id, c.id);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  await assert.rejects(second.finish(c.id), (e) => e.status === 409);
  await assert.rejects(second.reconcile(c.id, { expectedRevision: c.revision }), (e) => e.status === 409);
  assert.equal(fs.readFileSync(file, 'utf8'), before); await second.close();
});

function browserFixture({ freshTab = false, readinessDependencies = {} } = {}) {
  const calls = [], records = [], store = new Map(); let users = ['earlier prompt'], origin = 'https://chatgpt.com', draftChars = 0, rec;
  const binding = { targetId: freshTab ? 'pending' : 'selected', origin, ownedByStudio: freshTab };
  class FakeRecorder {
    constructor(options) {
      calls.push(['recorder', options]); rec = this; this.state = 'idle';
      this.page = { send: async (method, params) => { calls.push([method, params]); return {}; } };
    }
    on() {}
    tap() { return { close() { calls.push(['tap-close']); } }; }
    async start(options) {
      calls.push(['start', options]); this.session = { id: 'raw-session', raw: { seq: 10, stats: { bytes: 10 } }, kv: { get: (k) => store.get(k), set: (k, v) => store.set(k, v) } };
      options.onSessionCreated(this.session); this.state = 'recording'; return this.session;
    }
    recordConversationObservation(record) { records.push(record); return ++this.session.raw.seq; }
    async stop() { calls.push(['stop']); this.state = 'idle'; return { verify: { ok: true } }; }
  }
  const adapter = createConversationBrowserAdapter({ paths: { sessions: 'unused' }, profileStore: { load: () => ({}) }, port: 19222,
    siteAdapter: { id: 'chatgpt', url: `${origin}/` }, targetId: 'selected', freshTab, conversationId: 'conversation', ownerToken: 'owner-token',
    dependencies: {
      Recorder: FakeRecorder, listSessions: () => [], listTargets: async () => [{ id: freshTab ? 'created' : 'selected', url: `${origin}/` }],
      fetch: async (url, options) => { calls.push(['fetch', url, options]); return { ok: true, json: async () => ({ id: 'created' }) }; },
      evaluate: async () => origin, findComposer: async () => ({ found: true }), focusComposer: async () => ({ ok: true }),
      sendState: async () => ({ evalOk: true, draftChars }), readUserTurns: async () => [...users],
      readTranscript: async () => ({ last: 'old answer', count: 1 }),
      typeText: async (page, prompt) => { calls.push(['type', prompt]); return { ok: true, typed: prompt }; },
      sendMessage: async () => { calls.push(['send']); return { uncertain: true }; },
      waitForCompletion: async () => ({ done: true, text: 'page answer' }),
      detectAuthWall: async () => ({ blocked: false }), detectSiteFailure: async () => ({ failed: false }),
      ...readinessDependencies,
    } });
  const connect = () => adapter.connect(binding, { bind: (b) => calls.push(['bind', b]), ownSession: (id) => calls.push(['own-session', id]) });
  const args = { binding, turnId: 'turn', payloadDigest: createHash('sha256').update('new prompt').digest('hex') };
  return { adapter, connect, calls, records, args, get recorder() { return rec; },
    setUsers: (v) => { users = v; }, setOrigin: (v) => { origin = v; }, setDraft: (v) => { draftChars = v; } };
}

test('browser seam existing target never navigates/clears, foregrounds exact recorder page before type', async () => {
  const f = browserFixture(); await f.connect(); await f.adapter.preflight(); await f.adapter.type({ prompt: 'new prompt', turnId: 'turn' });
  assert.ok(f.calls.find(([name]) => name === 'start')[1].exactTarget);
  assert.deepEqual(f.calls.filter(([name]) => name.startsWith('Page.')).map(([name]) => name), ['Page.bringToFront']);
  assert.equal(f.calls.some(([name]) => name === 'fetch'), false);
  assert.ok(f.calls.findIndex(([name]) => name === 'Page.bringToFront') < f.calls.findIndex(([name]) => name === 'type'));
  await f.adapter.stop();
});

test('browser seam fresh tab capture/owner binding is armed before navigating its own tab', async () => {
  const f = browserFixture({ freshTab: true }); const result = await f.connect();
  assert.equal(result.binding.targetId, 'created');
  const names = f.calls.map(([name]) => name);
  assert.ok(names.indexOf('bind') < names.indexOf('start')); assert.ok(names.indexOf('own-session') < names.indexOf('Page.navigate'));
  const started = f.calls.find(([name]) => name === 'start')[1];
  assert.equal(started.profile, 'chatgpt'); assert.equal(started.owner.conversationId, 'conversation');
  assert.equal(f.calls.find(([name]) => name === 'fetch')[1].endsWith('/json/new?about:blank'), true);
  await f.adapter.stop();
});

test('browser seam only records exact newly added user prompt as page evidence, never timing/network proof', async () => {
  const f = browserFixture(); await f.connect(); await f.adapter.preflight(); await f.adapter.type({ prompt: 'new prompt', turnId: 'turn' });
  assert.equal(await f.adapter.submit(f.args), null); // sendMessage heuristic/ack alone is insufficient.
  for (const users of [['earlier prompt'], ['unrelated', 'new prompt'], ['earlier prompt', 'different prompt'],
    ['earlier prompt', 'new  prompt'], ['earlier prompt', 'new prompt', 'extra turn']]) {
    f.setUsers(users); assert.equal(await f.adapter.reconcile(f.args), null);
  }
  assert.equal(f.records.length, 0);
  f.setUsers(['earlier prompt', 'new prompt']); const observed = await f.adapter.reconcile(f.args);
  assert.equal(observed.evidence.kind, 'new-user-turn'); assert.equal(observed.evidence.source, 'page');
  assert.equal(observed.evidence.sessionId, 'raw-session'); assert.ok(observed.evidence.sequence > 10);
  assert.equal(f.records[0].text, 'new prompt'); assert.equal(f.records[0].baselineSequence, 10);
  assert.equal(f.calls.filter(([name]) => name === 'send').length, 1);
  const reply = await f.adapter.readReply(); assert.equal(reply.text, 'page answer'); await f.adapter.stop();
});

test('browser seam binding/draft change blocks typing; observation persistence failure cannot prove send', async () => {
  const f = browserFixture(); await f.connect(); await f.adapter.preflight();
  f.setDraft(2); await assert.rejects(f.adapter.type({ prompt: 'new prompt', turnId: 'turn' }), /DRAFT_PRESENT/);
  assert.equal(f.calls.some(([name]) => name === 'type'), false);
  f.setDraft(0); await f.adapter.type({ prompt: 'new prompt', turnId: 'turn' });
  f.setUsers(['earlier prompt', 'new prompt']); f.recorder.recordConversationObservation = () => { throw new Error('disk failed'); };
  await assert.rejects(f.adapter.reconcile(f.args), /disk failed/);
  f.setOrigin('https://other.test'); await assert.rejects(f.adapter.reconcile(f.args), /BINDING_CHANGED/);
  await f.adapter.stop();
});

test('real evaluated user-turn reader ignores hidden/nested duplicates, retains repeated prompt turns', async () => {
  const node = (text, width = 20) => ({ innerText: text, getBoundingClientRect: () => ({ width, height: 20 }), contains: () => false });
  const outer = node('same prompt'), inner = node('same prompt'), repeated = node('same prompt'), hidden = node('hidden', 0);
  outer.contains = (el) => el === inner;
  const page = { async send(method, params) { return { result: { value: vm.runInNewContext(params.expression, { document: { querySelectorAll: () => [outer, inner, repeated, hidden] } }) } }; } };
  assert.deepEqual(Array.from(await readUserTurns(page)), ['same prompt', 'same prompt']);
});

test('Recorder observation uses the same real raw log and returns a flushed sequence', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'conversation-observation-'));
  const raw = new RawLog(root); t.after(async () => { await raw.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const recorder = new Recorder({ sessionsDir: root }); recorder.state = 'recording'; recorder.session = { raw };
  recorder.reducer = { ingest: () => [] };
  const sequence = recorder.recordConversationObservation({ source: 'page', kind: 'new-user-turn', text: 'local evidence', turnId: 'turn' });
  assert.ok(sequence > 0); assert.equal(raw.queue.length, 0);
  const line = JSON.parse(fs.readFileSync(path.join(root, raw.segName), 'utf8').trim());
  assert.equal(line.seq, sequence); assert.equal(line.k, 'conversation.observation'); assert.equal(line.text, 'local evidence');
});

test('real Recorder persists recoverable owner before failed journal callback and never attaches', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'conversation-owner-'));
  const oldFetch = globalThis.fetch;
  let requests = 0, created;
  globalThis.fetch = async (url) => {
    requests++;
    assert.ok(String(url).endsWith('/json/version') || String(url).endsWith('/json/list'));
    return { ok: true, json: async () => String(url).endsWith('/json/version') ? { Browser: 'fake', 'Protocol-Version': 'fake' }
      : [{ id: 'exact', type: 'page', url: 'about:blank' }] };
  };
  t.after(async () => { globalThis.fetch = oldFetch; if (created) await created.raw.close(); fs.rmSync(root, { recursive: true, force: true }); });
  const recorder = new Recorder({ sessionsDir: root, profileStore: { load: () => ({ name: 'explicit-profile', version: 1 }) } });
  await assert.rejects(recorder.start({ target: 'exact', exactTarget: true, profile: 'explicit-profile',
    owner: { conversationId: 'recover-me', pid: process.pid, token: 'owner-token' },
    onSessionCreated(session) { created = session; throw new Error('journal save failed'); } }), /journal save failed/);
  const meta = JSON.parse(fs.readFileSync(path.join(created.dir, 'session.json'), 'utf8'));
  assert.equal(meta.conversationOwner.conversationId, 'recover-me'); assert.equal(meta.profile.name, 'explicit-profile');
  assert.equal(meta.target.id, 'exact'); assert.equal(recorder.conn, undefined); assert.equal(requests, 2);
});

test('Finish during deferred typing prevents submit and preserves partial draft uncertainty', async (t) => {
  const f = fixture(t), c = await f.connect({ freshTab: true, targetId: undefined });
  const entered = deferred(), release = deferred();
  f.adapters[0].type = async () => { entered.resolve(); await release.promise; };
  await f.submit(c); await entered.promise;
  const finish = f.runtime.finish(c.id, { closeTab: true }); release.resolve();
  const done = await finish;
  assert.equal(f.calls.includes('submit'), false); assert.equal(f.calls.includes('close-tab'), false);
  assert.equal(done.turn.send.state, 'not-attempted'); assert.equal(done.diagnostic.uncertainty, 'partial-draft-possible');
});

test('Finish after dispatch boundary cannot claim no send', async (t) => {
  const f = fixture(t), c = await f.connect({ freshTab: true, targetId: undefined });
  const entered = deferred(), release = deferred();
  f.adapters[0].submit = async () => { entered.resolve(); await release.promise; return null; };
  await f.submit(c); await entered.promise;
  const finish = f.runtime.finish(c.id, { closeTab: true }); release.resolve();
  assert.equal((await finish).turn.send.state, 'uncertain'); assert.equal(f.calls.includes('close-tab'), false);
});

test('draft rejection is idempotent but manual draft resolution permits a new key', async (t) => {
  const f = fixture(t), c = await f.connect(); let draft = true;
  f.adapters[0].preflight = async (binding) => ({ binding, draft: { present: draft, chars: draft ? 4 : 0 }, boundary: { sequence: 10, transcriptCount: 1 } });
  await f.submit(c);
  let blocked;
  for (let n = 0; n < 100; n++) { blocked = await f.runtime.get(c.id); if (blocked.turn.phase === 'blocked') break; await new Promise(setImmediate); }
  assert.equal(blocked.readiness.reason, 'DRAFT_PRESENT'); assert.equal(blocked.readiness.draft.chars, 4);
  draft = false;
  assert.equal((await f.submit(c)).turn.phase, 'blocked');
  const registered = await f.submit(blocked, { key: 'resolved' }); assert.notEqual(registered.turn.id, blocked.turn.id);
  f.releaseReply.resolve(); const reply = await f.settle(c.id); assert.equal(reply.turn.send.state, 'observed');
  assert.equal(f.calls.filter((name) => name === 'submit').length, 1);
});

test('reconciliation starts one shared reply observer without a second send', async (t) => {
  const f = fixture(t); f.setObserve(false); const c = await f.connect(); await f.submit(c); const uncertain = await f.settle(c.id);
  const disk = JSON.parse(fs.readFileSync(path.join(f.paths.root, 'conversations', `${c.id}.conversation.json`)));
  const a = disk.attempts.at(-1);
  f.adapters[0].reconcile = async () => ({ binding: uncertain.binding, evidence: { turnId: a.id, payloadDigest: a.payloadDigest,
    sessionId: c.sessionId, sequence: 11, kind: 'new-user-turn', source: 'page' } });
  await f.runtime.reconcile(c.id, { expectedRevision: uncertain.revision });
  for (let n = 0; n < 50 && !f.calls.includes('reply'); n++) await new Promise(setImmediate);
  await f.runtime.reconcile(c.id, { expectedRevision: (await f.runtime.get(c.id)).revision });
  assert.equal(f.calls.filter((name) => name === 'reply').length, 1); assert.equal(f.calls.filter((name) => name === 'submit').length, 1);
  f.releaseReply.resolve(); assert.equal((await f.settle(c.id)).reply.text, 'private answer');
});

test('optional close failure releases stopped capture lease without closure retry', async (t) => {
  const f = fixture(t), c = await f.connect({ freshTab: true, targetId: undefined });
  let closes = 0; f.adapters[0].closeTab = async () => { closes++; throw new Error('ack lost'); };
  const done = await f.runtime.finish(c.id, { closeTab: true });
  assert.equal(done.diagnostic.finishError, 'TAB_CLOSE_UNCONFIRMED'); assert.equal(f.runtime.isSessionActive(c.sessionId), false);
  acquireDriveLease({ root: f.dependencies.leaseRoot, port: 19222 }).release();
  await f.runtime.finish(c.id, { closeTab: true }); assert.equal(closes, 1);
});

test('page reply updates are full replacements, visible while streaming, then ready', async (t) => {
  const f = fixture(t, { replyUpdateMs: 1 }), c = await f.connect(); const observed = deferred(), completion = deferred(); let publish;
  f.adapters[0].readReply = async (onUpdate) => { publish = onUpdate; observed.resolve(); await completion.promise; return { state: 'ready', text: 'final replacement' }; };
  f.adapters[0].stopWaiting = () => completion.resolve();
  await f.submit(c); await observed.promise;
  publish({ text: 'partial first' }); await new Promise((r) => setTimeout(r, 20));
  assert.equal((await f.runtime.get(c.id)).reply.text, 'partial first');
  publish({ text: 'replacement' }); await new Promise((r) => setTimeout(r, 20));
  const stream = await f.runtime.get(c.id); assert.equal(stream.reply.state, 'streaming'); assert.equal(stream.reply.text, 'replacement');
  completion.resolve(); assert.equal((await f.settle(c.id)).reply.text, 'final replacement');
  publish({ text: 'late stale update' }); await new Promise((r) => setTimeout(r, 20));
  assert.equal((await f.runtime.get(c.id)).reply.text, 'final replacement');
});

test('Finish freezes latest partial reply and ignores later completion/update', async (t) => {
  const f = fixture(t, { replyUpdateMs: 1 }), c = await f.connect(); const observed = deferred(), completion = deferred(); let publish;
  f.adapters[0].readReply = async (onUpdate) => { publish = onUpdate; observed.resolve(); await completion.promise; return { state: 'ready', text: 'too late' }; };
  f.adapters[0].stopWaiting = () => completion.resolve();
  await f.submit(c); await observed.promise; publish({ text: 'preserved partial' });
  const done = await f.runtime.finish(c.id); assert.equal(done.reply.state, 'interrupted'); assert.equal(done.reply.text, 'preserved partial');
  publish({ text: 'late' }); await new Promise((r) => setTimeout(r, 20));
  assert.equal((await f.runtime.get(c.id)).reply.text, 'preserved partial');
});

test('fresh readiness waits read-only for exact origin and composer before ready', async () => {
  let checks = 0, composers = 0;
  const f = browserFixture({ freshTab: true, readinessDependencies: {
    listTargets: async () => [{ id: 'created', url: ++checks < 3 ? 'about:blank' : 'https://chatgpt.com/' }],
    findComposer: async () => ({ found: ++composers >= 3 }), sleep: async () => {},
  } });
  const connected = await f.connect(); assert.equal(connected.readiness.ready, true); assert.ok(checks >= 5);
  assert.equal(f.calls.some(([name]) => name === 'type' || name === 'send'), false); await f.adapter.stop();
});

test('fresh readiness reports outside redirect and auth gate safely as blocked', async () => {
  const redirect = browserFixture({ freshTab: true, readinessDependencies: { listTargets: async () => [{ id: 'created', url: 'https://outside.test/private?token=secret' }] } });
  const result = await redirect.connect(); assert.equal(result.readiness.reason, 'BINDING_CHANGED'); assert.equal(result.readiness.ready, false);
  assert.equal(JSON.stringify(result).includes('secret'), false); await redirect.adapter.stop();
  const auth = browserFixture({ freshTab: true, readinessDependencies: { detectAuthWall: async () => ({ blocked: true, reason: 'private raw URL' }) } });
  assert.equal((await auth.connect()).readiness.reason, 'AUTH_WALL'); await auth.adapter.stop();
});
