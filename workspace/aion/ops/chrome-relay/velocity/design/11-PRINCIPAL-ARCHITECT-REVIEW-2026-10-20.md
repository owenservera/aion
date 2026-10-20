# AION Platform — independent Principal Architect review (interactive CLI, receive plane, semantics)

**Date:** 2026-10-20 · **Reviewer:** Claude (Opus 5.5), independent architecture review requested by the owner · **Status:** REVIEW / RECOMMENDATIONS — not an implementation, not an accepted decision, no runtime code changed.

**Pinned source:** branch `track-b/platform-local-candidate-20261020` at **`4647bd4452f787d08c38cb9a1679098922c9732b`** (PR #46 head, includes the issue-48 crosswalk commit `bb92de2`). PR #47 at `69a967b9ece61e3f039ed98983eb4837b414ffef`. PR #41 at `ae3fe8881bea77604cf8cc7dae3bd3a67168e1bc`. Live evidence: `workspace/aion/agents/windows-master/LIVE-INTEGRATION-2026-10-19.md`.

**Path shorthand:** `R/` = `workspace/aion/ops/chrome-relay/`. Line numbers refer to the pinned SHA.

**What I actually did (receipts).** Read docs 00–10 in `R/velocity/design/`, the seed JSON, the issue-48 crosswalk, PR #41/#46/#47 metadata and PR #47's CSV and integration notes; traced the real code paths for `aion send` / `aion observe` / `aion connect` from `R/velocity/bin/aion-local.mjs` through `R/velocity/src/broker/core.mjs`, the Bus core `R/extension/src/bus/bus.js`, the ChatGPT adapter, the remote-call/host/IPC transport, the Track B dev extension link, the worker driver and the content script. Ran every offline suite on Linux, Node v22.22.0, at the pinned SHA:

| Suite | Result |
|---|---|
| `R/velocity` `node --test` | 239 tests: 237 pass, **1 fail**, 1 skip — the failure is non-hermetic: `R/velocity/test/round10-native-agents.test.mjs:498–501` reads the real `~/.zcode/agents` directory (ENOENT off the owner's machine) |
| `R/extension` | 757 / 757 pass |
| `R/bridge` | 127: 126 pass, 1 opt-in skip |
| `R/bus` | 10: 9 pass, 1 opt-in skip; `bin/aion-bus.mjs demo --json` exit 0 |

No browser, no Windows host, no live provider was touched. Nothing below is claimed as live-verified unless it cites the live receipt.

---

## A. Executive assessment

### Verdict

**The safety model is sound; the delivery plan is not yet.** The invariants this repository has converged on are the right ones and I would keep every one of them: one Bus writer, exact conversation binding with revision guard, durable reservation before dispatch, at most one attempt, UNKNOWN never triggers a resend, receive authority does not inherit send authority, and "transport ACK ≠ submitted ≠ reply checked". The Bus core that implements them (`R/extension/src/bus/bus.js` `dispatch()` lines 293–360, `applyOutcome()` 228–290) is the best code in the repository and should be preserved untouched in spirit.

Doc 10's top-level shape — *preserve the Bus as the only authority, add a read-only receive plane* — is directionally correct. But five things in the current proposal and code would, in my judgement, prevent a genuinely interactive CLI from working or make it far more expensive than necessary. I would materially change all five.

### What I would materially change

**1. Build the receive plane as a push-capable *conversation event stream*, not a CLI long-poll bolted onto a request/reply pipe.** Today every hop is strictly request→reply: the CLI asks (`R/velocity/src/transport/local-ipc.mjs` `connectHost` 102+), the host forwards one call and waits for one reply (`R/velocity/src/native-host/relay.mjs` `forward()` 79–94), the dev extension answers one call (`R/velocity/extension-dev/dev-link.js` 22–41). Nothing can flow toward the CLI unless the CLI asked. Doc 10 R2 proposes `conversation.watch` as a cursor long-poll over this pipe; that works but holds a host slot per watcher (`MAX_INFLIGHT=32`, 130 s forward timeout), wakes the worker on a timer, and makes every "new message" latency a poll interval. The fix is small: one data-only `aion.b.event` frame type flowing page → worker → host → authenticated subscribed clients, plus a `conversation.read` snapshot call that remains the source of truth. That is the same *hint + authoritative snapshot* pattern the repository already uses successfully for OpenCode (`R/extension/src/bus/adapters/opencode-v2.js` lines 7–34: volatile `/api/event` SSE as hints, `/api/session/{id}/message` as truth). It also replaces two separate polling page readers that exist today (operation observe in `R/extension/src/chatgpt/content.js` `createTurnEngine`, and the commander scan in `R/extension/src/chatgpt/commander.js` driven by `R/extension/src/background/bus.js` 70–75) with **one** observer that both the CLI and Bus V1's commander watcher consume. Note: this deliberately narrows the stated principle "a tab can never push" (`R/extension/src/background/bus.js:10`) to "a tab can never push *authority*" — observations are untrusted data, schema-validated, rate-limited, and can never cause an effect.

**2. Stop correlating replies by asking the model to echo protocol tokens.** Every Bus send today is wrapped by `frameOutbound()` (`R/extension/src/bus/adapters/chatgpt.js` 80–100): a correlation-ID first line, an `[AION bus] Message … from the commander (command …)` header, and an instruction to put the correlation ID on the reply's first line and end with an exact reply token. The content script refuses any outbound text that lacks the correlation ID (`R/extension/src/chatgpt/content.js:939`, `outbound_correlation_required`), and acceptance requires the echoed token (`R/extension/src/chatgpt/correlate.js` `correlateReply` 659+). That is a reasonable *agent-to-agent* protocol (Bus V1 commander loop). It is the wrong primitive for an interactive human conversation: every turn the operator types would be polluted with boilerplate, the conversation's own context is contaminated, and correctness depends on model compliance. **Correlate by observation instead:** the operation is bound to the *new user message* that appears after the pre-submit baseline with text equal to what was submitted, and the reply is the assistant message that follows it. Keep echo-token framing as an explicit per-binding `strict` mode for Bus V1, not the default for chat.

**3. Sequence receive *before* the send repair, and rebuild the ChatGPT page driver small.** The extension send leg has never worked live: on 2026-10-19 it filled the composer but did not activate Send, then reported `turn_refused: generation_incomplete` for a prompt that was never sent (`LIVE-INTEGRATION-2026-10-19.md` §2, §4 P1×2). The successful send was native Windows UI Automation. Meanwhile the ChatGPT-specific extension source is ~5,500 lines (`R/extension/src/background/chatgpt-port.js` alone is 2,561) with ~5,900 lines of tests — 757 green offline tests did not predict the live failure. A read-only observer is lower-risk, is live-testable without send authority, and is precisely the instrumentation needed to diagnose why activation fails. So: observer first, live-verified read-only; then an actuator bake-off on the real page; then a new small driver replaces the turn engine. Do not port the existing turn engine forward.

**4. Freeze the governance machinery and keep semantics out of the runtime CLI.** The design corpus is now ~150 KB of design Markdown in `R/velocity/design/` alone, with a design-directive protocol, eight design verbs, six design-task states, a packet factory, gates G-S0…G-S4, three tempos, and a 550-row matrix (PR #47) of which zero rows are live-verified. Some of this has leaked into runtime: `R/velocity/src/platform/semantics.mjs` (`validateDesignDirective`) and `R/velocity/src/platform/harvest.mjs` are reachable from the operator CLI via `aion platform …` (`R/velocity/bin/aion-local.mjs:41`). The working semantic need for the next phase is seven conversation IDs and one event contract. Keep those as a small code module; archive the rest as research.

**5. Make the long-lived process explicit.** On Windows the CLI is one-shot (each invocation opens the Bus file, connects to the host, does one thing, exits — `R/velocity/src/local-runtime.mjs` `openLocal` 50–105), and the only long-lived broker refuses Windows (`R/velocity/bin/aiond-dev.mjs:18`). An interactive REPL *is* a long-lived process: let it hold the Bus handle and the host link for its lifetime. The native host (already long-lived, Chrome-spawned, one per extension session) is the natural fan-out point for pushed events. **No new daemon** is needed for the MVP.

### What is already good enough to build on

- Bus core, grants, binding revision guard, nonce replay fence, file storage with atomic write + lock (`R/bus/node-storage.js`).
- `aion connect <role> --conversation <url>` exact-binding flow with one-tab proof (`R/velocity/bin/aion-local.mjs` `connectRole` 310–349).
- Track B dev transport: token-authenticated local IPC, framed, with written/not-written tracking for honest no-send (`R/velocity/src/transport/local-ipc.mjs`), the 88-line host (`R/velocity/src/native-host/relay.mjs`) and the 63-line dev link (`R/velocity/extension-dev/dev-link.js`). These are small, clear and the right seams.
- The OpenCode V2 adapter as the reference design for "native runtime with hints + snapshots".
- Composer preflight and selector knowledge in `R/extension/src/chatgpt/content.js` lines 63–130 and 431–505 (exactly-one visible composer, exactly-one Send control, empty draft, not generating) — hard-won and worth carrying into the new driver.

---

## B. Decision matrix (D1–D10)

Urgency legend: **BLOCKING** = decide before parallel coding starts; **BEFORE-SEND** = decide before the send path is touched (receive work can start); **DEFER** = not needed for the interactive CLI.

| ID | Recommendation | Confidence | Implementation implications | Urgency |
|---|---|---|---|---|
| **D1** Bus | **Keep the core; extend narrowly; replace nothing.** Keep `bus.js`, `ledger.js`, `grants.js`, `contracts.js`, `registry.js`, `validate.js` as the only effect authority. Add three things: (a) per-binding `framing: 'chat' \| 'strict'` honoured by the ChatGPT adapter; (b) two optional command fields `user_message_ref` and `reply_message_ref` set by adapter outcomes (additive, nullable, no migration); (c) a configurable `max_text_chars` for chat bindings (default 2000 is low for chat; the page accepts 8000). Do not put conversation text or events in the Bus ledger. | High | ~100 lines in adapter + contracts + tests. Existing ledger records remain valid (fields absent = null). | **BLOCKING** (fields and framing must be fixed before the send loop is coded) |
| **D2** Receive plane vs unified | **Two planes, deliberately: one authority plane for effects (Bus), one observation plane for messages.** Do not unify commands and messages in one event architecture — commands need durable admission and at-most-once; messages need cursors, snapshots and gap repair. *Within* the observation plane, unify: one per-binding conversation event stream consumed by (i) the chat REPL, (ii) operation correlation (the adapter's `observe` reads the same observer state), (iii) the Bus V1 commander watcher (filters `AION_CMD_V1` blocks from completed assistant messages). | High | Removes the second page reader (commander scan) over time; adapter `observe` becomes a query against the observer instead of a separate armed turn engine. | **BLOCKING** |
| **D3** Polling / push / streaming | **Hybrid: pushed hints, pulled truth.** Content script uses a MutationObserver, coalesces changes (≤ 4 Hz per message while generating), and emits *message snapshots with revisions* (not literal token deltas) worker→host→subscribed clients. Clients render deltas locally. Any doubt (subscribe, reconnect, cursor gap, epoch change, worker restart) → `conversation.read` snapshot. Pure polling is acceptable as a degraded mode and is what you get if push fails; literal streaming deltas are unnecessary complexity for a DOM source. | High | New frame type in `dev-link.js` + `relay.mjs` + `local-ipc.mjs` (clients subscribe per binding); new read call kinds in `remote-call.mjs`. | **BLOCKING** (frame + snapshot shape) |
| **D4** Identity, ordering, cursors, dedup, recovery | Five identities, never conflated: **binding key** (provider + canonical `/c/<id>` + binding revision — exists); **page epoch** (content-script instance id — `pageId` already exists at `R/extension/src/chatgpt/content.js:745`, plus tab id); **message key** (provider message id if the DOM exposes one — *to verify in the live DOM spike*; otherwise `pos:<epoch>:<ordinal>` explicitly marked `identity:"positional"` and non-durable across epochs); **message revision** (hash of normalized text + `status` ∈ `generating\|complete\|unknown`); **cursor** (opaque `<epoch>:<seq>`, seq monotonic per epoch, assigned by the worker). Ordering = document order within an epoch. Dedup = client keeps `message_key → last revision`. Cross-epoch or seq gap → `gap` event → mandatory snapshot. Operation↔message link = the first *new* user message after the submit baseline whose normalized text equals the submitted text; reply = the next assistant message. Recovery = REPL never re-dispatches; on start it reads active Bus operations for the binding, shows them, and refuses new sends while one is `DISPATCHED/SUBMISSION_OBSERVED/UNRESOLVED` (existing `TARGET_BUSY` rule). Optional local checkpoint stores cursor + message keys + revisions only, no text. | Medium-high (provider message ids unverified) | Contract module + tests; adapter observe maps observer facts to existing Bus outcomes (`sent` when user message observed, `reply` when assistant complete). | **BLOCKING** |
| **D5** Sharing | **Share contracts and pure reducers; keep provider mechanics independent.** One shared module (`R/extension/src/lib/conversation-contract.js`) used by content script, worker and CLI (the repo already imports extension modules into Node, e.g. `aion-local.mjs:14–15`). One pure inbox reducer (events → conversation view) shared by the CLI and a later side-panel view. DOM reading, actuation and completion heuristics stay provider-specific. Transports are not shared beyond frame schemas. | High | Avoids a generic framework; makes a second provider an implementation of two small interfaces. | **BLOCKING** (contract module is the first package) |
| **D6** Chrome integration | **Selective rebuild behind the existing narrow seams.** Keep dev link, host, IPC, Bus adapter shape, durable reservation concept and preflight/selector knowledge. Rebuild the page side as `R/extension/src/providers/chatgpt/{observer,actuator,profile}.js` (target well under 1,000 lines total) and a thin worker router; retire the turn-engine/run-turn paths in `content.js` and `chatgpt-port.js` only **after** the new path is live-verified. Actuation is chosen by a live bake-off (see G-R2), one actuator per binding, **never** a fallback actuator inside one operation. | Medium-high | Largest work item; parallelisable once the contract exists. Track A untouched. | **BEFORE-SEND** (observer can start immediately) |
| **D7** Seed vs PR #47 | **Keep them separate as data; align the names now; neither drives runtime.** The seven conversation semantic IDs and their CLI verbs live in the contract module. The seed stays a design artefact (its consistency test stays). PR #47's CSV stays a research catalogue under `ops/command-space/`; the issue-48 alias table is the only bridge. Do not wire `routesFor` into dispatch. | High | No code beyond a constant table. | DEFER (naming alignment is 30 minutes inside package P1) |
| **D8** Taxonomy migration | **No migration.** Runtime identities (adapter names `chatgpt.com`, `opencode-v2`, `acp`; Bus OPS; command/grant/binding IDs) are frozen. Semantic names are an additive vocabulary in code and docs. Revisit only on the seed's own migration trigger (doc 05 §7). | High | None. | DEFER |
| **D9** Provider families vs bespoke vs native | **A provider is an adapter that implements up to two small interfaces — `Effect` (existing Bus adapter: `deliver/observe/dispose`) and `ConversationSource` (`snapshot(since)`, `subscribe()`); families are code reuse, not runtime taxonomy.** Chat webapps share a helper (generic DOM observer core + per-provider profile of selectors/quirks); a bespoke webapp writes its own driver and exposes whatever subset of semantics it truly supports; a native runtime implements `ConversationSource` over its own API (OpenCode: `GET …/message` + SSE). The adapter manifest (`R/extension/src/bus/contracts.js` capabilities, line 281) gains an additive `receive` block: `{snapshot, push, message_identity: 'provider'\|'positional'}`. | Medium | Proves generality cheaply: implement `ConversationSource` for OpenCode *in parallel* with ChatGPT, with no browser. | BEFORE-SEND |
| **D10** Smallest working CLI | **Three increments, each live-testable:** **C0 watch-only REPL** (`aion chat <alias> --watch`): bound conversation, live messages including ones typed on the phone/browser, generating indicator, gap+resnapshot on reload — read-only, needs no send authority. **C1 send loop**: one typed line → one Bus operation (chat framing) → user message observed → reply streamed → complete. **C2 recovery**: kill/restart REPL mid-generation, tab reload, worker restart, host restart; zero re-submissions. Must exist before C0: contract module, push frame, `conversation.read`, observer. Must exist before C1: D1 fields/framing, actuator decision. | High | Gives the owner a working, safe artefact (C0) within the first integration gate instead of after the send repair. | **BLOCKING** (sequencing) |

### Important decisions missing from the list

| ID | Missing decision | My recommendation | Needs owner? |
|---|---|---|---|
| **M1** | Chat framing: is it acceptable that chat-mode sends contain **only the operator's text** (no correlation header / reply token)? | Yes for chat bindings; `strict` echo framing stays for Bus V1 agent bindings. | **Yes** |
| **M2** | Read authority: separate read grant, or read scope implied by the explicit `aion connect` binding? | Read scope = the explicit binding (revocable by unbinding), plus an optional `--no-read` flag. A separate grant object adds ceremony without a distinct threat in a single-owner local setup. | **Yes** |
| **M3** | Full-text retention: in-memory only, or opt-in private local history? | MVP: in-memory in the REPL only; checkpoint stores no text. Revisit after C2. | **Yes** |
| **M4** | Actuator policy: is native Windows UIA (proven live once) an allowed production actuator, or only content-script DOM actuation? Is `chrome.debugger` (trusted input) allowed? | Run a bake-off of DOM strategies first (form `requestSubmit`, Enter key on the editor, current pointer sequence); keep UIA as a declared per-binding alternative if DOM fails; `chrome.debugger` only if both fail. One actuator per binding, never fallback within an operation. | **Yes** |
| **M5** | Lift `STATE.json` `current_live_scope.code_policy` ("implementation changes remain frozen") for Track B receive/send work. | Lift for Track B branch work; Track A stays frozen. | **Yes** |
| **M6** | Single Bus authority for Track B: the extension also embeds a Bus (`R/extension/src/background/bus.js`, `chrome.storage`) and a ChatGPT task store (`R/extension/src/lib/chatgpt-tasks.js`). | Node file Bus is the only Track B authority; the extension task store is an actuation journal only; the in-worker Bus is Track A / commander-only until Bus V1 is rebuilt on the event stream. | Confirm |
| **M7** | Edits, regenerations and branch switches in ChatGPT (a message's text or position changes after completion). | Model as `message_replaced` / revision change with `branch_changed` gap; never attribute a regenerated reply to an earlier operation without re-observation. | No |
| **M8** | Concurrency of clients: two REPLs or REPL + side panel on one binding. | Many readers, one sender; send path already enforces `TARGET_BUSY`. | No |
| **M9** | Windows named-pipe DACL is default (`local-ipc.mjs:10`, `pipe_dacl: DEFAULT_UNVERIFIED`); with transcripts now flowing, is token-only auth sufficient? | Acceptable for MVP (token lives in the private state dir); schedule a restricted DACL before any opt-in history feature. | Confirm |
| **M10** | Test hygiene: offline suites must be hermetic on any machine. | Fix the `~/.zcode/agents` test to use a fixture dir; make "selftest passes on a clean Linux checkout" an integration gate. | No |

---

## C. Target architecture

### C.1 End-to-end picture

```text
                         ┌──────────────────────────────────────────────────────────────┐
  operator types  ─────► │ aion chat <alias>  (REPL process, long-lived for the session)│
                         │  ┌───────────────┐            ┌────────────────────────────┐ │
                         │  │ intent parser │            │ inbox reducer (pure)       │ │
                         │  │ commands.mjs  │            │ events → conversation view │ │
                         │  └──────┬────────┘            └─────────▲──────────────────┘ │
                         │         │ send(text)                    │ events / snapshots │
                         └─────────┼───────────────────────────────┼────────────────────┘
                                   │                               │
            AUTHORITY PLANE        ▼                               │   OBSERVATION PLANE
   ┌──────────────────────────────────────────────┐               │   (read-only, data only)
   │ Command authority = existing aion.bus/1       │               │
   │ broker/core.mjs sendAlias → bus.ingest…       │               │
   │  binding+revision guard · grant · nonce fence │               │
   │  RESERVED (durable) → DISPATCHED (durable) →  │               │
   │  ONE adapter.deliver()                        │               │
   │  ledger: bus.json (no transcript text)        │               │
   └──────────────────────┬───────────────────────┘               │
                          │ deliver / observe                      │
                          ▼                                        │
   ┌──────────────────────────────────────────────┐               │
   │ Provider adapter (Effect)  chatgpt.com        │               │
   │  framing: chat | strict                       │               │
   │  outcome ← observer facts:                    │               │
   │   user_message_ref → SUBMISSION_OBSERVED      │               │
   │   assistant complete → REPLY_CHECKED          │               │
   └──────────────────────┬───────────────────────┘               │
                          │ aion.b.call (request/reply)            │ aion.b.event (push, data)
                          ▼                                        │  + conversation.read (pull)
   ┌──────────────────────────────────────────────────────────────┴──────────────┐
   │ Track B dev native host (relay.mjs) — no ledger, no retry, fans events out   │
   │ to authenticated subscribed IPC clients (local-ipc.mjs, token auth)          │
   └──────────────────────────────────────┬──────────────────────────────────────┘
                                          │ Chrome native messaging (one port)
   ┌──────────────────────────────────────▼──────────────────────────────────────┐
   │ Extension worker: dev-link.js + thin conversation router                    │
   │  · calls: tabs · conversation.read · submit(opKey) · dispose                 │
   │  · assigns cursor <epoch>:<seq>, validates observer frames, rate-limits      │
   │  · actuation journal (reservation by opKey; no-resend)                       │
   └──────────────────────────────────────┬──────────────────────────────────────┘
                                          │ runtime port per tab
   ┌──────────────────────────────────────▼──────────────────────────────────────┐
   │ Page (chatgpt.com/c/<id>) — provider driver                                  │
   │  observer.js : MutationObserver → message snapshots {key, role, rev, status} │
   │  actuator.js : preflight (1 composer, 1 Send, empty, idle) → ONE activation  │
   │  profile.js  : selectors / quirks for this provider                          │
   └─────────────────────────────────────────────────────────────────────────────┘
```

### C.2 One CLI turn (happy path)

1. REPL is subscribed to `binding=chief` and holds the latest snapshot (cursor `e7:41`).
2. Operator types `hello`. REPL calls `plane.sendAlias({alias, text, nonce})` — existing code. Bus reserves `cmd-…` durably, dispatches once.
3. Adapter (`framing:chat`) asks the worker to `submit` with `operation_key=bus-cmd-…`; actuator records the baseline (last message key), runs preflight, activates once.
4. Observer emits `message_observed {key:m-u9, role:user, text:"hello", status:complete}`. Worker links it to the open operation (first new user message after baseline with equal normalized text) and the adapter outcome becomes `sent` with `user_message_ref=m-u9` → Bus `SUBMISSION_OBSERVED`.
5. Observer emits `message_observed {key:m-a9, role:assistant, status:generating, rev:r1…}` at ≤ 4 Hz; REPL renders the growing text.
6. Stop control disappears and text is stable for the settle window → `status:complete` (labelled `completion:"inferred"`). Adapter outcome `reply` with `reply_message_ref=m-a9` → Bus `REPLY_CHECKED`. REPL prints the final text and the operation line.
7. A message typed on the phone arrives as `message_observed {role:user}` with **no** linked operation; REPL shows it as external. Its reply is displayed but never attached to any AION operation.

### C.3 Event contract (refines doc 10's `aion.conversation.event/1`)

```json
{
  "schema": "aion.conversation.event/1",
  "binding": {"provider": "chatgpt.com", "ref": "https://chatgpt.com/c/<id>", "revision": 3},
  "epoch": "page-instance-id",
  "cursor": "e7:42",
  "kind": "message_observed | message_removed | generation_state | gap | epoch_started | epoch_ended",
  "message": {
    "key": "provider-id-or-pos:<epoch>:<ordinal>",
    "identity": "provider | positional",
    "role": "user | assistant",
    "ordinal": 18,
    "rev": "sha256-prefix-of-normalized-text+status",
    "status": "generating | complete | unknown",
    "completion": "observed | inferred | null",
    "text": "visible text (bounded), only to authenticated local clients",
    "text_truncated": false
  },
  "link": {"operation_id": "cmd-…", "basis": "baseline+exact-text"} ,
  "observed_utc": "…"
}
```

Rules: `link` is present only when the worker made the baseline+exact-text match for an open operation; otherwise `null` ("external"). `gap` carries `{reason: reload|navigate|seq_gap|worker_restart|virtualized|branch_changed}` and obliges the client to call `conversation.read`. `conversation.read` returns `aion.conversation.snapshot/1`: `{binding, epoch, cursor, coverage: {first_ordinal, last_ordinal, complete_history: false}, messages: [...]}` — `complete_history` is always `false` for a DOM source because virtualised history cannot be proven complete. Events never carry selectors, action names, grants, or anything that could be interpreted as a command.

---

## D. Keep / Rebuild / Remove / Add

### Keep (as is, or with additive edits)

| Path | Why | Edit |
|---|---|---|
| `R/extension/src/bus/bus.js`, `ledger.js`, `grants.js`, `registry.js`, `validate.js`, `grammar.js` | Correct at-most-once core, binding drift halt, nonce fence | none |
| `R/extension/src/bus/contracts.js` | Single source for states, reasons, config | additive: chat `max_text_chars` per binding, manifest `receive` block, nullable `user_message_ref` / `reply_message_ref` |
| `R/bus/node-storage.js`, `R/bus/bin/aion-bus.mjs` (`openBus`) | Atomic write + cross-process lock; REPL and one-shot CLI can share the ledger | none |
| `R/velocity/src/broker/core.mjs` (`createCommandPlane`, `sendAlias`) | Thin, honest admission; already returns immediately and owns the one attempt | none for C1; REPL calls it directly |
| `R/velocity/src/broker/events.mjs` | Operation-only volatile events; correctly forbids transcript text | keep text-free; conversation events are a separate stream |
| `R/velocity/src/result.mjs`, `readiness.mjs` | Truthful projections | add `user_message_ref` / `reply_message_ref` to `aion.result/1` |
| `R/velocity/src/commands.mjs`, `R/velocity/bin/aion-local.mjs` | Parser and CLI entry; `connectRole` exact binding | add `chat` command dispatch (new module does the work) |
| `R/velocity/src/transport/local-ipc.mjs`, `framing.mjs` | Token auth, written/not-written truth | add authenticated `subscribe {binding}` and unsolicited event frames (no `id`) |
| `R/velocity/src/native-host/relay.mjs`, `guard.mjs` | Tiny, no ledger, fail-all-pending as UNCERTAIN on port loss | allowlist `conversation.read`; forward worker `aion.b.event` to subscribers |
| `R/velocity/extension-dev/dev-link.js` | 63-line seam to the worker | add `aion.b.event` emission and `conversation.read` call |
| `R/velocity/src/browser/remote-call.mjs` | Truthful transport-failure mapping | add `conversation.read` (`kind:'read'`) |
| `R/extension/src/bus/adapters/opencode-v2.js`, `acp-executor.js` | Native executors; OpenCode is the reference "hints + snapshot" design | later: `ConversationSource` for OpenCode (P16) |
| `R/extension/src/lib/chatgpt-tasks.js` `canonicalConversation`; `R/extension/src/bus/adapters/chatgpt.js` `canonicalChatGPTConversation` | Exact `/c/<id>` canonicalisation, home-page refusal | none |
| `R/extension/src/chatgpt/correlate.js` `normalizeText`, `flatText` | Shared normalisation for exact-text linking | import into new driver |
| Selector + preflight knowledge in `R/extension/src/chatgpt/content.js` 63–130, 300–505 | Hard-won live facts (ProseMirror composer, Send accessible name, stop button) | **port** into `providers/chatgpt/profile.js` and `actuator.js` |

### Rebuild

| Current | Replacement | Retire when |
|---|---|---|
| `R/extension/src/chatgpt/content.js` `createTurnEngine` (send+observe coupled, armed per operation, requires correlation in text) | `R/extension/src/providers/chatgpt/observer.js` (always-on while bound tab is subscribed; read-only) + `actuator.js` (one guarded activation, records baseline, no observation logic) + `profile.js` | after gate I2 (two live turns) |
| `R/extension/src/background/chatgpt-port.js` (2,561 lines: reservation store, run-turn, submit, observe, archive, commander scan, settle logic) | thin `R/extension/src/providers/chatgpt/router.js` (tab resolve, epoch/cursor assignment, frame validation, operation link table, actuation journal by opKey) | after gate I2; keep `createReservationStore` semantics or reuse `chatgpt-tasks.js` |
| `R/extension/src/bus/adapters/chatgpt.js` `deliver/observe` against `aion/chatgpt-submit` / `aion/chatgpt-observe` | same file, `framing` mode; `observe` queries router link state (`user_message_ref`, reply status) | with P10 |
| Commander scan (`R/extension/src/chatgpt/commander.js` + `R/extension/src/background/bus.js` polling) | Bus V1 commander watcher as a consumer of `message_observed{role:assistant,status:complete}` | Bus V1 rebuild (after C2); not on the CLI critical path |

### Remove or freeze (archive, do not delete, per `AGENTS.md`)

| Path | Action | Reason |
|---|---|---|
| `aion platform validate` / directive path in `R/velocity/src/platform/semantics.mjs` (`validateDesignDirective`) and `R/velocity/src/platform/inspect.mjs` | Move out of the operator CLI into a `tools/` script or delete the directive validator | Runtime CLI should not validate design documents; no consumer exists |
| `aion platform harvest` (`R/velocity/src/platform/harvest.mjs`) | Move under `R/harvest/` tooling | Research tooling, not runtime |
| `projectPlatformAdapters` in `aion capabilities` output | Keep only if it reads from the adapter manifest's new `receive`/`semantics` fields; otherwise drop | Avoid a parallel description of capabilities |
| `R/velocity/bin/aiond-dev.mjs` (Unix-only broker) | Freeze | Not on the Windows path; the REPL is the long-lived process |
| Design docs `05`, `06`, `08` directive/packet-factory material | Archive with a pointer to this review / accepted decisions | Governance overhead without runtime consumers |
| Legacy `run-turn` combined path (`CHATGPT_ACTION.RUN_TURN`, `chatgpt-port.js`) | Retire after I2 | Duplicate send path |

### Add

| New path | Contents | Size target |
|---|---|---|
| `R/extension/src/lib/conversation-contract.js` | Event + snapshot schemas, validators, kind enums, the seven semantic IDs ↔ CLI verbs table, size caps, `NOT_INTERCHANGEABLE` fidelity constant | ~200 lines |
| `R/extension/src/providers/chatgpt/profile.js`, `observer.js`, `actuator.js`, `router.js` | The new page driver (see Rebuild) | < 1,000 lines total |
| `R/velocity/src/conversation/inbox.mjs` | Pure reducer: events/snapshots → ordered view, dedup by key/rev, gap handling, external vs linked | ~150 lines |
| `R/velocity/src/conversation/repl.mjs` | Terminal session: subscribe, render, `/watch /history /status /resume /exit`, send via `plane.sendAlias`, busy refusal | ~250 lines |
| `R/velocity/src/conversation/checkpoint.mjs` | Optional private cursor file (no text) per binding | ~60 lines |
| Tests: `R/extension/tests/conversation-contract.test.js`, `chatgpt-observer.test.js`, `chatgpt-actuator.test.js`, `chatgpt-router.test.js`; `R/velocity/test/conversation-inbox.test.mjs`, `conversation-repl.test.mjs`, `conversation-e2e.test.mjs`, `host-event-fanout.test.mjs` | Fake-page DOM fixtures built from **sanitised structural facts captured in the live DOM spike** (no transcript text) | — |

---

## E. Semantic architecture

### E.1 Four layers, one direction of authority

```text
  (4) Harvest evidence      PR #41 C-004 (65 donor IDs)       research only, terminal
          │ informs
  (3) Capability catalogue  PR #47 CSV (13×22×25, 550 rows)   research/planning, advisory
          │ informs                    ▲ alias table (issue-48)
  (2) Semantic names        conversation-contract.js: 7 conversation IDs + executor.prompt,
                            capability.inspect, operation.observe, operation.dispose
          │ names
  (1) Executable contracts  aion.bus/1 (OPS send/status/cancel) · aion.result/1 ·
                            aion.conversation.event/1 · aion.conversation.snapshot/1 ·
                            adapter manifest (+receive block)
```

**Only layer 1 executes.** Layer 2 is a frozen constant table in code that names what layer 1 does and maps each name to a concrete CLI verb and adapter method; it is checked by tests, so it cannot drift silently. Layers 3 and 4 are inputs to *human/agent planning*. Nothing promotes upward or downward automatically; a catalogue row becomes executable only when someone writes an adapter method plus tests and it is live-verified — at which point the catalogue row's status is *updated from* the code, never the other way round.

### E.2 What to do with each artefact

- **Master seed (`platform-semantic-seed.json`):** keep as a design artefact. Its useful content — the invariants, the identity axis list, the `effect` classes, the explicit non-interchangeability — moves into `conversation-contract.js` as code constants and test assertions. Its provider families/shapes/realisation axes stay descriptive; they are not runtime switches. The directive protocol and design verbs are archived.
- **PR #47 command space:** merge it as **research data** (it targets `main`; fine), but never import it in `R/velocity` or `R/extension`. Two fixes before it is used even for planning: add stable `provider_id`/`route_id` columns, and stop presenting cartesian placeholder rows as mappings (455 of 550 are `NOT_RESEARCHED`). Adopt its short command names (`send`, `observe`, `reply.read`, `stream`, `session.bind`, `history.read`, `recover`) as the **CLI-facing verbs** — they are good names — mapped one-to-one to the `conversation.*` semantic IDs.
- **Harvest C-004:** no further broad harvesting for this phase. The issue-48 micro-packet is sufficient. Rejected donor patterns (retry/resend VF-0016/0024, fail-open VF-0026, ranked ambiguous actuation VO-GH-0030) become **negative tests**, which is where they create value.
- **Executable Bus contracts:** unchanged except the additive fields in D1. The Bus OPS grammar does not gain conversation verbs: `watch`, `history`, `read` are observation calls, not Bus operations; only `send` (and later `stop_generation`, separately authorised) cross the authority plane.

### E.3 The seven semantics, resolved to code

| Semantic ID | CLI | Plane | Realisation (ChatGPT web) | Evidence that completes it |
|---|---|---|---|---|
| `conversation.send` | typed line in `aion chat`; `aion send <alias>` | Authority (Bus op) | adapter `deliver` → router `submit` → actuator | `user_message_ref` observed → `SUBMISSION_OBSERVED` |
| `conversation.observe` | live REPL; `aion chat --watch` | Observation | router subscribe → observer events | events with cursor; gaps explicit |
| `conversation.reply.read` | REPL render; `aion observe <op>` | Observation (+ Bus projection) | linked assistant message, status | `complete` (observed/inferred) → `REPLY_CHECKED` |
| `conversation.stream` | REPL render while generating | Observation | `message_observed{status:generating}` revisions | none (display only) |
| `conversation.session.bind` | `aion connect <alias> --conversation <url>` | Authority (binding + grant) | existing `connectRole` | existing one-tab proof |
| `conversation.history.read` | `/history` | Observation | `conversation.read` snapshot | `coverage` with `complete_history:false` |
| `conversation.recover` | `/resume`, REPL start | Both (read Bus ops + resnapshot) | Bus active ops + snapshot | no dispatch; uncertain ops surfaced |

---

## F. Development blueprint

### F.1 Gates

| Gate | Passes when | Where |
|---|---|---|
| **G0 Decisions** | Owner answers M1 (chat framing), M2 (read scope), M3 (retention), M4 (actuator policy), M5 (unfreeze Track B code) | owner |
| **G1 Contract frozen** | P1 merged: contract module + tests; event/snapshot shapes no longer change without a version bump | GitHub |
| **I1 Watch-only live** | On the Windows dev profile: `aion chat chief --watch` shows existing messages, a message typed in the browser or on the phone appears within ~1 s, a generating reply grows, completion is shown, a tab reload produces `gap` + resnapshot with no duplicates. **No send authority used.** | Windows, read-only |
| **I2 Two live turns** | Two typed turns → two distinct operation IDs → both `user_message_ref` observed → both replies displayed → same `/c/<id>` → zero duplicate sends, zero wrong-target | Windows, owner-authorised send |
| **I3 Recovery matrix** | Doc 10 acceptance in full: REPL kill mid-generation, tab reload mid-generation, worker restart, host restart, ambiguous Send control, unknown submission → zero re-submissions, uncertain op surfaced, new sends blocked with exact reason | Windows |
| **Every PR** | Offline suites green on a clean Linux checkout (hermetic) and on Windows | both |

### F.2 Packages (atomic, each one PR with tests)

| ID | Package | Files (owned) | Depends on | Tests / done criteria |
|---|---|---|---|---|
| **P1** | Conversation contract | `R/extension/src/lib/conversation-contract.js`, `R/extension/tests/conversation-contract.test.js` | G0 (M1/M2 only affect field presence) | validators accept doc-C.3 shapes; reject command-like fields, oversize text, missing epoch/cursor; semantic ID ↔ CLI verb table; `complete_history` always false for DOM |
| **P2** | Live DOM spike (read-only, Windows) | receipt only: `workspace/aion/agents/windows-master/DOM-SPIKE-<date>.md` (structure only, **no transcript text**) | none | records: per-message id attributes present?, turn container attributes, streaming mutation pattern, stop-control lifecycle, virtualisation behaviour on long threads, behaviour on edit/regenerate. Done via existing DevTools/inspect mode, no send |
| **P3** | ChatGPT observer | `R/extension/src/providers/chatgpt/{profile,observer}.js` + tests | P1; P2 informs selectors (can start on current selectors) | fixture DOM: initial snapshot; append user; streaming assistant revisions coalesced ≤4 Hz; complete inference; rerender same text → no new revision; node replacement → same key if provider id else gap; edit/regenerate → revision/branch gap |
| **P4** | Worker router + dev link | `R/extension/src/providers/chatgpt/router.js`, `R/velocity/extension-dev/dev-link.js` + tests | P1, P3 | per-binding epoch/cursor; frame validation; rate limit; `conversation.read`; events only for subscribed bindings; worker restart → new epoch |
| **P5** | Host + IPC fan-out | `R/velocity/src/native-host/relay.mjs`, `R/velocity/src/transport/local-ipc.mjs`, `R/velocity/src/browser/remote-call.mjs` + `R/velocity/test/host-event-fanout.test.mjs` | P1 | unauthenticated client gets nothing; subscribed client gets only its binding; slow client is dropped with `gap` (never blocks host); host restart → clients see link loss → resnapshot |
| **P6** | Inbox reducer | `R/velocity/src/conversation/inbox.mjs` + test | P1 | dedup by key/rev; ordering by ordinal; gap → `needs_snapshot`; external vs linked; snapshot replaces view atomically |
| **P7** | Watch-only REPL | `R/velocity/src/conversation/repl.mjs`, `R/velocity/src/commands.mjs`, `R/velocity/bin/aion-local.mjs` + tests | P5, P6 (fakes for P3/P4) | `aion chat <alias> --watch` against fake host: render, `/history`, `/status`, `/exit` leaves no state; refuses unbound/ambiguous role with existing codes |
| — | **Gate I1** | — | P3–P7 | see F.1 |
| **P8** | Bus/adapter chat framing + message refs | `R/extension/src/bus/adapters/chatgpt.js`, `R/extension/src/bus/contracts.js`, `R/velocity/src/result.mjs` + tests | G0 M1, P1 | chat binding sends exactly operator text; strict binding unchanged (existing tests stay green); outcomes carry refs; old ledger fixtures still load |
| **P9** | Actuator bake-off (live, authorised) | spike harness inside `actuator.js` behind a dev flag; receipt | G0 M4, I1 | for each DOM strategy, on a scratch conversation: one activation → was a new user message observed? Pick one; record evidence. **One attempt per test conversation, no retries** |
| **P10** | Actuator + router submit | `R/extension/src/providers/chatgpt/{actuator,router}.js` + tests | P8, P9 | preflight gates (1 composer, 1 Send, empty, idle, url = binding); baseline recorded; one activation; link by baseline+exact text; ambiguous → no send; journal by opKey prevents a second activation across worker restarts |
| **P11** | REPL send loop | `R/velocity/src/conversation/repl.mjs` + tests | P7, P8, P10 | one line → one `sendAlias`; busy refusal while an op is active; reply display; `aion observe <op>` agrees with REPL |
| — | **Gate I2** | — | P8–P11 | see F.1 |
| **P12** | Recovery + fault matrix | `repl.mjs`, `checkpoint.mjs`, e2e test | P11 | all doc-10 falsifiers + issue-48 N1–N8 as tests; I3 live |
| **P13** | Retire legacy turn engine | `R/extension/src/chatgpt/content.js`, `R/extension/src/background/chatgpt-port.js`, service-worker routes | I2 | legacy tests archived or ported; Track A untouched |
| **P14** | OpenCode `ConversationSource` | `R/extension/src/bus/adapters/opencode-v2.js` (or sibling) + tests | P1 | same reducer renders an OpenCode session via `GET …/message` + `/api/event`; proves D9 without a browser |
| **P15** | Bus V1 commander on event stream | `R/extension/src/background/bus.js`, `commander.js` | I2 | commander blocks extracted from `complete` assistant messages; old scan removed |
| **P16** | Hygiene | `R/velocity/test/round10-native-agents.test.mjs`; move `aion platform` out of CLI | none | selftest green on clean Linux |

### F.3 Parallel workstreams

```text
Day 0   G0 decisions (owner)        P2 DOM spike (Windows, read-only)       P16 hygiene
        P1 contract ───────────────┬───────────────┬───────────────┬────────────────┐
Stream  Chrome page                │ Transport     │ CLI           │ Native proof   │
        P3 observer → P4 router    │ P5 host/IPC   │ P6 → P7 REPL  │ P14 OpenCode   │
                                   └──── Gate I1 (watch-only live) ┘                │
        P9 bake-off (live) → P10 actuator   P8 Bus framing/refs → P11 send loop     │
                                   └──── Gate I2 (two live turns) ──────────────────┘
        P12 recovery → Gate I3        P13 retire legacy        P15 Bus V1 commander
```

Four agents can work concurrently after P1 (Chrome page, transport, CLI, native proof) with **no shared files**. File ownership in F.2 is disjoint by design; the only shared file is the contract, which is frozen at G1. Hard WIP rule from `R/velocity/AGENTS.md` §3 still applies per agent.

### F.4 Test requirements that change

- **Fixtures from reality:** every DOM fixture must cite the P2 spike facts it encodes. A green offline suite built on invented DOM is what produced 757 passing tests and a failed live send.
- **Negative tests are first-class:** issue-48 N1–N8, seed conformance examples 1–10 (doc 05 §9), and the rejected donor patterns become named tests in P3/P10/P12.
- **Each integration gate has a short live checklist** run by the Windows agent with a receipt (UTC times, operation IDs, no transcript text).

---

## G. Critical risks and simplifications

### G.1 Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| G-R1 | ChatGPT DOM may not expose stable per-message ids; positional identity breaks on virtualisation/rerender | High | P2 spike first; identity field states `positional` honestly; positional keys never survive an epoch; gaps force snapshots |
| G-R2 | DOM actuation may be ignored by the page (synthetic events are untrusted; the live run filled but did not send) | High | P9 bake-off before building on any strategy; UIA as declared alternative; never fallback inside one operation; ambiguous outcome = UNKNOWN, owner disposes |
| G-R3 | False completion: stop control gone ≠ reply complete (doc 10 risk 5) | Medium | `completion:"inferred"` label; settle window; `REPLY_CHECKED` in chat mode means "observed complete by heuristic", stated in result evidence |
| G-R4 | MV3 worker restarts drop the push stream | Medium | native port keeps worker alive while connected; any restart = new epoch + `gap`; observer state lives in the page, not the worker |
| G-R5 | Edits/regenerations/branches re-shape history after completion | Medium | revision + `branch_changed` gap; operation link frozen at first observation |
| G-R6 | Privacy: full text now crosses local IPC; Windows pipe uses default DACL | Medium | token in private dir (existing); in-memory only (M3); restricted DACL before history feature (M9) |
| G-R7 | Split brain: extension in-worker Bus + extension task store + Node Bus all hold operation state | Medium | M6: Node Bus sole Track B authority; task store = actuation journal keyed by `bus-<command_id>` |
| G-R8 | Process overhead outruns code: more design documents than working loops | High | freeze governance (S1, S7); gates are live behaviours, not document states |
| G-R9 | Owner-workflow friction (live receipt §4 "Workflow too cumbersome") | Medium | `aion chat` is one command after `aion connect`; C0 needs no grants beyond the binding |
| G-R10 | Bus `max_text_chars=2000` (`R/extension/src/bus/contracts.js:205`) rejects ordinary chat prompts | Low | per-binding limit for chat (D1c), page cap 8,000 |

### G.2 Where the current proposal is overengineered, incomplete, or constraining

**Overengineered**
- **S1.** Design-directive protocol, design verbs, design-task states and the packet factory (doc 05 §4–6, doc 06) have no runtime consumer and now have runtime code (`validateDesignDirective`). Archive; build packets are ordinary PR descriptions with the F.2 columns.
- **S2.** Two page readers (turn-engine observe and commander scan) plus a proposed third (doc 10 R1 observer). One observer.
- **S3.** Echo-token correlation for human chat. Replace with observation-based linking (A.2).
- **S4.** Literal token deltas and "stable alignment" proofs (doc 10). Snapshots with revisions; the client computes display deltas.
- **S5.** Route planner, SQLite command space, provider×command×route matrix for a product that has one live-unverified provider. Defer until a second provider works.
- **S6.** A separate read-grant object (doc 10 "read grant" in R2) in a single-owner local system — use binding scope unless the owner decides otherwise (M2).
- **S7.** Eleven design documents for one subsystem. After G0, fold accepted decisions into doc 10 and archive 05/06/08.

**Incomplete**
- No push path anywhere in the Chrome transport (A.1).
- No concrete message identity — doc 10 rightly says "never rely solely on text/hash" but proposes no provider-id discovery step (P2 fills this).
- No treatment of edits/regenerations/branching (M7).
- No decision on the actuator after the P1 live failure (M4).
- No statement of who is the long-lived process on Windows (A.5).
- `STATE.json` still freezes implementation (`current_live_scope.code_policy`) while this branch plans implementation (M5).
- Offline suite is not hermetic (M10).

**Constraining future providers unnecessarily**
- Correlation that requires the provider's model to echo tokens excludes providers/UIs where the operator does not control the prompt framing, and pollutes native runtimes' histories.
- Coupling observation to an armed send operation (current turn engine) makes "receive without send" impossible — exactly what Bus V1's phone-originated commands and the CLI's external messages need.
- `max_text_chars` as a global Bus constant rather than an adapter/binding capability.

---

## H. Final recommendation — what I would build if I owned delivery

I would keep the Bus exactly as the effect authority and build one new thing beside it: **a per-binding conversation event stream** — page observer → worker cursor → host fan-out → REPL — with pushed hints and pulled snapshots, the same pattern OpenCode already uses. I would make the first deliverable a **watch-only `aion chat`** that is safe to run live on day one and that turns the ChatGPT page from a black box into an instrumented surface. With that instrument in place, I would run a short live **actuator bake-off**, then replace the turn engine with a small observer/actuator driver, switch chat bindings to **observation-based correlation** with plain operator text, and add the send loop on top of the existing `sendAlias`. Recovery is mostly free: the Bus already refuses duplicates and the observer re-snapshots on any gap. In parallel, a native `ConversationSource` for OpenCode proves the contract generalises without a browser.

I would explicitly *not* build, this phase: a route planner, a semantic registry in the runtime, a taxonomy migration, a daemon, literal token streaming, a separate read-grant system, or further harvest. The semantic work that is useful is ten lines of constants and a set of negative tests.

---

## Answers to the owner's five closing questions

**1. What I would change.** (a) Add a push-capable conversation event stream (one data-only frame type through dev-link → host → IPC) with `conversation.read` snapshots as truth; one observer replaces the turn-engine observe and the commander scan. (b) Correlate chat replies by observing the submitted user message, not by echoed tokens; plain operator text for chat bindings. (c) Do receive first, live, read-only; then an actuator bake-off; then rebuild the ChatGPT page driver small and retire `chatgpt-port.js`/turn engine after two live turns. (d) Freeze the directive/packet governance and move `aion platform` research tooling out of the runtime CLI. (e) The REPL is the long-lived process; no daemon.

**2. What I would preserve.** The Bus core and every safety invariant; `aion connect` exact binding; the Track B dev transport (IPC, host, dev link); `sendAlias`; the result/readiness projections; the OpenCode/ACP adapters; composer preflight and selector knowledge; canonical conversation handling; Track A isolation; the no-Playwright/Puppeteer/Orca rule.

**3. Decisions that need your input.** M1 chat framing (plain text for chat bindings); M2 read scope (implied by binding?); M3 retention (in-memory only for MVP?); M4 actuator policy (DOM bake-off first; is UIA allowed as a declared alternative; is `chrome.debugger` allowed at all?); M5 lift the `STATE.json` implementation freeze for Track B; confirm M6 (Node Bus is the sole Track B authority) and M9 (token-only pipe auth acceptable for MVP).

**4. Is AION ready for parallel development?** **Not yet — one short step away.** Today parallel agents would collide on the undecided items above and on an unfrozen event contract. After G0 (owner answers, one sitting) and P1 (contract module, ~1 day), yes: four disjoint streams (Chrome page, transport, CLI, native proof) can run concurrently with the file ownership in F.2, and the P2 DOM spike can run on Windows at the same time because it is read-only.

**5. Recommended implementation sequence.** G0 decisions + P2 DOM spike + P16 hygiene → P1 contract (freeze) → in parallel P3/P4 (page+worker), P5 (host/IPC), P6/P7 (inbox+watch REPL), P14 (OpenCode source) → **Gate I1 watch-only live** → P8 Bus framing/refs ∥ P9 actuator bake-off → P10 actuator → P11 send loop → **Gate I2 two live turns** → P12 recovery → **Gate I3** → P13 retire legacy ∥ P15 Bus V1 commander on the event stream.
