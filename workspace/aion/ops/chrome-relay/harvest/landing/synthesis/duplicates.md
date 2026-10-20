# Cross-repo duplication, ancestry and divergence — seed batch C-001
Status: hypothesis register revised C-002. The 16 original local findings had UNKNOWN donor revisions; C-002 adds two pinned remote revisions, **without any proved cross-repo identical modules**. See [FINDINGS](../../FINDINGS.md) and [SCHEMA](../SCHEMA.md).

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

## C-002 — remote fork/duplicate reconciliation (important correction)
Pinned remote inputs change the evidence base: final@8a798f91d52574cb3d7db579da516bc1c4aee7b7 has VF-0001..0008; omega@79ee558d6c7ea77c20f220db2341adaa57b11d44 has VO-GH-0001..0027. **Omega's GitHub tree does not include the local-checkout Core/vivim-final-enhanced, BCP-dev or FullTest directories** cited in OMEGA-01..08. Hence the seed OMEGA-vs-FINAL same-file hypotheses above apply to those **unverified local snapshots**, not to the immutable remote Omega code just captured. Do **not** cite VO-GH-0001..0027 as a revalidation of those local folders.

### Remote evidence relationships (none establishes exact cross-repo copy)
| IDs / same-source groups | Relationship classification | Reason / follow-up |
|---|---|---|
| VF-0001 + VF-0002 | SAME OWNING MODULE, distinct provider records, not duplicate excerpts | Both from final seeds/providers/manifests.ts at same source revision; each captures a different named provider. File-level source hash matches, but excerpt-copy hashes differ. Do not deduplicate away either provider |
| VF-0003 + VF-0004 | SAME OWNING MODULE, distinct UI archetype records | Both from final capability-shape-registry.ts; chat_app vs coding_ide are meaningfully distinct, and the latter excerpt starts search_engine. Not evidence of different operational runtimes |
| VF-0006 + VF-0007 | SAME OWNING MODULE, contract vs concrete filter | Both from final capability-resolution.ts; distinct symbols; same file hash but different excerpt hashes. Together suggest design and implementation aspects, not two independent confirmations |
| VF-0005 + VF-0008 vs VO-GH-0001/0005/0009/0015 | CONCEPT_OVERLAP, no proven source ancestry | Both describe multi-surface capability catalogs. Final's registry supports UI/CLI/MCP/API/workflow metadata; Omega derives routed names from booted composition and shares with CLI/MCP/chat. Different source paths and contracts |
| VF-0006/0007 vs VO-GH-0002/0003/0007 | ADJACENT, not direct duplicate | Final resolves contextual UI capabilities; Omega tracks realization status/provenance and liveness. Filtered UI result, PROMOTED state and current actuation are three different things |
| VF-0003/0004 vs VO-GH-0012/0013/0014 | ADJACENT generic UI vs browser fixture | Final shapes suggest UI archetype hints; Omega plugin is email fixture with pre-send bars; neither proves live ChatGPT |
| VO-GH-0001 + 0002 + 0003 | SINGLE OWNERSHIP FACADES, not three implementations | Omega provider.ts re-exports ProviderClass from manifest.ts and RealizationStatus from vocabulary.ts; avoid counting facade as independent definition |
| VO-GH-0005 + 0009 + 0015 | SHARED-DERIVATION DEPENDENCY | surface.ts claims common routed-op name derivation consumed by chat/CLI/MCP; resolve.ts documents caller-derived op set, SURFACES.md describes surface contract. One source of definition, multiple consumers |
| VO-GH-0011 vs VO-GH-0009/0005 | TEST SOURCE, not passed test | Copied test file references logic, but B ran no tests; no evidence of T status |
| OMEGA-01..08 (local reconnaissance) vs VO-GH-0001..0027 (remote) | **DIFFERENT CITATION ROOTS**; mapping UNKNOWN | Local paths absent from remote GitHub tree; no exact-content comparison possible. Do not consolidate by similar terms alone |

**Crosswalk duplicate result:** 0 verified exact cross-repository duplicate modules, 0 verified ancestry links, 0 cross-repo independent runtime confirmations. Confirmed *same final-repo owning-file* groupings (3) and Omega facade/consumer relationships (2+), at pinned remote revisions. Exact excerpt hashes and common source file hashes are evidence of file/scoped copy provenance, not of branch ancestry. If further donor batches include the local directory trees, require their own source commit and dirty state before linking.

## C-003 — final candidate overlap / divergence ledger
Final: `owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7`, capture branch head `4454f9b913b4e3e5baeb8671daab127ca36030b3`, 27/27 `VF-0001..0027` COPIED_EXCERPT. Omega: `owenservera/vivim-omega@79ee558d6c7ea77c20f220db2341adaa57b11d44`, capture branch head `556aaaace61b3321c68c56bed1a8f7f96d697b8c`, 38 `VO-GH-0001..0038`, 26 copied, 12 flagged. No donor runtime tests or current-browser verification.

| Evidence relationship | Classification and caution |
|---|---|
| VF-0006/0007/0026 | **Same Final owning capability-resolution.ts:** contract, filter, malformed-rule **fail-open implementation**. Do not count as three confirmations of safe resolution |
| VF-0008/0009 | **Same Final unified-registry.ts:** registry schema vs exported implementation; basic validation does not establish grants |
| VF-0016/0024 | **Implementation plus test expecting its unsafe resend**: the test corroborates intended behavior, *not* safe idempotency |
| VF-0013/0027 vs older OMEGA-01 local findings | Session transition vs audit concepts; remote Omega is a different citation root |
| VF-0014/0017 vs VO-GH-0032 | Observation event/timing vs causal fixture trace; concept overlap not duplicate |
| VF-0015/0023 vs VO-GH-0010/0036 | Message and conversation identity vs storage; different operational scopes |
| VF-0010/0025 | **Competing versions of Final provider plugin interface**, canonical registration unresolved; track as true internal divergence |
| VF-0003/0004 vs VO-GH-0030/0033 | Heuristic shape/discovery concepts with independent source owner, not proven shared code or safe auto-control ranking |
| VF-0020/0021 vs VO-GH-0002/0007/0028/0029 | Extension/feature declarations vs realization/proof lifecycle; adjacent but different readiness meanings |
| VF-0026 vs VO-GH-0031 | Two **different fail-open/default-risk hazards**; not duplicate implementation, both reject for authority-bearing action |
| VF-0011/0018 vs VO-GH-0005/0009/0035 | Typed command/confirmation and shared routed name resolution; complementary layers |
| VO-GH-0018 and VO-GH-0028/0029 | Flagged top-level verification owner plus copied evaluator/policy *submodules*; do not treat the flag as a third read |
| VO-GH-0020 and VO-GH-0030/0031 | Flagged mapping entrypoint plus captured solver/blueprint; entrypoint still unread |
| VO-GH-0019 and VO-GH-0032; VO-GH-0021 and VO-GH-0033 | Flagged entrypoints vs captured pure helpers; partial coverage only |
| VO-GH-0016 vs VO-GH-0038 | Flagged browser owning module vs excerpt of four-gate fixture Send: **not** a full module read |
| VO-GH-0012/0013/0014/0034/0038 | One Omega browser-email **fixture** family with manifest/design/parser/implementation; do not count as five independent live browsers |

**Exact cross-repo byte-equality / common ancestry still unproven.** Each source has its own pinned GitHub revision; earlier local Omega Core/BCP-dev/FullTest findings remain separate. Similar vocabulary and repeated modules do not establish independent proof.
