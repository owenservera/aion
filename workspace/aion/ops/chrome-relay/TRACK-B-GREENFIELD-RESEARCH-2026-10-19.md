# AION Track B — Greenfield research: fastest unified Windows/browser/agent control

**Research date:** 2026-10-19 (Europe/Madrid). **Disposition:** research and recommendation, NOT deployed. **Owner task:** [Track B #32](https://github.com/owenservera/aion/issues/32), **parallel evidence track:** [Track A #31](https://github.com/owenservera/aion/issues/31). **Existing architecture:** [DUAL-TRACK-COMMAND-PLANE-2026-10-19.md](./DUAL-TRACK-COMMAND-PLANE-2026-10-19.md).

## 0. Executive verdict / correction to first draft

**Recommend a staged, native-first, extension-first, thin-controller architecture, not a greenfield reimplementation of browser automation, transport, or OpenCode.**

1. Use **existing AION bus contracts/ledger/no-resend** as the operation authority. First bridge its split Node/extension state; do not build a separate command bus.
2. Use **Chrome MV3 content scripts + `runtime.connectNative`** as primary path to the *already signed-in* ChatGPT Chrome conversation. Preserve user profile and target identity; do not enable unrestricted CDP on the real profile.
3. Use **OpenCode's built-in SDK/server event API** for the local coding agent, with **Agent Client Protocol (ACP)** as interchangeable executor protocol where appropriate. Don't write another agent process manager just to reproduce OpenCode session APIs.
4. Use **Windows UI Automation** (existing proven `InvokePattern` path; evaluate Microsoft's `winapp ui`) as the local desktop adapter.
5. Use **MCP** to expose the same typed AION tools to outside agents, not as the durability/dispatch protocol between native host and extension.
6. Support **direct CDP + Browser Use** as separately permissioned, dev-profile/browser-agent action adapters for unknown websites and complex navigation. Use deterministic one-click DOM/extension operations for routine ChatGPT sends.
7. Support **computer-use models** via developer-supplied screenshot/action drivers for ambiguous visual interactions, not the hot path for one command.
8. **WebMCP** is an exciting progressive enhancement for sites AION controls (e.g. future VIVIM apps), and opportunistic tool discovery elsewhere, not a dependency on chatgpt.com.

The user's standing technical exclusion remains: **no Playwright, Puppeteer or Orca**, in production, testing, or selected tools. Browser Use migrated from Playwright to raw CDP and its inspected Python dependency file lists `cdp-use` and `browser-harness`, *not* Playwright. Still audit exact locked version and transitive dependencies before adoption. Stagehand's present implementation/dependency graph is version-sensitive and must be audited before any use. Google Chrome DevTools MCP's current inspected package manifests `puppeteer` and is excluded as-is. Do not confuse Chrome DevTools MCP with the CDP protocol itself.

## 1. Research corpus and findings (primary sources)

| Surface | Evidence | Implication |
|---|---|---|
| **Agent Client Protocol** | https://agentclientprotocol.com/get-started/introduction | Local coding agents connect over JSON-RPC/stdio; remote transport work continues. Use as client-agent protocol, NOT browser-computer protocol. Acronym ACP is overloaded; avoid the unrelated Agent Control Protocol. |
| **OpenCode server** | https://opencode.ai/docs/server/ | `opencode serve` exposes an OpenAPI server, sessions, event streams and TUI control. Default host `127.0.0.1`; protect with `OPENCODE_SERVER_PASSWORD`. |
| **OpenCode SDK** | https://opencode.ai/docs/sdk/ | Typed JavaScript SDK; `event.subscribe()` gives SSE events. Reuse instead of replicating local OpenCode state. Version-pin actual installed 2.0.x and probe functionality. |
| **OpenCode v2 API** | https://opencode.ai/v2/docs/api/ | Experimental server API includes session, model/provider, permission, shell, PTY, events, MCP, filesystem; feature-detect, don't assume compatibility with previous API. |
| **MCP transport** | https://modelcontextprotocol.io/specification/2025-11-25/basic/transports | stdio and Streamable HTTP, JSON-RPC. For local agent consumption prefer stdio; remote requires origin validation/auth. Watch 2026 draft transport changes separately. |
| **Chrome MV3 lifecycle** | https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle | Native Messaging ports extend worker lifetime, but crashes/closures still occur. Rehydrate operations; do not store authoritative state in worker globals. |
| **Chrome Native Messaging** | https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging | Existing host origin-pinning + framed JSON is correct. Host->Chrome response limit 1 MiB. Do not replace with localhost web listener exposed to web pages. |
| **Chrome extension debugger API** | https://developer.chrome.com/docs/extensions/reference/api/debugger | Can drive selected CDP domains, but requires powerful `debugger` permission. Add only to optional dev build, not baseline stable extension. |
| **CDP** | https://chromedevtools.github.io/devtools-protocol/ | Browser protocol for targets/DOM/Accessibility/Runtime/Input/Network. A tool transport, not authorization or idempotency. |
| **Chrome 136 debugging hardening** | https://developer.chrome.com/blog/remote-debugging-port | Remote debugging of default Chrome data directory is blocked. Use nonstandard dedicated user-data-dir / Chrome for Testing if CDP is necessary. |
| **Browser Use's raw CDP migration** | https://browser-use.com/posts/playwright-to-cdp and https://raw.githubusercontent.com/browser-use/browser-use/main/pyproject.toml | Browser Use moved to direct CDP; pyproject examined at version 0.13.13 with `cdp-use==1.4.5`, `browser-harness==0.1.13` (snapshot, recheck at lock). Candidate for high-level browser tasks without Playwright. |
| **Browser Use CLI/library/cloud** | https://github.com/browser-use/browser-use | Can drive local or remote browser with an agent; do not put LLM-driven navigator on the hot path for fixed ChatGPT send. |
| **Microsoft winapp UI CLI** | https://github.com/microsoft/winappCli/blob/main/docs/ui-automation.md | `winapp ui status/inspect/search/get-property/invoke/wait-for/screenshot`, selectable by window handle and UIA ID. Benchmark versus existing native UIA from 2026-10-19 receipt. |
| **OpenAI computer-use guide** | https://developers.openai.com/api/docs/guides/tools-computer-use | Developer-supplied driver can control screenshots/mouse/keyboard, browser toolset can expose selected actions. Local desktop requires an explicit locally running driver; this ChatGPT chat is not itself a persistent PC agent. |
| **OpenAI hosted computer use** | https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use | Hosted browser is a separate environment, not the user's existing signed-in Windows Chrome profile. Use when portable, not for exact local session continuity. |
| **WebMCP October 2026** | https://developer.chrome.com/docs/ai/webmcp | Proposed browser standard; Chrome 149+ origin trial/local flag, tool discovery and action schemas, websites must cooperate. Useful for AION/VIVIM-owned apps; may not exist on third-party pages. |
| **Chrome DevTools MCP package** | https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/package.json | Current inspected package declares Puppeteer. Not admissible under owner exclusion. Can implement direct CDP tooling behind AION's own MCP façade. |
| **Stagehand version sensitivity** | https://github.com/browserbase/stagehand and https://github.com/browserbase/stagehand/issues/1463 | Current versions emphasize native browser/control features but past v3 had required Playwright dependency. Audit current exact package tree before use. No blanket approval. |

## 2. Technology landscape: distinguish transport, control and intelligence

| Tool/protocol | Kind | Execution target | Latency/complexity expectation | Adopt |
|---|---|---|---|---|
| ACP (Agent **Client** Protocol) | agent-client wire protocol | coding agents, editor-style sessions | Low per-call overhead; agents still take model time | **Yes**, OpenCode ACP adapter |
| OpenCode SDK/HTTP SSE | native application API | installed OpenCode service | Best way to observe existing sessions/events | **Yes**, primary for OpenCode |
| MCP stdio / Streamable HTTP | tool discovery/invocation interface | AI agents and available tools | Extra tool boundary; no automatic browser authority | **Yes**, AION tools outside |
| MV3 content script + `tabs.connect` | deterministic browser action | verified chatgpt.com tab | Minimal conceptual hot-path overhead | **Yes**, primary ChatGPT |
| Native Messaging | extension<->native control transport | Chrome + Windows native host | Small framed IPC; persistent port; restart-aware | **Yes**, reuse existing |
| Windows UIA + winapp CLI | native UI interaction | visible, interactive Windows desktop | Variable tree lookup; direct semantic control | **Yes**, source-backed fallback |
| Direct CDP websocket | browser debug protocol | dedicated Chromium target | Fast inspection, richer access, profile constraints | **Selective**, separate dev browser |
| `chrome.debugger` CDP | extension debug permission | user's tab via extension | Rich but intrusive permission, state conflicts | **Dev diagnostics only**, never silent |
| Browser Use (new direct-CDP) | AI browser agent framework | website navigation | LLM-driven variable latency/token usage | **Pilot**, complex unknown tasks |
| Computer Use toolsets | model + driver control loop | browser/desktop runtime supplied by host | Highest flexibility, many observation/action steps | **Fallback**, not default |
| WebMCP | website-published tools | cooperating web app | Can avoid DOM search if present | **Experimental** |
| Chrome DevTools MCP package | existing MCP server | Chromium debugger | Current Puppeteer dependency | **Excluded as-is** |
| Stagehand | semantic browser framework | web UI | May be valuable; dependency tree/version sensitive | **Audit only** |
| Playwright, Puppeteer, Orca | excluded framework family | various | Owner ban | **Never** unless owner reverses |

A service that says `browser.ready` is not equivalent to `chatgpt.submit.ready`. Likewise `OpenCode API reachable` does not imply a specific provider key/model/quota is available; `UIA tree readable` does not imply the desktop's target control is enabled.

## 3. Proposal: best-of-breed adapter ladder

**Choose highest-fidelity deterministic adapter capable of the requested action; never treat alternative delivery routes as permission for an automatic resend.**

1. **Application/agent native API**: OpenCode SDK/HTTP, shell/Git, explicit authorized tool API, locally available MCP tools.
2. **Cooperating website structured tool**: WebMCP *only if actually exposed and action-authorized*, and only within its origin.
3. **Chrome MV3 content-script action**: explicitly bound signed-in conversation, durable task store, page observer, exact send once, correlation check.
4. **Windows UI Automation**: existing native UIA or `winapp ui`, with pinned HWND/element identity; same operation/target, only if alternate route was positively NOT_SENT.
5. **Direct CDP**: experimental or specialized browser tasks in separate Chrome for Testing / explicitly isolated user-data-dir. Do not debug default live profile; no Playwright/Puppeteer helper.
6. **Browser Use**: model-led complex navigation over verified direct CDP version; own designated profile, model budget, action transcript, cap on steps. Prefer for research workflows, not one prompt.
7. **Computer Use**: visual interpretation with bounded step budget and explicit driver, for controls not exposed semantically. Observe results, never infer submission from a click.

This is a *capability router*, not an uncontrolled chain of fallbacks. If an operation is `UNKNOWN` / `possibly_submitted`, all action adapters are barred from retrying; observation-only reconciliation must settle it.

## 4. Architecture decision: delay heavyweight AIOND

The current architecture proposes a persistent per-user Windows `aiond` as the single controller. The greenfield research recommends **implement a THIN command broker first**, progressively promoting it to long-lived service if concurrent clients and event streams justify it.

**Slice 0:** make the existing `aion-bus.mjs` CLI capable of issuing a command through an existing verified browser extension host boundary. A proxy forwards to a *single* authoritative bus store; there must not be two writers or unrelated file/chrome ledgers. `aion status` is a local operation, not a fresh model call.

**Slice 1:** explicit one-command `aion send chief "..." ` resolves role alias, exact bound conversation, host/worker and action readiness, approval/grant, idempotency key and unique reply marker; admit once and print operation ID. A background local process performs the actual previously admitted request and emits native host/extension observation events. No desktop UI driver is needed for the initial proven browser-native send.

**Slice 2:** add Windows interactive UIA and OpenCode typed SDK adapters under same operation/grant, not separate scripts. Add `aion doctor`, `aion capabilities --live`, `aion observe --follow` and `aion activate` as thin clients.

**Slice 3:** if multiple clients demand push subscriptions, promote the broker to logon-started, per-user, long-lived `aiond` with user-SID-restricted named pipe and a durable single-writer store. Start with existing file-state backend only if its ownership and atomicity remain sound; adopt SQLite WAL after comparative crash-matrix tests, not on day one.

**Slice 4:** optional direct CDP/browser-agent and WebMCP modules, isolated profiles, budgeted model tooling. No success promotion to Track A until it independently verifies a real negative and positive case on exact build.

**Why this reduces work:** OpenCode owns OpenCode sessions, Chrome owns browser identities, Windows UIA owns desktop semantics, MCP exposes tools, and AION only owns **cross-surface identity, permissions, observed capabilities, idempotent execution, receipts and operator UX**.

## 5. Capability inventory and real-time action readiness

Schema (illustrative, not existing software):
```json
{
  "schema": "aion.action-readiness/1",
  "target": "chatgpt:chief",
  "binding": {
    "source": "confirmed",
    "revision": "rev-17",
    "profile": "stable-or-dev",
    "conversation": "verified-conversation-ref"
  },
  "observed_at": "2026-10-19T17:05:00Z",
  "ttl_ms": 1500,
  "transport": "native-host-connected",
  "capabilities": {
    "read": "READY",
    "compose": "READY",
    "submit": "UNVERIFIED",
    "observe": "READY"
  },
  "blockers": ["extension-submit-not-proven"],
  "authz": "GRANT_REQUIRED",
  "source_evidence": ["real chrome port", "real page observer"]
}
```

Follow signals for tab attachment, port/native-host events, chrome activation, UIA window events, OpenCode server event subscription, process exit, and tool registry changes. Use debounced health probes and short TTL, but never automatic command dispatch from a mere availability change. Differentiate `INSTALLED`, `REACHABLE`, `TARGET_BOUND`, `ACTION_READY`, `AUTHORIZED`, `BUSY`, `STALE`, `UNKNOWN`, `FAILED`.

Never claim models are available based solely on OpenCode's catalog; detect real enabled providers, plan/model limits as far as observable and classify `QUOTA_UNKNOWN` where necessary.

## 6. CLI UX contract (design only)

```powershell
aion send chief "Review the latest AION integration"
aion send opencode "Run targeted extension tests" --repo aion --model auto
aion status --json
aion capabilities --live
aion observe <operation-id> --follow
aion doctor --json
aion activate --channel dev
aion windows inspect chrome
aion windows invoke --target <confirmed-target> --operation <operation-id>
```

`send` contract:
1. Resolve alias + previously confirmed binding + cwd/project/model/runtime policy **without guessing**.
2. Resolve actionable capability, same target and recorded grant. A missing grant or ambiguous target is a precise refusal, not silent approval.
3. Atomically reserve intent in **one** durable store; generate idempotency key, correlation, token, operation ID internally.
4. Dispatch at most once; keep `DISPATCHED` separate from `SUBMISSION_OBSERVED` and `REPLY_CHECKED`.
5. Return ID immediately; optionally subscribe until reply with `--wait`. CLI exit shouldn't imply model completion.
6. Reconcile only by reading UI/observer/ledger, never by resending after uncertainty.

Selection precedence: explicit flags > active confirmed session context > stored user defaults > refusal. Never send into merely foreground Chrome tab by assumption. Preserve ordinary human drafts.

## 7. Greenfield alternatives compared

| Candidate architecture | Benefits | Weaknesses | Verdict |
|---|---|---|---|
| **Pure Chrome extension as authoritative core** | Fastest simple browser MVP; no resident daemon | Awkward for Windows native/OpenCode+CLI multi-client, MV3 lifecycle | Good for first spike; insufficient eventual single control pane |
| **Thin Windows broker + existing bus + extension native host** | Reuses all proven work; local, event-driven, incremental; browser-native and Windows | Need one-state ownership and durable host connection | **Winner for Track B** |
| **Always-running heavyweight desktop daemon first** | Central subscriptions, process supervision, durable event stream | High upfront build/test/deployment burden | Promote later based on measured need |
| **Pure raw CDP browser controller** | Generic DOM/debug control, rich introspection | Cannot attach default Chrome profile with debugging switch; auth/profile friction, broad debugging | Only separate dev/profile tasks |
| **Browser Use/CDP as central agent** | Flexible unknown sites | LLM latency and higher risk of ambiguous sends, not necessary for known ChatGPT UI | Separate plugin |
| **Computer Use screenshots as central engine** | Covers arbitrary desktop surfaces | Slow/brittle for deterministic operations, expensive context cycles | Last-mile fallback |
| **MCP as the single queue/operation bus** | Tool interoperability | No native once-only/durable cross-surface semantics | MCP-facing interface only |

## 8. Exact rapid bake-off on Windows (no Playwright/Puppeteer/Orca)

Run on a **separate dev channel and Chrome profile**, never alter stable pinned `kgjfielmhcdlggjppmliabpiljnonhki` or its host. Do not install tools merely to perform research.

**B0 — dependency/feasibility preflight:** inspect currently installed Node 22/Bun, Chrome, PowerShell 7, OpenCode binary/service, current pinned extension, UIA; inspect `uv` and browser-use package if available; determine Stagehand exact dependencies if considered; build allow/deny matrix.

**B1 — latency microbenchmarks** (minimum 30 warm iterations each, emit raw JSONL sample and p50/p95):
- CLI parse + local status (no model call);
- `runtime.connectNative` ping/host roundtrip, connected port vs process-per-call;
- extension tab port ping + read-only composer/state;
- OpenCode SDK `event.subscribe` and one read-only session/status;
- `winapp ui inspect` and cached-target `get-property` against real Chrome HWND;
- optional direct CDP `Runtime.evaluate`/Accessibility query in dev Chrome for Testing.

**B2 — one-command vertical slice:** one authorized `aion send` into pre-bound dev ChatGPT conversation with real send-button event, correlated reply, unique operation receipt. Stage response timeout separately from local admission. Reproduce existing extension failure honestly if still present.

**B3 — reliability evidence** (no destructive live repeats): blocked draft, wrong tab, ambiguous session, UIA stale HWND, MV3 restart, native-host disconnect, command crash before/after durable dispatch, old reservation quarantine. Assert no duplicate send.

**B4 — intelligent browser plugin pilot:** one multi-step, non-sensitive website navigation through direct CDP and Browser Use on an isolated testing browser, with token/time/step budgets. Compare native deterministic path where same task can be expressed as fixed selectors. No account/credential export.

**B5 — integration acceptance:** same CLI operations via shell, side pane and MCP consumer must use same operation IDs and state projections. Track A signs off exact source/real test evidence.

**Measured metrics, not assumptions:** command admission p50/p95; cold vs warm initialization; event propagation freshness; active RAM/CPU when idle; number of owner interactions; successful operations; duplicate-send count (must be zero); stale/wrong-target refusal; recovery accuracy; browser version sensitivity; model token use for agentic fallback.

**Suggested targets, explicitly unmeasured:** warm read-only status p95 ≤150ms; admitted operation ID p95 ≤250ms; observed-action capability under 2s stale or `UNKNOWN`; one external CLI command per ordinary task; model response time reported separately.

## 9. Specific OpenCode and Windows engineering cautions

- Existing AION snapshot verified real OpenCode 1.19.3 ACP and 2.0.32 service conformance on 2026-10-19, but prompt execution without provider authorization did **not** succeed. No fake `READY` for unauthenticated models.
- Inspect **installed version's** exact OpenAPI (v1/v2 differ materially). The contemporary OpenCode v2 HTTP API is marked experimental; API route names and auth differ.
- ACP sessions and OpenCode HTTP sessions have different semantics and durability. One operation route must not silently fall back to an alternate execution mode without confirmed target/session identity.
- MV3 runtime.connectNative can extend worker lifetime but must not be treated as guaranteed; crash/restart recovery remains mandatory. No Chrome service worker busy loop.
- Chrome 136 debugging hardening means a live default profile is **not** a raw-CDP automation entry point. A direct CDP test profile may lack the real signed-in session; do not copy Chrome cookies or encryption state.
- `winapp ui` can use HWND selectors and `InvokePattern`, but window/control presence must be revalidated before mutation. Interaction requires an unlocked interactive desktop; do not assume a background Windows service can see it.
- Differentiate **computer-use API/driver**, **Browser Use framework**, **CDP browser protocol**, **WebMCP website tools**, **MCP agent tool protocol**, **ACP coding-agent protocol**, and AION's own command bus in docs and names.

## 10. Executive implementation handoff

Track B #32 should be reordered into four build steps:
- **B0:** exact tool/dependency audit and one-store seam map, no source replacement.
- **B1:** one `aion` binary/Node entrypoint + named target binding + status/doctor, exposing existing core + native host rather than a new server.
- **B2:** browser-native send/observe to verified conversation with one durable operation; the hot path works before any UIA/CDP/computer-use sophistication.
- **B3:** add Windows UIA and OpenCode SDK, capability subscriptions, unified pane + activation suite. Then evaluate Browser Use/CDP for generic websites, WebMCP for cooperating apps and computer use for visual edge cases.

Do not let optional frameworks and model routing delay the first single-command proof. Track A #31 retains frozen baseline and independent acceptance responsibilities.

**Publication statement:** this is a research document and work recommendation. No Windows commands, Chrome automation, tool installation or source modifications were executed as part of this research.
