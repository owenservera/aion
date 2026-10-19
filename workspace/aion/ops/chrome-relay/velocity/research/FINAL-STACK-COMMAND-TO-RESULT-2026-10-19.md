# AION Track B — FINAL STACK: one command → one verified result profile

**Decision ID:** AION-B-FINAL-STACK-2026-10-19  
**Date:** 2026-10-19  
**Status:** SELECTED ARCHITECTURE / NOT IMPLEMENTED OR WINDOWS-TESTED  
**Project:** [Track B #32](https://github.com/owenservera/aion/issues/32) · [Draft PR #33](https://github.com/owenservera/aion/pull/33) · [Track A #31](https://github.com/owenservera/aion/issues/31).  
**Current Track B truth:** `track-b/velocity-command-plane-20261019` has a read-only/NOT_CONNECTED CLI prototype, capability projection and `aion.rpc/1` tests; native runtime, dev Chrome installation, model calls and end-to-end result remain **unproven**. Hosted CI had a startup failure, not a passing test.  
**Operating rule:** No Playwright, Puppeteer or Orca anywhere in implementation/testing. Do not touch existing stable Chrome Profile 3 or stable extension ID `kgjfielmhcdlggjppmliabpiljnonhki`. Local Windows is the master.

## 1. Final architectural thesis

One operator command must produce an **immutable operation** with a **real-time result stream** and a **machine-readable result profile**. The software chooses the deterministic, lowest-friction verified route and only escalates to UI/computer-use/LLM browsing when necessary.

```text
Operator / agent
    aion send chief "Review AION" [--wait|--detach] [--json]
         |
    Node 22 AION CLI (thin client)
         |
    per-user AION Broker (AIOND-lite) - on demand; stays alive during in-flight work
         | parse -> resolve -> authorize -> reserve -> dispatch ONCE -> observe -> settle
         | AION Bus V1/V2 core; SINGLE durable ledger writer; event subscriptions
         |-- existing MV3 dev extension <---> persistent Chrome Native Messaging host
         |       | pinned real chatgpt.com conversation -> submit -> observe
         |-- OpenCode 2.0 SDK/client -> authenticated loopback server + event stream
         |       | existing ACP adapter for approved alternative sessions
         |-- Windows UIA / winapp CLI (specific interactive control; fallback)
         |-- native Win32/PowerShell/Git action provider (typed and bounded)
         |-- optional Rust agent-browser direct CDP (isolated Chrome for Testing)
         |-- optional Browser Use / visual Computer Use (explicit expensive fallback)
         |
      durable AION operation + correlated proof + result profile
         |-- CLI live stream / JSON / exit codes
         |-- Chrome pane projection
         |-- outward MCP tools (one authority)
         '-- GitHub task/receipt publication (not real-time action transport)
```

**Non-obvious mechanical requirement:** `chrome.runtime.connectNative` begins **in the extension**. A local CLI cannot call a Chrome extension with native messaging in reverse by itself. AIOND-lite must be a reachable broker for both CLI IPC and a Chrome-originated native-host port. A purely one-shot Node CLI with no broker cannot reliably push a command into an already-running extension and receive later observer events. Keep broker *minimal*, start on demand, survive while work is in flight, exit only when safe. Do not introduce a second command bus or duplicate queue.

## 2. FULL SELECTED STACK — one provider per required function

| Layer | SELECTED primary | Why | Boundary |
|---|---|---|---|
| CLI/runtime language | **Node.js 22 ESM**; Bun for optional benchmark/scripts | Matches current checked-in source and tests; no compiler/rewrite | `aion` wraps existing `velocity/bin/aion-velocity.mjs` and Bus V1/V2 |
| Command/approval semantics | **Existing AION Bus V1/V2** (contracts, grants, single-use IDs, state machine, no-resend) | Already tested offline; don't build a new workflow engine | Logical single authoritative operation writer |
| Local coordination | **AIOND-lite**, per-user Node process, on-demand start then active-operations lifetime | Bridges shell, Chrome and OpenCode; avoids heavy always-on service | Versioned `aion.rpc/1`, safe shutdown |
| Windows IPC | **Windows Named Pipe with explicit logon-SID DACL**, local user-scoped | Low-overhead local transport and precise identity | No naked default ACL; validate SID and Windows implementation |
| Durable state | **Reuse existing bus file store** behind one broker writer | Zero migration until vertical slice succeeds | Browser `chrome.storage.local` stores only browser observer recovery refs, not duplicate authoritative ledger |
| Browser session | **Current Chrome MV3 extension** as separate B build, **Native Messaging `com.aion.relay.dev`** | Uses existing signed-in page mechanisms and explicit content port, with separate dev profile | Stable Track A remains untouched; version-pin origin/key |
| ChatGPT action | **Deterministic content script + one-shot submit/observe** | Fastest for bound conversation, independent of LLM navigation | Must prove real button activation on B build and correlated observer readback |
| OpenCode | **Version-matched `@opencode/client` and loopback HTTP/event streams**, using existing service | Leverages OpenCode state/session API instead of rebuilding model routing | Probe installed API/server version and auth; never assume model quota |
| Agent protocol interoperability | **Existing ACP adapter**, negotiated on an explicit target | Coding-agent sessions and independent executor routes | Do not silently cross sessions between HTTP/ACP |
| Native Windows | **PowerShell 7, Node `child_process`, Win32 APIs, Git CLI** | Use precise native actions where available | Typed action allowlists; workspace constraints |
| Windows graphical controls | **Microsoft winapp CLI `winapp ui`**, with direct UIA proven method retained | Semantic inspect/search/invoke/wait, window targeting, workflow coordination | Requires interactive desktop, target/window identity and `WINAPP_UI_WORKFLOW_ID`; fallback only after proven NOT_SENT |
| Generic browser automation | **vercel-labs/agent-browser**, native Rust daemon/direct CDP, isolated Chrome for Testing | Experimental capability with rich snapshots/actions, no Playwright/Puppeteer daemon | Only separate dev profile, not regular ChatGPT send |
| External agent tools | **MCP stdio server**, one `aion_* ` tool namespace using same broker | Any connected capable agent can invoke typed methods | MCP is tool interface, not bus/replay ledger |
| UI | **Existing Chrome side panel + CLI ANSI/JSON event stream**, shared projection | Minimal dependencies; no new desktop app required | No second status model; Tauri later only if measurable benefit |
| Install/activate/rollback | **PowerShell install/doctor/activate/rollback** under user scope | Existing Windows script assets, HKCU host registration | No silent modifications from send; receipts, undo exact owned changes |
| Evidence/task distribution | **GitHub issue/PR/commits** with minimized receipts | Existing project authority; async durable evidence | Never millisecond execution RPC; no raw credential/sensitive transcript publication |

### Security constraint: named pipes

Windows documentation states default named-pipe ACLs may grant **read** to Everyone and anonymous. A path named after a user is **not sufficient**. AION must explicitly create/verify a logon-SID-restricted DACL or use an equally reviewed secure local IPC primitive. Node's `net.createServer` defaults alone are not acceptance evidence. Use tiny auditable Win32 helper if required, rather than advertising insecure control as protected.

Reference: https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights

### Keep Node 22 for the core

Rust agent-browser is an **optional installed binary**, not a requirement to rewrite AION in Rust. OpenCode embedded SDK is a **B-research test**, not production dependency. AION core should remain usable on current Windows tools without updating Node globally.

## 3. Top frontier experiments — selected priority and decision gates

| Rank | Technology | Opportunity | Decision | Experiment/gate |
|---|---|---|---|---|
| **E1** | **agent-browser (Vercel Labs) Rust/direct CDP** | Fast, persistent non-Playwright browser worker; snapshots, actions, sessions | **Ship as OPTIONAL experimental adapter** | Pin release; verify native daemon no prohibited dependency; profile isolation; compare 30 warm operations to custom CDP |
| **E2** | **Microsoft `winapp ui` CLI / UIA workflow identity** | Structured desktop actions, window handles, exact InvokePattern | **Primary Windows desktop layer after test** | Probe installed version; cached HWND; fail-closed ambiguous selectors; hotkey/input isolation; compare direct UIA |
| **E3** | **OpenCode v2 embedded `@opencode/sdk`** | Hosted in-process server, no HTTP listener / network hop | **High-priority bake-off, not default** | API/version parity, session persistence, restart semantics, memory/process overhead, permission events versus existing OpenCode 2.0.32 loopback |
| **E4** | **WebMCP (Chrome experimental)** | Site-provided typed tools avoid DOM guessing | **Capability-detected progressive enhancement** | Chrome/version/flag and origin-trial availability, own site POC, no assumed chatgpt.com support |
| **E5** | **Browser Use + Browser Harness (direct CDP)** | LLM browser navigation and task-specific self-healing helpers | **R&D plugin for unknown sites** | Audit pinned lock incl. transitive deps; sandbox generated helpers, restricted browser; fixed budget; no prohibited frameworks |
| **E6** | **MCP Tasks + MCP Apps** | Long-running task exposure and interactive UI inside compatible MCP hosts | **Outward optional interface** | SDK/client version negotiation; do not duplicate internal operation state; UI sandbox/capability negotiation |
| **E7** | **AG-UI** | Realtime agent events/UI compatibility, interrupts | **Hold until second frontend needs it** | Map native events losslessly; don't replace existing fast local stream merely for protocol adoption |
| **E8** | **A2UI** | Declarative generative UI | **Hold** | Only when dynamic UI authored by agents beats fixed pane |
| **E9** | **Computer Use (vision/action model)** | Unfamiliar desktop/browser workflows beyond UIA/CDP | **Explicit, costly fallback** | Driver-bound, screenshot/action step budget, one operation/permissions, no secret extraction |
| **E10** | **A2A** | Agent-to-agent multi-system interoperability | **Deferred** | Existing AION/GitHub assignment is sufficient; prove multi-agent need first |

**Rejected as shipped dependencies:** Google Chrome DevTools MCP package where it currently imports Puppeteer; any Stagehand version whose pinned dependency closure pulls in Playwright/Puppeteer; Orca. **Not rejected:** raw CDP itself or a separately audited direct-CDP connector. Agent-browser and Browser Use must still pass concrete no-prohibited-framework scans on the EXACT lock/version; don't infer compatibility from branding alone.

Primary sources:
- agent-browser Rust/CDP: https://github.com/vercel-labs/agent-browser
- winapp CLI UIA: https://github.com/microsoft/winappCli/blob/main/docs/ui-automation.md
- winapp UI workflow ID: https://github.com/microsoft/winappCli/blob/main/docs/usage.md
- OpenCode embedded v2: https://dev.opencode.ai/v2/docs/build/sdk/
- OpenCode current server and SDK: https://docs.opencode.ai/docs/server/ ; https://docs.opencode.ai/docs/sdk/
- WebMCP (Chrome 149): https://developer.chrome.com/blog/new-in-devtools-149
- Browser Use dependencies: https://raw.githubusercontent.com/browser-use/browser-use/main/pyproject.toml
- Browser Harness dependencies: https://github.com/browser-use/browser-harness/blob/main/pyproject.toml
- MCP Apps stable specification: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- MCP 2026-07-28 change notes: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/changelog.mdx
- AG-UI: https://github.com/ag-ui-protocol/ag-ui
- A2UI: https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md
- Microsoft named pipes security: https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights
- Chrome native messaging: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging

## 4. One action router, strict escalation — never an automatic resend chain

Route only *before attempted delivery*:
1. Exact named native application API / OpenCode SDK / typed local action.
2. Real site-exposed WebMCP tool when verified and permissioned (experimental).
3. Existing Chrome content-script adapter for pre-bound chatgpt.com conversation.
4. WinApp CLI / direct UIA on validated HWND/window/control for desktop task or explicitly elected same-target fallback.
5. agent-browser/direct CDP in isolated development Chromium for generic browser work.
6. Browser Use for uncertain multistep browser tasks.
7. Computer Use visual model loop for last-mile non-structured screens.

This is a **routing precedence**, not seven fallback sends. Once an operation is `DISPATCHED` with uncertain actual submission, the only eligible action is read-only **observe/reconcile**. Neither UIA, CDP, Browser Use nor another model may retry it.

The route planner should prefer (1) target continuity, (2) actual capable endpoint, (3) deterministic action, (4) low admission overhead, (5) minimal model cost. A new tab, alternate profile or different account/model never silently replaces a confirmed target.

## 5. Core user experience — ONE COMMAND

Operator examples (proposal, NOT installed):
```powershell
aion send chief "Review the latest AION work"              # stream while waiting; final result profile
aion send chief "Review the latest AION work" --detach     # return immutable OP ID
aion send opencode "Run all tests" --repo aion --json      # machine-readable result
aion status                                                # readiness, blockers, active work
aion capabilities --live                                   # per-action freshness/provenance
aion doctor                                                # safe read-only diagnostics
aion activate --channel dev                                # guarded setup; explicit changes/receipt
aion observe OP_xxxxx --follow                             # reads existing operation; no re-send
```

**CLI behavior:** default interactive `send` returns initial OP ID immediately to terminal, streams observed stages, then produces final **Result Profile**. `--detach` returns admitted OP ID/status instantly, without requiring the originating CLI process to remain alive. `--json` yields one schema-backed result object, with optional `--events jsonl` on stderr/separate stream. An ordinary `send` never triggers activation or an installer silently. Lack of live grant/binding/ready action is a precise refusal.

**Inherited inputs:** target alias -> confirmed bound session + revision; channel/profile; repo cwd/worktree; grant; default model preference if provider supports it; result contract; runtime flags. Precedence explicit flag > already confirmed invocation session > persisted confirmed default > REFUSED. Correlation nonce and reply token always generated, never asked from user.

## 6. Command → Result Profile (explicit data contract)

Example is **illustrative expected shape only**, not a real run:

```json
{
  "schema": "aion.result/1",
  "operation_id": "op_example_001",
  "intent": { "op": "send", "target": "chief", "input_digest": "sha256:<digest>" },
  "context": { "project": "aion", "channel": "dev", "binding_revision": "br17", "source": "confirmed" },
  "route": { "adapter": "chrome-content-port", "profile": "dev", "target_verified": true },
  "readiness": {
    "transport": "CONNECTED",
    "submit": "READY",
    "observe": "READY",
    "freshness_ms_at_dispatch": 400,
    "grant": "PERMITTED"
  },
  "delivery": {
    "reserved": true,
    "attempted": true,
    "submission_observed": true,
    "reply_correlated": true,
    "resend_allowed": false
  },
  "result": { "status": "SUCCEEDED", "text": "Example verified reply", "reason": null },
  "timing_ms": { "admission": 32, "activation": 87, "model": 2200, "readback": 51, "end_to_end": 2370 },
  "evidence": { "correlation": "example", "receipt": "local://example", "source_revision": "<sha>" },
  "cost": { "model": null, "tokens": null, "status": "NOT_OBSERVED" },
  "recovery": { "requires_reconciliation": false, "next_action": null }
}
```

Semantics: `SUCCEEDED` only after **actual correlated target reply**; `SENT_OBSERVED` if submission confirmed but reply is pending; `UNKNOWN` if possible submission cannot be disproved; `NOT_SENT` only with positive no-send proof; `REFUSED` if authorization, target or readiness is missing. A transport ACK never stands in for result. Result timestamps and phase durations are independently measured. `--json` exit status makes refusal/partial/timeout distinguishable. Never write credentials/full unrelated transcripts to GitHub.

At the top of human-readable results render four concepts distinctly: **action/target**, **what actually happened**, **evidence + latency**, **next action if unresolved**. Operators should not have to interpret a raw bus ledger.

## 7. Real-time readiness / capability graph

Each target has per-action observations:
- **OpenCode:** server reachable, exact version, session alive, authenticated provider/model status if actually observable, session busy/idle/failed, server event stream freshness.
- **ChatGPT Chrome:** pinned extension+host, exact Chrome profile/tab/bound conversation, content port responded, actual composer/click target available, current draft and operation lock, observer alive.
- **Windows UIA:** interactive session unlocked, HWND stable, control unique/enabled, UI workflow lock, last observed event.
- **Dev CDP:** separate browser host running, websocket actually attached, exact target, capability and profile identity, auth state unknown unless directly proven without extracting secrets.
- **External MCP tools:** advertised and available with negotiated version, auth, task support and last successful observation.

States must distinguish `INSTALLED`, `REACHABLE`, `BOUND`, `ACTION_READY`, `AUTHORIZED`, `BUSY`, `STALE`, `UNKNOWN`. Capability events invalidate derived readiness proactively; timer probe is fallback. Freshness target <=2s under active event subscription or degrade to STALE, not fake LIVE. Do not wake models or scrape private pages merely for availability.

## 8. The unification seam that must be built first

The existing Node bus runner shares JS core with Chrome but **does not touch browser pages**; Chrome currently has a separate `chrome.storage.local` bus store. Track B B0 has a no-send CLI prototype only. B1 must:
1. Define the Chrome->native-host->broker and CLI->broker interface and own one ledger writer.
2. Guarantee existing extension operation/task-store no-resend semantics survive the topology change. Keep browser observer identity and last-sent ambiguity persisted; do not erase/replay events.
3. Make the dev Chrome extension *register its presence, target and capabilities*, not make CLI scrape Chrome.
4. Implement broker subscriptions to native messaging port events and read-only page observation.
5. Wire `aion send` to **existing** content port submit/observe exactly once, with end-to-end receipt and recovery.
6. Test restart at each durable write, Chrome reload and dropped native host, then independent negative cases.

Stop here if B2 isn't proven. Do not spend the critical sprint adding Browser Use/Computer Use or a fancy pane.

## 9. Release/experimental isolation

- **Track A frozen:** source `fd347f22`, pinned Chrome ID `kgjfielmhcdlggjppmliabpiljnonhki`, Profile 3, stable native host `com.aion.relay`, independent M1 proof.
- **Track B development:** own extension signing identity, own browser profile, `com.aion.relay.dev`, own local IPC name and ledger namespace. No installed state is presumed from GitHub branch alone.
- **No remote/browser claims:** PR #33 is source bootstrap; GitHub Actions jobs had `startup_failure` and ran no tests; Windows is paused. This decision changes no local state.
- **Promotion:** selected source SHA, pinned dependency closure, tested Windows results, safe rollback and Track A's independent acceptance. Do not replace stable installation with dev build.

## 10. Build plan — shortest distance to true E2E

| Slice | Concrete deliverable | Acceptance |
|---|---|---|
| **B0 (already staged partly)** | Existing CLI parser, `aion.rpc/1`, fail-closed readiness and tests | Actually run tests in a real environment; reconcile Bus contract; fix remote CI startup separately |
| **B1** | One small broker, dev IPC identity, shared bus single writer, read-only CLI status | Real CLI ↔ broker ↔ extension presence receipt, no duplicated state |
| **B2** | `aion send chief "..." ` to verified dev conversation | Correct ChatGPT submit + final correlated reply; zero duplicate sends + uncertain recovery |
| **B3** | OpenCode `@opencode/client` and Windows winapp UIA adapters | One command to each native target; clear live capability and result profiles |
| **B4** | Side panel from same state, doctor/activate/rollback, MCP stdio tools | CLI/panel/MCP agree on same operation ID and actual state |
| **B5 (parallel experiments)** | agent-browser direct-CDP dev-browser pilot; embedded SDK, WebMCP and Browser Use bake-offs | Evidence-based decision per adapter, no core dependency |
| **Promotion** | Track A independent review | Real Chrome positive/negative/restart proof; stable install left intact until explicit promotion |

**Benchmarks, not claims:** warm local `status` p95<=150ms, admission+operation ID p95<=250ms, active-capability state age<=2s or STALE, zero duplicate submissions under crash/restart, one external command per task. Log command-to-result timings separately for model latency vs local overhead, and idle RAM/CPU.

## 11. Decisions closed / open

**Closed:** Node22+existing bus+minimal broker; MV3/native-host for real ChatGPT; typed OpenCode SDK and ACP; winapp UIA for desktop; agent-browser direct CDP for generic dev browsing; MCP outward; existing side panel; single durable operation state; no prohibited browser frameworks.

**Open to measure, not to debate prematurely:** whether embedded OpenCode beats existing service; whether SQLite improves file-ledger reliability under real concurrency; whether AG-UI/MCP Apps justify extra pane compatibility; whether browser-harness self-repair is worth its code-generation risk; which isolated Chrome dev profile/extension IDs are confirmed on actual Windows.

**Immediate engineering instruction to PR #33:** do not create another framework. Finish the **CLI→broker→native host→extension→real ChatGPT send→page observer→result profile** vertical slice using the existing source, then add Windows/OpenCode adapters. Leave experimental browser intelligence disconnected until the deterministic first slice works.
