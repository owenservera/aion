# Capture Studio UI / Client Integration — Active execution queue

**Issued by:** QA / Steering, owner-authorized team activation 2026-10-21. **Source checkpoint:** main `cc536481aaab466fd7e6cbe00b63f007027dd588`. **Status:** UI1–UI6 source delivered with receipts, 2026-10-21; 24 V8 interface checks passed. Windows/browser/independent QA not claimed.
**Mission:** make the existing Studio user-facing vertical slice useful now, without waiting for Core or rewriting backend.

## NOW — execute sequentially; commit small frontend-only increments
- [x] **UI1 Inspect and map** the actual `src/studio/ui/index.html` flows and existing `src/studio/server.mjs` routes; list live capability vs mocked/absent in a compact self-maintained note. Do not assume backend features.
- [x] **UI2 Improve Sessions → same-site knowledge → entity history journey.** Clear labels for site, source sessions, stable keyed identity, as-of time, confidence limitations and complete/incomplete knowledge. Preserve existing features and use HTML escaping.
- [x] **UI3 Reliable client states.** Handle loading, no session, no entities, missing derived dataset, authentication rejection, API failures, incomplete result counts, truncation and invalid as-of input.
- [x] **UI4 Integration contract.** Consume existing authenticated endpoint `GET /api/sessions/:id/continuity` with optional `eid`, `at`, `limit`; verify response shape from source, never invent endpoint behavior. Document any requested API change in this lane as a proposal, do not edit Core server.
- [x] **UI5 Usability/accessibility.** Keyboard navigation, readable mobile layout, labels and focus states; avoid full rewrite and preserve existing capture controls.
- [x] **UI6 Tests, commit and report.** Run available UI-safe tests and state exactly what was executed; verify latest main before each push, commit only UI-owned frontend/docs and report SHA plus remaining backend dependencies.

## Completed beyond original UI1–UI6
- [x] Entity/graph browsing from supported read-only API: list, filter, static map, select, inspect graph relations and source evidence.
- [x] Review-only origin-qualified type-drift candidates with evidence navigation and omission/truncation disclosures.
- [x] Source-linked search with selectable or recent-20 scope; limit, errors and empty-result wording; 6 new search contract checks.

## NEXT — execute from [Sprint 03](SPRINT-03.md)
- [ ] Direct evidence jump from selected relationship/revision into the exact stored event or DOM observation when supported by current API, with truthful absent-source fallback.
- [ ] Side-by-side, read-only type-drift comparison, using source-backed structural fields; no implicit merge or correction.
- [ ] Investigate layout/performance at high entity and graph counts; preserve bounded previews, accessible detail and responsive rendering.
- [ ] Run native Node and local browser/keyboard checks when local runtime is accessible; address actual failures without blocking other safe UI work.
- [ ] User-correctable feedback workflow only after Core exposes versioned reversible contract; otherwise propose exact contract and retain read-only UI.

## Bounds and collaboration
Core owns capture/identity/continuity/CLI/API/auth/storage. Systems gives advice, not mandatory gate. QA records evidence independently and maintains team roadmap. No Playwright/Puppeteer; no secrets/private transcripts in artifacts. Do not wait for pending independent QA to improve clearly UI-only behavior. GitHub records do not awaken other agents.

## Done means
Functional frontend change or measured UX improvement, actual verification evidence, exact commit(s), concise shipped/next/blocked update; **not** a claim of Windows/browser acceptance absent receipt.

## Latest sprint receipt
[Trusted Knowledge Workspace closeout](SPRINT-02.md#delivery-closeout--2026-10-21) · [Standing outcome queue](CONTINUOUS-QUEUE.md). All source changes are scoped to UI and UI-owned tests. No claim of live browser acceptance.
