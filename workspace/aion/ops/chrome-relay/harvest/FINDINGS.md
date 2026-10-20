# Harvest findings and candidate register

Status: both first-pass candidate batches recorded 2026-10-20. No candidate is yet an accepted AION specification or runtime implementation.

## Evidence rules

- **CANDIDATE:** located during reconnaissance; not yet accepted for reuse.
- **SOURCE_OBSERVED:** the cited implementation/document was read; does not mean it works today.
- **OFFLINE_TESTED:** exact command, UTC and output recorded for the cited revision.
- **LIVE_VERIFIED:** separately authorized current live evidence; none is expected from this research.
- **ACCEPTED_FOR_SPEC / REJECTED / DEFERRED:** development-owner dispositions, not researcher implementation claims.

Every completed entry must include source repository/path/revision where known; symbol/line anchor; read coverage; original term and meaning; proposed AION mapping; dependency/staleness hazards; recommended minimum transfer; acceptance-test proposal; and disposition.

## Candidate batches

### vivim-final first pass

Source root: `C:\0-BlackBoxProject-0\vivim-final`. Revision not captured; anchors refer to surveyed working files and need checkout/revision verification. Research session: `ses_ea7336584ffeYjF5avWRRUqzcS`. Researcher reports no execution/network/browser/install or source changes. Paths below are relative to this root.

#### FINAL-01 — stream states and evidence identity (P1)

- Source: `frontend/src/shared/streaming.ts:11-25,27-60,63-110`; researcher-reported consumer `frontend/src/components/canvas/ObservabilityHUD.tsx:40-41`.
- Parent read the complete 110-line shared module. It defines stream states `idle|connecting|streaming|thinking|paused|complete|error`, indexed events with timestamp/trace ID, and stream-session last-event/completion times. These are types and presentation metadata, not an enforced chat-turn state machine.
- Minimum transfer: distinguish stream events, stream status and operation evidence; retain identity/time/order in observations.
- **Rejected mapping:** `paused` does not mean submitting or stopped; `complete` does not mean settling; transport `connecting` is not necessarily composer preparation. Do not relabel these values one-to-one into AION's lifecycle.
- Acceptance proposal: a stream completion label cannot bypass original submission/completion evidence; a stream heartbeat cannot renew operation authority/deadline.
- Disposition: CANDIDATE / SOURCE_OBSERVED; literal lifecycle transplant REJECTED.

#### FINAL-02 — resolved capability contract (P1)

- Source: `src/engines/capability-resolution.ts:18-23,32-94`; researcher also located schema rule fields in `prisma/schema.prisma:351-358` and `prisma/system/schema.prisma:308-315` by search.
- Terms: UI states, visibility/existence rules, dependency gating, interaction/recovery behavior, binding confidence and slot. Similar to OMEGA-03; do not count the similar model as independent runtime corroboration.
- Read coverage: researcher read engine lines 1-150 only; schema anchors are search evidence, not complete reads. Parent has not checked this checkout's module.
- Minimum transfer: availability as explicit contextual data rather than a widget's existence. Rule-string fields are not proof of a functioning evaluator; read actual rule evaluation/seeds before claiming semantics.
- Acceptance proposal: a catalog entry or login requirement alone does not produce current action availability or permission.
- Disposition: CANDIDATE / RESEARCHER_REPORTED; complete-owner read required.

#### FINAL-03 — classified failure, NOT retry policy (P1)

- Source: `src/engines/send-resilience.ts:14-40,46-66,85-155,177-202`; related `src/errors.ts:334-365` was an excerpt read by the researcher.
- Parent read the complete 209-line resilience module. It separates preflight result, input/output and recovery kinds, but `sendResilient()` calls `sendFn(input)` again at 136 after a transport-class error/reconnect. `recover()` reconnects and resends `lastMessage` at 148-155.
- Minimum transfer: bounded, typed failure classification and original failure stage. Explicitly distinguish connection failure before dispatch from unknown effect after dispatch.
- **REJECTED:** automatic resend, replay-last-message, treating a reconnect budget as an exactly-once guarantee, optimistic "was not sent" copy and ChromeGovernor/session-relogin dependencies. There is no demonstrated operation guard in this wrapper that makes its second Send idempotent.
- A test file's existence is not tested evidence: `tests/integration/engines/send-resilience.test.ts` was not read or run.
- Acceptance proposal: a socket error after dispatch yields unknown effect and zero second Send calls, regardless of successful reconnect.
- Disposition: SOURCE_OBSERVED; taxonomy CANDIDATE, behavior transplant REJECTED.

#### FINAL-04 — command result and confirmation identity (P2)

- Source: `src/intel/nlcl/types.ts:18-25,44-67,81-127,136-182,212-227`; design excerpt `docs/kernel-plugins/inventory/KERNEL-CONTRACTS.md:1180-1200`.
- Researcher reports complete 232-line types read; parent validation pending. Terms include action classification, command context, trace/capability ID, confirmation token, clarification and one interpreted-command interface across surfaces.
- Minimum transfer: separate intent resolution, confirmation, authority, execution and result. Map to existing AION command/operation identities rather than inventing another pipeline.
- Hazards: natural-language routing is not browser actuation; confirmation-token resume has not been traced. The `agent:query_state` example in `src/server/websocket.ts:227-238` is reported as a stub, not an implemented conversation-state source.
- Acceptance proposal: clarification/confirmation responses never dispatch; a token is not a grant or effect observation.
- Disposition: CANDIDATE / RESEARCHER_REPORTED.

#### FINAL-05 — capability affordance vocabulary (P2)

- Source: `src/engines/capability-taxonomy.ts:8-50,66-76,172-182`, `src/engines/unified-registry.ts:19-48,152-169,197-215`; `frontend/src/components/chat/SendButton.tsx`.
- Researcher reports complete reads of the 299-line taxonomy, 231-line registry and 32-line SendButton; parent validation pending. Terms separate semantic send/read/regenerate capabilities and control/presentation/confirmation metadata.
- Minimum transfer: capability is an operation meaning; a rendered control is one affordance for it. No new general registry is needed.
- **Rejected:** catalog `Enter` hotkey is not evidence that synthetic Enter works on current ChatGPT; presentation order does not establish mutual exclusion; Send and Stop need independently observed availability. `send-capability.ts` is email-oriented and not a ChatGPT donor.
- Acceptance proposal: an implemented send capability may be present but currently disabled, unknown or unauthorized; none of those states implies Stop availability.
- Disposition: CANDIDATE / RESEARCHER_REPORTED.

#### FINAL-06 — session transitions and binding status (P2)

- Source: `src/engines/session-lifecycle-manager.ts:17-23,71-114`, `src/engines/harness/binding-status-ladder.ts:6-27`, `src/engines/state-transition.ts:9-25,56-68`.
- Researcher read only lifecycle lines 1-120, and reports complete 31-line binding ladder/84-line audit sink reads. Parent validation pending.
- Minimum transfer: legal transition table and separate binding/session/operation axes, consistent with OMEGA-01. Provider/session health cannot prove a turn was submitted or completed.
- Hazards: migration/aspirational persistence model; status promotion from generic success is not AION live-verification evidence. No heartbeat/session-manager transplant.
- Acceptance proposal: a binding can be healthy while Send is disabled and an earlier operation unresolved; none automatically advances the others.
- Disposition: CANDIDATE / RESEARCHER_REPORTED; complete lifecycle read required.

#### FINAL-07 — small projection from raw observations (P2)

- Source: `src/engines/capability-shape-registry.ts:10-79`, `src/engines/observation-tap.ts:12-44`; related partial read `src/engines/harness-protocol-engine.ts:11-36,100-130`.
- Researcher inspected shape lines 1-80 only and reports complete 45-line observation-tap read; parent validation pending.
- Minimum transfer: raw observations -> semantic state projection with required/optional evidence and typed source method. No shape inheritance framework or DOM/network/console collector is required.
- Hazards: selector-bearing hints stale; shape discovery reported partial. Do not copy selector strings, expose arbitrary observation commands or harvest console/network/private page data.
- Acceptance proposal: missing required observations produce UNKNOWN with a reason; an optional signal cannot substitute for positive submission proof.
- Disposition: CANDIDATE / RESEARCHER_REPORTED.

#### FINAL-08 — terminal outcomes and cancellation distinctions (P2)

- Source: design excerpts `docs/kernel-plugins/inventory/KERNEL-CONTRACTS.md:271-340,423-477`; concrete `src/engines/adapters/chatgpt-adapter.ts:147-196,297-432`.
- Researcher reports complete 440-line adapter read but only excerpts of the design inventory. Parent validation pending. Terms: error category, retryability hint, done/error event, cancel, drain, force-stop, request identity and message DAG.
- Minimum transfer: classify outcomes and distinguish stopping observation, cancelling a local request and stopping provider generation. A terminal local error does not prove the external effect ended.
- **Rejected:** equating done/error with successful settling; using retryable hints to resend; treating drain/force-stop as current ChatGPT Stop semantics. No backend-api/cookie/CDP extraction path may be transplanted.
- Acceptance proposal: a local timeout/cancel preserves possibly-sent state; observed Stop action cannot undo the user turn or grant a new send.
- Disposition: CANDIDATE / RESEARCHER_REPORTED (design portions concept only).

#### Read coverage, gaps and next batch

- Project `AGENTS.md` reportedly read completely (343 lines): kernel/plugin migration, research-first discipline, Governor-only CDP, no unapproved tsc. The continuing session must read applicable instructions itself; donor policy does not authorize CDP in AION.
- No complete per-turn Send/Stop model was located during the bounded survey. This is not an exhaustive repository-wide absence proof. Static SendButton/catalog entries do not fill the gap.
- Capture source revision/local modifications and migration destination before calling any path stable. Directory listings and grep anchors do not count as complete reads.
- Next: read command-description seeds and conversation/provider/session category owners; trace actual availability rule evaluation and populated seed values; read confirmation/dialogue stores; read resilience tests as evidence of modeled behavior without importing retry policy. Verify migration mappings before citing replacement paths.
- All CDP selectors remain assumed stale. No current-browser correctness or runtime execution is claimed.

### Vivim-omega first pass

Source root: `C:\0-BlackBoxProject-0\Vivim-omega`. Revision not captured; all anchors refer to the surveyed working files and must be rechecked against the research session's checkout. Research session: `ses_ea73333feffepeadlnR9Ho2VTH`. No tests, network calls or browser actions were performed.

The paths below are relative to that source root. `Core/vivim-final-enhanced/src/engines/` is abbreviated as `engines/` only within this batch.

#### OMEGA-01 — legal state transitions (P1)

- Source: `engines/session-lifecycle-manager.ts:17-23,71-79,94,107-114`.
- Original terms: session `creating | active | idle | suspended | recovering | terminated`; `VALID_TRANSITIONS`; `session:state_changed` carrying `from` and `to`.
- Evidence: parent directly read lines 1-125, confirming the enum and transition table. Researcher inspected lines 1-140 of 649, **not the complete module**.
- Minimum transfer: explicit legal transitions and evidence-bearing transition records. Keep session lifecycle distinct from AION's turn lifecycle and current page state.
- Do not import heartbeat, session recreation or the event-bus subsystem. Session `idle` is not proof that a particular response completed.
- Acceptance proposal: reject an operation jump from prepared to reply-checked without observed submission/completion; a session reconnect never emits a send.
- Disposition: CANDIDATE / SOURCE_OBSERVED for cited excerpt; DEFERRED pending complete owning-module read.

#### OMEGA-02 — unknown-effect recovery law (P1)

- Source: `BCP-dev/docs/destination/agentic-core/STATE-AND-RECOVERY.md:9-28`.
- Original terms: checkpoint, effect identity, `UNKNOWN_EFFECT/reconcile`; replay reconstructs decisions but never silently performs live side effects.
- Evidence: parent read the complete 28-line document. This is authored design intent, not runtime verification.
- Minimum transfer: distinguish pre-dispatch failure from post-dispatch missing acknowledgement; preserve possible effects and evidence through recovery.
- Do not import retry/requeue/lease machinery. The document's general retry paths do not authorize retrying ChatGPT Send.
- Acceptance proposal: loss of acknowledgement retains the original operation and lock; subsequent observation cannot actuate Send or Stop.
- Disposition: CANDIDATE / SOURCE_OBSERVED (concept only), not ACCEPTED_FOR_SPEC.

#### OMEGA-03 — availability is a resolved contract (P1)

- Source: `engines/capability-resolution.ts:18-23,32-94,105-110`.
- Original terms: `AvailabilityGating`, `ResolvedCapability`, `uiStates`, `uiVisibilityRule`, `existentialRule`, `recoveryBehavior`, `availability`, `bindingStatus`, `bindingConfidence`, `resolvedAt`.
- Evidence: parent read lines 1-115; researcher inspected lines 1-160 of 393. Neither read the complete module in this first pass.
- Minimum transfer: distinguish an action's semantic existence, observed visibility/enablement, contextual prerequisites, binding confidence and observation freshness. Model Send and Stop independently, not as opposite values of one boolean.
- Do not import database-backed overrides, plan-tier machinery, frontend slots or JSON rule execution. Presence/confidence is not authority or successful actuation.
- Acceptance proposal: hidden or disabled Send is unavailable; unknown observation remains unknown; stale availability cannot authorize an action; visible Stop is not automatically enabled Stop.
- Disposition: CANDIDATE / SOURCE_OBSERVED for cited type contract; DEFERRED pending complete resolution-rule read.

#### OMEGA-04 — semantic promise versus provider realization (P1)

- Source: `BCP-dev/docs/migration/PROVIDER_DATA_MODEL.md:6-13,36-76`.
- Researcher-reported terms: global semantics -> provider realization -> account -> execution -> stream -> conversation -> evidence; historical `STATIC < INTEGRATION < LIVE < REGRESSION` proof ladder.
- Parent validation: not yet performed; researcher reports a complete document read.
- Minimum transfer: separate the meaning of Send from its current DOM realization and separately report evidence method, age and execution result. Map proof categories to AION's existing evidence labels rather than adding competing status systems.
- Hazards: selector examples and historical OBSERVED labels are stale; regression evidence does not inherently outrank every live result. No ladder automatically grants authority.
- Acceptance proposal: a static capability definition cannot produce current readiness or a live-verified claim.
- Disposition: CANDIDATE; RESEARCHER_REPORTED only until source checked.

#### OMEGA-05 — affordance shape and state projection (P1)

- Source: `engines/capability-shape-registry.ts:28-65,69-105,277-335`.
- Researcher-reported terms: required/optional capabilities, discovery hints, interactive-element priority, `CapabilityAdapter.projectState`, shape inheritance.
- Read coverage: researcher inspected lines 1-120 of 369; later implementation anchors were identified but not established as complete reads. Parent validation pending.
- Minimum transfer: a small projection from raw observation to canonical state, with explicit required/optional signals.
- Reject priority-based guessing between multiple plausible Send controls: AION's exactly-one-target invariant wins. Selectors remain stale. Do not import a general shape registry.
- Acceptance proposal: contradictory or ambiguous controls produce UNKNOWN/BLOCKED, not whichever candidate has the highest priority.
- Disposition: CANDIDATE; RESEARCHER_REPORTED; full read required.

#### OMEGA-06 — command specification and context (P2)

- Source: `engines/command-language/types.ts:47-60,93-117,147-174`; sibling `registry.ts:13-73`, `interpretation.ts:15-90`; `engines/providers/plugin.ts:7-37,54-64`.
- Researcher-reported terms: `UnifiedCommandSpec`, `CommandContext`, `when(ctx)`, typed arguments, destructive flag, capability ID, result envelope, disclosure levels L0-L3; capability/action/surface distinction.
- Read coverage: researcher reports complete command-language module reads; parent validation pending.
- Minimum transfer: command preconditions and action classification separate from the command's implementation and display. Availability predicates are advisory observations, not permission checks.
- Do not import prefix grammar, most-recently-used ranking, chained/parallel commands, anti-detection profiles or provider recovery policies.
- Acceptance proposal: a command can be known but unavailable or unauthorized; rendering/disclosure never executes it.
- Disposition: CANDIDATE; RESEARCHER_REPORTED.

#### OMEGA-07 — attempt, artifact and evidence ownership (P2)

- Source: `BCP-dev/docs/destination/agentic-core/CANONICAL-MODEL.md:3-21,31-49`.
- Researcher-reported terms: Work, Plan, Step, Attempt, Trigger, Artifact, Evidence, Capability and Tool. A trigger does not authorize execution; an Attempt carries effect identity, timing and evidence references.
- Read coverage: researcher reports complete document read; parent validation pending.
- Minimum transfer: map intent -> existing AION command, attempt -> immutable operation, evidence -> observed facts/receipts. Explain these mappings without creating a new Work/Plan object store.
- Acceptance proposal: observing a trigger or possessing an artifact does not imply an authorized or verified effect.
- Disposition: CANDIDATE; RESEARCHER_REPORTED (concept only).

#### OMEGA-08 — stage timing, correlation and duplicate suppression (P2)

- Sources: `engines/message-identity.ts:15-43`, `idempotency-guard.ts:6-55`, `harness/harness-contract.ts:27-34,52-72`, `conversation-manager.ts:100-121`, `reliability/recovery-orchestrator.ts:66-90`.
- Researcher-reported terms: provider/account/conversation message identity, client-key/hash strategies, ordered message block sequence, `StageTiming`, failure classification and retry budget.
- Read coverage: identity/guard/harness contracts reported complete; conversation manager only lines 98-227, recovery orchestrator only lines 1-90 of 163. Parent validation pending. The actual send pipeline body was not read.
- Minimum transfer: bounded per-stage diagnostics and ordered evidence tied to the existing AION operation. Preserve original failure stage and reason through result mapping.
- Do not replace AION's durable tombstones with time-window/content-hash deduplication; identical owner instructions can be distinct operations. Do not import automatic send retries or provider/account REST adapters.
- Acceptance proposal: distinguish failure before activation from reply incomplete; identical text cannot bypass unresolved-operation locks; no fallback action follows unknown effect.
- Disposition: CANDIDATE; RESEARCHER_REPORTED; implementation-body review required.

#### Negative findings and coverage limits

- The researcher did not locate a complete turn-scoped state machine or Send/Stop availability model. Treat this as a bounded survey result, not proof none exists anywhere in the large duplicated tree.
- The report's heading called some reads "full" while listing partial ranges (session manager, capability resolution, shape registry, unified registry and recovery orchestrator). Those are **partial reads**; no full-module validation is credited here.
- `situation-detector.ts` (task-text classification) and `send-capability.ts` (email/SMTP) were rejected as off-target.
- Multiple source copies exist under Core, BCP-dev baseline, FullTest and experiments. Only limited duplicate comparison was reported; canonical source selection remains open.
- `BCP-dev/AGENTS.md` reportedly defines authority/cold-start and Windows shell rules. A continuing session must read it and the applicable Core instructions itself before working; this report does not override them or AION policy.
- Private `chat-*.txt` transcripts and archive bundles were excluded. Do not harvest them.

#### Next bounded research batch

1. Resolve the intended citation root using source-project instructions/current-context records; capture source revision and local-change status without altering the repositories.
2. Read the complete owners of OMEGA-01, OMEGA-03 and OMEGA-05 before accepting their implementation semantics.
3. Read the complete `conversation-manager.ts` and `live-capture-engine.ts`; trace actual prepare/submit/capture boundaries and failure propagation, without copying stale selectors.
4. Read classifier/strategy/timeout owners to separate observation recovery from effect retry. Reject any transfer that can resend uncertain commands.
5. Produce one compact AION mapping for conversation snapshot, operation history and action availability as separate axes, grounded in source and current AION invariants.

## Session handoff

`AION_HANDOFF_V1` — both reconnaissance batches complete; FINAL-01 through FINAL-08 and OMEGA-01 through OMEGA-08 available above. Parent checked complete streaming/resilience modules for FINAL-01/03, excerpts for OMEGA-01/03, and complete design document for OMEGA-02. Other candidates are researcher-reported, not accepted or tested. Rejected dangerous transfers are explicit. Blockers: citation-root authority/revision not established; several owners only partially read. Next action: dedicated harvest session performs bounded source/semantics validation, prioritizing availability rules and actual prepare/submit/capture boundaries. No product changes, browser actions or live verification.
