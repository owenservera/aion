# OpenCode 2.0 — ACP vs shared service (officially documented)

**Verified source:** https://opencode.ai/v2/docs/cli/acp/ and https://opencode.ai/v2/docs/build/client/ as accessed 2026-10-17. **Status:** DOCUMENTED, not end-to-end tested on AION host.

## Two distinct operating modes: DO NOT conflate
| | `opencode acp` | `@opencode/client` / `opencode api` |
|---|---|---|
| Wire protocol | Agent Client Protocol **v1**, newline-delimited JSON-RPC | OpenCode V2 HTTP API and live event subscriptions |
| Runtime launched | Private OpenCode server started for ACP process | Shared user-level background service unless explicitly targeting a private server |
| Transport | ACP parent client launches subprocess; stdin/stdout | Authenticated HTTP + event stream; local service discovery |
| Service lifetime | ACP process closes when parent stdin closes | Shared server survives individual terminal/web/desktop clients subject to service health |
| Sessions | One ACP process supports many ACP sessions | Shared service provides central sessions across native clients |
| Ports | ACP itself opens **no network port** | HTTP service endpoint (local by default; remote pairing must be authorized) |
| Authentication | OpenCode's existing provider credentials; ACP terminal auth methods | Service-local auth/headers and configured provider credentials |
| Main AION value | Existing ACP client interoperability where needed | Persistent observation/control, typed app integrations and telemetry |

The project must use **an explicit gateway** if it needs both modes. An ACP session is not automatically a session on the shared V2 service; it runs against the private ACP server. An ACP JSON-RPC message is not an OpenCode HTTP method, an MCP tool call, or an AION relay envelope.

## V2 ACP contract facts
- Start as a child process `opencode acp`, not an interactive shell. Direct terminal use waits on stdin and can look hung.
- ACP v1 over newline-delimited JSON-RPC via stdin/stdout; logs on stderr if `opencode --print-logs acp` is used.
- `initialize` advertises loadSession, MCP HTTP (SSE false), prompt embeddedContext + image, and session close/delete/fork/list/resume.
- `session/new` sets absolute working directory. Load/resume/fork require matching `cwd` to the session's original directory.
- `session/load` replays saved messages; `session/resume` and `session/fork` do **not**.
- `session/list` paginates up to 100 per page with cursor/cwd filter.
- Only one active prompt per session; concurrent second prompt must be rejected.
- `session/cancel` emits cancelled stop reason and rejects pending permissions.
- Additional directories are explicit absolute roots and **persist on the session**, including when other OpenCode clients access it; permissions and roots must be audited.
- Model, effort and mode (primary agent) may be set through ACP config options, and config updates notify the client.
- Prompt blocks: text, images and embedded resource context supported; audio ignored by documented implementation.
- ACP auth uses `opencode-login`; a client supporting terminal auth may spawn `opencode acp --login`; never collect or relay actual credentials via GitHub.

## AION decision table
| Need | Prefer | Reason |
|---|---|---|
| ZCode/compatible editor speaks ACP | `opencode acp` | Wire-native ACP protocol, no custom v2 HTTP bridge |
| AION monitors sessions from several OpenCode native clients | V2 `@opencode/client` with service discovery | Shared service state |
| Role04 telemetry | V2 client first, if host upgraded and schema confirmed | Avoid ACP-only private session scope |
| Durable evidence across restarts | GitHub ledger + authoritative session reconciliation | Neither ACP transport nor live SSE constitutes independent proof |
| Multiple agents per worktree | Explicit location/correlation + admission policy | Prevent cross-project writes, duplicate task execution |
| Remote phone application | Defer until authorized network/pairing review | API authentication and exposure separate from ACP stdio |

## Acceptance tests before making ACP a production transport
ACP-01 initialize version/caps, ACP-02 new cwd scoping, ACP-03 session prompt and final completion, ACP-04 load replay vs resume, ACP-05 second concurrent prompt rejection, ACP-06 cancel, ACP-07 distinct worktree permission deny, ACP-08 plugin/model discovery, ACP-09 child death and restart recovery, ACP-10 no stdout protocol contamination, ACP-11 no leaked credentials, ACP-12 independent GitHub return evidence.

**Do not claim V2 ACP / shared HTTP parity by feature name alone.** Their capabilities and lifecycles differ.

> **Update 2026-10-19:** the "Remote phone application: Defer" row stands for direct phone→OpenCode exposure. Phone access is proposed only **indirectly** via [Bus V2](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) (phone → chatgpt.com on PC → extension → native host → ACP stdio); no network exposure of ACP is proposed.
