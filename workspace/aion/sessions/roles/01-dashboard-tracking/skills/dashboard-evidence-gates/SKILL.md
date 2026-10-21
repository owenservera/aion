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

## Deterministic receipt audit (new second-pass capability)

The existing [relay envelope](../../../../ops/chrome-relay/ENVELOPE-CONTRACT.md) remains authoritative for machine transport. The separate script below takes a **read-only review adapter** with `sent` and `visible` observation arrays, not a competing protocol. Each entry carries `correlation_id`, `utc` (strict UTC ISO-8601), and `evidence_ref`; a visible observation also carries `device` (`android` or `desktop`). `checks` must contain `authorization`, `reconnect_replay`, `duplicate_handling`, and `failure_case`, each with `passed: true` and `evidence_ref`.

From AION repo root:

```powershell
node --test workspace/aion/sessions/roles/01-dashboard-tracking/skills/dashboard-evidence-gates/scripts/verify-pings.test.mjs
node workspace/aion/sessions/roles/01-dashboard-tracking/skills/dashboard-evidence-gates/scripts/verify-pings.mjs path/to/review-adapter.json
```

The script requires 10 unique sent/visible pairs, matching IDs, valid positive latency strictly under 5,000 ms, both Android and desktop observations, and cited negative checks. It exits 0 only when the **submitted package has the required shape and fields**; this does not authenticate evidence URLs, prove that testing occurred, test a browser, or grant live acceptance. Its output sets `live_verified:false` **unconditionally**. An independent witness must review original receipts. The bundled synthetic unit fixtures are intentionally NOT operational evidence.

**Validation:** 12 isolated Node 22 unit tests passed during the 2026-10-21 second-pass authoring session; GitHub source publication is not proof of installed OpenCode/ZCode invocation or Windows execution.
