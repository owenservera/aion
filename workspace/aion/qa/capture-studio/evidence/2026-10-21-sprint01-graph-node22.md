# Independent QA receipt — Capture Studio Sprint 01 temporal graph

**UTC observation:** 2026-10-21 16:29.
**Pinned product implementation commit:** `8218e6ccd751af3abbc4a4d753f17a5116fc1ca3` (Sprint 01 C4).
**Exact product module:** `src/intel/graph.mjs` blob `25607e1c4489695d9f162f0d954f6e22c33da427` — checked using `git hash-object` on local copy. The same blob was confirmed on main during the Sprint 02 checkpoint at `48edb473f2f7a0c639568897d174bbbe89091730`.
**Test source:** `workspace/aion/qa/capture-studio/tests/sprint01-temporal-graph.test.mjs`, blob `537a022a9b3d5d36a0ee86defdddcf3c2f1da317`.
**Physical test runtime:** Node.js v22.16.0 on Linux; no browser or Windows runner.
**Invocation:** `node --test sprint01-temporal-graph.test.mjs` in the QA tests directory, with the exact product graph blob at its repo-relative import path.
**Process status:** exit code 1 (failed assertions), 6 tests, 3 passed, 3 failed, duration 84.212899 ms. This is a bounded module exercise, NOT a full repository test suite, full captured-session integration test or Windows/browser acceptance.

| Check | Result | Observed vs expected |
| --- | --- | --- |
| C2 site-scoped reference lookup | PASS | Only same-site target `b1` connected; not unrelated `b2` |
| C2 `contains` same seq/sid across different sessions | PASS | 0 cross-session edges |
| C2 hypothetical action relation label | PASS | `kind=preceded` and original scored relation retained as evidence |
| Temporal edge to future entity at T=1000, entity born T=2000 | **FAIL** | 1 edge at T=1000; expected 0; nodes correctly 0 |
| Undated action-to-request edge at T=1000 | **FAIL** | 1 edge at T=1000; expected 0 |
| Rejection retroactively changes earlier graph state | **FAIL — known design gap** | Past T=150 goes from 1 edge to 0 after current rejection; expected historical 1 |

## Reproduction and cause

1. `buildGraph` calls `g.relate` for `rendered_as` and `preceded` **without `t`**.
2. `TemporalGraph.relate` persists absent times as `t: null`.
3. `TemporalGraph.stateAt(t)` uses `(e.t ?? 0) <= t`, which treats all undated edges as active since epoch. Future relations can appear even when `stateAt` correctly excludes future entity nodes.
4. `setEdgeStatus` mutates the edge's only status, with no timestamp/history; earlier `stateAt` results can change after a later rejection. This retraction/validity gap is explicitly noted as unfinished in the Sprint 02 mission.

## Disposition

**FIX REQUIRED** for temporal relationship provenance/historical replay correctness before declaring temporal graph acceptance. Preserve evidence and avoid silently assigning epoch time to undated relations. The rejection-history gap requires temporal validity/transition semantics; it is not evidence that Sprint 01 C2 site-scoping failed.

## Coverage gaps

Only `src/intel/graph.mjs` was byte-verified and directly executed. The complete product source, current Sprint 02 `continuity.mjs`, CLI/API workflows, W3 keyless linkage, full derive/storage integration, raw replay, performance, and Windows/Chrome capture were NOT executed in this receipt. None are accepted on this evidence. Changes to main after the pinned commit require independent targeted retesting.
