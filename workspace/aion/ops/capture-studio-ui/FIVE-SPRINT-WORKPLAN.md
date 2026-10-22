# Capture Studio UI/Integration — Five-Sprint Delivery Plan

**Owner:** UI / Client Integration. **Date:** 2026-10-22. **Baseline:** `34e1a913248c717c7f3d7c54f4be30bc9b23a098`. **Authority:** owner request to assess the active worklog/queue, split remaining UI integration work into five sprints and begin Sprint 1.
**Execution boundary:** UI/client only; Core owns CDP/capture, server, auth, persistence, lease, evidence and learning contracts. QA owns independent acceptance. No Playwright/Puppeteer, live sends, credential export, duplicate browser actuator or automatic resend.

## Evidence and priority reconciliation

- `ASSESSMENT-AND-WORKLOG.md` W1–W18 and old Opus preselection are historical research and QA hypotheses, not a fresh UI assignment.
- Existing UI1–UI6 and the Knowledge/Graph/Search/Sprint 03 source work were delivered during 2026-10-21. The previous 37 V8 checks apply only to that earlier revision. A new source and API baseline is required.
- 2026-10-22 source added a real `/chat` frontend and conversation runtime, a separate `/drive` UI with per-site recording links, and recovery/lease hardening. The server serves those routes and the Studio home `/`. Existing Chat and Drive links point to `/#session=<id>`; Studio home currently recognizes only the exact hash with no `view` parameter.
- Owner decided that Studio becomes canonical browser capture/drive engine; Track B becomes a consumer. This does not authorize additional sends, automatic retries, background operation, or a separate client backend.
- Highest immediate user-facing gap: safe, usable navigation from one captured conversation or drive result to the exact saved recording and its read-only knowledge, with explicit failure/incomplete state and no misleading "accepted" inference.

## Ordered sprints

| Sprint | Objective | UI-owned deliverables | Acceptance evidence / dependency |
| --- | --- | --- | --- |
| 1 — Connected Journey | One discoverable Chat/Drive → saved Session → Knowledge route | Strict parsed same-origin session deep links with optional view, compatibility with existing links, accessible one-click evidence actions in Chat and Drive, clear error state for missing recordings | Client unit/contract tests and readback; real authenticated browser later |
| 2 — Lifecycle & Recovery | One consistent journey for uncertain, failed and interrupted work | Shared visible statuses and permitted next actions; expired auth and ownership conflicts; stale selections, reconnects and deletion without untrusted old knowledge | Fake API negative cases; real backend dependency: Core owns lease and revisions |
| 3 — Evidence Explorer | Close evidence trace to original observation | More exact SID/sequence/DOM provenance navigation, two-candidate read-only type-drift compare, safe as-of history and explicit missing source | Traceable fixtures, Core provenance IDs; never silent correction/merge |
| 4 — Scale & Accessibility | Dense data remains usable | Bounded lists/virtualization after measurement, keyboard focus/return flows, mobile layouts, history and status readability | Measured representative fixtures and accessibility checks, no speculative perf claims |
| 5 — Integration Acceptance | Coherent end-to-end workflow and release evidence | Full client/server contract matrix, safe acceptance UX, failure/recovery and QA handoff; reconcile remaining Core/Development dependencies | Native Node 22 suite and authorized local Chrome proof where available; independent QA signs acceptance |

## Sprint 1 implementation slice

1. Maintain backwards compatibility with `/#session=<encoded id>`, explicitly support `/#session=<encoded id>&view=knowledge` and reject unknown/malformed selection requests without rendering another recording as evidence.
2. Resolve saved recording via the existing authenticated session endpoint before switching to Knowledge; no silent derive, replay, resend or acceptance.
3. Add a purposeful evidence navigation action in Chat and Drive only when a real saved `sessionId` is supplied. Preserve the preexisting session and transcript links. Label Knowledge as **derived / may be incomplete**.
4. Add visible recovery copy for stale/missing/error deep links, safe selection and failure handling.
5. Test URL encoding, legacy hash, malicious/unavailable inputs, latest-request-wins, invalid view and UI links. Commit source + test fixtures; document execution environment honestly.

## Sprint 1 evidence ledger

**Status:** Sprint 1 source delivered on 2026-10-22, with 46/46 deterministic V8 interface contracts passing against committed source (37 prior contracts + 9 new handoff contracts). Native Node 22, real browser and independent QA acceptance remain pending.

### Shipped source
- Studio `index.html`: compatible `/#session=<id>` link parsing, explicit `&view=knowledge` route, strict field/malformed/multiple input rejection, authenticated session read before showing Knowledge, error guidance, navigation epochs and stale-selection clearing.
- Chat `chat.mjs`: open source recording and optional explicitly labelled derived Knowledge from finished capture and details only if the conversation carries a real saved `sessionId`.
- Live drive `drive.mjs`: same exact saved recording and cautious knowledge navigation, retaining transcript link. It does **not** interpret a reply-match verdict as accepted capture.
- New `test/unit/studio-handoff-ui.test.mjs`: nine deterministic tests for source-backed navigation, legacy links, reserved IDs, malformed and duplicate fields, unavailable sessions, race order and no send/derive side effects.
- Existing four UI suites re-exercised with the current source as regression fixtures.

### Verified GitHub source commits
- [`ca43231`](https://github.com/owenservera/aion/commit/ca4323113813d1fc423452f23f2185b5db2d3b55) — strict session-to-knowledge deep links
- [`c5232c3`](https://github.com/owenservera/aion/commit/c5232c3192048a33ad3f4a7b3d87aa1ebb7ae005) — Chat saved-source / Knowledge actions
- [`204be9a`](https://github.com/owenservera/aion/commit/204be9a11060c9aa03bc353535cfc59ec666af49) — Drive saved-source / Knowledge actions
- [`60c47e1`](https://github.com/owenservera/aion/commit/60c47e132f6249601ee874ed776146a0f50c8856), [`f52a326`](https://github.com/owenservera/aion/commit/f52a326c2b394f85afcc12fb1d0d46f76cce5713), [`a76816c`](https://github.com/owenservera/aion/commit/a76816cf61341b694141997a542ff3903b98a954) — tests and fixture improvements
- [`6e10eb0`](https://github.com/owenservera/aion/commit/6e10eb01ba57fd67e7779f116a4dbdff603cff76) — fail closed on invalid or unavailable saved recording link

### Execution evidence and acceptance boundary
All 46 test bodies were run from GitHub-fetched exact source/test blobs in an isolated JavaScript V8 compatibility harness: 46 passed / 0 failed. The browser inline script, Drive script and export-stripped Chat module parsed. The newly committed tests are Node `node:test` test files, **but the native Node runner was not executed** during this source-only interaction. No authenticated Chrome, Windows local runtime, real AI-site send or independent QA acceptance occurred. Session IDs are only used as same-origin navigation identifiers; no raw transcripts, credentials, or cookies were put into Git.

### Remaining Sprint 1 acceptance
- Run native Node 22 UI unit suite against local checkout and exercise authenticated Chat → saved session → Knowledge in actual Studio.
- Verify keyboard focus and narrow-screen switch, missing/removed session and 401 scenarios with browser evidence.
- Read-only functionality may be merged into broader UI, but do not mark physical acceptance complete.

### Next queued build
**Sprint 2 — Lifecycle & Recovery**: shared uncertainty/lease/reconnect/delete status language and state-safe recovery across Chat, Drive and Sessions. No automatic resend; contract ownership remains Core.


## Continuous pull after Sprint 1

Proceed to Sprint 2 only after updating this receipt and the standing UI queue. Do not preempt ongoing Core or Knowledge & Learning work. GitHub records do not automatically wake other agents.
