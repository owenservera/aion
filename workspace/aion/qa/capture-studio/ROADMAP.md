> **Alignment checkpoint — 2026-10-21, baseline `cb63d79d3`:** Owner reports **Core PAUSED**. Knowledge & Learning specialist completed scoped SITREP at `6a6b8f7`; `STATE.json` still says `SITREP_COMPLETE_BUILD_NOT_STARTED`. Its next non-overlapping target is L5 durable scoped corrections and safe concurrent-write persistence in `learn.mjs`, including bounded specialist tests. This is a **recommended next build**, not completed source, running background execution or accepted criteria. UI continues integration (`cb63d79` delivered derivation outcomes, workflow trail and auth guidance). Core's later `286dd37` and `6db122e` were committed before this checkpoint and are not authority to resume Core. QA tracks review of specialist changes and makes any Core API/derive dependency a parked proposal rather than dispatching to paused Core.

> **Next UI priority — integration:** The UI lane's [Sprint 03 Integration mission](../../ops/capture-studio-ui/SPRINT-03-INTEGRATION.md) is queued after its source-delivered Trusted Knowledge Workspace sprint. Focus: coherent capture → session → model/entity → continuity/graph → evidence flows, current Core derivation-status contracts, client state consistency, failure/recovery and integration testing. UI owns frontend/client state; Core owns API/backend; QA independently verifies. This planning record does not claim Sprint 03 execution or browser acceptance.

**Mandatory global reporting metrics:** Read [REPORTING-METRICS.md](REPORTING-METRICS.md) and use [the counter](tools/count-metrics.mjs). In every overall/SITREP/layer progress/sprint overlay show mutually exclusive file and physical LOC counts per L1–L7, separate foundation/tests/evaluation, and totals; sprint file/LOC deltas require pinned baseline comparison. If not measured, explicitly mark LOC unavailable; never substitute bytes or projections for measured LOC.\n\n> **NEW specialist lane — L4/L5 completion:** [Knowledge & Learning worker](../../ops/capture-studio-knowledge-learning/README.md) owns a [standing queue](../../ops/capture-studio-knowledge-learning/CONTINUOUS-QUEUE.md), [SITREP](../../ops/capture-studio-knowledge-learning/SITREP.md), and [14-point acceptance contract](../../ops/capture-studio-knowledge-learning/ACCEPTANCE.md). Goal: independently accepted 100% for Knowledge & Relationships and Learning & Adaptation, with no percent inflation. Core continues source/CLI/backend integration and must coordinate overlapping `src/intel` edits; UI continues client experience; Systems advises; QA independently verifies. Baseline current source `1990a5243` includes recent missing-key graph fix and UI workspace delivery. New worker is **prepared**, not automatically started.

> **Coordinated build decision — 2026-10-21:** At head `64f1ee89`, Core and UI have shipped new source and Systems finished `ASSESSMENT-01.md`. The next large parallel sprint is [Core Sprint 03](../../ops/capture-studio-core/SPRINT-03.md) plus [UI Sprint 02](../../ops/capture-studio-ui/SPRINT-02.md). Core fixes missing-key alias and successful-empty derivation, strengthens contracts/history; UI builds read-only entity/graph/drift evidence workspace. QA owns independent verification and integration reconciliation. These are **queued** missions, not started agents or accepted functionality. Previous origin-wide unsafe cross-host joining is mitigated by `97463264`; same-origin tenant ambiguity and unproven runtime acceptance remain. Systems evidence: [assessment](../../ops/capture-studio-systems/ASSESSMENT-01.md).

# Capture Studio — QA-owned steering roadmap

**Updated:** 2026-10-21 (team lane launch preparation). **Authority:** owner-directed QA stewardship of steering, alignment and light roadmap. **Recon baseline:** AION main `49095348141646ba8d90bfc27c30e8fa0d1c6eda` (source/document inspection, not executed acceptance). **State:** proposed sequence; lane owners remain autonomous. No GitHub write wakes another agent.

## Always-on engineering pull queues

- [Core continuous queue](../../ops/capture-studio-core/CONTINUOUS-QUEUE.md) — high-level Now/Next/Later; owner Core.
- [UI / Integration continuous queue](../../ops/capture-studio-ui/CONTINUOUS-QUEUE.md) — high-level Now/Next/Later; detailed UI work remains in its existing TASK-QUEUE; owner UI.
- QA/Steering maintains prioritization and cross-lane dependencies; each lane autonomously pulls the highest-impact unblocked NOW item after completion and records a commit/evidence receipt. A queue is not a running agent or QA gate. Completed source tasks should not be automatically recycled.

## Team steering checkpoint — 2026-10-21 (owner status)

| Lane | Owner-reported state | GitHub evidence distinction | Next steering treatment |
|---|---|---|---|
| Core | **Assigned four-task cycle complete** | `cc536481` identity safety source patch and `229678df` CLI/API continuity contract committed; no independent full acceptance receipt seen | Mark cycle complete, keep available for targeted interface questions; do not reassign Core's completed checklist |
| UI / Integration | **Working** | UI queue and launch documented; no fresh UI implementation receipt observed in this read | Continue UI independently; reconcile API contract on delivery |
| Systems | **Full assessment running** | Systems queue and launch documented; no finished assessment receipt observed in this read | Await source-backed ranked recommendations; do not interrupt |
| QA / Steering | **Active** | QA roadmap and historical bounded graph evidence committed | Own integration steering, independent acceptance, owner-facing decisions and consolidated evidence |

**Critical rule:** owner-reported agent activity/completion is valid coordination context, not proof of an executed test. GitHub changes alone do not wake an agent. This note does not impose new gates or change lane boundaries.

### Steering queue (small, nonblocking)

- [ ] **ST1 — Contract reconciliation (QA):** review Core's delivered CLI/API contract against current frontend calls, create discrepancy list only if evidence supports it.
- [ ] **ST2 — UI receipt intake (QA):** when UI posts commits, compare actual UX against continuity/provenance/error-state contract; log evidence and missing integration details.
- [ ] **ST3 — Systems synthesis (QA):** when assessment lands, rank architecture issues by cross-layer impact (identity × semantics × time × provenance), near-term cost and verification feasibility; retain decisions for owner.
- [ ] **ST4 — Independent acceptance (QA):** execute pinned current-sha temporal graph and two-session continuity tests; distinguish Linux Node module tests from authenticated API and Windows/Chrome acceptance.
- [ ] **ST5 — Regroup (QA):** produce one concise owner briefing with what shipped, defects proven, recommended next intervention and who owns it, rather than independently redirecting the other lanes.

## Team activation checkpoint

- Core delivered source change `cc536481aaab466fd7e6cbe00b63f007027dd588` to isolate missing/ambiguous inferred keys; acceptance remains pending; do not assume remaining Core tasks complete.
- UI execution queue and launch: [UI TASK-QUEUE](../../ops/capture-studio-ui/TASK-QUEUE.md) / [UI LAUNCH](../../ops/capture-studio-ui/LAUNCH.md).
- Systems investigation queue and launch: [Systems TASK-QUEUE](../../ops/capture-studio-systems/TASK-QUEUE.md) / [Systems LAUNCH](../../ops/capture-studio-systems/LAUNCH.md).
- These are **prepared tasking artifacts, not proof that agents have started**. GitHub commit alone cannot initiate their sessions. Owner may launch each using its command.
- QA/Steering coordinates cross-lane integration and evidence without restricting Core development.

## Architecture stewardship — accepted source of orientation (owner directive)

QA/Steering owns keeping the **alignment, freshness and leverage interpretation** of Core's [seven-layer architecture](../../ops/capture-studio-core/LAYERED-CAKE.json) current across Core, UI and Systems. Core retains authorship of its detailed architecture JSON and ownership of backend/engine decisions; QA must not modify Core-owned files unilaterally. The owner's supplied architecture assessment is context, **not a new implementation acceptance**; it was pinned to old main `9fac8c50`, whereas the activation recon observed `cc536481` and subsequently this roadmap's main progressed.

**Seven core layers, bottom to top:** (1) Capture & Observation, (2) Evidence & Memory, (3) Interpretation & Derivation, (4) Knowledge & Relationships, (5) Learning & Adaptation, (6) Behavior & Reconstruction, (7) Experience & Control. **Four vertical leverage threads** and **separate mission-critical operational foundation** remain canonical in `LAYERED-CAKE.json`; do not turn the seven layers into seven unrelated queues.

**Source-assessment only:** layers 1–2 substantial; 3–7 partial. No percentages or independent QA pass results. Highest architectural discontinuity is agreement among **identity, semantics, time and provenance across sessions**, particularly under schema evolution. Other gaps: temporal retractions, correction propagation, causal/reconstruction fidelity, model/graph correction UX.

**Steering implications:** prioritize cross-layer contracts and evidence continuity over isolated feature counts; ask Systems for risk-ranked schema/identity alternatives; keep UI wording honest about confidence and history; let Core choose implementation while QA independently tests. Distinguish observed code from tested behavior at every update.

## NOW — close the existing capture → knowledge → history vertical slice

| Lane | Recommended work | Dependencies | Evidence / exit signal | Status |
|---|---|---|---|---|
| QA / Steering | Re-run pinned temporal graph regressions at current implementation; test two dated same-site keyed sessions and unrelated same-key site; verify as-of, partial fields, deletion/rederive and incomplete derivation; reconcile receipt inventory | Pinned source + Node 22; authorized Windows runner for browser-only checks | Actual test logs, precise SHA, reproducible fixtures, explicit gaps | **Proposed; unexecuted on current source** |
| Core | Maintain and clarify authenticated continuity API + CLI schema, identity scope and timestamp/completeness semantics; resolve evidenced regressions | Existing read-through continuity and graph implementation | CLI/API contract examples; tests and evidence when performed | Implemented first slice; unverified |
| UI | Improve existing Sessions continuity explorer with truthfully labeled provenance, history, unavailable state, error/loading and keyboard/mobile usability | Existing Core API; mocked fixtures for missing behavior | Inspectable UI with demonstrated flows, no fabricated knowledge | Lane scaffolded; live UI unverified |
| Systems | Independently assess tenant collisions, schema/type drift, temporal retractions and O(total revisions) scanning; rank low-risk interventions | Current Core model and layer map | Short tradeoff/evidence report, not unilateral implementation changes | Advisory, read-only unless owner directs |

**Cross-lane seam:** Core publishes meanings and machine-readable shapes; UI consumes them and may mock proposed additions; Systems advises; QA reconciles mismatches and verification, without gating daily development.

## NEXT — evidence-led hardening

1. Type drift / renamed type hypotheses with explicit provenance and manual confirmation; **never silently fuzzy-merge**.
2. Scaling assessment of read-through continuity before introducing persistent indexing or another mutable source of truth.
3. Correction and review workflows with reversible, scoped learning; distinguish observed state from inferred relationships.
4. Exposure of sampling/truncation, missing datasets, gaps and undated observations throughout the product.

## LATER — system-level acceptance

- Capture/replay fidelity on a representative website-family matrix and owner's Windows Chrome environment.
- Temporal validity/retractions beyond simple historical status changes.
- Cross-family generalization and calibrated confidence only with independent evidence.

## Steering decisions and escalation

- **Approved by owner:** QA owns roadmap, cross-lane alignment and QA records; ordinary safe QA-owned commits/pushes may proceed unilaterally.
- **Recommendations, not approved scope reassignment:** priorities above, deferral of new DB and fuzzy merges.
- **Escalate:** material Core/UI contract disputes, destructive operations, privacy/security hazards, or decisions requiring product-scope change.
- **Do not:** overwrite Core/UI/Systems files, interrupt active development, create acceptance gates, or characterize source-only changes as executed tests.

## Risk and verification register

| Concern | Evidence class | Action |
|---|---|---|
| Historical graph temporal defects (undated edges, rejected-edge history) | Reproduced at `8218e6c`: 3 failed / 6 total; later code changes present | Retest; don't mark as still failing |
| Cross-session continuity | Sprint 02 code inspected, no current execution receipt | Independently verify key scope/history/API/UI |
| Same-site multi-tenant false joins | Design limitation / hypothesis | Test adversarial tenant fixtures |
| Missing derived data, timestamps and partial revisions | Design contract + source inspected | Test completeness and as-of honesty |
| Scan cost | O(total revisions) documented in source | Measure against realistic history |
| Live Chrome/Windows fidelity | Evidence gap | Only claim after real runner receipt |

**Source pointers:** `../ops/capture-studio-build-sprints/SPRINT-02-BUILD.md`, `../../ops/capture-studio-core/LAYERED-CAKE.json`, `FINDINGS.md`, `STATE.json`, and product `QA-NEXT-TESTS.md`. Paths relative to repo may be followed from `workspace/aion/`; they are not runtime receipts.
