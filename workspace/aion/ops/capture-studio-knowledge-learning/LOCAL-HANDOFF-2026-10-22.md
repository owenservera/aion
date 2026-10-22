# 🟩 Knowledge & Learning — Targeted Windows L4 Handoff

**Date:** 2026-10-22. **QA authority:** [L0–L5 local integration contract](../..//qa/capture-studio/LOCAL-INTEGRATION-ROUNDS-2026-10-22.md). **QA plan baseline:** `a18407def`; **actual observed GitHub main when starting this work:** `75032dc868b806ba47e4720e52cf857c818040e2`. Source commits made afterward are **not** Windows run receipts.

**Decision:** deliver four small synthetic fixtures plus a runnable Node test; do not start a new broad feature sprint, edit Core/UI files, run a live browser, export private user data, or increase QA ceremonies.

## Canonical fixture and runner paths

Under `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`:

| Fixture | Git blob SHA | Intended behavior |
| --- | --- | --- |
| `test/fixtures/knowledge-handoff/01-as-of-truth.json` | `542ca31a9d9feb910e1902520afd39a00a3b1616` | event-time 100/170/250 (ingest 100/250/170), at 150/200/275, edge born 160/rejected 260, field removal, future observation absent |
| `test/fixtures/knowledge-handoff/02-identity-exclusion.json` | `5764b69211b6b34a1c1e3aa6c100a2e15f0b2896` | two exact-origin typed-string sessions join, numeric 42/string "42" separate, different origin excluded, keyless isolated; account identity unproven |
| `test/fixtures/knowledge-handoff/03-correction-version.json` | `772dec8a042b90079d39b6276c5bdb5ea7dd8fb8` | v1 rejected/no training, v2 accepted/account-scoped, v3 rollback; v2 immutable, unrelated account unchanged |
| `test/fixtures/knowledge-handoff/04-evidence-eligibility.json` | `bc12929b7b0f39549f3a98da5bb8129c8cf9a1bd` | only complete + accepted + verified + derived is training-eligible; derived shape alone insufficient |
| **`test/unit/knowledge-handoff.test.mjs`** | **`a1ca7cd1011ecf33712f37bbd7f7177858bd53ef`** | Four source-dependent Node tests + one explicitly pending Core eligibility-gate integration test |

All input values are deliberately synthetic. No real prompts, cookies, account data or private transcripts appear in fixtures.

## Local run instructions — Windows PowerShell

Run from the **Capture Studio directory in a checkout pinned to the actual local SHA**:

```powershell
git rev-parse HEAD
git status --short
node --version
node --test test/unit/knowledge-handoff.test.mjs
```

Expected test inventory: **4 executable tests + 1 TODO**. The TODO is not passing functionality or an independently accepted criterion. Record the actual exit code, exact SHA, test counts, Node version and output in **L4** `steps.jsonl`/`metrics.json`; retain the raw output in the owner-local `private/` evidence directory. If a test fails, save the minimal synthetic repro and assign only that failure to L4/L5/Core as appropriate. Do **not** delay QA's L0/L1 environment/synthetic capture runs for this L4 suite.

### Independent QA expectations / known limitations

- **KH-01:** tests the actual `TemporalGraph` event-time reducer and `observationBoundary`; does **not** assert Core's raw `iterateRaw(toT)` streaming cutoff correct under nonmonotonic timestamps (Core/QA separate fixture required).
- **KH-02:** tests `buildSiteContinuity` over on-disk synthetic session artifacts; does **not** prove separate accounts sharing one origin have been identified. Do not label origin as account verification.
- **KH-03:** uses real `ScopedLearner` and real persistent `LearnerJournal` with synthetic data. New rollback revision preserves earlier snapshots; it does **not** yet establish real historic derived interpretation version-pinning.
- **KH-04:** validates the **required downstream admission matrix**, not actual `src/families/build.mjs` enforcement. `collectSessions()` currently maps `hasDerived = !!shapes` without verified acceptance; **Core G1–G7 capture admission gate remains a source-known blocker**, represented as `test.todo`, not falsely passing.
- **Source/fixture static verification:** 9/9 checks passed in connector-side JS on exact GitHub readback (JSON parse, expected fixture IDs/coverage, test source syntax). **Native `node --test` against the complete repository was NOT executed** here, because the sandbox cannot clone the private repository. GitHub source delivery is not L4 local acceptance.
- **Independent acceptance state:** L4 **0/7**, L5 **0/7** until QA independently verifies actual criteria. No live browser/send/Windows machine execution in this handoff.

## Exact QA development feedback destinations

Use the existing QA [LOCAL-INTEGRATION-ROUNDS](../../qa/capture-studio/LOCAL-INTEGRATION-ROUNDS-2026-10-22.md) evidence contract:
`run.json`, `steps.jsonl`, `metrics.json`, `failures.jsonl`, `summary.md`, optional `private/` and reviewed `shareable/` only. For failed KH fixture identify `source_sha`, `fixture_id`, `expected`, `observed`, `component`, `suspected_owner`, and `failure signature`. Never auto-upload raw data.

**Routing:** KH-01 TemporalGraph/temporal-perspective defects → L4; Core raw-order failure → Core; KH-02 identity/continuity → L4 and Core where existing ownership applies; KH-03 journal/persistence/calibration → L5; KH-04 missing acceptance gate/family training admission → Core (L5 consumes accepted evidence, not Core family source edits).

**Completion status:** Four fixtures, one standalone runner and documentation **source shipped/read-back verified**; Node runtime execution **pending**, user usefulness **unmeasured**, independent QA acceptance **not claimed**.
