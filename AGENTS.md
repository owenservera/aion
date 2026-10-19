# AGENTS.md — read this first (ChatGPT, Claude, local Windows agents)

You are working on AION. Current operating model: **Windows-driven development**. The owner's Windows machine is the master; local agents run code there; ChatGPT (AION role) and Claude collaborate through this repo. Decision: `workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md`.

## Read order (about 5 minutes)
1. `workspace/aion/STATE.json` — current snapshot. Check `live_execution_authorized` and `m1_verified` before acting.
2. The decision record above, then `workspace/aion/canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md` (proposal, not installed).
3. `workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` — the acceptance contract.
4. `workspace/aion/STATE-PROTOCOL.md` — how to change status.

## Rules
- **Proof before status.** No claim of a test, install, send, reply or milestone without a receipt (output, commit, hash, observed result) and UTC time.
- **Risk-based verification:** routine changes require appropriate tests and a readable commit; a genuinely independent reviewer is required only for real M1 acceptance, security-critical boundary changes, and disputed evidence. Builder and runner may be the same local agent.
- **Direct Windows development is approved as the operating model:** local agents can inspect source, edit code, run builds/unit tests, use ordinary local tools and perform non-destructive diagnostics without separate policy documents, identity handoffs or a daemon. The previously recorded host/browser stop order still applies to controlling signed-in ChatGPT and privileged/account actions until owner explicitly restarts that scope; a plain, traceable owner instruction is sufficient—no special grant-file template required. Do not confuse stale STATE.json with revocation of a newer owner instruction.
- **Git workflow:** target `main`; agents may use one checkout or local worktrees as convenient. Commit and push through ordinary verified Git operations with conflict checks. Avoid concurrent blind pushes/force-pushes; a permanent git integrator is optional, not a prerequisite.
- **No secrets, cookies, tokens or private transcripts** in the repo, issues or logs. Receipts are minimized.
- **Do not add new design documents** if an existing one can be edited. Archive, do not delete, superseded material.
- **Prefer ACPX reuse:** inspect existing ACPX before duplicating effort when available; do not block a smaller live-path experiment merely because a separate review role has not ACKed.
- Playwright/Puppeteer: currently disallowed for new AION work (rationale is being written down; see the architecture proposal, section 5).
- GitHub issues and commits do **not** wake ChatGPT or any agent. If you need another actor, say so in an `AION_HANDOFF_V1`. (Sole proposed exception, not adopted: the owner-armed commander channel in [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md); until the owner adopts it, this rule stands unchanged.)
- The Grok Bot rule "never write code" applies to Grok only.

## Running things (PowerShell, on the Windows machine)
```powershell
cd <repo>\workspace\aion\sessions\01-escape-hatch\adapter
node --test send-m05.test.js        # 35 unit tests, no browser needed
```
The adapter's live modes (`--live`, `--read-last`, `--inspect-dom`) touch a real browser and need an authorization.

## Handoff
Use a short handoff **only when a task crosses agents/sessions or work is left unfinished**. Ordinary completed tasks need a commit/receipt and concise result, not a mandatory form.
