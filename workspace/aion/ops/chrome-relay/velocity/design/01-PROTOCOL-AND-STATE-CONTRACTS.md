# AION Track B — wire, operation, evidence and readiness contracts

**Status:** SPECIFICATION — no live or local implementation claimed  
**Related:** [solution architecture](00-SOLUTION-ARCHITECTURE.md), [roadmap](02-BUILD-ROADMAP.md), [acceptance](03-VALIDATION-AND-ACCEPTANCE.md).

## 1. Scope and compatibility

The **existing** `extension/src/bus/{contracts,bus,ledger,grants,registry,validate}.js` contract is authoritative for durable command state, grants, idempotency, terminal normalization and no-resend. The experimental branch currently has a pure `aion.rpc/1` validator in `velocity/src/rpc.mjs` with `send` expecting exact `to,text,nonce,grant_ref`; it has no server/peer authentication. **Do not silently reinterpret this existing wire shape.**

Proposed additive protocol:
- `aion.control/1` CLI-facing **intent** (alias/context, no caller-derived grant required). Broker resolves binding/approval and compiles it to an existing Bus `ingestStructured` reservation.
- `aion.rpc/2` next local transport envelope, negotiated via `hello` (or continue `aion.rpc/1` as compatibility shim for `status/doctor`). New methods require a separate strict validator; caller-supplied `source` remains untrusted metadata.
- `aion.chrome/1` extension/native-host control and event protocol, only in B channel.
- `aion.capability/1` existing readiness view extended by additive versioned details, not false READY states.
- `aion.event/1` monotonically sequenced broker progress snapshots.
- `aion.result/1` final/partial result profile.

All responses include `schema`, `request_id`, `operation_id` when admitted, `status`, `reason`, and `observed_utc` when applicable. JSON-encoded IPC frames are length-bounded and rejected before allocating very large buffers. Protocol-version mismatch fails closed, no silent downgrade of authorization.

## 2. Sample CLI intent and validation

```json
{
  "schema": "aion.control/1",
  "request_id": "r_example_0001",
  "method": "send",
  "args": {
    "alias": "chief",
    "text": "Review the current AION milestone",
    "channel": "dev",
    "context": { "project": "aion" },
    "wait": true
  }
}
```

The request above is illustrative; **not a real run**. No token or grant fields are fabricated by the CLI. Broker resolves `chief` via `ROLES.json` and bus registry to a real bound identity `role-05`; `role-05` requires a previously owner-confirmed exact conversation, not a guessed tab or role URL. The browser / executor route and `grant_ref` come from durable authorized state, with immutable snapshot `binding_revision`.

Recommended validation:
- `alias`: current CLI regex `^[a-z0-9][a-z0-9._-]{0,63}$`.
- `text`: nonempty, bounded to target adapter max; **no truncation then send**. Existing B parser uses max 2,000 chars for now.
- `context.project`: registered project identity, not arbitrary filesystem path from untrusted agents.
- `channel`: explicit `dev` only in B until implementation is verified.
- `request_id`: generate on CLI once and persist at broker admission; duplicate request same digest returns same operation, different digest refuses `IDEMPOTENCY_CONFLICT`.
- `wait`: local presentation/subscription only; no effect on send-count.

Resolution precedence: explicit input → confirmed active session context → persisted confirmed user default → **REFUSED** with missing field. The broker must **not** infer an approval from the fact that the CLI was launched. The owner has authorized normal AION live work in state, but each operation still obeys actual bus grants and scope.

## 3. Browser host wire and trust boundary

The extension service worker is the initiating party for `chrome.runtime.connectNative('com.aion.relay.dev')`; native host verifies Chrome-provided `chrome-extension://<id>/` argv, not untrusted framed data. The native host connects to the local broker over validated Windows IPC and relays **only supported message types**.

Logical messages (illustrative; actual native frames use existing 32-bit framing):
```json
{"schema":"aion.chrome/1","type":"HELLO","id":"h1","channel":"dev","extension_id":"<pinned-dev-id>","worker_epoch":"e1","version":"0.1"}
{"schema":"aion.chrome/1","type":"OBSERVE_TARGET","id":"h2","target":"chatgpt:chief","binding_revision":"rev-1","read_only":true}
{"schema":"aion.chrome/1","type":"SUBMIT_ONCE","id":"h3","operation_id":"op_example","target":"chatgpt:chief","binding_revision":"rev-1","approval_ref":"approved-grant-ref","observer_key":"observer-example"}
{"schema":"aion.chrome/1","type":"SUBMIT_RECEIPT","id":"h3","operation_id":"op_example","outcome":"UNKNOWN","reason":"actuation_not_confirmed"}
{"schema":"aion.chrome/1","type":"READBACK","id":"h4","operation_id":"op_example","observer_key":"observer-example","read_only":true}
```

**Important:** actual prompt text and token must be sent by the adapter in a well-defined field when dispatch occurs, **not** invented from the above minimal illustrative messages. It is not persisted in the authoritative ledger after DISPATCHED per existing bus; any browser-side pending payload must remain bounded to its existing durable task-store contract. Exact submitted text is compared with expected digest, but logs/evidence retain only permitted digest/count.

**Extension endpoint adapter** must re-use the *existing* `aion/chatgpt-submit` and `aion/chatgpt-observe` handlers and existing `createChatGPTTaskStore`; no parallel DOM driver. The existing worker already has `aion/bus-*` handlers. For B dev mode, broker owns bus mutations; browser-local bus mutating methods are disabled or become a broker proxy, never both.

**B authorization:** the currently accepted `user_gesture: true` field is not proof of a physical gesture. Add a versioned `approved_cli_intent` authority recognized only across authenticated B native-host/broker IPC and a stored grant. Do not expose that capability to content scripts, websites or generic sendMessage callers. A forged boolean must never bypass the policy.

## 4. Broker state mapping: at-most-once, not magical exactly-once

Existing Bus command states: `OBSERVED → VALIDATED → RESERVED → DISPATCHED → SUBMISSION_OBSERVED → REPLY_CHECKED → REPORTED`; terminal `REJECTED`, `HALTED`, `UNRESOLVED`. Use existing enumerations in actual code; the presentation lifecycle is a **view**, not a second transition engine.

| Bus / browser truth | Result profile status | Allowed next action | Resend? |
|---|---|---|---|
| Validation/grant/binding refused, no attempt | `REFUSED` / `NOT_SENT` | Correct binding/grant, start **new intent** | No implicit retry |
| `RESERVED`, no dispatch yet | `QUEUED_NOT_ATTEMPTED` | Explicit dispatch once if fresh and authorized | Original intent only, not duplicate |
| `DISPATCHED`, host ack lost | `UNKNOWN` | Read-only reconciliation by immutable observer identity | **NEVER** |
| Submit arm / attempt observed but click unproven | `UNKNOWN` | Read actual composer/transcript/observer | **NEVER** |
| Actual page submission confirmed | `SENT_OBSERVED` | Observe correlated reply | **NEVER** |
| Correlated assistant reply verified | `SUCCEEDED` | Display + report; no further execution | **NEVER** |
| Correlation mismatch / timeout after possible send | `UNKNOWN` or `REPLY_REJECTED` | Observe only, preserve lock until reconciled/disposed | **NEVER** |
| Broker crashes after marking DISPATCHED before Chrome call | `UNKNOWN` or later proved NOT_SENT | Reconcile; user may issue new **distinct** intent if actually not sent | **NEVER replay original** |
| Kill switch engaged | `HALTED` for unattempted only | Operator review before resume | **NEVER silently** |

**Semantic limit:** Distributed at-most-once dispatch with crashes **cannot guarantee exactly-one actual website action**. It may produce zero submissions if the broker crashes immediately after dispatch persistence. AION prioritizes never duplicating the action and gives a truthful UNKNOWN/NOT_SENT based on positive evidence. A successful result is only claimed when observed.

Lock dimensions: `target conversation` exclusive active operation; `agent session` concurrency per executor manifest; `UIA foreground/focus` global controlled lock; `operation key` unique. Preserve write ordering: durable reservation/grant debit → durable dispatch flag/removal of retained text → external side effect → observer evidence → durable settlement.

## 5. Events and resumable observation

Use a monotonic `seq` assigned under the single broker writer, optionally mirrored in the bus's event log. `event_id` and `operation_id` are distinct; event subscribers pass `after_seq`. Events can be replayed from bounded durable history and/or a full reconciled snapshot with new cursor after gap. A dropped terminal subscriber does **not** cause a resend.

```json
{
  "schema": "aion.event/1",
  "seq": 42,
  "operation_id": "op_example_001",
  "type": "submission.observed",
  "observed_utc": "2026-10-19T18:00:00Z",
  "state": "SENT_OBSERVED",
  "evidence_ref": "local-receipt:example",
  "stream": "aion-dev"
}
```

Event types should be a small closed set: `operation.accepted`, `operation.refused`, `binding.confirmed`, `capability.changed`, `dispatch.attempted`, `submission.observed`, `reply.correlated`, `operation.unresolved`, `operation.settled`, `host.connected`, `host.disconnected`, `kill.changed`. Never render `host.connected` as proof of successful model execution.

CLI default `send` streams stages until terminal settlement or a clearly reported observer timeout. `--detach` returns `operation_id` immediately (after durable admission); `observe <id> --follow` is repeatable and **read-only**. `--json` outputs structured result to stdout, optional incremental `--events jsonl` on stderr or an explicit mode. No hidden progress sent by web conversation after its turn.

## 6. Capability readiness contract

The existing `projectReadiness` validates:
- observation `target`, `observed_utc`, `health===CONNECTED`, `identity_verified`, `authority===GRANTED`;
- per action `inspect,compose,submit,observe_reply,cancel` and `submit_actuation_verified`;
- TTL default 2,000ms with `STALE` fallback;
- unknown values become `UNKNOWN` or `UNVERIFIED`.

Keep this as the initial projection. Differentiate installation, presence, verified binding, actuation health and grant:
```json
{
  "schema": "aion.capability/1",
  "target": "chatgpt:chief",
  "endpoint": "chrome:dev:bound-conversation",
  "observed_utc": "2026-10-19T18:00:00Z",
  "health": "CONNECTED",
  "identity_verified": true,
  "authority": "GRANTED",
  "submit_actuation_verified": false,
  "actions": {"inspect":"READY","compose":"READY","submit":"UNVERIFIED","observe_reply":"READY","cancel":"UNSUPPORTED"}
}
```

This is a **negative example** intentionally proving that CONNECTED does not imply submit ready. Observation cache invalidates on tab close/changed URL, native port closure, page reload, worker generation change, broker restart, host version mismatch, grant expiry/revoke, lock acquisition, desktop lock, UIA HWND change, OpenCode SSE disconnect, or evidence TTL expiry. Stale capability does not trigger an automatic UI action or model invocation.

## 7. Result Profile v1

```json
{
  "schema": "aion.result/1",
  "operation_id": "op_example_001",
  "status": "SUCCEEDED",
  "intent": {"op":"send","alias":"chief","text_sha256":"example-only-not-a-real-hash"},
  "context": {"project":"aion","channel":"dev","binding_revision":"rev-1","source":"confirmed"},
  "route": {"adapter":"chrome","target_verified":true,"source_sha":"example-revision"},
  "readiness": {"health":"CONNECTED","submit":"READY","grant":"PERMITTED","age_ms_at_dispatch":200},
  "delivery": {"reserved":true,"attempted":true,"submission_observed":true,"reply_correlated":true,"resend_allowed":false},
  "result": {"text":"Example successful reply","error":null},
  "timing_ms": {"broker_admission":20,"browser_actuation":65,"provider_generation":1100,"readback":40,"end_to_end":1225},
  "evidence": {"local_receipt":"example-uri","correlation_id":"example-correlation","observer_id":"example-observer"},
  "recovery": {"reconciliation_required":false,"next_action":null},
  "telemetry": {"tokens":null,"cost":null,"quota":"NOT_OBSERVED"}
}
```

All example values above are **synthetic**. A real `SUCCEEDED` must contain actual correlated readback proof. Valid top-level statuses `SUCCEEDED`, `SENT_OBSERVED`, `PENDING`, `NOT_SENT`, `REFUSED`, `UNKNOWN`, `HALTED`, `FAILED_CONFIRMED`. `FAILED_CONFIRMED` means the observed executor or model terminal state actually failed, not that a local timer ran out. Distinguish transport health from model result.

Metadata persisted: operation id, idempotency digest, route, authorization ref, binding revision, observer key, last state and minimal evidence. **Do not persist** raw cookies, browser localStorage credentials, auth headers, entire chat history or filesystem environment. Transcript excerpt may be returned to its authorized local CLI and kept in secured local result store according to retention policy; GitHub gets redacted receipt only.

## 8. Errors and exit policy

| Refusal / outcome | Machine reason | CLI exit | Meaning |
|---|---|---|---|
| Complete correlated success | `REPLY_CORRELATED` | 0 | Actual reply verified |
| Accepted but `--detach` | `ACCEPTED_PENDING` | 0 | Operation admitted; not result success |
| Invalid CLI / schema | `BAD_COMMAND` or `BAD_ENVELOPE` | 2 | Nothing attempted |
| Missing target/grant/ready action | `BINDING_MISSING`, `GRANT_REQUIRED`, `ACTION_UNVERIFIED` | 3 | No submission |
| Broker/host unavailable before dispatch | `RUNTIME_NOT_CONNECTED` | 4 | No submission if confirmed |
| Possible send but no proof | `OUTCOME_UNKNOWN` | 5 | Must observe; no resend |
| Verified executor failure | `EXECUTOR_FAILED` | 6 | Terminal actual failure |
| Kill/scope/incompatible version | `KILL_ENGAGED`, `VERSION_MISMATCH` | 7 | Refused/held |

The status, not exit 0 alone, is the durable truth; this table is proposed and must be mirrored by CLI tests. Record `transportAck`, `submitted` and `reply` as separate fields.

## 9. Reconciliation and failure injection invariant

For every `await storage.set`, bus `mutate`, Chrome observer write, message send, host proxy write and event emit, inject a crash/disconnect before and after the operation. Reconstruct the exact operation by persistent identity. **Never repeat a side-effect based solely on ACK loss.** The resumed consumer is allowed to: read ledger, read browser task journal, query exact page observer, classify positive NOT_SENT, show UNKNOWN, or request owner-authorized disposal. It is not allowed to call `submit-turn` again for the same attempted operation.

Keep official protocol references and immutable source versions in [Context7 index](04-CONTEXT7-SOURCES.md). 
