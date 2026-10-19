# OpenCode 2.0 — AION integration assessment

## Existing authority (do not supersede)
1. Owner Windows local master is the human/master machine; code and tasks remain in the one `owenservera/aion` `main` repository.
2. **Owner decision 2026-10-17:** OpenCode is *current Windows execution agent*; ZCode execution deferred on Windows until working, but its ACP transport role remains distinct. Historical `pm/OWNERS.md` general description and newer host-specific D1 must be reconciled by scope, not silently overwritten.
3. Chief of Staff / 03 coordinates real dispatch and acknowledgment; 04 owns OpenCode telemetry; 05 independently verifies; 06 tooling contracts. An issue is not an employee-chat ACK.
4. AION GitHub ledger is durable tasks + evidence. Browser transport/ChatGPT live M1 remains separate and authorization gated. No Slack, new GitHub repo/branch, Playwright, Puppeteer or automatic host installation.

## ACP architecture distinction (verified official V2 docs)
V2 `opencode acp` starts a **private OpenCode server** for an ACP v1, newline-delimited JSON-RPC child process; it **does not connect to the shared V2 background service**. This is distinct from the V2 `@opencode/client` HTTP adapter. See [ACP-AND-SERVICE-PROTOCOL.md](./ACP-AND-SERVICE-PROTOCOL.md) for the exact capabilities, session semantics and tests. Do not assume ACP sessions are visible in the shared service's session inventory.

## Proposed adapter — HTTP adapter offline-built; observer and production integration not built
**Status correction (2026-10-19).** A loopback HTTP adapter to the shared V2 service now exists and is offline-tested: [`../chrome-relay/extension/src/bus/adapters/opencode-v2.js`](../chrome-relay/extension/src/bus/adapters/opencode-v2.js), covered by 8 tests against a **FAKE** service ([`../chrome-relay/extension/tests/bus-opencode-v2.test.js`](../chrome-relay/extension/tests/bus-opencode-v2.test.js)) that passed independently at **2026-10-19T15:55:24Z** via `bun run test -- tests/bus-opencode-v2.test.js` (re-run locally the same day: 8/8 pass). A fake service is **not** live OpenCode evidence — the adapter is **optional, offline-built and not host-proven**, and nothing in it is code-complete or production-safe. Still **not built**: the read-only observer and its hardening, the durable pre-admission ordering, durable terminal-marker correlation, permission scoping, and any production/host integration. **ACP remains the primary execution route** (a private per-process server); the shared service inventory is a different surface and is **not** the ACP route.

The remaining work is one small read-only observer plus an owner-bound control path, behind the currently authorized dispatcher rather than a second controller. Use versioned DTOs, explicit `run_id`, `task_id`, `session_id`, `attempt_id`, `worktree_path` and `model_id`, with immutable evidence and owner identity. For Windows evaluate `@opencode/client` to talk to a local V2 service. ZCode is *not assumed to be installed/operational as an execution agent on Windows*; where it handles transport, preserve the explicit handoff.

**Read-only initial scope:** `server.info`, session listing, session state/readback, event observation, capability inspection. **Write scope requires separate approval:** creating sessions, invoking prompts/tools/shell, service restart, editing outside worktree, GitHub push. In V2 `Service.discover()` is preferable to `Service.ensure()` for pure observation because `ensure()` may start the service. The concrete observer contract, the owner-bound control path and their negative tests are specified in the design section at the end of this file.

```text
AION owner instruction -> GitHub issue/handoff [published]
    -> real executor ACK [observed, independent of publication]
    -> approved adapter creates OpenCode session with worktree scope
    -> per-attempt correlation + streamed state/events [non-durable]
    -> final server readback and real test receipt
    -> independently checked GitHub commit/tests [accepted]
```

## High leverage candidates (ranked)
| Rank | Candidate | Implementation boundary | Evidence to demand |
|---|---|---|---|
| 1 | Session inventory & live activity | Read-only client, `session.list`, state snapshots, reconnect | Actual per-host session IDs & timestamps; no false RUNNING |
| 2 | Role04 WPM adapter | Replace fragile CLI export parsing only after V2 schema inspection; count assistant visible text only | Side-by-side WPM trace and sanitization |
| 3 | Task-to-proof bridge | Scoped OpenCode session + task ID mapping + repo proof | Dispatch/ACK/started/completed/accepted stages distinct |
| 4 | Worktree-per-task | Use explicit location, constrain outside-directory permissions | Cross-worktree denial and no accidental commits |
| 5 | Background worker pool | One limited subagent pilot; explicit kill/restart failure tests | Completes despite UI being closed; verified state after restart |
| 6 | MCP Code Mode | Benchmark one mock tool-chain vs repeated calls | Tool calls, tokens, cost, latency and output quality |
| 7 | Native typed plugin | Stable `Plugin.define` with audit hooks; lifecycle/hot reload | Small fixture test, ownership and revert |
| 8 | Remote client/pairing | Only after network boundary and secret handling review | Authn/authz, no public exposure, pairing revocation |
| 9 | Embed/fork `@opencode/sdk` | Last resort when a required native adapter API is insufficient | Measured need, maintenance cost and regression suite |

## Suggested data contract for telemetry (proposal)
```json
{
  "schema": "aion.opencode.v2.telemetry.v1",
  "host": "OWNER_WINDOWS_MASTER",
  "observed_at_utc": null,
  "runtime_version": null,
  "service_state": "UNKNOWN",
  "session": {
    "id": null,
    "location_directory": null,
    "status": "UNKNOWN",
    "agent": null,
    "model_id": null
  },
  "receipt": {
    "last_event_at_utc": null,
    "reconciled_at_utc": null,
    "event_gap": "UNKNOWN",
    "sanitized": false
  }
}
```
**All values are placeholders**, not live telemetry. Distinguish event stream connected, agent working, user-visible output increasing, test passed and task accepted. Missing data = UNKNOWN, never IDLE/COMPLETE by assumption.

## Security design points specific to V2
- Restore V1-style ask-for-external-directory rule explicitly; V2 default is permissive.
- Pairing and remote host exposure require approval; avoid embedding service tokens in GitHub.
- Protect SQLite database and logs; rely on typed server API rather than writing DB tables directly.
- Client SSE events offer no replay/auto reconnect. Persist durable task metadata separately, resubscribe and reconcile against session state after gaps.
- Budget-aware routing based on verified model/provider availability, not inferred subscription credits.
- Follow host stop orders; background engine capability does not authorize unattended work.
- Respect 1.10 GB historical disk free on Windows: PC HQ must clear host readiness before deployment.

## Success criteria
PILOT_ACCEPTED only when: exact V2 runtime is observed on a named authorized host; baseline V1 workflows still pass; permission and plugin negatives pass; ZCode/ACP/AION protocol boundaries preserved; session telemetry matches server state; restart, loss, timeout and duplication cases have receipts; terminal attribution is **proven on a host**, not inferred from an idle record (§3.1); no secret entered repo; review independently reproduced. Until then: RESEARCH ONLY.

## Bus V2 write scope (PROPOSED, 2026-10-19)
Beyond the read-only scope above, [Bus V2](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) would stage: V2-0 read-only OpenCode session inventory; V2-1 one owner-approved scoped prompt to one ACP session with correlation and receipt; V2-2 executor ids in the command grammar with per-executor scope and worktree limits. Each needs its own owner grant. `opencode acp` (private ACP v1) is the route; `@opencode/client` HTTP is not interchangeable. The offline HTTP adapter described above does **not** satisfy V2-1: the durable pre-admission ordering and terminal-marker correlation it would need are not built. See the design section below for the proposed V2-0 observer and the owner-bound control path.

---

## V2 read-only observer and future owner-bound control (DESIGN PROPOSAL, 2026-10-19)

**Status: proposal only. Not implemented, not authorized, no live-host receipt.** Sources are the canonical Context7 raw pulls in `SOFTWARE_HQ/context7/raw/`: `2026-10-19T15-59-02-{159Z-shq-opencode-v2-prompt-admission,174Z-shq-opencode-v2-service-discover-auth,189Z-shq-opencode-v2-events-subscribe,206Z-shq-opencode-v2-session-interrupt-status,215Z-shq-opencode-v2-permissions-reply,224Z-shq-opencode-v2-server-info-auth}.json`, `2026-10-19T16-01-03-{865Z-shq-opencode-v2-event-subscribe-contract,877Z-shq-opencode-v2-wait-idle-serverinfo}.json` and `2026-10-19T16-03-06-650Z-shq-opencode-v2-idle-inbox-message-projection.json` (mirrored at `https://github.com/owenservera/SOFTWARE_HQ/tree/main/context7/raw`), plus the upstream pages <https://opencode.ai/v2/docs/api>, <https://opencode.ai/v2/docs/build/client>, <https://opencode.ai/v2/docs/build/plugins> and <https://opencode.ai/v2/docs/permissions>. Where the evidence below is missing, it is written as missing — not guessed.

### 1. V2-0 read-only observer — deliberately OUTSIDE the `createBus` delivery adapters
The observer is a plain, bounded module. It is **not** a `createBus` delivery adapter, is **not** registered in the agent registry, and has no `deliver`/`cancel` verb. Reason: a delivery adapter is invoked with intent to send; an observer must be structurally incapable of mutating. No daemon, no plugin/SDK embed, no new registry entry and no state-schema or version migration until an implementation plan proves one is needed.

Allowed reads (allowlist):
- `Service.discover()` — discovery **without starting** the service. `Service.ensure()` is out of scope for the observer because it may start a service.
- `Service.headers(endpoint)` — auth headers, **memory only**: never persisted, never logged, never copied into a grant, a command record or a report.
- `GET /api/info` (`server.info()`) — server identity, connection URLs, paths, readiness.
- `session.list` plus session metadata — **metadata first**: id, location/directory, agent, model, timestamps, status.
- `GET /api/session/{id}/message` — projected messages, cursor paging (`limit`, `order`, `cursor`, `type`). The documented `type` filter enum (`user`, `synthetic`, `system`, `skill`, `shell`, `assistant`, `compaction`, `agent-switched`, `model-switched`, `location-switched`) **omits `idle`** — a terminal/idle record is not reachable through that filter as documented (see §3).
- `GET /api/session/{id}/inbox` — **pending, not-yet-delivered** enqueued work, ordered by enqueue sequence. It is a *pending queue* view: **absence from the inbox is not proof of delivery** and never evidence that an input was executed.
- Permission **read** only: list/get pending permission requests.
- `GET /api/event` — SSE, treated as a latency hint only (see §3).

Forbidden in V2-0, regardless of any grant: `Service.ensure()` / start / stop / restart of the service; `POST /api/session` (create); `POST /api/session/{id}/prompt`; `POST /api/session/{id}/synthetic`; agent or model switching; `POST /api/session/{id}/interrupt`; any permission reply.

Selected-session text only when authorized: the observer returns **metadata** for the whole inventory and **text** only for a session the owner has explicitly selected, and only for allowlisted fields. Bulk text harvest of the inventory is out of scope.

Unknowns are the only legal default:
- Gaps, malformed payloads, absent fields and schema drift yield `UNKNOWN` with the reason recorded. Never `IDLE`, `COMPLETE`, `EMPTY` or `NONE` by assumption.
- A session **absent from the active list is not success** and is not proof of absence: the list is location-scoped, paged and may be incomplete. Absence is reported as `UNKNOWN`.
- Every snapshot carries an explicit `unknowns` list; unknowns are never silently dropped.

Transport rules: base URL must be loopback `http://` (127.0.0.1 / localhost / ::1); remote pairing is a separate owner decision. **Redirects are pinned to the loopback origin** — a redirect to any other origin is rejected (proposal; *not yet implemented*: the current adapter's `fetch` follows redirects by default, so this is a known hardening gap). Every request has a timeout; a timeout is `UNKNOWN`, never a success.

Observer snapshot shape (proposal, read side — never a bus state change):
```json
{
  "schema": "aion.opencode.v2.observation.v1",
  "observed_at_utc": null,
  "service_identity": { "endpoint": null, "runtime_version": null, "ready": "UNKNOWN" },
  "sessions": [
    { "session_ref": null, "cwd": null, "agent": null, "model": null, "status": "UNKNOWN",
      "text_included": false, "text": null, "last_event_at_utc": null, "unknowns": [] }
  ],
  "event_gap": "UNKNOWN",
  "unknowns": []
}
```
`text_included` is `false` unless the session was explicitly selected and authorized; `status` is `UNKNOWN` unless a durable marker says otherwise; `event_gap` records that the SSE stream is a hint and may have missed events.

### 2. Future owner-bound HTTP control (PROPOSED — requires a fresh owner grant; not implemented)
Nothing in this section may run without an explicit owner grant, an explicitly approved model/agent, and a host-verified runtime.

Input identity and durable admission — the order is the contract:
1. **Fresh task session.** One new session per command; `location.directory` = the **grant's `cwd`**. `cwd` is a location, not a sandbox: out-of-tree access is prevented by the permission policy in §4, not by the path.
2. **Stable input identity.** A valid, stable **input ID** plus a **payload hash**, bound to the **service instance** and the **session**. Same ID with a different payload hash is a programming error and is refused.
3. **Persist before POST.** `session_ref` **and** the admission intent are written durably **before** `POST /api/session/{id}/prompt`. The write must be acknowledged by durable storage; if it is not acknowledged, **no POST is issued at all** (fail closed, `NOT_SENT`).
4. **Crash before session binding** → at most an **orphaned empty session** that never received a prompt. Reconciliation must not prompt it, must not reuse it, and must not report it as a result.
5. **Crash around admission** → state `UNKNOWN`. Reconcile by the **exact input ID** against the server — but note that **no readback path is currently evidenced**: the inbox lists only *pending, not-yet-delivered* work (absence is not delivery proof) and the projected `/message` type enum does not expose an `idle` record. The input-ID → terminal correlation is therefore a **blocking conformance question** (§3.1), not a mechanism to rely on today. Until it is answered, a crash around admission stays `UNKNOWN` and is escalated for a human read of the session — never minted fresh, never re-prompted, never blind-resent.
6. **409 Conflict** is a *conflict indication only*: not replay proof, and **not automatically "busy"**. Only a matching persisted admission, or a readback matching the exact input ID and payload hash, resolves it. Otherwise it stays `UNKNOWN` and is escalated, not retried.
7. **Duplicate-ID semantics are not exactly-once.** The published guidance states prompt hooks/admission are *not* an exactly-once side-effect boundary. A duplicate ID can prevent a second *admission*, but tool side effects that already ran are not rolled back or deduplicated by the service. AION therefore treats a duplicate as *unresolvable without readback* — never as "safe to retry".

Known current gap: the offline adapter persists `session_ref` **only after `deliver` returns**, so the crash window between session creation and the durable record is still open. The pre-persist ordering in (3) is the fix and is **not implemented**.

Model and agent selection: explicit, owner-approved and host-verified before use; the chosen provider/model/agent id and the runtime version are recorded with the command. **No fallback, no global switch, no silent default** — if the approved model/agent is unavailable the command fails closed and is reported; it does not drift to another model, another agent, or a global default. No agent/model switch on an existing session: that changes the approved scope, so it is refused.

### 3. Completion evidence — a durable terminal marker (PROPOSED)
- Completion is a **durable terminal marker**, correlated to the **admitted input ID** and to the **execution boundary** (that input's execution, not "the session went quiet"). The *goal* is stated here; the **correlation mechanism is not yet evidenced** — see §3.1, which is blocking. An idle record must not be treated as sufficient attribution.
- The idle record's schema is known **only** from an official-page capture (`tool_154dfda73001ax44TbGWt5RdbM`, lines 15283–15313), and it carries a **published idle union/filter discrepancy**: the idle union and the message `type` filter do not agree, and the documented `/message` `type` enum omits `idle`. The shape therefore stays **UNVERIFIED / DISPUTED** — do not encode it as fact in code or contracts yet.
- **Never** infer completion from an assistant `finish` flag, a timestamp, the assistant's text, the `session.idle` event, or a `204` from `POST /api/experimental/session/{id}/wait`.
- `succeeded`, `failed` and `interrupted` stay **distinct**; they are never collapsed into "done".
- A result **reported** by the executor is not task proof and not acceptance; acceptance stays a separate, independently checked step.
- **No turn attribution** when a session holds more than one admitted input or the queue is ambiguous: report "session terminal, input attribution UNKNOWN" rather than guessing which input produced which message. The canonical inbox/message pull explicitly does **not** specify one-idle-to-many-inputs correlation, so the ambiguity is a documentation limit, not a detail to infer.
- SSE is a **latency hint only**. On any disconnect: resubscribe with bounded backoff, then reconcile the **full cursor pages** of the projected message timeline. A missed event costs latency, never correctness.
- `POST /api/experimental/session/{id}/wait` is **experimental and optional**, never the sole evidence. `503` means the service was unavailable — it is **not** proof that the feature is unsupported.
- Interrupt: the official docs conflict (one variant documents `204 No Content`, another `200 SessionInterruptResponse`). AION therefore treats an interrupt as a **request for acknowledgement, not a cancellation**: the ACK is recorded and the terminal outcome is settled later from the durable reconciled marker. `interrupted` is **not** guaranteed if a completion raced the interrupt.

### 3.1 Reliable terminal attribution — a BLOCKING conformance question
- **No documented correlation.** The V2 documentation exposes **no field, no cardinality and no ordering** that ties an admitted **input ID** to an **idle/terminal record**. There is no documented "one idle ↔ one input" mapping, no documented input-id field on the projected message, and no documented ordering from which attribution could be derived. Any design that assumes the idle record identifies *which* input finished is **assuming a protocol guarantee that the evidence does not contain**.
- **What the evidence does say:** `GET /api/session/{id}/inbox` returns only *pending, not-yet-delivered* enqueued work in enqueue sequence (so **absence is not delivery proof**); `GET /api/session/{id}/message` paginates projected messages with a `type` enum that **omits `idle`**; the idle schema exists only in the official-page capture named above, with its **union/filter discrepancy**; and the inbox/message pull explicitly does not specify one-idle-to-many-inputs correlation.
- **Consequence for AION:** reliable terminal attribution is **BLOCKING**. Until a host conformance run answers it, `execution_outcome` stays `UNKNOWN` with an explicit `unknowns` entry, and **no report may claim that a specific input completed, failed or was interrupted**. A terminal *session* state without a *per-input* attribution is the most AION may assert.
- **A fresh, isolated, one-input session with no other submitters is an observation aid, not a guarantee.** It removes competing inputs in that run, so a single terminal transition is *consistent* with that input having completed — but it is an experimental setup, not a protocol guarantee, and it cannot be generalised to a session that later receives other inputs, other submitters or queued work. A clean single-input run must not be allowed to upgrade the assumption to "solved".
- **Questions the host conformance must answer before S3 can start** (any "no" or unanswered item leaves §3.1 blocking and the control path at `UNKNOWN`):
  1. Does any projected record carry the admitted **input ID** or an equivalent correlation key?
  2. What is the **cardinality** between admitted inputs and terminal/idle records — one-to-one, one-to-many, or unstated?
  3. Is there a **documented ordering** that makes attribution derivable (e.g. enqueue sequence ↔ terminal sequence)?
  4. How does an idle record appear in the projected `/message` timeline, given the `type` enum omits `idle` — as an untyped row, a separate field, or not at all?
  5. Is the published **idle union/filter discrepancy** a documentation defect or a real behavioural difference?

### 4. Permissions (V2 ordered array, last match wins)
- V2 replaces V1's per-tool permission map with **one ordered `permissions` array**; the adopted rule is **last match wins** (owner decision, 2026-10-19). The canonical pull evidences the ordered array and that **`external_directory` is allowed by default** in V2 ("add an explicit ask rule to keep V1 behavior"); the match-order semantics and the `ask` default for other actions are **not yet evidenced in the canonical pulls** and must be confirmed on the upstream permissions page before implementation — treat them as stated-but-unverified, not as fact.
- For a controlled executor: **deny `external_directory`** (and any write/shell action outside the granted task) through an **approved, project/agent-scoped config only**. Do **not** edit the owner's current global OpenCode config from AION code, and do not change it in this lane.
- **Never auto-answer `always`** (it persists the tool's proposed patterns for the project) and **never auto-answer `reject`** (reject applies to the request *and every other pending permission request in that session* — a session-wide effect). The only automatic answer AION may consider is `once`, and only under an explicit grant naming the request.
- The browser stop order remains active and is unaffected by any of this.

### 5. Proposed DTO (NOT an existing schema, NOT implemented)
```json
{
  "schema": "aion.opencode.v2.command.v1",
  "command_id": null,
  "correlation_id": null,
  "transport": "opencode-v2-http",
  "service_identity": { "endpoint": null, "instance_id": null, "runtime_version": null },
  "session_ref": null,
  "input_ref": null,
  "payload_hash": null,
  "grant_ref": null,
  "cwd": null,
  "model": null,
  "agent": null,
  "admission_state": "UNKNOWN",
  "execution_outcome": "UNKNOWN",
  "evidence": [],
  "timestamps": { "observed_at_utc": null, "admitted_at_utc": null, "terminal_at_utc": null },
  "unknowns": []
}
```
- `input_ref` = the stable input ID admitted to the service; `payload_hash` = hash of the exact admitted text; `admission_state` = `PREPARED | ADMITTED | CONFLICT | UNKNOWN`; `execution_outcome` = `PENDING | SUCCEEDED | FAILED | INTERRUPTED | UNKNOWN`; `evidence` = bounded references/timestamps (never payloads, never credentials); `unknowns` = the explicit list of what could not be determined.
- **Attribution caveat:** `input_ref` and `terminal_at_utc` are AION-side proposals. The protocol currently documents **no** field that carries an admitted input ID on a projected/terminal record (§3.1), so `execution_outcome` may only be set to `SUCCEEDED`/`FAILED`/`INTERRUPTED` once a correlation field is **observed on a real host**. Until then it stays `UNKNOWN` and the `unknowns` array names the missing correlation.
- This is a **proposal**, not an implemented schema and not a bus state change. It maps onto the **current bus envelope** — `command_id`, `correlation_id`, `grant_id`, `executor_ref` (→ `session_ref`), command `state`/`reason`/`detail`, `evidence` — and the bus state schema stays `aion.bus/1`. **No new bus state schema** is introduced until an implementation plan determines the minimal set of changes.

### 6. Staged implementation plan
- **S0 — contract freeze (this document).** Design only, no code.
- **S1 — read-only observer module (pure, offline).** Bounded module, read allowlist, `Service.discover()` no-start, memory-only auth headers, metadata-first inventory, selected-session text, `UNKNOWN` defaults, loopback-pinned redirects. Fake-service tests only.
- **S2 — durable pre-admission ordering.** Persist `session_ref` + admission intent before the prompt POST; stable input ID + payload hash; a storage-acknowledged write as a precondition. Still fake-service. This stage deliberately stops **before** any terminal attribution: it proves the *admission* side only.
- **S3 — durable terminal-marker correlation — GATED on §3.1.** Cannot start until the host conformance has answered the five questions in §3.1 and a correlation field has been **observed** on a real host. Marker correlated to the admitted input and the execution boundary; succeeded/failed/interrupted kept distinct; no inference from `finish`/timestamps/text/`session.idle`/wait-204. An unanswered or negative conformance result leaves this stage **not started**, and the control path stays `UNKNOWN`.
- **S4 — owner-granted host conformance, two separate steps.** (4a) **read-only, no-start** conformance against a real host — this is where §3.1 is answered; (4b) a **separately granted, fresh, isolated fixture session** with a single input and no other submitters, for one control command. Step 4b is an **observation aid, not a protocol guarantee**: it may show that one input produces one terminal transition in a clean session, and it must not be generalised into a correlation rule. Never a signed-in ChatGPT session, never an active or shared session, and no unattended background work.

### 7. Negative tests (each one is a test; none touches a live session)
1. **Observer is inert:** across a full observer run, zero mutating HTTP calls (no `POST`/`PUT`/`DELETE` on any session or service path).
2. **No start:** the discovery/auth path never starts a service (no `ensure`, no new process, no port opened).
3. **Pagination and schema drift:** a truncated or out-of-order cursor page, or a changed field shape, yields `UNKNOWN` — no crash, no default value, no fabricated terminal state.
4. **Redirect:** a redirect to a non-loopback origin is rejected and not followed.
5. **Storage failure:** if the durable write before the POST does not acknowledge, **no POST** is issued (fail closed).
6. **Kill points:** kill at create / bind / admit / post → respectively: empty session orphaned and never prompted; no session binding; `UNKNOWN` and reconcile by the exact input ID; `UNKNOWN` and reconcile by the exact input ID. In no case is a fresh ID minted or a blind resend issued.
7. **Duplicate and conflict:** the same input ID with a different payload hash is refused; a `409` stays `UNKNOWN` until a matching persisted admission or readback resolves it.
8. **SSE disconnect:** a mid-stream disconnect is recorded as a gap and the state is reconciled from the full cursor pages, not from the event hints.
9. **Intermediate cycle:** an assistant turn with a tool cycle and no terminal marker is **not** reported as complete.
10. **Failed / interrupted:** `failed` and `interrupted` are never reported as `succeeded` or as "done".
11. **Cancel race:** an interrupt racing a completion yields a recorded ACK plus a later durable terminal outcome; the outcome is settled by the marker, not by the request.
12. **Wrong target:** a command aimed at a different service instance, a different session, or a different adapter is refused (no cross-talk).
13. **Permission scope:** `external_directory` is denied by the approved config; no `always` is ever sent; no session-wide `reject` is ever sent.
14. **Failover forbidden:** an unavailable approved model/agent fails closed — no fallback model, no fallback agent, no global switch.
15. **Inbox absence is not delivery:** an admitted input that is **absent from the pending inbox** is never reported as delivered, executed or complete; the inbox is a pending-queue view only.
16. **No correlation, no attribution:** when the projected timeline carries no input-id/correlation key, `execution_outcome` stays `UNKNOWN` with an explicit `unknowns` entry, and no report attributes a terminal state (succeeded/failed/interrupted) to a specific input. A `type` enum without `idle` must not be read as "no terminal state exists", and a missing `idle` row must not be read as "not delivered".
17. **Single-input run does not generalise:** a clean one-input isolated session is recorded as an *observation* (`attribution_basis: isolated_single_input`), never as a proven correlation rule.

### 8. What this document does not authorize
No live host command, no global OpenCode config change, no new grant, no registry or bus-schema change, no `STATE.json` edit, and no permission to touch an active or signed-in session. S1–S3 are offline/fake-service work; S4 needs its own owner grant. While §3.1 is **blocking**, no control path may report a per-input terminal outcome: `execution_outcome` stays `UNKNOWN` and the missing correlation is named in `unknowns` — an isolated single-input run does not unlock it.

### 9. Evidence map (claim → canonical source)
| Claim used above | Source |
|---|---|
| `Service.discover()` no-start vs `Service.ensure()` may start; `Service.headers()`; registration file `~/.local/state/opencode/service.json` | `2026-10-19T15-59-02-174Z-shq-opencode-v2-service-discover-auth.json` |
| `server.info()` / `GET /api/info` identity, URLs, paths, readiness | `2026-10-19T15-59-02-224Z-shq-opencode-v2-server-info-auth.json` |
| Prompt admission: `POST /api/session/{id}/prompt` durably admits one input; optional `id`, `metadata`, `delivery`; `400/401/404/409`; hooks are not an exactly-once boundary | `2026-10-19T15-59-02-159Z-shq-opencode-v2-prompt-admission.json` |
| Interrupt `204` vs `200` doc conflict; `resume` parameter; ACP `session/cancel` semantics | `2026-10-19T15-59-02-206Z-shq-opencode-v2-session-interrupt-status.json` |
| `GET /api/event` is volatile: slow consumer overflows, disconnection loses events, no replay/auto-reconnect; late subscriber gets only `server.connected` | `2026-10-19T15-59-02-189Z-shq-opencode-v2-events-subscribe.json`, `2026-10-19T16-01-03-865Z-shq-opencode-v2-event-subscribe-contract.json` |
| `POST /api/experimental/session/{id}/wait` → `204` / `503` (unavailable, not unsupported) | `2026-10-19T16-01-03-877Z-shq-opencode-v2-wait-idle-serverinfo.json` |
| `GET /api/session/{id}/inbox` = **pending, not-yet-delivered** work in enqueue sequence; `GET /api/session/{id}/message` paging (`limit`/`order`/`cursor`/`type`) with a `type` enum that **omits `idle`**; `POST /api/session/{id}/synthetic` | `2026-10-19T16-03-06-650Z-shq-opencode-v2-idle-inbox-message-projection.json` |
| The inbox/message pull **does not** specify one-idle-to-many-inputs correlation — supports the "no turn attribution" rule in §3 and the blocking question in §3.1 | same pull (bounded-closure note) |
| Idle record schema — official-page capture only, with a **published idle union/filter discrepancy** | official page capture `tool_154dfda73001ax44TbGWt5RdbM`, lines 15283–15313 (librarian evidence, not re-verified here) |
| **Not documented anywhere in the evidence:** an input-ID → idle/terminal correlation field, its cardinality, or an ordering that makes attribution derivable | — hence §3.1 is a **blocking conformance question** |
| Ordered `permissions` array; `external_directory` allowed by default in V2 (explicit `ask` rule needed to keep V1 behaviour) | `2026-10-19T11-52-11-636Z-opencode2-config-key-migration.json` (upstream V1→V2 migration doc) |
| `once` / `always` / `reject` reply semantics; `reject` is session-wide | `2026-10-19T15-59-02-215Z-shq-opencode-v2-permissions-reply.json` (upstream /v2/docs/permissions) |
