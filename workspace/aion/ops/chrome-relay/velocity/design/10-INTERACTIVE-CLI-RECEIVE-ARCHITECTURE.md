# AION Platform — interactive send AND receive CLI (architecture assessment)

**Date:** 2026-10-20. **Status:** ASSESSED / DESIGN FOR NEXT CODE SLICES; not implemented or live-verified. **Authority:** existing Chrome Extension Track B, PR #46; architecture context Harvest Crosswalk C-004 PR #41; command-space registry PR #47 at `69a967b9ece61e3f039ed98983eb4837b414ffef`. All three sources currently reside in separate branches. GitHub is source/handoff, not runtime.

## Decision: enough evidence to build; one targeted crosswalk enrichment, not another broad Harvest

PR #47 supplies 550 route-command mappings across 13 providers and 22 semantic commands, but they represent planning rows: 455 NOT_RESEARCHED, 73 DOCUMENTATION_ONLY, 22 INTERNAL_REPO_REPORT, zero LIVE_VERIFIED. 373 native support UNKNOWN, 91 CANDIDATE, 86 DOCUMENTED. 365 AION routes PENDING, 163 PLANNED, 22 OFFLINE_IMPLEMENTED. The CSV has no stable provider_id/route_id, no strongly typed input/output contracts, no session-specific evidence and no executable implementation address; its SQLite generator indexes discovery records. It is **sufficient as semantic research** and must **not yet drive Bus routing**, especially when route fidelity NEW_API_SESSION differs from the explicitly bound SAME_WEB_CONVERSATION.

Development is not blocked by PR #47: direct ChatGPT browser-mediated same-conversation binding and Bus admission are already implemented enough for offline development. A **small source-crosswalk task** may run in parallel to deliver (1) stable alias mapping PR47 `send`, `observe`, `reply.read`, `stream`, `session.bind`, `history.read`, `recover` ↔ design seed `conversation.send`, `conversation.observe_reply`, `operation.observe`; (2) exact current AION owning module/function and live/offline/proposed disposition; (3) typed receive event and completion semantics, provenance/identity/fidelity and entitlement; (4) stable provider/route IDs with no change to CSV authority; and (5) candidate risks and negative tests. This is a narrowly bounded mapping packet, not 550 source investigations or a runtime migration.

## Product goal and acceptance

**The terminal must be a genuinely bidirectional conversation interface** into the user's *already-bound* ChatGPT web conversation. The operator can type multiple turns, see assistant text without opening Chrome, watch generating replies, read conversation turns that appear while idle, reconnect and resume without duplicate Send, and explicitly inspect unresolved operations. The local agent only runs Windows/browser acceptance; primary implementation belongs to the remote AION dev branch.

Illustrative target behavior (proposed syntax, NOT implemented):
```text
aion connect chief --conversation https://chatgpt.com/c/<id>   # existing, explicit
aion chat chief                                                # new REPL
chief> hello
assistant [generating] ...
assistant> Hello! ...
chief> continue
assistant> ...
/watch    # read only
/history  # read only, bounded
/resume   # reconnect to exact binding + cursor
/status   # read only
/exit     # leave without affecting external generation
```

**Acceptance:** two sequential CLI turns reuse exactly the same bound provider conversation with distinct operation IDs; every assistant response is displayed at least once and paired with its originating user message when AION submitted it; an external browser-side turn may appear as independent incoming data (not falsely tied to an AION operation); interrupted CLI resumes observation with zero re-submissions; stale/ambiguous binding and possible-effect failure block new sends and report exact reasons.

## Architecture: preserve core, add a receive plane

```text
CLI / REPL / future pane or MCP
  ├─ outbound intent → existing parser → Bus/grant/operation → ChatGPT adapter → host/MV3 page
  └─ inbound events  ← local read-only projection / cursor ← existing adapter observer ← host/MV3 page
```

**One authority:** existing `aion.bus/1` with exact binding, grants, durable operation ledger and no resend. **One observational source:** actual bound conversation page, read by a Chrome content observer; observation carries page instance/binding IDs and proof, not commands. **One local receive projection:** bounded stream of sanitized, typed observations with cursor and optional local read-only checkpoint. It is not a second Bus, cannot invoke Send/Stop and does not claim any source beyond actually observed page DOM. The existing reply excerpt is not adequate for complete CLI chat history and must not be misrepresented as full text.

### Receive event contract proposal (`aion.conversation.event/1`)

```json
{
  "schema": "aion.conversation.event/1",
  "provider_id": "chatgpt.com",
  "conversation_ref": "exact-authorized-binding",
  "binding_revision": 1,
  "session_observation_id": "page-instance-specific",
  "cursor": "opaque-observation-cursor",
  "event_id": "stable-within-observed-page-epoch",
  "kind": "user_turn_observed|assistant_delta|assistant_snapshot|assistant_complete|status|gap",
  "message_ref": "provider-message-if-observed-or-local-observation-id",
  "caused_by_operation_id": null,
  "text": "bounded-visible-text-if-authorized",
  "text_complete": false,
  "observed_utc": "provider-observation-time",
  "evidence": {"source": "authorized-page-observation", "verification": "observed-only"}
}
```

This example is **shape only**. Cursor scope and observed message identity require testable definitions: never rely solely on message text/hash or role/order for durable identity. In first implementation, message snapshots with revision hashes can be deduplicated and diffed client-side; emit literal deltas only when stable alignment is demonstrated. On rerender, cursor mismatch, missing events or tab replacement, emit `gap` and perform bounded read-only resnapshot; never fabricate continuity. A page-local monotonic sequence is not proof of historical global completeness.

### Persisting receive state

The Bus owns operations. Its existing command records should remain immutable and redacted. The new receive read model may maintain a **separate bounded local observation checkpoint/cursor** (not an authority ledger), keyed by exact provider/conversation/binding revision and sanitized according to retention policy. Raw full transcripts should **not be written to GitHub or the Bus journal**. Deliver full visible text only to the locally authorized CLI session; bounded memory during active session and opt-in private local history only when deliberately designed. Security and privacy constraints apply to read scopes separately from Send grants.

### Message semantics

- `conversation.send`: external effect, requires current owner grant, exact target and one guarded activation. Separate `submitted` and `reply_complete` evidence.
- `conversation.messages.observe`: read-only, current observed page messages, identity and cursor; no new Bus op unless separately accepted.
- `conversation.reply.read`: read-only retrieval of a known message/reply (can be partial or absent).
- `conversation.stream.watch`: read-only subscription/polling to receive snapshots/changes; observer cannot activate Send.
- `conversation.history.read`: optional bounded historical read, with coverage/gap and privacy status.
- `conversation.recover`: reconnect to previously bound identity, inspect operation/receive cursor; no resend or implicit disposal.
- `conversation.stop_generation`: separately authorized mutation, **not** `aion stop` (Bus kill), and not required for initial interactive CLI.

## Concrete coding slices and owners

### R0 — Contract/test harness (start here)
New `velocity/src/conversation/contracts.mjs` and `velocity/test/conversation-contracts.test.mjs`; validate explicit identity, freshness, cursor scope, event kinds, size caps, no effect verbs in receive surface and authority separation. Add mapping to PR47 via a static *read-only* alias file, **not** a route planner. No Bus schema migration.

### R1 — Receive observer (Chrome extension)
Fresh isolated `extension/src/chatgpt/conversation-observer.js` with provider-specific DOM observation/read-only sampling, emitted snapshots or stable deltas, message anchors, current generation state, origin classification (AION-operation-caused vs independently observed), tab/page epoch and gap signaling. May reuse existing read-only observation helper, but should not port unsafe retry or false proof. Implement bounded content exposure; no credentials or private session tokens.

### R2 — Worker/native host receive transport
New narrow request `conversation.read` (bounded snapshots) and `conversation.watch` (cursor-based long-poll), scoped to authenticated host, exact bound conversation, read grant and page instance. Add extension worker/service-host routing only at tested existing seam. A receive request must not emit user gesture or pass an action name from page content. Respond with stable schema and explicit `UNSUPPORTED`, `GAP`, `STALE`, `BOUND_TARGET_MISSING`, `UNKNOWN`.

### R3 — Read model and interactive terminal
New `velocity/src/conversation/inbox.mjs` (cursor/dedup/resnapshot), `velocity/src/conversation/repl.mjs` (terminal session), `velocity/test/conversation-inbox.test.mjs`, `velocity/test/conversation-repl.test.mjs`. Keep existing `aion send` and `aion observe`. Add `aion chat <alias>` dispatch in `bin/aion-local.mjs` and grammar `src/commands.mjs` after unit tests. One explicit input turn → one Bus operation → await read-only events; ongoing idle receive loop; `/history`, `/watch`, `/resume`, `/status`, `/exit` are read only. No silent automatic send to recover from UI failure.

### R4 — Real send/receive integration and local test candidate
Offline test fixture for two consecutive turns in *one exact conversation*, message receipt, incremental reply, independently-originated external page turn, page rerender/cursor gap, reconnect, terminal interruption, unknown submission, ambiguous Send control and no-resend. Extend `aion selftest` automatically through existing Node test discovery. Produce updated Windows handoff; local agent tests only after R0–R4 source commits.

### R5 — Wider provider and native route introduction (not MVP gate)
Use PR47 command-space catalog as non-authoritative discovery/read-only planning. Introduce versioned provider ID, route ID, effect/risk class, fidelity and evidence contract, then accept route-planner use **only** after explicit provider-specific adapter realization plus live/granted readiness. Never pick a new API session to simulate continuity with a ChatGPT.com browser conversation. Keep native OpenCode session support as distinct provider realization.

## Coding and acceptance order

**Execute remotely here:** R0 + R1 + R2 + R3 + R4 in sequence of tested interfaces, producing source commits and PR #46 updates; local Windows agent supplies actual Windows/Chrome checks. Keep R5 independent and later. No Playwright/Puppeteer/Orca, uncontrolled CDP or fallback Send routes. No broad legacy-code rehabilitation campaign; rebuild Chrome observation behind existing narrow adapter/host seams where simpler.

**Distinct risks to verify:** (1) reply excerpts currently capped; full visible response can require a new privacy-safe read path; (2) Bus command ID cannot be equated to provider message ID; (3) event stream in `velocity/src/broker/events.mjs` currently intentionally excludes text—do not silently insert transcript text into it; (4) external browser-originated incoming turns must not be labeled as results of AION sends; (5) 'generation stopped' is not proof of fully checked reply; (6) authorization to Send does not automatically imply permission to export complete conversation history.

## Crosswalk worker request, bounded

Prepare a **single compact mapping artifact** from PR47 and Harvest C-004—not a new broad harvest—covering the seven receive/interaction semantics above. For each: stable `semantic_id`, PR47 `command` aliases and original term, current AION code owner, evidence from donor source IDs, exact provider session fidelity, side-effect class, read/scope authority requirements, failure/unknown semantics, readiness and completion evidence. For ChatGPT web vs ChatGPT API vs MCP/App, explicitly mark **NOT_INTERCHANGEABLE** unless actual same-web-session access is proven. Include versioned source SHA and pending/unverified labels. This can complete asynchronously **relative to coding** in a separate chat but does not block R0–R3; GitHub task receipt required for promotion.

**Do not interpret PR47's advisory `routesFor` suggestion as authority to alter dispatch today.** This initiative makes the CLI truly two-way first; generic route planning comes after real provider evidence.
