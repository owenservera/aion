# Capability coverage and gaps — seed batch C-001
Status: PROVISIONAL, no implementation priority assigned. Evidence: [FINDINGS](../../FINDINGS.md), [taxonomy](taxonomy.md), [provider matrix](provider-matrix.md), [CENV](../../../ARCHITECTURE.md), [DATA](../../../ENVELOPE-CONTRACT.md).

## Evidence and coverage notation
- F = first-pass finding or reported candidate; O = source excerpt directly observed in original FINDINGS (only where explicitly identified); D = donor design proposal; A = existing AION **target specification** (not installed/implemented proof); P = A/B captured immutable landing record; T = recorded offline test; L = current authorized live observation.
- A category having F or O does **not** mean AION provides it, nor that a donor implementation works. No donor source revisions are known; no A/B P records or Crosswalk-run tests were available in C-001. Do not assign numeric scores that hide these distinctions.
- Scope is relevant concepts across donors, not a claim to have exhaustively inspected either repo. High-value gaps are collection requests, not build priorities.

| Capability / question | Vivim-final seed(s) | Vivim-omega seed(s) | Existing AION target/seam | Evidence currently held | Gaps/uncertainties |
|---|---|---|---|---|---|
| Provider family/type + concrete provider realization | FINAL-02/05/08 | OMEGA-04/06 | Existing ChatGPT-bound adapter; future provider classification not in bounded CENV repair | F; donor design for OMEGA-04; A | Actual provider classes, tested provider instances, canonical source owner, bespoke-webapp families UNKNOWN |
| Generic semantic actions (send/read/regenerate) | FINAL-04/05 | OMEGA-06 | Existing Bus command meanings; extension ChatGPT path | F; A | Semantic names vs vendor implementation; command definition/registry ownership; supported native actions UNKNOWN |
| Exact browser surface + active composer | FINAL-05/07/08 | OMEGA-05 | CENV-01/03/04/05/06 | F; A | Live control identity, unique target validation, ambiguity, changing editor identity; no donor current-browser verification |
| Contextual availability / binding confidence | FINAL-02/06 | OMEGA-03 | CENV-03/12, DATA-01..03 | F; original OMEGA-03 excerpt observed; A | Full rule evaluator, instantiated seeds, freshness, conflict/unknown handling |
| Independent Send and Stop observations | FINAL-05/08 | OMEGA-03/05 | CENV-03/14 | F; A | Specific donor Stop control binding unknown; no claim Stop can act; per-action method/reason missing |
| Conversation snapshot vs durable operation vs session status | FINAL-01/06 | OMEGA-01/07 | CENV-01/02, immutable guard | FINAL-01 O; OMEGA-01 excerpt O; A | Verify complete lifecycle module; no complete source turn machine; transitions are not translatable 1:1 |
| Stream events / generation start-end / reply settling | FINAL-01/08 | OMEGA-08 | CENV-07/08, current strict correlator | FINAL-01 O; F; A | Task-bound paired start/end in live DOM, stable candidate, flicker, late events; source stream UI status alone not sufficient |
| Observation method + raw-to-semantic projection | FINAL-07 | OMEGA-05 | CENV-01/03, DATA-01..04 | F; A | Owning observation implementation, required signals, ambiguity behavior; avoid copying collectors or selectors |
| Intent, command context, confirmation, grants | FINAL-04 | OMEGA-06/07 | Existing Bus reservation/grant/operation IDs | F; A | Real token resume/when(ctx) semantics, live authorization, execution-to-result ownership |
| Evidence identity and correlation | FINAL-01/04/08 | OMEGA-07/08 | DATA OperationEvidence, existing correlator and durable store | FINAL-01 O; F; A | Identity derivation, exact effect boundary, temporal ordering, schema migration; copied hash collision/mismatch |
| Stage timing, deadlines and telemetry | FINAL-01/03 | OMEGA-08 | CENV-09/10/12/13; DATA timing contract | F; A | Separate prep/submission/response budgets, monotonic age, actual observed performance and failed-stage preservation |
| Failure classification and unknown effect | FINAL-03 | OMEGA-02/08 | CENV-10/11, DATA-04/05 | FINAL-03 O; OMEGA-02 D/O; A | Distinguish pre-dispatch definite no-send from post-dispatch uncertain; avoid claim that generic retry classifications authorize resend |
| Retry, reconciliation and duplicate suppression | FINAL-03 | OMEGA-02/08 | Existing immutable tombstones/locks, read-only reconcile | FINAL-03 O showing hazardous resend; OMEGA-02 D/O | Not transferable: auto resend, last-message replay, content-hash/window dedup, unlock by reconnect |
| Cancellation, stop, drain, force-stop | FINAL-08 | OMEGA-06 (only generic flag/context) | CENV-14 read-only Stop availability; independently authorized Stop future action | F; A | Real provider Stop semantics vs local cancellation unknown; no implicit RPC extension |
| Plugin/adapter contract and extension points | FINAL-02/05/08 | OMEGA-04/06 | Existing AION adapter boundaries; no parallel architecture | F; A | Implementation ownership, compatibility, provider version/feature negotiation, security model |
| Test fixtures, negative cases and evidence provenance | FINAL-03 (test file unread) / 05 | OMEGA-08 (contract only) | AC-CENV-01..10 in [acceptance](../../../FALLBACK-AND-ACCEPTANCE.md) | F; A | Donor test code/commands/results not read; no crosswalk tests run; real browser proof separate |

## Explicitly missing coverage, not asserted absence
1. Complete schema/call graph for category > provider family/type > provider instance > account/model > surface > current action. The first 16 findings are not a source-wide inventory.
2. Bespoke webapp provider implementations and their divergence from shared AI conversational patterns. Worker A/B should preserve examples instead of forcing every provider into ChatGPT-like semantics.
3. Provider realization lifecycle: configuration source, rule engine and seed values, live feature detection/negotiation, account availability and stale overrides.
4. Real prepare -> activate -> matching submission -> observed generation start/end -> checked reply owner code and tests in both donors, with proven distinction between internal labels and effects.
5. Exact-copy/fork relationships of Omega Core, BCP-dev, FullTest and experiments, including whether the top-level final repo shares ancestry; see [duplicates](duplicates.md).
6. Safe read-only observation methods and bounded data retention. Avoid private transcripts, arbitrary DOM/network/console collection, cookies, credentials and undocumented provider APIs.
7. Concrete offline test receipts, revision-pinned modules and source line anchors from the current A/B workers. Old file paths may have been migrated/deprecated.

## Per-finding disposition ledger (all 16 seed IDs accounted for)
| ID | Concept to carry forward | Evidence caution / rejected mapping |
|---|---|---|
| FINAL-01 | stream event identity, timestamp, order | O on 110-line frontend shared module; stream complete != operation reply checked |
| FINAL-02 | capability + rule/binding contract | partial researcher report; evaluator/seed unknown |
| FINAL-03 | typed failures, failure stage | O on resilience module; **reject resend and replay-last-message** |
| FINAL-04 | interpreted command, confirmation, trace | report only; tokens not authority |
| FINAL-05 | semantic affordance taxonomy and registry | reported code; SendButton hotkey not proof of action |
| FINAL-06 | session state transitions, binding ladder | owner partial read; session != turn |
| FINAL-07 | raw observation projection | shape read partial; avoid broad collectors/selectors |
| FINAL-08 | terminal/cancel distinctions | adapter reported complete but unvalidated; Stop not proven |
| OMEGA-01 | legal session transitions with evidence | O on first 125 lines, not complete 649-line module |
| OMEGA-02 | UNKNOWN_EFFECT/reconcile as design | O on 28-line design, not execution |
| OMEGA-03 | contextual availability/binding | O excerpt only, full rule engine unread |
| OMEGA-04 | semantics -> realization -> context -> evidence model | donor design reported, parent unvalidated |
| OMEGA-05 | required/optional UI projection | partial/identified-only ranges; no priority winner |
| OMEGA-06 | command spec and runtime prerequisites | researcher report only; when(ctx) not permission |
| OMEGA-07 | Work/Plan/Attempt/Evidence model | design reported; don't create second object store |
| OMEGA-08 | message identity, stages, dedup | partial owner reads; hash dedup not durable tombstones |

## Coverage update protocol
When A/B publish, add immutable VF-/VO- capture IDs beside each seed, with source_revision, source_path, line_ranges, coverage, copied_paths and hashes. Move evidence level to P only for actual captured scopes; move to T or L only with exact command/run/UTC or authorized observation. Preserve each donor's original concept even if Track B does not adopt it. No auto-prioritization or product readiness promotion follows this table.
