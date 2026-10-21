# AION Track B — documentation supply chain / Context7 source inventory

**Status:** 3 Context7 raw documentation pulls archived in SOFTWARE_HQ; official vendor links mapped for all remaining core protocols. **No additional Context7 call is implied by a reference link**.  
**Canon:** [SOFTWARE_HQ context7/README](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/README.md); raw responses and request scripts must remain there, not duplicated as invented vendor documentation in AION.  
**Reproducible call manifest:** [SOFTWARE_HQ AION Track B bootstrap](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/AION-TRACK-B-BOOTSTRAP-2026-10-19.md).

## 1. Context7 actual pulls (completed)

| Vendor/runtime | Context7 library ID | Exact archived response | Findings used |
|---|---|---|---|
| Chrome MV3 / extension native messaging | `/websites/developer_chrome_extensions` | [Chrome raw JSON](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/raw/2026-10-19T18-26-46-706Z-aion-track-b-chrome-native-messaging-mv3.json) | extension-initiated `connectNative`, Port `onMessage/onDisconnect`, Chrome storage rehydrate |
| Node v22 Windows net/IPC | `/websites/nodejs_latest-v22_x_api` | [Node 22 raw JSON](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/raw/2026-10-19T18-26-50-349Z-aion-track-b-node22-windows-pipe-ipc.json) | `net.createServer`, Windows pipe path, connection errors/framing/backpressure |
| OpenCode source SDK/HTTP/events | `/anomalyco/opencode` | [OpenCode raw JSON](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/raw/2026-10-19T18-26-53-522Z-aion-track-b-opencode-sdk-events-sessions.json) | `createOpencodeClient`, session APIs, SSE event subscription |

**C7 correction:** Official OpenCode SDK install command is `npm install @opencode-ai/sdk`, not the `@opencode/client` package claimed in a previous draft. See official [OpenCode SDK](https://opencode.ai/docs/sdk/). The current installed OpenCode service version must be detected, and each API must be verified rather than assumed from latest docs.

## 2. Remaining necessary official documentation (link-verified; not additional Context7 pulls)

| Priority | Contract | Primary official source | Design gate |
|---|---|---|---|
| P0 | MV3 worker lifecycle/suspend/restart | https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle | B2, B4 |
| P0 | Native messaging registration, framing and origin | https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging | B2 |
| P0 | Extension pages / content script Ports | https://developer.chrome.com/docs/extensions/develop/concepts/messaging | B2 |
| P0 | Chrome runtime permission and methods | https://developer.chrome.com/docs/extensions/reference/api/runtime | B2 |
| P0 | Node.js v22 IPC streams | https://nodejs.org/docs/latest-v22.x/api/net.html | B1 |
| P0 | Microsoft Windows named-pipe security | https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights | B1 |
| P0 | Microsoft CreateNamedPipe security attrs | https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createnamedpipea | B1 |
| P0 | Existing AION Bus contract | `../../extension/src/bus/` + `../../bus/README.md` | B1, B4 |
| P0 | Existing AION task and observer store | `../../extension/src/lib/chatgpt-tasks.js`, `../../extension/src/background/chatgpt-port.js` | B2–B4 |
| P1 | OpenCode versioned JS SDK | https://opencode.ai/docs/sdk/ | B5 |
| P1 | OpenCode server APIs, auth, SSE | https://opencode.ai/docs/server/ | B5 |
| P1 | OpenCode ACP bridge | https://opencode.ai/docs/acp/ | B5 |
| P1 | ACP standard specification | https://agentclientprotocol.com/get-started/introduction | B5 |
| P1 | MCP protocol and SDKs | https://modelcontextprotocol.io/docs/sdk | B6 |
| P1 | MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | B6 |
| P1 | WinApp CLI UI Automation | https://github.com/microsoft/winappCli/blob/main/docs/ui-automation.md | B5 |
| P2 | Rust agent-browser installation/Windows | https://github.com/vercel-labs/agent-browser/blob/main/docs/src/app/installation/page.mdx | experimental |
| P2 | Rust agent-browser commands/snapshots | https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/references/commands.md | experimental |
| P2 | Chrome DevTools Protocol domains | https://chromedevtools.github.io/devtools-protocol/ | experimental |
| P2 | Chrome 136 debugging user-data-dir restriction | https://developer.chrome.com/blog/remote-debugging-port | experimental |
| P2 | Browser Use direct-CDP and dependencies | https://github.com/browser-use/browser-use/blob/main/pyproject.toml | experimental |
| P2 | WebMCP experimental site tooling | https://developer.chrome.com/docs/ai/webmcp | experimental |

**Vendor facts checked 2026-10-19:**
- WinApp CLI `ui inspect/search/invoke` supports semantic UIA actions and JSON; test exact control names and HWND on the actual PC before trusting them. A non-unique selector should refuse rather than click first candidate.
- Agent-browser upstream current `package.json` reports `node >=24` for npm launcher. Native Rust daemon can run separately, but do not force upgrading the core user's Node22. Pin tested Windows binary/dependency versions before optional activation.
- Chrome native messaging host-to-browser max message length is 1MiB, and browser/worker Ports are not proof of actual ChatGPT Send.
- Window IPC pipe default ACL is insufficient by itself for user-only command execution; design explicit SID DACL and perform a denial test.
- Browser Use's direct-CDP shift and agent-browser's Rust mode do not authorize installing tools without auditing exact versions for prohibited Playwright/Puppeteer/Orca dependencies.

## 3. Pull and update discipline

1. Use the existing SOFTWARE_HQ `context7/context7-pull.mjs` contract for **every further Context7 query**; record exact `libraryId`, `query`, verbatim returned `response`, source URL and retrieval time in `context7/raw/`, and index it.
2. Save the exact request script/intent under `context7/research/`; no one-off uncited research.
3. For missing Context7 library coverage, preserve an official upstream documentation link and explicitly mark `OFFICIAL_DOC_ONLY`, as done above. Never claim it is a Context7 pull.
4. Pin exact vendor package/Windows runtime versions at build time; vendor documentation may describe APIs newer than the installed version.
5. Before implementing a published contract, cross-check the actual source imported in the branch and the existing test suite.
6. Do not commit API credentials, tokens, browser data, local username/path secrets or full session transcripts to either repository.
7. In AION PR#33 each contract decision should reference an archived Context7 pull or exact upstream link. Update this index when implementation exposes a new dependency.

**Coverage truth:** This pass archived the **three most critical Context7 pulls**. Additional source topics are official docs in the table and have not all been individually pulled via Context7. This is a documented coverage boundary, not a claim of exhaustive Context7 ingestion. Future implementation can request more pulls into the canonical folder.
