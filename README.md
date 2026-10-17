# AION — Permanent Entry Point

**This is the one URL to share with any new AION agent, developer, ChatGPT conversation or operator: https://github.com/owenservera/aion**

> **CURRENT DECISION (2026-10-17): Windows-driven development.** The owner's Windows machine is the master: local agents write and run the code there, and ChatGPT (AION role) and Claude collaborate through this repo. GitHub is the durable coordination/evidence system, not the live browser transport. Real M1: **NOT VERIFIED**; host/browser stop order remains active pending a scoped owner authorization. See the [decision record](workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md).

## Start here
0. **[AGENTS.md — Rules for any agent (ChatGPT, Claude, local Windows agents)](AGENTS.md)**
1. **[ONBOARDING — Start any new agent in under five minutes](workspace/aion/ONBOARDING.md)**
2. **[STATE.json — Current canonical machine-readable state](workspace/aion/STATE.json)**
3. **[STATE-PROTOCOL — How to record verified changes without losing history](workspace/aion/STATE-PROTOCOL.md)**

## Architecture and experiments
- [Decision: Windows-driven dev with local agents (2026-10-17)](workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md)
- [Windows dev plane — architecture proposal v0.2 (not installed)](workspace/aion/canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md)
- [Windows M1 architecture and live acceptance path](workspace/aion/canon/AION-M1-WINDOWS-MASTER-EXECUTION.md)
- [All methods, experiments, test results, SHA-256 hashes and evidence](workspace/aion/canon/AION-M1-EXPERIMENTS-AND-METHODS.md)
- [Canonical M1 introspection contract](workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md)
- [Historical BFF Linux M0.5 design — no longer current execution host](workspace/aion/canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md)
- [Chrome Relay design (not installed)](workspace/aion/ops/chrome-relay/ARCHITECTURE.md)

## Active work and evidence
- [#25 ACPX Chrome MV3/Bun kit — source review and reuse](https://github.com/owenservera/aion/issues/25)
- [#26 M1-002 mock browser, Z.ai evidence and Windows transition](https://github.com/owenservera/aion/issues/26)
- [#24 M1-001 mock protocol](https://github.com/owenservera/aion/issues/24)
- [#18 Chrome Relay proposal](https://github.com/owenservera/aion/issues/18)

## Current one-line handoff
**Goal:** AION sends a unique real message via **Windows Chrome authenticated ChatGPT web app**, reads the real reply automatically, proves a negative case. **Stage:** Windows pre-live reuse assessment. **First candidate:** existing ACPX extension + Bun bridge. **Blocks:** real Windows inventory, ACPX full source review, TOOLSMITH 06 actual ACK, scoped browser authorization, live acceptance. **Mock:** M1-001 and M1-002 tested; neither completes real M1.

## Shared truths
- **Owner's official Windows machine is master**; local Windows agents execute; ChatGPT and Claude collaborate and review; Linux BFF is optional and Z.ai is disposable sandbox-only.
- Public branch is `main` only; agents use local-only worktrees. No new mock-only cycles; mocks are regression fixtures.
- Do not create another competing Chrome extension before reviewing ACPX.
- No Playwright or Puppeteer. No credentials/cookies in repo. No unapproved browser/host actions.
- A GitHub issue, a new chat tab or a written role assignment does **not** autonomously wake a ChatGPT agent.
- This URL and JSON are **persistently accessible state**, not an installed watcher/daemon. For fresh status, fetch the current commit and latest linked issue receipts; update state only on actual evidence.

---
Previous repository description: AION + AION BFF team workspace, plans, notes and saved work.
