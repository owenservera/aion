# L4/L5 Time Travel Sprint 01 — Implementation & Evidence Receipt

**Date:** 2026-10-22. **Baseline main:** `02310fe5ae913c23a56fd16144b518b78eb0b4a6`. **Owner:** Knowledge & Learning. **Status:** BUILDER IMPLEMENTED + TESTED IN ISOLATED NATIVE NODE 22; NO INDEPENDENT QA ACCEPTANCE. **Core/UI source edits:** ZERO. **Authorized scope:** L4/L5 temporal truth/model-version contract, specialist-owned tests, queue/evidence/state.

## Source delivered

| Kind | File | Exact verified git-blob SHA | Physical LOC |
| --- | --- | --- | ---: |
| L4/L5 module | `src/intel/temporal-truth.mjs` | `89fa7c4d60e3dad8e9da1537307f3fe5858ce834` | 147 |
| Specialist Node tests | `test/unit/temporal-truth.test.mjs` | `f6b93ae2b8002fcfdbe4936eb3447e0b75a93a1b` | 147 |

**Implementation commits:** `5068b2513d524a5e8910caea8216b48d8897051d` (source), `c0532620f3124d1d78795cb5bf5333f08cffc6b3` (tests), `5b3819c172806152ddd6e12eec5e4a3a1c928e05` (future-observation guard), `960b23ceec27544f1516b023d76c2fc6997ffd3d` (regression). GitHub blob readback matches Node-tested local `git hash-object` for both files.

## Contract behavior

- Three explicit disjoint **lenses**: `observed` (recorded source only), `as-known` (latest journal snapshot with verified monotonic `savedAt <= knowledgeAsOf`), and `retrospective` (caller-pinned model revision). `eventAsOf` never silently defaults to current time. Numeric times are epoch **milliseconds**; ISO timestamps require explicit zone.
- An `as-known` model may only interpret source evidence observed no later than its knowledge horizon. Historic v1/untimed model journals, missing versions, unsorted/clock-regressing version history, time/revision conflicts and future evidence fail closed.
- `temporalPerspective` contains source-locator/fidelity metadata; supplied raw body, cookies, tokens or private prompt fields are not copied into response. Gaps, truncation, pre-attach unknown and missing timestamps yield partial/unknown results.
- Interpretation is **recomputed under a pinned model**, not proof of what the system historically believed. Even a syntactically plausible derivation receipt is labelled `derivation-metadata-present-not-independently-verified`; actual archived derivation digest/integrity verification remains a Core integration dependency.
- `compareTemporalRevisions` evaluates immutable journal snapshots through an explicit pure `interpret(snapshot)` callback. Neither journal nor captured raw is mutated, and it never falls back to the current model.
- No new raw store, server, CLI, graph engine, derivation pipeline, UI or background agent is introduced. This is a **specialist-owned contract**, not an end-to-end wired historical-view feature.

## Executed tests

Environment: isolated Linux container, **Node v22.16.0**, at **2026-10-22T17:43:09Z**. Source and tests had exact Git blob hashes matching the committed versions. Invocations:

```sh
node --test --test-reporter=tap test/unit/temporal-truth.test.mjs
node --experimental-test-coverage --test test/unit/temporal-truth.test.mjs
```

**Observed:** `1..16`, **16 passed, 0 failed, 0 skipped, 0 cancelled** in both runs. For `src/intel/temporal-truth.mjs`, Node built-in coverage showed **100.00% lines**, **92.96% branches**, **100.00% functions**. Coverage refers **only to this new module**, not L4/L5 overall.

The tests include: timestamp strictness, explicit-lens enforcement, no accidental learner access in observation-only mode, future/untimed evidence, partial/gap/unknown coverage, journal version selection, knowledge-time/revision conflicts, monotonic-clock safety, revision comparison/reversion semantics using synthetic model snapshots, no forged historical-belief claim from metadata, independently varied event/knowledge times, privacy of source metadata, invalid journal revisions and **evidence after knowledge time** rejection.

**Test limitations:** The suite imports the exact new module but uses a deterministic **in-memory journal fixture** with two synthetic model snapshots and callback-based interpretation. It does **not** exercise actual `ScopedLearner` rehydration, `LearnerJournal` on-disk replay, `derive.mjs`, graph/continuity, raw-log timestamps, Windows, authenticated APIs or browsers. Those remain planned integration/QA checks. Repository-wide Node `npm test` was NOT executed because a full checkout was unavailable in the isolated runner. Never claim this fixture is independent acceptance or actual multi-site accuracy.

## Measured source-footprint subset (fresh GitHub source readback)

| L5 source file | Physical LOC |
| --- | ---: |
| `src/intel/priors.mjs` | 98 |
| `src/intel/learn.mjs` | 416 |
| `src/intel/learner-journal.mjs` | 116 |
| `src/intel/temporal-truth.mjs` | 147 |
| **L5 specialist-relevant source subset (4 files)** | **777** |
| Existing dedicated L5 tests (3 files) | 260 |
| New `temporal-truth.test.mjs` | 147 |
| **L5 dedicated tests (4 files)** | **407** |

Physical LOC = newline-delimited lines excluding one trailing empty line. This is **not** the canonical repository-wide exclusive L1–L7 counter. The earlier QA global audit was pinned to `34e1a913` and must not be relabelled current. Code/test net additions for this sprint: **1 source file / 147 lines, 1 test file / 147 lines**.

## Criterion-specific status (not QA acceptance)

| Criterion | Builder state | Gap |
| --- | --- | --- |
| K5 temporal/as-of | `implemented_partial; locally_tested` | Core raw replay, graph and UI do not yet consume one enforced contract |
| K6 provenance | `implemented_partial; locally_tested` | Source locator + gaps included; link-to-actual-raw integrity proof still requires Core |
| A2 learning changes derivation | `implemented_partial; locally_tested_contract_only` | A detached actual ScopedLearner historical revision needs derivation integration |
| A5 model/review lineage | `implemented_partial; locally_tested_contract_only` | Revision/time selection tested; signed actor, actual review evidence and derivation recipe remain Core contracts |
| A7 deterministic replay | `implemented_partial; locally_tested_contract_only` | On-disk recovery, current-head native repo and multi-layer replay tests remain |

**Independent L4 QA accepted: K1–K7 0/7. Independent L5 QA accepted: A1–A7 0/7.** The test count is NOT criterion count.

## Core/UI/QA dependencies (not dispatched)

1. **Core raw/replay:** rectify `iterateRaw(toT)` early-return on nonmonotonic timestamps and `stateAt` second early break. Add index-on/off out-of-order negatives; this lane does not edit Core-owned code.
2. **Core derive:** pin model revision, recipe version, source digest, derivedAt and evidence completeness in derivation metadata, with explicit archived-historical vs recomputed interpretation status. Persist archive if product needs literal "what did we believe then." Validate raw manifest/acceptance, not arbitrary caller provenance.
3. **Core acceptance/families:** G1–G7 captured→verified→accepted gate and family promotion must exclude unassessed/rejected/corrupt captures. No implicit eligibility derived from `SHAPES` or a matching calibration response. L5 can later consume only authenticated accepted references.
4. **UI:** historical time currently filters continuity while graph/model remain current in the old Knowledge UI; one picker must apply consistent time semantics and honest model labels.
5. **QA:** independent pin-specific tests against complete checkout, actual learner+journal, graph/continuity, crash recovery, privacy negative fixtures and authenticated local Studio; do not accept K5/K6/A2/A5/A7 from 16 isolated tests.

## Next scoped sprint recommendation

L4/L5 next: build a **detached real ScopedLearner snapshot adapter with read-only tests against LearnerJournal**, then strict evidence eligibility checks backed by Core's accepted sidecar once it exists. Parallel specialist work can test v1 untimed history, orphan locks, interrupted revision commits, branch/clock conflicts and multi-site/account contamination. No live sending. Recommended thinking effort: **High** for implementation and **Medium** for narrow readback.
