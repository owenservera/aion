import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createChatGPTPortDriver } from '../src/background/chatgpt-port.js';
import { validateEnvelope } from '../src/lib/envelope.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';
import { canonicalConversation, createChatGPTTaskStore, DISPATCH_KEY, DISPATCH_SCHEMA, TASKS_KEY, TASKS_SCHEMA, MAX_TASKS } from '../src/lib/chatgpt-tasks.js';

const instruction = { user_gesture: true, approved_scope_ref: 'owner-existing-scope', text: 'bounded owner instruction 🌌',
  correlation_id: 'attempt-one', expected_reply_token: 'ACK-1', task_id: 'task-one', operation_key: 'operation-one', tab_id: 7, timeout_ms: 20 };
function fixture(options = {}) {
  const bag = {};
  const writes = [], sends = [];
  const tabs = [
    { id: 7, url: 'https://chatgpt.com/c/one?private=discard#fragment' },
    { id: 8, url: 'https://chatgpt.com/c/one' },
    { id: 9, url: 'https://chatgpt.com/c/two' },
    { id: 10, url: 'https://chatgpt.com/' },
    { id: 11, url: 'https://chatgpt.com/new' },
  ];
  let mode = options.mode ?? 'uncertain';
  const api = {
    storage: { local: {
      async get(key) { return options.get ? options.get(key, bag) : Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}; },
      async set(value) {
        writes.push(structuredClone(value));
        if (options.set) await options.set(value, writes.length);
        Object.assign(bag, structuredClone(value));
      },
    } },
    tabs: {
      async query() { return tabs; },
      connect() {
        const listeners = new Set();
        return {
          onMessage: { addListener(fn) { listeners.add(fn); }, removeListener(fn) { listeners.delete(fn); } },
          onDisconnect: { addListener() {}, removeListener() {} }, disconnect() {},
          postMessage(message) {
            let reply;
            if (message.action === 'ping') reply = { action: 'ping', ok: true, state: { generating: false, sendPresent: true, composer_visible_count: 1 } };
            else if (message.action === 'run-turn') {
              sends.push(message);
              if (mode === 'silent') return;
              if (mode === 'accepted' || mode === 'foreign') {
                const correlation = mode === 'foreign' ? 'foreign-correlation' : message.correlation_id;
                reply = acceptedAdapterReply({ correlationId: correlation, token: message.expected_reply_token });
                options.mutateReply?.(reply);
              } else reply = { action: message.action, ok: false, reason: 'generation_incomplete', ...(mode === 'no-submit' ? { submitted: false } : {}) };
            } else reply = { action: message.action, ok: false, verdict: { accepted: false, reason: 'generation_incomplete' } };
            queueMicrotask(() => { for (const fn of [...listeners]) fn(reply); });
          },
        };
      },
    },
  };
  const make = () => createChatGPTPortDriver({ chrome: api, policy: { grace: 10, setup: 10, ...options.policy },
    digest: async (bytes) => createHash('sha256').update(bytes).digest() });
  return { bag, api, writes, sends, tabs, make, driver: make(), store: createChatGPTTaskStore({ chrome: api }), setMode(value) { mode = value; } };
}
const repeat = (extra = {}) => ({ ...instruction, correlation_id: 'attempt-two', task_id: 'task-two', operation_key: 'operation-two', ...extra });
const task = (f, key = instruction.operation_key) => f.bag[TASKS_KEY].operations[key];
function orphan(f, values = {}) {
  const record = { correlation_id: 'old', state: 'IN_FLIGHT', tab_id: 7, started_at: 'historical', original_field: 'retained', ...values };
  f.bag[DISPATCH_KEY] = { schema: DISPATCH_SCHEMA, reservations: { old: record } };
  return structuredClone(record);
}

test('canonical destination strips query/hash, shares conversation aliases and treats home conservatively', () => {
  assert.equal(canonicalConversation('https://chatgpt.com/c/one/?q=private#fragment'), 'https://chatgpt.com/c/one');
  for (const path of ['/', '/new', '/new-chat', '/g/unknown', '/c', '/unsupported-prefix/c/one', '/g/project/c/one']) assert.equal(canonicalConversation(`https://chatgpt.com${path}`), 'https://chatgpt.com/');
  for (const url of ['http://chatgpt.com/c/one', 'https://elsewhere.test/c/one', 'https://user@chatgpt.com/c/one']) assert.throws(() => canonicalConversation(url));
});

test('legacy first, rich second, dispatch only after both acknowledged; metadata has real SHA256 and no raw content', async () => {
  let f;
  f = fixture({ set: async () => assert.equal(f.sends.length, 0) });
  // Only reservation writes have this assertion; settle writes occur after send.
  let reservationWrites = 0;
  f.api.storage.local.set = async (value) => {
    f.writes.push(structuredClone(value));
    if (++reservationWrites <= 2) assert.equal(f.sends.length, 0);
    Object.assign(f.bag, structuredClone(value));
  };
  await f.driver.runTurn(instruction);
  assert.deepEqual(f.writes.map((value) => Object.keys(value)[0]), [DISPATCH_KEY, TASKS_KEY, DISPATCH_KEY, TASKS_KEY]);
  const record = task(f);
  assert.equal(record.payload_hash, createHash('sha256').update(instruction.text).digest('hex'));
  assert.equal(record.payload_chars, instruction.text.length);
  assert.equal(record.target.url, 'https://chatgpt.com/c/one');
  assert.equal(record.approved_scope_ref, instruction.approved_scope_ref);
  assert.equal(record.phase, 'NEEDS_RECONCILIATION');
  assert.equal(record.lock_active, true);
  assert.equal(record.facts.submission_observed, null);
  assert.equal(record.facts.click_attempted, null);
  assert.equal(record.facts.consumed, false);
  assert.ok(Number.isFinite(Date.parse(record.created_at)));
  assert.ok(!JSON.stringify(f.bag).includes(instruction.text));
  assert.ok(!JSON.stringify(f.bag).includes('private=discard'));
});

test('same stable operation cannot resubmit with the same or a fresh correlation, across driver restarts', async () => {
  const f = fixture();
  await f.driver.runTurn(instruction);
  for (const correlation_id of [instruction.correlation_id, 'fresh-attempt']) {
    const result = await f.make().runTurn({ ...instruction, correlation_id });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'already_dispatched');
  }
  assert.equal(f.sends.length, 1);
});

test('request snapshot binds the digest to the actual outbound payload across asynchronous preparation', async () => {
  const f = fixture();
  const command = { ...instruction };
  const pending = f.driver.runTurn(command);
  command.text = 'changed while awaiting preparation';
  command.operation_key = 'changed-operation';
  await pending;
  assert.equal(f.sends[0].text, instruction.text);
  assert.equal(task(f).payload_hash, createHash('sha256').update(instruction.text).digest('hex'));
  assert.equal(task(f).operation_key, instruction.operation_key);
});

for (const changed of [{ text: 'different payload' }, { tab_id: 9 }, { approved_scope_ref: 'different-scope' },
  { task_id: 'different-task' }, { role_id: '05' }, { binding_revision: 'changed' }]) {
  test(`immutable operation refuses conflicting ${Object.keys(changed)[0]}`, async () => {
    const f = fixture(); await f.driver.runTurn(instruction);
    const result = await f.make().runTurn({ ...instruction, correlation_id: 'fresh-attempt', ...changed });
    assert.equal(result.code, 'operation_conflict'); assert.equal(f.sends.length, 1);
  });
}

test('fresh task/op/correlation in a second tab cannot bypass the same conversation lock', async () => {
  const f = fixture(); await f.driver.runTurn(instruction);
  assert.equal((await f.make().runTurn(repeat({ tab_id: 8 }))).code, 'conversation_locked');
  assert.equal(f.sends.length, 1);
  assert.equal((await f.make().runTurn(repeat({ tab_id: 9 }))).code, 'turn_refused', 'independent known conversation remains usable under existing policy');
  assert.equal(f.sends.length, 2);
});

test('unresolved home/new-chat reservations block aliases and unknown final destinations', async () => {
  const f = fixture(); await f.driver.runTurn({ ...instruction, tab_id: 10 });
  for (const tab_id of [7, 10, 11]) assert.equal((await f.make().runTurn(repeat({ tab_id }))).code, 'conversation_locked');
  assert.equal(f.sends.length, 1);
  assert.equal(task(f).conversation_key, 'https://chatgpt.com/');
});

test('unsupported-prefix routes share the conservative home lock, not an independent conversation lock', async () => {
  for (const initialUnknown of [false, true]) {
    const f = fixture();
    f.tabs.push({ id: 12, url: 'https://chatgpt.com/unsupported-prefix/c/one?discard#fragment' });
    await f.driver.runTurn({ ...instruction, tab_id: initialUnknown ? 12 : 7 });
    assert.equal((await f.make().runTurn(repeat({ tab_id: initialUnknown ? 7 : 12 }))).code, 'conversation_locked');
    assert.equal(f.sends.length, 1);
    assert.equal(task(f).conversation_key, initialUnknown ? 'https://chatgpt.com/' : 'https://chatgpt.com/c/one');
  }
});

test('legacy orphan at an unsupported-prefix route blocks conservatively without alias claims', async () => {
  const f = fixture(); const old = orphan(f, { url: 'https://chatgpt.com/unsupported-prefix/c/one' });
  assert.equal((await f.driver.runTurn(instruction)).code, 'conversation_locked');
  assert.deepEqual(f.bag[DISPATCH_KEY].reservations.old, old);
  assert.equal(f.sends.length, 0); assert.equal(f.writes.length, 0);
});

test('previously stored unsupported-prefix task keys fail closed rather than silently changing locks', async () => {
  const f = fixture(); await f.driver.runTurn(instruction);
  const url = 'https://chatgpt.com/unsupported-prefix/c/one';
  task(f).target.url = url; task(f).conversation_key = url;
  f.bag[DISPATCH_KEY].reservations[instruction.correlation_id].url = url;
  f.bag[DISPATCH_KEY].reservations[instruction.correlation_id].conversation_key = url;
  const before = structuredClone(f.bag);
  assert.equal((await f.make().runTurn(repeat())).code, 'reservation_failed');
  assert.deepEqual(f.bag, before); assert.equal(f.sends.length, 1);
});

test('legacy callers derive identities from correlation but still get a durable conversation lock', async () => {
  const f = fixture();
  const { task_id, operation_key, ...legacy } = instruction;
  const result = await f.driver.runTurn(legacy);
  assert.equal(result.task_id, instruction.correlation_id);
  assert.equal(result.operation_key, instruction.correlation_id);
  assert.equal((await f.make().runTurn({ ...legacy, correlation_id: 'fresh', tab_id: 8 })).code, 'conversation_locked');
  assert.equal(f.sends.length, 1);
});

for (const state of ['IN_FLIGHT', 'COMPLETED']) {
  test(`legacy orphan ${state} with saved URL is conservatively projected, never dropped`, async () => {
    const f = fixture(); const old = orphan(f, { state, url: 'https://chatgpt.com/c/one?ignored#fragment', captured: true });
    assert.equal((await f.driver.runTurn(instruction)).code, 'conversation_locked');
    await f.driver.runTurn({ ...instruction, tab_id: 9 });
    assert.equal(f.sends.length, 1);
    assert.deepEqual(f.bag[DISPATCH_KEY].reservations.old, old);
  });
}

test('legacy same-tab and unmappable orphan locks fail closed, including absent richer store', async () => {
  for (const tab_id of [7, 99, undefined]) {
    const f = fixture(); orphan(f, { tab_id });
    assert.equal((await f.driver.runTurn(instruction)).code, 'conversation_locked');
    assert.equal(f.sends.length, 0); assert.equal(f.writes.length, 0);
  }
});

test('failed richer reservation leaves legacy guard and never dispatches, even with fresh IDs', async () => {
  const f = fixture({ set: async (value) => { if (Object.hasOwn(value, TASKS_KEY)) throw new Error('write failed'); } });
  const first = await f.driver.runTurn(instruction);
  assert.equal(first.code, 'reservation_failed'); assert.equal(first.submitted, false);
  assert.equal(f.sends.length, 0); assert.equal(f.bag[TASKS_KEY], undefined);
  assert.equal(f.bag[DISPATCH_KEY].reservations[instruction.correlation_id].state, 'IN_FLIGHT');
  const sameOp = await f.make().runTurn({ ...instruction, correlation_id: 'fresh' });
  assert.equal(sameOp.code, 'dispatch_in_flight');
  assert.equal((await f.make().runTurn(repeat())).code, 'conversation_locked');
  assert.equal(f.sends.length, 0);
});

test('rich settlement failure after legacy COMPLETED keeps reservation locked and returns uncertainty', async () => {
  const f = fixture({ mode: 'accepted', set: async (_value, count) => { if (count === 4) throw new Error('settlement failed'); } });
  const result = await f.driver.runTurn(instruction);
  assert.equal(result.code, 'reservation_failed'); assert.equal(result.uncertain, true);
  assert.equal(f.bag[DISPATCH_KEY].reservations[instruction.correlation_id].state, 'COMPLETED');
  assert.equal(task(f).phase, 'SUBMIT_RESERVED'); assert.equal(task(f).lock_active, true);
  assert.equal(task(f).facts.reply_checked, false);
  assert.equal((await f.make().runTurn(repeat({ tab_id: 8 }))).code, 'conversation_locked');
  assert.equal(f.sends.length, 1);
});

test('timed-out issued richer write retains the shared barrier and cannot dispatch when it resolves late', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const f = fixture({ policy: { reservationWrite: 200 }, set: async (_value, count) => { if (count === 2) await gate; } });
  const result = await f.driver.runTurn(instruction);
  assert.equal(result.code, 'content_timeout'); assert.equal(result.stage, 'reservationWrite');
  assert.equal(f.sends.length, 0);
  assert.equal(f.bag[TASKS_KEY], undefined);
  const busy = await f.make().runTurn(repeat({ tab_id: 9 }));
  assert.equal(busy.code, 'reservation_failed'); assert.match(busy.error, /reservation_store_busy/);
  release(); await new Promise(setImmediate); await new Promise(setImmediate);
  assert.equal(f.sends.length, 0); assert.equal(f.writes.length, 2);
  assert.equal(task(f).phase, 'SUBMIT_RESERVED');
  assert.equal((await f.make().runTurn({ ...instruction, correlation_id: 'fresh' })).code, 'already_dispatched');
});

for (const mode of ['no-submit', 'accepted']) {
  test(`positive ${mode} safely resolves lock but never consumes or invents DOM facts`, async () => {
    const f = fixture({ mode }); await f.driver.runTurn(instruction);
    assert.equal(task(f).phase, mode === 'accepted' ? 'REPLY_CHECKED' : 'REFUSED_NO_SUBMIT');
    assert.equal(task(f).lock_active, false);
    assert.equal(task(f).facts.consumed, false);
    assert.equal(task(f).facts.submission_observed, null);
    assert.equal(task(f).facts.generation_complete, null);
    assert.equal(task(f).facts.no_submit, mode === 'no-submit');
    assert.equal(task(f).facts.reply_checked, mode === 'accepted');
    await f.make().runTurn(repeat());
    assert.equal(f.sends.length, 2);
    assert.equal((await f.make().runTurn({ ...instruction, correlation_id: 'third' })).code, 'already_dispatched');
  });
}

test('a schema-valid but foreign accepted wrapper is not a checked task or an unlocked conversation', async () => {
  const f = fixture({ mode: 'foreign' }); const result = await f.driver.runTurn(instruction);
  assert.equal(result.ok, false); assert.equal(result.captured, false); assert.equal(result.uncertain, true);
  assert.equal(task(f).phase, 'NEEDS_RECONCILIATION'); assert.equal(task(f).lock_active, true);
  assert.equal(task(f).facts.reply_checked, false);
});

const acceptanceContradictions = [
  ['rejected event and task state (oracle reproduction)', (reply) => {
    reply.envelope.event_type = 'proof.rejected'; reply.envelope.task_state = 'REJECTED';
    reply.envelope.payload.accepted = false; reply.envelope.payload.reason = 'generation_incomplete';
  }],
  ['rejected event only', (reply) => { reply.envelope.event_type = 'proof.rejected'; }],
  ['rejected task state only', (reply) => { reply.envelope.task_state = 'REJECTED'; }],
  ['wrong producer', (reply) => { reply.envelope.producer_node = 'node-foreign'; }],
  ['wrong target', (reply) => { reply.envelope.target_node = 'node-foreign'; }],
  ['false inner payload acceptance', (reply) => { reply.envelope.payload.accepted = false; }],
  ['missing inner payload acceptance', (reply) => { delete reply.envelope.payload.accepted; }],
  ['foreign inner payload correlation', (reply) => { reply.envelope.payload.correlation_id = 'foreign'; }],
  ['wrong payload expectation', (reply) => { reply.envelope.payload.expected_reply = 'WRONG'; }],
  ['wrong verdict expectation', (reply) => { reply.verdict.expected_reply = 'WRONG'; }],
  ['matching but unrequested expectation', (reply) => { reply.verdict.expected_reply = reply.envelope.payload.expected_reply = 'WRONG'; }],
  ['missing payload expectation', (reply) => { delete reply.envelope.payload.expected_reply; }],
  ['rejected payload reason', (reply) => { reply.envelope.payload.reason = 'generation_incomplete'; }],
  ['foreign payload schema', (reply) => { reply.envelope.payload.schema = 'unknown/1'; }],
  ['incomplete adapter generation', (reply) => { reply.envelope.payload.generation.complete = false; }],
  ['missing adapter generation', (reply) => { delete reply.envelope.payload.generation; }],
  ['rejected extraction', (reply) => { reply.envelope.payload.extraction.ok = false; }],
  ['contradictory observed completion', (reply) => {
    reply.envelope.payload.observed = { ...reply.envelope.payload.observed, generation_complete: false };
  }],
  ['missing observed token match', (reply) => {
    reply.envelope.payload.observed = { ...reply.envelope.payload.observed, reply_token_found: false };
  }],
  ['foreign observed correlation', (reply) => {
    reply.envelope.payload.observed = { ...reply.envelope.payload.observed, correlation_ids: ['foreign'] };
  }],
  ['different stored reply body', (reply) => { reply.envelope.payload.reply_text = 'not the verdict reply'; }],
];
for (const [label, mutateReply] of acceptanceContradictions) {
  test(`acceptance gate refuses ${label}, retains lock and never reports a capture`, async () => {
    const f = fixture({ mode: 'accepted', mutateReply: (reply) => {
      mutateReply(reply);
      assert.equal(validateEnvelope(reply.envelope).valid, true, 'regression is schema-valid, not just malformed JSON');
    } });
    const result = await f.driver.runTurn(instruction);
    assert.equal(result.ok, false); assert.equal(result.captured, false); assert.equal(result.uncertain, true);
    assert.equal(result.envelope, null);
    assert.equal(task(f).phase, 'NEEDS_RECONCILIATION');
    assert.equal(task(f).facts.reply_checked, false); assert.equal(task(f).lock_active, true);
    assert.equal((await f.make().runTurn(repeat({ tab_id: 8 }))).code, 'conversation_locked');
    assert.equal(f.sends.length, 1);
  });
}

test('caller generation-complete assertion cannot fill a missing adapter acceptance contract', async () => {
  const f = fixture({ mode: 'accepted', mutateReply: (reply) => { delete reply.envelope.payload.generation; } });
  const result = await f.driver.runTurn({ ...instruction, generation_complete: true });
  assert.equal(result.ok, false); assert.equal(result.captured, false);
  assert.equal(task(f).lock_active, true); assert.equal(task(f).facts.reply_checked, false);
});

test('timeout retains durable uncertainty; a fresh correlation does not resend', async () => {
  const f = fixture({ mode: 'silent' });
  const result = await f.driver.runTurn(instruction);
  assert.equal(result.code, 'content_timeout'); assert.equal(result.uncertain, true);
  assert.equal(task(f).phase, 'SUBMIT_RESERVED'); assert.equal(task(f).lock_active, true);
  assert.equal((await f.make().runTurn(repeat())).code, 'conversation_locked'); assert.equal(f.sends.length, 1);
});

test('concurrent instances serialize the whole legacy/rich transaction; no lost map or duplicate operation', async () => {
  const f = fixture();
  const results = await Promise.all([f.driver.runTurn(instruction), f.make().runTurn({ ...instruction, correlation_id: 'fresh' })]);
  assert.equal(f.sends.length, 1);
  assert.ok(results.some((result) => ['reservation_failed', 'already_dispatched'].includes(result.code)));
  assert.equal(Object.keys(f.bag[TASKS_KEY].operations).length, 1);
  assert.equal(Object.keys(f.bag[DISPATCH_KEY].reservations).length, 1);
});

test('task reads expose validated metadata only, never run/fill or mutate storage', async () => {
  const f = fixture(); await f.driver.runTurn(instruction);
  const sends = f.sends.length, writes = f.writes.length;
  const one = await f.store.getTask(instruction.task_id);
  one.phase = 'CONSUMED';
  assert.equal((await f.store.listTasks())[0].phase, 'NEEDS_RECONCILIATION');
  assert.equal(await f.store.getTask('not-present'), null);
  assert.equal(f.sends.length, sends); assert.equal(f.writes.length, writes);
});

test('corrupt/unknown rich and legacy schemas never become an empty store', async () => {
  for (const [key, value] of [[TASKS_KEY, null], [TASKS_KEY, { schema: 'future', operations: {} }],
    [TASKS_KEY, { schema: TASKS_SCHEMA, operations: [], raw_prompt: 'not allowed' }],
    [DISPATCH_KEY, { schema: 'future', reservations: {} }], [DISPATCH_KEY, undefined]]) {
    const f = fixture(); f.bag[key] = value;
    assert.equal((await f.driver.runTurn(instruction)).code, 'reservation_failed');
    assert.equal(f.sends.length, 0); assert.equal(f.writes.length, 0);
  }
});

test('strict task fields, inconsistent facts, unsafe keys/prototypes and missing legacy counterparts refuse', async () => {
  for (const corrupt of [
    (f) => { task(f).raw_prompt = 'private'; },
    (f) => { task(f).facts.submission_observed = true; },
    (f) => { task(f).lock_active = false; },
    (f) => { task(f).payload_hash = 'not-a-hash'; },
    (f) => { task(f).approved_scope_ref = 'x'.repeat(129); },
    (f) => { task(f).target.url += '?unexpected'; },
    (f) => { delete f.bag[DISPATCH_KEY].reservations[instruction.correlation_id]; },
    (f) => { Object.defineProperty(f.bag[TASKS_KEY].operations, '__proto__', { value: {}, enumerable: true }); },
  ]) {
    const f = fixture(); await f.driver.runTurn(instruction); corrupt(f);
    const result = await f.make().runTurn(repeat({ tab_id: 9 }));
    assert.equal(result.code, 'reservation_failed'); assert.equal(f.sends.length, 1);
  }
  const polluted = Object.create({ inherited: true });
  const f = fixture({ get: async (key) => key === TASKS_KEY ? { [key]: polluted } : {} });
  assert.equal((await f.driver.runTurn(instruction)).code, 'reservation_failed'); assert.equal(f.sends.length, 0);
});

test('prototype-like caller identities and invented conversation keys refuse before writes', async () => {
  for (const extra of [{ operation_key: '__proto__' }, { task_id: 'constructor' }, { conversation_key: 'invented' }, { role_id: {} }]) {
    const f = fixture(); assert.equal((await f.driver.runTurn({ ...instruction, ...extra })).ok, false);
    assert.equal(f.sends.length, 0); assert.equal(f.writes.length, 0);
  }
});

test('full richer guard store refuses safely with all tombstones retained', async () => {
  const f = fixture(); await f.driver.runTurn(instruction);
  const baseTask = structuredClone(task(f)), baseLegacy = structuredClone(f.bag[DISPATCH_KEY].reservations[instruction.correlation_id]);
  for (let i = 1; i < MAX_TASKS; i++) {
    const key = `historical-${i}`, url = `https://chatgpt.com/c/historical-${i}`;
    f.bag[TASKS_KEY].operations[key] = { ...structuredClone(baseTask), task_id: key, operation_key: key, correlation_id: key,
      conversation_key: url, target: { ...baseTask.target, url } };
    f.bag[DISPATCH_KEY].reservations[key] = { ...baseLegacy, task_id: key, operation_key: key, correlation_id: key, conversation_key: url, url };
  }
  const before = structuredClone(f.bag);
  assert.equal((await f.make().runTurn(repeat({ tab_id: 9 }))).code, 'reservation_failed');
  assert.deepEqual(f.bag, before); assert.equal(f.sends.length, 1);
});
