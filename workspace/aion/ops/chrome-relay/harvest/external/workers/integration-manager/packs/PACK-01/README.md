# PACK-01 — Bridge receive cursor, bounded replay and passive terminal evidence

**Status:** staged AION-adapted source; **not integrated or tested**. Development selects/adapts this code at P1 and is responsible for all AION tests and owner-authorized I1 live acceptance. No donor tests were run.

## Files and source custody

- `receive-journal.js` — adapted from `chatgpt-bridge/src/bridge/observedTurns/observedTurnJournal.js` at donor upstream **0ffdae90239988f253058c05253226152acd55d2**. Preserves epoch/monotonic sequence/retained boundaries, fixes replay ordering and all-epoch ahead cursor validation, adds exact binding/page lifetime separation and explicit coverage failure.
- `terminal-evidence.js` — adapted from `chatgpt-bridge/src/bridge/observation/turnEvidence.js` at same pin. Preserves conservative stopped/final/stable/non-degraded checks but labels result **inferred**, never verified.
- `LICENSE-CHATGPT-BRIDGE.txt` — original MIT notice (Serhii Tkachenko 2026).

**Dependencies:** browser/Node ES modules, built-in `TextEncoder`; no third-party packages, native host, Bus, network, filesystem, CDP or process-global state. AION P1 event validator is **required** as a callback; no competing event/1 schema is declared here.

## Development insertion / wiring

1. **P1 owner:** `extension/src/lib/conversation-contract.js` (not present on `main` at packaging). Export the authoritative `aion.conversation.event/1` and `snapshot/1` validators, exact binding fingerprint and accepted key names. Inject that pure `event/1` validation function via `validateEvent`, and adapt the return values of `readPage`/`snapshot` to P1. Do **not** serialize this module's internal `items` as a new wire contract.
2. **P2 observer:** holds one journal instance per exact binding + page epoch; caller generates a fresh independent streamEpoch for an observer lifetime. On rebind/remount create a new instance, never silently reuse a cursor or mix page epochs.
3. **P3/P4:** consumer treats `reset`/`gap` as mandatory read-only resnapshot; pages advance with `nextCursor` until `hasMore=false`. Never send page text through `velocity/src/broker/events.mjs` or dispatch text as a command.
4. Enforce canonical text caps in P1 before publishing (helper `boundObservedText` gives `truncated`; feed truncation into observer evidence). Journal refuses events above **32 KiB UTF-8**, marks history coverage degraded, and does not silently truncate a supposedly complete event. It retains at most **200** entries by default.

## Required **AION** negative tests (Development owns; none executed here)

- Replay 150 retained entries with a 100-item page: first page sequences **1–100**, next **101–150**, neither silent skipped prefix nor false completeness.
- Cursor ahead of current latest with **matching stream epoch** => `reset:sequence_ahead_of_stream`; epoch mismatch, missing-epoch resume and invalid cursor => `reset`.
- Cursor before retained lower bound (including fresh `after=0` after eviction) => `gap`; oversize/unserializable event => coverage gap, never claim complete history.
- Wrong binding/page epoch and stale revision cannot publish. Reconnect must not duplicate retained revision events. A change to a previously evicted key requires P1/inbox reconstruction; journal cannot prove that earlier history.
- Streaming-visible/stopped-looking output, empty shell, pending/failed artifact, degraded or truncated text **must not** count as terminal. Even a terminal candidate is **inferred**; Dev needs independent correspondence evidence for Bus REPLY_CHECKED.
- Content resembling `send`/`grant`/`execute` stays data only. P1 must reject any control-plane mutation or event-shaped injection; exact field names are owned by Development.
- DOM coverage and event retention are independent: an in-memory window is **not** proof the page contains the entire conversation.

**Source test references to adapt (read only, NOT executed):** `chatgpt-bridge/test/observedTurnJournal.test.js`, `turnObservationEvidence.test.js`, `remoteBrowserBridgeInitialCursor.test.js`. Existing AX-0016/0017 capture rationale. `main` is the packaging target; PR #46 architecture is **accepted direction, not merged implementation**.
