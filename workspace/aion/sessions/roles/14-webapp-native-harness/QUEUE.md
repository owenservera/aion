# Webapp-Native Harness — Autonomous advancement queue

**Owner:** specialist agent 14; 2026-10-24 seed. This is not a replacement for QA #72/Core #68/UI #69/Research 09 or the repository's single active task/PM surface. No launch or cross-agent dispatch occurred by writing this queue.

## Outcomes, deliberately not implementation prescriptions

**P0 — Native response truth:** Source-linked atlas of actual ChatGPT/Claude webapp identities, message/generation shapes, content parts, artifact versions and task surfaces; preserve all observed native details, unknowns and coverage instead of flattening to message text.

**P0 — Capture Studio integration:** Demonstrate one coherent read/stream/action pipeline in the *existing* Studio actor, with content as well as control streaming, actual page and original-capture attribution, no duplicate native parser/runtime, and correct UI/CLI consumption.

**P0 — Real reply and freshness:** At least one genuine model answer and contextual follow-up with pre-send cursor, new user/assistant ownership, no historic-text false acceptance. Failed provider page remains incomplete, not a fake accepted capture.

**P1 — ChatGPT/Claude asymmetry:** Resolve actual Claude thread and Connect/protobuf response reconstruction from bounded real evidence; strengthen ChatGPT path-ops components, artifacts and branches. Do not assume API contracts map to web.

**P1 — Rich native outputs:** Preserve visible reasoning summaries, citations/research sources, code, charts, writing blocks, Claude Artifacts, created files, external tool activity and resource lifecycle as typed evidence. Task progress distinct from answer.

**P1 — Persistent agent goals:** AION-owned run/task graph, context ledger, provider session binding, checkpoint/recovery and cross-provider continuation on authorized, observed outputs.

**P1 — Learning and outcomes:** Only source-qualified accepted captures become learner-eligible; hold bad old-reply match, replay mismatch, wrong-origin and incomplete captures while preserving their inspectable raw evidence. Export usable Outcome Packet when actually proven.

**P2 — Dynamic capability capsules:** Page-specific available/unavailable/unverified actions incl. navigation, model/mode, project/workspace, editing, regeneration, branching, artifacts, stop/recover; let unsupported site surface report unknown.

**P2 — Usability and benchmarks:** One Studio `/chat` shell for all providers, original evidence drilldown, long streaming output performance, concurrent idle read and limited writer lease.

## 2026-10-24 — Z.ai Round 5 source-export steering (Agent 14 audit)

**Input:** Owner-uploaded Z.ai workspace TAR (4), reviewed without publishing its embedded .env/database/conversation state. Export SHA256SUMS lists 18 patches plus bundle; claimed AION bundle head `ef787f2b`, based on `bbf9d674`. GitHub main at audit: `1469512972`, eight intervening commits confined to role 14 docs, memory and skill. **The 18 patches were not seen merged on main; no authenticated ChatGPT/Claude two-turn acceptance was shown.** Z.ai reports 1,252 passing units, 1 TODO, and 14/14 Chrome synthetic-site integration steps: REPORT, not independently rerun suite.

**Independently reproduced, from exported new `src/capture/harness-runs.mjs` executed under Node 22 in a temporary synthetic local directory:**
1. `Promise.all` of two `step(run.id,{key:'same',tool:'read',args:{}})` calls against one asynchronous executor yielded **2 executor calls, 2 fulfilled promises, 1 persisted step**. No in-flight reserve or interprocess arbitration; same-key exactly-once is *not proven*.
2. After a successful `step` under `key:'same',tool:'read',args:{}`, requesting `key:'same',tool:'DIFFERENT_TOOL',args:{}` returns `replayed:true` and the original `read` step. The idempotency conflict check compares only arguments digest, not the tool identity.
3. Inspection shows the step is durably recorded only *after* `await toolExecutor`; crash-after-effect-before-persist is an unfenced recovery window at run scope. Automatic re-execution of failed steps is unsafe unless effect uncertainty has been reconciled; nested send journal is necessary but not a blanket warranty for every tool.
4. `conversation-capsule.mjs` uses profile selectors + cached conversation view, not a fresh actual-page affordance measurement. Its `supported` is **runtime-gate-eligible** rather than verified site capability. Report observed-versus-inferred evidence and expiry without pretending profile selectors prove the live UI.
5. `shapes/observation.mjs` is a useful loss-aware projection but exposes bounded previews and basic part labels; it does **not yet prove** full native block/revision/Artifact/Cowork semantics, or Claude DOM↔Connect/protobuf reconstruction.

**Direction for next Z.ai round — in this order, without another sandbox dashboard or second browser actor:**
- **R1 promotion readiness:** import/rebase 18 sequenced patches onto latest `origin/main` only after checking concurrent work; verify manifest, run complete suite + Chrome synthetic integration, and return commit SHA and changed-source paths. No force push, no bulk TAR upload.
- **R2 run-identity correctness:** implement per-run/step serialization or durable claimed/in-flight state with crash recovery, compare `key + tool + canonical args`, fence/reconcile uncertain effects, and test same-key concurrency across independent store instances, altered tool, crash-after-effect, and failed-step retry. No duplicate effect and no false success ledger.
- **R3 native fidelity:** extend existing observation/stream/DOM seam to preserve exact source references, typed content/replacement/revision, citations and native artifact/task lifecycle; unknown stays unknown. Prefer tested fixtures and realistic saved-site data to diagram growth.
- **R4 capsule/UI/consumer:** distinguish `profile-declared`, `page-observed`, `runtime-eligible`, `effect-proven` and `unsupported`; surface truth in existing `/chat`, including streaming, readiness, no-send recovery and same-thread evidence without new UI products.
- **R5 live qualification handoff:** produce a short Windows-local, owner-controlled ChatGPT→Claude test matrix with pre-send cursor and G1–G7; treat login wall, challenge and blocked provider as incomplete observations, not accepted outcomes. QA #72 currently records fresh controlled captures **deferred 2026-10-23**; resolve current owner/local authorization before sending.

**Owners and routing:** Development/Core #68 implements capture/runtime seams; UI #69 presents evidence; QA #72 independently qualifies; Knowledge #70 and Value #71 consume only qualified captures; role 14 owns taxonomy/evidence/negative cases, *not* a competing renderer/actor. Writing this queue does not launch or notify Z.ai. Reply with source commit, tests, evidence class, unresolved losses and the highest-value next failure, not a generic progress report.

## Implementation handoff now published — 2026-10-24

Agent 14 can publish **ready-to-integrate, isolated specialist components and adversarial tests** to GitHub for Z.ai to pull; this owner-directed work is preferred to documentation-only handoffs when a concrete missing seam is known. Keep canonical runtime changes with Core/Z.ai; no competing actor or untested overwrite.

**Shipped:** [Round 6 implementation source + tests + guide](implementations/round6/README.md) (GitHub main publication `5debf2286b9a6a9becd97c6bb75086d563474048`). Hardened drop-in run store + preflight adapter, 18/18 focused Node22 synthetic tests; exact remote readback verified. [Core #68 handoff](https://github.com/owenservera/aion/issues/68#issuecomment-6384442742). Pending Z.ai branch reconciliation, full product suite, Windows crash/lock and authenticated provider acceptance. Original Z.ai legacy tests contain two superseded unsafe expectations; guide identifies them.

## First agent-owned research actions
1. Check current repo HEAD and the latest Z.ai execution artifacts. The original ten Z.ai patches are not integration proof.
2. Compare native shape structures for a citation-rich ChatGPT response and one Claude Artifact against provider docs and saved captures; explicitly identify which evidence exists and what cannot yet be observed.
3. Design the minimum loss-aware common projection plus content/control event contract that uses the current Studio runtime.
4. Give Core/UI/QA/Z.ai a compact implementation-ready *outcome* and negative-test examples. **Executor chooses engineering path.**
5. Refresh only material specialist findings; no broad speculative feature-building, no duplicate research intake queues.

## Definition of useful progress
The next person can answer: *Which native shapes are observed? Which are official-only? Which IDs are safe? Where does original evidence live? What is projected and what information is lost? Which page actions are actually available? Can an AION run resume without unintended duplicate effects?* A change to a Markdown table without new evidence is not a milestone.
