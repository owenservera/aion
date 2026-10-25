# P1 MEDIUM — VIVIM sovereign world and inbound provider-world understanding

**Date:** 2026-10-25 · **Scope:** P1 product definition only · **Status:** proposed product design, not implementation · **Thinking effort:** Medium.

## 1. Central product thesis

**VIVIM is an independent, richer local world of meaning, with provider worlds treated as evidence-qualified external systems.** “Richer” means the *potential to integrate more user-authorized context across sources over time*, not that VIVIM automatically has a complete or more accurate copy of any provider's data.

A VIVIM Project is not a ChatGPT Project (nor a Claude project, folder or collection). The product must not assume every provider has a native equivalent. VIVIM can aggregate, annotate, relate and curate material from sources whose organizational structures and operations differ.

Two dimensions must remain separate:
1. **What we know:** structural coverage, evidence quality, time, account scope, local completeness.
2. **What we can do:** validated operation availability, exact target, read/effect scope, authorization and uncertainty.

The PRODUCT AGENT specifies the WHAT/WHY/WHERE and truth standards, not technical HOW.

## 2. Two worlds and one translation boundary

### VIVIM world — user-owned
- **Local project:** cohesive user context spanning multiple providers, content types, time periods and user choices.
- **Local conversation:** durable reading object with linked provider origin when known; may also be imported without a live provider binding.
- **Content/artifacts:** selected passages, code, images, files, structured rich parts, references; fidelity and missing media explicitly tracked.
- **Knowledge:** statements and relationships with user/observed/derived status and correction histories; context can exceed what any one provider sees.
- **User overlay:** project tags, annotations, bookmarks, organization and preferences; owned independently of upstream system.
- **Work/intention:** future user-requested actions and observed receipts, but semantic understanding alone does not grant effect permission.

### Provider world — external authority
A provider exposes **some combination** of account, workspace/project/collection, chat/thread, message, part, attachment, instruction, tool, sharing/export and history operations. These are *possible families*, **not asserted universally supported structures**. A browser tab, UI route or page title is neither an account nor a durable conversation identity.

### Translation boundary — Harness responsibility
Source-qualified observations allow local projections to *refer to* an external object; they never make the local and remote objects identical. Mapping is typed and directional. A field may be **verified / source-observed / inferred / user-asserted / unknown / contradicted / stale**, with observation time, coverage and basis. These are proposed product semantics, not a mandated schema enumeration.

## 3. Relationship semantics that matter

| Relationship | Product meaning | Failure to avoid |
|---|---|---|
| VIVIM Project **contains/curates** local content | User organizes without changing original provider data | Mistaking a VIVIM project for a provider-side project |
| LocalConversation **originates_from** native thread | Trace source conversation where evidence supports identity | Joining by matching title or tab URL |
| NativeThread **belongs_to** account/scope | Remote identity is provider-scoped, possibly unresolved | Cross-account merges |
| NativeThread **located_in** native container | Optional provider hierarchy, only when observed | Inventing a “project” node |
| SavedPart **derived_from / references** message/part/evidence | Reuse with attribution and version/coverage awareness | Loss of native parts or false provenance |
| UserNote **comments_on** content | User meaning may differ from original source | Rewriting evidence as correction |
| VIVIM Project **references** provider object | A remote-only reference need not imply locally held content | Incomplete export presented as complete |
| Capability **applies_to** provider/account/surface/object | Operations are scoped, time-sensitive and validated | Assuming a same-named operation has same effect |

**Cardinality:** Many local projects can link the same local conversation, and one local project can contain items from many providers/native containers. One external thread can have multiple local observations or revisions. A native container should not become a local VIVIM Project automatically.

## 4. Coverage: the missing product dimension

The user needs to know **what has been collected versus what merely exists remotely**, without exposing misleading percentages when the total is unknown. For any provider account/container/thread, useful coverage labels include:
- **Not connected** — no current authorized access.
- **Referenced only** — URL/name/identity known; contents not available locally.
- **Partially observed** — selected messages/parts/page ranges captured, with gaps.
- **Locally available** — content present locally, but not necessarily every native revision or attachment.
- **Source-qualified complete for declared scope** — only when observation supports a bounded, explicit scope; never a blanket complete-account claim.
- **Stale/unknown** — earlier observation cannot prove current state.

This dimension applies independently to structure, contents, attachments, revisions and operations. For example, chat message text might be local, while provider-hosted attachments are reference-only. A fully exported *local project* may still be only a partial record of its linked external conversations.

## 5. Capability meaning and the crucial export example

An operation must show its **owner and effect scope**:
- **VIVIM-local** (rename VIVIM project, add note, export selected locally available project contents).
- **Provider read** (inspect a visible provider-native thread/container when a proven read path exists).
- **Provider effect** (create/send/rename/delete only when validated and authorized through existing Harness actor).
- **Unsupported / unverified / unknown** (do not disguise with an equally named local command).

**“Export Project XYZ”** means the VIVIM project: selected local content, human notes, provenance and an inclusion/omission manifest. It does **not** claim ChatGPT has a native per-project export. If a native provider offers a separate account-level export, its scope is different; do not silently substitute it. Remote-only references appear in the local manifest as references, never as complete content. A later acquire-missing-content step is a separately authorized operation, not an implied side effect of export.

**Rename, move, delete, share, search, duplicate** similarly need an explicit local/provider object and action scope. Same words across systems do not imply operational equivalence.

## 6. Provider-world knowledge stages

**W0 — Represent (needed immediately).** Understand existing Harness-native object classes, typed relationships, exact known source IDs and coverage from fixtures/captured evidence. Where provider structure is undocumented or unknown, retain a typed unknown; no live browser expansion necessary.

**W1 — Discover (after local-world stability for *new* Chrome functionality).** Read currently visible provider navigation, account scope, native objects, pagination, content kinds, attachment relations, observable capabilities and limits. Existing safe read functionality remains usable without implying verified completeness.

**W2 — Reconcile.** Connect repeated observations, provider changes, confirmed aliases, local user choices and contradictory evidence. Preserve old observations and avoid cross-account or cross-provider auto-joins. A provider's renamed/deleted/moved native project should not automatically rename/delete the richer VIVIM Project.

**W3 — Operate.** Offer authorized, source-validated provider effects through the sole Harness browser/effect owner; show target and consequences. Readiness and approval are separate from discovery. Ambiguity blocks effects, even if it does not block showing source-qualified local notes.

Stages describe growing knowledge/ability, not rigid dates or new microservices.

## 7. Implications for the four P1 user journeys

### RETURN — rich source-aware reading
Show local availability and exact source status first. Breadcrumbs can include provider/account/native container/thread only when those links are grounded. A disconnected provider must not prevent a saved local reading session. Partial or unsupported content remains visible with appropriate labels.

### ORGANIZE — the broader world
A VIVIM project can link two provider-origin conversations and separate user notes, regardless of whether those providers expose native projects. Edits to project membership, note or title affect VIVIM only. Preserve source relationships when a remote native container changes.

### FIND — differentiated search scopes
Default search is VIVIM-held content. Optional filters may include local project, provider, native container and source confidence. Show what was indexed and what wasn't; searching an account's remote history is a distinct provider operation, not silently part of local search. A search hit lands on its exact local object and known evidence.

### TAKE — explicit coverage-aware custody
Export selected VIVIM Project data (available saved content, notes, artifacts selected for inclusion) with source identity and typed gaps. Manifest distinguishes **included bytes/content, linked remote references not held, source uncertainty, omitted attachments, privacy exclusions, and version compatibility**. Import reconstructs the local project without claiming to create remote provider containers. Duplicate imports do not create silent fake external identities.

## 8. Product scenarios and adversarial counterexamples

1. One VIVIM Project includes ChatGPT-origin and Claude-origin saved conversations. Project edits stay local.
2. A provider exposes no observed “Project” feature: no provider-project node or fake operation is shown.
3. Two accounts use the same title/thread-looking URL: local links remain separate or unknown.
4. Source records include only a visible page slice: no “complete history” claim.
5. Text captured but attachment only linked remotely: export includes reference and omission, not imaginary file data.
6. A provider native project is renamed: its old observed name survives in provenance, while VIVIM project title remains user-controlled.
7. User annotates or corrects an AI statement: display correction as user assertion, preserve original AI text.
8. A provider capability was observed last week but no longer works: display stale/unverified; no speculative send.
9. Local project deletion never silently deletes remote provider data or raw evidence.
10. Import a VIVIM export into a clean profile: rebuild local relations and preserve links; do not claim restored remote accounts.
11. Same source conversation appears in two local projects: reuse association, avoid forced content duplication.
12. Provider account export is offered but project-scoped export is not: show separate scopes and avoid substitution.

## 9. Source-grounded findings and limits

**Confirmed in source:** `vivim-harness/src/studio/ui/universal-chat.mjs` explicitly separates browser attachment from conversation identity, tabs from account chat index, and known/unverified availability; `projectObservedPageRead` warns positional page rows do not prove native message IDs. `src/capture/conversation-runtime.mjs` uses provider adapter binding and source-scoped operations, including ChatGPT-specific thread handling. `src/intel/continuity.mjs` requires explicit keyed identity and same origin/site scope; keyless entities stay session-local. These support the conservative mapping philosophy.

**Not established here:** current live provider webapp hierarchies or feature completeness, all source routes, authenticated acceptance, complete project export in any provider, full round-trip import, or a working VIVIM local-world layer. Provider examples in this note are illustrative, not claims about current product UIs.

## 10. P1 product-level decisions and open questions

**Recommended now:** independent richer VIVIM Project; typed source links; explicit coverage states; context/provenance never auto-shared; separate local/provider action vocabulary; clean local export with bounded scope; no new Chrome functionality until local core stable.

**Deliberately left for P2/P3 or engineering (not started):** exact graph/store schema, serialization format, identity keys, confidence algorithm, full UI navigation, visual treatments, persistence engine, imports, user-consent mechanics, provider-by-provider capability implementation.

**P1 exit refinement:** V1 Core is not merely a personal library that happens to note origin. It is a **provider-aware personal world** with truthful cross-system relationships from the beginning, even while interactive discovery is phased.

P2–P6 remain unstarted. No Harness implementation, source contracts or governing architecture are changed by this product analysis.
