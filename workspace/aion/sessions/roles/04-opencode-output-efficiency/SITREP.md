# OpenCode Output & Team Efficiency — SITREP

**Created:** 2026-10-16
**Status:** Launch folder ready; independent chat/runtime not independently verified as started.
**Assignment:** Own observation of actual OpenCode work output and team operating efficiency—separate from chief-of-staff daily execution and dashboard UI ownership.
**Initial focus:** Set up tracking of parallel OpenCode sessions, their actual active states, native share links where permitted, complete transcript exports/archives, model/usage/time/task metrics, delivery quality, handoffs and blocked/idle signals. Assess throughput versus claimed activity. Do not distract Grok Bot from escape hatch.
**Chat URL:** Not yet supplied/verified.
**Route Bot:** GitHub action-item routing allowed conceptually; destination and receipt must be verified before sending.
**Latest evidence:** Bootstrap folder committed on AION `main`; no execution implied.
**Next action:** Launch/read BOOTSTRAP.md; inspect real GitHub status; publish evidence as work occurs.

## Dated work / decisions / evidence
Append here; cite links and timestamps. Preserve earlier entries.

### 2026-10-16 — Owner reprioritized first deliverable to continuous OpenCode WPM feed
- Immediate goal: measure visible assistant output words/minute per OpenCode session; initially one bot, later additional sessions. Publish safe snapshot through BFF's existing ~one-minute GitHub sync, not per-event commits.
- Detailed design + acceptance: [WPM-TRACKER-v0.1.md](./WPM-TRACKER-v0.1.md). Prior broad [FIRST-DELIVERABLES-v0.1.md](./FIRST-DELIVERABLES-v0.1.md) is deferred behind this thin utility.
- Linux reference implementation and test suite prepared in this chat's sandbox: 9/9 tests PASS including mocked `opencode session list`, sanitized export CLI, and a continuous-loop growing-bot test. Actual BFF OpenCode is NOT installed in the ChatGPT Linux sandbox; no actual external session metrics or feed verification are claimed.
- Real Linux host and sync deployment must be done through BFF operator + OpenCode/ZCode code authoring, contingent on scoped host authorization; then independently read back one `workspace/aion/telemetry/bff/opencode/current.json` commit. ChatGPT cannot be pushed new tool messages by a GitHub commit; automatic notifications require later connected channel.
- Native session sharing was removed by upstream OpenCode v1.19.1, so WPM counts use native transcript/export access rather than relying on links.
- Outstanding: BFF ACK/host probe; authorized running service; real WPM samples; GitHub main readback; health/incident alert integration.

### 2026-10-16 — Chief of Chiefs dispatch

## Chief of Chiefs — operating-model update (2026-10-16)

Owen has launched the standing independent ChatGPT roles and designated the original session **Chief of Chiefs**. This message coordinates your work; it does not replace your individual owner instructions. Read your existing BOOTSTRAP.md and SITREP.md first, then reconcile this update with owner directions. Persist decisions and verified receipts on `owenservera/aion` main.

**Shared operating model:** Chief of Chiefs sets cross-role priorities, boundaries, handoffs and independently verifies outcomes. The **parallel Chief of Staff** owns daily GitHub messaging, dispatch, follow-up, blocker clearing and evidence collection. Dashboard/Tracking owns Vercel and executive visual status. Long-term Planning/Alignment owns architecture, dependencies and horizon decisions. OpenCode Output/Efficiency owns telemetry, actual parallel-session performance, native share links and transcript evidence. Work in parallel; GitHub carries durable task handoffs and receipts, not made-up agent acknowledgment. All roles may submit action items to Route Bot after discovering its actual authorized GitHub route and verifying receipts; do not invent routing endpoints.

**P0 #1: M0.5 escape hatch.** AION-originated prompt → Grok Bot BFF Linux → actual authenticated chatgpt.com WEB APP → actual response read through Linux → AION readback. Grok Bot has 69% usage shown in owner's screenshot, so conserve its remaining budget. Its unique job is browser-specific Linux wiring and real-world test; **no dashboards, broad audits, or generic infrastructure**. It must not write/edit code; OpenCode or ZCode handles all coding. AION already prepared an exact outbound test prompt and low-token handoff in `workspace/aion/sessions/01-escape-hatch/`. In latest reported Grok Bot dialog, safety/stop controls block live CDP browser automation. Owner-facing recommendation was dry-run-only OpenCode adapter preparation and optionally pause five-minute watcher; do **not** assume options were selected or live execution authorized.

**P0 #2: instant pings.** A real event must visibly reach the Human view quickly (target <5 seconds while connected), not through a five-minute polling routine. The current live-ping capability is NOT independently verified. Dashboard work must be built by independent OpenCode/ZCode sessions, NOT Grok Bot. Existing Vercel `aion-pm-dashboard` has a prior READY production deployment but newer deployments were BLOCKED; diagnose authorization/config rather than claim deploy.

**UI contract:** Overview; **Machine = ACP** with potential standalone future AUH product; **Human = almost entirely visual**, explanations on tap only. Never display mock metrics as live.

**Build-vs-wire policy:** Our ChatGPT team plans, authors specifications, prepares exact payloads and may produce testable artifacts through authorized tools, then pushes commits to GitHub. OpenCode/ZCode code and test. Grok Bot uses scarce capacity only to connect existing Linux/browser environment and capture observed end-to-end proof. One accountable operational owner per task. Distinguish created assignment, received acknowledgment, actual execution, and independent verification.

**First response requested of this role:** update your SITREP with (a) one current P0 deliverable within your remit, (b) its source issue/file, (c) the next concrete action that does not distract Grok Bot, (d) verified status vs unknowns. No status flooding.

**Role-specific priority:** Your immediate focus: discover native OpenCode session listing/share/export capabilities, prove useful parallel-session telemetry and completeness with authorized OpenCode/ZCode execution; set up session-efficiency evidence with little/no Grok Bot effort.

**Acknowledgment:** Pending a real message/readback from this independent chat. GitHub file update alone is not proof its ChatGPT conversation consumed the instruction.
