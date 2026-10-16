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
- Linux reference implementation and test suite prepared in this chat's sandbox: 8/8 tests PASS including mocked `opencode session list` and sanitized export CLI. Actual BFF OpenCode is NOT installed in the ChatGPT Linux sandbox; no actual external session metrics or feed verification are claimed.
- Real Linux host and sync deployment must be done through BFF operator + OpenCode/ZCode code authoring, contingent on scoped host authorization; then independently read back one `workspace/aion/telemetry/bff/opencode/current.json` commit. ChatGPT cannot be pushed new tool messages by a GitHub commit; automatic notifications require later connected channel.
- Native session sharing was removed by upstream OpenCode v1.19.1, so WPM counts use native transcript/export access rather than relying on links.
- Outstanding: BFF ACK/host probe; authorized running service; real WPM samples; GitHub main readback; health/incident alert integration.
