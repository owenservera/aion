# External Nine — Worker Worklog

**Worker:** AION EXTERNAL NINE · **Session date:** 2026-10-20 · **Working authority:** `owenservera/aion` / `main` · **Scope:** remote static evidence and research-only GitHub writes. This is a worker-local progress log, **not** a second intake queue; cross-track deliveries live solely in `harvest/EXCHANGE.jsonl`.

## Entry 001 — bootstrap, first-pass triage and immediate Development delivery (2026-10-20)

### Inputs actually read

- All worker entry documents: `DELIVERABLES.md`, `BOOTSTRAP.md`, `SITREP.md`, historical `LAUNCH-PROMPT.md`.
- `REPOSITORY-GOVERNANCE.md`, root `AGENTS.md`, `README.md`, dated `workspace/aion/STATE.json`.
- `harvest/{README.md,EXCHANGE.md,EXCHANGE.jsonl}`, `harvest/external/{DELIVERY.md,02-REPO-PRIORITIZATION.md,03-EVIDENCE-AND-PROMOTION.md,sources.json}`; existing `harvest/landing/synthesis/integration-queue.md` and `harvest/landing/sources/vomega/RETENTION-ASSESSMENT.md`.
- `chrome-relay/DEVELOPMENT-MASTER.md` (current I0–I3 priorities), existing command-space directory index, imported donor source root trees and PRs #53/#54 custody.
- GitHub `main` observed before writes at `bd433a5b1323a4f2be4c4e43a7177580e83fd37e`. The previous SITREP's `8ad81dc...` was no longer current.

### Nine source pins — inspected representative code, not run

| ID | Upstream pinned SHA | Representative code actually opened |
|---|---|---|
| chatgpt-bridge | `0ffdae90239988f253058c05253226152acd55d2` | observedTurnJournal, passiveObservationRouter, turnEvidence, tabObservationAdapter, observedTurnStream, requestInvariants; cursor/evidence tests |
| multi-ai-chat | `cdcf6a7fb05609b219fd85395a116f26476a7f92` | responseTracking, chatgptDom, sendConfirmation; pure negative tests |
| parallel-ai | `944276d8146d11d5719a83cc550de31e4354a1c4` | text-injection-handler, file-injection, provider catalog |
| council | `92845be5e8c1c30e2012c59fc51008aaaf11572e` | DOM provider adapter and five-provider config |
| chathub | `852efba00ca7f2888093510b3add33f3ee01dc9b` | abstract-bot and ChatGPT webapp adapter |
| chatall | `6d089c2ab72dde2ba1010cc1e910ceb766458546` | Bot base and ChatGPTBot |
| chatgpt-web2api | `497527dceabfa3f95961e23c291e618c5570f1ac` | turn_anchor, completion_detector, session_key; turn-anchor/end_turn tests |
| cdpilot | `234d8bf3d1c0144792654bf670f07f93ffd8a1d3` | cdpilot Python CDP CLI and test tree |
| cereon-browser-operator | `06da45090607dd9c9dc883ef5d523e9c99bcdb24` | CDP manager/observer, SSE transport, accessibility tree |

**Crosswalk decisions:** bridge PRIMARY research owner for cursor/passive receive; multi-ai-chat PRIMARY provider DOM and send-correlation *patterns*; parallel-ai PRIMARY attachments; Web2API different correlation alternative, not direct native web-thread control; Council fallback selector implementation; CDPilot vs Cereon are diagnostics options; ChatHub GPL and ChatALL app-private endpoint paths deferred. No AION feature adoption.

### Concrete new negative fixture discovered

Bridge `ObservedTurnJournal.list` filters entries beyond cursor then `slice(-safeLimit)`, and SSE stream replays that result. A retained window exceeding requested limit can silently drop the oldest *still-retained* unseen entries without `gap`. Ahead-of-latest cursors with supplied matching epoch are also not rejected by `classifyCursor` guard. This is **static logic inspection** (not a tested live bug). Added explicit counterexample and acceptance checks to Development handoff and AX-0017. **Do not copy donor replay code blindly.**

### Deliveries written to authoritative main

| Commit | Path / significance |
|---|---|
| `49768fc3c9d266184601f46c0ec2bbf7b522dc54` | `external/landing/triage/FIRST-PASS-DEV-HANDOFF.md` initial nine-donor engineering handoff |
| `ca140dedc9cf8efb14bfd8e8da0d1cfa22dd13e2` | `external/landing/triage/REPO-ROLES.csv` nine structured roles and custody pins |
| `f96e9de6e9e5bde056a47da80c438d45be5dbc14` | `EXCHANGE.jsonl`: updated AX-0004 / AX-0006 as INVESTIGATING and delivered AX-0016 / AX-0017 / AX-0018 |
| `1f831094ba359638c22d17a442df29a0780835df` | `external/sources.json`: replaced stale planned clone status with nine PR#53/#54-verified imported pins/licenses |
| `ccfa63afacb078f6beee6c872b756b5dea825713` | triage handoff: explicit Bridge replay truncation counterexample |
| `89c5d23aa7a47bae259ff620cf9000291e5196a9` | AX-0017: source-inspected silent replay loss risk, negative acceptance |

**Exchange status:** 18 records (15 existing + 3 new). New offers are evidence-backed `CODE_INSPECTED`/`SOURCE_OBSERVED`, *not* `TESTED_OFFLINE` or `VALIDATED_LOCAL`. AX-0004 and AX-0006 remain open for specific follow-up criteria. Existing AX-0007..AX-0015 Development requests preserved; no second backlog created. No schema change required because `EXCHANGE.md` already contains optional `candidate_approaches`, dependency and roadmap linkage.

### Verification performed / not performed

- **Performed:** remote root/folder/PR inspection; all 9 imported source trees enumerated; representative source and selected tests read; nine upstream SHAs and licenses matched to merged custody PR #53/#54; JSONL parsed structurally before writing; GitHub connector returned commits.
- **Not performed:** Windows local workspace sync, host changes, donor dependency installation or code execution, actual donor tests, offline AION tests, live ChatGPT/CDP/send, complete 19-P0 × 9-donor command rubric, every source module/license dependency review or Development owner acceptance. Work here is research-only.
- **Safety:** no Playwright/Puppeteer, private transcript/credential handling, donor-run actions or AION runtime promotion.

### Next three highest-value moves

1. **Development immediately:** consume AX-0016/0017, add I0 typed receive validator negative fixtures, particularly retained 150/limit 100, epoch resets and assistant/user mismatch. Freeze I0 before I1 observer/IPC work.
2. **External Nine:** finish the 19 P0 Command Space disposition rubric with MATCH/PARTIAL/UNKNOWN/NOT_APPLICABLE across nine donors, but emphasize only gaps likely to affect I0/I1 and defer low-value catalog expansion.
3. **After I1:** investigate only bounded Send correlation/actuator evidence, with no unknown-effect retries; then resume file/provider/lifecycle P2 lanes. Development owns all implementation/acceptance decisions.

### Resume protocol

Read live `main`, then `DELIVERABLES.md`, `SITREP.md`, this log, `harvest/EXCHANGE.jsonl` and the existing triage handoff. Re-fetch HEAD and check concurrent exchange edits before modifying. Advance only the next unproven Development-seam requirement. Append a new dated entry after useful work; keep short research details in triage and the **single shared outward exchange**.

## Entry 002 — dispatched CDP/DOM/native-tool leapfrog sweep (2026-10-20)

**Owner dispatch was actually sent in this Nine-Repo worker chat, High thinking effort.** Read latest `main` `DELIVERABLES.md`, SITREP, WORKLOG, Development Master/desk, Exchange, existing triage and VOMEGA retention. Inspected pinned Cereon `CdpSessionManager`, `CdpSession`, `NetworkObserver`, `AccessibilityTreeBuilder`, `ElementRegistry`, `OutputBudget`, local role/name/visibility utilities, constants, and CDPilot `_FrameRoute`/OOPIF, WebMCP discovery/call source. Compared rather than reused Bridge/Multi-AI and VOMEGA.

**Delivered:** [single source memo](../../landing/triage/LEAPFROG-DISCOVERY-2026-10-20.md) and source-grounded AX-0019–0021 OFFERs in the **existing** `harvest/EXCHANGE.jsonl`. HIGH bounded DOM inspector, HIGH optional CDP diagnostics, HIGH conditional WebMCP page-tool discovery. No novel nine-repo parser or native IPC transport replacement established; no redundant offers. Five active Discovery TODOs completed for this bounded source publication, **not** Integration Manager execution or AION acceptance.

**Actually done:** GitHub content reads and static source comparison, published evidence and Git objects. **Not done:** tests, donor verification, wiring checks, code adaptation, provider capability proof, Windows sync, explicit second-worker dispatch or Development adoption. Source pins Cereon `06da45090607dd9c9dc883ef5d523e9c99bcdb24` / CDPilot `234d8bf3d1c0144792654bf670f07f93ffd8a1d3`; MIT as source manifest states. No Playwright/Puppeteer.

**Next:** Development/Integration Manager should *read* these 3 leads after PACK-01/02 and choose whether a small additional staged inspector is worth adapting; Discovery does not self-start next work by posting a TODO. Commits/HEAD details belong to Git receipts, not inferred file presence.
