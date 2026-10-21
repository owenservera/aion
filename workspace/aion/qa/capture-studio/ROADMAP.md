# Capture Studio — QA-owned steering roadmap

**Updated:** 2026-10-21 (team lane launch preparation). **Authority:** owner-directed QA stewardship of steering, alignment and light roadmap. **Recon baseline:** AION main `49095348141646ba8d90bfc27c30e8fa0d1c6eda` (source/document inspection, not executed acceptance). **State:** proposed sequence; lane owners remain autonomous. No GitHub write wakes another agent.

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
