// Worker-side submit/observe split engine (chatgpt-port.js, command-deadlines.js,
// chatgpt-tasks.js and the service-worker routing).
//
// Deterministic fakes only: no browser, no page, no real timer waits. The fake
// page is a SCRIPTED stand-in that answers the shapes content.js's
// `createTurnEngine` produces, and it checks the identity it is asked with, so a
// poll that presents the wrong observer is refused by the page exactly as the
// real one is.
//
// What is held here:
//   1. submit-turn reserves durably and records the page's observer identity
//      BEFORE it judges, settles or reports an outcome
//   2. observe-turn is read-only, repeatable, identity-exact and dead once the
//      operation resolves; it never fills, clicks or extends the page deadline
//   3. the identity the submit receipt carried is what later polls/reads present
//   4. only a positive no-submit or a contract-valid accepted reply releases the
//      conversation lock; everything else keeps it, and nothing is CONSUMED
//   5. every budget is finite, validated, ordered, and panel > worker
//   6. legacy runTurn is unchanged: same action, same writes, same outcomes
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { CHATGPT_ACTION, CHATGPT_ERROR, MAX_ANNOTATION_CHARS, createChatGPTPortDriver } from '../src/background/chatgpt-port.js';
import { COMMAND_POLICY, COMMAND_WORK, chatGPTCommandName, resolveCommandDeadline } from '../src/lib/command-deadlines.js';
import { DISPATCH_KEY, TASKS_KEY } from '../src/lib/chatgpt-tasks.js';
import { createEnvelope } from '../src/lib/envelope.js';
import { REASON, VERDICT_SCHEMA, correlateReply } from '../src/chatgpt/correlate.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';
import { __testing as worker } from '../src/background/service-worker.js';

/* --------------------------------------------------------------- the world */

const TAB = { id: 7, url: 'https://chatgpt.com/c/one?private=discard#fragment' };
const OTHER_TAB = { id: 9, url: 'https://chatgpt.com/c/two' };
const PAGE_INSTANCE = 'page-instance-1';
const OBSERVER = 'observer-1';

/** Raised by the durable store when another operation holds this conversation. */
const CONVERSATION_LOCKED = 'conversation_locked';

const GATE = {
  user_gesture: true,
  approved_scope_ref: 'grant-1',
  text: 'task-one\nCompute 53 + 29 and return ACK-one',
  correlation_id: 'task-one',
  expected_reply_token: 'ACK-one',
  task_id: 'stable-task',
  operation_key: 'stable-operation',
  tab_id: 7,
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

/** A terminal, contract-valid accepted receipt, optionally made contradictory. */
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
 * A terminal REJECTED receipt: the real correlator's non-accepting verdict
 * inside a schema-valid `proof.rejected` / `REJECTED` envelope, exactly as
 * content.js's `finish()` builds one when the turn did not produce an answer.
 *
 * `ok` stays TRUE here on purpose: generation completed, so the page answered
 * `ok: !terminal || complete`, and only the verdict says the answer was not
 * acceptable. That is the shape that must be read as an OUTCOME.
 */
function rejectedReceipt({ action, identity, correlationId, token, mutate }) {
  const verdict = correlateReply({
    reply: `${correlationId}\nan answer that never carries the expected token`,
    expected: { correlation_id: correlationId, reply_token: token },
    outbound_text: 'synthetic outbound', role: 'assistant', channel: 'final',
    source: 'dom-assistant-turn', generation_started: true, generation_complete: true, model: null
  });
  if (verdict.accepted || verdict.reason !== REASON.REPLY_TOKEN_MISMATCH) {
    throw new Error(`invalid rejecting fixture: ${verdict.reason}`);
  }
  const timestamp = new Date().toISOString();
  const payload = {
    schema: verdict.schema, correlation_id: correlationId, accepted: verdict.accepted,
    reason: verdict.reason, detail: verdict.detail, reply_text: null,
    expected_reply: verdict.expected_reply, model: null,
    generation: { started: true, complete: true, reason: verdict.reason, elapsed_ms: 1 },
    extraction: { ok: false, reason: REASON.NO_FINAL_BLOCK, detail: null },
    observed: verdict.observed, source_url: 'https://chatgpt.com/c/one',
    started_at: timestamp, captured_at: timestamp
  };
  const envelope = createEnvelope({
    producer_node: 'node-ext-chatgpt', target_node: 'node-native-01', target_role: null,
    event_type: 'proof.rejected', correlation_id: correlationId, causation_id: null,
    idempotency_key: `chatgpt:${correlationId}`, expires_at: null, approved_scope_ref: null,
    payload_ref: null, payload_hash: null, delivery_state: 'OUTBOX', task_state: 'REJECTED', payload
  });
  const value = receipt({
    action,
    identity,
    observation: { phase: 'REPLY_REJECTED', generation_complete: true, remaining_ms: 0, reason: verdict.reason },
    extra: { ok: true, pending: false, uncertain: true, verdict, envelope }
  });
  mutate?.(value);
  return value;
}

/**
 * A scripted page plus one durable store.
 *
 * `page` decides what each action answers; `writes` is the ordered log every
 * ordering assertion is read from; `posted` is every message that reached the
 * page.
 */
function world(page = {}, options = {}) {
  const bag = {};
  const writes = [];
  const posted = [];
  let armed = null;           // the identity the page believes it armed
  let observeCalls = 0;

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
      async query() { return [TAB, OTHER_TAB]; },
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
              reply = (page.run ?? ((_message) => receipt({ action: CHATGPT_ACTION.RUN_TURN, identity: identityFor({ correlation_id: message.correlation_id }) })))(message);
            } else if (message.action === CHATGPT_ACTION.OBSERVE_TURN) {
              if (page.silentObserve) return;
              observeCalls += 1;
              // The real page refuses any identity that is not its own entry.
              reply = (!sameIdentity(message) || page.observeMismatch)
                ? { action: message.action, ok: false, reason: 'observer_identity_mismatch', read_only: true, uncertain: true }
                : (page.observe ?? ((_message, id) => receipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity: id })))(message, armed, observeCalls);
            } else if (message.action === CHATGPT_ACTION.READ_FINAL) {
              if (page.silentRead) return;
              if (page.read) reply = page.read(message, armed, sameIdentity(message));
              else if (page.readRefusal) {
                reply = { action: message.action, ok: false, reason: page.readRefusal, read_only: true, uncertain: true,
                  verdict: { schema: 'aion.chatgpt-verdict/0.1', accepted: false, reason: 'no_final_block' },
                  generation: { started: false, complete: false, asserted_by_caller: false } };
              } else reply = receipt({ action: message.action, identity: identityFor(message) });
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
    // Small but real budgets: nothing here waits on a production-sized timer
    // and every command still goes through resolveCommandDeadline.
    timeouts: { ping: 2000, state: 2000, read: 2000, run: 2000, stop: 2000, submit: 2000, observe: 2000 },
    graceMs: 50,
    digest: async (bytes) => createHash('sha256').update(bytes).digest()
  });

  return {
    api, bag, writes, posted, make, driver: make(),
    task: (key = GATE.operation_key) => bag[TASKS_KEY].operations[key],
    sends: () => posted.filter((m) => m.action === CHATGPT_ACTION.SUBMIT_TURN || m.action === CHATGPT_ACTION.RUN_TURN),
    polls: () => posted.filter((m) => m.action === CHATGPT_ACTION.OBSERVE_TURN),
    reads: () => posted.filter((m) => m.action === CHATGPT_ACTION.READ_FINAL),
    writeKeys: () => writes.map((value) => Object.keys(value)[0])
  };
}

const repeat = (extra = {}) => ({
  ...GATE, task_id: 'task-two', operation_key: 'operation-two', correlation_id: 'task-two', tab_id: 9, ...extra
});

/* ------------------------------------------------- identity round trip */

test('the identity the submit receipt carried is what observe and read present', async () => {
  const f = world();
  const submitted = await f.driver.submitTurn(GATE);
  assert.equal(submitted.ok, false);
  assert.equal(submitted.code, CHATGPT_ERROR.SUBMIT_PENDING);
  assert.equal(submitted.observer.page_instance_id, PAGE_INSTANCE);
  assert.equal(submitted.observer.observer_id, OBSERVER);
  assert.equal(submitted.observer.submission_observed, true);
  assert.equal(submitted.observer.phase, 'OBSERVING');

  await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.deepEqual(f.polls().at(-1), {
    action: CHATGPT_ACTION.OBSERVE_TURN,
    task_id: 'stable-task',
    operation_key: 'stable-operation',
    correlation_id: 'task-one',
    observer_id: OBSERVER,
    page_instance_id: PAGE_INSTANCE
  }, 'the poll carries the durable identity and nothing else');

  await f.driver.readFinal({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
  const read = f.reads().at(-1);
  const poll = f.polls().at(-1);
  for (const field of ['task_id', 'operation_key', 'correlation_id', 'observer_id', 'page_instance_id']) {
    assert.equal(read[field], poll[field], `${field} round-trips from the submit receipt`);
  }
});

test('a caller cannot redirect a poll by naming another identity', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  const result = await f.driver.observeTurn({
    correlation_id: GATE.correlation_id,
    task_id: 'foreign-task', operation_key: 'foreign-operation',
    observer_id: 'foreign-observer', page_instance_id: 'foreign-page',
    text: 'compose this', user_gesture: true
  });
  assert.equal(result.ok, false);
  const poll = f.polls().at(-1);
  assert.equal(poll.task_id, 'stable-task');
  assert.equal(poll.operation_key, 'stable-operation');
  assert.equal(poll.observer_id, OBSERVER);
  assert.equal(poll.page_instance_id, PAGE_INSTANCE);
  assert.equal('text' in poll, false, 'a poll can never compose');
  assert.equal('user_gesture' in poll, false);
  assert.equal('timeout_ms' in poll, false, 'a poll must not offer the page a new deadline');
});

test('a poll aimed at another tab is refused, not redirected', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  const before = f.posted.length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id, tab_id: 9 });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.NOT_A_CHATGPT_TAB);
  assert.equal(f.posted.length, before, 'no page was contacted at all');
});

/* ------------------------------- observer identity persisted before use */

test('submit-turn records the observer identity before it judges or settles anything', async () => {
  const f = world();
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.code, CHATGPT_ERROR.SUBMIT_PENDING);
  assert.deepEqual(f.writeKeys(), [DISPATCH_KEY, TASKS_KEY, TASKS_KEY, DISPATCH_KEY, TASKS_KEY],
    'reserve (legacy, rich), ARM, then settle (legacy, rich)');
  const armIndex = f.writes.findIndex((value) => Object.hasOwn(value, TASKS_KEY)
    && value[TASKS_KEY].operations[GATE.operation_key].observer !== null);
  const settleIndex = f.writes.findIndex((value) => Object.hasOwn(value, DISPATCH_KEY)
    && value[DISPATCH_KEY].reservations[GATE.correlation_id].state === 'COMPLETED');
  assert.ok(armIndex >= 0, 'the observer identity was written');
  assert.ok(settleIndex > armIndex, `settlement (${settleIndex}) must follow the arm record (${armIndex})`);

  const observer = f.task().observer;
  assert.equal(observer.page_instance_id, PAGE_INSTANCE);
  assert.equal(observer.observer_id, OBSERVER);
  assert.equal(observer.click_attempted, true);
  assert.equal(observer.submission_observed, true);
  assert.equal(observer.terminal, false);
  assert.equal(observer.phase, 'OBSERVING');
  assert.ok(Number.isFinite(Date.parse(observer.armed_at)));
  assert.ok(Number.isFinite(Date.parse(observer.recorded_at)));
  assert.ok(!JSON.stringify(f.bag).includes(GATE.text), 'no outbound text is ever persisted');
});

test('observed evidence stays durable when the outcome cannot be recorded', async () => {
  // Write 7 is the observe poll's legacy settlement write.
  const f = world({
    observe: (message, identity) => receipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      observation: { phase: 'REJECTED', generation_complete: true, reason: 'generation_timeout' },
      extra: { ok: false, reason: 'generation_timeout', uncertain: true, pending: false } })
  }, { set: async (_value, count) => { if (count === 7) throw new Error('settlement failed'); } });

  await f.driver.submitTurn(GATE);
  const observed = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(observed.ok, false);
  assert.equal(observed.code, CHATGPT_ERROR.RESERVATION_FAILED, 'a settlement that cannot be written fails closed');
  assert.equal(f.task().observer.observer_id, OBSERVER, 'WHO observed is durable even though the outcome is not');
  assert.equal(f.task().observer.terminal, true);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
});

test('page-supplied annotations cannot deny the durable observer write', async () => {
  // The cut can land ON whitespace: 63 characters, a space, then more. Clipping
  // without re-trimming produces a value the store rightly rejects, and a refused
  // write is how the observer identity and the conversation lock are both lost.
  const huge = `${'x'.repeat(MAX_ANNOTATION_CHARS - 1)} ${'y'.repeat(2048)}`;
  const f = world({
    submit: (message, identity) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      observation: { phase: `  ${huge}  `, method: `\t${huge}\n`, reason: ` ${huge} ` } })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.code, CHATGPT_ERROR.SUBMIT_PENDING, 'the write is not refused over page text');
  const observer = f.task().observer;
  // NO IDENTITY LOSS. The observer record exists so a later poll can prove it is
  // asking the same page about the same turn; losing it would wedge the lock.
  assert.equal(observer.page_instance_id, PAGE_INSTANCE);
  assert.equal(observer.observer_id, OBSERVER);
  for (const field of ['phase', 'method', 'reason']) {
    assert.ok(observer[field].length > 0, field);
    assert.ok(observer[field].length <= MAX_ANNOTATION_CHARS, `${field} is bounded, got ${observer[field].length}`);
    assert.equal(observer[field], observer[field].trim(), `${field} is trimmed`);
  }
  assert.equal(result.observer.phase, observer.phase, 'the caller sees what was stored');
  // And the identity still round-trips: a later poll presents it and reaches the page.
  await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(f.polls().at(-1).observer_id, OBSERVER);

  const blank = world({
    submit: (message, identity) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      observation: { phase: '   \t ', method: '', reason: '   ' } })
  });
  const nothing = await blank.driver.submitTurn(GATE);
  assert.equal(nothing.code, CHATGPT_ERROR.SUBMIT_PENDING);
  assert.equal(blank.task().observer.phase, 'unknown', 'an unusable phase falls back, it does not refuse the write');
  assert.equal(blank.task().observer.method, null);
  assert.equal(blank.task().observer.reason, null);
  assert.equal(blank.task().observer.observer_id, OBSERVER);
});

test('a padded observer identity is recorded as the same observer, not refused', async () => {
  const f = world({
    submit: (message, identity) => {
      const value = receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity });
      value.observer_id = `  ${OBSERVER}  `;
      value.page_instance_id = `\t${PAGE_INSTANCE}`;
      return value;
    }
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.code, CHATGPT_ERROR.SUBMIT_PENDING, JSON.stringify(result));
  assert.equal(f.task().observer.observer_id, OBSERVER);
  assert.equal(f.task().observer.page_instance_id, PAGE_INSTANCE);
  // Normalization is deterministic, so the next poll presents an id the page
  // recognises and the identity keeps round-tripping.
  await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  const poll = f.polls().at(-1);
  assert.equal(poll.observer_id, OBSERVER);
  assert.equal(poll.page_instance_id, PAGE_INSTANCE);
  assert.equal((await f.driver.observeTurn({ correlation_id: GATE.correlation_id })).code,
    CHATGPT_ERROR.OBSERVATION_PENDING);
});

test('an unrecordable observer identity is never turned into an outcome', async () => {
  // Write 3 is the arm record; it is refused.
  const f = world({}, { set: async (_value, count) => { if (count === 3) throw new Error('arm write failed'); } });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OBSERVER_ARM_UNAVAILABLE);
  assert.equal(result.submitted, true);
  assert.equal(result.captured, false);
  assert.equal(result.uncertain, true);
  assert.equal(f.task().phase, 'SUBMIT_RESERVED');
  assert.equal(f.task().lock_active, true, 'the conversation stays locked');
  assert.equal(f.task().observer, null);
  // And it is never re-sent. The same correlation is still IN_FLIGHT in the
  // legacy record; a fresh correlation still hits the operation tombstone.
  assert.equal((await f.make().submitTurn(GATE)).code, CHATGPT_ERROR.DISPATCH_IN_FLIGHT);
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'fresh' })).code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  assert.equal(f.sends().length, 1);
});

/* ---------------------------------------------------- observe refusals */

test('a page that reports observer_identity_mismatch is surfaced and settles nothing', async () => {
  const f = world({ observeMismatch: true });
  await f.driver.submitTurn(GATE);
  const writesBefore = f.writes.length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OBSERVER_IDENTITY_MISMATCH);
  assert.equal(result.reason, 'observer_identity_mismatch');
  assert.equal(result.captured, false);
  assert.equal(result.read_only, true);
  assert.equal(f.writes.length, writesBefore, 'a refused poll writes nothing at all');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
});

test('observe-turn is refused once the operation is terminal', async () => {
  const f = world({
    submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  const accepted = await f.driver.submitTurn(GATE);
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  assert.equal(f.task().lock_active, false);

  const before = f.posted.length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TASK_ALREADY_RESOLVED);
  assert.equal(result.reason, 'observer_terminal');
  assert.equal(f.posted.length, before, 'a resolved operation is never polled again');
});

test('observe-turn is refused for an operation that was never reserved', async () => {
  const f = world();
  const result = await f.driver.observeTurn({ correlation_id: 'never-submitted' });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OPERATION_NOT_RESERVED);
  assert.equal(f.posted.length, 0);
});

test('observe-turn is refused when the operation has no recorded observer', async () => {
  const f = world();
  await f.driver.runTurn(GATE);           // legacy path: reserves, never arms
  const before = f.posted.length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OBSERVER_IDENTITY_REQUIRED);
  assert.equal(f.posted.length, before);
});

/* --------------------------------------------------- settlement mapping */

test('an ambiguous submission keeps the lock and forbids a fresh correlation', async () => {
  const f = world({ silentSubmit: true });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal(result.submitted, true);
  assert.equal(result.uncertain, true);
  assert.equal(result.captured, false);
  assert.equal(f.task().phase, 'SUBMIT_RESERVED');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.task().facts.consumed, false);

  // A fresh correlation is not a fresh operation, and another tab on the same
  // conversation is not a different conversation.
  assert.equal((await f.make().submitTurn({ ...GATE, correlation_id: 'fresh-marker' })).code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  assert.equal((await f.make().submitTurn(repeat({ tab_id: 7 }))).code, CONVERSATION_LOCKED);
  assert.equal(f.sends().length, 1, 'the page was activated exactly once');
});

test('only a valid accepted reply releases the lock, and never as CONSUMED', async () => {
  const f = world({
    submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.captured, true);
  assert.equal(result.envelope.payload.expected_reply, GATE.expected_reply_token);
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.task().facts.consumed, false);
  assert.equal(f.task().facts.reply_checked, true);
  // A distinct operation in a different conversation is allowed afterwards.
  assert.equal((await f.make().submitTurn(repeat())).ok, true);
  assert.equal(f.sends().length, 2);
});

test('only a positive no-submit releases the lock', async () => {
  const f = world({
    submit: (message, identity) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      observation: { phase: 'REFUSED_NO_SUBMIT', reason: 'pre_activation_refused', click_attempted: false, submission_observed: false },
      extra: { ok: false, reason: 'pre_activation_refused', submitted: false, no_send: true, uncertain: false, pending: false } })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.submitted, false);
  assert.equal(result.uncertain, false);
  assert.equal(result.reason, 'pre_activation_refused');
  assert.equal(f.task().phase, 'REFUSED_NO_SUBMIT');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.task().facts.no_submit, true);
  assert.equal(f.task().facts.consumed, false);
  // The lock really is released: a distinct operation in a different
  // conversation is dispatched rather than refused for the lock. (The scripted
  // page refuses it again, which is a page outcome, not a guard outcome.)
  const next = await f.make().submitTurn(repeat());
  assert.equal(next.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.notEqual(next.code, CONVERSATION_LOCKED);
  assert.equal(f.sends().length, 2);
});

test('a page refusal that names no observer is refused with the page\'s own reason, and releases the lock', async () => {
  // These are exactly content.js `refuse()` answers: {ok:false, reason,
  // submitted:false, no_send:true} with NO identity, because nothing was armed.
  const reasons = ['turn_in_flight', 'invalid_turn_request', 'outbound_correlation_required',
    'identity_already_seen', 'baseline_unavailable', 'page_task_store_full'];
  for (const reason of reasons) {
    const f = world({ submit: (message) => ({ action: message.action, ok: false, reason, submitted: false, no_send: true }) });
    const result = await f.driver.submitTurn(GATE);
    assert.equal(result.ok, false, reason);
    assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED, `${reason} is not an identity mismatch`);
    assert.equal(result.reason, reason, 'the page\'s reason is carried verbatim');
    assert.equal(result.submitted, false);
    assert.equal(result.uncertain, false);
    assert.equal(result.captured, false);
    assert.equal(f.task().phase, 'REFUSED_NO_SUBMIT', reason);
    assert.equal(f.task().lock_active, false, reason);
    assert.equal(f.task().observer, null, 'a refusal arms no observer and claims none');
    // THE POINT: a conversation is not locked forever by a turn that never began.
    const next = await f.make().submitTurn(repeat({ tab_id: 7 }));
    assert.notEqual(next.code, CONVERSATION_LOCKED, `${reason} must not wedge the conversation`);
    assert.equal(f.sends().length, 2);
  }
});

test('a terminal receipt is never reported as submit_pending', async () => {
  // content.js's expiry path: terminal, no verdict, nothing accepted, and the
  // page names why. It settled; it is not waiting.
  const f = world({
    submit: (message, identity) => receipt({
      action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      observation: { phase: 'NEEDS_RECONCILIATION', generation_started: false, generation_complete: false,
        reason: REASON.GENERATION_NEVER_STARTED },
      extra: { ok: false, reason: REASON.GENERATION_NEVER_STARTED, submitted: undefined, pending: false, uncertain: true }
    })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.notEqual(result.code, CHATGPT_ERROR.SUBMIT_PENDING);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.reason, REASON.GENERATION_NEVER_STARTED);
  assert.equal(result.pending, false);
  assert.equal(result.captured, false);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'a terminal refusal is still not a checked reply');
});

test('a terminal REJECTED envelope is the page\'s refusal, not an adapter contract violation', async () => {
  const f = world({
    submit: (message, identity) => rejectedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED, JSON.stringify(result));
  assert.notEqual(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT,
    'a rejection is an outcome the page reported, not a broken acceptance claim');
  assert.equal(result.reason, REASON.REPLY_TOKEN_MISMATCH, 'the page\'s verdict reason is carried');
  assert.equal(result.pending, false);
  assert.equal(result.captured, false);
  assert.equal(result.envelope, null);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
});

test('an ACCEPTED claim that is doubled or contradicted is still a contract mismatch', async () => {
  // The other side of the same rule: the page CLAIMED acceptance and cannot back
  // it up, so the honest diagnosis is about the adapter contract, not about the
  // turn's outcome.
  const cases = [
    { label: 'payload contradicts the verdict', mutate: (value) => { value.envelope.payload.accepted = false; } },
    { label: 'the envelope itself is a rejection', mutate: (value) => {
      value.envelope.event_type = 'proof.rejected';
      value.envelope.task_state = 'REJECTED';
    } }
  ];
  for (const { label, mutate } of cases) {
    const f = world({
      submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
        correlationId: message.correlation_id, token: message.expected_reply_token, mutate })
    });
    const result = await f.driver.submitTurn(GATE);
    assert.equal(result.ok, false, label);
    assert.equal(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT, label);
    assert.equal(result.captured, false, label);
    assert.equal(result.uncertain, true, label);
    assert.equal(f.task().phase, 'NEEDS_RECONCILIATION', label);
    assert.equal(f.task().lock_active, true, label);
    assert.equal((await f.make().submitTurn(repeat({ tab_id: 7 }))).code, CONVERSATION_LOCKED, label);
  }
});

test('a submission receipt that contradicts itself keeps the lock and claims nothing', async () => {
  const f = world({
    submit: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.SUBMIT_TURN, identity,
      correlationId: message.correlation_id, token: message.expected_reply_token,
      mutate: (value) => { value.envelope.payload.accepted = false; } })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(result.captured, false);
  assert.equal(result.uncertain, true);
  assert.equal(result.envelope, null);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.task().facts.reply_checked, false);
  assert.equal((await f.make().submitTurn(repeat({ tab_id: 7 }))).code, CONVERSATION_LOCKED);
  assert.equal(f.sends().length, 1);
});

test('a receipt about a different operation is refused, not recorded as this one', async () => {
  const f = world({
    submit: (message, identity) => receipt({ action: CHATGPT_ACTION.SUBMIT_TURN,
      identity: { ...identity, correlation_id: 'someone-elses-correlation' } })
  });
  const result = await f.driver.submitTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OBSERVER_IDENTITY_MISMATCH);
  assert.equal(result.captured, false);
  assert.equal(f.task().observer, null, 'a foreign identity is never written into this operation');
  assert.equal(f.task().lock_active, true);
});

test('an observe receipt carrying another observer is refused against the armed one', async () => {
  const f = world({
    observe: (message, identity) => receipt({ action: CHATGPT_ACTION.OBSERVE_TURN,
      identity: { ...identity, observer_id: 'someone-elses-observer' } })
  });
  await f.driver.submitTurn(GATE);
  const writesBefore = f.writes.length;
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.OBSERVER_IDENTITY_MISMATCH);
  assert.match(result.message, /observer_id/);
  assert.equal(f.writes.length, writesBefore, 'and it overwrites nothing that was already recorded');
  assert.equal(f.task().observer.observer_id, OBSERVER);
  assert.equal(f.task().lock_active, true);
});

test('a poll that cannot reach the page claims nothing about the operation', async () => {
  const timedOut = world({ silentObserve: true });
  await timedOut.driver.submitTurn(GATE);
  const expired = await timedOut.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(expired.ok, false);
  assert.equal(expired.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal('submitted' in expired, false,
    '`submitted` describes the activation, not this read-only call');
  assert.equal(expired.read_only, true);
  assert.equal(expired.captured, false);
  assert.equal(expired.uncertain, true, 'not knowing is reported as uncertainty');
  assert.equal(timedOut.task().lock_active, true);

  const gone = world();
  await gone.driver.submitTurn(GATE);
  gone.api.tabs.connect = () => {
    throw new Error('Could not establish connection. Receiving end does not exist.');
  };
  const dropped = await gone.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(dropped.ok, false);
  assert.equal(dropped.code, CHATGPT_ERROR.NO_CONTENT_SCRIPT);
  assert.equal('submitted' in dropped, false);
  assert.equal(dropped.read_only, true);
  assert.equal(dropped.captured, false);
  assert.equal(dropped.uncertain, true);
  assert.equal(gone.task().lock_active, true);
});

test('a terminal REJECTED observe receipt is reported with the page\'s verdict reason too', async () => {
  const f = world({
    observe: (message, identity) => rejectedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id,
    expected_reply_token: GATE.expected_reply_token });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED, JSON.stringify(result));
  assert.notEqual(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(result.reason, REASON.REPLY_TOKEN_MISMATCH);
  assert.equal(result.pending, false);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
});

test('a durable-backed poll that cannot satisfy the token contract fails closed and keeps the lock', async () => {
  // P2-6 is deferred BY DESIGN: the token is not stored durably, so the caller
  // must supply it. Until that lands this path must fail CLOSED with a
  // machine-readable reason rather than accept, or silently unlock.
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(result.captured, false);
  assert.equal(result.uncertain, true);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true, 'an unverifiable capture never releases the lock');
});

test('a contradictory observe result keeps the lock and is never accepted', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token,
      mutate: (value) => { value.envelope.payload.expected_reply = 'WRONG'; } })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(result.captured, false);
  assert.equal(result.uncertain, true);
  assert.equal(result.envelope, null);
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.task().facts.reply_checked, false);
  assert.equal((await f.make().submitTurn(repeat({ tab_id: 7 }))).code, CONVERSATION_LOCKED);
});

test('a valid accepted observe result releases the lock', async () => {
  const f = world({
    observe: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await f.driver.submitTurn(GATE);
  const accepted = await f.driver.observeTurn({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  assert.equal(f.task().phase, 'REPLY_CHECKED');
  assert.equal(f.task().lock_active, false);
  assert.equal(f.task().facts.consumed, false);
  assert.equal(f.sends().length, 1, 'observing never sends');
});

test('observe is repeatable while pending and cannot extend the page deadline', async () => {
  const remaining = [4000, 3000, 2000];
  const f = world({
    observe: (message, identity, calls) => receipt({ action: CHATGPT_ACTION.OBSERVE_TURN, identity,
      observation: { phase: 'OBSERVING', remaining_ms: remaining[Math.min(calls - 1, 2)] } })
  });
  await f.driver.submitTurn(GATE);
  for (let i = 0; i < 3; i++) {
    const result = await f.driver.observeTurn({ correlation_id: GATE.correlation_id });
    assert.equal(result.ok, false);
    assert.equal(result.code, CHATGPT_ERROR.OBSERVATION_PENDING);
    assert.equal(result.pending, true);
    assert.equal(result.read_only, true);
    assert.equal(result.captured, false);
  }
  assert.equal(f.polls().length, 3);
  assert.ok(remaining.every((value, index) => index === 0 || value < remaining[index - 1]),
    'the fixture only counts down; no poll can raise the page deadline');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.sends().length, 1);
});

/* ------------------------------------------------------------ read-final */

test('read-final surfaces an honest observer refusal instead of no_reason', async () => {
  for (const reason of ['observer_evidence_required', 'observer_identity_mismatch']) {
    const f = world({ readRefusal: reason });
    await f.driver.submitTurn(GATE);
    const result = await f.driver.readFinal({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
    assert.equal(result.ok, false, reason);
    assert.equal(result.reason, reason);
    assert.equal(result.verdict.reason, reason, `${reason} must not be collapsed into a generic reason`);
    assert.notEqual(result.reason, 'no_reason');
    assert.equal(result.captured, false);
    assert.equal(result.uncertain, true);
    assert.equal(result.read_only, true);
    // A read never changes the durable outcome.
    assert.equal(f.task().lock_active, true);
    assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  }
});

test('read-final applies the accepting contract when it reports a capture', async () => {
  const contradicted = world({
    read: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.READ_FINAL, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token,
      mutate: (value) => { value.envelope.payload.reply_text = 'a different body'; } })
  });
  await contradicted.driver.submitTurn(GATE);
  const bad = await contradicted.driver.readFinal({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
  assert.equal(bad.ok, false);
  assert.equal(bad.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(bad.captured, false);
  assert.equal(bad.uncertain, true);

  const good = world({
    read: (message, identity) => acceptedReceipt({ action: CHATGPT_ACTION.READ_FINAL, identity,
      correlationId: message.correlation_id, token: GATE.expected_reply_token })
  });
  await good.driver.submitTurn(GATE);
  const result = await good.driver.readFinal({ correlation_id: GATE.correlation_id, expected_reply_token: GATE.expected_reply_token });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.captured, true);
  assert.equal(result.read_only, true);
  assert.equal(result.observer_id, OBSERVER);
  assert.equal(result.page_instance_id, PAGE_INSTANCE);
});

test('read-final never accepts a capture it cannot see an envelope for', async () => {
  const f = world({
    read: (message, identity) => ({ ...identity, action: message.action, ok: true, read_only: true,
      verdict: { schema: VERDICT_SCHEMA, accepted: true, reason: REASON.ACCEPTED,
        correlation_id: message.correlation_id, expected_reply: message.expected_reply_token },
      generation: { started: true, complete: true, asserted_by_caller: false } })
  });
  await f.driver.submitTurn(GATE);
  const result = await f.driver.readFinal({ correlation_id: GATE.correlation_id,
    expected_reply_token: GATE.expected_reply_token });
  assert.equal(result.ok, false, 'a claimed capture with no envelope is not a capture');
  assert.equal(result.code, CHATGPT_ERROR.ADAPTER_CONTRACT);
  assert.equal(result.captured, false);
  assert.equal(result.uncertain, true);
  assert.equal(result.read_only, true);
  assert.equal(f.task().lock_active, true, 'a read never changes the durable outcome');
});

test('a read with no durable operation invents no identity', async () => {
  const f = world({ read: (message) => ({ action: message.action, ok: false,
    reason: 'observer_evidence_required', read_only: true,
    verdict: { schema: 'aion.chatgpt-verdict/0.1', accepted: false, reason: 'no_final_block' } }) });
  const result = await f.driver.readFinal({ correlation_id: 'never-submitted', expected_reply_token: 'ACK-x' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'observer_evidence_required');
  const sent = f.reads().at(-1);
  for (const field of ['observer_id', 'page_instance_id', 'task_id', 'operation_key']) {
    assert.equal(field in sent, false, `no ${field} is invented for an operation that does not exist`);
  }
});

/* ----------------------------------------------------------- submission gates */

test('submit-turn requires the gesture, the approval and a stable identity, before any port', async () => {
  const f = world();
  const cases = [
    [{ ...GATE, user_gesture: undefined }, CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED],
    [{ ...GATE, user_gesture: 'true' }, CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED],
    [{ ...GATE, approved_scope_ref: '' }, CHATGPT_ERROR.APPROVAL_REQUIRED],
    [{ ...GATE, approved_scope_ref: undefined }, CHATGPT_ERROR.APPROVAL_REQUIRED],
    [{ ...GATE, text: '  ' }, CHATGPT_ERROR.TEXT_REQUIRED],
    [{ ...GATE, text: 'x'.repeat(9000) }, CHATGPT_ERROR.TEXT_TOO_LONG],
    [{ ...GATE, correlation_id: '' }, CHATGPT_ERROR.CORRELATION_REQUIRED],
    [{ ...GATE, expected_reply_token: 42 }, CHATGPT_ERROR.BAD_ARGUMENT],
    [{ ...GATE, task_id: undefined, operation_key: undefined }, CHATGPT_ERROR.IDENTITY_REQUIRED],
    [{ ...GATE, task_id: undefined }, CHATGPT_ERROR.IDENTITY_REQUIRED]
  ];
  for (const [command, code] of cases) {
    const result = await f.driver.submitTurn(command);
    assert.equal(result.ok, false, JSON.stringify(command).slice(0, 80));
    assert.equal(result.code, code, JSON.stringify(command).slice(0, 80));
    assert.notEqual(result.submitted, true, 'a refused submission never claims it sent anything');
  }
  assert.equal(f.posted.length, 0, 'no port is opened for a refused submission');
  assert.equal(f.writes.length, 0, 'and no reservation is burned');
});

test('submit-turn submits exactly one activation with the identity it reserved', async () => {
  const f = world();
  await f.driver.submitTurn(GATE);
  assert.deepEqual(f.posted.map((m) => m.action), [CHATGPT_ACTION.PING, CHATGPT_ACTION.SUBMIT_TURN]);
  const sent = f.posted[1];
  assert.equal(sent.user_gesture, true);
  assert.equal(sent.text, GATE.text);
  assert.equal(sent.correlation_id, GATE.correlation_id);
  assert.equal(sent.task_id, GATE.task_id);
  assert.equal(sent.operation_key, GATE.operation_key);
  assert.equal(sent.expected_reply_token, GATE.expected_reply_token);
  assert.equal(sent.timeout_ms, 2000);
  assert.equal('page_instance_id' in sent, false, 'the worker never invents a page identity before the page names one');
  assert.equal(f.task().payload_hash, createHash('sha256').update(GATE.text).digest('hex'));
});

test('the reserved identity is immutable across a request mutated mid-flight', async () => {
  const f = world();
  const command = { ...GATE };
  const pending = f.driver.submitTurn(command);
  command.text = 'changed while awaiting preparation';
  command.operation_key = 'changed-operation';
  await pending;
  assert.equal(f.posted[1].text, GATE.text);
  assert.equal(f.posted[1].operation_key, GATE.operation_key);
  assert.equal(f.task(GATE.operation_key).payload_hash, createHash('sha256').update(GATE.text).digest('hex'));
});

/* -------------------------------------------------------------- budgets */

test('the new commands have finite, validated and ordered budgets', () => {
  const submit = resolveCommandDeadline({ command: 'submit-turn' });
  const observe = resolveCommandDeadline({ command: 'observe-turn' });
  const run = resolveCommandDeadline({ command: 'run-turn' });

  assert.equal(submit.workMs, COMMAND_WORK['submit-turn']);
  assert.equal(observe.workMs, COMMAND_WORK['observe-turn']);
  for (const [label, plan] of [['submit-turn', submit], ['observe-turn', observe]]) {
    assert.ok(Number.isSafeInteger(plan.absoluteMs) && plan.absoluteMs > 0, `${label} is finite`);
    assert.ok(Object.isFrozen(plan.stages) && Object.isFrozen(plan));
    assert.equal(plan.absoluteMs, Object.values(plan.stages).reduce((a, b) => a + b, 0));
    assert.equal(plan.panelMs, plan.absoluteMs + COMMAND_POLICY.responseMargin);
    assert.ok(plan.panelMs > plan.absoluteMs);
    assert.equal(plan.inactivity, null);
    for (const stage of ['reservationRead', 'observerArm', 'settlement', 'exchange']) {
      assert.ok(Number.isSafeInteger(plan.stages[stage]) && plan.stages[stage] > 0, `${label}.${stage}`);
    }
  }
  // Only the send-capable commands carry the send stages; a poll has no path to
  // a preflight, a reservation or an activation, and that absence is asserted
  // rather than assumed.
  for (const stage of ['preflight', 'reservationWrite']) {
    assert.ok(submit.stages[stage] > 0, `submit-turn.${stage}`);
    assert.equal(observe.stages[stage], undefined, `observe-turn must never wait on ${stage}`);
  }
  // The submission-observation bound is small and lives inside the blocking
  // run-turn envelope; the read-only poll is shorter still.
  assert.ok(submit.stages.exchange < run.stages.exchange);
  assert.ok(submit.absoluteMs < run.absoluteMs);
  assert.ok(observe.stages.exchange < submit.stages.exchange);
  assert.ok(observe.absoluteMs < submit.absoluteMs);
  // The existing generation maximum is untouched by the split.
  assert.equal(COMMAND_WORK['run-turn'], 300_000);
});

test('the panel deadline outlasts the worker budget for EVERY supported command', () => {
  assert.deepEqual(Object.keys(COMMAND_WORK).sort(),
    ['archive', 'commander-scan', 'dispose', 'observe-turn', 'ping', 'read-final', 'run-turn', 'state', 'stop', 'submit-turn', 'tabs']);
  for (const command of Object.keys(COMMAND_WORK)) {
    const plan = resolveCommandDeadline({ command });
    assert.ok(plan.panelMs > plan.absoluteMs, `${command}: panel ${plan.panelMs} > worker ${plan.absoluteMs}`);
    assert.doesNotThrow(() => resolveCommandDeadline({ command, requestedWorkMs: Number.MAX_SAFE_INTEGER }));
  }
});

test('submit-turn budgets clamp against the command ceiling, and malformed ones refuse', async () => {
  const ceiling = COMMAND_WORK['submit-turn'];
  const cases = [
    { label: 'absent', timeout_ms: undefined, expected: 2000 },
    { label: 'far above the ceiling', timeout_ms: 10 ** 9, expected: ceiling },
    { label: 'a genuine smaller ask is honoured', timeout_ms: 750, expected: 750 }
  ];
  for (const { label, timeout_ms, expected } of cases) {
    const f = world();
    const command = { ...GATE, correlation_id: `c-${label}`, task_id: `t-${label}`, operation_key: `o-${label}` };
    if (timeout_ms !== undefined) command.timeout_ms = timeout_ms;
    await f.driver.submitTurn(command);
    assert.equal(f.posted[1].timeout_ms, expected, label);
  }
  for (const timeout_ms of [-1, 0, 'forever', Infinity, NaN, 1.5, null]) {
    const f = world();
    const result = await f.driver.submitTurn({ ...GATE, timeout_ms });
    assert.equal(result.ok, false, String(timeout_ms));
    assert.equal(result.code, CHATGPT_ERROR.BAD_ARGUMENT, String(timeout_ms));
    assert.equal(f.posted.length, 0, String(timeout_ms));
    assert.equal(f.writes.length, 0, String(timeout_ms));
  }
});

/* ---------------------------------------------------------- legacy path */

test('legacy runTurn is unchanged: same action, same four writes, same phases', async () => {
  const f = world();
  const result = await f.driver.runTurn(GATE);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED, 'a pending receipt is a refusal, not a capture');
  assert.equal(result.submitted, true);
  assert.notEqual(result.uncertain, false, 'only an explicit no-send settles the uncertainty');
  assert.deepEqual(f.posted.map((m) => m.action), [CHATGPT_ACTION.PING, CHATGPT_ACTION.RUN_TURN]);
  assert.deepEqual(f.writeKeys(), [DISPATCH_KEY, TASKS_KEY, DISPATCH_KEY, TASKS_KEY]);
  assert.equal(f.task().observer, null, 'the blocking wrapper claims no observer session');
  assert.equal(f.task().phase, 'NEEDS_RECONCILIATION');
  assert.equal(f.task().lock_active, true);
  assert.equal(f.task().facts.consumed, false);
  assert.equal(f.task().facts.reply_checked, false);
  assert.equal((await f.make().runTurn(GATE)).code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  assert.equal(f.sends().length, 1);
});

test('legacy runTurn still settles a positive no-send and an accepted reply', async () => {
  const refused = world({
    run: (message) => ({ action: message.action, ok: false, reason: 'send_button_disabled',
      submitted: false, no_send: true, state: { generating: false, sendPresent: true, sendDisabled: true } })
  });
  const noSend = await refused.driver.runTurn(GATE);
  assert.equal(noSend.ok, false);
  assert.equal(noSend.submitted, false);
  assert.equal(noSend.uncertain, false);
  assert.equal(refused.task().phase, 'REFUSED_NO_SUBMIT');
  assert.equal(refused.task().lock_active, false);

  const accepted = world({
    run: (message) => acceptedReceipt({ action: message.action,
      identity: { task_id: message.correlation_id, operation_key: message.correlation_id, correlation_id: message.correlation_id,
        observer_id: OBSERVER, page_instance_id: PAGE_INSTANCE },
      correlationId: message.correlation_id, token: message.expected_reply_token })
  });
  const checked = await accepted.driver.runTurn(GATE);
  assert.equal(checked.ok, true, JSON.stringify(checked));
  assert.equal(checked.captured, true);
  assert.equal(accepted.task().phase, 'REPLY_CHECKED');
  assert.equal(accepted.task().lock_active, false);
  assert.equal(accepted.task().observer, null, 'the legacy wrapper still records no observer session');
});

/* ------------------------------------------------------- worker routing */

test('the worker maps only its own message types onto the two new commands', () => {
  assert.equal(chatGPTCommandName('aion/chatgpt-submit'), 'submit-turn');
  assert.equal(chatGPTCommandName('aion/chatgpt-observe'), 'observe-turn');
  assert.equal(chatGPTCommandName('aion/chatgpt-run'), 'run-turn');
  for (const type of ['aion/chatgpt-submit-turn', 'unknown', 'aion/chatgpt-send', '', undefined]) {
    assert.equal(chatGPTCommandName(type), null, JSON.stringify(type));
  }
});

test('aion/chatgpt-submit is gesture-and-approval gated and opens no port when refused', async () => {
  const f = world();
  const previous = globalThis.chrome;
  globalThis.chrome = f.api;
  worker.reset();
  try {
    const poll = await worker.runChatGPTCommand(
      { type: 'aion/chatgpt-observe', tabId: 7, correlation_id: 'never-submitted' },
      { hydrate: () => worker.rehydrate() });
    assert.equal(poll.ok, false);
    assert.equal(f.posted.length, 0, 'a poll that has no operation contacts no page');

    for (const command of [
      { text: 'x', approved_scope_ref: 'grant-1' },
      { text: 'x', user_gesture: true },
      { text: 'x', user_gesture: true, approved_scope_ref: '' }
    ]) {
      const result = await worker.runChatGPTCommand(
        { type: 'aion/chatgpt-submit', tabId: 7, command },
        { hydrate: () => worker.rehydrate() });
      assert.equal(result.ok, false, JSON.stringify(command));
      assert.ok([CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED, CHATGPT_ERROR.APPROVAL_REQUIRED].includes(result.code), result.code);
      assert.equal(result.submitted, false);
      assert.equal(f.posted.length, 0, 'a refused submission opens no port');
    }
    // Only the worker's own state was written; no dispatch guard was created.
    assert.equal(f.writes.some((value) => Object.hasOwn(value, DISPATCH_KEY) || Object.hasOwn(value, TASKS_KEY)), false);
  } finally {
    worker.reset();
    if (previous === undefined) delete globalThis.chrome; else globalThis.chrome = previous;
  }
});

test('aion/chatgpt-observe needs no gesture and never activates anything', async () => {
  const f = world();
  const previous = globalThis.chrome;
  globalThis.chrome = f.api;
  worker.reset();
  try {
    const result = await worker.runChatGPTCommand(
      { type: 'aion/chatgpt-observe', tabId: 7, correlation_id: 'never-submitted', user_gesture: true, text: 'send me' },
      { hydrate: () => worker.rehydrate() });
    assert.equal(result.ok, false);
    assert.equal(result.code, CHATGPT_ERROR.OPERATION_NOT_RESERVED);
    assert.equal(f.posted.length, 0);
    assert.equal(f.sends().length, 0);
    assert.equal(f.writes.some((value) => Object.hasOwn(value, DISPATCH_KEY) || Object.hasOwn(value, TASKS_KEY)), false);
  } finally {
    worker.reset();
    if (previous === undefined) delete globalThis.chrome; else globalThis.chrome = previous;
  }
});
