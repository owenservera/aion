# AION Chrome Relay Station — Architecture v0.1

## Track B command environment — current target specification (2026-10-20)

**Authority and status:** owner-requested specification/planning pass, not an implementation or live-verification receipt. This section governs the bounded Track B ChatGPT Send/observe repair where older proposals below conflict. Root operating rules, explicit owner authorization, Track A isolation and the unchanged M1 acceptance contract remain higher authority. Historical proposals below are retained as history; they are not proof of current installation, permission or support. This section does not adopt the broader commander-loop proposals or authorize any browser action.

### Goal and scope

One authorized `aion send chief "..."` to an exactly bound dev conversation must produce one activation attempt, positive observation of the matching user turn, observed response completion, a checked actual reply, and a durable CLI result. An occupied composer, connected host, successful event dispatch or green fixture is not success.

Scope: the existing CLI -> Bus -> authenticated dev host -> worker -> page engine -> checked result path. Reuse the existing Bus, immutable bindings, grants, browser journal, correlator and local transport. No replacement orchestrator, database, event bus, generic browser framework, account automation or UI redesign. Attachments/model controls/new-conversation creation remain outside this repair unless separately specified.

### Three independent state axes

**CENV-01 — conversation snapshot.** Report current observations for the exact bound conversation/page: `UNKNOWN`, `IDLE_EMPTY`, `DRAFT_PRESENT`, `RESPONDING`, or `BLOCKED`. A snapshot describes now, not whether a historical operation succeeded. `BLOCKED` must carry a concrete reason such as missing/ambiguous composer, unavailable target or unreadable state. Unknown is not idle. Include observation UTC, freshness and identity.

**CENV-02 — operation lifecycle.** Maintain the existing immutable operation identity and separate facts for `RESERVED -> PREPARING -> PREPARED -> ACTIVATION_ATTEMPTED -> SUBMISSION_OBSERVED -> RESPONDING -> SETTLING -> REPLY_CHECKED`. These are semantic projections, not replacement Bus/storage enums. Alternatives are `REFUSED_NO_SUBMIT`, `REPLY_REJECTED` and `NEEDS_RECONCILIATION`. Preserve earlier facts when a later stage fails. A completed operation does not imply the page is still idle; a currently idle page does not prove that operation completed.

**CENV-03 — action availability.** Resolve Send and Stop separately. For each report `present`, `visible`, `enabled`, `unique`, and contextual readiness as `true | false | null`, plus identity, UTC, freshness and reason. `null` means not established. Observed availability is separate from authorization. Do not infer Stop from not-Send, Send from not-Stop, or completion from either control's absence. Contradictory controls and ambiguous targets block actuation rather than select a priority winner.

### Required behavior and invariants

- **CENV-04 — observe before acting:** check exact binding/page, current state, empty/readable composer, unique permitted control, durable guard and valid Bus authority before fill. Never erase an existing draft or use a new tab to evade a draft/lock.
- **CENV-05 — prepare and recheck:** verify the prepared outbound text, target and readable conversation continuity before activation. Replace reliance on a single fixed setup delay with bounded condition checks. Waits may observe readiness only while the original explicitly admitted operation remains active; a terminal refusal/reconciliation never resumes on its own. No new external trigger or reconnect can release a deferred send.
- **CENV-06 — one activation:** use the existing single activation path. Record its method and attempt separately from effect confirmation. Do not add Enter after an uncertain click or click after an uncertain Enter. The default repair does not introduce CDP, UIA, Playwright, Puppeteer or Orca.
- **CENV-07 — positive submission evidence:** require a new matching user turn after the operation baseline, in the intended conversation and with the expected complete outbound identity. A click return, composer clearing, URL change, transport ACK or legacy `submitted:true` is insufficient.
- **CENV-08 — response evidence:** preserve task-bound start/end transitions and paired assistant candidate evidence. Settling requires observed generation end and stable candidate for the existing 750 ms settle interval. Absence of Stop on an idle page cannot reconstruct missing start/end history. Provider DOM evidence must not be represented as hidden platform final-channel metadata.
- **CENV-09 — bounded observation:** distinguish submission-confirmation time from response-observation time. The current split submit path passes its 20,000 ms work budget as the page's entire task budget; a longer CLI wait does not extend it. The repair must explicitly carry a response observation budget, initially 180,000 ms with the existing 300,000 ms ceiling, without changing submit RPC's bounded first-receipt purpose. Polls cannot renew deadlines. The 400 ms setup constant is current implementation, not proof of readiness or a required minimum wait.
- **CENV-10 — truthful diagnostics:** retain original failure stage/reason alongside reply-validation reason. A pre-activation refusal must not be reduced to `generation_incomplete`. Preserve `click_attempted`, `submission_observed`, continuity and prior known facts end-to-end. Legacy `submitted` stays documented as possible submission where compatibility requires it; new consumers must use precise facts.
- **CENV-11 — recovery:** uncertainty never causes a resend, alternate activation, new operation identity, rebind, automatic draft clear, lock disposal or implicit extension reload. Reconnect observes the same operation read-only. Lost page identity or transition history remains unknown. Owner disposal is an explicit separate action, not proof of no effect.
- **CENV-12 — freshness:** current readiness observations have a target freshness window of 2,000 ms; older data is STALE and cannot authorize actuation. This is a contract target, not a measured performance claim. Recheck immediately before activation. UTC is for receipts; elapsed bounds use a monotonic clock. Historical operation evidence remains historical, not invalidated merely by age.
- **CENV-13 — minimal evidence:** record bounded metadata, identities, timestamps, lengths/hashes, stage/reason and observation method. No credentials, cookies, private transcripts or bulk DOM snapshots in Git, ordinary logs or research artifacts.
- **CENV-14 — Stop semantics:** observing Stop availability is read-only. Activating Stop requires its own explicit authorized action, can fail or be uncertain, and never undoes a sent user turn or authorizes resending it. This repair must not silently add a new Stop RPC or widen Bus cancellation capability.

### Current ownership and source-grounded gap map

Source baseline: `231926a17f3bed81312e76a81b0f7e6aa11af415`; line anchors are at that revision. No new runtime test is claimed by this planning pass.

- `extension/src/chatgpt/content.js` (complete read, 1,111 lines): `sendState()` at 381-395 is a limited snapshot; Stop is unscoped selector presence. `activate()` at 891-921 rechecks baseline/editor/text/URL/control and only then sets `clickAttempted` at 914. `submit()` at 923-965 fills then schedules activation after 400 ms. Missing: complete action-state contract, bounded readiness observation, precise failure projection and separate response budget.
- `extension/src/background/chatgpt-port.js` (complete read, 2,561 lines): worker dispatch, first receipt, observe/reconcile and sanitization. `submitTurn`/`observeTurn` can expose `submitted:true` for uncertain outcomes; `pageRefusalReason()` at 2410-2416 prioritizes verdict over underlying observation reason; `armFacts()` omits that reason. Missing: lossless diagnostics/current-state propagation and explicit split timing contract.
- `extension/src/chatgpt/correlate.js` (complete read, 820 lines): strict reply acceptance. Its incomplete-generation rejection is valid as an acceptance check but is not an actuation root-cause diagnosis. Do not loosen correlation/completion checks to repair Send.
- `extension/src/lib/chatgpt-tasks.js` (complete read, 706 lines): durable operation guards and observer metadata. Preserve its existing keys, tombstones and lock semantics; additive evidence/schema changes require compatibility tests, not a journal reset.
- `extension/src/background/service-worker.js` (complete read, 1,530 lines): endpoint allowlists, sender checks and worker routing. Propagate only explicitly allowed observation fields; do not expose privileged page control as a generic command.
- `extension/src/bus/adapters/chatgpt.js` (complete read, 193 lines): target resolution, framing and result mapping. Its result currently reduces generation-incomplete refusal to reply-partial. The semantic gap is diagnostic loss, not permission to infer no send.
- `extension/src/lib/command-deadlines.js` (complete read, 162 lines) and `velocity/src/browser/remote-call.mjs` (complete read, 41 lines): command budgets and transport uncertainty. A CLI wait, RPC timeout and page observation deadline are different clocks.
- `extension/tests/content-turn-engine.test.js` (complete read, 359 lines) and `tests/fixtures/chatgpt-page.js` (complete read, 144 lines): deterministic modeled behavior. The fixture uses stable editor identity, immediate insert success and fake click events; it does not prove live React/editor behavior.

### Proven incident boundary and unresolved questions

Operation `2f6k2b046i6o02234j1h` dispatched at `2026-10-20T09:51:51.395Z` and became unresolved at `09:51:52.133Z`. Owner observed a filled unsent composer. Recorded observer facts: no click attempt, no matching submission, no generation start/end, continuity false. This locates the failure before recorded activation; it does **not** establish a failing click implementation, stale selector, Enter requirement, or which pre-activation guard failed. The reason may still exist in the durable observer record; investigate through an already permitted read-only evidence path before changing behavior. Do not touch the unresolved prompt during this planning pass.

Planning decisions: keep the three axes separate; retain exactly-one target and no-resend; repair the existing vertical slice rather than transplant VIVIM engines. [Harvest findings](./harvest/FINDINGS.md) are external concept candidates, not authority. Unverified source claims and stale selectors cannot become requirements by repetition. Still open: current live control evidence, original pre-activation reason, response-start/end signal reliability, and measured observer survival. Unknowns must remain explicit until evidence resolves them.

Contracts: [ENVELOPE-CONTRACT.md](./ENVELOPE-CONTRACT.md). Acceptance: [FALLBACK-AND-ACCEPTANCE.md](./FALLBACK-AND-ACCEPTANCE.md). Ordered implementation plan: [OPENCODE-BUILD-ORDER.md](./OPENCODE-BUILD-ORDER.md). These documents define the target, not completion. Implementation starts only after owner review of this planning pass.

---

## Historical architecture and proposals (retained)

> **2026-10-19 DIRECTION NOTE (PROPOSED):** Owner direction for **Bus V1 (commander loop)** and **Bus V2 (local executors, OpenCode first)** is recorded in [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) and summarized in [section 11](#11-bus-v1v2-direction--commander-channel-and-agent-fleet-proposed) below. It narrows, but does not yet adopt a change to, the "no page-to-shell authority" and "no autonomous driving of chatgpt.com" rules. Nothing there authorizes a live send.

> **2026-10-19 reading guide:** The original design and implementation-status assertions below are preserved as history, not a current installation report. See [Proposed incremental messaging upgrade — 2026-10-19](#proposed-incremental-messaging-upgrade--2026-10-19) for the source-grounded baseline and proposed next slices. Neither this document nor that proposal claims accepted M1 or authorizes another live send.

> **2026-10-17 IMPLEMENTATION DIRECTION:** This is a **proposed general-purpose design**, not evidence of installed Chrome relay. Current AION M1 execution target is the official **Windows master** (not BFF Linux). Inspect/reuse the already-uploaded ACPX MV3+Bun kit before authorizing an independent extension build; ACPX code is not currently in the GitHub repository. For shortest-path live M1, do not require side panel, role launcher, generalized native host, SQLite or multi-provider bus first. See [current Windows M1 architecture](../../canon/AION-M1-WINDOWS-MASTER-EXECUTION.md) and [experiment/evidence index](../../canon/AION-M1-EXPERIMENTS-AND-METHODS.md). No Playwright/Puppeteer. The host/browser stop order remains active absent specific restart authorization.

Date: 2026-10-16
Status: PROPOSED DESIGN / NOT INSTALLED OR RUNNING
Executive owner: Role 05 (Chief of Chiefs); execution coordinator: Role 03 (Chief of Staff); technical tooling owner: Role 06 (TOOLSMITH, pending live session)
Seed: UAH/ACP + IANG/SQLite + OpenCode/ZCode + GitHub + AION role sessions. No separate repository or competing event bus.

## Mission
A Chrome Manifest V3 extension is the *browser-facing edge node* of an extensible AION communications bus. Its purpose is to make task dispatch, agent visibility, receipts, context re-entry, and approvals frictionless while the durable executor continues off-tab. Keep eight designed standing ChatGPT role contexts (06–08 require live-session confirmation) easy to reopen; never claim they independently think while idle. Chrome keep-alive refers only to an extension transport, not a ChatGPT model turn.

## Architecture / authority
User in chatgpt.com or Chrome side panel -> extension UI + explicit user-action content adapter -> MV3 service worker -> native messaging host `com.aion.relay` -> UAH ACP client/router -> ZCode/OpenCode authorized runtimes -> signed/hashed evidence -> IANG SQLite outbox/inbox -> existing GitHub AION authoritative PM receipts.
The existing UAH (universal ACP hub) owns transport and capability discovery; SQLite/IANG owns durable local routing metadata; GitHub is the durable cross-machine task/evidence coordination channel. Do not duplicate the bus.
An optional *explicitly configured* authenticated localhost wss/ws service is fallback transport; it has no authority beyond the native relay. Keep GitHub credentials, provider/API keys and ACP privilege tokens outside the extension, inside the OS secret store/native runtime. Windows local machine remains human master; Linux BFF is a separate executor/operator, never an authority override.

## Chrome implementation
- MV3 `background.service_worker`: event-driven, persistent state in chrome.storage.local/IndexedDB as appropriate, alarms/restart hooks, idempotent reconnection; do NOT assume immortal JavaScript globals.
- `sidePanel` or extension popup: eight role tiles (show pending launch states truthfully) (tab open/stale/unknown), relay connection status, current executor activities, outbox, receipts, approvals, manual reconnect and pause.
- `tabs`/optional permission and user-selected site access: remember role tab URLs locally; open/focus tabs on user action; recover last known GitHub-backed context capsule.
- Minimal optional content script on chatgpt.com: only selected text or user-clicked 'Send to AION' capture; never mass-read transcripts, cookies, credentials, or undocumented page internals. Drafting into ChatGPT composer requires a clear user gesture; automated prompts are NOT a baseline capability.
- Host native messaging: `chrome.runtime.connectNative` with locked `allowed_origins`, fixed extension ID, OS-installed host manifest. Length-framed JSON transport. Never accept web-page message as a command without capability authorization in native host.
- Native bridge (Bun/Node or existing approved implementation, OpenCode/ZCode-authored) implements ACP client JSON-RPC, storage, GitHub sync, local agent routing, and adapter to OpenCode's supported `acp` or `serve` interface according to capability negotiation; Chrome is not itself the ACP agent.
- ACP negotiation: initialize/version/capabilities; supported session/new, resume, prompt, update, cancel; feature-probe actual installed version, do not assume ACP v2 semantics in a v1 runtime.

## Role model
Chief/Planning/CoS/Efficiency/Dashboard/TOOLSMITH/INTAKE/Z-FORGE are *named human-facing role contexts*, NOT eight independent continuously executing ChatGPT web-app processes. Mapping: role_id -> approved chat URL + canonical GitHub capsule + assigned runtime identity (if any) + last evidence time.
Future autonomous workers use ACP sessions with explicit authorization, and may send role-directed events that the extension shows. *(2026-10-19: roles become the initial entries of an agent registry with genealogy; see section 11.)* ChatGPT tab presence remains UI metadata; backend workers' liveness is verified separately.

## Authority model
A read-only watch can be automatic; changing repo files, running shell, accessing browser content, starting an agent prompt, or sending a message into ChatGPT must pass existing authorization and task policy. MVP sends structured tasks to *approved local ACP runtimes*; does not autonomously drive chatgpt.com. *(Bus V1 proposes one bounded exception, the commander channel; see section 11 and the decision record.)*
Trust boundaries: webpage is untrusted; content scripts cannot grant privileges; extension origin pinned; local host authenticates source/target and checks path/command scope, replay/nonce, rate, timeout. Sensitive payload opt-in and data minimization. No transport ever weakens a host stop order.
No auto-execution from GitHub issue comments. Grok Bot operates Linux/test/verification but must never author/modify code: code goes to OpenCode/ZCode.

## Workflow
1. User highlights text or presses side-panel 'Create task'; choose role/executor, scope, approval.
2. Extension creates provisional task with idempotency key and local outbox sequence.
3. Native relay resolves target ACP endpoint and permission; ACK of transport is not ACK of execution.
4. Executor produces ACCEPTED -> STARTED -> PROGRESS -> PROOF_SUBMITTED, referencing artifacts and hashes.
5. Independent verifier emits VERIFIED or REJECTED; GitHub stores durable canonical receipt.
6. Extension shows newest timestamp, staleness, exact evidence URL, and ability to reopen appropriate ChatGPT role for decision.
7. On disconnection, retry using state machine in FALLBACK.md; never duplicate non-idempotent execution.

## Rollout
M0: Chrome extension side-panel read-only dashboard from *synthetic/local fixture* + manual reconnect; no browser injection.
M1: Real native messaging handshake to read-only ACP capability/status and GitHub evidence; demonstrate restart recovery.
M2: Single user-approved scoped task -> OpenCode ACK -> implementation -> negative test -> independent proof receipt (Task-to-Proof).
M3: Cross-machine BFF Linux evidence sync and fallback, then opt-in role task rehydration; only after hard tests.
M4: IANG graph projections, multiple adapters, provider-aware work routing.
Maintain one repo branch main (per current AION operating rules); no new long-running service merely to keep tabs alive.

## Non-goals for v0.1
- No perpetual ChatGPT model activity, automated login/session-renewal, captcha/cloudflare bypass, rate-limit evasion or undocumented ChatGPT API.
- No general browser content harvesting, silent prompt submission, privileged shell execution through injected pages, or free-running agents from untrusted messages. *(Section 11 proposes a single owner-armed exception for Bus V1; unchanged otherwise.)*
- No second platform or Slack; existing GitHub/UAH/SQLite canon remains.

## Official technical references
Chrome MV3 lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
Chrome WebSockets: https://developer.chrome.com/docs/extensions/how-to/web-platform/websockets
Chrome native messaging: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
ACP overview: https://github.com/agentclientprotocol/agent-client-protocol/blob/main/docs/protocol/v2/overview.mdx

## RL-001 extension feature: role launch by keyword
The [role launcher](./role-launcher/README.md) is an additional UI feature of this **same** MV3 relay extension. An explicit keyword in Chrome omnibox/sidepanel (and optionally exact composer command + user-confirmed launch action) creates one new ChatGPT tab, generates a role bootstrap manifest from [ROLES.json](./role-launcher/ROLES.json), then observes distinct real chat creation, workspace read ACK and actual title result. Native conversation rename UI is not assumed supported; manual fallback is required. [GitHub issue #22](https://github.com/owenservera/aion/issues/22). Never create a second extension or equate a new tab with an initialized agent.

## Proposed incremental messaging upgrade — 2026-10-19

**Status: implementation-ready consolidated technical/UX proposal, NOT approved, implemented or deployed by this document.** Owner direction permits designing the full flow in parallel with finishing the existing extension; it is not a broad-upgrade execution instruction. Timeout repair is a separate lane. The designer lane has delivered its UX specification, consolidated in section 9 below; design approval and implementation remain pending, and the coordinator owns readback and final acceptance. The historical general-purpose bus/native-host architecture above is not a prerequisite for these slices: reuse the current extension, its existing native connection where needed, and `chrome.storage.local`. No new bus, daemon, database, repository, or perpetual tab process.

### 1. Verified baseline and limits

**Implemented offline, 2026-10-19T11:55:06Z (phases 0-2 complete; phase 3 UI deferred):** command-derived deadlines, durable operation/conversation guards, the page-side submit/observe engine and its worker hookup are in the working tree with coordinator-verified **528/528** extension tests. Two independent review rounds closed a conversation-lock wedge, a lost refusal reason and a false read-only `submitted:false`. Remaining known gaps: no reconcile endpoint for a terminal-not-accepted lock, `expected_reply_token` is not durable, no panel controls reach submit/observe, and nothing is proven against a real MV3 restart or page reload. No live send, accepted envelope or M1 acceptance follows from these receipts; see the existing live-attempt receipt for per-slice counts and UTC times.

**Earlier offline slice, 2026-10-19T10:16:08Z:** the fixed worker guard has been superseded by shared `resolveCommandDeadline` and `createBoundedLifecycle`. Command-specific stage/absolute budgets cover hydration through settlement; the panel derives its response deadline from the same policy. No inactivity renewal exists in the single-reply protocol. Coordinator full suite: 402/402 passed; independent source review found no blocking P0/P1/P2 finding. This does not implement durable submit/observe or prove live Chrome behavior. See the existing live-attempt receipt's command-derived lifecycle section; earlier numeric snapshots below are historical.

**Later offline correction, 2026-10-19:** after the source inspection below, the coordinator changed worker run/guard/panel constants to 300,000/330,000/360,000 ms (page ceiling unchanged at 300,000 ms) and ran the full extension suite: 371/371 passed, no failed/cancelled/skipped tests. See the appended offline correction in the existing live-attempt receipt. This supersedes the numeric pre-fix snapshot below, not its historical live verdict; no browser verification or M1 acceptance follows.

Source inspection for this proposal on 2026-10-19, rather than code comments or the older status banner, establishes:

- The extension has worker `aion/chatgpt-run` and `aion/chatgpt-read` handlers, a worker-side port driver, page-side `run-turn`/`read-final`, a strict correlator, and a panel probe. This is not a greenfield send adapter.
- The live-attempt record includes a **real send and real matching assistant reply** on 2026-10-18. The adapter refused it as `generation_incomplete`; the 2026-10-19 offline recovery correctly retained that refusal. A later non-generating page state is not the missing start/end transition. **No accepted M1** follows from that record, and the record says the authorized single-send budget was consumed.
- Numeric constants at inspection were worker run **120,000 ms**, worker port ceiling **150,000 ms**, page ceiling **300,000 ms**, panel wait **180,000 ms**. The correlator's default wait is separately 180,000 ms; the page receives the worker-clamped budget. Some newly written comments describe proposed 300/330-second worker values and a completed fix, but those assertions do not match the inspected numeric constants. The separate timeout lane must establish the eventual code/test result; this document does not claim it.
- `runTurn` requires a gesture assertion, a nonempty bounded `approved_scope_ref`, bounded text (worker maximum 8,000 characters), and a correlation ID. The panel has its own smaller prompt limit (2,000 characters). A nonempty approval reference is **not validation of the referenced grant's scope, target, remaining send count, or validity**. This proposal grants nothing and does not reuse the consumed one-send authorization for arbitrary tasks.
- Existing dispatch storage uses `DISPATCH_KEY = aion.relay.chatgpt.dispatch.v1`, `DISPATCH_SCHEMA = aion.chatgpt.dispatch/0.1`, and `IN_FLIGHT`/`COMPLETED` reservations keyed by correlation ID. Those records are useful no-resend tombstones, not evidence that submission or reply completion occurred. Current gaps include missing-storage writes returning false, malformed/unknown storage being treated as empty, and un-serialized read/modify/write reservations; an in-memory tab set is not a durable conversation lock.
- Current `read-final` accepts a caller's `generation_complete` assertion. That is not independent completion evidence. Current page `run-turn` clicks before starting its polling wait; firing click events does not itself prove a sent user turn. The proposed engine must close both gaps without weakening correlation.
- The role registry defines eight named contexts but has null session URLs. A tab's existence or label is not a verified role binding, initialized context, reasoning activity, or an independently running agent.

These are source/evidence observations, not a browser inspection or deployment verification performed by this writer. Chrome lifecycle details (worker suspension, port survival, page observer survival across each reset) remain **unknown until tested on the actual supported Chrome configuration**. Do not turn folklore about 30-second or five-minute lifetimes into a design assumption or keep-alive promise.

### 2. Target contract and non-negotiable invariants

Target: **arbitrary bounded owner instruction → explicitly bound named role → authorized one-shot submission → observed completion → checked actual reply → actual consumer readback**, without the owner copying prompts, correlation markers, or replies between tools. “Arbitrary” means task content is not restricted to the existing probe template; it does not mean arbitrary permissions, unbounded payloads, hidden API access, or automatic execution of reply instructions.

1. **No blind resend on unknown.** Timeouts, transport loss, worker/panel closure, malformed storage, and missing observer evidence never cause replay. Reconnecting to observe is not submitting again.
2. **Facts outrank phase labels.** Persist what was observed, what was merely attempted, and what is unknown independently. A legacy `submitted:true` or transport ACK must not be upgraded into DOM-observed submission. A terminal dispatch tombstone means “do not resend,” not “the model finished.”
3. **No completion from caller boolean.** Only the trusted adapter's task-bound observation record can supply generation start/end evidence. `generation_complete:true` from a caller is ignored/rejected as proof, including through compatibility wrappers.
4. **No page-to-shell authority.** Page text, task replies, correlation markers and consumer readback are untrusted data. They cannot select a shell command, widen a grant, route to another privileged target, or start an agent. Any later execution is separately policy-checked through the existing authorized host path. *(2026-10-19: the only proposed exception is the owner-armed, allowlisted, scoped commander channel in section 11; it is PROPOSED, not adopted, and does not apply to any other path.)*
5. **No exactly-once promise.** Browser dispatch and local storage do not form one atomic transaction. Prefer a safe unresolved reservation (possibly no send) over duplicate side effects. The guarantee sought is guarded single dispatch per approved operation, with explicitly represented uncertainty.
6. **Consumption is not M1 acceptance.** A routine local consumer may demonstrate readback without appointing an independent reviewer for every task. Real M1 still needs its canonical AION-origin, authenticated exchange, independent readback/evidence check, negative case and verifier acknowledgment. Security-critical boundary changes retain independent review requirements.

### 3. Identity, binding, and local records

Use separate identities with explicit meanings:

| Field | Proposed meaning |
|---|---|
| `task_id` | Durable draft/task identity; survives panel closure and retries of local RPCs. |
| `operation_key` | Immutable identity of one approved send operation; allocated before approval/submission and bound to task revision, payload hash, target and approval. Repeating a submit RPC uses this same key. |
| `correlation_id` | Per-dispatch-attempt marker for the existing adapter/envelope; not permission to create another operation. A fresh correlation ID must not bypass an operation tombstone or unresolved conversation lock. |
| `role_id`, `binding_revision` | Named registry role and explicit binding version chosen/confirmed by the owner. |
| `conversation_key` | Stable local lock identity for the approved conversation, shared across tabs showing it; never just a transient tab ID. |
| `page_instance_id`, `observer_id` | Adapter-created identity of the particular document and task observation session; neither is accepted from page content as authority. |
| `consumer_id`, `delivery_id` | Intended receiving local runtime/session and one readback delivery, separate from browser dispatch. |

Proposed richer local task record: version, revision, identities above, owner-source reference, payload hash/character count/local payload reference, approval reference plus future validated scope result, target binding, phase, UTC transition timestamps, deadlines, independent fact/evidence fields, last machine-readable error, reply hash/length/local reply reference, check verdict, and consumption receipt reference. Do not overload the relay envelope's existing task/delivery enums with these new phases; map checked output into the existing envelope and keep the richer lifecycle in its versioned task record.

An explicit binding records role ID, approved origin/path or locally held conversation reference, current tab locator, confirmation method/time, and binding revision. A missing, stale, or ambiguous binding asks the human to resolve the target; **never choose the first available ChatGPT tab**. A new-chat binding uses a locally unique provisional conversation key until an observed conversation reference is available; alias it to the final key under the same serialization gate, retaining the provisional lock. If tab aliases cannot be resolved safely, refuse concurrent new-chat submissions rather than assume independence. Navigation or role rebinding invalidates READY/approval targeting until rechecked; it cannot silently redirect a reserved operation.

Keep drafts locally, revisioned and recoverable, including when a target is missing or approval is pending. Preserve the existing empty/exactly-one-composer rule and recheck immediately before fill/click. A new tab is not a clean-draft workaround: the live record observed ChatGPT drafts syncing across tabs. Never erase an existing or unreadable draft automatically. A task edit after approval changes its revision/hash and requires revalidation/reapproval. Cross-panel updates subscribe to local storage changes and request authoritative state; stale revisions receive a conflict, not last-writer-wins submission.

### 4. Durable lifecycle and uncertainty

Normal proposed progression:

`DRAFT → APPROVAL_PENDING → READY → SUBMIT_RESERVED → CLICK_ATTEMPTED → SUBMISSION_OBSERVED → OBSERVING → REPLY_CHECKED → CONSUMED`

| Phase / outcome | Required facts and permitted behavior |
|---|---|
| `DRAFT` | Text/source retained locally within policy; no send authority inferred. |
| `APPROVAL_PENDING` | Scope/target/count decision missing; no compose or submit. |
| `READY` | Exact revision, binding and applicable approval checks pass; still no dispatch. |
| `SUBMIT_RESERVED` | Legacy reservation and richer task/lock record durably acknowledged before any send-capable message; replay prohibited even if later steps never happen. |
| `CLICK_ATTEMPTED` | Adapter reports that the single activation sequence was attempted; delivery to the service remains unknown. A pre-click write records activation intent separately so a crash between click and receipt cannot look like no send. |
| `SUBMISSION_OBSERVED` | Observer identifies a **new matching user turn in the intended conversation after the pre-send baseline**, using full outbound hash/normalization rules plus correlation and turn ordering; not just composer clearing, a new URL, click success or an old matching turn. |
| `OBSERVING` | Task-bound observer has submission evidence and is awaiting/recording generation start/end and the paired assistant final candidate. Fast events may already have been buffered. |
| `REPLY_CHECKED` | Completion evidence, pairing, provenance, correlation/marker, echo rejection, payload integrity and schema checks pass. Says nothing yet about consumer delivery or correctness of all substantive advice. |
| `CONSUMED` | The named actual consumer received the checked reply and returned validated readback tied to its hash/delivery; not merely shown in the panel or logged as metadata. |
| `REFUSED_NO_SUBMIT` | Positive adapter/pre-dispatch evidence establishes no activation/submission; record whether fill occurred and preserve any remaining draft. Never derive this outcome from silence. Reservation/tombstone history remains. |
| `NEEDS_RECONCILIATION` | Outcome/evidence incomplete, deadline expired, record conflict, or reset interrupted observation. Preserve every prior fact and lock; allow status/read-only recovery, not resend. |
| `REPLY_REJECTED` | Candidate was checked and refused, with a machine-readable reason. Preserve submission/observation facts; rejection does not undo a send or authorize another one. |

Phase is a projection of the available facts, not a destructive enum assignment. Store at least activation intent, `click_attempted` (true/false/unknown), matching-user-turn observation, generation-start observation, generation-end/settle observation, candidate identity/hash, observer continuity, and check/consumption results with UTC and evidence method. Distinguish “false with affirmative evidence” from “not reported.” If page facts advance faster than persistence, preserve their ordered event sequence and replay only those facts into storage, never the activation. Missing intermediate acknowledgments move to reconciliation unless continuity can be established.

Reconciliation is read-only by default: inspect preserved facts, recover a surviving observer, inspect an explicitly unverified candidate, or record a human disposition with its evidence. It cannot delete tombstones, mint a replacement ID behind the scenes, or accept a missing completion observation. A legitimate explicit repeat is a **distinct owner-approved operation**, linked by `repeat_of`, with its own operation key and fresh authorized send count. It is only allowed once prior uncertainty is resolved and the conversation lock is safely released; a different marker alone is not a repeat approval.

### 5. Reservation algorithm, migration, and rollback

**Phase 1 safety boundary:** all mutating requests, including legacy run-turn, enter one worker-owned serialization gate. Panels, content scripts, and native callers must not write reservation/task state directly. Use a single queue covering the read/check/reserve/persist critical section (and the common read/modify/write ledger); a per-operation queue alone cannot protect a shared ledger map. Serialize role-binding/task-revision changes affecting submission too. Storage revision checks detect unexpected writers but are not a substitute for a single writer or a nonexistent storage compare-and-swap.

Inside the gate:

1. Read and strictly validate the entire relevant existing ledger, richer task records, locks and versions. Distinguish verified absence in a usable store from errors, malformed wrappers/records or unknown schemas. No storage API, thrown read, unsupported schema, corrupt record, inconsistent index, quota/full lock store or unverified persistence means **refuse new sends**, never start with an empty map.
2. Check immutable operation identity, task revision/hash, binding, approval and remaining count; check **both** all legacy correlation tombstones and operation tombstones, plus the pending conversation lock. A different tab or correlation must not bypass a pending task in the same conversation. Conservative unresolved legacy records must block matching targets; if their target cannot be mapped safely, block sends until explicit migration reconciliation rather than assume no conflict.
3. Build the reservation and consume/reserve the authorized send allowance in the richer record. **Write the original-format legacy `IN_FLIGHT` record first**, preserving every existing entry; await storage success. Then write the richer versioned record containing operation index, task detail and conversation lock as one coherent value, and await success. Only after both writes succeed and their acknowledged state is validated may the worker dispatch one send-capable request. Never use a fire-and-forget write or a false return value as durability proof.
4. If the second write fails/crashes, the legacy tombstone remains and boot reconciliation treats it as unresolved. If dispatch, activation receipt or final-state writes fail, keep prior records and stop new conflicting sends. Completion writes may make the legacy entry `COMPLETED` for compatibility, but never clear it. Failure to persist checked evidence must not be reported as a durable checked/consumed result.
5. Release the conversation's active lock only after a positively resolved task outcome is durably recorded (normally checked/consumed; an observed terminal rejection/no-submit can be explicitly disposed). Never release merely because a port timed out or a panel reconciled its own display. Permanent operation/correlation tombstones remain after lock release.

Retain **exactly the current dispatch key and schema**: `aion.relay.chatgpt.dispatch.v1` / `aion.chatgpt.dispatch/0.1`. Keep **ALL original `IN_FLIGHT` and `COMPLETED` entries**, their original IDs and original fields; do not replace the ledger with only active work, reinterpret `COMPLETED` as accepted, or silently repair unknown data. Introduce a separate proposed key, `aion.relay.chatgpt.tasks.v1`, with explicit proposed schema `aion.chatgpt.tasks/1`, in the **same `chrome.storage.local` area**. This new key holds task detail, operation index, locks and migration metadata without changing what an older dispatch reader expects. Final key/schema names are proposed contract choices, not existing source constants.

Migration runs under the same gate before enabling sends: validate legacy bytes, preserve them, index known historical correlations, mark ambiguous entries unresolved, then persist/verify the richer migration version. Missing richer records alongside existing reservations are incomplete migration/crash evidence, not free operations. There is no invented operation identity for a historical prompt whose meaning is unavailable. Startup reconciles each write-boundary crash conservatively; idempotent migration never drops a legacy entry. Bound retained payloads/replies, **not no-resend records**. No automatic terminal-tombstone purge, age-based unlock or size-based eviction; if permanent guard storage reaches its bound/quota, refuse new sends pending an explicit safe archival/upgrade decision.

Rollback preserves both keys. With unresolved tasks, a rolled-back extension must be **read-only** unless the old version itself includes the stable-operation/conversation guard and compatible migration checks. The original schema protects reused correlation IDs only: **it does not prevent a fresh-ID repeat**. Do not claim otherwise or rely on hiding a panel button. Stage rollback with sends disabled and verify the executing version; a code rollback cannot recover page observation evidence or undo a real send.

### 6. Submit/observe engine and compatibility

Implement one internal engine in the existing worker/page adapter, not two send implementations. Proposed internal operations are `prepareTask`, `reserveSubmit`, `submitOnce`, `observeTask`, `readTask`, and `deliverCheckedReply`; names and RPC exposure need contract review. `observeTask`/`readTask` contain no path to composer fill, send activation or replay. Sender/origin checks and strict allowlists remain at every existing boundary; ordinary page tabs must not become privileged extension callers.

Before any activation, the page adapter establishes an observation session for the reserved task: verify target/page identity, snapshot ordered turn baseline, arm task-scoped DOM/generation observation **before click**, and acknowledge its identity. The worker persists the armed-session/activation-intent facts before issuing the one-shot activation permission. Recheck composer/draft/control and target immediately before activation. Buffer ordered matching-user-turn, generation-start, generation-end and final-candidate facts even if generation is very fast. The observer remains bound to the original page, correlation and outbound hash; no “last assistant in whichever tab” shortcut.

The post-click report distinguishes `click_attempted` from `submission_observed`. Clicking a disabled/no-op control, dispatching DOM events, composer emptiness or a transport ACK cannot prove submission. A matching user turn is a submission fact, not proof that the assistant completed. Generation must be observed starting and then ending with the configured settle period, paired to that submitted turn. If the DOM adapter cannot reliably discriminate assistant final output from other blocks, reject/mark unknown instead of treating all markdown as authoritative final-channel metadata. Do not invent platform message IDs: use available observed turn references/baselines and explicitly state the evidence method.

Legacy `aion/chatgpt-run` and page `run-turn` remain wrappers over **this same engine** for bounded probe compatibility. They resolve/create a stable operation before any send, pass the same guard, submit once and wait up to their finite budget; they cannot bypass new locks or choose a new operation on RPC retry. Preserve expected legacy response fields while adding precise facts; legacy `submitted:true` is at most “submission may have been attempted” unless explicit observed evidence accompanies it. Legacy reads become read-only engine queries; a supplied `generation_complete` boolean cannot manufacture an accepted result. Existing strict probe marker/challenge verification remains available unchanged in intent.

**Reset/resume rules:**

- Panel closure/reopening: render durable task state; reattach to status/readback, never resubmit.
- Port loss or worker restart: reserve records survive; reconnect **read-only** to the same page observer if it survived and proves matching page/session/task identity and continuous retained start/end evidence. Persist recovered facts before reporting a checked result. No port reconnect carries an activation command.
- Full page reload, navigation, browser/host restart, or lost observer session: start/end evidence that was never durably recorded is **not recoverable by looking at a now-idle page**. Keep `NEEDS_RECONCILIATION`/unknown. A matching current reply may be retained locally as an **unverified candidate**, not accepted proof. Never set completion from a caller flag, offline counterfactual or absent stop button.
- If complete task-bound evidence was already durably checked before a reset, it remains available for readback delivery; that is reuse of evidence, not retroactive reconstruction.

Use absolute bounded observation deadlines plus injected monotonic elapsed-time measurement in tests; clocks/UTC are evidence timestamps, not permission to retry. Page run budget must fit inside the worker exchange budget (including grace), which must fit inside the panel's wait with margin when using the legacy blocking wrapper. Split observation may span multiple bounded read-only calls but cannot secretly extend a task's approved observation bound. A deadline is an observation cutoff, not a cancellation of an already sent prompt. Stop-generation, if offered, is a separately authorized page action and never means undo/send again.

### 7. Arbitrary tasks, approvals, and actual consumption

Phase 3 accepts locally created bounded task text and an explicitly selected role. Generate correlation/expected marker and a small reply protocol wrapper automatically, so the owner enters the task once, not a probe ID/token/template. Bind the exact rendered outbound payload hash (including wrapper) into approval and reservation; keep the owner's original text separate so it is not silently rewritten. Enforce one documented end-to-end payload bound across panel, worker, adapter and storage; initially do not widen the worker's existing 8,000-character bound without explicit implementation review. Oversize tasks/replies are refused or explicitly marked incomplete for local handling, never silently truncated and delivered as a full answer. Check correlation on the full permitted reply before applying retention limits; disclose any retained-copy truncation and do not mark a truncated consumer payload as full readback.

The proposed reply contract is an assistant final response with task/correlation marker and answer body. Verify origin/pairing, continuous completion evidence, full-token correlation, expected marker, foreign-marker rejection, echo rejection, and reply hash before `REPLY_CHECKED`. A marker proves correlation, not semantic correctness or authority. Substantive task completion can require task-specific checks/consumer judgment; an honest refusal by the model is a real checked reply but not proof the requested work succeeded.

Local payload policy must define allowed content, sensitive-data opt-in, per-item/total size, local access, retention and deletion; default to minimal task-specific text, no bulk history, credentials/cookies/tokens or hidden page/bootstrap reads. `chrome.storage.local` is not a secret vault. Exclude raw prompts, private replies, drafts and candidate previews from Git, issue receipts and ordinary logs. Expiry/deletion of payload text must leave immutable hashes, operation/correlation guards and necessary lock/evidence metadata; if evidence needed for checking has expired, report unavailable rather than guess.

Proposed approval checks resolve a traceable owner grant into target origin/conversation/role, exact payload or approved scope, allowed action, send count, and any explicit validity/expiry limits. Count reservation and operation identity are persisted before send so crashes cannot replenish authority. Missing/ambiguous/exhausted grants keep the draft `APPROVAL_PENDING`; nonempty strings and a UI gesture alone cannot pass the future gate. Owner-supervised plain-language authorization remains valid under existing policy; no mandatory new grant template or invented standing multi-send authority. Which scopes may permit repeated task sends is an owner decision, not something this proposal assumes.

Actual consumption path: keep the checked reply in the bounded local payload store, then deliver that **actual content**, with task/operation/correlation, reply hash and check evidence reference, to the selected existing authorized local consumer connection/session. Use the current native/ACP path only after its concrete receiving capability and target identity are verified; do not assume that a working host ping means reply delivery is implemented. If no consumer route is available, remain `REPLY_CHECKED` with delivery pending. A panel display, hash-only event, Git receipt or sendMessage ACK is not consumption, and GitHub cannot wake a ChatGPT context.

The consumer returns `delivery_id`, task/operation identity, reply hash, receive/read UTC, and a task-appropriate checkable readback detail from the received answer (for a probe, the computed answer). Validate it against the locally held checked reply/check rule, not against a caller's `consumed:true` flag, and retain only a minimized/redacted readback or its digest if content is sensitive. Failed readback remains delivery-pending/rejected, not CONSUMED. Re-delivery of already checked content may be idempotently acknowledged by the same delivery identity; it must never trigger another browser send. A consumer reply that requests tools is a new instruction requiring its own authority checks.

Receipts contain schema/version, stable task/operation and correlation references, target/role binding reference, approval reference (not secrets), UTC events, method/provenance, submission and completion facts, verdict/reason, outbound/reply hashes and lengths, actual delivery/readback reference, consumer identity and any independent verifier reference. Keep sensitive URLs/identifiers local or redact/hash as appropriate. Ordinary receipts must not carry raw text; hashes support integrity, not proof of provenance by themselves. A separate independently reviewed M1 receipt must satisfy the unchanged acceptance contract before any M1 status promotion.

### 8. Incremental delivery gates and tests

| Phase | Bounded deliverable / exit gate |
|---|---|
| **0 — finish baseline** | Separate fixer aligns finite numeric deadlines/comments and regression tests, keeping completion/correlation fail-closed. Run relevant existing extension tests offline. A later authorized live check is a separate decision; no new send follows automatically from tests. Record constants/test result honestly, no M1 promotion. |
| **1 — durable reservation safety** | Fail closed on storage absence/corruption/unknown schema; serialize check/reserve/persist; add stable operation identity, durable conversation lock, migration and rollback guards. Route every send entry point through it before exposing richer dispatch. Security boundary review required. |
| **2 — split internals** | One submit/observe engine with observer armed before activation, precise submission facts, continuous completion evidence, read-only reconnect and actual checked-reply retrieval. Legacy wrappers use the same engine, with caller-completion proof rejected. |
| **3 — role/task/readback** | Explicit bindings, arbitrary bounded task text and auto protocol markers, local payload policy, owner-scoped approval checks, verified consumer route and actual-content readback receipt. Implement the consolidated designer UX proposal in section 9 only after design approval and review. No broader send scope without explicit owner approval. |

Required offline/fixture tests for the implementing lanes (this writer did not run them):

- **Deadlines:** actual numeric constants and strict page/worker/panel ordering; clamp boundaries, finite defaults, grace, late reply, start-never-seen, settle flicker and timeout during generation. Comments alone cannot pass a test.
- **Storage:** no API, false persistence acknowledgment, read/write exceptions, quota/full guard store, malformed wrappers/records, unknown schemas, unsupported versions; all prevent send. Concurrent same/different operations in one conversation and whole-ledger concurrent writes cannot lose records or bypass locks.
- **Crash at every boundary:** before/after old-ledger write, richer task/lock write, observer arm acknowledgment, activation-intent write, activation message/click, submission observation, completion capture, checked-reply persistence, legacy settle write and consumption receipt. Boot always preserves known facts and never resends an uncertain operation.
- **Migration/rollback:** all original IN_FLIGHT/COMPLETED records and fields retained; interrupted migration idempotent; old-only orphan locks conservatively reconciled; unknown target blocks safely; rollback unresolved tasks read-only; prove the original correlation-only version cannot claim fresh-ID protection. Payload expiry never removes tombstones.
- **DOM/transport:** click with no user turn; unchanged/disabled/ambiguous control; existing/unreadable/cross-tab-synced draft; page navigation between arm and activation; very fast generation captured before the RPC reply; port, panel, worker and full-page/browser reset tested separately. Surviving same-page observer may resume read-only; lost start/end evidence cannot pass from an idle snapshot.
- **Reply checks:** stale candidate, wrong user-turn pairing, foreign/mixed correlation, nonassistant/user echo, duplicate markup, missing/nonfinal block, partial/oversize reply, forged observer identity, and caller `generation_complete:true` all fail closed as applicable. Positive valid final reply retains actual checked text/hash for delivery.
- **Identity/authority:** fresh correlation or another tab cannot bypass an unresolved operation/conversation; stale revision/rebinding and mismatched payload hash fail; duplicate submit RPC dispatches once; explicit approved repeat uses a distinct operation and valid remaining authority. Nonempty fake approval reference does not satisfy future scope checks; page-provided commands never execute.
- **Consumption:** actual local reply content reaches the named consumer; hash-only ACK, caller boolean, absent route and wrong readback fail. Valid checkable detail permits routine CONSUMED; duplicate delivery is idempotent and never sends again. No routine consumption test promotes M1.

Browser lifecycle/observer-survival tests require a separately authorized bounded live/extension test scope, not Playwright/Puppeteer, Orca, or an unapproved browser restart. Unit tests and synthetic fixtures establish behavior under modeled resets, not real Chrome survival guarantees.

### 9. Delivered designer UX specification — consolidated proposal

**Delivered 2026-10-19; proposal only, not design approval or implemented behavior.** This section incorporates the designer lane's supplied specification; it does not introduce a new aesthetic design or weaken the technical gates above. The actual human-facing HTML entry is [`extension/src/panel/sidepanel.html`](./extension/src/panel/sidepanel.html), **not `panel.html`**; its existing [`panel.js`](./extension/src/panel/panel.js) and [`panel.css`](./extension/src/panel/panel.css) remain the implementation surfaces. Preserve the switchboard identity: ruled sections, existing light/dark themes, local fonts and current colors. No aesthetic rewrite is required.

#### Hierarchy and primary flow

Proposed document order is masthead with Refresh; attention only when a concrete blocker requires action; **Message a role**; durable current tasks; then initially collapsed **Roles & conversations**, **Connection diagnostics**, and **Task evidence**. Refresh reads permitted state; it never initializes the host, reloads the extension, navigates a tab or performs an account action. The primary form has a labeled role select, an arbitrary **Instruction** textarea, a destination/scope/budget summary and **Send to [role]**. Summary values derive from authoritative binding, scope and budget facts, not optimistic placeholders. Count the complete outbound payload, including automatically generated protocol overhead, against the bound. Never truncate to make a task fit.

Readiness automates only already-permitted **nonmutating** checks. Host initialization, reload/navigation, login/account operations and other privileged actions remain separately authorized explicit actions; do not hide them inside readiness or reconnect. Default approval flow is **Approve one message**, then a **distinct Send click** for the exact approved revision/target. Approval is not a queued send. There is **never a deferred surprise send** when approval arrives, a connection returns, the panel reopens or a draft blocker is resolved. Even after those events, recheck state and require the explicit Send action; future multi-send scope needs its own owner decision.

If a role has no unambiguous confirmed binding, offer **Choose conversation**, **View conversation**, and **Use this conversation for [role]** as explicit selection/confirmation actions under applicable permissions. Never infer a binding from the first tab, focused tab, title or role label. Binding confirms destination only, not role bootstrap, reasoning or liveness. Multiple tabs showing the same conversation are one destination and share the same operation lock. Rebinding invalidates pending approval/READY targeting and cannot retarget a reserved operation.

#### Draft persistence and blockers

Draft revision saves must be durably acknowledged before **Saved locally** is shown. During a write show **Saving…**; on failure show **Save failed — not saved locally**, retain the in-memory text and explain the blocked action. Never claim persistence from a scheduled write or storage event alone. Preserve the instruction and its revision after dispatch, refusal and panel reopen, subject to the chosen local payload retention policy; do not carry forward the existing probe's field-blanking behavior into the new task composer. Edits invalidate approval. Concurrent panel edits preserve **both variants** and offer **Review versions**, not last-writer-wins overwriting. A conflict cannot submit until an explicitly selected revision is durably saved, validated and approved.

An existing, synchronized or unreadable ChatGPT composer draft blocks submission with **View conversation** and **Check readiness again**. Do not clear it, append the task, or offer a supposedly clean new tab as a workaround. Draft resolution does not resume a queued send. A storage failure, login requirement, missing/ambiguous target, draft blocker, unknown/exhausted budget, active operation, failed check or unavailable consumer gets a specific attention reason and a permitted next action. Attention is not a permanent generic warning. Copy diagnostics includes minimized facts/hashes/reason codes only, excluding raw instructions, replies, candidates and secrets.

#### Evidence-derived status language

These labels are projections of persisted facts, not new ways to advance the engine. The task card may retain the last confirmed phase alongside a newer uncertainty/blocker; do not erase submission facts when observation fails.

| User-facing label | Evidence / restriction |
|---|---|
| **Draft — not sent** | Draft exists; no send has been reserved/attempted for this operation. |
| **Approval needed — not sent** | Exact revision/target lacks valid applicable scope; no pending automatic send. |
| **Ready to send** | Current revision, binding, budget, storage and readiness checks permit a distinct Send action; not a dispatch. |
| **Send reserved** | Durable guard/lock recorded. Explicitly state that this is **not proof of a send**. |
| **Submission being confirmed** | Activation intent/attempt exists, but a new matching user turn has not yet been observed. Never show Submitted merely because click returned. |
| **Submitted** | Only after the new matching user turn is observed in the intended conversation against the pre-send baseline. |
| **Waiting for reply** | Submission observed; generation start not yet observed. |
| **Generating reply** | Task-bound generation start is observed and generating state is fresh; a stale last observation must instead be described as stale/unknown, not live progress. |
| **Checking reply** | Completion evidence and candidate are available and validation is in progress; not acceptance yet. |
| **Reply checked — delivery pending** | Integrity/pairing/protocol checks passed, not a guarantee of substantive correctness and not consumer readback. |
| **Readback confirmed by [named consumer]** | Actual checked content was delivered and the named consumer's checkable readback validated. This is **not M1 acceptance**. |
| **Outcome uncertain — no resend** | Missing/conflicting evidence or interrupted observation; retain lock and known facts. |
| **Observation window ended** | Finite observation budget expired. This does **not** mean generation was cancelled or the message was unsent. |

Expose task-specific work result separately from protocol integrity/readback. For example, a model refusal can be a checked, consumed real reply while the requested work remains incomplete. Never substitute a successful marker or delivery receipt for a task-success judgment.

#### Task actions and recovery

Available actions, gated by actual facts/permissions, are **Resume observation — no resend**, **View unverified candidate**, **Deliver checked reply** (only through a verified authorized consumer route), **View reply**, and **Details & diagnostics**. Observation resume is read-only and obeys the original bounded evidence rules; it is not a submit retry or permission to reconstruct lost transitions. Do not add generic **Retry**, **Reset**, **Mark complete**, or **Clear lock** controls. A legitimate repeat starts with **Review a new send** only after prior uncertainty is resolved, with a distinct operation identity, explicitly reviewed content/target and new valid scope/count; it never resets the old record.

On reopen, query and validate durable task/lock facts **before enabling any send**. Show loading/unknown rather than apparent idle or an empty task list that implies no work. Reattach read-only to a surviving same-page observer only if its identity/continuity is verified. Full-page restart with lost start/end evidence stays uncertain; a late matching candidate is labeled unverified, not promoted from the now-idle page. Already checked historical content can be delivered/redelivered according to the local consumer contract without any browser resend; distinguish delivery state from browser operation state.

#### Accessibility and safe rendering

Use native semantic controls with explicit labels and associated descriptions, accessible headings and keyboard operation. A newline in Instruction is **never an implicit send**; submission requires the explicit Send action. On user action, focus the relevant actionable error when needed; background progress must not steal focus. Announce meaningful transitions politely, not polling ticks or elapsed-time updates. Provide visible reasons when Send is disabled and express state with text, not color alone. Verify narrow-panel reflow at 200% zoom, theme contrast and reduced-motion behavior. Render instructions/replies/candidates as inert text or equivalently sanitized safe content: no executable HTML, privileged links or page-supplied tool actions. Long text must not force unsafe horizontal layouts or obscure actions.

#### UX rollout and compact acceptance scenarios

Phase 0 preserves the current switchboard while fixing bounded baseline behavior and truthful deadline/status copy. Phase 1 introduces durable task hydration, acknowledged draft saves, conflicts and safe lock/blocker reporting before enabling richer sends. Phase 2 introduces evidence-derived submit/observe states and read-only recovery controls through the common engine. Phase 3 enables role-directed arbitrary instructions, explicit binding/approval, payload-budget summary and verified consumer readback. These are implementation gates aligned with section 8, not authorization to deploy or operate the browser.

| Acceptance scenario | Required observable result |
|---|---|
| Routine authorized instruction | One draft entry, explicit confirmed role binding, approval then distinct Send; one guarded activation; observed matching user turn/completion; checked actual reply delivered to named consumer with validated readback. No owner copy/paste of markers or reply. |
| Readiness, approval, reconnect/reopen, draft resolution | **Zero sends** from these events alone; permitted nonmutating checks only, no automatic host-init/reload/navigation/account operation. |
| Missing/ambiguous role binding | No first/focused-tab inference; explicit Choose/View/Use confirmation; same-conversation tabs share one destination lock. |
| Existing/synced/unreadable page draft | No fill, clear, append or new-tab workaround; specific blocker and View/Check actions; resolving it never sends automatically. |
| Concurrent edit/rebind/double-click/two panels | Both edit variants retained on conflict; stale approval invalidated; reserved operation cannot retarget; one serialized guarded dispatch, no fresh-ID bypass. |
| Port/panel/worker/page resets | Durable state hydrates before sending is possible; no apparent idle. Only verified surviving observation resumes read-only; lost page evidence remains unknown. |
| Late candidate / click with no new user turn | Candidate visibly unverified; no caller-completion shortcut. Click-no-turn stays Submission being confirmed/uncertain, never Submitted. |
| Checked versus consumed versus work result | Checked reply may remain delivery pending; hash-only ACK is not readback; named valid readback is not M1; model refusal may be checked while task remains incomplete. |
| Payload/budget/storage failure | Full wrapper overhead counted; unknown/exhausted scope or size/storage bound blocks with a specific reason; no truncation, hidden send, approval reuse or tombstone eviction. |
| Keyboard/assistive technology/themes | Explicit Send only, textarea newline preserved, labels/descriptions and disabled reasons available, meaningful polite announcements, no background focus theft, text statuses, safe inert reply rendering and usable 200% narrow/theme/reduced-motion presentation. |

The coordinator owns artifact readback, reconciliation with technical constraints, and final acceptance. Delivery of this designer specification is not owner approval of the design, implementation proof, browser authority or M1 evidence.

### 10. Open decisions and source references

Decisions still required before phase 3 release:

1. **Local payload retention/access:** exact limits and expiry for prompts, checked replies and unverified candidates; owner-sensitive opt-in; behavior when content expires before consumer readback. Permanent no-resend guard retention is not optional payload retention.
2. **Scoped multi-send authorization:** which ordinary-language owner scopes can authorize a series, how target/count/payload constraints are represented and checked, and how explicit legitimate repeats are approved. No new authorization is claimed here. *(2026-10-19: Bus V1 makes this decision required, not optional; see section 11 and decision record section 8.)*
3. **Observer survival behavior:** which page/worker/port resets preserve an observation session on the supported Chrome build; what ordered evidence can be durably acknowledged without falsely claiming atomic page/storage delivery. Until measured, use unknown/reconciliation.
4. **Consumer binding/readback contract:** concrete existing local receiving session and task-specific readback validation, especially for free-form answers. A host handshake alone is insufficient.
5. **Consolidated design approval/acceptance:** the designer's delivered UX specification is incorporated in section 9. Coordinator readback and final acceptance remain pending; owner approval of the design and any broader operational scope are not inferred from delivery.

Verified local references (paths/symbols, deliberately no guessed line numbers):

- [Root operating rules](../../../../AGENTS.md), [Windows-driven decision](../../canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md), [Windows architecture proposal](../../canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md), [M1 acceptance](../../canon/AION-MILESTONE-1-INTROSPECTION.md), and [state protocol](../../STATE-PROTOCOL.md). The inspected [STATE snapshot](../../STATE.json) has `m1_verified:false` and older prelive observations; it is not a substitute for newer receipts.
- [Live attempt and read-only recovery](../../agents/windows-master/M1-LIVE-ATTEMPT-2026-10-18.md): historical first no-send failure, second real send/reply with adapter refusal, synchronized draft observation, consumed one-send budget, and no completion reconstruction after host restart.
- [Worker port driver](./extension/src/background/chatgpt-port.js): `runTurn`, `readFinal`, `createReservationStore`, `DISPATCH_KEY`, `DISPATCH_SCHEMA`, `MAX_RUN_TIMEOUT_MS`, `MAX_PORT_GUARD_MS`; inspected numbers and current reservation gaps.
- [Worker routing](./extension/src/background/service-worker.js): `chatgptCommand`, `handleChatGptRun`, `handleChatGptRead`; allowlisted commands and gesture/reference checks, not a grant-scope verifier.
- [Page adapter](./extension/src/chatgpt/content.js): `preflightComposer`, `runTurn`, `readFinal`, `readFinalReplyAfterLastUserTurn`, `MAX_TIMEOUT_MS`; draft protection, click-before-wait behavior and caller-asserted read completion.
- [Correlator](./extension/src/chatgpt/correlate.js): `waitForGenerationEnd`, `correlateReply`, `extractFinalReply`; bounded observed-start/settle check, echo/correlation/token rejection and retained-copy caps.
- [Panel](./extension/src/panel/panel.js): `LIVE_RUN_TIMEOUT_MS`, `APPROVED_SCOPE_REF`, `runProbe`, `reconcileProbe`, `blankProbeFields`; existing probe-only flow and panel-local lock/reset, not a durable operation engine.
- [Human panel HTML](./extension/src/panel/sidepanel.html) and [existing stylesheet](./extension/src/panel/panel.css): actual human-facing entry point and current switchboard surfaces; no `panel.html` entry is assumed by this proposal. Section 9 records delivered designer requirements, not observations of implemented new UX.
- [Role source mirror](./extension/src/roles.js) and [canonical role registry](./role-launcher/ROLES.json): explicit role IDs and currently unbound session URLs; not evidence of live initialized roles.

No external research, browser action, source/config/state/TODO change, implementation test, deployment, commit or acceptance claim is part of this documentation-only proposal.


### 11. Bus V1/V2 direction — commander channel and agent fleet (PROPOSED)

**Status: PROPOSED direction, recorded 2026-10-19. Not approved, implemented, or live.** Authority and open decisions live in [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md); this section adds only the architectural consequences. `live_execution_authorized` and `m1_verified` stay `false`.

**Labels.** *Bus V1* = commander loop (phone → ChatGPT → PC chatgpt.com + extension → other open chatgpt.com conversations). *Bus V2* = the same loop extended to local executors, OpenCode first. Older "V1/V2" wording in role-context and launcher docs is relabeled RC-1 / RL-001.

**Commander channel.** One designated chatgpt.com conversation. The owner writes in it from the phone; the extension on the PC may act on a fenced `AION_CMD_V1` block in an assistant reply only under conditions C1–C8 of the decision record (owner-armed, bounded parse, allowlisted target, scoped action, scoped grant, hop/loop guard, no-resend, kill switch). Replies, reports and page text remain untrusted data; they never widen a grant. Channel Option A (tab watcher, gated by experiment SYNC-0) vs Option B (connector bridge via `ops/aion-mcp`) is an open owner decision.

**Agent registry (extends the section 3 identity table).**

| Field | Meaning |
|---|---|
| `agent_id` | Stable registry identity; roles are the initial agents. |
| `parent_agent_id` | Genealogy link; null only for the owner-designated root. |
| `kind` | `chatgpt_conversation` (Bus V1) or `local_executor` (Bus V2). |
| `binding_ref` | Owner-confirmed `conversation_key` or executor session reference; never inferred from "first tab". |
| `scope_ref` | Grant defining permitted actions, count, rate and expiry. |

**Command path.** Observed command → validated (C1–C6) → reserved under the existing worker serialization gate → dispatched through the existing submit/observe engine → reply checked → report posted back to the commander at `hop + 1`. A command is a new operation with its own `operation_key`; the guards in sections 2–6 apply unchanged, including no blind resend and per-conversation locks.

**Loop and hop guard.** Every chain carries `hop_count`/`max_hops`; reaching the maximum emits `loop.halted`, shows `HALTED`, and stops. Per-agent rate and a global kill switch (`kill.engaged`) are checked before every dispatch.

**Report-back (extends section 7).** The checked agent reply is posted into the commander conversation as bounded, inert data with task/operation references and hash, then observed like any other send. Posting is itself a guarded send and counts against the grant.

**Bus V2 executor leg.** For `kind: local_executor`, dispatch goes extension → native host `com.aion.relay` → ACP v1 to OpenCode (`opencode acp`), subject to the verified capability and scope checks already required in section 7. Order: V2-0 read-only session inventory, V2-1 one scoped prompt, V2-2 grammar extension, V2-3 report-back. `@opencode/client` (shared HTTP service) is a different interface and not a substitute.

**Failure modes (all fail closed, none resend).** PC asleep/offline or Chrome closed: phone commands cannot execute and must be reported as not delivered when the PC returns, never replayed silently. Commander tab closed, discarded or not updated: watcher is blind; no inference from stale state. Tab/worker/page resets follow the section 6 reset rules. Unknown sync behavior is treated as failure until SYNC-0 measures it.

**Prerequisites before any Bus V1 code beyond fakes:** the reconcile endpoint for a terminal-not-accepted lock and a pruning/archival plan for the task store (section 1 known gaps; section 5 forbids silent eviction).

**Not claimed.** No watcher, registry, grammar, mobile behavior, SYNC-0 result or executor leg exists. This section is not evidence of any of them.
