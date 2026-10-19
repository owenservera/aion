// The three closed wedges, held together in one place:
//
//   A. SETTLEMENT ON EVERY EXIT. A lifecycle timeout used to throw out of the
//      exchange and leave the record in SUBMIT_RESERVED with no observer and
//      no outcome: a reservation nobody can observe and nobody can resolve,
//      with the conversation locked behind it.
//   B. RECONCILE. A terminal non-accepted settle, a submission that never
//      settled and a lost observer each held the lock with no way to ask what
//      was actually known. There is now a READ-ONLY path that says so, and it
//      never sends, never re-arms and never releases a lock on its own.
//   C. DURABLE EXPECTED REPLY TOKEN. The marker was caller-only, so a worker
//      that restarted could not settle a lock it was holding.
//
// Deterministic fakes only: no browser, no page, no network, no real timer
// waits beyond the small budgets this file asks for.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { CHATGPT_ACTION, CHATGPT_ERROR, createChatGPTPortDriver } from '../src/background/chatgpt-port.js';
import { COMMAND_POLICY, COMMAND_WORK, chatGPTCommandName, resolveCommandDeadline } from '../src/lib/command-deadlines.js';
import { DISPATCH_KEY, TASKS_KEY, createChatGPTTaskStore } from '../src/lib/chatgpt-tasks.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';
import { __testing as worker } from '../src/background/service-worker.js';

const TAB = { id: 7, url: 'https://chatgpt.com/c/one' };
const SAME_CONVERSATION_TAB = { id: 8, url: 'https://chatgpt.com/c/one' };
const OTHER_TAB = { id: 9, url: 'https://chatgpt.com/c/two' };
const HOME_TAB = { id: 10, url: 'https://chatgpt.com/' };
const PAGE_INSTANCE = 'page-instance-1';
const OBSERVER = 'observer-1';

const GATE = {
  user_gesture: true,
  approved_scope_ref: 'grant-1',
  text: 'task-one\nCompute 53 + 29 and return ACK-one',
  correlation_id: 'task-one',
  expected_reply_token: 'ACK-one',
  task_id: 'stable-task',
  operation_key: 'stable-operation',
  tab_id: 7
};

/** A receipt shaped like content.js's `receipt()` for one turn entry. */
function receipt({ action, identity, observation = {}, extra = {} }) {
  const terminal = observation.phase === 'REPLY_CHECKED';
  return {
    action,
    ok: terminal,
    ...identity,
    observation: {
      phase: 'OBSERVING',
      click_attempted: true,
      submission_observed: true,
      generation_started: true,
      generation_complete: false,
      continuity: true,
      method: 'mutation-observer+poll',
      remaining_ms: 4000,
      reason: null,
      ...observation
    },
    click_attempted: true,
    submission_observed: true,
    submitted: true,
    uncertain: !terminal,
    pending: !terminal,
    ...extra
  };
}

/** A terminal, contract-valid accepted receipt. */
function acceptedReceipt({ action, identity, correlationId, token, mutate }) {
  const base = acceptedAdapterReply({ correlationId, token });
  const value = receipt({
    action,
    identity,
    observation: { phase: 'REPLY_CHECKED', generation_complete: true, remaining_ms: 0, reason: 'accepted' },
    extra: { verdict: base.verdict, envelope: base.envelope }
  });
  mutate?.(value);
  return value;
}

/**
 * A scripted page plus one durable store.
 *
 * `page` decides what each action answers; `posted` is every message that
 * reached the page; `bag` is the persisted state a restarted worker reads.
 */
function world(page = {}, options = {}) {
  const bag = {};
  const writes = [];
  const posted = [];
  let armed = null;

  const identityFor = (message) => ({
    task_id: message.task_id ?? message.correlation_id,
    operation_key: message.operation_key ?? message.correlation_id,
    correlation_id: message.correlation_id,
    observer_id: OBSERVER,
    page_instance_id: PAGE_INSTANCE
  });
  const sameIdentity = (message) => armed !== null
    && ['task_id', 'operation_key', 'correlation_id', 'observer_id', 'page_instance_id']
      .every((field) => message[field] === armed[field]);

  const api = {
    storage: { local: {
      async get(key) {
        if (options.get) return options.get(key, bag);
        return Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {};
      },
      async set(value) {
        writes.push(structuredClone(value));
        if (options.set) await options.set(value, writes.length);
        Object.assign(bag, structuredClone(value));
      }
    } },
    tabs: {
      async query() { return [TAB, SAME_CONVERSATION_TAB, OTHER_TAB, HOME_TAB]; },
      connect() {
        const listeners = new Set();
        return {
          onMessage: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) },
          onDisconnect: { addListener() {}, removeListener() {} },
          disconnect() {},
          postMessage(message) {
            posted.push(structuredClone(message));
            let reply;
            if (message.action === CHATGPT_ACTION.PING) {
              reply = { action: message.action, ok: true, href: 'https://chatgpt.com/c/one',
                state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, sendControlCount: 1 } };
            } else if (message.action === CHATGPT_ACTION.SUBMIT_TURN) {
              if (page.silentSubmit) return;
              const identity = identityFor(message);
              armed = identity;
              reply = (page.submit ?? ((_message, id) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity: id })))(message, identity);
            } else if (message.action === CHATGPT_ACTION.RUN_TURN) {
              if (page.silentRun) return;
              reply = (page.run ?? ((_message) => receipt({ action: CHATGPT_ACTION.RUN_TURN, identity: identityFor({ correlation_id: message.correlation_id }) })))(message);
            } else if (message.action === CHATGPT_ACTION.OBSERVE_TURN) {
              if (page.silentObserve) return;
              if (page.observeRefusal) {
                reply = { action: message.action, ok: false, reason: page.observeRefusal, read_only: true, uncertain: true };
              } else if (!sameIdentity(message) || page.observeMismatch) {
                reply = { action: message.action, ok: false, reason: 'observer_identity_mismatch', read_only: true, uncertain: true };
              } else {
                reply = (page.observe ?? ((_message, id) => receipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity: id })))(message, armed);
              }
            }
            if (reply === undefined) return;
            queueMicrotask(() => { for (const fn of [...listeners]) fn(reply); });
          }
        };
      }
    }
  };

  const make = () => createChatGPTPortDriver({
    chrome: api,
    // Small but real budgets: nothing here waits on a production-sized timer.
    timeouts: { ping: 500, state: 500, read: 500, run: 40, stop: 500, submit: 40, observe: 500 },
    graceMs: 50,
    digest: async (bytes) => createHash('sha256').update(bytes).digest()
  });

  return {
    api, bag, writes, posted, make, driver: make(),
    store: createChatGPTTaskStore({ chrome: api }),
    task: (key = GATE.operation_key) => bag[TASKS_KEY].operations[key],
    sends: () => posted.filter((m) => m.action === CHATGPT_ACTION.SUBMIT_TURN || m.action === CHATGPT_ACTION.RUN_TURN),
    polls: () => posted.filter((m) => m.action === CHATGPT_ACTION.OBSERVE_TURN),
    writesKeys: () => writes.map((value) => Object.keys(value)[0])
  };
}

/* ========================================================================== *
 * A. Settlement on every exit
 * ========================================================================== */

test('A: a lifecycle timeout in the exchange settles the record instead of stranding it', async () => {
  const f = world({ silentSubmit: true });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal(result.submitted, true, 'the activation may have happened');
  assert.equal(result.uncertain, true);
  assert.equal(result.captured, false);

  // THE WEDGE. The record is not left in SUBMIT_RESERVED with no observer: it
  // is settled to the one outcome an error can honestly carry.
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'an uncertain send keeps the lock');
  assert.equal(f.task().facts.consumed, false);
  assert.equal(result.phase, 'NEEDS_RECONCILIATION', 'the caller is told what was recorded');
  assert.equal(result.lock_active, true);
  assert.equal(result.settlement, 'recorded');

  // ... and it stays ADDRESSABLE by correlation, task and operation.
  assert.equal(f.task().correlation_id, GATE.correlation_id);
  assert.equal(f.task().task_id, GATE.task_id);
  assert.equal(f.task().operation_key, GATE.operation_key);
  assert.equal(result.correlation_id, GATE.correlation_id);
  assert.equal(result.task_id, GATE.task_id);
  assert.equal(result.operation_key, GATE.operation_key);

  // ... and it is never re-sent, by the same correlation or a fresh one.
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'fresh-marker' })).code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  // Another tab on the SAME conversation is not a different conversation: the
  // lock is what stops it, and the lock is still held.
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'fresh-marker', task_id: 'task-two',
    operation_key: 'operation-two', tab_id: 8 })).code, 'conversation_locked');
  assert.equal(f.sends().length, 1, 'the page was activated exactly once');
});

test('A: the legacy run path settles its timeout the same way', async () => {
  const f = world({ silentRun: true });
  const result = await f.driver.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
  assert.equal((await f.make().runTurn({ ...GATE, correlation_id: 'fresh', task_id: 'task-two',
    operation_key: 'operation-two', tab_id: 8 })).code, 'conversation_locked');
  assert.equal(f.sends().length, 1);
});

test('A: a dropped port settles the record as uncertain too', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  f.api.tabs.connect = () => { throw new Error('Could not establish connection. Receiving end does not exist.'); };
  const polled = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(polled.ok, false);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
});

test('A: only a positive no-send releases the lock; a refusal does not', async () => {
  const proven = world({
    submit: (message) => ({ action: message.action, ok: false, reason: 'pre_activation_refused',
      submitted: false, no_send: true, uncertain: false, pending: false })
  });
  const refused = await proven.driver.submitTurn(GATE);
  assert.equal(refused.ok, false);
  assert.equal(refused.submitted, false);
  assert.equal(proven.task().phase, 'REFUSED_NO_SUBMIT');
  assert.equal(proven.task().lock_active, false);

  const uncertain = world({
    submit: (message, identity) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      observation: { phase: 'NEEDS_RECONCILIATION', generation_started: false, generation_complete: false, reason: 'generation_never_started' },
      extra: { ok: false, reason: 'generation_never_started', pending: false, uncertain: true } })
  });
  const held = await uncertain.driver.submitTurn(GATE);
  assert.equal(held.ok, false);
  assert.equal(uncertain.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(uncertain.task().lock_active, true, 'a refusal is not a release');
});

/* ========================================================================== *
 * B. Reconcile
 * ========================================================================== */

/** A terminal, non-accepted receipt: the page settled and did not accept. */
function terminalRefusal(message, identity) {
  return receipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
    observation: { phase: 'REJECTED', generation_complete: true, reason: 'generation_timeout' },
    extra: { ok: false, reason: 'generation_timeout', pending: false, uncertain: true } });
}

test('B: a reconcile that cannot WRITE the release says so, and claims no release', async () => {
  // The page proves a no-send, but the write that would record the release
  // is refused. The reconcile must then report the state that really is:
  // not recorded, not resolved, and the ACTUAL durable phase and lock. It
  // must never report a released lock it did not release.
  const f = world({
    observe: (message, identity) => ({ ...identity, action: CHATGPT_ACTION.OBSERVE_TURN, ok: false,
      reason: 'pre_activation_refused', submitted: false, no_send: true, pending: false, uncertain: false })
  }, {
    set: async (value) => {
      const tasks = value[TASKS_KEY];
      if (tasks && Object.values(tasks.operations).some((task) => task.phase === 'REFUSED_NO_SUBMIT')) {
        throw new Error('write failed');
      }
    }
  });
  await f.driver.submitTurn(GATE);
  assert.equal(f.task().lock_active, true, 'the operation is still open before the reconcile');

  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false, 'a release that was not written is not a reconciled operation');
  assert.equal(result.settled, false);
  assert.equal(result.resolved, false);
  assert.equal(result.settlement, 'not_recorded');
  assert.equal(result.reason, 'no_submit_proven', 'the page\'s own reason is still carried');
  // THE DURABLE FACTS, as they really are.
  assert.equal(result.phase, 'NEEDS_RECONCILIATION');
  assert.equal(result.lock_active, true);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'the lock was never released');

  // AND THE CONVERSATION IS STILL LOCKED, because the lock really is held.
  const next = await f.make().submitTurn({ ...GATE, correlation_id: 'task-two', task_id: 'task-two',
    operation_key: 'operation-two' });
  assert.equal(next.code, 'conversation_locked');
  assert.equal(f.sends().length, 1, 'a reconcile never sends');
});

test('B: the reconcile posts no send-capable action and produces no second dispatch', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  const sendsBefore = f.sends().length;
  const postedBefore = f.posted.length;
  const pollsBefore = f.polls().length;
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(f.sends().length, sendsBefore, 'a reconcile never sends');
  for (const message of f.posted.slice(postedBefore)) {
    assert.notEqual(message.action, CHATGPT_ACTION.RUN_TURN);
    assert.notEqual(message.action, CHATGPT_ACTION.SUBMIT_TURN);
  }
  assert.equal(f.polls().length, pollsBefore + 1, 'the reconcile asks the page ONE read-only question');
  for (const message of f.polls().slice(pollsBefore)) {
    assert.equal('text' in message, false, 'a reconcile never composes');
    assert.equal('user_gesture' in message, false, 'and it has no send authority at all');
    assert.equal('timeout_ms' in message, false, 'and it never offers the page a new deadline');
  }
  assert.equal(result.read_only, true);
  assert.equal(result.action, 'reconcile-turn');
});

test('B: the reconcile cannot clear an armed observer', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  const before = f.task().observer;
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  const after = f.task().observer;
  assert.equal(after.observer_id, OBSERVER);
  assert.equal(after.page_instance_id, PAGE_INSTANCE);
  assert.equal(after.armed_at, before.armed_at, 'the observer identity is immutable');
  assert.equal(result.observer.observer_id, OBSERVER);
});

test('B: a terminal refusal keeps the lock unless there is positive evidence', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false, 'a refusal is not a reconciled operation');
  assert.equal(result.reason, 'terminal_refusal');
  assert.equal(result.lock_active, true);
  assert.equal(result.resolved, false);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'a terminal refusal keeps the lock');
  assert.equal(f.task().facts.reply_checked, false);
});

test('B: a positive no-send from the page is the one refusal that releases the lock', async () => {
  const f = world({
    observe: (message, identity) => ({ ...identity, action: CHATGPT_ACTION.OBSERVE_TURN, ok: false,
      reason: 'pre_activation_refused', submitted: false, no_send: true, pending: false, uncertain: false })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'no_submit_proven');
  assert.equal(result.lock_active, false);
  assert.equal(result.submitted, false);
  assert.equal(f.task().phase, 'REFUSED_NO_SUBMIT');
  assert.equal(f.task().lock_active, false);
});

test('B: a fully validated accepted reply releases the lock and returns the checked reply', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.reason, 'reply_checked');
  assert.equal(result.captured, true);
  assert.equal(result.lock_active, false);
  assert.equal(result.envelope.payload.expected_reply, GATE.expected_reply_token);
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.task().facts.consumed, false);
});

test('B: a release that LANDED but lost its acknowledgement is reported as resolved', async () => {
  // THE WRITE LANDED; THE ACKNOWLEDGEMENT DID NOT. The durable record says
  // the operation is resolved, so the reply says so too: reporting
  // `not_recorded`/`resolved:false` beside a resolved record is how a
  // finished operation keeps its conversation locked.
  const f = world({
    observe: (message, identity) => ({ ...identity, action: CHATGPT_ACTION.OBSERVE_TURN, ok: false,
      reason: 'pre_activation_refused', submitted: false, no_send: true, pending: false, uncertain: false })
  }, {
    set: async (value) => {
      const tasks = value[TASKS_KEY];
      const record = tasks && tasks.operations[GATE.operation_key];
      if (record && record.phase === 'REFUSED_NO_SUBMIT') {
        f.bag[TASKS_KEY] = structuredClone(tasks);
        throw new Error('acknowledgement lost');
      }
    }
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.settlement, 'recorded_unacked', JSON.stringify(result));
  assert.equal(result.resolved, true, 'the durable record IS resolved');
  assert.equal(result.phase, 'REFUSED_NO_SUBMIT');
  assert.equal(result.lock_active, false);
  assert.equal(result.ok, true);
  assert.equal(result.settled, false, 'the acknowledgement really was lost');
  // AND THE DURABLE RECORD REALLY IS RESOLVED.
  assert.equal(f.task().phase, 'REFUSED_NO_SUBMIT');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.sends().length, 1, 'a reconcile never sends');
});

test('B: a checked reply that LANDED but lost its acknowledgement is reported as resolved', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  }, {
    set: async (value) => {
      const tasks = value[TASKS_KEY];
      const record = tasks && tasks.operations[GATE.operation_key];
      if (record && record.phase === 'REPLY_CHECKED') {
        f.bag[TASKS_KEY] = structuredClone(tasks);
        throw new Error('acknowledgement lost');
      }
    }
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.settlement, 'recorded_unacked', JSON.stringify(result));
  assert.equal(result.resolved, true, 'the durable record IS resolved');
  assert.equal(result.phase, 'REPLY_CHECKED');
  assert.equal(result.lock_active, false);
  assert.equal(result.captured, true, 'the page fact is still the page fact');
  assert.equal(result.ok, true);
  assert.equal(result.settled, false, 'the acknowledgement really was lost');
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.sends().length, 1, 'a reconcile never sends');
});

test('B: a refusal whose settlement landed but lost its acknowledgement still resolves nothing', async () => {
  // A REFUSAL RESOLVES NOTHING, so `ok`, `settled` and `resolved` stay false
  // whatever the write did. What the write did is classified: the durable
  // state is the intended one (held in NEEDS_RECONCILIATION with the lock on),
  // so it is reported as `recorded_unacked` and the lock is reported as held.
  let reconciling = false;
  let completions = 0;
  const f = world({ observe: terminalRefusal }, {
    set: async (value) => {
      const dispatch = value[DISPATCH_KEY];
      if (reconciling && dispatch && dispatch.reservations[GATE.correlation_id].state === 'COMPLETED') {
        completions += 1;
      }
      const tasks = value[TASKS_KEY];
      const record = tasks && tasks.operations[GATE.operation_key];
      // The reconcile's SETTLEMENT write is the one that follows its own
      // legacy completion write; the observer-arm write before it is not one.
      if (reconciling && completions >= 1 && record && record.phase === 'NEEDS_RECONCILIATION') {
        f.bag[TASKS_KEY] = structuredClone(tasks);
        throw new Error('acknowledgement lost');
      }
    }
  });
  await f.driver.submitTurn(GATE);
  reconciling = true;
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false, 'a refusal is not a reconciled operation');
  assert.equal(result.settled, false);
  assert.equal(result.resolved, false);
  assert.equal(result.settlement, 'recorded_unacked', JSON.stringify(result));
  assert.equal(result.phase, 'NEEDS_RECONCILIATION');
  assert.equal(result.lock_active, true, 'the lock really is still held');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.sends().length, 1, 'a reconcile never sends');
});

test('B: a lost observer is reported honestly and the lock is kept', async () => {
  for (const reason of ['observer_evidence_required', 'observer_identity_mismatch']) {
    const f = world({ observeRefusal: reason });
    await f.driver.submitTurn(GATE);
    const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
    assert.equal(result.ok, false, reason);
    assert.equal(result.reason, reason, 'the page\'s own reason is carried verbatim');
    assert.equal(result.lock_active, true, reason);
    assert.equal(f.task().lock_active, true, reason);
    assert.equal(f.task().observer.observer_id, OBSERVER, 'the armed observer is not cleared');
  }
});

test('B: an operation that was never armed is reported, not guessed at', async () => {
  const f = world();
  await f.driver.runTurn(GATE);           // the legacy path never arms an observer
  const before = f.posted.length;
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'observer_not_armed');
  assert.equal(result.observer, null);
  assert.equal(result.lock_active, true);
  assert.equal(f.posted.length, before, 'no page is asked about an operation it cannot identify');
});

test('B: a submission that never settled is reported as pending, with the lock held', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'observation_pending');
  assert.equal(result.pending, true);
  assert.equal(result.lock_active, true);
  assert.equal(f.task().lock_active, true);
});

test('B: the reconcile is keyed by correlation or task and refuses a foreign tab', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  const byTask = await f.driver.reconcileTurn({ task_id: GATE.task_id });
  assert.equal(byTask.correlation_id, GATE.correlation_id);
  assert.equal(byTask.task_id, GATE.task_id);
  assert.equal(byTask.operation_key, GATE.operation_key);

  const foreign = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id, tab_id: 9 });
  assert.equal(foreign.ok, false);
  assert.equal(foreign.code, CHATGPT_ERROR.NOT_A_CHATGPT_TAB);

  const unnamed = await f.driver.reconcileTurn({});
  assert.equal(unnamed.ok, false);
  assert.equal(unnamed.code, CHATGPT_ERROR.CORRELATION_REQUIRED);

  // Two selectors that disagree are refused, not silently resolved.
  const disagreeing = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id, task_id: 'some-other-task' });
  assert.equal(disagreeing.ok, false);
  assert.equal(disagreeing.code, CHATGPT_ERROR.BAD_ARGUMENT);

  const missing = await f.driver.reconcileTurn({ correlation_id: 'never-reserved' });
  assert.equal(missing.ok, false);
  assert.equal(missing.code, CHATGPT_ERROR.OPERATION_NOT_RESERVED);
  assert.equal(missing.read_only, true);
  // A READ-ONLY FAILURE CLAIMS NOTHING ABOUT THE OPERATION. The operation may
  // have been submitted earlier, so `submitted:false` would be a no-send
  // statement this read is not entitled to make: the field is ABSENT.
  assert.equal('submitted' in missing, false, JSON.stringify(missing));

  // The same holds for the task-keyed lookup.
  const unknownTask = await f.driver.reconcileTurn({ task_id: 'never-reserved-task' });
  assert.equal(unknownTask.ok, false);
  assert.equal(unknownTask.code, CHATGPT_ERROR.OPERATION_NOT_RESERVED);
  assert.equal(unknownTask.read_only, true);
  assert.equal('submitted' in unknownTask, false, JSON.stringify(unknownTask));
});

test('B: the reconcile reports the conservative home lock honestly and never weakens it', async () => {
  // A probe that maps to the HOME key shares one conservative lock with every
  // unknown destination, so an unresolved home operation blocks EVERY
  // conversation. That lock is a no-resend guarantee and it is NOT weakened
  // here; what the reconcile adds is the honest report of what is known.
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn({ ...GATE, tab_id: 10 });
  assert.equal(f.task().conversation_key, 'https://chatgpt.com/');

  // Every other conversation is blocked by that one unresolved operation.
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'other', task_id: 'task-two',
    operation_key: 'operation-two', tab_id: 9 })).code, 'conversation_locked');

  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.conversation_key, 'https://chatgpt.com/');
  assert.equal(result.lock_active, true, 'the conservative lock is still held');
  assert.equal(result.reason, 'terminal_refusal');
  assert.equal(f.task().lock_active, true, 'a reconcile alone never releases a lock');
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'other', task_id: 'task-two',
    operation_key: 'operation-two', tab_id: 9 })).code, 'conversation_locked');
});

test('B: an operation that is already resolved is reported as resolved and never asked again', async () => {
  const f = world({
    submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  const before = f.posted.length;
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'operation_already_resolved');
  assert.equal(result.resolved, true);
  assert.equal(result.lock_active, false);
  assert.equal(f.posted.length, before, 'a resolved operation is not asked about again');
});

test('B: the reconcile presents the DURABLE identity, never one the caller names', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id, operation_key: 'foreign-operation',
    observer_id: 'foreign-observer', page_instance_id: 'foreign-page' });
  const poll = f.polls().at(-1);
  assert.equal(poll.task_id, GATE.task_id);
  assert.equal(poll.operation_key, GATE.operation_key);
  assert.equal(poll.observer_id, OBSERVER);
  assert.equal(poll.page_instance_id, PAGE_INSTANCE);
});

test('B: the reconcile budget is finite, validated and the panel outlasts the worker', () => {
  const plan = resolveCommandDeadline({ command: 'reconcile-turn' });
  assert.equal(plan.workMs, COMMAND_WORK['reconcile-turn']);
  assert.ok(Number.isSafeInteger(plan.absoluteMs) && plan.absoluteMs > 0);
  assert.equal(plan.absoluteMs, Object.values(plan.stages).reduce((a, b) => a + b, 0));
  assert.equal(plan.panelMs, plan.absoluteMs + COMMAND_POLICY.responseMargin);
  assert.ok(plan.panelMs > plan.absoluteMs, 'panel > worker, always');
  assert.equal(plan.inactivity, null);
  for (const stage of ['reservationRead', 'observerArm', 'settlement', 'exchange']) {
    assert.ok(Number.isSafeInteger(plan.stages[stage]) && plan.stages[stage] > 0, stage);
  }
  for (const stage of ['preflight', 'reservationWrite']) {
    assert.equal(plan.stages[stage], undefined, `reconcile-turn must never wait on ${stage}`);
  }
  assert.equal(chatGPTCommandName('aion/chatgpt-reconcile'), 'reconcile-turn');
  assert.throws(() => resolveCommandDeadline({ command: 'reconcile-turn', requestedWorkMs: 0 }));
});

test('B: the worker endpoint is extension-only, needs no gesture and never sends', async () => {
  const f = world({ observe: terminalRefusal });
  const previous = globalThis.chrome;
  globalThis.chrome = f.api;
  worker.reset();
  try {
    await worker.runChatGPTCommand(
      { type: 'aion/chatgpt-submit', tabId: 7, command: { ...GATE } },
      { hydrate: () => worker.rehydrate() });
    const sendsBefore = f.sends().length;

    const result = await worker.runChatGPTCommand(
      { type: 'aion/chatgpt-reconcile', tabId: 7, correlation_id: GATE.correlation_id, text: 'compose me', user_gesture: true },
      { hydrate: () => worker.rehydrate() });
    assert.equal(result.ok, false, 'a terminal refusal is not a reconciled operation');
    assert.equal(result.reason, 'terminal_refusal');
    assert.equal(result.read_only, true);
    assert.equal(f.sends().length, sendsBefore, 'the endpoint never sends');
    const poll = f.polls().at(-1);
    assert.equal('text' in poll, false, 'a smuggled text never reaches the page');
    assert.equal('user_gesture' in poll, false);
  } finally {
    worker.reset();
    if (previous === undefined) delete globalThis.chrome; else globalThis.chrome = previous;
  }
});

/* ========================================================================== *
 * C. Durable expected reply token
 * ========================================================================== */

test('C: the expected reply token is stored in the durable task record before the send', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  assert.equal(f.task().expected_reply_token, GATE.expected_reply_token);

  // NOT in the legacy dispatch record: that record is the no-resend tombstone
  // and it must stay exactly what it was.
  assert.equal(f.bag[DISPATCH_KEY].reservations[GATE.correlation_id].expected_reply_token, undefined);

  // NOT in a machine view of the store.
  const listed = await f.store.listTasks();
  assert.equal(listed[0].expected_reply_token, undefined);
  assert.equal((await f.store.getTask(GATE.task_id)).expected_reply_token, undefined);
  assert.equal((await f.store.getTask('not-present')), null);
});

test('C: the stored token is validated, bounded and dropped when the operation resolves', async () => {
  const f = world();
  const refused = await f.driver.submitTurn({ ...GATE, expected_reply_token: 'x'.repeat(129) });
  assert.equal(refused.ok, false);
  assert.equal(refused.code, CHATGPT_ERROR.BAD_ARGUMENT);
  assert.equal(f.sends().length, 0, 'an invalid marker never reaches a page');
  assert.equal(f.writes.length, 0, 'and nothing is reserved');

  const g = world({
    submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  await g.driver.submitTurn(GATE);
  assert.equal(g.task().phase, 'REPLY_CHECKED');
  assert.equal(g.task().expected_reply_token, null, 'the marker is retained only while the outcome is open');
});

test('C: acceptance is reachable from the durable record after a restart', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  assert.equal(f.task().lock_active, true);

  // A FRESH driver over the SAME persisted state: the worker restarted and
  // lost every JS value, including the caller's marker.
  const restarted = f.make();
  const result = await restarted.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.captured, true);
  assert.equal(f.task().phase, 'REPLY_CHECKED', 'a terminal outcome, not a hang');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.sends().length, 1, 'and nothing was sent again');
});

test('C: a stored marker that contradicts the caller\'s is refused honestly, with the lock held', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  const before = f.polls().length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id, expected_reply_token: 'OTHER-MARKER' });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TOKEN_MISMATCH);
  assert.equal(result.reason, 'expected_reply_token_mismatch');
  assert.equal(result.captured, false);
  assert.equal(f.polls().length, before, 'the wrong marker is not put to the page');
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'a refused read never releases the lock');
  assert.ok(!JSON.stringify(result).includes('OTHER-MARKER'), 'the marker itself is never echoed');
});

test('C: the reconcile refuses a contradictory marker the same way', async () => {
  const f = world({ observe: terminalRefusal });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.reconcileTurn({ correlation_id: GATE.correlation_id, expected_reply_token: 'OTHER-MARKER' });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TOKEN_MISMATCH);
  assert.equal(f.task().lock_active, true);
});
