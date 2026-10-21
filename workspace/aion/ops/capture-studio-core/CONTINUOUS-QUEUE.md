> **Specialist delegation, 2026-10-21:** [Knowledge & Learning worker](../capture-studio-knowledge-learning/README.md) has a dedicated L4/L5 queue and criterion-based acceptance. Core retains integration, derive wiring, server/CLI, persistence and overall reliability; coordinate any edits to `src/intel` to prevent simultaneous conflicting changes. L4/L5 queue ownership is specialist, not removal of Core's end-to-end responsibility. The latest Core missing-key graph fix `1990a5243` must be inspected before duplicate effort.

> **Latest CORE build:** [SPRINT-03.md](SPRINT-03.md) — Trusted Knowledge Foundations. Provisional EIDs, derivation outcome states, history removals, read-only status API and mock-measured detail optimization are committed. **Independent QA and Node/Windows acceptance remain pending.** Next: typed-key/tenant identity design, correction workflow and real filesystem benchmarks.

# Core — Standing High-Level Queue

**Owner:** Core. **Steward:** QA / Steering. **Updated:** 2026-10-21. **Nature:** rolling priorities, not QA gates or evidence of completion.

## NOW — take the first uncompleted item
- [ ] **Typed identity and tenant boundaries — PARTIAL:** `1990a524` fixes missing-key provisional EID aliases in new derivations; `f65efd8d` isolates legacy collisions; prior `97463264` constrains cross-session joins to origin. **Open:** numeric/string typed-key collisions and a versioned EID alias/migration strategy; same-origin multi-account identity remains unproven. Do not silently fuzzy-merge.
- [ ] **History and provenance integrity — PARTIAL:** explicit `removed` field operations are supported across graph and longitudinal as-of; successful/failed/deriving status is persisted. **Open:** provenance-signed correction authoring and rollback, dataset digest verification, and independent temporal regression.
- [ ] **Continuity scalability and completeness — PARTIAL:** `6db122e5` avoids folding unrelated histories for selected EID while retaining full accounting; a 50-session/25k-revision V8 mock sample has been recorded. **Open:** real Node/disk benchmark, pagination/invalidation decisions, remaining 400-event heuristic coverage and browser evidence.

## NEXT
- [ ] **Scoped learning and corrections:** make accepted user feedback reliably improve future inference while remaining reversible.
- [ ] **Capture fidelity across website families:** close observed completeness and stream reconstruction gaps.
- [ ] **Stable backend contracts:** maintain usable APIs for UI and explicit data limitations; resolve demonstrated integration discrepancies.

## LATER
- [ ] **Richer reconstruction and behavioral evidence:** distinguish temporal association from demonstrated causality.
- [ ] **Operational resilience:** integrity checks, recovery and realistic resource bounds.

## Continuous pull rule
At completion of a work item: record commit + actual verification, check latest main and Core/QA handoffs, mark it complete or split remaining scope, and pull the highest-impact **unblocked** NOW item. Promote NEXT when NOW empties. Keep this queue short and update priorities as evidence arrives. Do not wait on UI/QA unless a real dependency prevents useful progress. The user owns major scope changes; QA steers coordination and maintains queue freshness. No Playwright/Puppeteer.

**Verified source receipts (2026-10-21):** [Sprint 03](SPRINT-03.md) records commits for provisional entity isolation, derivation outcome truth, API, explicit removals, eight Core-owned Node tests and a bounded V8 mock-storage benchmark; the full Node suite and independent Windows acceptance were **not** executed in this GitHub-only build. Earlier cycle receipts: `cc536481`, `229678df`, `97463264`, `ca0512e2`, `8197dfb7`.
