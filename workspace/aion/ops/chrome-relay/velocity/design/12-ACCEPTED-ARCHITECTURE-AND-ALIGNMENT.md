# AION Platform / Track B — ACCEPTED ARCHITECTURE & ALIGNMENT

**Decision ID:** AION-BIDIRECTIONAL-CLI-ARCH-2026-10-20
**Status:** ACCEPTED AS DEVELOPMENT DIRECTION; CODE IMPLEMENTATION AND LIVE ACCEPTANCE PENDING
**Decision authority:** owner acceptance in ChatGPT on 2026-10-20 after Claude independent review PR #50.
**Canonical source for Track B architecture:** **this file**. Read this BEFORE historical designs, implementation packets, and agent prompts.

## 0. What we are building

One interactive terminal into an **exact, already-bound provider conversation**: start `aion chat chief`, watch read-only live messages from the same ChatGPT web conversation, type a natural prompt with no AION boilerplate, see incremental assistant output and a final reply, continue multiple turns, and reconnect with no duplicate sends. External user/assistant turns are visible with explicit attribution. Later use the same **typed receive interface** for other AI webapps and native runtimes. No Playwright, Puppeteer or Orca. Local Windows agent is responsible for Windows and authorized live-browser testing; code, offline tests and integration are authored on the AION GitHub development branch.

**MVP gates, in order:** **I0** contract + hermetic offline fixtures; **I1** watch-only CLI live receives an independently originated message (no Send); **I2** two owner-authorized CLI Send/reply turns in exactly one bound web conversation, one effect each; **I3** terminal/browser/worker restart, cursor gap, uncertain-effect recovery with *zero* blind resend. No claim of 'ready' from offline green tests alone.

## 1. Precedence and one source of truth

1. **Security/effect invariants in existing executable Bus and explicit user grants** are binding at runtime; a document cannot weaken admission, identity, no-resend, file isolation, or existing live unresolved-operation locks.
2. **This accepted decisions record** governs the target design, development order, allowed implementation choices and work ownership.
3. **Approved implementation contracts (P1)** will express the chosen schema in source+tests (source code becomes mechanically authoritative for event validation). Differences require an explicit revision to this record and compatibility tests.
4. **Claude review 11** is *accepted as the direction* but its proposals are not independently executable contracts; any ambiguity is resolved here.
5. **Earlier design 10**, roadmap 02, design 05/06/07/08 and historical CENV documents are **context/reference only wherever they conflict with this record**.
6. **Harvest C-004 and seven-way issue #48** are research evidence (PR #41/#49); **PR #47 and PR #51** are command catalogs and priorities only, not runtime dispatch authority. PR #51 is a separate *draft* registry expansion (40 commands / 19 P0) and is **NOT YET merged into this runtime branch**.
7. Under no circumstances does a registry's `DOCUMENTED`, `OFFLINE_IMPLEMENTED`, `P0` or design directive authorize a Send or change the chosen route.

**Source/branch:** `owenservera/aion`, `track-b/platform-local-candidate-20261020`, PR #46 (draft, NOT promoted). Reviewed PR #50 merged on 2026-10-20. All child implementation PRs target this candidate, not main or Track A. Issues #43 (two-way Chrome/CLI) and #48 (research crosswalk) are separate: #48 was delivered through merged PR #49.

## 2. Six owner decisions resolved (M1–M6)

| Decision | Accepted rule | Guardrail |
|---|---|---|
| **M1 framing** | Human interactive `chat` mode sends **exactly the user's typed text**, with NO correlation headers/echo tokens. Existing Bus V1 agent-to-agent `strict` framing remains unchanged. | Correlate from page observation/baseline; ambiguous or missing match is UNKNOWN, not false success. |
| **M2 read scope** | A **local, explicitly bound conversation** grants read-only observation of that exact conversation in the authenticated owner session; no separate grant object needed for MVP. | Unbinding revokes read scope; no other tabs/accounts; no implicit export/share/history persistence. Read does NOT authorize Send or other mutations. Any future remote/multi-user client needs separately scoped authorization. |
| **M3 retention** | MVP full text **in memory only** for the active REPL. Optional private checkpoint may record ONLY non-text cursor/identity/revision data. | No raw transcript in Bus ledger, GitHub, shared logs, host error messages or background database. Clear when REPL exits. |
| **M4 actuator** | Conduct owner-authorized **read-only DOM reconnaissance first**, then controlled test of available Send techniques in an isolated Track B profile. DOM method preferred if actual Send is demonstrated; Windows UIA and `chrome.debugger`/CDP may be evaluated as explicitly admitted alternatives when needed. | Research CDP permitted; NO Playwright/Puppeteer/Orca. Pick **one** actuator per authorized attempt; an uncertain outcome must never cause same-operation fallback/retry on a different actuator. No automatic live mutation without explicit admission. |
| **M5 freeze** | **Track B source-development freeze lifted** for this accepted architecture and its tests. Track A remains isolated/frozen by default. | Does **not** override real-operation locks, security controls, permission restrictions, or any broader explicit owner restriction. Historical `STATE.json` entries should be corrected only after locating their exact owning file and scope; do not assume its location. |
| **M6 authority** | The **Node file-backed AION Bus** is Track B's **only effect/admission authority**. Extension worker stores are bounded actuation/evidence journals, NOT independent permission authorities; embedded extension Bus is Track A/commander until deliberately migrated. | One writer/one grant ledger; no secondary command engine or implicit promotion from read observations to write actions. |

**Additional decisions accepted:** M7 edited/regenerated/branched messages are explicit revision/gap events, never silently correlated; M8 multiple readers/one admitted sender; M9 authenticated local IPC token acceptable for initial single-owner text-in-memory pilot with restricted pipe DACL as hardening before broader sharing/history; M10 eliminate the non-hermetic `~/.zcode/agents` fixture test before offline-green gate.

## 3. Architecture chosen — two distinct planes

```text
    AION interactive CLI (one long-lived REPL process)
        | Send intent                 ^ typed receive events + authoritative snapshots
        v                             |
    Existing Node Bus/ledger          Local inbox reducer, private in-memory text
    binding/grants/nonce/guard        ^ (message key, revision, cursor, gap, coverage)
        | one deliver()               |
        v                             |
    Existing provider Effect adapter | authenticated local IPC subscriber
        |                             ^
    Existing native host/worker <-----+ aion.b.event (DATA-ONLY, no authority)
        |                             |  + conversation.read snapshot on initial load/gap
        v                             |
    Provider-specific browser observer + actuator (or native ConversationSource)
        | observable exact bound conversation
        v
    ChatGPT.com thread (same web identity; API replacement NOT permitted)
```

**One observer per bound page**, shared as observational truth by REPL, adapter operation correlation and later Bus V1 commander. Outbound: one Bus reservation, exactly one chosen Send actuation, no auto-replay. Inbound: **push hints + pull snapshots**. Observer emits bounded snapshots/revisions coalesced as needed; don't invent token streams from DOM or equate generation stop with verified answer completion. Cursor/page epoch mismatch or lost sequence -> explicit `gap` and read-only resnapshot. No unattended daemon for MVP; the terminal REPL is long-lived and retains authenticated transport connection.

### Identity, causality and completion

Never conflate **binding (provider/account/conversation/ref/revision)**, **page epoch/tab**, **message key**, **message revision**, **observation cursor**, and **Bus operation ID**. Prefer provider-exposed message IDs; positional IDs only within a page epoch with explicit provisional identity. Correlate AION sends with *new observed user message after a pre-send baseline*, with exact text match and no competing candidates; the following assistant message is a **candidate reply**, not automatically checked/completed. Browser-originated messages outside a known operation are independent incoming events. Inferred settled status is labeled **inferred**; terminal Bus `REPLY_CHECKED` requires whichever positive correspondence/completion evidence the accepted executable contract proves, otherwise UNKNOWN/PARTIAL.

### Read authority, transport and storage

Event payloads are **untrusted page data** routed through strict validators, size/rate limits and authenticated subscribers, never interpreted as action names. **Never push raw conversation text through existing sanitized operation bus `velocity/src/broker/events.mjs`**. Define `aion.conversation.event/1` and `aion.conversation.snapshot/1` in a shared pure module under `extension/src/lib/conversation-contract.js`; `conversation.read` always serves a bounded read-only snapshot. Subscriptions are scoped by exact binding and revoked on unbind; no arbitrary tab listing in receive mode. Snapshot `complete_history:false` when DOM coverage cannot prove completeness. Only authenticated local owner REPL may display authorized text.

## 4. Explicit disposition of competing proposals

| Proposal | Accepted disposition |
|---|---|
| Doc 10's **pure long-poll** receive as the main mechanism | **SUPERSEDED:** Push data-only hints + pull authoritative snapshots; polling only read-only degraded fallback. |
| Bus as a unified message+command queue | **REJECTED:** two planes; durable effects vs bounded observation. |
| Text correlation via mandatory echo tokens for human chat | **REJECTED:** clean text in chat mode, strict agent framing unchanged. |
| Rebuild everything including Bus/IPC | **REJECTED:** selectively rebuild **ChatGPT page observer and actuator** behind current adapter/host seams; keep proven Bus/IPC. |
| Duplicating old turn-engine to preserve all legacy tests | **REJECTED:** new small driver and focused real-page evidence; retire old only after I2. |
| New background daemon for interactive CLI | **REJECTED** for MVP: REPL is the long-lived process. |
| Runtime use of governance design directives or Harvest auditor | **DEFERRED / FREEZE EXPANSION:** keep historical tooling usable but stop extending the operator CLI's platform subcommands; any removal/move requires explicit compatibility migration and tests. |
| Seed + Command Space automatic route planner | **REJECTED now:** research only, native API cannot impersonate existing web thread. |
| Full transcript persistence | **DEFERRED:** in-memory text with optional non-text checkpoint, owner consent needed for later private history store. |
| Generic provider/browser framework before first working ChatGPT receive | **REJECTED:** small provider-specific driver; common contracts + pure inbox only. |

## 5. Source contracts and file ownership — no collisions

| Package | Edit-owned paths | Definition of done |
|---|---|---|
| **P1 SHARED CONTRACT** (must land first) | `extension/src/lib/conversation-contract.js`, focused extension tests; `velocity/test/conversation-contract*.test.mjs` if required. | Versioned `event/1` + `snapshot/1` schema validators, distinct identities, freshness and gap, bound text caps, clean `chat` framing enums, no effect verbs, negative tests; matched alias names from PR #49. |
| **P2 CHROME OBSERVER** | NEW `extension/src/providers/chatgpt/{observer,profile}.js`, read-only fixtures/tests. | DOM snapshot/observer outputs, exact binding/page epoch and coverage, generating/inferred completion, identity/drift/gap, no actions possible; read-only live test gate. |
| **P3 HOST/IPC EVENT PIPE** | `velocity/src/transport/{local-ipc,framing}.mjs`, `velocity/src/native-host/{relay,guard}.mjs`, `velocity/extension-dev/dev-link.js`, focused tests. | Authenticated subscriber receives only validated data events, never grants/actions; bounded fanout and snapshot; disconnect/gap recovery. |
| **P4 CLI REPL/INBOX** | NEW `velocity/src/conversation/{inbox,repl}.mjs`, `velocity/bin/aion-local.mjs`, `velocity/src/commands.mjs`, focused tests. | `aion chat chief --watch` shows initial read and incoming external chat turns; no send on watch-only; safe leave/resume. |
| **P5 OPENCode SOURCE** | NEW `velocity/src/conversation/opencode-source.mjs` and tests (native adapter untouched initially). | Demonstrate `ConversationSource` parity over OpenCode HTTP SSE + snapshot without browser or second Bus. |
| **P6 CHAT SEND** (only after I1 + actuator bake-off) | NEW `extension/src/providers/chatgpt/{actuator,router}.js`, existing ChatGPT adapter bindings, Bus contracts additive metadata, focused tests. | User text only; one original Bus send; correlated user/assistant message refs; two live turns; one actuator chosen per attempt; no unsafe resend. |
| **P7 RECOVERY** | Optional `velocity/src/conversation/checkpoint.mjs`, integration/negative tests, local handoff. | Restart/reload/epoch-gap/unknown-effect matrix, no duplicate effects or history overclaim. |
| **P8 LEGACY RETIREMENT** | Old turn-engine/commander scan source only after I2/I3 and a full regression suite. | No duplicate readers/senders, unchanged Track A, documented rollback. |

**Parallelism:** P1 first and freeze after tests; **P2/P3/P4/P5 parallel on disjoint files**. P6 requires I1 and explicitly authorized live actuator verification; P7 follows actual recovery path, P8 is last. A source coordinator integrates PRs, runs merged offline suite, and updates one workplan.

## 6. Current evidence and remaining gates

- Claude PR #50 verified source up to candidate `4647bd4`; measured **extension 757/757**, **bridge 126 pass/1 skip**, **bus 9 pass/1 skip**, **velocity 237 pass/1 fail/1 skip** under Linux Node v22.22.0. Velocity failure is a **non-hermetic test reading actual `~/.zcode/agents`**, not a reason to claim the suite is fully green.
- Previously live Oct 19 Chrome input filled but Send activation failed; no real two-way CLI proof. Windows UIA had one reported successful actuation but is not an approved default or proof of an integrated response path.
- PR #49's seven-way crosswalk is merged into Track B candidate as research, with eight negative cases and exact read/Send fidelity distinction.
- PR #47 original registry (22 ops/550 mappings) and PR #51 proposed P0 expansion (40 ops/1000 mappings, 19 P0) are on separate research branches. Their information may influence adapter design, but neither should be treated as having runtime permission or real account coverage.
- The only place to claim implementation readiness is a **new source SHA + offline test receipt + authorized live acceptance** for I1/I2/I3. Do not copy previous suite totals onto a new head.

## 7. How to make or change a decision

If code/tests or new provider evidence contradict this record, **do not silently edit three docs or invent another architecture**. Propose `AION-ADR-<date>-<id>` as a concise change request listing decision, reason, concrete affected contract/files, safety impact, compatibility, and tests. On acceptance, update **this file**, the shared contract tests, and the active workplan in the **same PR**. Old docs retain citations as source history with a supersession pointer. Never treat a draft PR/issue as implicitly accepted runtime behavior.
