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

## C-002 — refined seams against pinned remote donor evidence
Remote citations: final@8a798f91d52574cb3d7db579da516bc1c4aee7b7 (VF-0001..0008, excerpt copies) and omega@79ee558d6c7ea77c20f220db2341adaa57b11d44 (VO-GH-0001..0027, 15 copied / 12 flagged). Current AION current-target authority unchanged. These are **conceptual opportunities, not assigned implementation milestones**.

| Potential leverage | Exact remote capture IDs | Mapping into existing AION owners (no new product code here) | Boundary/decision |
|---|---|---|---|
| Two-axis provider model: AI chat / bespoke app family **plus** API_NATIVE / BROWSER_MEDIATED / SIMULATOR realization mode | VF-0001/0002/0003/0004; VO-GH-0001/0003/0007 | Future provider metadata and adapter introspection; current ChatGPT adapter keeps exact binding | Do **not** use Omega ProviderClass to mean chat vs IDE; do not treat static manifests as implemented provider support |
| Semantic actions and one-source multi-surface catalog | VF-0005/0008; VO-GH-0005/0009/0015 | Existing AION Bus command registry/listing; optional read-only capability introspection | No replacement registry, second interpreter-to-executor path or assumption tools/list is ready-to-act |
| Contextual rule resolution layered behind current physical Send observation | VF-0006/0007; VO-GH-0002/0007 | CENV-03/12, DATA-01..03, existing ping and page content.js | Final plan-tier/dependency filtering doesn't know real disabled/unique button; Omega PROMOTED doesn't grant action |
| Read-only provider/app shape projection with explicit ambiguous outcome | VF-0003/0004; VO-GH-0006; VO-GH-0027 FLAGGED | CENV-01/03 and page observer, typed reason/freshness | Copy **concepts** not selectors or inferred priority winners; no generic browser framework prerequisite |
| Evidence/provenance/status distinction | VO-GH-0002/0003/0004/0010; VF-0006 | DATA OperationEvidence and existing correlator/store | provenance OBSERVED/VERIFIED != fresh page observation; stage success != positive matching user turn |
| Fail-closed fixture preflight lessons | VO-GH-0008/0012/0013/0014, VO-GH-0016/17 FLAGGED | Existing AION preflight/authority/readiness checks | EMAIL FIXTURE ONLY; no CDP, cookie, test fixture, resend logic or false claim of live chat support |
| Deterministic command name selection and typed failure taxonomy | VO-GH-0005/0006/0009/0011; VF-0008 | Existing Bus parser/validator/result mapper | Copied test source ≠ passing test; interpreter doesn't execute; preserve AION exact target/grants |
| Candidate verification pipeline without transplant | VO-GH-0018..0021/0026/0027 FLAGGED | Evidence intake only; review whether required/optional observations can help existing page-state projection | Do not adopt a new promotion machine, retry/repair loop or inferred Send based on confidence |

### Strongest conceptual reuse chains (NOT priority assignments)
1. VF-0005 semantic contract -> VF-0001/0002 provider declaration -> VF-0003/0004 app archetype -> VF-0006/0007 context filter -> existing AION CENV-03 real action observation -> existing Bus authorization -> CENV-07/08 effect evidence. Break the chain at any unproven step. Current donors cover the **model**, not an authorized, proven end-to-end operation.
2. VO-GH-0001 provider realization mode + VO-GH-0003 evidence link + VO-GH-0007 status/liveness -> AION *separate* active binding/fresh UI observation. PROMOTED is proof-history context, not current readiness; detected drift does not self-authorize a Send retry.
3. VO-GH-0005 shared names + VO-GH-0009 resolution + VO-GH-0006 negative outcomes -> existing Bus canonical command/result surfaces. Cross-surface consistency is useful; copying the whole Omega root/permission system would be a counterproductive architecture transplant.

### Concrete conflicts for a Track B architect to decide later
- **Filtering versus diagnostics:** VF-0007 omits candidates for failed tier/existential/dependency rules; CENV needs explicit null/false/reason on the **current exact bound** Send/Stop controls. Query/filter output cannot be substituted for current action observation.
- **Lifecycle versus operation:** VO-GH-0002 realization PROMOTED/DEGRADED and VO-GH-0007 activeInComposition may coexist with an unresolved, possibly-submitted AION operation. No transitions across those state machines without independent facts.
- **UI genericity versus safety:** VF-0003/0004 ranks selectors/discovery hints; AION requires a unique, fresh, unambiguous target. Ambiguity must not select highest priority.
- **Fixture versus live effect:** VO-GH-0012 email fixture can demonstrate a contract shape but does not justify Chrome chat actuation, credential handling, CDP path, or claims of completed browser sends.

### Next follow-up inputs from A/B
- A: bind manifest/provider endpoint choices to real provider-specific adapter owners, rule evaluator / seeded values, and exact lifecycle send-reply tests. Preserve VF IDs and file hashes.
- B: deep-read flagged discovery owner modules, fixture falsifier tests without secret copying, and real browser preflight/unknown-effect decisions; distinguish remote omega repo from earlier local Core/BCP-dev/FullTest tree.
- C: ingest later batches only when they are published and fetched, and maintain a clear source-revision-indexed change log. Do not assume a cross-branch commit appears in the main landing tree until merged.

## C-003 — revised integration seams and security exclusions
Final: `owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7`, capture branch head `4454f9b913b4e3e5baeb8671daab127ca36030b3`, 27/27 `VF-0001..0027` COPIED_EXCERPT. Omega: `owenservera/vivim-omega@79ee558d6c7ea77c20f220db2341adaa57b11d44`, capture branch head `556aaaace61b3321c68c56bed1a8f7f96d697b8c`, 38 `VO-GH-0001..0038`, 26 copied, 12 flagged. No donor runtime tests or current-browser verification.

| Seam | New exact source evidence | Disposition advice (nonbinding) |
|---|---|---|
| Capability model and version negotiation | VF-0020/0021, VO-GH-0028/0029 | **INVESTIGATE** additional read-only provider version/proof freshness fields; do not import dynamic code loading, historical PROMOTED→READY shortcut |
| Resolved capabilities vs real-time control state | VF-0026, VF-0006/0007, VO-GH-0031 | **REJECT fail-open** rule evaluation or default READ for inferred external mutation; maintain CENV tri-state freshness, unknown blocks |
| Duplicate and unknown-effect handling | VF-0016/0024 | **REJECT** second Send after reconnect/transport failure, including the regression test that expects it; preserve existing AION tombstones |
| Provider registration architecture | VF-0010/0025 vs VO-GH-0001/0003/0007 | **DEFER migration decision** until canonically active owner/callers resolved; prefer additive adapter metadata, not whole framework replacement |
| Observation and causality | VF-0014/0017/0027; VO-GH-0032 | **CANDIDATE** bounded reason, stage, timestamp, causation and evidence references through existing observer/journal |
| Action candidate uniqueness | VF-0003/0004/0022; VO-GH-0030/0033 | **REJECT** highest-scoring selector winner for ambiguous Send; may use scores for read-only diagnostics |
| Conversation and stream identity | VF-0012/0015/0023; VO-GH-0010/0036/0037 | **CANDIDATE** external identity and ordered proof references; remote conversation persistence != current reply completion |
| Command and multi-surface projection | VF-0008/0009/0011/0018; VO-GH-0005/0009/0035 | **CANDIDATE** one canonical discovery/projection view; no second Bus or policy authority |
| Browser implementation example | VO-GH-0034/0038 | **REFERENCE ONLY** fixture email simulation; no backend/private API/CDP/live transport transplant |

**Decision points for development owner**: (D1) keep existing CENV/schema and add metadata vs a taxonomy migration; (D2) app-family + realization class as two axes vs collapse (recommend separate); (D3) current AION provider adapter with narrow extensions vs framework transplant (recommend narrow); (D4) historical capability promotion vs current ephemeral readiness (must remain separate); (D5) no-resend and uncertain-effect laws (must remain unchanged); (D6) which additive evidence categories genuinely simplify a second provider without delaying current ChatGPT vertical slice.
