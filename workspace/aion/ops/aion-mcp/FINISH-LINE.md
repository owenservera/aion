# AION BUS — one release, two protocol edges, one evidence contract

Status: **software packaged for Windows verification; neither a ChatGPT website turn nor a custom ChatGPT MCP tool call is claimed here.**

## What is assembled

```
[ChatGPT website] ←→ [AION Chrome MV3 extension, pinned ID]
                           ↓ Chrome Native Messaging
                    [com.aion.relay Windows native host]
                           ↓ ACP v1 stdio
                    [OpenCode 2.0.x local agent]

[ChatGPT native custom plugin] (workspace eligibility dependent)
                           ↓ MCP via Secure MCP Tunnel (outbound HTTPS)
                    [aion-mcp stdio read-only]
                           ↓ bounded read
                    [AION STATE.json and receipt metadata]
```

The website path and custom plugin path **are different entry points, not competing ACP buses**. MCP is not ACP, a Chrome ACK is not a model reply, and reading a GitHub issue does not start a Windows job. Remote ChatGPT sessions do not run autonomously when idle. Neither path claims to provide native ChatGPT→ChatGPT agent-to-agent execution without a real tool invocation or explicit user turn.

## One Windows command for all machine-side *offline* readiness

From `C:\0-BlackBoxProject-0\AION` in **PowerShell 7** after your normal local-master Git sync has brought down this commit:

```powershell
pwsh -NoProfile -File .\workspace\aion\ops\aion-mcp\windows\Complete-AionBus.ps1
```

It checks the checkout, Node, disk and installed OpenCode, runs existing extension, bridge and adapter tests, runs `aion-mcp` tests, validates or adds a **missing only** HKCU `com.aion.relay` registration with pinned origin, and spawns the MCP server to prove initialize / list / local state / receipts / SHA-256 / negative-tool refusal. It writes an **offline, sanitized** JSON receipt outside Git to `%LOCALAPPDATA%\AION\bus\readiness\`. A failing stage returns exit 1; nothing is silently retried. This is a one-command operator bootstrap, not a remote push or silent Windows installation from ChatGPT.

The script deliberately **does not** pull/reset Git, create accounts, run automatic browser prompts, reconfigure an existing conflicting native host or create a tunnel without a real identity/key. Existing browser authorization for one benign turn is recorded in issue #27; the owner or local authorized executor uses the *existing* AION side panel in Chrome Profile 3. Never submit an existing draft.

## Actual live website acceptance — existing extension

The Chrome extension/ACP host has already recorded a side-panel native `relay.ping` and ACP `relay.hello` on the Windows master; those are useful transport proof, not website acceptance. The `use_dynamic_url:false` loader correction exists in repo source; after syncing it, the **already-installed** pinned-ID extension must be reloaded and an existing `chatgpt.com` tab refreshed or a new empty chat used. In the AION side panel, use tab listing and read-only PING first, then one explicit owner-authorized benign correlated `run-turn` on an empty composer. Capture send timestamp, final reply, consumption, and wrong-correlation rejection; preserve only minimized evidence in issue #27. Treat disconnection after a send as `OUTCOME_UNKNOWN`, **never auto-retry**. Keep `m1_verified=false` until an independent reviewer checks both positive and negative proof.

The currently observed live issue is the content-script dynamic import. Fixing the manifest in Git is **not proof** Chrome was reloaded and PING passed. No Playwright/Puppeteer/Orca.

## Actual ChatGPT custom plugin acceptance — conditional

1. Open https://chatgpt.com/plugins in the desired **web** workspace and confirm `+ → Add custom MCP server → Connection: Tunnel`. OpenAI's current help documents full custom MCP for Business/Enterprise/Edu; **Plus is not an established entitlement**. Installed Plugin Creator is a separate authoring capability, not a registered MCP endpoint.
2. In https://platform.openai.com tunnel settings, create/reuse a tunnel associated with this ChatGPT workspace, assign Tunnels Read+Use and a restricted runtime API key, install the **official** `tunnel-client` from Platform. No credentials in Git or chat.
3. On Windows run `windows/Connect-AionTunnel.ps1 -TunnelId <real tunnel id>`. It configures the official client, runs `doctor`, then maintains a foreground tunnel to `node src/server.mjs` (stdio). No public inbound port.
4. In Plugins add the **private** MCP connection to that actual tunnel, review only the three read-only tools, install/enable and call `aion_state` in a fresh **web** chat. An actual read-back receipt is the only evidence of this half of the bus. No write/execute tools are published by this pilot.

If custom MCP is unavailable on the active workspace, stop here and retain GitHub + Chrome as the available communications paths; no software package can grant account entitlement.

## Success and blockers

| Gate | Evidence | Current |
|---|---|---|
| Repo source | Seven-file read-only pilot plus this completion pack | Code committed / inspect GitHub |
| MCP stdio tests | `node --test tests/*.test.mjs` and `node bin/verify-local.mjs` | Windows verified 2026-10-18T18:33Z: **7/7 tests pass**, **6/6 verify-local checks**; offline local probe only, not a ChatGPT connection |
| Native Chrome ↔ ACP | Windows native host reply | Prior partial proof recorded in STATE.json |
| Chrome ↔ real ChatGPT | One correlated send/reply/consume and rejected wrong reply | NOT VERIFIED |
| Private ChatGPT plugin | Real tunnel readiness + tool call from a web chat | NOT VERIFIED; plan permission unknown |
| Full program acceptance | Two lanes evidenced independently, no false promotion | NOT VERIFIED |

Issue ownership: [#27 Windows browser/ACP](https://github.com/owenservera/aion/issues/27), [#28 ChatGPT custom MCP](https://github.com/owenservera/aion/issues/28). The local Windows machine remains master. This document makes no claim about access to the live host from this ChatGPT chat.

## Direction note, 2026-10-19
This pilot is read-only. Statements here that no path claims ChatGPT→ChatGPT agent-to-agent execution describe today's state. [Bus V1](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) targets that capability; this MCP route is its **Option B** (connector bridge) and would need write tools. Plus eligibility and mobile availability are UNVERIFIED.
