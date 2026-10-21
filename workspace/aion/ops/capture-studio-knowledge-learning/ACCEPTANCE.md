# L4 and L5 — 100% Acceptance Contract (proposed baseline)

**100% means all explicit criteria below independently evidenced on pinned commits and agreed scope, not universal intelligence over every site.** QA can refine coverage and owner approves any redefinition; no percent claim without criterion-level receipts. Other architecture layers retain their own completion targets.

## L4 Knowledge & Relationships
- [ ] K1 Unique and stable identity within a session for keyed, keyless and missing-key entities, including graph projections.
- [ ] K2 Safe cross-session exact identity with origin/site/key/type/tenant uncertainty exposed; negative joins never conflate unrelated accounts.
- [ ] K3 Reviewable schema/type drift hypotheses, provenance, explicit confirmation/rejection and reversible effect; no silent auto-merge.
- [ ] K4 Correct typed graph relationships with evidence, confidence basis and distinction between hypothesis and confirmed.
- [ ] K5 Historical/as-of state deterministic and reproducible, including undated, partial, removal and rejection semantics.
- [ ] K6 Recoverable provenance from derived entity/edge/revision to original recorded observations, with gaps flagged.
- [ ] K7 Data lifecycle rederive/delete/rollback consistency, bounded scans on representative workloads and compatibility.

## L5 Learning & Adaptation
- [ ] A1 Scoped corrections can be proposed, approved/rejected and reversed; account/site/type scopes do not leak.
- [ ] A2 Corrections update versioned priors/model and demonstrably change future derivation without modifying raw evidence.
- [ ] A3 Learning persistence survives restart/rederive; simultaneous writers cannot silently lose updates.
- [ ] A4 Held-out tests demonstrate measurable improvement and report false positives, false negatives, calibration and regressions.
- [ ] A5 Decision lineage includes origin evidence, review actor/action, model version, timestamp and rollback trail.
- [ ] A6 Bad/contradictory/out-of-order evidence is handled safely; uncertainty and sampling are represented honestly.
- [ ] A7 Deterministic replay, migration, recovery and privacy boundaries survive representative load.

## Acceptance matrix
For each criterion record **source SHA**, **test/fixture**, **environment**, **expected/observed**, **result**, **regression coverage**, **independent QA receipt**, **Windows/browser gap (if any)**. Builder progress and QA acceptance are separate. Track `proposed | implemented | locally_tested | independently_verified` states, never count unverified implementation as fully accepted. User-defined 100% should be shown only after K1–K7 and A1–A7 pass with relevant full-system evidence.
