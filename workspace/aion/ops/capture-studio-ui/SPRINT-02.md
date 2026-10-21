# Next UI Build Sprint — Trusted Knowledge Workspace

**Steering authority:** QA / owner-requested next large build. **Basis:** main `64f1ee89a6a7e46628f037e74bfbcc6a1f662de3`. **Status:** queued, not started. First UI delivery already shipped in source: responsive Sessions, provenance explorer and six V8 contract passes.

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
