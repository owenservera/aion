# AION External Nine — verified current worker SITREP

**Observation:** 2026-10-20; **source:** GitHub remote `owenservera/aion`, `main`; **observed main before this report:** `77e6f7223ba372ff4cb68b5eaf4c6327dfcb01c6`. **Worker charter:** [DELIVERABLES.md](DELIVERABLES.md) · **work history:** [WORKLOG.md](WORKLOG.md). Remote source inspection/research **only**; not proof of current Windows local workspace or live AION browser behavior.

## Executive state: nine-repo intelligence has begun delivering to Development

- **Governance:** one `main`, Track A deprecated; Development (former Track B) owns runtime, Harvest supplies evidence and research. No new permanent branch, registry, host grant, runner or agent fabric work.
- **Donor custody:** 9/9 source directories exist on `main`, 2,484 pinned tracked files per merged [PR #54](https://github.com/owenservera/aion/pull/54); original pinned SHAs/licenses per merged [PR #53](https://github.com/owenservera/aion/pull/53). Previously stale `external/sources.json` now explicitly records imported SHA and license for all 9; sources not re-cloned.
- **Inspection:** 9/9 source root trees plus representative code paths and selected unit tests inspected; **not** all files exhaustively reviewed, no test executed. [Nine donor source roles](../../landing/triage/REPO-ROLES.csv) and [Development first-pass handoff](../../landing/triage/FIRST-PASS-DEV-HANDOFF.md) now exist in the established `external/landing/triage/` folder.
- **Development requests:** `harvest/EXCHANGE.jsonl` now **18** schema-valid entries (15 pre-existing, 3 source-backed new OFFERs). All original records preserved; AX-0004 and AX-0006 advanced to **INVESTIGATING**, *not CLOSED/ACCEPTED*.
- **New deliveries:** AX-0016 `receive.identity` — Bridge passive turn journal and multi-source alternatives; AX-0017 `receive.transport` — epoch/cursor/SSE comparison and replay omission hazard; AX-0018 `send.correlation` — matching-user-turn negative checks and unsafe Send fallback boundaries. Each has source paths, options, risks, acceptance, and next Development action.
- **Worker-owned deliverables:** D1..D7 seed objectives refined into source-backed I0/I1/I2 deliveries in [DELIVERABLES.md](DELIVERABLES.md). No redundant PM system. Shared schema already supported optional multiple `candidate_approaches`, so **no schema rewrite required**.

## Highest value Development action now

| Rank | Need | Supply today | What remains Development's job |
|---|---|---|---|
| **1 · I0** | `receive.contract` AX-0007: typed event/1, snapshot/1, bound identity, completeness | Bridge journal / terminal evidence, multi-ai-chat late-turn guards, AX-0016/0017 | Implement AION-owned validators and fail-closed negative fixtures (no donor runtime transplant) |
| **2 · I1** | `receive.transport` AX-0008: read-only watcher and push/snapshot | Bridge epoch:sequence reset/gap/SSE semantics as research pattern, AX-0017 | Prove AION native IPC + authoritative snapshot and zero Bus effect reachability from incoming text |
| **3 · I2 later** | `send.correlation` AX-0009 | Multi-ai-chat confirmation helpers, backend-anchor comparison, AX-0018 | After I1: select exactly one authorized actuator, independently observe user + assistant turn and no unknown-effect retry |
| **4 · post-I1** | `provider.family`, `file.tools`, `chat.lifecycle` | Multi-ai-chat, parallel-ai, Council, generic CDP donor roles | Schedule bounded provider/lifecycle experiments only after ChatGPT I1–I3 gates |

## Source-backed decisions and approach alternatives (NOT architecture acceptance)

- **Receive cursor and passive observations:** `chatgpt-bridge` provisional research primary, MIT, upstream `0ffdae90239988f253058c05253226152acd55d2`; code: `src/bridge/observedTurns/observedTurnJournal.js`, `src/bridge/coordinator/passiveObservationRouter.js`, `src/bridge/observation/turnEvidence.js`, `src/http/observedTurnStream.js`.
- **Same-turn correlation alternative:** `chatgpt-web2api` MIT `497527dceabfa3f95961e23c291e618c5570f1ac`, `src/chatgpt_web2api/turn_anchor.py`; captured user message ID and `end_turn` checks; private/backend fidelity makes it a **research-only alternative**, not approved Send/receive runtime.
- **DOM and provider family:** `multi-ai-chat` MIT `cdcf6a7fb05609b219fd85395a116f26476a7f92`, `responseTracking.ts` / `sendConfirmation.ts`, plus per-provider content modules. Complement: `parallel-ai` for attachments, Council for simple config. Auto-submit/Enter fallbacks remain unsafe.
- **Generic diagnostics:** `cdpilot` CDP CLI and `cereon-browser-operator` MV3 debugger fanout are different tooling patterns; neither supplies exact web conversation identity or permission to create a second actuator.
- **Explicit limits:** ChatHub is GPL-3.0 and its provider-private route is unsuitable for copy without review; ChatALL browser/API integration ≠ existing provider-side web conversation; lifecycle, model, thinking and attachments remain research-only until independently demonstrated.

## New hazard discovered — P0-negative-test candidate

Bridge `ObservedTurnJournal.list({afterSequence,limit})` selects `filter(...).slice(-safeLimit)`, so if the retained unseen window exceeds requested limit, it **can skip the earlier retained events** without producing a gap; the SSE replay invokes this method. `classifyCursor` also rejects ahead-of-stream sequence only when the epoch is empty. These are **code-inspected possible correctness defects**, not runtime-confirmed bugs. First AION test cases: 150 unseen retained messages + limit 100 (must refuse or page contiguously); same-epoch cursor ahead of latest (must not appear fully recovered). Details: [handoff](../../landing/triage/FIRST-PASS-DEV-HANDOFF.md) and AX-0017.

## Verified Git writes and custody

1. `49768fc` triage handoff; `ca140de` structured 9-role CSV.
2. `f96e9de` initial AX-0016–18 OFFERs + AX-0004/6 progress; `89c5d23` updated AX-0017 with replay hazard.
3. `1f83109` reconciled pinned donor custody `sources.json`.
4. `ccfa63a` added explicit replay counterexample to triage; `7c4e7ae` new worker worklog; `77e6f72` self-prioritized deliverables.

The verification pass fetched the remote exchange and checked **18 parseable records / required fields present**, **9 structured role rows**, **9 manifest entries with 40-character upstream SHA**, worklog existence and the risk addition to AX-0017. Commits were returned by GitHub write operations. No local Windows sync, offline tests or live test receipts.

## Open items / resumption

- **AX-0004 remains open:** nine donor role survey is delivered; all 19 current Command Space P0 commands still need systematic nine-donor MATCH/PARTIAL/UNKNOWN/NOT_APPLICABLE mapping, selectively where worthwhile for Development.
- **AX-0006 remains open:** no donor has shown an integrated AION event/1 + snapshot/1 identity and real thread proof; Bridge is a provisional *research owner*, not accepted implementation.
- **Next three:** (1) Development consume AX-0016/17 and run I0 synthetic negative fixture designs; (2) External Nine fill high-impact P0 command rubric gaps, inspect additional source only when needed for a bounded Development decision; (3) after I1, prepare I2 Send correlation acceptance/no-resend evidence.
- **Safety:** no host effects, no source execution, no Playwright/Puppeteer, no cookies/credentials/private transcript publication, no donor runtime or Agent Fabric promotion.

**Worker resume:** reread live `main` then [DELIVERABLES](DELIVERABLES.md), [WORKLOG](WORKLOG.md), `harvest/EXCHANGE.jsonl`, current Development Master and triage; compare against this observation before adding/updating an offer.

## 2026-10-20 — New leapfrog discovery delivery (this dispatched session)

**Scope:** static donor source inspection; no tests, runtime verification, adaptation or provider effects. **Three new leads in single exchange:** [AX-0019, AX-0020, AX-0021](../../../EXCHANGE.jsonl), detail [source memo](../../landing/triage/LEAPFROG-DISCOVERY-2026-10-20.md). All three **DELIVERED AS RESEARCH**; no source integration, no automatic Integration Manager dispatch.

1. **HIGH AX-0019:** Cereon modular bounded DOM/accessibility tree, open-shadow-root walk and WeakRef element registry. Immediately reusable inspector concept, **but** element refs are not persistent conversation identity and current text output exposes form values.
2. **HIGH AX-0020:** Cereon per-tab MV3 CDP session manager/console/network correlation with CDPilot OOPIF route as heavier alternative. CDP attach, raw `send`, metrics override, privilege and privacy are blockers to unguarded I1 use; diagnostic-only optional R5.
3. **HIGH conditional AX-0021:** CDPilot `document.modelContext.getTools()` WebMCP inspection could avoid custom provider selectors **if** providers expose first-party tools; unknown exposure, experimental Chromium flag, effectful executeTool excluded.

**Dedup:** AX-0003 VOMEGA retains parser lead; AX-0016/17 Bridge retains transport/recovery lead; none reissued. **Status:** the historical leapfrog sweep is DELIVERED; the next task is SAVED_NOT_DISPATCHED (see [DELIVERABLES](DELIVERABLES.md)); no current worker ACK is implied and no new SHA is claimed here. **Handoff order:** Integration Manager PACK-01/02 code receipts first; Development later selects any new lead for packaging and explicitly dispatches Integration Manager; Development owns all AION tests and effects. **No worker is assumed to have read these offers merely because committed.**
