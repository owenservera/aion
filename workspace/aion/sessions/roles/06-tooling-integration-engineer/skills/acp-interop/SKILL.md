---
name: acp-interop
description: Verify Agent Client Protocol compatibility across UAH, OpenCode and ZCode, then route a bounded approved task with verifiable receipts.
---
# ACP / UAH Integration

## Trigger
Any proposed ACP client/server, routing, agent session, protocol version, or OpenCode/ZCode integration task.

## Execution recipe
1. Discover the *actual* installed versions and endpoints of UAH, ZCode and OpenCode on the target host. Do not assume an example protocol version is supported.
2. Retrieve vendor protocol docs (prefer current versioned ACP and OpenCode docs) and record URL, version, date in SOFTWARE_HQ through the Context7 skill.
3. Map client/server roles, stdio vs HTTP/serve, authorization, session lifetime and transport failure recovery.
4. Build a feature table for initialization/version/capabilities, creating sessions, resuming if supported, prompting, notifications, cancellation and shutdown.
5. Obtain a scoped authorization and live executor acknowledgment via Chief of Staff; relay configuration or network exposure is a separate host gate.
6. Perform read-only capability handshake first, then one explicitly approved nonprivileged prompt routed through correct target (OpenCode/ZCode code ownership).
7. Verify 1) transport ACK, 2) real executor ACCEPT, 3) real output, 4) independent receipt. Never confuse these.
8. Test unsupported-method, unavailable-agent, dropped transport, expired authorization and duplicate request cases.

## Failure/fallback
ACP transport unavailable -> report BLOCKED; no privileged CLI fallback without explicit scope. The Chrome relay transports are wrappers, not an alternative ACP dialect. Do not interpret old ordinary ChatGPT tabs as ACP agents.

## Completion
A versioned capability matrix, saved sanitized handshake trace, real session ID and nonprivileged task receipt; no secrets or raw private transcripts.
