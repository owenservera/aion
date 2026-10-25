# Z.ai integration execution policy — VIVIM V1
**Owner clarification:** 2026-10-25. **Product authority:** AION Role 15 PRODUCT AGENT. **Engineering destination:** owenservera/vivim-harness.

## Sequencing rule (supersedes earlier policy)
**FIRST integrate VIVIM into one stable application. THEN add and validate interactive Chrome/browser operation.** Z.ai's Linux Chrome capabilities and subagents are available, but availability is not a reason to start browser integration prematurely. Do not allocate a Z.ai round to interactive Chrome before the product stabilization gate.

### Phase 1 — Cohesive application integration (NOW)
- Start from Z.ai Round 1 shell branch and existing Harness app; reconcile recent main before changes. Inspect and select actual high-value donors.
- Integrate a consistent app shell, conversation/content projections, project/workspaces, local knowledge/memory, user-owned persistence, search and export/import foundations. Keep one source-of-truth and source/provenance boundaries; don't install a second backend or browser actor.
- Subagents may work in parallel on **disjoint code surfaces**, using one integration lead and a shared typed contract. Merge running functionality, not disconnected scaffolds.
- Test with unit, integration and deterministic fixture-based flows via Node/HTTP/native app render wherever feasible. Mock provider responses are for isolated contracts, not an interactive Chrome exercise.
- Every round must deliver working implemented paths, tests, commits and proof of internal integration.

### Phase 2 — Stability and integration gate (AFTER Phase 1)
- Complete realistic end-to-end **in-process/local HTTP deterministic fixture** journeys: create/open conversation → render native content parts → save/reopen after process restart → attach to workspace → search → inspect provenance → export/import with identity preserved.
- Validate schemas, migration/rollback, error states, storage integrity, missing/unknown content behavior, no silent loss, tests, package startup and relevant full suite.
- Gate: a single coherent VIVIM app runs with stable interfaces and durable local state; integration gaps are closed; external browser connectivity is a replaceable adapter rather than an app-wide dependency.
- Mark GATE BLOCKED honestly if features exist only as disconnected stubs, mock success messages or nonpersisted UI. No Chrome interaction to compensate for an unstable app.

### Phase 3 — Interactive Chrome and external connectors (ONLY AFTER STABILITY)
- Z.ai may then run full interactive Chrome/CDP Linux sessions against controlled sites and mock-provider webapps, using **the existing Harness browser-effects owner** and no Playwright/Puppeteer.
- Drive real DOM/browser lifecycle, adapters, streaming, reconnect/restart, uncertain-effect recovery and identity-binding tests; integrate one provider connector at a time.
- Authenticated ChatGPT/Claude/etc. owner accounts remain a separately labeled final owner-controlled validation; Linux interactive Chrome != authenticated provider acceptance.
- Do not make Chrome tests into a parallel product UI or independent browser controller.

## Z.ai collaboration and boundaries
- Z.ai can spawn subagents immediately for independent internal integration tasks; orchestrator owns shared contract and result merge.
- Existing Harness capture/CDP subsystem is preserved, not rewritten or prematurely expanded. Existing tests can be run for regression safety; **new browser functionality is deferred**.
- No private source dumps, credentials, provider tokens, new control-plane service, speculative architecture, Playwright/Puppeteer or Slack.
- Product planning, strategy and donor decisions stay under `workspace/aion/sessions/roles/15-product-to-market/`; engineering code/tests/interfaces belong in `owenservera/vivim-harness`.

## Round instructions
- **R1:** existing unified shell contribution (review/merge if safe; not automatically accepted).
- **R2:** stable app data model + source-qualified rich content + persistence; tie these to R1 shell.
- **R3:** workspaces/project/knowledge/search and user-owned export; full stable offline/local-HTTP journeys.
- **R4:** stabilization, contract consolidation, negative tests, migration/restart and packaging-readiness; decide whether Phase 2 gate is met.
- **R5+:** only after gate acceptance: interactive Chrome/CDP integrations and controlled external webapp validation.
Round count is illustrative; advance based on verified integrated functionality, not a fixed artificial calendar.

**Stop condition:** Do not start interactive browser implementation/testing until stable integrated VIVIM acceptance is demonstrated by deterministic application tests and owner-product decision. Existing basic regression tests of unmodified Harness code remain permitted.
