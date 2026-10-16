# Z-FORGE — M1 Run Design Assignment / Prep-to-Live-Test Handoff
Status: ASSIGNED_IN_GITHUB / NOT DELIVERED_TO_LIVE_ROLE / NOT EXECUTED
Date: 2026-10-16
Owner: Role 08 Z-FORGE; supervisor: Role 05 Chief; coordinator: Role 03 CoS; integration reviewer: Role 06 TOOLSMITH.
Source milestone: workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md (read as authoritative, not general LLM API roundtrip).
Tracking: https://github.com/owenservera/aion/issues/21
Rules: NO Playwright or Puppeteer. User's local machine is master. Preserve existing host execution stop orders.

## Mission
Design the *fewest*, highest-leverage, **turn-sized** Z.ai web Full-Stack Agent sandbox runs required to prepare everything for AION M1: an AION-originated uniquely tagged message reaches the genuine authenticated ChatGPT interactive service, its actual reply is captured, and AION independently consumes it, with a negative-case proof and independently verified evidence.

**Hard reachability limit:** Z.ai sandbox cannot access or exercise the owner's existing authenticated ChatGPT browser/mobile session; never assume access to its cookies, browser profile, project, chat ID, account, DOM, or active local relay. Real live end-to-end testing is OUTSIDE this work order. Z.ai may create disposable browser fixtures, local test endpoints, a mock application and adapter contracts; MUST mark them MOCK/TEST ONLY. Even a real response from an unrelated model/API is NOT M1 PASS.

## Existing starting assets (verify actual content before reuse)
- Canonical M1 requirements in workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md.
- M0.5 exact web-app route in workspace/aion/canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md.
- Chrome ACP Relay ARCHITECTURE / ENVELOPE / FALLBACK / OPENCODE-BUILD-ORDER in workspace/aion/ops/chrome-relay/.
- RL-001 role-launcher later V2; NOT a gate for this M1 prep.
- Sandbox lab FIRST-MISSION.md fixture MV3, TURN-FEED and research/skill instructions.
- Existing AION GitHub issues 18, 21, 22, 23. Do not duplicate repos, invent bridges or make the extra launcher a prerequisite.

## Required architected sequence (proposed; optimize, merge or reject based on evidence)
**RUN P0 — Gap map + packaging plan, no Z.ai turn if repo read is enough.**
Read canonical M1/M0.5; compare available prior adapters; define direct web-app transport, correlation, actual response capture, AION consumption, evidence and unauthorized cases. Evaluate using existing non-Playwright tools (native browser/DevTools, MV3 content script, Chrome remote debugging on owner-approved test profile, pure JS fixture) and choose a primary+fallback. Produce a plan and one clean input capsule with pinned git source refs. **Gate:** smallest runnable acceptance contract, nothing requiring the owner's authenticated web session during sandbox phase.

**RUN P1 — Portable agent-to-adapter and return-path contract, sandbox fixture only.**
Build message envelope, source provenance, idempotency, ack vs execution vs response vs verified states, durable inbox/outbox boundary, minimal AION readback consumer. Use a fake local destination and deterministic synthetic responses that cannot be mistaken for real ChatGPT. Positive tests plus mismatched correlation, duplicate, expiry, disconnect, wrong source and empty answer. Export source+logs+hashes. **Gate:** protocol roundtrip and denial cases pass against fixture, not M1.

**RUN P2 — Browser-side adapter and response-state capture, disposable test application only.**
Develop a minimal MV3 extension OR directly supported browser adapter (choose one viable route, not both by default) with explicit user-initiated send and streaming/completion detection, allowlisted origin, selected exact conversation, bounded DOM controls and controlled fixture UI. Add tests for composer ambiguity, partial response, competing reply, page refresh, inaccessible page, login-required state, transport disconnect, duplicate send and timeout. No Playwright/Puppeteer. Do NOT hardcode undocumented production ChatGPT selectors and pretend they were tested. If Chrome extension installation impossible in sandbox, mark browser runtime unverified and return static/unit test results for authorized later host test.

**RUN P3 — Transport, recovery and artifact handoff dry run.**
Compose P1+P2 through localhost/native-messaging **simulator** or mock adapter with same contract shape as intended UAH/ACP bridge; never issue arbitrary host commands. Test idempotent reconnection, progress persistence, timeouts, cancellations, authorization failure, intentional queue replay, and negative proof. Export ZIP or patch, exact manifest/hash, minimal install instructions and clean rollback. **Gate:** complete synthetic roundtrip with independent (within sandbox only) test trace and one reproducible package.

**RUN P4 — Authorized live-test readiness package (no real test).**
Deliver minimal reproducible installation in an isolated owner-controlled browser profile, tool/version check, visible consent points, manual/automated test script only using allowed tools, a benign unique M1 probe template authored by AION, correlation+timestamps evidence template, verification method for actual destination assistant response, AION readback/consumption check, negative cases, rollback, and diagnostic capture plan. **HARD STOP before touching actual authenticated ChatGPT session.** Mark `READY_FOR_AUTHORIZED_LIVE_TEST` only if install steps are validated in sandbox AND all mocked tests pass; annotate any real Chrome/ChatGPT assumptions as `UNVERIFIED_ON_TARGET`.

**RUN LIVE — explicitly NOT Z-FORGE sandbox execution.**
Separately authorized operator with access to owner-controlled authenticated target/session + AION performs actual origin -> browser -> genuine service -> AION readback, independent verification and evidence. Only this may produce M1 PASS. Previous stop orders/permissions must be reconciled before live attempt.

## Optimization instruction to Role 08
- This is **a proposed 4-run plan plus a no-turn gap map and gated live test**, NOT an order to spend five Z.ai turns. First analyze whether P1+P2 can fit a single heavyweight turn, or P3+P4 can be bundled without losing verification.
- For each planned turn produce: MISSION_ID, exact selected model as observed/OWNER_SELECTS, verified inputs at pinned commits, in-sandbox subagent roles if actually supported, bounded objective, code/files/tests produced, measurable success, negative case, artifacts/export, fallback, dependency, estimated setup/context overhead, risks and STOP conditions.
- Prioritize the smallest testable path to a real M1 live trial. Do NOT divert into generic 3D dashboards, broad research, another comms bus, full browser scraping, Chrome role title automation or any M2+ feature.
- Use Z.ai sandbox coding only within approved disposable environment. Any code change to AION production/master is separate owner-authorized integration after independent evidence.
- Never request actual session credentials or ask owner to paste cookies/private conversations.
- No model API substitution for actual authenticated ChatGPT web-app roundtrip.
- If the desired browser capability cannot be validated in sandbox, produce a precise target-machine verification gate rather than a fabricated PASS.
- No Playwright/Puppeteer anywhere.

## Deliverables — *before* requesting any actual ChatGPT testing
1. `M1_RUN_MATRIX.md`: dependency-ordered, high-output Z.ai turn packets, inputs/outputs/stop gates, why not fewer.
2. `M1_INTERFACE_CONTRACT.md`: source/transport/response/readback message shape, idempotency, proof, mock-vs-live distinction.
3. `M1_TEST_MATRIX.md`: fixture positive/negative and real-session pending checks, test method per OS.
4. `M1_LIVE_HANDOFF.md`: smallest local install/use/rollback checklist and permissions required, no secrets.
5. `M1_PROMPTS/`: paste-ready scoped Z.ai turn instructions, model selection as OWNER_SELECTS until observed.
6. `M1_EVIDENCE/`: actual test logs and artifacts only after runs. Never fabricate directories or success.
7. `M1_NEXT_TURN.md`: one next actionable prompt selected based on real research/previous outputs.

## Status and independent accept
READY_FOR_REVIEW = planned run packets and interfaces pinned to canonical sources.
SANDBOX_TESTED = specific code/tests actually run inside Z.ai with logs.
EXPORTED = real bytes/digest passed out of sandbox.
INDEPENDENTLY_VERIFIED = AION/OpenCode/ZCode reviewer actually reran/reconciled artifacts.
READY_FOR_AUTHORIZED_LIVE_TEST = reviewer accepts handoff with target-specific unknowns labeled.
M1_VERIFIED = only the separate genuine authenticated web-app roundtrip + AION readback and negative test.

For immediate Role 08 start: read this file and canonical M1; optimize the proposed sequence, deliver exact first ready-to-paste Z.ai turn without claiming execution; reply with actual fetched paths, proposed number of paid/expensive turns, and hard live-test boundary. GitHub publication does not wake up the role chat.
