# Opus 5.5 — Complete reusable ChatGPT Bus V1/V2 build brief
Status: DIRECT IMPLEMENTATION HANDOFF; not installed or tested on Windows by Opus. **Owner clarification: the pilot is ChatGPT.com itself, NOT VOM or VOMEGA.** Build a provider-neutral bus whose first real adapter and acceptance target are ChatGPT.com conversations.

## Mission
Deliver a **complete, generalizable, reusable ChatGPT communication capability** (not a one-project automation). **ChatGPT.com is the first real-world pilot and acceptance target.** The core must generalize to other browser-chat providers, projects, agents and local executors without embedding ChatGPT DOM specifics outside the ChatGPT adapter. Build end-to-end from existing AION code and contracts. Opus 5.5 has **no Windows host**: complete all portable engineering/testing, provide a single Windows validation/install path and explicit evidence gaps. Do not substitute architecture prose for the build.

## Read order
1. [Research pack](./CHATGPT-GENERAL-BUS-V1-V2-SOURCE-PACK-2026-10-19.md).
2. AION root `AGENTS.md`, `STATE.json`; [owner bus V1/V2 decision](../../../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md), [detailed existing design](../../../../ops/chrome-relay/BUS-V1-V2-DESIGN.md).
3. Existing `workspace/aion/ops/chrome-relay/extension`, `bridge`, `aion-mcp`, `sessions/01-escape-hatch/adapter`, toolsmith skills; issue #27 and #28.
4. Inspect the existing Chrome MV3 ChatGPT adapter, native host, submit/observe engine, task store, bus V1/V2 design and real ChatGPT.com M1 acceptance contract. Do not introduce a VOMEGA dependency.
5. Official docs and SOFTWARE_HQ research linked from source pack. Record exact schema/version changes.

## Fixed architecture (choose components by evidence, not arbitrary rewrites)
```
Phone ChatGPT → designated commander in ChatGPT web
       | (A: PC Chrome DOM watcher, conditioned on SYNC-0)
       | (B: plugin/MCP write tool if supported + owner-authorized)
       v
transport-neutral command ingress → parse/validate → registry+genealogy
       → durable operation ledger/idempotency → target router
       ├─ ChatGPT conversation agent via existing MV3 + native host and turn engine (V1)
       ├─ local OpenCode ACP / V2 client executor (V2)
       └─ future non-ChatGPT provider adapter (fixture only, to prove portability)
       ← response capture / ACP stream / task receipt → commander report-back
```
Do not treat mobile as automatically syncing to PC. Implement SYNC-0 no-send operator probe and fallback/no-go explanation; do not fake this. Existing AION Chrome code has task-store/turn engine/native-host/ACP pieces; **inspect first**. Do not build a second MV3 extension or second MCP server unless file-backed comparison shows missing capability.

## V1 acceptance (all portable parts to be built)
- Versioned shared types/contracts: command `AION_CMD_V1`, agent identity + genealogy, conversation binding, delivery correlation, status and failure reason. Schema validators and example payloads.
- Multi-agent registry CRUD, parent graph validation (cycles/orphans), binding state, target allowlist, and manager/commander identity.
- Bounded parser for an explicit owner-armed command block; input is assistant turn of designated commander only, not arbitrary page text.
- Guarded delivery by reusing existing task store, submit/observe/read and no-resend semantics. Distinguish PREPARED, SENT_OBSERVED, REPLY_OBSERVED, CONSUMED, OUTCOME_UNKNOWN.
- Command/report loop back to commander, max-hop/nonce/dedupe, kill/pause, rate/count limits where needed, rendering agent status; no false assumption role chats are independently thinking when idle.
- Fully offline V1 tests: grammar fuzz/edge cases, duplicates, process restart, tab discard, stale binding, wrong conversation, fake reply, partial reply, ambiguous send, loop attack, no-send SYNC-0 instrument.
- Windows activation: portable installer scripts with discovery, existing-extension ID preservation, HKCU native-host health, read-only PING, extension reload, minimal live test/negative test and rollback.
- **ChatGPT.com pilot:** two distinct simulated ChatGPT conversation agents plus commander, based on current DOM/turn fixtures. Prove portability with one *fake non-ChatGPT provider* adapter; no VOM/VOMEGA-specific integration.

## V2 acceptance (code-complete offline)
- `executor` adapter interface, implementation mapping AION envelopes to existing native host ACP v1 `session/prompt`; version negotiation, cwd bounds, cancel, stream/result, timeouts and busy semantics.
- OpenCode 2.0-specific companion adapter `@opencode/client` **only if beneficial**; preserve ACP path for compatibility. Versioned API tests from official V2 docs. `GET /api/event` SSE is volatile; explicitly reconcile authoritative session state on reconnect.
- Capability negotiation for providers/adapters and an executor manifest. No hardcoded VOMEGA/OpenCode into shared core.
- Plugin/MCP ingress adapter as **conditional** path: reuse `aion-mcp`; local read-only tested; write only if current ChatGPT workspace entitlement and permissions are confirmed. Skill package can exist without MCP. Events/webhooks as optional capability, not a claimed background agent.
- Recovery: Chrome restart, native host crash, ACP disconnect, SSE loss, browser DOM drift, unknown send outcome without duplication. Durable state format + schema version migration.
- End-to-end offline demonstrations: commander → 2 fake ChatGPT.com conversation agents → result reporting; commander → fake OpenCode ACP executor; generic bus → one independent fake non-ChatGPT browser-provider adapter. Independent negative tests.
- Documentation: developer API, adapter SDK/reference, protocol mapping matrix, CLI/scripts, plugin package, installation/upgrade/rollback, operator troubleshooting and V1→V2 migration.

## Engineering rules / freedom
- **Implement now, not just a plan.** No unnecessary approval loops or three-person signoffs for code tests. Use source-compatible Node/Bun and pure modules; use PowerShell script only where Windows-dependent.
- Prefer existing AION `extension` and `bridge` files, tests, and manifests; minimize changes. Preserve current pinned extension ID and native host mapping.
- No Playwright, Puppeteer or Orca in any code/tests. Use Node tests, fake Chrome runtime/DOM fixtures and permitted browser/native APIs.
- Never expose cookies/tokens or hardcode credentials; no auto-resend on ambiguous submission; actions bound to specific agents/targets. Ordinary local development proceeds normally; live signed-in browser testing waits for explicit owner go-ahead.
- Separate **developer-complete** from **host-validated**: `OFFLINE_PASS`, `WINDOWS_PENDING`, `CHATGPT_LIVE_PENDING`, `PLUGIN_ENTITLEMENT_UNKNOWN`, `ACCEPTANCE_PENDING`. Do not mark M1, Bus V1 or V2 live based on simulated results.
- No artificial restriction against writing implementation. If source code in this repo is incomplete, construct the missing portion. Take reasonably reversible engineering decisions yourself; record only meaningful architecture deviations.

## Execution workflow, in order
1. Inspect current repo HEAD, branches, relevant files/tests, plus VOMEGA pilot contract; produce a concise file-level reuse map, then implement.
2. Run baseline suites and keep regression tests passing.
3. Build complete V1 incrementally in existing source tree, tests adjacent to code. Run full portable V1 battery.
4. Build complete V2 adapters and conformance suite; test against fake ACP/OpenCode/MCP.
5. Produce primary ChatGPT.com pilot fixtures and a generic non-ChatGPT provider fixture, proving the neutral core. No VOM/VOMEGA-specific source edits.
6. Produce a *single* Windows install/verify orchestration script plus manual rollback; defer actual Windows/browser activation.
7. Commit and push validated work to main using safe Git integration. If unrelated agents changed code, reconcile carefully without force push.
8. Produce a compact completion matrix: artifact path → test → result → commit SHA → unverified host/live gate → exact Windows operator command. Do not claim the local host ran.
9. Update AION TOOLSMITH SITREP and issue #27/#28 with meaningful receipts rather than repetitive reports.

## Release exit
**V1 CODE-COMPLETE:** all offline scopes implemented and tested; installer/preflight included; live multi-tab ChatGPT path still explicitly PENDING.
**V2 CODE-COMPLETE:** real ACP/OpenCode and optional MCP adapter code implemented, offline provider test passes; Windows/runtime/in-product acceptance explicitly PENDING.
**LIVE VERIFIED:** can only be marked after an owner-authorized Windows/ChatGPT real run with correlated send, readback, negative test, and recorded evidence.

## First response requested
Give a 12-line-or-shorter execution summary of *what source you found, what exists already, what you will reuse, and the first code file you will change*; then begin implementation immediately. Don't end with a question list unless a concrete source/access blocker prevents work.
