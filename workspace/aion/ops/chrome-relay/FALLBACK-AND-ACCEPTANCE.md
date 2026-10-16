# AION Chrome Relay — Fallback, Recovery and Acceptance
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
T0 extension unpacked loads with minimum host permissions; side panel shows five named roles with UNKNOWN states; no uncontrolled site access.
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
