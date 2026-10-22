# Systems Sprint 02 — Capture Completeness, Provenance and Resource Behavior

**Date:** 2026-10-22. **Lane:** Systems / Algorithms / Usability (advisory). **Source-at-start:** main `02310fe5ae913c23a56fd16144b518b78eb0b4a6` (L5 docs latest at 16:44Z); product capture code last materially updated by `375659c91d6a` (same date). **Evidence:** first-party GitHub source, existing builder tests and existing QA/Core/L5 receipts; **no new tests executed**, no owner-PC/browser access, no sends, no product source edits. **Parent:** [SPRINTS.md](SPRINTS.md); previous [SPRINT-01.md](SPRINT-01.md). Source anchors below point to main; consult source SHA when using over time.

## Executive verdict

The raw evidence path is strong in its *accounting intent*: sequence-numbered segmented raw JSONL, max-queue backpressure with explicit gap records, stream-specific locators, optional reconstruction from raw, streamed body chunks and retrospective fallback, late-WebSocket provenance, explicit pause/reconnect and unfinished stream markers, read-only indexed replays, and post-stop checksum/sequence verification. The October 22 synthetic load lab reports a materially faster capture path with byte-equality checks. These are meaningful source and builder-test advances, **not proof of complete real-site capture or safe receipt language**.

Five source-driven concerns remain, most useful for cross-layer architecture:

1. **High / already Core-owned — credential patterns split between incoming chunks can reach the raw write boundary unmasked.** Core already identified W4, so Systems must not initiate a duplicate implementation/test campaign. Separately, `buildReceipt` categorically says sensitive/other-account data was not collected, a stronger claim than the current scanner can justify.
2. **Medium-high / Systems-specific — the temporary stream-arming buffer is not governed by the raw log's max-queue ceiling.** It collects chunks awaiting an asynchronous DevTools response, then flushes the array only on settle; the configured max-stream cap is evaluated *later* on individual chunks.
3. **Medium-high / Systems-specific — per-stream byte cap can be exceeded by an entire incoming chunk/frame without a truncation marker.** The source tests only whether already-recorded bytes are `>= cap` *before* accepting the next payload. One oversized final chunk can finish with bytes above cap and no `body.truncated`; cap is thus a future-chunk drop trigger rather than a hard enforced bound.
4. **Medium / receipt accuracy — periodic fsync errors are swallowed; the receipt asserts an approximate fsync interval as if it were guaranteed durability.** Forced flush/fsync before a special conversation observation is a stronger distinct path, and successful normal stop calls fsync and `verify`. Avoid collapsing three grades into one.
5. **Medium / interpretation — reconstruction, family inference and acceptance have distinct coverage and sampling rules; a positive *raw-viable* receipt does not prove completed streams or accepted evidence.** Current 2,000-event per-stream live tail and 400-sample family detector do **not** cap all offline derived records; `familyRecordsFromEvent` runs for each derived event. Report the stage and denominator, not a blanket “capture only keeps 400 events”.

## Capture and evidence path (actual source)

```text
CDP primary tab + optional child targets
   -> NetworkRecorder HTTP / SSE / WebSocket / EventSource
       -> policy + header/url filter + per-payload scrub
       -> stream.armed + chunk/body, ws.*, es.msg, done/fail/truncated/lateJoin
   -> DomObserver isolated-world binding: dom.batch, action, DOM_INSPECT/TURNS
       -> per-text scrub and page-agent maxBlockTextBytes truncation metadata
   -> Recorder._append (drops nothing silently when sink accepts; paused skips counted)
       -> RawLog.append (seq, segment + queue; on overflow null + gap later)
       -> StreamReducer.ingest (only accepted seq; decoded events)
       -> events dataset (buffered 256 KiB/250 ms) + deferred ShapeInferencer
   -> RawLog.close + manifest/hash/seq verification on normal recorder stop
   -> derive(session) from saved raw, with reconstructStream and coverage receipt
   -> optional knowledge/family derivation; NOT equivalent to G1–G7 acceptance.
```

**Source:** [network](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/network.mjs) · [redaction](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/redact.mjs) · [recorder](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/recorder.mjs) · [DOM agent](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/dom.mjs) · [raw log](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/raw-log.mjs) · [raw replay/index](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/raw-index.mjs) · [derive+receipt](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/derive.mjs) · [family detector](https://github.com/owenservera/aion/blob/02310fe5ae913c23a56fd16144b518b78eb0b4a6/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/families/families.mjs).

## Evidence coverage matrix — do not flatten statuses

| Observed input | Preserved evidence | Explicit blind spots / limits | Strongest justified claim |
|---|---|---|---|
| HTTP response bodies | `streamResourceContent` buffered prefix and later chunks; `Network.getResponseBody` fallback if not armed; stream.armed/failed, done/fail, truncation | Request started before attach not seen; arming unavailable, stream cap, reconnect can lose prefixes/suffixes; chunk scrub is not cross-boundary | Recorded *browser-delivered* bytes for observed range, except masks/gaps |
| WebSocket | ws.open/frame/handshake/close/error; body or metadata-only; lateJoin marker | Earlier handshake and frames before attach unknown; late-joined URL unknown; max cap can affect frames | Content only for explicitly observed frames; other frames metadata/unknown |
| Browser EventSource | `es.msg` with browser-parsed event, name/id/data | EventSource duplication vs HTTP decode possible; source text is scrubbed only per message; not transport bytes | Browser-reported event messages, not proof of full HTTP stream |
| Rendered DOM | mutation batches and explicit inspection/turn snapshots, with scrubbed text | Visible/virtualized page coverage differs from complete conversation; `maxBlockTextBytes` (default 262,144) truncates large blocks and records original length | What current observed DOM exposes, never unseen history |
| Pause / reconnect / child loss | pause/resume with counts, reconnect attempts, affected open stream ids, explicit run.end/openStreamsAtEnd | Paused bytes unknown; reconnection cannot retroactively re-arm in-flight body; max target count limits followed tabs | Captured observations with annotated omissions |
| Raw persistence | segmented JSONL, seq, manifest sha256, stream locator, bounded queue, gap records | Queue overflow drops with later gap; fsync errors hidden in periodic path; unclosed session may not have final hash | Verifiable saved log after confirmed stop/verify |
| Interpretation / families | decoded events, shapes and event-mapped family records; optional knowledge | live tail max 2,000/stream, detector sample max 400; some heuristics sampled; no proven accepted-only family promotion yet | Inference from available saved evidence, not accepted data |

The above distinguishes **raw-loss** (queue overflow / upstream missing data), **intentional capture exclusion** (policy, max cap, DOM truncation), **live-view thinning** (tail windows), **inference sampling** (400 samples) and **acceptance eligibility** (not yet evidenced). Do not merge these into a single loss counter.

## Ranked findings, source proof, counterevidence, minimal options

### S2-F1 — HIGH — per-chunk credential masking + overcertain privacy receipt (Core W4 dependency)
**Source:** `src/capture/network.mjs:_chunk` (around 201–214) passes *each* chunk to `scrubSecrets(buf)` and immediately appends the resulting b64; retrospective `body` and ws frames scrub their own buffers. `src/capture/redact.mjs` (61–79) runs regex matches on only the supplied buffer; no saved scanning context exists across `_chunk` calls. `src/replay/derive.mjs:buildReceipt` (around 176) emits `other_account_or_sensitive_data_collected: 'NO (credential policy ...)' ` as an unconditional string.

**Concrete conditional scenario:** a protected body-field token spans the boundary between two otherwise individually nonmatching CDP chunks. Each independent scrub returns no redaction and both chunks are queued to raw. **Not a claim that real credentials were exposed or that tests were performed here.**

**Counterevidence:** authorization/cookie headers are dropped; auth endpoint bodies are metadata-only; matching complete tokens are masked in place; DOM text is independently scrubbed. Core Sprint 1 worklog already identifies cross-chunk W4 as *open* and plans fail-closed handling. QA Sprint 2 owns adversarial acceptance tests. Do not duplicate these owners.

**Smallest architecture recommendation:** make “no known detected sensitive span in admitted bytes” distinct from “verified zero sensitive data captured”; consume a Core-provided *scanner coverage* and *redaction integrity* status before emitting universal privacy claims. Core chooses overlap/carry-state buffer or fail-closed policy, QA executes split-token negatives. Receipt should not assert `NO` while scanner coverage is unproven. **Status:** confirmed code pattern and proof overclaim; exposure unverified.

### S2-F2 — MEDIUM-HIGH — unbounded in-flight arming buffer outside the raw queue
**Source:** `NetworkRecorder._onResponse` sets `st.arming=true` before `await this._armStream(...)`. `_onData` pushes each incoming payload into `(st.pendingData ??= []).push({buf,extra})` while arming. In the `finally` path it iterates all pending buffers and calls `_chunk`, then resets the array. There is no byte/element budget at this pending-data stage. In contrast `RawLog` limits *its own queued serialized records* to default 128 MiB and emits a gap when overwhelmed.

**Worst-case thought experiment:** an actively receiving stream with a delayed DevTools arm response accumulates a large pendingData array before any item enters RawLog. The RawLog gap accounting cannot detect memory consumed in this upstream holding area. A short retry exists (`armRetries` default 1, 60ms delay) and CDP timeout may limit duration, but neither sets an explicit byte ceiling.

**Counterevidence:** once arming settles, pending chunks are delivered in their intended order; the code reports arm failure and tests exercise stream sequencing. The currently reported 64 MiB synthetic loadlab does not itself prove a pathological delayed-arm pending-buffer bound.

**Smallest option (Core L1):** track pending arming bytes separately and define a bounded fail-closed threshold with an explicit dropped-prefix/arming-overflow coverage event; never assert faithful bytes for rejected content. Prefer this small queue invariant over worker/daemon redesign. Independent QA can use a held/deferred `streamResourceContent` promise with many `dataReceived` calls and measure memory plus post-arm diagnostics. **Status:** source-determined missing bound; no executed adversarial test.

### S2-F3 — MEDIUM-HIGH — stream cap overshoot and absent marker on final oversized chunk
**Source:** `NetworkRecorder._chunk` checks `if (this.maxStreamBytes && st.bytes >= this.maxStreamBytes)` *before* appending an entire `buf`. Similarly `_onWsFrame` tests existing accumulated `st.bytes` before appending a whole payload. It does not compare `st.bytes + incomingBytes` to the cap, nor split the boundary chunk.

**Deterministic scenario:** configured cap 64 KiB, first and only HTTP dataReceived chunk 128 KiB. Initial `st.bytes=0` is below cap, so all 128 KiB is admitted. If the response ends immediately, no later chunk triggers `body.truncated`. No live testcase executed here.

**Counterevidence:** when another chunk arrives after cap is exceeded the code emits `body.truncated` and records droppedByCap; default cap is zero (unlimited) unless configured. Thus the failure concerns **configured** maximums, not ordinary unlimited capture.

**Smallest option (Core L1):** define cap as an exact byte budget; admit at most remaining bytes; mark `body.truncated` with observed/rejected counts on any crossing chunk, and preserve frame-boundary semantics for WebSockets (metadata-only on oversize if frames must stay whole). Add bounded synthetic HTTP and binary WS cases (one oversize final chunk and exact boundary). **Status:** deterministic source logic mismatch; untested in this Systems sprint.

### S2-F4 — MEDIUM — durable-write claim is stronger than periodic sync error handling
**Source:** `RawLog.flush` writes batches (50ms flush timer), `_fsync` is scheduled every ~1s but catches/ignores errors. `buildReceipt` emits fixed string `first_local_durable_write_ms: 'see raw manifest; writes batched at <=50 ms, fsync <=1 s'`. `RawLog._closeSegment` calls `fsyncSync` without suppression; normal Recorder stop closes raw and calls session verify; `recordConversationObservation` flushes and calls explicit `fsyncSync` before claiming an attributable sent-turn marker.

**Why it matters:** `append`/queue membership, OS-write visibility, fsync success and post-close checksum are distinct guarantees. Timers are periodic **targets**, not max observed latency; slow event loop or a failed fsync can invalidate the string. A manifest hash demonstrates consistency of a sealed segment but not automatically every interim durability boundary.

**Counterevidence:** the special conversation attempt observation has stronger forced persistence; normal stop has verification; raw segment close itself propagates fsync failure. There is no blanket finding of lost evidence.

**Smallest option (Core foundation/receipt):** replace fixed interval-as-proof language with `flush_attempted_at`, `last_fsync_ok_at`, `fsync_failures`, `durability_status` (unverified/confirmed), and distinguish “currently queued”, “OS-written”, “fsynced”, and “verified sealed segment”. Instrument only if useful for actual investigation; do not turn every capture into verbose logs. QA should inject an fsync error into periodic versus stop/observation paths. **Status:** source and language mismatch; actual disk failure unverified.

### S2-F5 — MEDIUM — no single coverage denominator; positive raw viability is narrower than completeness or acceptance
**Source:** `buildReceipt` computes `A1_RAW_CAPTURE_VIABLE` when some armed streams have data and `!lost`, where `lost` is sum of raw `gap.droppedRecords` only. This formula is independent of other streams’ truncated/incomplete status and WebSocket late-joined blind spots, although those details are available in `replay_and_gap_diagnostics` and stream summaries. `Recorder` live reducer caps its per-stream retained events at **2,000** by default and tracks `eventsOnlyOnDisk`. `families.mjs:gatherEvidence` samples up to **400** JSON values from retained `_events`; meanwhile `familyRecordsFromEvent` runs as derive walks individual decoded events, so not all derived family records share that 400 limit. `page-agent.js` records truncated text lengths, but page virtualization remains an upstream unknown.

**Why it matters:** a session can be locally raw-viable for one stream while another is incomplete, metadata-only or too long for a live-view sample. Absence of a detected family feature is not proof of feature absence. The **QA Sprint 1** existing finding separately establishes family building before accepted-only gating; Core owns that next phase.

**Counterevidence:** receipt title uses `A1_RAW_CAPTURE_VIABLE` (not “accepted”), `verdict_scope` disclaims complete server-side data, and sources track raw gap, truncation and open stream details. Defect is **interpretation and consumption risk**, not the nonexistence of coverage fields.

**Smallest option (Core receipt contract + UI presentation):** one stable compact coverage object per stream with `observedStart`, `observedEnd`, `bodyPolicy`, `gapCount`, `truncatedBytes`, `maskedBytes`, `sampledCount`, `completeByProtocol`, plus separate `captureAccepted` sourced exclusively from a versioned G1–G7 evaluator. Reflect “unknown” rather than collapsing to false; name the source layer for each completeness claim. QA and L5 already own acceptance and learning eligibility, respectively. **Status:** source semantics assessment; no execution.

## Other bounded concerns, not additional work streams

- **Time travel ordering:** L4/L5 specialist already identified that `raw-index.mjs:iterateRaw` uses `if (r.t > toT) return` and `derive.stateAt` early-breaks although sequence order does not prove monotonic wall timestamps. This is a Core replay correctness dependency, **not re-opened as a second Systems development assignment**. `seekOffset(fromT)` similarly relies on sparse timestamps to choose a start offset; any fix must reconcile both indexed and no-index behavior. See [L5 time-travel assessment](../capture-studio-knowledge-learning/TIME-TRAVEL-SITREP-2026-10-22.md).
- **WS metadata bytes:** for metadata-only binary WS frames, `_onWsFrame` records size as `String(payloadData).length` (may be base64-encoded length, not decoded bytes), unlike full binary-frame path. If compared as wire bytes, separate `encoded` and `decoded` metrics; user-side effect depends on specific CDP payload representation. Not verified.
- **Quota stop granularity:** Recorder checks max session bytes before an append, then schedules stop with `setImmediate`; further records in the same tick can push total beyond budget. This is a stop threshold, not an exact enforced file-size cap. Keep language accurate; normal stop records `reason:'quota_reached'`. No measured overshoot.
- **DOM length:** page-agent default 262,144-character text limit includes `truncated` metadata, but this does not prove that off-screen/virtualized earlier turns were ever observed. Never infer history completeness from a DOM snapshot.

## Performance evidence and test-receipt separation

| Evidence class | Source/result | What it proves | What it does **not** prove |
|---|---|---|---|
| Synthetic loadlab | `375659c91d6a` commit reports 64MiB, four streams; p99 event-loop 442→88ms; 0.32→1.45 MB/s; raw bytes equal; 0 gaps/drops in that scenario | Optimized hot-path behavior under in-process synthetic workload as reported by builder | Real Chrome/tab rendering, virtualized history scroll, production credentials, live multi-provider latency |
| Optimized reference tests | `test/unit/capture-perf.test.mjs` | Unit bodies compare hashes/schema/shape profiles/reducer summary/buffered datasets to inline reference, with observed test assertions | Browser transport / slow disk / out-of-order concurrent stop |
| Loadlab smoke test | `test/unit/loadlab.test.mjs` | Defines 50KB synthetic sample and per-stream byte-equivalence assertion | 64MiB report independently rerun by Systems |
| Late WS regression | `test/unit/late-ws-and-family-ties.test.mjs` plus browser fixture `test/e2e/universality.test.mjs` | Checks late join does not falsely claim URL/handshake/start-of-socket coverage | All WebSockets in real sites fully captured |
| Integrity after stop | `Recorder._stop` calls raw close, `Session.verify`, updates metadata with gap/dropped counts; `RawLog` stores segment digests | Implementation mechanism and code-level verification contract | Independently accepted current-head end-to-end capture |

**No extra benchmarks/tests were run by this lane.** QA reported a pinned earlier footprint at `34e1a913` of **165 JS/MJS/HTML files and 40,510 physical LOC** (including tests and evaluation, distinct mutually exclusive layers). This is QA-reported historical metric, **not** current-head count or this documentation-only sprint LOC delta. Systems did not run the canonical counter in a checkout.

## Recommendation ordering (not commands to other agents)

- **First:** Core W4 pre-raw credential scanner guarantee, while removing `NO sensitive data` absolute receipt text until justified; QA independently proves adversarial splits. No duplicated Systems implementation.
- **Second:** bound arming backlog and make configured per-stream byte limit exact. These are complementary L1 resource/coverage invariants.
- **Third:** express durability as evidence states instead of periodic timer text.
- **Fourth:** expose coverage by source stream and evidence stage; let Core/QA's acceptance implementation decide eligibility, not a proxy `A1` verdict.
- **Keep:** the current append-only raw store, gap records, manifest/checksum, fast in-memory preview + offline derive, accurate late-WS notes and conservative page-read labels. No need to create another datastore, new daemon, or another decoder.

### Completion statement
**Systems Sprint 2 source assessment is COMPLETE.** Report includes source-observed coverage matrix, five ranked risks with scenarios/counterevidence/owners/test ideas, synthetic-vs-live performance reconciliation and explicit cross-lane deduplication. **No product fixes or independent QA results claimed.** Sprint 3 is next (accepted capture → knowledge/learning lineage); it was not started by this work. No background job implied.
