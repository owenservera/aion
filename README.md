# AION — Permanent Entry Point

**This is the one URL to share with any new AION agent, developer, ChatGPT conversation or operator: https://github.com/owenservera/aion**

> **CURRENT GOVERNANCE (2026-10-20):** One active Development workstream on `main`; Harvest and Research deliver source intelligence through the same repository and the [shared exchange](workspace/aion/ops/chrome-relay/harvest/EXCHANGE.md). Track B source may be authored remotely; the owner's Windows PC remains master for installed/live execution and independently verified proof. The earlier [Windows-driven decision](workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md) remains historical execution context. **Interactive same-web-thread Chrome I1/I2/I3 and real end-to-end M1 are not verified.** The draft Track B candidate PR #46 must be reconciled to main in safe, validated slices.

## Start here
**[Repository Steady-State Governance — single `main`, one Development workstream, Harvest and Research subprojects; Track A deprecated](REPOSITORY-GOVERNANCE.md)**

0. **[AGENTS.md — Rules for any agent (ChatGPT, Claude, local Windows agents)](AGENTS.md)**
1. **[ONBOARDING — Start any new agent in under five minutes](workspace/aion/ONBOARDING.md)**
2. **[STATE.json — Current canonical machine-readable state](workspace/aion/STATE.json)**
3. **[STATE-PROTOCOL — How to record verified changes without losing history](workspace/aion/STATE-PROTOCOL.md)**

## Active Development map (Track B)
- [AION Development Master — architecture, implementation evidence, integrations, decisions, roadmap and Harvest demand](workspace/aion/ops/chrome-relay/DEVELOPMENT-MASTER.md)
- [Machine-readable development index](workspace/aion/ops/chrome-relay/DEVELOPMENT-INDEX.json) · [shared Development ⇄ Harvest exchange](workspace/aion/ops/chrome-relay/harvest/EXCHANGE.jsonl)
- The main-only governance policy supersedes historical branch routing; the technical bidirectional CLI design is accepted, with I1/I2/I3 live proof still outstanding. Do not treat the index as a route engine.

## Architecture and experiments
- [Decision: Windows-driven dev with local agents (2026-10-17)](workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md)
- [Windows dev plane — architecture proposal v0.2 (not installed)](workspace/aion/canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md)
- [Windows M1 architecture and live acceptance path](workspace/aion/canon/AION-M1-WINDOWS-MASTER-EXECUTION.md)
- [All methods, experiments, test results, SHA-256 hashes and evidence](workspace/aion/canon/AION-M1-EXPERIMENTS-AND-METHODS.md)
- [Canonical M1 introspection contract](workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md)
- [Historical BFF Linux M0.5 design — no longer current execution host](workspace/aion/canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md)
- [Chrome Relay design (not installed)](workspace/aion/ops/chrome-relay/ARCHITECTURE.md)
- [Bus V1/V2 direction (PROPOSED): phone → ChatGPT → PC extension → agents and local executors (OpenCode first)](workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md)

## Active work and evidence
- [#25 ACPX Chrome MV3/Bun kit — source review and reuse](https://github.com/owenservera/aion/issues/25)
- [#26 M1-002 mock browser, Z.ai evidence and Windows transition](https://github.com/owenservera/aion/issues/26)
- [#24 M1-001 mock protocol](https://github.com/owenservera/aion/issues/24)
- [#18 Chrome Relay proposal](https://github.com/owenservera/aion/issues/18)

## Current one-line handoff
**Current Development goal:** `aion chat chief` watches and interacts with the **exact bound authenticated ChatGPT web conversation**, receives external turns, safely sends two correlated turns and recovers without resend. **Stage:** accepted architecture / incomplete candidate implementation. **Sequence:** I0 shared contract → P2/P3/P4/P5 parallel → I1 live read-only receive → P6/I2 two-turn Send → P7/I3 recovery → P8 legacy retirement. **Blocks:** no accepted I1/I2/I3 Chrome evidence; draft PR #46 not integrated; nine external donors not code-triaged. See [Development Master](workspace/aion/ops/chrome-relay/DEVELOPMENT-MASTER.md).

## Shared truths
- **Owner's official Windows machine is master**; local Windows agents execute; ChatGPT and Claude collaborate and review; Linux BFF is optional and Z.ai is disposable sandbox-only.
- `main` is the sole permanent development/integration branch; short-lived review/worktree branches are allowed and historical branches stay read-only until reconciled. See [repository governance](REPOSITORY-GOVERNANCE.md). No new mock-only cycles; mocks are regression fixtures.
- Do not create another competing Chrome extension before reviewing ACPX.
- No Playwright or Puppeteer. No credentials/cookies in repo. No unapproved browser/host actions.
- A GitHub issue, a new chat tab or a written role assignment does **not** autonomously wake a ChatGPT agent. (Sole proposed exception, not adopted: the owner-armed commander channel in the [Bus V1/V2 decision](workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md).)
- This URL and JSON are **persistently accessible state**, not an installed watcher/daemon. For fresh status, fetch the current commit and latest linked issue receipts; update state only on actual evidence.

---
Previous repository description: AION + AION BFF team workspace, plans, notes and saved work.
