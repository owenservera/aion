# Knowledge & Learning — L5 Sprint 01 Evidence

**Date:** 2026-10-21. **Owner:** Knowledge–Learning specialist. **State:** implementation delivered; independent QA not accepted. **Core:** paused, unmodified. **Product commit checkpoint:** `bbe51cf6eadcfe6914949467653fdaba7d0a1863`. Evidence below is deliberately specific to the executable/code slice tested.

## Shipped product files

- `src/intel/learner-journal.mjs` — revisioned immutable snapshots, v1 archival migration, integrity hashes, exclusive writer directory lock, optimistic expected-revision comparison, atomic unique temporary files and durable file fsync; writes to existing `learner.json` path.
- `src/intel/learn.mjs` — integrates the journal without changing existing public `predict/learn/revert/save` API; `proposeCorrection`, `reviewCorrection`, `versions`, `reload`, `rollbackTo`, explicit actor/evidence/action audit, account+origin scoped models, bounded validation, corrected instance-override scope and accepted-only promotion.
- `test/unit/learner-journal.test.mjs` and `test/unit/learning-lifecycle.test.mjs` — specialist-owned regression suites. No server/CLI/derive/UI source edits.

**Implementation commits:** journal `faa927dc3e690501a78b765e39c67708fbdd954e`; learner `5f49d3a00296b449c8f6ad1e6b0d1dc1ebbc81fc`; tests `90f1fee72beb6533b79f90f410accd618b92c830`, `77f6d86562e4fa56c18fb117c895cace903cf725`, `bbe51cf6eadcfe6914949467653fdaba7d0a1863`.

## Executed tests (builder, NOT independent QA)

| Execution | Environment | Outcome | Scope |
| --- | --- | --- | --- |
| `node --test test/unit/learner-journal.test.mjs` | Node v22.16.0, isolated Linux workspace, same 4,485-byte journal module used for GitHub commit | **7 pass, 0 fail** | Revision snapshots/reload, stale writers, separate processes, truly simultaneous worker race, held lock, state-integrity tampering, migration of legacy v1 |
| Exact GitHub `learn.mjs` + `priors.mjs` compiled/executed in isolated V8 JS with in-memory journal and deterministic tokenization | Tool JavaScript isolate, pinned `learn.mjs` blob `32ea21e0ad125ec78ab685614afaa24d6e061612` | **14 pass, 0 fail** | Proposal/rejection, acceptance, changed inference, account isolation, audit lineage, reload, revert, snapshot rollback, stale-write rejection |
| Deterministic held-out synthetic replay using same pinned learner source | Isolated V8 (not Node/browser) | **10 held-out evaluations, numeric before/after measured** | 5 account-A positives, 5 account-B negatives, one approved account-A training example; role `text` threshold 0.5 |

### Numeric held-out result (synthetic, NOT multi-site real-world generalization)

| Metric | Before | After |
| --- | ---: | ---: |
| True positive | 0 | 5 |
| False positive | 0 | 0 |
| True negative | 5 | 5 |
| False negative | 5 | 0 |
| Mean positive `text` probability | 0.0016664 | 0.9606899 |
| Mean other-account `text` probability | 0.0016664 | 0.0016664 |

This narrow fixture demonstrates model update **and isolated effect**, not calibrated performance, broad false-merge risk, production accuracy, or integration acceptance. The two Node suites committed to GitHub were **not executed together with the full repository checkout**, which was unavailable in this isolated runtime. Their source is ready for normal Node 22 execution in an authorized checkout. Windows/browser and independent QA remain pending. Zero criteria may be labelled independently accepted.

## Source-file and physical LOC inventory (pinned GitHub file readback)

| L5 file | Physical LOC |
| --- | ---: |
| `src/intel/learn.mjs` | 351 |
| `src/intel/priors.mjs` | 74 |
| `src/intel/learner-journal.mjs` | 87 |
| **L5 source: 3 files** | **512** |
| `test/unit/learner-journal.test.mjs` | 80 |
| `test/unit/learning-lifecycle.test.mjs` | 106 |
| **L5 specialist tests: 2 files** | **186** |

Original specialist baseline: 2 source files / 348 physical LOC; this sprint added 1 source file and 164 physical LOC net (source-only). New dedicated tests add 2 files / 186 physical LOC. These are GitHub-fetched **L5 subset counts**, not a complete product checkout-based layer audit, and do not include shared imports or unrelated Core/UI/tests. LOC growth is not an acceptance percentage.

## Acceptance evidence matrix — L5 A1–A7

| Criterion | Builder disposition | Evidence / residual | Independent QA |
| --- | --- | --- | --- |
| A1 review + scoped reversible corrections | `locally_tested_partial` | Proposal/accept/reject/revert, account isolation; no product-facing review interface | Pending |
| A2 versioned learning changes future derivation | `implemented_partial` | Probabilities change and persist, but Core derive process not yet wired to reviewed, pinned model revision | Pending |
| A3 concurrent durable state | `locally_tested_partial` | 7 Node journal tests, version conflict instead of lost updates; needs Windows, crash/power-loss and integration tests | Pending |
| A4 held-out improvement + contamination | `locally_tested_partial` | 10 deterministic synthetic examples; representative multi-site held-out data, calibration/regressions still needed | Pending |
| A5 evidence/review lineage | `locally_tested_partial` | Actor/action/evidence/revision/timestamp audit fields persist; Core must authenticate actor, validate evidence refs | Pending |
| A6 contradictory/out-of-order handling | `implemented_partial` | Rejections and invalid scope/role/weight protected; out-of-order conflicting decisions and broader uncertainty not evaluated | Pending |
| A7 replay/migration/recovery/privacy/load | `locally_tested_partial` | v1 snapshot, integrity and rollback tested; local Windows crash recovery, volume, privacy and retention policy open | Pending |

All A1–A7 remain **0 independently verified / 7**; L4 remains **0/7**. Do not conflate builder checks with acceptance.

## Deferred Core integration dependencies (Core stays paused)

1. **Derive:** use the persisted `ScopedLearner(paths.learner)` for future derivations, pin/read back actual `learner.revision` in knowledge metadata; raw observations must never be rewritten as a side-effect of learning.
2. **API and CLI:** expose review and rollback workflow through Core-owned authenticated routes/commands (not implemented here). Obtain review actor from authenticated context and accept only immutable evidence references, never arbitrary sensitive payloads.
3. **Conflict handling:** translate `LEARNER_LOCKED` / `LEARNER_REVISION_CONFLICT` into a visible retry/reload action, not silent overwrites or generic success. Preserve pending edits until the user chooses resolution.
4. **Safety:** define per-account/tenant identity evidence and explicit privileges for site/family/global promotions. Never silently propagate an account-specific correction into broader scopes.
5. **Independent QA:** execute the complete checked-out Node suite and Windows/multi-process integration, crash interruption, provenance lineage, genuinely held-out multi-site calibration, regression and resource measurements.
6. **Operations:** interrupted process can leave `.learner-write-lock` requiring deliberate recovery; archive history accumulates and needs measured retention/recovery policy. Neither is silently cleaned up.

## Next specialist queue

- Add a deterministic source-level adversarial suite for account/page/origin/type scoping, contradictory review order and multiple saved corrections; document any remaining model-correction leakage.
- Profile writer throughput, journal size, snapshot retention and simulated interrupted writes with actual measurements; do not introduce background compaction without safety proof.
- Build calibrated held-out fixtures across distinct site/family profiles and evaluate false positives/negatives without training on evaluation labels.
- Request Core integration only after Core resumes; do not modify its files.
