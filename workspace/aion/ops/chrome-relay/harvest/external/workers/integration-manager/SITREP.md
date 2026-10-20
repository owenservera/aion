# AION Integration Manager — source packaging SITREP

**Date:** 2026-10-20. **Authority:** AION `main`; accepted target architecture from draft PR #46 (direction only). **Scope:** PACK-01 first, PACK-02 second. **Verification:** source adaptation and Git commit receipts; NO donor tests, AION tests, Windows execution or live browser proof.

## Actual custody and dispatch order

| Order | Owner | Deliverable | Dispatch/evidence status | Next action |
|---|---|---|---|---|
| 1 | Integration Manager (this worker) | PACK-01 / Bridge read-only journal, cursor and inferred-terminal | **DELIVERED** — [`b06b0e5`](https://github.com/owenservera/aion/commit/b06b0e54cb0c57f3dcdc1d6df7c2ef06973c2599) | Development review P1 insertion and AION tests |
| 2 | Integration Manager (this worker) | PACK-02 / Multi-AI read-only ChatGPT DOM observer and anchoring | **DELIVERED** — [`5f72abd`](https://github.com/owenservera/aion/commit/5f72abda13010cdc3d5211895e232cf6f87f4906) | Development review P2 insertion and AION tests |
| 3 | Development chat | P1 canonical event/1 + snapshot/1 validators; integrate PACK-01 | **QUEUED / NOT INTEGRATED** | Owner dispatches or resumes Development chat explicitly |
| 4 | Development chat | P2 provider observer/profile integration; consume PACK-02; P3/P4 watch-only | **QUEUED / NOT INTEGRATED** | After P1 contract, Development runs AION offline then authorized live I1 |
| 5 | Development + owner-authorized Windows agent | Real I1 watch-only receive proof | **BLOCKED** by integration | Development requests a local test after offline implementation |

**No automatic worker activation:** saved TODOs and a commit do not dispatch Development. External Nine is separate and may commit in parallel; its work is not automatically Development accepted. A concurrent External Nine commit on main required a clean rebase of PACK-02, with no overlapping pack file changes.

## Delivered code

PACK-01: [receive-journal.js](packs/PACK-01/receive-journal.js), [terminal-evidence.js](packs/PACK-01/terminal-evidence.js), [insertion/negative-test notes](packs/PACK-01/README.md), MIT license. Corrects tail-window omission by paging the first unseen N, rejects any ahead cursor including matching epoch; explicitly signals gaps and unknown history.

PACK-02: [chatgpt-profile.js](packs/PACK-02/chatgpt-profile.js), [chatgpt-observer.js](packs/PACK-02/chatgpt-observer.js), [response-boundary.js](packs/PACK-02/response-boundary.js), [insertion/negative-test notes](packs/PACK-02/README.md), both donor MIT licenses. No Send/control/router/private endpoint. Page DOM coverage is `complete_history:false` by design, remount `first_seen` is unconfirmed, and terminal is never Bus verification.

## Development must integrate and prove

- **P1:** `extension/src/lib/conversation-contract.js` is not yet on main. Development defines typed names and validator and injects `validateEvent`; journal internal argument structure is **not** a substitute wire schema.
- **P2:** `extension/src/providers/chatgpt/{observer,profile}.js` are destination paths, not created runtime files. Existing binding authority must supply account, conversation and page-epoch proof; adapting read-only selectors may require live adjustment.
- **P3/P4:** receive hints and authoritative snapshot through the current native host / local IPC and REPL, **not** `velocity/src/broker/events.mjs` and never a Bus effect.
- **Offline AION verification:** retained 150/page 100 ascending replay; retained cursor gap; matching-epoch cursor ahead; wrong binding/page; stale/old answer/remount; empty/incomplete assistant; truncated DOM; malicious command-shaped text harmless. **None executed by Integration Manager.**
- **I1:** only Development and the explicitly authorized local Windows agent may claim actual watch-only CLI receive.

**Exchange:** Existing AX-0007/0008/0016/0017 now link code via `implementation_refs` without upgrading source evidence to tested or adopted. No new queue or implementation acceptance.
