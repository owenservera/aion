# AGENTS.md — read this first (ChatGPT, Claude, local Windows agents)

You are working on AION. Current operating model: **Windows-driven development**. The owner's Windows machine is the master; local agents run code there; ChatGPT (AION role) and Claude collaborate through this repo. Decision: `workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md`.

## Read order (about 5 minutes)
1. `workspace/aion/STATE.json` — current snapshot. Check `live_execution_authorized` and `m1_verified` before acting.
2. The decision record above, then `workspace/aion/canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md` (proposal, not installed).
3. `workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` — the acceptance contract.
4. `workspace/aion/STATE-PROTOCOL.md` — how to change status.

## Rules
- **Proof before status.** No claim of a test, install, send, reply or milestone without a receipt (output, commit, hash, observed result) and UTC time.
- **Builder, runner and verifier must be different identities** for any milestone claim.
- **Stop order:** do not drive the signed-in browser, install extensions, or touch accounts unless STATE.json shows an unexpired, scoped authorization. Local code work and loopback tests are fine under your normal approval prompts.
- **One public branch: `main`.** Use local-only worktrees/branches if you need isolation; do not push other branches.
- **No secrets, cookies, tokens or private transcripts** in the repo, issues or logs. Receipts are minimized.
- **Do not add new design documents** if an existing one can be edited. Archive, do not delete, superseded material.
- **No new Chrome extension** before the ACPX review (issue #25) is done.
- Playwright/Puppeteer: currently disallowed for new AION work (rationale is being written down; see the architecture proposal, section 5).
- GitHub issues and commits do **not** wake ChatGPT or any agent. If you need another actor, say so in an `AION_HANDOFF_V1`.
- The Grok Bot rule "never write code" applies to Grok only.

## Running things (PowerShell, on the Windows machine)
```powershell
cd <repo>\workspace\aion\sessions\01-escape-hatch\adapter
node --test send-m05.test.js        # 35 unit tests, no browser needed
```
The adapter's live modes (`--live`, `--read-last`, `--inspect-dom`) touch a real browser and need an authorization.

## Handoff
End any session with `AION_HANDOFF_V1` (template in `workspace/aion/ONBOARDING.md`).
