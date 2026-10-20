# AION Chrome Relay — Fallback, Recovery and Acceptance

## Track B Send/state repair acceptance — current target (2026-10-20)

This section tests the current [command-environment specification](./ARCHITECTURE.md#track-b-command-environment--current-target-specification-2026-10-20) and [observation contract](./ENVELOPE-CONTRACT.md#track-b-observation-contract--target-v1-2026-10-20). It supersedes conflicting fallback behavior below for this bounded path. It grants no browser authority. No acceptance case below has been newly executed by this documentation pass.

### Executable acceptance cases

- **AC-CENV-01 (CENV-01/03/12, DATA-01/02/03):** empty/draft/responding/blocked/unknown observations remain distinct; hidden, disabled, ambiguous and unreadable controls produce the appropriate separate Send/Stop facts. Unknown/missing fields never imply idle or ready. A snapshot older than 2,000 ms cannot authorize activation.
- **AC-CENV-02 (CENV-04/05):** preparation that becomes ready within its finite budget rechecks exact text/editor/target/baseline and activates once; preparation that stays disabled expires with a concrete pre-activation reason and zero activation attempts. Resolving a terminal blocker later never sends.
- **AC-CENV-03 (CENV-05/06/07):** editor replacement, baseline rerender, outbound mismatch, navigation, disabled or ambiguous Send each produce specific evidence. Any relaxation of node-identity continuity needs its own wrong-target/stale-turn negative tests; never disable continuity checks just to obtain a click.
- **AC-CENV-04 (CENV-06/07/10, DATA-04/05):** a no-op/throwing activation, click with no matching user turn, timer failure and pre-activation exception retain original stage/reason, exact click-attempt facts and uncertainty. No Enter/click fallback is executed. No result falsely reports positively observed submission.
- **AC-CENV-05 (CENV-08):** fast start/end, delayed start, Stop flicker, hidden Stop decoy, reappearing Stop, changing candidate, and unrelated user turns are tested. Completion needs the original observed transition evidence, correct pairing and 750 ms stability, not current absence of Stop.
- **AC-CENV-06 (CENV-09):** a response longer than 20 seconds but inside the configured 180-second response window remains observable after submit returns. Verify 300-second ceiling, submission-confirmation timeout, preparation/exchange margins and original absolute cutoff. A longer CLI wait or repeated poll cannot extend the page deadline.
- **AC-CENV-07 (CENV-10/13, DATA-04/06):** exact original preparation/activation reason survives page -> worker -> journal -> adapter -> CLI; reply-validation reason remains separate. Existing stored records remain readable with unknown new fields; guard/lock/tombstone records survive every change. Ordinary diagnostics contain no private text or credentials.
- **AC-CENV-08 (CENV-11):** repeat submit, fresh IDs in a locked conversation, port loss, worker restart, page reload, host loss and failed evidence persistence never cause another actuation. Only surviving exact observer evidence resumes read-only; lost continuity remains unresolved.
- **AC-CENV-09 (CENV-14):** reading Stop availability produces zero effects. If an existing authorized Stop surface is exercised separately, it does not claim user-turn rollback or free a send allowance. No new Stop capability is inferred from these tests.
- **AC-CENV-10 (vertical slice):** one fresh owner-authorized operation on the exact dev conversation yields one recorded activation attempt, one new matching user turn, observed response start/end, accepted checked reply and retrievable durable result. Wrong-target and duplicate sends must both be zero. Record source/build identity, UTC, operation identity, actual evidence and remaining unknowns.

Coverage index: CENV-01/03/12 -> AC-CENV-01; CENV-04/05 -> AC-CENV-02; CENV-06/07/10 -> AC-CENV-04; CENV-08 -> AC-CENV-05; CENV-09 -> AC-CENV-06; **CENV-13** -> AC-CENV-07; CENV-11 -> AC-CENV-08; CENV-14 -> AC-CENV-09. **CENV-12** freshness is tested independently from historical evidence retention.

### Verification and release order

1. Add failing tests for specific diagnosed gaps before changing implementation. Use existing built-in test runner and deterministic fixtures; Bun first for project scripts. No Playwright/Puppeteer/Orca or new browser frameworks.
2. Run focused suites, then `aion selftest` at the exact implementation head. Record counts, failures/skips and UTC. Documentation/link validation is not runtime test evidence.
3. For any later authorized live test, verify matching dev build/source, current-head selftest receipt and `aion preflight browser` READY. Keep Track A untouched. Browser install/reload/login/Send/Stop actions remain separately explicit; do not perform them as readiness side effects.
4. Reconcile the original unresolved operation before any distinct fresh send; do not press Enter on its pending composer as a test. A fresh marker does not bypass the lock or confer approval.
5. A live failure stops new actuation and retains original facts/reasons. A successful fixture never upgrades REAL_CHROME_VERIFIED or M1. Original M1 independent acceptance remains unchanged.

### Safe fallback

No automatic transport switch, keyboard fallback, tab selection, new conversation or queued replay after uncertain Send. When connectedness fails, report unavailable/unknown and keep the operation addressable. Read-only diagnostics may recover evidence; owner disposition may release a lock but is not synthetic delivery proof. Historical delayed-GitHub/SQLite/fallback proposals below are not the Track B command runtime.

---

## Historical fallback and milestone proposals (retained)

Status: design only; no installed extension, listener, scheduler or agent has been verified.

## Five progressive modes
A. NATIVE_CONNECTED: Chrome extension connects to approved OS-native messaging host; host speaks to existing UAH / authorized ACP agents; task and proof events persisted to SQLite and shared GitHub records.
B. LOCAL_CONNECTED: native messaging unavailable, but an *existing authorized* loopback relay responds. Use authenticated wss or loopback ws with origin checking and per-install grants. No direct endpoint or privileged credentials embedded in extension. If not provisioned, skip this mode.
C. GITHUB_DELAYED: no live local relay; authorized bridge/workers may exchange queued task references and receipts through existing AION GitHub channel when available. GitHub is not an ACP transport, and an issue comment alone must never execute host commands. Chrome merely displays or submits explicitly approved tasks through a credentialed service; no privileged GitHub token stored in browser.
D. OFFLINE_BUFFERED: no host and no network; extension queues bounded metadata-only draft tasks, visibly marks UNSENT, enables user export, and never claims executor ACK. Encrypted OS-managed sensitive content should remain in native host rather than Chrome storage.
E. SAFE_MANUAL: browser extension inaccessible/disabled; user can open normal GitHub/task links or an approved local CLI; the independent background OpenCode/ZCode executor can still finish already accepted tasks.

## Trigger/recovery matrix
- MV3 worker suspend/restart: recreate native port in response to events, alarms or UI opening, reload durable cursor/outbox from storage; don't depend on global JS state.
- Native host process exit: record disconnect and bounded reconnect with exponential backoff + jitter. Never spin endlessly. Native host origin allowlist must be exact.
- Local router down: separate browser connected-state from ACP agent unavailable-state; queue tasks only after authorization and indicate BLOCKED.
- Network/GitHub down: continue locally on approved already-accepted tasks; persist local SQLite receipts and sync when online.
- ChatGPT page logged out/tab closed: mark tab unavailable; keep executor operational; ask user to log in or reopen tab when needed. Do not bypass login, refresh session credentials, or auto-send a model prompt.
- ACP target stopped or unsupported method: mark unsupported/unavailable, ask CoS to select an authorized compatible runtime; no silent privilege-changing fallback.
- Source drift/duplicate job: detect by idempotency key and stored execution ID; reconcile before any retry; require fresh approval for non-replayable action.
- Outbox backlog: bound storage/age, prioritize explicit owner tasks, provide visual count and reject with clear reason rather than lose messages silently.
- Host reboot/reinstall: recover from GitHub and local queue, reconcile highest acknowledged cursor, do not assume extension cache authoritative.
- Trust failure: stop delivery and mark AUTH_FAILED; never fall back to a less trusted transport for a privileged task.

## Operational commitments
Heartbeat reflects TRANSPORT_CONNECTED only. Presence represents a browser tab, not model reasoning. Task ACTIVE requires executor accepted/started evidence. VERIFIED needs an independent verifier; distinct identity from builder. Send/receive timestamps UTC with locally displayed time-zone conversion. Detect stale receipts and show last evidence time.
A transport should be available when Chrome is running, subject to documented MV3 suspension; true unattended execution runs in approved native OS services or OpenCode/ZCode workers, not inside a Chrome extension.

## Milestone test plan
T0 extension unpacked loads with minimum host permissions; side panel shows eight named roles with UNKNOWN states; no uncontrolled site access.
T1 native bridge capability handshake on approved Windows test environment; version negotiation and origin denial test.
T2 Chrome service-worker suspended/restarted and recovers exactly once, with outbox retained.
T3 kill native host during queued delivery; reconnect with cursor and no duplicate execution.
T4 native unavailable -> approved local fallback -> delayed GitHub mode -> offline -> recovery, all with truthful visible statuses.
T5 one user-approved task to OpenCode via supported ACP/serve runtime; transport ACK, executor ACK, test output and independent receipt distinct.
T6 close all ChatGPT tabs for two bounded execution cycles; background native worker still runs and creates two real receipts; extension reconnects and displays both with exact source timestamps.
T7 wrong origin, missing grant, expired task, forged VERIFIED, duplicate ID, and traversal attempt all rejected; no unauthorized command executes.
T8 disconnect network, restore, reconcile and independently read GitHub commit/proof; no replay duplication.
T9 document CPU/memory/battery impact and ensure no over-polling or privileged event automation.
AION PASS only when T0-T9 have reproducible receipts. 'Extension installed' alone is not DONE.

## Reference
Chrome extension service worker lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
Chrome native messaging: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
Chrome WS lifetime: https://developer.chrome.com/docs/extensions/how-to/web-platform/websockets

## Bus V1/V2 tests and failure modes (PROPOSED, 2026-10-19)
Context: [decision record](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). Not run; none promotes M1.
- B0 SYNC-0 (no-send): record whether an open PC commander tab shows a phone-sent message with and without reload. Result decides Option A vs B.
- B1 Injection: hostile text in agent reports/page content never yields a dispatched command.
- B2 Loop: a report that re-triggers a command halts at `max_hops` with `HALTED`.
- B3 Kill switch: engaged state refuses all dispatch until owner re-enable.
- B4 Tab discard/reload: commander watcher resumes read-only; no command is replayed; nonce reuse is rejected.
- B5 Arm/grant: unarmed turn, unregistered `to`, exhausted count or expired grant each produce a visible rejection and no send.
- B6 (extends T5) Bus V2: executor session absent, ACP version mismatch or prompt timeout leaves an unresolved record, never a resend.
- Failure modes: PC asleep, Chrome closed or commander tab not open means phone commands do not execute; report them as undelivered, never queue-and-replay silently.
