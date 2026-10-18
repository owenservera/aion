// View model for the human panel and the machine view.
//
// Node built-ins only. These tests pin the pure logic to the real code it
// describes: the panel's validation constants, the worker's endpoint tables and
// the correlation rules that decide whether a reply is accepted.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACTION_CATALOG,
  FALLBACK_MODES,
  IDENTIFIER_PATTERN,
  MAX_PROMPT_LENGTH,
  READING_RULES,
  SNAPSHOT_SCHEMA,
  UNKNOWN,
  classifyTransport,
  diffSnapshots,
  generateProbeSet,
  nextStep,
  readStatus,
  reviewSummary,
  snapshotFromStatus,
  snapshotJson,
  snapshotRows,
  stateLine,
  starterMessage
} from '../src/panel/view-model.js';
import { correlateReply } from '../src/chatgpt/correlate.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const panelSource = readFileSync(resolve(root, 'src/panel/panel.js'), 'utf8');
const workerSource = readFileSync(resolve(root, 'src/background/service-worker.js'), 'utf8');

const NOW = Date.UTC(2026, 9, 18, 13, 0, 0);

const OBSERVED = {
  observed: true,
  observed_at: '2026-10-18T12:59:58.000Z',
  relay: { status: 'CONNECTED', name: 'native', enabled: true, detail: 'ok', boot_count: 3, worker_started_at: '2026-10-18T12:00:00.000Z' },
  fallback: { mode: 'A', reason: 'native host answered' },
  proof: { last_evidence_at: null },
  outbox: { count: 0, cursor: 7 },
  approval: { pending: 0 }
};

/* ------------------------------------------------------------------ *
 * Pinned to the code this describes
 * ------------------------------------------------------------------ */

test('validation constants match the panel exactly', () => {
  const pattern = panelSource.match(/const IDENTIFIER_PATTERN = (\/.*\/);/)[1];
  assert.equal(IDENTIFIER_PATTERN.toString(), pattern);
  assert.equal(MAX_PROMPT_LENGTH, Number(panelSource.match(/const MAX_PROMPT_LENGTH = (\d+);/)[1]));
});

test('fallback modes match the panel', () => {
  for (const [code, name] of Object.entries(FALLBACK_MODES)) {
    assert.match(panelSource, new RegExp(`${code}: '${name}'`));
  }
});

test('the catalog lists exactly the worker endpoints, no more and no fewer', () => {
  const tableKeys = (name) => {
    const block = workerSource.match(new RegExp(`const ${name} = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`))[1];
    return [...block.matchAll(/'(aion\/[a-z-]+)'/g)].map((m) => m[1]);
  };
  const real = new Set([...tableKeys('NATIVE_ENDPOINTS'), ...tableKeys('CHATGPT_ENDPOINTS'), 'aion/status', 'aion/refresh']);
  assert.deepEqual(new Set(ACTION_CATALOG.map((a) => a.type)), real);
});

test('only the read-only status message may be called from the machine view', () => {
  const callable = ACTION_CATALOG.filter((a) => a.machine_view);
  assert.deepEqual(callable.map((a) => a.type), ['aion/status']);
  assert.equal(callable[0].kind, 'status');
  // Anything that probes or sends is never machine-callable.
  for (const action of ACTION_CATALOG.filter((a) => a.kind !== 'status')) assert.equal(action.machine_view, false);
});

test('classifyTransport agrees with the panel on the words it knows', () => {
  for (const [word, expected] of [
    ['CONNECTED', 'live'], ['FAILED', 'stopped'], ['DEGRADED', 'degraded'], ['DISABLED', 'degraded'],
    ['UNKNOWN', 'unknown'], ['', 'unknown'], ['mystery', 'known']
  ]) {
    assert.equal(classifyTransport(word), expected, word);
  }
});

/* ------------------------------------------------------------------ *
 * Snapshot
 * ------------------------------------------------------------------ */

test('an unobserved snapshot says UNKNOWN everywhere and says why', () => {
  const snap = snapshotFromStatus({ observed: false, error: 'Service worker did not answer within 3s.' }, NOW);
  assert.equal(snap.schema, SNAPSHOT_SCHEMA);
  assert.equal(snap.observed, false);
  assert.equal(snap.problem, 'Service worker did not answer within 3s.');
  assert.equal(snap.link.transport, UNKNOWN);
  assert.equal(snap.mode.code, UNKNOWN);
  assert.equal(snap.approval.state, UNKNOWN);
  assert.equal(snap.proof.state, UNKNOWN);
  assert.equal(snap.outbox.queued, UNKNOWN);
  assert.equal(snap.link.adapter_enabled, UNKNOWN);
  assert.equal(stateLine(snap), 'HOST_LINK=UNKNOWN MODE=UNKNOWN APPROVALS=UNKNOWN PROOF=UNKNOWN OUTBOX=UNKNOWN');
});

test('a null or empty status is also UNKNOWN, never a guess', () => {
  for (const input of [null, undefined, {}, { observed: 'yes' }]) {
    const snap = snapshotFromStatus(input, NOW);
    assert.equal(snap.observed, false);
    assert.equal(snap.link.transport, UNKNOWN);
    assert.equal(snap.outbox.queued, UNKNOWN);
  }
});

test('unread counts are UNKNOWN, not 0, but a real 0 stays 0', () => {
  const missing = snapshotFromStatus({ observed: true, observed_at: 'x' }, NOW);
  assert.equal(missing.outbox.queued, UNKNOWN);
  assert.equal(missing.approval.pending, UNKNOWN);
  assert.equal(missing.approval.state, UNKNOWN);

  const real = snapshotFromStatus(OBSERVED, NOW);
  assert.equal(real.outbox.queued, 0);
  assert.equal(real.approval.pending, 0);
  assert.equal(real.approval.state, 'CLEAR');
});

test('held approvals are HELD, and proof keeps its own state apart from transport', () => {
  const held = snapshotFromStatus({ ...OBSERVED, approval: { pending: 2 } }, NOW);
  assert.equal(held.approval.state, 'HELD');
  assert.equal(held.approval.pending, 2);

  // A connected transport says nothing about proof.
  const connected = snapshotFromStatus(OBSERVED, NOW);
  assert.equal(connected.link.transport_class, 'live');
  assert.equal(connected.proof.state, 'NONE_OBSERVED');

  const withEvidence = snapshotFromStatus({ ...OBSERVED, proof: { last_evidence_at: '2026-10-18T12:00:00Z' } }, NOW);
  assert.equal(withEvidence.proof.state, 'EVENT_OBSERVED_NOT_VERIFIED');
  assert.notEqual(withEvidence.proof.state, 'VERIFIED');
});

test('an unknown mode code is UNKNOWN rather than passed through', () => {
  const snap = snapshotFromStatus({ ...OBSERVED, fallback: { mode: 'Z', reason: 'x' } }, NOW);
  assert.equal(snap.mode.code, UNKNOWN);
  assert.equal(snap.mode.name, UNKNOWN);
});

test('diffSnapshots ignores clocks and reports real changes', () => {
  const a = snapshotFromStatus(OBSERVED, NOW);
  const b = snapshotFromStatus({ ...OBSERVED, observed_at: 'later', relay: { ...OBSERVED.relay, status: 'DEGRADED' } }, NOW + 5000);
  assert.deepEqual(diffSnapshots(null, a), []);
  assert.deepEqual(diffSnapshots(a, a), []);
  const changes = diffSnapshots(a, b);
  assert.ok(changes.some((c) => c.path === 'link.transport' && c.from === 'CONNECTED' && c.to === 'DEGRADED'));
  assert.ok(changes.every((c) => c.path !== 'taken_at' && c.path !== 'observed_at'));
});

test('snapshot JSON can never close a surrounding script element', () => {
  const snap = snapshotFromStatus({ ...OBSERVED, relay: { ...OBSERVED.relay, detail: '</script><img src=x>' } }, NOW);
  const text = snapshotJson(snap);
  assert.equal(text.includes('</script>'), false);
  assert.equal(text.includes('<'), false);
  assert.equal(JSON.parse(text).link.detail, '</script><img src=x>');
});

test('snapshotRows lists every leaf with a dotted path', () => {
  const rows = snapshotRows(snapshotFromStatus(OBSERVED, NOW));
  const paths = rows.map((r) => r.path);
  assert.ok(paths.includes('link.transport'));
  assert.ok(paths.includes('approval.state'));
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(rows.find((r) => r.path === 'problem').value, 'none');
});

test('the reading rules keep the distinctions that matter', () => {
  const all = READING_RULES.join(' ');
  for (const phrase of ['UNKNOWN', 'tab', 'HELD', 'not a proof receipt', 'cannot send']) {
    assert.ok(all.includes(phrase), phrase);
  }
});

/* ------------------------------------------------------------------ *
 * readStatus: read only, and honest when nothing answers
 * ------------------------------------------------------------------ */

function fakeRuntime(behaviour) {
  const sent = [];
  return {
    sent,
    id: 'ext-id',
    lastError: undefined,
    sendMessage(message, callback) {
      sent.push(message);
      behaviour(callback, this);
    }
  };
}

test('readStatus posts exactly one read-only status message', async () => {
  const runtime = fakeRuntime((cb) => cb(OBSERVED));
  const reply = await readStatus(runtime);
  assert.deepEqual(runtime.sent, [{ type: 'aion/status' }]);
  assert.equal(reply.observed, true);
});

test('readStatus reports absence as unobserved, never as idle', async () => {
  const none = await readStatus(null);
  assert.equal(none.observed, false);

  const failing = fakeRuntime((cb, rt) => {
    rt.lastError = { message: 'boom' };
    cb(undefined);
  });
  assert.match((await readStatus(failing)).error, /boom/);

  const refused = fakeRuntime((cb) => cb({ observed: false, error: 'SENDER_UNTRUSTED: sender_is_a_tab' }));
  assert.match((await readStatus(refused)).error, /sender_is_a_tab/);

  const throwing = { id: 'x', sendMessage() { throw new Error('nope'); } };
  assert.match((await readStatus(throwing)).error, /nope/);
});

test('readStatus times out through the injected timer', async () => {
  let fire;
  const runtime = fakeRuntime(() => {});
  const pending = readStatus(runtime, { setTimeout: (fn) => { fire = fn; return 1; }, clearTimeout() {} });
  fire();
  const reply = await pending;
  assert.equal(reply.observed, false);
  assert.match(reply.error, /unknown, not idle/);
});

/* ------------------------------------------------------------------ *
 * nextStep: guidance derived from what is already on the page
 * ------------------------------------------------------------------ */

const READY = {
  hostState: 'ok', tabsListed: 1, tabSelected: true, tabState: 'ok',
  hasText: true, correlationValid: true, tokenValid: true, confirmed: true, armed: true, probePhase: 'clear'
};

test('nextStep walks the path in order', () => {
  const id = (patch) => nextStep({ ...READY, ...patch }).id;
  assert.equal(nextStep({}).id, 'check-host');
  assert.equal(id({ hostState: undefined }), 'check-host');
  assert.equal(id({ tabsListed: 0, tabSelected: false }), 'find-tabs');
  assert.equal(id({ tabSelected: false }), 'choose-tab');
  assert.equal(id({ hasText: false, confirmed: false, armed: false }), 'write-message');
  assert.equal(id({ tokenValid: false, confirmed: false, armed: false }), 'fill-ids');
  assert.equal(id({ confirmed: false, armed: false }), 'confirm');
  assert.equal(id({ armed: false }), 'blocked');
  assert.equal(id({}), 'ready');
});

test('failures are surfaced and an unsettled probe takes priority', () => {
  assert.equal(nextStep({ ...READY, hostState: 'error' }).id, 'host-needs-attention');
  assert.equal(nextStep({ ...READY, hostState: 'warn' }).id, 'host-needs-attention');
  assert.equal(nextStep({ ...READY, tabState: 'error' }).id, 'tab-needs-attention');
  assert.equal(nextStep({ ...READY, probePhase: 'unknown' }).id, 'probe-unsettled');
  assert.equal(nextStep({ ...READY, probePhase: 'unknown' }).target, 'btn-probe-reconcile');
});

test('nextStep says ready only when the run button is open AND the person confirmed', () => {
  const flags = [true, false];
  for (const confirmed of flags) for (const armed of flags) for (const hasText of flags) for (const phase of ['clear', 'unknown', 'settled']) {
    const step = nextStep({ ...READY, confirmed, armed, hasText, probePhase: phase });
    if (step.id === 'ready') {
      assert.ok(confirmed && armed && hasText && phase !== 'unknown');
    }
  }
});

test('nextStep never describes the relay as working', () => {
  for (const patch of [{}, { hostState: undefined }, { tabsListed: 0 }, { confirmed: false }]) {
    const { text } = nextStep({ ...READY, ...patch });
    assert.doesNotMatch(text, /\b(working|healthy|running|connected|verified|success)\b/i);
  }
});

/* ------------------------------------------------------------------ *
 * Generated ids and the starter message
 * ------------------------------------------------------------------ */

const fixedBytes = (n) => Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 0xff);

test('generated ids satisfy the panel rules and are deterministic from the bytes', () => {
  const a = generateProbeSet(fixedBytes);
  const b = generateProbeSet(fixedBytes);
  assert.deepEqual(a, b);
  assert.match(a.correlation, IDENTIFIER_PATTERN);
  assert.match(a.token, IDENTIFIER_PATTERN);
  assert.notEqual(a.correlation, a.token);
  assert.ok(a.message.length <= MAX_PROMPT_LENGTH);
});

test('the starter message produces a reply the real correlation logic accepts', () => {
  const { correlation, token, message } = generateProbeSet(fixedBytes);
  const verdict = (reply) => correlateReply({
    reply,
    expected: { correlation_id: correlation, reply_token: token },
    outbound_text: message,
    role: 'assistant',
    channel: 'final',
    generation_complete: true
  });
  // What the message asks for: both lines, nothing else.
  const accepted = verdict(`${correlation}\n${token}`);
  assert.equal(accepted.accepted, true, accepted.detail);
  // The message handed back to us is an echo and must be refused.
  assert.equal(verdict(message).accepted, false);
  // Asking for the token alone would be refused: the id is required too.
  const tokenOnly = verdict(token);
  assert.equal(tokenOnly.accepted, false);
  assert.match(message, new RegExp(correlation));
  assert.match(message, new RegExp(token));
  assert.equal(
    starterMessage('a', 'b'),
    'Reply with exactly two lines and nothing else.\nFirst line: only this id: a\nSecond line: only this token: b'
  );
});

/* ------------------------------------------------------------------ *
 * Review summary
 * ------------------------------------------------------------------ */

test('reviewSummary flags a message that does not ask for the id and token', () => {
  const ok = reviewSummary({ tabLabel: 'tab 4', text: 'send abc and xyz', correlation: 'abc', token: 'xyz' });
  assert.equal(ok.message_mentions_correlation, true);
  assert.equal(ok.message_mentions_token, true);
  assert.equal(ok.correlation_valid && ok.token_valid, true);

  const missing = reviewSummary({ tabLabel: '', text: 'hello', correlation: 'abc', token: 'xyz' });
  assert.equal(missing.tab, UNKNOWN);
  assert.equal(missing.message_mentions_correlation, false);
  assert.equal(missing.message_mentions_token, false);

  const bad = reviewSummary({ text: 'x'.repeat(MAX_PROMPT_LENGTH + 1), correlation: 'has space', token: '' });
  assert.equal(bad.message_over_limit, true);
  assert.equal(bad.correlation_valid, false);
  assert.equal(bad.token_valid, false);
  assert.equal(bad.message_mentions_token, false);
});
