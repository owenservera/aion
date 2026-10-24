// Harness run surfaces over the EXISTING runtime owner: one durable run identity per task, with
// steps executed through the same conversation tools and the same conversation runtime that serve
// every other client. No second browser actor, no second evidence store, no new write path.
import { problem } from './http.mjs';
import { CONVERSATION_TOOLS, executeConversationTool, validateConversationTool } from './conversation-tools.mjs';
import { withDispatchPreflight } from './harness-executor-preflight.mjs';

// Same-key retry after a PROVEN not-dispatched failure is allowed only for tools the registry
// itself marks read-only. The policy is derived from the single tool surface — never hand-maintained
// here — so a future read-only tool is automatically covered and an effectful tool can never slip in.
export const HARNESS_RETRYABLE_TOOLS = Object.freeze(
  CONVERSATION_TOOLS.filter((t) => t.annotations?.readOnlyHint === true).map((t) => t.name));

const str = { type: 'string' };
const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, ...(required.length ? { required } : {}) });
const runBody = objectSchema({
  task: { oneOf: [{ ...str, minLength: 1, maxLength: 2000 }, objectSchema({ description: { ...str, minLength: 1, maxLength: 2000 } }, ['description'])] },
  conversationId: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$' },
}, ['task']);
const stepBody = objectSchema({
  key: { ...str, minLength: 1, maxLength: 200 },
  tool: { type: 'string', enum: CONVERSATION_TOOLS.map((t) => t.name) },
  arguments: { type: 'object', default: {} },
}, ['key', 'tool']);
const finishBody = objectSchema({ status: { type: 'string', enum: ['succeeded', 'failed', 'interrupted'] } }, ['status']);
const noteBody = objectSchema({ context: { type: 'object' } }, ['context']);

const runView = (run) => ({ ...run });

export function createHarnessApi({ runs }) {
  if (!runs) return null;
  return {
    create: (body) => ({ run: runView(runs.create(body)) }),
    list: () => ({ runs: runs.list() }),
    get: (id) => ({ run: runView(runs.get(id)) }),
    step: async (id, body) => {
      const out = await runs.step(id, { key: body.key, tool: body.tool, args: body.arguments ?? {} });
      return { run: runView(out.run), step: out.step, replayed: out.replayed,
        ...(out.replayed ? { note: out.note } : { result: out.result }) };
    },
    finish: (id, body) => ({ run: runView(runs.finish(id, body)) }),
    note: (id, body) => ({ run: runView(runs.note(id, body)) }),
  };
}

// Route + tool registration through the hub's own add(), so harness endpoints appear in the same
// tool surface, with the same auth, problem-json and documentation as every other Studio API.
export function registerHarnessTools({ add, harnessApi }) {
  if (!harnessApi) return;
  const runParameter = { run: { type: 'string', minLength: 10, maxLength: 64, pattern: '^[a-f0-9-]{10,64}$' } };
  add('POST', '/harness/runs', 'Open a durable harness run: persistent task/run identity bound to an optional conversation',
    async ({ body }) => harnessApi.create(body),
    { body: runBody, tool: 'harness_start_run', successStatus: 201,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } });
  add('GET', '/harness/runs', 'List durable harness runs (summaries; step bodies are digests only)',
    () => harnessApi.list(),
    { tool: 'harness_list_runs', annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } });
  add('GET', '/harness/runs/{run}', 'Read one durable harness run: task, status, conversation binding and step ledger',
    ({ p }) => harnessApi.get(p.run),
    { tool: 'harness_get_run', pathParameters: runParameter,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } });
  add('POST', '/harness/runs/{run}/steps', 'Execute one conversation-tool call inside a harness run. Durable key: same key + same arguments replays the recorded outcome without re-execution; never generate a replacement key after a timeout or unknown effect',
    async ({ p, body }) => harnessApi.step(p.run, body),
    { body: stepBody, tool: 'harness_run_step', pathParameters: runParameter,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } });
  add('POST', '/harness/runs/{run}/finish', 'Close a harness run with an explicit final status; the ledger becomes immutable',
    ({ p, body }) => harnessApi.finish(p.run, body),
    { body: finishBody, tool: 'harness_finish_run', pathParameters: runParameter,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } });
  add('POST', '/harness/runs/{run}/context', 'Merge durable continuation context into a running harness run (bounded, bodies excluded)',
    ({ p, body }) => harnessApi.note(p.run, body),
    { body: noteBody, tool: 'harness_note_run', pathParameters: runParameter,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } });
}

// The executor handed to the run store: conversation tools through the shared single path.
// Agent 14 Round 6 dispatch preflight: a PURE validation failure is proven not_dispatched
// (the store may record a safe `failed` step); anything thrown after validation may have had a
// real effect and is left unannotated so the store fences it as `uncertain`.
export function conversationToolExecutor(conversationRuntime) {
  if (!conversationRuntime) throw problem(503, 'Conversation runtime unavailable', 'CONVERSATION_CAPABILITY_UNAVAILABLE');
  return withDispatchPreflight(
    ({ tool, args }) => executeConversationTool(conversationRuntime, tool, args),
    (tool, args) => validateConversationTool(tool, args),
  );
}

// Tool-argument envelope validator used before the store is touched (fails closed on junk).
export function validateHarnessStepBody(body) {
  const { key, tool, arguments: args } = body ?? {};
  if (typeof key !== 'string' || !key.trim()) throw problem(400, 'Missing step key', 'INVALID_STEP_KEY');
  if (!CONVERSATION_TOOLS.some((t) => t.name === tool)) throw problem(400, `Unknown conversation tool: ${String(tool)}`, 'INVALID_TOOL');
  if (args !== undefined && (typeof args !== 'object' || args === null || Array.isArray(args))) throw problem(400, 'arguments must be an object', 'INVALID_TOOL_ARGUMENTS');
  return { key, tool, args: args ?? {} };
}
