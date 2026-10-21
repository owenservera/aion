# Capture Studio UI / Client Integration — Active execution queue

**Issued by:** QA / Steering, owner-authorized team activation 2026-10-21. **Source checkpoint:** main `cc536481aaab466fd7e6cbe00b63f007027dd588`. **Status:** ready for agent launch, not yet execution evidence.
**Mission:** make the existing Studio user-facing vertical slice useful now, without waiting for Core or rewriting backend.

## NOW — execute sequentially; commit small frontend-only increments
- [ ] **UI1 Inspect and map** the actual `src/studio/ui/index.html` flows and existing `src/studio/server.mjs` routes; list live capability vs mocked/absent in a compact self-maintained note. Do not assume backend features.
- [ ] **UI2 Improve Sessions → same-site knowledge → entity history journey.** Clear labels for site, source sessions, stable keyed identity, as-of time, confidence limitations and complete/incomplete knowledge. Preserve existing features and use HTML escaping.
- [ ] **UI3 Reliable client states.** Handle loading, no session, no entities, missing derived dataset, authentication rejection, API failures, incomplete result counts, truncation and invalid as-of input.
- [ ] **UI4 Integration contract.** Consume existing authenticated endpoint `GET /api/sessions/:id/continuity` with optional `eid`, `at`, `limit`; verify response shape from source, never invent endpoint behavior. Document any requested API change in this lane as a proposal, do not edit Core server.
- [ ] **UI5 Usability/accessibility.** Keyboard navigation, readable mobile layout, labels and focus states; avoid full rewrite and preserve existing capture controls.
- [ ] **UI6 Tests, commit and report.** Run available UI-safe tests and state exactly what was executed; verify latest main before each push, commit only UI-owned frontend/docs and report SHA plus remaining backend dependencies.

## NEXT
- Entity/graph browsing grounded in actual API and visible provenance.
- Search and structured exploration where supported; explicit unavailable state where not.
- Small reusable UI component strategy only if demonstrated to reduce complexity.

## Bounds and collaboration
Core owns capture/identity/continuity/CLI/API/auth/storage. Systems gives advice, not mandatory gate. QA records evidence independently and maintains team roadmap. No Playwright/Puppeteer; no secrets/private transcripts in artifacts. Do not wait for pending independent QA to improve clearly UI-only behavior. GitHub records do not awaken other agents.

## Done means
Functional frontend change or measured UX improvement, actual verification evidence, exact commit(s), concise shipped/next/blocked update; **not** a claim of Windows/browser acceptance absent receipt.
