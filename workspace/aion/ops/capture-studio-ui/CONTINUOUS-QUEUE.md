> **Current execution anchor:** [SPRINT-03.md](SPRINT-03.md) — Evidence Navigation and Review Workspace. Sprint 02 knowledge, graph, drift and source-linked search UI source is shipped (24/24 V8 contract checks). Browser/Windows acceptance and independent QA remain outstanding.

# UI / Integration — Standing High-Level Queue

**Owner:** UI / Integration. **Steward:** QA / Steering. **Updated:** 2026-10-21 (UI Sprint 02 delivery). **Nature:** rolling outcome priorities, not a second detailed sprint tracker.

## NOW — pull the highest-impact unblocked source-safe task
- [ ] **Direct evidence navigation:** entity revision / graph relationship → source recording and exact stream/event/DOM where the stored evidence permits it.
- [ ] **Read-only drift comparison:** compare both candidate types and their recorded attributes/history without merging or changing Core state.
- [ ] **Stateful user journey:** preserve context across Knowledge → Search → Session → Stream navigation and make missing source explicit.

## NEXT
- [ ] **Real-world interface proof:** native Node 22 UI suites; authenticated browser, mobile, keyboard and populated-session workflows (when local runtime accessible).
- [ ] **Scale and accessibility:** bounded/paginated high-volume entity and graph exploration with measured cost and keyboard-first navigation.
- [ ] **Adapt to Core correctness contracts:** distinguish confirmed-empty, absent, failed and incomplete derivation, and explicit historical retraction only as supported.

## LATER
- [ ] **Unified investigation workspace:** fluid browsing of evidence, derivations and reconstruction.
- [ ] **Reusable UI components and performance:** extract only when useful and measurable.

## Continuous pull rule
Keep the existing [detailed implementation queue](TASK-QUEUE.md) as current work breakdown. After shipping a slice, attach commit + observed test/UX evidence, update checkboxes, pick the highest-impact unblocked NOW item and promote NEXT as needed. Do not wait for QA approval for routine UI-only improvements; propose backend changes instead of editing Core code. QA steers queue priorities without gating development. No Playwright/Puppeteer.

**Source shipped 2026-10-21:** Sprint 01 Sessions + historical continuity, Sprint 02 read-only Knowledge workspace (entity → history, graph/list/map, model types, review-only type drift, source-linked search), 24 UI mock-contract checks passed in V8; no Node 22/browser/Windows acceptance. Core Sprint 03 correctness work is parallel and not a reason to stall independent UI work. See [Sprint 02 receipt](SPRINT-02.md#delivery-closeout--2026-10-21).
