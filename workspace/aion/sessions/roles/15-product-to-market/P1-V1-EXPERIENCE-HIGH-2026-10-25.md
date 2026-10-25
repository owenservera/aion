# P1 HIGH — VIVIM V1 Core product experience
**Date:** 2026-10-25 · **Owner:** AION PRODUCT-TO-MARKET / Role 15
**Status:** **WORKING DRAFT — owner interview in progress.** Baseline experience contract and detailed acceptance are saved; D01 first-entry/primary navigation is **not decided**, and dependent screen hierarchy is intentionally left conditional. Not owner-approved implementation guidance.
**Mode:** product WHAT/WHY/WHERE and user-visible acceptance, not code, schema, design framework or P2–P6 launch.
**GitHub sources reviewed:** AION Role 15 P1 shape + P1 Medium; Harness main `030895e79480f23e8929e4a5de5e80d74aa8c490`; implementation source pointers below. No local/Windows execution performed.

## 0. Stable owner decisions — DO NOT INTERVIEW AGAIN
1. VIVIM is an independently useful, persistent, user-owned local world, with provider webapps as evidence-qualified external worlds. **Local VIVIM Project != any native provider Project**. The provider's remote data remains under provider authority; VIVIM controls its local projection, relationships and human edits.
2. V1 Core is the integrated **RETURN → ORGANIZE → FIND → TAKE** set of outcomes, **not four standalone miniapps** or a new chat wrapper.
3. **W0 Represent** typed known source relationships and unknowns from existing saved local evidence now; later **W1 Discover / W2 Reconcile / W3 Operate** mature after the internal stable-local-app gate. Preserve existing Harness safe reads and browser actor; postpone *new* interactive Chrome integration.
4. Distinguish evidence/observed source, derived interpretation, human assertion/overlay, and operation result. What is known/available and what may be done are **different dimensions**.
5. Start from `owenservera/vivim-harness` main. Existing Harness services/renderers/evidence/CLI/browser actor stay canonical. No Z.ai R1/R2 assumption, parallel backend, new effect controller, mandatory no-dependencies rule, Playwright/Puppeteer or Slack.
6. This is a **single-user** initial product; it must not require a currently connected AI provider to use previously saved content. No silent provider-account history import or private project-context sharing.
7. PRODUCT requirements and decisions belong here; engineering implementation/tests belong in Harness; no fake claims of beta/release/readiness.

## 1. Experience promise and screen-level vocabulary
### One sentence to a first-time user
“Keep the useful parts of your AI conversations in your own projects. Read, find, annotate and take them with you—even when the original provider is unavailable.”

### User-understandable entities (not mandatory schema)
- **Your Library**: genuinely present, locally readable saved conversations/artifacts, plus separately labelled references where only a remote pointer exists.
- **Your Project**: long-lived collection/organization/curation of local materials and notes across provider origins; never imply creation/editing of any native provider project.
- **Saved Conversation**: local reading object containing only the content actually saved or reconstructed, with exact known origin and missing-piece markers.
- **Saved Part / Artifact**: an addressable portion (code, citation, image, table, file or unresolved native block) whose availability and relationship to the original are explicit.
- **Your Note**: user-authored content that may comment on source, never rewrite it.
- **Source/coverage**: where/how/when VIVIM learned a claim; whether content is locally available, merely referenced, partial or stale.
- **Provider world**: provider-native account, optional container/project, thread, message/part or capability, only if evidence supports each relation.
- **Action**: explicitly scoped “in VIVIM”, “read from provider”, or “act on provider” — never silently interchange operations that have similar names.

### Primary UI principles
- A single application and single current context. Cross-navigation must preserve a clear route back to exactly the same locally saved object/part.
- Relevant provenance appears in plain language near the content; raw hashes/records are secondary “Inspect evidence” detail, not a compulsory developer screen.
- Remote sign-in status is adjacent to provider-specific live affordances, not a misleading badge on otherwise readable local content.
- Do not represent visible remote references as locally saved content; do not represent full local export as complete remote account export.
- Any action with an external effect requires known target, explicit scope and positive authorization; a local read/annotation never silently invokes it.
- Deep links to provider worlds are optional supplementary exits, not a dependency for saved local reading.

## 2. First-run experience — behavior independent of unresolved screen hierarchy
**Fresh machine, no provider connection, empty local store:**
1. State in human language: “Nothing has been saved here yet. Your AI accounts have not been read.”
2. Present only actual supported ways to obtain local data: import a VIVIM-compatible saved bundle when implemented; choose a clearly labelled non-private sample dataset for exploration; or an existing supported owner-authorized capture path if genuinely available. Disabled/unimplemented paths should say “Not available in this version,” never simulate success.
3. When demo data is used, visibly mark every demo object as sample/test data. Never imply observed ChatGPT/Claude ownership or remote accounts.
4. Show how to finish one outcome without connecting an external service: open a sample saved conversation, save one item to a local project, find the note, export a project (and later restore if implemented).
5. Clear “Remove sample data” must not delete unrelated real local records. Unsupported safe removal must not be presented as enabled.

**Returning user, provider offline:** read and organize locally held work; source-aware search and export remain available. Show which *remote* links/content need a provider, not a global “offline / nothing works.”

**First run with existing local Harness evidence:** do not indiscriminately convert every capture segment/session into a complete conversation or claim entire chat history. Offer source-qualified material when actually reconstructible; distinguish “ready to read”, “partial”, “reference only”, “not indexed”.

## 3. Four complete end-to-end user journeys
One continuity example: the user has saved a multi-turn ChatGPT-origin conversation with code/citation plus one Claude-origin conversation and a remotely referenced attachment. The user creates a VIVIM local Project **North Star**. These are illustrative fixture scenarios, not claims about any real account.

### J1 RETURN — “Open the work I already saved”
1. Find/open an existing locally saved conversation (the entry placement depends on D01).
2. See a stable conversation heading, provider origin when known, local-availability status and (when evidenced) native account/container/thread breadcrumb. Unknown account/structure is visibly unknown.
3. Read ordered roles and typed parts: prose, code, table, citations, image/file/artifact references, observed tool/status, opaque unknown. Unsupported parts remain as identifiable placeholders; never silently disappear.
4. Open “About this content” for observed/derived/imported source, evidence time, coverage and precise missing items without forcing debug traces.
5. Navigate away, restart the application, return to the same **local** saved conversation and selected part without remote sign-in, tab attachment or accidental substitution of another similar titled thread.
6. If original external link is unavailable, the local saved copy remains readable; a **remote-only** item instead honestly says local content is unavailable.

**Error/edge cases:** unknown account, same-title threads, partial transcript, missing citation target, unsupported math/table/file, old source revision, unknown/contradictory native container, corrupted saved record. Display partial known material; do not fabricate lost parts.
**Accept if:** a 3+ turn fixture containing code, citation, artifact reference, opaque kind, missing source and known provider association is rendered and reopened after an actual process restart with identity and qualifiers intact.
**Reject if:** a browser tab or title match is substituted for native identity; a remote read is represented as durable local custody; unsupported content disappears or becomes invented text.

### J2 ORGANIZE — “Make this useful in *my* project”
1. While reading, select a whole saved conversation or particular message part/artifact and choose **Save to VIVIM Project** (never ambiguous “Save to ChatGPT Project”).
2. Create/select **North Star**; show selected excerpt/artifact plus original source relationship and an editable note. Do not silently duplicate origin evidence.
3. Optionally link a second Claude-origin saved conversation into the **same** VIVIM Project. No native-provider project need exist.
4. Edit and save the personal note and a local project title; present a durable saved/failed outcome. Local edits never modify provider-native objects.
5. Open North Star after a restart, find note and saved part, follow source to the original local conversation where possible.
6. Remove a project association; original saved conversation and immutable evidence remain unaffected. Any destructive local removal distinguishes link removal vs content deletion.

**Accept if:** two separately sourced conversations can be represented together without merging accounts/threads, and a user note/association survives restart; a project with only one conversation also works.
**Reject if:** local rename moves/renames a provider project, annotations overwrite raw captured text, deleting a bookmark deletes source evidence, a provider-native container is invented from a similar word.

### J3 FIND — “Find my useful answer, and know what it came from”
1. Search **local VIVIM-held data by default**: available conversation text, project titles and notes, and only artifact metadata/content truly indexed. Optional filters expose scope (project, provider, known native container, content kind or source status) only when grounded.
2. Results show human-readable snippet/title, local object kind, source label, and a navigation target. “Indexed local material only” remains an honest scope statement. Remote account-wide search is a separate feature.
3. Search two same-phrase results from two accounts/threads and ensure each opens its correct saved record, never the first matching title.
4. Open a result directly at exact saved message/part/note. If exact deep link unavailable, land at closest confirmed object and say the precise part could not be resolved.
5. Report missing/partially indexed/opaque content appropriately. “No local matches” is not “Your AI accounts contain none.”

**Accept if:** phrase in saved part and distinct phrase in human note are both findable with correct origin/source, and false account/thread joins are absent.
**Reject if:** remote-only linked content falsely matches as locally searchable full text, unsupported attachment text is conjured, search claims comprehensive provider coverage.

### J4 TAKE — “I can actually carry my work away”
1. From a VIVIM local Project, choose **Export this VIVIM Project**; preview selected local conversations/parts/artifacts/notes, remote-only links, source/coverage and privacy omissions.
2. Show known included bytes vs reference-only, missing/partial parts, unavailable media, unsupported/reconstructed elements, and sensitive exclusions. Do not silently fetch missing content from a provider while exporting.
3. Produce a portable, documented bundle, separately labelled from an external provider's native/account export (if that feature exists).
4. In a new disposable local profile, import the bundle and open North Star with notes, selected content, source qualifiers, coverage and references retained. Never claim native provider projects/accounts were created or accessed.
5. Re-import the same bundle and expose deterministic non-destructive behavior; ID conflicts and unsupported bundle versions are explicit, not silent replacement.
6. Verify no session cookies, tokens, auth headers, Chrome profile material or undisclosed raw sensitive capture are included.

**Accept if:** round-trip local objects and human edits preserve intended relationships, confidentiality and omission manifest in a fresh environment.
**Reject if:** “export succeeded” produces only a read-only transcript with no working restore; remote-only source appears as complete included content; duplicate import silently overwrites saved work.

## 4. Cross-cutting UI states and exact user meanings
| Condition | Suggested user-visible wording / outcome | Forbidden implication |
|---|---|---|
| No local data | “No saved work here yet.” | “Account is empty” |
| Sample fixture | “Sample — not from your account.” | Real live provider activity |
| Locally saved, provider disconnected | “Saved locally; source provider not connected.” | Record unavailable |
| Remote link only | “Reference only — content isn't stored here.” | Export contains full content |
| Partially observed source | “Some messages or attachments weren't captured.” | Complete thread/account |
| Source not yet confirmed | “Origin not verified.” | Same title == same thread |
| Derived projection | “Reconstructed from recorded evidence.” | Verbatim provider-native record |
| User note | “Your note.” | Provider-authored statement |
| Unsupported native part | “This part is preserved but can't be displayed here.” | Invisible/drop content |
| Saving succeeds/fails | “Saved to North Star” / “Couldn't save — unchanged.” | Cosmetic toast proving persistence |
| Search no hit | “No matches in indexed local content.” | Full remote history searched |
| Export privacy scope | “Review what's included and left out.” | Hidden acquisition of remote data |
| Provider action unavailable | “This operation isn't verified for this provider.” | Same-name cross-provider equivalence |
| Ambiguous exact target | “Can't confirm the account/thread; action disabled.” | Guess target and execute |

Accessibility: all essential flows keyboard navigable with visible focus, sufficient contrast, semantic controls, non-color-only status, meaningful empty/failed states, screen-reader readable labels and preserved user context at narrow desktop widths. Explicit success/failure must not rely on ephemeral toast alone. Avoid forced network sign-in for reading local work.

## 5. Proposed coherent product surface (not locked pending D01)
The *functions* are settled; their position/hierarchy is not:
- **Library / Conversations**: saved conversation reading, content parts, source/coverage.
- **Projects / Personal World**: user-owned project context, note/relationship curation across providers.
- **Find**: one search over locally indexed content with deep links/coverage.
- **Transfer**: preview/export/import/restore with version and omission/permission truth.
- **Inspector (contextual)**: provenance, account/native object/source identity, observed vs derived vs user annotation. Raw evidence advanced and optional.
- **Provider connection/status (contextual)**: external providers, known signed-in/unknown, verified read/action capabilities. New Chrome interactive features outside V1 Core stability phase.
- **Activity (only if useful)**: current work/operation receipts and uncertainty. Not a fifth mandatory V1 Core destination.

**Do not introduce four independent apps, a second product registry, a second effect actor, or a top-level “Knowledge” screen just to mirror an internal subsystem.** The application may expose more flexible navigation when justified; this is an outcome contract, not screen count dogma.

## 6. One integrated user acceptance rehearsal, using real persistence
**Fixture:** approved non-sensitive local dataset with a ChatGPT-labelled 3+-turn rich conversation, separate Claude-labelled record, opaque block, missing remote attachment and evidence/coverage qualifiers; synthetic origins are explicitly marked demo.
- Start with neither provider authenticated, open saved conversation and inspect exact local identity/source.
- Save a code part in new North Star; link Claude-origin item, write user note.
- Exit/restart actual app/server; open North Star and follow link to same local conversation/part.
- Search human note and source phrase separately; confirm results link correctly and do not claim remote account completeness.
- Export selected North Star; review omission/security manifest.
- Import in clean disposable profile; review content+note+source; repeat import with no destructive duplicate effects.
- Try negative cases: same-title different accounts, provider with no native project, remote-only reference, unknown content kind, corrupted bundle, missing source and disabled unsafe provider effect.
- Record real setup, source SHA, paths, outputs and failure receipts. **Synthetic local fixture tests cannot be advertised as real provider or friend-beta acceptance.**

## 7. Source anchors and maturity limits
| Source | What was actually observed/read | Limit |
|---|---|---|
| [Harness universal projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) | Source currently distinguishes browser attachment/verified thread, provider rail and a set of known rich part kinds; warns that read-page rows don't imply native message IDs. | This projection is not a fully persisted user-world library. |
| [Harness chat shell](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) and [HTML](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.html) | Explicit state vocabulary and source qualifiers, local selection, provider conversation UI. | No proof of integrated project/knowledge/restore journey. |
| [Harness conversation runtime](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-runtime.mjs) | Persistent operational conversation records, exact binding, existing single actor. | Operational snapshot != complete durable selected personal conversation. |
| [Harness continuity](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) | Evidence-derived same-origin/site keyed joins; ambiguous source remains isolated. | Not sufficient to auto-map across accounts or into editable local Projects. |
| [Harness local search](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs) | Local BM25-like index with source references and optional expansion. | No verified cross-object user-note/project indexing in one app. |
| [Harness exports](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs) | Read-only transcript/dataset/knowledge/bundle exports. | No established full VIVIM-world clean restore/import. |
| [Harness Studio server](https://github.com/owenservera/vivim-harness/blob/main/src/studio/server.mjs) | Existing loopback Studio API/service paths. | Live user-facing integrated application acceptance remains unverified. |
| [Harness governing architecture](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md) and [prior integrated V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) | Existing provider-chat-first design and wider vision. | Product Agent's subsequent local-world-first *priority* needs later alignment by engineering owner; no Harness docs changed here. |

## 8. Interview ledger — genuine product forks, no silent choice
### D01 — FIRST INTERVIEW NOW: primary landing/navigation mental model
**The four journeys and local-world identity are already settled. The open fork is what the person sees as the primary home.** This affects visual hierarchy, first-run, fast re-entry and whether a conversation or project is the default work context; it **does not** decide technology.

- **A — Project/world-first:** open into the user's VIVIM Projects / active world, with recent conversations inside and a quick-open Library. Suits long-lived meaning and cross-provider context; adds one click to an unorganized conversation.
- **B — Conversation/library-first:** open into a unified saved conversation feed; save/organize into Projects from within reading. Fast for source recovery; may make VIVIM feel too much like another provider chat browser.
- **C — Balanced home/workbench:** one compact dashboard with “Continue project”, “Recently saved” and universal Find; one click into either. Flexible but adds design surface and may dilute first-action clarity.

**Provisional Product Agent recommendation: A with prominent recently saved items**, if the priority is to differentiate VIVIM as your own semantic world. **No owner choice is inferred.** Ask owner once; do not finalize screen hierarchy before answer.

### Later forks — ask only when design actually reaches them
- **D02 — first-run data entry**: sample-first vs import-first vs supported live read path; feasibility must be demonstrated before displaying unimplemented actions. Do not force user now.
- **D03 — organizational depth**: minimal project/list+notes vs spatial cards/canvas as default. Existing P1 says infinite canvas isn't a G1–G5 prerequisite; revisit only on actual UX value.
- **D04 — export defaults**: include all locally held project-linked material vs selected-only default; both require explicit inclusion/omission preview and privacy exclusions, technical collision rules reserved to P2.
- **D05 — visible knowledge layer**: explain relationships contextually vs a prominent separate knowledge view. Defer until J1–J4 user flow creates a grounded demand.

## 9. Status / continuation instructions
**Completed now:** refreshed actual owner P1 source decisions, designed full four journeys, user-visible states/permissions, adversarial product acceptance and Harness-based reality trace. No production code or external browser effects.
**Pending owner's answer:** D01 primary home. After answer, replace alternatives with approved product direction and detail the chosen first-run navigation, returning-user routes and spatial layout; then mark P1 High complete as a product decision report.
**Not launched here:** P2 Data & Knowledge, Harness gap matrix as a separate report, P3–P6 or Z.ai supplier rounds.
