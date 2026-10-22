# Capture Studio Systems — Minimal Windows Observability Handoff

**Date:** 2026-10-22  
**Owner:** Systems / Algorithms / Usability  
**Purpose:** smallest useful observation map for QA's first local Windows rounds L0–L5. **This is the final short pre-local Systems deliverable, not Systems Sprint 3.**  
**Pinned readback:** `75032dc868b806ba47e4720e52cf857c818040e2` (GitHub main as assessed). **Local execution must record its OWN actual `git rev-parse HEAD`.**  
**Authority:** [QA local integration runbook](../../qa/capture-studio/LOCAL-INTEGRATION-ROUNDS-2026-10-22.md), owner local-first simplicity directive [issue #65](https://github.com/owenservera/aion/issues/65).  
**Evidence class:** GitHub source and QA contract inspection only; **0 Windows runs, 0 new tests, 0 new source instrumentation, 0 actual metrics measured**.

## Recommendation

**No new monitoring server, database, daemon, polling agent, dependency or approval step.** The current capture engine *already* publishes much of what the local test team needs. QA should sample existing CLI/API/fixture output at step boundaries; make only genuine missing values explicit. Keep full evidence outside the repository on the Windows machine. Only the owner-approved sanitized `shareable/` packet returns to GitHub.

**Five questions every failing run should answer:**

1. **When** did the relevant action begin/end, and what stable local correlation key links it to the saved session? 
2. **What data was recorded, omitted, truncated or not yet verified?**
3. **Who owned the selected browser/recorder at that moment?**
4. **What resource or latency measure demonstrates the suspected bottleneck (rather than a guess)?**
5. **Which single component should be corrected, and what exact fixture should the local team replay?**

## 1. Signal map — existing collection surfaces first

| Signal / use | Existing source, actual field or command | Minimum local measurement | Source-owner for a failure |
|---|---|---|---|
| **Environment and startup L0** | `node bin/studio.mjs doctor --json` emits `{ok,checks}` for node, chrome, devtools, data-dir, sessions, profiles, learner, config; `paths --json` resolves data directories. `GET /api/status` returns version, CDP port, reachable Chrome, recorder status and data directory | Exact Git SHA/dirty summary; Node/Chrome/CDP, Studio start/end wall clock, HTTP status, screen usability, stdout/stderr, actual resolved data path (private-only) | Core CLI/server or environment |
| **Action latency L0–L5** | `scripts/live-e2e.mjs` writes `live-e2e-result.json` with step `status`, `ms`, `detail` and total PASS/FAIL/SKIP. `derive.buildReceipt` provides first-byte and last-response/terminal times for observed streaming evidence | Step monotonic elapsed ms + start/end ISO times; sample startup, Connect, preflight, one explicit Send, first observed reply, Finish/verify, derive, open exact session link. For no data use `null` + reason | Core when CLI/CDP/recording; UI for navigation/client |
| **Raw queue and actual loss L1/L3/L5** | `GET /api/status` → `recorder.queue.{records,bytes}`; `recorder.stats.raw.{records,bytes,droppedRecords,droppedBytes,gaps,maxQueueBytesSeen}`; `recorder.summary.gaps`; `session verify` → `{ok,gapRecords,droppedRecords,seqGaps,unexplainedSeqGaps,segments}` | Sample near run start/end, on observed stall, and after stop. Record `queue_peak_bytes` only if sampled; `droppedRecords`, `gapRecords` and `verify.ok` must be actual returned fields. Distinguish queued vs OS-written vs sealed/verified | Core recorder/raw store |
| **Stream completeness / truncation L1/L2/L5** | `recorder.stats.network` has `requests,streamed,armFailed,retrospective,bytes,truncatedStreams,sensitiveExcluded,wsLateJoined,wsMetadataFrames`; raw `body.truncated`, `body.excluded`, `stream.arm_failed`, `gap`, `run.end.openStreamsAtEnd`; `RECEIPT.replay_and_gap_diagnostics` and session stream summary | Per stream `sid`, evidence kind, bytes observed, truncate/exclusion reason, unknown prefix/suffix, lateJoin, open-at-stop. Raw `A1_RAW_CAPTURE_VIABLE` is **not** full-fidelity or G1–G7 acceptance | Core L1/L2; QA validates; L5 decides eligibility |
| **Connection and target continuity L2/L3** | `recorder.transport.reconnects,reconnecting,lastReconnectError,cdp.{closed,lastPingMs,sent,events,timeouts}`; `recorder.targets.list`; raw `reconnect.attempt/ok/failed`, `lifecycle`; `conversation.binding` + `sessionId` in conversation runtime | Match `targetId` and origin before/after operation. Count reconnects/timeouts and exact failure stage; do not imply pre-attach or reconnect outage bytes were observed. Redact full target URL in shared outputs | Core CDP/recorder, UI if incorrect selection |
| **Browser ownership / recoverability L0/L3** | `src/capture/drive-lease.mjs:inspectDriveLease()` exposes exists, port, ownerFile, ownerState, ageMs, reclaimable, holder in a **library function**, NOT a verified public CLI endpoint. Conversation snapshots expose `state,capture,diagnostic,turn,sessionId`; Drive API distinguishes lease-busy conflicts | Record `lease_conflict_code`, `owner_kind`, owner-proven-alive/dead/unknown and recovery effect; never share lease token, PID or local filesystem path. Note where no exposed read-only CLI/API exists instead of adding a second lease manager | Core lease/runtime; UI recovery display |
| **CPU / memory / disk L1/L5** | No stable Capture Studio app-wide CPU/RSS sampling endpoint verified in assessed source. Windows native `Get-Process` and per-run saved raw `session stats` / `session.bytes()` can supply data; `recorder.stats.raw.bytes` is write accounting, not CPU or RSS | Only sample the **identified Studio Node PID**, owned fixture Chrome PID and run directory; capture `WorkingSet64` / cumulative CPU seconds and time deltas and directory-size snapshots. Missing PID = `not_measured`, not zero | Core if leak/throughput; local environment if external pressure |
| **Knowledge/provenance L4** | `GET /api/sessions/:id` exposes `meta,state,receipt,datasets,knowledgeOutcome`; `GET /api/sessions/:id/knowledge-status` returns `deriving/complete/failed/legacy-unverified`; derived `RECEIPT.nsp` includes partial graph integrity indicator | Keep source session id, raw verify, derived dataset counts, NSP graph warning count, temporal/model version. Separate source-recorded vs inferred vs accepted vs learned. No invented family approval | Core derived integration + L4/L5 specialist |
| **Usability friction L0–L4** | Current Chat/Drive UI, local access mode and state-dependent recovery; no authoritative UX timing counter verified | Measure number of deliberate actions, retries, unexpected confirmation steps, blocked states, and elapsed time to inspect saved evidence. Screenshots/private text remain local | UI; Systems analyzes systemic pattern |

**Links:** [Recorder](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/recorder.mjs) · [Network](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/network.mjs) · [RawLog](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/raw-log.mjs) · [Session.verify](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/session.mjs) · [Conversation runtime](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/conversation-runtime.mjs) · [Lease](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/drive-lease.mjs) · [Studio server](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/server.mjs) · [Derivation receipt](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/derive.mjs) · [CLI doctor](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/bin/commands/system.mjs) · [Fixture driver](https://github.com/owenservera/aion/blob/75032dc868b806ba47e4720e52cf857c818040e2/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/scripts/live-e2e.mjs).

### Practical source caveats

- **Recorder status shape is live-only** for a running Recorder instance. Session `verify`, `meta` and stored `RECEIPT` are the after-run evidence; don't label missing live counters as an empty run.
- **Some counters overlap.** `recorder.stats.raw.gaps` (writer side), `recorder.summary.gaps` (decoder view), and `verify.gapRecords` (saved record scan) are not three independent losses; name source, timestamp, and denominator.
- **The recorder raw queue is bounded, not the entire upstream process.** `network.mjs` still accumulates `st.pendingData` while stream arming. Thus `recorder.queue.bytes=0` cannot prove absence of in-memory CDP backlog.
- **Configurable stream cap isn't necessarily an exact enforced byte limit.** `network.mjs:_chunk` tests recorded+pending bytes before admitting the current incoming chunk, so an oversized final chunk may overshoot the threshold; record actual accepted bytes and truncation events, not inferred cap enforcement.
- **Privacy mode matters:** latest `network.mjs` chooses local raw versus guarded capture through `capturePrivacy(profile)`. The guard itself is not proof that exported packets are safe. Record *effective capture mode* (`stats.network.captureMode`), keep original local evidence private and only share a sanitized summary.
- **Timing accuracy:** `RawLog.flush` uses periodic writes and scheduled fsync; periodic fsync errors are swallowed, so a configured 1-second interval is not proof of an actual successful persistence deadline. `recordConversationObservation` explicitly fsyncs the matching action marker; normal stop closes and verifies. Mark timed durability `unmeasured` if no observed success timestamp exists.
- **Current one-conversation runtime still specifies** `maxDurationMs=15 min` and `maxBytes=256 MiB` in source. Under owner issue #65 these are potential **usability-friction signals**, not new Systems gates; log `capture.limitReason` rather than enforcing another approval.
- **Target ownership and send ambiguity:** a session ID is not a send receipt. Record `turn.send.state` distinctly from `reply.state` and from capture verification; never auto-resend an uncertain real prompt for instrumentation.

## 2. Minimum event/timestamp contract (no new product logger required)

QA's `steps.jsonl` already defines `step_id,action,started_at,ended_at,result,evidence_ref,effect_class`. Add or preserve only these *optional* subfields when the output actually provides them:

| Event | Time captured by local runner | Correlation required | What must **not** be inferred |
|---|---|---|---|
| environment ready | `doctor` start/end | exact git SHA, run_id | Chrome installed ≠ DevTools reachable |
| Studio ready | startup request to first successful `GET /api/status` | PID when known; CDP/studio ports | HTTP 200 ≠ UI or record pipeline accepted |
| Connect/preflight | explicit action start/end | conversation ID, selected targetId, origin label (sanitized) | tab availability ≠ attachment/ownership |
| Send | user explicit action start/end | stable idempotency key **hash or local-only key**, conversation ID, attempt id | HTTP response or typing ≠ provider delivery |
| reply observation | first credible reply and last observed update | attempt, saved session, source class (DOM/network/unknown) | reply text appears ≠ terminal completed |
| stop/verify/derive | each step start/end | session ID, `verify.ok`, dataset and receipt references | complete recorder ≠ complete provider history |
| inspect evidence | link click to first saved evidence displayed | exact session ID, optional SID/seq | open UI ≠ underlying evidence accepted |
| recovery | failure start, inspect, attempted recovery, result | existing session/lease holder kind, no token | lease reclaimed ≠ an uncertain send safe to repeat |

**Sampling policy:** collect at *L0/L1/L2/L3 step boundaries* and one additional sample at a visible stall. For L5 controlled load, sample process/resource counters at fixed intervals selected by the local runner and state that interval; never claim p95/p99 from one start/end measurement. **Do not add a continuous polling service or record individual user keystrokes.**

## 3. Suggested `metrics.json` Systems section (template, NOT a measured result)

This is a schema *example* to nest under QA's existing run-level `metrics.json`. All `null` values mean **not measured or not available**; provide optional `missing_reason`. Only populate exact source counters actually captured; never fill with synthetic success values.

```json
{
  "systems": {
    "source": {
      "git_sha": null,
      "recording_session_id": null,
      "snapshot_at": null,
      "capture_mode": null
    },
    "timing_ms": {
      "studio_start": null,
      "connect": null,
      "send_to_first_observed_reply": null,
      "stop_and_verify": null,
      "derive": null,
      "open_saved_evidence": null
    },
    "capture": {
      "queued_bytes_peak_observed": null,
      "raw_written_bytes": null,
      "raw_dropped_records": null,
      "verify_gap_records": null,
      "verify_ok": null,
      "stream_truncations": null,
      "stream_body_exclusions": null,
      "incomplete_at_stop": null,
      "websockets_late_joined": null,
      "cdp_reconnects": null,
      "cdp_timeouts": null
    },
    "ownership": {
      "target_id_hash": null,
      "lease_owner_kind": null,
      "lease_owner_state": null,
      "conflict_error_code": null
    },
    "resources": {
      "studio_node_rss_peak_bytes_observed": null,
      "studio_node_cpu_seconds_delta": null,
      "chrome_rss_peak_bytes_observed": null,
      "run_dir_disk_bytes": null,
      "sample_count": 0,
      "sampling_period_ms": null
    },
    "missing_reason": [
      "Unmeasured fields remain null; sample_count=0 in this empty template"
    ]
  }
}
```

**Interpretation:** `queued_bytes_peak_observed` is a *sampled peak* unless it came from `maxQueueBytesSeen` (which is an actual recorded internal maximum); state which. `stream_body_exclusions` requires counted `body.excluded` events from stored raw, because `sensitiveExcluded` counts only one class of exclusion. The Windows process CPU number is cumulative per PID; its **difference between samples** is a CPU-seconds delta, not instantaneous percentage.

## 4. Read-only local collection recipes — no local installation claimed

From the **exact Capture Studio project directory** in PowerShell, QA/local executor can use existing commands. Run the fixture's browser-starting path only after its ownership isolation is understood:

```powershell
git rev-parse HEAD
git status --short
node --version
node bin/studio.mjs doctor --json
node bin/studio.mjs paths --json
node bin/studio.mjs session list --json
# After a known session ID exists:
node bin/studio.mjs session stats <SESSION_ID> --json
node bin/studio.mjs verify <SESSION_ID> --json
# Read-only status on an already running Studio instance:
# Invoke-RestMethod "http://127.0.0.1:7878/api/status"
# Existing synthetic fixture without browser:
node scripts/live-e2e.mjs --no-browser
```

For an actual fixture run, `scripts/live-e2e.mjs` writes `live-e2e-result.json` with step timings, counts, execution status and its isolated data directory. The **normal** (without `--no-browser`) variant starts/kills its **own** fixture Chrome and creates/removes a profile in its **isolated** temporary data directory; do not run it against an unverified active user Chrome profile or uncontrolled port. See QA's runbook for the Windows sequence.

If process resource data is essential, the local executor should **identify the actual Studio and fixture Chrome PIDs first**; Windows PowerShell's `Get-Process -Id <KNOWN_PID>` yields `WorkingSet64` and cumulative `CPU` seconds. Run directory size can be measured with filesystem tooling over the *specific run directory*. Avoid broad `Get-Process node` claims because unrelated Node agents may be running.

No command in this handoff automatically sends a provider message, deletes/recovers a lease, shares raw evidence, or installs a watcher.

## 5. Triage signatures and owner mapping

| Failure signature | Evidence required (minimal) | Route / nearby regression |
|---|---|---|
| `boot_no_cdp`, `studio_bad_origin`, `doctor_fails` | command, exit code/HTTP code, Studio+CDP ports, start timing; sanitized environment | Core/environment; rerun L0 status/doctor |
| `capture_gap_or_truncate` | session ID, raw gap/truncate counts, affected SID, verify, stop state | Core L1/L2; rerun same synthetic capture + one adjacent stream |
| `capture_arming_pressure` | pending arming source phase, process sampled RSS/time, associated stream. If pending-buffer count unavailable, label **unobserved hypothesis** | Core L1; add only narrowly scoped counters if repro justifies |
| `network_loss_unknown_suffix` | reconnect timestamps, open-at-stop streams, origin/target continuity | Core CDP; adjacent reconnect fixture |
| `lease_busy_or_orphan` | existing owner kind/state/age classification (no token), exact target, recovery outcome | Core runtime/lease, UI if misleading recovery |
| `unknown_send_or_false_reply` | attempt id/status, explicit user effect count, reply observed-source class; **never repeat real send automatically** | Core conversation service, UI state; adjacent no-resend regression |
| `derived_but_unaccepted` | source session, raw verify, derived status, acceptance status/version unknown versus accepted, exact graph source | Core accepted-data boundary + L4/L5 specialist; QA independent eligibility |
| `slow_but_no_data` | actual timed user step, resource samples and sample count; if absent mark **cannot attribute** | Systems diagnosis; don't prematurely blame CPU/CDP/UI |
| `ui_evidence_link_wrong` | clicked saved session id vs displayed id/SID/seq, screenshot local only, HTTP response code | UI; adjacent exact-link replay |

One failure task uses QA's `run_id/round/step` evidence refs and `signature + component + source_sha` deduplication. **No new issue automatically filed** by this map. Re-run the case and one adjacent regression after owner source changes, not a broad suite.

## 6. Lightweight exit and boundaries

**Systems handoff success = a readable map that QA can use to capture L0/L1 without code modification, plus truthful missing-signal notes.** There is no extra approval ceremony, no mandatory dashboard, and no source freeze needed for local testing.

**If QA asks what to instrument later:** the first justified code counters would be pending stream-arm bytes/high-water, actual flush/fsync failure counts, exact stream cap overshoot/omission totals, and session-to-conversation/lease timing; prioritize only after one local run actually exposes a missing diagnosis. Avoid an instrumentation framework.

**Existing source behavior to re-check after fresh changes:** current Head may advance during Core/UI work, including removal of runtime limits; record actual local SHA every time. This handoff does not certify that Windows L0–L5 have run, that the extension uses the same sender/lease, or that knowledge outputs satisfy independent acceptance.

**Status:** Systems pre-local observability map delivered to repository; Systems Sprints 1–2 remain source-closed, Sprint 3 remains queued behind local diagnostic priority. No Core/UI/QA files edited.
