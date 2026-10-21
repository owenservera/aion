# PACK-06 - readiness tri-state and document-instance binding

**Status:** staged for Development review. Not wired into the runtime, not accepted, not live-verified. The fixtures in this pack **were** executed offline (`node --test`, 26/26 passing, Node 24.11.1); no donor test was run and no browser, `chrome.*` API, timer or network was touched.

## Provenance

Adapted from `multi-ai-chat` at upstream **`cdcf6a7fb05609b219fd85395a116f26476a7f92`** (MIT), retained in `harvest/external/landing/donors/multi-ai-chat/`:

- `src/content/loginStatusStability.ts` — `decideLoginStatus` is a line-faithful port of the donor function (lines 23-66).
- `src/background/service-worker.ts` — `captureTopFrameDocumentId`, `evaluateSenderBinding` and `verifyBoundDocument` are the **decision halves** of `currentTopFrameDocumentId` (lines 539-550) and the waiter binding checks (lines 720-757, 848-867, 960-986). The `chrome.scripting.executeScript` injection and `chrome.tabs.sendMessage` calls stay in the runtime; this pack only accepts or refuses a result the caller already has.

License: `LICENSE-MULTI-AI-CHAT.txt` (Theodore Huang, 2026 MIT).

## What it decides

| Situation | Decision |
|---|---|
| Composer mounted (`ready: true`) | Report ready immediately (`true`). |
| Same state as last report | Do not report again (`report` omitted). |
| Explicit login/signup surface | Report logged out immediately (`false`), even if a composer is also visible. |
| Readiness unknown (`ready: null`) | Report **checking** (`null`). Never invent a login requirement. |
| Composer missing, inside `lossDelayMs` | Keep the previous report. Return `retryInMs` for the remainder. A negative delay is clamped to 0. |
| Composer missing past the delay | Report logged out (`false`). |
| Already reported logged out | Sticky. A later missing-composer sample does not re-report. |

Document identity, separately:

| Situation | Decision |
|---|---|
| Injection returns exactly one result, `frameId === 0`, non-empty `documentId` | That id is the bound document. |
| Zero, many, a subframe, or a missing id | No binding. The caller must treat the send as unconfirmed. |
| Incoming message with no bound document | Refuse (`binding_required`). |
| Message `frameId !== 0` | Refuse (`frame_not_top`). |
| Message without a document id, or with a different one | Refuse (`document_id_missing` / `document_changed`). |
| Reconnect: waiter has no bound id | Do not keep it (`unbound`). |
| Reconnect: current top-frame id unreadable | Fail closed (`current_document_unknown`). A missing id cannot prove continuity. |
| Reconnect: ids differ | Invalidate (`document_changed`). A reload keeps the tab id and changes the document id. |
| Reconnect: ids match | Keep the waiter. |

## Deliberate deviations

1. **Plain ES module, no TypeScript.** Same node-contract style as PACK-04. `package.json` exists only to mark the folder `"type": "module"` so `node --test` can run it. It is private and is not a workspace member.
2. **Time is an argument.** `now` and `lossDelayMs` are caller-supplied. The module does not read a clock and does not schedule the retry.
3. **Reason strings are explicit.** The donor threw or dropped silently at the call site. AION returns `{ accepted, reason }` / `{ keep, reason }` so a test can name the refusal.
4. **`documentId` is not a wire field.** If AION already binds a page epoch or document identity, map these decisions onto that existing value. Do not add `documentId` to `event/1` or `snapshot/1`, and do not create a second identity authority beside the Bus/ledger.

## Integration points (Development-owned)

1. Suggested destinations: a readiness helper beside the existing ChatGPT read path, and a document-binding check at the message-accept and reconnect sites. Neither file is present on `main` at packaging time; do not invent a second observer.
2. Feed `ready` from the existing composer/login probes. `null` means "probe could not decide", not "logged out".
3. Bind a waiter only after `captureTopFrameDocumentId` returns a string. A send with no id is unconfirmed; do not retry it from this pack.
4. On tab reconnect or reload, run `verifyBoundDocument` before accepting any queued observation for that waiter.
5. **This pack changes no `event/1` and no `snapshot/1` field.** It emits no event, owns no grant, performs no Send/Stop and has no storage.

## What it must not be used for

- Proving a response is complete, or that a turn belongs to an operation. Readiness and document identity are preconditions, not correlation.
- Treating tab id or URL as document identity. Both survive a reload that replaces the document.
- Automatic resend when binding fails. Refusal is typed uncertainty, not a retry.

## Tests

```
cd harvest/external/workers/integration-manager/packs/PACK-06
node --test
```

26 fixtures: immediate ready, report dedupe, explicit logout (including over a visible composer), repeated-logout silence, unknown → checking, loss-delay deferral and shrinkage, delay expiry, sticky logged-out, zero/negative delay clamp, single/multiple/subframe/empty/non-array capture, unbound/subframe/missing/mismatched/exact sender, and reconnect keep/drop including fail-closed on an unreadable current document.

## Open questions for Development

1. What `lossDelayMs` does the live readiness path already use, if any?
2. Does AION already persist a page epoch that should be the `documentId` argument, rather than Chrome's `documentId`?
3. A waiter bound before the first successful capture has no id. This pack refuses it. Confirm that matches the live "send unconfirmed, do not guess" rule.
4. Two tabs are two bindings. Nothing here merges them.
