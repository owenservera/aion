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
