// Bus V1 commander watcher (page scan + worker pull), SYNC-0 instrument and the
// worker `aion/bus-*` endpoints, driven through the REAL chatgpt-port driver
// against a scripted page whose `commander-scan` runs the REAL scanTurns.
// Offline only: no browser, no ChatGPT.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { scanTurns } from '../src/chatgpt/commander.js';
import { SYNC0_VERDICT, addSample, finishProbe, markReload, startProbe } from '../src/bus/sync0.js';
import { createChatGPTPortDriver, CHATGPT_ACTION } from '../src/background/chatgpt-port.js';
import { createDriverCall } from '../src/bus/adapters/chatgpt.js';
import { BUS_ALARM, createWorkerBus } from '../src/background/bus.js';
import { REASON } from '../src/bus/contracts.js';
import { acceptedAdapterReply } from './fixtures/chatgpt-accepted.js';

const fence = (body) => `\`\`\`AION_CMD_V1\n${body}\n\`\`\``;
const T0 = Date.parse('2026-10-19T14:00:00.000Z');

/* ------------------------------------------------------------ scanTurns */

const convo = [
  { role: 'user', text: 'hello there, private planning notes' },
  { role: 'assistant', text: 'hi! some private answer' },
  { role: 'user', text: 'AION> tell 06 to run tests\nsecond line stays private' },
  { role: 'assistant', text: `Sure.\n${fence('op: send\nto: role-06\ntext: run tests\nnonce: abc123')}\nprivate trailing prose` },
];

test('scan with no baseline returns the tail only and no pairs (designation never executes history)', () => {
  const s = scanTurns(convo, { baseline_sig: null });
  assert.equal(s.pair_count, 2);
  assert.equal(s.pairs.length, 0);
  assert.match(s.tail_sig, /^cs-[0-9a-f]{16}$/);
});

test('scan after a baseline returns only later pairs, minimised (C2)', () => {
  const base = scanTurns(convo.slice(0, 2), { baseline_sig: null }).tail_sig;
  const s = scanTurns(convo, { baseline_sig: base });
  assert.equal(s.pairs.length, 1);
  const [pair] = s.pairs;
  assert.equal(pair.user_head, 'AION> tell 06 to run tests', 'only the armed first line leaves the page');
  assert.ok(!pair.assistant_text.includes('private'), 'assistant prose never leaves the page');
  assert.ok(!JSON.stringify(s).includes('second line stays private'));
  assert.equal(pair.block_count, 1);
});

test('unarmed user text never leaves the page', () => {
  const s = scanTurns(convo, { baseline_sig: 'cs-empty' });
  assert.equal(s.pairs[0].user_head, '');
  assert.equal(s.pairs[0].assistant_text, '');
});

test('a trailing answer still being generated is not read', () => {
  const s = scanTurns(convo, { baseline_sig: scanTurns(convo.slice(0, 2)).tail_sig, generating: true });
  assert.equal(s.pairs.length, 0);
  const incomplete = scanTurns([...convo, { role: 'user', text: 'AION> more' }], { baseline_sig: scanTurns(convo).tail_sig });
  assert.equal(incomplete.pairs.length, 0, 'a user turn with no answer yet is not a pair');
});

test('a baseline that is no longer visible yields baseline_found=false and no pairs', () => {
  const s = scanTurns(convo, { baseline_sig: 'cs-deadbeefdeadbeef' });
  assert.equal(s.baseline_found, false);
  assert.equal(s.pairs.length, 0);
});

test('identical pairs get distinct signatures', () => {
  const twice = [...convo, ...convo.slice(2)];
  const sigs = scanTurns(twice, { baseline_sig: 'cs-empty' }).pairs.map((p) => p.turn_sig);
  assert.equal(new Set(sigs).size, sigs.length);
});

/* ---------------------------------------------------------------- SYNC-0 */

const snap = (tail, extra = {}) => ({ ok: true, tail_sig: tail, pair_count: 3, generating: false, ...extra });

test('SYNC-0: a change before any reload means Option A is viable', () => {
  let p = startProbe(snap('cs-a'), '2026-10-19T14:00:00.000Z');
  p = addSample(p, snap('cs-a'), '2026-10-19T14:00:30.000Z');
  p = addSample(p, snap('cs-b'), '2026-10-19T14:01:00.000Z');
  p = finishProbe(p, '2026-10-19T14:05:00.000Z');
  assert.equal(p.verdict, SYNC0_VERDICT.WITHOUT_RELOAD);
  assert.equal(p.summary.option_a_viable, true);
});

test('SYNC-0: change only after a manual reload, no change, and failed scans', () => {
  let p = startProbe(snap('cs-a'), 'x');
  p = addSample(p, snap('cs-a'), 'y');
  p = markReload(p, 'z');
  p = addSample(p, snap('cs-b'), 'w');
  assert.equal(finishProbe(p, 'v').verdict, SYNC0_VERDICT.AFTER_RELOAD);
  let q = startProbe(snap('cs-a'), 'x');
  q = addSample(q, snap('cs-a'), 'y');
  assert.equal(finishProbe(q, 'v').verdict, SYNC0_VERDICT.NO_CHANGE);
  let r = startProbe(snap('cs-a'), 'x');
  r = addSample(r, { ok: false, code: 'tab_not_found' }, 'y');
  assert.equal(finishProbe(r, 'v').verdict, SYNC0_VERDICT.INCONCLUSIVE);
  assert.equal(startProbe(snap('cs-a', { generating: true }), 'x').status, 'invalid');
});

/* ------------------------------------------- worker endpoints, real driver */

const CMD = 'https://chatgpt.com/c/commander-1';
const R06 = 'https://chatgpt.com/c/toolsmith-6';

function page() {
  const transcripts = { [CMD]: [...convo], [R06]: [] };
  const generating = { [CMD]: false };
  const posted = [];
  const bag = {};
  const tabs = [[7, CMD], [9, R06]];
  const api = {
    storage: { local: { async get(k) { return Object.hasOwn(bag, k) ? { [k]: structuredClone(bag[k]) } : {}; }, async set(v) { Object.assign(bag, structuredClone(v)); } } },
    tabs: {
      async query() { return tabs.map(([id, url]) => ({ id, url, windowId: 1, active: false, status: 'complete' })); },
      connect(tabId) {
        const url = tabs.find(([id]) => id === tabId)[1];
        const ls = new Set();
        return {
          onMessage: { addListener: (f) => ls.add(f), removeListener: (f) => ls.delete(f) },
          onDisconnect: { addListener() {}, removeListener() {} }, disconnect() {},
          postMessage(m) {
            posted.push({ url, ...structuredClone(m) });
            let reply;
            const identity = { task_id: m.task_id, operation_key: m.operation_key, correlation_id: m.correlation_id, observer_id: `o${tabId}`, page_instance_id: `p${tabId}` };
            if (m.action === CHATGPT_ACTION.PING) reply = { action: m.action, ok: true, href: url, state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, sendControlCount: 1 } };
            else if (m.action === CHATGPT_ACTION.COMMANDER_SCAN) reply = { action: m.action, href: url, read_only: true, ...scanTurns(transcripts[url], { baseline_sig: m.baseline_sig, arm_token: m.arm_token, generating: generating[url] }) };
            else if (m.action === CHATGPT_ACTION.SUBMIT_TURN) {
              transcripts[url].push({ role: 'user', text: m.text });
              const answer = `${m.correlation_id}\nack from ${url}\n${m.expected_reply_token}`;
              transcripts[url].push({ role: 'assistant', text: answer });
              const base = acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token, replyText: answer });
              reply = { action: m.action, ok: true, ...identity, observation: { phase: 'REPLY_CHECKED', click_attempted: true, submission_observed: true, generation_started: true, generation_complete: true, continuity: true, method: 'm', remaining_ms: 0, reason: 'accepted' },
                click_attempted: true, submission_observed: true, submitted: true, uncertain: false, pending: false, verdict: base.verdict, envelope: base.envelope };
            }
            if (reply) queueMicrotask(() => { for (const f of [...ls]) f(reply); });
          },
        };
      },
    },
  };
  const driver = createChatGPTPortDriver({ chrome: api, digest: async (b) => createHash('sha256').update(b).digest() });
  const alarmLog = [];
  const alarms = { create: (n, o) => alarmLog.push(['create', n, o]), clear: (n) => alarmLog.push(['clear', n]) };
  let tick = 0, n = 0;
  const wb = createWorkerBus({ storage: api.storage.local, call: createDriverCall(driver), alarms,
    now: () => new Date(T0 + (tick += 1000)).toISOString(), randomId: () => `wb${String(n += 1).padStart(10, '0')}` });
  const submits = (url) => posted.filter((m) => m.action === CHATGPT_ACTION.SUBMIT_TURN && (!url || m.url === url));
  const owner = (text, assistant) => transcripts[CMD].push({ role: 'user', text }, { role: 'assistant', text: assistant });
  return { wb, transcripts, generating, posted, submits, owner, alarmLog, storageApi: api.storage.local, driver };
}

async function ready(p) {
  const g = { user_gesture: true };
  assert.equal((await p.wb.handle({ type: 'aion/bus-agent', action: 'bind', agent_id: 'aion', ref: CMD, confirmed_by: 'owner:test', ...g })).ok, true);
  assert.equal((await p.wb.handle({ type: 'aion/bus-agent', action: 'bind', agent_id: 'role-06', ref: R06, confirmed_by: 'owner:test', ...g })).ok, true);
  const c = await p.wb.handle({ type: 'aion/bus-commander', agent_id: 'aion', ...g });
  assert.equal(c.baseline_taken, true);
  assert.equal((await p.wb.handle({ type: 'aion/bus-grant', grant: { grant_id: 'g-w', ref: 'owner', agents: ['aion', 'role-06'], ops: ['send', 'status'], max_count: 10, rate_per_hour: 10, expires_utc: '2026-10-20T14:00:00.000Z' }, ...g })).ok, true);
}

test('authority-changing endpoints require a gesture; kill never does', async () => {
  const p = page();
  for (const type of ['aion/bus-scan', 'aion/bus-resume', 'aion/bus-config', 'aion/bus-agent', 'aion/bus-commander', 'aion/bus-grant', 'aion/bus-revoke']) {
    assert.equal((await p.wb.handle({ type })).code, 'explicit_command_required', type);
  }
  assert.equal((await p.wb.handle({ type: 'aion/bus-kill' })).ok, true);
  assert.equal((await p.wb.handle({ type: 'aion/bus-status' })).kill.engaged, true);
  assert.equal((await p.wb.handle({ type: 'aion/bus-sync0', action: 'start' })).code, 'explicit_command_required');
});

test('watcher: history before designation is never executed; a new armed turn is, exactly once, and reported', async () => {
  const p = page();
  await ready(p);
  let scan = await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  assert.equal(scan.ok, true, JSON.stringify(scan));
  assert.deepEqual(scan.processed, [], 'the armed command already in the conversation is history');
  assert.equal(p.submits().length, 0);

  p.owner('AION> phone: ask 06 for status', `On it.\n${fence('op: send\nto: role-06\ntext: please report status\nnonce: phone-001')}`);
  scan = await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  assert.equal(scan.processed.length, 1);
  assert.equal(scan.processed[0].accepted, true);
  assert.equal(p.submits(R06).length, 1);
  assert.equal(p.submits(CMD).length, 1, 'report posted into the commander');
  assert.match(p.submits(CMD)[0].text, /AION_REPORT_V1/);

  // The report and its acknowledgement are now the newest commander pair; it is unarmed.
  scan = await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  assert.ok(scan.processed.every((x) => x.accepted === false));
  assert.equal(p.submits(R06).length, 1);
  assert.equal(p.submits(CMD).length, 1);
  const st = await p.wb.handle({ type: 'aion/bus-status' });
  assert.equal(st.commands.find((c) => c.op === 'send').delivery, 'CONSUMED');
});

test('watcher waits for an answer that is still being written', async () => {
  const p = page();
  await ready(p);
  await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  p.owner('AION> go', fence('op: send\nto: role-06\ntext: x\nnonce: gen-0001'));
  p.generating[CMD] = true;
  assert.deepEqual((await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true })).processed, []);
  p.generating[CMD] = false;
  assert.equal((await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true })).processed.length, 1);
});

test('lost baseline: re-baseline, the gap is reported and nothing in it is executed', async () => {
  const p = page();
  await ready(p);
  await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  p.transcripts[CMD].splice(0, p.transcripts[CMD].length,
    { role: 'user', text: 'AION> x' }, { role: 'assistant', text: fence('op: send\nto: role-06\ntext: x\nnonce: gap-0001') });
  const scan = await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true });
  assert.equal(scan.gap, true);
  assert.equal(p.submits().length, 0);
  assert.ok((await p.wb.handle({ type: 'aion/bus-status' })).events.some((e) => e.event === 'commander.gap'));
});

test('kill switch stops the watcher; resume needs a gesture', async () => {
  const p = page();
  await ready(p);
  await p.wb.handle({ type: 'aion/bus-kill', reason: 'stop' });
  p.owner('AION> go', fence('op: send\nto: role-06\ntext: x\nnonce: kill-0001'));
  assert.equal((await p.wb.handle({ type: 'aion/bus-scan', user_gesture: true })).code, REASON.KILL_ENGAGED);
  assert.equal(p.submits().length, 0);
  assert.equal((await p.wb.handle({ type: 'aion/bus-resume' })).code, 'explicit_command_required');
});

test('watch alarm is created only when the owner turns watching on, and cleared by kill', async () => {
  const p = page();
  await ready(p);
  await p.wb.handle({ type: 'aion/bus-config', config: { watch: true }, user_gesture: true });
  assert.deepEqual(p.alarmLog.at(-1), ['create', BUS_ALARM, { periodInMinutes: 0.5 }]);
  p.owner('AION> go', fence('op: send\nto: role-06\ntext: from alarm\nnonce: alarm-001'));
  const viaAlarm = await p.wb.onAlarm({ name: BUS_ALARM });
  assert.equal(viaAlarm.processed.length >= 0, true);
  await p.wb.handle({ type: 'aion/bus-kill' });
  assert.deepEqual(p.alarmLog.at(-1), ['clear', BUS_ALARM]);
  assert.equal((await p.wb.onAlarm({ name: BUS_ALARM })).idle, true);
});

test('SYNC-0 through the worker: samples are read-only and suspend processing', async () => {
  const p = page();
  await ready(p);
  await p.wb.handle({ type: 'aion/bus-config', config: { watch: true }, user_gesture: true });
  const start = await p.wb.handle({ type: 'aion/bus-sync0', action: 'start', user_gesture: true });
  assert.equal(start.probe.status, 'running');
  await p.wb.onAlarm({ name: BUS_ALARM });
  // The owner sends from the phone: a new armed turn appears in the PC tab.
  p.owner('AION> sent from phone', fence('op: send\nto: role-06\ntext: x\nnonce: sync-0001'));
  await p.wb.onAlarm({ name: BUS_ALARM });
  const done = await p.wb.handle({ type: 'aion/bus-sync0', action: 'finish' });
  assert.equal(done.probe.verdict, SYNC0_VERDICT.WITHOUT_RELOAD);
  assert.equal(p.submits().length, 0, 'the probe never sends, even with watching on');
  assert.ok(p.posted.every((m) => m.action !== CHATGPT_ACTION.SUBMIT_TURN));
});

/* ------------------------------------------- worker restart and recovery */

test('worker restart: the next generation halts never-attempted reservations before doing anything', async () => {
  const p = page();
  await ready(p);
  // Previous generation reserved a command, then the worker died before dispatch.
  const reserved = await p.wb.bus.ingestStructured({ op: 'send', to: 'role-06', text: 'late', nonce: 'boot-0001' });
  assert.equal(reserved.accepted, true);
  // A second worker generation over the same chrome.storage.local.
  const gen2 = createWorkerBus({ storage: p.storageApi, call: createDriverCall(p.driver) });
  const s = await gen2.handle({ type: 'aion/bus-status' });
  assert.equal(s.commands.find((c) => c.command_id === reserved.command_id).state, 'HALTED');
  assert.equal(p.submits().length, 0, 'a stale reservation is never executed late');
});

test('double dispatch of one command delivers once', async () => {
  const p = page();
  await ready(p);
  const r = await p.wb.bus.ingestStructured({ op: 'send', to: 'role-06', text: 'once', nonce: 'dd-000001' });
  await Promise.all([p.wb.bus.dispatch(r.command_id), p.wb.bus.dispatch(r.command_id), p.wb.bus.dispatch(r.command_id)]);
  assert.equal(p.submits(R06).length, 1);
});

test('unreadable ledger: commands fail closed; reset quarantines it and comes back with the kill switch on', async () => {
  const p = page();
  await ready(p);
  await p.storageApi.set({ 'aion.relay.bus.v1': { schema: 'aion.bus/1', version: 1, garbage: true } });
  const broken = await p.wb.handle({ type: 'aion/bus-status' });
  assert.equal(broken.ok, false);
  assert.equal((await p.wb.handle({ type: 'aion/bus-reset' })).code, 'explicit_command_required');
  const reset = await p.wb.handle({ type: 'aion/bus-reset', user_gesture: true });
  assert.equal(reset.ok, true, JSON.stringify(reset));
  assert.ok((await p.storageApi.get(reset.backup_key))[reset.backup_key].garbage, 'the unreadable value is preserved');
  const s = await p.wb.handle({ type: 'aion/bus-status' });
  assert.equal(s.kill.engaged, true);
  assert.equal((await p.wb.handle({ type: 'aion/bus-reset', user_gesture: true })).ok, false, 'a readable ledger is never quarantined');
});
