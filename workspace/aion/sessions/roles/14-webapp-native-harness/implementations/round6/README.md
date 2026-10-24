# Agent 14 -> Z.ai Round 6: executable harness reliability handoff

**Date:** 2026-10-24. **Source evidence:** owner-uploaded Z.ai Round 5 TAR (4), patch `0013-feat-capture-studio-durable-harness-runs-...patch` (of 18). **Scope:** ready-to-integrate source and tests, **not** a production installation or GitHub-main patch of Capture Studio. No private transcripts, raw browser data, keys or workspace TAR are published here.

## What is runnable now

| File | Use |
|---|---|
| `harness-runs.mjs` | Drop-in candidate replacing Z.ai's proposed `src/capture/harness-runs.mjs`, preserving `createHarnessRunStore({dir, io, toolExecutor, limits})` and `create/get/list/step/finish/note`; adds explicit optional `retryableTools` and `recoverAbandonedLock`. |
| `harness-runs.test.mjs` | 15 adversarial tests: same-key concurrency across distinct store instances, altered tool, order-independent argument digest, pre-dispatch failure, unknown-effect fencing, crash-after-effect persist failure, reservation write failure, lost updates, lock ownership and payload exclusion. |
| `harness-executor-preflight.mjs` | Pure validator wrapper; only failures *before* the existing Studio executor receives work get `effectState: 'not_dispatched'`. No side effects. |
| `harness-executor-preflight.test.mjs` | 3 focused tests: preflight rejection, runtime uncertainty, successful exact delegation. |

**Verification:** `node --test *.test.mjs` on Node v22.16.0: **18 pass / 0 fail**. `node --check` on each module also passes. No Windows or authenticated provider execution claimed.

## Z.ai integration after the 18-patch branch is safely reconciled

Existing proposed source root: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.

1. Inspect Z.ai patch 0013 and current `origin/main` head. Don't overwrite concurrent Core/QA changes. Import/merge the 18-patch branch through validated normal Git; agent14's handoff isn't a second running product.
2. Copy this `harness-runs.mjs` over that **new branch's** `src/capture/harness-runs.mjs`. Retain the single injected Studio conversation-tool executor. No new CDP actor, queue, service or browser lease.
3. Copy `harness-executor-preflight.mjs` into that **same existing product** at `src/studio/harness-executor-preflight.mjs` and change existing `src/studio/harness-api.mjs` once:

```js
import { CONVERSATION_TOOLS, executeConversationTool, validateConversationTool } from './conversation-tools.mjs';
import { withDispatchPreflight } from './harness-executor-preflight.mjs';
// Existing API routes and tool registration remain unchanged.
export function conversationToolExecutor(conversationRuntime) {
  if (!conversationRuntime) throw problem(503, 'Conversation runtime unavailable', 'CONVERSATION_CAPABILITY_UNAVAILABLE');
  return withDispatchPreflight(
    ({ tool, args }) => executeConversationTool(conversationRuntime, tool, args),
    (tool, args) => validateConversationTool(tool, args),
  );
}
```

4. Put `harness-runs.test.mjs` at product `test/unit/harness-runs.test.mjs`; relative import changes from `./harness-runs.mjs` to `../../src/capture/harness-runs.mjs`. Put `harness-executor-preflight.test.mjs` at `test/unit/harness-executor-preflight.test.mjs`; change its import to `../../src/studio/harness-executor-preflight.mjs`. Run focused, full Node suite and Chrome synthetic integration tests. Z.ai must adapt or replace **two intentionally superseded original assertions**: the old `failed` expectation without pre-dispatch proof, and automatic same-key retry after unqualified error. Do **not** restore the unsafe semantics to satisfy historical tests. The HTTP fixture's argument-validation failure should still be `failed` after the pure preflight wrapper.
5. Prove actual preserved route and CLI compatibility; classify lock contention `RUN_BUSY`, incomplete `STEP_UNCERTAIN`, `IDEMPOTENCY_CONFLICT` and preflight `failed` in `/chat` or tool output as explicit visible statuses. Never retry with a new key to bypass an uncertain effect.
6. Any `*.run.json.lock` left after process death requires explicit owner/local-integrator recovery: inspect lock owner PID, verify it is dead, call `store.recoverAbandonedLock(id,{expectedPid})` or equivalent safe local repair. This **only** releases a stale state-write lock; persisted `in_flight` and `uncertain` steps remain blocked until the canonical conversation/effect journal has been reconciled. **Do not automatically clear or re-execute them.** This candidate does not implement the journal-specific resolution action or its proof model.

## Strict semantic upgrades

- Step identity is `(runId,key,tool,canonical JSON args digest)`. Same key with different tool/arguments is a conflict. Same successful step can be replayed read-only without executing again.
- Write an `in_flight` step to durable JSON BEFORE the executor is invoked. A crash or I/O failure after dispatch leaves it unresolved, preventing duplicate execution. File transitions use an exclusive `.lock` per run to eliminate lost updates across store instances/processes. Busy locks are not force-stolen.
- An executor exception is generally an **uncertain effect**. Only *pure validation* that happens before the executor can prove `not_dispatched`; after that, a runtime/journal check is required. Optional same-key retry is restricted to a caller-provided list of verified read-only tools and explicitly `failed/not_dispatched` attempts.
- `finish` refuses a run with unresolved effects. Concurrent `note` and `step` completion updates preserve context by rereading under the state-write lock. Result/prompt bodies are not persisted to the run ledger.
- This is **at-most-once attempt admission with unresolved-effect fences**, not mathematical exactly-once execution or accepted live provider fidelity. Final outcome qualification remains with Core/QA G1-G7.

## Current boundaries / unresolved integration work

- Existing old on-disk successful/failed step schema is backward-readable; historical failed steps do not automatically gain proof of non-dispatch. Their reuse is fail-closed unless verified read-only tool policy applies. Empty or corrupt lock metadata requires manual diagnosis; no blind cleanup.
- Run creation max-count is a simple limit, not an interprocess quota transaction. Full-disk failures, symlink/path attacks and distributed/network-filesystem lock semantics have not been qualified; local NTFS/Windows tests remain outstanding.
- `summarizeResult` is only an overview; it is not a provider-native block decoder, artifact store or conversation proof. Agent 14's `CONTRACTS.md` and `EXPERIMENTS.md` cover those distinct requirements.
- Current-source checks and this package's synthetic tests do NOT prove ChatGPT or Claude authenticated two-turn readback or local owner Windows acceptance.

## Precise Z.ai acceptance request

Return the source commit where the component was integrated, source/destination diffs, full unit-suite results, Windows-local filesystem lock/crash test, 14/14 synthetic-site recheck, and the exact remaining gaps in real provider G1-G7 acceptance. The local executor chooses any better equivalent approach if it demonstrably passes the same negative cases. No claim that an issue/comment automatically wakes an agent.