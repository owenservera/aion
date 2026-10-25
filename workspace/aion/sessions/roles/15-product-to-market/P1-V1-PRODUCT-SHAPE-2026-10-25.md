# P1 — VIVIM V1 Product Shape: the useful personal world

**Date:** 2026-10-25 · **Author/owner:** AION PRODUCT AGENT (Role 15) · **Effort:** HIGH product analysis with MAX boundary recommendations · **Status:** **P1 completed as a proposed product decision brief; not owner-approved engineering instructions or verified V1 functionality**.

**Scenario:** Begin from current `owenservera/vivim-harness` **main** only. Ignore all Z.ai implementation deliveries to date; do not discard existing Harness capabilities. **Only P1 is executing.** P2/P3/P4/P5/P6 are not launched; no production code, tests, Chrome sessions, branches or suppliers were changed by P1.

## 0. The one-sentence product choice

> **VIVIM is a persistent, source-grounded personal AI workspace that lets one person keep, organize, find, reuse, and take ownership of work from AI providers — with governed real-provider interaction attached once the local personal world is stable.**

**The first value proof is not a new chat interface.** It is: *open previously saved AI work → retain the useful part in a project → annotate it → find its original → restart without loss → export and restore the chosen content.* When no provider account is connected, that local experience still works.

**Public promise remains:** Own your AI · Share your AI · Evolve your AI. At this early stage **Own** is demonstrated by persistent local use and portable restoration; **Share** means a deliberate, scoped export, not public posting; **Evolve** means user-controlled curation and corrections, not self-learning automation claims. Live-provider webapps remain central to **the overall V1 destination**, even though *new* Chrome interactivity is deferred to after internal stability.

## 1. Target and first-user definition

**Primary audience:** one individual using their own desktop and AI-provider accounts, not a team administering a company data platform. The app is **useful when offline / disconnected from a provider**, so it should explain precisely which local records are actually available.

**First five-minute impression:** one clearly labelled home/library and an honest ability to inspect a saved conversation. If this is a fresh empty installation, show a truthful empty state with an explicit **sample/demo dataset** option or a deliberate user-provided import. Never imply that private account history has been retrieved, a provider has been authenticated, or a real event has been captured from a synthetic fixture.

**Product-wide invariant:** a provider's remote conversation remains the provider's; VIVIM owns the local copy/projection and user-created relationships without fabricating remote authority, account identity, missing source content or action success.

## 2. The four V1 Core journeys — exact WHAT and WHY

These are **four complete outcomes**, not four independent screens, schemas, engines, coding rounds, or waterfall teams.

### J1 — RETURN / Open a saved rich conversation

**WHAT:** Choose a locally saved conversation and read the preserved sequence of user/assistant messages, rich content parts (text, code, tables, citations, files/artifacts, observed tool/status parts where evidence exists), labels for missing/unknown parts, and known provider/source information. After application restart, open the same local record **without reauthenticating** to its remote provider.

**WHY:** The work remains useful when a webapp, browser session or external account is absent. Users can recognize the original meaning instead of reading a flattened text dump.

**Minimum observable pass:** Given a **clearly labelled, non-sensitive Harness-compatible local fixture or approved saved capture**, open one conversation with 3+ message turns, a code block, a source citation, an artifact reference, an unrecognized opaque content part and one incomplete/unverified source. Restart the app and re-open; ordering, parts, source links, identity and uncertainty remain intact. A source link may be unavailable; state so, do not manufacture it. Selecting a different provider account or tab never silently substitutes another thread.

**Candidate evidence:** [Harness native projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs), [conversation lifecycle](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-service.mjs), [session evidence store](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs), [Final content model](https://github.com/owenservera/vivim-final/blob/master/src/schema/streaming.ts). Atlas signals **VD-0012, VD-0016–0019, VD-0023, VD-0028–0031**, cluster **C-02/C-03/C-04**.

**Boundary:** current lifecycle snapshot is an operational record, not proof of a complete durable user library.

### J2 — ORGANIZE / Save something to a personal project

**WHAT:** Create or name a project; **save/link** a whole local conversation or a selected message part/artifact; add a personal editable note (and optionally a concise title/tag); reopen it from the project later. A saved link must retain the original item's identity and source evidence, not silently duplicate or overwrite the captured original.

**WHY:** AI work stops being a pile of provider-specific conversations and becomes the user's reusable project material.

**Minimum observable pass:** Create project **North Star**; bookmark one content part from J1; attach an artifact and a human note; edit the note; open project again after restart. The note shows **user-authored**; the excerpt shows **captured/derived** status. Removing the bookmark doesn't delete the original conversation or its evidence. Multiple associations are desirable but **not a release gate** until P2 chooses safe relationship semantics.

**Candidate evidence:** [Studio existing surfaces](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/index.html), [Final project UI inspiration](https://github.com/owenservera/vivim-final/blob/master/frontend/src/app/page.tsx), [VIVIM Platform ACU concepts](https://github.com/owenservera/vivim-platform/blob/main/acu/src/types.ts). Atlas signals **VD-0046, VD-0057–0058, VD-0060**, clusters **C-05/C-06**.

**Boundary:** personal notes and project associations are **durable user edits**, not rebuildable inferred facts. No independent graph engine or full canvas is required to express one project.

### J3 — FIND / Search and verify the origin of saved work

**WHAT:** Search and filter **locally saved** conversation text, known titles, personal project names/notes and whatever artifact metadata is genuinely indexed. Open the exact saved item or selected part. Show whether the result is **observed source / derived projection / user-created note / missing evidence** and clearly indicate search-index coverage.

**WHY:** Retrieval is only trustworthy when a user can see why a result appears and whether it actually belongs to their project.

**Minimum observable pass:** Search for a known phrase in the bookmarked artifact or its linked text; find the project note; jump to the correct conversation/part and its source status. Search never confuses identical phrases from different records, and the UI never promises full provider account history. If a source is absent or an index is incomplete, label it rather than fabricate a source.

**Candidate evidence:** [Harness search](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs), [corpus provenance](https://github.com/owenservera/vivim-harness/blob/main/src/intel/corpus.mjs), [scoped continuity](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs), [temporal truth](https://github.com/owenservera/vivim-harness/blob/main/src/intel/temporal-truth.mjs). Atlas signals **VD-0040–0045, VD-0048–0049**, clusters **C-04/C-07/C-08**.

**Boundary:** semantic memory, generalized RAG, embeddings and active knowledge extraction are **not** prerequisite for a useful, accurate first search.

### J4 — TAKE / Export and restore a chosen project

**WHAT:** Choose a project and see the content that would be exported: the project, user notes, linked locally saved conversation records/content parts, selected artifacts and source references. Produce a **documented, versioned portable bundle** and verify that a clean local application can restore it as readable content with preserved origin, even when provider sign-in is unavailable. Sensitive browser/session data excluded by default.

**WHY:** “Own” requires practical portability and recovery, not just a Download button.

**Minimum observable pass:** Export project North Star from J2 with the selected notes and known content parts; inspect the bundle manifest and excluded-sensitive-data statement; import into a **clean/disposable local profile** and re-open the project. Compare names, notes, content parts, source status and known missing evidence against the originating app. No cookies, auth headers, tokens or Chrome profile data are silently included; duplicate/conflicting IDs on repeated import have an explicit non-destructive result.

**Candidate evidence:** [Harness export formats](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs), [Claude Export Hub's explicit inclusion choices](https://github.com/owenservera/claude-export-hub-vivim/blob/main/README.md). Atlas signals **VD-0079–0082**, cluster **C-09**.

**Boundary:** Harness source currently establishes read-only export capabilities, **not** a verified full personal-world import. Export structure, safe default exclusions, collisions and identity handling require P2 decisions and real implementation proof.

## 3. Minimum V1 Core visible footprint

**Four discoverable destinations or functions, in one app shell:** **Library** (saved conversations and rich reading), **Projects** (selected links and user edits), **Find** (local search and source navigation), and **Transfer** (preview, export, restore). They may be panels/routes rather than full pages. A dedicated **Home**, **Knowledge**, **Artifacts**, **Activity**, **Settings**, advanced evidence inspector or canvas can be integrated contextually **only when useful**; they are **not mandatory standalone navigational destinations** for this initial core. Real provider surfaces can remain available through existing Harness tools, but new interaction expansion waits.

**Essential visible states:** empty/not-imported; sample/fixture; local saved; provider available/unknown/disconnected; original source available/missing; rendered native part/unsupported opaque; result observed/derived/user-authored; write saved/failed; export preview/restore verified. *Fewer honest controls beat more unimplemented controls.*

**No design or framework mandate:** preserve the **one Harness application and source/effect authority**, while leaving component framework, UI layout, database format, dependency choice, accessibility implementation and engineering decomposition to subsequent technical design. The engineering goal is **better, faster, less garbage**; *dependency-free is not an owner requirement.*

## 4. Four types of truth that cannot collapse (P1 invariants, not a physical schema)

| Domain | Product meaning | P1 non-negotiable consequence |
|---|---|---|
| **External provider identity** | Provider/account/native thread; browser tab is merely an attachment | Unknown is not equal to verified, never merge by similar title/URL |
| **Captured evidence** | What local Harness actually observed, including gaps and time | Preserve original and qualifier; no user edit masquerades as observed source |
| **Derived reading/knowledge** | A view reconstructed from observation or a declared external import | Mark derivation and source coverage; permit rebuild without deleting user edits |
| **User-owned overlay** | Projects, notes, bookmarks, titles, corrections and deliberate choices | Durable independently of source reprocessing; export with clear privacy scope |

**P2 is reserved** for finer object/ID/identity/relations/storage-independent contracts. P1 does **not** authorize a SQLite/Prisma/IndexedDB decision, migration, alternative evidence store, duplicate capability registry or remote effect authority.

## 5. Integration priorities — capability gaps, not donor transplant instructions

| Priority | Capability question | Already apparent in Harness | Still unproven as a complete user experience | Complexity |
|---|---|---|---|---|
| P0 | Local saved conversation read + restart | Capture/session/operational journal, native rendering, conversation API | Complete independent persisted personal reading projection + stable identity/link | **HIGH implementation, MAX identity** |
| P0 | User project + save + editable note | Studio pages, captured content, search/intel | Durable cross-content personal relationships and human edits | **HIGH, MAX overlay ownership** |
| P0 | Honest local source-aware search | Corpus, lexical index, scoped continuity, temporal evidence | Coverage across all selected local user objects and reliable deep links | **MED/HIGH** |
| P0 | Selective transfer and restore | Read-only exported transcripts/datasets/knowledge/bundles | Safe full personal-world import and conflict handling | **HIGH, MAX identity/privacy** |
| P1 | Helpful first-run and responsive shell | Multiple UI pages, provider chat shell, native rendering | One consistent journey for an unconnected person | **MED/HIGH** |
| P1 | User-controlled correction and source qualifier | Evidence and inferred knowledge distinction | Corrected/pinned user note clearly separate from source | **MED/HIGH** |
| Later | Semantic command + agentic file toolkit | Recovered product library in AION, optional Harness capabilities | Integrated intent-to-authority or file-discovery utility | **MAX design / HIGH implementation** |
| Later | New interactive Chrome + provider breadth | Existing browser/CDP actor and adapter ecosystem | Authenticated external multi-provider usability | **HIGH after stable gate** |
| Later | Infinite canvas, sync/P2P, social sharing, full desktop wrapping | Donor concept repos, packaging ideas | Benefit and maintenance costs | **HIGH/MAX optional** |

**Important:** P0/P1 here are *priority tiers*, not the team workstream names P1/P2/P3.

## 6. Acceptance and sequencing

One thin vertical slice should cumulatively pass:
- **G0 — source reality**: engineer verifies current Harness main vs any assumed state; test scope/receipt identified; **this document cannot assert G0 complete**.
- **G1 — READ**: J1 opens a heterogeneous locally saved conversation with provenance and persists across restart.
- **G2 — OWN**: J2 saves linked parts/artifacts to a named project and edits a user note without touching source evidence.
- **G3 — FIND**: J3 searches locally saved records, deep-links correctly and labels coverage/source uncertainty.
- **G4 — TAKE**: J4 exports a selected project and restores it in a clean profile, with sensitive-data negative proof and identity collision behavior.
- **G5 — STABILIZE**: one running application demonstrates J1–J4 *together* through actual local persistence; include restart, corrupted/missing input, partial-write/recovery, unsupported parts and duplicate-import cases; record environment and reproducible tests.
- **G6 — CONNECT**: only after G5, introduce **new interactive Chrome/CDP integration and controlled-browser acceptance** through existing Harness effects authority; owner authenticated provider/Windows checks remain a separate gate.

**Release naming:** G1–G5 collectively form the **V1 Core / internal personal-world preview**, **not complete public VIVIM V1**. A full connected V1 release still needs live provider acceptance and distribution/user usability criteria. The earlier [integrated V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) calls its earlier sequence V1-A through V1-D. We are proposing to **prioritize local ownership before live-provider-first work**, not claim that blueprint was silently rewritten.

## 7. Explicit non-goals before G5

**Not required:** a new provider connector or authenticated ChatGPT/Claude run; Chrome profile launch changes; live send/follow-up; cross-provider chat migration; full account chat indexing; a separate chat application; provider model-routing optimization; agentic autonomy; unbounded capture; inferred memories as verified fact; semantic embedding/RAG; multi-agent Work execution; full NLCL parser integration; mandatory agentic file generator; full MCP/CLI surface parity; infinite canvas; P2P/cloud sync; social sharing; public archive/marketplace; responsive phone control; network account sharing; desktop installer redesign; telemetry/analytics platform; an onboarding chatbot/wizard.

**Still essential:** preserve existing Harness's browser/evidence capabilities and safe behavior, even if not extended now. *Defer new feature work; do not rip out or weaken the existing actor.*

## 8. Constraints, evidence, and unresolved conflicts

**Source-confirmed:** [Harness governing architecture](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md) prioritizes one unified provider conversation shell, existing CDP/capture, evidence, search and explicit effects; [V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) proposes real-provider V1-A before personal-world V1-B; [native projection source](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) exposes typed display primitives. None demonstrates that J1–J4 are already integrated or locally accepted.

**New explicit owner direction from this product discussion:** start from Harness and make the personal world internally stable **before new Chrome interactivity**. This **changes work priority** relative to current Harness root `ARCHITECTURE.md` and V1-A stage order. **No governing Harness documentation was edited by P1**; align architecture owners and this brief before implementing divergent code.

**Additional document conflict:** Harness governing architecture still expresses **zero-dependency Node >=22** as an engineering principle; the owner has since clarified **dependency-free is not a hard requirement**. Product decision: adopt useful dependencies when total effort, performance, security and maintenance justify them. **P1 does not change Harness's root guidance; later reconciliation required.**

**Open MAX questions for later, deliberately not resolved in P1:**
- Which local object IDs and identity evidence bind an imported/saved transcript to a known provider account/thread/capture? How are ambiguity and collision represented?
- How does user-authored overlay survive re-derivation, re-import and a missing original source?
- What safe import/export redaction and source-lineage metadata constitute adequate personal custody?
- What minimum accepted local evidence format is usable without a signed-in provider (especially fresh installs)?
- What UI/packaging choice best uses existing Harness without forcing a parallel product?

## 9. P1 handoff boundaries (no agents invoked)

- **To P2 DATA & KNOWLEDGE (when separately authorized):** refine four truth domains into minimal source-qualified object contracts, ID/link rules, overlay durability and adversarial cases. Do not select technology as fact.
- **To P3 EXPERIENCE & ACCEPTANCE (when separately authorized):** convert J1–J4 into a truthful first-user interaction flow, small fixture examples, accessibility/empty-state behavior and executable acceptance tests; no new Chrome requirements.
- **To P4 LOCAL REALITY (when separately authorized):** verify actual Harness capability/deltas, Windows readiness and root-architecture conflicts; no assumption that source inspection is local installation.
- **To P5 PRODUCT SYNTHESIS (when separately authorized):** adjudicate P1 against P2–P4 and owner preference; lock the accepted V1 target and shortlist only outcome-driven BUILD/HARVEST decisions.
- **To Z.ai P6 (when separately authorized):** WHAT/WHY/WHERE and user-visible acceptance, not HOW. Z.ai's LOW/MED/HIGH engineering choices are independent; MAX decisions stay Product Agent/local models.

## 10. Reference anchors

- Harness [current architecture](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md), [V1 proposed blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md), [universal chat projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs).
- Product Agent [clean-start recommendation](V1-CLEAN-START-FROM-HARNESS-2026-10-25.md), [work distribution contract](V1-WORK-DISTRIBUTION-2026-10-25.md).
- Discovery [116-signal atlas](discovery/VIVIM-CAPABILITY-ATLAS.yaml), [18-cluster, seven-journey crosswalk](discovery/V1-VALUE-CHAIN-CROSSWALK.yaml), [R2 source audit](discovery/R2-EVIDENCE-AUDIT-2026-10-25.md).

**P1 exit:** one coherent product shape with 4 journeys, explicit inclusions/exclusions, linked source candidates, staged gates, MAX conflicts and owner-review readiness. **No claim of user approval, execution, deployment, tests or a second workstream.**
