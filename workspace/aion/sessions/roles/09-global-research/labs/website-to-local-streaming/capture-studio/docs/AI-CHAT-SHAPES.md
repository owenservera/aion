# AI chat shape library

> **Generated output - do not edit by hand.** Regenerate with the command below.
>
> - command: `node scripts/ai-chat-report.mjs`
> - data dir: `C:\Users\VIVIM.inc\AppData\Local\AION\capture-studio`
> - generated (UTC): `2026-10-21T23:39:50Z`
> - families with a chat surface: 4
>
> Every value is read from a captured family file (`families/<familyId>/vNNNN.json`).
> Fields that the captures do not show are printed as "not observed".
>
> A family counts as an AI-chat family when its id/hosts match a site adapter host
> (`src/profiles/sites/index.mjs` -> `ADAPTER_IDS`), or when it exposes at least two
> endpoints matching `/conversation|completion|chat|message|generate|stream|reply|timeline|response/i`.

## Summary

| family | hosts | sessions | derived | streams | transports | chat endpoints | endpoints (total) | signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| chat.z.ai | chat.z.ai | 1 | 1 | 2 | HTTP, HTTP_STREAMED | 2 | 2 | sha256:6171d2ec2a0408d3 |
| chatgpt.com | chatgpt.com | 6 | 6 | 29 | HTTP, HTTP_SSE, HTTP_STREAMED, UNKNOWN, WEBSOCKET | 7 | 29 | sha256:95923740d21411bd |
| claude.ai | claude.ai | 3 | 3 | 16 | EVENT_SOURCE, HTTP, HTTP_STREAMED | 3 | 16 | sha256:2d97e4dcab35c245 |
| gemini.google.com | gemini.google.com | 1 | 1 | 6 | HTTP, HTTP_STREAMED | 1 | 6 | sha256:52d3f5ef96bd0619 |

## chat.z.ai

- hosts: `chat.z.ai`
- site / family name: `z.ai` / `chat.z.ai`
- member sessions: 1 (`20261021-233811-zai-a9e8a8`)
- derived sessions: 1, streams: 2
- transports: `HTTP`, `HTTP_STREAMED`
- profile / signature: not observed / `sha256:6171d2ec2a0408d3`
- endpoint surface: 2 chat, 2 total

| transport | endpoint | field paths | delta / content field paths |
| --- | --- | --- | --- |
| HTTP_STREAMED | `/api/v1/chats/` | 17 | not observed |
| HTTP | `/api/v1/chats/new` | 54 | `$.chat.history.messages`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"]`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].childrenIds`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].content` (+7 more) |

<details><summary>All delta / content field paths</summary>

**`/api/v1/chats/new`** (HTTP)

```
$.chat.history.messages
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"]
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].childrenIds
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].content
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].id
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].models
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].models[*]
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].parentId
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].role
$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].timestamp
$.message_version
```

</details>

## chatgpt.com

- hosts: `chatgpt.com`
- site / family name: `chatgpt.com` / `chatgpt.com`
- member sessions: 6 (`20261021-232952-chatgpt-c77c83`, `20261021-232612-chatgpt-46d30e`, `20261021-231402-chatgpt-com-30f1d8`, `20261021-222313-chatgpt-66ce56`, `20261021-221801-chatgpt-c158af`, `20261021-221453-chatgpt-ac817b`)
- derived sessions: 6, streams: 29
- transports: `HTTP`, `HTTP_SSE`, `HTTP_STREAMED`, `UNKNOWN`, `WEBSOCKET`
- profile / signature: not observed / `sha256:95923740d21411bd`
- endpoint surface: 7 chat, 29 total

| transport | endpoint | field paths | delta / content field paths |
| --- | --- | --- | --- |
| HTTP | `/backend-api/conversation/init` | 13 | not observed |
| HTTP | `/backend-api/conversations` | 42 | not observed |
| HTTP | `/backend-api/conversations/{id}` | 93 | `$.messages`, `$.messages[*]`, `$.messages[*].author`, `$.messages[*].author.metadata` (+51 more) |
| HTTP_SSE | `/backend-api/f/conversation` | 171 | `$.entry.payload`, `$.entry.payload.options`, `$.entry.payload.options[*]`, `$.entry.payload.options[*].id` (+94 more) |
| HTTP | `/backend-api/f/conversation/prepare` | 3 | `$.conduit_token` |
| HTTP | `/backend-api/sentinel/chat-requirements/finalize` | 5 | `$.token` |
| HTTP | `/backend-api/sentinel/chat-requirements/prepare` | 14 | `$.prepare_token` |

<details><summary>All delta / content field paths</summary>

**`/backend-api/conversations/{id}`** (HTTP)

```
$.messages
$.messages[*]
$.messages[*].author
$.messages[*].author.metadata
$.messages[*].author.name
$.messages[*].author.role
$.messages[*].channel
$.messages[*].content
$.messages[*].content.content_type
$.messages[*].content.parts
$.messages[*].content.parts[*]
$.messages[*].create_time
$.messages[*].end_turn
$.messages[*].id
$.messages[*].metadata
$.messages[*].metadata.can_save
$.messages[*].metadata.citations
$.messages[*].metadata.content_references
$.messages[*].metadata.conversation_followup_suggestions_eligible
$.messages[*].metadata.cot_version
$.messages[*].metadata.default_model_slug
$.messages[*].metadata.exclusive_key
$.messages[*].metadata.finish_details
$.messages[*].metadata.finish_details.stop_tokens
$.messages[*].metadata.finish_details.stop_tokens[*]
$.messages[*].metadata.finish_details.type
$.messages[*].metadata.is_complete
$.messages[*].metadata.is_visually_hidden_from_conversation
$.messages[*].metadata.message_source
$.messages[*].metadata.message_type
$.messages[*].metadata.model_dil_v2
$.messages[*].metadata.model_dil_v2.appData
$.messages[*].metadata.model_dil_v2.appData.opGenui
$.messages[*].metadata.model_dil_v2.appData.opGenui.componentResults
$.messages[*].metadata.model_dil_v2.appData.opGenui.interactionSurface
$.messages[*].metadata.model_dil_v2.appData.opGenui.modelDataBindings
$.messages[*].metadata.model_dil_v2.code
$.messages[*].metadata.model_dil_v2.constants
$.messages[*].metadata.model_dil_v2.constants["0"]
$.messages[*].metadata.model_dil_v2.fallbackMarkdown
$.messages[*].metadata.model_dil_v2.fallbackMarkdownVersion
$.messages[*].metadata.model_slug
$.messages[*].metadata.model_switcher_deny
$.messages[*].metadata.parent_id
$.messages[*].metadata.rebase_developer_message
$.messages[*].metadata.request_id
$.messages[*].metadata.resolved_model_slug
$.messages[*].metadata.search_result_groups
$.messages[*].metadata.turn_exchange_id
$.messages[*].metadata.view_state
$.messages[*].metadata.working_turn_id
$.messages[*].recipient
$.messages[*].status
$.messages[*].update_time
$.messages[*].weight
```

**`/backend-api/f/conversation`** (HTTP_SSE)

```
$.entry.payload
$.entry.payload.options
$.entry.payload.options[*]
$.entry.payload.options[*].id
$.entry.payload.options[*].label
$.entry.payload.prompt
$.entry.payload.question
$.entry.payload.shown_at_assistant_turn
$.entry.payload.type
$.input_message
$.input_message.author
$.input_message.author.metadata
$.input_message.author.name
$.input_message.author.role
$.input_message.channel
$.input_message.content
$.input_message.content.content_type
$.input_message.content.parts
$.input_message.content.parts[*]
$.input_message.create_time
$.input_message.end_turn
$.input_message.id
$.input_message.metadata
$.input_message.metadata.message_source
$.input_message.metadata.parent_id
$.input_message.metadata.request_id
$.input_message.metadata.turn_exchange_id
$.input_message.metadata.working_turn_id
$.input_message.recipient
$.input_message.status
$.input_message.update_time
$.input_message.weight
$.message_id
$.metadata.message_id
$.token
$.v.message
$.v.message.author
$.v.message.author.metadata
$.v.message.author.name
$.v.message.author.role
$.v.message.channel
$.v.message.content
$.v.message.content.content_type
$.v.message.content.model_set_context
$.v.message.content.parts
$.v.message.content.parts[*]
$.v.message.content.repo_summary
$.v.message.content.repository
$.v.message.content.structured_context
$.v.message.content.user_instructions
$.v.message.content.user_profile
$.v.message.create_time
$.v.message.end_turn
$.v.message.id
$.v.message.metadata
$.v.message.metadata.can_save
$.v.message.metadata.citations
$.v.message.metadata.content_references
$.v.message.metadata.contextual_answers_message_type
$.v.message.metadata.conversation_followup_suggestions_eligible
$.v.message.metadata.cot_version
$.v.message.metadata.default_model_slug
$.v.message.metadata.exclusive_key
$.v.message.metadata.is_contextual_answers_system_message
$.v.message.metadata.is_user_system_message
$.v.message.metadata.is_visually_hidden_from_conversation
$.v.message.metadata.message_source
$.v.message.metadata.message_type
$.v.message.metadata.model_dil_v2
$.v.message.metadata.model_dil_v2.appData
$.v.message.metadata.model_dil_v2.appData.opGenui
$.v.message.metadata.model_dil_v2.appData.opGenui.componentResults
$.v.message.metadata.model_dil_v2.appData.opGenui.interactionSurface
$.v.message.metadata.model_dil_v2.appData.opGenui.modelDataBindings
$.v.message.metadata.model_dil_v2.code
$.v.message.metadata.model_dil_v2.constants
$.v.message.metadata.model_dil_v2.constants["0"]
$.v.message.metadata.model_dil_v2.fallbackMarkdown
$.v.message.metadata.model_dil_v2.fallbackMarkdownVersion
$.v.message.metadata.model_slug
$.v.message.metadata.model_switcher_deny
$.v.message.metadata.parent_id
$.v.message.metadata.rebase_developer_message
$.v.message.metadata.rebase_system_message
$.v.message.metadata.request_id
$.v.message.metadata.resolved_model_slug
$.v.message.metadata.search_result_groups
$.v.message.metadata.streaming_parent_id
$.v.message.metadata.streaming_parent_revision
$.v.message.metadata.turn_exchange_id
$.v.message.metadata.view_state
$.v.message.metadata.working_turn_id
$.v.message.recipient
$.v.message.status
$.v.message.update_time
$.v.message.weight
$.v[*].v.finish_details.stop_tokens
$.v[*].v.finish_details.stop_tokens[*]
```

</details>

## claude.ai

- hosts: `claude.ai`
- site / family name: `claude.ai` / `claude.ai`
- member sessions: 3 (`20261021-233122-claude-47009d`, `20261021-232724-claude-6da87f`, `20261021-221629-claude-ai-171679`)
- derived sessions: 3, streams: 16
- transports: `EVENT_SOURCE`, `HTTP`, `HTTP_STREAMED`
- profile / signature: not observed / `sha256:2d97e4dcab35c245`
- endpoint surface: 3 chat, 16 total

| transport | endpoint | field paths | delta / content field paths |
| --- | --- | --- | --- |
| HTTP | `/api/organizations/{id}/chat_conversations_v2` | 72 | `$.data[*].current_leaf_message_uuid`, `$.data[*].has_assistant_outputs`, `$.data[*].latest_assistant_output_at`, `$.data[*].latest_assistant_output_kind` |
| HTTP | `/api/organizations/{id}/chat_conversations/{id}/composer_notices` | 3 | not observed |
| HTTP_STREAMED | `/claudeai-rpc/anthropic.bard.api.v1alpha.ConversationService/StreamTimeline` | 4 | not observed |

## gemini.google.com

- hosts: `gemini.google.com`
- site / family name: `google.com` / `gemini.google.com`
- member sessions: 1 (`20261021-233249-gemini-b2f6cb`)
- derived sessions: 1, streams: 6
- transports: `HTTP`, `HTTP_STREAMED`
- profile / signature: not observed / `sha256:52d3f5ef96bd0619`
- endpoint surface: 1 chat, 6 total

| transport | endpoint | field paths | delta / content field paths |
| --- | --- | --- | --- |
| HTTP | `/_/BardChatUi/data/batchexecute` | 2 | not observed |

## How the sites differ

Derived from the tables above: the transport of each chat endpoint, any observed end-of-stream
field path, and the field paths that look like a delta/content payload. "not observed" means the
capture does not show that property - it is not an assumption that it is absent at the site.

| site | chat transports | stream-end field path | delta / content carrier |
| --- | --- | --- | --- |
| chat.z.ai | HTTP, HTTP_STREAMED | not observed | `$.chat.history.messages`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"]`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"].childrenIds` (+8 more) |
| chatgpt.com | HTTP, HTTP_SSE | `$.input_message.end_turn`, `$.messages[*].end_turn`, `$.messages[*].metadata.finish_details` (+11 more) | `$.conduit_token`, `$.entry.payload`, `$.entry.payload.options` (+152 more) |
| claude.ai | HTTP, HTTP_STREAMED | `$.metadata["Stream-Close-Reason"]`, `$.metadata["Stream-Close-Reason"][*]` | `$.data[*].current_leaf_message_uuid`, `$.data[*].has_assistant_outputs`, `$.data[*].latest_assistant_output_at` (+1 more) |
| gemini.google.com | HTTP | not observed | not observed |

- chat.z.ai serves chat over HTTP, HTTP_STREAMED (2 chat endpoints of 2). End-of-stream signalling: not observed. Delta/content paths observed: `$.chat.history.messages`, `$.chat.history.messages["bd877eeb-8caa-46d3-b380-de975f9b671c"]` (+9 more).
- chatgpt.com serves chat over HTTP, HTTP_SSE (7 chat endpoints of 29). End of stream is signalled by `$.input_message.end_turn`, `$.messages[*].end_turn` (+12 more). Delta/content paths observed: `$.conduit_token`, `$.entry.payload` (+153 more).
- claude.ai serves chat over HTTP, HTTP_STREAMED (3 chat endpoints of 16). End of stream is signalled by `$.metadata["Stream-Close-Reason"]`, `$.metadata["Stream-Close-Reason"][*]`. Delta/content paths observed: `$.data[*].current_leaf_message_uuid`, `$.data[*].has_assistant_outputs` (+2 more).
- gemini.google.com serves chat over HTTP (1 chat endpoint of 6). End-of-stream signalling: not observed. Delta/content carrier: not observed.

## Coverage and gaps

AI chat sites declared in `src/profiles/sites/index.mjs` -> `ADAPTER_IDS`, and whether the captured
family store has a family for the site.

| adapter | label | adapter hosts | family | chat endpoints |
| --- | --- | --- | --- | --- |
| chatgpt | ChatGPT | chatgpt.com, www.chatgpt.com, chat.openai.com | `chatgpt.com` | 7 |
| claude | Claude | claude.ai, www.claude.ai | `claude.ai` | 3 |
| deepseek | DeepSeek | chat.deepseek.com | **NO FAMILY** | 0 |
| gemini | Gemini | gemini.google.com | `gemini.google.com` | 1 |
| kimi | Kimi | www.kimi.com, kimi.com, kimi.moonshot.cn | **NO FAMILY** | 0 |
| lmarena | LMArena | arena.ai, lmarena.ai, www.lmarena.ai, chat.lmsys.org | **NO FAMILY** | 0 |
| minimax | MiniMax | agent.minimax.cn, minimax.io, chat.minimax.io | **NO FAMILY** | 0 |
| qwen | Qwen Chat | chat.qwen.ai, qwen.ai | **NO FAMILY** | 0 |
| zai | Z.ai | chat.z.ai, z.ai, www.z.ai | `chat.z.ai` | 2 |

Sites with no captured family yet: `deepseek`, `kimi`, `lmarena`, `minimax`, `qwen`.

- family files in the store: 15
- chat families reported: 4
- families with a chat-looking path but no chat surface / no adapter host (not reported above): `1337x.to` (1 chat-looking endpoint, no adapter host)
- unreadable family files: none

