# AION Relay Envelope v0.1

## Track B observation contract — target v1 (2026-10-20)

Normative implementation target for [CENV-01 through CENV-14](./ARCHITECTURE.md#track-b-command-environment--current-target-specification-2026-10-20), not an implemented schema or permission grant. The historical envelope below remains unchanged. Additive observation/result fields must be validated and carried through existing page, worker, adapter and CLI boundaries; do not repurpose relay task/delivery enums.

### Snapshot and operation are separate objects

Target semantic shapes (field names pinned for the repair; runtime schemas must be versioned when implemented):

```text
ConversationObservation:
  schema: "aion.chatgpt.observation/1"
  conversation_key, page_instance_id, observed_at: string
  freshness: "FRESH" | "STALE" | "UNKNOWN"
  state: "UNKNOWN" | "IDLE_EMPTY" | "DRAFT_PRESENT" | "RESPONDING" | "BLOCKED"
  reason: bounded reason code | null
  composer: { count: nonnegative integer | null, readable: boolean | null,
              empty: boolean | null, matches_outbound: boolean | null }
  actions:
    send: ActionObservation
    stop: ActionObservation

ActionObservation:
  present, visible, enabled, unique, context_ready: boolean | null
  reason: bounded reason code | null

OperationEvidence (additive metadata, not a new ledger):
  operation_key, task_id, correlation_id, page_instance_id, observer_id: string
  phase: semantic lifecycle projection from CENV-02
  click_attempted, submission_observed, generation_started,
    generation_complete, continuity: boolean | null
  failure_stage: "preflight" | "prepare" | "activate" | "confirm_submission" |
                 "observe_response" | "check_reply" | "persist" | "transport" | null
  failure_reason, validation_reason: bounded reason code | null
  activation_method: "synthetic_send_sequence" | null
  prepared_at, activation_attempted_at, submission_observed_at,
    response_started_at, response_ended_at, checked_at: UTC string | null
```

- **DATA-01:** `false` requires negative evidence from the applicable observation; absent/unreadable fields become `null`, not false. No raw composer/reply text in these metadata objects. `matches_outbound` is null outside the relevant operation.
- **DATA-02:** freshness is derived from observation time/identity; clock anomalies or unavailable age become UNKNOWN. The target freshness window is 2,000 ms. A fresh snapshot does not establish authority, prior submission or historical completion.
- **DATA-03:** current Send/Stop observations are scoped to the same exact conversation/composer surface. Hidden duplicates, disabled controls, missing controls and ambiguous controls are distinguishable. Unknown controls cannot be projected as ready.
- **DATA-04:** existing page `observation.reason` and durable observer `reason` must survive result mapping as `failure_reason` with the correct stage. Reply acceptance separately supplies `validation_reason`. A valid refusal is not an adapter-contract failure; an incomplete-generation verdict is not a pre-activation diagnosis.
- **DATA-05:** legacy `submitted:true` means possible submission where existing compatibility requires it. Only `submission_observed:true` permits a new consumer to label the operation submitted. Preserve unknown effect rather than changing legacy semantics silently.
- **DATA-06:** preserve existing storage keys/schema and immutable operation guard records. Any observer schema extension must read existing records safely; absent new fields remain unknown. Never discard/reset guards to make a new schema load.

### Timing contract

Preparation gets a fixed target ceiling of 5,000 ms from fill completion, consuming rather than extending the existing submit exchange budget. This replaces the single 400 ms delay as the readiness criterion; it introduces no new user-facing timeout flag. `submission_timeout_ms` governs how long first submission evidence is awaited after activation; default target 5,000 ms, bounded by the remaining submit exchange plan. `response_timeout_ms` governs original task-bound response observation after activation; default target 180,000 ms and ceiling 300,000 ms. These are target internal fields to be explicitly allowlisted at the current submit boundaries, not arbitrary caller authority to extend a task. The response deadline is set once at activation and may not exceed the initial task's preparation ceiling plus its allowed response budget. The existing 20,000 ms submit work budget remains a finite RPC-stage ceiling, not the response lifetime. Polls carry no renewed response budget. Pin exact propagation/clamps in cross-layer tests before exposing the fields.

### Interface boundaries

Reuse `ping` for a read-only current snapshot, `submit-turn` for one guarded attempt plus first receipt, and `observe-turn` for the original observer's evidence. Existing worker `aion/chatgpt-ping`, `-submit` and `-observe` remain the routes. The local remote-call allowlist currently lacks ping; a narrowly typed read-only route is required if CLI readiness will expose the snapshot. Do not create a generic action forwarding endpoint. Stop availability may be reported without exposing Stop actuation.

---

## Historical envelope proposal (retained)

Status: proposed bus-level schema; not an ACP wire message.

Each event must carry: schema_version, message_id, correlation_id, causation_id, idempotency_key, producer_node, target_node, target_role, event_type, created_at, expires_at, sequence, priority, approved_scope_ref, payload_ref, payload_hash, delivery_state, and task_state.

Event families:
- relay.hello, relay.capabilities, relay.health
- role.tab_presence (does not imply active model reasoning)
- task.proposed, task.approved, task.dispatched, task.accepted, task.started, task.progress, task.blocked, task.cancelled
- proof.submitted, proof.verified, proof.rejected
- context.capsule.updated
- delivery.ack, delivery.nack, delivery.replay_requested
- operator.alert

Two independent state machines:
- Task: PROPOSED -> APPROVAL_PENDING -> APPROVED -> DISPATCHED -> ACCEPTED -> RUNNING -> PROOF_SUBMITTED -> VERIFIED or REJECTED; BLOCKED/CANCELLED/EXPIRED terminal or controlled recovery.
- Delivery: OUTBOX -> SENT -> ACKED; RETRY -> DEAD_LETTER.

An ACK only proves delivery, not executor acceptance, and executor completion never implies independently verified proof.
Persist events before sending. Deduplicate using message_id and idempotency_key at the receiving native host. Resume from the last acknowledged cursor and inspect prior job state before retrying non-idempotent operations. Failed or expired grants must never be replayed automatically.
Each proof includes executor session identity, source commit, test result, negative-case result, file digests and independent verifier identity.
Chrome UI stores minimal bounded draft metadata. IANG SQLite stores the local durable inbox/outbox. Existing AION GitHub task and proof receipts are the shared audit record.

ACP is a separate standard using JSON-RPC. The native host translates approved task messages into the supported ACP initialize/session/new/session/resume/session/prompt calls and maps ACP session/update to safe progress events. Negotiate actual installed ACP versions and capabilities; do not blindly forward relay envelopes as ACP.

Authentication and authorization are checked by the native bridge before any task reaches an executor. The browser extension cannot grant its own permissions.

## v0.2 additions — Bus V1/V2 (PROPOSED, 2026-10-19)
Status: proposed extension; not implemented. Authority and context: [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). All v0.1 rules above remain.

Additional event families:
- agent.registered, agent.updated, agent.retired
- command.issued, command.observed, command.validated, command.rejected, command.dispatched
- report.posted
- loop.halted, kill.engaged

Additional fields: `origin_kind` (`owner_phone`, `commander_reply`, `agent_report`, `executor_report`), `origin_ref`, `hop_count`, `max_hops`, `command_nonce`, `agent_id`, `parent_agent_id`.

Command state machine (separate from Task and Delivery): OBSERVED -> VALIDATED -> RESERVED -> DISPATCHED -> SUBMISSION_OBSERVED -> REPLY_CHECKED -> REPORTED; terminal alternatives REJECTED (validation failed, with reason) and HALTED (loop guard or kill switch). RESERVED must be durable before DISPATCHED. No state transition re-sends; an unknown outcome stays unresolved.

Rules: `command_nonce` is single-use and persisted; a replayed nonce is rejected. Report text is data and never selects an action. `hop_count` increments on every report re-entering the commander; reaching `max_hops` emits `loop.halted`. These events do not change the meaning of ACK, and none promotes M1.
