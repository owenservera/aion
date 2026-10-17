# AION — Universal Onboarding
**ALWAYS ENTER AT [the repository root](https://github.com/owenservera/aion), then read [STATE.json](./STATE.json).**
This page is the human/agent startup procedure, not a claim of self-executing onboarding.

## Operating model (2026-10-17)
**Windows-driven development:** the owner's Windows machine is master, local agents run the code there, and ChatGPT (AION role) and Claude collaborate through this repo. Start with [AGENTS.md](../../AGENTS.md) and the [decision record](./canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md).

## Zero-assumption startup (3–5 minutes)
1. Read [STATE.json](./STATE.json) first: canonical host, goal, status, blockers, evidence hashes, and next action. Check its `updated_utc` against the actual GitHub revision date; if stale, independently refresh before deciding.
2. Read [Windows-master architecture](./canon/AION-M1-WINDOWS-MASTER-EXECUTION.md) and [real M1 acceptance](./canon/AION-MILESTONE-1-INTROSPECTION.md). The **Windows master** is the browser target; older BFF Linux M0.5 instructions are historical, not an assignment.
3. Read [experiment & methods registry](./canon/AION-M1-EXPERIMENTS-AND-METHODS.md). Search existing proofs and components before proposing code.
4. Check the active work ledger: [M1-002 issue #26](https://github.com/owenservera/aion/issues/26), [ACPX #25](https://github.com/owenservera/aion/issues/25), [Chrome Relay #18](https://github.com/owenservera/aion/issues/18), [M1-001 #24](https://github.com/owenservera/aion/issues/24). Read latest comments and commits, not merely original issue descriptions.
5. Read [State Protocol](./STATE-PROTOCOL.md) before proposing status changes, and confirm actual authorization and your executable tool access.
6. Respond with a short **AION_HANDOFF_V1** including as-of UTC, last verified sources/commits, goal, current stage, next one action, blocker, and what you can actually execute. Do not claim autonomous execution just because you can read this repo.

## What AION is doing
**Current primary mission:** AION originates one unique message and receives the **real** ChatGPT web-app reply through the **official Windows machine** without the owner manually relaying text. Real M1 is **not verified**. ACPX existing Chrome MV3/Bun implementation is the first reuse candidate; Chrome Relay is design; M1-001 and M1-002 are mock tests, with M1-002's screenshot caveat documented.

## Source-of-truth precedence
Owner's explicit current instruction and machine authority > recorded actual runtime/proof with timestamp > canonical M1 contract + STATE.json snapshot > linked experiment reports > exploratory planning. If sources disagree, do not silently choose. Log the conflict with refs and preserve history. GitHub is the durable shared record; it does not prove current state of the Windows machine by itself.

## How to continue
- **Agent with GitHub access:** fetch current STATE.json and latest relevant issue comments; perform only authorized actions; append immutable receipts, then atomically update current snapshot with supporting links.
- **Agent without GitHub access:** ask for a current exported snapshot; label its freshness and source. Never invent an up-to-date status.
- **New engineer:** verify ACPX original bytes before implementation; no Playwright/Puppeteer for new work. Code is authored and run by local Windows agents; the "Grok Bot never writes code" rule applies to Grok only.
- **Operator:** do not access authenticated ChatGPT or install browser components unless scoped host stop order is lifted by owner.

## 30-second handoff template
```text
AION_HANDOFF_V1
as_of_utc: <observed>
state_commit: <Git SHA or UNKNOWN>
goal: Real AION -> Windows Chrome ChatGPT -> AION
status: M1_VERIFIED=false (unless new independently checked proof)
current_blocker: <one proven blocker>
next_action: <one executable action>
authorized_to_execute: yes/no/unknown
proof_links: <GitHub URLs>
END_AION_HANDOFF_V1
```
