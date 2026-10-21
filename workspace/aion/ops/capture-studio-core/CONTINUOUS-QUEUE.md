# Core — Standing High-Level Queue

**Owner:** Core. **Steward:** QA / Steering. **Updated:** 2026-10-21. **Nature:** rolling priorities, not QA gates or evidence of completion.

## NOW — take the first uncompleted item
- [ ] **Cross-session identity under schema evolution:** preserve conservative joins while surfacing drift hypotheses and protecting tenant/site boundaries.
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

**Current delivered Core cycle:** owner reported complete; identity safety fix `cc536481` and continuity contract `229678df` committed. These are historical receipts, not new pending items.
