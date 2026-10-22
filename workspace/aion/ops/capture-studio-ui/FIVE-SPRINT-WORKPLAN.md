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

**Status:** active. Pending source and test commit receipts; no local Windows/browser acceptance asserted.

## Continuous pull after Sprint 1

Proceed to Sprint 2 only after updating this receipt and the standing UI queue. Do not preempt ongoing Core or Knowledge & Learning work. GitHub records do not automatically wake other agents.
