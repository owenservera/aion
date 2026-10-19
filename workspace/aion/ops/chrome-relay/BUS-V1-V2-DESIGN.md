# Bus V1 / Bus V2 — design from the current baseline

Date: 2026-10-19 · Status: **PROPOSED DESIGN, not approved, not built.** Authority and open owner decisions: [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). Architecture rules this builds on: [ARCHITECTURE.md](./ARCHITECTURE.md) §§2–7, §11. Nothing here authorizes a live send, install or agent start; `live_execution_authorized` and `m1_verified` stay `false`.

## 0. Design principle: build and prove everything offline first

The owner may be on a phone with no local OpenCode. So the design splits into **offline-provable** work (runs in any Node environment, including Linux CI, against fakes that already exist) and **live-gated** work (needs the Windows PC, signed-in Chrome and explicit owner grants). Every slice below is labeled. Offline slices never touch ChatGPT or OpenCode.

Existing reusable pieces (verified in the tree on 2026-10-19):

| Piece | Where | Reuse |
|---|---|---|
| Durable no-resend store, operation/conversation locks | `extension/src/lib/chatgpt-tasks.js` (`TASKS_KEY`, `DISPATCH_KEY`, `prepareTask`, `canonicalConversation`) | Every bus command is one guarded operation |
| Submit/observe engine, deadlines | `extension/src/chatgpt/content.js` (`createTurnEngine`), `lib/command-deadlines.js`, worker `aion/chatgpt-submit` / `-observe` / `-read` | Delivery into agent conversations and report capture |
| Worker serialization gate and sender checks | `extension/src/background/service-worker.js` | New message types register here |
| Native host + ACP v1 client with cwd allowlist | `bridge/src/{host,acp-client,config}.js` | Bus V2 leg |
| Envelope→ACP map (`task.approved`→`session/prompt`, `task.cancelled`→`session/cancel`) | `bridge/src/envelope-map.js` | Bus V2 dispatch, unchanged |
| Fake ACP agent | `bridge/tests/fixtures/fake-acp-agent.mjs` | Test V2 with no OpenCode |

## 1. Bus V1 — commander loop

### 1.1 Data flow
```
Phone ChatGPT app ──(owner typed, armed turn)──▶ Commander conversation (chatgpt.com)
        PC Chrome: commander tab ─ watcher (read-only) ─▶ parse AION_CMD_V1 ─▶ validate (C1–C8)
        ─▶ worker gate: reserve op ─▶ submit/observe engine ─▶ Agent conversation (bound tab)
        agent reply ─▶ reply check (existing) ─▶ report text ─▶ [guarded send] ─▶ Commander conversation
```
Report-back is itself a guarded send into the commander and consumes grant count. It re-enters at `hop+1`.

### 1.2 New modules (all under `extension/src/`, DOM-free `lib/` where possible)
| Module | Responsibility | Offline-testable |
|---|---|---|
| `lib/agent-registry.js` | Agent records, genealogy validation (single root, no cycles, parent exists), binding refs; persisted under a **new** key `aion.relay.agents.v1` (schema `aion.agents/1`), same fail-closed storage rules as the task store | Yes |
| `lib/bus-grammar.js` | Strict parser for the `AION_CMD_V1` block and the owner arm prefix; fixed key set, size caps, no coercion | Yes |
| `lib/bus-validate.js` | C1–C6 checks given registry, grant, hop and rate state; returns a machine-readable accept/reject reason | Yes |
| `lib/bus-grants.js` | Grant records (agents, count, rate, expiry); count decrement is persisted **before** dispatch | Yes |
| `lib/bus-router.js` | Turns an accepted command into a `prepareTask` call + engine submit; maps outcomes to command states | Yes (fake engine) |
| `chatgpt/commander.js` | Read-only content-script watcher on the commander conversation: baseline, new assistant turns only, extracts fenced blocks | Fixture DOM; live behavior unproven |
| `background/bus.js` | Worker handlers: `aion/bus-status`, `aion/bus-arm`, `aion/bus-kill`, `aion/bus-registry-*`; all behind the existing serialization gate and sender checks | Yes (chrome stub) |
| `panel/` additions | Registry/genealogy view, grant view, kill switch, command log | Static checks |

Storage keys are separate from the task store so the no-resend ledger is never rewritten by bus code.

### 1.3 Agent record
```
agent_id, parent_agent_id|null, name, kind: "chatgpt_conversation"|"local_executor",
role_id|null, binding_ref (conversation_key | executor_ref), status: unbound|bound|retired,
scope_ref (grant id), created_utc, bound_utc
```
Initial agents = the eight roles in `ROLES.json`, **unbound** until the owner confirms a conversation. Genealogy comes from the owner-unconfirmed tree in the decision record §6. Retiring never deletes (history stays).

### 1.4 Command grammar (fixed; to be pinned at P2)
Owner arm, first line of the user turn: `AION>` (placeholder token; final token is an owner choice, must be something the model does not produce by itself).
Assistant reply contains exactly one fenced block:
````
```AION_CMD_V1
op: send            # send | status   (V1 allowlist)
to: agent_id        # registered, bound
text: <<bounded text, default max 2000 chars>>
hop: 0              # integer, extension recomputes and ignores a mismatch
nonce: <opaque>     # single-use, persisted
```
````
Rules: unknown keys, duplicate keys, more than one block, oversize, non-ASCII control characters, a block in a user turn, or a block outside the commander conversation → reject with reason, no send. `text` is wrapped by the extension in the existing protocol wrapper and counted against the 8,000-char worker bound. The model's `hop` is advisory; the extension's chain counter is authoritative.

### 1.5 Command state machine
OBSERVED → VALIDATED → RESERVED (grant count + operation persisted) → DISPATCHED → SUBMISSION_OBSERVED → REPLY_CHECKED → REPORTED. Terminal alternatives: REJECTED (with reason), HALTED (loop guard / kill switch), UNRESOLVED (anything ambiguous; keeps lock, never resends). Matches [ENVELOPE-CONTRACT v0.2](./ENVELOPE-CONTRACT.md).

### 1.6 Guards (C1–C8 mapped to code)
| Guard | Enforced in |
|---|---|
| C1 owner-armed | `bus-grammar` (arm prefix on the immediately preceding user turn) + `commander.js` pairing |
| C2 bounded parse | `commander.js` reads only new assistant turns after baseline; never stores transcript |
| C3 allowlisted target | `bus-validate` against registry binding |
| C4 scoped action | `bus-validate` action allowlist |
| C5 scoped grant | `bus-grants` persisted decrement before dispatch |
| C6 loop guard + rate | chain counter in router; `loop.halted` |
| C7 no-resend | task store + engine (unchanged) |
| C8 kill switch | single flag read at the head of the worker gate for every bus message |

### 1.7 Failure behavior
PC asleep / Chrome closed / commander tab not open: nothing executes; on return the watcher baselines to *now* and reports skipped period as "undelivered", never replaying commands from the gap. Tab discarded: watcher re-baselines, nonce store prevents repeats. Engine ambiguity: UNRESOLVED, lock held, panel shows "outcome uncertain — no resend".

### 1.8 Channel decision (open)
Option A (watcher, above) is the design target. Its unknown is SYNC-0 (does a phone-sent message appear in the PC tab). Option B replaces only `commander.js`'s input with a bridge call from the `aion-mcp` connector; steps after VALIDATED are identical. So the design is channel-agnostic past C2: build the registry, grammar, validator, grants and router first.

## 2. Bus V2 — local executors (OpenCode first)

### 2.1 Data flow
Same commander and validator. For an agent with `kind: local_executor`, the router does not use the engine; it emits `task.approved` through the worker's native port to `com.aion.relay`, whose existing envelope map sends `session/prompt` to `opencode acp`. The reply comes back as ACP `session/update`/result mapped by the bridge, and is reported to the commander exactly like a chat agent's reply.

### 2.2 What is new vs. existing
| Need | Status |
|---|---|
| Executor kind in registry, `executor_ref` binding | New (registry) |
| `to:` accepts an executor id; per-executor action allowlist (`send` only at first) | New (validator) |
| Router branch: executor dispatch via native port | New (router) — uses existing `task.approved` mapping |
| ACP session lifecycle, cwd allowlist, timeouts | Existing (`bridge/src/config.js`, `acp-client.js`) |
| Executor result → envelope → report | Existing mapping; report formatting new |
| Worktree/cwd scope per executor | Reuse `assertCwdAllowed`; scope_ref names the cwd |

### 2.3 Safety rules specific to V2 (stricter than V1)
1. An executor command never carries a shell string or file path from model text. Only bounded prompt text; the working directory comes from the grant, not the command.
2. Prompt-only V2-1: OpenCode's own permission prompts remain; the bus never auto-approves tool permissions.
3. One in-flight prompt per executor session; second command → rejected `executor_busy`.
4. `opencode acp` (private ACP v1) only. `@opencode/client` HTTP is not used.
5. Model/provider failover (supervisor) stays separate and inactive; V2 does not enable it.

### 2.4 Phases
| Phase | Deliverable | Needs |
|---|---|---|
| V2-0 | Read-only session inventory via the host | PC + OpenCode (live) |
| V2-1 | One owner-approved prompt to one ACP session, receipt | PC + grant (live) |
| V2-2 | Executor ids in grammar, cwd-scoped grants | offline then live |
| V2-3 | Executor report-back to commander | offline then live |

All V2 router/validator logic is proven offline against `fake-acp-agent.mjs` first.

## 3. Build order and what can be proven without the PC

| Slice | Content | Environment | Exit evidence |
|---|---|---|---|
| S0 | Reconcile endpoint; task-store pruning/archival plan (prerequisites) | offline | tests + design note |
| S1 | `agent-registry` + genealogy validation + panel view | offline | unit tests, cycle/orphan cases |
| S2 | `bus-grammar` + `bus-validate` + `bus-grants` | offline | table-driven accept/reject suite incl. injection, oversize, replayed nonce |
| S3 | `bus-router` with fake engine and fake ACP agent; loop/hop/kill tests | offline | simulated chains halt at `max_hops`; kill refuses all |
| S4 | `commander.js` on fixture DOM; worker handlers | offline | fixture suite; **no live claim** |
| S5 | SYNC-0 no-send observation | **live, owner-scoped** | recorded result |
| S6 | Live bring-up, one chat agent, fresh grant | **live** | receipts; still not M1 |
| S7 | V2-0 → V2-3 live | **live** | per-phase receipts |

S0–S4 need only Node and are runnable on the existing test runner (`npm test` in `extension`, bridge tests in `bridge`).

## 4. Test plan highlights (offline)
Injection: hostile text in an agent report, in a page, in a user turn, or in a second fenced block never dispatches. Replay: duplicate nonce, tab-discard re-baseline, worker restart mid-chain. Loop: A→commander→A cycle halts at `max_hops`. Grants: crash between decrement and dispatch cannot replenish authority. Registry: cycle, two roots, unbound target, retired target. V2: executor busy, cwd outside allowlist, ACP version mismatch, timeout → UNRESOLVED, never resend.

## 5. Open owner decisions that change this design
1. Arm token and where it must appear (Section 1.4).
2. Hop maximum, per-agent rate, grant expiry defaults.
3. First commandable agents (suggest: one chat agent, then OpenCode).
4. Option A vs B (only changes S4/S5).
5. Whether report-back text goes to the commander verbatim (bounded) or as a hash plus summary.

## 6. Not claimed
No Bus V1/V2 code, watcher behavior, mobile sync, executor leg or grant exists. Offline tests would prove logic against fakes, not real Chrome, ChatGPT or OpenCode behavior.
