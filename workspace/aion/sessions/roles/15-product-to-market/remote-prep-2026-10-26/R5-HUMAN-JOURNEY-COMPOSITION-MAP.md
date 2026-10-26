# R5 — One-World Human Journey Composition Map

**2026-10-26 · AION Product Agent Role 15 · HIGH source investigation · REMOTE ONLY.** **Current Harness indexed main at audit:** [`32b7021e99aedb3bedb21daae9e7983676ef4771`](https://github.com/owenservera/vivim-harness/commit/32b7021e99aedb3bedb21daae9e7983676ef4771). **Canonical code authority:** [`owenservera/vivim-harness`](https://github.com/owenservera/vivim-harness). **Evidence:** direct GitHub source and test-module reads; **no** execution, screen observation, Windows/Chrome, real provider data, or new engineering task dispatch. Research output lives in AION only.

## 0. Primary decision: complete an existing user action, don't rebuild the app

**The highest-value missing action is "Save this visible message part into my project."** The backend already exposes `POST /api/v1/world/objects` and `POST /api/v1/world/selections` with revision-pinned provenance, and project `PUT` supports `memberIds`; the world UI never calls either POST for object/selection creation. A developer can construct the relationship via HTTP (as the J2 fixture test does), but an ordinary user cannot originate the selection directly from a saved message using current UI controls.

This is not a storage, API registry, retrieval, or React-framework problem. **A thin existing-`world-view.mjs` creation path**, then a reliable source-return action, should close a disproportionately large gap in J2 and J3. The other peer views are not theoretical: Find, Transfer, Relations and Workspace have substantive implementations and synthetic DOM/HTTP fixtures.

**Five or fewer final coding slices are defined below. Do not start implementation from this audit without owner/local worktree permission.**

## 1. What is actually integrated now (versus how it may feel)

**Entry and composition:**

- [chat.html lines 249–258](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.html#L249-L258) exposes eight peer top-level buttons: **Capture, Saved conversations, Projects, Notes, Find, Transfer, Relations, Workspace**. This **is one `/chat` application shell**, not a set of disconnected frontend products.
- [chat.mjs lines 1884–1897](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs#L1884-L1897) dynamically imports `world-view.mjs` in an HTTP(S) browser and mounts it with the **existing rich renderer**; any failed dynamic import is logged to console but world UI is then unavailable. Actual browser import/loading has not been tested here.
- [world-view.mjs `mountWorldView` lines 655–770](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L655-L770) owns the one view controller, records loaded local items/maps/editors/requests, exchanges JSON through `WORLD_API='/api/v1/world'`, and keeps `studio.world.view` + chosen simple records in sessionStorage. Default **Capture** if no saved view; offline Saved/Find/etc can still be opened manually, without a connected provider. SessionStorage remembers view/selection, **not a durable ownership store**.
- [integration-hub.mjs line 112](https://github.com/owenservera/vivim-harness/blob/main/src/studio/integration-hub.mjs#L112) calls `registerWorldRoutes`, which registers search and transfer in the same `/api/v1` dispatch. There is no need for a new HTTP service.

**Truth/custody:**

- [world-service.mjs lines 97–127](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L97-L127) reads `DOM_TURNS` from existing stopped sessions; source is a *bounded final DOM observation*, not the full provider account/thread (see R4). Imported records are foreign snapshots with local remapped detail IDs.
- Projects/notes/source references/selections use [VersionedStore](https://github.com/owenservera/vivim-harness/blob/main/src/store/versioned.mjs) and separate source pointers. User edits never write into captured DOM evidence. Conversation IDs `c-...`; projects `p-...`; notes `n-...`; source refs `o-...`; selections `s-...`.
- [world-view `coverageView`, `custodyChip`, `provenanceChip`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L67-L110) display "Observed", "Yours", "Imported snapshot", "unavailable", "missing", "partial", and unknown account/thread. Source and content status are not automatically provider verification.
- **Knowledge-derived truth is not directly a user editing category in this UI**. Relations is a **read-only local association graph**, not proof of native equality, and no automatic "AI memories" should be asserted.

**Status labels in this report:** **U** = backend/UI code present; **B** = backend endpoint present but ordinary user creation/action absent or disconnected; **T0** = in-process fixture; **T1** = synthetic DOM; **T2** = real HTTP server with fake/stubbed session data; **T3** = actual OS process/browser/local user visible flow; **T4** = controlled authenticated provider. Here all runtime truth is **UNVERIFIED** by this R5 agent; existing tests are *source-inspected*, not re-run.

## 2. Exact human-action contracts — J1 RETURN

| User action / entry | Current UI handler → HTTP method and payload | Identity/store and next navigation | Visible state/failure; current evidence |
|---|---|---|---|
| Open **Saved conversations** peer | `choose('conversations')` ~2224 → `fetchList('conversations')` ~1178 → `GET /api/v1/world/conversations?limit=50&offset=0&custody=observed` (or `imported/all`) | `listSessions(paths.sessions)` observed; `VersionedStore` imported snapshots. Click loaded row -> `openItem('conversations',c-id)` | Empty explicitly says no local saves/not sample; in-flight active excluded; read failure "Studio didn't answer". Source + `world-ui.test.mjs` T1, `world-service.test.mjs` T0/T2 |
| Choose **Imported** or **All** | `#worldCustody` change ~868–879 -> reset list then same GET with `custody=imported/all` | Distinct local imported record IDs; no provider reconnect | Imported list announces "not observed" and detail custody chips; imported no automatic merge |
| Open saved conversation row | `openItem('conversations',id)` ~1259 → `fetchItem` ~1232 → `GET /api/v1/world/conversations/{id}`; no mutation | source session `DOM_TURNS` (observed) or stored imported-snapshot messages; next reader in Saved peer | `renderMessages` ~981 builds ordered message rows, `planFrames` top-level part DOM markers, existing `rich.renderStatic`; missing/unreadable/active errors distinct; no browser runtime proof |
| Read rich part / evidence | `turnPlan` ~314; `planFrames` ~333; `conversationReading` ~1031; no new HTTP | message index/local `id:turn:index`, source session + observedTurnId/domId; optional project-linked navigation | Safe unknown label, reported truncation/redaction, full remote thread unknown; **R4** inline citation and asset limitations remain. Supported rich renderer works in T1 fixture |
| Navigate to project containing conversation | `linkedProjects(id,'conversation')` ~1143 shows loaded project links -> `openItem('projects',p-id)` | Locally loaded/paged project list only, **not an exhaustive reverse-edge query**; list warns when incomplete | User may need Projects or Workspace if project list not loaded; no false claim of no link if only partial page |
| Recover after process restart | UI re-fetch GET after new server; optional sessionStorage view/selected item if same tab | Native saved sessions plus user VersionedStore are designed durable | `world-journeys.test.mjs` "second Studio" explicitly **same test process**, NOT second OS process/browser acceptance. Q01/Q08 local only |

**Product assessment:** J1 is a valid saved-content reader **in source and fixtures**. The missing journey handoff is not "open saved content": it is **"act on what I am reading."**

## 3. Exact human-action contracts — J2 ORGANIZE

| User action / entry | Current UI handler → HTTP contract | Backing ID, persistence and next navigation | Current gap / proof |
|---|---|---|---|
| Create a project | Projects peer -> `#worldCreateTitle` + `#worldCreate` -> `create('project')` ~1277 → `POST /api/v1/world/projects` body `{title,expectedVersion:null}` | server `p-UUID` in VersionedStore; UI selects new project/editor, announces "Saved" | **U**. T1 `world-ui.test.mjs`; T2 API `world-service.test.mjs`. |
| Create a note | Notes peer -> title + body -> `create('note')` -> `POST /api/v1/world/notes` body `{title,body,expectedVersion:null}` | server `n-UUID`, provenance user-authored, rendered in Notes; note body not a provider correction | **U**. When commenting on a selection later, `PUT /notes/{id}` includes `commentsOn`. |
| Add saved conversation/note to project | Project editor `#worldConvSelect/#worldNoteSelect` + `#worldAddConversation/#worldAddNote` -> `addMember` ~1162 updates draft only -> `save('projects',p-id)` ~1306 → `PUT /api/v1/world/projects/{id}` body `{title,conversationIds,noteIds,memberIds,expectedVersion}` | CAS VersionedStore, `p-id`; save confirmation only on versioned 200. `memberRow` can open linked conversation or note | **U**, but it is a multistep **select → add → Save**. Only loaded items can be added; paginated list may omit others. |
| Add **existing** source-reference/selection to project | `#worldMemberSelect` plus `#worldAddMember` → draft.memberIds then project PUT | Existing `o-id/s-id` in VersionedStore; link does not copy source bytes | **U for existing IDs only**; project detail literally says this screen cannot create object/selection. `fetchList('objects'/'selections')` is GET only. |
| Select a **currently visible saved part** | **NO world-view POST caller** for `/objects` or `/selections` (searched full file); rendered `data-part-path` frames ~997–1002 have **no Save selection button** | **B** despite complete backend: `POST /api/v1/world/objects` body `{conversationId,expectedVersion:null}` -> `o-id`; `POST /api/v1/world/selections` body `{objectId,selectionType:'part',messageIndex,partPath:[blockIndex],expectedVersion:null}` -> `s-id` pinned to revision fingerprint | **Critical confirmed gap.** `world-journeys.test.mjs` helper `linkProject()` creates objects+selections **via HTTP fixture**, not a human click. |
| Create note that comments on selection | Note editor `#worldCommentSelect` → `addMember('comments',s-id)` → `save('notes',n-id)` -> `PUT /api/v1/world/notes/{id}` with `{title,body,commentsOn:[s-id],expectedVersion}` | `n-id`, commentsOn relation to `s-id`, independent source data | **U only when selection exists**; otherwise no UI path to originate from source. |
| Resolve simultaneous edit/CAS | `interpretWrite` ~606 and `absorbServer` ~629; 409/other non-200 displays failure, preserves local draft, explicit **Load saved version**; no silent overwrite | old `expectedVersion` fails; no source edits; editing after sending preserves later unsaved changes | T1 already covered. Do not replace with last-write-wins or auto merge; real two-window experience unverified. |

**Minimal missing flow:** Click saved part → obtain source-ref (`o-id`) → create selection (`s-id`) → associate to chosen or newly-created project (`p-id`, CAS update) → optional note commenting on `s-id`. Because these are separate existing HTTP writes, partial network failure could leave an unlinked local object/selection: report honestly, never claim an atomic server transaction or retry blindly and duplicate. Source evidence immutable throughout.

## 4. Exact human-action contracts — J3 FIND and provenance return

| Entry/action | Current UI handler → HTTP contract | Target / visible result | Current status and proof |
|---|---|---|---|
| Find a phrase from saved work | Find peer: `#worldFindQuery`, kind filter, Find button/Enter -> `runSearch` ~1426 -> `GET /api/v1/world/search?q={encoded}&offset=0&limit=50[&kind=...]` | Search builds bounded ephemeral index over observed + imported local records (server default custody `all`); hit records include `id,kind,source,conversation,custody`; coverage and omissions displayed | **U**. Empty text refused; old search aborted/ignored; pagination; T1 `world-ui-find.test.mjs`, T0/T2 `world-search.test.mjs`. |
| Open matching message and exact part | `openHit(hit)` ~1504 → `openItem('conversations',hit.conversation.id)` GET detail; `hit.source.index`, optional `source.partPath` -> `partFrameOf` ~1488 selects [data-part-path] frame; focus/scroll | Message row and optionally top-level saved block. When part doesn't resolve, explicit "Opened the message; the matching part could not be located." | **Implemented in both halves**. Search producer `attributedPartPath` ~85 in `world-search.mjs` yields [index] **only for unambiguous block match**. UI consumer has T1 test; no one combined producer→HTTP→real UI test or T3. |
| Open matching project/note | `openHit` -> `openItem('projects'/'notes', id)` GET detail | Local editor, saved version/source distinction | **U**. Missing/offline errors preserved, CAS safe. |
| Open matching source reference/selection | `openHit` -> `readRecord(o-id/s-id)` GET `/objects/{id}` or `/selections/{id}` -> Find detail fact rows | Shows source conversation ID or parent object ID, messageIndex, partPath, fingerprint as **text** | **B for direct return-to-source**: record is readable but there is **no click-to-source handler** in the Find fact panel. User must manually navigate through Workspace/Relations or find conversation by other means. |
| Read relation graph | Relations/Workspace peer -> `runRelations(id)` ~2080 → `GET /api/v1/world/map?id={id}&limit=100` | Read-only edges; map explicitly states local association, not native equality; unresolved placeholders inert | **U**. T1 relation/Workspace cases; scan can be truncated, not a complete archive. |
| Workspace inspect/refocus | `openWorkspaceItem` ~2189 GET correct `/conversations|projects|notes|objects|selections/{id}`; in-pane reading, `#worldWorkspaceRefocus` -> runRelations on clicked item | Keeps surrounding map, renders conversation, note body, project *summary*, or object/selection *reference rows* | **U for graph exploration** (recent `1b59837`, `01c290a`); it does **not** directly edit project/note or jump from selection address to exact saved part. A user can refocus and traverse multiple edges. |
| Recover stale hit, stale selection or missing source | `openHit` handles absent part as message-level fallback; `world-relations.selection` source fingerprint detects revision mismatch; `fetchItem` distinguishes 404, 409 active and unavailable | Honest partial/stale/missing statuses; no inferred deletion | **U in source/fake tests**; exact old search hit after source change still requires browser-level no-misfocus acceptance. |

**Product assessment:** Find is *capable* and bounded. The most useful improvement is **directly follow a selected source from a reference/selection detail card**, preserving immutable custody, **not** a new search engine or graph.

## 5. Exact human-action contracts — J4 TAKE

| User action / entry | Handler → HTTP path + body | Identity/persistence and visible state | Evidence / missing continuity |
|---|---|---|---|
| Pick records | Transfer peer `renderTransfer` ~1575, checkboxes sourced from loaded conversations/projects/notes; limited pagination | `state.transfer.selected` local UI selection; no write | **U.** Only loaded items offered; an item absent from first page may require navigation/Load more before selection. |
| Pick mode and preview | radio References/Transcript/Full-saved and reasoning/tool options -> `runExport` ~1780 -> `POST /api/v1/world/transfer/export` `{ids:[...],mode:'references'|'transcript'|'full-saved',parts?:{reasoning:boolean,toolActivity:boolean}}` | Server selected records + outgoing dependency closure; file contents depend on mode/flags. UI shows omitted/mode/coverage/custody; no auto-download | **U.** `references` body excluded; other modes contain unredacted selected message content; external asset bytes absent. |
| Download actual file | On preview success `URL.createObjectURL(new Blob([JSON.stringify(bundle)]))` -> `<a download='vivim-world.json'>Download JSON</a>` | Browser user-controlled local JSON download | **U in source**, fake-DOM Blob/test; **real browser download unverified**. |
| Choose JSON or paste | `#worldImportFile` FileReader or `#worldImportText`, 8MiB cap; `runCheck` -> `POST /api/v1/world/transfer/validate` `{bundle}` | No write; digest/idMap/errors/omissions shown; `checkReady` gates next step | **U**. Invalid JSON, oversize and check failures visible; no legacy unverified bundle claim. |
| Dry-run and confirm restore | `runRestore({dryRun:true})` -> `POST /api/v1/world/transfer/restore` `{bundle,digest,dryRun:true}`; then user checkbox; write `{bundle,digest,dryRun:false,confirm:true}` | Backend rewrites local IDs, stores imported-snapshot custody, no account verification, returns applied/skipped/failed/pending/partial/receipt | **U**. `restoreSummary` ~446 explicitly refuses success for partial HTTP 200, failed records or zero applied; **do not claim absent**. Source/fixtures not T3 real file cycle. |
| Continue after import | `runRestore` ~1916 sets `state.custody='all'`, invalidates **conversations list** only, stays in Transfer, render outcome | Imported `c-i...` etc now in storage; user can manually navigate Saved, pick All, refresh | **Partial UX handoff.** No direct "Open imported conversation/project/note" CTA from receipt. Project/note lists are not invalidated with conversations, so this live UI may retain stale lists after newly imported overlays. Confirm with integration test before changing. |

**Product assessment:** Transfer is much more complete than older roadmaps imply. The priority is **human continuation after restore** and real browser file acceptance, not another exporter. Q02 safety behaviors are already implemented in `restoreSummary`; preserve them.

## 6. Combined J1→J4: which transitions actually break?

```text
CAPTURE (initial tab) ─ manual Saved conversations
  → GET observed/imported list → GET one conversation → saved rich reader     [IN SOURCE]
  → click specific rich block and SAVE SELECTION                         [MISSING UI]
  → POST object → POST selection → PUT project association                 [BACKEND EXISTS]
  → add note/commentsOn selection → CAS Save                              [UI ONLY FOR PREEXISTING selection]
  → Find phrase → GET search hit → GET conversation, focus exact block    [IN SOURCE; SPLIT TESTS]
  → open selection result → follow exact source                           [READS RECORD, NO DIRECT LINK]
  → Transfer select → preview → browser Download JSON                    [IN SOURCE; T3 unverified]
  → import JSON → check → dry run → confirm restore                        [IN SOURCE; T3 unverified]
  → open imported project/conversation directly from result               [MANUAL NAV; SOME LISTS STALE]
```

**The backend contract already supports the full fixture-level J1–J4 journey**, via [world-journeys.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-journeys.test.mjs#L1-L20): real loopback HTTP and saved test dirs with a **stub conversation runtime, hand-seeded sessions and two Studio instances inside the same Node test process**. It explicitly disclaims a real browser or separate OS process. Its J2 helper `linkProject` ~85–103 manually POSTs object and selection; it does not exercise a visible selection button. **Therefore J1–J4 service test success cannot be treated as end-to-end product UX acceptance.**

## 7. Required edge-state verdicts

| Scenario | Code behavior already present | Remaining UI/acceptance issue |
|---|---|---|
| First use / no saved data | Saved peer empty state: "No saved conversations on this computer… Nothing here is a sample"; Projects/Notes empty messages. User can open Saved without provider connection | Starts Capture by default if sessionStorage empty; no visible offline-first *task shortcut* proved for a brand-new user. Do not silently change default for active provider lane |
| Offline/no provider tab | World GET operations use local sessions and VersionedStore; Capture has independent CDP connectivity | Actual browser boot/mount without Chrome has not been independently demonstrated; dynamic import failure currently console-only; no global world-failed banner |
| Partial rich saved content | coverageView, turnPlan, unknownPart, truncated/redactions truthful | R4 inline citations and exact truncation length still presentation gaps |
| Missing source / active/unreadable | `world-service` returns missing/unavailable or 409 active, `fetchItem` error; no deletion claim | Human should always have a way back to project/note after source read fails |
| Imported foreign identity | custody chips and originalId/digest qualified; import local IDs for detail/search; source preserved | Direct navigation to new imported record from restore receipt absent; no fake authenticated account |
| Stale search hit, ambiguous part | partPath only when unique; opening absent part falls back to message with explicit warning | Need actual endpoint-produced hit into UI and focus; no cross-surface test; stale selection fingerprint not auto repaired |
| Simultaneous note/project save | CAS 409 and draft retention; "Load saved version" controlled | No invisible auto merge; real two-window interaction still unverified |
| Restore partial HTTP 200 | restoreSummary treats failed[]/partial as failure/incomplete; no "complete" falsehood | Need T2/T3 response-to-visible-state proof and recovery CTA; do not redo status code |
| Workspace map truncation/unresolved | read-only graph, bounded reads, no fake missing/deletion, labels provenance, focus reader in place | Large technical ID display and explicit "not home" copy may be cognitively heavy; no direct open-edit source in Workspace |
| Keyboard/focus & narrow display | focus heading, aria-live status, narrow stack CSS, minimum 44px controls, tests for fake DOM | Browser screen-reader/tab-order, touch behavior and responsive layout remain T3 unknown |
| Returning after refresh/restart | sessionStorage remembers view and three selected IDs, not project/notes data; read from backend | Preserves view only in a continuing tab session; actual independent process restart is unproved |
| Existing provider-first prompt | `PROMPT.md` requests three native provider turns | Separate OWNER-authorized PROVIDER lane; this audit does not override it or start browser tasks |

## 8. Five ranked, non-duplicative coding increments

**These are the entire proposed R5 implementation queue. Reuse existing Q/W/C/F IDs; no competing task registry. Efforts refer to ChatGPT architectural review / local engineering involvement, not measured hours.**

| Rank / existing work IDs | Smallest deliverable and real user value | Exact edit owner / tests to extend | Acceptance and negative checks |
|---|---|---|---|
| **1 · Q07 / W05,W11 / C05,C06 / F08 — HIGH** | **"Save this part" from a visible saved message.** Existing `renderMessages` frame gets user action; POST object only as necessary, POST part selection with exact `messageIndex`/`partPath:[i]`, choose project, CAS PUT `memberIds`. Include message-level option for blockless content. Preserve source/provenance and created refs in cached lists | `src/studio/ui/world-view.mjs` `renderMessages`, `openItem`, `save/addMember`; backend **already exists** in `world-relations.mjs`/`world-service.mjs`. Extend `test/unit/world-ui.test.mjs`, `world-ui-workspace.test.mjs`, `world-journeys.test.mjs`. | From UI only, without pre-seeded s-/o- records: select real displayed block -> project membership -> note commentsOn -> query + return; 2nd click/non-200 creates no bogus success; if POST 1 succeeds and POST 2 fails, preserve honest partial/local orphan state; 409 leaves draft. |
| **2 · Q07 / W05,W07,W11 / C04,C06,C07 / F08 — HIGH** | **One-click return to source** from project member/selection/object, Find selection detail and Workspace reference. Resolve `s-id → o-id → c-id + messageIndex/partPath` via existing GETs; focus observed message/part using current `openItem`/partFrameOf, leave source custody clear | `src/studio/ui/world-view.mjs` `memberRow`, `readRecord`, `renderFind`, `renderWorkspaceReading`, `openHit`; `world-relations.mjs` source-only if exact missing field proven. Extend `world-ui-find.test.mjs`, `world-ui-workspace.test.mjs`, `world-ui.test.mjs`. | User clicks linked selection once to return to exact top-level block; missing/stale source says why, doesn't navigate to wrong block; nested path unsupported falls back to message not invented frame; imported c-i ID stays local. |
| **3 · Q04 / W07,W12 / C07 — MED** | **Producer → real HTTP → UI part hit integration test.** Use live `world-search.mjs` output with unambiguous and ambiguous block terms, and pass the actual hit unchanged through existing UI; **no search engine rewrite** | Prefer new focused integration test alongside `test/unit/world-search.test.mjs` + `world-ui-find.test.mjs`; integration-hub route already registered. Minimal adapter in test harness only. | GET returns `source.partPath=[i]` only when uniquely attributable; opening that exact payload marks/focuses correct DOM frame; ambiguous/vanished part shows message fallback; imported local id resolves; T2 plus T1 contract, no T3 claim. |
| **4 · Q01,Q02 / W09,W10,W11 / C01,C09 — MED/HIGH** | **Post-import continuation and list freshness.** After restore, disclose applied/skipped/failed accurately (already supported), invalidate all affected world-list kinds, present explicit "Browse imported items" next action and open actually applied local item only when report supports it | `src/studio/ui/world-view.mjs` `runRestore`, `renderTransfer`, `choose`, `fetchList`; `world-ui-transfer.test.mjs`, `world-ui-export-modes.test.mjs`, `world-journeys.test.mjs`. | One successful import produces discoverable imported project/note/conversation without page reload; partial 200 never says complete; no navigation to skipped/failed ID; clean repeat import stays truthful, no force merge. |
| **5 · Q10 / W11 / C01,C06 — MED/HIGH** | **First-use and task-oriented focus polish in existing shell.** Allow user to discover Saved/Import while Capture lacks Chrome; clarify one primary task per pane, reduce raw ID emphasis where names known, keep keyboard focus/notifications stable; do **not** add a new home or switch active PROVIDER lane by stealth | `src/studio/ui/chat.html` and `world-view.mjs` `renderListPane`, `renderFind`, `renderWorkspaceReading`, `choose`; `world-ui.test.mjs`, `world-ui-workspace.test.mjs`, manual narrow-browser checklist. | New offline user can reach Saved, create project or import without Chrome and identify next action; tab/focus/aria-live and 800px stack usable in actual browser; fake DOM pass not T3. |

**Ownership rule:** increments 1/2/4/5 all write `world-view.mjs`; they must be serialized by a single active local worktree owner or coordinated through nonoverlapping branches with verified integration. The three independent user outcomes do not imply safe concurrent file edits. No user approval was given to dispatch these implementation changes.

## 9. Ten-minute end-user demonstration script (UNEXECUTED)

**Preconditions:** disposable Studio data root with a synthetically saved, locally persisted **heterogeneous** conversation (not a provider claim), at least one source-qualified code/table/link/unknown block, another distinct message with a unique search term; Chrome/provider not required for personal-world portion. Fresh alternative data root for restore; no private secrets or captures.

| Minute | Human action | Exact visible outcome to record |
|---|---|---|
| 0–1 | Open Studio `/chat`, choose Saved without signing into provider; use observed/local filter | Saved list or honest empty state; no fake provider connection |
| 1–2 | Open saved session; read multiple turns and source/coverage chips | Rich supported parts render, unknown labelled, imported vs observed not mixed |
| 2–3 | Click **Save this part** on code/table block and create/select project | **CURRENT EXPECTED FAIL:** no button yet. After rank-1 fix: source ref/selection/project link created with saved confirmation |
| 3–4 | Create personal note, comment on selected part; save and reopen | Note with user-authored label, versioned CAS, source unchanged |
| 4–5 | Open Workspace starting from project; navigate to selection and source | Related records readable in pane; after rank-2 fix direct source jump works |
| 5–6 | Find unique term in saved part; click hit, then ambiguous term | Exact attributed top-level block focused only when justified; honest message fallback otherwise |
| 6–7 | Transfer chosen project in Transcript and then Full-saved mode; inspect omissions; download JSON | User-chosen file available; no provider send; bytes/assets warnings and exact scope |
| 7–8 | Close entire Studio process, reopen on same root; verify project/note/session and Find | **T3 required:** not proven by earlier same-process two-instance test |
| 8–9 | Open independent clean data root; import downloaded JSON; check/dry run/confirm | JSON restored with local imported IDs and provenance, no source account merge |
| 9–10 | Open imported item directly; repeat import and simulate one failed record | After rank-4 fix discoverability; failed/partial/no-op never called complete; original source never rewritten |

**Acceptance receipts:** captured local git SHA; actual Studio command/process PID/start-stop; safe data-root marker; expected/actual per action; T0/T1/T2/T3 proof grade separately; names/titles may be synthetic, private bodies never uploaded. No Playwright/Puppeteer and no second Chrome actor. Q01 final J1→J4 gate remains unpassed until these human-visible steps run.

## 10. Why minimal Harness patches beat importing a donor frontend

Existing `chat.html` is a single shell; `world-view.mjs` already contains state, loading/cancellation, the 7 WORLD peer views, HTTP contracts, CAS, provenance, search focus, JSON file preview/import, Workspace in-pane reader. `chat.mjs` has a native rich Markdown renderer. Replacing this with `vivim-final` React/Next components would require a second view/state/router and new schema bridges while **not creating the missing source-reference/selection actions** or original owner-data acceptance. The real need is a few state transitions and action controls inside the current architecture. Donor UI ideas can guide labels/accessibility, not a wholesale implementation.

### Actual tests and scope (inspected, not executed)

- [world-ui.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui.test.mjs): fake DOM read/project edit/409/draft preservation.
- [world-ui-find.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-find.test.mjs): fake DOM `partPath` focus/ambiguous/imported/read errors.
- [world-ui-workspace.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-workspace.test.mjs): fake DOM Workspace content, focus, stale replies, unknown/dead-end refs, narrow CSS structural checks; includes newer fixes.
- [world-ui-relations.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-relations.test.mjs): fake DOM read-only graph/picker/bounds.
- [world-ui-transfer.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-transfer.test.mjs): fake DOM partial restore and simulated browser Blob/file.
- [world-ui-export-modes.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-export-modes.test.mjs): fake DOM mode/part options, preview omissions, 400.
- [world-search.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-search.test.mjs): in-process and loopback HTTP `partPath`, bounds, coverage.
- [world-service.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-service.test.mjs): service/read/overlay/CAS with fixture session.
- [world-relations.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-relations.test.mjs): source ref/selection data, anti-false-merge.
- [world-import-hardening.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-import-hardening.test.mjs): collision/partial plan, explicit raw content privacy.
- [world-journeys.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-journeys.test.mjs): T2 HTTP with synthetic capture, explicitly not T3. **The J2 fixture's POST objects/selections is exactly the absent end-user action.**

No code/test changes performed by R5.

## 11. Source blob receipts and dependency attribution

| Source inspected | GitHub blob SHA | Key lines |
|---|---|---|
| `src/studio/ui/chat.html` | `f977e50e6e84ace5edf1a73803c9589c85aa4e50` | 215–258, 448 |
| `src/studio/ui/world-view.mjs` | `06e194261611c1cebe31385173ae6ef7a95ac71f` | 655–770, 981–1138, 1143–1354, 1354–1549, 1575–1932, 1932–2285 |
| `src/studio/ui/chat.mjs` | `f6c5a13517bd41859f25668bb05e9685e74e57d2` | 612–752, 1884–1897 |
| `src/studio/world-service.mjs` | `51401682c474c9218db1a20481f0e5b3a0b7a6b6` | 97–160, 166–191 |
| `src/studio/world-relations.mjs` | `65b58a09f2d1484510bcc3bb5df5b4a31d157398` | 90–120, 122–180 |
| `src/studio/world-search.mjs` | `7c6dee282fdbe4b4acc708464ede00207d9da9a1` | 80–95, 170–207, 284–350 |
| `src/studio/world-transfer.mjs` | `b4ea4866812f9cb831d3ff758ac03eef00d921af` | 70–110, 148–233, 250–361 |
| `src/studio/integration-hub.mjs` | `4cd3ec1889cdd5cd05e5f5b075f6ce56f712e85a` | 23, 112 |
| `test/unit/world-ui.test.mjs` | `115eeab70381ac9d98dc4711b478928aaca40fa7` | 37–456 |
| `test/unit/world-ui-find.test.mjs` | `9a7c8d1d8e3ee920758b6947e8e24d60db66f274` | 53–329 |
| `test/unit/world-ui-workspace.test.mjs` | `f7c74d8a0c4002510c126f36185441d7a301e972` | 74–317 |
| `test/unit/world-ui-transfer.test.mjs` | `a5fb2343bcb85ce86ed75e20f611b42bdde681ee` | 50–224 |
| `test/unit/world-ui-export-modes.test.mjs` | `08f532dcc358e11aa5ff3076d4d19db9c8734516` | 90–231 |
| `test/unit/world-journeys.test.mjs` | `a9edeaecb01554ef0ca4b71b6a7deffd47c8da87` | 1–20, 85–103, 108–517 |
| `test/unit/world-search.test.mjs` | `8f1b9bb4f324253f15921f1832c31cbe770e0101` | 58–365 |
| `test/unit/world-import-hardening.test.mjs` | `e058ab9746da3b31e754d867773d6a63410debc2` | 113–361 |

All source is **current remote GitHub main at observed index**, not direct Windows worktree truth; blob SHA enables a local integrator to recheck changed files. No source read proves successful runtime. No direct known business data or browser credentials are part of the deliverable.

## 12. Cross-reference and explicit non-goals

- P1/P3 single durable collection and four journeys: [P3](../specialists/experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md), [P5](../P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md).
- R4 content lineage and known saved inline/asset loss: [R4](R4-CAPTURE-TO-WORLD-TRUTH-MATRIX.md).
- Existing completion queue Q01–Q12: [queue](03-ACCEPTANCE-SECURITY-CLOSURE-QUEUE.md) and [YAML](04-REMOTE-CLOSURE-QUEUE.yaml). This R5 report **refines** Q07/Q04/Q01/Q02/Q10 but does not create a competing queue.
- Local Windows is human/master. GitHub task distribution is the shared medium, **no Slack**, no browser actor duplication, no Playwright/Puppeteer.
- Current Harness [PROMPT.md](https://github.com/owenservera/vivim-harness/blob/main/PROMPT.md) describes a separate provider-native three-turn mission; R5 does not revoke an active owner authorization or reorder local execution.
- No changed Harness source, new framework, command executor, mobile client, realtime sync, native Chrome integration, local model invocation, engineering issue or owner approval inferred.

**R5 completeness contract:** a local integrator can identify **exact missing user action**, exact existing POST/PUT chain, error/consent boundaries, test routes and real proof grade without re-auditing the entire app. Implementation status remains **not_started_by_R5**. Companion `R5-UI-CONTRACTS.yaml` provides machine-readable action contracts.
