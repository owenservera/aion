# Sprint 1 — Conversation Safety, Ownership and Evidence Contract
**Owner:** Systems / Algorithms / Usability. **Date:** 2026-10-22. **Pinned source:** AION \`34e1a913248c717c7f3d7c54f4be30bc9b23a098\`. **Status:** completed first *source-backed architecture assessment*, NOT implementation, executed QA, real Chrome validation or platform acceptance. **Parent:** [SPRINTS.md](SPRINTS.md).

## One-page result
The new Studio conversation stack is substantially safer than yesterday's direct-site drive: service journal + stable attempt keys, single-dispatch input primitive, exact target origin, preflight, persisted capture-session ownership, host-local drive lease and explicit unknown outcomes exist **in source**. The current main also improved stop/restart handling, Chat uncertainty, capture-path latency and old session activity guards. Existing unit fixtures cover many of these properties, but they cannot establish whole-browser or Development/Track B mutual exclusion.

**Most valuable source-level tension:** \`conversation-runtime.mjs:abortFailedConnect\` releases the host-local lease unconditionally in its \`finally\` even when \`adapter.abortConnect()\` returns \`captureFinalized:false\` or throws. By contrast normal \`finishEntry\` releases only after a confirmed capture stop, and legacy \`driveSite\` retains its lease after recorder stop failure. This is a different safety behavior across three lifecycle paths. Whether concurrent ongoing browser effects are possible in the failed-connect case is **not proven** by an executed test here. Suggested minimal correction is a shared ownership-release invariant based on *provable resource finalization*, with an explicit recovery path for stranded leases.

This advisory is not a QA defect ticket and does not override the owner's consolidation decision.

## Architecture / actual caller and state map

\`\`\`text
Studio Chat UI /chat
  -> authenticated POST /api/v1/conversations (Connect)
  -> POST /api/v1/conversations/:id/turns (one explicit Send)
  -> POST /api/v1/conversations/:id/reconcile (read-only Check)
  -> POST /api/v1/conversations/:id/finish (Finish)
       | all through createConversationApi
       v
conversation-runtime.mjs  (sessions, lease, time/byte budget, recovery)
       -> conversation-service.mjs (durable snapshot, attempt + idempotency, revisions)
       -> conversation-browser-adapter.mjs (exact browser target + raw Recorder + DOM observation)
       -> actions.mjs (one chosen send method; no unknown-outcome fallback)
       -> recorder.mjs / raw-log.mjs (authoritative captured evidence)

CLI chat -> same defaultConversationRuntime() library; server not required.
Drive UI -> drive-api.mjs -> driveSite() -> same acquireDriveLease(), but legacy own lifecycle.
Campaign -> driveSite() (sequential, plan-only default); still legacy verdict.
Development/Track B -> owner decided future thin consumer of Studio, not source-proven caller today.
Knowledge/L4/L5 -> NOT automatically justified by a visually ready reply.
\`\`\`

Sources: [src/studio/conversation-api.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/conversation-api.mjs), [src/capture/conversation-runtime.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/conversation-runtime.mjs), [src/capture/conversation-service.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/conversation-service.mjs), [src/capture/conversation-browser-adapter.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/conversation-browser-adapter.mjs), [src/capture/actions.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/actions.mjs), [src/studio/drive-api.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/drive-api.mjs), [bin/commands/chat.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/bin/commands/chat.mjs).

## Invariant inventory — current implementation vs proof

| Required property | Exact supporting source | Evidence grade / remaining question |
|---|---|---|
| Target must not silently change | service \`exactBinding\`; adapter \`check()\` checks target id + browser origin + in-page origin | Implemented source; no local Windows evidence pinned |
| No inherited draft overwritten | adapter preflight checks draft; service persists attempt before typing | Implemented source, mock tested |
| One send method per attempt | \`actions.mjs:sendMessage\`: choose button OR Enter and observe; never fallback after ambiguous dispatch | Source and tests, not exactly-once provider guarantee |
| Stable idempotency | service returns existing same-key/same-payload result even after Finish/restart; conflicting payload => error | Source, builder tests |
| Failed/unknown send not claimed successful | \`observe\` checks origin, turn id, digest, session, sequence beyond preflight; user-turn page evidence or outgoing network | Implemented source; the adapter currently emits attributable **page** evidence; provider exchange completion remains unknown |
| Uncertainty never silently causes automatic resend | service and UI \`Check again\` call read-only observation; user-only \`Send again\` issues NEW key with warning | Source yes, but explicit new-key resend is an intentional **possible-duplicate** action |
| Sole driving owner | \`acquireDriveLease\` keyed to host-local CDP port; Chat and legacy Drive both call it | Studio source + targeted tests; separate Development sender adoption not shown |
| Finish does not discard evidence | service stops capture before closing owned tab; successful normal Finish releases lease after stopped | Source; connection failure exception below |
| Readiness != accepted evidence | \`recordReply\` saves \`completion:'unknown'\` from page; Finish marks capture incomplete | Source; G1–G7 acceptance evaluator still a design dependency |
| No implicit live driver activation from record/status GET | HTTP GET routes use runtime list/get/targets; reconciliation is explicit POST but read-only at adapter | Source; no new live acceptance |
| Crash/ambiguous owner recovery is safe | versioned local snapshots, conservative restart/unknown flags, host lease inspection | Partial: unconditional failed-connect lease release and corrupt-owner reclaim need reconciliation |

Source evidence also includes [test/unit/conversation-runtime.test.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/test/unit/conversation-runtime.test.mjs), [test/unit/drive-lease.test.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/test/unit/drive-lease.test.mjs), and [test/unit/chat-ui.test.mjs](https://github.com/owenservera/aion/blob/34e1a913248c717c7f3d7c54f4be30bc9b23a098/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/test/unit/chat-ui.test.mjs); these are **existing tests inspected, NOT rerun here**.

## Ranked findings — source and counterevidence, with small corrective choices

### S1-F1 — HIGH: failed-connect cleanup and ownership-release mismatch
**Source path:** \`conversation-runtime.mjs:107–127\`: the adapter can return \`captureFinalized:false\` or throw; that failure is reported as an incomplete capture limitation. But \`finally\` always executes \`lease.release()\` and clears \`entry.lease\`. \`conversation-browser-adapter.mjs:222–231\`: abortConnect can report \`captureFinalized:false\` when stop fails. \`conversation-runtime.mjs:85–100\`: normal Finish retains the lease until stop completion. \`actions.mjs:1189–1191\`: legacy drive retains on stop failure. **Thus this is a deterministic path distinction, not inferred from missing tests.**

**Why it matters:** a failed attach where the recorder still owns or may still own CDP/raw resources could leave the browser unguarded for a second driver. The session is labeled incomplete, which is good, but the lease is the active exclusivity boundary.

**Counterevidence checked:** existing test \`conversation-runtime.test.mjs\` F3 asserts ownership stays held *during* abort and is freed after \`captureFinalized:true\`; unconfirmed TAB CLOSE with successful capture cleanup also frees it. F5 tests retryable recorder stop but does not prove the runtime \`captureFinalized:false\` branch is safe to release. The normal Finish release check is already conservative.

**Smallest design option (Core/runtime):** release only if the capture's ownership state is positively finalized or no recorder/side effect was ever acquired. If unknown, persist failed owner/recovery metadata and keep exclusion until a trustworthy recovery verifies stopped state; do not wedge owner forever without a diagnosable recovery interface. This needs a deliberate tradeoff between safety and stale-lease recovery, not an automatic broad refactor. **Suggested independent test:** injected abortConnect returns \`captureFinalized:false\`; another owner attempts same-port acquire; verify no unsafe overlap, then simulate explicit recovery. **State:** source-derived risk, no test executed.

### S1-F2 — HIGH-MEDIUM: lease corruption recovery can override a live process without proving it inactive
**Source path:** \`drive-lease.mjs:inspectDriveLease\` categorizes missing/unparseable owner.json as \`reclaimable:true\` without process identity. \`reclaimStale\` allows reclaim after \`staleGraceMs\` (default 2000ms), even if an unrelated still-live owner cannot be identified from the file. A validated live-owner pid blocks recovery. \`drive-lease.test.mjs\` explicitly corrupts/removes a held owner file and creates a new lease at zero grace; old handle cannot release the replacement.

**Why it matters:** crash recovery is a legitimate requirement, but a corrupt/missing owner document does not itself prove any incumbent browser/capture effect stopped. The test checks lock races; it does not establish continued browser ownership under metadata corruption.

**Smallest option (Core/integration):** use recoverable durable journal/recorder ownership evidence to decide unknown-owner takeover; maintain safe recovery UX and keep legitimate dead-pid reclamation. **Independent scenario:** current process holds a real capture and its owner.json becomes unreadable/absent; after grace, check whether another driver can acquire without cross-process live-owner proof. **State:** deterministic recovery policy, conditional safety hazard (not production incident).

### S1-F3 — HIGH as program dependency: Studio and Track B are not yet proven to share one lease
**Source proof of progress:** Chat runtime and legacy \`driveSite\` both import the host-local lease and use the CDP port as exclusion key; \`drive-api.mjs\` exposes conflicts. The owner's [QA integration roadmap](../../qa/capture-studio/INTEGRATION-ROADMAP.md) decided Studio as canonical browser capture/drive engine, and labels P1b (make Development's Send consume lease) as outstanding.

**Correction (Development/owner integration):** one documented lease capability and one sender. Retain extension/native-host transport solely as a client after adoption. Do not create a new browser engine or unilaterally retire Track B. **QA suggestion:** simultaneous Studio Chat, Studio Drive and legacy Development sender on the same exact target; only one may proceed and no double-send. **State:** planned external integration; no ACK/acceptance shown in assessed material.

### S1-F4 — MEDIUM: explicit resend semantics require careful boundary wording
**Source:** service \`submit\` replays a matching idempotency key read-only even after Finish, rejects a changed payload and allows a **new key** after an in-process unobserved attempt. UI one-click \`Send again\` uses new key after its own transport-ambiguous POST, except when the server snapshot itself is uncertain. UI \`Check again\` uses only \`/reconcile\`, and recent tests assert there is no automatic turn repost.

**Interpretation:** This is **not** an unnoticed automatic-send defect. It is a deliberately enabled user action that can duplicate a provider turn if earlier request acknowledgement was lost or page history is incomplete. Returning “no new message found” from a read-only inspection is weaker than evidence proving no prior send.

**Smallest option (UI + Core contract):** ensure “no matching turn recorded” is never displayed as “definitely not sent”; keep clear duplicate risk beside the action and maintain a single new-key pathway. Decide product policy through owner, not Systems. Suggested scenario: HTTP response lost AFTER server registration, stale client snapshot and incomplete virtualized user-turn history. **State:** behavioral source trace, risk semantics not runtime failure.

### S1-F5 — MEDIUM: different lifecycle vocabularies and evidence verdicts have not converged
**Source:** \`conversation-service.mjs\` uses \`ready / observed / uncertain / incomplete\`; \`drive-api.mjs\` explicitly says calibration verdict is *reply-word match, capture acceptance not checked* and cancellation is \`after-current-site\`. \`actions.mjs:driveSite\` independently records/stops and enforces a lease. The unified design calls for one Connect/Read/Send/Check/Finish interface and versioned G1–G7 acceptance with no unknown gate silently passed.

**Smallest option (Core/Integration, later UI):** preserve legacy Drive compatibility while sharing a typed lifecycle projection and proof-grade \`capture_status\` / \`completion_status\` / \`acceptance_verdict\`. Do not rewrite the legacy campaign in this Systems sprint. Explicitly surface between-sites cancellation as distinct from cancellation of an active send. **State:** partial converged source and proposed shared contract.

## Additional positive evidence to preserve
1. Capture-path optimization \`375659c\` reports lab p99 442→88ms and throughput 0.32→1.45MB/s for 64MB/4 streams with byte-equality checks. These are synthetic lab claims, not real-browser acceptance.
2. Conversation UI only renders external/site text through DOM text nodes and \`textContent\`, not HTML-string insertion; deliberate one-click Send and no auto-repost are supported by latest changes.
3. Failed-connect tab cleanup restricts close to Studio-created tab with exact id; owner tabs are not closed by that path.
4. Core missing-key collision and empty-derivation defects from [Assessment 01](ASSESSMENT-01.md) received later source fixes; avoid repeating stale diagnosis.
5. The host lease includes PID + random token and guards against old owners deleting a replacement; its normal proven-live-owner case is conservative.

## Sprint 1 closeout
**Examined:** current source snippets for conversation runtime/service/browser adapter, drive lease, actions, campaign, drive API, conversation HTTP and Chat UI; selected corresponding tests; 2026-10-22 unified design and owner integration decision. **Pinned:** \`34e1a913248c717c7f3d7c54f4be30bc9b23a098\`. **Method:** GitHub read-only source inspection, not exhaustive whole-repo audit. **New tests executed:** 0. **Browser/Windows interaction:** none. **Files/LOC:** no canonical checkout; product layer file/physical LOC and change deltas **not measured** per [QA reporting standard](../../qa/capture-studio/REPORTING-METRICS.md). **Product source edits:** none.

**Recommendations only, not assignments or QA gates:** preserve the existing verified behaviors; clarify unsafe capture-finalization release (F1) and corruption recovery (F2) as the first Core design questions; then finish P1b external lease adoption (F3). UI resend wording (F4) and convergence of truth vocabulary (F5) can be handled within their existing owner queues rather than initiating parallel feature work.

**Sprint result:** Systems assessment completed and archived. **Sprint 2:** capture completeness/provenance/cost investigation, queued, not automatically active. No background work or agent activation implied.
