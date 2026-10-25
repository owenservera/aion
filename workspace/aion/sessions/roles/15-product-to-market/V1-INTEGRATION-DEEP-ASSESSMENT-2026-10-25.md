# VIVIM V1 — Deep integration assessment and Z.ai execution allocation

**As of:** 2026-10-25 · **Owner:** AION Role 15 PRODUCT AGENT · **Status:** product-level integration assessment; executable scope proposals only, NOT unapproved migrations or completed app acceptance.

**Inputs observed:** Z.ai R1 attached `.patch`, `.bundle`, `.tar.gz`, `MANIFEST.txt` for branch `zai/v1-pass1-shell` commit `034ced9e368e62e7a15b318a2656ce267c8a10b0`, base `030895e79480f23e8929e4a5de5e80d74aa8c490`; files inspected from extracted source tree. Latest GitHub default-branch source paths sampled. Prior [original milestone map](V1-MILESTONE-MAP-2026-10-25.md), [product V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md), [execution order](ZAI-EXECUTION-POLICY.md). Branch search for `zai/v1-pass1-shell` found **no remote branch**, so attachment delivery is not proof of push, merge, or local Windows installation.

## 0 — The thesis: integrate WHAT, not inherited HOW

Previous repositories largely contain AI-authored concept implementations. Treat each as an **untrusted engineering proposal** and evidence of potentially useful user behavior. Keep proven functions, source provenance, test fixtures, UX insights and useful algorithms; replace brittle frameworks, duplicate stores and actor-control layers with a smaller implementation compatible with the existing Harness runtime. Do not discard a working component because an older model wrote it, nor accept it merely because a README calls it complete. Prefer *behavior contract + focused tests* to file transplant. Our MAX-level architecture decisions pre-bound the Z.ai LOW/MED/HIGH coding jobs.

## 1 — R1 precise source status

R1 changed six files:
- `src/studio/ui/chat.html`: left `nav.rail` provider/conversation list and new three-column >=1100px layout, guidance/restore banners.
- `src/studio/ui/chat.mjs`: capability/provider-row, client-only search, history kind and honest restore helpers; wired provider selection/search and new list layout. Not a new backend or project-wide search engine.
- `src/capture/conversation-runtime.mjs`: `targets().sites` additive site capabilities `label, hasComposer, sendStrategy, requiresAuth, threadIdentity` while retaining `id,adapter,url`.
- `test/unit/chat-shell-ui.test.mjs`: 16 focused offline UI tests.
- `ARCHITECTURE.md`, `QA-NEXT-TESTS.md`: provenance and QA notes.

**Independently executed against attached extracted tree:** `node --test test/unit/chat-shell-ui.test.mjs` -> **16/16 passed**; `node scripts/architecture-inventory.mjs --check` -> **0 uncovered, 0 missing ownership**. The source checkpoint **claims** full suite 1721, pass 1719, one environment-sensitive failure and one todo; this is a separate R1-reported result, not rerun in this assessment. No authenticated browser test; interactive Chrome deliberately deferred.

R1 provides a navigational shell, NOT the integrated persisted VIVIM world. The user-visible conversation search filters already loaded rows rather than full knowledge. `sessionStorage` holds drafts/sent prompt text, `localStorage` selected conversation ID; neither is durable canonical conversation/transcript persistence. A missing selection generates an honest note but does not reconstruct a missing remote/native conversation.

## 2 — Existing Harness capability reality, not supposed gaps

The actual extracted Harness code contains:
- `src/studio/ui/universal-chat.mjs` (290 lines): `projectWorkspace`, `projectObservedPageRead`, `projectCapability`, `evidenceRef`, `projectOutcome`, `createConversationStore`, `renderNativeBlock`. Many display and evidence controls already exist.
- `src/studio/ui/chat.mjs` (>2,000 lines): rich formatting/part parser, `replyBlocks`, `replySources`, `replyArtifacts`, conversation selection, read/render/composer/uncertain-state handling. **Existing rich response renderer is real**, but its input representation is not the same as all donor ContentPart schemas.
- `src/capture/conversation-service.mjs` (637 lines): snapshot, turns/attempts, reply journal, evidence/digest validation, uncertain-send lifecycle. **Not** a complete authoritative offline transcript or user knowledge DB.
- `src/capture/conversation-runtime.mjs`: `targets/list/get/read/connect`; `read` requires a live exact binding and returns a bounded observed transcript, not a portable persisted knowledge item. Reading a closed saved record can return `READ_REQUIRES_LIVE_CONVERSATION`.
- `src/store/session.mjs` and `raw-log.mjs`: session/dataset, append-only capture segments, raw indexes and source receipts; `src/store/versioned.mjs`, `integrity.mjs` support distinct operations.
- `src/intel/search.mjs` (`CorpusSearchIndex` BM25-like index), `corpus.mjs`, `continuity.mjs`, `graph.mjs`, `identity.mjs`, `temporal-truth.mjs`: intelligence/retrieval primitives, primarily tied to observations and captures, not yet a product-grade personal workspace.
- `src/export/export.mjs`: transcript `md/html/json`, datasets `jsonl/json/csv/tsv/md/html`, knowledge `json/ndjson/md/html`, graph `json/dot/mermaid/graphml`, bundle manifests. **Export capability exists**, but complete user-owned VIVIM workspace round-trip/import is not demonstrated.
- `src/studio/server.mjs`: existing session, knowledge/continuity/search and export routes; importantly the **existing root Studio UI** (`src/studio/ui/index.html`) has separate Sessions, Knowledge and Search views. Product challenge: connect to ONE app navigation/identity instead of copying another backend.
- `src/mcp/{runtime,server-stdio,resources,jsonrpc}.mjs` and `bin/commands/`: existing MCP/CLI tools. New second transport/registry is not justified.

**Key distinction:** existing primitives != a fully wired user journey. Capture sessions, browser conversation snapshots and semantic interpretations are different types with different authority and lifetimes.

## 3 — Data ownership and four risky joins (MAX decisions reserved)

**Decision D1: Single product identity graph, not one massive copied schema.** Stable VIVIM IDs for `Conversation`, `Message`, `Artifact`, `Workspace`, `KnowledgeItem`; explicit relations to `ProviderAccount`, `ProviderThread`, `CaptureSession` and `EvidenceRef`. No equality based on title/text/URL alone; unknown or ambiguous links stay unknown. Define exact account scope from real evidence only.

**Decision D2: Evidence-versus-projection separation.** Raw network/page observations and accepted evidence remain immutable under existing Harness store. Human tags/workspaces/notes are a separate user-editable overlay. Derived transcripts, search and knowledge are rebuildable, versioned views with provenance. Never silently overwrite observation with inferred knowledge.

**Decision D3: Local durable read model (smallest storage addition).** Existing conversation-service snapshots are operational journals; session datasets are capture evidence. Neither is automatically the desired personal reading archive. Determine the minimum VIVIM local SQLite/JSONL/index overlay compatible with current storage before asking Z.ai to implement it. Prefer small explicit schema/version and atomic writes over importing donor IndexedDB/Prisma/graph databases. Whether to introduce SQLite is a **MAX** architecture selection, not automatic.

**Decision D4: Effect authority stays Harness.** Product intent, work, user knowledge and UI may call existing authorized capabilities but no independent CDP actor, unauthorized send or auto-retry of uncertain external effects. Chrome integration after M4 stable app gate, as owner ordered.

## 4 — Work breakdown, scored LOW/MED/HIGH/MAX and owner routing

| ID | Deliverable / source | Tier | Owner | Acceptance / dependency |
|---|---|---|---|---|
| P00 | Verify R1 source/manifest, reconcile origin main and merge to safe integration branch | MED | Z.ai integration lead | One traceable commit, no overwritten concurrent changes, 16 focused tests green |
| P01 | Canonical object/identity/evidence/storage ownership decisions D1-D4 | MAX | Product Agent + local models | Written minimal contract and explicit no-second-store/actor resolution BEFORE donor imports |
| P02 | Audit exact projection data shape at `replyBlocks`, `universal-chat`, conversation `read`, dataset and source links | MED | Z.ai A | Source-to-view map + focused fixtures, no production duplicate |
| P03 | Build minimal durable user-owned conversation view using P01 interface; persist heterogeneous content and evidence pointers | HIGH | Z.ai A | Restart + reopen; identity and content preserved; storage writes atomic/versioned |
| P04 | Present persisted typed parts, citations, artifacts and unknown-opaque kinds in the existing `/chat` | MED | Z.ai B | Markdown/code/table/source/file labels; explicit missing/unknown; no Zod/Next transplant |
| P05 | Wire the R1 shell to the canonical durable read APIs | MED | Z.ai C | Navigate/open/revisit existing records; no browser required; no false connected state |
| P06 | Unit/integration testing of schema, unknown blocks, collision, restarts, partial writes, missing evidence | MED | Z.ai test subagent | Test against real local service/durable fixtures |
| P07 | Workspace, project, collections, tagging, saved artifacts and basic notes as user overlay | HIGH | Z.ai A + integration lead | Create/associate/edit/reopen without duplicating raw source |
| P08 | Reuse existing search index against durable projection, with visible indexing coverage/limits | MED | Z.ai B | Search across stored conversations/notes, deep link back to source and exact item |
| P09 | Evidence-qualified knowledge/ACU-lite presentation using existing `src/intel` primitives | HIGH | Z.ai C | Knowledge grounded or labeled hypothesis; reversible links; no extra learning engine |
| P10 | User selection / sanitized export and import roundtrip for selected VIVIM objects | HIGH | Z.ai integration lead | No tokens/cookies/raw private capture; exact stable IDs or documented rekeying |
| P11 | App startup, offline paths, error/recovery, migration rollback and full internal user journey | HIGH | Z.ai lead and QA | Single running app stable across restart, files/resources measured |
| P12 | M4 stabilization acceptance and decision to unlock Chrome phase | MAX | Product Agent + local models | Review independent journey evidence and unresolved architectural invariants |
| P13 | Linux controlled interactive Chrome/CDP provider tests | HIGH | Z.ai AFTER P12 | Real browser events through existing actor; no Playwright/Puppeteer; no owner credentials |
| P14 | Real owner subscription/account and Windows-only validation | HIGH | local agent with owner consent | Separate authenticated acceptance; never conflated with synthetic/browser |
| P15 | Import VIVIM Final whole React/Next framework or ChromeGovernor | MAX decision: REJECT | Product Agent | None; no payoff demonstrated |
| P16 | Poppy optional consumer integration | MAX decision: WATCH | Product Agent + Research 09 | Reopen only for credible verified company endpoint + task payoff |

**Allocation is firm:** Z.ai receives LOW/MED/HIGH (parallel subagents on disjoint files); **MAX remains Product Agent/local models**. MAX decisions must be decomposed into implementable bounded Z.ai jobs; don't ask Z.ai to architect the entire system anew. Task tier is integration risk, not ChatGPT UI thinking effort.

## 5 — Donor disposition: keep WHAT, redesign HOW

| Donor | Useful WHAT | Do NOT inherit blindly | Immediate |
|---|---|---|---|
| `vivim-final/frontend/src/app/page.tsx` and `guided-landing.tsx` | Single approachable entry, first-run provider guidance, organized panels | Next.js framework, hooks/network contracts, separate backend | REFERENCE for M2/M3; implement in Harness shell |
| `vivim-final/src/schema/streaming.ts` + `content.ts` | Rich typed content/stream lifecycle, tools/errors/source parts | Transplant Zod schema dependencies or claim cross-provider equality | ADAPT semantics at projection boundary only |
| `vivim-final/src/engines/memory-engine.ts` | Episodic vs semantic/procedural memory concepts, revision cues | Parallel memory authority, separate autonomous engine | DEFER; compare gaps after Harness intel product wiring |
| `vivim-final/src/engines/chrome-governor.ts` | CDP lifetime concerns, health and tracing concepts | Second I/O/effect owner/fleet | REJECT IMPLEMENTATION |
| `vivim-platform/pwa/src/types/conversation.ts` | ContentPart taxonomy and artifact UX | Prisma/IndexedDB/backend system and duplicate canonical store | Public Final equivalent satisfies M2; private access not essential |
| `vivim-platform/acu/src/types.ts` | Atomic knowledge unit, origin links, semantic graph concepts | Big ACU decomposition/quality/graph requirements as default | REFERENCE at M3; implement minimum source-qualified knowledge |
| `edge-pwa/backend/src/registry/acu.rs` | Public ACU query/projection evidence | Rust backend/extension/native-messaging stack | DEFER |
| `vivim-sdk/src/mcp/tools/identity.ts` | Tool discoverability, identity boundary | DID/key manager required before first single-user flow | DEFER |
| `vivim-final/src-tauri/tauri.conf.json` | Windows distribution and guided startup shape | Whole second Bun backend/Chrome session owner | LATER, after app startup stable |
| Research 09 Poppy | External company discovery/authorized sessions | Unstable 0.2/0.3 draft or unverified production adoption | WATCH only |

All donors are *candidate evidence*. None has been independently proven drop-in compatible with current Harness Node runtime.

## 6 — Ranked complexity sinkholes and explicit containment

1. **CRITICAL/MAX — record identity conflation.** Provider native ID vs capture session vs work journal vs persisted VIVIM conversation. Contain by D1/D2 schema and hard negative collision fixtures. Do not auto-link closed thread from a restored tab.
2. **CRITICAL/MAX — deciding who owns durable human data.** Snapshot vs raw evidence vs user-edited overlay vs derived semantic graph. Contain with D2/D3 small ownership ledger and derivation rules, not full donor migration.
3. **HIGH — renderer integration explosion.** Existing `chat.mjs` has substantial rendering/parser code; another ContentPart renderer can duplicate parsing and corrupt sourced unknowns. Contain with thin adapters into existing `replyBlocks`/native rendering, preserve unknown opaque shapes.
4. **HIGH — parallel web UI shells.** `/chat` vs root Studio `/knowledge`/Search vs donor Final canvas. Contain with shared navigation and source read-model; don't copy an entire PWA.
5. **HIGH — misleading search completeness.** R1 search is local list filter, existing Studio search scans capped recent sessions and decoded/page blocks, not every raw byte. Expose coverage; do not call it universal memory search.
6. **HIGH — reuse economics.** Old donor engines can bring dependency explosion and larger maintenance surface. Only transplant when total integration cost and behavior tests beat a small native implementation.
7. **HIGH — non-atomic or unrecoverable local materialization.** Interrupted writes, orphan source pointers, version bumps. Tests must exercise crash/restart/migrations and recreate search projections from originals.
8. **HIGH — Z.ai subagent write collisions.** Require lead-owned P01 contract first, disjoint code surfaces and combined acceptance tests; no independent registry/store built by each lane.
9. **HIGH — export leakage.** Existing export can package datasets, possibly sensitive; product sharing must be explicit scope with redaction and negative security tests. Do not label existing raw archive `Share`.
10. **MED/HIGH — responsive layout and UI readability.** R1 adds third column at desktop; preserve keyboard access and narrow displays; use Node/DOM tests during M2/M3. Defer *new interactive Chrome testing* until M4.
11. **HIGH — CLI/MCP overextension.** Existing MCP and CLI already exist; app need not make all provider effects available to agents in V1 internal integration.
12. **MAX — binary/desktop packaging and external account gating.** No need to settle Windows Tauri now. Chrome/browser and real provider interactions are after internal app stability.

## 7 — Exact next three rounds (proposed)
**R1 acceptance — MED Z.ai lead:** import the provided patch/bundle to a safe branch, reconcile current `main`, run focused + relevant full tests, verify remote commit. Product owner reviews the visible shell/contract delta; no live browser prerequisite.

**R2 — HIGH Z.ai lead with 3 subagents:** using D1-D3 architecture decided by Product Agent/local MAX work: A = durable source-qualified read projection; B = existing rich UI and typed-part display; C = route/wire stored conversation API/navigation with tests. Deliver ONE real saved heterogeneous conversation that reloads after process restart. Source fixtures acceptable; no external CDP expansion.

**R3 — HIGH Z.ai lead with 3 subagents:** A = workspace + user annotations/associations; B = search index + deep link/coverage; C = source-grounded knowledge/card view. Combined journey: save content to workspace, search by text/project, inspect original evidence and retrieve after restart.

**R4 — HIGH Z.ai lead:** round-trip sanitized export/import, source/identity checks, data integrity, schema migration/recovery, coherent navigation and production startup. Product Agent/local models conduct MAX stable-app gate before new Chrome work.

**R5+ — HIGH Z.ai after M4 gate:** Linux interactive Chrome/CDP controlled sites, reuse sole Harness effects runtime, then separate real provider/Windows owner verification.

**Definition of speed:** useful integrated user journeys per round, no competing state engines, measured regressions, reversible changes, exact Git SHA/commands/tests; not maximum code churn, number of subagents, or count of donor files copied.

## 8 — Immediate decision and open evidence gaps

**Recommendation:** first complete R1 import/acceptance; for R2 adopt D1/D2 unequivocally and make D3 the smallest explicit local read-model contract. No new general-purpose memory service or external browser actor. Make R2 a durable rich conversation journey; every other feature rests on it.

**Gaps still unknown:** user's actual Windows environment/Chrome provider acceptance; true full test suite at current GitHub HEAD; exact final app storage migration choice (MAX); measured real-world donor quality/licensing/provenance; runtime package compatibility; whether R1 commit can be fast-forwarded or requires merge; file-by-file audit of all legacy repos has not been done. Do not label these VERIFIED.

## 9 — Sources
- Attached `vivim-harness-r1-zai-v1-pass1-shell-034ced9.patch`, `.bundle`, `-src.tar.gz` and manifest provided in the PRODUCT AGENT chat (no private source contents replicated in this public product report).
- [Harness governing architecture](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md).
- [Original V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md).
- [Z.ai V1 execution brief](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-ZAI-INTEGRATION-PASS-1.md).
- [Canonical Role 15 README](README.md) and [Z.ai sequencing policy](ZAI-EXECUTION-POLICY.md).
