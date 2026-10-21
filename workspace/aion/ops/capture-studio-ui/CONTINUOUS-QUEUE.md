> **Next priority after the current UI sprint:** [Sprint 03 — Integrated Capture Studio](SPRINT-03-INTEGRATION.md). UI Sprint 02 is recorded source-delivered (24 deterministic V8 checks), not Windows/browser accepted. From the next execution session, prioritize **cross-component integration** over creating standalone screens. Existing items below remain a historical/long-tail backlog; prefer the new Sprint 03 queue for NOW selection.

> **Next large build:** [SPRINT-02.md](SPRINT-02.md) — Trusted Knowledge Workspace. UI first-sprint source work and six V8 contract checks are delivered; promote graph/model exploration and review-only type-drift presentation to the next NOW slice. Not yet Windows/browser accepted.

# UI / Integration — Standing High-Level Queue

**Owner:** UI / Integration. **Steward:** QA / Steering. **Updated:** 2026-10-21. **Nature:** rolling outcome priorities, not a second detailed sprint tracker.

## NOW — finish the current active slice, then pull the next
- [ ] **A usable knowledge journey:** capture/session → entities → linked history, with truthful provenance and confidence labels.
- [ ] **Reliable client integration:** use Core's documented continuity API; expose missing/incomplete knowledge and error/loading/empty states.
- [ ] **Mobile and keyboard experience:** accessible controls, clear navigation and legible dense evidence without losing current functionality.

## NEXT
- [ ] **Graph and entity exploration:** intuitive inspect/filter/drill-down grounded in existing API responses.
- [ ] **Review/correction experience:** prepare reversible feedback interactions without claiming unsupported backend semantics.
- [ ] **Search and discoverability:** help users find sessions, objects, histories and supporting evidence.

## LATER
- [ ] **Unified investigation workspace:** fluid browsing of evidence, derivations and reconstruction.
- [ ] **Reusable UI components and performance:** extract only when useful and measurable.

## Continuous pull rule
Keep the existing [detailed implementation queue](TASK-QUEUE.md) as current work breakdown. After shipping a slice, attach commit + observed test/UX evidence, update checkboxes, pick the highest-impact unblocked NOW item and promote NEXT as needed. Do not wait for QA approval for routine UI-only improvements; propose backend changes instead of editing Core code. QA steers queue priorities without gating development. No Playwright/Puppeteer.

**Current team context:** UI is working (owner-reported); Core's initial delivery cycle is complete (owner-reported); independent Sprint 02 acceptance still pending.
