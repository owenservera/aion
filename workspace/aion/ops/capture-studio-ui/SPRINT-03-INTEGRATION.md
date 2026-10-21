# UI / Integration Sprint 03 — Integrated Capture Studio

**Status:** SOURCE-DELIVERED INTEGRATION SLICE (2026-10-21); native Node/browser/independent QA still pending. **Steering:** QA, owner requested integration focus. **Baseline:** GitHub source delivery through `15fd79ef1` (refresh when launching). **Work type:** integration-first, not feature-first. **Effort:** High.

## Mission
Deliver a coherent user workflow across existing Capture Studio features: captured evidence → saved session → derived model/entities → cross-session continuity → graph/history → original observations. Integrate latest Core response contracts safely and demonstrate that client selections, displayed completeness and historical provenance remain correct across routes.

## Ordered outcomes

1. **Unified workflow integration.** Make Session, Knowledge, Graph, Model, History and Search work as one connected navigation flow, with breadcrumbs/backtracking and context retention. Reuse delivered UI Sprint 02 rather than rewrite.
2. **Current backend contract adapters.** Reconcile Core `/api/sessions/:id/model`, `/graph`, `/continuity`, `/api/search`, and newer versioned derivation-status response. Document exact request/response/undefined states; map legacy and current responses without creating false data.
3. **Client data consistency.** One selected session/entity/origin/as-of context drives all relevant views. Preserve full origin-qualified IDs; guard stale fetches and source changes, avoid mixing data from different sessions or users.
4. **Honest lifecycle and failure states.** Distinguish successfully empty, never derived, failed/incomplete, truncated, missing, deleted/rederived. Handle auth expiry, invalid filters and dates, disconnects, slow responses and retry without stale evidence.
5. **Integration depth over visual sprawl.** Close gaps in source evidence drilldown, graph relationship detail, review-only drift evidence, and history without an extra backend storage layer or unsupported edit UI.
6. **End-to-end contract test matrix.** Use deterministic test fixtures plus real local API integration where available: one- and two-session histories, same-origin different tenant, changed schema, missing keys, rejected edges, empty datasets, slow/reordered responses, auth and deleted sessions. Report environment honestly: V8 source tests != Node tests != Windows/browser acceptance.
7. **Scale and finish.** Measure selected large session/history UI paths, bound rendering, improve keyboard and narrow-screen flow, keep existing security/HTML escaping protections.
8. **Delivery receipt.** Incremental frontend-only commits, test receipts, remaining Core API contract proposals, changed file count and physical LOC deltas where measured; refresh standing queue and continue the next unblocked integration item.

## Ownership
UI owns frontend/client adapters/workflows/state and UI-side tests. Core owns API contracts, server, CLI, storage and derivation semantics. Knowledge & Learning specialist owns L4/L5 algorithms; do not implement their logic in UI. Systems advises. QA steers, independently validates and manages acceptance. No Playwright/Puppeteer. No private user transcript material in fixtures.

## Completion criteria
- A person can navigate a real supported capture through model, entity history and evidence using correct current Core APIs.
- No cross-selection data contamination in simulated latency/error tests.
- The UI differentiates all supported derivation outcomes and never falsely labels origin as verified tenant identity.
- Current Core API usage and any missing endpoint contracts are documented with a specific owner.
- Test receipts and precise commits prove the implemented path; browser and independent QA acceptance remain separate until run.

## Continuous pull
When finished, mark outcome status/receipt, update `CONTINUOUS-QUEUE.md`, and select the next unblocked integration item. Do not wait for a new steering prompt to progress within an active session.

## 2026-10-21 — UI implementation closeout (source proof, not browser acceptance)

**Decision:** the official QA-steered Integration Sprint is the primary UI plan. `SPRINT-03.md` (evidence navigation) is now its delivered implementation substream, not a competing next sprint.

### Outcomes and evidence

| Outcome | UI implementation | Evidence status |
| --- | --- | --- |
| One application workflow | Capture stop offers immediate session investigation; Sessions, Knowledge, graph, history and Search use a visible investigation breadcrumb and source-recording links. | Frontend source delivered; actual populated Chrome recording not exercised. |
| Core contract alignment | Existing model, graph, continuity, and search endpoints plus `GET /api/sessions/:id/knowledge-status`; session detail `knowledgeOutcome`; versioned status `deriving / complete / failed`; legacy-unverified fallback. | Source readback of Core implementation; deterministic response fixtures. |
| One selected context | `selectSessionContext` synchronizes selected recording, Knowledge picker, breadcrumbs and selected-scope search; `updateHistoricalContext` shares as-of time and invalidates old knowledge. All detail/network loads use generation checks. | V8 selection/latency fixtures, not browser interactivity. |
| Recovery | Clear stale/deleted recording selections; expired 401/403 informs how to reopen locally; SSE outage shows reconnect guidance; incomplete, successfully empty, deriving, failed, legacy/unverified and truncated categories remain distinguishable. Active/failed derivation suppresses stale model/graph. | Deterministic mock contracts, not actual authorization-expiry test. |
| Original evidence | Entity revisions with exact session+SID can navigate to saved Streams and attempt seq highlight; absent SID falls back to recording rather than fabricating raw proof. Graph relationships expose saved status and source recording links. | UI read-only integration, not real data acceptance. |
| Historical truth | Core explicit `removed: [field]` surfaced as an explicit removal operation; no deletion inferred from missing fields; origin-qualified keyed match does not prove same tenant. Rejected relationships not drawn as active edges. | Code/contract fixtures. |
| Scale & access | Bounded graph map (16 nodes, 45 links), node list (200), entity preview (100), evidence history (150 rows), relationship detail (100), and search API default (100); responsive/keyboard controls and escaping. | Structural bounds checked; no representative real workload benchmark. |

### Core API contract map (verified from current source)

| Request | Current consumption | Client behavior when missing/error |
| --- | --- | --- |
| `GET /api/sessions` | Saved recordings/selection. | Empty/error distinctly presented; no fake recording. |
| `GET /api/sessions/:id` | Meta, dataset list, receipt and additive `knowledgeOutcome`. | 404 clears stale current recording; missing outcome says legacy-unverified. |
| `GET /api/sessions/:id/knowledge-status` | Versioned outcome with `status`, `entityCount`, `typeCount`, `stage/error` when available. | Legacy 404/405 means unverified, not complete. 401/403 shows authorization guidance. |
| `GET /api/sessions/:id/continuity?limit=&eid=&at=` | Origin-qualified `id`, exact/keyless identity basis, revisions, provenance, review-only drift hints, completeness/truncation counters. | Errors, incomplete scans and missing history surfaced; no implicit schema drift merges. |
| `GET /api/sessions/:id/graph` and `/model` | Session-specific saved interpretations. | Absent/derived-empty distinguished. On `deriving/failed`, old results suppressed. |
| `GET /api/sessions/:id/events/:sid`, `/raw/:sid`, `/assembled/:sid` | Existing Streams inspect view when revision has exact source SID. | Missing seq/stream gives source-only fallback or actionable error. |
| `GET /api/search?q=&session=` | Recent or selected decoded event/page search; source recording navigation. | No result is not negative evidence; errors never presented as successful empty. |

No Core files or stored knowledge authority modified by the UI lane. Contract owner: **Core**. The remaining possible gaps (exact DOM observation navigation, verified tenant namespaces, measured large-history cost, versioned edit/undo behavior) belong in the relevant Core/QA workflows before exposing stronger UI claims.

### Relevant UI commits
- `cb63d79` — derivation status adapter, breadcrumb and auth guidance
- `1fc59ea` — revision source stream navigation and deleted-session recovery
- `c685d43` — suppress stale graph/model while deriving or failed
- `bbebfe8`, `5358b00`, `b91c808` — unified selection/as-of and request-epoch corrections
- `c66ca53`, `ca47009` — explicit removal and source completeness counters
- `8f0eec0`, `054d0da`, `08a6dd6`, `041a320`, `736cf33` — regression fixtures and integration scenarios

### Verification
**Executed with GitHub-fetched committed source/test contents:** 37 / 37 deterministic V8 interface tests (6 original Studio + 18 Knowledge/Core integration + 6 Search + 7 shared state/auth). This is a source-extracted V8 compatibility runner that exercises test bodies, **not** the native Node `node --test` harness and not a Chrome/Windows end-to-end run. Inline Studio script also parsed in V8.

**Native Node test status:** Node 22.16.0 exists in an isolated runtime, but the GitHub host is not DNS-resolvable there; the live repository was therefore not cloned to that runtime and native test execution is **not claimed**. The user's Windows local machine was not operated.

### Next priority after source delivery
1. Actual Node 22 unit suite and local browser/manual keyboard + narrow-screen capture→evidence run; independent QA remains a separate acceptance authority.
2. Measure real large-history/graph rendering and improve lazy/paginated UX only based on observed bottlenecks.
3. Review-only two-candidate type-drift comparison without merge; exact DOM observation navigation once source identifiers are sufficient.
4. When Core exposes a versioned reversible correction API, add explicit user-controlled feedback without any silent mutations.

**Verdict:** integration source delivered with passing mock-contract checks; full real-world sprint acceptance remains pending.

