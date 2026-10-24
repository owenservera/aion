// Durable harness run identity (M0–M5 surface H07): persistent run/task state across
// conversations, processes and restarts, on top of — never beside — the existing runtime.
//
// A run is a file under <dir>/<id>.run.json. It records a task, an optional conversation binding
// and an append-only step ledger. Steps are EXECUTED BY THE CALLER through an injected
// toolExecutor (in the studio server this is the same conversation runtime that serves the nine
// conversation tools); this store never touches a browser, a lease or a capture. It owns only
// durable identity, ordering and idempotency.
//
// Step idempotency: a caller-owned durable key. The same key + the same canonical args digest
// replays the recorded result without re-execution (no duplicate effects); the same key with a
// different digest is IDEMPOTENCY_CONFLICT. A previously FAILED step may be re-executed under
// the same key — the dangerous effect (submit) is already fenced by the conversation runtime's
// own key+payload journal, so no step here can double-send.
//
// Privacy: steps record argument/result DIGESTS and a bounded summary — never prompt or reply
// bodies. Bodies stay in the conversation snapshots and saved sessions they belong to.
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const HARNESS_RUN_SCHEMA = 'capture-studio.harness-run/1';
export const RUN_STATUSES = Object.freeze(['running', 'succeeded', 'failed', 'interrupted']);
export const STEP_STATUSES = Object.freeze(['succeeded', 'failed']);
const DEFAULT_LIMITS = Object.freeze({ maxRuns: 200, maxSteps: 1000, taskChars: 2000, summaryChars: 300, stepKeyChars: 200 });

const now = () => new Date().toISOString();
const fail = (status, code, message) => Object.assign(new Error(message ?? code), { status, code });
const digestOf = (value) => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const clamp = (s, n) => String(s ?? '').slice(0, n);

function validRun(r) {
  return !!r && r.schema === HARNESS_RUN_SCHEMA && typeof r.id === 'string'
    && RUN_STATUSES.includes(r.status) && r.task && typeof r.task.description === 'string'
    && Array.isArray(r.steps) && Number.isFinite(Date.parse(r.createdAt)) && Number.isFinite(Date.parse(r.updatedAt));
}

function validStep(s) {
  return !!s && typeof s.key === 'string' && s.key.length > 0 && typeof s.tool === 'string'
    && typeof s.argsDigest === 'string' && STEP_STATUSES.includes(s.status)
    && Number.isFinite(Date.parse(s.at));
}

// Summaries never carry bodies: tool argument/result digests plus a bounded result kind/status.
export function summarizeResult(result) {
  if (result === undefined) return null;
  if (result === null) return 'null';
  if (Array.isArray(result)) return { kind: 'array', length: result.length };
  if (typeof result === 'object') {
    const conversation = result.conversation ?? result.resource ?? null;
    const c = conversation && typeof conversation === 'object' ? conversation : result;
    return { kind: 'object',
      ...(typeof c.id === 'string' ? { id: c.id } : {}),
      ...(c.state !== undefined ? { state: c.state } : {}),
      ...(c.revision !== undefined ? { revision: c.revision } : {}),
      ...(c.verdict !== undefined ? { verdict: c.verdict } : {}),
      ...(c.reply && typeof c.reply === 'object' ? { replyState: c.reply.state ?? null, replyChars: c.reply.chars ?? null } : {}),
      replyTextPresent: Object.values(result).some((v) => v && typeof v === 'object' && typeof v.text === 'string' && v.text.length > 0),
    };
  }
  return { kind: typeof result };
}

export function createHarnessRunStore({ dir, io = fs, toolExecutor, limits = {} } = {}) {
  if (!dir) throw fail(500, 'RUN_DIR_REQUIRED');
  if (typeof toolExecutor !== 'function') throw fail(500, 'TOOL_EXECUTOR_REQUIRED');
  const L = { ...DEFAULT_LIMITS, ...limits };
  io.mkdirSync(dir, { recursive: true });
  const file = (id) => path.join(dir, `${id}.run.json`);
  const ids = () => io.readdirSync(dir).filter((n) => n.endsWith('.run.json')).map((n) => n.slice(0, -'.run.json'.length));
  const readRun = (id) => {
    if (!/^[a-f0-9-]{10,64}$/i.test(id ?? '')) throw fail(400, 'INVALID_RUN_ID');
    let raw; try { raw = io.readFileSync(file(id), 'utf8'); } catch (e) {
      if (e.code === 'ENOENT') throw fail(404, 'RUN_NOT_FOUND');
      throw fail(409, 'CORRUPT_OR_UNREADABLE_RUN');
    }
    let run; try { run = JSON.parse(raw); } catch { throw fail(409, 'CORRUPT_OR_UNREADABLE_RUN'); }
    if (!validRun(run) || !run.steps.every(validStep)) throw fail(409, 'CORRUPT_OR_UNREADABLE_RUN');
    return run;
  };
  const persist = (run) => {
    run.updatedAt = now();
    const tmp = `${file(run.id)}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    let fd;
    try {
      fd = io.openSync(tmp, 'wx', 0o600);
      io.writeSync(fd, `${JSON.stringify(run, null, 2)}\n`);
      io.fsyncSync(fd);
    } catch (e) {
      try { io.closeSync(fd); } catch { /* not open */ }
      try { io.unlinkSync(tmp); } catch { /* best effort */ }
      throw fail(409, 'RUN_PERSIST_FAILED', String(e?.message ?? e));
    }
    try { io.closeSync(fd); io.renameSync(tmp, file(run.id)); }
    catch (e) {
      try { io.unlinkSync(tmp); } catch { /* best effort */ }
      throw fail(409, 'RUN_PERSIST_FAILED', String(e?.message ?? e));
    }
    return run;
  };
  const summary = (run) => ({ id: run.id, status: run.status, createdAt: run.createdAt, updatedAt: run.updatedAt,
    taskDescription: run.task.description, conversationId: run.conversationId, steps: run.steps.length,
    lastStep: run.steps.at(-1) ? { key: run.steps.at(-1).key, tool: run.steps.at(-1).tool, status: run.steps.at(-1).status, at: run.steps.at(-1).at } : null });

  return {
    create({ task, conversationId = null } = {}) {
      const description = typeof task === 'string' ? task : task?.description;
      if (typeof description !== 'string' || !description.trim()) throw fail(400, 'INVALID_TASK');
      if (description.length > L.taskChars) throw fail(400, 'INVALID_TASK');
      if (conversationId !== null && (typeof conversationId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(conversationId))) throw fail(400, 'INVALID_CONVERSATION_ID');
      const existing = ids();
      if (existing.length >= L.maxRuns) throw fail(409, 'RUN_STORE_FULL');
      const run = { schema: HARNESS_RUN_SCHEMA, id: randomUUID(), createdAt: now(), updatedAt: now(),
        status: 'running', task: { description }, conversationId, steps: [], context: {} };
      return persist(run);
    },
    get: (id) => readRun(id),
    list: () => ids().map((id) => { try { return summary(readRun(id)); } catch { return { id, status: 'corrupt', createdAt: null, updatedAt: null, taskDescription: null, conversationId: null, steps: 0, lastStep: null }; } })
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    // Execute one tool call inside the run. Idempotent by key; the executor is the runtime owner.
    async step(id, { key, tool, args = {} } = {}) {
      if (typeof key !== 'string' || !key.trim() || key.length > L.stepKeyChars) throw fail(400, 'INVALID_STEP_KEY');
      if (typeof tool !== 'string' || !tool) throw fail(400, 'INVALID_TOOL');
      const run = readRun(id);
      if (run.status !== 'running') throw fail(409, 'RUN_FINISHED');
      if (run.steps.length >= L.maxSteps) throw fail(409, 'RUN_STEP_LIMIT');
      const argsDigest = digestOf(args);
      const prior = run.steps.find((s) => s.key === key);
      if (prior && prior.argsDigest !== argsDigest) throw fail(409, 'IDEMPOTENCY_CONFLICT');
      if (prior && prior.status === 'succeeded') {
        return { run: structuredClone(run), step: structuredClone(prior), replayed: true, result: undefined,
          note: 'step already succeeded under this key; replayed the recorded outcome without re-execution' };
      }
      let result, stepStatus = 'succeeded';
      try { result = await toolExecutor({ tool, args, run: structuredClone(run) }); }
      catch (e) {
        stepStatus = 'failed';
        const errSummary = { error: String(e?.code ?? e?.message ?? e).slice(0, L.summaryChars), ...(e?.status ? { status: e.status } : {}) };
        const step = { key, tool, argsDigest, status: 'failed', at: now(), summary: errSummary };
        run.steps.push(step); persist(run);
        throw Object.assign(fail(e?.status ?? 409, e?.code ?? 'STEP_FAILED', String(e?.message ?? e)), { step });
      }
      const step = { key, tool, argsDigest, status: 'succeeded', at: now(), summary: summarizeResult(result) };
      run.steps.push(step); persist(run);
      return { run: structuredClone(run), step: structuredClone(step), replayed: false, result };
    },
    finish(id, { status } = {}) {
      if (!RUN_STATUSES.includes(status) || status === 'running') throw fail(400, 'INVALID_RUN_STATUS');
      const run = readRun(id);
      if (run.status !== 'running') throw fail(409, 'RUN_FINISHED');
      run.status = status;
      return persist(run);
    },
    // Durable context bag for agent continuation (bounded, bodies excluded).
    note(id, { context } = {}) {
      if (context === undefined || context === null || typeof context !== 'object' || Array.isArray(context)) throw fail(400, 'INVALID_CONTEXT');
      const encoded = JSON.stringify(context);
      if (encoded.length > 16000) throw fail(400, 'CONTEXT_TOO_LARGE');
      const run = readRun(id);
      if (run.status !== 'running') throw fail(409, 'RUN_FINISHED');
      run.context = { ...run.context, ...context };
      return persist(run);
    },
  };
}
