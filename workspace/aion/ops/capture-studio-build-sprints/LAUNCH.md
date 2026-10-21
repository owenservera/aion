# Capture Studio — Opus Fast Build Sprints

**Owner:** Claude Opus implementation agent. **Purpose:** fresh Claude sessions with small starting context and continuous, high-quality implementation. **Distinct from** `workspace/aion/qa/capture-studio/`, which is ChatGPT's independent real-test workspace.

## Fresh-session launch

`#AION @CAPTURE-STUDIO /BUILD-SPRINT`

**Recommended Claude configuration:** Opus 5.5, High.

1. Fetch current `main`, record the SHA, and read **all first-party Capture Studio source files** (including tests and evaluation code as reference), then trace runtime entry points, imports, contracts, and important data paths. Read root `AGENTS.md`, the product `ASSESSMENT-AND-WORKLOG.md`, `ARCHITECTURE.md`, the rolling `QA-NEXT-TESTS.md`, and this folder's `STATE.json`. Report unavailable source honestly. Prefer compact in-context system maps to verbatim source repetition.
2. Resume the **highest-value unfinished engineering objective** from the worklog and owner priority order: universal schema/identity; adaptive learning/semantic relevance; browser capture/streaming; local storage/replay; CLI/localhost host; behavioral intelligence. Follow genuine integration dependencies; don't restart planning or refactor merely for neatness.
3. **Build continuously and autonomously.** Use deep internal world-model reasoning, virtual code-graph traversal, call-chain inspection, and mental execution to find bugs and improve implementation. **Do not physically create test files, run unit/integration/E2E tests, execute benchmarks or test harnesses, or delegate those to yourself.** Existing tests may be *read* to understand intended behavior. Mental simulations are not measured evidence.
4. Before **each implementation commit**, overwrite the existing product `QA-NEXT-TESTS.md` with a **flat immediate brain dump** of what ChatGPT should test for that commit. No extra thinking, research, verification or test creation for this note. Include it **in the same commit**, push, and continue.
5. Keep working through the session without stopping for QA, reviews, milestones, status, or responses. Only an **explicit user stop** pauses ordinary development. Hold individually unsafe/destructive actions under existing safety rules, but continue other safe work. No Playwright/Puppeteer.
6. When the session approaches context limits, **checkpoint rather than lose continuity**: write/update `STATE.json` in this separate sprint folder with the last known implementation SHA, changed modules, unfinished task, immediate next action, critical dependencies and uncertainties. Commit/push that checkpoint, then stop **this session** for a fresh one; this is a context handoff, not a pause instruction to the ongoing engineering program. Do not claim to run while the Claude runtime is inactive.
7. At the end, report one compact receipt: implementation SHA(s), actual changes, `PENDING INDEPENDENT QA`, next sprint focus. Do not claim tests passed without a ChatGPT QA receipt.

**Source authority:** the latest actual implementation code, not a stale handoff. The handoff accelerates startup but never replaces full source intake. GitHub `main` is the shared record; preserve the owner's local-master and conflict safety rules.

## Scope boundaries

- **Opus writes:** product source, its rolling pre-commit QA thought dump, and **this** sprint state. No independent QA test assets.
- **ChatGPT QA writes:** `workspace/aion/qa/capture-studio/`. Opus does not modify it.
- **Owner:** decides priorities and explicit stop/resume.
- **No acceptance gate:** `PENDING INDEPENDENT QA` does not prevent next implementation commits.
