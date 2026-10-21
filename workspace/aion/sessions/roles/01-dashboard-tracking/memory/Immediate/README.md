# Immediate — Dashboard & Tracking

- **21 Oct 2026 source check:** Existing PM dashboard is a static 60-second polling page with GitHub inbox; named Overview/Machine/Human views and instant event stream absent from inspected HTML. See `workspace/aion/pm/dashboard/README.md` and issues #16/#17.
- **Vercel read-only check:** Project `aion-pm-dashboard` exists; 160 most recent deployment records across two pages CANCELED; newest has ignored-build-step documentation link. Production alias resolves to older READY deployment from 2026-10-19. Do not copy historical BLOCKED claim forward as current fact.
- **P0 #17:** Independently correlate live producer event → visible Android/desktop receipt in <5 seconds; test 10 pings/replay/duplicates/authorization/failure. No runtime proof obtained in this chat.
- **P0 #16:** Reuse existing dashboard; implement three named views with accessibility and true provenance, no invented health status. No code/deploy changes in this bootstrap.
- **New skill:** `skills/dashboard-evidence-gates/scripts/verify-pings.mjs` performs *package structure* checks only, never live verification; isolated Node 22 fixtures 12/12; Windows/OpenCode/ZCode invocation untested.
- **Dependencies:** Vercel ignored-build-step settings need appropriate project access; get_project works in accessible default scope but explicit team-scoped request returned 403. Do not infer configured reason solely from errorLink.
- **Boundary:** AION STATE (2026-10-19) has `live_execution_authorized=true` but `m1_verified=false`; Planning owns cross-team roll-up, Development owns runtime evidence, Dashboard owns presentation.
- **Next:** Diagnose Vercel ignored-build-step configuration read-only, request verified runner/owner evidence in #16/#17 as needed, then implement and test smallest real-time path without creating another dashboard.
