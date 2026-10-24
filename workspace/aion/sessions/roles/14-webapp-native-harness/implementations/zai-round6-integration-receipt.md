# Z.ai → Agent 14 — Round 6 integration receipt + Round 7 supplier requests

**Date:** 2026-10-24. **Integrator:** Z.ai (sandbox). **Branch:** `studio/short-writer-lease`,
rebased onto GitHub main `91039694` with all 18 prior commits intact (backup ref
`backup/pre-round6-rebase` kept until the owner merges).

## Integration receipt (what was pulled, verbatim, and what was wired)

| Package file | Installed at | Change |
|---|---|---|
| `harness-runs.mjs` | `capture-studio/src/capture/harness-runs.mjs` | verbatim drop-in |
| `harness-executor-preflight.mjs` | `capture-studio/src/studio/harness-executor-preflight.mjs` | verbatim, new file |
| `harness-runs.test.mjs` | `capture-studio/test/unit/harness-runs.test.mjs` | import re-pointed; +1 preserved-original assertion block |
| `harness-executor-preflight.test.mjs` | `capture-studio/test/unit/harness-executor-preflight.test.mjs` | import re-pointed |
| `README.md` | — | followed: exact `conversationToolExecutor` snippet applied in `harness-api.mjs`; the two superseded Round 4 assertions were replaced, NOT restored |

Wiring added by Z.ai (the only non-verbatim product edits):

- `HARNESS_RETRYABLE_TOOLS` exported from `harness-api.mjs` — **derived** from the tool registry's
  own `readOnlyHint` annotations (policy lives in the single tool surface, never hand-maintained).
  Passed as `retryableTools` in `server.mjs` and `bin/commands/run.mjs` (`run step --execute`).
- `submit_conversation_turn` is therefore never auto-retried at the store layer; the conversation
  journal remains the only re-dispatch authority.

## Executed evidence (sandbox, honest labels)

- Rebase 18 commits onto `91039694`: clean, zero conflicts (OFFLINE-SUITE).
- Focused: `harness-runs.test.mjs` 16/16 (15 adversarial + 1 preserved),
  `harness-executor-preflight.test.mjs` 3/3, `harness-api.test.mjs` 3/3 through the REAL server
  with the preflight wrapper (OFFLINE-SUITE).
- Full unit suite: **1,263 tests / 1,262 pass / 0 fail / 1 pre-existing TODO** (OFFLINE-SUITE).
- live-e2e `scripts/live-e2e.mjs`: **14/14 PASS** on real Chrome for Testing 143.0.7499.4;
  step 13 drives the hardened store through the real HTTP API (execute → idempotent replay →
  `IDEMPOTENCY_CONFLICT` → finish) (SANDBOX-RECEIPT, LIVE-BROWSER, synthetic fixture site).
- NEW `scripts/harness-crash-probe.mjs` (shipped back in this branch): **14/14 invariants** with
  REAL child processes — cross-process `STEP_UNCERTAIN` contention, real SIGKILL mid-executor
  leaving a durable `in_flight` fence with exactly-once executor entry, `finish` refused
  (`RUN_HAS_UNRESOLVED_EFFECT`), `LOCK_OWNER_MISMATCH` / `LOCK_OWNER_STILL_ALIVE` /
  verified-dead-pid release, run usable after recovery (SANDBOX-RECEIPT, Linux). The same command
  is the standing Windows/NTFS local test (HANDOFF to owner; result not claimable from here).
- Probe development note: three probe-side bugs were each caught by the store's own fail-closed
  behavior (differing args → `IDEMPOTENCY_CONFLICT`; wrong/foreign expected pid →
  `LOCK_OWNER_MISMATCH`). No store change was needed; the package passed adversarial integration
  as published (SANDBOX-RECEIPT).

## Not claimed here

Authenticated two-turn live acceptance; Windows/NTFS probe results; uncertain-step journal
reconciliation (documented boundary — see requests below).

## Round 7 supplier requests (independent, offline-testable, highest leverage first)

1. **Uncertain-step reconciler (pure core).** Input: a run ledger with an `uncertain`/`in_flight`
   step (tool, argsDigest, timestamps) + the bound conversation's journal receipts; output: a
   verdict `executed` / `not_executed` / `still_unknown` with the matching journal evidence and
   the operator action — never a mutation of the run file, never a re-dispatch. The store
   deliberately leaves this open; a pure classifier + adversarial tests lets Z.ai wire
   `harness run reconcile` safely in one round.
2. **Store ↔ journal consistency auditor.** Read-only walk over `<data-dir>/harness-runs/*.run.json`
   + conversation journals reporting: orphan fences (step claims an effect the journal never
   recorded), silent effects (journal recorded a keyed submit no run step claims), and digest
   mismatches. Pure, fixture-tested, offline.
3. **Windows/NTFS lock & path conformance pack.** Characterize `wx` open, rename-over-existing,
   fsync/unlink durability, pid-reuse semantics, case-insensitive run-id collisions and long paths
   for `<id>.run.json` + `.run.json.lock` on NTFS — results decide whether `RUN_ID` / lock naming
   needs Windows-specific hardening before the owner's local test.
4. **HTTP/CLI contract fixture pack.** Golden problem-json fixtures for
   `RUN_BUSY` / `STEP_UNCERTAIN` / `IDEMPOTENCY_CONFLICT` / `STEP_RECONCILIATION_REQUIRED` /
   `RUN_HAS_UNRESOLVED_EFFECT` / `RUN_FINISHED` across the `/api/v1/harness/runs*` routes and the
   `studio run` CLI, so any future store change is contract-tested against the published surface
   without a browser or provider.
5. **Run-ledger agent view (`aion.harness-run-view/1`).** A loss-aware projection of a run ledger
   for agent consumption: what executed, what is fenced, what is replayable, what needs
   reconciliation — same evidence-class discipline as `aion.web-observation/1` (no bodies, no
   invented state), so the `/chat` UI and harness clients can display uncertain effects honestly.

Delivery protocol unchanged: tested standalone components on GitHub main with a pull contract;
Z.ai integrates, runs full regression + live-e2e, and returns the receipt.
