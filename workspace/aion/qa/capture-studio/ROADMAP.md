> **2026-10-23 OFFLINE QA STATE (dated; older blocks unchanged):** Code observed at main `4106b785` (working tree clean at observation). Locally demonstrated on synthetic data since `617f1067`: event identity, join keys, stream-to-DOM join, derive steps, stream maps, RF-1 byte spans, protobuf decoder, streaming caps, chat-load lab; UI panels are Build only (vm-stub tests, no browser run). `bun run test`: 759 tests, 758 pass, 0 fail, 1 todo. Replay-fidelity: 10 of 10 finished synthetic sessions faithful (todo S1-F1 open); native-shape-fidelity: 6 of 6 variants faithful.
>
> **Observed on saved real sessions (read-only; 107 sessions; counts only):** ChatGPT uses the path-ops dialect (28 sessions); about 590 previously unmapped events are now recognised. The stream-to-DOM join links 0 of 60 ChatGPT assistant turns (11 sessions): the saved DOM came from the old turn extractor (13-character turns); the fix is verified only on synthetic DOM. claude.ai traffic is connect+proto; reply field path `1.1.5.9` is a lead, not an established parse.
>
> **Open:** no live run on a real site after these changes; no real-Chrome performance number; longest synthetic stall 114–146 ms misses the 100 ms target; independent acceptance none (L4/L5 0/7); AX-0022/0023 absent from EXCHANGE.jsonl; issue #64 open; default local-raw mode bypasses stream credential guards by design (issue #65); fresh controlled captures deferred (owner decision, 2026-10-23).

> **2026-10-22 PRE-WINDOWS HANDOFF:** [Targeted local integration L0–L5 and feedback contract](LOCAL-INTEGRATION-ROUNDS-2026-10-22.md) now governs the next integration/testing cycle. Latest audited code baseline `a18407def` (not machine proof). Only short remote finishing tasks: Core source/runner contract + one-turn limitation; UI evidence/recovery; L4/L5 synthetic temporal fixtures; Systems observability map; Value Oracle offline V1 Outcome Packet; QA evidence triage. Start L0 boot and L1 synthetic fixture before real-site L2, preserve `run.json`, `steps.jsonl`, `metrics.json`, `failures.jsonl`, `summary.md` on Windows, share sanitized packets only; route findings to one owner and replay same fixture after source changes. **No new broad sprint, approval theater, automatic agent wakeup or assertion local tests ran.**

> **OWNER OVERRIDE — 2026-10-22 LOCAL PC DE-SECURITIZATION:** [Single issue #65 — local-owner high-velocity simplification](https://github.com/owenservera/aion/issues/65) is the active design/development steering priority. This is one user's local Windows app, not SaaS; **stop layering approval/grant rituals, default dry-run, mandatory per-send confirmation, one-turn limits, artificial 2000-character cap, 15-minute timeouts, fake human typing delays, unnecessary export restrictions or security-review process gates** onto the user's desired workflows. Core/UI should remove or make those constraints adjustable **in their already active sprints**. QA is advisory and parallel; do not stop builds for acceptance paperwork. Keep genuinely necessary integrity controls: exact browser target, one active sender/lease, unknown-send no-blind-repeat, locally stored evidence and recoverable state, and cheap loopback Host/Origin isolation to prevent hostile websites controlling the local API. Newly introduced cross-chunk credential guard is source-built but overly broad quarantine can discard useful local evidence: test fidelity losses and move sharing protection to explicit external export boundary where feasible. **No claim that security code has already been removed**: this is owner-authorized development direction and code audit/handoff. Prior no-Send/paused approvals in old notes are superseded by root AGENTS.md and owner authority; execution evidence and actual remote actions remain separately classified. No agent was auto-started by this note.

> **Steering update after simultaneous Core/UI/L5 delivery (2026-10-22):** Core W4 streaming guard now **SOURCE-MITIGATED** by `5993f882` (HTTP) and `57f38386` (WebSocket); QA V8 [Sprint 02 retest](SPRINT-02.md#5-post-source-reconciliation-during-active-team-builds) excludes 6/6 synthetic whole/split credentials before output, preserves one benign stream, and excludes one split WS credential. Native Node, end-to-end raw-log and local Chrome proof still pending; issue #64 stays open for verification, **not a request to reimplement shipped guards**. UI completed Sprint 2 recovery (62/62 V8 checks; independent native/browser pending). Knowledge/Learning TT1 temporal truth contract implemented and specialist tested (L4/L5 independent acceptance 0/7 each). **QA NEXT:** Sprint 3 non-monotonic temporal replay and Knowledge UI as-of consistency; parallel Sprint 2 lease/cancel/native retest. Development #43 consolidation handoff remains unacknowledged, no automatic agent wakeup.

> **QA Sprint 2 latest steering (2026-10-22):** [Five sprints](SPRINTS.md) and [Sprint 02 source/V8 execution](SPRINT-02.md) now take priority over older stale queue details below. **P0 source-exercised pre-disk risk:** split fake JWT/Bearer/JSON token patterns survive immediate per-chunk `scrubSecrets` masking; [Core W4 issue #64](https://github.com/owenservera/aion/issues/64) sent, not ACKed. **Positive verified-with-shims:** a previously uncertain conversation turn could not be resent with fresh key. UI next step: communicate strict `ONE_TURN_LIMIT` (do not promise Send again), and source-evidenced Session→Knowledge links already delivered; L4/L5 worker next: temporal event-time/model-version truth, *without* taking Core I/O/API. Systems next: source-only capture provenance/coverage. Development consolidation notification posted to [Track B issue #43](https://github.com/owenservera/aion/issues/43); AX drafts still absent. **Sprint 3 QA next:** source-linked time-travel, out-of-order timestamp and as-of cross-panel regressions. **Current source LOC unavailable:** 165/40,510 is historical pin `34e1a913` only. No changes to others' source/queues.

> **NEW QA program (2026-10-22):** [Five-sprint plan](SPRINTS.md) reconciles worklog W1–W18 against other owners' new sprint plans. [Sprint 01](SPRINT-01.md) executed ten static source-contract probes at `5eefb2e` and found a high-priority **family eligibility source defect** (Campaign consolidates before reply verification; family builder uses SHAPES without clean capture acceptance). **Source audit complete; product runtime and independent acceptance remain pending.** The updated Core sprint plan expressly records owner-authorized Sprint 1 resumption for its scope, superseding older paused notices; QA has not dispatched any agent. Next QA Sprint 2 tests no-duplicate-send, lease/cancel, split credential redaction and capture coverage. Source LOC previously measured only at `34e1a913` and is not a current-head count.

> **Latest steering source of truth — 2026-10-22:** [Full FF SITREP](SITREP-2026-10-22-FF.md) pinned at `34e1a913` supersedes stale Oct 21 status paragraphs below. 205 tracked product files; 165 measured JS/MJS/HTML files / **40,510 physical LOC**, seven-layer exclusive file/LOC breakdown and foundation/tests/eval in SITREP. Owner-approved consolidation: **Studio canonical browser capture/send engine, Track B client**; P0 AX-0022/0023 Exchange entries remain only drafts (no Development ACK). Latest source includes one-click Chat/Drive UI, conversation runtime and performance/connection cleanup fixes; full authenticated live evidence-clean acceptance remains pending. Core agent previously paused. Prioritize one authoritative browser actor, one clean end-to-end conversation, and confirmed cross-workstream handoff. **Source deliverables are not acceptance receipts.**

## 2026-10-22 — Team-wide internal rebaseline prompts (queued, no agent auto-start)

Five role-specific, **read-only** delta SITREP starters have been added directly to each existing role entry file. Run each *inside that agent's existing conversation*, not as a global instruction or GitHub wakeup. Each reads latest actual source, applies the **later unified-conversation revision** within `capture-studio/docs/DESIGN-live-drive-studio.md`, classifies proposal vs implementation vs observed runtime, and reports layer totals/LOC if actually measured. This supersedes obsolete 2026-10-21 queues as a **freshness directive**, not as an authorization to edit other agents' plans.

| Lane | Run command | Saved entry | Special safeguard |
|---|---|---|---|
| Core | `#AION @CORE ∆/SITREP — CAPTURE STUDIO REBASELINE` | [Core README rebaseline](../../ops/capture-studio-core/README.md#2026-10-22--internal-rebaseline-starting-prompt-read-only) | **Core remains paused**; no implementation or runtime |
| UI/Integration | `#AION @UI/INTEGRATION ∆/SITREP — CAPTURE STUDIO REBASELINE` | [UI Launch rebaseline](../../ops/capture-studio-ui/LAUNCH.md#2026-10-22--internal-rebaseline-starting-prompt-read-only) | Integrate rather than create more independent screens |
| Knowledge & Learning | `#AION @KNOWLEDGE-LEARNING ∆/SITREP — CAPTURE STUDIO REBASELINE` | [Specialist SITREP rebaseline](../../ops/capture-studio-knowledge-learning/SITREP.md#2026-10-22--internal-rebaseline-starting-prompt-read-only) | Training eligibility only from supported accepted evidence |
| Systems | `#AION @SYSTEMS ∆/SITREP — CAPTURE STUDIO REBASELINE` | [Systems Launch rebaseline](../../ops/capture-studio-systems/LAUNCH.md#2026-10-22--internal-rebaseline-starting-prompt-read-only) | Independent read-only architecture delta |
| QA/Steering | `#AION @QA/STEERING ∆/SITREP — CAPTURE STUDIO REBASELINE` | [QA Launch rebaseline](LAUNCH.md#2026-10-22--internal-rebaseline-starting-prompt-read-only) | Evidence-based global rebaseline; do not activate other lanes |

**Command semantics:** `∆/SITREP` is a rebaseline/reconciliation command, **not** a build or autonomous bootstrap. The copied full prompt in each file is the authoritative detailed role instruction. Use **High** thinking effort on these first deep-rebaseline runs, **Medium** for later narrowly scoped updates. GitHub updates do not automatically execute prompts.

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
