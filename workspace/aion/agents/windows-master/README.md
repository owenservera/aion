# Windows Master — Agent Folder

Operating instructions for local agents running on `OWNER_WINDOWS_MASTER`.

**Authority model** (see [`DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md`](../../canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md)):
the owner's Windows machine is the authoritative development environment. GitHub is the durable shared
ledger. ChatGPT (AION role) and Claude are collaborators and reviewers through this repo — they do not
claim execution on this machine.

## Read in this order

| # | File | Purpose |
|---|---|---|
| 1 | [`PLAN.md`](PLAN.md) | Phased execution plan with live status. What is done, what is next, what is blocked. |
| 2 | [`RUNBOOK.md`](RUNBOOK.md) | Daily operations: sync commands, status checks, recovery, uninstall. |
| 3 | [`ENVIRONMENT.md`](ENVIRONMENT.md) | Verified tool inventory. Reuse this; do not install a second copy of anything. |
| 4 | [`M1-PATH.md`](M1-PATH.md) | How to reach real ChatGPT introspection, and the exact smallest missing component. |
| 5 | [`BLOCKERS.md`](BLOCKERS.md) | Items that need an owner decision. Do not self-resolve these. |

Related, elsewhere in the repo:

- Sync system source + its own manual: [`ops/winsync/`](../ops/winsync/README.md)
- Repository/dependency inventory: [`ops/WINDOWS-DEPENDENCY-INVENTORY.md`](../ops/WINDOWS-DEPENDENCY-INVENTORY.md)
- Durable project state: [`workspace/aion/STATE.json`](../../STATE.json)
- M1 acceptance contract: [`canon/AION-MILESTONE-1-INTROSPECTION.md`](../../canon/AION-MILESTONE-1-INTROSPECTION.md)

## Non-negotiables for any agent working here

1. **Proof before status.** No test, send, reply or milestone claim without a receipt and a UTC time.
2. **No Playwright or Puppeteer** for any AION work.
3. **No secrets, cookies, tokens or private transcripts** in the repo, issues or logs.
4. **No force-push and no destructive Git** (`reset --hard`, `clean`, `checkout --`, `stash push/pop`, rebase-over-pushed-history).
5. **Do not operate the signed-in ChatGPT browser** without an explicit, current owner instruction naming
   the browser target and the action. `live_execution_authorized` is `false` in `STATE.json`.
6. **Do not create a second** daemon, Chrome extension, database, or Git integration service when an existing
   component can meet the requirement.
7. **Do not invent proof.** A test that did not run is not a passing test.

## Current headline

`M1_VERIFIED = false`. The local Windows toolchain is bootstrapped and the repository syncs on a
5-minute schedule. The remaining work is the authenticated-browser leg, which is gated on owner
authorization, not on missing code.