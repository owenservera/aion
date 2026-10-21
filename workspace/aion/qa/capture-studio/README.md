# Capture Studio — Independent QA Workspace

> **Scope correction (2026-10-21):** This folder is for **ChatGPT independent QA**, not Claude Opus build sprints. For the requested **Opus fast build sessions with NO physical test creation or execution**, use [Opus BUILD-SPRINT LAUNCH](../../ops/capture-studio-build-sprints/LAUNCH.md). Do not launch this QA protocol when intending Opus implementation work.

**Owner:** ChatGPT — independent QA, cross-lane steering/alignment, and lightweight roadmap. **Implementation owners:** Core (engine/CLI/server) and UI (client). **Advisory owner:** Systems (algorithms/usability). **Authority:** owner direction, 2026-10-21.

This folder is deliberately separate from Opus's product code at `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`. **QA writes only here** (and project GitHub QA issues when helpful); Core and UI continue implementation independently. No edits to their product source, instructions, test proposals, or memory. The user is the relay when autonomous cross-agent delivery is unavailable.

**Mandatory global reporting metrics:** Read [REPORTING-METRICS.md](REPORTING-METRICS.md) and use [the counter](tools/count-metrics.mjs). In every overall/SITREP/layer progress/sprint overlay show mutually exclusive file and physical LOC counts per L1–L7, separate foundation/tests/evaluation, and totals; sprint file/LOC deltas require pinned baseline comparison. If not measured, explicitly mark LOC unavailable; never substitute bytes or projections for measured LOC.\n\n## Fresh-session entry point

Open [LAUNCH.md](LAUNCH.md). In a fresh ChatGPT conversation enter **`#AION QA CAPTURE STUDIO /SPRINT`** or paste the full launch instruction from LAUNCH.md. **Recommended effort: High.** Do not need previous conversations.

The fresh session must read this README, LAUNCH.md, STATE.json, the currently relevant QA findings, the exact target commit's Opus `QA-NEXT-TESTS.md`, and **all first-party Capture Studio source files** (including runtime entry points, import dependencies, existing tests, evaluation and configs). Report any files not inspected. Independently build a complete cross-system model, then run **real tests** in an available execution environment; simulation alone is not QA.

## Steering, alignment and lightweight roadmap (owner directive, 2026-10-21)

- This QA lane is also the **Capture Studio team steering/alignment coordinator**. Maintain a compact **Now / Next / Later** product roadmap, explicit owners, dependencies, integration seams and acceptance signals; link existing sprint plans instead of duplicating them.
- Core owns engine, capture, identity, continuity, persistence, CLI and server contracts. UI owns frontend, interactions and client-side integration. Systems owns independent architecture, algorithms and usability advice. QA owns independent validation **and cross-lane alignment**, not those agents' implementations.
- Identify conflicting assumptions, stale handoffs, API/UI contract mismatches and sequencing risks; recommend a smallest-next-step resolution. Distinguish **proposed steering** from **owner-approved direction** and from **implemented/verified** status.
- Coordinate without stopping ordinary development: do not impose QA gates, rewrite another lane's files, change their commitments unilaterally, or dispatch agents merely by posting a GitHub record. Escalate material conflicts and scope changes to the owner; use GitHub for authorized task distribution.
- Keep roadmap reporting lightweight: **Now | Next | Later**, owner, dependency/blocker, evidence/acceptance signal. Publish substantive cross-lane updates in this QA-owned workspace; defer accumulated defect handoffs or patches until the owner requests regrouping, except urgent destructive/security risks.
- Refresh the map against current source and each lane's latest committed work; do not mistake old Claude-specific build phases for a current model-switching requirement.

## Mission and boundaries

- **ChatGPT owns real testing:** executable unit/integration/regression/adversarial cases, differential and randomized tests, performance and capture/replay fidelity experiments; recorded evidence and retesting. If GitHub source is available but the repository is not directly mounted, fetch source at a pinned SHA and execute in a controlled local QA environment. Node source can be exercised directly; do not call it a complete repository E2E run unless dependencies and runtime truly match.
- **Opus owns implementation:** mental simulations, virtual code/graph walks and code changes. It does **not** write physical tests or run test suites under the Capture Studio owner directive. Opus's rolling pre-commit thought dump is a suggestion source, **not verification**.
- **No normal QA gates:** Opus commits/pushes and develops continuously; tests do not stop ordinary development. Only owner can stop development; concrete destructive/security-risk operations retain repository safety exceptions.
- **Latest versus pinned:** record the current `main` SHA when starting; **pin each experiment to a specific SHA**, so subsequent Opus commits do not invalidate its evidence. Refresh `main` at sprint completion; do not silently replace a target mid-run.
- **No false receipts:** distinguish measured runtime outcomes, inspected-code certainties, and untested hypotheses. Provide reproduction conditions, exact environment, inputs, actual/expected results, and root-cause evidence. Never claim that a test or Windows/browser run occurred unless observed.
- **Security/privacy:** no user secrets, authentication artifacts, raw private transcripts, or captured confidential data in repository or issues. No Playwright/Puppeteer; do not perform authenticated live browser actions from QA. Real Windows/browser-only cases require an authorized Windows runner and independently assessed receipts.
- **Version control:** owner authorizes ordinary safe, scoped QA commits and pushes. Check latest main before editing and avoid overwriting concurrent changes. QA commits touch this QA folder only. Do not change globally loaded memory or other agents' instructions.

## Sprint policy

**Fully autonomous (A).** No approval round after intake. Each session identifies the highest-impact experiments within its assigned mission, executes them, investigates causes, commits reproducible artifacts/results, updates [STATE.json](STATE.json), and ends with a concise summary: proven defects, limitations, acceptance disposition, next sprint. If time/context limits occur, checkpoint promptly. Do not generate reports without substantive findings.

### Milestone sequence

1. **Intelligence** — schema induction, identity, learning, relevance, and their persistence interfaces. First sprint begins with commit `73d65909bc3bc9f6709364e6b4873c3a9918ba3e` W3 fixes, graph history and expanded priors, pending independent QA.
2. **Capture & evidence** — Chrome/CDP observations, network streaming, redaction, raw storage, provenance, data-loss boundaries.
3. **History & replay** — entity revisions, temporal graph, stateAt, reconciliation, stored reconstruction.
4. **Application integration** — derive pipeline, CLI, localhost server and feedback loops.
5. **Behavior & fidelity** — action/state transitions, reconstruction fidelity and boundary conditions.
6. **System acceptance** — whole-product independent campaign, including unobserved realities and Windows-specific gaps.

These are missions, not silos: follow material dependencies across the whole codebase. Read the latest source in **every sprint**.

## Evidence and handoff convention

- Put executable QA sources under `tests/` and sanitized measured results under `evidence/`. Create files only when producing real evidence.
- Put short dated sprint closeouts under `sprints/`. Maintain a compact, nonduplicative current finding index in `FINDINGS.md`.
- Return a concise receipt with tested SHA, test environment, reproduced defects, unresolved risk, and direct GitHub link. Convey discovered defects via GitHub issue(s) when appropriate; the owner may relay them to Opus. Do not interpret issue publication as agent acknowledgment.
- A newly disclosed independent acceptance fixture becomes development-known; new unseen tests must be generated for subsequent independent acceptance.

**Canonical owner operating policy:** [Opus worklog](../../sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/ASSESSMENT-AND-WORKLOG.md) and [QA coordination #63](https://github.com/owenservera/aion/issues/63).
