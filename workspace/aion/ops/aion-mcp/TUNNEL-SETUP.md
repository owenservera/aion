# AION MCP — controlled operator connection (not yet executed)

**No tunnel, OpenAI API key, custom ChatGPT MCP connection or Windows install was created in this research turn.**

## Account capability gate

Open https://chatgpt.com/plugins on web. Select `+`; check whether `Add custom MCP server` appears and whether `Tunnel` is a connection choice. The installed **Plugin Creator** is an authoring tool; installing it does **not** grant custom MCP privileges or set up a tunnel.

As of 2026-10-18, OpenAI Help explicitly identifies ChatGPT Business and Enterprise/Edu for full custom MCP, and Pro for read/fetch custom MCP. **ChatGPT Plus is not explicitly granted custom-MCP eligibility by that page**; do not assert availability based on Plugin Creator being enabled. If `Add custom MCP server` is absent, STOP at the local MCP/skill pilot; do not invent a platform connection.

Docs: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt

## Local verification first

On the authorized Windows master:

1. Pull code through normal Windows-local git process and check its diff.
2. Run `npm test` in `workspace/aion/ops/aion-mcp`; capture actual totals and Node version.
3. Run an MCP Inspector against `node src/server.mjs` using the explicit `AION_REPO_ROOT` environment variable. Check `initialize`, `tools/list`, all three tools, traversal rejection and that no raw receipt replies appear. Ensure no other processes or ports are opened.
4. If tool output contains data not meant for ChatGPT, stop and revise the **allowlist**; don't send private evidence over any tunnel for convenience.

## Secure MCP Tunnel (only if eligible)

Official guide: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels

1. Use https://platform.openai.com settings to find or create a tunnel in the correct Platform organization, associate the ChatGPT workspace, and confirm permissions (Read + Manage for creation; Read + Use for runtime and app selection).
2. Download official `tunnel-client` for the Windows environment. Run `tunnel-client help quickstart` and check the **current** syntax; do not paste a key or command-line secret into GitHub or chat.
3. Configure its named stdio profile for the reviewed full command `node <absolute path to>\\src\\server.mjs`. Ensure `AION_REPO_ROOT` is set **only** in the host process environment. Use a locally managed runtime API key, not stored in code or plaintext documentation.
4. Run `tunnel-client doctor --profile <profile> --explain` and `tunnel-client run --profile <profile>` on Windows. Record health and readiness; don't equate connectivity with executing any task.
5. In ChatGPT Plugins, create an eligible private custom MCP server connection, choose Tunnel and the actual tunnel id, review only the three read-only tools, then install/enable it where the account allows.
6. Invoke the resulting plugin in a **fresh web chat** for `aion_state` and the public nonce check. Verify that GitHub source HEAD/state matches the local-authoritative runtime data. Record an evidence comment on issue #28. Do not enable write tools in this pilot.

Tunnels do not directly transport ACP or Chrome extension messages; the server is an MCP boundary that may be extended with explicitly authorized ACP routing later.

## Acceptance proof

- Host: `node --version`, source HEAD, `npm test` actual totals, Inspector output, no secrets.
- Tunnel: real tunnel identifier (not API key), doctor/ready evidence, timestamp.
- ChatGPT: plugin identity visible and one real tool invocation output.
- Authority: `aion_state` is a snapshot; no evidence of M1 until a separate real browser round trip plus independent negative-case verification.
> **Direction note, 2026-10-19:** this is the possible Option B channel for [Bus V1](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) (phone → ChatGPT → connector → PC). Plus and mobile availability are UNVERIFIED; no write tools exist; nothing here is claimed to work for Bus V1.
