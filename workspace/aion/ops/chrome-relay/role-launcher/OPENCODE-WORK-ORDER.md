# OpenCode/ZCode Work Order — AION Role Launcher RL-001
**Status:** READY FOR AUTHORIZED CODING DISPATCH / no executor acknowledged; no extension code or installation claimed.
**Repo:** `owenservera/aion` branch `main`.
**Target:** Extend existing Chrome ACP Relay issue #18 within `workspace/aion/ops/chrome-relay/extension/`, not a separate extension, repo or communications bus.
**Coordinator:** Role 03 Chief of Staff. **Technical reviewer:** Role 06 TOOLSMITH. **Chief acceptance:** Role 05.
**Product:** One-keyword launch of named ChatGPT role workspace in a *new native conversation*, not a new account login or separate model API session.
**Specifications:** role-launcher ROLES.json, README, LAUNCH-PROTOCOL, BOOTSTRAP-TEMPLATE, PROJECT-ROUTER-INSTRUCTIONS, TEST-MATRIX. Existing Chrome Relay architecture remains in force.

## Stage 1 — Ship a truthful, useful launcher
1. Inspect current repo extension code (if any) and installed Chrome version before modifying, avoid duplicating CR-001. A design spec is not existing executable code.
2. Validate `ROLES.json`: every role ID and unique alias, path allowlist, title nonempty, no regex injection or duplicate triggers. Add unit tests using native Node `node --test`, not Playwright/Puppeteer.
3. Add MV3 omnibox keyword `aion` with suggestions for all 8 roles and user-confirmed `omnibox.onInputEntered`; implement side-panel/launcher command palette if existing relay UI supports it. Use Chrome `tabs.create` only upon actual user command.
4. Create **one new tab** to an observed and supported ChatGPT new-chat route. Project-specific new-chat flow is not assumed; capture actual owner Project UI route, otherwise show `PROJECT_CONTEXT_UNVERIFIED`.
5. Generate canonical initial prompt from ROLES.json and template. In MVP, display it and provide Copy/Insert action; user explicitly sends the message. No automatic ChatGPT UI submit, title edit, tab scraping or credentials in stage 1.
6. Show native title string `display_title` and one-click copy; offer manual rename instructions for the new conversation's visible title menu.
7. Non-secret local launch state: role_code, launch ID, creation time, stage, opened tab ID, eventual native chat URL only with permission. Recovery after service worker restart with no duplicate tabs.
8. Test 8 roles, invalid triggers, quoted commands, ambiguous or unavailable Project, denied GitHub connector and fallback behavior. Produce real Chrome unpacked-extension run receipt plus deterministic tests, commit SHA and reproducible steps.

## Stage 2 — OPTIONAL UI title adapter (separate owner gate)
After L1 tests are independently verified and owner opts in, implement **only** a versioned visible-UI adapter for correct target conversation. May pre-fill the generated bootstrap or optionally submit it if user explicitly enables. Wait until a real /c/... (or equivalent verified current) chat URL and role ACK before rename. Locate native rename menu conservatively and ensure only the tracked chat gets renamed; verify exact UI title and stop/fallback if controls changed. Do not invoke private service endpoints, scrape transcripts or export credentials. User may manually rename if UI control isn't stable.
This is an optional extension capability; it must NOT block reliable Stage 1 shipping.

## Stage 3 — OPTIONAL local/ACP relay (separate permission gate)
Connect launch instance registry and fresh-read GitHub source context through existing native host/UAH only after host install/bridge authorization. No GitHub issue comment automatically causes browser or host action.

## Completion receipts
- L1: exactly one new tab per invocation, registry selection and prompt generation correct, manual send works, workspace can be loaded in a fresh chat with authorized connector, fallback displayed truthfully, no unauthorized scripts.
- L2: real consented ChatGPT UI title renamed and independently observed, or TITLE_MANUAL_REQUIRED with honest fallback; never infer from a generated label.
- L3: only after separate authorized host and ACP tests.
Return actual implementation files, exact Chrome runtime/version, Node test stdout, negative tests, screenshot if used, model/session/commit, and independent reviewer verdict.

## Strict constraints
No Playwright or Puppeteer in any implementation/test; no auth bypass, cookie reading, broad browser permissions, hidden API use, mass transcript scrape or unfounded claims of always-running chats. No Grok-authored code. Repo/main local-master authority remains.

## Optional in-chat command enhancement (not Stage 1)
After a stable omnibox/panel launcher, optionally detect the entire exact `AION:NN` command in the ChatGPT composer using a narrowly scoped, user-enabled content script, then show a distinct "Launch NEW role conversation" control. This is not a native ChatGPT keyword feature. Do NOT hijack the ordinary send key or scan transcripts. User click triggers the same `tabs.create` and bootstrap state machine. If ChatGPT composer DOM changed, disable silently reading page contents and show a manual fallback. Verify separate chat URL and title; do not infer either from keyword text in the old chat.

## Situational awareness and orchestration — planning session 2026-10-18

**Status: DRAFT_FOR_CHIEF_REVIEW / NOT_AUTHORIZATION_TO_COLLECT_OR_BUILD.**
**Planning: DEFERRED until the current live introspection probe has a receipt.** Preserve this bounded draft; do not start further research, collection, implementation, or storage work now.
This appended increment does not execute, authorize, or claim completion of the earlier launcher stages.
Parent session owns validation; Chief 05 owns agent semantics and acceptance; owner grants live scope.
Use this extension, native relay, envelope, and existing eight-role registry; no competing system.
Current tab/ACP field-normalization fixes remain an independent writer lane, not work authorized here.

### Decisions, proposals, and unknowns
- **Owner decision:** inventory the latest 50 conversations account-wide within the currently selected workspace, plus **ALL older pinned conversations** in that workspace.
- This is not restricted to one Project, the eight roles, the visible sidebar, or currently open tabs.
- Open ChatGPT tabs are a separate inventory, including conversations outside that union; do not add them to the recency set merely because they are open.
- **Owner decision:** reuse the named roles and canonical `ROLES.json`; Chief 05 approves their associations and orchestration semantics.
- **Owner correction:** AION owns a persistent local entity model/database and queries its own index; no ChatGPT Search dependency. This supersedes the earlier session-only metadata-storage proposal.
- **Proposals:** budgets, staleness, metadata schema, adapters, files, and stages below require review; none is installed by this plan.
- **Unknown:** whether authorized visible UI can prove authoritative newest-50 ordering and enumerate every older pin within a bounded scan.
- **Unknown:** actual selected workspace, Project identifiers/routes, pin coverage, live role bindings, and available navigation controls; do not discover them during this docs-only session.
- Missing ordering or all-pin evidence may BLOCK the full guarantee. Observed pins alone are not successful all-pin coverage.

### Existing implementation boundary and source basis
- `extension/src/background/chatgpt-port.js:169–189,227–238,371–379` implements open-tab discovery returning `tab_id`, sanitized `url`, `window_id`, `active`, and `status`, deliberately without titles.
- `extension/src/background/service-worker.js:1118–1123` exposes tabs/ping/run/read, not history, Projects, switch, or open-new-tab endpoints; normalize no fields in this planning lane.
- No history/Projects inventory or switch/open implementation was found in the bounded recon; launcher navigation remains designed, not implemented there.
- `extension/src/roles.js` mirrors `role-launcher/ROLES.json`; the latter remains the single canonical role registry, not a live-conversation catalogue.
- `bridge/src/host.js` and `bridge/src/envelope-map.js` provide capability initialization and approved dispatch/cancel primitives, not proof of live role orchestration.
- Actual inspected persistence includes the adapter-backed event store in `extension/src/lib/store.js:15–41,191–215,282–285`; it is not a verified persistent entity database. Architecture references to SQLite/IANG do not prove an installed SQLite layer; storage-seam review remains with the parent after deferral.
- Source pointers describe inspected code, not current browser observations or a fresh test receipt; older fixture-only/uninstalled doc headers are not current runtime evidence.
- Parent-reviewed official sources inform feasibility only; no external fetch or browser collection is performed by this appendix:
  - https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt — older chats may be absent from the sidebar; no documented newest-50 sorting guarantee was established. ChatGPT Search is explicitly excluded from this plan, including as a completeness check.
  - https://developer.chrome.com/docs/extensions/reference/api/tabs — query/manage browser tabs; `pinned` means browser-tab pinning, IDs are browser-session scoped, and matching host permissions can expose title/URL. Technical access is not owner consent.
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt — partial source fetch supports Project structure; Enterprise/Edu-specific containment text must not be generalized to every plan/workspace.
- Reviewed sources located no supported ChatGPT account-history API for this goal; this is not a universal absence claim. API Conversations data is not interchangeable with ChatGPT account history.
- Do not equate a scroll plateau, search reconciliation, sidebar visibility, or a count of 50 with authoritative completeness.

### Identity and metadata contract — PROPOSED
- Distinct namespaces: `role_id`, `conversation_id`, `project_id`, `tab_id`, `window_id`, and `workspace_ref` (local opaque reference).
- A role is a named context; a conversation is a native chat; a Project is a grouping; a tab/window is browser presence; a workspace is the selected account scope.
- Titles are display data, never identity keys. Do not fabricate native IDs from titles, slugs, positions, hashes, or tab IDs.
- Extract native conversation/Project IDs only from an observed, validated source after feasibility review; otherwise retain null plus the observed URL/reference.
- ID-less observations remain explicitly unresolved; do not title-dedupe or present them as distinct verified conversations. Exact observed-URL matches may reconcile observations with provenance, not manufacture IDs.
- One conversation can have multiple tabs and explicit role associations; a new tab does not create a new native conversation by itself.
- Role binding must be explicit and provenance-backed: approved role ID, observed conversation reference, source/approval reference, observation time, and binding state. Never infer from a title match.
- Store bindings as runtime observations referencing `ROLES.json`; do not introduce another role roster or silently replace Chief 05's existing context.
- Metadata fields: `title` (nullable), `observed_url`, observed `conversation_id`, `project_ref`/observed `project_id`, and `workspace_ref`.
- `conversation_pinned` is true/false/unknown; `browser_tab_pinned` is a separate true/false/unknown field on tab observations, never a substitute.
- `updated_at` is an actually observed update timestamp or null, never scan time; `recency_basis` is `ui_order`, `observed_timestamp`, or `unknown`.
- UI order may be recorded without being authoritative; identify the evidence establishing its meaning, or mark newest-50 coverage unproven.
- Every field/record carries applicable `observed_at` UTC, source/provenance, and unknown reason; every snapshot carries scope and coverage.
- Coverage reports separate recency and pin results: complete/partial/unknown/blocked, ordering evidence, actions/duration, truncation reason, and unresolved-ID count.
- Union definition: deduplicated verified latest-50 set plus every older pinned conversation in the same workspace; preserve membership reasons and overlap.
- Open-tab inventory remains separate, with explicit links to union members when verified; missing tab metadata does not remove a conversation from the union.
- Unknown Project membership/pin state must remain unknown, not false; workspace mismatch invalidates association and navigation eligibility.
- **Owner-directed persistent model:** workspace-scoped Projects, conversations, explicit agent/role bindings, tab instances, observations, capabilities, and task receipts; internal queries use this local index, never ChatGPT Search.
- Persist source/provenance, `first_seen`, `last_seen`, observed-only `updated_at`, tri-state pins, ordering evidence and coverage; no message bodies, credentials, tokens, or private transcripts.
- Latest-50-plus-older-pins and open-tab views derive from the database with honest ordering/coverage provenance. A database does not make an incomplete bootstrap complete.
- User rename updates an observed title, not identity; an absent row is not deletion; a closed tab is not an archived/deleted conversation. Preserve observation history and uncertainty.
- **Storage proposal:** reuse a verified suitable existing persistence layer after parent storage-seam review; otherwise native-host-owned SQLite in an owner-approved local AppData path outside the repo, with no new service. Schema/migration/retention details remain unapproved.

### Capability catalogue — PROPOSED
Each capability has independent `available`/`unavailable`/`untested`/`stale` state, scope, last evidence UTC, evidence reference, and reason.
Availability is evidence-backed and permission-scoped, never inferred from a transport handshake or another capability's success.
- **read_metadata:** read approved titles/IDs/Project/pin metadata with explicit coverage; does not read message bodies.
- **list_open:** list current ChatGPT tabs separately; browser `active` means selection, not reasoning or task execution.
- **switch:** focus/navigate an explicitly chosen verified target after fresh scope/identity checks; no send or draft modification.
- **open_new_tab:** one explicit action, one observed approved destination; no fabricated Project route, implicit bootstrap send, or automatic retry.
- **prepare_context:** prepare registry-linked context for operator review; preparation is not context-read acknowledgment.
- **dispatch:** separately approved bounded task via the existing authorized path; retain correlation and approval references.
- **read_reply:** separately scoped correlated reply retrieval; transport ACK is not a model reply, consumption, or verified proof.
Tab open != conversation created != context initialized != model reasoning; report each state independently.

### Bounded stages and exit gates — PROPOSED
1. **SA0 feasibility FIRST, after live-probe receipt:** after separate metadata authorization, establish selected-workspace identity, permitted metadata surfaces, authoritative recency evidence, and whether all pins can be enumerated without ChatGPT Search/private APIs.
   Inspect only approved visible metadata. Document limitations without guessed selectors/routes; finalize no parser until this gate is reviewed.
   Exit: supported full-coverage method, BLOCKED guarantee, or explicit owner/Chief decision to proceed with honest partial results; never silently narrow the target.
2. **SA1 open tabs:** extend the current sanitized inventory only for approved metadata, pin separation, workspace provenance, and stale/unknown handling; no navigation side effects.
3. **SA2 persistent model and metadata union:** bounded initial UI-metadata reconciliation into the approved local database, then incremental authorized UI/tab observations plus explicit refresh; internal index derives latest-50 plus all older pins only to SA0's coverage level. Dedupe by verified identity; preserve overlap and unresolved observations.
   Pin/action/time caps yield partial, not complete; display unproven recency even when 50 rows were collected.
4. **SA3 safe navigation:** add explicit switch/new-tab actions with target revalidation, draft preservation, and durable duplicate protection; no send, rename, or pin mutation.
5. **SA4 role context:** prepare existing role bootstrap/context references; record actual conversation identity and source-read ACK before initialized/ready. Connector denial remains blocked/manual fallback.
6. **SA5 bounded real handoff:** only after separate approval, Chief 05 -> Role 02 bounded task -> correlated return -> wrong-ID negative case. No unattended expansion.
   Reuse existing envelope/task/delivery semantics; keep the Windows executor authorization/acceptance gate distinct from ChatGPT-role handoff success.

### Proposed file/task map — paths relative to `ops/chrome-relay/`
Existing targets below are future integration seams, not edits authorized by this document:
- `role-launcher/ROLES.json`, `extension/src/roles.js`: canonical role lookup/mirror parity; runtime bindings reference these, not another registry.
- `extension/src/background/chatgpt-port.js`: retain current tab driver and sanitized baseline; add approved metadata/navigation capabilities behind separate interfaces.
- `extension/src/background/service-worker.js`: trusted endpoint routing and invalidation; integrate only after the active normalization lane settles.
- `extension/src/panel/panel.js`: independent inventory/coverage/capability presentation and explicit actions; no competing response-field normalization.
- `extension/manifest.json`: review least permissions for each capability; matching host access does not authorize history or titles by itself.
- `extension/src/lib/{envelope,state,store}.js`, `bridge/src/{host,envelope-map}.js`: reuse boundaries, persistence and approved handoff; no second queue/event bus.
- Parent reviews the existing storage seam before selecting a database adapter; **PROPOSED, NOT CREATED:** `bridge/src/entity-store.js` and `bridge/tests/entity-store.test.js` only if no suitable existing layer is verified. SQLite ownership stays in the existing native host, not a new service.
**PROPOSED, NOT CREATED:** small modules/tests below, subject to SA0 and existing-pattern review:
- `extension/src/lib/conversation-metadata.js`: identity/provenance, union, ordering/coverage, freshness; deterministic, DOM-free.
- `extension/src/chatgpt/metadata-adapter.js`: versioned approved visible-metadata adapter; selectors/routes derived only from later authorized observation.
- `extension/src/background/conversation-navigation.js`: target validation and single-action navigation/restart reconciliation.
- `extension/tests/fixtures/conversation-metadata.json`: synthetic shared records and exact driver/worker/panel request/response cases; no real account metadata.
- `extension/tests/conversation-metadata.test.js`, `metadata-adapter.test.js`, `conversation-navigation.test.js`, `situational-contract.test.js`: reducer, adapter, navigation, cross-layer contracts.
Prefer extending existing tests where appropriate; names above are proposals, not a requirement to create redundant files.

### Deterministic acceptance tests — no live account data
- Latest 50 plus older pins; overlap deduplication; pins beyond row 50; fewer than 50; unknown order; unresolved/no IDs; identical-title/different-ID collisions.
- Persistent-model tests: restart retention, workspace isolation, rename without new identity, absent row without deletion, closed tab without chat archival, and DB-derived views retaining partial/unknown bootstrap coverage; zero ChatGPT Search calls.
- Virtualized/lazy/paginated UI fixtures: missing pages, capped actions, missing pin markers, scroll plateau, and search reconciliation must not manufacture completeness.
- Conversation pin vs browser-tab pin disagreement; unknown vs false; all-pins guarantee blocked/partial when enumeration is unproven or budget expires.
- Multiple tabs per conversation, open tabs outside union, browser-session ID reuse, stale/closed tabs, and selected-workspace mismatch.
- Switch/new-tab preserves drafts, rejects wrong targets, never auto-sends/auto-opens during listing or refresh, and survives restart without duplicate tabs.
- Role binding requires explicit provenance; missing context ACK/connector denial is not initialized; task reply with wrong correlation/role/conversation is rejected.
- Run the **same exact synthetic fixtures** through actual driver -> worker -> panel handling, not three separately invented shapes or only mocked boundary outputs.
- Assert field names, null/unknown semantics, failure codes, target identity, coverage, and side-effect counts across that path; block integration on contract drift.
- Retain legacy title-exclusion tests for the old contract; title-enabled metadata needs a separately authorized explicit contract, never accidental widening.
- Parent executes/validates applicable existing test scripts with Bun first, preserving runner semantics; no execution claimed by this plan.

### Live gates — separate approvals, minimized evidence
- **G1 metadata:** scoped owner approval for designated selected-workspace metadata; operator manually samples recent ordering, pins (including older), Projects and open-tab separation. A sample validates fields, not exhaustive coverage.
  Retain no private titles/IDs/URLs/screenshots in Git; full-coverage acceptance additionally needs SA0's supported enumeration/ordering evidence. Otherwise report partial/blocked.
- **G2 navigation:** separate permission to switch between two verified conversations and open at most one new tab; preserve drafts, verify targets/workspace, send nothing.
- **G3 handoff:** separate approved Chief 05 -> Role 02 bounded task, actual correlated return/readback, and wrong-ID negative; record minimized outcome and Chief acceptance.
  This is not permission to launch a Windows execution task; native/ACP executor scope and acceptance require their own gate. Parent validates evidence; Chief 05 accepts semantics.

### Budgets, retention, and prohibitions — PROPOSED defaults
- Per explicit metadata scan: maximum **60 seconds / 10 UI pagination or scroll actions**, whichever comes first; count all enumeration actions, including pin discovery. No hidden retry loops.
- Reaching a cap means partial with reason and remaining uncertainty; do not label all pins collected from a plateau or exhausted guesses.
- Bounded initial UI reconciliation uses no ChatGPT Search; thereafter authorized UI/tab events update or invalidate observations and explicit refresh reconciles metadata. Query AION's own index; no immortal pollers or periodic account scans.
- Proposed TTL: 120 seconds for open-tab/navigation eligibility, five minutes for metadata snapshots/capability observations; elapsed TTL marks stale, never refreshes automatically.
- Invalidate immediately on known scope/navigation changes; revalidate target identity/workspace before action even inside TTL. TTL is not completeness evidence.
- Metadata is sensitive but persistent local storage is owner-directed: keep the entity DB outside Git in the approved local AppData location, workspace-isolated. Workspace/session changes invalidate active scope, not erase records; retention/cleanup policy requires review and no automatic deletion is authorized here.
- If restart safety needs a local navigation journal, store only minimal action identity/stage/tab reference, no titles/transcripts; expire safely and require reconciliation, never replay blindly.
- Git receipts contain minimized counts/hashes and sanitized outcomes only, never private metadata or reversible title/ID hashes; hashes identify approved artifacts, not private conversation content.
- No private endpoints, traffic interception, cookies/tokens, login automation, Playwright, Puppeteer, or Orca; no background message-body search/scraping to manufacture metadata.
- No rename, conversation pin/unpin, move, archive, or delete in this increment's v1; earlier optional title-adapter stage is not enabled here.

### Material Chief/owner decisions before dispatch
1. If authoritative newest-50/all-pins coverage is infeasible within approved UI/budget, BLOCK the guarantee or explicitly proceed with visibly partial coverage while preserving the original target?
2. After the live receipt, approve or revise metadata/title scope, persistent-DB storage seam/retention, scan budget/TTL, and explicit binding provenance; Chief 05 confirms role semantics and handoff acceptance. Internal DB/no ChatGPT Search is owner direction, not an open architecture vote.
3. After parent validation, which live gates are separately authorized? No answer, design review, or transport ACK grants collection, navigation, sending, or Windows execution.
