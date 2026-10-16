# Z-FORGE — 30 Research Tasks for Z.ai Full-Stack Agent
Status: research backlog only; **0/30 completed** as of creation. Each task requires real evidence, not a published plan.
Target product: Z.ai WEB Full-Stack Agent, not ZCode desktop/API/AutoClaw. Model and sandbox details supplied by owner are USER_REPORTED pending direct account observation.
## Research protocol
- Triage without spending a heavyweight user turn where UI/docs are sufficient.
- Bundle related diagnostics into one bounded experiment only when this produces reusable evidence; avoid pushing 30 independent development turns.
- All tasks can be proposed but not considered executing without user-submitted Z.ai turn/real receipt.
- NO Playwright/Puppeteer. Only native preview, DevTools and allowed deterministic tests.
- Completion evidence must include source, UTC, selected model/run if applicable, exact test/exception and next best action.

## A — Confirm the actual web sandbox
### ZFR-01 — Web-mode capability map (P0)
**Question:** Observe web Chat vs Full-Stack Agent switch, feature surfaces and scope; distinguish web from ZCode, API and AutoClaw.
**Method:** UI_OBSERVATION. Prefer UI/docs without burning a development turn.
**Evidence required:** One timestamped mode/UI map with sources and unknowns.
**State:** RESEARCH_PENDING; dependent on none.

### ZFR-02 — Sandbox instance identity and lifecycle (P0)
**Question:** Probe the actual sandbox OS/runtime/process limits, filesystem layout and isolated workspace identity without private-data access.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Redacted environment fingerprint and persistence hypotheses.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-03 — Builtin tool inventory (P0)
**Question:** Enumerate terminal, file operations, package managers, git, browser preview, search, screenshots and agent-tools as actually available.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Observed tool+version/permission matrix, not marketing guesses.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-04 — Outbound network and inbound ports (P0)
**Question:** Check public-docs retrieval, git fetch, package registry, localhost servers and preview URL forwarding; no credential tests.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Safe network/port matrix and evidence of a tiny local server.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-05 — Session/model chooser semantics (P0)
**Question:** Determine available GLM choices, model lock-in within a turn, follow-up model switching and new-sandbox model selection.
**Method:** UI_OBSERVATION. Prefer UI/docs without burning a development turn.
**Evidence required:** Screenshots of actual model options plus one verified selection.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-06 — Workspace file and upload inputs (P0)
**Question:** Verify accepts repo URL, zip, file upload, pasted code/context, number and size boundaries.
**Method:** UI_OBSERVATION. Prefer UI/docs without burning a development turn.
**Evidence required:** Reproducible input-method matrix and failure examples.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

## B — Maximize the unit cost per turn
### ZFR-07 — Turn quota and elapsed-time observability (P0)
**Question:** Determine plan quota, reset cycle, per-turn credits, visible runtime and tool time from UI or actual receipts.
**Method:** UI_OBSERVATION. Prefer UI/docs without burning a development turn.
**Evidence required:** Cost/time evidence schema and first noninvented baseline.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-08 — Prompt length versus useful execution (P1)
**Question:** Compare concise mission vs detailed mission with same bounded fixture if budget permits.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Quality/rework/elapsed tradeoff, explicitly mark sample size.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-09 — Turn stop/continue behavior (P1)
**Question:** Explore max task horizon, early failures, interruption messages, answer truncation and continuation model.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Minimal stop/retry/continuation decision tree.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-10 — Sandbox persistence across turns (P0)
**Question:** Create benign marker then check on next user turn and new sandbox, tracking whether repo/files remain.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Persistence evidence for same/new run and restoration option.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-11 — Model-per-turn planning and selection (P1)
**Question:** Determine how model choice affects speed, code and tool support using the same small task; compare only available choices.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Mode/model suitability matrix with actual observed output.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

### ZFR-12 — Reproducible first-minute bootstrap (P0)
**Question:** Identify minimum safe commands to rehydrate environment from a pinned repo and cached dependencies.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Measured bootstrap runbook and recovery snapshot.
**State:** RESEARCH_PENDING; dependent on ZFR-01 or verified UI capture.

## C — Repo input and artifact extraction
### ZFR-13 — Public repo clone reliability (P0)
**Question:** Clone user-approved public fixture at immutable SHA and inspect git origin/HEAD; no credential requirement.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Clone/test/readback receipt and reproducible command log.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

### ZFR-14 — Private repo least-privilege access (P1)
**Question:** Study safe ephemeral read-only provision methods, scope constraints and cleanup; do not obtain secrets just for test.
**Method:** DESK_RESEARCH. Prefer UI/docs without burning a development turn.
**Evidence required:** Threat/permission matrix and approved safe alternative.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

### ZFR-15 — Git workspace changes and conflict policy (P1)
**Question:** Determine if sandbox supports source edits, git diff/status, checkpoints, private branches and non-destructive commit workflow.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Source-control capabilities and conflict/recovery recipe.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

### ZFR-16 — Artifact export: Git, ZIP and patch (P0)
**Question:** Test fastest permitted artifact return via download, Git push (separately approved), patch, or attachment; hash verify.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** End-to-end export of disposable fixture + SHA256 comparison.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

### ZFR-17 — Artifact provenance and evidence bundle (P1)
**Question:** Define exact recorded inputs/outputs: mode, model, prompt hash, repo ref, tests, timestamps, artifacts, screenshots.
**Method:** DESK_RESEARCH. Prefer UI/docs without burning a development turn.
**Evidence required:** One independently checkable specimen receipt schema.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

### ZFR-18 — Failed export rescue path (P1)
**Question:** Simulate or analyze lost push/download link, session eviction and clipboard-only fallback; preserve patch/logs.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Safe fallback matrix preventing 'completed in sandbox but lost'.
**State:** RESEARCH_PENDING; dependent on ZFR-01 and artifact-safe permissions.

## D — What the sandbox can really build and test
### ZFR-19 — Local full-stack build/preview (P1)
**Question:** Scaffold small static/full-stack disposable app, install minimal deps, run dev server and check preview.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Real start/build/test output + screenshot if preview available.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-20 — Manifest V3 extension packaging (P0)
**Question:** Build minimal Chrome MV3 extension with service worker, side panel, minimal permissions and unit tests.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Reproducible extension source, package and manifest validation.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-21 — Real extension UI inspection (P1)
**Question:** Determine if sandbox browser allows unpacked-extension loading and visual/manual test in isolated profile; don't assume.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Actual enabled or unavailable proof, screenshots and fallback test.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-22 — Browser test options without banned frameworks (P0)
**Question:** Test native sandbox browser preview/DevTools and deterministic built-in node tests; no Playwright/Puppeteer.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Allowed-browser-tool test approach with reproducible acceptance.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-23 — ACP/UAH interop fixture (P1)
**Question:** Prototype pure local JSON-RPC/ACP capability handshake fixture without calling owner's Windows host.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Protocol contract tests, unsupported-case output, no privileged bridge.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-24 — Task-to-Proof validator pilot suitability (P1)
**Question:** Assess feasibility of running independent hash, correlation, scope and negative proof checks in sandbox.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Reproducible acceptance matrix and source-backed output.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

## E — Multiagent productivity and AION integration
### ZFR-25 — Actual subagent orchestration (P1)
**Question:** Verify presence/number/scopes/log visibility of web Agent subagents inside ONE selected model's turn.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** One real parent-child task split and evidence of separate outputs.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-26 — Parallel vs sequential delegation cost (P0)
**Question:** Compare two independent fixture subtasks done serially/parallel if platform exposes control.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Measured quality, elapsed and hidden overhead; limited sample.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-27 — Evidence-producing subagent roles (P1)
**Question:** Test design/dev/test/reviewer split, with real conflict resolution and negative-case verifier independent from coder.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Verified independent QA disagreement and resolution record.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-28 — Cross-turn context capsule (P1)
**Question:** Produce tiny source-backed checkpoint in prior run, reconstruct next run without relying on ephemeral memory.
**Method:** SANDBOX_MICROTEST. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** Two-turn rehydration test and size/time comparison.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-29 — AION artifact return and independent review (P1)
**Question:** Take one actual exported artifact, validate in OpenCode/ZCode or independent runner and link to canonical GitHub evidence.
**Method:** DESK_THEN_EXPERIMENT. Only run in explicitly user-approved Z.ai Agent Mode spin-up.
**Evidence required:** AION-internal VERIFIED/REJECTED receipt distinct from Z.ai self-test.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.

### ZFR-30 — Turn ROI, capability matrix and repeatable mission selection (P0)
**Question:** Synthesize real outcomes of prior tests into ranked turn archetypes, stop gates, model fit and next 3 missions.
**Method:** DESK_RESEARCH. Prefer UI/docs without burning a development turn.
**Evidence required:** Evidence-only cost/quality/reuse decision matrix; update turn feed.
**State:** RESEARCH_PENDING; dependent on ZFR-03 and approved disposable fixture.
