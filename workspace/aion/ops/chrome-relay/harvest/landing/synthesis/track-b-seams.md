# Candidate Track B integration seams — seed batch C-001
**NONBINDING architecture crosswalk.** This document neither changes [CENV-01..14](../../../ARCHITECTURE.md) nor the [DATA contract](../../../ENVELOPE-CONTRACT.md), grants, stores, code, release criteria or source authority. Source item revisions UNKNOWN until A/B publish. No code changes or tests have been performed for this synthesis.

## Rule for reading this document
- AION's current limited vertical slice is **CLI -> existing Bus -> exact dev conversation -> page submit/observe -> correlation/check -> durable CLI result**, as in current ARCHITECTURE lines 7-54. Its existing immutable lock, grant and observer history govern operations.
- Every donor lead must first become a revision-pinned landing record, with original meaning and evidence kind. Only then can the Track B development owner choose ACCEPT / DEFER / REJECT.
- Never introduce a second orchestrator, replacement database/event bus, universal browser driver, broadened privilege, or automatic live action while performing synthesis.

## Seam proposals (all pending disposition)
| Source seed(s) | AION existing owner / target | Narrow useful idea (hypothesis, not implementation instruction) | Invariant to preserve / non-transfer |
|---|---|---|---|
| FINAL-02; OMEGA-03 | CENV-03/12; DATA-01..03; page content.js state and read-only ping | Classify per-action existence, visible/enabled/unique/readiness, identity, freshness and reason; retain null for unknown | Capability registry or UI presence never becomes authorization; no donor DB override/rule interpreter transplant |
| FINAL-07; OMEGA-05 | CENV-01/03, content.js state projection | Small bounded raw-observation -> typed snapshot projection with required evidence and explicit conflict reason | No selector priority guessing, inheritance framework, broad telemetry or arbitrary observer endpoint; exact unique target wins |
| FINAL-01; FINAL-06; OMEGA-01 | CENV-01/02/08; correlator and existing observer records | Borrow vocabulary to distinguish stream/session changes from task-bound operation stages, preserving event timestamp/order | Do not map stream complete or session idle to reply checked; no new lifecycle machine or heartbeat-based promotion |
| FINAL-04; FINAL-05; OMEGA-06 | Existing Bus registry, parser, grant check and target binding | Semantic action vocab separate from provider actuation, contextual readiness, and UI presentation; typed command preconditions | No second command registry/grammar, auto interpretation-to-execution, new grant source, or hidden invocation |
| FINAL-03; OMEGA-02 | CENV-10/11; DATA-04/05; page -> worker -> adapter -> CLI mapping | Preserve failure_stage and original failure_reason across each boundary; explicit UNKNOWN_EFFECT means observe/reconcile only | **Reject FINAL-03's transport reconnect and send-again paths**; no alternate actuation, last-message resend or tombstone reset |
| OMEGA-07; OMEGA-08; FINAL-01/08 | CENV-02/07/08/13; operation record, correlation and checked reply | Map Attempt/evidence/message/stage timing to existing operation_key/task_id/correlation_id and minimal evidence receipts | No Work/Plan store, message-content dedup as operation ID, or proof from simple transport ACK |
| FINAL-08; OMEGA-06 | CENV-14; Send and Stop as separate observations | Distinguish local cancellation, request drain/stop, provider generation Stop and user-turn effect | No borrowed cancel/force-stop actuator; observing Stop is read-only; Stop never revokes submitted turn |
| OMEGA-04; FINAL-05; OMEGA-06 | Future provider-family/adapter design; current existing ChatGPT adapter only | Preserve common AI-chat semantics and per-provider realizations, plus bespoke webapp-specific capability extension points | No generalized provider framework as a prerequisite to current CENV repair; no false current live provider support |
| OMEGA-08; FINAL-03 | CENV-09, DATA timing; existing command-deadlines and remote-call | Stage timestamps and typed diagnostic failure categories, bound to original operation | No changed wall-clock-to-monotonic semantics, renewed deadlines on poll, or retry budget that can resend a turn |

## Architecture seams and dependency chains
### 1. Generic semantic action -> provider-specific action
Semantic Send (FINAL-05/OMEGA-06) -> concrete provider realization (OMEGA-04/FINAL-08) -> exact browser surface and bound conversation (AION CENV-01/03) -> fresh observed action state (CENV-03/12) -> **independent** Bus grant, durable reservation and unique target (CENV-04) -> one activation attempt (CENV-06) -> positive evidence of matching new user turn (CENV-07) -> paired response evidence and checked reply (CENV-08). The donor records currently support category modeling only, not existence of a complete tested chain.

### 2. Availability -> action (without privilege escalation)
Catalog or rule definition -> actual implementation binding -> scoped current observation -> freshness check -> exact surface/grant/lock confirmation -> action eligibility. Unknown at any required step blocks activation; a status probe never issues Send or Stop. This is the crosswalk's candidate model; CENV and DATA are the governing target.

### 3. Failure -> reconciliation (without a second effect)
Preflight definite refusal / no activation evidence -> preserve failure stage. Once activation is attempted, or effect cannot be excluded -> preserve possibly-submitted identity, guard and uncertainty -> read-only original-observer reconciliation -> factual result or explicit unresolved state. No retry, alternate surface, new operation key, reconnect-triggered send or switch to UIA after possible submission.

### 4. Session/stream/evidence (without conflating axes)
Provider/account/session binding context [OMEGA-04/08] + stream presentation [FINAL-01] + session transitions [OMEGA-01] are context **inputs**, not automatic durable command progress. AION snapshot (now), operation facts (historical), and Send/Stop state (now and per action) remain orthogonal.

## Development-owner acceptance questions (not yet decided)
1. Does an immutable donor capture show a missing classification or observation reason not expressible in CENV-01/03 or DATA-01..04? If yes, propose an additive mapping with compatibility proof; otherwise reuse current fields.
2. Can present AION interfaces carry reason, observer identity, timestamps, provenance, null-vs-false and exact target without broadening the privileged page action surface? Show a cross-layer negative test before considering changes.
3. Do proposed mappings withstand contradictory controls, delayed Send readiness, editor replacement, Stop flicker, lost observer and unknown effect without a second send?
4. Do any donor abstractions demonstrably simplify future **bespoke** webapp adapters without creating a generic framework now? Require evidence of two genuinely different provider implementations, not two copies of one ChatGPT source.
5. What donor code is live implementation vs schema/design vs experiment or deprecated copy? Confirm with owned call graph, revision and tests before any acceptance.

## Targeted evidence requests to A/B (not a dependency on Windows)
- Worker A: provider/category registry, schema seeds + availability evaluator, concrete chatgpt adapter boundaries, command/confirmation consumers, Send/Stop semantics, and tests. Publish VF IDs with revision and read coverage.
- Worker B: Core vs BCP-dev vs FullTest vs experiments ancestry, provider realization and command plugin types, full capability resolver, actual session manager/shape owner, unknown-effect design, identity/retry guards. Publish VO IDs and duplicates.
- Crosswalk accepts either worker's batches as soon as visible **in the GitHub branch being inspected**; GitHub commits do not independently notify a running ChatGPT agent.
- After capture, compare claimed feature presence separately from *actually proven on a current provider*. Preserve opposing interpretations; never promote research to Track B authority automatically.

## Safe integration process
Source evidence -> crosswalk with contradictions and revisions -> Track B owner disposition -> separate implementation change with focused tests -> separately authorized runtime verification when relevant. All user-owned live state and current no-resend locks remain outside this research lane.
