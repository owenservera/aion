# AION — Standing Independent Chat Sessions

**Nine designed standing roles — not one chat per task. Role 09 is the global research function; its role folder does not create a second chat or worker.** The first five were previously reported established; Roles 06, 07 and 08 need owner-launched conversations and genuine acknowledgments. Open a role's `BOOTSTRAP.md`, paste it into a new ChatGPT chat, then add that real chat URL to its `SITREP.md` after creation. These are simple operational folders in the existing `main` branch, not branches, new repos or automatic ChatGPT conversation links.

| Standing chat | Launch prompt | SITREP | Owns |
|---|---|---|---|
| 01 Dashboarding & Tracking | [BOOTSTRAP](./roles/01-dashboard-tracking/BOOTSTRAP.md) | [SITREP](./roles/01-dashboard-tracking/SITREP.md) | Vercel dashboard, visual status and truthful project tracking |
| 02 Long-term Planning & Alignment | [BOOTSTRAP](./roles/02-long-term-planning-alignment/BOOTSTRAP.md) | [SITREP](./roles/02-long-term-planning-alignment/SITREP.md) | Milestones, roadmap, dependencies, strategic alignment |
| 03 Chief of Staff / Implementation & Operations (separate parallel session) | [BOOTSTRAP](./roles/03-chief-of-staff-operations/BOOTSTRAP.md) | [SITREP](./roles/03-chief-of-staff-operations/SITREP.md) | Daily operations, messages, coordination, follow-ups, evidence |
| 04 OpenCode Output & Team Efficiency | [BOOTSTRAP](./roles/04-opencode-output-efficiency/BOOTSTRAP.md) | [SITREP](./roles/04-opencode-output-efficiency/SITREP.md) | Actual OpenCode session output, telemetry, transcripts, efficiency and bottlenecks |

| 05 Chief of Chiefs (current assistant) | [BOOTSTRAP](./roles/05-chief-of-chiefs/BOOTSTRAP.md) | [SITREP](./roles/05-chief-of-chiefs/SITREP.md) | Executive oversight, resource alignment, delegation and independent verification |
| 06 TOOLSMITH — Tooling & Integration Engineer (pending launch) | [BOOTSTRAP](./roles/06-tooling-integration-engineer/BOOTSTRAP.md) | [SITREP](./roles/06-tooling-integration-engineer/SITREP.md) | Tool inventory, skills, environment readiness, ACP/UAH interoperability, Chrome relay integration and recovery |
| 07 INTAKE — Proposal Commons Custodian (pending launch) | [BOOTSTRAP](./roles/07-proposal-intake-commons/BOOTSTRAP.md) | [SITREP](./roles/07-proposal-intake-commons/SITREP.md) | Raw inbound technical proposals, source provenance, neutral first pass, shared proposal pool, derived scoring/indexing |
| 08 Z-FORGE — Z.ai Web Agent Sandbox Strategist (pending launch) | [BOOTSTRAP](./roles/08-zai-sandbox-strategist/BOOTSTRAP.md) | [SITREP](./roles/08-zai-sandbox-strategist/SITREP.md) | Z.ai web Full-Stack Agent turn research, high-output mission design, sandbox experimentation, artifact recovery and AION knowledge transfer |

| 09 AION RESEARCH — global research function (owner designated 2026-10-19) | [BOOTSTRAP](./roles/09-global-research/BOOTSTRAP.md) | [SITREP](./roles/09-global-research/SITREP.md) | Single research intake, scientific inquiry, docs intelligence, media, evidence assessment, cross-portfolio transfer and delivery; SOFTWARE_HQ owns applicable documentation storage |

## Role 09 launch (existing conversation may serve as designated role)
- [One-message fresh-session prompt](./roles/09-global-research/LAUNCH-PROMPT.md), [skill registry](./roles/09-global-research/skills/README.md), [tools](./roles/09-global-research/TOOLS.json), [schedules](./roles/09-global-research/SCHEDULES.md).
- Existing Role 07 continues original technical proposal source custody. It must hand research questions to Role 09, not run a second research queue. Native project owners still implement; GPM governs execution tracking; SOFTWARE_HQ retains docs authority.
- Role 09 is **not yet configured in the Chrome role-launcher registry** and must not be advertised as automatic. A new thread does not exist merely because this folder exists; the owner has designated the active research function in conversation, with no independently captured chat URL.

## Role 06 launch instructions
- Create a dedicated ChatGPT conversation named **AION — 06 TOOLSMITH** and paste its BOOTSTRAP.md.
- After genuine role acknowledgment, provide the chat URL for the role SITREP; until then its status is **DESIGNED / NOT ACTIVE**.
- Existing five roles remain separately accountable; role 06 does not replace Chief of Staff or OpenCode implementers.

## Role 07 launch and proposal pool
- Create an independent ChatGPT conversation **AION — 07 INTAKE**, paste its [BOOTSTRAP](./roles/07-proposal-intake-commons/BOOTSTRAP.md) and register the actual chat URL after acknowledgment.
- Canonical shared [Proposal Commons](../shared/technical-proposals/README.md) and [submission inbox issue #20](https://github.com/owenservera/aion/issues/20). All technical council/AI responses must preserve RAW + provenance and a separately labeled neutral first pass.
- Authorized team members can comment and submit [structured proposal reviews](../shared/technical-proposals/REVIEW-PROTOCOL.md); Role 07 indexes/aggregates only genuine reviews and does not vote or approve execution.
- These instructions are publication, not real-time delivery into another independent role conversation.

## Role 08 launch and Z.ai turn feed
- Create a separate ChatGPT conversation **AION — 08 Z-FORGE**, paste its [LAUNCH-PROMPT](./roles/08-zai-sandbox-strategist/LAUNCH-PROMPT.md) and record real acknowledgment/chat URL when available. Launching a repo role does not start a live session.
- Research/lab: [30 tasks and sandbox mission feed](../ops/zai-sandbox-lab/README.md); [onboarding/research issue #21](https://github.com/owenservera/aion/issues/21). One user-submitted web Full-Stack Agent turn at a time, with model as selected by owner.
- Z.ai web Agent Mode is distinct from ZCode desktop, AutoClaw and API. Experimental sandbox coding permitted as the user-directed turn; no production repo write without separate approval and independent verification. No Playwright/Puppeteer.
- Send real capability evidence to TOOLSMITH, measured output to Efficiency, conceptual agent proposals to INTAKE, approved deliverables to CoS, and final acceptance to Chief.

## Keyword-based role launches (RL-001, design only)
- [Role launcher canonical registry](../ops/chrome-relay/role-launcher/ROLES.json): eight launcher-registered identifiers (01–08); Role 09 is manually launchable only until launcher compatibility is implemented and tested.
- [Quickstart](../ops/chrome-relay/role-launcher/KEYWORD-QUICKSTART.md): `aion 08` from Chrome omnibox **after** extension installation, or `AION:08` in manually created new chat with project router instructions installed. Neither mechanism is installed/verified by publishing repo files.
- [ChatGPT Project instructions snippet](../ops/chrome-relay/role-launcher/PROJECT-ROUTER-INSTRUCTIONS.md) must be added manually to designated Project settings for zero-code first-message recognition.
- Native ChatGPT conversation renaming is a separate observed UI action; role title suggestion alone is not a rename. [Implementation issue #22](https://github.com/owenservera/aion/issues/22).

## Shared handoff rules
- Every role may raise action items to **Route Bot** via a verified existing GitHub route. First confirm its real destination/acknowledgment. No invented GitHub endpoint.
- Keep the SITREP updated with current state, prompt handoffs, actual commits, evidence, blockers and next actions.
- **Grok Bot/BFF remains focused on AION M0.5 escape hatch** (AION -> BFF Linux -> real ChatGPT web app -> BFF Linux -> AION), and **never authors code**. OpenCode/ZCode may code.
- A role can coordinate work across multiple task issues but must not take over another role's durable responsibilities.
- Owen reports the independent sessions are launched, including the extra Chief of Staff. Chat URLs/receipt-level status are not yet captured in this repo; do not confuse this with 'not launched'.
- A launch file does not start another chat or autonomous agent by itself; runtime state must be verified.

## Legacy task folders (superseded as chat organization)
The earlier per-task launch folders remain intact so no bootstrap/evidence links are broken. They are **task-specific references**, not additional standing bots:
- [Escape Hatch](./01-escape-hatch/BOOTSTRAP.md)
- [Instant Pings](./02-instant-pings/BOOTSTRAP.md)
- [Vercel Dashboard](./03-vercel-dashboard/BOOTSTRAP.md)
