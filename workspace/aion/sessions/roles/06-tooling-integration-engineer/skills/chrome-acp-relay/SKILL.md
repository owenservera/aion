---
name: chrome-acp-relay
description: Engineer and validate AION Chrome Manifest V3 browser relay edge, native messaging, ACP transport and offline fallback safely.
---
# Chrome ACP Relay Station

## Canonical work
Issue #18; docs in workspace/aion/ops/chrome-relay/: ARCHITECTURE.md, ENVELOPE-CONTRACT.md, FALLBACK-AND-ACCEPTANCE.md, OPENCODE-BUILD-ORDER.md. Do not start another browser bus.

## Procedure
1. Check Chrome actual major version, MV3 service worker limits, native messaging availability and extension permissions on target OS.
2. Implement FIXTURE MVP via OpenCode/ZCode in specified code directory; side panel should show **six** role cards after TOOLSMITH is activated, with truthful presence states.
3. Treat service-worker lifetime as bounded; persist connection cursor and delivery queue before sends; restore on message/alarm/UI events. Never equate WebSocket heartbeat with ChatGPT model activity.
4. Use a pinned OS-native host interface to UAH/ACP. The extension only requests limited operations; host validates every message source, grant, idempotency key and allowed scope.
5. Model connected native, configured authorized local fallback, durable GitHub/SQLite delayed delivery, offline drafts and safe manual modes; no silent escalation when falling back.
6. Test tab closed/logged out, Chrome restart, native host crash, unavailable ACP method, duplicate request, queue expiry and failed trust checks.
7. Require separate owner authorization before native-host install, shell execution, automatic browser interaction or permission expansion.

## Rejection tests
No automatic login refresh, Cloudflare/captcha evasion, broad transcript scraping, arbitrary page-to-host commands, or invented forever-active reasoning loops.
A delivery acknowledgment is not a completed task, and a task complete is not independent VERIFIED.

## Completion
Unpacked extension UI + deterministic tests -> read-only native handshake -> single approved scoped OpenCode task -> two true off-tab receipts -> independent verification. Each milestone remains OPEN until observed on real host.
