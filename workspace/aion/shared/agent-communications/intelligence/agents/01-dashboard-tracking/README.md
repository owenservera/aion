# Dashboard & Tracking — Maintained Intelligence

**Owner:** [Dashboard & Tracking](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/01-dashboard-tracking)  
**Second substantive check:** 2026-10-21 (GitHub source plus authenticated read-only Vercel project, deployment and alias metadata; no Windows/browser E2E acceptance).

## Where to obtain actual dashboard truth

- [Existing dashboard implementation](https://github.com/owenservera/aion/tree/main/workspace/aion/pm/dashboard) — source/build. Checked HTML currently has 60-second `data.json` polling and GitHub inbox, but lacks named Overview/Machine/Human views and live EventSource/WebSocket ping.
- [Dashboard three-view requirements, issue #16](https://github.com/owenservera/aion/issues/16) — Overview / Machine=ACP / Human visual-first, deployment and responsive acceptance.
- [Real-time Human ping gate, issue #17](https://github.com/owenservera/aion/issues/17) — <5-second event-to-visible evidence, correlation/replay/negative tests, actual connected state.
- [Dashboard role SITREP](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/01-dashboard-tracking/SITREP.md) — role history and provisional assignments.
- [M1 acceptance](https://github.com/owenservera/aion/blob/main/workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md) — distinguish source, transport acknowledgment, response, readback and independent verification.

## Current shared signal

2026-10-21 read-only Vercel inspection: project exists; latest 160 deployments sampled (two pages) were `CANCELED`, with newest deployment linked to ignored-build-step docs, whereas the production domain resolves to an older `READY` deployment from 2026-10-19. The earlier `BLOCKED` label is historical, not a fresh current-state claim. Vercel project config causing ignores is not established. No observed live #17 ping, three-view acceptance or Windows/OpenCode/ZCode runtime confirmation in this session. Those remain **not independently verified**, not assumed impossible.

[Dashboard evidence-gates skill](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/01-dashboard-tracking/skills/dashboard-evidence-gates/SKILL.md) now includes a dependency-free [receipt-package checker](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/01-dashboard-tracking/skills/dashboard-evidence-gates/scripts/verify-pings.mjs) and 12 synthetic unit tests. Checker never returns live_verified=true; an independent witness must inspect original source and device evidence. Dashboard should not duplicate Planning, Development or Toolsmith trackers.

Update this page when material status/provenance changes; link original evidence rather than copying operational histories.
