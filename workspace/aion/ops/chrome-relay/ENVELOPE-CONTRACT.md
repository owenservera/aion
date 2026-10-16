# AION Relay Envelope v0.1
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
