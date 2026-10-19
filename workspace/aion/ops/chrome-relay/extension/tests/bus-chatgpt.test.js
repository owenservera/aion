// ChatGPT.com pilot, offline: bus -> ChatGPT adapter -> REAL chatgpt-port driver
// -> REAL durable no-resend task store -> scripted page per tab.
//
// The page is a deterministic stand-in answering content.js receipt shapes
// (same as chatgpt-submit-observe.test.js). This proves the wiring and every
// failure mapping against the actual driver; it is NOT live ChatGPT evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { createChatGPTPortDriver, CHATGPT_ACTION } from '../src/background/chatgpt-port.js';
import { TASKS_KEY } from '../src/lib/chatgpt-tasks.js';
import { createBus } from '../src/bus/bus.js';
import { REASON } from '../src/bus/contracts.js';
import { createChatGPTAdapter, createDriverCall, canonicalChatGPTConversation, frameOutbound, mapDriverResult } from '../src/bus/adapters/chatgpt.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';

const T0 = Date.parse('2026-10-19T14:00:00.000Z');
const URLS = { cmd: 'https://chatgpt.com/c/commander-1', r06: 'https://chatgpt.com/c/toolsmith-6', r07: 'https://chatgpt.com/c/intake-7' };
const fence = (body) => `\`\`\`AION_CMD_V1\n${body}\n\`\`\``;

function receipt(action, identity, { terminal = false, extra = {} } = {}) {
  return { action, ok: terminal, ...identity,
    observation: { phase: terminal ? 'REPLY_CHECKED' : 'OBSERVING', click_attempted: true, submission_observed: true,
      generation_started: true, generation_complete: terminal, continuity: true, method: 'mutation-observer+poll', remaining_ms: terminal ? 0 : 4000, reason: terminal ? 'accepted' : null },
    click_attempted: true, submission_observed: true, submitted: true, uncertain: !terminal, pending: !terminal, ...extra };
}
function accepted(action, identity, message, answer) {
  const correlation = message.correlation_id;
  const token = message.expected_reply_token;
  const base = acceptedAdapterReply({ correlationId: correlation, token, replyText: `${correlation}\n${answer}\n${token}` });
  return receipt(action, identity, { terminal: true, extra: { verdict: base.verdict, envelope: base.envelope } });
}

/** A fake browser: tabs, one scripted page per tab, one durable storage bag. */
function browser({ tabs = [[7, URLS.cmd], [9, URLS.r06], [10, URLS.r07]], behaviour = {} } = {}) {
  const bag = {};
  const posted = [];
  const armed = new Map(); // correlation -> identity
  const pendingReplies = new Map();
  const tabList = () => tabs.map(([id, url]) => ({ id, url, windowId: 1, active: false, status: 'complete' }));
  const api = {
    storage: { local: {
      async get(key) { return Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}; },
      async set(value) { Object.assign(bag, structuredClone(value)); },
    } },
    tabs: {
      async query() { return tabList(); },
      connect(tabId) {
        const listeners = new Set();
        const url = tabs.find(([id]) => id === tabId)?.[1];
        const mode = behaviour[url] ?? 'accept';
        return {
          onMessage: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) },
          onDisconnect: { addListener() {}, removeListener() {} },
          disconnect() {},
          postMessage(message) {
            posted.push({ tabId, url, ...structuredClone(message) });
            const identity = { task_id: message.task_id, operation_key: message.operation_key, correlation_id: message.correlation_id,
              observer_id: `observer-${tabId}`, page_instance_id: `page-${tabId}` };
            let reply;
            if (message.action === CHATGPT_ACTION.PING) {
              reply = { action: message.action, ok: true, href: url,
                state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, sendControlCount: 1 } };
            } else if (message.action === CHATGPT_ACTION.SUBMIT_TURN) {
              armed.set(message.correlation_id, identity);
              if (mode === 'silent') return;
              if (mode === 'refuse') reply = { action: message.action, ok: false, reason: 'composer_unavailable', submitted: false, no_send: true };
              else if (mode === 'pending') { pendingReplies.set(message.correlation_id, message); reply = receipt(message.action, identity); }
              else if (mode === 'foreign') {
                const base = acceptedAdapterReply({ correlationId: 'AION-BUS-20261019-foreign000', token: message.expected_reply_token });
                reply = receipt(message.action, identity, { terminal: true, extra: { verdict: base.verdict, envelope: base.envelope } });
              } else reply = accepted(message.action, identity, message, `answer from ${url}`);
            } else if (message.action === CHATGPT_ACTION.OBSERVE_TURN) {
              const id = armed.get(message.correlation_id);
              const same = id && ['task_id', 'operation_key', 'observer_id', 'page_instance_id'].every((f) => message[f] === id[f]);
              if (!same) reply = { action: message.action, ok: false, reason: 'observer_identity_mismatch', read_only: true, uncertain: true };
              else if (pendingReplies.has(message.correlation_id)) {
                const original = pendingReplies.get(message.correlation_id);
                pendingReplies.delete(message.correlation_id);
                reply = accepted(message.action, id, original, `late answer from ${url}`);
              } else reply = receipt(message.action, id);
            }
            if (reply !== undefined) queueMicrotask(() => { for (const fn of [...listeners]) fn(reply); });
          },
        };
      },
    },
  };
  const driver = createChatGPTPortDriver({ chrome: api, timeouts: { submit: 300, observe: 300, read: 300 }, graceMs: 20,
    digest: async (bytes) => createHash('sha256').update(bytes).digest() });
  return { api, bag, posted, driver, submits: (url) => posted.filter((m) => m.action === CHATGPT_ACTION.SUBMIT_TURN && (!url || m.url === url)),
    task: (correlation) => Object.values(bag[TASKS_KEY]?.operations ?? {}).find((t) => t.correlation_id === correlation) };
}

async function world(browserOptions) {
  const b = browser(browserOptions);
  const storage = { bag: {}, async get(k) { return Object.hasOwn(this.bag, k) ? { [k]: structuredClone(this.bag[k]) } : {}; },
    async set(v) { Object.assign(this.bag, structuredClone(v)); } };
  let tick = 0, n = 0;
  const adapter = createChatGPTAdapter({ call: createDriverCall(b.driver, { policy: { grace: 20, setup: 20 } }), submitTimeoutMs: 300 });
  const bus = createBus({ storage, adapters: [adapter], now: () => new Date(T0 + (tick += 1000)).toISOString(),
    randomId: () => `cg${String(n += 1).padStart(10, '0')}` });
  await bus.bind('aion', { adapter: 'chatgpt.com', ref: `${URLS.cmd}?model=x#frag`, label: 'commander', confirmed_by: 'owner:test' });
  await bus.bind('role-06', { adapter: 'chatgpt.com', ref: URLS.r06, confirmed_by: 'owner:test' });
  await bus.bind('role-07', { adapter: 'chatgpt.com', ref: URLS.r07, confirmed_by: 'owner:test' });
  await bus.designateCommander('aion');
  await bus.grant({ grant_id: 'g-pilot', ref: 'owner pilot grant', agents: ['aion', 'role-06', 'role-07'], ops: ['send', 'status'],
    max_count: 20, rate_per_hour: 20, expires_utc: '2026-10-20T14:00:00.000Z' });
  let turn = 0;
  const say = (body) => bus.process({ source: { adapter: 'chatgpt.com', ref: URLS.cmd }, turn_sig: `turn-${turn += 1}`,
    user_head: 'AION> please', assistant_text: fence(body) });
  return { b, bus, say };
}
const send = (to, text, nonce) => `op: send\nto: ${to}\ntext: ${text}\nnonce: ${nonce}`;

test('pilot loop: commander -> two distinct ChatGPT conversations -> replies -> reports, one submit each', async () => {
  const { b, bus, say } = await world();
  const one = await say(send('role-06', 'Run node --test and report the count.', 'pilot-1'));
  assert.equal(one.dispatched.state, 'REPLY_CHECKED', JSON.stringify(one));
  assert.equal(one.dispatched.report.state, 'REPORTED');
  const two = await say(send('role-07', 'List open intake items.', 'pilot-2'));
  assert.equal(two.dispatched.report.state, 'REPORTED');

  assert.equal(b.submits(URLS.r06).length, 1);
  assert.equal(b.submits(URLS.r07).length, 1);
  assert.equal(b.submits(URLS.cmd).length, 2, 'two reports into the commander');
  const toAgent = b.submits(URLS.r06)[0];
  assert.equal(toAgent.text.split('\n')[0], toAgent.correlation_id, 'correlation is the first line');
  assert.match(toAgent.text, /Run node --test and report the count\./);
  assert.ok(toAgent.text.trimEnd().endsWith(`exactly ${toAgent.expected_reply_token}.`));
  assert.equal(toAgent.user_gesture, true);
  const task = b.task(toAgent.correlation_id);
  assert.equal(task.phase, 'REPLY_CHECKED');
  assert.equal(task.lock_active, false);
  assert.equal(task.approved_scope_ref, 'bus:g-pilot', 'the owner grant is recorded as the scope');
  assert.equal(task.target.role_id, '06');
  const report = b.submits(URLS.cmd)[0].text;
  assert.match(report, /AION_REPORT_V1/);
  assert.match(report, /answer from https:\/\/chatgpt\.com\/c\/toolsmith-6/);
  assert.ok(!report.split('\n')[0].startsWith('AION>'), 'report is not an armed turn');
  const s = await bus.status();
  assert.deepEqual(s.commands.filter((c) => c.op === 'send').map((c) => c.delivery), ['CONSUMED', 'CONSUMED']);
});

test('pending reply: observe-turn completes it read-only; still one submit', async () => {
  const { b, bus, say } = await world({ behaviour: { [URLS.r06]: 'pending' } });
  const r = await say(send('role-06', 'long task', 'pilot-p'));
  assert.equal(r.dispatched.state, 'SUBMISSION_OBSERVED');
  assert.equal(b.task(b.submits(URLS.r06)[0].correlation_id).lock_active, true);
  const o = await bus.observe(r.ingested.command_id);
  assert.equal(o.state, 'REPLY_CHECKED');
  assert.equal(o.report.state, 'REPORTED');
  assert.equal(b.submits(URLS.r06).length, 1);
});

test('page refusal before submit is a positive NOT_SENT and releases the lock', async () => {
  const { b, say } = await world({ behaviour: { [URLS.r06]: 'refuse' } });
  const r = await say(send('role-06', 'x', 'pilot-r'));
  assert.equal(r.dispatched.state, 'REJECTED');
  assert.equal(r.dispatched.reason, REASON.TARGET_REFUSED);
  const task = b.task(b.submits(URLS.r06)[0].correlation_id);
  assert.equal(task.phase, 'REFUSED_NO_SUBMIT');
});

test('silent page: OUTCOME_UNKNOWN, lock held, the next command is refused, nothing re-sent', async () => {
  const { b, bus, say } = await world({ behaviour: { [URLS.r06]: 'silent' } });
  const r = await say(send('role-06', 'x', 'pilot-s1'));
  assert.equal(r.dispatched.state, 'UNRESOLVED');
  assert.equal(b.task(b.submits(URLS.r06)[0].correlation_id).lock_active, true);
  assert.equal((await say(send('role-06', 'y', 'pilot-s2'))).ingested.reason, REASON.TARGET_BUSY);
  await bus.reconcile();
  assert.equal(b.submits(URLS.r06).length, 1);
  const c = (await bus.status()).commands.find((x) => x.command_id === r.ingested.command_id);
  assert.equal(c.delivery, 'OUTCOME_UNKNOWN');
});

test('foreign-correlation reply is not accepted and not reported', async () => {
  const { b, say } = await world({ behaviour: { [URLS.r06]: 'foreign' } });
  const r = await say(send('role-06', 'x', 'pilot-f'));
  assert.equal(r.dispatched.state, 'UNRESOLVED');
  assert.equal(b.submits(URLS.cmd).length, 0);
});

test('bound conversation not open: NOT_SENT, zero submits', async () => {
  const { b, say } = await world({ tabs: [[7, URLS.cmd], [10, URLS.r07]] });
  const r = await say(send('role-06', 'x', 'pilot-m'));
  assert.equal(r.dispatched.reason, REASON.BINDING_TARGET_MISSING);
  assert.equal(b.submits().length, 0);
});

test('two tabs on one conversation: BINDING_AMBIGUOUS, zero submits', async () => {
  const { b, say } = await world({ tabs: [[7, URLS.cmd], [9, URLS.r06], [12, `${URLS.r06}?x=1`]] });
  const r = await say(send('role-06', 'x', 'pilot-a'));
  assert.equal(r.dispatched.reason, REASON.BINDING_AMBIGUOUS);
  assert.equal(b.submits().length, 0);
});

test('tab navigated away from the bound conversation is never written into', async () => {
  const { b, say } = await world({ tabs: [[7, URLS.cmd], [9, 'https://chatgpt.com/c/something-else']] });
  const r = await say(send('role-06', 'x', 'pilot-n'));
  assert.equal(r.dispatched.reason, REASON.BINDING_TARGET_MISSING);
  assert.equal(b.submits().length, 0);
});

test('home/new-chat and foreign origins cannot be bound', () => {
  assert.throws(() => canonicalChatGPTConversation('https://chatgpt.com/'), /specific \/c\/<id>/);
  assert.throws(() => canonicalChatGPTConversation('https://chatgpt.com/g/g-x/project'), /specific/);
  assert.throws(() => canonicalChatGPTConversation('https://evil.example/c/1'), /not a chatgpt.com URL|specific/);
  assert.equal(canonicalChatGPTConversation('https://chatgpt.com/c/abc/?q=1#h'), 'https://chatgpt.com/c/abc');
});

test('outbound framing never begins with the arm token, for commands or reports', () => {
  for (const kind of ['command', 'report']) {
    const text = frameOutbound({ kind, correlation_id: 'AION-BUS-20261019-abcdef', reply_token: 'ACK-abcdef12', text: 'AION> hi', command_id: 'c1', agent: { name: 'x' } });
    assert.equal(text.split('\n')[0], 'AION-BUS-20261019-abcdef');
  }
});

test('driver result mapping is fail-closed', () => {
  assert.equal(mapDriverResult({}, 'submit').outcome, 'unknown');
  assert.equal(mapDriverResult({}, 'observe').outcome, 'pending');
  assert.equal(mapDriverResult({ ok: false, code: 'content_timeout', submitted: true, uncertain: true }, 'submit').reason, REASON.TIMEOUT);
  assert.equal(mapDriverResult({ ok: false, code: 'conversation_locked', submitted: false }, 'submit').reason, REASON.TARGET_BUSY);
  assert.equal(mapDriverResult({ ok: false, code: 'bad_argument', submitted: false, error: 'bad_argument: conversation key mismatch' }, 'submit').reason, REASON.WRONG_CONVERSATION);
  // A read-only poll with submitted:false but not turn_refused is NOT a no-send claim.
  assert.equal(mapDriverResult({ ok: false, code: 'observation_pending', submitted: false, read_only: true }, 'observe').outcome, 'pending');
  assert.equal(mapDriverResult({ ok: false, code: 'turn_refused', reason: 'generation_incomplete', submitted: true }, 'observe').reason, REASON.REPLY_PARTIAL);
  assert.equal(mapDriverResult({ ok: true, captured: true, envelope: { payload: {} } }, 'submit').reason, REASON.REPLY_PARTIAL);
});
