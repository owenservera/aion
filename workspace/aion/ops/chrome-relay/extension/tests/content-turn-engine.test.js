import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../src/chatgpt/content.js';
import { pageFixture } from './fixtures/chatgpt-page.js';
import { validateEnvelope } from '../src/lib/envelope.js';
import { createHash } from 'node:crypto';
import { createChatGPTPortDriver } from '../src/background/chatgpt-port.js';
import { VERDICT_SCHEMA } from '../src/chatgpt/correlate.js';

async function world(body) {
  const f = pageFixture(); const engine = f.makeEngine(content);
  try { await body(f, engine); }
  finally { engine.dispose(); f.restore(); }
}
async function submitted(f, engine, command) {
  const pending = Promise.resolve(engine.submit(command));
  await f.clock.advance(400);
  return pending;
}

test('observer is armed before click and buffers synchronous generation start/end', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command);
  assert.ok(f.log.indexOf('armed') < f.log.indexOf('click'));
  assert.equal(receipt.click_attempted, true); assert.equal(receipt.submission_observed, true);
  assert.equal(receipt.observation.generation_started, true);
  assert.equal(receipt.observation.generation_complete, false);
  assert.equal(receipt.pending, true, 'submit returns before settle/completion');
  await f.clock.advance(750);
  const result = engine.observe(receipt);
  assert.equal(result.ok, true); assert.equal(result.observation.phase, 'REPLY_CHECKED');
  assert.equal(result.verdict.accepted, true); assert.equal(validateEnvelope(result.envelope).valid, true);
  assert.equal(result.envelope.payload.expected_reply, command.expected_reply_token);
  assert.equal(result.envelope.payload.generation.complete, true);
  assert.equal(result.envelope.payload.observed.source, 'dom-assistant-turn');
  assert.equal(result.envelope.payload.reply_text, `${command.correlation_id}\n82\n${command.expected_reply_token}`);
  assert.equal(f.clock.pending, 0); assert.equal(f.observers.size, 0);
}));

test('pre-click observer captures synchronous stop-control attribute transitions', async () => world(async (f, engine) => {
  const command = f.request();
  f.onClick = () => {
    f.user(command.text); f.editor.textContent = '';
    f.attribute('stop-button'); f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`); f.attribute('send-button');
  };
  const receipt = await submitted(f, engine, command); await f.clock.advance(750);
  assert.equal(engine.observe(receipt).verdict.accepted, true);
  assert.equal(f.clicks, 1);
}));

test('repeated observe is read-only and never resets the original deadline', async () => world(async (f, engine) => {
  const command = f.request({ timeout_ms: 1000 });
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.start(); };
  const receipt = await submitted(f, engine, command);
  const first = engine.observe(receipt).observation.remaining_ms;
  await f.clock.advance(300);
  for (let i = 0; i < 5; i++) {
    const result = engine.observe({ ...receipt, timeout_ms: 300000, generation_complete: true });
    assert.equal(result.read_only, true); assert.equal(result.generation.complete, false);
    assert.ok(result.observation.remaining_ms < first);
  }
  await f.clock.advance(700);
  const result = engine.observe(receipt);
  assert.equal(result.ok, false); assert.equal(result.observation.reason, 'generation_timeout');
  assert.equal(f.clicks, 1); assert.equal(f.fills, 1); assert.equal(f.clock.pending, 0);
  assert.equal(engine.submit(f.request({ task_id: 'other', operation_key: 'other', correlation_id: 'other' })).reason, 'turn_in_flight');
}));

test('same operation and fresh IDs cannot double-click during setup or observation', async () => world(async (f, engine) => {
  const command = f.request();
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.start(); };
  const pending = engine.submit(command);
  assert.equal(engine.submit(command).reason, 'operation_already_seen');
  assert.equal(engine.submit(f.request({ operation_key: 'fresh', task_id: 'fresh', correlation_id: 'fresh' })).reason, 'turn_in_flight');
  await f.clock.advance(400); const receipt = await pending;
  assert.equal(engine.submit({ ...command, correlation_id: 'fresh-correlation' }).reason, 'operation_already_seen');
  assert.equal(engine.observe(receipt).generation.complete, false);
  assert.equal(f.clicks, 1); assert.equal(f.fills, 1);
}));

test('observe rejects every mismatched task/operation/correlation/observer/page identity', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command);
  for (const field of ['task_id', 'operation_key', 'correlation_id', 'observer_id', 'page_instance_id']) {
    const result = engine.observe({ ...receipt, [field]: 'foreign' });
    assert.equal(result.ok, false); assert.equal(result.reason, 'observer_identity_mismatch');
  }
  assert.equal(f.clicks, 1);
}));

test('historical matching user and assistant are baseline, never new submission proof', async () => world(async (f, engine) => {
  const command = f.request({ timeout_ms: 1000 });
  f.user(command.text); f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`);
  f.onClick = () => { f.editor.textContent = ''; f.start(); f.end(); };
  const pending = engine.submit(command); await f.clock.advance(1400); const result = await pending;
  assert.equal(result.click_attempted, true); assert.equal(result.submission_observed, false);
  assert.equal(result.ok, false); assert.equal(result.verdict.accepted, false);
  assert.equal(f.clicks, 1);
}));

test('a later unrelated user/assistant cannot become the paired reply', async () => world(async (f, engine) => {
  const command = f.request();
  f.onClick = () => {
    f.user(command.text); f.start();
    f.user('unrelated owner instruction'); f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`); f.end();
  };
  const result = await submitted(f, engine, command);
  assert.equal(result.ok, false); assert.equal(result.observation.continuity, false);
  assert.equal(result.verdict.accepted, false); assert.equal(result.envelope.payload.reply_text, null);
}));

test('baseline rerender is uncertainty, not a historical matching turn mistaken for new submission', async () => world(async (f, engine) => {
  const command = f.request(); f.user(command.text);
  f.onClick = () => { f.turns.shift(); f.user(command.text); f.start(); f.end(); };
  const result = await submitted(f, engine, command);
  assert.equal(result.ok, false); assert.equal(result.submission_observed, false);
  assert.equal(result.observation.reason, 'observation_continuity_lost');
}));

test('click, cleared composer and URL change alone are not submission proof', async () => world(async (f, engine) => {
  globalThis.location.pathname = '/';
  const command = f.request({ timeout_ms: 10000 });
  f.onClick = () => { f.editor.textContent = ''; globalThis.location.pathname = '/c/new'; };
  const pending = engine.submit(command);
  await f.clock.advance(5400); const result = await pending;
  assert.equal(result.click_attempted, true); assert.equal(result.submission_observed, false);
  assert.equal(result.submitted, undefined); assert.equal(result.uncertain, true); assert.equal(result.pending, true);
  assert.equal(engine.submit(command).reason, 'operation_already_seen');
  assert.equal(f.clicks, 1);
}));

test('matching user followed by idle without an observed start never completes', async () => world(async (f, engine) => {
  const command = f.request({ timeout_ms: 1000 });
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`); };
  const receipt = await submitted(f, engine, command); await f.clock.advance(1000);
  const result = engine.observe(receipt);
  assert.equal(result.ok, false); assert.equal(result.generation.complete, false);
  assert.equal(result.observation.reason, 'generation_never_started');
}));

test('caller completion assertion is rejected both without an observer and while observation is incomplete', async () => world(async (f, engine) => {
  const command = f.request();
  f.user(command.text); f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`);
  const unsupported = engine.readFinal({ ...command, generation_complete: true });
  assert.equal(unsupported.ok, false); assert.equal(unsupported.generation.asserted_by_caller, false);
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.start(); };
  const receipt = await submitted(f, engine, command);
  const pending = engine.readFinal({ ...receipt, expected_reply_token: command.expected_reply_token, generation_complete: true });
  assert.equal(pending.ok, false); assert.equal(pending.verdict.accepted, false); assert.equal(pending.generation.complete, false);
}));

test('read-final accepts only preserved complete observer evidence, independent of caller boolean', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command); await f.clock.advance(750);
  const result = engine.readFinal({ ...receipt, expected_reply_token: command.expected_reply_token, generation_complete: false });
  assert.equal(result.ok, true); assert.equal(result.verdict.accepted, true);
  assert.equal(result.generation.asserted_by_caller, false);
  assert.equal(engine.readFinal({ ...receipt, expected_reply_token: 'WRONG', generation_complete: true }).ok, false);
}));

test('read-final refuses a mismatched observer identity honestly, with a verdict and no crash', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command);
  await f.clock.advance(750);
  // A caller that cannot prove it is addressing THIS observer is refused, but
  // the refusal carries the same machine-readable verdict every other unproven
  // read does, so the worker/panel never hold a bare `ok:false` with no reason.
  for (const field of ['task_id', 'operation_key', 'observer_id', 'page_instance_id', 'correlation_id']) {
    const wrong = engine.readFinal({ ...receipt, expected_reply_token: command.expected_reply_token, generation_complete: true, [field]: 'foreign' });
    assert.equal(wrong.ok, false, field);
    assert.equal(wrong.verdict.schema, VERDICT_SCHEMA, field);
    assert.equal(wrong.verdict.accepted, false, field);
    assert.equal(wrong.generation.complete, false, field);
    assert.equal(wrong.generation.asserted_by_caller, false, field);
    assert.equal(wrong.read_only, true, field);
  }
  const wrongObserver = engine.readFinal({ ...receipt, observer_id: 'foreign', expected_reply_token: command.expected_reply_token });
  assert.equal(wrongObserver.reason, 'observer_identity_mismatch');
  const unknownTask = engine.readFinal({ correlation_id: command.correlation_id, expected_reply_token: command.expected_reply_token });
  assert.equal(unknownTask.reason, 'observer_evidence_required');
  assert.equal(unknownTask.verdict.accepted, false);
  // Garbage is an honest refusal, not a thrown adapter error.
  for (const junk of [null, undefined, 'read-final', 42]) {
    const result = engine.readFinal(junk);
    assert.equal(result.ok, false);
    assert.equal(result.verdict.accepted, false);
    assert.equal(result.generation.complete, false);
  }
  assert.equal(f.clicks, 1);
}));

test('settle must complete inside the absolute bound, including final text stability', async () => world(async (f, engine) => {
  const command = f.request({ timeout_ms: 1000 }); let candidate;
  f.onClick = () => {
    f.user(command.text); f.editor.textContent = ''; f.start();
    candidate = f.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`); f.end();
  };
  const receipt = await submitted(f, engine, command);
  await f.clock.advance(500); f.change(candidate, `${command.correlation_id}\n82 updated\n${command.expected_reply_token}`);
  await f.clock.advance(500);
  assert.equal(engine.observe(receipt).ok, false);
  assert.equal(engine.observe(receipt).generation.complete, false);
}));

test('legacy run-turn wraps the same one-shot engine and cannot replay after completing', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command); let result;
  const pending = engine.run(command, (value) => { result = value; });
  await f.clock.advance(400); assert.equal(result, undefined);
  await f.clock.advance(750); await pending;
  assert.equal(result.ok, true); assert.equal(result.envelope.event_type, 'proof.submitted');
  assert.equal(result.envelope.payload.generation.started, true);
  assert.equal(engine.submit(command).reason, 'operation_already_seen');
  assert.equal(f.clicks, 1);
}));

test('typed automation draft is preserved on a no-submit activation refusal', async () => world(async (f, engine) => {
  const command = f.request(); const pending = engine.submit(command);
  f.button.disabled = true;
  await f.clock.advance(400); const result = await pending;
  assert.equal(result.submitted, false); assert.equal(result.no_send, true);
  assert.equal(f.editor.textContent, command.text); assert.equal(f.clicks, 0);
}));

test('changed page state during setup is uncertainty, not no-submit proof from absence of our click', async () => world(async (f, engine) => {
  const command = f.request(); const pending = engine.submit(command);
  f.user(command.text); f.editor.textContent = ''; f.start();
  await f.clock.advance(400); const result = await pending;
  assert.equal(result.click_attempted, false); assert.equal(result.submitted, undefined);
  assert.equal(result.uncertain, true); assert.equal(result.observation.phase, 'NEEDS_RECONCILIATION');
  assert.equal(engine.submit(f.request({ task_id: 'new', operation_key: 'new', correlation_id: 'new' })).reason, 'turn_in_flight');
  assert.equal(f.clicks, 0);
}));

test('malformed request/budget fields refuse before any composer mutation', async () => world(async (f, engine) => {
  for (const extra of [{ user_gesture: false }, { text: '' }, { text: 'untraceable task' }, { text: 'x'.repeat(8001) },
    { correlation_id: undefined }, { correlation_id: 'x'.repeat(129) }, { expected_reply_token: undefined },
    { expected_reply_token: 'x'.repeat(129) }, { task_id: {} }, { operation_key: null }, { page_instance_id: 'foreign' },
    ...[null, NaN, Infinity, '5000', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1].map((timeout_ms) => ({ timeout_ms }))]) {
    const result = engine.submit(f.request(extra));
    assert.equal(result.ok, false); assert.equal(result.submitted, false);
  }
  assert.equal(f.fills, 0); assert.equal(f.clicks, 0);
}));

test('valid oversized budget clamps at 300 seconds; observation past that bound cannot accept', async () => world(async (f, engine) => {
  const command = f.request({ timeout_ms: Number.MAX_SAFE_INTEGER });
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.start(); };
  const receipt = await submitted(f, engine, command);
  assert.equal(receipt.observation.remaining_ms, 300000);
  f.clock.elapse(300001);
  const result = engine.observe(receipt);
  assert.equal(result.ok, false); assert.equal(result.generation.complete, false);
  assert.equal(f.clock.pending, 0); assert.equal(f.clicks, 1);
}));

test('poll-only fallback does not invent an unobserved fast generation transition', async () => world(async (f) => {
  const engine = f.makeEngine(content, { MutationObserver: false });
  const command = f.request({ timeout_ms: 1000 }); f.fast(command);
  const receipt = await submitted(f, engine, command); await f.clock.advance(1000);
  assert.equal(engine.observe(receipt).generation.started, false);
  assert.equal(engine.observe(receipt).ok, false); assert.equal(f.clicks, 1);
  engine.dispose();
}));

test('wrong-token reply remains rejected and cannot free the active page task for another send', async () => world(async (f, engine) => {
  const command = f.request();
  f.onClick = () => { f.user(command.text); f.editor.textContent = ''; f.start(); f.assistant(`${command.correlation_id}\nWRONG`); f.end(); };
  const receipt = await submitted(f, engine, command); await f.clock.advance(750);
  const result = engine.observe(receipt);
  assert.equal(result.ok, false); assert.equal(result.verdict.reason, 'reply_token_mismatch');
  assert.equal(result.observation.phase, 'REPLY_REJECTED');
  assert.equal(engine.submit(f.request({ task_id: 'new', operation_key: 'new', correlation_id: 'new' })).reason, 'turn_in_flight');
}));

test('settled snapshots are immutable copies and do not read a later unrelated reply', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command); await f.clock.advance(750);
  const first = engine.observe(receipt); first.envelope.payload.reply_text = 'caller mutation'; first.verdict.accepted = false;
  f.user('later unrelated turn'); f.assistant('later unrelated answer');
  const second = engine.observe(receipt);
  assert.equal(second.verdict.accepted, true); assert.notEqual(second.envelope.payload.reply_text, 'caller mutation');
  assert.ok(!second.envelope.payload.reply_text.includes('unrelated')); assert.equal(f.clicks, 1);
}));

test('page tombstones are bounded and never evicted to permit another submission', async () => world(async (f, engine) => {
  for (let i = 0; i < 64; i++) {
    f.button.disabled = false; f.editor.textContent = '';
    const command = f.request({ correlation_id: `correlation-${i}`, task_id: `task-${i}`, operation_key: `operation-${i}` });
    const pending = engine.submit(command); f.button.disabled = true;
    await f.clock.advance(400); assert.equal((await pending).submitted, false);
  }
  f.button.disabled = false; f.editor.textContent = '';
  const result = engine.submit(f.request({ operation_key: 'new', task_id: 'new', correlation_id: 'new' }));
  assert.equal(result.reason, 'page_task_store_full'); assert.equal(f.fills, 64); assert.equal(f.clicks, 0);
}));

test('fresh document/engine cannot resurrect completion from an idle matching transcript', async () => world(async (f, engine) => {
  const command = f.request(); f.fast(command);
  const receipt = await submitted(f, engine, command); await f.clock.advance(750);
  const fresh = f.makeEngine(content);
  assert.notEqual(fresh.pageInstanceId, engine.pageInstanceId);
  assert.equal(fresh.observe(receipt).ok, false);
  assert.equal(fresh.readFinal({ ...receipt, generation_complete: true, expected_reply_token: command.expected_reply_token }).ok, false);
  fresh.dispose();
}));

test('actual content port supports submit/observe and survives a disconnected submit requester without resending', async () => {
  const f = pageFixture(); f.installTimers();
  let module;
  try {
    module = await import(`../src/chatgpt/content.js?observer-port=${Date.now()}`);
    const command = f.request(); f.fast(command);
    const first = f.port(); first.ask({ action: 'submit-turn', ...command }); first.close();
    await f.clock.advance(400);
    const reconnect = f.port(); reconnect.ask({ action: 'submit-turn', ...command });
    const prior = reconnect.replies[0];
    assert.equal(prior.reason, 'operation_already_seen');
    reconnect.ask({ ...prior, action: 'observe-turn' });
    assert.equal(reconnect.replies[1].pending, true);
    await f.clock.advance(750);
    reconnect.ask({ ...prior, action: 'observe-turn' });
    assert.equal(reconnect.replies[2].verdict.accepted, true); assert.equal(f.clicks, 1);
    reconnect.ask({ ...prior, expected_reply_token: command.expected_reply_token, action: 'read-final', generation_complete: true });
    assert.equal(reconnect.replies[3].generation.asserted_by_caller, false);
    const fresh = await import(`../src/chatgpt/content.js?observer-fresh=${Date.now()}`);
    assert.equal(fresh.__testing.turnEngine.observe(prior).ok, false);
    fresh.__testing.turnEngine.dispose();
  } finally { module?.__testing.turnEngine.dispose(); f.restore(); }
});

test('genuine legacy content result still passes the current worker driver acceptance contract', async () => {
  const f = pageFixture(); f.installTimers(); let module;
  try {
    module = await import(`../src/chatgpt/content.js?legacy-contract=${Date.now()}`);
    const command = { ...f.request(), approved_scope_ref: 'existing-fixture-scope', tab_id: 7 }; f.fast(command);
    const bag = {};
    const api = { storage: { local: {
      async get(key) { return Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}; },
      async set(value) { Object.assign(bag, structuredClone(value)); },
    } }, tabs: {
      async query() { return [{ id: 7, url: 'https://chatgpt.com/c/fixture' }]; },
      connect() {
        const pagePort = f.port(), listeners = new Set();
        pagePort.onReply = (value) => { for (const fn of [...listeners]) fn(value); };
        return { onMessage: { addListener(fn) { listeners.add(fn); }, removeListener(fn) { listeners.delete(fn); } },
          onDisconnect: { addListener() {}, removeListener() {} },
          postMessage(value) { pagePort.ask(value); }, disconnect() { pagePort.close(); } };
      },
    } };
    const driver = createChatGPTPortDriver({ chrome: api, ...f.clock,
      digest: async (bytes) => createHash('sha256').update(bytes).digest() });
    const pending = driver.runTurn(command);
    await f.clock.advance(2000);
    const result = await pending;
    assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.captured, true);
    assert.equal(result.envelope.payload.expected_reply, command.expected_reply_token);
    assert.equal(result.envelope.payload.generation.complete, true); assert.equal(f.clicks, 1);
  } finally { module?.__testing.turnEngine.dispose(); f.restore(); }
});
