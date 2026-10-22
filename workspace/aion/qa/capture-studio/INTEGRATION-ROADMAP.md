# Capture Studio — Master Integration Map and Roadmap

**Status:** PROPOSED, not ratified. Owner decision required on the fork (section 4).
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
