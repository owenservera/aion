# UI / Integration Sprint 03 — Integrated Capture Studio

**Status:** NEXT, after current UI sprint closeout. **Steering:** QA, owner requested integration focus. **Baseline:** GitHub source delivery through `15fd79ef1` (refresh when launching). **Work type:** integration-first, not feature-first. **Effort:** High.

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
