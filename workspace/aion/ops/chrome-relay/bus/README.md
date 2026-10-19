# AION Bus V1/V2 — developer and operator reference

Status (2026-10-19): **V1 CODE-COMPLETE, V2 CODE-COMPLETE — OFFLINE_PASS only.** `WINDOWS_PENDING`, `CHATGPT_LIVE_PENDING`, `PLUGIN_ENTITLEMENT_UNKNOWN`, `ACCEPTANCE_PENDING`. Nothing here was run on Windows, in real Chrome, against ChatGPT or against real OpenCode. M1 is not affected. Design: [BUS-V1-V2-DESIGN](../BUS-V1-V2-DESIGN.md); authority: [DECISION-2026-10-19](../../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md).

## 1. Layout
| Path | Role |
|---|---|
| `extension/src/bus/` | **Provider-neutral core** (pure ESM; imported by the worker, bridge, runner, MCP): `contracts` (schemas, states, reasons, manifests), `grammar` (C1/C2), `registry` (agents, genealogy), `ledger` (durable state, migrations), `grants` (C5), `validate` (C3–C8), `bus` (router, report-back), `sync0` |
| `extension/src/bus/adapters/chatgpt.js` | ChatGPT.com pilot adapter — the **only** file that knows chatgpt.com |
| `extension/src/bus/adapters/acp-executor.js` | V2 executor over the native relay (`task.approved` → `session/prompt`) |
| `extension/src/bus/adapters/opencode-v2.js` | Optional OpenCode 2.0 shared-service adapter (loopback HTTP) |
| `extension/src/chatgpt/commander.js` + `commander-scan` port action | Read-only watcher, page side |
| `extension/src/background/bus.js` | Worker endpoints `aion/bus-*`, watcher pull, SYNC-0 |
| `extension/src/panel/bus.html` | Owner panel ("Bus" view) |
| `bridge/src/bus-relay.js` | Real native host in-process, for Node-side executors |
| `bus/bin/aion-bus.mjs`, `bus/node-storage.js` | Node runner/CLI, file ledger with cross-process lock |
| `aion-mcp/src/bus-tools.mjs` | Conditional MCP ingress (status; reservation-only write) |
| `bus/windows/Install-AionBus.ps1` | Single Windows verify/install/rollback path |

## 2. Command grammar (`AION_CMD_V1`)
The owner arms a turn with first line `AION>` (config `arm_token`). The commander's reply must contain **exactly one** block:
````
```AION_CMD_V1
op: send            # send | status | cancel (enabled: config ops_enabled; default send,status)
to: role-06         # registered, bound agent (not needed for status)
text: <<
multi-line text, max 2000 chars
>>
nonce: phone-0001   # single-use, 6–64 [A-Za-z0-9_-]
```
````
Unknown/duplicate keys, two blocks, control/bidi characters, oversize, unterminated text → refused with a reason from `REASON` (closed set). Reports into the commander start with `AION_REPORT_V1`, never the arm token, so a reply to a report is unarmed by construction; `max_hops` (default 3) is defence in depth.

## 3. States
Command (ENVELOPE-CONTRACT v0.2): `OBSERVED → VALIDATED → RESERVED → DISPATCHED → SUBMISSION_OBSERVED → REPLY_CHECKED → REPORTED`, terminals `REJECTED`, `HALTED`, plus `UNRESOLVED`. Delivery (derived): `PREPARED`, `SENT_OBSERVED`, `REPLY_OBSERVED`, `CONSUMED`, `OUTCOME_UNKNOWN`, `NOT_SENT`.
**No-resend invariant:** text exists only while `RESERVED`; the write that marks `DISPATCHED` deletes it and lands before the adapter is called. Restart halts never-attempted reservations (`stale_reservation_not_dispatched`) and only *observes* attempted ones.

## 4. Developer API (core)
```js
import { createBus } from '../extension/src/bus/bus.js';
const bus = createBus({ storage /* chrome.storage.local shape */, adapters: [/* adapter objects */] });
await bus.bind('role-06', { adapter: 'chatgpt.com', ref: 'https://chatgpt.com/c/<id>', confirmed_by: '<owner ref>' });
await bus.designateCommander('aion');
await bus.grant({ grant_id, ref, agents, ops, max_count, rate_per_hour, expires_utc, cwd });
await bus.process({ source: { adapter, ref }, turn_sig, user_head, assistant_text }); // chat path
await bus.ingestStructured({ op, to, text, nonce });                                 // CLI/MCP path
await bus.dispatch(id); await bus.observe(id); await bus.reconcile(); await bus.kill(reason); await bus.status();
```

## 5. Adapter SDK
An adapter is `{ manifest, canonicalRef(ref), deliver(req), observe(req), cancel?(req) }`. `manifest` must pass `validateManifest` (`schema: aion.bus.adapter/1`, `kind: conversation|executor`, capabilities `deliver, observe, cancel, report_target, max_text_chars, concurrency, durable_readback, live_verified`). The router reads capabilities, never names.
Return one outcome: `reply` (correlated reply checked; `reply` text) · `sent` (target confirmed receipt) · `not_sent` (**positive** evidence nothing was submitted) · `unknown` (attempted, outcome unknown) · `pending` (observe only). Optional `session_ref` is persisted as `executor_ref` for reconciliation. Anything else is coerced to `unknown`. Throwing after the call began is `unknown`, never `not_sent`. Reference implementation for a new browser provider: `extension/tests/fixtures/bus-example-chat.js`.

## 6. Protocol mapping
| Bus | ChatGPT.com adapter | ACP executor | OpenCode V2 adapter |
|---|---|---|---|
| deliver | `aion/chatgpt-tabs` (exactly one tab on the bound `/c/<id>`) → `aion/chatgpt-submit` (task store reserve, arm, activate once) | `relay.send` `task.approved` (payload `text`, grant `cwd`) → host → `session/prompt` | `POST /api/session` {location.directory = grant cwd} → `POST /api/session/{id}/prompt` {text} |
| reply | accepted capture `envelope.payload.reply_text` | `agent_message_chunk` text + terminal `prompt.finished`/`task.cancelled`/`task.blocked` | `GET /api/session/{id}/message` + completion marker or `session.idle` hint |
| observe | `aion/chatgpt-observe` (read-only, durable identity) | in-memory buffer (lost on restart → stays unknown) | server readback by persisted session id |
| cancel | — | `relay.cancel` (request ≠ cancellation) | `POST /api/session/{id}/interrupt?resume=false` |
| positive no-send | page `no_send`, tab missing/ambiguous, conversation locked | host `cwd_not_allowed`/`invalid_envelope`, host unreachable before posting | session create failed, 4xx/409 on prompt |
| authority | `approved_scope_ref = bus:<grant_id>` | `approved_scope_ref = bus:<grant_id>`; idempotency `bus:<command_id>` | grant cwd; loopback only |

## 7. CLI (Node runner)
`node bus/bin/aion-bus.mjs status|tree|bind|grant|revoke|send|dispatch-pending|observe|reconcile|kill|resume|demo` (`--state`, `--live`, `--opencode-url`, `--host-config-dir`, `--json`). Anything that reaches an executor requires `--live` or `--opencode-url`. `demo` runs D1 (ChatGPT.com pilot shape through the real watcher/driver/task store over scripted pages), D2 (ACP via the real host + fake agent), D3 (fake non-ChatGPT provider).

## 8. MCP ingress (conditional, Option B)
`AION_BUS_STATE=<runner ledger>` lists `aion_bus_status` (read-only). Adding `AION_MCP_BUS_WRITE=1` lists `aion_bus_command`, which only **reserves**; the runner's `dispatch-pending --live` attempts fresh reservations once and halts stale ones. Use only after ChatGPT custom-MCP write entitlement is confirmed on the account.

## 9. Install / verify / rollback (Windows)
```powershell
pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1                 # Verify (read-only)
pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1 -Mode Install   # registers host if missing
pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1 -Mode LiveChecklist
pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1 -Mode Rollback
```
Then reload the extension (chrome://extensions) and open side panel → **Bus**. The extension id stays `kgjfielmhcdlggjppmliabpiljnonhki` (manifest `key` unchanged; checked by the script and a test).

## 10. SYNC-0
Bus view → SYNC-0 → Start; send one message to the commander **from the phone**; touch nothing on the PC; Sample; Finish. `PHONE_TURN_VISIBLE_WITHOUT_RELOAD` ⇒ Option A viable. Otherwise reload the tab by hand, press "I reloaded", Finish. A running probe suspends command processing and never sends.

## 11. Troubleshooting
| Symptom | Meaning / action |
|---|---|
| `binding_target_missing` | bound conversation not open in this browser — open it (one tab) |
| `binding_ambiguous` | two tabs show one conversation — close one |
| `target_busy` / `executor_busy` | an earlier command to that agent is unresolved; check it; nothing is queued |
| `OUTCOME_UNKNOWN` | something was attempted; **never resent**; read the target conversation yourself |
| `commander.gap` event | baseline no longer visible; turns in the gap were not executed — re-send from the phone |
| `not_owner_armed` | first line of the user turn did not start with `AION>` |
| `grant_exhausted` | each send and each report spends one unit; create a new grant |

## 12. V1 → V2 migration
Same ledger, grammar and grants: bind `opencode` to `acp` (or `opencode-v2`), grant it with a `cwd` the bridge allowlists, and address it with `to: opencode`. State schema `aion.bus/1`; future versions add a `MIGRATIONS[n]` step (the v0→v1 path is tested and re-engages the kill switch).
