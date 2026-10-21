# Next UI Build Sprint — Trusted Knowledge Workspace

**Steering authority:** QA / owner-requested next large build. **Basis:** main `64f1ee89a6a7e46628f037e74bfbcc6a1f662de3`. **Status:** SOURCE DELIVERED 2026-10-21; 24/24 deterministic JavaScript interface checks passed in V8 harness; Windows/real browser and independent QA not yet accepted. First UI delivery already shipped in source: responsive Sessions, provenance explorer and six V8 contract passes.

## Mission
Create one clear exploration experience joining recorded sessions, inferred entities, origin-qualified continuity, review-only type drift, graph relationships and source evidence. No invented data and no Core-owned code edits.

## Ordered delivery
1. **Information architecture and navigation.** Reuse the existing UI; connect Sessions → Entities → Entity detail/history → Graph/model context → Source observations, with navigation back to evidence.
2. **Knowledge and graph exploration.** Show current graph/model content supported by read-only API (list/filter/select/relation details); handle absent endpoints by documenting an exact Core API request and using honest mock adapters only for unimplemented pieces.
3. **Review-only drift view.** Present `typeDriftHints` and omissions/counts with structural/source evidence, labels such as "possible same record type", not an implicit merge or confirmation action. Use full origin-qualified `id` for selection, not bare EID.
4. **Evidence truth UX.** Recorded / Inferred / Linked by key / Unavailable; distinguish origin from account, successful-empty from not-derived when Core exposes it, and incomplete versus truncated. Expose sources, timestamps, confidence limits and no-inferred-deletion semantics.
5. **Resilient interaction.** Keyboard, narrow screens, session changes and late request race protection; pagination/preview limits and safe HTML escaping.
6. **Proof and release.** UI-owned tests for mock response contract, selection races, provenance, graph/drift rendering and empty/error paths. Execute available tests, commit/push incremental changes, report exact evidence and pending browser acceptance.

## Parallel Core boundary
Core owns identity, history semantics, CLI/server endpoints and persistence. UI does not modify these. Build with current routes; issue one concise contract proposal for missing read-only data, not a competing server implementation. Preserve the existing functionality and accessibility. No Playwright/Puppeteer.

## Completion
An evidence-first investigation journey demonstrated with actual supported data (or separately labeled fixtures where a backend piece remains unavailable), verifiable commits/tests, and updated standing UI queue. Browser/Windows acceptance requires a real receipt; deterministic V8 tests are not live acceptance.

## Delivery closeout — 2026-10-21

**Product file:** `src/studio/ui/index.html` under the Capture Studio research lab. Existing Core authenticated read-only routes consumed: `GET /api/sessions/:id/model`, `/graph`, and `/continuity?eid=&at=&limit=`, plus existing `/api/search`. No backend, CLI, identity or persistence files changed by UI.

### Delivered
- Saved Sessions → Knowledge tab → exact-origin keyed entity list → history, observed attributes, source recording link.
- Session graph with bounded static relationship map, accessible node list, graph-node/edge detail and explicit rejected-edge handling.
- Inferred record types and honest derived-empty, missing/failure states.
- Review-only structural type-drift candidates with origin-qualified evidence drilldown; never auto-join or imply account identity.
- Read-only observed-text search across 20 recent or selected recording, with keyboard-operable source-recording drilldown and clear coverage limits.
- History as-of query, preview caps, incomplete/truncation counts, source timestamp caveats, stale-selection guards, error/empty states and HTML escaping.
- Evidence-level legend: Recorded / Inferred / Linked by key / Incomplete.

### Commits
- Knowledge base view: [68532bd](https://github.com/owenservera/aion/commit/68532bd5753786e785496d57c5c6dbb918e6ff14)
- Concurrent selection guard: [4b56d7d](https://github.com/owenservera/aion/commit/4b56d7d4ea79a09ea162c9e4d0f03a38172e4012)
- Map and drift candidate navigation: [1c26520](https://github.com/owenservera/aion/commit/1c26520973566acaf6336975a0d8af14c7ef5381)
- Evidence legend / rejected-edge presentation: [7e77da4](https://github.com/owenservera/aion/commit/7e77da4d0a79e421569ea1402acfe7a1c2dc6772)
- Source-linked search: [19d40af](https://github.com/owenservera/aion/commit/19d40af37c9fafda2f94ce2bec74a28d04e7170e)
- Knowledge tests: [0fd2799](https://github.com/owenservera/aion/commit/0fd27996db9531520f17aefadb51f93e7eb9b978), [ad35821](https://github.com/owenservera/aion/commit/ad358219483b51227c970ce808886b36a9652f21)
- Search tests: [f1f52fe](https://github.com/owenservera/aion/commit/f1f52fef66993fb6c74b41e820f073ce3c6f3966)
- Continuity test isolation fix: [43c5033](https://github.com/owenservera/aion/commit/43c503332de46280752042033ede8d02ad4a6504)

### Verification and limits
**Executed:** all 24 tests declared in `test/unit/studio-ui.test.mjs` (6), `studio-knowledge-ui.test.mjs` (12) and `studio-search-ui.test.mjs` (6) through an isolated JavaScript V8 harness against remote source readback; 24 passed, 0 failed. Includes syntactic parsing, simulated response/error, staleness, escaping, provenance, graph and search interaction. This is **not** native `node --test` execution and **not** authenticated browser/Windows acceptance.

**Acceptance left:** execute actual Node 22 test commands, browser navigation with locally captured sessions, mobile/keyboard physical verification, large-site cost and independent QA. No unmeasured visual/performance claims.

**Backend limitations accepted:** Core's origin-qualification is not proof of same account; derivation-success vs zero-entity is under Core Sprint 03; graph and model semantics depend on saved derived session data. Never merge drift candidates in UI.

**Next unblocked work:** [SPRINT-03.md](SPRINT-03.md) followed by [CONTINUOUS-QUEUE.md](CONTINUOUS-QUEUE.md).
