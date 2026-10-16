# AION Chrome Relay Station — Architecture v0.1
Date: 2026-10-16
Status: PROPOSED DESIGN / NOT INSTALLED OR RUNNING
Executive owner: Role 05 (Chief of Chiefs); execution owner: Role 03 (Chief of Staff)
Seed: UAH/ACP + IANG/SQLite + OpenCode/ZCode + GitHub + AION role sessions. No separate repository or competing event bus.

## Mission
A Chrome Manifest V3 extension is the *browser-facing edge node* of an extensible AION communications bus. Its purpose is to make task dispatch, agent visibility, receipts, context re-entry, and approvals frictionless while the durable executor continues off-tab. Keep five standing chatgpt.com roles easy to reopen; never claim they independently think while idle. Chrome keep-alive refers only to an extension transport, not a ChatGPT model turn.

## Architecture / authority
User in chatgpt.com or Chrome side panel -> extension UI + explicit user-action content adapter -> MV3 service worker -> native messaging host `com.aion.relay` -> UAH ACP client/router -> ZCode/OpenCode authorized runtimes -> signed/hashed evidence -> IANG SQLite outbox/inbox -> existing GitHub AION authoritative PM receipts.
The existing UAH (universal ACP hub) owns transport and capability discovery; SQLite/IANG owns durable local routing metadata; GitHub is the durable cross-machine task/evidence coordination channel. Do not duplicate the bus.
An optional *explicitly configured* authenticated localhost wss/ws service is fallback transport; it has no authority beyond the native relay. Keep GitHub credentials, provider/API keys and ACP privilege tokens outside the extension, inside the OS secret store/native runtime. Windows local machine remains human master; Linux BFF is a separate executor/operator, never an authority override.

## Chrome implementation
- MV3 `background.service_worker`: event-driven, persistent state in chrome.storage.local/IndexedDB as appropriate, alarms/restart hooks, idempotent reconnection; do NOT assume immortal JavaScript globals.
- `sidePanel` or extension popup: five role tiles (tab open/stale/unknown), relay connection status, current executor activities, outbox, receipts, approvals, manual reconnect and pause.
- `tabs`/optional permission and user-selected site access: remember role tab URLs locally; open/focus tabs on user action; recover last known GitHub-backed context capsule.
- Minimal optional content script on chatgpt.com: only selected text or user-clicked 'Send to AION' capture; never mass-read transcripts, cookies, credentials, or undocumented page internals. Drafting into ChatGPT composer requires a clear user gesture; automated prompts are NOT a baseline capability.
- Host native messaging: `chrome.runtime.connectNative` with locked `allowed_origins`, fixed extension ID, OS-installed host manifest. Length-framed JSON transport. Never accept web-page message as a command without capability authorization in native host.
- Native bridge (Bun/Node or existing approved implementation, OpenCode/ZCode-authored) implements ACP client JSON-RPC, storage, GitHub sync, local agent routing, and adapter to OpenCode's supported `acp` or `serve` interface according to capability negotiation; Chrome is not itself the ACP agent.
- ACP negotiation: initialize/version/capabilities; supported session/new, resume, prompt, update, cancel; feature-probe actual installed version, do not assume ACP v2 semantics in a v1 runtime.

## Role model
Chief/Planning/CoS/Efficiency/Dashboard are *named human-facing role contexts*, NOT five independent continuously executing ChatGPT web-app processes. Mapping: role_id -> approved chat URL + canonical GitHub capsule + assigned runtime identity (if any) + last evidence time.
Future autonomous workers use ACP sessions with explicit authorization, and may send role-directed events that the extension shows. ChatGPT tab presence remains UI metadata; backend workers' liveness is verified separately.

## Authority model
A read-only watch can be automatic; changing repo files, running shell, accessing browser content, starting an agent prompt, or sending a message into ChatGPT must pass existing authorization and task policy. MVP sends structured tasks to *approved local ACP runtimes*; does not autonomously drive chatgpt.com.
Trust boundaries: webpage is untrusted; content scripts cannot grant privileges; extension origin pinned; local host authenticates source/target and checks path/command scope, replay/nonce, rate, timeout. Sensitive payload opt-in and data minimization. No transport ever weakens a host stop order.
No auto-execution from GitHub issue comments. Grok Bot operates Linux/test/verification but must never author/modify code: code goes to OpenCode/ZCode.

## Workflow
1. User highlights text or presses side-panel 'Create task'; choose role/executor, scope, approval.
2. Extension creates provisional task with idempotency key and local outbox sequence.
3. Native relay resolves target ACP endpoint and permission; ACK of transport is not ACK of execution.
4. Executor produces ACCEPTED -> STARTED -> PROGRESS -> PROOF_SUBMITTED, referencing artifacts and hashes.
5. Independent verifier emits VERIFIED or REJECTED; GitHub stores durable canonical receipt.
6. Extension shows newest timestamp, staleness, exact evidence URL, and ability to reopen appropriate ChatGPT role for decision.
7. On disconnection, retry using state machine in FALLBACK.md; never duplicate non-idempotent execution.

## Rollout
M0: Chrome extension side-panel read-only dashboard from *synthetic/local fixture* + manual reconnect; no browser injection.
M1: Real native messaging handshake to read-only ACP capability/status and GitHub evidence; demonstrate restart recovery.
M2: Single user-approved scoped task -> OpenCode ACK -> implementation -> negative test -> independent proof receipt (Task-to-Proof).
M3: Cross-machine BFF Linux evidence sync and fallback, then opt-in role task rehydration; only after hard tests.
M4: IANG graph projections, multiple adapters, provider-aware work routing.
Maintain one repo branch main (per current AION operating rules); no new long-running service merely to keep tabs alive.

## Non-goals for v0.1
- No perpetual ChatGPT model activity, automated login/session-renewal, captcha/cloudflare bypass, rate-limit evasion or undocumented ChatGPT API.
- No general browser content harvesting, silent prompt submission, privileged shell execution through injected pages, or free-running agents from untrusted messages.
- No second platform or Slack; existing GitHub/UAH/SQLite canon remains.

## Official technical references
Chrome MV3 lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
Chrome WebSockets: https://developer.chrome.com/docs/extensions/how-to/web-platform/websockets
Chrome native messaging: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
ACP overview: https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/overview.mdx
