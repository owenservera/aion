# TOOLSMITH — ChatGPT Integration Bus V1/V2 source pack
Updated: 2026-10-19. Scope: **Generalizable ChatGPT communication layer**; VOM is pilot name supplied by owner, provisionally mapped to [VOMEGA](https://github.com/owenservera/VOMEGA) until runtime pilot contract confirms. NOT a VOMEGA-only codebase.
Status: curated research. Real signed-in ChatGPT behavior, custom plugin entitlement, Windows host and mobile sync require future host verification.

## Canon and available code — read before building
1. [AION root README](https://github.com/owenservera/aion), [AGENTS](https://github.com/owenservera/aion/blob/main/AGENTS.md), [STATE](https://github.com/owenservera/aion/blob/main/workspace/aion/STATE.json).
2. [Bus V1/V2 owner direction](https://github.com/owenservera/aion/blob/main/workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md), [Bus design](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/BUS-V1-V2-DESIGN.md), [envelope](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md).
3. [Chrome relay implementation](https://github.com/owenservera/aion/tree/main/workspace/aion/ops/chrome-relay), [existing adapter](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/01-escape-hatch/adapter), [ACPX review issue #25](https://github.com/owenservera/aion/issues/25). **Do not build a rival extension or reuse forbidden Playwright E2E**.
4. [AION MCP implementation](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/aion-mcp/README.md), [Windows finish-line](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/aion-mcp/FINISH-LINE.md) and [tunnel setup](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/aion-mcp/TUNNEL-SETUP.md). MCP and ACP are different protocols.
5. [OpenCode V2 dossier](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/opencode-2/README.md), [V2 API contract addendum](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/2026-10-19-opencode-v2-aion-contract-addendum.md).
6. [ChatGPT custom plugin research](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/2026-10-19-chatgpt-custom-plugins-mcp-aion.md); [TOOLSMITH skills](../skills/README.md).
7. [VOMEGA root](https://github.com/owenservera/VOMEGA), [VOMEGA project reality](https://github.com/owenservera/VOMEGA/blob/main/.project/REALITY.md), [VOMEGA AGENTS](https://github.com/owenservera/VOMEGA/blob/main/AGENTS.md). VOMEGA README says local semantic command box and `prompt.send`; **actual current executable pilot transport is not yet confirmed**.

## Official protocol and SDK references
| Subject | URLs / Context7 library | Specific build topics |
|---|---|---|
| ChatGPT plugins & skills | https://developers.openai.com/plugins ; https://developers.openai.com/plugins/build/plugins ; https://developers.openai.com/plugins/build/skills | portable plugin.json, SKILL.md, package version, onboarding and tool selection |
| ChatGPT custom MCP & secure tunnel | https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt ; https://developers.openai.com/api/docs/guides/secure-mcp-tunnels ; https://developers.openai.com/plugins/deploy/connect-chatgpt | Work availability, server connection, metadata refresh, stdio/HTTP, no local-port assumption |
| MCP events (future) | https://developers.openai.com/plugins/build/mcp-events | protocol-version-gated subscriptions/webhooks; feature availability unverified |
| MCP TypeScript | https://github.com/modelcontextprotocol/typescript-sdk , Context7 `/modelcontextprotocol/typescript-sdk` | v1/v2 SDK import boundaries; stdio tool server; JSON-RPC |
| Chrome MV3 | https://developer.chrome.com/docs/extensions/ , Context7 `/websites/developer_chrome_extensions` | content scripts, service worker suspension, native host, Windows HKCU, fixed extension identity, message send |
| CDP | https://chromedevtools.github.io/devtools-protocol/ | direct target discovery, attach/detach, `/json/version`, `/json/protocol`, no Playwright/Puppeteer |
| ACP | https://agentclientprotocol.com/ , Context7 `/agentclientprotocol/agent-client-protocol` | stdio initialize, sessions, prompts, updates, cancellation, protocol negotiation |
| OpenCode V2 | https://opencode.ai/v2/docs/api , https://opencode.ai/v2/docs/build/client , https://opencode.ai/v2/docs/build/plugins/migrate-v1 , Context7 `/websites/opencode_ai_v2` | `@opencode/client`, `GET /api/event` (volatile), plugin hook API, ACP vs service session scope |

## Protocol separation and options
- **Bus V1 — commander loop:** owner on phone → designated ChatGPT commander conversation → Windows Chrome edge → distinct ChatGPT web-app conversation agents → observe reply → report back. Input option A: commander-tab watcher. Need **SYNC-0**, a live no-send check of phone-to-PC tab visibility. Input option B: ChatGPT custom MCP write tool via tunnel, **only if capability actually exists**. Build transport-neutral command parsing, registry and executor separately; neither option is proven simply from docs.
- **Bus V2 — local executor:** same command envelope and registry to a local executor, starting **OpenCode V2** on Windows, via existing native-host→ACP or an appropriately versioned V2 `@opencode/client` adapter. Do not conflate `GET /api/event` with durable history.
- **Pilot VOM:** treat as `pilot_id=vom`; adapter into VOMEGA's actual command boundary, likely `prompt.send` from its documented README. Verify VOMEGA's existing interfaces before coding. Pilot may be first local consumer/origin, **not a required dependency for generic bus**.
- **Generalizations:** agent registry (identity, genealogy, binding kind, capabilities); transport adapters (ChatGPT DOM, MCP ingress, ACP/OpenCode, VOM); durable correlated envelope; command grammar; correlated readback; delivery dedupe and outcome-unknown; observed-vs-simulated tests; pluggable storage (Chrome local + SQLite optional); versioned contracts, permissions appropriate to target.
- **Security with low friction:** owner may direct ordinary code/build/tests; live session/browser work requires clearly authorized test. Fixed conversation target and no-resend after ambiguous delivery are core integrity requirements, not bureaucracy. No secrets committed.

## State and honest capability levels
As of observed repo, Chrome extension/native host and offline tests already exist. Windows README reports native PING and ACP hello, but **no verified real ChatGPT send/readback**. Existing read-only MCP source and tests exist; **no proven ChatGPT custom plugin connection**. Previous research has conflicting personal-plan eligibility claims: resolve against current account UI, not assumptions. VOM pilot integration **not tested**.
Read previous docs' versions and current git files, not old provenance labels; feature availability changes.

## Required Opus deliverables
**V1:** complete reusable commander-to-ChatGPT-agent bus implementation, command grammar+registry+genealogy+state+reporting, native edge adapters, offline tests and fixtures, user workflow, setup/rollback, and live Windows verification script; pilot VOM sample wiring.
**V2:** local OpenCode/ACP executor adapter and optionally V2 API route, MCP bridge capability path if eligible, async event/recovery, pluggable adapters, versioned contracts, upgrade/migration, operational observability, capability matrix, fault/restart tests and operator runbook. Do not claim third-party ChatGPT app integration works without a live entitlement check.
**No Windows access:** deliver code, deterministic tests, fake Chrome/ACP/MCP/OpenCode fixtures, reproducible self-checks, PowerShell host-validation commands, deploy manifests, honest `OFFLINE_VERIFIED/LIVE_PENDING` release evidence.
**No Playwright/Puppeteer**, no duplicate messaging platform, no unnecessary new daemon, no mock tests masquerading as real ChatGPT.

## Context7 provenance/retention
Context7 libraries used in earlier research: `/websites/opencode_ai_v2`, `/websites/developer_chrome_extensions`, `/modelcontextprotocol/typescript-sdk`, `/agentclientprotocol/agent-client-protocol`. Detailed queries are in the linked SOFTWARE_HQ addenda and TOOLSMITH skills index. This pack links source docs; it does not claim a fresh raw Context7 harvest. Full permitted raw captures should remain in SOFTWARE_HQ under its context7 archive, not duplicated here.
