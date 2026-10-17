# AION Relay Bridge — Milestone 1 design (Chrome ↔ local ACP)

**Status: PROPOSED — not built, not installed, nothing registered.**
Prepared 2026-10-17. Implements the transport implied by
[`ARCHITECTURE.md`](ARCHITECTURE.md) + [`ENVELOPE-CONTRACT.md`](ENVELOPE-CONTRACT.md) +
[`OPENCODE-BUILD-ORDER.md`](OPENCODE-BUILD-ORDER.md), using the ACP contract researched in
[`../opencode-2/ACP-AND-SERVICE-PROTOCOL.md`](../opencode-2/ACP-AND-SERVICE-PROTOCOL.md).

## 0. Verified evidence this design rests on

Read-only probe of the live host, 2026-10-17 — `opencode acp` spawned as a child, one `initialize`
sent, stdin closed immediately after. Result: **ACP-01 PASSES**, returning
`protocolVersion: 1`, `loadSession: true`, `mcpCapabilities {http:true, sse:false}`,
`promptCapabilities {embeddedContext:true, image:true}`, all six `sessionCapabilities`
(additionalDirectories, close, delete, fork, list, resume), `authMethods [{id:'opencode-login'}]`,
`agentInfo {name:'OpenCode', version:'2.0.32'}`.

The research dossier's documented contract therefore matches reality. That is the one thing this
milestone did *not* have to assume.

## 1. The problem this design actually solves

Three unrelated wire formats must be bridged. They are **not** interchangeable, and the dossier is
explicit that an ACP JSON-RPC message is not an OpenCode HTTP method, not an MCP tool call, and not an
AION relay envelope.

| Layer | Format | Notes |
|---|---|---|
| Chrome ↔ native host | **4-byte little-endian length prefix + UTF-8 JSON** | Fixed by Chrome. Not line-delimited. |
| Native host ↔ ACP agent | **newline-delimited JSON-RPC v1** | stdin/stdout of a child process. |
| AION semantics | **relay envelope**, 19 required fields | AION's own schema. |
| (excluded) OpenCode V2 HTTP API | authenticated HTTP + SSE | **Not used in this milestone.** |

A naive "just point the extension at it" cannot work: the framing differs, and the extension cannot
spawn a process or open a socket to a stdio agent at all. **A native host process is mandatory**, and it
must translate on two boundaries. That is the whole content of this milestone.

## 2. Proposed architecture

```
Chrome side panel (workspace/aion/ops/chrome-relay/extension)
   |  chrome.runtime.connectNative('com.aion.relay')
   v
com.aion.relay native host  (NEW — a console-app bridge, run as the logged-in user)
   |  translates: Chrome framing <-> newline JSON-RPC
   |  translates: relay envelope <-> ACP JSON-RPC
   |  spawns and supervises the child
   v
opencode acp  (v2.0.32 child process, private server, stdin/stdout, NO network port)
```

### Why a native host and not a loopback WebSocket

`ARCHITECTURE.md` lists an authenticated localhost wss/ws as optional fallback (mode B). This milestone
uses the native path deliberately because:

- the ACP agent opens **no network port**, so a loopback design would still need a relay process — the
  same amount of new privileged code, with a listening socket added for no gain;
- native messaging gives Chrome-enforced origin pinning and a fixed extension ID, which the design
  treats as a trust requirement;
- it matches the design's stated primary topology, so nothing later has to be reversed.

**Not chosen:** reusing `magic-api-graph`'s TCP:9100 Go host. It is a working reference for the same
*shape*, but it fronts a TCP protocol, not an ACP stdio agent. Copying it would mean a TCP hop that
buys nothing. Its value here is as a reviewed reference, and that is how it is used.

## 3. What must be built (all new, all in-repo)

| # | Component | Path | Notes |
|---|---|---|---|
| 1 | Native host bridge | `ops/chrome-relay/bridge/` | Chrome framing <-> newline JSON-RPC; envelope <-> ACP; spawn + supervise `opencode acp` |
| 2 | ACP client | `ops/chrome-relay/bridge/src/acp-client.js` | initialize -> session/new -> session/prompt; maps `session/update` to relay events |
| 3 | Envelope mapping | `ops/chrome-relay/bridge/src/envelope-map.js` | Explicit both ways. Never pass a relay envelope through as if it were ACP. |
| 4 | Host manifest + install script | `bridge/native-host/manifest.json`, `install.ps1` | Writes `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay` |
| 5 | Tests | `bridge/tests/` | The ACP-01..12 subset below, with a fake ACP child so most need no real agent |

Reuse, not rebuild: the relay envelope codec, validation, state machines and event store already exist
in `extension/src/lib/` and pass 81/81. The bridge must **consume** that library, not reimplement it.

## 4. Milestone 1 acceptance (no ChatGPT, no signed-in session)

Drawn from the dossier's ACP-01..12. Everything here runs against a **local repository** and, except
where marked, a **fake ACP child process** — so the suite is deterministic and free.

| ID | Test | Notes |
|---|---|---|
| ACP-01 | initialize returns version + capabilities | **already PASSED** by the live probe; re-asserted in the suite |
| ACP-02 | `session/new` scopes cwd; wrong cwd on load/resume/fork is rejected | guards cross-project writes |
| ACP-03 | `session/prompt` completes and yields final stop reason | |
| ACP-05 | a second concurrent prompt on one session is **rejected** | per the documented contract |
| ACP-06 | `session/cancel` yields cancelled stop reason | |
| ACP-09 | child death is detected and recoverable; no orphaned sessions | |
| ACP-10 | **no stdout protocol contamination** — logs must never land on the ACP stdout channel | real risk; logs go to stderr |
| ACP-11 | **no credential leakage** into events, logs or the envelope | |
| NM-01 | Chrome refuses a host whose `allowed_origins` does not match the extension ID | denial case |
| NM-02 | the host refuses a message from an unexpected `origin` | denial case |

**Explicitly out of Milestone 1:** anything touching chatgpt.com, the signed-in profile, cookies, tabs
or prompt submission. The extension keeps **no host permissions and no `tabs` permission**, so it
*cannot* read the page even if the panel were somehow opened there. That is a structural guarantee,
not a promise.

## 5. What needs owner authorization, and when

| Action | Gate |
|---|---|
| Write the bridge source + tests in-repo | none |
| Register `com.aion.relay` under `HKCU\...\NativeMessagingHosts` | **owner approval** — it is a persistent system registration |
| Add `nativeMessaging` permission to the extension manifest | **owner approval** — a privilege increase over the shipped MVP |
| Load the unpacked extension into a profile | **owner approval** — and prefer a profile that is NOT signed into ChatGPT |
| Any test against chatgpt.com | separate, scoped authorization (decision record §5) |

The honest sequence is: build + test with a fake child first (no gates at all), then request approval
for the two registration changes, then prove `initialize` end-to-end through the real extension. Only
after that does ChatGPT become a question — and it is a *different* milestone.

## 6. Risks accepted knowingly

- **cwd scoping is the main safety property.** `session/new` fixes an absolute cwd and load/resume/fork
  require a matching one. A bridge that lets the extension choose cwd freely would hand any web page a
  path to write. The host must fix cwd itself and ignore extension-supplied roots except through an
  allowlist.
- **Additional directories persist on the session** and are visible to other OpenCode clients. Must be
  audited, not enabled by default.
- **Child-process lifetime.** ACP is a private per-process server; it dies with the host. Durable state
  must come from the GitHub ledger, never from assuming a live session.
- **`opencode` on PATH is a `.ps1` shim.** The host must spawn the absolute `.exe` path or `ENOENT`.