# Capture Studio Systems / Algorithms / Usability — Active investigation queue

**Issued by:** QA / Steering, owner-authorized team activation 2026-10-21. **Source checkpoint:** `cc536481aaab466fd7e6cbe00b63f007027dd588`. **Status:** ready for launch; no runtime claims.

## NOW — investigate independently
- [ ] **SYS1 Architecture recon.** Refresh main and compare the seven layers/four vertical threads in `../capture-studio-core/LAYERED-CAKE.json` with actual source, the latest Core change and Sprint 02. Separate implemented, inferred, unsupported and untested capabilities.
- [ ] **SYS2 Identity integrity.** Analyze `identity.mjs` + `continuity.mjs` for same-site different-tenant false joins, ambiguous/missing key behavior, type drift, key format collisions, cross-session stability. Offer specific adversarial examples and ranked solution options, not speculative defects.
- [ ] **SYS3 Historical truth.** Review temporal graph and as-of semantics, status transitions, missing timestamps, revision sorting, source deletion/rederive, and evidence provenance. Explain the most consequential invariants and design alternatives.
- [ ] **SYS4 Cost/scalability.** Trace scan and memory complexity of continuity, evidence capture and 400-event heuristic windows; identify simple mitigations before proposing another mutable knowledge database.
- [ ] **SYS5 End-user conceptual model.** Translate observed vs inferred vs missing evidence into a minimal user mental model for UI; propose clear labels and interaction patterns, without implementing UI.
- [ ] **SYS6 Ranked decisions.** Produce a short source-backed top-five leverage ranking, each with benefit, risk, implementation owner, dependency and suggested verification. Record findings in this lane only, commit/push verified scoped docs. Do not alter Core/UI code.

## NEXT
- Scope-correctable and reversible learning; explicit change/removal representation.
- Type-alignment hypotheses without automatic false merges.
- Cross-layer measurement and provenance consistency.

## Operating boundaries
Systems is **independent analysis**, not QA test campaign, delivery gate, or Core implementation. No automatic instructions to other agents or requirements imposed on UI/Core. QA owns steering/roadmap and will reconcile research with evidence at regrouping. Read-only analysis of other lanes; writing to own Systems folder is now explicitly authorized by user's activation request. Document proposals as proposals. **Recommended ChatGPT effort: High for first pass, Medium for focused follow-ups.**
