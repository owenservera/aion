---
name: dashboard-evidence-gates
description: Verify AION Dashboard status and live-ping claims using source-linked event receipts, correlation IDs and clear UNKNOWN states before presenting health or success.
---

# Dashboard evidence gates

Use on SITREP, dashboard delivery review, new event mapping or operational health report.

1. Resolve source truth from issue #16 (three-view UI), issue #17 (instant pings), existing pm/dashboard source and M1 acceptance. Inspect fresh deployment and runtime evidence separately.
2. Classify each event: REQUESTED → DISPATCHED → ACKNOWLEDGED → EXECUTED → REPLIED → READ_BACK → VERIFIED; never infer later stages from earlier ones. Preserve correlation_id, actor, UTC timestamp, source URI and explicit UNKNOWN.
3. For a real-time ping claim require an independently sent unique harmless event, same-correlation visual receipt, measured latency <5 seconds while connected, 10-ping batch, disconnect/reconnect replay, duplicate handling and observed Android/desktop results.
4. Distinguish source built, deploy READY, service connected, event visible and externally verified. If any evidence is missing, surface UNKNOWN/DISCONNECTED or historical-only with timestamp instead of green.
5. Compare proposed dashboard updates with the existing project and peer ownership. Do not invent new dashboard sources, a second runtime, or an agent acknowledgment.
6. Report tested positive/negative cases and explicit limits. No local Windows or Vercel runtime verification merely from this skill file.

Canonical links: https://github.com/owenservera/aion/issues/16 and https://github.com/owenservera/aion/issues/17 .
