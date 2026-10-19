// Lock disposal, explicit tombstone archival and report liveness. Proves that
// neither an owner disposal nor an archival (complete or interrupted) can let
// the same operation be submitted again, and that an unacknowledged report no
// longer wedges the commander forever. Offline: real driver + real task store.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { ARCHIVE_KEY, DISPATCH_KEY, TASKS_KEY, createChatGPTTaskStore, prepareTask } from '../src/lib/chatgpt-tasks.js';
import { createChatGPTPortDriver, CHATGPT_ACTION } from '../src/background/chatgpt-port.js';
import { createBus } from '../src/bus/bus.js';
import { REASON } from '../src/bus/contracts.js';
import { createChatGPTAdapter, createDriverCall } from '../src/bus/adapters/chatgpt.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';
import { memoryStorage } from './fixtures/bus-memory.js';

const life = { assertActive() {} };
const code = (re) => (e) => re.test(String(e.code)) || re.test(String(e.message));
const digest = async (b) => createHash('sha256').update(b).digest();
const chrome = (storage = memoryStorage()) => ({ storage: { local: storage } });
async function reserve(store, n, url = `https://chatgpt.com/c/conv-${n}`) {
  const rec = await prepareTask({ text: `t${n}`, correlation_id: `corr-${n}`, approved_scope_ref: 'scope', task_id: `task-${n}`, operation_key: `op-${n}` },
    { url, tab_id: n }, life, digest);
  await store.reserveOperation(rec, life);
  return rec;
}

test('disposal releases the conversation lock but the same operation can never be reserved again', async () => {
  const store = createChatGPTTaskStore({ chrome: chrome() });
  const rec = await reserve(store, 1);
  await assert.rejects(reserve(store, 2, 'https://chatgpt.com/c/conv-1'), code(/conversation_locked/));
  const d = await store.disposeOperation('corr-1', 'owner_saw_delivered', life);
  assert.equal(d.phase, 'OWNER_DISPOSED');
  assert.equal(d.lock_active, false);
  await reserve(store, 3, 'https://chatgpt.com/c/conv-1');               // conversation usable again
  await assert.rejects(store.reserveOperation(rec, life), code(/already_dispatched|dispatch_in_flight/)); // never the same op
  await assert.rejects(store.disposeOperation('corr-1', 'owner_abandoned', life), code(/task_already_resolved/));
  await assert.rejects(store.disposeOperation('corr-x', 'owner_abandoned', life), code(/operation_not_reserved/));
  await assert.rejects(store.disposeOperation('corr-3', 'because', life), code(/unknown disposition/));
});

test('archival frees the bounded store and archived identities still block reuse', async () => {
  const storage = memoryStorage();
  const store = createChatGPTTaskStore({ chrome: chrome(storage) });
  const recs = [];
  for (let i = 1; i <= 6; i += 1) { const r = await reserve(store, i); recs.push(r); await store.disposeOperation(`corr-${i}`, 'owner_saw_delivered', life); }
  const out = await store.archiveResolved(2, life);
  assert.deepEqual(out, { archived: 4, kept: 2, archive_size: 4 });
  assert.equal(Object.keys(storage.bag[TASKS_KEY].operations).length, 2);
  assert.equal(Object.keys(storage.bag[DISPATCH_KEY].reservations).length, 2);
  for (const r of recs) await assert.rejects(store.reserveOperation(r, life), code(/already_dispatched|operation_conflict/), r.correlation_id);
  // A fresh identity is fine.
  await reserve(store, 99);
});

test('archival interrupted after the archive write and after the tasks write is safe and self-heals', async () => {
  for (const failAt of [2, 3]) {
    const storage = memoryStorage();
    const store = createChatGPTTaskStore({ chrome: chrome(storage) });
    const r = await reserve(store, 1);
    await store.disposeOperation('corr-1', 'owner_saw_delivered', life);
    const realSet = storage.set.bind(storage);
    let n = 0;
    storage.set = async (v) => { n += 1; if (n === failAt) throw new Error('crash'); return realSet(v); };
    await assert.rejects(store.archiveResolved(0, life), code(/crash/));
    storage.set = realSet;
    // Whatever was written, the op stays blocked and the conversation is NOT wedged.
    await assert.rejects(store.reserveOperation(r, life), code(/already_dispatched|operation_conflict/));
    await reserve(store, 2, 'https://chatgpt.com/c/conv-1');
    await store.disposeOperation('corr-2', 'owner_saw_delivered', life);
    const healed = await store.archiveResolved(0, life);
    assert.ok(healed.archived >= 1);
    assert.equal(Object.keys(storage.bag[DISPATCH_KEY].reservations).length, 0, 'stale legacy tombstones removed on re-run');
    assert.ok(storage.bag[ARCHIVE_KEY].correlations['corr-1']);
  }
});

test('unresolved operations are never archived', async () => {
  const store = createChatGPTTaskStore({ chrome: chrome() });
  await reserve(store, 1);
  assert.deepEqual(await store.archiveResolved(0, life), { archived: 0, kept: 1 });
});

test('driver dispose/archive require the explicit gesture', async () => {
  const api = { ...chrome(), tabs: { async query() { return []; } } };
  const driver = createChatGPTPortDriver({ chrome: api, digest });
  const call = createDriverCall(driver);
  assert.equal((await call('aion/chatgpt-dispose', { correlation_id: 'x', disposition: 'owner_abandoned' })).code, 'explicit_command_required');
  assert.equal((await call('aion/chatgpt-archive', {})).code, 'explicit_command_required');
  assert.equal((await call('aion/chatgpt-archive', { user_gesture: true })).ok, true);
});

/* ------------------------------ bus: report liveness and owner disposal */

const CMD = 'https://chatgpt.com/c/commander-1';
const R06 = 'https://chatgpt.com/c/toolsmith-6';
function browser({ commanderAck = true, agentMode = 'accept', commanderOpen = true } = {}) {
  const bag = {};
  const posted = [];
  const tabs = [[7, CMD], [9, R06]];
  const api = {
    storage: { local: { async get(k) { return Object.hasOwn(bag, k) ? { [k]: structuredClone(bag[k]) } : {}; }, async set(v) { Object.assign(bag, structuredClone(v)); } } },
    tabs: {
      async query() { return tabs.filter(([, u]) => commanderOpen || u !== CMD).map(([id, url]) => ({ id, url })); },
      connect(tabId) {
        const url = tabs.find(([id]) => id === tabId)[1];
        const ls = new Set();
        return { onMessage: { addListener: (f) => ls.add(f), removeListener: (f) => ls.delete(f) }, onDisconnect: { addListener() {}, removeListener() {} }, disconnect() {},
          postMessage(m) {
            posted.push({ url, ...structuredClone(m) });
            const identity = { task_id: m.task_id, operation_key: m.operation_key, correlation_id: m.correlation_id, observer_id: `o${tabId}`, page_instance_id: `p${tabId}` };
            const pending = { action: m.action, ok: false, ...identity, observation: { phase: 'OBSERVING', click_attempted: true, submission_observed: true, generation_started: true, generation_complete: false, continuity: true, method: 'x', remaining_ms: 1, reason: null },
              click_attempted: true, submission_observed: true, submitted: true, uncertain: true, pending: true };
            let reply;
            if (m.action === CHATGPT_ACTION.PING) reply = { action: m.action, ok: true, href: url, state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, sendControlCount: 1 } };
            else if (m.action === CHATGPT_ACTION.SUBMIT_TURN) {
              const silent = (url === CMD && !commanderAck) || (url === R06 && agentMode === 'pending');
              if (silent) reply = pending;
              else {
                const body = `${m.correlation_id}\nok\n${m.expected_reply_token}`;
                const base = acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token, replyText: body });
                reply = { ...pending, ok: true, observation: { ...pending.observation, phase: 'REPLY_CHECKED', generation_complete: true, reason: 'accepted' }, uncertain: false, pending: false, verdict: base.verdict, envelope: base.envelope };
              }
            } else if (m.action === CHATGPT_ACTION.OBSERVE_TURN) reply = { ...pending, action: m.action };
            if (reply) queueMicrotask(() => { for (const f of [...ls]) f(reply); });
          } };
      },
    },
  };
  const driver = createChatGPTPortDriver({ chrome: api, digest });
  return { api, bag, posted, driver, submits: (u) => posted.filter((x) => x.action === CHATGPT_ACTION.SUBMIT_TURN && x.url === u) };
}
async function world(opts) {
  const b = browser(opts);
  let n = 0;
  const bus = createBus({ storage: memoryStorage(), adapters: [createChatGPTAdapter({ call: createDriverCall(b.driver), submitTimeoutMs: 300 })],
    randomId: () => `rv${String(n += 1).padStart(10, '0')}` });
  await bus.bind('aion', { adapter: 'chatgpt.com', ref: CMD, confirmed_by: 'o' });
  await bus.bind('role-06', { adapter: 'chatgpt.com', ref: R06, confirmed_by: 'o' });
  await bus.designateCommander('aion');
  await bus.grant({ grant_id: 'g', ref: 'o', agents: ['aion', 'role-06'], ops: ['send', 'status'], max_count: 20, rate_per_hour: 20, expires_utc: '2099-01-01T00:00:00.000Z' });
  let t = 0;
  const say = (text, nonce) => bus.process({ source: { adapter: 'chatgpt.com', ref: CMD }, turn_sig: `turn-${t += 1}`, user_head: 'AION> x',
    assistant_text: `\`\`\`AION_CMD_V1\nop: send\nto: role-06\ntext: ${text}\nnonce: ${nonce}\n\`\`\`` });
  return { b, bus, say };
}

test('an unacknowledged report still counts as posted; the owner can dispose its lock; reports flow again', async () => {
  const w = await world({ commanderAck: false });
  const first = await w.say('one', 'rec-0001');
  assert.equal(first.dispatched.state, 'REPLY_CHECKED');
  assert.equal(first.dispatched.report.state, 'SUBMISSION_OBSERVED', 'commander did not acknowledge');
  assert.equal((await w.bus.readCommand(first.ingested.command_id)).state, 'REPORTED', 'the data is in the commander');
  // Second command: its report is DEFERRED while the commander lock is held (no attempt), not lost.
  const second = await w.say('two', 'rec-0002');
  assert.equal(second.dispatched.state, 'REPLY_CHECKED');
  // Owner looks at the commander, sees the first report, disposes it.
  const reportId = first.dispatched.report.report_id;
  const d = await w.bus.dispose(reportId, { disposition: 'owner_saw_delivered', by: 'owner:test' });
  assert.equal(d.disposed, true);
  assert.equal(d.lock_released, true);
  const flushed = await w.bus.flushReports();
  assert.ok(flushed.length >= 1);
  assert.equal(w.b.submits(CMD).length, 2, 'second report sent after disposal; the first was never resent');
  assert.equal(w.b.submits(R06).length, 2);
});

test('report retries are bounded and only for positively-not-sent reports', async () => {
  const w = await world({ commanderOpen: false });     // commander tab closed: every report is a positive no-send
  const r = await w.say('one', 'rb-00001');
  assert.equal(r.dispatched.report.state, 'REJECTED');
  for (let i = 0; i < 4; i += 1) await w.bus.flushReports();
  const src = await w.bus.readCommand(r.ingested.command_id);
  assert.equal(src.state, 'HALTED');
  assert.equal(src.reason, REASON.REPORT_RETRIES_EXHAUSTED);
  const attempts = (await w.bus.status()).commands.filter((c) => c.op === 'report');
  assert.equal(attempts.length, 3);
  assert.ok(attempts.every((c) => c.delivery === 'NOT_SENT'));
  assert.equal(w.b.submits(CMD).length, 0, 'refused reports never reached a page');
});

test('owner disposal of an unresolved agent command releases the agent conversation without resending', async () => {
  const w = await world({ agentMode: 'pending' });
  const r = await w.say('slow', 'od-00001');
  assert.equal(r.dispatched.state, 'SUBMISSION_OBSERVED');
  assert.equal((await w.say('again', 'od-00002')).ingested.reason, REASON.TARGET_BUSY);
  await assert.rejects(w.bus.dispose(r.ingested.command_id, { disposition: 'nope', by: 'o' }), code(/disposition/));
  const d = await w.bus.dispose(r.ingested.command_id, { disposition: 'owner_saw_not_delivered', by: 'owner:test' });
  assert.equal(d.disposed, true);
  const st = (await w.bus.status()).commands.find((c) => c.command_id === r.ingested.command_id);
  assert.equal(st.state, 'HALTED');
  assert.equal(st.delivery, 'NOT_SENT');
  const next = await w.say('fresh command', 'od-00003');
  assert.equal(next.ingested.accepted, true);
  assert.equal(w.b.submits(R06).length, 2, 'one original + one NEW command; the disposed one was never resent');
});
