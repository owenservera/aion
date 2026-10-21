> **Specialist delegation, 2026-10-21:** [Knowledge & Learning worker](../capture-studio-knowledge-learning/README.md) has a dedicated L4/L5 queue and criterion-based acceptance. Core retains integration, derive wiring, server/CLI, persistence and overall reliability; coordinate any edits to `src/intel` to prevent simultaneous conflicting changes. L4/L5 queue ownership is specialist, not removal of Core's end-to-end responsibility. The latest Core missing-key graph fix `1990a5243` must be inspected before duplicate effort.

> **Next large build:** [SPRINT-03.md](SPRINT-03.md) — Trusted Knowledge Foundations. Priority now: provisional EID uniqueness → derivation completeness → trustworthy contracts/history → measured scaling. Systems' origin-scoping concern is partially mitigated by `97463264`; same-origin tenant ambiguity remains open. This queue is for future selection, not an assertion that Sprint 03 has started.

# Core — Standing High-Level Queue

**Owner:** Core. **Steward:** QA / Steering. **Updated:** 2026-10-21. **Nature:** rolling priorities, not QA gates or evidence of completion.

## NOW — take the first uncompleted item
- [ ] **Cross-session identity under schema evolution — PARTIAL (source delivered):** `97463264` constrains automatic joins to exact target origins + model key fields, qualifies returned identity IDs by origin and surfaces unconfirmed, provenance-linked type-drift hints; `ca0512e2` exposes hints in CLI. **Still open:** reliably distinguish tenants sharing one origin, evaluate alignment false positives/negatives from QA and Systems, and choose explicitly confirmed identity semantics before any actual schema-drift merge. Never silently fuzzy-merge.
- [ ] **History and provenance integrity:** align timestamps, corrections/retractions and evidence links across derivation, graph, continuity, CLI and API.
- [ ] **Continuity scalability and completeness:** address high-impact scan/sampling limits based on measured evidence, without premature duplicate storage.

## NEXT
- [ ] **Scoped learning and corrections:** make accepted user feedback reliably improve future inference while remaining reversible.
- [ ] **Capture fidelity across website families:** close observed completeness and stream reconstruction gaps.
- [ ] **Stable backend contracts:** maintain usable APIs for UI and explicit data limitations; resolve demonstrated integration discrepancies.

## LATER
- [ ] **Richer reconstruction and behavioral evidence:** distinguish temporal association from demonstrated causality.
- [ ] **Operational resilience:** integrity checks, recovery and realistic resource bounds.

## Continuous pull rule
At completion of a work item: record commit + actual verification, check latest main and Core/QA handoffs, mark it complete or split remaining scope, and pull the highest-impact **unblocked** NOW item. Promote NEXT when NOW empties. Keep this queue short and update priorities as evidence arrives. Do not wait on UI/QA unless a real dependency prevents useful progress. The user owns major scope changes; QA steers coordination and maintains queue freshness. No Playwright/Puppeteer.

**Current source delivery (2026-10-21):** `97463264` origin-scoped continuity and review-only drift API, `ca0512e2` CLI review hints, and `8197dfb7` contract update. GitHub source/remote readback verified; only a V8 syntax check was performed, **not product or Windows execution, independent QA or behavioral acceptance**. The first NOW outcome is partially delivered, not closed. Prior cycle: `cc536481` ambiguous-key protection and `229678df` original contract.
