# AION Chrome ACP Relay — OpenCode Build Order CR-001

## Track B command-environment repair implementation plan — 2026-10-20

**Status:** planned, not executed. Owner review of the specification precedes implementation. This current bounded order supersedes the historical greenfield build instructions below; it creates no new platform and authorizes no browser operation. The development session owns implementation directly unless the owner changes that instruction; external VIVIM research remains read-only and separate.

**Goal:** make the existing single-command ChatGPT path actuate once, confirm submission, observe completion and return truthful durable results.

**Architecture:** keep current Bus/transport/worker/page ownership. Add precise observation and diagnostic contracts, bounded preparation checks and an explicit response budget to the existing path. Do not weaken correlation, authority, immutable target or no-resend checks.

**Spec:** current CENV section of [ARCHITECTURE.md](./ARCHITECTURE.md), DATA contracts in [ENVELOPE-CONTRACT.md](./ENVELOPE-CONTRACT.md), AC-CENV cases in [FALLBACK-AND-ACCEPTANCE.md](./FALLBACK-AND-ACCEPTANCE.md).

**Constraints:** local Windows runtime; Bun first for compatible scripts; no Actions/CDP/UIA/Playwright/Puppeteer/Orca additions; Track A untouched; no speculative dependency; one critical-path task at a time. Missing live evidence is UNKNOWN, not a reason to broaden authority. Every implementation task ends with focused source/test commit evidence, not a status-only claim.

### Review focus

Prepare can fill text without activating; page rerenders can change node identity; control presence can differ from visibility/enablement; response generation can outlast submit RPC; and diagnostic mappings can hide the original failure. Tasks below must test all five, as well as existing no-resend/target negatives.

### Task 1 — establish diagnostic truth before choosing the Send fix

Files: `extension/src/chatgpt/content.js`, `extension/src/background/chatgpt-port.js`, `extension/src/bus/adapters/chatgpt.js`; tests `extension/tests/content-turn-engine.test.js` plus existing driver/adapter suites located by their imports.

Interfaces: existing page observation reason -> worker observer record -> additive `failure_stage/failure_reason/validation_reason` metadata per DATA-04, without changing guard keys or loosening reply acceptance.

- [ ] Read the original durable observer reason through an already permitted metadata-only path, or record precisely why unavailable. No activation, disposal, reload or fabricated root cause.
- [ ] Add failing tests for timer/preparation exception, baseline/editor/text/URL change and no-op activation. Assert click-attempt facts and distinct original/validation reasons (AC-CENV-03/04/07).
- [ ] Implement minimum reason propagation and compatibility handling in existing owners; keep prior known facts and unknowns intact.
- [ ] Run focused tests through existing project scripts and check diff scope; record command/output/UTC and commit source/test pair.

Exit: the original failure boundary is addressable with the best available reason; no Send correction is selected on the sole basis of `generation_incomplete`.

### Task 2 — precise read-only snapshot and action availability

Files: `extension/src/chatgpt/content.js` (`sendState` and control discovery), `extension/src/background/chatgpt-port.js` (`sanitizeState`), existing worker/remote allowlists as needed; tests in the existing content/driver suites and `extension/tests/fixtures/chatgpt-page.js`.

Interfaces: `ConversationObservation`/`ActionObservation` per DATA-01/02/03, propagated via existing ping, with separate operation evidence. No generic page-action forwarding; no new Stop actuation surface.

- [ ] Add failing fixture cases for hidden Stop, disabled Send/Stop, duplicates, unreadable/missing fields, draft and stale identity/time (AC-CENV-01/09).
- [ ] Implement the smallest common observation projection and explicitly allowlist fields at every traversed boundary; preserve compatibility consumers.
- [ ] Verify read-only probes cause zero fill/click/Stop and cannot grant authority; run focused suites and commit.

Exit: at-rest/draft/responding/unknown and action availability can be queried truthfully without changing the page.

### Task 3 — bounded preparation to one activation

Files: `extension/src/chatgpt/content.js` (`submit`, `timer`, `activate`), existing deadline policy if required; tests in `content-turn-engine.test.js` and its existing fixture.

Interfaces: consume fresh exact snapshot from Task 2; produce `PREPARED` then at most one existing activation method, with diagnostic output from Task 1. Condition checks stay within the original admitted active operation.

- [ ] Reproduce the diagnosed condition offline with a failing test; separately test readiness delayed beyond 400 ms, permanent disablement, editor rerender, navigation and terminal blocker resolution (AC-CENV-02/03/04).
- [ ] Implement only the evidence-supported pre-activation correction. Preserve one control, exact text/target and continuity invariants; do not remove guards to make the test pass.
- [ ] Assert no Enter/click fallback, no late actuation after terminal state, no draft overwrite and no repeated activation; run focused suites and commit.

Exit: preparation either reaches one guarded activation or reports its specific terminal/uncertain outcome; an occupied composer is never reported as a send.

### Task 4 — separate submission and response observation budgets

Files: `extension/src/lib/command-deadlines.js`, page engine, worker command allowlists/driver, Bus adapter and thin remote-call layer only where propagation requires; tests in existing deadline/content/driver/adapter suites.

Interfaces: target internal `submission_timeout_ms` and `response_timeout_ms` from ENVELOPE timing contract, passed explicitly and clamped; observe cannot reset the task deadline. Compatibility `timeout_ms` retains documented behavior for legacy callers.

- [ ] Add failing cross-layer test for a response lasting over 20 seconds but below 180 seconds; verify first receipt returns before final completion and original response cutoff remains fixed (AC-CENV-06).
- [ ] Pin default/clamp/invalid-value behavior, setup/exchange margins and delayed/fast generation evidence in tests before exposing the fields.
- [ ] Implement explicit budget propagation in existing interfaces; test 750 ms candidate stability, Stop flicker/decoys and lost transitions (AC-CENV-05/06).
- [ ] Run focused suites and commit. Do not increase every timeout or weaken completion validation as a substitute.

Exit: submit RPC deadline, submission confirmation and response observation no longer accidentally share the 20-second lifetime.

### Task 5 — integrated recovery and bounded live acceptance

Files: existing integration/fault tests, `velocity/README.md` command documentation and current evidence records; no new runner/framework.

- [ ] Exercise AC-CENV-07/08 across transport/journal/worker/page resets; preserve old records, immutable operations, locks and read-only recovery.
- [ ] Run current-head `aion selftest`; record exact suite counts/skips, head and UTC. Reconcile all changes before claiming test success.
- [ ] Present offline result and remaining real-browser unknowns. Obtain/confirm explicit operational scope before any dev setup/reload or live actuation; require matching build and READY preflight.
- [ ] Reconcile the original unresolved operation without resend. Only a separately admitted owner-authorized fresh operation may run AC-CENV-10.
- [ ] Record attempted versus observed Send, actual checked reply/readback, wrong-target/duplicate counts and residual unknowns. No M1 promotion from this task alone.

Exit: REAL_CHROME_VERIFIED only with actual vertical-slice evidence; otherwise publish PARTIAL/BLOCKED and exact next evidence needed. No repeated speculative fixes after a failed live attempt.

### Harvest dependency rule

VIVIM research in [harvest/](./harvest/README.md) may improve terminology or reveal a smaller proven pattern. It does not gate Tasks 1-2, authorize selector reuse or overwrite AION requirements. The development owner verifies the cited source and records adoption/rejection before changing this plan. No general engine transplant, automatic retry policy, content-hash-only deduplication or priority-based target guessing is permitted.

---

## Historical build order (retained)


> **2026-10-17 PRIORITY OVERRIDE:** This fixture-first extension build order is **deferred** as a prerequisite to the current Windows M1 live test. Inspect ACPX source and current Windows browser/adapter availability first; write only demonstrated missing code. Do not build a second extension without source-backed reuse/replace justification. See [Windows execution path](../../canon/AION-M1-WINDOWS-MASTER-EXECUTION.md) and [experiments/evidence](../../canon/AION-M1-EXPERIMENTS-AND-METHODS.md). No Playwright/Puppeteer; no host/browser operation before scoped authorization.

Status: READY FOR AUTHORIZED EXECUTOR HANDOFF, NOT DISPATCHED TO A VERIFIED EXECUTOR
Implementation coordinator: Chief of Staff (Role 03); technical reviewer: TOOLSMITH (Role 06, once launched); implementation: OpenCode/ZCode only.
Repo: owenservera/aion, main branch. Seed: UAH / ACP / IANG. No new repo.
References: ARCHITECTURE.md, ENVELOPE-CONTRACT.md, FALLBACK-AND-ACCEPTANCE.md in this directory.

## First bounded deliverable
Build extension fixture-based MVP first. Do not provision privileges, install a native messaging host, or initiate live ChatGPT browser automation as part of this code-only step.

1. Create minimal Manifest V3 unpacked extension with a side panel and service worker using compatible Chrome versions; selected role tabs only.
2. Render eight role tiles (including TOOLSMITH, INTAKE and Z-FORGE, with honest pending-launch states) with tab status, transport status, queue count, evidence age, fallback mode and a visible permission/approval gate. Distinguish no data from idle.
3. Create sample envelope encoder/decoder and validation (allowlisted event kinds, sequence, expiry, idempotency key) with fixture event store. No credentials inside extension.
4. Implement transport abstraction supporting disabled/native adapter, disabled local loopback adapter and offline fixture adapter; do not connect real hosts or silently send tasks in MVP.
5. Add deterministic tests for restart/outbox retention, duplicate ACK, dropped connection, stale presence and proof vs transport status.
6. Write a short README with Chrome unpacked-extension loading instructions, exact test commands, permission rationale, known limitations and denial cases.

## Execution requirements
Confirm actual current runtime versions and capability surfaces before coding. Code lives under workspace/aion/ops/chrome-relay/extension/. Keep reviewable source plus test output. Restrict content-script surface to explicit user gestures; do not read whole ChatGPT transcripts or modify ChatGPT session state. Preserve Windows authority, GitHub receipts and host stop orders; no Code written by Grok Bot. Return actual OpenCode session ID, model, toolchain, commit SHA, exact tests PASS/FAIL, any browser inspection results and known gaps. Prevent untrusted pages from invoking native commands. No background browser injection, automated login, bypass attempts, or undocumented APIs.

## Separate gated integration task (not authorized by this document)
After fixture MVP passes, Chief of Staff must secure explicit approval to install a least-privilege native host on the relevant machine, run ACP initialize/capability negotiation and connect an approved read-only endpoint. Only then may task dispatch and recovery tests begin. Any privileged command or auto-task execution requires its own authorization.

## Acceptance of MVP
AION independently fetches exact commit and reruns tests; an unpacked extension shows eight role cards and changing simulated modes. Restart and duplicate cases must not lose/execute work. Role tab open must NOT show agent as RUNNING. All source code authored by OpenCode/ZCode and verified, not declared done on file publication. No new platform, Slack, or branch.

## Related RL-001 launcher slice
AION added [keyword role launcher #22](https://github.com/owenservera/aion/issues/22), registry [role-launcher/ROLES.json](./role-launcher/ROLES.json), and [scoped OpenCode work order](./role-launcher/OPENCODE-WORK-ORDER.md). Reuse the existing MV3 extension; keep RL-001 as a bounded subfeature with independent acceptance. Do not bundle untested native conversation rename/UI injection into the fixture MVP.
