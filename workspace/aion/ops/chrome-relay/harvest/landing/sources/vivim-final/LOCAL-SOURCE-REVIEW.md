# VIVIM local-source harvest — ROUND1

**Evidence memo, 2026-10-21; source inspection only. Parent owns validation and adoption.**

## 1. Outcome and scope

The local `vivim-final` tree contains considerably more reusable material than the 27 prior excerpts: structured message parts, native OpenCode session/transcript projection, export parsers, plan validation, cache/backpressure helpers, browser primitives, and multiple distinct transport/policy implementations. **Recommend selecting small units, not installing its runtime.** No source here establishes a currently working, exact-conversation, at-most-one-effect AION browser command.

The most useful next slices are (1) native transcript-to-parts normalization, (2) structured content/source/tool contracts, (3) pure graph/input validation, and (4) bounded artifact parsing after correcting explicit defects. Several apparently complete features are only declarations, local database operations, or success-returning stubs. Keep those distinctions in every reuse decision.

This is a broad ROUND1 inventory plus targeted implementation/caller/test-assertion reads, **not a line-by-line review of every repository file**. The 40 current commands have one primary disposition each below; all 65 future IDs are mapped to source families or explicitly unassessed. Unread implementation owners remain named leads, not inferred capabilities.

**Actions not performed:** tests, builds, typechecks, package/runtime execution, installation, browser/CDP/GUI interaction, network access, fetch/checkout/commit/push, donor changes, bulk source capture. No `.env`, secret stores, Chrome profiles, user data, private transcripts, raw inputs, generated implementations, vendor trees, or `.git` file contents were read. Git commands queried metadata/status/tracked paths only. The only authored file is this memo. Donor migration instructions were read as context, not executed.

## 2. Local identity, custody, license, and separate VIVIM lineage

### Primary donor

- Root: `C:/0-BlackBoxProject-0/vivim-final`.
- **Observed HEAD:** `9a988edf7d5179b28d6bf5b5dddc2b44e16f906d`; branch `master`. Rechecked at `2026-10-21T07:42:58Z` with the same HEAD.
- Dirty tracked state: **433 deletions under `.cip/`, one modification `bunfig.toml`**. These are pre-existing; not inspected or changed. Source-scoped status including untracked paths, and source-scoped `git diff --name-only`, reported no changes under `src`, `frontend`, `sdk`, `shared`, `plugins`, `agent`, `tests`, `seeds`, `src-tauri`. A later whole-tree status query reported only deletion/modification classes. No claim is made about ignored local data.
- Tracked-path inventory, not full reads: `src` 1,051; `frontend` 672; `tests` 506; `seeds` 52; `src-tauri` 27; `shared` 12; SDK 3. No tracked files returned for `plugins` or `agent` in that query. Existing directories are not proof of implemented plugins.
- `LICENSE:1-21`: MIT, copyright 2026 Vivim. SHA-256 `6ba89800ee652ec17fb1d5fc2b02ca473aa7c4f9f0085bfcc446dfb65fa4446a`. Preserve notice on substantial reuse. This is a source-license observation, **not** a third-party dependency/license audit.
- `package.json` identifies `vivim-final` 1.0.0. Relevant declared dependencies include Zod `^4.4.3`, Prisma `^6.19.3`, QuickJS `^0.32.0`, `isolated-vm`, ULID libraries, Markdown parsers, and a much larger graph/ML/network stack. Do not import the dependency set for a tiny helper. AGENTS' older Prisma v6.5 description is not current package evidence.
- Parent `C:/0-BlackBoxProject-0/AGENTS.md` and parent `wiki/graph/report.md` read first: graph has zero nodes/edges, so offers no source graph. Donor `AGENTS.md` and `docs/end-state/MIGRATION.md` read. Donor `wiki/graph/report.md` and `wiki/index.md` were absent; `wiki/` lists candidates/insights/outputs/projects. No nested tracked `AGENTS.md` was returned by the Git path query.

### Citation convention — important

**Every donor-relative `path:line` / `path:symbol` citation in this memo is scoped to local HEAD `9a988edf7d5179b28d6bf5b5dddc2b44e16f906d`, at the primary root above**, unless explicitly prefixed `VIVIM` or `AION`. These source paths were clean in the inspected working tree; no dirty-source hash is needed to disambiguate them. This convention applies to family references S01–S18 and every table below. It does **not** relabel current local source as the old capture pin.

Prior GitHub capture: `8a798f91d52574cb3d7db579da516bc1c4aee7b7`, 27 `COPIED_EXCERPT` records. A local full-file SHA-256 comparison found **26 of 27 record paths match their old index full-source hashes** (multiple records share owners). VF-0018 differs because its old path is now a six-line migration shim. Equality of a particular file does not equate the two repository revisions or establish runtime correctness.

### Separate `C:/0-BlackBoxProject-0/VIVIM` root

`git rev-parse` reports **not a Git repository** at this root. Do not assign the primary donor HEAD to it. Top-level inventory: `.ai-context`, `.claude`, `.old`, `ASSETS`, `CANON`, `CODE`, `INSPIRATION`, `PITCH_DECK`, `vivim-rebuild`, nested `VIVIM`, malformed path-named directories, loose HTML/PDF/media and setup files. Only source-oriented top-level directory entries were inventoried; private context/docs/media were not crawled or read.

- `CODE/` contains `FILEEDITOR`, `vivim_L0` and loose HTML/TXT prototypes. The `vivim_L0` listing returned no entries. Loose document/prototype contents were not inspected.
- `vivim-rebuild/` has its own `src`, `tests`, `docs`, reference/decomposition trees and package files; no `.git` entry in its direct listing. `package.json` identifies **`vivim-rebuild` 2.0.0**, Vite/TypeScript, a single-file canvas product, package-declared MIT. Package SHA-256 `954936c945b7622a848dcdbb21d936a6780e8386a9a2a949ddd701661c1531f4`.
- `vivim-rebuild/src/` includes `acu`, `adapters`, `canvas`, `components`, `features`, `kernel`, `ports`, `primitives`, `providers`, `state`, `styles`, `tokens`, `types`, `ui`, `utils`, `versions`. Its `providers/` contains **ThemeProvider.ts**, not evidence of ChatGPT/Claude service providers.
- **VIVIM unversioned** `vivim-rebuild/src/kernel/index.ts:17-115` (`Kernel`, `bootstrap`) and `:126-160` (`EventBus`) were sampled: in-memory DI/event/command/scheduler architecture, not the primary donor's Prisma/CDP knowledge-graph backend. File SHA-256 `bf7bf236081b033116fdadc6693387435c08d48018103b062938f670b4b06121` pins the read bytes. The bootstrap comment claims dependency ordering, but the sampled implementation loops service registration order; no dependency traversal is visible there.
- Nested `VIVIM/` lists `gemini`, `zai`, loose HTML and ZIP. Not crawled. Distinct relevant **canvas UI lineage exists**; shared ancestry and operational provider implementations remain **UNASSESSED**, not assumed identical or absent. No standalone license file was read in that secondary tree, so its package license declaration alone is not a complete reuse clearance.

## 3. Source-family map and actual implementation boundaries

Family IDs below are navigation aliases, not a second runtime registry. Each reference inherits the local HEAD above.

### S01 — provider manifests, shapes, and actual configuration ownership

`seeds/providers/manifests.ts:6-56,133-187` defines static ChatGPT/Claude declarations. **Read-boundary caveat:** this already-indexed capture owner identifies itself as AUTO-GENERATED in its header; only bounded manifest metadata (`1-200`) was consulted, not a generated runtime implementation or a generated-tree crawl. The remaining generated seed body was not ingested. `src/engines/capability-shape-registry.ts:28-65,69-273` contains generic chat/IDE/search/design/dashboard/custom shapes and adapter interfaces; `:277-369` implements in-memory registration, dynamic adapter imports, recursive shape inheritance and heuristic selector-string scoring. This is broader taxonomy, **not named working adapters for each archetype**. Recursive inheritance has no visible cycle guard in `getEffectiveShape:328-339`.

Three provider registries must not be conflated:

1. `src/engines/providers/plugin.ts:7-114` + `providers/registry.ts:9-78`: legacy URL/selector/typing/recovery configuration; constructor loads built-ins. `providers/plugins/chatgpt.ts:8-57` is an actual concrete configuration class (historical selectors, anti-detection script, declared send/model features), not a send actuator.
2. `providers/provider-plugin-interface.ts:12-119` + `plugin-registry.ts:12-340` + `abstract-provider-plugin.ts:13-72`: separate lifecycle/metadata/health framework. `initAll:59-111` logs capability callbacks rather than registering executable handlers; catches per-plugin init failure and eventually sets `initialized=true`. `getPluginsByCapability:268-276` checks identity, not `available`. The default health method returns cached unknown state. Searches under `src` found the class/singleton/barrel but no boot instantiation of this lifecycle registry; tests exist. **Source implemented, production ownership not demonstrated.**
3. **Actual browser selector consumers use a third owner:** `src/config/provider-registry.ts:68-161,173-227` consumes a generated/dev protocol through `loadProviderProtocol`. `src/engines/provider-selectors.ts:6-53` and `conversation-manager.ts:139-152` import that registry. `config/provider-registry.ts:117-131` adds generic composer/submit fallbacks. Generated files were intentionally not ingested. This is stronger caller evidence than choosing the newest-looking interface.

### S02 — semantic capability resolution and multi-surface projection

`src/engines/capability-resolution.ts:162-239` queries store rows and active bindings, filters plan tier/existential rule/dependencies and groups UI results. `:241-316` maps overrides/provenance, availability and binding metadata. `:328-359` returns false for missing context but **true for unparseable expressions**; negation accepts an arbitrary remaining key. This is UI/catalog resolution, not fresh physical Send/Stop observation.

`src/engines/unified-registry.ts:19-48,52-71,75-169,171-214` supplies one descriptor/handler with CLI/UI/workflow/MCP/API projections. Registration checks exposure metadata; execution checks **required key presence only**, not JSON-schema types, grants, confirmation, target or effects. `registerOrReplace:105-113` is an explicit engine-over-stub override path. Small export/projection logic is reusable; the execution authority is not.

Actual boot: `src/server/bootstrap/phases/capabilities.ts:88-103,264-265,343-352` creates the registry, registers provider capabilities and starts the MCP adapter (source call sites inspected). `src/engines/capability-bootstrap/default-caps.ts:21-147` provides concrete conversation handlers. Generated taxonomy registration is another input; not every registered name has a real implementation.

### S03 — Send, observation, and effect evidence

`src/engines/conversation-manager.ts:382-703` resolves local conversation/account, chooses browser by provider/account, checks only provider page pattern, picks the first working composer selector or `textarea`, executes a typing/Enter harness DAG, captures response data, parses/stores messages and emits completion. It **does not prove exact existing provider conversation identity** merely from the local conversation ID. Capture exceptions are caught at `:553-567`, then local storage/completion continues at `:569-703`; local `ok:true` is not checked remote effect/completion. `send:326-355` has an outer recovery/retry loop, but `sendInternal:704-719` catches its own errors: do not claim every internal error actually reaches that retry loop. Streaming variants were signature-inventoried, not fully audited.

`src/engines/send-resilience.ts:85-109` checks liveness/session-health rather than exact composer uniqueness/readiness. `sendResilient:114-144` explicitly calls `sendFn` again after reconnect; `recover:148-155` replays last message. **Rejected literal transfer** under AION unknown-effect law. `tests/integration/engines/send-resilience.test.ts:100-118` explicitly expects two calls; assertion read, not run.

`src/engines/observation-tap.ts:18-45` is **only maps/listeners**: start/stop/isActive/onEvent, no CDP subscription, producer, event dispatch, or idle watcher. Consumers include `src/engines/agentic-loop.ts:8,59` and `mirror-engine.ts:145-153,216` (caller search only). Do not promote the tap to a functioning observer.

Alternative actual primitives: `src/executor/slave-read.ts:22-147` implements CDP evaluate/text/html/attribute/visibility/count/screenshot and accumulates console logs; whole-page HTML and unbounded log retention are poor AION defaults. `src/engines/browser-automation/defs/observe.ts:8-144` mixes real one-shot DOM/a11y/presence/style reads with **hardcoded `pending:0` / `errors:[]`** after enabling domains (`:32-53`). `observeMutation:56-68` is a presence probe, not a mutation subscription.

`src/engines/live-capture-engine.ts:111-233` actively types/submits test text and collects network response material, not passive observation. Event handlers at `:129-158` do not bind captured data/headers to the selected request ID. Completion uses marker substring or two-second silence (`:176-191`). These are failure-mode references, not a replacement for PACK-02 or AION completion proof.

### S04 — conversation/DAG/history and artifact normalization

`src/engines/provider-conversation-adapter.ts:14-87,99-193` defines provider-native IDs, nullable content, parent linkage, artifacts, cursor/total and typed read errors. Its auth contract is explicitly credential-bearing; don't carry that dependency into a pure mapper.

`src/engines/adapters/chatgpt-adapter.ts:90-289` is **read-only history REST**, not browser Send/Stop: cookie-based auth cache, private backend requests, list/search/get. `parseConversation:297-331` / `parseMessageNode:337-431` normalize mapping nodes, text/multimodal/image placeholders and timestamps. **Smallest candidate:** isolate these pure functions and types, not the class/auth/transport. Limits: sorts all branches by time, ignores `current_node` for branch selection; checks parent presence in raw mapping rather than retained-message set; defaults role to user; substitutes current clock for missing time (`:436-439`); image references can become placeholders rather than downloadable assets. `getConversation:247-250` maps every NETWORK_ERROR to null although the comment describes 404, so transport failure may masquerade as absence.

Actual caller: `src/server/conversation-sync-router.ts:40` constructs ChatGPTAdapter; `src/engines/conversation-history-sync.ts:79,193-218,361-376` owns sync/fetch/upsert (signatures inspected, full algorithm deferred). App-local storage is not provider history coverage.

Separate export path: `src/engines/parsers/chatgpt-import.ts:58-96` parses owner-supplied export JSON but derives conversation identity from title+time and drops parent linkage despite the available type. `claude-import.ts:35-58` uses provider conversation UUID and positional message IDs. `to-content-parts.ts:13-20` creates text-only done parts; this is not rich artifact import. These are actual pure parsing implementations, not full-fidelity sync.

### S05 — structured content, artifact extraction, and model-thinking boundaries

`src/schema/streaming.ts:11-101,113-198` is an implemented Zod discriminated union: text, reasoning, code, file, tool call/result, source, custom, error, meta, step-start, plus tool approval states. `migrateLegacyBlock:250-291` maps old block variants; `extractText:202-208` includes **reasoning** as well as visible text. AION must choose which user-visible, provider-exposed parts it is allowed to publish; “thinking” labels do not authorize hidden/internal reasoning access. Legacy default-to-text and guessed PNG media type need explicit compatibility review.

`src/engines/parsers/artifact-extractor.ts:38-113` contains dependency-free code-fence/antArtifact/thinking extractors, but caller search in `src`/`tests` found only self-references for these exports, not production use. `extractThinkingBlocks:86-94` regex starts `<think` but closes only `</think>`: it captures the opening `>` for `<think>` and does not implement claimed `<thinking>...</thinking>` support. Code-fence regex accepts only `\w` language tags and LF, trims code, drops empty fences; not a complete Markdown parser. **Adapt small code/antArtifact extraction, after boundary/format tests; do not adopt the whole module unchanged.**

`src/engines/provider-caps.ts:7-206` advertises thinking budget, artifact export, canvas sync, websearch, grounding and Python execution, but handlers only return input-derived success fields. `:35-38` does not configure Claude thinking; `:196-198` returns `executed:true` without execution. This local-head code is byte-identical to the prior full-source hash. `frontend/src/components/chat/SendButton.tsx:8-33` is presentation props only, not provider actuation.

### S06 — streaming parsers, cache, queues, and durable boundaries

There are **three different SSE implementations**, not one corroborated parser:

- `src/engines/api-provider-adapter.ts:20-85`: actual POST + token callback, but splits each network chunk independently into lines; split JSON can be lost, parse errors ignored, and the timeout is cleared after headers rather than after body completion. API billing/session semantics differ from browser subscription/web-thread identity.
- `src/engines/parsers/sse-parser.ts:createSSEParser:36-73`: dependency-free parser buffers incomplete lines, **but currentData/currentEvent are local to each feed call** (`:47-48`). Complete data lines without the terminating blank line in the same feed can be dropped. No `id`/`retry`/EOF/limit contract. Caller search found only the definition/example. Useful negative fixture, not a ready SSE engine.
- `src/plugin-kernel/adapter/impl/openai-compatible/stream-parser.ts:42-238`: migrated canonical OpenAI-compatible parser buffers frames and assembles tool argument deltas. Actual caller is sibling `adapter.ts:40,227`; old `src/ai/protocol/openai-compatible/stream-parser.ts:9` re-exports it. Supports usage and events, but skips malformed JSON, takes the last data line, splits only LF blank frames, and **emits response.completed at EOF without [DONE]** (`:219-237`). Never map that to AION reply verification. Dependency is donor AIEvent/ID contracts; extract framing/tool assembly rather than the entire gateway.

`src/engines/streaming-protocol.ts:33-177` implements incremental parse/store/events. Buffer/current conversation fields are single-instance state, no cursor/gap/epoch contract; `startConversation:76-89` uses clock-based IDs. `finishConversation:117-141` emits completion and intentionally does not re-store blocks. Existing test `tests/unit/engines/streaming-protocol.test.ts:47-54` still expects an accumulated store call: **static source/test drift**, no executed failure claimed.

`src/engines/execution-memoizer.ts:36-156`: dependency-light TTL/LRU/invalidation helper, actual ConversationManager caller `:435-439`; no in-flight compute coalescing, uses wall clock, array-based LRU. Suitable only for non-authoritative derived metadata; never cache fresh readiness or grants.

`src/engines/request-queue.ts:38-159`: executable closures, queue timeout, priorities and shedding. Provider cap checked on admission `:55-63`, not again when draining `:119-130`; weighted fairness is declared but not implemented distinctly. `reject_newest` evicts the existing queued tail before admitting the new request (`:67-95,133-149`). Not durable next-turn queue or steering. Tests document priority and that eviction behavior.

### S07 — policy/plan contracts, competing validators, and confirmation

`src/engines/action-plan.ts:104-127,157-250` has a useful **pure validation slice**: schema, unique node IDs, registered capability input schema/risk equality, required confirmation flag, self/missing dependency/cycle rejection. Dependency: Zod + a small read-only capability-definition map. Do not port its default risk=`read` as authority for unknown commands. Actual compiler `src/engines/action-plan-compiler.ts:45-82` calls validation; full compiler execution/caller graph not certified.

Do not confuse this with `src/engines/plan-validation-gate.ts:49-160`: its separate alphabetic metadata risk check does not reject unknown tier (`indexOf` = -1); destructive missing-confirmation only produces a warning; `requireEvidence` is explicitly unused. `isSafe` means no errors in that limited gate, **not AION safe to dispatch**.

`src/engines/policy-engine.ts:60-123` is default-deny for communication/destructive/security categories and rejects unknown risk. However `src/engines/execution-kernel.ts:107-133` lets `metadata.__confirmed === true` bypass even policy denial; otherwise only token presence is checked locally. Its topological order `:221-249` does not itself reject incomplete/cyclic graphs, so the validator must precede it. Errors become generic `ok:false`, not durable unknown effect. Actual boot `src/server/bootstrap/phases/lifecycle.ts:62-80` is feature-gated and wires `MemoryJournal` with no verifier. **Keep validation method; reject wholesale kernel/policy/confirmation authority transplant.**

`src/intel/nlcl/confirmation-store.ts:103-229` provides HMAC-bound capability/input/context with one-shot in-memory consumption and rotating peek token. Depends on Node crypto, a configuration secret and timers; not a durable Bus grant or operation reservation. `NullConfirmationStore:231-262` is deliberately auto-approve dev/test behavior. No secret configuration was opened.

### S08 — command context/NLCL and migration fidelity

`src/engines/command-language/types.ts:47-117` separates active provider/conversation/account and availability context from `when`, boost and run. `command-language/registry.ts:6-74` deduplicates by first ID, exposes prefix/category queries and MRU. Projection/ranking does not confer permission.

VF-0018 now resolves semantically to `src/intel/nlcl/types.ts:18-155`, with classification, trace, confirmation/clarification and executor IDs. **Static migration defect to investigate:** legacy `src/engines/nlcl/types.ts:6` exports `../../../intel/nlcl/types.js`, which resolves to repository-root `intel`, not `src/intel`; `Test-Path` for that corresponding `.ts` target returned false. Canonical types import `../../engines/nlcl/unified-registry.js` (`:12`), whose corresponding source target was also absent. These are source-path observations, not build-test results. Do not assume migration docs' old “dirs exist; files don't” is current: actual migrated files exist.

`src/intel/nlcl/context-binder.ts:23-62` copies IDs, can derive provider from a stored conversation, leaves account undefined and catches lookup failure. `resolvePronouns:67-87` replaces contextual words; unsuitable for silently guessing an effect target. Treat interpreted context as untrusted proposals checked against AION binding.

### S09 — native OpenCode, SDK, API/MCP, and desktop

`src/engines/opencode/opencode-client.ts:52-259` is an actual injected-fetch authenticated HTTP client: create session, async/blocking prompt, subscribe, permission response, diff, session list and **authoritative session transcript**. Best smallest slice is `getSessionMessages:254-257` plus a pure projection preserving `info`/`parts` identity, not a new supervisor. Caller: `src/server/bootstrap/phases/capabilities.ts:431-441`; exposed handlers `capability-bootstrap/default-caps.ts:717-916`.

Limits: comments bind it to historical v1.18.4, not the installed/current public API; no API compatibility verification was attempted. `subscribe:152-205` parses lines, does not filter each event's session ID itself, swallows stream closure, has no resume/gap signal and replaces a per-session controller entry without aborting a prior subscription. AION must retain its own source identity and cursor contract. `mapDecisionToResponse:33-41` defaults unknown decisions to `once`; unsuitable fail-open permission behavior.

`src/engines/local-agent/local-agent-executor.ts:85-182` parses CLI JSONL into parts/cost/tokens/session/permission-denial. OpenCodeClient.toBlocks calls it (`:209-210`). Useful pure candidate, but when tool call IDs are missing, synthesized call/result IDs use different `blocks.length` after pushing the call (`:150-162`): require explicit identity validation rather than guessing. Parsing output is not executing tools.

`src/ai/protocol/opencode-adapter.ts:131-309` creates a **new session for each execution**, subscribes before prompt, translates native events and finally emits completion; `cancel:302-305` is no-op except local AbortSignal behavior. This is not an adapter for continuing an existing browser conversation, and local abort is not provider Stop. `src/ai/README.md` calls the gateway flag default-off. Do not spawn a second runtime for this harvest.

`sdk/src/client.ts:20-34,95-129,167-181` wraps REST and WebSocket; many results are `unknown`, no runtime response validation, and WebSocket construction doesn't propagate the request bearer token. SDK's “fully typed” comment is not a contract proof. Local conversation PATCH/DELETE methods are not evidence of provider UI rename/delete.

`src/engines/mcp-client-adapter.ts:32-116` and `mcp-server-adapter.ts:175-242,261-350` implement a **bespoke `/tools` + `/tools/call` HTTP/WS surface**. They do not establish current standard MCP interoperability. Server defaults `0.0.0.0`, directly dispatches registry/Chrome commands, and the built-in `conversation_send:341-342` returns only `acknowledged:true`. `provider_list`/capabilities return empty arrays. Inventory tools must not be reported as real provider execution. `src/mcp/server.ts` is a separate DiscoveryMcpServer surface (signature inventory, full transport implementation deferred).

`src-tauri/src/lib.rs:7-28` has window-ready command/handler wiring; `docs/modules/desktop.md` describes Bun sidecar. Source paths under `src/desktop` and Tauri were inventoried, not a native messaging bridge proven compatible with AION. No desktop process was started.

### S10 — identity, session persistence, audit, and redaction

`src/engines/message-identity.ts:20-43` hashes provider/account/conversation plus provider message ID or role/content. Actual callers `conversation-manager.ts:582-624` use it after send when storing messages. **Storage dedup, not operation identity**; repeat identical legitimate turns can collapse. `idempotency-guard.ts:27-94` is worse for effect authority: ten-second in-memory window, simple 32-bit hash, client-key mode still hashes message, no pending reservation across concurrency/restart.

`src/engines/session-lifecycle-manager.ts:107-114,295-339` implements legal transitions. `recoverSession:342-403` marks recovery successful even if hook returns false when strategy is not `fail`; heartbeat reactivates idle/suspended (`:260-291`). Never translate session active/recovered into effect or ready proof. `session-state-persistence.ts:21-171` stores arbitrary session metadata/stateData in synchronous JSON files, permissive load, no atomic replace/schema validation/fsync visible; unsuitable substitute for Bus tombstones or a minimized cursor checkpoint.

`src/engines/state-transition.ts:53-83` is a small injected-store audit writer/query wrapper, not a state-law validator or append-only integrity mechanism. Can inspire metadata projection but AION already has durable operation events.

Two traffic recorders have **different safety properties**:

- `src/observability/traffic-recorder.ts:107-118` replaces with `'[REDACTED:$&]'`: **the matched secret remains inside the output**. `recordResponse:157-170` performs no redaction. Reject as a sanitizer; retain as a negative fixture. `src/observability/logger.ts:45-63` is another partial redactor (case-sensitive fields, skips arrays); only CDP helper calls apply it, and actual output statements are commented out at `:91-98`.
- `src/observatory/traffic-recorder.ts:redactSecrets:96-129` replaces sensitive header values and two body patterns with real placeholders on both request and response. This is a separate, better pure helper; still **does not redact requestUrl**, misses `set-cookie` in its header set and cannot sanitize arbitrary transcript/PII. `createTrafficRecorder:144-230` persists full bodies and maintains an unbounded read/modify/write index, not a justified AION evidence store. Extract allowlist-oriented minimization ideas only, not traffic collection.

### S11–S18 — additional indexed families and explicit read depth

- **S11 context/memory:** `src/engines/context-assembly.ts:17-34,276,412,576,708-779` signatures show layered recall/budget/persistence/history formatting. `conversation-manager.ts:397-430` actually invokes it and may inject memory. Full recall/rank implementation **UNASSESSED**; not provider memory.read/update. Relevant privacy/implicit egress boundary.
- **S12 tools:** `src/engines/tool-use-protocol.ts:19-51` wraps MCP listing/calls; S05 has approval/result schemas. AI tool orchestrator and execution manager files inventoried, not fully inspected. Tools as output data are not independently authorized invocation.
- **S13 browser grounding/actions:** `src/engines/browser-automation/registry.ts:67-106` validates params, grounds/heals targets, then invokes handlers without enforcing trust there. `types.ts:90-99` auto-allows writes by preset. `defs/input.ts:29-77` requires target presence but doesn't prove uniqueness/enabled/exact conversation; upload `:406-423` sets a `data-vivim-files` attribute and dispatches change, **not actual FileList upload**. Small explicit frame/target handling can inform tests; generic automation is not all 40 semantic commands.
- **S14 organization/export:** `src/engines/conversation-organizer.ts:21-72` local project/topic assignment; `src/engines/export.ts` inventoried but not implementation-read. These do not prove provider project switching or share/export completeness.
- **S15 automation/workflows:** `src/engines/command-parity-capabilities.ts:13-34,210-299` implements process-local newsletter/schedule maps, no scheduler actuation. Workflow compiler/engine/templates/scheduler directories inventoried, deeper execution/retry semantics **UNASSESSED**.
- **S16 multimodal/media:** media/image bridge and parser block families exist by path/type inventory; active voice/screen/image/video provider operations **UNASSESSED**. `provider-caps.ts:174-199` claimed Python sandbox is a stub, not a multimodal engine.
- **S17 runtime/reliability:** ChromeGovernor/fleet/actor/circuit-breaker/retry/lock/sandbox modules exist; the Governor boundary is used by S03. No wholesale import assessment; no browser startup, sandbox code or recovery executed. QuickJS, vm and safe-eval paths coexist by path inventory despite AGENTS describing a removal goal. Which paths are reachable is **ROUND2**, not assumed secure or uniformly obsolete.
- **S18 provider/account/model/health:** S01 registry, S02 resolved plan tier/availability, S09 native model store handlers, and provider-health signatures. No subscription entitlement/account UI operation verified; health scores and historical catalogs are not effective per-action readiness.

## 4. Resolve VF-0001…VF-0027 against current local owners

“Equal” below means local full file SHA-256 equals the old index full-source hash, not that every source line was read. Full SHA values remain in the unchanged `index.jsonl`; this memo does not rewrite capture provenance.

| Prior ID | Current owner / local line scope | Finding / disposition |
|---|---|---|
| VF-0001 | `seeds/providers/manifests.ts:6-56` | Equal; static ChatGPT manifest, S01; no runtime support inferred. |
| VF-0002 | same file `:133-187` | Equal; static Claude manifest, S01; not a second proven integration. |
| VF-0003 | `src/engines/capability-shape-registry.ts:28-104` | Equal; required/optional chat shape; actual registry read in S01. |
| VF-0004 | same file `:105-153` | Equal; coding IDE/search shape, not concrete IDE actuator. |
| VF-0005 | `src/engines/capability-taxonomy.ts:8-94` | Equal; semantic declarations; no live command proof. Remaining taxonomy body not fully read. |
| VF-0006 | `src/engines/capability-resolution.ts:14-94` | Equal; full resolver read; metadata distinct from ready/authorized. |
| VF-0007 | same file `:162-239` | Equal; real row filter, S02; rule hazard retained. |
| VF-0008 | `src/engines/unified-registry.ts:9-96` | Equal; real registry contract, S02. |
| VF-0009 | same file `:152-214` | Equal; export/handler implementation, only key-presence input validation. |
| VF-0010 | `src/engines/providers/plugin.ts:7-114` | Equal; legacy configuration class with actual builtin concrete ChatGPT config; not active browser selector canon. |
| VF-0011 | `src/engines/command-language/types.ts:47-117` | Equal; context/when/run schema; actual registry MRU implementation S08. |
| VF-0012 | `src/engines/provider-conversation-adapter.ts:14-193` | Equal; read adapter types, no Send method; S04. |
| VF-0013 | `src/engines/session-lifecycle-manager.ts:107-114,295-403` | Equal; transition/recovery implementation read; false recovery hook can still reach active. |
| VF-0014 | `src/engines/observation-tap.ts:18-45` | Equal; **stub**, no observation producer. |
| VF-0015 | `src/engines/message-identity.ts:20-71` | Equal; message storage hash, not durable operation ID. |
| VF-0016 | `src/engines/send-resilience.ts:114-155` | Equal; explicit second-send recovery, reject effect transfer. |
| VF-0017 | `frontend/src/shared/streaming.ts:11-110` | Equal; frontend stream vocabulary, not cursor or checked completion. |
| VF-0018 | old `src/engines/nlcl/types.ts:1-6`; new `src/intel/nlcl/types.ts:18-155` | **Changed/migrated**; old path hash `922929aeaa0950b3467c2f831a050fb27d800afb1edec8ca72b6ea69f0d76f3f`; canonical hash below. Shim/import path defects need ROUND2. |
| VF-0019 | `src/engines/messaging-archetypes.ts:1-96` | Equal; normalization declarations; no running webhook/poller established. |
| VF-0020 | `src/engines/live-capability-registry.ts:69-116,138-241` | Equal; dynamic MCP/HTTP/inline handler bodies read: registry sets requiresConfirmation=false; HTTP uses optional audit or global fetch (`:197`); inline grants clipboard permission (`:168-174`); MCP delegates to tool facade (`:222-233`). Memory audit stub and dynamic execution are not authority reuse; downstream sandbox/facade not audited. |
| VF-0021 | `src/engines/provider-caps.ts:7-206` | Equal; **success-echo stubs**, not model-thinking/tool/artifact effects. |
| VF-0022 | `frontend/src/components/chat/SendButton.tsx:8-33` | Equal; props/presentation, not actuator. |
| VF-0023 | `src/engines/adapters/chatgpt-adapter.ts:297-439` | Equal; actual history parser/auth boundary resolved, S04. No Send/Stop. |
| VF-0024 | `tests/integration/engines/send-resilience.test.ts:100-118` | Equal; test source expects second send; read only. |
| VF-0025 | `src/engines/providers/provider-plugin-interface.ts:12-119`; registry `:59-111` | Equal; separate lifecycle implementation; no active boot owner shown by source caller search. |
| VF-0026 | `src/engines/capability-resolution.ts:328-359` | Equal; malformed-rule true branch confirmed in complete owner. |
| VF-0027 | `src/engines/state-transition.ts:53-83` | Equal; real audit wrapper, not effect or transition-law enforcement. |

## 5. Forty exact current-command primary dispositions

Rubric: **PARTIAL** = concrete narrower method/schema/implementation with a fidelity gap; **UNKNOWN** = relevant declarations/leads but requested operational behavior not established by these reads; **NOT_APPLICABLE** = inspected implementation addresses a different domain, not this operation. No row is a claim of live support. **C** denotes membership in the exact 29-row `CORE-OPERATIONS.csv`; **R** denotes the other 11 existing-registry IDs. Each row has exactly one primary disposition. S-family references above carry exact HEAD/path/symbol/line anchors.

| Exact semantic ID | Set | Primary | Source scope and AION-relevant boundary |
|---|---|---|---|
| send | C | PARTIAL | S03 ConversationManager actual type/submit/capture pipeline; no exact provider-thread/effect proof; unsafe resilience cannot transfer. |
| observe | C | PARTIAL | S03 real one-shot DOM/CDP reads versus observation-tap stub; not passive exact-bound event stream. |
| reply.read | C | PARTIAL | S04 history parser/S09 native authoritative transcript; not a bounded live browser assistant read with coverage. |
| stream | C | PARTIAL | S06 actual parsers/progressive events; EOF/gap/identity semantics differ, no verified completion. |
| history.read | C | PARTIAL | S04 concrete REST/export parsers; REST auth not adopted, local/imported history not complete web history. |
| session.bind | C | PARTIAL | S08 context binder/S09 exact native session methods; S03 selects by provider/account, not proved exact web conversation. |
| recover | C | PARTIAL | S10 session recovery and S03 negative resend fixture; AION must resume observation only for uncertain effects. |
| sessions.list | C | PARTIAL | S09 native listSessions and S02 local conversation list; exact scope must remain native/app-local, not fabricated web inventory. |
| model.list | C | PARTIAL | S09 default-caps `:943-958` lists stored native model allowlist; S01 manifest catalog not account-current UI entitlement. |
| model.select | C | PARTIAL | S09 `default-caps.ts:1015-1022` selects local agent default; not existing ChatGPT conversation model selection. |
| file.attach | C | PARTIAL | S13 upload `input.ts:406-423` only attribute/change; useful false-positive fixture, not actual attached file. |
| chat.create | C | PARTIAL | S02 `default-caps.ts:68-74` creates local DB row; S09 creates native session; neither proves persisted provider web chat. |
| chat.open | C | PARTIAL | S15 `command-parity-capabilities.ts:101-125` switches local active map; no browser navigation/binding confirmation. |
| chat.rename | C | PARTIAL | S09 SDK updateConversation `:112-114` local REST patch only; provider title mutation unproven. |
| generation.stop | C | UNKNOWN | S09 adapter cancel `:302-305` no-op/local abort; no inspected provider Stop actuator or generation-bound proof. |
| thinking.level.set | C | PARTIAL | S05 `provider-caps.ts:35-38` echoes budget/enabled; retain declaration/test hazard, no effect. |
| steer | C | UNKNOWN | S06 request queue is scheduling closures, not mid-turn steering; no exact steering implementation read. |
| message.edit | C | UNKNOWN | S01/VF-0005 declarations; no provider-message edit+regeneration owner established. |
| response.regenerate | C | UNKNOWN | S01/VF-0005 declarations; resend recovery is not regeneration and is rejected. |
| chat.search | C | PARTIAL | S04 ChatGPTAdapter.searchConversations `:262-287`, private REST; parse/coverage method only. |
| chat.archive | C | PARTIAL | S04 list filters is_archived; S10 manager archiveMessage `:1137-1142` is local message state, not provider chat archive actuation. |
| chat.delete | C | PARTIAL | S02 `default-caps.ts:129-144` Prisma local deletion; no browser provider deletion/strong confirmation proof. |
| chat.share | C | UNKNOWN | No inspected provider share scope/privacy/effect implementation; taxonomy is insufficient. |
| branch.create | C | PARTIAL | S04 parent-linked DAG normalization, ignores active branch; no branch creation. |
| message.copy | C | PARTIAL | S13 `input.ts:442-450` reads current selection, not exact message ID/clipboard/fidelity contract. |
| tool.toggle | C | PARTIAL | S05 provider-caps websearch/grounding success echoes; not effective provider tool state. |
| project.select | C | PARTIAL | S14 local organizer.assignToProject `:44-46` and context project layer; no provider project UI selection. |
| chat.export | C | PARTIAL | S04 export parsers/parts normalization are import-side methods; export engine implementation remains unassessed, completeness unknown. |
| mode.select | C | UNKNOWN | S01 declarations/model metadata not mode selection; no actual owner/effect read. |
| agent.delegate | R | PARTIAL | S09 local-agent run and native prompt path are real dispatch mechanisms, not an AION delegation authority or bound browser continuation. |
| agent.status | R | PARTIAL | S09 native events/session ID and CLI run result/error; status/progress distinct from remote checked outcome. |
| cancel | R | PARTIAL | S09 abort/unsubscribe and no-op cancel distinguish consumer cancellation from provider Stop; no retry/fallback. |
| context.inject | R | PARTIAL | S11/S03 memory/context assembly called before send; real context source/consent/egress needs AION review. |
| discover | R | PARTIAL | S01/S02 list/export/filter/shape match implemented; no assumption advertised command is ready or permitted. |
| grant.manage | R | NOT_APPLICABLE | S07 confirmation tokens and S09 OpenCode permission replies are not AION scoped grants/ledger; preserve existing authority. |
| health | R | PARTIAL | S01 lifecycle cached health; S03 liveness and S09 GET /doc readiness; none proves action-current browser readiness. |
| receipt.read | R | PARTIAL | S07 MemoryJournal and S10 transition queries offer event/audit projection, not durable provider-effect receipts. |
| result.export | R | PARTIAL | S05 structured parts/S09 SDK result shapes; artifact success echo not file export; actual export owner unassessed. |
| tool.call | R | PARTIAL | S12/S09 actual external-tool HTTP invocation; no existing AION grant/effect integration, bespoke MCP not assumed standard. |
| ui.panel | R | PARTIAL | S02 UI export/command context and S05 presentation components; no provider browser panel control proved. |

## 6. All 65 future candidates — family mapping, not approval

Universe is `harvest/external/reference/capability-universe.csv` (40 current + 65 FUTURE_CANDIDATE). These **21 scope rows enumerate every future ID exactly once**. Mapping a family is not claiming each action is implemented. **UNASSESSED** means the required owner/effect semantics were not read sufficiently, not that source is absent.

| Scope | Exact future IDs | Source-family mapping / explicit remaining gap |
|---|---|---|
| protocol (3) | receive.cursor; receive.identity; send.correlation | S04/S06/S09/S10 identity/sequence schemas, EOF/resend/hash counterexamples. No donor epoch/coverage cursor ready to supersede AION/PACK-01. Correlation proof remains unestablished. |
| receive (3) | conversation.watch_idle; reply.read_full; response.complete.verify | S03 stub tap vs one-shot reads; S04 native/history transcript; S06 progressive parts and false completion paths. Passive idle watcher and bounded full browser response **UNASSESSED/not established**, no completion adoption. |
| model (2) | model.capabilities.read; thinking.level.read | S01/S02 declared/gated metadata, S09 stored model fields; requested versus effective thinking/readback **UNASSESSED**. S05 setter is a stub. |
| conversation (6) | conversation.fork; chat.pin; chat.move; chat.duplicate; chat.share.revoke; chat.labels.manage | S04 DAG and S14 organizer supply local representation only. All six provider-native effects **UNASSESSED**; local tags/project assignment is not provider mutation. |
| message (5) | message.branch; message.reaction; message.citation.read; message.citation.open; message.format.read | S04 DAG and S05 source/code/file/tool parts; pure structured read candidates. Branch/reaction/open effect owners **UNASSESSED**; no URL auto-open from untrusted content. |
| generation (4) | message.queue; message.interrupt_and_send; message.submit_schedule; response.compare | S06 queue is closures; S15 schedule maps; S04 alternative branch provenance. Actual provider queue/interrupt/scheduled send/compare implementations **UNASSESSED**. Two effects never collapse to one generic retry. |
| export (1) | response.export | S05 structured parts / artifact extractor. Actual authorized bytes/export/completeness **UNASSESSED**; trim/placeholder fidelity limits explicit. |
| artifacts (4) | artifact.create; artifact.list; artifact.download; artifact.edit | S04 artifacts list shape, S05 extraction + stub artifact/canvas handlers. Representation only; all provider-native artifact operations **UNASSESSED**. |
| files (3) | file.list; file.detach; file.search | S05 FilePart and S13 upload counterexample. File executor directory listed, required exact-conversation/project file operations **UNASSESSED**. |
| tools (3) | tool.list; tool.invoke; tool.permission.manage | S02 registry export, S09 actual tool HTTP calls/native permission response, S12 approval/result types. Useful projection/adapter methods; AION grants remain sole authority and unknown permission must not default to once. |
| integrations (3) | connector.list; connector.connect; connector.disconnect | S09 MCP connection records connect/disconnect are local external tool servers, not owner-account first-party provider connectors. All three provider connector effects **UNASSESSED**. |
| identity (2) | provider.account.select; provider.profile.list | S01 provider/account config and S09 SDK accounts; S03 account-based browser lookup. Account/profile identity shape only; current authorized selection/listing fidelity **UNASSESSED**. |
| browser (2) | browser.tab.bind; browser.readiness.probe | S03 liveness/presence/visibility, S13 frame/selector resolution. No exact bound tab/page epoch or independent Send/Stop uniqueness contract proved. Use explicit negatives rather than new binding authority. |
| multimodal (8) | voice.session.start; voice.session.stop; audio.transcribe; image.generate; image.edit; video.generate; screen.share.start; browser.computer_use | S05/S16 multimodal representations; S13 generic browser interaction actual primitives. Voice/audio/image/video/screen provider owners **UNASSESSED**. Computer-use primitives not a provider-entitled computer-use feature. |
| memory (2) | memory.read; memory.update | S11 local memory/context call sites and S02 local memory caps by source inventory. Provider-visible personalization/memory UI is a different surface; both **UNASSESSED**. |
| settings (2) | custom.instructions.read; custom.instructions.update | S11 local identity/context memory injection is not provider custom instructions. Both provider settings operations **UNASSESSED**. |
| workspace (2) | project.create; project.members.manage | S14 local createProject method only. Provider project creation/member authorization **UNASSESSED**. |
| automation (3) | automation.create; automation.list; automation.cancel | S15 process-local schedule/newsletter registration and listSchedules; workflow scheduler execution/cancel **UNASSESSED**. No unattended effect authority inferred. |
| account (3) | usage.read; provider.plan.read; model.rate_limits.read | S02 plan-tier inputs, S09 CLI/native usage/token/cost fields and model store; S18 health data. Historical/configured values not authoritative provider plan or current rate-limit entitlement. Provider-account reads **UNASSESSED**. |
| evidence (1) | audit.export | S07/S10 event/audit schemas and two differing redactors. Useful minimized projection and sanitizer counterexamples; no full-body traffic export approved. |
| agents (3) | agent.run; agent.progress.watch; agent.artifacts.list | S09 actual local CLI/native run/subscribe/result parsing. Progress identity/closure errors need adaptation; native artifact enumeration **UNASSESSED**, not implied by generic FilePart. |

## 7. High-leverage smallest reuse units and dependencies

All are **proposed research/adaptation choices**, MIT donor notice required where source is reused. No package was staged and none is an AION runtime dependency. “Caller” means source reference observed, not execution observed.

| Candidate / smallest unit | Dependencies and maturity | Actual caller / test-source evidence | AION overlap, risk and recommendation |
|---|---|---|---|
| Native `info`/`parts` transcript projection (S09 client `:247-257`, CLI parser `:85-182`) | Fetch/type-only contract + pure mapper; real native methods, untested here. CLI parser currently coupled to engine imports; trim it. | Boot capabilities `:436-441`, OpenCodeClient.toBlocks `:209-210`; `tests/unit/engines/opencode-client.test.ts` inventoried, not assertions-read. | AION native source already exists/candidate P5; compare only missing role/part/parent/model fields. Don't import supervisor or old endpoints; test missing tool IDs and wrong-session events. **REVIEW_SMALL_SLICE**. |
| ContentPart/source/tool approval schemas (S05 `streaming.ts:11-198`) | Zod + type-only RichText; implemented, widely imported in reviewed managers/parsers. | StreamParser and local-agent parser imports read; streaming-protocol tests assert event/parts behavior. | Existing AION event/1 owns transport. Add adapter-specific part projection only if needed; reasoning visibility, byte bounds, unknown variants. **REVIEW_CONTRACT_FIELDS**, no schema replacement. |
| Pure DAG node/message mapper (S04 `chatgpt-adapter.ts:297-439`) | Type definitions only if isolated; production read-adapter caller found. | ChatGPTAdapter.getConversation `:259`; test DAG assertion `tests/unit/engines/chat/chatgpt-adapter.test.ts:224-272`. | Future branch/read mapping; do not import credentials/REST. Preserve current_node, orphans, source timestamp uncertainty and multimodal references. **ADAPT_AFTER_FIXTURES**. |
| Code fence + antArtifact extraction (S05 `artifact-extractor.ts:38-77`) | No external dependency; actual functions but no production caller found. | Caller search found self only; no test assertions found in searched src/tests. | Useful structured response extraction after user-authorized reads; preserve exact bytes/ranges, CRLF/empty/unclosed fences. Thinking extractor currently defective. **SMALL_EXPERIMENT**, not mature production claim. |
| Pure plan graph/input checks (S07 `action-plan.ts:157-250`) | Zod + capability definition map, no runtime required; implemented validation. | ActionPlanCompiler.compile source calls validator; plan-validation tests only path-inventoried, separate kernel tests read. | Optional future deterministic semantic compiler; existing Bus validation already governs current commands. Never create second plan executor; reject risk defaults and source metadata authority. **METHOD/BOUNDED_VALIDATOR_ONLY**. |
| Canonical registry exports (S02 `unified-registry.ts:171-214`) | Map/filter and descriptor shape; real boot consumers. | MCP constructor `:162-171`, tests `unified-registry.test.ts:58-86` assert surface filters/exports. | AION existing registry/Command Space projection, not second registry. Extra presence/type/permission checks required for effects. **ADOPT_METHOD_IF_GAP**. |
| Default-deny unknown-risk predicate (S07 `policy-engine.ts:77-86`) | Pure risk lookup; source implemented. | Feature-gated kernel boot `lifecycle.ts:67-80`; tests block communication/destructive. | Existing AION grants/classifiers overlap; preserve unknown as denial. Not full kernel because __confirmed bypass. **NEGATIVE_TEST_AND_METHOD**. |
| Cache helper TTL/invalidation (S06 `execution-memoizer.ts:58-117`) | No packages; optional event-bus callback, wall-clock TTL/LRU. | ConversationManager `:435-439` actual use. | Only non-authoritative expensive metadata; not readiness/identity/grants. AION cache need unestablished. **DEFER_UNLESS_MEASURED_NEED**. |
| Queue timeout/priority/shed cases (S06 `request-queue.ts:49-159`) | Promise/timers + EngineError; real algorithm, no boot caller established by reviewed search. | `request-queue.test.ts:19-120` asserts draining, priorities, provider capacity, shedding, timeout. | Existing AION single writer/inbox flow; new scheduler unnecessary. Provider limit at drain and rejection vocabulary require correction. **TEST_PATTERN**, not runtime queue adoption. |
| Header minimization/redaction predicate (S10 `observatory/traffic-recorder.ts:96-129`) | Pure string/header logic after extraction; distinct from unsafe observability class. | Barrel definitions observed; production recorder caller not established. | Existing AION privacy contract wins; permit only explicit non-sensitive receipt fields. Test URLs/set-cookie/arrays; do not persist bodies. **MINIMIZATION_METHOD**, not recorder. |
| Session transition/audit vocabulary (S10 `session-lifecycle-manager.ts:107-114`, `state-transition.ts:56-83`) | Table or injected-store audit, ULID if using writer; actual implementation. | Session manager transition read; state-transition test path inventoried. | AION already has events/ledger; classify orthogonal session state only. **NOTE_ONLY**, no second lifecycle/store. |
| Unsafe resend, EOF, stub-success, redaction regressions (S03/S05/S06/S10) | Synthetic fixtures only, no donor runtime needed. | Assertions directly read where listed below. | Existing AION no-resend/completion/unknown-effect classifiers and PACK-01/02 can reuse **counterexamples**, not behaviors. **HIGHEST_CONFIDENCE_TEST_LEVERAGE**. |

## 8. AION overlap and explicit non-transfer decisions

Inspected AION checkout identity during the read: `51eeac81dd47861e40c7a41f038f080d1a6969c7`, branch `integration/i1-watch-20261020`; parent may advance it. This is a separate AION identity, **not a donor pin or parent test receipt**. `DEVELOPMENT-MASTER.md` was read as a living map with historical/candidate caveats, not treated as current test truth.

- Existing AION `extension/src/bus/{contracts,grammar,registry,ledger,grants,validate}.js` stays canonical. `ledger.js:createBusStore:177` and `transition:264` were symbol-inspected; no replacement grant, hash-idempotency store or caller-controlled confirmation bypass.
- PACK-01 README specifies epoch/monotonic cursor/retained bounds/pagination/reset/gap; PACK-02 README specifies silent baseline, exact account/binding/page lifetime, conservative response boundary and incomplete-history marking. These already cover the structural receive gaps. Donor frontend indices and session files offer **no reason to duplicate them**.
- Current source lists `extension/src/chatgpt/receive.js` and `velocity/src/{browser,conversation,native-host,transport}` alongside existing commands/security. Do not equate old pack README “not present on main” packaging text with current checkout absence. No implementation/live validation of these parent-owned changes was performed.
- Keep operation, message, native session, local DB conversation, provider web thread, page epoch, stream and receipt IDs independent. Message content hashes are not operation keys; local DB titles/archiving are not remote UI effects.
- Preserve existing completion/unknown-effect classifiers. Reject `sendFn` replay, retry after ambiguous activation, highest-ranked ambiguous control, health/idle/EOF → checked reply, `ok:true` echo → effect, and connection ACK → user-turn proof.
- Browser CDP/native/API methods are **distinct route candidates**, not globally dismissed because an older synthesis excluded them. This task performed none. Any future Development-selected actuation has one admitted actuator and one effect authority; no fallback after unknown effect.
- No donor engine, CLI, server, gateway, plugin manager, scheduler, traffic recorder or database becomes a second AION runtime. No catalog/future row authorizes action. No live or M1 status changes result from this memo.

## 9. Tests: assertions read, not run; proposed AION falsifiers

The following are **static test-source observations only**, not passing counts or functional verification:

- `tests/integration/engines/send-resilience.test.ts:100-118`: one thrown transport error followed by reconnect is expected to call send twice. **Invert** that expectation for AION uncertain effect.
- `tests/unit/engines/chat/chatgpt-adapter.test.ts:74-114,121-184,224-272`: asserts cookie auth/cache and paginated headers/DAG parse; cookie architecture is donor-specific and not a safe-path requirement for AION.
- `tests/unit/engines/unified-registry.test.ts:38-108`: register/dispatch, missing-key error, surface filters/exports and duplicate ID assertions. Does not establish schema/grant enforcement.
- `tests/unit/engines/policy-engine.test.ts:21-79`: read allowed, destructive/communication denied unless enabled, threshold and confirmation checks. Does not make kernel metadata bypass safe.
- `tests/unit/engines/execution-kernel.test.ts:57-176,180-222`: lifecycle journaling, block cases, token-presence success, exception and optional verifier. Tests themselves show presence-based token trust; not scoped durable authorization.
- `tests/unit/engines/request-queue.test.ts:19-120`: max concurrency, priority order, provider-capacity rejection, evict-existing-newest and timeout.
- `tests/unit/engines/streaming-protocol.test.ts:33-64`: block persistence and event order; accumulated final-store expectation differs from current source intent.
- `tests/unit/message-identity.test.ts:8-68`: consistent SHA256, changed content and provider-ID mode. Hash determinism is not exactly-once effects.
- `tests/integration/providers/plugin-lifecycle.test.ts:36-106`: general plugin manager integrity/hot-reload assertions, **not the lifecycle ProviderPluginRegistry production proof**. Avoid conflating similarly named plugin systems.

Other tests were **path inventory only**, including provider-plugin-registry, session-lifecycle/state-transition, idempotency-guard, mcp adapters, export parsers, stream-parser, OpenCodeClient and plan-validation-gate. No assertion coverage or pass claim for those.

Recommended narrow synthetic AION fixtures if Development selects any slice:

1. Transport dies after potential activation: keep original op/lock; no second send from reconnect, queue, alternate route or recovery.
2. EOF without terminal evidence, silence, malformed frame, truncated JSON, `[DONE]` split across chunks, CRLF, multiline data, oversized frame: no false checked completion and explicit coverage/failure.
3. Data line and blank delimiter arrive in different `feed` calls: retained frame, not dropped payload; wrong-session event ignored/refused, close wakes consumer with an error/gap.
4. Missing/unknown risk, malformed existential rule, `__confirmed:true`, arbitrary nonempty confirmation token: no bypass of AION grant/binding/reservation.
5. Artifact parser retains exact code bytes and range; CRLF/empty/unclosed/language punctuation cases; content remains untrusted data and is not executed or auto-opened.
6. Repeated equal user text is two possible legitimate turns; missing tool call ID cannot synthesize inconsistent call/result identity; orphan/skipped DAG parent and active-branch choice remain explicit.
7. Stale local model default, echoed thinking budget, fake upload attribute and `acknowledged:true` never become effective model/file/send receipts.
8. Synthetic redaction fixture proves **matched secret absent**, including URL/query, cookie/set-cookie, nested arrays and response body. Never use real credentials/private text as fixtures.

## 10. Read ledger, limits, and ROUND2 targets

### Documents/captures inspected

- Parent/repo instructions and parent graph report; primary migration manual; donor `docs/modules/{engines,api,storage,desktop}.md`; `src/ai/README.md`; MIT LICENSE and package dependency metadata.
- Dedicated `README.md`, `BATCH-GH-01.md`, all 27 `CARD.md` documents, complete 27-row `index.jsonl`; prior excerpts were read in batches, with current owning-source reads replacing excerpt-only interpretation where stated. Hash check covered all 27 indexed record paths, **not an independent byte-validation of every copied excerpt**.
- Synthesis `BATCH-C-002-HANDOFF.md`, `capability-map.md`, `duplicates.md`, `provider-matrix.md`, `taxonomy.md`, `track-b-seams.md`, `integration-queue.md`, and crosswalk-ledger records/metadata. Earlier “index_metadata_only” flags are historical capture-review depth, not proof the owning implementation was read then; this memo records the new local read depth separately.
- AION `STATE.json`, `DEVELOPMENT-MASTER.md`, `harvest/EXCHANGE.md`, core 29-row CSV, 105-row capability-universe CSV, and PACK-01/02 READMEs. Scope used the user's current READ ONLY direction rather than historical live permissions in STATE.

### Source files inspected versus only indexed

**Full or substantially complete implementation reads:** S01 legacy/lifecycle provider registries and base classes, primary config registry; S02 capability-resolution/unified-registry; S03 observation-tap/slave-read/provider-caps; S04 provider-conversation types and complete ChatGPT history adapter, ChatGPT/Claude export parsers; S05 streaming schema/artifact extractor/to-content-parts; S06 three SSE paths, streaming-protocol/request-queue/execution-memoizer/idempotency-guard; S07 execution-kernel/policy-engine/plan-validation-gate/confirmation-store; S08 command-language types/registry/context-binder; S09 OpenCodeClient, SDK client, MCP client/server adapter; S10 session-state-persistence/state-transition/two traffic recorders/logger.

**Bounded reads/signature/caller inspection only:** ConversationManager send path `326-725` and selected context/metadata calls; lifecycle manager transition/recovery `215-424` plus declarations; LiveCaptureEngine `1-340`; OpenCodeAdapter execute/cancel `131-309` plus method/terminal signatures; CLI JSONL parser `85-184`; action-plan validation/schema declarations; capability default handlers `1-150,660-1029`; browser defs input/types/registry/observe plus extract excerpts; boot capabilities/lifecycle/stores caller slices; conversation history-sync/organizer/context-assembly signatures; manifests and taxonomy captured ranges. Don't infer full control-flow audit from a symbol listing.

**Unread/only path-inventoried:** most of 1,051 `src` files and 672 frontend files; most tests; complete generated protocol/taxonomy sources; full seed manifest remainder; schema migrations/store implementations; boot orchestrator remainder; provider onboarding/discovery internals; stream parser sandbox loading/repair internals; AI plugin manager/certifier/security boundaries; tool orchestrator; actor/fleet/Governor implementation; workflow engines/scheduler; media/image generation; frontend rich artifact rendering; desktop sidecar. No generated/vendor/raw/runtime-state data ingestion. Excluded private roots remain excluded, not missing research proof.

### New local hashes for small-unit custody

| Local file (same donor HEAD) | SHA-256 |
|---|---|
| `src/engines/parsers/artifact-extractor.ts` | `06784427a523354f51a5e8a34ff1444a40f8bd14453297fd7747775230087a75` |
| `src/engines/parsers/sse-parser.ts` | `97a316c3c93ff2f28ee0761d70bf5db5192ae0a472412c94c6d1a1b2bb5c0d35` |
| `src/schema/streaming.ts` | `e5ce9193b41e8472d256fecf39da8758286ddd4ff4e037e0a76664c779aa2e78` |
| `src/engines/action-plan.ts` | `49019457d9780eb9e9e0a5fedf9f87f97aaf524be12d0fb3822434cd82e2417f` |
| `src/engines/opencode/opencode-client.ts` | `c88d1eb5452b9c73a474543065d8ed027a436bea44952b37473c396623502bc7` |
| `src/observability/traffic-recorder.ts` | `d1c5466e3cc1c29f7394d2b707b089a618d3adac68ca8ed3a67fb92f849b74be` |
| `src/observatory/traffic-recorder.ts` | `47383d77a502e7cd01ef9db7b124331107f28102ed497e74bbabbf9fd7f54a93` |
| `src/intel/nlcl/types.ts` | `d5aa8d0cf3fb108038edc6eafdb881451ceaf9eba42ccbc2696f66c7bbc08c98` |

### Targeted ROUND2 questions, in leverage order

1. **Native receive:** compare only `getSessionMessages`/CLI part projection with current AION P5 source. Which identity/role/tool fields are missing? Inspect native transcript projection tests and stream-close/wrong-session fixtures; no need for donor supervisor or API/network call.
2. **Structured output:** inspect active parser/front-end artifact callers and tests for `ContentPart` source/tool/file fields; decide smallest pure projection and explicit truncation. Is artifact-extractor dead experimental code or is there a different active extractor? Fix-thinking and exact-code-byte fixtures before reuse.
3. **Uncovered P0 commands:** locate actual owners (not seeds/generated taxonomy) for provider UI rename, prior-message edit, regenerate, model/thinking/mode selection, generation Stop, and steer. Separate browser/native/local-DB realizations and inspect a handler plus actual caller/test for each. If none is found, record unresolved instead of inventing support.
4. **Migration fidelity:** resolve broken NLCL shim/type relative imports and actual bootstrap reachability by static import graph, comparing `src/engines` and `src/intel` copies. Which interface is genuinely loaded? Do not run migration/typecheck in harvest.
5. **Browser source:** inspect actual Governor harness submit and grounded target resolver, provider protocol source ownership and onboarding readiness gate. Can any small exact-target/read-only observer unit outperform the existing PACK-02/AION implementation? Treat network/console stubs and attribute upload as counterexamples.
6. **Policy/certifier:** inspect actual router admission paths around UnifiedCapabilityRegistry, alpha kernel and plugin certifier to determine whether confirmations are checked upstream and which externally reachable path can set metadata. Pure unknown-risk predicate is not whole-path assurance. Scope a security review separately before adopting authority-bearing code.
7. **Streaming:** inspect current StreamParserEngine's DB/sandbox parser loading, incremental schema validation and repair rules, plus active API parser tests; choose one well-bounded framing routine or retain AION's existing parser. Preserve EOF≠verified-completion and gap signaling.
8. **Persistence/privacy:** inspect only store contracts/implementations for reviewed audit/blocks, and synthetic redaction tests; compare to existing AION minimized cursor/ledger. No raw transcript or traffic collection is required.
9. **Automation/media/tools:** inspect workflow cancellation/retry owner, tool orchestrator approval path and one actual image/media adapter only if Development selects these future families. No inference from names or success echoes.
10. **Secondary VIVIM:** if canvas interaction becomes relevant, separately inspect `vivim-rebuild/src/{adapters,ports,state}` and its own tests/license/entrypoint with file hashes. Keep docs/media/private context excluded; do not assign vivim-final's HEAD or assume common ancestry.

**Handoff:** parent can structurally compare the 40 rows with the current catalog, the 29 C rows with core CSV, and the 65 future IDs with the universe; then choose any bounded follow-up. Parent owns final source validation, integration tests and live acceptance. No passing test, working provider capability, adoption, or milestone is claimed by this memo.
