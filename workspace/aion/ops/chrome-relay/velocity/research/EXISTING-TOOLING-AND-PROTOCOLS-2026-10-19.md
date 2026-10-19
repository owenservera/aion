# AION Chrome Track B — Existing tooling and protocol acceleration review

Date: 2026-10-19. Scope: **velocity/control plane**, not Track A live acceptance. Research-only GitHub publication. No Windows installation, browser execution, new extension, or daemon started in this review.

**Verified AION refs**
- Track B: https://github.com/owenservera/aion/issues/32 ; isolated branch `track-b/velocity-command-plane-20261019`.
- Track A: https://github.com/owenservera/aion/issues/31 ; frozen stable Chrome build reference `fd347f22` / Profile 3 / `com.aion.relay`.
- Architecture: `../DUAL-TRACK-COMMAND-PLANE-2026-10-19.md`; live receipt: `../../../agents/windows-master/LIVE-INTEGRATION-2026-10-19.md`.
- Current branch comparison at research time: Track B **11 commits ahead, 0 behind main**, with a 10-file `velocity/` code/test scaffold and 1 workflow. Its CLI is explicitly **offline-safe**: `send` refuses `RUNTIME_NOT_CONNECTED`; RPC is a *validator*, not a listening daemon. Do not represent it as installed/running.

## Executive selection

**Implement the shortest viable end-to-end vertical slice rather than migrating frameworks.** Keep one AION Bus core and no-resend ledger. Make `aiond` its single owner, expose an authenticated local RPC entry and event subscription, let Chrome bridge over the existing Native Messaging host and OpenCode through its existing ACP/V2 adapters. The CLI and panel become clients, never secondary execution authorities. GitHub remains the task/evidence ledger, not a millisecond transport.

Track B's aim is *one command* — `aion send chief "Review the change"` — with verified pre-bound target, source/context snapshot, grant, exact-once admission, immediate operation ID, asynchronous readback and no silent retries. An impossible/ambiguous target yields a bounded refusal, not an improvised send.

## Prioritized accelerators (actual tooling, not imagined libraries)

| Priority | Existing tool / protocol | Concrete benefit | Decision / caution |
|---|---|---|---|
| P0 | Chrome MV3 `runtime.connectNative` + `tabs.connect` Ports | Existing low-overhead Chrome-to-Windows and tab channels, native host launched only for a session | Keep; thin host proxy to one AIOND authority; preserve sender-origin gate. Chrome 105+ native connection keeps MV3 service worker alive, but restart/disconnect must be handled. |
| P0 | Node `net` Windows Named Pipes + AION `aion.rpc/1` | One CLI/host/controller RPC endpoint; no extra broker or HTTP dependency | Implement using Node >=22 already used by existing bus; inspect named-pipe DACL, explicitly restrict to current user or refuse to expose command methods. Client-supplied `source` is metadata, NOT proof of peer identity. |
| P0 | Existing `extension/src/bus` + `bus/node-storage.js` | Preserves agent/grant/nonce/route/operation logic and current tests | Rehost into a **single writer**. Existing file backend has lock aging and two-process use; any stale-lock break could conflict with a live long transaction. Remove concurrent mutation before porting storage. |
| P0 | Existing AION ChatGPT content adapter and live Windows UIA source | Reuses compose/observe; fixes one known missing Send actuation path without new browser automation framework | Chrome-native is preferred. UIA fallback only with *the same* immutable target/operation and positive no-send evidence; unknown outcome means read-only reconciliation, never a second send. |
| P1 | Microsoft `winapp ui` (public preview) | `inspect/search/get-value/invoke/wait-for` plus machine-readable JSON for accessibility-level Windows action discovery | Pilot on **isolated dev profile**; compare to proven local UIA driver. Test exact HWND and unique accessible control; benchmark shell-out overhead. Not installed/Chrome-verified. |
| P1 | OpenCode V2 `@opencode/client` / HTTP session API | Typed commands and persistent local session, `/api/info`, session prompt, message readback, event subscribe | Existing AION V2 adapter has real 2.0.32 fixture. Preserve it; evaluate generated client for schema drift. `/api/event` is **volatile** and never durable proof; reconcile by session messages and idle/completion markers. |
| P1 | ACP v1 + official `@agentclientprotocol/sdk` | Standard initialization, session lifecycle, prompt/update/cancel and capability negotiation across coding agents | Existing AION ACP adapter already works. SDK can replace hand-authored framing *after* parity tests, not in a forced rewrite. ACP v2 is **draft**, not the deployed OpenCode 2.0 protocol. |
| P1 | Bun `bun:sqlite` WAL / transactions | Atomic reservation, grant debit, idempotency and event log with multi-reader access | Only after single-writer parity and crash tests; use `synchronous=FULL` for authority writes if power-loss durability matters. `NORMAL` can lose the most recent commits on sudden power loss. No migration before tests. |
| P2 | Tailscale Serve + existing ZCode Pocket / phone PWA | Private HTTPS phone-to-PC command ingress; avoids waiting for ChatGPT web-tab refresh | Optional parallel client to **same AIOND**; Serve is private tailnet (not Funnel). It is not the same as making mobile ChatGPT itself expose local tools. |
| P2 | MCP / Secure MCP Tunnel | ChatGPT-native tool ingress where a workspace actually has eligible custom-MCP access | Keep read-only pilot separate. Current OpenAI Help says custom MCP connections are **web-only**, Business/Enterprise/Edu full, Pro read/fetch; Plus entitlement not established. Not a viable P0 mobile write dependency. |
| DEFER | Chrome DevTools Protocol / `chrome.debugger`, WXT/CRXJS rebuild, Electron/Tauri shell, new message broker | Powerful but enlarge privileges/dependencies and distract from current adapters | CDP only for a deliberately isolated diagnostic lane, not normal command authority. No Playwright, Puppeteer or Orca. No framework rewrite, no new dashboard before live command completion. |

### Official source verification

1. Chrome Native Messaging framing, Windows registration, host process lifetime, 1 MiB host->Chrome limit: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
2. MV3 lifecycle (Chrome 105 native-port keepalive; Chrome 114 long-lived messaging semantics; Chrome 116 WebSocket behavior; 30 s idle termination): https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
3. Extension message Ports and JSON serialization: https://developer.chrome.com/docs/extensions/develop/concepts/messaging
4. Named pipes in Node: https://nodejs.org/api/net.html ; **Windows named pipe default DACL grants read access to Everyone and anonymous**: https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights . Do not equate a random pipe name with an ACL.
5. WinApp CLI/UIA: https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/ ; https://github.com/microsoft/winappCli/blob/main/docs/ui-automation.md ; optional code library: https://github.com/microsoft/winappCli/blob/main/src/winapp-CLI/WinApp.UIAutomation/PACKAGE.md
6. ACP v1 protocol and TypeScript SDK: https://agentclientprotocol.com/protocol/v1/overview ; https://agentclientprotocol.com/libraries/typescript
7. OpenCode V2 service API and generated client: https://opencode.ai/v2/docs/api ; https://opencode.ai/v2/docs/build/client ; `GET /api/event` explicitly **volatile**.
8. Bun SQLite WAL and transactions: https://bun.com/docs/runtime/sqlite ; https://bun.com/reference/bun/sqlite/Database
9. Tailnet-only HTTPS: https://tailscale.com/docs/features/tailscale-serve
10. OpenAI custom MCP eligibility and **web-only, not mobile**: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt ; secure tunnel: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
11. CDP/debugger adds a special, high-privilege Chrome debugger permission: https://developer.chrome.com/docs/extensions/reference/api/debugger

## Specific branch findings and proposed low-effort corrections

1. `velocity/src/rpc.mjs` currently only validates packets with `schema,request_id,source,channel,method,params`. **Do not trust the caller-asserted `source=cli/native_host/panel`**. Bind peer identity at IPC accept time, then inject verified source and immutable channel server-side. Validate command against AION Bus's actual grant and binding logic; a syntactically valid `grant_ref` grants nothing.
2. `velocity/src/readiness.mjs` is a pure projection. It currently reports overall `state` based on `actions.submit`, even if `inspect` is READY. Change display to *per-action* readiness (and possibly a separately labelled send-readiness summary) so status-only clients are not painted unusable. Readiness must include actual draft/lock state, agent binding revision, action actuation, observer age and authenticated bridge, not only `health: CONNECTED`.
3. `velocity/bin/aion-velocity.mjs` deliberately returns `RUNTIME_NOT_CONNECTED`; this is **correct** until real IPC. Do not silently turn it into a second live CLI by reusing `bus/node-storage.js` directly. Next implementation should replace the offline stub with an RPC client while keeping the same `send chief ...` grammar.
4. `bus/node-storage.js` uses `staleMs=30000` for file locks; validate lock ownership and elapsed command duration in a crash/freeze test, not just age. A live slow writer can otherwise lose its lease. Architectural fix: one long-lived writer AIOND and read-only subscribers.
5. Existing OpenCode V2 HTTP adapter already supports session create, prompt, readback, event hints, with real service fixture. Do not build a second adapter and do not confuse `/api/event` events with a durable receipt.
6. Chrome-native Send activation is the live blocker, **not** browser-host connectivity. Track B should prove a single fresh, bound, authorized action in the dev extension; then benchmark its UIA fallback against the same operation ID without ever running a second send after an uncertain attempt.
7. **Phone ingress remains a separate uncertainty.** A phone-authored turn on the ChatGPT app is not evidence that a previously open PC commander tab receives an event in real time. Run SYNC-0 as a read-only freshness experiment. If sync cannot meet Track B latency, use the already-existing phone PWA through Tailnet HTTPS for direct commands as an optional same-ledger client. This preserves the user's ChatGPT.com pilot while giving Track B a functioning low-latency mobile path.
8. Reuse branch `track-b/velocity-command-plane-20261019`; never replace Track A pinned extension/Profile 3/host. Dev builds need distinct extension id, Chrome profile, native host `com.aion.relay.dev`, IPC namespace, ledger, origin restrictions, reversible install and source digest receipts. The same bus *library* can be imported from one versioned source without sharing production state.

## Architecture: preferred minimal stack

- **Runtime:** Node >=22 (already used by bridge, bus, Track B). Single Windows user-session AIOND. Do not introduce Bun only to run the daemon; Bun SQLite is a future storage option if already present.
- **Host-side IPC:** JSON-RPC-style request/response + subscription over one Windows named pipe, with an **audited SID-restricted security descriptor** and client identity. A loopback HTTP API is not required for CLI; OpenCode's own loopback HTTP endpoint remains its native surface. The Chrome native-host proxy must not be a second operation owner.
- **State:** existing AION Bus in one process; atomic file store initially, **single writer**; SQLite only after parity/crash tests. Transcripts and Chrome credentials never become bus event fields.
- **Events:** `aion.event/1` envelopes, monotonic sequence + operation ID. Producer events pushed to subscribers; reconnect from persisted cursor and snapshot, not from WebSocket/SSE in-memory buffers. Timeouts classified NOT_SENT only with positive evidence, else UNKNOWN / RECONCILE_REQUIRED.
- **CLI:** reuse current `velocity/src/commands.mjs` as the front end. AIOND resolves aliases to confirmed binding revisions and performs all grant/nonce/operation admission; CLI auto-supplies bookkeeping, never authority.
- **Chrome:** MV3 content script -> worker -> pinned native host proxy -> AIOND. No browser-webpage direct IPC access. Keep bounded MutationObserver/ping only in explicitly scoped commander/target conversations.
- **OpenCode:** prefer an already-running V2 server for service-native action availability and readback; retain ACP v1 for compatibility. Choose exactly one route per operation, snapshot it and never cross-retry on failure.
- **UIA:** same-operation fallback/independent validation. Exact window identity and unique UIA target, `InvokePattern` if actually supported. Probe the current Send control before submitting.
- **Activation:** `aion doctor` read-only; `aion activate --channel dev` explicitly manages owned reversible resources; `aion stop` halts new dispatch; `aion rollback` reverses only dev Track B files/registry/host entries, preserves ledgers.

## Fastest executable sequence

**B1 (foundation):** real local AIOND service, IPC accept/identity/ACL, existing bus loaded as single writer, status/doctor/capabilities/read-only subscriptions, simulated transport negative tests. Test peer spoofing and daemon restart.  
**B2 (first vertical slice):** make `aion send chief "..." ` resolve to a confirmed dev conversation and one existing Chrome native host/content port under one grant; return operation ID, reply and durable independent readback. Avoid any UI/pane redesign first.  
**B3 (fast action visibility):** per-target action probes with TTL, push changes, cached snapshots, stale handling. Benchmark p50/p95 for status/admission/availability; separate model latency.  
**B4 (multipliers):** measured WinApp UIA adapter (fallback) and OpenCode service/ACP adapter, same ledger. Optional Tailnet phone PWA client if ChatGPT PC tab sync cannot deliver.  
**B5 (release):** shared panel projection + activation/rollback + frozen A/B compatibility tests and independent live acceptance. Selectively promote proven Track B changes to Track A by SHA.

### Acceptance measurements (targets, not observations)

- `aion status --json` warm p95 <=150 ms; admission/operation id p95 <=250 ms.  
- Relevant capability changes pushed within 1-2 s when a real event source exists; after TTL expires show STALE/UNKNOWN.  
- Send 1x, observe 1x, correlate 1x; never auto-resend after ambiguous submit.  
- Demonstrate process death, browser/worker restart, stale-source spoofing, missing/retired binding, expired/revoked grants, concurrent CLI callers, UIA fallback after NOT_SENT and refusal after UNKNOWN, user session lock, mismatched token, and ACP/HTTP disconnect.  
- Track A remains unchanged; no claim of completed Chrome/native or mobile bridge until Windows and independent acceptance receipts exist.

## Final recommendation

**GO on B1 single-writer AIOND and B2 Chrome-native CLI bridge immediately in the Track B branch.** Pilot WinApp CLI in parallel only because Windows UIA already solved a real Send actuation failure. Keep ACP SDK/SQLite/MCP as adapters and later upgrades, not new prerequisites. The two most important unresolved product dependencies are (1) an actually executable Chrome submission under one op ID and (2) observable phone-to-PC command freshness; neither is resolved by a faster parser or a new schema alone.
