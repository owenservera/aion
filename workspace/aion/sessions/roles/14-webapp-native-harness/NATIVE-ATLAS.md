# Native webapp response-shape atlas — ChatGPT vs Claude

**Seed 2026-10-24.** Three evidence columns must never be conflated: (A) AION saved-source/coded observations, (B) official product user-interface documentation, (C) provider model API reference **only as research vocabulary**. Surface capabilities may differ by account, browser, device and rollout. No row means live harness acceptance.

## A. Actual historical AION evidence
Source: [generated AI-CHAT-SHAPES.md](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/AI-CHAT-SHAPES.md), generated 2026-10-22 over existing local capture families; source-backed but not fresh live acceptance.

| Axis | ChatGPT WEB | Claude WEB |
| --- | --- | --- |
| Historical family population | 26 derived sessions, 47 streams, nine chat-looking endpoints | 11 derived sessions, 31 streams, three chat-looking endpoints |
| Observed transports | HTTP, HTTP_SSE, HTTP_STREAMED, WS, UNKNOWN | HTTP, HTTP_STREAMED, EVENT_SOURCE in family metadata |
| Interesting stream | `/backend-api/f/conversation` path-ops/events | `/claudeai-rpc/anthropic.bard.api.v1alpha.ConversationService/StreamTimeline` |
| History/identity leads | `/backend-api/conversations/{id}` contains message records, author roles, channels, content parts, references, metadata. Supported exact-thread URL parser `/c/<uuid>` | `/api/organizations/{id}/chat_conversations_v2` contains latest assistant status and `current_leaf_message_uuid`; durable browser thread recognition NOT integrated |
| Reply reconstruction | ChatGPT `chatgpt-path-ops` map recognized 28 historical streams; previous unmapped events reduced in separate survey; original DOM old-extractor join 0/60 | Connect/proto wire decoder exists; observed candidate string field `1.1.5.9` **hypothesis** from small repetitive sample; no confirmed live full reply parse |
| DOM page binding | `src/capture/conversation-thread.mjs` ChatGPT-only exact `chatgpt-c:<uuid>`; page message `data-message-id` | `src/profiles/sites/claude.mjs` selectors and auth-wall heuristics; no equivalent accepted durable multi-turn binding |
| Capture confidence | Saved real site traces and offline/synthetic analyses; no authenticated new reply accepted | Saved real site traces and offline/synthetic analyses; no attributed end-to-end reply accepted |

**Do not make effect requests to these observed private endpoints.** They are stream-shape forensic clues; supported operation is visible page UI via existing Studio browser authority.

## B. Observable *content* taxonomy to investigate

| Shape/family | ChatGPT WEB research surface | Claude WEB research surface | Evidence target |
| --- | --- | --- | --- |
| User/assistant turns | Visible message boundaries, edits, branch/regenerate versions | Visible message boundaries, content revisions | Distinct native IDs or source-grounded fallback, pre-send boundary |
| Plain answer | Markdown, code, math, tables | Markdown, code, math, tables | Native blocks vs DOM grouping vs raw stream components |
| Reasoning/progress | Visible summaries, progress UI or none by model/mode | Thinking summaries/indicators or none | **Only displayed summaries**; no private reasoning claim |
| Citations/research | Search/reference groups, research outputs | Research sources and cited results | Source title/link binding, same-generation provenance |
| Tools | Visible tool activity in Chat/Work | Visible tool/plugin/connector activity in Chat/Cowork | Observation distinct from AION-initiated action |
| Editable/interactive | Writing blocks, code blocks/previews, rich UI | Claude Artifacts docs/slides/design/dashboards, interactive apps | Artifact kind, version, edit/read/export action, linkage |
| Media and files | Downloadable generated files, images; attached input | Produced files and artifacts; attached input | Asset bytes/digest and accessible source, not invented |
| Agent tasks | ChatGPT Work task, stages, deliverables, scheduled work | Claude Cowork task, parallel subtasks, deliverables | Independent `AgentTask` node, not one assistant message |
| Context | Projects, project files, model/mode, connected sources | Projects, project knowledge/instructions, files, connectors | Supplied-context ledger and account/workspace scope |
| Branch lifecycle | Branch in new chat, edit/regenerate where exposed | Project/task parallel thread and alternative generations where exposed | Thread/branch/gen IDs and whether action truly supported |

## C. Official product documentation — feature evidence, NOT actual page observation
- ChatGPT Projects, including branching and files: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- ChatGPT Work and Codex surfaces: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- ChatGPT writing and code blocks: https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- ChatGPT cloud browser (separate runtime/account): https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- ChatGPT desktop browser/site tools: https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app
- Claude Artifacts and revisions: https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Claude current and new beta projects: https://support.claude.com/en/articles/9517075-what-are-projects
- Claude Cowork surfaces: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- Claude research: https://support.claude.com/en/articles/11088861-use-research-on-claude

## D. API references as comparison only
- Claude Messages API can return typed `text`, `thinking`, `tool_use` etc: https://platform.claude.com/docs/en/api/messages/create ; this does NOT assert webapp transports/types are identical or hidden thinking is accessible.
- OpenAI platform docs: https://platform.openai.com/docs ; use as a possible *semantic vocabulary* reference, never the browser data contract or an entitlement to paid API calls.

## E. Provider-native projection cases
**Case 1: prose+citations.** Preserve citation markup/source references and separate plain answer from citation activity; no collapsing to stripped Markdown.
**Case 2: editable output.** ChatGPT writing block is not Claude Artifact. Keep independent artifact identity, live revision and supported interaction.
**Case 3: generation revision.** A reused text segment may be in a new assistant generation; never identify by text alone.
**Case 4: long-running Work/Cowork task.** Progress/subtask/deliverable nodes are first-class; a provider tool trace isn't a direct AION action.
**Case 5: blocked guest/site.** Prove error state, absent reply, raw capture, and no false accepted/learned outcome.
**Case 6: multiple carriers.** Where DOM and network disagree or one is absent, preserve both and state unjoined/partial rather than force matching.

## Missing live observations
Actual ChatGPT and Claude signed-in thread navigation, after-edit branching, tool UI, citation and artifact revisions, stop behavior, account project contexts and response streams. Capture on owner-controlled Windows or permitted sandbox with truthful boundary labels. Do not upload private user chat content into this repository.
