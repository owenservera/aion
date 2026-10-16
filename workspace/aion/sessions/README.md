# AION — Standing Independent Chat Sessions

**Four standing roles — not one chat per task.** Open a role's `BOOTSTRAP.md`, paste it into a new ChatGPT chat, then add that real chat URL to its `SITREP.md` after creation. These are simple operational folders in the existing `main` branch, not branches, new repos or automatic ChatGPT conversation links.

| Standing chat | Launch prompt | SITREP | Owns |
|---|---|---|---|
| 01 Dashboarding & Tracking | [BOOTSTRAP](./roles/01-dashboard-tracking/BOOTSTRAP.md) | [SITREP](./roles/01-dashboard-tracking/SITREP.md) | Vercel dashboard, visual status and truthful project tracking |
| 02 Long-term Planning & Alignment | [BOOTSTRAP](./roles/02-long-term-planning-alignment/BOOTSTRAP.md) | [SITREP](./roles/02-long-term-planning-alignment/SITREP.md) | Milestones, roadmap, dependencies, strategic alignment |
| 03 Chief of Staff / Implementation & Operations (current assistant) | [BOOTSTRAP](./roles/03-chief-of-staff-operations/BOOTSTRAP.md) | [SITREP](./roles/03-chief-of-staff-operations/SITREP.md) | Daily operations, messages, coordination, follow-ups, evidence |
| 04 OpenCode Output & Team Efficiency | [BOOTSTRAP](./roles/04-opencode-output-efficiency/BOOTSTRAP.md) | [SITREP](./roles/04-opencode-output-efficiency/SITREP.md) | Actual OpenCode session output, telemetry, transcripts, efficiency and bottlenecks |

## Shared handoff rules
- Every role may raise action items to **Route Bot** via a verified existing GitHub route. First confirm its real destination/acknowledgment. No invented GitHub endpoint.
- Keep the SITREP updated with current state, prompt handoffs, actual commits, evidence, blockers and next actions.
- **Grok Bot/BFF remains focused on AION M0.5 escape hatch** (AION -> BFF Linux -> real ChatGPT web app -> BFF Linux -> AION), and **never authors code**. OpenCode/ZCode may code.
- A role can coordinate work across multiple task issues but must not take over another role's durable responsibilities.
- A launch file does not start another chat or autonomous agent by itself; runtime state must be verified.

## Legacy task folders (superseded as chat organization)
The earlier per-task launch folders remain intact so no bootstrap/evidence links are broken. They are **task-specific references**, not additional standing bots:
- [Escape Hatch](./01-escape-hatch/BOOTSTRAP.md)
- [Instant Pings](./02-instant-pings/BOOTSTRAP.md)
- [Vercel Dashboard](./03-vercel-dashboard/BOOTSTRAP.md)
