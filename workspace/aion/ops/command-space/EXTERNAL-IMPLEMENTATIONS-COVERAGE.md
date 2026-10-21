# External implementations vs AION command space

**Harvest refresh: 2026-10-21. Static source inspection only — NOT tested, live-verified, integrated, or AION-available.** This is the existing comparison, expanded to nine pinned donors, not a second capability registry. [CSV](EXTERNAL-IMPLEMENTATIONS-COVERAGE.csv) retains the 40 semantic IDs from [the full matrix](aion_command_matrix.csv) and the exact 29 IDs in [the core contract](CORE-OPERATIONS.csv). Route multiplicity is planning data, not implemented capability.

## Method and status legend

- **I**: relevant implementation inspected in the pinned source. It does **not** certify every AION identity, authority, completion, retry, provider or acceptance requirement. Read the scope caveat.
- **P**: inspected partial, adjacent, local-client, API/private-backend, generic-substrate or otherwise mismatched implementation. Never count P as a full AION operation.
- **R**: documentation reports an operation but the relevant implementation was not inspected. Earlier R claims have been replaced where direct source supplies stronger or contradicting evidence.
- **U**: NOT_LOCATED within the cited checked source boundary; unknown, not proof of absence. U does not mean an exhaustive repository-wide negative search. The earlier Markdown display `·` meant this same U code; the CSV codes remain compatible.

For donor evidence cells, paths are **relative to that donor's `aion_source_root` in `../chrome-relay/harvest/external/sources.json`**, at the exact SHA below. Semicolon separates files; an optional `#symbol` is a locator, not part of the filesystem path. Normalize to repo-root paths by joining that source root and the path before `#`. This compact notation is not a new evidence schema or registry. U citations record the inspected boundary, not a nonexistent implementation. Symbols and source logic, not README feature lists or test names, support positive claims.

**Historical AION caveat:** all three original `AION_*` CSV fields are preserved as the earlier 2026-10-20 comparison snapshot. They are not refreshed product statuses. Their U entries must not be interpreted as current absence: AION already has Bus/effect-ledger, contract and PACK01/PACK02 work. Consult [AION integration](AION-INTEGRATION.md), [Development Master](../chrome-relay/DEVELOPMENT-MASTER.md), and the existing [harvest delivery](../chrome-relay/harvest/external/DELIVERY.md) / [first-pass handoff](../chrome-relay/harvest/external/landing/triage/FIRST-PASS-DEV-HANDOFF.md). This harvest does not adjudicate current product acceptance.

## Pinned source roster

The custody authority remains [sources.json](../chrome-relay/harvest/external/sources.json); roots below are beneath `workspace/aion/ops/chrome-relay/harvest/external/landing/donors/`. Pins describe imported snapshots, not current upstream tips.

- **MAC — Multi-AI Chat**, `multi-ai-chat`, TED-H-com/multi-ai-chat, **`cdcf6a7fb05609b219fd85395a116f26476a7f92`**, MIT. Entry seams: `src/content/base.ts`, `src/background/service-worker.ts`, `src/shared/conversationPersistence.ts`.
- **PA — Parallel AI**, `parallel-ai`, ParkerCai/parallel-ai-extension, **`944276d8146d11d5719a83cc550de31e4354a1c4`**, MIT. Entry seams: `content-scripts/text-injection-all-providers.js`, `content-scripts/file-injection.js`, `src/content/claude-model-fallback.ts`.
- **CH — ChatHub**, `chathub`, chathub-dev/chathub, **`852efba00ca7f2888093510b3add33f3ee01dc9b`**, GPL-3.0. Entry seams: `src/app/bots/abstract-bot.ts`, `src/app/bots/chatgpt-webapp/client.ts`, `src/app/utils/export.ts`. GPL requires use-specific license review; not a blanket claim of incompatibility.
- **CA — ChatALL**, `chatall`, ai-shifu/ChatALL, **`6d089c2ab72dde2ba1010cc1e910ceb766458546`**, Apache-2.0. Entry seams: `src/bots/Bot.js`, `src/store/index.js`, `src/components/ChatSetting.vue`.
- **CO — Council**, `council`, RaheesAhmed/Council, **`92845be5e8c1c30e2012c59fc51008aaaf11572e`**, MIT. Entry seams: `src/stores/use-run-store.ts`, `src/content/providers/dom-provider-adapter.ts`, `src/background/message-router.ts`.
- **BR — ChatGPT Bridge**, `chatgpt-bridge`, DrA1ex/chatgpt-bridge, **`0ffdae90239988f253058c05253226152acd55d2`**, MIT. Entry seams: `tools/chrome-bridge-extension/shared/commandManifest.js`, `tools/chrome-bridge-extension/content/serverCommandRouter.js` and the adjacent command handlers. ChatGPT-specific, not nine-provider coverage.
- **W2 — ChatGPT-Web2API**, `chatgpt-web2api`, Octo-Lex/ChatGPT-Web2API, **`497527dceabfa3f95961e23c291e618c5570f1ac`**, MIT. Entry seams: `src/chatgpt_web2api/cdp_driver.py`, `src/chatgpt_web2api/chatgpt_dom.py`, `src/chatgpt_web2api/backend_client.py`.
- **CD — CDPilot**, `cdpilot`, mehmetnadir/cdpilot, **`234d8bf3d1c0144792654bf670f07f93ffd8a1d3`**, MIT. Entry seam: `src/cdpilot.py`. Generic CDP substrate; monolithic Python implementation requiring `websockets`, not a complete provider adapter.
- **CE — Cereon Browser Operator**, `cereon-browser-operator`, cereon-labs/cereon-browser-operator, **`06da45090607dd9c9dc883ef5d523e9c99bcdb24`**, MIT. Entry seams: `src/background/tools/`, `src/background/content-bridge/content-bridge.ts`, `src/background/tabs/`. Generic MV3/CDP substrate only.

## Corrected findings — first source round

### Bridge: handler breadth is real; contract parity is not automatic

`shared/commandManifest.js:150–180` distinguishes `prompt.send`, `prompt.steer`, `prompt.cancel`, session commands, response recovery, model/effort listing and `intelligence.apply`. Follow these into `content/requestPromptCommands.js`, `composerCommands.js`, `sessionCommands.js`, `intelligenceCommands.js`, `attachmentCommands.js` and `requestResumeCommands.js`. This supplies the important P0 DOM handler references, including steer, model, effort, open/create, Stop and files, without making a live-success or full-contract count claim.

- `sessions.list` is sidebar collection, not complete off-page account enumeration. Response recovery/list snapshots are bounded visible/current turns, not complete provider history.
- A messages **POST is Send**, not a history reader. Regenerate/retry button detection in `composerCommands.js` is not an exposed `response.regenerate` handler. Rename and message-edit handlers were NOT_LOCATED in the checked manifest/router/command files: U, not unsupported.
- `sessionCommands.js:590–634` checks the expected ID/URL, selects a destructive action, seeks a confirmation, and checks conversation disappearance. Some races return `confirmed:false` after disappearance; absence is observed via the current UI/URL, not a backend erasure guarantee. Do not reduce this to a generic Delete click.
- `openNewSession` can return a blank/home session before a durable new conversation exists. The `chat.create` cell is partial for this reason; new-chat handler existence is not persisted identity.

### Multi-AI Chat: receive and workflow methods, not remote history

`src/content/base.ts` implements prompt dispatch, scoped Stop, response extraction, observation and cumulative `RESPONSE_CHUNK`/`RESPONSE_DONE` snapshots. `src/shared/requestScope.ts` checks request/workflow scope; `src/shared/providerReadiness.ts` and the worker distinguish readiness. Cumulative updates are not a durable receive cursor. `recoverableWorkflowTurn.ts`, `roundtableRecovery.ts` and checkpoints are workflow recovery, not AION cursor recovery; cancel includes local workflow cancellation, distinct from provider Stop.

`src/sidepanel/App.tsx` and persistence/continuity modules own local session history, listing, exports/sharing and context reconstruction. They do not read arbitrary existing provider threads. Model/effort selection, attachments and in-flight steering were NOT_LOCATED in this checked message/control surface. Preserve the distinction between provider-specific single activation and heuristic best-effort dispatch: no universal never-replay guarantee follows from this source.

### Parallel AI: uploads are queued; private patches are not DOM entitlement proof

`content-scripts/text-injection-all-providers.js` contains DOM Send, New Chat/fallback navigation, Stop and temporary-mode controls. The UI can prefill context; it does not expose a structured full-reply/history reader. Frame routing and readiness are not immutable conversation/account binding.

`content-scripts/file-injection.js:346–446` assigns a DataTransfer/files input or dispatches drop events. A queued file / accepted injection is **not verified provider attachment completion**. `src/content/claude-model-fallback.ts` rewrites model and effort in private completion fetch bodies; its model choices/metadata are not a live web-entitlement contract. Gemini effort controls use a different DOM path. `claude-workspace.ts` rewrites organization paths and the sync module can write `lastActiveOrg`: organization/account selection is **not project selection**. Do not transplant cookies, private endpoints or credentials.

### Council: independent fan-out, not a completed council pipeline

`src/stores/use-run-store.ts:12–44` sends only `buildIndependentPrompt` fan-out. Review/revision/synthesis stages are initialized but do not advance; response completion does not mark the overall run complete. Synthesis prompt definitions are not proof they execute. `stopRun` changes persisted status only.

`dom-provider-adapter.ts:18,43` defines New Chat and Stop methods, but the inspected run/router path does not call them. Those cells are P (defined/unwired), not I. The adapter's last-element response read and observer have old-answer risk and no exact conversation binding. IndexedDB run storage is not an exposed provider-history reader/list API.

### ChatHub and ChatALL: useful local/API patterns, not existing-web-thread proof

ChatHub provider requests are API/private backend paths, even where an adapter is named `WebBot`; a tab may proxy fetch rather than automate the visible conversation. Local message copy and `src/app/components/History/Content.tsx` Fuse search are useful local features. `src/app/utils/export.ts:5–13` serializes sync/local storage and localStorage: exports can contain **keys and private transcripts**. Never copy values or raw exports into harvest evidence.

ChatALL `src/store/index.js:482–600`, `src/store/queue.js`, chats/messages/threads storage and bot abstractions implement local dispatch, updates and thread management. Its API/private-web adapters do not prove reading a preexisting browser conversation. `ChatSetting.vue:297–337` exports the database plus settings; `getSettingWithoutBotSetting:699–714` removes bot-brand settings. The caller does not await that async helper before adding it to the ZIP — preserve this source caveat rather than claiming a verified safe export. Database transcripts remain private; settings filtering is not an exhaustive secret-safety proof. No aggregate/uniqueness claim is made about their catalogs.

## Second-round corrections and negative cases

- **Bridge policy is layered:** command-manifest `intelligence.apply` is **NEVER** retry, while internal execution-plan `model.apply` can be **IF_UNCONFIRMED**. They are not the same command or policy. Model/effort mismatch can warn and proceed rather than abort. An I model/effort cell records inspected controls, not a fail-closed selection guarantee. Attachment-chip wait can likewise emit a warning. Preserve these as negative-test candidates.
- **MAC best effort is not never replay:** source includes heuristic retry/activation branches; single-activation protections must not be generalized to every provider or workflow. Receive recovery does not authorize another Send.
- **Council cancellation is status-only:** do not upgrade it to provider Stop or multi-stage orchestration based on method names, stage arrays or unused synthesis prompts.
- **ChatHub retry and SSE:** `src/app/bots/chatgpt-webapp/requesters.ts` retries after explicit 403 through the proxy path, potentially replaying an effectful request. `src/utils/sse.ts` checks the parser discriminator `event.type === 'event'`; this is **not** a filter requiring a named SSE event and does not inherently drop unnamed data events.
- **ChatALL termination:** the `CLOSED` handling in `src/bots/ClaudeAIBot.js` (also other SSE adapters) is connection termination, not independent successful generation completion. Local queues/store and exports are not a receive cursor or exact web-thread binding.
- **Web2API is mixed-surface:** `chatgpt_dom.py` types/clicks Send; `cdp_driver.py` navigates and checks landing identity. `backend_client.py` reads/list/renames/archives/deletes via private backend APIs; Delete sends `is_visible:false` (soft hide), archive uses `is_archived`. Backend conversation IDs **may** identify the same web thread; current authenticated equivalence is **unproven**, not categorically impossible. No attach implementation was located in this checked surface.
- **Web2API counterexamples:** `cdp_driver.py:1122–1208` may fail to find the requested model/picker and proceed with the active model. Static/fallback model catalogs are not truthful live availability. Completion/read paths mix DOM and private backend turn anchors; neither supplies AION acceptance automatically.
- **CDPilot replay:** `src/cdpilot.py:3769–3787` resends a batch on a reused connection if no responses arrived. No response does not prove no effect; this is an unsafe replay counterexample, not at-most-once delivery. WebMCP page-tool invocation is effectful, not merely discovery. Receipt redaction, fake-wire fixtures and reason-code shapes are method references, not provider completeness or executed evidence.
- **Cereon retry/privacy:** `content-bridge.ts:60–66` catches any message failure, injects and resends; an effect may already have occurred. `upload-image-tool.ts` explicitly supplies guidance only, not upload. Generic click/type cannot earn provider rename/edit/Stop support. Tab-group/title adoption is weaker than exact provider/account/conversation identity. `form-input-tool.ts:21` echoes the full supplied value and text-input actions include previews: redact receipt inputs before any reuse.

## Gap limits and use by Development

Use complementary **method patterns**, **negative tests/failure modes**, and only genuinely specified **protocol contract candidates**. There is no mandatory primary donor and no transplant recommendation. Any code reuse needs a separate Development decision plus license/security review. A donor's internal cursor/effect format is not automatically a standard for AION.

The CSV is the full comparison; do not compute misleading total coverage percentages by adding I/P/R or mixing generic substrate, local/API operations and provider-native semantics. All-provider support, authenticated current layouts, exact account/thread equivalence, persisted new-chat identity, safe recovery and no-resend outcomes remain bounded/unverified. The 29-core contract is not replaced by the 40-row planning catalog.

**Validation ownership:** parent session owns machine validation. This writing pass performs read/grep inspection only; no shell/runtime execution, donor tests, browser/network actions or git commit. No executed validation counts are asserted here. Required parent checks: CSV parses to 40 unique IDs matching the full catalog; its intersection with core is exactly the 29 core IDs; nine complete nonempty status/evidence/caveat triples per row; only I/P/R/U codes; all donor-relative evidence paths resolve beneath pinned roots; original AION fields unchanged; only these two files changed by this worker. Derive any status counts from the saved CSV, not this prose. A structural 40×9-cell fixture/check is **not runtime acceptance** and must never be reported as 360 working capabilities.

Continue through the [existing exchange](../chrome-relay/harvest/EXCHANGE.md) and [existing delivery/handoff](../chrome-relay/harvest/external/DELIVERY.md), not a new registry, schema, triage file or product backlog.
