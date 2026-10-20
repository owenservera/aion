# External multi-provider implementation coverage vs AION command space

**As-of:** 2026-10-20. **Evidence category:** static source inspection and upstream repository documentation, **NOT authenticated live testing**. **Scope:** all **40** semantic operations in `aion_command_matrix.csv`, including **19 P0**. Machine-readable source: [EXTERNAL-IMPLEMENTATIONS-COVERAGE.csv](EXTERNAL-IMPLEMENTATIONS-COVERAGE.csv). The 25 route mappings per operation represent AION catalog planning, not 25 implemented project capabilities.

## Executive decision

**First donor to audit: Multi-AI Chat** for reusable browser Send/Receive engine; **second donor: Parallel AI** for broad provider coverage, attachments, temporary-chat modes and provider-specific control mapping; **Council** is a smaller but credible live-update reference. **ChatHub** and **ChatALL** demonstrate broad front-end multi-chat workflows and local chat history, but must not be credited as provider-native conversation editing/rename/history simply because they manage their OWN app-local conversations.

The strongest **evidence-grounded full coverage** across ALL 40 catalog intents among the five external libraries is **Multi-AI Chat (10/40; 6 source-inspected + 4 documentation-reported)**. On the 19 strict P0 command intents, Multi-AI Chat and Council tie at **5** reported/inspected full operations, but Multi-AI Chat has **6 directly inspected source paths**, versus Council's README-only evidence. These are **floor-of-evidence counts, not verified current runtime capability, quality, or absolute coverage**. Unestablished operations may exist and should be source-audited by workers before marking unsupported.

## Coverage summaries

| Project | Inspected I | Reported R | Partial P | Not established · | Strict P0 full (I+R) | P0 partial |
|---|---:|---:|---:|---:|---:|---:|
| AION current | 6 | 0 | 9 | 25 | 3/19 | 6/19 |
| Multi-AI Chat | 6 | 4 | 8 | 22 | 5/19 | 6/19 |
| Parallel AI | 0 | 6 | 7 | 27 | 3/19 | 6/19 |
| ChatHub | 0 | 3 | 12 | 25 | 2/19 | 8/19 |
| ChatALL | 0 | 4 | 9 | 27 | 2/19 | 9/19 |
| Council | 0 | 6 | 3 | 31 | 5/19 | 2/19 |

**I** = implementation inspected in source (no live test); **R** = explicitly reported in repository documentation, without code audit; **P** = partial/local-only/semantic mismatch; **·** = not established in checked sources (not proof of unsupported).

**Do not conflate:** (1) local side-panel New Chat with a verified new conversation on `claude.ai`; (2) local history storage/export with reading `chatgpt.com/c/<id>` history; (3) a browser tab being detected with durable exact account+conversation binding; (4) a click/response observation with a Bus-verified no-resend result; (5) API model options with web UI account entitlements; (6) cancellation of local workflow with actual provider generation Stop.

## Every AION operation against the five upstream projects

| Semantic operation | Tier | AION | Multi-AI | Parallel | ChatHub | ChatALL | Council |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `agent.delegate` | P2 | · | R | · | · | · | · |
| `agent.status` | P2 | · | R | · | · | · | · |
| `branch.create` | P1 | · | · | · | · | · | · |
| `cancel` | P2 | P | R | · | · | · | P |
| `chat.archive` | P1 | · | · | · | · | · | · |
| `chat.create` | P0 | · | P | P | P | P | · |
| `chat.delete` | P1 | · | · | · | · | · | · |
| `chat.export` | P1 | · | · | · | P | · | · |
| `chat.open` | P0 | · | P | P | P | P | · |
| `chat.rename` | P0 | · | · | · | · | · | · |
| `chat.search` | P1 | · | · | · | · | · | · |
| `chat.share` | P1 | · | · | · | · | · | · |
| `context.inject` | P2 | · | R | R | R | R | · |
| `discover` | P2 | P | · | · | · | · | · |
| `file.attach` | P0 | · | · | R | · | · | · |
| `generation.stop` | P0 | · | I | R | · | · | · |
| `grant.manage` | P2 | I | · | · | · | · | · |
| `health` | P2 | I | I | R | · | · | R |
| `history.read` | P0 | P | P | · | P | P | · |
| `message.copy` | P1 | · | · | · | · | · | · |
| `message.edit` | P0 | · | · | · | · | · | · |
| `mode.select` | P1 | · | P | P | P | · | · |
| `model.list` | P0 | P | · | · | P | P | · |
| `model.select` | P0 | · | · | · | P | P | · |
| `observe` | P0 | I | I | P | P | P | R |
| `project.select` | P1 | · | · | · | · | · | · |
| `receipt.read` | P2 | I | · | · | · | · | · |
| `recover` | P0 | P | P | P | · | P | P |
| `reply.read` | P0 | P | I | · | R | R | R |
| `response.regenerate` | P0 | · | · | · | · | · | · |
| `result.export` | P2 | P | · | · | P | · | · |
| `send` | P0 | I | I | R | R | R | R |
| `session.bind` | P0 | I | P | P | · | · | R |
| `sessions.list` | P0 | P | P | · | P | P | P |
| `steer` | P0 | · | · | · | · | · | · |
| `stream` | P0 | P | I | P | P | P | R |
| `thinking.level.set` | P0 | · | · | · | · | · | · |
| `tool.call` | P1 | · | · | · | · | · | · |
| `tool.toggle` | P1 | · | P | R | P | R | · |
| `ui.panel` | P2 | · | · | · | · | · | · |

No external project in the reviewed sources establishes full support for the following P0 commands: **`chat.rename`, `message.edit`, `response.regenerate`, `steer`, `thinking.level.set`**. This is an **evidence gap**, not proof they cannot perform the operations. In particular `steer` means true in-flight steering, not queued follow-up or Cancel+Send.

## Provider breadth — independent from capability breadth

| Project | Webapp/provider footprint (reported) | Qualification |
|---|---|---|
| Multi-AI Chat | ChatGPT, Claude, Gemini, Grok; experimental standby Meta AI | 4 default web providers; Meta experimental and off by default; vendor states authenticated coverage incomplete |
| Parallel AI | ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, Z.ai, Xiaomi MiMo, Meta AI, Google AI/Search | 11 site entries in published README; iframe embedding fragility and provider-dependent temporary mode |
| ChatHub | ChatGPT, Claude, Gemini, Grok, DeepSeek, Qianwen, Llama and others | Web/API surfaces mixed; exact currently working site adapters unverified |
| ChatALL | Broad catalog of consumer web bots and API providers | Supported-bots table is not a live-success scoreboard; Electron desktop rather than MV3 |
| Council | ChatGPT, Claude, Gemini, Grok, Kimi | Five browser adapters reported; early-stage, README notes history/export incomplete |
| AION current | ChatGPT browser adapter pilot + distinct OpenCode/ACP integrations | Browser full live path not verified at current Track B candidate; generic provider semantics are proposed |

**Conclusion:** If optimizing **feature engine/code leverage**, first inspect Multi-AI. If optimizing **provider breadth and UI integration examples**, inspect Parallel AI and ChatHub. The best AION custom implementation may selectively reuse patterns from both while retaining exact identity, grants and effect ledger.

## Source provenance and verification level

- **Multi-AI Chat** README [master](https://github.com/TED-H-com/multi-ai-chat) and directly inspected `src/content/base.ts` **blob `44270f5dfee2eb44b69b3e273b1cb434239b844f`**, `src/content/claude.ts` `23cfca6ee1d3cea38c346fb398c52749d3cd5cff`, `src/content/gemini.ts` `b8473aa8b9ba7c0ad532d233290735466b65777a`. Code implements request handling, response extraction/observation and Stop controls; no authenticated execution performed in this audit. Link: https://github.com/TED-H-com/multi-ai-chat/blob/master/src/content/base.ts.
- **Parallel AI** [README](https://github.com/ParkerCai/parallel-ai-extension), reviewed blob `419cc4201d6a6583655524912960fe552f069238`. Provider-site list, Send fan-out, attachments, temporary mode, Stop, usage meters documented. Provider-specific content code NOT inspected in this pass. Some functions rely on undocumented usage endpoints; do not transfer private backend access.
- **ChatHub** [README](https://github.com/chathub-dev/chathub), blob `d6898a09a81d54a67e38281c5bac38302da5d7bd`. Mixed consumer web/API adapter claims, local history/export.
- **ChatALL** [README](https://github.com/ai-shifu/ChatALL), blob `9fd3f14758ae6f9e7282853fe473294dd4ba5ab4`. Large web+API bot catalog; browser reverse engineering fragility explicitly noted upstream; client-local history.
- **Council** [README](https://github.com/RaheesAhmed/Council), blob `07c4c7021c0ca0c561453fd5584b20c73167bc7b`. README describes five provider adapters, `MutationObserver` response stream, tab discovery and diagnostics, but notes history and export remain incomplete.
- **AION** current Track B `extension/src/chatgpt/content.js`, `extension/src/bus/adapters/chatgpt.js`, `velocity/src/commands.mjs`, `velocity/src/broker/core.mjs`, `velocity/src/broker/events.mjs`. Existing operation-scoped reply is not a full conversation read API. Work in PR #46 and command-space PR #51 not counted as implemented. No current candidate Windows/live Chrome claim.

## Immediate next source-level audits to improve confidence (do not inflate current score)

1. **Multi-AI Chat:** pin full repo SHA and read `src/content/base.ts`, provider adapters, request/response state, Send/Stop decisions, last-response detection, timeouts, license. Map exact IDs: `send`, `reply.read`, `observe`, `stream`, `generation.stop`, `session.bind`, `recover`.
2. **Parallel AI:** audit each actual provider `content-scripts` implementation for new chat, exact conversation binding, attachment, Stop, temporary chat, model and thinking controls; distinguish local host orchestration versus provider-native mutation. Inspect iframe assumptions and security.
3. **Council:** source-audit `MutationObserver`, provider adapter modules and stop/cancel semantics. Independent negative proof for 0/2 targets and stale messages.
4. **ChatHub/ChatALL:** assess source timestamps and product-level currency before using vendor code. Audit app-local vs provider-native semantics; don't automatically count UI setting/model choice as remote conversation model change.
5. **Workers:** add external implementation evidence and code references to each native/CDP provider's research report, but do not copy libraries' retry mechanisms into AION's no-resend effect path without reconciling semantics and license.

### No-code/unsupported caution

In this matrix **· = unknown based on what was reviewed**, not verified lack of feature. A missing checkbox should create an investigation ticket. **P** should not count toward 'fully covers AION operation.' Baseline status should be promoted only when source inspection verifies an equivalent operation on the **same provider surface and session**, not a similar feature in a side-panel client.
