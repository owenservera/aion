# AION Track B — Agent Optimization Contract
**Scope:** This directory and Track B implementation branches. Read root `AGENTS.md` first; this file adds Track B-specific priorities. Updated 2026-10-19.

## 0. Runtime ownership — no GitHub Actions
**The executable lives entirely on the local machine.** Use bundled Node 22 scripts (`aion selftest`, `aion connections`, `aion connect`, `aion send`, `aion observe`, `aion stop`, `aion resume`) and the existing Bus/adapters. No GitHub Actions, hosted runners, Slack, cloud orchestration, or GitHub polling in the command-to-result execution path. GitHub is only version control, issues, evidence and review. When Windows is paused, stage/test source here but do not claim installation.

## 1. The optimization target (one sentence)
**Minimize time, code, dependencies, machine resources and owner intervention per VERIFIED useful operation, while keeping wrong-target sends and duplicate sends at zero.**

Success means ONE `aion send chief "..." ` to an already authorized, exactly bound B dev Chrome conversation produces (a) one observed Send, (b) a correlated real reply, and (c) a durable `aion.result/1` obtainable from the CLI/pane. A beautiful architecture, transport ACK, green mock test or occupied composer is NOT success.

## 2. Priority order — apply to EVERY decision
1. **Shortest reliable command→result vertical slice.** Work backwards from real ChatGPT Send/readback, do not defer it behind generic frameworks.
2. **Correct target, exactly one attempt, truthful status.** Preserve current Bus V1/V2 no-resend, immutable binding and grant invariants; UNKNOWN never triggers alternate send.
3. **Reuse > rewrite.** Import existing `extension/src/bus/`, `bridge/`, existing ChatGPT task/observer and OpenCode adapters. One authoritative bus writer; browser journal only for actuation/recovery. No duplicate bus, scheduler, general router or database rewrite.
4. **Minimize owner actions.** Setup, correlation IDs, port details and routine diagnostics are automated; absent authorization or binding causes explicit refusal, never guessed approval.
5. **Low latency/resource overhead.** Favor event subscriptions and small persistent local broker over redundant processes/scanners; measure after correctness. Status p95 ≤150ms, admission+ID p95 ≤250ms, active readiness ≤2s or STALE are *engineering targets*, not current measurements.
6. **Maintainability through simplicity.** Prefer small testable built-in Node 22 modules; add dependency only with evidence it removes more code, hops or failure modes than it creates.

**Order is strict:** latency, feature coverage and visual polish never trump wrong-target/no-resend correctness.

## 3. Scope filter for each proposed change
Before touching a file, answer in the PR/commit or code review (one short line each; no new planning documents):
- **Task outcome:** which step from command→real result becomes usable, faster, safer or directly testable?
- **Reuse:** which existing module/function does this call rather than replace?
- **Metric/proof:** which specific executable test or observable receipt demonstrates progress?
- **Removal:** can a simpler mechanism or fewer files solve it?
If no clear answer, **do not implement**. Put optional ideas in the existing #32 issue, not into a new subsystem.

**Hard WIP limit:** only ONE critical-path vertical-slice task per implementation agent at a time; finish and test before branching into enhancements. Independent non-overlapping offline tests/reviews may run in parallel. Avoid premature batching of abstractions.

## 4. Five working rounds (Q1 design is completed; these rounds write CODE)
| Round | Focus only | Output / exit evidence |
|---|---|---|
| **R1 CORE** | Exact role/binding lookup; capability TTL; event projection | Real committed modules + Node tests and refused unbound/unknown target |
| **R2 TRANSPORT** | B-only framed RPC/client request validation; exact peer/source trust | Framing, partial/invalid-frame and source-spoof tests; **no Windows security claim** |
| **R3 EXECUTION** | Import existing Bus; one command admission and one dispatch; result truth | Direct Bus fixture test of single attempt/grants/unknown; no second ledger |
| **R4 CLI+BROKER** | Thin `aion` client; broker lifetime; event/observation; gated IPC | Actual process-to-process smoke test on available non-Windows runner; Windows restricted named pipe remains unverified |
| **R5 INTEGRATION HARDENING** | Dev native-host boundary, result profile, crash/no-resend tests; exact Windows handoff | Offline fault matrix, exact source SHA, B-only install/rollback instructions; real Chrome send stays UNRUN until Windows resumes |

Round work may identify failures requiring earlier round fixes. Fix those before adding new scope. No round is done because the source files exist; status must distinguish **COMMITTED**, **LOCALLY TESTED**, **REMOTE TESTED**, **WINDOWS VERIFIED**, **REAL CHROME VERIFIED**.

## 5. Explicit non-goals and rejection defaults
**Do not build now:** another daemon framework, independent message bus, generic agent orchestration, model-credit router, semantic memory/RAG, SQLite migration, Tauri/desktop redesign, dashboards/themes, phone remote control, background scraping, LLM auto-browser, universal computer-use, large observability platform, or broad tool/plugin discovery. They can be reconsidered **after** the real single-command B-MVP works and a measured bottleneck exists.

**No Playwright, Puppeteer, Orca** in code, tests or transitive tooling. Experimental CDP, WebMCP, Browser Use, WinApp/Computer Use are OPTIONAL; they must win a narrow, reproducible bake-off and must not gate or complicate the default ChatGPT path.

Track A frozen source/Chrome Profile 3/extension ID `kgjfielmhcdlggjppmliabpiljnonhki` and stable native host `com.aion.relay` are untouchable. Track B dev uses its own branch, state, signed extension ID and `com.aion.relay.dev`. Windows local master is paused: no local install, registry/profile changes, live browser send, or false M1 claim from this chat.

## 6. Agent decision policy
- **Keep moving without owner micro-decisions** for reversible, scoped source edits and offline tests in Track B. Owner authority stays with Windows local master for actual user machine changes.
- **Choose the smallest change that yields a testable improvement**; remove dead scaffolding and avoid speculative API surfaces.
- **On blocked external dependencies:** implement an interface + fake and mark real integration BLOCKED; do not fill gaps with invented readiness or silently switch accounts/models.
- **On uncertain dispatch:** retain immutable operation ID; reconcile read-only; never retry.
- **Before writing to shared branch:** check latest head/PR, avoid blind overwrites, commit focused source/test pairs.
- **No success theater:** A local runner failure is a failure (never bypass tests); mock tests are not M1, Chrome port CONNECTED is not prompt SENT.
- **Handoff/receipt:** concise commit SHA, files, commands and exact test results, remaining blocker, next direct coding action. No long SITREP or extra coordination artifacts unless they remove actual work.

## 7. Completion scorecard (minimum useful numbers)
Record where observed: external human actions per completed task (target 1), confirmed real sends / attempts, duplicate sends (must 0), wrong-target sends (must 0), unknown outcomes, verified replies / sends, p50/p95 local admission and status overhead, source-dependency additions, and turnaround from code to independently checked receipt. Don't fabricate baseline values or measure model generation time as local overhead.

**Tie-breaker:** prefer a 150-line tested vertical slice that actually gets one correlated result over a 1,500-line framework with twenty speculative adapters.

Primary work: [#32](https://github.com/owenservera/aion/issues/32). Isolated work PR: [#33](https://github.com/owenservera/aion/pull/33). Independent verification: [#31](https://github.com/owenservera/aion/issues/31).

## Round 8 pre-live safety gates (mandatory, not extra project scope)
Before requesting a real Chrome Send, require the locally executed `aion selftest` receipt from the **current Git head** and `aion preflight browser` reporting `READY_FOR_OWNER_LIVE_TEST`. This preflight is READ-ONLY and NEVER proves live Send, real click actuation, or a real reply. A stale dev build after Git head changes requires `aion setup browser --apply` to refresh it.

Native-host registration belongs only to Track B if registry path, host manifest, pinned development extension key and original setup receipt match. Never overwrite or delete a foreign, unreadable or ambiguously owned native host registration. A non-private session-token directory, mismatched host session ID/endpoint, wrong extension ID or silent worker must fail closed. Do not silently retry after any forwarded submit whose outcome may be unknown.

Use the existing Chrome task observer's precise `click_attempted` / `submission_observed` evidence to investigate B3-01 after a REAL dev-profile failure. Do not add CDP, UIA, alternate click paths, or a second send without observing the actual failure first. No GitHub Actions or hosted execution.
