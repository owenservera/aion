> **Owner-directed workplan, 2026-10-22:** [Five-sprint plan](SPRINTS.md) · [Worklog](WORKLOG.md) · [Sprint 1 report](SPRINT-01.md). Sprint 1 source investigation completed; Sprints 2–5 queued and not autonomously running. The SYS1–SYS6 list below is historical completion, not the active work request. No product edits, independent QA or live interactions are authorized by this Systems plan.

# Capture Studio Systems / Algorithms / Usability — Active investigation queue

**Issued by:** QA / Steering, owner-authorized team activation 2026-10-21. **Source checkpoint:** `cc536481aaab466fd7e6cbe00b63f007027dd588`. **Status:** SYS1–SYS6 completed as source investigation on 2026-10-21; independent runtime QA remains outside Systems.

## NOW — investigate independently
- [x] **SYS1 Architecture recon.** Refresh main and compare the seven layers/four vertical threads in `../capture-studio-core/LAYERED-CAKE.json` with actual source, the latest Core change and Sprint 02. Separate implemented, inferred, unsupported and untested capabilities.
- [x] **SYS2 Identity integrity.** Analyze `identity.mjs` + `continuity.mjs` for same-site different-tenant false joins, ambiguous/missing key behavior, type drift, key format collisions, cross-session stability. Offer specific adversarial examples and ranked solution options, not speculative defects.
- [x] **SYS3 Historical truth.** Review temporal graph and as-of semantics, status transitions, missing timestamps, revision sorting, source deletion/rederive, and evidence provenance. Explain the most consequential invariants and design alternatives.
- [x] **SYS4 Cost/scalability.** Trace scan and memory complexity of continuity, evidence capture and 400-event heuristic windows; identify simple mitigations before proposing another mutable knowledge database.
- [x] **SYS5 End-user conceptual model.** Translate observed vs inferred vs missing evidence into a minimal user mental model for UI; propose clear labels and interaction patterns, without implementing UI.
- [x] **SYS6 Ranked decisions.** Produce a short source-backed top-five leverage ranking, each with benefit, risk, implementation owner, dependency and suggested verification. Record findings in this lane only, commit/push verified scoped docs. Do not alter Core/UI code.

**Report:** [ASSESSMENT-01.md](ASSESSMENT-01.md) — pinned source `90fc6aa19e0b6b3378943a768a08cd53c9e108ac`; conclusions are advisory and source-grounded, with no new runtime tests.

## NEXT
- Scope-correctable and reversible learning; explicit change/removal representation.
- Type-alignment hypotheses without automatic false merges.
- Cross-layer measurement and provenance consistency.

## Operating boundaries
Systems is **independent analysis**, not QA test campaign, delivery gate, or Core implementation. No automatic instructions to other agents or requirements imposed on UI/Core. QA owns steering/roadmap and will reconcile research with evidence at regrouping. Read-only analysis of other lanes; writing to own Systems folder is now explicitly authorized by user's activation request. Document proposals as proposals. **Recommended ChatGPT effort: High for first pass, Medium for focused follow-ups.**
