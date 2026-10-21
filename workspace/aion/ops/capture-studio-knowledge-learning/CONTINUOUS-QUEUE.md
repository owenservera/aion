# Always-On L4 + L5 Work Queue

**Goal:** 100% of [ACCEPTANCE.md](ACCEPTANCE.md) criteria in both layers with independent QA receipts. **Queue owner:** Knowledge & Learning worker; QA steers priorities. **Checkpoint:** `1990a5243`; source may have advanced.

## NOW — L4, make knowledge trustworthy
- [ ] **Provisional/keyed identity integrity:** reconcile newest Core missing-key graph fix `1990a5243`; test uniqueness, stable derived IDs, negative tenant/site/origin/type/key cases and schema-change handling. Do not duplicate already-shipped Core corrections.
- [ ] **Safe relationships and temporal graph:** typed references/containment, provenance for every edge, confirmed vs hypothesized vs rejected state, as-of consistency, deterministic replay, no unexplained 'caused'.
- [ ] **Reviewable cross-session identity/type alignment:** preserve origin-scoped safe joins and type-drift hints; offer reversible user-reviewed canonical alignment proposals, no implicit fuzzy merges.
## NOW — L5, make feedback genuinely adaptive
- [ ] **Learning lifecycle:** trace priors → prediction → explicit review → scoped update → persisted model → rederive → measurable improvement; record before/after provenance.
- [ ] **Persistence + replay correctness:** versions, rollback, deletion, deterministic reload, cross-process conflicts and scope isolation.
- [ ] **Calibration and evaluation:** held-out multi-site examples, meaningful score/relevance changes, false-merge and contamination regression checks.

## NEXT
- [ ] Coordinate minimal Core endpoint/derive contract proposals, without editing Core-owned CLI/server.
- [ ] Profile scaling of entity history, graph, priors and learning saves; optimize only measured bottlenecks.
- [ ] Explicit attribute removal/retraction event model and compatibility migration with Core.
## LATER
- [ ] Longitudinal semantic evolution and bounded explainable learning with account/tenant safeguards.
- [ ] Robustness under noisy captures, out-of-order events and schema churn.

## Pull contract
At finish: capture reproducible tests and SHAs, update checkbox **only after verified criteria**, state limitations, check latest Core files before next edit; pull next unblocked NOW, or NEXT when all NOW resolved. An independently accepted result is recorded separately from worker-executed tests. Never claim 100% based on code alone.
