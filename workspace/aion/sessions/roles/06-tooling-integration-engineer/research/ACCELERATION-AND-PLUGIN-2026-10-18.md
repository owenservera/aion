# TOOLSMITH research — acceleration proposals, internal capability tests, custom ChatGPT plugin

Date: 2026-10-18. Author: Claude (research pass, owner request). Status: **PROPOSALS + TEST PLAN, nothing built, nothing run.**
Audience: Role 06 TOOLSMITH (ChatGPT), local Windows agents, Owen.
No new gates are introduced here. Every item is optional and can be reordered by the owner.

## 1. Why this exists

Owner question: how can we accelerate the overall goal (M1), the AION capability and the system? Follow-up: file this under TOOLSMITH with proposals, ask TOOLSMITH to run internal capability testing, and look into a custom ChatGPT plugin for the web app.

## 2. Findings (sources read 2026-10-18)

| # | Finding | Source |
|---|---|---|
| F1 | ChatGPT can call outside code through **custom MCP servers**, packaged as a **plugin** (skills + manifest + optional MCP connection). Add from ChatGPT **Plugins → plus → Add custom MCP server**. Developer mode is not required in the current Plugins experience. | [OpenAI help: custom MCP servers](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt), [Connect and test your plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt) |
| F2 | **Plan matters.** Per the OpenAI help article: Pro can connect custom MCP servers with **read/fetch only**; full MCP (write actions) is Business and Enterprise/Edu. Business: admins/owners only. Third-party posts disagree (some say Plus/Pro get write access); the OpenAI article is the stronger source but CAP-03/CAP-04 below confirm it on the actual account. | same, plus [Peliqan](https://peliqan.io/blog/chatgpt-mcp/), [Auth0](https://auth0.com/blog/add-remote-mcp-server-chatgpt/) |
| F3 | Custom MCP servers work on **ChatGPT web only, not mobile**. No geo restriction stated. ChatGPT cannot reach a local server directly. | OpenAI help article |
| F4 | **Secure MCP Tunnel**: outbound-only `tunnel-client` runs next to the server (stdio command or HTTP URL), long-polls OpenAI, no inbound ports. Needs a Platform org, a `tunnel_id` and a runtime API key. Limits: 600 req/min, 10 MiB, 120 s deadline. Not for public distribution. | [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels) |
| F5 | After approval ChatGPT uses a **frozen snapshot of tool definitions**; changes need a refresh/republish. Deep research supports read/fetch tools only. | OpenAI help article |
| F6 | `codex app-server`: JSON-RPC over stdio (`initialize`, `thread/start`, `turn/start`, streamed events). WebSocket mode is experimental. Windows support not stated on the page. | [Codex App Server](https://learn.chatgpt.com/docs/app-server) |
| F7 | ACP over HTTP/WebSocket is an active RFD, not final. Stdio child process remains the right transport now. | [ACP RFD](https://agentclientprotocol.com/rfds/streamable-http-websocket-transport) |
| F8 | OpenAI Terms list "Automatically or programmatically extract data or Output" as prohibited (March 2026 capture, not a legal reading). Relevant to the UI-driving route only. Informational, not a gate. | [ConductAtlas excerpt](https://conductatlas.com/platform/openai/terms-of-use-row/provision/CA-P-017130/prohibition-on-automated-data-or-output-extraction/) |

Not verified by me: the Role 04 research claims about scheduled-task limits, Work Cloud and EEA availability.

## 3. Proposals

Each proposal has an ID so it can be accepted, dropped or reordered without touching the others.

- **P1 Parallelise issue #27.** Agent A: host entry point, HKCU registration, service-worker adapter (steps 1-3). Agent B: content-script port driver, fixture and negative runs (steps 4-6). They join at the live run (step 7). Largest schedule gain, zero new infrastructure.
- **P2 `aion-mcp` read-only plugin.** A small local MCP server exposed through Secure MCP Tunnel (stdio, no public URL) so ChatGPT can **read AION state and receipts** when the owner invokes it. This is the ChatGPT-side half of the roundtrip (the M1b idea) without DOM scraping, and read-only tools fit the Pro limit in F2. Design in section 4.
- **P3 Write tools only where the plan allows.** `aion_send_correlated` and `aion_ack` are write actions. Add them only if CAP-04 shows the account permits it. Otherwise ChatGPT reads, and the local runtime writes.
- **P4 Codex app-server / `opencode acp` as the worker interface.** Use the existing JSON-RPC protocols rather than a bespoke agent bridge. First task: confirm app-server runs on the Windows machine (CAP-L1).
- **P5 Keep the web-page route as a one-shot proof.** One owner-initiated round trip plus one negative case for M1. The plugin route carries ongoing use. This is the lowest-exposure combination.
- **P6 Skills inside the plugin.** Package the role bootstraps (`AION:NN`, the TOOLSMITH runbooks) as plugin skills so a role launches with `@aion` instead of a pasted bootstrap. Complements RL-001 and the mobile-first role work (note F3: MCP tools are web-only, skills alone may still work elsewhere, to be tested).

## 4. Custom ChatGPT plugin design sketch (`aion-mcp`)

Goal: a private plugin for the owner's ChatGPT web app that lets ChatGPT see AION state and receipts and, if the plan allows, hand work to the local runtime.

```text
ChatGPT web (Plugins: aion)
        | MCP over Secure MCP Tunnel (outbound only)
        v
tunnel-client (Windows)  --stdio-->  aion-mcp (Node or Bun, zero deps if possible)
                                         |-- reads  STATE.json, receipts/, git log (local clone)
                                         '-- writes queue/ (P3 only) for the local runtime
```

Tool set (names are a proposal):

| Tool | Kind | Returns |
|---|---|---|
| `aion_state` | read | parsed STATE.json fields plus git HEAD |
| `aion_receipts` | read | list and fetch receipt files by id (bounded size, under 1 MiB) |
| `aion_verify_challenge` | read | recompute a challenge hash from a nonce so ChatGPT can state a checkable detail |
| `aion_send_correlated` | write (P3) | queues a correlated prompt for the local runtime, returns `correlation_id` |
| `aion_ack` | write (P3) | records that ChatGPT consumed a given receipt |

Design notes:
- Bounded results with the limit stated in each tool description (deep research is intolerant of large payloads).
- Tool annotations set honestly (read-only vs write).
- Frozen snapshot (F5): version the tool list and refresh the connection after every change.
- Local-only data access; no secrets, cookies or tokens in tool output.
- Test per the OpenAI guidance: MCP Inspector first, then an eval set of direct, indirect, follow-up, write and unsupported requests in a fresh chat with `@aion`.
- Needs: a Platform org tunnel and API key held in Windows Credential Manager (not in the repo), and confirmation of F2 on this account.

Estimated effort: read-only server about one day for a local agent; skills packaging and eval set about another half day.

## 5. Internal capability tests (TOOLSMITH runs these inside its own ChatGPT chat)

These are self-observations: ChatGPT reports what it can see and do in a normal owner-initiated chat. They do **not** drive a browser, read cookies or touch any signed-in session from outside. Report results in the format in section 6.

| ID | Test | Pass means |
|---|---|---|
| CAP-01 | List every tool/connector available in this chat (names only). | Honest inventory, no invented tools. |
| CAP-02 | Read `research/cap-probe.json` on `main` through the GitHub connector and report its `nonce` and the first 12 hex chars of SHA-256 of `nonce`. | Both values match the file and a recomputation. Proves a checkable repo readback. |
| CAP-03 | Open Plugins. Is **Add custom MCP server** present? Is **Tunnel** offered as a connection type? Which plan/workspace type does the account show? | Exact UI text reported, or "not present". |
| CAP-04 | If a custom MCP server can be added: are write tools permitted, or read/fetch only? Do not add any real server yet; report what the UI states. | Matches or contradicts F2, with the quoted UI text. |
| CAP-05 | Does the account show Developer mode? Is it needed? | Yes/no with location in UI. |
| CAP-06 | Web vs mobile: which of the above are visible on the web app and which on mobile? | Table of web/mobile availability. |
| CAP-07 | Can ChatGPT run code in chat (compute SHA-256, parse JSON)? Which sandbox, any limits? | One computed value shown with the input. |
| CAP-08 | Scheduled tasks / Work: are they available on this account, and what are the observed limits? | Quoted UI text, no extrapolation. |
| CAP-09 | Project and memory settings that affect role isolation (see RC-V1 isolation matrix). | Settings reported as observed. |
| CAP-10 | Reply with a one-line statement of which findings in section 2 (F1-F8) the account contradicts. | List, possibly empty, with evidence. |

Optional local lane (Windows agents, not ChatGPT):
- **CAP-L1** `codex app-server` starts on the Windows machine and answers `initialize` over stdio.
- **CAP-L2** `opencode acp` still answers `initialize` (v2.0.32 seen earlier).
- **CAP-L3** `npx @modelcontextprotocol/inspector@latest` runs against a trivial local MCP stub.

## 6. Report format

```text
AION_TOOLSMITH_CAPABILITY_V1
as_of_utc: <time>
chat: <role chat url or "not recorded">
account_plan_as_shown: <text or UNKNOWN>
results:
  CAP-01: PASS|FAIL|NOT_AVAILABLE|UNKNOWN - <one line of evidence>
  ...
contradicts_findings: <F-ids or none>
notes: <anything else, including what you could not see>
END_AION_TOOLSMITH_CAPABILITY_V1
```

Post it as a comment on the request issue. A GitHub comment does not wake a ChatGPT chat; the owner (or any agent with a user turn) pastes the issue link into the TOOLSMITH chat, which then reads it through the connector.

## 7. What this does not claim

- No plugin, tunnel or MCP server exists yet. `m1_verified` stays `false`.
- F2 is the OpenAI help article's statement, not an observation of this account.
- The terms excerpt (F8) is informational.
