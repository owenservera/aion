# P5 — VIVIM V1 Integration Master Worklog / Agent Handoff

**25 October 2026 · Owner: AION Product Agent (Role 15) · Scope: Harness main only; ignore Z.ai's prior branch delivery.** This is the **complete planning/dispatch map for the selected V1 Core**, not evidence that implementation work has been done. The owner requested P5 now without consuming local agent time on prerequisites. **No local execution was required or undertaken.** P1–P4 source findings are fused here; all implementation choices remain with local or remote coding agents unless marked MAX.

## Product north star and release ladder

**Product:** a source-grounded personal AI workspace. **V1 Core** proves J1 **RETURN** (saved rich AI work after restart), J2 **ORGANIZE** (project + bookmark/artifact + editable note), J3 **FIND** (search and navigate back to authentic source with uncertainty), J4 **TAKE** (selected export and clean restore). Real connected provider Chrome work is **G6**, after a stable **G5** internal application. Core ≠ public connected V1.

**Status meanings:** `OPEN` = assigned capability gap/proposed work, **not proof entirely absent from source**; `OPTIONAL_V1` = may help but not gate; `DEFERRED` = excluded from current core; `VERIFIED` can be used only with independent code and test receipts. None of W00–W14 is recorded as implemented by this planning document.

## Worklog / delivery graph

Each row is a working contract, not an instruction on libraries, subagents, runtime, database, schema layout or code structure. **Z.ai/local integration agents decide HOW**, optimize better/faster/less garbage, can use justified dependencies. MAX arbitration is owned by Product Agent/local architecture models.

| Work ID | WHAT / Delivery slice | Stage | Effort | Status | Depends on |
|---|---|---|---|---|---|
| W00 | Baseline inventory and seam discovery | G0 | HIGH | OPEN | none |
| W01 | Resolve local world and identity contract | G1 | MAX | OPEN | W00 |
| W02 | Build durable offline conversation reading | G1 | HIGH | OPEN | W01 |
| W03 | Preserve mixed native content and fidelity | G1 | MED | OPEN | W01 |
| W04 | Source evidence and authority provenance bridge | G1-G3 | HIGH | OPEN | W01, W02 |
| W05 | User-owned project and association overlay | G2 | HIGH | OPEN | W01, W02 |
| W06 | Personal notes, edits and correction provenance | G2 | MED | OPEN | W05 |
| W07 | Local search, scoping and exact deep links | G3 | HIGH | OPEN | W02, W04, W05, W06 |
| W08 | Knowledge presentation and qualified derived claims | G3 | MED | OPTIONAL_V1 | W04, W07 |
| W09 | Selective portable export contract and preview | G4 | HIGH | OPEN | W01, W02, W05, W06 |
| W10 | Clean-profile import and safe identity reconciliation | G4 | HIGH | OPEN | W09 |
| W11 | One cohesive UI and first-use honesty | G1-G4 | HIGH | OPEN | W02, W03, W05, W07, W09, W10 |
| W12 | Vertical acceptance, durability and failure gates | G5 | HIGH | OPEN | W02, W03, W04, W05, W06, W07, W09, W10, W11 |
| W13 | Governed browser/provider attachment | G6 | HIGH | DEFERRED | W12 |
| W14 | Semantic commands, agentic files, canvas and sync discovery | post_core | MAX | DEFERRED | none |

## Canonical work-item contracts

### W00 — Baseline inventory and seam discovery (HIGH)

- **WHY / Journey / Gate:** J1-J4 · G0 · X01-X10.
- **WHERE to inspect:** `src/studio/server.mjs;src/studio/integration-hub.mjs;src/studio/ui/chat.mjs;src/capture/conversation-service.mjs`.
- **CURRENT source evidence:** Source-review available; local checkout unknown.
- **WHAT outcome:** Define observed entrypoints, tests, absent routes and compatible core assumptions; don't halt integration for a PC-wide audit.
- **Acceptance:** Route names, physical files, test entrypoints and actual gaps recorded by implementer.
- **Dependencies:** none. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W01 — Resolve local world and identity contract (MAX)

- **WHY / Journey / Gate:** J1-J4 · G1 · X01,X03,X09,X10.
- **WHERE to inspect:** `src/capture/conversation-thread.mjs;src/capture/conversation-runtime.mjs;src/intel/identity.mjs;src/intel/continuity.mjs`.
- **CURRENT source evidence:** Scoped identities exist; local personal object IDs not proven.
- **WHAT outcome:** Distinct local world/conversation/message IDs, source refs, known/unknown account-thread mappings, imports as foreign identity; no probabilistic auto-merge.
- **Acceptance:** Colliding titles/accounts and unknown thread states cannot coalesce.
- **Dependencies:** W00. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W02 — Build durable offline conversation reading (HIGH)

- **WHY / Journey / Gate:** J1 · G1 · X01.
- **WHERE to inspect:** `src/capture/conversation-service.mjs;src/store/session.mjs;src/studio/conversation-api.mjs`.
- **CURRENT source evidence:** Operational journal and capture storage exist; library unverified.
- **WHAT outcome:** Saved or fixture conversation reopens without attached provider; preserve message ordering and local namespace.
- **Acceptance:** Restart local service; same conversation/turns/source refs available.
- **Dependencies:** W01. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W03 — Preserve mixed native content and fidelity (MED)

- **WHY / Journey / Gate:** J1 · G1 · X02,X03.
- **WHERE to inspect:** `src/studio/ui/universal-chat.mjs;src/studio/ui/chat.mjs;src/replay/;vivim-final/src/schema/streaming.ts`.
- **CURRENT source evidence:** Existing rendering and capture projections; cross-restart fidelity unverified.
- **WHAT outcome:** Read text/code/table/citation/artifact/unknown/partial parts through one product UI; missing assets explicitly labeled.
- **Acceptance:** Opaque part survives persist/reopen, no silent content flattening.
- **Dependencies:** W01. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W04 — Source evidence and authority provenance bridge (HIGH)

- **WHY / Journey / Gate:** J1,J2,J3 · G1-G3 · X03,X09.
- **WHERE to inspect:** `src/store/raw-log.mjs;src/store/session.mjs;src/intel/corpus.mjs;src/intel/continuity.mjs`.
- **CURRENT source evidence:** Source and gap records exist; user item linkage unverified.
- **WHAT outcome:** Trace derived and imported items to captured origin or mark unavailable; never overwrite evidence with user edits.
- **Acceptance:** Evidence pointer/gap state visible from saved content; source unchanged after note edit.
- **Dependencies:** W01, W02. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W05 — User-owned project and association overlay (HIGH)

- **WHY / Journey / Gate:** J2 · G2 · X04,X09.
- **WHERE to inspect:** `src/studio/ui/index.html;src/store/versioned.mjs;vivim-final/frontend/src/app/page.tsx`.
- **CURRENT source evidence:** No verified first-class workspace endpoints in scanned hub.
- **WHAT outcome:** Create project; associate a conversation, part, artifact; link/unlink without destructive source writes; durable edits.
- **Acceptance:** North Star project and links persist after restart; unlink preserves raw source.
- **Dependencies:** W01, W02. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W06 — Personal notes, edits and correction provenance (MED)

- **WHY / Journey / Gate:** J2,J3 · G2 · X04,X09.
- **WHERE to inspect:** `src/store/versioned.mjs;src/intel/continuity.mjs;P2 logical overlay contract`.
- **CURRENT source evidence:** Versioned/CAS patterns exist; user annotation store unverified.
- **WHAT outcome:** Create/edit note separate from provider observation; expose author/time/revision; fail explicitly on conflicts.
- **Acceptance:** Edited note retained, conflicting updates controlled, original hash unchanged.
- **Dependencies:** W05. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W07 — Local search, scoping and exact deep links (HIGH)

- **WHY / Journey / Gate:** J3 · G3 · X05.
- **WHERE to inspect:** `src/intel/search.mjs;src/intel/corpus.mjs;src/studio/integration-hub.mjs`.
- **CURRENT source evidence:** BM25 corpus index and /api/v1/search exist; user note index unverified.
- **WHAT outcome:** Index selected saved conversations, project names, notes, available artifact metadata; query and link to exact local ID/part.
- **Acceptance:** Same text in two records returns separately; scope and freshness stated.
- **Dependencies:** W02, W04, W05, W06. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W08 — Knowledge presentation and qualified derived claims (MED)

- **WHY / Journey / Gate:** J3 · G3 · X03,X05,X09.
- **WHERE to inspect:** `src/intel/graph.mjs;src/intel/continuity.mjs;src/intel/temporal-truth.mjs`.
- **CURRENT source evidence:** Existing intelligence; personal-world app wiring unverified.
- **WHAT outcome:** Surface source-linked inference only when helpful to J3; no mandatory new autonomous memory engine.
- **Acceptance:** Derived claims visibly distinct from observed and user-authored data.
- **Dependencies:** W04, W07. **Status:** OPTIONAL_V1. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W09 — Selective portable export contract and preview (HIGH)

- **WHY / Journey / Gate:** J4 · G4 · X06,X10.
- **WHERE to inspect:** `src/export/export.mjs;src/store/session.mjs;claude-export-hub-vivim/README.md`.
- **CURRENT source evidence:** Session export exists; personal-world selection unverified.
- **WHAT outcome:** User chooses project and included items; versioned manifest, absent-source qualifiers, privacy exclusions and preview.
- **Acceptance:** Bundle preview and manifest match chosen scope; no cookies/auth headers/browser profile.
- **Dependencies:** W01, W02, W05, W06. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W10 — Clean-profile import and safe identity reconciliation (HIGH)

- **WHY / Journey / Gate:** J4 · G4 · X06,X10.
- **WHERE to inspect:** `src/export/export.mjs;src/store/versioned.mjs;P2 import contract`.
- **CURRENT source evidence:** No verified full personal-world import.
- **WHAT outcome:** Restore selected bundle into clean isolated world; validate hashes/paths/schema, repeat import and conflicts; no remote account binding.
- **Acceptance:** After import same user note/parts/links; duplicate import nondestructive.
- **Dependencies:** W09. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W11 — One cohesive UI and first-use honesty (HIGH)

- **WHY / Journey / Gate:** J1-J4 · G1-G4 · X01-X08.
- **WHERE to inspect:** `src/studio/ui/index.html;src/studio/ui/chat.mjs;src/studio/ui/universal-chat.mjs`.
- **CURRENT source evidence:** Existing Studio and chat surfaces; no integrated J1-J4 proof.
- **WHAT outcome:** Expose Library, Projects, Find, Transfer in one coherent app, demo/empty/offline/unknown states, keyboard and truthful feedback.
- **Acceptance:** User completes journey without CLI or switching independent apps.
- **Dependencies:** W02, W03, W05, W07, W09, W10. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W12 — Vertical acceptance, durability and failure gates (HIGH)

- **WHY / Journey / Gate:** J1-J4 · G5 · X01-X10.
- **WHERE to inspect:** `test/unit/;test/e2e/;scripts/architecture-inventory.mjs`.
- **CURRENT source evidence:** Test runner and inventory script confirmed; no accepted J1-J4 full run.
- **WHAT outcome:** Run one integrated scenario, restart, partial write, missing source, conflicting import, secret exclusion, negative tests; report proof tier.
- **Acceptance:** One disposable local profile passes full J1→J4, exact command+SHA+environment.
- **Dependencies:** W02, W03, W04, W05, W06, W07, W09, W10, W11. **Status:** OPEN. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W13 — Governed browser/provider attachment (HIGH)

- **WHY / Journey / Gate:** future · G6 · X07,X08.
- **WHERE to inspect:** `src/cdp/;src/capture/conversation-runtime.mjs;src/studio/conversation-api.mjs`.
- **CURRENT source evidence:** Existing actor; new Chrome functionality deferred.
- **WHAT outcome:** Only after G5, extend existing effect authority and verify controlled Chrome; owner-authenticated Windows proof separate.
- **Acceptance:** Controlled CDP identity/consent test with no second actor.
- **Dependencies:** W12. **Status:** DEFERRED. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

### W14 — Semantic commands, agentic files, canvas and sync discovery (MAX)

- **WHY / Journey / Gate:** future · post_core · C10,C11,C14,C15.
- **WHERE to inspect:** `aion/.../15-product-to-market/core-library/;vivim-final/;infinite-canvas-vivim/;vivim-network/`.
- **CURRENT source evidence:** Source/vision candidates, integration payoff unproven.
- **WHAT outcome:** Retain WHAT/WHY/WHERE only, reopen after V1 shape and acceptance; no automatic harvesting.
- **Acceptance:** Separate owner value decision before any code harvest.
- **Dependencies:** none. **Status:** DEFERRED. **Owner:** unassigned implementation; Product Agent coordinates mapping and MAX decisions.

## Critical path and concurrency

```text
W00 baseline/source map (bounded; no PC-wide inventory required)
  └─ W01 identity/evidence/ownership contract [MAX]
        ├─ W02 durable reading ─ W03 rich content ─ W04 source/evidence mapping
        ├─ W05 projects ─ W06 user notes
        └─ W07 saved search & deep links
                         └─ W09 selected export ─ W10 import/reconcile
             W11 cohesive UI assembled along the way
                         └─ W12 full vertical acceptance = G5
                                  └─ W13 browser provider integration = G6 (later)
W08 optional knowledge UI; W14 deferred capability harvesting
```

The graph is a **logical constraint**, not an order to serialize every edit: W02/W03 and W04 can overlap after a shared interface; W05/W06 can proceed with stable object identities; W07 can consume finished records as they arrive. W11 should evolve throughout rather than wait until all modules are finished. W12 acceptance should be run incrementally and at final G5.

**Fastest complete slice:** one saved heterogeneous conversation → one saved note/project association → exact local search hit → restart → selective export → safe clean-profile restore. No new authenticated provider browser is needed to prove it.

## P1–P4 reconciliation and explicit decisions

**Accepted product principles for this worklog (owner still owns final approval):** four truth domains (external provider identity, immutable captured evidence, rebuildable knowledge/projections, durable user overlay), scoped explicit IDs, no auto-merge by title/text, no direct mutation of raw evidence by user annotations, source completeness stated, no claim of live completion from fixture runs, one authorized provider effect owner in Harness.

**Do not overinterpret existing modules:** `src/capture/conversation-service.mjs` journals operational lifecycle, not a full archive; `src/store/session.mjs` stores capture sessions; `src/studio/ui/universal-chat.mjs` projects native content but is not a cross-restart library; `src/intel/search.mjs` indexes source corpus but not proven personal notes; `src/export/export.mjs` exports captures but full personal-world importer unverified; `src/studio/integration-hub.mjs` declares sessions/replay/knowledge/search endpoints, not clearly user project creation. **Inspect before building; source scan does not prove universal absence.**

**Two repository-guidance conflicts requiring deliberate engineering treatment, not new local verification homework:** Current Harness documents live-provider-first ordering and a zero-dependency Node principle. Owner directs personal-world-first and an outcome-driven dependency policy. This P5 worklog records the user product decision, but does not modify Harness root guidance. When a proposed implementation genuinely conflicts with governing architecture, surface precise changed-file proposal and owner/architect choice. Never quietly fork authority.

**P2 MAX decisions resolved enough to proceed with implementation:** Logical separate namespaces and source/evidence/user-owned overlay are hard product invariants. Physical persistence engine, portable file packaging, UI framework, migration implementation and exact dependencies stay **HOW choices** for engineering within those invariants. Account-link ambiguity stays unverified; don't stall all work to solve providers not yet accessed.

## Completion contracts by gate

- **G0 — source reality:** current main commit, relevant route/storage behaviors, source and tests evaluated *as part of implementation*, not a freestanding costly PC audit.
- **G1 — RETURN:** local fixture/saved source persists across restart, rich parts (text/code/table/citation/artifact/opaque) and gaps visible; stable local ID distinct from native thread.
- **G2 — ORGANIZE:** create/edit project/note, link/unlink content without changing captured source, survive restart.
- **G3 — FIND:** search a source phrase and note with exact local links, index coverage truth, no conflation of duplicates.
- **G4 — TAKE:** preview selected bundle, export/import into clean local profile with loss/permission/collision checks; no browser secrets.
- **G5 — STABILIZE:** combined J1→J4 journey in *one running app*, partial/corrupt input, repeat-import and recovery negatives, actual command/test SHA and environment. Not a mere green isolated module.
- **G6 — CONNECT:** controlled site through **existing** CDP authority after G5, real authenticated/Windows verification separately graded.

**Proof ladder:** `source-only` → `fixture/offline-tested` → `saved-real-data-tested` → `controlled-Chrome-tested` → `owner-authenticated/Windows-verified`. A test result must state which tier and never upgrade merely because later tiers are planned.

## Integrator handoff and minimum status receipts

For each delivered work item require:

```yaml
work_id: W02
what_changed: []
actual_source_files: []
commit_sha: null
branch: null
implementation_decision: null
dependency_tradeoff: null
test_commands: []
test_results: []
evidence_tier: source-only
user_journey: J1
known_gaps: []
next_dependencies: []
```

Evidence should include original source path/commit, changed modules, API behavior, tests run and failures, migration/collision/privacy decisions. Local model is master for installed Windows truth. GitHub is task/evidence transport; no Slack, no parallel status platform. Do not share private raw captures, cookies, tokens, downloaded user conversations or physical PC path details.

## Source and decision package for all implementers

- [P1 — Product Shape](P1-V1-PRODUCT-SHAPE-2026-10-25.md) · four journeys, explicit inclusions/non-goals.
- [P2 — Data/Knowledge](specialists/data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md) · four truth domains, typed IDs, 20 adversarial conditions.
- [P3 — Experience/Acceptance](specialists/experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md) · ten capability-to-source seams and deterministic vertical fixture.
- [P4 — Remote Harness Reality](specialists/local-reality/P4-HARNESS-REALITY-AUDIT-2026-10-25.md) · observed routes/store and unverified local facts (no blocker).
- [Machine-readable discovery crosswalk](discovery/V1-VALUE-CHAIN-CROSSWALK.yaml) · 18 capability clusters / seven candidate journeys.
- [116-signal atlas](discovery/VIVIM-CAPABILITY-ATLAS.yaml) · source interests; **not** 116 required implementations.

**Scope closure:** P5 produces one implementation-ready, evidence-ranked master map. It does not create GitHub engineering issues, assign local work, write Harness code, perform Windows audits, run Z.ai, or launch new ChatGPT agents. These changes require an explicit execution request.
