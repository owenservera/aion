# Harvest findings and candidate register

Status: Omega first-pass candidates recorded 2026-10-20; vivim-final survey pending. No candidate is yet an accepted AION specification or runtime implementation.

## Evidence rules

- **CANDIDATE:** located during reconnaissance; not yet accepted for reuse.
- **SOURCE_OBSERVED:** the cited implementation/document was read; does not mean it works today.
- **OFFLINE_TESTED:** exact command, UTC and output recorded for the cited revision.
- **LIVE_VERIFIED:** separately authorized current live evidence; none is expected from this research.
- **ACCEPTED_FOR_SPEC / REJECTED / DEFERRED:** development-owner dispositions, not researcher implementation claims.

Every completed entry must include source repository/path/revision where known; symbol/line anchor; read coverage; original term and meaning; proposed AION mapping; dependency/staleness hazards; recommended minimum transfer; acceptance-test proposal; and disposition.

## Candidate batches

### vivim-final first pass

Pending bounded read-only survey. No reusable behavior is claimed yet.

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

`AION_HANDOFF_V1` — Omega reconnaissance complete; candidates OMEGA-01 through OMEGA-08 available above. Parent directly checked excerpts for 01/03 and the complete design document for 02. Remaining candidates are researcher-reported, not accepted or tested. Blockers: source-copy authority/revision not established; several owning modules only partially read. Next action: dedicated harvest session performs the bounded batch above. vivim-final results remain pending. No product changes, browser actions or live verification.
