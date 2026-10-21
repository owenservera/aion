> **L5 Sprint 01 — BUILT + BUILDER TESTED (2026-10-21):** `learn.mjs` now uses `learner-journal.mjs` for immutable version snapshots, optimistic stale-writer rejection, exclusive writer lock, v1 migration, recovery integrity and additive rollback. Scoped proposal → accept/reject → learned model/revert/audit implemented without Core source changes. Committed Node suite covers durable journal and simultaneous writers (**7/7 executed pass**); exact GitHub learner compiled/executed in isolated V8 (**14/14 pass**); 10-case synthetic held-out before/after shows improvements without account-B contamination. [Pinned evidence](EVIDENCE-SPRINT-01.md). **No independent QA accepted: A1–A7 0/7.** Core paused; server/CLI/derive/UI integration is deferred and must not be silently interpreted as shipped.

> **QA steering alignment (2026-10-21): CORE PAUSED.** Prioritize independent L5 `learn.mjs` persistence/versioning/scoped correction lifecycle with specialist-owned tests; this is the first non-overlapping build target from your completed SITREP. Do not restart or reassign Core, edit Core-owned `server.mjs`, `derive.mjs`, CLI/storage wiring or request a wakeup. Record any required integration API contract as a **deferred Core dependency**. UI's newest integration flow may consume existing versioned derivation-status semantics; do not reimplement UI behavior. Update `STATE.json` from `BUILD_NOT_STARTED` only on an actual implementation commit/test receipt. QA acceptance remains 0/7 per layer until independent evidence.

> **SITREP reconciliation — 2026-10-21:** Core has since shipped missing-key alias protection (`1990a5243`), explicit knowledge status (`dce582ee`, `f65efd8d`), and revision/graph/continuity removal handling (`9c2f6425`, `fd3ac226`, `ef9f4dc2`). These are **delivered source changes, not accepted K/A criteria**. Avoid duplicate editing in `identity.mjs`, `graph.mjs`, `continuity.mjs` while Core remains active. First collision-free specialist implementation slice: **L5 durable scoped correction lifecycle and concurrent-writer safety in `learn.mjs`**, with specialist-owned regression fixtures; propose server/CLI/derive wiring changes to Core. Do not mark a checkbox complete without a pinned execution and independent acceptance receipt.

# Always-On L4 + L5 Work Queue

**Goal:** 100% of [ACCEPTANCE.md](ACCEPTANCE.md) criteria in both layers with independent QA receipts. **Queue owner:** Knowledge & Learning worker; QA steers priorities. **Checkpoint:** `1990a5243`; source may have advanced.

## NOW — L4, make knowledge trustworthy
- [ ] **Provisional/keyed identity integrity:** reconcile newest Core missing-key graph fix `1990a5243`; test uniqueness, stable derived IDs, negative tenant/site/origin/type/key cases and schema-change handling. Do not duplicate already-shipped Core corrections.
- [ ] **Safe relationships and temporal graph:** typed references/containment, provenance for every edge, confirmed vs hypothesized vs rejected state, as-of consistency, deterministic replay, no unexplained 'caused'.
- [ ] **Reviewable cross-session identity/type alignment:** preserve origin-scoped safe joins and type-drift hints; offer reversible user-reviewed canonical alignment proposals, no implicit fuzzy merges.
## NOW — L5, make feedback genuinely adaptive
- [ ] **Learning lifecycle — PARTIAL BUILT:** reviewed scoped proposals, model updates, rollback and synthetic before/after shipped; Core-owned rederive integration and product review controls still pending.
- [ ] **Persistence + replay — PARTIAL BUILT:** immutable snapshots, optimistic conflict/lock, migration, recoverable audit and scoped replay tested; crash recovery, retention and broader deletion semantics remain.
- [ ] **Calibration and evaluation — PARTIAL BUILT:** fixed 10-case synthetic held-out probability/contamination result recorded; distinct real sites, broader false-merge sets and confidence calibration remain.

## NEXT — next safe L5 specialist sprint (Core paused)
- [ ] L5-02: review conflict/out-of-order evidence and correct contradictory/promotion outcomes with adversarial Node fixtures.
- [ ] L5-03: quantitative multi-site held-out evaluation and calibration error on independently selected fixtures.
- [ ] L5-04: measured journal growth, recovery rehearsal and retention policy, preserving immutable audit history.
- [ ] Core dependency: authenticated correction/review/rollback CLI+API and pinned learner revision for derive, deferred until Core resumes. Do not edit Core-owned files.

## NEXT — existing coordination
- [ ] Coordinate minimal Core endpoint/derive contract proposals, without editing Core-owned CLI/server.
- [ ] Profile scaling of entity history, graph, priors and learning saves; optimize only measured bottlenecks.
- [ ] Explicit attribute removal/retraction event model and compatibility migration with Core.
## LATER
- [ ] Longitudinal semantic evolution and bounded explainable learning with account/tenant safeguards.
- [ ] Robustness under noisy captures, out-of-order events and schema churn.

## Pull contract
At finish: capture reproducible tests and SHAs, update checkbox **only after verified criteria**, state limitations, check latest Core files before next edit; pull next unblocked NOW, or NEXT when all NOW resolved. An independently accepted result is recorded separately from worker-executed tests. Never claim 100% based on code alone.
