# AION Track B — implementation architecture v1.0

**Status:** BUILD-READY DESIGN / NOT RUN ON WINDOWS  
**Date:** 2026-10-19 · **authority:** Windows local master · **repo:** `owenservera/aion` · **lane:** Track B only  
**Primary work:** [#32](https://github.com/owenservera/aion/issues/32), [draft PR #33](https://github.com/owenservera/aion/pull/33).  
**Related:** [Track A #31](https://github.com/owenservera/aion/issues/31), frozen verified source `fd347f22dba24e9282e8a39b01ed5f0c760bee14`, stable extension ID `kgjfielmhcdlggjppmliabpiljnonhki`.  
**Document set:** [Protocols and state](01-PROTOCOL-AND-STATE-CONTRACTS.md) · [Roadmap](02-BUILD-ROADMAP.md) · [Test/acceptance](03-VALIDATION-AND-ACCEPTANCE.md) · [Docs and Context7](04-CONTEXT7-SOURCES.md).

## 1. Product contract: command → result

Every supported action is initiated from **one** CLI / UI / MCP request, resolved to an immutable target and verified capability, authorized, durably admitted, attempted no more than once, observed, and returned as a self-contained `aion.result/1` record. The operator should neither enter correlation markers nor click a sequence of setup controls. The same result is available via `aion observe`, the side panel and an MCP status tool.

Primary use cases:
- `aion send chief "Review AION milestone"` to an **already bound** ChatGPT conversation in a separately installed dev Chrome channel.
- `aion send opencode "Run extension tests" --repo aion` using the **existing** OpenCode session/executor path, with explicit working-tree policy.
- `aion windows inspect chrome` / specific approved native application action via WinApp CLI or existing UIA.
- `aion status --json`, `aion capabilities --live`, `aion doctor` and `aion observe <id> --follow`: one shared source of status.
- `aion stop` stops new dispatch; any in-flight operation remains truthfully ATTEMPTED / UNKNOWN until independently observed or explicitly disposed.

**Hard invariants:** (I1) no same-intent double submit, (I2) grants consumed under one writer, (I3) exact target binding and context snapshot, (I4) UNKNOWN is never retried or labeled NOT_SENT, (I5) unrelated human drafts preserved, (I6) no credentials/screenshots/transcripts published by default, (I7) stable Track A instance never touched by B, (I8) evidence/provenance of each status.

## 2. Deployment architecture

```text
  User / CLI / OpenCode agent / MCP consumer / Side Panel
      |        |                    |          |
      |     local RPC              |       projection (via native host)
      +------------+---------------+----------+
                   |
         +---------v----------------------------+
         | AIOND-lite, per-user Windows process |
         |  - aion.rpc/1 request/response       |
         |  - event stream, seq/cursor          |
         |  - alias+context/binding resolver    |
         |  - capability cache + probe routing  |
         |  - owner-grant admission             |
         |  - existing AION Bus core            |
         |  - ONE authoritative bus ledger      |
         +----+--------------+------------------+
              |              |             |
         Native bridge    OpenCode     Win32 / PowerShell / UIA
              |          SDK/ACP       (+ winapp ui)
     +--------v--------+    |             |
     | B-only Chrome   |    |             |
     | Native Host     |  OpenCode    interactive desktop
     | stdio framing   |  sessions
     +--------+--------+
              | Chrome-initiated native messaging Port
     +--------v--------------------------------------+
     | MV3 B Dev Extension                           |
     | background service worker  <- tabs.connect    |
     | content script: submit once + observer        |
     | chrome.storage.local: browser actuation journal|
     +--------+--------------------------------------+
              |
      confirmed chatgpt.com conversation
              |
      actual ChatGPT result -> correlated observer receipt
              |
      browser journal -> host -> AIOND ledger -> CLI/panel
```

**Physical truth:** Chrome `runtime.connectNative` is initiated by extension worker / page, not by a Node CLI. AIOND-lite must be able to service (1) user CLI requests and (2) a Chrome-spawned native-host connection, then forward broker commands over that port. A detached CLI needs a broker that outlives that CLI. An always-running heavyweight service is **not** a prerequisite; an on-demand broker remains active while any operation/client/subscription exists.

## 3. Modules and code ownership

Place new source beneath existing `workspace/aion/ops/chrome-relay/velocity/`; **import** existing `extension/src/bus/`, `extension/src/bus/adapters/`, `bridge/`, `bus/node-storage.js`; never copy them into a divergent reimplementation.

Proposed paths, not yet present:

| Module | Proposed path | Single responsibility | Depends on |
|---|---|---|---|
| CLI | `velocity/bin/aion.mjs` | Parse/display results; subscribe; exit codes | `velocity/src/commands.mjs` |
| Broker lifecycle | `velocity/src/broker/server.mjs` | start-on-demand, shutdown, one instance/namespace | IPC/security |
| RPC server | `velocity/src/broker/rpc-server.mjs` | frame parse, method dispatch, identity/ACL checks | existing `rpc.mjs` |
| Operation runtime | `velocity/src/broker/operations.mjs` | resolve → grant → reserve → dispatch → observe | existing `createBus` |
| Capability index | `velocity/src/broker/capabilities.mjs` | subscribe, TTL, invalidation, provenance | existing `readiness.mjs` |
| Binding resolver | `velocity/src/broker/bindings.mjs` | Role aliases, exact immutable conversation/executor bindings | ROLES.json + bus registry |
| Event stream | `velocity/src/broker/events.mjs` | monotonically increasing cursor, replay snapshots | bus ledger |
| IPC transport | `velocity/src/transport/local-ipc.mjs` | length-prefixed framed JSON, cap + disconnect | Windows named pipe helper |
| Windows security helper | `velocity/windows/pipe-acl-setup.ps1` / narrowly scoped helper | explicit user SID pipe DACL + verification | Windows API |
| Dev native host | `velocity/src/native-host/proxy.mjs` | Chrome argv pin; bridge origin; broker connect; relay requests | existing framing/host |
| Worker B-mode bridge | `extension/src/background/velocity-client.js` | extension-initiated host port + worker command path | current `transport.js` |
| Browser adapter | `velocity/src/adapters/chrome.mjs` | bus adapter `deliver/observe/canonicalRef` to remote worker | current `chatgpt.js` |
| OpenCode | `velocity/src/adapters/opencode.mjs` | version-detected SDK/HTTP or existing ACP adapter | existing v1/v2 adapters |
| Windows | `velocity/src/adapters/windows-ui.mjs` | UIA exact-target inspection/action; lock | native UIA/WinApp |
| Pane adapter | `extension/src/panel/velocity*.js` | project broker status and events | current panel baseline |
| Activation | `velocity/windows/Install-AionVelocity.ps1` | staged dev install/doctor/revert | existing installers/tests |
| MCP | `velocity/mcp/server.mjs` | bounded MCP `aion_status/send/observe` gateway | same broker |
| Result projector | `velocity/src/result.mjs` | `aion.result/1`, display and receipt | bus operation and evidence |

**Preserve existing source:** `velocity/src/commands.mjs` currently supports `doctor/status/capabilities/send/observe/stop` but no `--wait`; `velocity/src/rpc.mjs` is a *pure request validator*; `velocity/src/readiness.mjs` projects observations without probes; `aion-velocity.mjs` intentionally refuses sends. Implement migration through small reviewed stages, not replace those facts with claims.

## 4. Broker ↔ native-host ↔ Chrome handshake and message flow

### Boot and discovery
1. CLI `aion status` locates running per-user broker by scoped endpoint. If absent, spawn `aiond-lite` once with bounded startup handshake. No user command is reserved until broker is healthy.
2. Broker opens **explicit logon-SID-secured IPC**, loads existing AION bus file ledger with exclusive mutation ownership, validates schema and kill switch; unreadable ledgers are **quarantined**, not reset to empty.
3. **B-only** extension service worker initiates `chrome.runtime.connectNative('com.aion.relay.dev')`. Chrome spawns a native host with extension origin in argv; the dev host validates it using the existing origin-pin logic (not origin field from request).
4. Host connects to broker as a restricted local client. Host sends `host.hello` with `protocol`, `extension_id`, `channel`, `manifest_version`, `worker_epoch`, `capabilities` and native origin-validation result. Broker checks channel allowlist plus transport provenance and reports CONNECTED only after handshake.
5. Extension advertises live `target.observe` snapshot via read-only content-port state on **already bound** targets. Broker makes no new tab binding from "selected tab" or URL substring.
6. If Chrome was opened before broker, native host can attach on its next bounded connection attempt. Any reconnect restores observation cursors and does not enqueue a send. Use bounded backoff only for connections; not for commands.

### Command/submit path
```text
CLI SEND -> broker RPC (no browser text execution yet)
   -> resolve target alias + stored binding revision + permitted channel
   -> non-invasive read-only preflight (port, tab URL exact, draft, lock, submit control)
   -> grant / owner approval check (not fabricated user_gesture)
   -> bus.ingestStructured -> RESERVED persisted
   -> bus.dispatch -> DISPATCHED persisted, text redacted from ledger BEFORE adapter call
   -> Chrome adapter sends B-host message bound to exact operation
   -> worker calls SAME existing chatgpt task store + submit-turn once
   -> browser journal persists arm/attempt/observer identity
   -> actual composer fill and Send invocation
   -> observer confirms submission / reply / refusal (or UNKNOWN)
   -> native host transfers minified evidence (never page credentials)
   -> broker bus observes settled state and projects `aion.result/1`
   -> CLI stream prints final result / pane mirrors it / optional GitHub minimized receipt
```

**Critical authorization seam:** Current browser driver uses `user_gesture:true` as a signal for owner-authorized panel actions. The CLI route must not lie that there was a browser click. Introduce a versioned `execution_authority` envelope allowing an explicitly recorded `operator_cli` owner intent/grant, mapped to an authorized worker action, with broker validation and existing worker refusal gates. Browser-origin untrusted content must never be able to mint this authority. Test cross-process auth and failure semantics before enabling.

**One writer, two domain journals:** The broker's file ledger is authoritative for BUS command/grants. Chrome's `chatgpt-tasks.js` state remains independently durable **only for browser actuation, observer identity, exact tab/operation local locks and recovery**. This is *not* a second competing bus writer; a correlation/command UUID joins records. Retain both until the old page/task retry invariants are reproduced by the broker; do not delete browser state merely to achieve the slogan "one store."

## 5. Local IPC and Windows operating system integration

### Pipe security
Node 22 `net.createServer` supports Windows `\\\\.\\pipe\\name` but does **not** expose an audited Windows user-SID DACL configuration in the API consulted. Microsoft's `CreateNamedPipe` allows a `SECURITY_ATTRIBUTES` descriptor, and **default ACLs grant read to Everyone and anonymous**. Therefore:
- **No sensitive operational RPC on default `net.createServer` pipe without a verified restrictive DACL**.
- Deliver a minimal audited Win32 / PowerShell-compatible bridge that creates the named-pipe listener with explicit DACL for the intended logon SID (optionally LocalSystem/Admin as appropriate). Node remains the business-logic engine behind that helper, or use another demonstrably secure same-user IPC mechanism after tests.
- Verify ACL by querying pipe security and testing unauthorized client denial. Avoid storing user SID in logs or public receipts.
- Bind both CLI and Chrome native host to the broker through authenticated peer channels; do not trust a client-provided `source:'native_host'` string.
- Use bounded length-prefixed JSON frames (default <=1MiB), schema validation and per-connection idle/flow control. The host->Chrome native messaging cap is 1MiB; outbound includes framing overhead and must enforce a smaller safe application maximum.
- Include request ID, operation ID, session/binding revision, sequence, protocol version. Reject unknown methods, incompatible versions and oversized payloads before dispatch.
- `stop` prevents new dispatch and records in-flight truthful states; it is **not** a retroactive unsend.

### Windows desktop UIA
Run WinApp/UIA in the owner **interactive logon session**. No Windows service Session 0 control; if desktop locked or target unavailable, return `DESKTOP_UNAVAILABLE`. Use existing proven UIA `InvokePattern` and compare to `winapp ui` commands. Serialize actions that require global foreground/focus; prefer exact HWND + AutomationId/role + enabled predicate. `winapp` exploratory CLI is **not installed/proven** on target PC. The initial Windows adapter supports `inspect`, `search`, `invoke`, `get-property`, `wait-for` bounded and allowlisted; no coordinate-click fallback by default.

### OpenCode
Keep current ACP and HTTP adapters until a version-matched SDK comparison. Official package is **`@opencode-ai/sdk`** (`createOpencodeClient`, `session.create`, `session.prompt`, `event.subscribe`). Do not use the previously assumed `@opencode/client` package name. Query `global.health()` and actual supported session/status API before running; confirm local-only auth and exact version (existing AION notes contain both OpenCode 1.19.x and 2.0.32 tests). SSE is a **volatile status stream**, not durable terminal proof: reconcile sessions/messages/error/idle outcomes via actual server state. ACP path may differ in persistence; route choice must be explicit before dispatch.

### Browser experimental ladder
- Deterministic Chrome MV3 is primary for authenticated ChatGPT.
- Optional direct-CDP Rust `agent-browser` for **isolated Chrome for Testing**, not the user's stable default profile. Current upstream package advertises `node >=24` for the npm wrapper; user's current Node 22 requires a pinned compatible standalone Windows binary or separate runtime. This dependency must never force the core to Node24.
- Browser Use via direct CDP only in a separate experimental actor, after inspecting pinned transitive dependencies for forbidden frameworks.
- WebMCP only if the actual origin exposes typed tools; do not assume ChatGPT uses it.
- Vision Computer Use models for entirely unstructured desktop tasks, with step/time budgets and explicit driver, **not** ordinary send path.
- Standing exclusion: no Playwright, Puppeteer or Orca in implementation, debugging or testing.

## 6. Lifecycle, responsiveness, resource budget

Broker lifecycle: `STOPPED → STARTING → READY → ACTIVE → DRAINING → STOPPED`; `DEGRADED` when partial adapters fail without asserting their readiness. On-demand startup for a CLI command, active while an operation or subscription is underway; a bounded idle timeout only when nothing is in flight and the state is durably settled. Broker crash never authorizes a retry. One instance per channel; duplicate instance must connect existing instance or fail.

Realtime capability sources:
- Chrome host lifecycle / port onDisconnect, tab updates / tab attach, bounded page observer for armed operation, page draft and exact Send readiness; TTL<=2s while actively watched otherwise `STALE`.
- OpenCode `event.subscribe` with polling/readback on SSE disconnect; remote model providers do **not** count as available just because catalog lists them.
- Windows process/window/UIA event subscriptions; desktop locked status, HWND invalidation.
- MCP tool inventories as configuration + explicit read-only health, no impersonated system actions.

**Performance targets (not claims):** p95 warm status <=150ms; warm admission+ID <=250ms; event-to-pane <=1s when connected; capability observed age <=2s or STALE; zero duplicate submission in fault matrix; idle footprint measured. Separate cold start, native port attach, Chrome actuation, model service latency and readback. Avoid periodic DOM scan timers for idle agents.

## 7. Release, state isolation and rollback

| Area | Track A stable | Track B isolated |
|---|---|---|
| git | `main` frozen source `fd347f22` for implemented components | `track-b/velocity-command-plane-20261019` / PR #33 |
| Chrome | already installed Profile 3 | **new separate profile after inventory**, own signing key/extension ID |
| Host | `com.aion.relay` | `com.aion.relay.dev` |
| bus state | stable Chrome/current runner paths | separate dev broker namespace and dev browser journal |
| Windows action | only already authorized stable workflows | bounded B-specific action authority |
| publication | independent acceptance | rapid branch builds, no automatic stable merge |

Installer: inventory Git worktree/dirty state, Chrome profiles/versions, native host HKCU registry, ACL/ports, OpenCode versions, installed tools and disk free; then plan, apply only B-owned scoped changes, verify exact paths/key/policy, write local sanitized receipt and rollback script. Never re-point stable HKCU host, never copy Chrome cookies, never presume dev profile has a signed-in ChatGPT session. Login, if needed, occurs through user-controlled browser UI.

Rollback: stop B worker/broker after truthful operation reconciliation, remove only B-owned autostart/host registration/extension, preserve unresolved journal and evidence, leave Track A unchanged. A failed install never claims success.

## 8. Promotion rules and known blockers

**First production-like proof is B2**: exact verified `aion send chief "..."` to a bound B profile ChatGPT tab, one real submission, observer-correlated service reply, same operation in CLI and panel, negatives fail closed, restart does not duplicate. It requires browser extension Send activation to work and cannot be replaced by independent UIA success.

Known B0 source facts: no broker or IPC listener in PR #33; CLI returns `RUNTIME_NOT_CONNECTED`; native host currently ACP-oriented; Chrome worker builds its own bus in `chrome.storage.local`; bridge and observer exist but activation failed in actual 2026-10-19 evidence. GitHub Actions startup_failures ran no tests. The roadmap must treat all these as open, not green.

**Highest-value correction:** do not invest first in a new model router, general computer-use framework, multi-agent bus, or UI redesign. Resolve the single writer + native host bridge, then demonstrate a single real command/result. All other adapters plug into that proof.
