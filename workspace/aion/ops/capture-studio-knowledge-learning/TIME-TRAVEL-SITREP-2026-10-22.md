# Knowledge & Learning — Massive SITREP and Time Travel Assessment
**Date:** 2026-10-22. **Read-only source baseline:** `6dd74e6bdc3fbae422dfd4a35397bd907b890f91` (`main`). **Evidence class:** pinned GitHub source/docs/commits and prior recorded execution receipts; no new Node/browser tests or product-code changes in this assessment.
**Agent:** Knowledge & Learning (L4/L5). **Current authority:** Core reactivated for specifically authorized October 22 Sprint 1; UI and Systems have Sprint 1 source closeouts; QA Sprint 1 audited source; L5 Sprint 01 builder-delivered, independently unaccepted.
**Do not treat this document as a live-agent wakeup or acceptance receipt.**

## 1. Executive determination
The system already has several materially different *time travel* mechanisms: (a) L1/L2 raw capture transport/DOM reconstructed as of an event time, (b) L4 temporal graph revisions/edges, (c) exact-origin cross-session continuity folded as of time, (d) L5 immutable learner-version history/rollback, and (e) UI sliders/date-time controls. There is no independently accepted coherent *historical truth snapshot* combining all five. This is a coordination/semantics gap, not a mandate for a new database.

The most valuable contract is to distinguish **observed at capture time**, **derived using model revision**, and **known/approved by a later actor at review time**. A model correction in October must never be silently presented as something the system *knew* in September. Every historical response needs explicit origin session/seq/time, derivation/learner version, completeness/gaps and inference status.

## 2. Fresh project delta
- Current canonical product: Capture Studio capture/drive engine; Development/Track B is intended consumer under owner consolidation decision. AX-0022/23 remain draft and unaffirmed in the canonical exchange per QA Sprint 01.
- Core's October 22 Five Sprint Plan expressly resumes Core Sprint 1; old specialist notes saying Core paused are stale. Core source-delivered no-fresh-key resend and typed numeric/text/legacy continuity negatives; full native/current-head independent acceptance is pending.
- UI Sprint 1 source-delivered Chat/Drive -> exact saved Session -> Knowledge links (46/46 isolated V8 UI checks in its record). Real authenticated browser acceptance pending.
- QA Sprint 1 identified source-grounded family eligibility gap: campaign may consolidate SHAPES before reply calibration; library build currently checks derived SHAPES rather than accepted-capture evidence. This is **not proof that L5 weights actually changed**; but the upstream eligibility gate is not proven.
- Historic measured code footprint: 205 tracked files, 165 JS/MJS/HTML files, 40,510 physical LOC at `34e1a913`. This is NOT current-head physical LOC. L4 5/1219; L5 3/630; L6 4/1159; L7 9/3977 (file count/LOC in each).
- Specialist L5 Sprint 01: versioned journal, scoped proposed/approved/rejected corrections, rollback, synthetic held-out gains committed. The worker's 14-item L4/L5 independent-acceptance ledger remains 0/14; prior builder evidence is not independent QA.
- Re-read source shows Core-owned integration hub and CLI now expose learning proposals/reviews/rollback/version reads, superseding the former "not wired" assumption. Derivation still consumes a mutable learner instance without recorded pinned learner revision in its `KNOWLEDGE_STATUS`/model receipt.

## 3. Time travel surface map
| Surface | Current source | What is implemented | Important limitation |
|---|---|---|---|
| Capture event replay | `src/replay/derive.mjs:stateAt`, `src/store/raw-index.mjs:iterateRaw`, CLI `replay --at`, API `/sessions/{session}/replay/state` | Re-reduces raw records through chosen time, streams, assembled texts, current DOM blocks, actions/nav/gaps | Not a proven complete time-ordered reconstruction under out-of-order timestamps; DOM capped to 200 blocks; unknown preattach/lost data not restored |
| Stream replay | CLI `replay --stream --speed/--instant`, `reconstructStream`, API `replay/streams/{sid}?at` | Timing-aware frame/delta assembly and raw stream bytes | Single-stream replay is not a full correlated turn or web-page reconstruction; gap/patch ambiguity remains |
| L4 graph | `src/intel/graph.mjs:TemporalGraph.stateAt`, CLI `knowledge at --t`, API `knowledge/entities|graph?at` | Timestamped entity field folding/removals, historical edge status and observation support | Revisions reconstruct an inferred model; derivation timestamp/model revision is not separately pinned; equal-time conflicting values need explicit uncertainty |
| Cross-session | `src/intel/continuity.mjs:buildSiteContinuity({asOf})` | Read-through origin/typed-key exact joins and as-of history with partial/removal semantics | Same-origin multiaccount identity not guaranteed; undated revisions cannot prove state; uncertain historical identity remains |
| L5 model | `src/intel/learner-journal.mjs`, `src/intel/learn.mjs`, CLI/API `learn versions/rollback` | Immutable revisions, audit trail, correction/reversion, version comparison/lineage, optimistic writer conflict | No replay of derived result under an explicitly selected historical model revision; crash-orphan lock/recovery and retention not independently verified |
| UI | `src/studio/ui/index.html`: session time slider, Knowledge `datetime-local`, continuity as-of picker | Historical controls and some historical responses | At Knowledge refresh, `at` is passed to continuity only, while graph/model are fetched without it (source-confirmed inconsistent-time UX) |

## 4. Source-grounded risks and concrete regression requests

### TT-F1 — HIGH: UI mixes historical and current knowledge
In `src/studio/ui/index.html:1059–1064`, Knowledge `refreshKnowledge()` constructs an `at` suffix for `.../continuity` but requests `.../graph` and `.../model` without the timestamp. `S.knowledge.at` labels the combined result as selected historical time. Regression: select T before an edge/revision, verify graph and entity/continuity panels all show the same as-of horizon; no future edge or model-only information should be presented as historical. **Owner: UI; Core to confirm legacy endpoint historical semantics; L4/L5 to define correct labels.** The newer `/api/v1/sessions/{session}/knowledge/graph?at` exists, so reuse available contract rather than creating a second API.

### TT-F2 — HIGH: raw time cutoff assumes nondecreasing event timestamps
`src/store/raw-index.mjs:iterateRaw` uses `if (r.t > toT) return`, and `src/replay/derive.mjs:stateAt` breaks when a raw record exceeds T. Raw records are **sequence** ordered, and the source does not establish a nondecreasing `t` invariant. Counterexample: seq1/t100, seq2/t300, seq3/t200, query T250 -> seq3 is never visited. Establish source negative via actual Node synthetic segmented log, indexed/unindexed reads, out-of-order timestamps and time boundary; decide whether to scan/skip with verified monotonic segment bounds, or filter by time without early return. **Owner: Core (raw/replay).** This is a source-determined failure mechanism given nonmonotonic timestamps, **not** a newly executed current-head failure reproduction.

### TT-F3 — HIGH: model-time ≠ event-time
`src/replay/derive.mjs` calls `discoverModel(... learner: L ...)` then overwrites `MODEL/GRAPH/KNOWLEDGE_STATUS` without persisting exact learner revision/digest and derivation recipe. Historical graph `stateAt(T)` is constructed from the *latest derivative*, not necessarily the knowledge the system held when event T occurred. A future correction can revise interpretation of the past. Define query types `eventAsOf` versus `knowledgeAsOf`/model revision; capture derived lineage to immutable evidence, and abstain when model/recipe unavailable. **Owner: L5 contract + Core derivation integration.**

### TT-F4 — HIGH: derived is not accepted or learning-eligible
QA Sprint 01 `QA-S1-F1` observes campaign `deriveAndConsolidate` before final reply-matching and library `hasDerived = !!shapes` eligibility. The design's G1–G7 `acceptance.json` is not implemented in the inspected code. Unassessed, incomplete, failed and corrupted captures must not be promoted into canonical family priors/learning. Keep raw for inspection; separate eligibility of *observation* from eligibility of *supervised training signal*. **Owner: Core acceptance and family-build gate; L5 defines downstream learning gate; QA independent negative tests.**

### TT-F5 — MEDIUM-HIGH: temporal conflicts, provenance and view bounds
Graph folds dated revisions, preserves edge status history and support snapshots, and continuity flags untimed/conflicting activity; yet same-timestamp conflicting field updates, missing timestamps, ambiguous edge evidence, truncated DOM/results and source gaps require adversarial tests. Never treat undated evidence as epoch 0 or present confidence as independently calibrated. **Owner: L4/L5 specialist semantics, Core source integration, QA tests.**

### TT-F6 — MEDIUM-HIGH: revision journal interruptions
`learner-journal.mjs` writes a historical revision snapshot then current state, under a directory lock. Crash between writes can leave reserved next snapshot with old current pointer; next save correctly refuses the conflict but recovery requires an explicit verified protocol. Crash can orphan lock. Model revisions accumulate without measured retention budget. **Owner: L5 specialist.** Do not delete an orphaned lock or snapshot automatically without authority/liveness and integrity proof.

### TT-F7 — MEDIUM: review actor/evidence authorization
Core's new learning routes accept `body.actor` and `body.evidence`, while the surrounding loopback token authenticates the Studio session rather than independently proving the claimed review actor or captured evidence reference. Any promotion across site/account boundaries requires validated authority and explainable lineage. **Owner: Core authenticated API + L5 scope/evidence validation.**

## 5. Acceptance distinction and proof gates
**L4 K1–K7: 0 independently accepted of 7. L5 A1–A7: 0 independently accepted of 7.** This does not mean no implementation. No current-head native Node, Windows/Chrome or independent time-travel acceptance was executed in this SITREP.

Minimum pin-and-execute fixture matrix:
1. Two sessions same origin and typed key; different origin, tenant/account, numeric/string and legacy keys are negative joins.
2. Event revisions at t100/t200 with changed+removed+unknown attribute, late and equal timestamp collisions; `at=150` and `at=250` snapshots.
3. Edge at t200 and rejection at t300: at t150 absent, at t250 hypothesis, at t350 rejected/absent; evidence/support as-of must not include future observation.
4. Sequence timestamps [100,300,200] and equal-time conflicting event order; indexed and full raw scan must agree at t250.
5. Learner revisions L1, L2 with an approved correction and rollback L3; compare `eventAsOf` identical raw evidence with distinct `modelRevision` interpretations. Current derive must report inability to pin rather than pretend.
6. Missing/torn/compacted raw, pre-attach blind spots, truncated DOM/stream preview and incomplete recording: time travel reports uncertainty and omissions, never fabricated coverage.
7. Mixed accepted/unassessed/rejected sessions and malicious/invalid acceptance sidecars must yield **zero unapproved family training signals**.
8. UI time selection T must reach every temporal panel, survive session switching without stale data, and label nonhistorical model metadata as current.

## 6. Five nonoverlapping next sprints — proposed
| Sprint | Owner and mission | Minimum exit |
|---|---|---|
| TT1 — Temporal truth contract | L4/L5 specialist defines typed source/valid/knowledge/review timestamps, model+recipe revision lineage and labels; QA records negative fixture plan | Schema/query example and tests demonstrate "captured then" vs "inferred now" cannot be conflated |
| TT2 — Deterministic raw and graph replay | Core fixes `toT` sequence-order assumption; L4/L5 supplies event/edge same-time and out-of-order adversarial fixtures | Indexed/full replay match; gaps disclosed; no future leakage in graph snapshots |
| TT3 — Evidence admission into learning | Core implements persisted versioned acceptance gate & eligible family build; L5 implements proof-required learner intake/promotion | Rejected/unknown/unverified captures can be replayed but never treated as approved training |
| TT4 — Versioned historical intelligence | L5 wires/defines model-diff, audited correction effects, recovery drills and deterministic historical derivation contract; Core pins/rederives learner recipe metadata | Same raw evidence interpretable at two explicitly chosen revisions, reversal auditable and reproducible |
| TT5 — Integrated historical explorer and acceptance | UI fixes mixed-time graph/continuity; QA runs pinned native Node, unauthorized/no-send, representative offline and permitted browser proofs | One time picker, consistent graph/entities/replay/model labels, native receipts and per-criterion independent QA |

This sequence complements Core/UI/QA **existing** five-sprint plans; it is an L4/L5 integration overlay, **not** five more autonomous agents or a competing project board. Prioritize TT1 and L5-owned recovery/eligibility contracts now, while Core works W4 and safety. UI owns TT-F1 patch.

## 7. Actions on this SITREP
- Read-only inspection of current GitHub main, role/state/queue, Core/UI/Systems/QA plans, canonical team communications, source and available prior evidence. No user website touched, no send attempted, no test suite executed.
- The specialist's state and queue must reference this assessment, **and** correct the stale phrase `Core paused`.
- If a later build is requested: recommend **High** thinking effort for TT1–TT4 source and semantic work; **Medium** for narrow status/receipt checks.

## 8. Execution update — TT1 specialist slice delivered (2026-10-22)

The earlier read-only SITREP is superseded for TT1 implementation status by [exact blob-pinned native Node receipt](EVIDENCE-TIME-TRAVEL-SPRINT-01.md). `src/intel/temporal-truth.mjs` and `test/unit/temporal-truth.test.mjs` were added, then future-knowledge-evidence leakage corrected. **16/16 native Node 22 tests passed; no Core/UI source changes.** The specialist contract distinguishes observed, as-known and retrospective lenses and never equates recomputation with archived historical belief. **NOT delivered:** actual `ScopedLearner` snapshot adapter integrated into Core derive, trust-anchored historical source digest, raw timestamp bug fix or UI as-of integration. Independent acceptance still K 0/7 + A 0/7. Next specialist slice: acceptance/learning eligibility negatives and detached historical model adapter; Core/UI own their corresponding integration seams.
