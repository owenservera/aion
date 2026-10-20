# AION Track B — executable build roadmap v1

**State:** PLAN / NO WINDOWS EXECUTION. **Delivery repository:** `owenservera/aion`, isolated branch `track-b/velocity-command-plane-20261019`, [draft PR #33](https://github.com/owenservera/aion/pull/33).  
**Parent issue:** [Track B #32](https://github.com/owenservera/aion/issues/32). **Independent acceptance:** [Track A #31](https://github.com/owenservera/aion/issues/31).  
**Architecture:** [00](00-SOLUTION-ARCHITECTURE.md) · [contracts](01-PROTOCOL-AND-STATE-CONTRACTS.md) · [acceptance](03-VALIDATION-AND-ACCEPTANCE.md) · [docs](04-CONTEXT7-SOURCES.md).

## 1. Release objective and shortest critical path

**Definition of B-MVP:** user runs **one** `aion send chief "..." ` in a Windows terminal, with previously confirmed role binding/grant and a separately installed B Chrome dev profile. AION resolves context, admits under existing bus, submits through existing Chrome extension path **once**, observes actual correlated ChatGPT service reply, and returns immutable `aion.result/1` with exact route, outcome, timings and minimal proof. Same ID is visible in pane. It refuses missing permission/draft/ambiguous target. No extra click or copied prompt.

**True shortest path:** `B0 code and bus audit → B1 single writer + secure IPC → B2 native host + Chrome port → B3 real browser submit/observe → B4 result profile`. OpenCode, WinApp, MCP and experimental browser agents are additive after that proof and **must not gate B-MVP**.

```text
   B0 baseline/contract audit
      |
   B1 local broker/IPC/security ─────────────┐
      |                                       |
   B2 Chrome host ↔ worker ↔ broker           |
      |                                       |
   B3 deterministic submit/reply ◀─ A-track known Send defect work
      |
   B4 CLI result/observer/recovery
      |
   B5 OpenCode + Windows UIA + capability streaming
      |
   B6 activation, pane, MCP, benchmark + independent promotion
      |
   OPTIONAL: agent-browser, embedded SDK, Browser Use, WebMCP, Computer Use
```

## 2. Evidence-gated work breakdown (atomic, testable)

Every work unit must have code/tests, a reviewed source SHA, a run receipt (environment and command), and exact truth status. **No "done" based on merely writing source or GitHub Actions startup_failure.**

| ID | Deliverable / actual code | Direct dependency | Acceptance / exit |
|---|---|---|---|
| **B0-01** | Read current branch, base, status; freeze Track A boundaries; compare all 11 PR#33 files to final architecture | none | Current head, dirty-state, no colliding worktrees recorded |
| **B0-02** | Run `velocity` Node22 tests with a real runner, inspect stdout/stderr; distinguish hosted Actions startup failure from code | B0-01 | Exact tests/passed/failed/skip and platform receipt; draft remains until verified |
| **B0-03** | API/ABI audit: `createBus`, `ingestStructured`, `dispatch`, `observe`, `reconcile`, grants; `aion.rpc/1`, `chatgpt-tasks`, host framing | B0-01 | Architecture seam contract maps every duplicated state and every side effect |
| **B0-04** | Pin vendor docs and exact tool versions in manifest; no vendor install | B0-01 | SOFTWARE_HQ Context7 raw docs linked + upstream official links |
| **B1-01** | Local broker entry `aiond-lite` with singleton lifecycle in **dev** namespace, fake transport on non-Windows | B0-03 | Lifecycle tests START/STOP/SURVIVE client disconnect; 2 concurrent clients one instance |
| **B1-02** | Explicit Windows SID-DACL IPC helper + Node framed RPC adapter; no unsafe default pipe | B1-01 | ACL test unauthorized client denied, allowed user works; Windows needed |
| **B1-03** | Import existing Bus core/Node file store; **one writer**; grant selection and nonce/idempotent submission | B1-01 | 3 simultaneous CLI sends same key yield 1 reservation/attempt; existing bus suites green |
| **B1-04** | Versioned intent `aion.control/1` and broker `aion.rpc/2` mapping; retain `rpc/1` validator for legacy | B1-03 | Reject malicious/invalid/unknown/mismatched request; never mint grant from caller |
| **B1-05** | `status`, `doctor`, `capabilities`, `observe` are read-only and truth-preserving | B1-01,B1-03 | No adapter side effect and no model starts from status |
| **B2-01** | Dev extension signing key/ID + dev Chrome profile selection + separate `com.aion.relay.dev` manifest; inventory first | B1-02 + Windows resumed | Stable A extension/host unchanged; exact B identity recorded and rollback possible |
| **B2-02** | Native host B proxy with Chrome argv-origin validation and broker IPC, small framed binary boundaries | B1-02,B2-01 | True Chrome → host → broker handshake and 1MiB clamp; fake/wrong extension ID refused |
| **B2-03** | B service worker bridge adapter (host port, worker epoch, reconnect only) | B2-02 | Browser → host readiness with port close/reload notifications; no automatic send |
| **B2-04** | Remove competing B worker bus mutations or proxy them to broker; browser task-store remains local actuation journal | B1-03,B2-03 | Single command ledger; browser journal correlation; no double grant debit or parallel dispatcher |
| **B2-05** | Read-only tab/identity/draft/preflight; role alias `chief` to confirmed exact binding; real action projection | B2-03,B2-04 | Unbound/ambiguous/stale/dirty-draft/unsupported command refuses safely |
| **B3-01** | Resolve known extension real Send activation defect in B dev build, minimally; preserve native worker/content script driver | B2-05 | Actual Chrome Send button actuates ONCE, not only composer fill; page observer confirms |
| **B3-02** | Add broker remote ChatGPT adapter using existing `createChatGPTAdapter` mapping and host RPC call | B2-04,B3-01 | One `send chief` calls exact bound B conversation; no parallel DOM click method |
| **B3-03** | Complete correlated reply/observer receipt; wrong token and echo rejected | B3-02 | Real response read by B extension, not by separate UIA, exact correlation |
| **B4-01** | `aion.result/1`, CLI `send --wait` (default) / `--detach`, `observe --follow`; event seq/cursor | B3-03 | Same ID and final truth across CLI and broker; no prompt re-dispatch on reconnect |
| **B4-02** | Crash/timeout/restart repair: browser journal + broker lock, positive not-sent vs outcome unknown | B4-01 | Inject crashes at every durable write and port edge; zero duplicate sends |
| **B4-03** | B-MVP real acceptance receipt + independent Track A evaluation | B4-02 | Genuine B Chrome→ChatGPT→broker correlated result, negative case and reviewer signoff |
| **B5-01** | Version-detected `@opencode-ai/sdk` adapter with existing ACP/HTTP path; SSE + durable session readback | B1-03,B4-01 | One CLI operation to actual OpenCode, correct session failure/reply, no fabricated provider auth |
| **B5-02** | Windows actions adapter (native PowerShell/Git + UIA/WinApp); exact HWND and shared actuation lock | B1-02,B4-01 | Read-only inspect then bounded known UI action, no send if prior browser outcome unknown |
| **B5-03** | Capability producers/event subscriptions (Chrome/OpenCode/UIA), TTL and invalidation | B2-05,B5-01,B5-02 | Observations reflect real change <2s or go STALE/UNKNOWN |
| **B6-01** | Chrome pane consumes broker status/events; no second UI-specific state | B4-01,B5-03 | CLI and pane show same OP ID/status/capability timestamp |
| **B6-02** | `aion doctor/activate/stop/rollback` B scoped installer/activation with source SHA+receipt | B2-01,B6-01 | Dry run no writes; install/reinstall/uninstall B-only; stable A unchanged |
| **B6-03** | MCP stdio façade for status/send/observe using broker; conditional exposure / grants | B4-01,B6-02 | Tool listing and call correct; MCP call does not bypass broker or grant |
| **B6-04** | Performance / resource / runbook / recovery and Track A promotion review | B4-03,B6-01,B6-02 | Timings, RSS/CPU, fresh-state, negative tests, rollback and owner release evidence |

**Do not accidentally substitute simulated examples for live proof.** `B3-01` can be developed remotely but requires actual Windows Chrome verification. `B2-01` cannot be claimed remotely. `B6-03` is not necessarily eligible as a custom ChatGPT plugin on the user's current plan; the local MCP server can still be used by other compatible clients.

## 3. Parallel execution without collision

| Lane | Work now | Files / branch | Boundaries |
|---|---|---|---|
| **B CORE** | B0, B1 RPC, single writer, fake transport, tests | `velocity/src/broker/`, `velocity/src/transport/` | Avoid modifying stable `extension/src/bus` until reviewed; upstream behavioral parity |
| **B CHROME** | Native proxy and worker bridge, real Send defect reproduction in dev | `velocity/src/native-host/`, B-only extension additions | No writes to stable pinned manifest ID/host; do not run live without Windows executor |
| **B CLIENT** | CLI result projector/readiness and pane | `velocity/bin/`, `velocity/src/result.mjs`, B pane files | Never implement its own durable queue |
| **A REVIEW** | Review exact Bus and browser no-resend invariants, prepare negative matrix | Track A #31, read-only relative to B until review | Do not claim Track A promotion just because B CI is green |
| **RESEARCH** | Optional WinApp, Rust agent-browser, embedded SDK experiments | separate research folders/commits | No runtime dependency on their outcomes |

Source writes in one integration worktree need explicit file ownership; the user's Windows checkout remains master. A remote contributor may commit to the B branch but must fetch/reconcile latest SHA before additional writes. GitHub issues and PR are the **coordination surface**; no Slack and no second communications system.

## 4. Gate matrix: what can be finished with Windows paused

| Gate | Remote GitHub work | Windows required | Real Chrome required | Authority |
|---|---|---|---|---|
| G0 B0 source audit + source docs | Yes | No | No | Existing repo access |
| G1 Node fake transport and pure bus contract tests | Yes (if genuine runner available) | No | No | GitHub branch |
| G2 Windows secure pipe ACL | Code design/source yes; test no | **Yes** | No | Local master |
| G3 Dev extension ID/profile/host install | Source plan yes; live no | **Yes** | **Yes** | Local master |
| G4 Genuine Send click/submit and reply | Fixture only remote | **Yes** | **Yes** | Owner live authorization + actual grant |
| G5 UIA/OpenCode real adapters | Design/mock remote | **Yes** | For UIA Chrome target yes | Approved local scope |
| G6 Cross-track independent acceptance | Offline review remote | **Yes** | **Yes** | Independent reviewer |
| G7 Release promotion to stable | Planning remote | Owner decides | **Yes** | Owner release authority |

No blanket assumption that GitHub issue/PR creation wakes OpenCode or an employee chat. Verify executor ACK, worktree and receipt. Owner already approved general live scope in AION state; actual machine action still needs valid local execution admission and target grant. **No Playwright, Puppeteer or Orca.**

## 5. Minimum tests for each increment

- **B0:** existing `node --test` in `velocity` (test code present, hosted Actions previously startup_failed); count and exact failures recorded.
- **B1:** concurrent CLI request dedupe, oversized/partial/malicious frames, invalid source ID, inherited grant expired/missing, pipe ACL wrong user, singleton crash.
- **B2:** fake Chrome-native host wrong origin/port disconnected, worker restart, dev vs stable identity, no target tab, multiple matching tabs, stale observed state, occupied composer.
- **B3/B4:** actual clicked Send proof (not filled-only), duplicate send under ack loss, observer wrong identity, wrong/echoed token, dynamic SPA DOM mutation, repeated read-only observe, case of unresolved prior operation.
- **B5:** OpenCode no-auth, provider-auth fail, session creation, prompt terminal failure vs success, SSE loss + durable message recovery; UIA HWND stale/recycled, locked desktop, unique control/InvokePattern, conflicting foreground action.
- **B6:** uninstall/rollback restores exactly dev-owned registry/settings only; capability freshness, status p50/p95 cold/warm, idle RSS, panic kill, B/A isolation.

Official independent acceptance is defined in [03-VALIDATION-AND-ACCEPTANCE.md](03-VALIDATION-AND-ACCEPTANCE.md), not only in one global test count.

## 6. Release checkpoints / artifacts

**R0 (bootstrap):** exact branch SHA, test receipts, source change inventory, dependency manifest, documented baseline vs staged.
**R1 (local broker):** signed/verified IPC helper, single-writer authority, fake-host E2E and negative tests.
**R2 (Chrome bring-up):** B isolated identity, host registry and Chrome load receipt, real connectivity and read-only action availability.
**R3 (B-MVP):** exactly one CLI command successfully gets a correlated real ChatGPT result; a second distinct negative command fails safely; zero duplicates across restart.
**R4 (broader AION):** OpenCode and Windows UIA result profiles, same event projection.
**R5 (operational):** activation suite + pane + MCP tool ingress + measured bench + independent review.

All milestone marks are **evidence-driven**. Repo commit/PR ≠ machine installation; Chrome port handshake ≠ website action; composer fill ≠ Send; transport ACK ≠ model response; model answer ≠ consumer readback until the consumer actually observes it.

## 7. Work handoff: instruction for local OpenCode agent

After local executor availability is explicitly established, its top instruction is:

> Read PR #33 and the five files under `velocity/design/`, `AGENTS.md`, the current `velocity/` source, `extension/src/bus` and `bridge`. Audit git status and active worktrees. Keep A frozen. Start B0-02 and B0-03; then implement B1-01/B1-03 with offline tests, **do not invent a private named-pipe security guarantee**. Work through G0→G4. Commit cohesive increments to Track B branch with real run receipts, raise true blockers, and never claim Windows Chrome M1 from mocked tests. User wants one-command operation, not a new architecture rewrite. No Playwright/Puppeteer/Orca.

Cross-track acceptance is a distinct reviewer action, not delegated to the implementation author.

## 8. Success metrics and risk ordering

**Top product KPIs:** (1) external user operations per task = 1; (2) actual real actions/100 commands; (3) wrong-target sends = 0; (4) duplicate sends = 0; (5) observed-vs-claimed result mismatch = 0; (6) human manual recovery steps; (7) p95 warm overhead; (8) resource footprint; (9) rapid rollback success.

Targets (NOT measured): p95 warm status <=150ms, warm admission+ID <=250ms, active capability freshness <=2s or STALE. Do not optimize performance benchmarks before the first true B-MVP command.

Main risks in order:
1. Browser Send may still not actuate (actual 2026-10-19 failure) → B3-01, Chrome-native proof.
2. Two bus stores may both mutate/resend → B1-03/B2-04, one writer and journal separation.
3. Native host cannot push into Chrome unless extension opened the port → B2-02/B2-03.
4. Windows pipe default DACL too permissive → B1-02 explicit ACL helper and denial tests.
5. Debug browser/profile confusion → B2-01 strict isolation.
6. Lost ACK causes false NOT_SENT → B4-02 read-only reconciliation.
7. OpenCode SDK version/API mismatch → B5-01 detect exact binary, avoid forced upgrade.
8. Experimental tooling Node24+ requirement/human browser ownership → optional experiments only.

**Future optimization:** Once R3 works, run a real 30-iteration cold/warm port-broker-CDP/UIA benchmark; remove any protocol hop that does not materially contribute to control, evidence, authorization, or reuse.

---

## 9. Track B strategic architecture and Harvest integration (2026-10-20)

**Status:** ACTIVE DESIGN / OPEN DECISIONS, not an implementation authorization or a claim that harvested source has been incorporated. **Tracking:** [strategic planning issue #38](https://github.com/owenservera/aion/issues/38), inside [Track B #32](https://github.com/owenservera/aion/issues/32). This section extends the current Chrome Extension Track B workstream; it does NOT start another Track B, pause the active Chrome vertical slice, or establish a second delivery organization. The existing B code, Bus, adapter owners, Chrome evidence contracts, negative tests and Track A isolation remain governing.

**Why now:** Parallel workers are capturing broad technical intelligence from vivim-final and Vivim-omega under [Harvest landing](../../harvest/landing/README.md). Their inventories and crosswalk will reveal possible reusable taxonomies, provider types, capability definitions, provider-specific realizations, lifecycle schemas and technical patterns. They are prior work to examine, not requirements. The strategic workstream turns that evidence into a reasoned architectural disposition and a **broader product/development roadmap**.

### 9.1 Reality anchors / non-negotiable distinction

* **Current functioning/verified boundary (reported in velocity README):** local CLI/Bus and OpenCode correlated native operations have Windows receipts at specified commits. Chrome native host dev registration exists, but dev extension/worker/live Chrome send-and-reply are not verified. A final-head selftest receipt is still required for subsequent changes. Treat versioned older roadmap statements above as planning history where superseded.
* **Active critical path:** complete the current [CENV Chrome Send/state repair](../../ARCHITECTURE.md), contracts [ENVELOPE](../../ENVELOPE-CONTRACT.md) and acceptance [FALLBACK](../../FALLBACK-AND-ACCEPTANCE.md), using [ordered repair tasks](../../OPENCODE-BUILD-ORDER.md). It owns diagnostics, precise snapshot/Send/Stop availability, one guarded activation, response budget, correlation and read-only recovery. **No speculative refactor ahead of actual real-Chrome evidence.**
* **Strategic horizon:** decide whether/how to evolve existing capability taxonomy, provider families, realization composition, feature negotiation, observational availability, extensions and the longer-term roadmap. This may proceed in parallel as read-only analysis, source checks, contract sketches and offline compatibility tests. It does not authorize new sends, migrations or modification of Track A.
* **Authority:** original source files are read-only donor artifacts; Harvest findings are evidence-qualified candidates. Current AION owner contracts outrank donor code. No new bus, ledger, registry or autonomous orchestration is assumed.

### 9.2 Architecture choices — gates, not foregone conclusions

| Decision | Live options | Evidence / test required | Default until decided |
| --- | --- | --- | --- |
| **D1 Taxonomy strategy** | (A) retain Track B taxonomy + alias donor terms; (B) one-time canonical taxonomy migration; (C) hybrid: frozen runtime identity, versioned semantic catalog/crosswalk, scoped migration later | Enumerate real current symbols/consumers, donor terms + versioned origins, semantic collisions, serialized persisted IDs, migration rollback, code churn, cross-provider coverage | **C as a design hypothesis**, no runtime migration |
| **D2 Provider classification** | single provider-type enum; family inheritance; multi-axis family/profile composition | Can one model express chat webapp vs bespoke webapp vs native runtime without false shared semantics? Check at least two distinct realizations and negative feature cases | Multi-axis classification *hypothesis*; no framework yet |
| **D3 Capability identity** | per-provider names; shared semantic ID + provider-specific realization; universal runtime registry | Demonstrate stable meaning without equating selectors, action authority or effect evidence. Check native OpenCode and existing ChatGPT adapter invariants | Keep existing registry/adapter authority; draft semantic mapping outside hot path |
| **D4 Discovery and availability** | static catalog only; adapter-observed readiness; mixed static contract + live scoped observation | Distinguish supported/configured/bound/present/visible/enabled/unique/authorized/fresh/current effect. Verify UNKNOWN / STALE safety and read-only probes | Keep CENV three axes and explicit provider observations |
| **D5 Persistence and upgrade** | rewrite durable operation records; additive versioned metadata + mapping; parallel stores | Test old journal/Bus records, tombstones, grants, active locks, identical text separate operation identities, unreadable data, rollback | Additive metadata; no ID rewrite or silent fallbacks |
| **D6 Extensibility mechanism** | broad plugin platform; thin optional realization contracts attached to existing adapters; bespoke implementations | Measurable complexity/call-site reduction, false abstraction negatives, fault containment, test/rollback cost | Thin contracts; no plugin loader without repeated real demand |
| **D7 Delivery sequencing** | taxonomy-first big bang; MVP-first/no architecture work; independent evidence preparation + small gated integrations | Real Chrome readiness, expected integration blast radius, Harvest source confidence, operator effort and test receipts | MVP critical path + independent strategic planning |

No decision can become **ACCEPTED_FOR_IMPLEMENTATION** from a harvested summary alone. A decision receipt records status PROPOSED / DECIDED / EXPERIMENTAL / REJECTED, source revisions and alternatives; it must identify affected code and compatibility tests. For one-time migration, require a measured benefit that exceeds dual-support cost, complete persisted-state inventory, dry-run transformation on synthetic old fixtures and an explicit reversible rollback; never rewrite active Bus/journal IDs as a convenience.

### 9.3 Candidate provider/capability mental model — to be stress tested, not installed

Classify each target along **independent axes**, not one universal base class:

1. **Surface / runtime:** authenticated AI chat webapp, provider-specific bespoke webapp, local/native agent/runtime, protocol-accessible endpoint (only when supported/authorized).
2. **Interaction family:** conversational thread, structured tool/action workspace, IDE/code execution, canvas/document, mixed. A concrete app may expose more than one family.
3. **Semantic capability:** meaningful operation (conversation.send, response.observe, generation.stop, attachment.add, model.select, session.resume, artifact.read, etc.); unsupported concepts remain absent, not guessed.
4. **Provider realization:** actual adapter, bindings, per-provider UI affordances or native API mechanics, state projection, failure cases and evidence requirements.
5. **Resolved context:** current provider/account/session/conversation identity and binding, observed capability/availability + timestamp/freshness, owner authority/grant and operation-specific evidence.

Shared chat semantics are reusable **contracts**, not proof ChatGPT and Claude expose equivalent elements, selectors, response timing, authorization, or Stop behavior. Bespoke webapps can compose common conversation semantics with custom capabilities; native OpenCode can satisfy some semantics via its supported native interface without pretending to be a browser. If an implementation cannot meet a shared evidence requirement, that capability remains provider-specific or unavailable.

Potential small logical interfaces to evaluate against current code (no mandate to add modules/services): semantic capability description; provider profile; realization mapping; context-scoped action observation; immutable operation evidence. Existing Bus identity and result contract remain authoritative. Prefer additive projections and adapter-local implementations to a new universal orchestrator.

### 9.4 Strategic analysis outputs (within this roadmap/issue, not competing docs)

**S0 — As-built baseline and contract map.** Inventory exact current-head source owners: CLI command parsing, roles/bindings, Bus/adapters, Chrome journal/worker/page, content/observer, OpenCode native roster, capabilities/status/readiness, immutable grant checks and result projection. Classify IMPLEMENTED+OFFLINE_TESTED, WINDOWS_VERIFIED, LIVE_CHROME_VERIFIED, PROPOSED, UNKNOWN. Compare source SHA and tests; do not promote documentation claims.

**S1 — Harvest intake and fit map.** Consume the crosswalk worker's `landing/synthesis/` plus source index/card/excerpts as they arrive. Start with 16 existing FINAL/OMEGA leads but allow new candidates. Map each to existing AION owners, semantic overlap, state mutation, independence of evidence, security/authority hazards, dependencies and possible minimum transfer. Missing donor revision/canonical identity remains UNKNOWN. Harvest writes Harvest; strategic Track B writes only Track B planning decisions.

**S2 — Decision packet D1–D7.** For each, give option, value, costs (files/complexity/latency), migration scope, data-compatibility consequences, sample provider/use-case counterexample, tests, reversible rollback and decision date/authority. Include a comparison of one-time taxonomy migration vs retain-and-extend vs hybrid with *actual* name/meaning collision counts before choosing.

**S3 — Contract spike, not framework build.** Model two representative realizations against the proposed semantic/availability/evidence contract: (i) existing ChatGPT Send/readback; (ii) existing native OpenCode prompt/session; optionally a **design-only** bespoke webapp counterexample. Require identical caller-facing truths without flattening their different execution semantics. Build narrow deterministic offline fixtures when useful; never change dispatch to satisfy a taxonomy demonstration.

**S4 — Approved execution proposals.** For each accepted candidate, nominate the existing owner file/function, smallest code/test increment, explicit negative cases, migration/no-migration choice, integration order and expected user benefit. Product changes proceed via the ordinary Track B implementation/verification owner, not via Harvest auto-promotion.

### 9.5 Broader milestone roadmap, with independent streams

| Milestone | Focus | Evidence/exit | Relationship to active Chrome work |
| --- | --- | --- | --- |
| **P0: Track B execution truth** | Current real Chrome Send, completion and command-to-result proof; faithful diagnostics | AC-CENV tests, exact current-head offline run, then independently authorized live Chrome/checked reply receipt | **Current critical path**, not blocked by Harvest |
| **P1: Architecture baseline** | As-built topology, current taxonomy/adapter inventory and identity/persistence contract | Source-anchored map; discrepancy log vs old design | Parallel read-only strategic effort |
| **P2: Harvest synthesis / disposition** | Full donor candidate crosswalk, deduplication, coverage and gap map; D1–D7 decisions | Traceable decision matrix with costs/alternatives/unknowns; one taxonomy decision | Depends on actual Harvest batches, not on P0 |
| **P3: Minimal capability contracts** | Only approved shared capability/provider-family seams; versioned mapping if needed | Two-realization offline conformance + incompatibility/unknown tests; no regressions in existing adapters | Product edits after P0 stabilizes affected hot path |
| **P4: First verified webapp expansion** | Prove shared family semantics with an independently authorized second realization, or record evidence it must stay bespoke | Real provider-specific availability/action/evidence and fail-closed negative matrix; no imagined webapp parity | Requires separate access/authority and acceptance |
| **P5: Capability portfolio expansion** | Attachments, model selection, output/artifacts, richer observations, bespoke workflows as justified by evidence | Each capability with supported/unsupported/unknown state, owner, test and live evidence when necessary | Incremental, never all-or-nothing |
| **P6: Operational maturity** | CLI and optional pane use same contract, capability age, diagnosability, compatibility and upgrades | Benchmark, per-provider truth table, rollback/recovery, measured owner-effort and complexity | Follows proven paths, not speculative infrastructure |

**Parallel rule:** active implementation agent keeps one critical-path hot-path task; strategic worker can read sources, design candidate contracts and maintain decision matrix; Harvest A/B/C continue capture/crosswalk separately. Do not have strategic and implementation workers mutate the same runtime files in parallel. Repo issue/PR provide coordination and human-readable receipts, not agent wakeup.

### 9.6 Quantitative decision lens and intake cadence

For every proposed donor-derived adoption, record `new_providers_supported`, `new_semantic_capabilities`, `existing_duplicate_logic_removed`, `new_files/dependencies`, `owner_interactions_saved`, `regression_surface`, `migration_persisted_records_affected`, and `test/rollback_cost`. Numbers must be observed or explicitly UNKNOWN; no invented ROI. Prefer concept-only reuse if a donor module introduces its own session manager, browser action router, retry policy or second durable store.

At each real Harvest batch arrival: **triage → link source IDs → compare with existing owner → mark pending/adopt/reject/defer → update D1–D7 evidence → propose the next smallest slice.** No GitHub polling or automatic researcher wake is implied. Keep the roadmap current as a living strategy while preserving source/history: update here and in #38 only when new decisions or proven gates justify it.

### 9.7 Immediate first strategic actions (no Windows or browser gate)

- [ ] Verify current Track B branch/head and classify implemented vs merely designed modules and their exact public contracts.
- [ ] Build source-anchored map for existing capabilities and provider/adapter identities (including where `aion capabilities` gets its truth).
- [ ] Prepare a taxonomy comparison template covering synonym, narrower/broader meaning, false equivalence, unmapped and incompatible operation evidence.
- [ ] Consume first Harvest crosswalk batch when available, with source revision and duplicate ancestry flags. DO NOT assume crosswalk worker has finished because instruction files exist.
- [ ] Write D1 taxonomy options and D2 provider-classification alternatives with explicit migration/compatibility and rollback consequences.
- [ ] Sequence P0–P6 based on actual receipts and decision outcomes; keep short-path Chrome repair moving unchanged.

**Strategic default pending evidence:** retain working Track B schemas and identities; use a non-authoritative semantic crosswalk to learn the donor taxonomy; selectively extract shared contracts only after confirming repeated use and safe evidence semantics. A one-time taxonomy migration remains a serious OPEN option, not prohibited or preselected by this default.
