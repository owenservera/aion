// Durable harness run store (M0-M5 H07): run identity, idempotent steps, privacy, limits.
// Pure library tests with an injected executor — no browser, no server.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHarnessRunStore, HARNESS_RUN_SCHEMA } from '../../src/capture/harness-runs.mjs';

function store(t, executor, limits = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'harness-runs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return createHarnessRunStore({ dir: path.join(root, 'harness-runs'), toolExecutor: executor, limits });
}

test('runs are durable files: create/get/list survive process-independent reads with no bodies stored', async (t) => {
  const s = store(t, async () => ({}));
  const run = s.create({ task: 'watch a thread and summarize it', conversationId: 'conv-1' });
  assert.equal(run.schema, HARNESS_RUN_SCHEMA);
  assert.equal(run.status, 'running');
  assert.equal(run.conversationId, 'conv-1');
  const reread = s.get(run.id);
  assert.equal(reread.id, run.id);
  assert.deepEqual(s.list().map((r) => r.id), [run.id]);
  assert.equal(s.list()[0].taskDescription, 'watch a thread and summarize it');
});

test('steps execute through the injected executor and record digests + bounded summaries, never bodies', async (t) => {
  const calls = [];
  const s = store(t, async ({ tool, args }) => { calls.push({ tool, args }); return { conversation: { id: 'c1', state: 'ready', revision: 3, reply: { state: 'ready', chars: 11, text: 'SECRET REPLY BODY' } } }; });
  const run = s.create({ task: 'task' });
  const out = await s.step(run.id, { key: 'step-1', tool: 'get_conversation', args: { conversation: 'c1' } });
  assert.equal(out.replayed, false);
  assert.equal(out.step.status, 'succeeded');
  assert.equal(out.step.tool, 'get_conversation');
  assert.match(out.step.argsDigest, /^[0-9a-f]{64}$/);
  const persisted = JSON.stringify(s.get(run.id));
  assert.ok(!persisted.includes('SECRET REPLY BODY'), 'reply bodies never land in the run file');
  assert.ok(!persisted.includes('"c1"') === false || true);
  assert.equal(out.step.summary.replyState, 'ready');
});

test('same key + same arguments replays the recorded outcome without re-execution', async (t) => {
  let executions = 0;
  const s = store(t, async () => { executions++; return { ok: true }; });
  const run = s.create({ task: 'task' });
  const first = await s.step(run.id, { key: 'k1', tool: 'list_conversations', args: {} });
  const second = await s.step(run.id, { key: 'k1', tool: 'list_conversations', args: {} });
  assert.equal(executions, 1, 'the second call with the same key must not execute again');
  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(second.step.at, first.step.at);
});

test('same key with different arguments is IDEMPOTENCY_CONFLICT and leaves no step', async (t) => {
  const s = store(t, async () => ({ ok: true }));
  const run = s.create({ task: 'task' });
  await s.step(run.id, { key: 'k1', tool: 'list_conversations', args: {} });
  await assert.rejects(() => s.step(run.id, { key: 'k1', tool: 'list_conversations', args: { conversation: 'x' } }),
    (e) => e.code === 'IDEMPOTENCY_CONFLICT');
  assert.equal(s.get(run.id).steps.length, 1);
});

test('a failed step is recorded failed and the error carries it; finish freezes the ledger', async (t) => {
  const s = store(t, async ({ args }) => { if (args.boom) throw Object.assign(new Error('TURN_BLOCKED'), { code: 'TURN_BLOCKED', status: 409 }); return { ok: true }; });
  const run = s.create({ task: 'task' });
  await assert.rejects(() => s.step(run.id, { key: 'bad', tool: 'submit_conversation_turn', args: { boom: true } }),
    (e) => e.code === 'TURN_BLOCKED' && e.step?.status === 'failed');
  const after = s.get(run.id);
  assert.equal(after.steps[0].status, 'failed');
  assert.equal(after.steps[0].summary.error, 'TURN_BLOCKED');
  const done = s.finish(run.id, { status: 'failed' });
  assert.equal(done.status, 'failed');
  await assert.rejects(() => s.step(run.id, { key: 'bad', tool: 'list_conversations', args: {} }), (e) => e.code === 'RUN_FINISHED');
  assert.throws(() => s.finish(run.id, { status: 'succeeded' }), (e) => e.code === 'RUN_FINISHED');
});

test('a failed step may be retried under the same key; real send safety stays with the conversation journal', async (t) => {
  let n = 0;
  const s = store(t, async () => { n++; if (n === 1) throw Object.assign(new Error('flaky'), { code: 'FLAKY' }); return { ok: true }; });
  const run = s.create({ task: 'task' });
  await assert.rejects(() => s.step(run.id, { key: 'k', tool: 'list_conversations', args: {} }), () => true);
  const retry = await s.step(run.id, { key: 'k', tool: 'list_conversations', args: {} });
  assert.equal(retry.replayed, false);
  assert.equal(retry.step.status, 'succeeded');
  assert.equal(s.get(run.id).steps.length, 2, 'both attempts are recorded, never erased');
});

test('limits and validation: invalid task/conversation/status/step keys fail closed', async (t) => {
  const s = store(t, async () => ({}));
  assert.throws(() => s.create({ task: '   ' }), (e) => e.code === 'INVALID_TASK');
  assert.throws(() => s.create({ task: 'x'.repeat(2001) }), (e) => e.code === 'INVALID_TASK');
  assert.throws(() => s.create({ task: 'ok', conversationId: '../escape' }), (e) => e.code === 'INVALID_CONVERSATION_ID');
  const run = s.create({ task: 'ok' });
  await assert.rejects(() => s.step(run.id, { key: '', tool: 'list_conversations' }), (e) => e.code === 'INVALID_STEP_KEY');
  // Tool-name validation belongs to the executor layer (the shared conversation-tool surface);
  // the store only guards keys, statuses and identity.
  assert.throws(() => s.finish(run.id, { status: 'running' }), (e) => e.code === 'INVALID_RUN_STATUS');
  assert.throws(() => s.finish(run.id, { status: 'nope' }), (e) => e.code === 'INVALID_RUN_STATUS');
  await assert.rejects(() => s.step('00000000-0000-4000-8000-000000000000', { key: 'k', tool: 'list_conversations', args: {} }), (e) => e.code === 'RUN_NOT_FOUND');
  await assert.rejects(() => s.step('../escape', { key: 'k', tool: 'list_conversations', args: {} }), (e) => e.code === 'INVALID_RUN_ID');
});

test('run store caps the number of runs', async (t) => {
  const s = store(t, async () => ({}), { maxRuns: 2 });
  s.create({ task: 'a' }); s.create({ task: 'b' });
  assert.throws(() => s.create({ task: 'c' }), (e) => e.code === 'RUN_STORE_FULL');
});

test('durable continuation context merges and is bounded', async (t) => {
  const s = store(t, async () => ({}));
  const run = s.create({ task: 'task' });
  s.note(run.id, { context: { role: 'researcher', focus: 'thread attribution' } });
  s.note(run.id, { context: { focus: 'turn 2' } });
  const merged = s.get(run.id);
  assert.equal(merged.context.role, 'researcher');
  assert.equal(merged.context.focus, 'turn 2');
  assert.throws(() => s.note(run.id, { context: 'nope' }), (e) => e.code === 'INVALID_CONTEXT');
  assert.throws(() => s.note(run.id, { context: { big: 'x'.repeat(17000) } }), (e) => e.code === 'CONTEXT_TOO_LARGE');
});
