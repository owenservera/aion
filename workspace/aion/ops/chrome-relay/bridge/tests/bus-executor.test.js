// Bus V2 end to end, offline: bus -> ACP executor adapter -> REAL native host
// (in-process) -> REAL ACP client -> fake ACP agent child (stands in for
// `opencode acp`). Commander is the fake non-ChatGPT provider, so this also
// shows the core is provider-neutral. NOT evidence about real OpenCode.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';

import { createConfig } from '../src/config.js';
import { createInProcessRelay } from '../src/bus-relay.js';
import { createBus } from '../../extension/src/bus/bus.js';
import { REASON } from '../../extension/src/bus/contracts.js';
import { createAcpExecutorAdapter } from '../../extension/src/bus/adapters/acp-executor.js';
import { createExampleChat } from '../../extension/tests/fixtures/bus-example-chat.js';
import { memoryStorage } from '../../extension/tests/fixtures/bus-memory.js';

const slash = (v) => String(v).split(String.fromCharCode(92)).join('/');
const FAKE_AGENT = slash(fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url)));
const CWD = slash(join(tmpdir(), 'aion-bus-executor-cwd'));
const OTHER_CWD = slash(join(tmpdir(), 'aion-bus-executor-other'));
mkdirSync(CWD, { recursive: true });
mkdirSync(OTHER_CWD, { recursive: true });
const T0 = Date.parse('2026-10-19T14:00:00.000Z');

async function world({ requestTimeoutMs = 10_000, grantCwd = CWD, ops = ['send', 'status'] } = {}) {
  const config = createConfig({ expectedExtensionId: 'kgjfielmhcdlggjppmliabpiljnonhki', agentPath: slash(process.execPath),
    agentArgs: [FAKE_AGENT], sessionCwd: CWD, logLevel: 'error',
    timeouts: { spawnMs: 10_000, requestMs: 10_000, initializeMs: 10_000, promptMs: 0 } });
  const relay = createInProcessRelay({ config, requestTimeoutMs });
  const chat = createExampleChat();
  const acp = createAcpExecutorAdapter({ relay });
  let tick = 0, n = 0;
  const storage = memoryStorage();
  const make = (adapter = acp) => createBus({ storage, adapters: [chat, adapter], now: () => new Date(T0 + (tick += 1000)).toISOString(),
    randomId: () => `ex${String(n += 1).padStart(10, '0')}`, initialConfig: { ops_enabled: ops } });
  const bus = make();
  await bus.bind('aion', { adapter: 'example-chat', ref: 'example://room/commander', confirmed_by: 'owner:test' });
  await bus.bind('opencode', { adapter: 'acp', ref: 'OpenCode', confirmed_by: 'owner:test' });
  await bus.designateCommander('aion');
  await bus.grant({ grant_id: 'g-exec', ref: 'owner executor grant', agents: ['aion', 'opencode'], ops: ['send', 'status', 'cancel'],
    max_count: 20, rate_per_hour: 20, expires_utc: '2026-10-20T14:00:00.000Z', cwd: grantCwd });
  let turn = 0;
  const say = (body) => bus.process({ source: { adapter: 'example-chat', ref: 'example://room/commander' }, turn_sig: `turn-${turn += 1}`,
    user_head: 'AION> go', assistant_text: `\`\`\`AION_CMD_V1\n${body}\n\`\`\`` });
  return { relay, chat, acp, bus, make, say, storage };
}
const send = (text, nonce) => `op: send\nto: opencode\ntext: ${text}\nnonce: ${nonce}`;
const until = async (fn, ms = 5000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v || Date.now() > end) return v; await new Promise((r) => setTimeout(r, 20)); } };

test('commander -> fake OpenCode ACP executor -> executor text -> report into the commander', async (t) => {
  const w = await world();
  t.after(() => w.relay.close());
  const r = await w.say(send('list the open worktrees', 'exec-0001'));
  assert.equal(r.dispatched.state, 'REPLY_CHECKED', JSON.stringify(r));
  assert.equal(r.dispatched.report.state, 'REPORTED');
  const report = w.chat.rooms.get('example://room/commander').inbox[0];
  assert.match(report, /echo: list the open worktrees/, 'the agent_message_chunk text is carried');
  assert.match(report, /stop_reason=end_turn; an executor statement, not verified proof/);
  assert.match(report, /AION bus command ex\d+/);
});

test('executor refusal stop reason is reported as the executor said it, not as success', async (t) => {
  const w = await world();
  t.after(() => w.relay.close());
  const r = await w.say(send('please REFUSE this', 'exec-0002'));
  assert.equal(r.dispatched.state, 'REPLY_CHECKED');
  assert.match(w.chat.rooms.get('example://room/commander').inbox[0], /stop_reason=refusal/);
});

test('grant cwd outside the host allowlist: host refuses before storing; NOT_SENT', async (t) => {
  const w = await world({ grantCwd: OTHER_CWD });
  t.after(() => w.relay.close());
  const r = await w.say(send('anything', 'exec-0003'));
  assert.equal(r.dispatched.state, 'REJECTED');
  assert.equal(r.dispatched.reason, REASON.GRANT_SCOPE);
  const c = (await w.bus.status()).commands.find((x) => x.command_id === r.ingested.command_id);
  assert.equal(c.delivery, 'NOT_SENT');
});

test('long turn: native request times out -> OUTCOME_UNKNOWN; second command busy; cancel; late terminal observed', async (t) => {
  const w = await world({ requestTimeoutMs: 400, ops: ['send', 'status', 'cancel'] });
  t.after(() => w.relay.close());
  // Exercise a held prompt's timeout, not cold-start/session initialization latency.
  await w.relay.host.ensureSession();
  const r = await w.say(send('HOLD this one open', 'exec-0004'));
  assert.equal(r.dispatched.state, 'UNRESOLVED');
  assert.equal(r.dispatched.reason, REASON.TIMEOUT);
  assert.equal((await w.say(send('another', 'exec-0005'))).ingested.reason, REASON.EXECUTOR_BUSY);
  const c = await w.say('op: cancel\nto: opencode\nnonce: exec-0006');
  assert.equal(c.ingested.accepted, true, JSON.stringify(c.ingested));
  assert.equal(c.dispatched.state, 'REPLY_CHECKED', 'the cancel REQUEST was delivered');
  // No manual observe: the late terminal is persisted by the adapter's onSettled hook.
  const observed = await until(async () => { const c = await w.bus.readCommand(r.ingested.command_id); return ['REPLY_CHECKED', 'REPORTED'].includes(c.state) ? c : null; });
  assert.ok(observed, 'the cancelled terminal arrived after the timeout and was persisted without a manual observe');
  const inbox = w.chat.rooms.get('example://room/commander').inbox;
  assert.ok(inbox.some((x) => /stop_reason=cancelled/.test(x)));
});

test('agent crash mid-prompt is OUTCOME_UNKNOWN, never retried', async (t) => {
  const w = await world();
  t.after(() => w.relay.close());
  const r = await w.say(send('CRASH now', 'exec-0007'));
  assert.equal(r.dispatched.state, 'UNRESOLVED');
  await w.bus.reconcile();
  const c = (await w.bus.status()).commands.find((x) => x.command_id === r.ingested.command_id);
  assert.equal(c.delivery, 'OUTCOME_UNKNOWN');
});

test('restart loses the in-memory stream: the command honestly stays unknown', async (t) => {
  const w = await world({ requestTimeoutMs: 300 });
  t.after(() => w.relay.close());
  const r = await w.say(send('HOLD forever', 'exec-0008'));
  assert.equal(r.dispatched.state, 'UNRESOLVED');
  const fresh = createAcpExecutorAdapter({ relay: w.relay });
  const restarted = w.make(fresh);
  const rec = await restarted.reconcile();
  assert.equal(rec.observed[0].state, 'UNRESOLVED');
  assert.equal(rec.observed[0].changed, false);
});

test('the host deduplicates by idempotency key: a replayed envelope is never executed twice', async (t) => {
  const w = await world();
  t.after(() => w.relay.close());
  const r = await w.say(send('once only', 'exec-0009'));
  assert.equal(r.dispatched.state, 'REPLY_CHECKED');
  // Hand-craft the same envelope again at the relay: host answers replayed.
  const { createEnvelope } = await import('../../extension/src/lib/envelope.js');
  const env = createEnvelope({ event_type: 'task.approved', task_state: 'APPROVED', producer_node: 'node-ext-bus', target_node: 'node-native-01', correlation_id: 'AION-BUS-20261019-replay', idempotency_key: `bus:${r.ingested.command_id}`,
    payload: { text: 'once only', cwd: CWD } });
  const reply = await w.relay.sendEnvelope(env);
  assert.equal(reply.replayed, true);
});
