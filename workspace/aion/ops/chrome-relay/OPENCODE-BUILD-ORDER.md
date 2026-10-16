# AION Chrome ACP Relay — OpenCode Build Order CR-001
Status: READY FOR AUTHORIZED EXECUTOR HANDOFF, NOT DISPATCHED TO A VERIFIED EXECUTOR
Technical owner: Chief of Staff (Role 03); implementation: OpenCode/ZCode only.
Repo: owenservera/aion, main branch. Seed: UAH / ACP / IANG. No new repo.
References: ARCHITECTURE.md, ENVELOPE-CONTRACT.md, FALLBACK-AND-ACCEPTANCE.md in this directory.

## First bounded deliverable
Build extension fixture-based MVP first. Do not provision privileges, install a native messaging host, or initiate live ChatGPT browser automation as part of this code-only step.

1. Create minimal Manifest V3 unpacked extension with a side panel and service worker using compatible Chrome versions; selected role tabs only.
2. Render five role tiles with tab status, transport status, queue count, evidence age, fallback mode and a visible permission/approval gate. Distinguish no data from idle.
3. Create sample envelope encoder/decoder and validation (allowlisted event kinds, sequence, expiry, idempotency key) with fixture event store. No credentials inside extension.
4. Implement transport abstraction supporting disabled/native adapter, disabled local loopback adapter and offline fixture adapter; do not connect real hosts or silently send tasks in MVP.
5. Add deterministic tests for restart/outbox retention, duplicate ACK, dropped connection, stale presence and proof vs transport status.
6. Write a short README with Chrome unpacked-extension loading instructions, exact test commands, permission rationale, known limitations and denial cases.

## Execution requirements
Confirm actual current runtime versions and capability surfaces before coding. Code lives under workspace/aion/ops/chrome-relay/extension/. Keep reviewable source plus test output. Restrict content-script surface to explicit user gestures; do not read whole ChatGPT transcripts or modify ChatGPT session state. Preserve Windows authority, GitHub receipts and host stop orders; no Code written by Grok Bot. Return actual OpenCode session ID, model, toolchain, commit SHA, exact tests PASS/FAIL, any browser inspection results and known gaps. Prevent untrusted pages from invoking native commands. No background browser injection, automated login, bypass attempts, or undocumented APIs.

## Separate gated integration task (not authorized by this document)
After fixture MVP passes, Chief of Staff must secure explicit approval to install a least-privilege native host on the relevant machine, run ACP initialize/capability negotiation and connect an approved read-only endpoint. Only then may task dispatch and recovery tests begin. Any privileged command or auto-task execution requires its own authorization.

## Acceptance of MVP
AION independently fetches exact commit and reruns tests; an unpacked extension shows five role cards and changing simulated modes. Restart and duplicate cases must not lose/execute work. Role tab open must NOT show agent as RUNNING. All source code authored by OpenCode/ZCode and verified, not declared done on file publication. No new platform, Slack, or branch.
