# AION private MCP ingress (read-only pilot)

**State: SOURCE_IMPLEMENTED / TESTED_IN_ISOLATED_LINUX_SANDBOX / NOT INSTALLED ON WINDOWS / NOT CONNECTED TO CHATGPT.**

A minimal stdio MCP 2025-06-18 server (`src/server.mjs`) that exposes local AION evidence to an authorized MCP client. Separate from the existing Chrome/ACP path in issue #27. Source task: issue #28 and the TOOLSMITH research dossier. The server does **not** speak ACP itself; it is the ChatGPT-facing read-only edge and may eventually call an independently authorized ACP gateway. Do not replace the existing `com.aion.relay` Chrome native host or add a second browser extension.

## Three read-only tools

| Tool | Reads | Restriction |
|---|---|---|
| `aion_state` | `workspace/aion/STATE.json` | Allowlisted fields only, snapshot labelled |
| `aion_receipts` | `workspace/aion/sessions/01-escape-hatch/adapter/receipt-*.json` | Fixed allowlisted directory, metadata only, first 20 sorted filenames; no raw reply text |
| `aion_verify_challenge` | literal public hex nonce provided by caller | SHA-256 digest + 12-hex prefix, rejects non-hex/oversized |

No write tools, command execution, model calls, GitHub credential access, Chrome hooks, ambient read of filesystem, or network listeners. Do not confuse an MCP `tools/call` with ACP `session/prompt`, a Chrome relay ACK, or a GitHub comment.

## Local test (Node 22+)

From repository root on Windows in PowerShell:

```powershell
cd workspace\aion\ops\aion-mcp
node --version
npm test
```

Expected: five passing test cases against a temporary sandbox fixture. The tests do not touch real `STATE.json`, real transcripts, ChatGPT, Chrome or the tunnel. On this authoring pass Node 22.16.0 in an isolated Linux container produced **5 pass, 0 fail**; Windows execution is not yet verified.

To run the read-only MCP server locally **after reviewing its code**:

```powershell
cd C:\0-BlackBoxProject-0\AION\workspace\aion\ops\aion-mcp
$env:AION_REPO_ROOT = 'C:\0-BlackBoxProject-0\AION'
node .\src\server.mjs
```

It waits for MCP JSON-RPC requests on stdin; **no banner appears**, and stdout must remain protocol-only. Starting the process alone does not make it available to ChatGPT. Stop with Ctrl+C.

An MCP Inspector can exercise the stdio tool interface (optional; inspect `npx @modelcontextprotocol/inspector@latest --help` first). Test a specific named run before deployment; no runtime installation has been performed from this chat.

## Plugin package

The portable `plugin.json` and `skills/aion-status/SKILL.md` are an **offline skill/package draft**. No `mcp.json` is shipped because there is not yet an actual registered ChatGPT MCP app ID, a validated tunnel, or an approved remote endpoint. Do **not** put a fabricated tunnel URL into a manifest. The installed ChatGPT Plugin Creator tool was discovered but is **not callable in this chat**; use the actual Creator in Work mode or Codex after a connection is registered. This folder is not a published plugin.

See `TUNNEL-SETUP.md` for the actual operator steps and plan eligibility limitation.

## Scope and security

- Root defaults to the repository containing this script; override with `AION_REPO_ROOT` when needed. The `receipt_id` API accepts basenames only and validates real paths to block traversal and symlinks escaping the allowlist.
- Files over 64 KiB are refused; stdin requests over 256 KiB are refused. The receipt list is bounded and explicitly marked `adapter_only` because some evidence lives elsewhere.
- Never expose raw transcripts or secrets through tools, logs, GitHub or plugin skill output. All filesystem-returned content is treated as untrusted data.
- Local Windows owner remains ultimate authority. Do not infer an ongoing ChatGPT model turn from tab presence, ACP initialization, tunnel health or a successful `aion_state` call.
- Follow existing AION GitHub sync and review policy; do not claim the host was changed simply because code was committed.

## Release gates

1. Node tests on Windows, review actual `STATE.json` shape with redacted tool output.
2. MCP Inspector local stdio tool call; missing receipt directory and hostile input negative cases.
3. Confirm custom-MCP eligibility in this ChatGPT account/workspace. Current OpenAI Help lists Business/Enterprise/Edu full MCP and Pro read/fetch; **Plus eligibility is not established**.
4. Platform secure tunnel identity + restricted runtime key provisioned locally by owner (not in GitHub).
5. Tunnel doctor and polling healthy; create private ChatGPT MCP plugin where allowed; validate from a real ChatGPT conversation.
6. If/when writes become authorized, implement **separate** ACP gateway tools with explicit approvals, correlation, idempotency, negative cases, audit receipts. They are out of scope for this read-only pilot.

Source docs: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt ; https://developers.openai.com/api/docs/guides/secure-mcp-tunnels ; https://developers.openai.com/plugins/build/plugins

## Complete local release checks

From the AION checkout, run `pwsh -NoProfile -File .\workspace\aion\ops\aion-mcp\windows\Complete-AionBus.ps1`. The complete pack and separate browser/plugin finish-line evidence are documented in [`FINISH-LINE.md`](./FINISH-LINE.md). The new `npm run verify` checks an actual local subprocess with the real checkout; this is read-only and never launches Chrome or an agent. `windows/Connect-AionTunnel.ps1` takes a real owner-provisioned tunnel ID and asks for a local secret without logging it.

> **Direction note, 2026-10-19:** this is the possible Option B channel for [Bus V1](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) (phone → ChatGPT → connector → PC). Plus and mobile availability are UNVERIFIED; no write tools exist; nothing here is claimed to work for Bus V1.
