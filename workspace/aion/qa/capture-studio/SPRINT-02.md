# QA / Steering — Sprint 02: Browser Effects and Capture Safety

**Date:** 2026-10-22. **Status:** executed source/V8 experiments and safe handoffs; native Windows/Node/live acceptance remains pending. **Implementation SHA tested:** `02310fe5ae913c23a56fd16144b518b78eb0b4a6`. **No product source edited by QA; no live network or browser send.**

## 1. Executed source-loaded V8 experiments

### QA-S2-F1 — P0 pre-disk split-secret protection fails

**Exact inspected code:** `src/capture/redact.mjs:scrubSecrets` and `src/capture/network.mjs:_chunk`. `_chunk` calls `scrubSecrets(buf)` on **each** incoming chunk and directly persists `bytes.toString('base64')` through `append({k:'chunk'})` (source `network.mjs:201–213`). There is no cross-chunk assembly/redaction in that source path.

**Method actually executed:** Retrieved the entire original `redact.mjs` source at pinned SHA via connected GitHub, stripped only ESM `export` syntax and executed the same `scrubSecrets` body in V8 with a small ASCII-compatible in-memory Buffer shim (string, `latin1`, `fill`, `byteLength`). All values were completely synthetic, non-sensitive ASCII. This is a bounded negative test of the shipped algorithm, **not** native Node or real raw capture. The network append call chain was separately inspected.

| Input | Fragmentation | Observed mask markers | Result |
|---|---:|---:|---|
| JSON `api_key` synthetic value | 1 chunk | 16 | Positive control: masked |
| JSON `api_key` synthetic value | 2 chunks | 0 | **FAIL: original recovered on concatenation** |
| `Bearer` synthetic value | 1 chunk | 36 | Positive control: masked |
| `Bearer` synthetic value | 2 chunks | 0 | **FAIL: original recovered on concatenation** |
| JWT-pattern synthetic value | 1 chunk | 35 | Positive control: masked |
| JWT-pattern synthetic value | 3 chunks | 0 | **FAIL: original recovered on concatenation** |

**Interpretation:** 3/3 whole-buffer controls masked and 3/3 fragmented cases failed to redact. The source's per-buffer scanner is insufficient to guarantee credentials do not reach disk when split across chunks. The scan did **not** establish that a real user's secret had been recorded.

**Owner:** Core — existing W4. **Handoff:** [GitHub issue #64](https://github.com/owenservera/aion/issues/64) with narrow fix and runnable Node fixture. Core should make pre-append handling safe; retrospective full-body masking cannot undo original disk writes. For any unproven path (WebSockets/EventSource), avoid claiming coverage.

### QA-S2-P1 — strict no-repeat send contract passes synthetic source execution

**Exact inspected code:** entire `src/capture/conversation-service.mjs` at pin. **Method executed:** stripped Node ESM imports/exports from the original fetched service, substituted in-memory file/crypto/URL/structured-clone shims and a fake adapter with counters. Executed actual `createConversationService`, `connect`, `submit`, `reconcile`.

| Operation | Observed |
|---|---|
| First submit; adapter does not prove send | `send.state=uncertain`, external simulated send count **1** |
| Same prompt with fresh key | `ONE_TURN_LIMIT`; send count **1** |
| Original idempotency key | returns original attempt read-only; send count **1** |
| Read-only `reconcile` without new observation | adapter read count **1**; send count **1** |
| Fresh key after reconcile | `ONE_TURN_LIMIT`; send count **1** |

**Interpretation:** The strict one-turn guard was independently **source-executed** under deterministic stubs. This validates this narrow scenario in the present source. It is **not** full Node filesystem durability, cross-process lease, or browser send proof. Do not re-open the already-fixed speculative new-key resend bug. UI's pending HTTP request copy should still distinguish original request ambiguity from a server-known spent attempt.

### Source-only outstanding lease/cleanup risks

- `src/capture/conversation-runtime.mjs:abortFailedConnect` releases lease in `finally`, including if `abortConnect` cannot positively stop an owned recorder (`captureFinalized:false`). Normal Finish holds lease if capture stop failed. **Consequence conditional:** another sender could acquire after an unconfirmed recorder remains. Systems' S1-F1 agrees. No live or native Node reproduction executed.
- `src/capture/drive-lease.mjs:inspectDriveLease/reclaimStale` treats missing/unparseable `owner.json` as reclaimable after grace, without live-owner proof. Existing source tests allow a zero grace. **Consequence conditional:** a still-live owner with damaged metadata may be overtaken. Native Node offline negative scenario included in the new QA suite; not yet run.
- Drive API `cancellationMode:'after-current-site'` is not an in-flight cancellation guarantee. Keep truthful UI/contract labeling.
- Capture hot-path benchmark `375659c9` claims improved synthetic latency/throughput; no new live responsiveness, Windows or current-head performance test executed in this QA sprint.
- Acceptance G1–G7 and family promotion issue `QA-S1-F1` remain unresolved. Derived SHAPES or a reply word match is **not** accepted capture or learning eligibility.

## 2. Reproducible native-Node suite prepared, not executed here

QA-only test module [tests/sprint02-capture-safety.test.mjs](tests/sprint02-capture-safety.test.mjs) imports the real modules from the AION checkout. It contains three redaction positive controls, three intentionally failing split-secret negatives, one uncertain-send original-key/no-repeat test, and one intentionally failing ambiguous-lease-owner test.

Run from an authorized checkout (Node 22):

```bash
node --test workspace/aion/qa/capture-studio/tests/sprint02-capture-safety.test.mjs
```

At this time the code was **committed without native Node execution**, because GitHub can be read/written via connector but the actual AION repo is **not mounted in the execution container** and public git DNS resolution failed. Do not claim 8 passing/failed tests from a runner not invoked. The source-loaded V8 outcomes above are the actual executed experiments.

## 3. Steering the active team — nonduplicate, exact owners

| Owner | Next steering direction, inside existing work | Evidence / dependency |
|---|---|---|
| 🟦 Core (working Sprint 1 W4) | First close **pre-disk chunk redaction**; safely handle active owner/lease recovery and later authoritative accepted-capture gating. Do not redo strict no-resend source fix. | [Issue #64](https://github.com/owenservera/aion/issues/64); `FIVE-SPRINT-PLAN-2026-10-22.md` |
| 🟪 UI (Sprint 1 delivered, Sprint 2 recovery queued) | Make uncertain HTTP outcome + `ONE_TURN_LIMIT` and held lease visible; no clickable promise of "Send again" when the backend already records one attempt. UI owns copy/navigation, not runtime safety rules. | UI Sprint 2; no server edits |
| 🟩 Knowledge & Learning (current time-travel sprint) | Continue temporal historical model/revision contract. Distinguish event-time from model-time and exclude unaccepted capture from *promotion*; do not duplicate Core raw redaction or server API work. | `TIME-TRAVEL-SITREP-2026-10-22.md`; L4/L5 QA still 0/7 each |
| 🟧 Systems (Sprint 2 queued) | Independently assess raw coverage, streaming gaps and raw/decoded/DOM provenance; source critique only. No separate test implementation or QA authority. | Systems `SPRINTS.md` / `WORKLOG.md` |
| 🔷 Development/Track B (own issue #43) | Implement owner-approved Studio-as-engine direction only **after** one lease/contract has an explicit handoff. Do not continue a competing send/recorder; record AX-0022/23 in canonical Exchange through its owner. | [Issue #43 steering comment](https://github.com/owenservera/aion/issues/43); QA Integration Roadmap |
| 🟥 QA | Independently retest Core fix, evaluate lease/recovery with real Node, then advance Sprint 3 identity/replay/time travel tests. Never issue QA acceptance from static-only findings. | This Sprint 2 record / QA-owned suite |

**GitHub communication performed:** created [Core issue #64](https://github.com/owenservera/aion/issues/64) and added a current-decision handoff comment to existing [Development issue #43](https://github.com/owenservera/aion/issues/43). They are **SENT_TO_GITHUB_NOT_ACKNOWLEDGED**, not an indication a chat agent read them or began work. No other agent has been automatically activated or paused.

## 4. Sprint completion and outstanding acceptance

**Done this run:** bounded real V8 tests of exact retrieved redactor and conversation service, concrete synthetic failing redaction examples, source-backed lease risk inspection, QA native-Node fixture committed, workstream routing and handoffs. **Still open:** execute actual Node QA suite against pinned/current source, Windows/CDP/browser noninterference and real capture, split credential closure, cross-process exclusion under damaged lease metadata, and G1–G7 acceptance proof. **No independent L4/L5 criterion acceptance** earned by this work.

**Metrics:** prior seven-layer source/LOC audit remains pinned to `34e1a913` (165 JS/MJS/HTML / 40,510 LOC); not measured at `02310fe` and not a sprint delta. This Sprint 2 adds QA-only file(s), zero QA edits to product implementation. All changed QA artifacts are tracked in QA Git commits.

**Next:** Sprint 3 — identity, historical truth, event-time vs model-revision and reconstruction, targeting the time-travel mismatches that the L4/L5 specialist has now independently identified. Preserve Core/UI ownership of repairs and QA ownership of regression evidence.

## 5. Post-source reconciliation during active team builds

Core committed HTTP pre-disk streaming quarantine in 5993f882 and WebSocket frame quarantine in 57f38386 after the initial 02310fe QA reproduction. The missing cross-chunk guard is therefore SOURCE-MITIGATED for the narrow audited paths. The earlier failing results in section 1 remain historically pinned, NOT current main claims.

Independently executed an additional source-loaded V8 retest: original fetched redactor and new stream-guard function bodies ran with an ASCII-compatible Buffer shim. All six whole/split synthetic JWT/Bearer/JSON cases were excluded before emitting payload; one non-secret 320-character three-chunk example preserved all bytes. A split Bearer across two WS frames was excluded, with zero frames published. This is 8 bounded scenarios, NOT native Node, raw-log integration or live browser acceptance.

QA-native Node fixture tests/sprint02-capture-safety.test.mjs was updated for delayed safe-tail flush and explicit body.excluded instead of assuming immediate masked output. GitHub issue #64 comment 6347416142 reflects shipped Core mitigation and remains OPEN for independent native Node, raw append, abnormal termination and host acceptance.

UI Sprint 2 recovery source closeout now reports 62/62 V8 interface checks; Knowledge/Learning reports TT1 temporal contract source and specialist Node receipt, while L4/L5 independent acceptance remains 0/7 each. Do not collide with their next owned work.

Steering after reconciliation: avoid reassigning an already source-fixed W4. QA next prioritizes host lease/cancel and Sprint 3 temporal truth regressions. No browser sends were performed; Core/UI/L5 source changes were not QA edits.
