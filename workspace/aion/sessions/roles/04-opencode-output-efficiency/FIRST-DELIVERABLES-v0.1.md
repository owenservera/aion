# Role 04 — First Delivery Plan v0.1
Date: 2026-10-16
Status: DESIGN PUBLISHED; no host/session deployment implied
Role: OpenCode Output & Team Efficiency
Repository: owenservera/aion, main only

## Mission and north-star measure
Determine which OpenCode sessions are actually doing useful work, what they deliver, how efficiently they use time/models/tools, and which interventions improve output. Primary KPI: independently verified useful deliverables / agent-hour, accompanied by rework and owner-intervention burden. Never divide by an unknown denominator or call unobserved execution active.

Keep the team small: this role owns measurement and evidence; the Chief of Staff owns dispatch/follow-up; Dashboard role owns UI; Long-term Planning owns roadmap/dependencies. Grok Bot operates BFF Linux primarily for AION M0.5, never authors code. OpenCode/ZCode exclusively author implementation code. No new coordination service/repository/branch; existing GitHub Issue #14 is known BFF inbox, but Route Bot's real identity/destination/ACK remain unverified.

## Source-backed starting baseline
- Role bootstrap and SITREP: workspace/aion/sessions/roles/04-opencode-output-efficiency/.
- Canon: workspace/aion/canon/AION-BOOTSTRAP-2026-10-16.md; AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md.
- Primary issue: https://github.com/owenservera/aion/issues/15; notification/UI dependents: #17 / #16; evidence inbox: #14.
- BFF Linux readiness document reports OpenCode 1.19.1 installed and smoke-tested. Issue #14 has independently read-back OpenCode-generated GitHub artifact commit d8f17a1. None of that verifies two or four overlapping sessions.
- Git tree as inspected on 2026-10-16 has no workspace/aion/telemetry/bff/opencode runtime ledger/archives.
- Current repo acknowledges a host/browser execution stop order: only documentation, analysis and ordinary GitHub planning changes proceed unless an authorized operating gate is confirmed.
- CRITICAL VERSION FACT: official OpenCode changelog says v1.19.1 DISCONTINUED native session sharing (https://dev.opencode.ai/changelog). V2 also lacks sharing (https://dev.opencode.ai/v2/docs/sharing/). Older generic /share documentation is not applicable without a version-verified runtime proof. Do not downgrade merely to recreate public sharing. Use native exports and safe links to GitHub evidence first. Never turn auto-share on globally.

## First delivery tranche: five bounded outcomes

### D01 — Runtime and feature truth inventory (first)
Owner: Role 04 designs/independently inspects; BFF operator supplies authorized host evidence; OpenCode codes only if a probe tool is needed.
Output: one dated, source-referenced inventory of OpenCode binaries/version(s), processes/serve endpoints and project directories, session IDs, active state, native export availability, sharing availability, model list, and data-access limitations. Snapshot first: no installs, no session creation necessary.
Method: when host activity is authorized, inspect opencode --version, relevant help commands, opencode session list --format json, opencode stats, local processes, and each installed server /doc, /session, /session/status and /global/event or /event if present. Server responses and process probes must be correlated; saved sessions are not necessarily running.
PASS: executable/version/endpoint evidence with UTC timestamps and at least one verifiable process/session-state correlation; unsupported features explicitly unavailable. FAIL: inferred states, stale version assumptions, or reported-only claims.
Blockers: direct Linux access to current runtime is not provided to this chat; operating stop order still stands.

### D02 — Canonical lightweight session/event ledger
Owner: Role 04 owns schema and accuracy; OpenCode/ZCode implements producer ONLY after authorization; BFF operates; PM verifies.
Output path (proposed and consistent with #15): workspace/aion/telemetry/bff/opencode/manifest.json plus safe bounded snapshots/receipts per session. Local raw captures are separate from safe GitHub status. This is an evidence projection, not a competing IAM canonical graph or a replacement for AION PM ledger.
Minimal record fields: source host and instance; session_id; project/repo/ref/work directory; task_id/issue URL; agent/model/provider; creation/start/end/last_observed UTC; state [unknown, queued, running, idle, waiting_permission, blocked, failed, completed, aborted, disconnected]; state_source and observed_at; current tool (if exposed); input/output tokens, cost and sampling quality (if exposed); errors; last commit/output SHA; native_export_sha256 and safe_view_path; share_capability and share_url only if version-verified and approved; sensitivity/redaction status; correlation_id; evidence URLs; final verification and acceptance status.
Events are local append-only, keyed by {host,instance,session_id,event_id} or content hash if absent; snapshots are projections. Push bounded safe changes on meaningful transitions and final archive, not every token. Mark missing metrics null/unknown; never fill with zeros.
PASS: same input -> same manifest; no duplicate events after replay; unknown states distinguish missing evidence; secure Github readback matches content hashes.

### D03 — Two-session proof, then four-session fan-out
Owner: BFF operates authorized independent OpenCode sessions; OpenCode/ZCode handles code changes; Role 04 constructs comparative proof, Chief of Staff coordinates, PM accepts.
Output: two independently attributable and overlapping runs on separate harmless tasks, followed by four only after the two-session gate passes and capacity/safety allows. Four sessions were requested in #14 but not observed; preserve that instruction without presenting it as accomplished. For code tasks, isolated working directories/worktrees in the task repositories where permitted; AION repo remains main-only and does not acquire new branches.
Required evidence: distinct IDs, task prompts, UTC start/end/last event, independent responses or tested commit outputs, overlap calculation using observed intervals, failure/permission handling, resource pressure and no cross-session transcript mixing. Record honest utilization rather than counting every historical session as 'active'.
PASS: actual overlap and separate completed task receipts for two, then four, with reproducible evidence links; never claim sessions spawned from a Github issue alone.

### D04 — Reproducible transcript archive and privacy gate
Owner: OpenCode/ZCode implement exporter; BFF operates and verifies; Role 04 checks provenance and completeness.
Output: incremental snapshots while active and terminal native JSON export in original order, including visible messages/parts/tool calls/responses if exposed; content hash and manifest; sanitized searchable metadata in GitHub; exact raw originals retained locally and encrypted before any remote publication with keys kept out of Git and logs.
At runtime select syntax using installed CLI --help: published docs differ between opencode export and opencode session export across versions. Public native-share link is OPTIONAL, gated on genuine supported version and affirmative content review; v1.19.1 should be assumed unsupported until contradicted by actual evidence. No public share for secrets/private source.
PASS: source archive hashes and independent remote readback; decrypt and reproduce authorized test original; verify no secret leak, ordering, dedup, interrupted export retry, terminal capture. FAIL: a URL without durable archive, stripped tool content presented as complete, unencrypted secrets pushed.

### D05 — Output/efficiency and incident scorecard
Owner: Role 04 calculates and audits; Dashboard role may present projections; #17 owns notification delivery; Chief of Staff owns operational remediation.
Output: small machine-readable aggregate and concise exception report drawn from the ledger, with no separate dashboard. Metrics: active/concurrent sessions; queue/wait/blocked/running minutes; completed-and-verified tasks; accepted outcomes per agent-hour; first-result latency; rework/failure rate; tokens/cost per accepted outcome when native usage exists; evidence freshness and coverage; detector-to-operator-receipt latency.
Prioritize incident signals: error, permission/human blocker, unexpected exit, stalled timeout, disconnected watcher. Per #15/#17, critical alerts target less than 5 seconds **measured event-to-receipt**, not a five-minute GitHub poll. Reuse #17 delivery transport rather than build another notifier; separate watcher-health monitor and periodic reconciliation. Before a real alert channel exists, only report alert delivery UNPROVEN.
PASS: two-session baseline with source-backed metrics, at least one reproducible failure case and independently checked receipts; do not represent synthetic tests as an operating alert system.

## Sequence and dependencies
Now, safely: publish this plan and an updated Role-04 SITREP; inspect existing GitHub receipts; document the version-specific sharing mismatch; identify live read-access/stop-order owner gate.
When authorized: D01 host truth -> D02 minimal status ledger -> D03 2-session proof -> D04 archive -> D05 performance baseline. Interleave event/alert producer contract with #17. Once the two-session tests pass, repeat at four sessions. Do not withhold D01/D02 design for Vercel's BLOCKED deployment; UI consumes evidence later.

## Acceptance/evidence discipline
Every transition: REQUESTED -> ACKNOWLEDGED -> OBSERVED -> TESTED -> VERIFIED -> ACCEPTED. Never use GitHub publication as runtime acknowledgment. Preserve UTC, command/endpoint, observed output hash, source ref, verifier and negative tests. The most valuable first verified insight may be that the installed version has no native share path or that a session was not running; this is not failure, it is a resolved ambiguity.

## Open blocking decisions and interfaces
- Host/browser stop order remains; this planning publication does not lift it.
- Route Bot endpoint/identity and real receipt remain unverified; do not send an invented route.
- Current OpenCode runtime and share/export endpoints require BFF-host observation, not assumptions from docs.
- GitHub auto-push has reported secret-coverage/conflict risk; sanitize/encrypt and verify before putting any session payload in the watched path.
- #17 owns prompt push delivery and #16 owns mobile views; give them safe typed data, not competing stores.
