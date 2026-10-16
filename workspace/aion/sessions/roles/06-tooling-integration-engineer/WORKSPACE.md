# TOOLSMITH Workspace Map
This is one dedicated role workspace in the existing AION repo, not another repo or new chat instance.

## Files
- BOOTSTRAP.md: human-facing conversation launch and mission.
- AGENTS.md: operational rules for agents working here.
- SITREP.md: timestamped status and next gates.
- TOOL-REGISTRY.json: structured seed inventory; status values are evidence-qualified.
- skills/README.md: dispatch table for reusable task skills.
- skills/<name>/SKILL.md: focused executable decision/runbook workflows.
- Templates and resulting evidence should be linked to upstream canonical AION work orders, not duplicated in multiple role folders.

## Integration footprint
1. User/ChatGPT role -> Chrome relay extension (browser UI, presence only).
2. Chrome extension -> approved OS native messaging host -> UAH/ACP router.
3. UAH -> approved OpenCode/ZCode session executors.
4. IANG/SQLite -> durable local event/inbox/outbox model; GitHub -> cross-machine receipts and decisions.
5. Vercel dashboard consumes verified status; Efficiency consumes production session metrics; Planning owns high-level dependency alignment.
No invented native host, runtime, chat URL, route or deployment is assumed present.

## Initial priority ladder
P0: M0.5 dependencies (provide troubleshooting on request without diverting Grok).
P1: CR-001 Chrome relay fixture MVP, compatibility and fallback acceptance.
P1: TTP-001 proof validator executor readiness and independent test interfaces.
P2: UAH/ACP/ZCode/OpenCode capability registry and reproducible Windows/Linux profiles.
P2: Context7 pulls indexed to SOFTWARE_HQ with origin, version and date.
P3: Provider routing and model capability matrix (verified behavior only).

## Required status report
At least at material progress/blocker/handoff and end of work chunk: timestamp (UTC), exact task, observed host/tool/version, actions attempted, PASS/FAIL/UNKNOWN, artifacts/links, blockers, next best action, and responsible executor. Do not claim unattended continuation without connected scheduling or worker.
