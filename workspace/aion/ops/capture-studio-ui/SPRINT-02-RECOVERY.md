# Capture Studio UI / Integration — Sprint 2: Lifecycle & Recovery

**Owner:** UI / Client Integration · **Built:** 2026-10-22 · **Status:** source delivered, deterministic V8 checks passed, native Node/browser/independent QA pending.
**Authority:** [Five-sprint workplan](FIVE-SPRINT-WORKPLAN.md). This is *the second sprint in the October 22 five-sprint plan*, not the earlier historical `SPRINT-02.md` knowledge work.

## Mission
Make the existing Chat, Live drive, and saved recording / Knowledge journeys recover safely from stale selections, busy browser ownership, uncertain side effects, missing records and failed local transport. Maintain existing Core contracts: no automatic send, no automatic resend, no new lease or backend protocol, no conflation of reply match and accepted recording.

## Shipped — concrete source changes

| Area | Current change | User-visible / integrity consequence |
| --- | --- | --- |
| Chat selection | `openConversation` uses request epoch so older response cannot overwrite newer selected conversation; missing different conversation retains truthful previous selection; missing current conversation clears it. | Selecting entries quickly cannot silently display the wrong conversation. |
| Chat poll lifecycle | Strict `stillOn` requires actual selected conversation; `newConversation` and missing-current handling invalidate old open requests. | Obsolete poll or open result cannot revive an abandoned view. |
| Chat send recovery | Original in-flight request captured as immutable `attempt`; late successful/definitive/ambiguous response touches only the original conversation's pending/sent record. New selection's pending and composer are not unlocked, discarded or overwritten. | No cross-conversation contamination; ambiguous original send stays pending until explicit read-only reconciliation/user action. |
| Drive job selection | Job load epoch; a late older job response cannot replace a newer selection, incorrect job identity is rejected, and an old load error cannot overwrite current job error. | Job/status identity remains clear. |
| Drive lost job | 404 while polling says the last displayed state is stale, does **not** assume the job stopped, and disables the current stop control. | No false completed/failed verdict. |
| Drive lease conflict | 409 with `holder.kind=conversation` identifies Chat and links to /chat; known Drive active job shows that job; unverified holder reports busy/unknown. Live-run confirmation is reset after rejection; **no automatic queue/retry**. | User receives the correct next step instead of misleading `another Drive job` wording. |
| Studio network failure | Local fetch/network failure explicitly labels current evidence stale, says no action was retried, propagates status=0. | A disconnected Studio isn't confused with an accepted capture. |
| Saved recording and Knowledge | Changing selection clears all previous entity/model/graph/drift/history panels; failed/removed/unauthorized recording read clears the unverified session selection and gives specific recovery text. | No previous recording's inferred knowledge is shown as belonging to a new/failed selection. |

## Scope and API boundary
Only frontend `src/studio/ui/{chat.mjs,drive.mjs,index.html}`, existing UI-only tests and the UI docs were edited. Core owns browser/CDP, send, idempotency, lease, persistence, data provenance and route correctness. No live network send or native Chrome test was initiated. Chat's existing deliberate **Send again** action remains manual only; its semantics and safety must be independently accepted against Core, not inferred from UI source checks.

## Implementation commits

- [`aa17bcec`](https://github.com/owenservera/aion/commit/aa17bcec415e2b1bd2bfad72413a5d6cf5842401) — Chat conversation selection race.
- [`9b400c3c`](https://github.com/owenservera/aion/commit/9b400c3caa3a9117e48d799d91cb031d0f6cb5a5) — Drive job selection and stale-job uncertainty.
- [`2193f455`](https://github.com/owenservera/aion/commit/2193f455ccf66999d726e21b7508051bf687f05a) — original-conversation send response isolation.
- [`7878a068`](https://github.com/owenservera/aion/commit/7878a068ca830445add9320ab44f0de9e44df87c) — correct 409 lease owner recovery.
- [`4fadbe94`](https://github.com/owenservera/aion/commit/4fadbe9440dc278d3f1746532b6494f43b716052) — Home network/selection/Knowledge recovery.
- [`3d3b2c01`](https://github.com/owenservera/aion/commit/3d3b2c010613901f969defd05e51b0c817b8d7d7), [`05756202`](https://github.com/owenservera/aion/commit/0575620272ad6b3fd29f63150353572b39c13f0c), [`eda039a8`](https://github.com/owenservera/aion/commit/eda039a8d9be4a4196feff9e1d46c55572393c75) — 16 deterministic recovery tests / harness.
- [`d4a96889`](https://github.com/owenservera/aion/commit/d4a968892d4bc45bdd8620ea65e01e267c418fff) — prior test updated to the new clear-selection contract.

## Verification and acceptance boundaries

**Actual execution in this UI lane:** all **62 / 62** committed UI contract tests across six UI test files executed in a V8 compatibility harness using GitHub-fetched source/test blobs, with no failures; source scripts also parsed. Tests: Studio 6, Knowledge 18, Search 6, Integration 7, Handoff 9, Recovery 16. New tests simulate delayed responses, contradictory IDs, 404, ambiguous result, Chat holder 409, unidentified owner 409, selection invalidation and offline Studio. This is source-derived deterministic testing; **not** the native Node `node --test` suite and **not** a Windows authenticated browser run.

**Not accepted:** actual ChatGPT connect/reply behavior; real lease contention between processes; Chrome keyboard/mobile; locally recorded session transition; full capture completeness; independent QA. No benchmark timing or physical LOC measured. Any existing Core/QA source receipts retain their independent provenance.

## Next sprint

**Sprint 3 — Evidence Explorer:** source-backed graph/relationship/DOM stream path, review-only side-by-side type-drift comparison, incomplete/unknown historical truth, absence of source IDs; preserve no merge/retraction from missing evidence. Start from [Five-sprint plan](FIVE-SPRINT-WORKPLAN.md) and review latest Core temporal contract first.

## Open acceptance gates

1. Run actual Node 22 UI suites on a complete checkout, then latest full test suite.
2. Reproduce stale Chat selection, disappearing job and auth expiry in locally hosted Studio without a real send.
3. Separately prove one authorized live turn and one accepted evidence chain when permitted by owner/QA. Neither happened in this sprint.
4. Verify the Chat manual Send again contract with Core's at-most-once/idempotency semantics; never infer a missing response means no send.
