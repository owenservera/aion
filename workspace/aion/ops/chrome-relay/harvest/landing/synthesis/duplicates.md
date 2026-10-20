# Cross-repo duplication, ancestry and divergence — seed batch C-001
Status: hypothesis register only. Both donor commits and dirty states UNKNOWN in the 16 pre-capture findings; **no byte-level duplicate proof**. See [FINDINGS](../../FINDINGS.md) and [SCHEMA](../SCHEMA.md).

## Method: do not double-count correlated evidence
Labels: EXACT_COPY requires identical captured bytes/hash and revisions; FORK_VARIANT requires ancestry or owner comparison with actual divergence; CONCEPT_OVERLAP means only similar terms/contracts; COUNTEREXAMPLE means incompatible or hazardous behavior; UNRESOLVED means insufficient source. Two source records are not two independent runtime confirmations, even if in different directories/repos.

| Candidate pair/cluster | Observed shared surface | Differential / possible ancestry | Current relation and proof needed |
|---|---|---|---|
| FINAL-02 <-> OMEGA-03 | ResolvedCapability / capability-resolution.ts; UI rules, binding, availability | Vivim-omega Core/vivim-final-enhanced path suggests shared tree, but not a proven revision ancestry. Complete implementations and rule evaluators not read | PROBABLE_FORK_OR_COPY, not confirmed. A/B capture owning module hashes, full rule evaluation and seeds |
| FINAL-06 <-> OMEGA-01 | session-lifecycle-manager.ts / transition modeling | Both first passes include partial owner reads; OMEGA-01 shows creating/active/idle/suspended/recovering/terminated | PROBABLE_FORK_OR_COPY. Compare complete files and tests before merging meanings |
| FINAL-07 <-> OMEGA-05 | capability-shape-registry.ts, required/optional UI evidence and projection | OMEGA priority/hints and shape inheritance may exceed the narrow FINAL projection; neither proves uniqueness | PROBABLE_FORK_OR_COPY with unverified differences; hash+symbol comparison needed |
| FINAL-05 <-> OMEGA-06 | capability/action taxonomy, command/context separation | FINAL registry/presentation vs OMEGA command grammar/provider-plugin. Similar idea, different owner modules | CONCEPT_OVERLAP; do not treat as same implementation without dependency trace |
| FINAL-04 <-> OMEGA-06 | command intent/context/result/confirmation vs typed command spec/when(ctx) | FINAL natural-language intent/confirmation, OMEGA command grammar/disclosure; actionability unverified | COMPLEMENTARY_OR_VARIANT, not runtime corroboration |
| FINAL-01 <-> OMEGA-08 | event identity, stream stages, timing and correlation | FINAL shared frontend presentation stream vs OMEGA identity/harness instrumentation | CONCEPT_OVERLAP, likely distinct layers; avoid lifecycle flattening |
| FINAL-03 <-> OMEGA-02 | send failure/recovery terms and uncertainty | FINAL implementation resends after certain transport errors; OMEGA conceptual UNKNOWN_EFFECT/reconcile forbids silent side-effect replay | COUNTEREXAMPLE / normative conflict. Reuse failure taxonomy only, reject automatic resend |
| FINAL-08 <-> OMEGA-08 | message/attempt/result identities, retryability vs idempotency guard | Different outcome/cancel and identity concerns. Identical payload or window dedup cannot replace AION immutable tombstone | CONCEPT_OVERLAP with hazardous transfer boundary |
| FINAL-02 / FINAL-05 <-> OMEGA-04 | capability registry, resolved state and provider realization | Provider/data model may be an ancestral/parallel schema rather than a concrete engine | UNRESOLVED ownership and schema migration; inspect migrations + callers |

## Tree-level duplicate hypotheses (not confirmed)
- OMEGA-01/03/05 reference Core/vivim-final-enhanced/src/engines: its name is an **ancestry clue**, not a guarantee that the top-level vivim-final modules are byte-identical or the latest owners.
- OMEGA findings explicitly flag Core, BCP-dev baseline, FullTest and experiments as multiple copies; canonical owner, divergence and migration destination remain UNKNOWN.
- Revisions of vivim-final and Vivim-omega were not captured in original surveys; even identical source paths across branches are not stable identities without source_repo + source_revision + path + content hash.

## Decision algorithm for incoming capture records
1. Compare source full path, immutable commit, copied byte hashes and owning symbol boundaries. Report EXACT_COPY only after a byte-for-byte check of the actual captured scope; partial excerpt hash cannot prove the whole module matches.
2. If hashes diverge, compare contracts, API signature, imports/callers, migrations/tests and dated source history. Distinguish changed comments, generated wrappers, purposeful fork and behavioral divergence. Preserve both records.
3. Group canonical candidates by role only after repo owner/import graph establishes the active code path; do not choose the newest-looking directory by name.
4. Count **evidence families**, not number of copied cards: two copied descendants of one module may support one hypothesis, not two independent validations. Tests of copies in one environment are not live verification.
5. Maintain cross-links in this synthesis file; A/B indexes remain owned by their respective workers. Keep each item's capture state and UNKNOWN revision visible.

## Required A/B handoff payload
Pairs of landing VF-/VO- IDs, source repo/commit/dirty state, relative owning path, copied paths/hashes, call sites/tests, lineage certainty, diff summary, and any dangerous behavior (especially resend/requeue or selector guessing). Zero verified exact duplicates at C-001.
