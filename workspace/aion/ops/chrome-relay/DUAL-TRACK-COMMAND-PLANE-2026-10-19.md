# AION Chrome Relay — Two-Track Development and Unified Windows Command Plane

**Date:** 2026-10-19  
**Status:** PROPOSED ARCHITECTURE — document and issue registration only. No source edits, local deployment, Chrome action or live execution performed in this document creation.  
**Owner authority:** Windows local machine remains the only human/master runtime. GitHub distributes project tasks and stores reviewed evidence, not real-time machine commands.  
**Tracks:** [Track A — Verified](https://github.com/owenservera/aion/issues/31); [Track B — Velocity](https://github.com/owenservera/aion/issues/32).  
**Existing work:** [CR-001 #18](https://github.com/owenservera/aion/issues/18), [Windows M1 #27](https://github.com/owenservera/aion/issues/27).  
**Frozen implementation reference:** `fd347f22dba24e9282e8a39b01ed5f0c760bee14`, extension 736/736, bridge 126 + 1 opt-in skip, bus 8 + 2 opt-in skips, MCP 10, adapter 35, demos 3/3 offline.  
**Real live observation:** Native Windows UIA sent one ChatGPT test and machine-read the reply on 2026-10-19. Chrome extension filled composer but did not activate Send; no accepted relay envelope or independent M1 negative case. `m1_verified=false`. See [LIVE-INTEGRATION-2026-10-19.md](../../agents/windows-master/LIVE-INTEGRATION-2026-10-19.md) and [STATE.json](../../STATE.json).

## 1. Executive design decision

**Two development/release tracks, not two independent command engines.**
- **A / Verified:** existing stable Chrome extension, native host, tests, live acceptance, independent validation, no-resend invariants and rollback. Frozen reference until explicitly released.
- **B / Velocity:** independently installable experimental extension with independent identity/profile/state, new single-command user experience, capability discovery, fast local runtime and Windows interaction layer.
- **One logical product:** both import the shared AION Bus V1/V2 contract. Track B's validated improvements are selectively promoted to Track A, never by overwriting the stable installed build.
- **One control point:** `aion` CLI, panel and optional future phone/desktop view are *clients of the same local control service*. Neither UI is itself the sole scheduler or system of record.
- **One durable operation identity:** operations that may have submitted are never automatically retried, even across a different adapter.

Reject design variants that add an unrelated second message bus, separate browser queue, privileged remote HTTP listener, or background Chrome scraping. Keep no Playwright, Puppeteer, Orca.

## 2. Verified code reuse and present split

| Existing source | Reuse | Gap to resolve |
|---|---|---|
| `extension/src/bus/{contracts,grammar,registry,ledger,grants,validate,bus}.js` | Provider-neutral command identity, validation, authorization, no-resend and reporting | Rehost as one writer/service; preserve proofs |
| `extension/src/bus/adapters/chatgpt.js` | Browser conversation adapter | Present at a remote invocation boundary, not a Node CLI adapter |
| `extension/src/background/chatgpt-port.js` and `chatgpt/content.js` | Real tab port and split submit/observe protocol | Real Chrome Send activation unresolved |
| `extension/src/background/bus.js` and `src/panel/bus.html` | Side-panel control primitives, SYNC-0, status | Expose unified projections/actions from local service |
| `bridge/src/bus-relay.js`, native host and Windows host registration | Real ACP executor and extension<->Windows bridge | Adapt native messaging host to single long-lived local authority without relaxing origin validation |
| `bus/bin/aion-bus.mjs`, `bus/node-storage.js` | Existing Node operator CLI, same bus core and file ledger | Current CLI deliberately never touches Chrome; uses separate file ledger from browser `chrome.storage.local` |
| `extension/src/bus/adapters/{acp-executor,opencode-v2}.js` | OpenCode ACP and HTTP executors | Expose readiness, failures, state and cost/model routing |
| `role-launcher/ROLES.json` | Role names, aliases and bootstrap refs | Resolve to verified, current session bindings; `null` is not a valid target |
| Windows UIA live receipt | Proven InvokePattern send and direct transcript readback | Wrap as bounded Windows adapter/diagnostic tool; do not conflate with browser-native success |

**Critical integration seam:** Node runner and extension share JavaScript bus logic but not an authoritative durable ledger or browser endpoint. This must be resolved before marketing the CLI as a unified command plane. Existing README status is historical in places: prefer exact source commits and STATE.json.

## 3. Target topology

```text
       USER / OPEN CODE / AGENTS / FUTURE PHONE
           |           |             |
       aion CLI     Side Panel     Optional Desktop Pane
           \           |             /
            \   AION Local RPC API /
             [AIOND -- Windows per-user controller]
                command parser + context resolver
                capability registry + readiness subscriptions
                grant/authorization checks + route planner
                single-writer durable operation ledger
                event stream + correlation + reconciliation
                   /          |           |          \
          Chrome adapter   OpenCode     Windows UIA    Native tool executor
            |             ACP/HTTP       adapter        git/pwsh/process
           Native host         |             |               |
           MV3 extension     OpenCode      Win desktop     Windows local
           content port      service       controls       resources
              |
        chatgpt.com tab / verified conversation
               |
           ChatGPT reply
              -> observer -> ledger -> event stream -> CLI/pane
```

The **per-user** runtime is deliberate. Desktop interaction must occur in the owner's interactive, unlocked Windows session, not an isolated Session 0 service. Start via user logon/task scheduler only once proven. Unlocked UI, selected Chrome profile, interactive integrity level and target focus are capabilities, not assumptions.

## 4. AIOND: control plane, transport and ownership

AIOND (proposed) is a local, user-scoped process, not a second bus:
- **Transport:** Windows Named Pipe restricted to the logged-in user SID for CLI/panel host-side connections. Browser content scripts never connect directly to the pipe. Chrome MV3 -> `runtime.connectNative('com.aion.relay[.dev]')` -> existing vetted framed native host -> AIOND. Host verifies pinned extension identity. No public TCP port.
- **Single writer:** daemon serializes durable bus transitions and enforces idempotency/locks/grants. Adopt the existing bus core and `store.mutate()` semantics. Initial implementation may reuse the existing atomic file backend behind daemon-only ownership. **Target** SQLite WAL-backed store with typed migration, durability parity, crash matrix and cold-read comparison before switching; not an opportunistic database rewrite.
- **Transient browser data:** `chrome.storage.local` holds only extension-specific recovery references/mirrored display state and browser-side pending observer identities. The canonical command state lives in AIOND, not two independent stores.
- **Recovery:** after MV3 suspend/restart/browser refresh, replay *observations*, not command sends. Reconcile mismatched or possibly-submitted operations to UNKNOWN until proven. Restore immutable bindings and grants.
- **Event delivery:** RPC streams/subscriptions for CLI and pane; native messaging port for push and heartbeats; Chrome page MutationObserver on permitted chatgpt.com DOM only when explicitly armed; Windows UIA events and process/window events when enabled. Timer refresh is bounded fallback, never evidence of a successful action.
- **Security:** local OS user identity + source-bound client identity + existing AION grants. CLI presence is not blanket authority; each operation checks its permitted target and action. Do not read Chrome cookies, tokens, browser private files, global clipboard or other sites by default.

Windows power, disk, network, locked desktop, process crashes and version drift are explicit operational hazards. Daemon failure must appear as UNAVAILABLE, not fabricated READY.

## 5. Unified command grammar and inherited context

User-facing syntax (proposal, not implemented):

```powershell
aion
aion status
aion capabilities --live --json
aion send chief "Review the latest AION integration"
aion send research --file .\question.md --wait
aion send opencode "Run focused tests" --repo aion --model auto
aion observe OP_20261019_xxx --follow
aion windows inspect chrome
aion windows invoke "ChatGPT Send" --operation OP_20261019_xxx
aion doctor --json
aion activate --channel dev
aion stop
```

`aion send <alias> <text>` is **one user command** and performs preflight transparently. Internally:
1. Parse the command, resolve `chief` -> immutable registry identity (role 05), choose verified session binding; never invent a session URL.
2. Gather inherited context: confirmed AION default profile/channel, selected repo/cwd/worktree, active operation, source identity, expected response condition and preferences. Persist a snapshot on the operation; future changes to the active tab cannot silently retarget it.
3. Compute action readiness: target present, extension/native host alive, content observer installed, no incompatible draft/lock, send action available, owner grant valid, current code/protocol versions compatible.
4. Select execution route by verified target and capabilities: Chrome-native preferred for signed-in ChatGPT; OpenCode ACP or authenticated loopback HTTP for executor targets; Windows UIA **only as explicit same-target fallback**, not as a different account/model/session.
5. Atomically reserve the command, grant capacity, unique correlation and reply token, write durable state; enforce once-only dispatch semantics.
6. Return operation ID and admitted/refused state immediately; asynchronous *local process* sends one time if allowed, then emits events. `--wait` subscribes to the final result but does not start a second send.
7. Capture correlated response via real observer; show final status and exact evidence. On a timeout, classify accurately: NOT_SENT only with positive evidence, otherwise UNKNOWN and reconcile read-only.

An absent/ambiguous verified destination, unpublished grant, occupied draft, stale capability or unresolved prior attempt yields a specific `REFUSED`/`UNKNOWN` and recovery hint rather than silent default selection. The CLI may supply missing correlation IDs, request IDs and protocol fields, **never missing execution authority**.

Recommended one-command defaults are per-user and versioned (`current_channel`, `default_project`, `agent_aliases`, `confirmed_conversation_bindings`, `route_preferences`, `execution_policy`). Source of a value is recorded (`explicit`, `session`, `saved_default`); ambiguous values are not guessed.

## 6. Availability: a live capability graph, not a static list

Every provider or surface publishes an `aion.capability/1` snapshot (proposed fields):

```json
{
  "target": "chatgpt:chief",
  "endpoint": "chrome:dev:conversation:verified-ref",
  "transport": "nativeMessaging",
  "observed_utc": "<observation-time>",
  "freshness_ms": 421,
  "health": "CONNECTED",
  "capabilities": {
    "inspect": "READY",
    "compose": "READY",
    "submit": "UNVERIFIED",
    "observe_reply": "READY",
    "cancel": "UNSUPPORTED"
  },
  "authz": "GRANT_REQUIRED",
  "blockers": ["submit_actuation_unverified"],
  "source": "real_observer"
}
```

Readiness dimensions are separate: **installation**, **connectivity**, **authenticated site access** (without extracting credentials), **identity/binding**, **action support**, **permission**, **execution capacity**, **current busy/lock**, **freshness**, **reply observation**. A tab-open signal cannot imply an active agent or model is working. `READY` is tied to a recent real probe. After TTL expiration, report `STALE` or `UNKNOWN`.

**Availability collection:** Chrome extension lifecycle/onConnect/tab-update events + port ping and DOM observers; Windows process/window/UIA events; OpenCode service health/session status and configured models; selected local shell/Git action catalog; optional other providers later. Agents subscribe to changes and should not each scan/reconstruct the entire machine.

**Latency targets (engineering targets, NOT tested):**
- Warm local `aion status --json` p95 under 150 ms.
- Local command validation/reservation + operation ID p95 under 250 ms.
- Presence/capability changes visible in 1–2 s when event source exists; if stale after 2 s, explicitly show stale/unknown.
- Incremental idle discovery: event-driven, not constant DOM/page polling.
- Report separately: CLI overhead, local queue/admission, activation, remote model wait, reply correlation and end-to-end total. Provider completion is not under AION SLA control.

Availability graphs can be used by future model-credit routing, but do not confuse catalog availability, quota knowledge and actual authenticated provider action.

## 7. Chrome Track A and Track B isolation

| Resource | Track A | Track B |
|---|---|---|
| Extension package | current `extension/` frozen baseline | development build derived from same source |
| Chrome identity | pinned `kgjfielmhcdlggjppmliabpiljnonhki` | different public key/ID generated and recorded at build time |
| Browser | existing Profile 3 | explicitly selected separate dev profile or isolated user-data-dir |
| Native host | `com.aion.relay` | `com.aion.relay.dev` |
| Local IPC | stable namespace | dev namespace |
| Persistence | stable ledger and Chrome storage | separate dev ledger and Chrome storage |
| Task source | current #18/#27 + Track A | Track B issue |
| Code policy | preserve freeze until approved | separate branch/worktree, additive adapters, feature flags |
| Promotion | only externally independently verified | rapid local vertical slices |

Never load two builds with the same extension ID into one profile or repoint a stable native-host registration to a dev checkout. No untested arbitrary Chrome profile migration. Separate install, doctor, uninstall and rollback receipts. A release manifest includes git SHA, manifest digest, Chrome id, registered native host path/version, profile selector and state schema.

## 8. Windows interaction layer

One shared command API with multiple Windows adapters:
- **Native OS capability** (preferred): process/window availability, service status, shell commands, Git, filesystem and OpenCode via direct APIs and allowlisted tools. Do not use UI automation to run ordinary CLI commands.
- **UI Automation capability**: use Windows UIA for Chrome/desktop controls when no direct API exists or for independent confirmation. Inspect tree/target identity, select one unambiguous UIA element, check `IsEnabled`, `InvokePattern`, report observed state; no arbitrary coordinate clicks. The 2026-10-19 UIA receipt proves this approach for the ChatGPT Send control on the owner's machine.
- **Potential accelerator:** evaluate Microsoft's public-preview `winapp ui` CLI (`winapp ui inspect/search/invoke`) rather than writing all UIA wrappers from scratch. **Not installed or Chrome-compatible proven**; benchmark on Windows before adoption. It can be an implementation dependency only after license/version/tooling review and live test.
- **Desktop availability:** an actual logged-in, unlocked interactive session is required for UIA. Lost desktop session, ambiguous Chrome window, disabled Send button, changed accessibility tree or draft collision => unavailable/refuse.
- **Fallback**: Chrome-native composer/submit first for ChatGPT target. UIA fallback only after a confirmed no-send or before any dispatch; if an extension may have sent, reconciliation only. UIA actions share the **same immutable operation ID, no-resend state, grant, target and reply expectation**. No second send path outside the ledger.
- **Windows activation suite**: `aion doctor` (read-only health), `aion activate` (explicit guarded changes/start/reload, snapshots), `aion repair` (bounded remedy proposals), `aion rollback` (reverses exactly owned changes), `aion stop` (kill switch + clearly stated interruption semantics). Do not silently reset a command ledger or modify HKCU registry/Chrome installs as side effects of ordinary `send`.

## 9. Shared operator pane

The side panel, terminal and optional future Tauri desktop shell all consume one projection from the local runtime:
- **Top status:** current channel, daemon and native host version, Git working tree, profile, real host connection, kill switch, live authorization.
- **Command bar:** plain-language command and target alias; explicit `Run`; no exposure of correlation IDs or tokens unless diagnosing.
- **Live capability explorer:** endpoints, actions, last observation, accuracy/freshness, blockers, configured bindings and allowed routes.
- **Operations stream:** operation ID, current lifecycle, observer and executor progress, readback, errors and evidence.
- **Agent roster:** configured/bound/readiness/working distinguishable; never equate an agent role tab with live cognition.
- **Activation/repair/rollback:** single guided suite, with machine-readable equivalent. One-click stop.
- **Advanced disclosure:** raw envelopes, grants, lock and reconciliation details live behind diagnostics, not the ordinary send flow.

A notification/terminal subscription is driven by actual events. Never report `CONNECTED` as `READY_TO_SEND`, or `DISPATCHED` as `SENT_OBSERVED`.

## 10. Operations protocol

**Proposed unified wire contracts:** `aion.command/1`, `aion.capability/1`, `aion.operation/1`, `aion.event/1`. Reuse the current `AION_CMD_V1`, bus grants, state and adapter manifests internally; never invent a second incompatible grammar to route an existing command.

Lifecycle: `RECEIVED → CONTEXT_RESOLVED → AUTHORIZED → RESERVED → DISPATCHED → SUBMISSION_OBSERVED → REPLY_CHECKED → REPORTED`. `REFUSED`, `HALTED`, `UNKNOWN` and `RECONCILE_REQUIRED` are explicit. Map these onto existing bus states; this is a view, not a competing machine.

For every operation preserve: `operation_id`, `idempotency_key`, `target_binding_revision`, `context_snapshot_digest`, `grant_ref`, `origin`, `route`, `adapter_revision`, `created_at`, `last_event_at`, `status`, `evidence_refs`, `retry_prohibited_reason`.

Command availability, liveness and health updates **never issue user commands**. Long-running local operations are run by the local daemon, not ChatGPT thinking between conversations.

## 11. Implementation sequence: two independent lanes and shared gates

**A lane / Verified** remains on #18/#27 and its [new issue](https://github.com/owenservera/aion/issues/31):
A1 source/install identity; A2 investigate/fix only with approval; A3 Chrome-native one-turn positive receipt; A4 negative and no-resend/restart proof; A5 independent acceptance; A6 promote approved B components by SHA.

**B lane / Velocity** starts at [new issue](https://github.com/owenservera/aion/issues/32):
B0 inventory surfaces + confirm one-ledger migration seam; B1 runnable AIOND and local RPC + event subscriptions; B2 one-command CLI binds to existing browser via existing extension/native-host path; B3 live capability/action probes and operation readback; B4 bounded Windows UIA fallback and OpenCode integration; B5 activation/doctor/rollback + shared side panel; B6 minimal-step speed trials and safe Track A promotion.

**Shared gates**: never break existing no-resend invariants; do not create a fresh safety bureaucracy. Every B increment gets direct focused unit/integration coverage + one real measured task, then A independently tests the exact build on its separate channel. Track B's faster proof loops do not mark M1 as passed.

**Suggested first working sprint:** B0+B1+B2 together as a thin vertical slice. Do not spend the sprint on prettier dashboards, new model routers, global cross-agent memories or a rewrite of the existing bus.

## 12. Non-goals and boundary of future enhancements

- Not a generic website scraping tool and not a credential/session extraction mechanism.
- Not a claim that an idle ChatGPT conversation is autonomously running; the content adapter acts only when there is a real authorized operation.
- Not silently permissionless browser sending or UI automation across random applications.
- Not deploying an unauthenticated loopback/web service externally. OpenCode's official `serve` binds localhost by default and can use password auth; keep local-only and do not forward secrets to panels.
- Not making GitHub issue comments a millisecond real-time RPC bus; GitHub remains durable task assignment, commits, review and outcome evidence. Future phone control requires a separately authorized protected route (e.g. a user-scoped private overlay) to the same AIOND interface.
- Not using Playwright, Puppeteer or Orca.

## 13. Unresolved engineering decisions (not blockers to B0)

1. Choose first daemon implementation: existing Node/Bun wrapper with Windows named-pipe IPC versus a light native host extension; prefer Node/Bun reuse for speed. Verify restart and no-resend parity in Track A before promotion.
2. Decide exact `store.mutate` transport and migration: daemon-only file storage initially or SQLite adapter with matched crash matrix. Avoid two canonical write stores.
3. Choose dev Chrome profile and development signing identity only after the owner/Windows agent has inspected existing profiles; never assume a particular Profile number.
4. Confirm `winapp ui` behavior on the specific Chrome 155 accessibility surface and whether direct COM UIA is more reliable.
5. Decide the default one-command route only for targets with preconfirmed binding; no silent fallback across accounts/models/conversations.

## 14. Evidence and official references

- [Chrome: extension service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle): MV3 idle/restart semantics; native messaging port lifecycle; persist, rehydrate.
- [Chrome: native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging): Windows HKCU host registration, extension origin checks, framing and 1 MB host-to-Chrome limit.
- [Chrome: extension messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging): service worker/extension page/content-script ports and events.
- [OpenCode server](https://docs.opencode.ai/docs/server/): authenticated loopback HTTP option.
- [Microsoft UIA control patterns](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controlpatternsoverview): inspect and invoke explicit controls.
- [Microsoft winapp CLI](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/): preview tool; its UIA commands require local evaluation.
- [AION frozen live receipt](../../agents/windows-master/LIVE-INTEGRATION-2026-10-19.md).
