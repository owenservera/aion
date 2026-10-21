# External Nine — First-pass Development handoff (2026-10-20)

**Scope:** static code inspection of all nine vendor snapshots already on AION `main`; no donor execution, offline suite, host/browser test, source transplant, or implementation acceptance. **Source pins:** GitHub PR #53 custody and PR #54 import; these are upstream commit SHAs, **not** the AION vendored file Git blob SHAs. Worker-owned state: [WORKLOG](../../workers/nine-repo/WORKLOG.md). Exchange records are the **only** outward NEED/OFFER/GAP queue: [EXCHANGE.jsonl](../../../EXCHANGE.jsonl).

## Development first: I0 / I1 before feature harvesting

### Owner scope update and source-review correction — 2026-10-20

The owner now requests deep investigation of the **full command set**, not only the initial watch slice or P0 subset. Earlier I1-only harvesting restrictions below are historical prioritization, not the current research boundary. Preserve source custody and AION's existing execution model; the owner is not asking for another independent command server.

**Important correction:** “not proven” must not be interpreted as “no implementation source exists.” The earlier lifecycle/model/thinking/steer coverage statements are incomplete. Parent directly confirmed the following routes in the captured MIT `chatgpt-bridge` at `0ffdae90239988f253058c05253226152acd55d2` (`landing/donors/chatgpt-bridge/`):
- `src/routes.js:550`: `POST /requests/:requestId/steer`.
- `src/routes.js:564,568`: `GET /models`, `GET /efforts`.
- `src/routes.js:594-627`: file list/upload/from-path/download/delete routes.
- `src/routes.js:650-666`: session list/new/select/delete routes.
- `src/routes.js:948,958`: session messages and `/chat` routes.

These are source-backed provider-specific functionality, not just generic CDP/UIA primitives. Next inspect their handler-to-browser implementations (`browserBridge.js`, extension composer/attachment/session/resume command modules), exact semantics, dependencies, retries and test fixtures. A route name alone does not establish working end-to-end behavior or AION integration. No exact P0 coverage total is accepted yet. Rename, message-edit and response-regenerate were not found in the bounded pass; treat them as **not located**, not exhaustive absence.

The existing `ops/command-space/EXTERNAL-IMPLEMENTATIONS-COVERAGE.*` comparison covered only five donors and omitted Bridge/CDPilot/Cereon; it cannot support an all-nine negative claim. Read source beyond those summaries. Cereon's bounded accessibility tree/element registry/CDP session manager and CDPilot's frame-routing/WebMCP tools are captured reusable foundations, not a verified complete ChatGPT command implementation. Cereon's tool count must not be confused with the AION P0 count. GPL source requires compatibility review, not an unsupported blanket “incompatible” claim.

**Scope counts verified locally:** `ops/command-space/CORE-OPERATIONS.csv` has **29 semantic operations: 19 P0 and 10 P1**. `aion_command_matrix.csv` has **40 distinct commands / 1,000 mapping rows**. Reconcile the core subset with the full matrix; do not restrict the next investigation to the owner's earlier “18” shorthand.

**Own-repo bodies also inspected:** Omega `vivim-omega/items/VO-GH-0008/source/session.ts` at `79ee558d6c7ea77c20f220db2341adaa57b11d44` (capture-reference/session-record pattern); VIVIM `vivim-final/items/VF-0014/excerpt.ts` and `VF-0017/excerpt.ts` at `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (observation stub/stream-event vocabulary); VOMEGA `vomega/items/VM-CLI-0019/source/session.ts` and `VM-CLI-0028/source/boot.ts` at `12c853259f60cf3a883c7fb1c9f329d696606d64` (revision/world-digest stale-result rejection and fail-closed boot). This bounded pass found no missing email extractor or Windows-startup shortcut; it does not establish their value across the full 40-command scope. Compare them again where a concrete full-set capability warrants it; preserve the existing captures instead of cloning/regenerating everything.

1. **I0 `receive.contract` (AX-0007):** take *ideas* from `chatgpt-bridge/src/bridge/observedTurns/observedTurnJournal.js:16-42` (streamEpoch, monotonic sequence, retained-from, reset/gap); `src/bridge/observation/turnEvidence.js:33-73` (terminal evidence requires more than stop/idle); and `multi-ai-chat/src/content/responseTracking.ts:36-59` (reject late/orphan answers without current-turn confirmation). Adopt only into AION's already-selected event/1 + snapshot/1 validators, with distinct binding/conversation/message/operation identities and explicit incomplete-history handling. Donor source is **not** an I0 contract.
2. **I1 `receive.transport` (AX-0008):** `chatgpt-bridge/src/http/observedTurnStream.js:3-51` encodes epoch:sequence SSE IDs, gap/reset/ready events; `test/remoteBrowserBridgeInitialCursor.test.js:22-93` contains synthetic cursor-restoration tests. This is a **pattern** for resumability, **not** an AION Chrome native-messaging implementation. The AION MV3→native host→CLI hop must remain **read-only data**. Compare push hint + authoritative snapshot, not full unbounded transcript broadcast.
3. **I2 `send.correlation` (AX-0009, **after I1**):** `multi-ai-chat/src/content/sendConfirmation.ts:1-59` supplies prompt-match and user-turn confirmation helpers, with negative tests in `test/sendConfirmation.test.mts`. `chatgpt-web2api/src/chatgpt_web2api/turn_anchor.py:73-109,516-566` uses captured user-message ID first and refuses ambiguous/unready backend mapping; **backend/private ChatGPT access is NOT recommended for transplant**. Preserve AION's single selected actuator, one effect per op, original Bus grants/ledger, never retry unknown effect.
4. **Negative evidence worth implementing first:** stop-looking DOM while still streaming; old answer after remount; empty assistant shell; late response from failed retry; stream-epoch changed; cursor before retained range; same-text rapid consecutive turns; no matching new user message; backend unavailability; page input ambiguity. Tests exist in donor snapshots but **have not been run here**.

## Nine donor reality map: one snapshot, one distinct engineering purpose

| Donor / pinned upstream commit | License | Source-observed core and evidence | AION disposition / limitation |
|---|---|---|---|
| **chatgpt-bridge** `0ffdae90239988f253058c05253226152acd55d2` | MIT | `observedTurnJournal.js`, `passiveObservationRouter.js`, `turnEvidence.js`, `observedTurnStream.js`; tests `observedTurnJournal.test.js`, `turnObservationEvidence.test.js`, `remoteBrowserBridgeInitialCursor.test.js` | **PRIMARY research owner** for receive stream/cursor and passive observation. ADAPT_PATTERN only. Journal alone does not give a validated AION per-binding snapshot, and its source runtime is not the AION Bus. |
| **multi-ai-chat** `cdcf6a7fb05609b219fd85395a116f26476a7f92` | MIT | `src/content/{chatgptDom,responseTracking,sendConfirmation}.ts`, `src/content/{claude,gemini,grok}.ts`; `test/{responseTracking,sendConfirmation}.test.mts` | **PRIMARY research owner** for multi-provider DOM adapters and cautious send-observation helpers. ADAPT_PATTERN; do not use automatic Enter/click fallback as a Send safety mechanism. |
| **parallel-ai** `944276d8146d11d5719a83cc550de31e4354a1c4` | MIT | `content-scripts/{text-injection-handler,file-injection}.js`, `src/shared/lib/providers.ts`; cross-provider tests under `tests/content-scripts/` | **PRIMARY** files/attachments discovery; **complement** provider coverage/iframe cases. ADAPT_PATTERN; text injection handler can auto-submit and retry input discovery, not a safe AION effect receipt. Some tests/configs use Playwright; forbidden for new AION work. |
| **council** `92845be5e8c1c30e2012c59fc51008aaaf11572e` | MIT | `src/content/providers/{dom-provider-adapter,provider-config}.ts`: configured ChatGPT/Claude/Gemini/Grok layouts; simple MutationObserver output updates | **BACKUP** small configurable DOM adapter, **not** receive identity. Its broad observer lacks per-conversation cursor/gap and invokes button/Enter submission. |
| **chathub** `852efba00ca7f2888093510b3add33f3ee01dc9b` | GPL-3.0 | `src/app/bots/abstract-bot.ts` adapter/stream abstraction; `chatgpt-webapp/index.ts` calls provider private backend | **REFERENCE ONLY** for API-vs-web distinction. No code copying before GPL compatibility review; private backend route does not guarantee current authenticated provider web thread. |
| **chatall** `6d089c2ab72dde2ba1010cc1e910ceb766458546` | Apache-2.0 | `src/bots/Bot.js` adapter abstraction; `src/bots/openai/ChatGPTBot.js` private session/backend API and local chat context | **REFERENCE** for provider family abstractions, later. Does not solve watch-only exact web thread; its local chats are distinct from provider source of truth. |
| **chatgpt-web2api** `497527dceabfa3f95961e23c291e618c5570f1ac` | MIT | `src/chatgpt_web2api/{turn_anchor,completion_detector,session_key}.py`; `tests/{test_turn_anchor,test_end_turn_primary}.py` | **DIFFERENTIATED receive/completion alternative** to DOM: map-based anchored correlation, end_turn detection. Study failure guards but **REBUILD** as permitted page-observed evidence where possible; private backend and authorization/fidelity risks. |
| **cdpilot** `234d8bf3d1c0144792654bf670f07f93ffd8a1d3` | MIT | `src/cdpilot.py` Chromium CDP CLI, frame-aware selectors, commands and fixtures under `test/` | **PRIMARY** generic CDP diagnostic *research*, not provider-message semantics. Do not introduce as second AION controller or authorized actuator. |
| **cereon-browser-operator** `06da45090607dd9c9dc883ef5d523e9c99bcdb24` | MIT | `src/background/cdp/{cdp-manager,observers/cdp-event-observer}.ts` and `src/content/accessibility/tree-builder.ts`: one debugger observer fanout and bounded DOM/accessibility representation | **ALTERNATIVE/complement** for MV3 CDP diagnostics and bounded inspection; extra debugger privileges and separate command transport, not P0 receive semantics. |

**All nine source roots:** `workspace/aion/ops/chrome-relay/harvest/external/landing/donors/<donor-id>/`. The source trees total 2,484 tracked files at their imported pins (PR #54). Counts and licenses are custody-reported; key paths above were actually fetched and inspected. This is **breadth-first triage**, not line-by-line validation of every file or all 19 Command Space P0 IDs.

## Capability → alternatives without forcing one runtime

| Canonical topic | Primary research pattern | Genuinely differentiated option / limitation | Recommendation to Development |
|---|---|---|---|
| `receive.identity` | Bridge passive observation + epoch/sequence + terminal classifier | Web2API captured-message-ID/backend tree anchoring; multi-ai-chat DOM baseline & retry checks | AION typed DOM watch contract first. Borrow reset/gap and fail-closed detection, not whole bridge/backend. Exact reply check remains AION acceptance. |
| `receive.transport` | Bridge SSE event ID, resumable cursor, `stream.gap/reset` | Cereon SSE is **remote command ingress**; not equivalent read-only outbound host IPC | AION native IPC needs its own data-only event + snapshot proof. Treat bridge as resume-pattern reference. |
| `send.correlation` | Multi-ai-chat user-turn/prompt match negative checks | Web2API primary captured user ID and backend terminal traversal, but private route | One AION authorized Send + independent user/assistant observation; refuse unknown state; no retry fallback. |
| `provider.family` | Multi-ai-chat provider DOM modules | Parallel-ai offers wider provider/file behavior; Council simpler shared selectors; ChatALL/ChatHub app/API adapters | Provider-specific per-surface profiles later, no generic one-size-fits-all Send selector; target account fidelity required. |
| `file.tools` | Parallel-ai file injection + provider file input selection | ChatHub/ChatALL app/API upload is not exact web composer upload | Research-only; negative cross-provider fixtures before granting attachment effects. |
| `chat.lifecycle` | Parallel-ai / Council some browser tab/new chat affordances | No inspected donor proves comprehensive rename/edit/regenerate/steer/model/thinking with same-thread identity | Mark unsupported, do not manufacture a P0 implementation claim. |
| `browser.cdp.diagnostics` | cdpilot generic CDP frame/element CLI | Cereon MV3 debugger observer + bounded accessibility tree | Offline diagnostics/reference; do not route AION effect execution through both. |

## Immediate engineering handoff: three bounded requests

**H1 / P0** — Development freeze `event/1` + `snapshot/1` validation and add negative fixtures for: epoch mismatch, lost retained cursor, stale/remounted assistant output, ambiguous same-text turn, no `complete_history` proof. Evidence: Bridge journal and passive router; multi-ai-chat response tracking. **No donor code promotion required.**

**H2 / P0** — Development prove data-only MV3→host push hint plus exact-bound authoritative snapshot, using Bridge SSE reset/gap semantics as comparison. Test that malicious received text and a synthetic `send` string cannot reach the effect Bus.

**H3 / after I1** — Development choose a single explicit Send actuator, record before/after unique user node, then independently check the paired assistant with no uncertain-effect replay. Harvest offers multi-ai-chat pure checks and Web2API comparison only; **never copy the unsafe action orchestration**.


## High-value source-level counterexample — do **not** copy Bridge replay blindly

`chatgpt-bridge/src/bridge/observedTurns/observedTurnJournal.js:43-49` computes `filter(sequence > after).slice(-safeLimit)`: if retained unconsumed turns exceed the response limit, it returns the **newest** N, silently omitting earlier retained turns. `src/http/observedTurnStream.js:49` calls that list during SSE replay, while `classifyCursor` only checks whether the request is before the *retained* range, not whether pagination skips within the retained range. **Code-inspected potential loss mode, not executed proof.** Add a negative fixture with 150 retained turns, `afterSequence=0`, `limit=100` and require explicit gap/pagination rather than marking contiguous replay. Further, `classifyCursor` checks `after>latest` only if the supplied epoch is empty; test an ahead-of-stream cursor **with matching epoch** too. AION should use ascending bounded pages or refuse coverage, never interpret a tail window as complete history.

## Risks, outstanding decisions and exclusions

- **AX-0004:** first-pass nine-repo roles and duplicates are evidenced; full 19-P0-by-donor command rubric and all relevant code paths are **not yet completed**. Keep NEED in investigation until acceptance.
- **AX-0006:** Bridge earns **provisional primary research ownership** for cursor/stream; it does **not** close the missing AION receive contract/identity proof. Keep GAP open.
- **AX-0008:** no donor has been verified as implementing the exact AION read-only native IPC transport contract; build/test in AION.
- **Do not deep-harvest** ChatHub/ChatALL bot wrappers, Web2API private endpoints, duplicate provider selectors, second CDP effect runners or an alternative effect ledger for I0–I3.
- **Priority after I1–I3:** parallel-ai file path / provider differences, targeted lifecycle gaps, model/thinking controls. Research features stay separate from actual available authorized actions.
- **Verification:** static GitHub source inspection only. Unit tests were *read*, **not run**. No Windows state, live browser state, current upstream HEAD, legal compatibility beyond license identification or AION acceptance claimed.

**Next worker move:** expand source-backed negative-fixture cases and outstanding P0 Command Space rubric only where Development remains blocked; avoid rerunning earlier 65-row Omega/VIVIM crosswalk.

---

# Current correction and supersession — 2026-10-21 (round-2 harvest, all nine donors)

This section **supersedes and corrects** the sections above where they conflict. Nothing above is deleted; the earlier text remains the dated 2026-10-20 record. Where the two disagree, the correction below is the current one.

## Correction 1 — AION already owns the canonical receive contract, journal and Bus. The "missing" claims are stale.

The 2026-10-20 statements *"Journal alone does not give a validated AION per-binding snapshot"* (donor reality map) and the `U` cells for AION in the coverage CSV were a **dated snapshot of a pre-PACK state**. As of the current branch (`integration/i1-watch-20261020`, HEAD `51eeac81`) AION already contains the adapted contract and journal, verified by reading the files on this machine:

| AION file | Verified content |
|---|---|
| `workspace/aion/ops/chrome-relay/extension/src/lib/conversation-contract.js` | Canonical `aion.conversation.event/1` and `aion.conversation.snapshot/1` validators; exact binding (`provider`, `account_key`, `conversation_id`, `ref`, `revision`); cursor (`epoch`, `sequence`); coverage flags `complete_history` / `bounded` / `ambiguous_identity`; `projectObservedMessage` keeps untrusted DOM objects out of the canonical record. |
| `workspace/aion/ops/chrome-relay/extension/src/lib/receive-journal.js` | `BoundedReceiveJournal`. `readPage` returns the **first unseen N** — `filter(item => item.sequence > after).slice(0, count)` with the in-file comment *"FIRST unseen N, never donor's tail slice(-N)"* — i.e. **ascending paging**, the exact defect the donor had. `classifyCursor` rejects `after > latest` **"regardless of whether caller supplied the correct epoch"** → `sequence_ahead_of_stream` (the same-epoch-ahead case is covered); `gap` for a cursor before the retained range; `complete_history` is false whenever coverage is truncated or a coverage issue exists. |
| `workspace/aion/ops/chrome-relay/extension/src/lib/terminal-evidence.js` | Conservative terminal evidence adapted from Bridge `turnEvidence.js`; result labelled *inferred*, never verified. |
| `workspace/aion/ops/chrome-relay/extension/src/providers/chatgpt/profile.js` | Read-only ChatGPT inspection profile adapted from **multi-ai-chat** `src/content/chatgptDom.ts` — the MAC selectors are **already adapted**. |
| `workspace/aion/ops/chrome-relay/extension/src/providers/chatgpt/response-boundary.js` | Pure read-only anchoring adapted from multi-ai-chat `src/content/responseTracking.ts`; fails closed with `no_confirmed_user_message` / `user_anchor_absent_or_ambiguous` / `ambiguous_assistant_candidates` / `assistant_empty_incomplete_or_provisional`. |
| `workspace/aion/ops/chrome-relay/extension/src/providers/chatgpt/observer.js`, `passive-lifecycle.js` | Observer and passive lifecycle surfaces. |
| `workspace/aion/ops/chrome-relay/extension/src/bus/{bus,ledger,grants,contracts,validate,registry}.js`, `extension/src/lib/chatgpt-tasks.js` | The Bus, its **effect ledger**, grants/contracts/validation and the task layer **exist**. |

**Consequences:** (a) any earlier claim that AION "lacks a ledger, cursors or a terminal classifier" is **false against current source**; (b) Bridge's replay-truncation and ahead-of-stream counterexamples below are **already mitigated in AION's own code** — they remain negative-test obligations, not open implementation gaps; (c) harvest must target *new* seams (artifact/result integrity, typed results, fault matrices, readiness/checkpoint reconciliation), not re-deliver I0/I1 primitives. The coverage comparison carries the same caveat verbatim and is owned elsewhere: `workspace/aion/ops/command-space/EXTERNAL-IMPLEMENTATIONS-COVERAGE.md` (and `.csv`) — **link to it, do not restate its 40×9 data here.**

**Correction 2 — the earlier "do not deep-harvest" list is superseded.** The guidance *"Do not deep-harvest ChatHub/ChatALL bot wrappers, Web2API private endpoints, duplicate provider selectors, second CDP effect runners or an alternative effect ledger"* was correct only as a first-pass economy. The owner has since asked for the **full** command set, and the owner has now clarified the intent: **do all of it, in strategic order — this is not a permanent development pause.** The updated order is: *save the harvest evidence → record the strategy/priority ordering → then selected adaptation and verification.* The only remaining exclusions are donor-runtime promotion, private-credential paths, and second actuators.

**Correction 3 — evidence tiers are now stated explicitly.** Every claim in this document carries one of three tiers, and they must never be merged:

- **SOURCE_INSPECTED** — the named file was opened and read on this machine in this session.
- **TEST_READ** — a donor test file was read as a *method specification*; it was **not executed**.
- **EXECUTED** — run here, with a receipt.

This session produced **SOURCE_INSPECTED** and **TEST_READ** records only. **No donor test, AION test, live browser action or network call was executed, and no live acceptance was performed.** Structural fixtures are not runtime acceptance, and a 40×9 status grid is **not** 360 working capabilities. **No nine-360 / nine×36 fullset certification is claimed**; that decision belongs to the parent session's machine validation.

# Harvest round 2 — grounded per-donor findings (all nine, SOURCE_INSPECTED)

Donor roots are `workspace/aion/ops/chrome-relay/harvest/external/landing/donors/<donor-id>/`. Paths below are repo-root-relative.

## chatgpt-bridge — `0ffdae90239988f253058c05253226152acd55d2` (MIT)

- **Real server handlers exist** and are not hypothetical: `src/routes.js:550` `POST /requests/:requestId/steer`; `:564` `GET /models`; `:568` `GET /efforts`; `:594-633` file list / upload / from-path / download / delete; `:650-676` session list / new / select / delete (delete demands `sessionId` **and** `expectedUrl`, and the content-side handler additionally seeks a confirmation and checks disappearance — `tools/chrome-bridge-extension/content/sessionCommands.js`). Extension-side handlers are real too: `content/sessionCommands.js`, `content/attachmentCommands.js`, `content/composerCommands.js`, `content/intelligenceCommands.js`, `content/requestPromptCommands.js`, `content/requestResumeCommands.js`.
- **`POST /sessions/:sessionId/messages` is a SEND, not a history reader** — `src/routes.js:948-956` calls `bridge.sendRequest(...)`. Nothing in the inspected surface exposes "read the existing thread history" through that route.
- **Two different retry policies exist and must not be conflated.** `tools/chrome-bridge-extension/shared/commandManifest.js:179` defines command `intelligence.apply` with `retryPolicy: 'never'`; `src/bridge/requestExecutionPlan.js:6` defines the *internal step* `model.apply` with `retryPolicy: 'if_unconfirmed'`. Different command, different layer, different policy. `src/bridge/hub/commandSender.js:45-49` infers `intelligence.apply` preconditions (model/effort) from the payload.
- **Fail-open to copy as a counterexample, not as a method.** `tools/chrome-bridge-extension/content/requestPreparation.js:131-169` records `result.warnings.push('Could not find model option: …')` / `'Could not confirm model selection: …'` and **continues**. AION must fail closed on a model/effort mismatch instead.
- **New high-leverage reusable artifacts:**
  - `tools/chrome-bridge-extension/artifactParserCore.js:319-443` — `scoreArtifactActionCandidate` scores candidate controls (exact filename 240, exact action label 180, exact block range 120, …, selector match 2) and then **refuses**: `artifact_action_identity_not_found`, and on a score tie `artifact_action_identity_ambiguous`. Line 357 states the rule plainly: *"A selector hint is never identity."*
  - `tools/chrome-bridge-extension/shared/transferIntegrity.js` — `describe()` / `verifyBytes()` over `size`, `encodedSize`, `totalChunks`, `encoding` and a SHA-256 `sha256`; `MAX_RAW_SIZE` 128 MiB, `MAX_CHUNKS` 4096; `verifyBytes` throws `TRANSFER_INTEGRITY_INVALID` on raw-size or digest mismatch.
  - `src/workflow/result/resultProtocol.js` — typed result protocol: manifest `version: 1`, status ∈ {`changed`,`unchanged`,`completed`}, **producer correlation** (`name`, `workflowId`, `requestId`, `projectId`) compared against the expected producer, safe relative paths only, duplicate-path rejection, `.patch`/`.diff` output rejected, private/internal registry URL check in `package-lock.json`, and a returned `reasons[]` list. `reconcileResultManifestAgainstPlan` makes the **apply plan the source of truth** and treats the manifest file list as advisory.
  - `src/workflow/artifactVerifier.js` — size cap and SHA-256 identity checked **before** the result is applied.
  - **Fault matrices (TEST_READ, not executed):** `test/backgroundFaultInjectionMatrix.test.js`, `test/browserEffectReconciliationMatrix.test.js`, `test/requestFaultInjectionMatrix.test.js`, `test/workflowControlFaultMatrix.test.js`, `test/workflowEffectFaultInjection.test.js`, `test/workflowLocalEffectFaultMatrix.test.js`.

## multi-ai-chat — `cdcf6a7fb05609b219fd85395a116f26476a7f92` (MIT)

- **The selectors AION needs are already adapted** (`extension/src/providers/chatgpt/profile.js` ← `src/content/chatgptDom.ts`; `extension/src/providers/chatgpt/response-boundary.js` ← `src/content/responseTracking.ts`). MAC selector work is **not** new leverage for the ChatGPT surface; treat it as already-collected.
- `src/shared/autonomousRecovery.ts:34-59` — retry is permitted **only** with proof the Send was never activated (`submission === 'not_submitted'`); *"Uncertain or accepted submissions are never replayed."* Strict policy pauses for `manual`; best-effort returns `skip`. **A skip is not a replay.**
- `src/content/responseSerializer.ts` — code-block fidelity (longest-fence computation, a *replacer function* so `$&`/`` $` `` inside a code block are not rewritten), `tableToMarkdown` for tables, inline-code padding. Serializer **fidelity** candidates, incremental only.
- `src/shared/providerReadiness.ts:4-16` — readiness partition into ready/unready plus a three-way `noticeKey` (`undefined` / `input.readiness.partial` / `error.providers_not_ready`) → tri-state readiness candidate.
- `src/shared/workflowCheckpoint.ts` (checkpoint touch/current/failures/contributions) and `src/background/service-worker.ts:1282` `reconcileCheckpointRequest` → checkpoint-reconcile candidate. This is **workflow** recovery, **not** an AION receive cursor.
- Model/effort selection, attachments and in-flight steering were **not located** in the checked message/control surface (bounded `U`, not an exhaustive negative).

## parallel-ai — `944276d8146d11d5719a83cc550de31e4354a1c4` (MIT)

- **The wired engine is `content-scripts/text-injection-all-providers.js`** — imported by `src/content/chatgpt.ts:3`. The legacy `content-scripts/text-injection-handler.js` is *not* the path AION would be copying.
- `content-scripts/file-injection.js` assigns a `DataTransfer`/files input or dispatches drop events → a **queued or accepted injection is not verified provider attachment completion**. Bridge's chip + busy + error wait (`content/attachmentCommands.js:167-186`) is the **stronger attached-confirmation pattern**.
- `src/content/claude-model-fallback.ts:314-348` — effort/model normalization (`effortOptionsForModel`, `normalizedEffortForModel`) is **pure** and reusable. The same module's private completion-fetch rewrite (`/api/organizations/…/chat_conversations`) is a **private-endpoint patch → unsafe to copy**.
- `src/content/claude-workspace-sync.ts` mirrors the `lastActiveOrg` organization cookie. Organization/account selection is **not** project selection; this is **not part of the AION project scope**. Do not transplant cookies, private endpoints or credentials.

## council — `92845be5e8c1c30e2012c59fc51008aaaf11572e` (MIT)

- `src/stores/use-run-store.ts:16` initializes the stages `understanding/independent/review/revision/synthesis` with a **fixed** status vector (index 1 active, index 0 completed, the rest pending). The stages **never progress**.
- Only the **independent fan-out** is sent. `src/council/prompts.ts:7` `buildSynthesisPrompt` is defined; its only observed consumer is `tests/unit/prompts.test.ts` — **test-only**.
- `src/content/providers/dom-provider-adapter.ts:18,43` define `createNewConversation` and `stopGeneration`; the inspected run/router path **does not call them** → defined-but-unwired (**P**, not I). `stopRun` changes persisted status only.
- No completed run and no rehydration of a finished run were located; the adapter's last-element response read and broad observer carry **stale-previous-answer** risk and no exact conversation binding.
- **Do not claim a complete council engine.**

## chathub — `852efba00ca7f2888093510b3add33f3ee01dc9b` (GPL-3.0)

- GPL requires **use-specific compatibility review** — this is **not** a blanket "incompatible" claim, and **source copy is not approved** by this harvest.
- `src/app/components/History/Content.tsx:1,38` — **Fuse.js local history search exists** (a local feature, not provider-thread proof).
- `src/utils/sse.ts:22-26` — `event.type === 'event'` is the **parser discriminator**, *not* a filter requiring a **named** SSE event; unnamed data events are not inherently dropped by this code.
- `src/app/bots/chatgpt-webapp/requesters.ts:82` (and `client.ts:29`) retries after an **explicit 403** through the proxy path → an effectful request **can be re-sent**.
- `src/app/utils/export.ts` serializes sync/local storage and localStorage → exports can contain **keys and private transcripts**. Never copy values or raw exports into harvest evidence; no secret literal is reproduced anywhere in these documents.

## chatall — `6d089c2ab72dde2ba1010cc1e910ceb766458546` (Apache-2.0)

- **ChatALL does implement a local message copy**: `src/components/Messages/ChatResponse.vue:367-374` `copyToClipboard()` — strips tags with a regex when `format === "html"`, writes to the clipboard, and tracks a matomo "copy" event. This is a **local UI affordance**, not a provider-thread effect.
- **Update-loss counterexample:** `src/store/queue.js:83` shifts the queue item **before** `await this.table.bulkUpdate(mergedMessages)` at `:97`. A failed bulk update therefore **loses the queued update**.
- **Raw transcript export is not secret-free.** The settings export (`src/components/ChatSetting.vue`) removes bot-brand settings via `getSettingWithoutBotSetting`, but the brand namespace is `chatGpt` (`src/bots/openai/ChatGPTBot.js:14 static _brandId = "chatGpt"`); a namespace-scoped redaction keyed on `chatgpt` **misses it**. Per-brand settings redaction is namespace-sensitive and is not a secret-safety proof.
- **SSE `CLOSED` is transport termination, not completion.** The `CLOSED` handling in `src/bots/ClaudeAIBot.js` (and the other SSE adapters) marks the **connection** closed; it is **not** independent proof that generation succeeded.
- Local chats are distinct from the provider source of truth, and local queueing/fan-out is **not unique** to ChatALL.

## chatgpt-web2api — `497527dceabfa3f95961e23c291e618c5570f1ac` (MIT)

- Backend conversation IDs **may** name the same web thread; current authenticated equivalence is **unproven** — neither categorically impossible nor proven.
- **Good reusable patterns:** `src/chatgpt_web2api/breakers.py` — a **non-rate-limit circuit-breaker registry** whose breakers **downgrade health only**; semantic **shape-drift** detection on responses; **lock-key re-check** before acting.
- **Unsafe to copy:** `src/chatgpt_web2api/api_server.py:546` wraps the **whole send** in `retry_on_rate_limit(self._driver, _send_and_collect)` → a rate-limit retry can **re-execute an already-performed send**.
- **Default/fake model fallback counterexample:** `src/chatgpt_web2api/cdp_driver.py:1122-1208` may fail to find the requested model or picker and continue with the **active** model; static/fallback model catalogs are not truthful live availability.

## cdpilot — `234d8bf3d1c0144792654bf670f07f93ffd8a1d3` (MIT)

- **Replay hazard, body verified:** `src/cdpilot.py:3769-3787` resends a batch on a reused connection when no responses arrived. **No response does not prove no effect** — an unsafe replay counterexample, not at-most-once delivery.
- Reads are **selective**, not a full 20k surface; a `NOT_LOCATED` result is **scoped to the cited checked boundary** and is not an exhaustive repository-wide negative.
- **Good behavioural specifications (methods, not code):** receipt redaction — `src/cdpilot.py:19100-19289` (`«redacted:N chars»`, `_slog_redact_value`, `_slog_redact_json`, `javascript:`/secret-arg redaction); fake-wire fixtures; reason-code shapes; a validator subset. The **redaction tests were READ, not executed here.**
- `src/cdpilot.py` is a large Python monolith (17k+ lines) that requires `websockets` → **high port cost**. **No runtime server/controller transplant.**

## cereon-browser-operator — `06da45090607dd9c9dc883ef5d523e9c99bcdb24` (MIT)

- `src/content/accessibility/tree-builder.ts` + `src/content/accessibility/output-budget.ts` — bounded accessibility tree with role/name/open-shadow traversal. `OutputBudget` truncates by appending the inline marker `"\n... (truncated)"` → **weaker than AION's structured truncation** (`text_truncated` boolean + explicit coverage flags in `conversation-contract.js`).
- `src/shared/ring-buffer.ts` — `push()` **silently** evicts the oldest item at capacity, with **no gap or coverage signal**. A consumer that treats the buffer as a complete window inherits silent loss; it must never be used as a receive window without an explicit coverage flag.
- `src/background/content-bridge/content-bridge.ts:60-66` — `sendWithInjectFallback` catches **any** failure, injects the content script and **re-sends the same message** → the effect may already have occurred (**effect duplication**).
- `src/background/cdp/cdp-session.ts:45-47` exposes **arbitrary** `chrome.debugger.sendCommand`, and `syncDeviceMetrics` (`:67+`) overrides device metrics (mutating). Extra debugger privilege and page mutation — diagnostic-only unless Development explicitly authorises it.
- `src/background/tabs/tab-group-manager.ts` with `src/shared/brand.ts:17-19` — tab-group/title adoption is a UI grouping, **weaker** than exact provider/account/conversation identity.
- `src/background/index.ts:87-99` — a keepalive timer keeps the MV3 service worker alive. AION's MV3 → native host → CLI topology is **different**, so the **keepalive benefit is unverified** for AION and must not be assumed.
- `src/content/accessibility/*` text output exposes form values (`form-input-tool.ts:21` echoes the full supplied value) → redact before any reuse; `upload-image-tool.ts` supplies **guidance only** — input upload is a **stub**, not an implementation.
- **Do not record "0 value" for Cereon.** The bounded inspector (role / name / shadow) remains an **optional** future diagnostic substrate. It is a **generic substrate**, not provider command coverage.

# Reusable candidate ledger (in-place; no new schema, no new board)

This ledger lives inside the existing handoff on purpose. It adds **no** schema, registry, backlog or PM board, and it does **not** restate the 40×9 coverage matrix. Columns: source path + symbols → problem solved → existing AION overlap → reuse form → risk → next evidence needed.

| # | Source (path + symbols) | Problem solved | Existing AION overlap | Reuse form | Risk | Next evidence needed |
|---|---|---|---|---|---|---|
| 1 | `chatgpt-bridge/tools/chrome-bridge-extension/artifactParserCore.js:319-443` `scoreArtifactActionCandidate` | Element identity by score, and **refusal** on tie/absence | `extension/src/providers/chatgpt/response-boundary.js` already fails closed on ambiguous/positional identity | Adapt the scoring rubric **and the refusal reason codes**; keep AION's `provider_dom_id` identity | Donor thresholds are ChatGPT-card specific; a low score must never mean "probably fine" | Dev negative fixture: equal-score candidates → `ambiguous`, not "pick the first" |
| 2 | `chatgpt-bridge/tools/chrome-bridge-extension/shared/transferIntegrity.js` `describe` / `verifyBytes` | Byte/chunk/digest integrity of a transferred payload | None yet — AION has no artifact transfer surface | Adapt module + AION-side unit tests | Chunk-count and encoding limits must be re-chosen for AION | Dev unit test: size mismatch and digest mismatch both refuse |
| 3 | `chatgpt-bridge/src/workflow/result/resultProtocol.js` `validateManifestShape`, `validateProducer`, `reconcileResultManifestAgainstPlan` | **Typed results** with producer correlation and a reason list | `extension/src/bus/contracts.js` / `validate.js` own AION's envelope contract | Adapt the *shape* (version/status/producer/reasons[]); keep AION's field names | The donor schema is ZIPFLOW/project-specific; do not import names | Dev negative fixture: producer mismatch refused before apply |
| 4 | `chatgpt-bridge/src/workflow/artifactVerifier.js` (size cap + SHA-256 before apply) | **Verify-before-apply** ordering | AION Bus ledger records effects but does not verify a returned artifact | Adapt the ordering rule (verify → then apply), not the ZIP code | Verification failure must abort the apply, not warn | Dev test: verify failure ⇒ no apply, no ledger entry |
| 5 | `chatgpt-bridge/tools/chrome-bridge-extension/shared/commandManifest.js:179` vs `src/bridge/requestExecutionPlan.js:6` | Separating **command-level** retry policy from **step-level** retry policy | `extension/src/lib/bounded-lifecycle.js`, `extension/src/bus/ledger.js` | Adopt the two-level naming (`NEVER` for the command, `IF_UNCONFIRMED` for the step) in AION policy tables | Conflating the two yields an unsafe retry of a write | Dev test: command NEVER vs step IF_UNCONFIRMED are not the same knob |
| 6 | `chatgpt-bridge/tools/chrome-bridge-extension/content/composerCommands.js:374-385` (`PROMPT_SUBMIT_NOT_EXECUTED` / `provenNotExecuted`, `PROMPT_SUBMIT_UNCERTAIN` / `retryable:false`, "automatic retry is forbidden") | Classifying a submit outcome **without guessing** | `extension/src/chatgpt/correlate.js`, `extension/src/lib/command-deadlines.js` | Adapt the error taxonomy (`provenNotExecuted` vs unconfirmed) into AION's lifecycle | Donor code is browser-automation shaped; only the taxonomy transfers | Dev negative test: unconfirmed submit never auto-retries |
| 7 | `chatgpt-bridge/test/{backgroundFaultInjectionMatrix,browserEffectReconciliationMatrix,requestFaultInjectionMatrix,workflowControlFaultMatrix,workflowEffectFaultInjection,workflowLocalEffectFaultMatrix}.test.js` | **Fault-matrix method** (TEST_READ) | AION has no equivalent matrix | Adapt the *method* into AION's test layout; do not import donor fixtures | Donor tests are **not executed here** and assume donor runtime | Dev reads and ports one matrix; records its own execution receipt |
| 8 | `chatgpt-bridge/tools/chrome-bridge-extension/content/requestPreparation.js:131-169` | A concrete **fail-open** on model/effort mismatch (counterexample) | AION must fail closed | Negative reference only — **do not copy** | Copying it silently sends with the wrong model/effort | Dev negative test asserting AION aborts instead of warning |
| 9 | `multi-ai-chat/src/shared/autonomousRecovery.ts:34-59` (`not_submitted` / `uncertain` / `submitted`, strict→manual, best-effort→skip) | Never replay an uncertain or submitted Send; skip ≠ replay | AION ledger rule "never retry unknown effect" | Align AION's vocabulary with the three submission states | The donor has heuristic retry branches elsewhere in the repo — do not generalize | Dev unit test over all three submission states |
| 10 | `multi-ai-chat/src/content/responseSerializer.ts` (code-fence / table / inline-code fidelity) | Loss-free text capture of structured answers | AION captures plain text only | Optional fidelity layer for captured assistant text | Rendering fidelity is **not** identity and must not enter the identity path | Dev snapshot test on one code block and one table |
| 11 | `multi-ai-chat/src/shared/providerReadiness.ts:4-16` (ready/unready + tri-state `noticeKey`) | Tri-state readiness instead of a boolean | `extension/tests/content-preflight.test.js` preflight exists | Adapt the tri-state naming and the partial-ready case | Readiness is not account/conversation binding | Dev unit test for all three notice states |
| 12 | `multi-ai-chat/src/shared/workflowCheckpoint.ts` + `src/background/service-worker.ts:1282` `reconcileCheckpointRequest` | Checkpoint shape and reconcile of in-flight work | `extension/src/lib/chatgpt-tasks.js` | Adapt checkpoint/reconcile shape | Workflow checkpoint ≠ receive cursor; keep the two separate | Dev unit test: reconcile is idempotent and does not duplicate a contribution |
| 13 | `chatgpt-web2api/src/chatgpt_web2api/breakers.py` (health **downgrade-only** breakers), semantic shape-drift check, lock-key re-check | Degrade health instead of hard failure; detect semantic drift; re-check the lock key before acting | AION Bus/ledger has no breaker tier | Adapt the three semantics | The donor reaches private backend paths — semantics only, no endpoints | Dev unit test: a downgrade never silently re-enables the path |
| 14 | `cdpilot/src/cdpilot.py:19100-19289` (`«redacted:N chars»`, `_slog_redact_value`, `_slog_redact_json`) | **Receipt redaction** shape (TEST_READ) | AION receipts | Adapt the *shape* and length-preserving placeholder into AION language | Donor implementation is Python; only the behavioural spec transfers | Dev unit test: a secret-shaped value never appears in a receipt |
| 15 | `cdpilot` fake-wire fixtures, reason-code shapes, validator subset | Offline behavioural specification without a browser | AION test fixtures | Adapt the method into AION fixtures | Spec only — says nothing about provider completeness | Dev fixture: one fake wire produces the documented reason code |
| 16 | `cereon-browser-operator/src/content/accessibility/{tree-builder,output-budget}.ts` | Bounded role/name/shadow inspection for diagnostics | AION `profile.js` is a targeted selector set, not a bounded tree | **Optional** future diagnostic substrate only | Its truncation marker is weaker than AION structured truncation; its text output exposes form values | Optional Dev spike after I1, with redaction and structured-truncation parity required |

**Explicitly not candidates:** donor runtimes, second effect executors, alternative effect ledgers, private-backend endpoints, credential/cookie paths, and any raw export or transcript containing keys.

# Per-operation donor semantics — chatgpt-bridge `0ffdae90239988f253058c05253226152acd55d2`

Paths below are relative to `harvest/external/landing/donors/chatgpt-bridge/tools/chrome-bridge-extension/`. Extracted by direct source read on 2026-10-21 (CODE_INSPECTED; no donor test was run). This sheet exists so Development does not have to re-derive readiness/refusal/reconcile rules from route names. It adds no schema and no board.

| AION op (donor command) | Precondition | Readiness probe | Typed failure / refusal | Reconcile evidence | Effect / retry |
|---|---|---|---|---|---|
| `send` (`prompt.send`) | Composer stable; non-empty message or attachments; `executionPlan` present and `executionStepOnly === true` (`shared/commandManifest.js:151,50-57`) | `waitForPromptSendButton` (`content/composerCommands.js:260`); composer text verified by `composerContainsText` (`:644`) before submit | `PROMPT_SUBMIT_NOT_EXECUTED` (provenNotExecuted), `PROMPT_SUBMIT_UNCERTAIN` (`retryable:false`), `submission_ack_timeout` carrying `lastReason` (`content/composerCommands.js:28-102`) | Strong: new user turn key absent from baseline **and** text matches → `new_user_turn`. A new turn with wrong text returns `new_user_turn_text_mismatch` (explicit non-success). `composer_cleared` / `generation_started` are weaker fallbacks allowed only when `requireUserTurn` is false (`:41-59`) | write; `never`; reconcile `submitted_turn`; reload `BROWSER_EFFECT` |
| `steer` (`prompt.steer`) | An active request exists in the tab; its `requestId` matches; message non-empty; effect descriptor present (`content/requestPromptCommands.js:390-400`) | Send control visible **and** no stop control for 350 ms; a regenerate button on a non-generating turn is treated as window-closed (`content/composerCommands.js:189-220`) | `STEER_WINDOW_CLOSED` (`provenNotExecuted`, `retryable:false`); `STEER_SUBMIT_NOT_READY` (`provenNotExecuted`, `retryable:true`); no-active-request / requestId mismatch / empty message (`:248-255`, `requestPromptCommands.js:396-400`) | New submitted user-turn anchor within 5 s (`waitForSubmittedUserTurnAnchor`, `replace:true`) plus `responseEpoch` incremented to `max(previous+1, requested)` (`requestPromptCommands.js:409-426`) | write; `never`; reconcile `submitted_turn`; `BROWSER_EFFECT` |
| `generation.stop` (`prompt.cancel`) | Active request matches `requestId`; otherwise `ACTIVE_REQUEST_MISMATCH` is settled **without execution** (`content/requestPromptCommands.js:361-372`) | `clickStopButton()` returns whether activation happened (`content/composerCommands.js:952`) | `ACTIVE_REQUEST_MISMATCH`; `ChatGPT stop control could not be activated` (`requestPromptCommands.js:378`) | Tab observation `cancel.effect.settled`; the handler does **not** force an absence-of-generation proof | write; `if_unconfirmed`; reconcile `generation_state`; `BROWSER_EFFECT` |
| `observe` | Chat page ready (`chatPageReadiness`), turn roots present, bounded settle `pageReadySettleMs` (`content/requestPreparation.js:39-105`) | Page-readiness gate with explicit `CHAT_PAGE_NOT_READY` on timeout (`:105`) | `CHAT_PAGE_NOT_READY`; `DOM_SCHEMA_CHANGED` where a required surface is missing | Snapshot identity is the **request's user turn key**, never an index — indices from separate DOM samples cannot prove chronology (`content/requestSnapshotPolicy.js:21-27`) | read; `always`; `SAFE_REPEAT` |
| `reply.read` | Assistant turn visible under the request's user turn key | `snapshotHasResponse` = answer text, artifacts or `hasFinalMessage` (`content/requestSnapshotPolicy.js:11-13`) | Explicit "No assistant response #n is visible" for recover variants (`content/responseRecovery.js:166-190`) | `terminalObservationEvidence`: eligible requires output **and** final-message/artifact identity **and** unblocked (no generating, streaming, stop, active tool, continue, confirmation, error; conversation matches) **and** (action-bar/regenerate/network-done **or** quiet ≥ max(2500 ms, terminalSettleMs)) → confidence high/medium/low (`requestSnapshotPolicy.js:60-92`) | read; `always`; `SAFE_REPEAT` |
| `history.read` (partial) | Visible/current turns only; no off-page enumeration | Bounded visible-turn collection | No specific code; truncation is the risk and must be surfaced | None — `response.recover.list` is a bounded visible-turn snapshot, not durable history (`content/responseRecovery.js:196`) | read; must not be presented as complete history |
| `recover` (`response.recover.*`) | Request identity (`submittedUserTurnKey`) known; candidate turn visible | `resolveRequestSnapshot` prefers the scoped snapshot, else the newest candidate whose `userTurnKey` matches, else returns `empty` explicitly (`content/requestSnapshotPolicy.js:29-38`) | "No assistant response … is visible in the current ChatGPT tab" | The returned `source` tag (`scoped` / `recent_assistant_turn` / `empty`) is an honesty field AION should mirror | read; `always`; `SAFE_REPEAT` |
| `stream` (partial) | Same as observe | `streamingVisible` from snapshot phase `STREAMING` or a visible stop control (`requestSnapshotPolicy.js:66-67`) | None specific | Completion is never inferred from "stop button vanished": eligibility needs strong UI evidence or a quiet window; MAC's longer-text rule covers the append-only gap | read; no wire-enum change |
| `sessions.list` | Sidebar rendered | Link collection | None | Sidebar-only; **not** complete account enumeration (`content/sessionCommands.js:77-95`) | read; `always` |
| `chat.open` (`sessions.select`) | `sessionId` (id or URL); chat page ready | Exact route identity: URL conversation id equals target **and** readiness ready **and** readiness URL equals `location.href`, stable for `pageReadySettleMs` (`content/sessionCommands.js:702-718`) | `No sessionId provided`; `Could not switch … route/readiness verification failed`; `Could not verify … ready and stable` (`:649-681`) | Returned session id + URL after the stable-route gate | write; `if_unconfirmed`; reconcile `conversation_identity`; `OBSERVATION` |
| `chat.create` (`sessions.new`) | Chat page ready | New-chat control or `/` navigation, then URL change or an 800 ms floor (`content/sessionCommands.js:637-647`) | None specific | **Partial:** may return a blank/home session before a durable conversation exists. AION must require a durable conversation id/route before claiming create | write; `never`; `TYPED_UNCERTAINTY` |
| `chat.delete` (`sessions.delete`; P1) | `expectedSessionId` + `expectedUrl` (`content/sessionCommands.js:297-304`) | Target asserted before menu open, before the destructive click, and before confirmation; delete action opened only for the current session (`:590-601`) | Target mismatch; `Delete confirmation dialog did not appear with a stable destructive action`; `still appears in the current URL after delete confirmation` (`:622,633`) | Conversation disappears from UI/URL within 12 s; a 2 s grace path may return `confirmed:false` when navigation wins the race (`:605-620`) — absence observed in the UI, not backend erasure | write; `never`; destructive; `TYPED_UNCERTAINTY` |
| `model.list` (`models.list`) | Composer intelligence trigger present | Picker opens; stable radio options from an embedded view or submenu (`content/intelligenceCommands.js:591-640`) | `DOM_SCHEMA_CHANGED` for missing picker, effort options, trigger or model submenu (`:595,602,605,639`) | Snapshot with `selected` flags and `capturedAt`; menus closed in `finally` (`:653-663`) | read (UI opens/closes only); `always` |
| `model.select` (`intelligence.apply`) | Same as `model.list` | Option matched by normalized label; already-selected short-circuits (`content/intelligenceCommands.js:666-720`) | **None — fail-open.** Unconfirmed selection becomes a warning (`Could not confirm model selection`) and the request continues (`content/requestPreparation.js:167-169`) | `readIntelligenceState` retried twice; `modelApplied` boolean (`:147-157`) | write; `never`; `READ_PROBE`. **AION must fail closed instead** |
| `thinking.level.set` (same command, effort axis) | Same as `model.list` | Effort slider ticks or radio options; same label matching (`intelligenceCommands.js:371-406,697-700`) | **Same fail-open** (`requestPreparation.js:168`) | `effortApplied` boolean after two reads | write; `never`; `READ_PROBE`. **AION must fail closed** |
| `file.attach` (partial; composer file input) | Attachment bytes (base64/content/URL) with optional integrity; an enabled file input found (`content/attachmentCommands.js:21-40,144-146`) | Chips visible for **every** name, no upload-error text, no `aria-busy`/progress/spinner, send button present (`:156-187`) | Invalid base64, encoded-size mismatch, size mismatch, transfer verify failure, upload-error text, 10 s chip timeout, `File input not found` (`:64-79,141,170,186`) | **The probe is swallowed:** `waitForAttachmentChips(...).catch(warning)` then `files.attach.done` is emitted regardless (`:44-48`). AION must not emit done on a failed probe; a timeout is an unconfirmed state, not success | write; `never`; reconcile `composer_attachments`. The file input is also document-scoped, not composer-scoped (`:145`) |
| `message.edit`, `chat.rename`, `response.regenerate`, `session.bind`, `chat.search`, `chat.archive`, `chat.share`, `branch.create`, `message.copy`, `tool.toggle`, `project.select`, `chat.export`, `mode.select` | — | — | — | `NOT_LOCATED` in the pinned Bridge source. No donor equivalent; AION-owned build if wanted | — |

## Corrections this read produced

1. **Attachment confirmation is present but not enforced.** The chip/busy/error probe is the strongest donor material in this set, but the caller converts a failure into a warning and still emits `files.attach.done`. The reusable unit is the **probe plus an inverted failure rule**; do not inherit the warning path.
2. **Model/effort selection is confirmed fail-open** at `content/requestPreparation.js:167-169`. The earlier "warns and continues" statement is verified, not inferred. Any AION adaptation must abort or mark unconfirmed before Send.
3. **Submission evidence distinguishes mismatch from failure.** A new user turn with the wrong text is reported as `new_user_turn_text_mismatch`, not as success and not as a generic timeout. That is the exact vocabulary AION needs for "mismatch ≠ completion".
4. **Terminality needs strong UI evidence or a quiet window**, not the absence of a stop control (`content/requestSnapshotPolicy.js:60-92`). This is the same rule MAC's `longerResponseText` supplies from the other direction.
5. **Identity is the user turn key, not an index or ordinal** (`requestSnapshotPolicy.js:21-27`), because hydration/virtualization shifts indices between samples.

# Strategy and sequencing (corrected 2026-10-21)

- **Owner clarification:** *do all of it, in strategic order.* Durable order is **save harvest evidence → record strategy → selected adaptation + verification**. Development owns adaptation and all acceptance; Harvest keeps supplying evidence.
- **Evidence tier:** every claim in this handoff is `CODE_INSPECTED` on the pinned snapshot. No donor test was executed, no donor runtime installed, no live receipt exists. A commit never promotes a source-inspected claim to acceptance.
- **One artifact per job (no second registry):** the 40-command × 9-donor grid is owned by `workspace/aion/ops/command-space/EXTERNAL-IMPLEMENTATIONS-COVERAGE.{csv,md}` (expanded in place, statuses I/P/R/U defined there); the 105-row capability universe owns the 65 future candidates; the ledger above owns candidate bundles; this section owns the per-op semantics and sequencing; `harvest/EXCHANGE.jsonl` owns needs/offers. Nothing here duplicates those rows or counts.
- **Corrected baseline facts:** 29 core operations (19 P0 + 10 P1); 40 commands in the Command Space matrix; Bridge manifest has **29** definitions (`shared/commandManifest.js:150-181`, 7 request-scope + 22 standalone) and four facet axes (mode, scope, operation, reload-recovery); **14 of 29** core operations have no donor equivalent (`session.bind`, `file.attach` upload, `chat.rename`, `message.edit`, `response.regenerate`, `chat.search`, `chat.archive`, `chat.share`, `branch.create`, `message.copy`, `tool.toggle`, `project.select`, `chat.export`, `mode.select`); `stream` and `history.read` are partial.

## Ranked reuse bundles (provisional; Development may re-rank)

Ranking is problem eliminated × breadth ÷ adaptation cost, from the corrected strategy pass. "NOW" means the evidence is sufficient to adapt offline; it is **not** an instruction to touch runtime.

| Rank | Bundle | Problem eliminated | Breadth | Disposition | Form |
|---|---|---|---|---|---|
| 1 | MAC reply serializer + `longerResponseText` | `reply.read`/`history.read` text fidelity; "stop vanished ≠ complete" | all providers, read side | **NOW** | smallest extraction (pure functions), no wire change |
| 2 | Bridge facet manifest (29 definitions, 4 axes) | per-command retry / reconcile / reload-recovery / lease rules are implicit in AION | 15 of 29 core ops covered, 14 explicitly no-equivalent | **NOW** | AION-owned facet table + table-driven negatives |
| 3 | MAC document-instance binding + checkpointed reuse | stale-document replies, remount ambiguity, restart without replay | I0/P2/P7 across adapters | **NEXT** | pattern + small pure guards |
| 4 | MAC readiness tri-state | false logout on SPA remount; invented login requirement | all providers | **NEXT** | smallest extraction (pure function) |
| 5 | Bridge DOM effect semantics (table above) | 14 P0 ops have no donor equivalent; readiness/typed-failure vocabulary missing | 10 P0 + 1 P1 | **NEXT** | pattern only; click/Enter orchestration is not reusable |
| 6 | Bridge artifact identity + transfer integrity + verify-before-apply | `file.attach` has no contract; uploads have no integrity rule | `file.attach`, artifact download | **NEXT** | pattern + pure verifier; upload side `AION_CUSTOM_BUILD` |
| 7 | Web2API test methodology (breakers, health, lock-key, composer verification, detector budgets) | AION lacks negative-fixture recipes | I0–I3 | **NEXT** | test method, not code |
| 8 | Bridge reconcile vocabulary (`matched_complete` / `matched_incomplete` / `mismatch` / `unavailable`; tri-state text match) | no correlation-result vocabulary | P6/P7 | **NEXT** | **advisory data only; no `event/1` enum change** |
| 9 | Cereon bounded inspector | generic element inspection | diagnostics | **DEFER** until PACK-02 proves a need | pattern |
| 10 | CDP/Cereon/CDPilot frames, WebMCP | — | — | **REFERENCE-ONLY** | keep AION |
| 11 | VOMEGA NLCL + D1 validator/digest | deterministic semantic front end | R6 | **DEFER (R6)**; its 10 transfer tests are adoptable now as AION negatives | tests only |
| 12 | ChatHub, ChatALL, Council, Parallel-AI | — | — | **REFERENCE-ONLY / DEFER** | keep AION |

**Complementary set:** 1 + 4 + 5 + 7 form one read-side layer (fidelity, readiness, effect semantics, negative recipes); 3 supplies the instance identity that 1's "stop vanished" rule needs.
**Competing, both kept visible:** DOM-observed completion (MAC/Bridge) versus backend-anchored completion (Web2API `turn_anchor`; Bridge `conversationReconciliation` treats it as optional evidence, not a canonical gate). AION keeps DOM-observed primary for same-web-thread fidelity.

## Ordered adaptation sequence

Proposed packaging only — Integration Manager stages after Development selects; **PACK-03 stays reserved** for pure send-correlation (AX-0018) and is neither redefined nor re-scoped.

1. **PACK-04** — MAC reply serializer + `longerResponseText` as pure AION modules at the read boundary; must state explicitly that no `event/1` or `snapshot/1` field changes.
2. **PACK-05** — Bridge facet table mapped to AION core-op facets (metadata only; no Bus/ledger/grants code; `NOT_LOCATED` rows explicit).
3. **PACK-06** — MAC readiness tri-state + document-instance guard as pure functions, mapped to AION `page_epoch`/`revision` as an *optional strengthening*.
4. **PACK-07** — Bridge artifact identity + transfer integrity + verify-before-apply, split upload side (`AION_CUSTOM_BUILD`) from download side.
5. **PACK-08** — negative-fixture recipes (Web2API + MAC + Bridge) as AION-test-shaped scenarios.

## Test obligations (offline first; live receipts recorded separately)

- Serializer: code blocks containing `$&` and `` $` ``, nested lists, tables, media-only answers, stop-vanished-early case.
- Readiness: remount ≠ logout; unknown DOM → checking, never "login required".
- Identity: stale document rejected; non-top frame rejected; user-turn-key mismatch reported as mismatch, not success.
- Facets: every core op has an explicit retry policy, reconcile target and reload-recovery value or an explicit AION-owned default.
- Integrity: chunk gap, reorder, duplicate and cross-transfer mixing rejected **before** composer input.
- Transport/resume negatives: 150 retained with limit 100 pages ascending; matching-epoch ahead cursor rejected.
- Attachment: chips missing, upload busy, upload-error text and timeout each produce an unconfirmed state, never `done`.
- Model/effort: unconfirmed selection aborts before Send.

## Open questions (bounded, owner- or Development-answerable)

1. Does the owner's ChatGPT surface expose an enabled **steering** control? The donor's `STEER_WINDOW_CLOSED` / `STEER_SUBMIT_NOT_READY` split implies it may not; this determines whether P0 `steer` is buildable now.
2. Is `provisional_page_position` acceptable as `event/1` identity, or should it be demoted to a coverage flag? Bridge's evidence is that a turn key, ordinal or text fingerprint is not a message ID.
3. Adopt Chrome `documentId` as a strengthening of `page_epoch`, or keep AION's own epoch + revision?
4. Is Bridge's `expectedSessionId` + `expectedUrl` + observed-absence rule the intended AION precondition for `chat.delete`?
5. For `file.attach` upload integrity: adopt the transfer-envelope shape now, or keep it deferred under `AION_CUSTOM_BUILD` until the upload path exists?

## Stopping criteria

- Every one of the 40 commands has a per-donor disposition with a pinned path and scope qualifier; every one of the 65 future candidates has an own-capture status with references or an explicit no-applicable-finding.
- Every core operation has either a donor semantic row (above) or an explicit `NOT_LOCATED` / `AION_CUSTOM_BUILD`.
- Every core operation has an AION-owned retry/reconcile/reload facet or an explicit default.
- Two consecutive rounds yield no new AION-eliminating primitive → the external lane goes dormant for this topic set, with no approval ceremony.

**Certification boundary:** nothing here certifies the 360-cell set, any donor's completeness, or AION product acceptance. This document supplies CODE_INSPECTED and TEST_READ evidence only; Development owns acceptance and live receipts.
