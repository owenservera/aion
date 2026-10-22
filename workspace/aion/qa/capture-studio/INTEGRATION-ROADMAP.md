# Capture Studio — Master Integration Map and Roadmap

**Status:** Fork **DECIDED by owner 2026-10-22: consolidate on Studio** (section 10). P0 registration drafted, not inserted. P1-P6 remain proposals.
**Prepared:** 2026-10-22. **Baseline:** AION `main` `3b9efe0d8cd2d5bc4b3924f8c14839f0a3ff48a1`.
**Method:** source/document inspection plus repository-wide search. Not an execution or acceptance receipt.
**Owner home:** QA/Steering owns integration steering and cross-lane alignment ([ROADMAP.md](ROADMAP.md)); this file records that steering. Lane owners remain autonomous.

---

## 1. Why this exists

Studio, Development/Track B, Harvest, and the evidence/agent ingress have each grown a browser-observation path.
They are not linked. The purpose of this roadmap is to name one master integration, stop duplicated browser
stacks, and sequence the work that actually unblocks it.

## 2. Term resolution

`lkan` (owner term) resolves to **zero** occurrences: no AION git history (`git log --all -i --grep`), no file or
directory name, and no content match across all file types. The single content hit for the broader pattern was
`harvest/external/landing/donors/chathub/README_IN.md:199` ("Memungkinkan"), an Indonesian word, not a subsystem.
**Treated as "link / the master integration."** No acronym has evidence behind it; do not build one.

## 3. Correlation map

| # | Correlated work | What it is | Correlation to Studio | Evidence | Stated maturity |
|---|---|---|---|---|---|
| 1 | `sessions/roles/02-long-term-planning-alignment/TASKS.md` AION-X08 | Planning's strategic assessment of Studio | **The only place the integration is stated**: Studio as reusable **L1 network + L2 protocol + L3 DOM recording engine** | `TASKS.md:55` | `SOURCE TESTED in synthetic Chromium 153 only; LIVE CHATGPT UNVERIFIED` |
| 2 | `ops/chrome-relay/DEVELOPMENT-MASTER.md` DEV-05 | Development's "browser observation" need | Studio is a working implementation of DEV-05; Development has no live proof | `DEVELOPMENT-MASTER.md` classification table | `design-only; no live proof` |
| 3 | `ops/chrome-relay/harvest/EXCHANGE.jsonl` | Canonical cross-workstream intake, `aion_seam` + `topic` join keys | **Studio has no record.** 14 topics exist (`receive.identity`, `browser.inspection`, `browser.cdp.diagnostics`, `send.correlation`, `receive.recover`, …); none covers Studio | `EXCHANGE.md:15-42`; topic list | Exchange is the authoritative surface |
| 4 | `ops/chrome-relay/workers/development/DELIVERABLES.md` | Track B: MV3 extension + native host + IPC, exact-thread receive | **Duplicate stack.** Stuck at `REGISTRATION_FAILED`; no I1 receive established | `DELIVERABLES.md` (2026-10-21 correction) | `UNVERIFIED / BLOCKED` |
| 5 | Studio `bin/studio.mjs` + `bin/commands/*` | 15 command modules: system, capture, sessions, replay, mirror, export, knowledge, platform, selftest, learn, profiles, **drive, chat, library, campaign** | The integration surface: CLI, HTTP, stores | `bin/studio.mjs:17-31` | 238 unit tests pass (manager-reported) |
| 6 | Studio `docs/DESIGN-live-drive-studio.md` §12-16 | Current authoritative Studio direction: conversation runtime, acceptance gates G1-G7, one command vocabulary | Defines the contract any consumer must use | §16.3 "Connect, Read, Send, Check, Finish map to the same runtime" | `proposed architecture, not implemented or live-verified` |
| 7 | `ops/aion-mcp` | Read-only MCP ingress (3 tools: state, receipts, verify-challenge) | Would expose Studio evidence to agents; currently cannot see Studio at all | `ops/aion-mcp/README.md` | `SOURCE_IMPLEMENTED / TESTED_IN_ISOLATED_LINUX_SANDBOX / NOT INSTALLED ON WINDOWS` |
| 8 | `labs/website-to-local-streaming/UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md` | 16-capability product vision Studio is built against | The specification the integration must not violate | `:1-35` | Vision, not claims |
| 9 | `ops/capture-studio-{core,ui,knowledge-learning,systems}` + `qa/capture-studio` | Internal lanes: 7-layer architecture, QA steering | Internal, not external integration | `ops/capture-studio-core/LAYERED-CAKE.json`; `qa/capture-studio/ROADMAP.md` | Core **PAUSED**; L4/L5 acceptance **0/7**; UI source-delivered, browser-unverified |
| 10 | Sibling repos under `C:\0-BlackBoxProject-0` | SOFTWARE_HQ, index/CIP, VSCRAPE, OMNISEARCH, nanobrowser, SageTap, OpenScroll, VIVIM*, 002.ACP, VOMEGA | **Zero references.** No manifest or content hit for `capture-studio` / `website-to-local-streaming` | Targeted recursive search, 14 dirs | "Beyond AION" is currently empty |

**Correction to item 1:** AION-X08 states "`bin/studio.mjs` not present on reviewed main; cannot claim CLI ready."
`bin/studio.mjs` (4,316 bytes) and `bin/commands/` with 15 modules are present at the baseline. That row is stale
and should not be used to discount Studio's CLI readiness. It is also not evidence the CLI works on a live site.

## 4. The finding: this is a fork, not a missing seam

Two independent implementations of the same problem now exist:

- **Studio** — local CLI + loopback HTTP + UI. Captures L1 raw bytes, L2 decoded protocol, L3 DOM; derives shapes,
  identity, graph, continuity, learning; **drives live logged-in AI sites** (compose → send → record → read reply)
  across a nine-site calibration set; 101 saved sessions; acceptance gates G1-G7 designed.
- **Track B / Development** — extension + native host + IPC for one exact ChatGPT thread, intended to give
  correlated receive plus one guarded Send. Currently blocked before first live receive.

Both answer: *what did the browser receive, which turn does it belong to, and may we send.* The overlap is not
partial — it covers capture, correlation, send and recovery.

**Therefore the master integration is a consolidation decision, not an adapter.** Concretely, the master
integration is:

> **One capture stack, one command and state vocabulary, one ownership lease, one evidence ladder — with Studio as
> the canonical browser evidence engine (L1/L2/L3 capture + drive/conversation), consumed by Development, agents and
> QA through a single contract rather than each building its own browser path.**

## 5. Five integration seams

| Seam | Today | Required |
|---|---|---|
| **S1 Capability registry** | Studio absent from `EXCHANGE.jsonl` and `DEVELOPMENT-INDEX.json` | One `OFFER` record mapping Studio to DEV-05 (observation), DEV-04 (receive identity), DEV-08 (safe send), DEV-09 (recovery), with `aion_seam` = `bin/studio.mjs` + capture/sessions/drive commands, `readiness` and `evidence` set honestly |
| **S2 Vocabulary** | Studio: Connect/Read/Send/Check/Finish. AION: Bus, ACP, grants, `receive.*` topics | Reuse existing `topic` keys before inventing names (`receive.identity`, `send.correlation`, `browser.inspection`). One mapping table, owned jointly |
| **S3 Ownership** | Studio `drive-lease.mjs` (in-process + file lease). Development Bus grants. Neither knows the other | Cross-process mutual exclusion so two stacks can never drive the same tab. This is the **double-send** hazard, not a convenience |
| **S4 Evidence** | Studio sessions + `acceptance.json` sidecar; `aion-mcp` reads only `STATE.json` and receipts | Read-only exposure of Studio verdicts and session summaries to agent ingress; no raw prompt/reply text leaving the machine |
| **S5 Verification** | Studio QA `0/7` accepted; M1 independent acceptance incomplete | One evidence ladder (`source → offline test → local live → independent acceptance`). A Studio verdict never becomes an AION milestone |

## 6. Roadmap

Sequenced so no phase starts against an unresolved shared interface. One writer and one validation owner per phase.
Nothing here authorizes additional live sends.

### P0 — Register the seam (docs only, unblocked now)
- Add the Studio `OFFER` record to `EXCHANGE.jsonl` (S1) with honest `readiness`/`evidence`.
- Correct the stale AION-X08 status row (owner: Planning).
- Publish the S2 vocabulary mapping table.
- **Exit evidence:** record IDs exist; mapping table cites `EXCHANGE.md` topic keys.
- **Risk if skipped:** every later phase re-argues what Studio is.

### P1 — Cancel the double-drive hazard (S3)
- One cross-process ownership lease spanning Studio CLI, Studio service, `drive`/`campaign` and Development's Send.
- Persist send intent before the side effect; uncertain send blocks all further sends.
- **Exit evidence:** two concurrent processes cannot both drive one target; uncertain-send fixture proves no retry.
- **Why first:** this is the only phase where a defect can spend a real account's quota or double-post to a live site.

### P2 — One contract, offline (S2 + S4)
- Expose Studio's runtime through the existing integration surface; CLI and HTTP call the identical service.
- Acceptance sidecar versioned and readable; `aion-mcp` gains a read-only Studio evidence tool (still not installed on Windows).
- **Exit evidence:** offline negative-case suite (stale revision, duplicate idempotency key, target loss, existing-draft protection, auth/origin denial).

### P3 — Prove the live path on one site (S5)
- Follow `DESIGN-live-drive-studio.md` §16 Phases A-D: isolate browser-rendering versus Studio CPU stall with
  **generated, unauthenticated** fixtures first; then one bounded owner-authorized live turn with gates G1-G7.
- **Known blockers to clear first:** a real fresh-tab ChatGPT connection was blocked at readiness and Studio became
  unresponsive; installed-Chrome fixtures 11/13; a pre-existing `trusted-knowledge.test.mjs` failure.
- **Exit evidence:** per-site session id, verdict, gates, `verify` output. No live success inferred from unit tests.

### P4 — Feed the knowledge layers (internal)
- Accepted sessions only feed `library build` / families.
- Independent QA on L4/L5 (`0/7`) with Core paused; the 400-event reducer cap still bounds `gatherEvidence` and
  inference heuristics and must be disclosed rather than papered over.
- **Exit evidence:** QA receipts per acceptance criterion.

### P5 — Consume, don't rebuild
- Development adopts Studio's capture/correlation per the S1 record, or explicitly declines with a reason.
- Harvest checks Studio's needs against existing `AX-*` offers before any new donor work.
- **Exit evidence:** a `DECISION` record in `EXCHANGE.jsonl`.

### P6 — Retire or re-scope the duplicate stack
- Owner decision on Track B's browser path: fold into Studio, keep as an independent hardened path, or retire.
- **Not executable by an agent.** Requires explicit owner scope change.

## 7. Explicit non-goals

- No AION-wide orchestration platform. `DESIGN-live-drive-studio.md` §16 already bounds scope to Studio plus its
  CLI/API and the retained research workflow.
- No new capture stack, decoder, daemon or second raw-evidence store.
- No credential, cookie or transcript content in Git, issues, receipts or agent summaries.
- No automatic resend, draft replacement or target switching to "repair" an uncertain outcome.
- No percentage or milestone claims from source presence.

## 8. Open decisions for the owner

1. **The fork (P6) is the real decision.** Consolidate on Studio, or keep two browser paths? Everything below P5 is
   lower value if both stacks stay live indefinitely.
2. Should Development's Send path be blocked by Studio's lease even before Studio is accepted for live use?
3. May Studio read-only reconciliation run automatically, or only on explicit user action?
4. Is `acceptance.json` sidecar the agreed format (manager recommendation), or does acceptance live in session meta?
5. Nothing here authorizes live sends; a bounded single-site live proof needs explicit owner authorization.

## 9. Evidence limits of this document

Source and document inspection at `3b9efe0`. Not read in full: Studio `test/`, `eval/`, all 15 `bin/commands/*`
implementations, and `src/studio/ui/*`. Sibling-repo claim (item 10) is based on a targeted name/content search of
14 directories, not exhaustive content analysis of every project. Counts ("101 sessions", "238 tests", "11/13")
are manager- or lane-reported and were not re-executed here.

---

## 10. Owner decision — 2026-10-22: consolidate on Studio

**Decision:** Studio becomes the single browser capture-and-drive engine. Track B becomes a thin client that consumes
it. This closes the fork in section 4.

Recorded with the owner's authority; not yet acknowledged by Development (see the `DECISION` draft in section 11).

### Knock-on effect on the roadmap

| Phase | Before the decision | After the decision |
|---|---|---|
| **P1** | Shared lease spanning two independent stacks (large) | Split: **P1a** one authoritative lease inside Studio (already in flight with the manager); **P1b** publish that lease as a file contract and make Development's Send respect it (small) |
| **P2** | Expose a contract that might be duplicated | Expose the contract that Development will actually consume; no second contract |
| **P3** | Prove Studio *or* Track B live | Prove Studio live; Track B adds no independent live path |
| **P5** | Development "may adopt or decline" | Development adopts; decline is no longer a neutral option |
| **P6** | Retire-or-re-scope, owner call | Track B's capture path retires; its extension/native-host transport is retained only as a client of Studio's API, so the ACP/agent path survives |

### What this does not authorise

- It does not authorise Studio to drive unattended, in parallel, or more than one turn per explicit send.
- It does not publish, de-duplicate or delete any Track B code. Retirement is a separate reviewed change.
- It does not make Studio's current live state acceptable: the real ChatGPT connect is still blocked at readiness and
  Studio became unresponsive (section 9). Consolidation raises the cost of that gap, it does not close it.
- It does not change AION-X08's own wording. Planning still owns that row; the correction is a request, not an edit.

---

## 11. P0 drafts — ready to insert, not inserted

These are drafts for the owners of `EXCHANGE.jsonl` (Development/Harvest intake). QA does not write into that
canonical file unilaterally. Field names and allowed values were taken from
[EXCHANGE.md](../../ops/chrome-relay/harvest/EXCHANGE.md) and verified against the 21 existing records; `AX-0022` and
`AX-0023` are the next free ids. Re-check both before insertion.

### 11.1 OFFER — `AX-0022`

```json
{"id":"AX-0022","kind":"OFFER","lane":"research","topic":"browser.inspection","title":"Capture Studio as a local L1/L2/L3 browser capture and drive engine (owner-consolidated)","priority":"P1","status":"OPEN","readiness":"TESTED_OFFLINE","summary":"AION-internal Studio already captures raw bytes (L1), decoded protocol (L2) and DOM (L3) from a live authorized tab, derives shapes/identity/continuity, and drives a live logged-in AI site (compose, send, record, read reply) through one CLI and loopback HTTP surface. Offline suite reported green (238 tests) by the owning session at ca06d8c and not independently reproduced by QA; live path NOT established - a real fresh-tab ChatGPT connect was blocked at readiness and Studio became unresponsive, and installed-Chrome fixtures were 11/13. The owner consolidated on this engine on 2026-10-22, so it is offered as the candidate canonical browser path, not as a donor.","aion_seam":"bin/studio.mjs plus bin/commands/{capture,sessions,replay,export,knowledge,learn,profiles,drive,chat,library,campaign,mirror,platform,selftest,system}.mjs; loopback HTTP in src/studio/server.mjs; on-disk sessions and derived artifacts. Maps to DEV-05 browser observation, DEV-04 receive identity, DEV-08 safe send and DEV-09 recovery.","value":"Removes the need for a second capture/correlation/send implementation and gives Development a working multi-site capture engine instead of a single stalled exact-thread path.","source_refs":["workspace/aion/qa/capture-studio/INTEGRATION-ROADMAP.md","workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/bin/studio.mjs","workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/DESIGN-live-drive-studio.md","workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md","workspace/aion/sessions/roles/02-long-term-planning-alignment/TASKS.md"],"evidence":"TEST_RECEIPT","risks":["Live capability is unproven: blocked fresh-tab connect and an unresponsive Studio window are recorded, so this must not be read as a working live path.","Two browser actuators currently exist (Studio CDP drive and Track B extension Send); without one lease a double-send is possible.","Sessions contain real prompts and replies; no transcript, cookie or credential content may enter Git, issues, receipts or agent summaries.","A 400-event reducer cap bounds gatherEvidence and inference heuristics, so coverage claims can be silently truncated.","DOM-only completion cannot prove an exchange ended; unknown completion must yield incomplete, never accepted.","Studio drives logged-in accounts and can spend real quota; no resend and no unattended turns are authorised by this record."],"acceptance":"One owner-authorized, single-site Studio capture session whose verify output shows per-gate values, with raw evidence retained locally and only the minimized verdict cited; plus two concurrent processes failing to acquire the same driving lease.","next_action":"Development reviews the seam against DEV-04/05/08/09 and records an explicit disposition; no adoption before the P1b lease contract exists.","links":["AX-0023","AX-0002","AX-0016"],"updated_utc":"2026-10-22","capability_ids":["DEV-04","DEV-05","DEV-08","DEV-09"],"aion_capability_ids":["DEV-04","DEV-05","DEV-08","DEV-09"],"roadmap_gates":["I1","I2"],"depends_on_topics":["browser.cdp.diagnostics","receive.identity","send.correlation"],"discovery_class":["METHOD_PATTERN"],"implementation_owner":"AION_DEVELOPMENT","adoption_status":"RESEARCH_REFERENCE_ONLY","source_status":"CODE_INSPECTED","protocol_contract":null,"nonblocking":true}
```

### 11.2 DECISION — `AX-0023`

```json
{"id":"AX-0023","kind":"DECISION","lane":"development","topic":"browser.inspection","title":"Owner decision: consolidate the browser capture and drive path on Capture Studio; Track B becomes a client","priority":"P1","status":"OPEN","readiness":"NEEDS_EVIDENCE","summary":"Owner resolved the browser-capture fork on 2026-10-22: Capture Studio is the single capture-and-drive engine and Track B becomes a thin client consuming it. The decision is recorded here because GitHub and commits do not notify another actor; Development acknowledgment is still outstanding and this record must not be read as ACKed.","aion_seam":"Development Master DEV-04/DEV-05/DEV-08/DEV-09 and the Track B extension/native-host path in ops/chrome-relay/workers/development; Studio surface per AX-0022.","value":"Ends duplicated capture/correlation/send implementations and gives one place to fix the live-path gap, at the cost of an explicit retirement review for the duplicate path.","source_refs":["workspace/aion/qa/capture-studio/INTEGRATION-ROADMAP.md","workspace/aion/ops/chrome-relay/workers/development/DELIVERABLES.md","workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/DESIGN-live-drive-studio.md"],"evidence":"CODE_INSPECTED","risks":["Consolidation raises the cost of Studio's unproven live path: the project now depends on one engine that has not completed a live turn end to end.","Development may already have in-flight work on the retired path; retirement must be reviewed, not executed as a surprise.","Track B's extension transport may still be the only route for ACP/agent consumption; it should be retained as a client, not deleted.","A decision record is not implementation and not acceptance."],"acceptance":"Development records an explicit disposition (adopt / adopt-with-conditions / contest) and the P1b lease contract exists before any Send adoption.","next_action":"Development acknowledges or contests this decision; QA drafts P1b lease contract wording for review.","links":["AX-0022"],"updated_utc":"2026-10-22","capability_ids":["DEV-04","DEV-05","DEV-08","DEV-09"],"aion_capability_ids":["DEV-04","DEV-05","DEV-08","DEV-09"],"roadmap_gates":["I1"],"depends_on_topics":["receive.identity","send.correlation"],"discovery_class":["METHOD_PATTERN"],"implementation_owner":"AION_DEVELOPMENT","adoption_status":"RESEARCH_REFERENCE_ONLY","source_status":"CODE_INSPECTED","protocol_contract":null,"nonblocking":false,"decision_refs":["workspace/aion/qa/capture-studio/INTEGRATION-ROADMAP.md"]}
```

---

## 12. Vocabulary map — one term per meaning

Studio's runtime vocabulary and AION's exchange vocabulary were written independently. Most of it aligns; three
collisions are real and will cause mistakes if not fixed before P2.

### 12.1 Aligned terms

| Studio term (`DESIGN-live-drive-studio.md` §16.3) | Meaning | AION exchange key | Existing artifact |
|---|---|---|---|
| **Connect** | bind one exact target and start observation; never a send | `browser.inspection` / `browser.cdp.diagnostics` | DEV-05 |
| **Read** | surface what the page received, with its actual source | `receive.transport` + `receive.contract` | DEV-04, AX-0002 |
| **Send** | submit exactly one turn under confirmation | `send.correlation` | DEV-08 |
| **Check** | read-only reconciliation after an uncertain outcome | `receive.recover` | DEV-09 |
| **Finish** | finalize evidence and produce a verdict | none — local evidence, not an exchange record | acceptance sidecar (§13.2) |

Rule: `topic` keys are the join key. Studio must not invent `studio.*` topics; it maps onto the five above and reuses
the existing `AX-` records rather than creating parallel ones.

### 12.2 Collisions that need a rule now

| Collision | Studio usage | Exchange usage | Required rule |
|---|---|---|---|
| **`rejected`** | a capture verdict meaning "this capture failed its gates" (§13.2 **Capture rejected**) | `status: REJECTED` meaning a *record's disposition* was refused by Development | Never write a bare `rejected`. Use `capture_rejected` for the verdict and `disposition_rejected` for the record. A capture verdict must never promote a record status. |
| **`delivered`** | UI wording implying finished work | `status: DELIVERED` means research was handed over, explicitly **not** implemented | Studio UI must not say "delivered" for anything unaccepted. Use "capture accepted" only with a gate verdict behind it. |
| **`unknown` / `incomplete`** | gate value and capture verdict (§13.2) | no exchange equivalent; absence of evidence is `NEEDS_EVIDENCE` | Keep the mapping only one way: Studio `unknown` gate → capture `incomplete`. Never translate `incomplete` into exchange `DEFERRED`, which implies a decision was made. |

### 12.3 Two more terms worth fixing while cheap

- **`accepted`** — §13.2 reserves **Capture accepted** for a gate verdict. `EXCHANGE.status: ACCEPTED` means
  Development adopted a record. Same word, different scope. Qualify as `capture_accepted`.
- **`session`** — Studio means one capture session directory; AION/ACP means one agent conversation. Never use bare
  `session` in an exchanged record; use `capture_session` for Studio's and the ACP session id when agent context is
  meant.

---

## 13. Builder questions — operatively answered

`DESIGN-live-drive-studio.md` §11 lists three questions. **§13.2 already supersedes §11** ("This section takes
precedence over conflicting earlier proposed gate behavior, UI wording and open questions"), so the owner does not
need to re-decide two of them. What is missing is the executable directive. That is what follows; each is consistent
with §13.2 and closes the remaining ambiguity.

### Q1 — Is requiring a protocol terminal event (G3) acceptable to start as "recorded, not required" per site?

**Answer: yes as data, no as acceptance.** Record G3 per site, but never let its absence pass.

- Each site profile must declare a `completion_rule`: either a literal protocol terminal event, or a **versioned
  recipe** that establishes completion from proven exchange semantics (§13.2 already permits this).
- No `completion_rule` ⇒ G3 = `unknown` ⇒ capture verdict **incomplete** ⇒ excluded from library builds, with the
  exclusion count reported.
- Stable DOM alone stays fallback readiness; it may never produce `accepted` (§12.4).
- Calibration-only captures on rule-less sites remain allowed, but must be labelled and must not feed knowledge.

Why this shape: §13.2 forbids "accepted with unknowns", while a hard terminal-event precondition would disqualify the
DOM-only sites in the calibration set and stop the loop entirely. Recording-without-passing honours both.

*Builder consequence:* add `completion_rule` to the site profile schema; make `collectSessions` refuse incomplete
captures; surface the law in the gate row label, not a success glyph.

### Q2 — May the repair button auto-run `derive` on dead `recording` sessions, or only offer it?

**Answer: offer only, and verify first.** Never automatic, never age-based, never at startup.

- Two steps: `verify` (read-only) → show the verdict → explicit confirm → `derive`. This is already how a careful
  operator would want it and it matches §13.2's "no age-only automatic repair".
- A timestamp cannot establish that a recorder is dead: the arena recorder is legitimately always-on, and the three
  10-hour `recording` sessions are only *probably* dead. Provenance needed before declaring death: lease/pid
  liveness plus no heartbeat, not wall-clock age.
- `derive` rewrites derived artifacts behind 101 existing sessions, so it needs idempotence and a repair journal; a
  second run must not double-apply.
- The always-on recorder must be excluded by identity (which target/lease it holds), not by heuristic.

*Builder consequence:* the repair action is a confirmation flow with a read-only precondition, not a batch job.

### Q3 — accepted/rejected in session meta (format change) or sidecar `acceptance.json`?

**Answer: sidecar `acceptance.json`.** The recommendation in §11 already points this way and §13.2 adopts it. The
binding requirements are what actually matter:

- The sidecar references the raw-log digest, the recipe version and the evaluated sequence range; without all three a
  verdict is not reproducible and must not be trusted.
- Versioned schema; unknown version ⇒ unassessed, not failed.
- Fail closed: digest or recipe mismatch ⇒ unassessed. Never silently re-evaluate a changed corpus.
- It never mutates raw evidence or `session.json`. It is derived and therefore regenerable; losing it is a
  recomputation, not evidence loss.
- Legacy sessions are **unassessed**, never rejected, never rewritten. Library excludes unassessed with a count.
- Keeping verdicts out of session meta preserves the raw/derived boundary that raw-first capture depends on, and avoids
  migrating 101 existing sessions.

*Builder consequence:* `acceptance.json` is written by the evaluator, never by the recorder; the viewer shows the
verdict source and its binding so a stale verdict is visible rather than authoritative.

### What still needs the owner

None of the three. The genuinely open items are the two product decisions in §16 that were already escalated —
whether the Chat workspace ships as the primary surface or behind a flag, and the capture budget default
(15 min / 256 MiB proposed in §13.2, not yet enforced by the recorder).
