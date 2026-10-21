# TOOLSMITH Skills — Discoverable Runbooks

**2026-10-21 first-pass capability ownership:** Reuse this library's nine existing skills; adapt the Chrome relay skill to the actual I1 blocker rather than create a duplicate registration skill. The shared [Master Skills Builder](../../../../../../.opencode/skills/aion-skill-builder/SKILL.md) owns portable validation/audit conventions; [root OpenCode V2 config](../../../../../../opencode.jsonc) lists all twelve role source roots, but this is **configuration in GitHub, not proof of the installed OpenCode/ZCode harness loading skills**. The read-only triage helper has six passing isolated Node 22 fixture tests (not Windows/Chrome execution). Other roles' skills and existing MCP/Bus surfaces remain separate authoritative owners.

> **2026-10-19 CURRENT PLUGINS RESEARCH:** [SOFTWARE_HQ ChatGPT custom plugins / MCP / skills / events study](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/2026-10-19-chatgpt-custom-plugins-mcp-aion.md). Current OpenAI Help explicitly names Business/Enterprise/Edu for custom MCP connections and write actions on web; older Pro read/fetch wording is **not confirmed by the current article**. Account entitlement and UI must be observed; no Windows tunnel/ChatGPT plugin connection or MCP Events subscription is claimed. Existing `aion-mcp` is the reuse target; a skills-only package can support onboarding without MCP access.

All skills are repository-owned instructions (not automatically installed tools). Each folder has a SKILL.md that a ChatGPT role or OpenCode/ZCode executor can load for matching tasks. A skill is NOT proof the corresponding tool is installed.

| Skill | Use when | Artifact |
|---|---|---|
| [chatgpt-bus-v1-v2](./chatgpt-bus-v1-v2/SKILL.md) | Building a generalizable ChatGPT commander bus V1 + Windows/local executors V2, with ChatGPT.com as pilot | [Opus 5.5 build brief](../research/OPUS-5.5-V1-V2-BUILD-BRIEF.md) + [source pack](../research/CHATGPT-GENERAL-BUS-V1-V2-SOURCE-PACK-2026-10-19.md) + tests and host handoff |
| [tool-discovery](./tool-discovery/SKILL.md) | Identifying installed tools, ownership, versions and capability gaps | Qualified tool-inventory record |
| [environment-bootstrap](./environment-bootstrap/SKILL.md) | Preparing Windows/Linux runtimes and reproducible setups | Authorized install/test/rollback plan + receipt |
| [acp-interop](./acp-interop/SKILL.md) | Connecting UAH to OpenCode/ZCode or evaluating ACP protocols | Capability matrix and safe handshake |
| [chrome-acp-relay](./chrome-acp-relay/SKILL.md) | Diagnose Chrome MV3/native-host registration and exact-thread relay; includes [read-only triage script](./chrome-acp-relay/scripts/registration-triage.mjs) and [6 fixture tests](./chrome-acp-relay/scripts/registration-triage.test.mjs) | Source-published, isolated Node tests pass; **Windows harness/runtime unverified** |
| [verification-proof](./verification-proof/SKILL.md) | Evaluating a delivery, source hashes, negative tests and receipts | Independent VERIFIED/REJECTED decision |
| [context7-harvest](./context7-harvest/SKILL.md) | Researching current tool documentation for compatibility | Source-indexed docs in SOFTWARE_HQ |
| [incident-recovery](./incident-recovery/SKILL.md) | Recovering from broken hosts/transports, fallbacks and retries | Diagnostic and reversible runbook |
| [model-capability-routing](./model-capability-routing/SKILL.md) | Choosing economical capable OpenCode/ZCode model routes | Measured compatibility and cost table |

## Skill discipline

- On **every future SITREP**, compare this library and the shared builder against CANON, Immediate, current Development evidence, actual failures and nearby agent skills; improve only when a real missing capability, incompatibility or repeated correction is evidenced. No new skill quota or maintenance churn.
- **Evidence ladder:** SKILL.md committed ≠ OpenCode V2 skill advertised ≠ Node tool on Windows available ≠ action field-proven. ZCode needs separately verified import/enable; do not declare a skill installed from its GitHub path.
- Open BOOTSTRAP.md and AGENTS.md first.
- Read only the applicable skill and the real project's current contract; avoid stuffing irrelevant documentation into a worker prompt.
- Treat install commands as proposals unless approved and executors actually run them.
- Write current observed versions, target host, proof links, negative case and rollback.
- Update skills only when new field evidence or official protocol changes justify it.
- No broad automatic transcripting, unsafe browser injection, secret copying, or pretending tabs equal active ChatGPT model work.

## Shared objective
One problem → select skill → verify environment → run authorized implementation through OpenCode/ZCode → test → evidence → feed reusable finding back into relevant skill.


> **OpenCode 2.0 update (2026-10-19):** [Context7 contracts addendum in SOFTWARE_HQ](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/2026-10-19-opencode-v2-aion-contract-addendum.md), [existing AION OpenCode V2 dossier](../../../../ops/opencode-2/README.md). Context7 library `/websites/opencode_ai_v2`. Special attention: **V1→V2 incompatible server/client and plugin APIs**, V2 `@opencode/client` session create/prompt, `GET /api/event` SSE that **does not guarantee event replay**, `Plugin.define` domain hooks, and separate `opencode acp` session scope. Prior Windows v2.0.32 report is source evidence, not an observation made by this research session.

## Protocol reference pack — 2026-10-19 research (Windows M1)

**Review outcome:** The eight skills already cover discovery, bootstrap, ACP interoperability, Chrome relay, verification, Context7 harvesting, recovery and routing. Do not create four duplicate skills just to index four protocols. Add specialized references/test recipes within the existing skill matched to the task.

| Topic / existing skill | Authoritative documentation | Immediate AION use |
|---|---|---|
| **ACP → `acp-interop`** | [ACP protocol](https://agentclientprotocol.com/); [official ACP TypeScript SDK](https://agentclientprotocol.github.io/typescript-sdk/) ; Context7 `/agentclientprotocol/agent-client-protocol` | Verify v1 `initialize`, capabilities, `session/new`, `session/prompt`, `session/update`, cancellation; negotiate before use. **ACP v2 remains draft/experimental** according to SDK docs; do not silently switch dialect. |
| **MCP → `acp-interop` + `context7-harvest`** | [MCP TS SDK](https://github.com/modelcontextprotocol/typescript-sdk), Context7 `/modelcontextprotocol/typescript-sdk`; [existing AION read-only MCP pilot](../../../../ops/aion-mcp/README.md) | Inspect local `ops/aion-mcp` before creating another MCP server. Its read-only `aion_state`, `aion_receipts`, `aion_verify_challenge` are reported tested only in isolated Linux; no Windows/ChatGPT connection verified. SDK has v1→v2 packaging changes, pin exact installed API. **MCP tools are not ACP agent sessions**. |
| **Chrome MV3 → `chrome-acp-relay`** | [official Chrome Extensions docs](https://developer.chrome.com/docs/extensions/); [native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging); [MV3 service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle); Context7 `/websites/developer_chrome_extensions` | Review existing ACPX before writing a new extension; Windows native-host registration under HKCU; `allowed_origins` pins extension ID; `nativeMessaging` permission; content-script → service-worker → native-host hop; handle worker shutdown and reconnect. |
| **CDP → `chrome-acp-relay` / `tool-discovery`** | [official Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/); [protocol domains](https://chromedevtools.github.io/devtools-protocol/tot/) | Pin against running Chrome via `/json/version` and `/json/protocol`, discover actual websocket target, explicitly handle detach/multiple clients. Compare CDP vs ACPX extension in Windows. No Playwright/Puppeteer. |
| **Git / Windows bootstrap → `environment-bootstrap`** | [AION root AGENTS.md](../../../../../../AGENTS.md), Windows-master canon | Validate clone/scheduler/sync locally; skills don't imply installation; avoid a second auto-push loop. |

**High-priority additions within existing skills (not separate platforms):**
1. CDP Windows read-only discovery and target/detach smoke recipe; compare with MV3 native-messaging behavior.
2. MCP SDK version migration + stdio framing and stderr-only diagnostics; adapt to existing `ops/aion-mcp` pilot.
3. ACP v1 vs experimental v2 feature detection/handshake and ACP↔MCP boundary conformance cases.
4. A shared `protocol-conformance` test matrix: transport ACK ≠ executor acceptance ≠ model reply ≠ AION consumed, with replay, streaming, lifecycle/reconnect and wrong-target negatives.

**Context7 provenance:** Retrieved on 2026-10-19 in an authorized connected Context7 session via `resolve_library_id` + `query_docs`; library IDs and topic queries are the reproducible retrieval pointers. These are **index findings only**, not raw Context7 corpus saved into SOFTWARE_HQ, and not proof of Windows runtime compatibility. The standing `context7-harvest` SKILL requires depositing full permissible pulls and request metadata in the confirmed SOFTWARE_HQ path before marking HARVEST_PERSISTED. Do not invent that path or claim push there.

**Reusable retrieval queries:**
- Chrome: `Manifest V3 native messaging Windows registry host manifest connectNative service worker lifecycle chrome.debugger CDP target attachment permissions`
- MCP: `Create minimal MCP server tools and resources over stdio with MCP TypeScript SDK; versioned examples`
- ACP: `ACP JSON-RPC stdio initialize protocolVersion clientCapabilities agentCapabilities session/new session/prompt session/update cancellation`

## Shared skills builder (OpenCode V2)

This existing Toolsmith library remains the canonical owner of its current skills. Toolsmith also stewards the [shared AION builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md) and helps others connect verified skills to their actual harness. Audit older runbooks for V2 discoverability and reuse rather than recreating them. The first pass should prioritize real recurring gaps, not a numerical quota.
