# AION PM Ledger v0.1
Generated 2026-10-16 03:05 CEST. Mirror of ledger.json (that file wins). Tags: **verified** = confirmed in repo bytes; **claimed** = not confirmed. Unknowns marked explicitly.

## Initiatives
- **AION-PC (#1 P0)**: #1 P0 GOAL: AION's text in chatgpt.com reaches ZCode, which executes it on Owen's Windows PC with Grok Bot-style reach (shell, files, browser, desktop)
<!--old: #1 P0: give AION (ChatGPT Digital CEO) Grok Bot-style capabilities (shell, files, browser, desktop) running ON Owen's Windows PC
- **UAH** — Universal Agent Hub (CLI-centred) (owner: ZCode (exec) / AION PM (plan))
- **IANG** — Integration Automation Network (owner: ZCode / AION PM)
- **IAM** — Integration Automation Model (data model; canonical DB home SOFTWARE_HQ/integrations/iam/) (owner: ZCode / AION PM)
- **AION-META** — AION self-reflection + web-app twin CLI (new Owen asks) (owner: AION PM; executor TBD)
-->

## P0 #1 current state
UNKNOWN / unproven. No repo evidence of a working path. W03 'ChatGPT -> local execution' is only a historically reported manual round trip; unattended path unverified (workload-registry.json).

ZCode evidence: zcode-setup: hub + pocket-link playbook (claimed via bff/PROJECT-BRIEFING.md; not re-read); zcode-bots: ZBot roster; main stale 10-08, draft PR #1 (claimed via briefing); zcode-pocket: Android app + PWA web/, P0 shell deployed, no transport (claimed via briefing)

## P0 #1 bridge options (ways to get AION's chatgpt.com text to ZCode for execution; evaluate, no implementation)
|Opt|Path|Existing support|Tag|
|-|-|-|-|
|A|ChatGPT custom connector / MCP server exposed from the PC over tunnel|canon/thread describe ChatGPT->tunnel->MCP ingress; SOFTWARE_HQ integrations/uah/contracts/MCP-INGRESS.md referenced|claimed (file not re-read)|
|B|Browser extension in Owen's ChatGPT tab relaying to a local agent|none found|UNKNOWN|
|C|CDP-driven relay (local process drives/parses the chatgpt.com tab)|vivim-omega D-419 CDP lane, plugins/provider-browser (CDP leg future/fixtures only), streaming D-339/D-352, parser.ts|verified (files exist; not live)|
|D|ACP bridge (UAH) -> ZCode on PC|SOFTWARE_HQ integrations/uah/MAP.md, uah/cli core modules; ACP Bridge itself missing; zcode-setup hub/pocket-link (claimed via BFF briefing)|verified partial (docs+scaffold); bridge claimed missing|
|E|GitHub issues as relay (current gh-bridge / bridge:dispatch)|001.PROJECTS.PM #16-18,#20; frozen by D4; VOMEGA gh-bridge retirement status UNKNOWN|claimed|

## Waves
|Wave|Scope|Status|
|-|-|-|
|W00|Baseline inventory and provenance|in progress (claimed)|
|W01|Complete UAH CLI census|pending|
|W02|UAH dependency periphery|pending|
|W03|Cross-repo dispersion|pending|
|W04|Integration Automation convergence|pending|
|W05|Canonical model validation|pending|
|W06|Execution-ready roadmap|pending|

## Workloads
|ID|Name|Repo status|Tag|
|-|-|-|-|
|W01|CCR routing for ZCode|not-live-verified-in-this-session|verified (status text)|
|W02|ZCode <-> OpenCode|design-and-historical-offline-tests-only|verified (status text)|
|W03|ChatGPT -> local execution|historically-manual-round-trip-reported; unattended-path-unverified|verified (status text)|

## Work items
|ID|Title|Initiative|Owner|Pri|Status|Tag|Evidence|
|-|-|-|-|-|-|-|-|
|PM-000|P0 #1 GOAL: chatgpt.com text -> ZCode executes on Owen's PC (Grok Bot-style reach)|AION-PC|ZCode|P0#1|option evaluation; nothing live|claimed|bff/ZCODE-PATH.md; https://github.com/owenservera/aion/issues/3|
|PM-001|IANG-D01 Integration Mapping & Alignment work package|IANG|ZCode||defined, not started|claimed|threads/pm-thread-1.md|
|PM-002|IAM v0.1 baseline handoff doc (commit 85476c3)|IAM|ZCode||done|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/IAM_CORE_V0_1.md|
|PM-003|IAM v0.1 SQLite: 33 tables, 27 seed nodes, 5 queue entries, integrity/FK pass|IAM|ZCode||exists only in ChatGPT sandbox|claimed|threads/pm-thread-1.md; IAM_CORE_V0_1.md says not uploaded|
|PM-004|P0 RECOVER iam_core_v0_1.sqlite3 + schema.sql + build.py|IAM|ZCode (BFF per D1)|P0|UNRECOVERED_FROM_CHECKED_SOURCES; AION sandbox check 0/5 present (2026-10-16)|verified (absence in SOFTWARE_HQ tree)|canon/EXECUTIVE-DECISIONS-2026-10-16-COS.md D1; pm/evidence/2026-10-16-aion-capabilities.md|
|PM-005|P0 RECOVER UAH dispersion sqlite v0.1/v0.2 + generated project.yaml + regen script|UAH|ZCode|P0|unrecovered; ChatGPT sandbox only; AION sandbox check 0/5 present (2026-10-16)|claimed|threads/pm-thread-2.md (note: SOFTWARE_HQ/integrations/project.yaml exists but is a different inventory YAML per D1); pm/evidence/2026-10-16-aion-capabilities.md|
|PM-006|UAH CLI entry point (P1 roadmap)|UAH|ZCode||missing; only safety/gate/fsx.mjs + DESIGN.md|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/uah/cli; SOFTWARE_HQ TASKS.md P1/P1a; alignment queue AQ-002|
|PM-007|ACP Bridge|UAH|ZCode||missing / blocks UAH P4|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/uah/MAP.md (file exists; content not re-read); https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/oracle-reconciliation/alignment/queue.csv AQ-003; integrations/TRACKER.md dependency notes|
|PM-008|Prove W01-W03|IANG|ZCode||unproven|verified|workload-registry.json; GPM WORKPLAN GPM-IA-01 (#19) pilots 'registered / no new pilot executed'|
|PM-009|Reconcile UAH 8 / IANG 23 / IAM 33 table schemas into one IAM DB|IAM|ZCode; AION accepts||blocked on PM-004/005|verified (decision exists)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/CANONICAL-MODEL-DECISION-2026-10-16.md; CEO-RECONCILIATION-PLAN M1-001..003; AQ-007|
|PM-010|Populate 100-variable catalog, 192-repo census, 1,000 work records into model|IAM|ZCode||referenced, not populated|claimed|threads/pm-thread-1.md|
|PM-011|W01 wave: enumerate all 19 UAH files (23 of 146 integration files indexed so far)|UAH|ZCode||pending|claimed|threads/pm-thread-2.md|
|PM-012|AION self-reflection (canon/AION-SELF-REFLECTION.md): close gaps G0-G7|AION-META|AION||doc published (9edc397); gaps G0 PC health, G1 phone, G2 recorder, G3 local bridge, G4 shared model, G5 browser twin, G6 PM loop, G7 product open|verified (doc exists; gap closure claimed)|https://github.com/owenservera/aion/blob/main/canon/AION-SELF-REFLECTION.md|
|PM-013|Twin CLI (canon/TWIN-CLI-SPEC.md): CDP web-app twin, ChatGPT first; gates T0-T8|AION-META|ZCode||spec published (f8b20e9); T0-T8 all not started; no live CDP claimed|verified (candidates exist)|owenservera/vivim-omega: docs/decisions/D-419-cdp-substrate-lane.md, plugins/provider-browser (CDP leg = future/fixtures only), docs/DISCOVERY.md, docs/HEALING.md, D-339/D-352 streaming, contracts/src/parser.ts, fixtures/import/chatgpt-conversations.json; https://github.com/owenservera/aion/blob/main/canon/TWIN-CLI-SPEC.md|
|PM-014|D4 dispatch freeze; receipt consumer for 001.PROJECTS.PM #16,#17,#18,#20; close receipt loop GitHub inbox -> PC consumer -> ZCode -> receipt (diagnostic-only first test, AION rec)|UAH|ZCode (BFF)|P0|open|claimed|canon D4; pm/evidence/2026-10-16-aion-capabilities.md; ACP-038, ACP-010, GPM PM-17, BOARD PM-17-ISSUE-1, self-reflection G3|
|PM-015|D5 PC storage P0 (6.3 GB free reported 10-14)|ops|BFF||open; current reading unknown|claimed|hq#7 via canon D5; hq projects/storage-rescue/PLAN.md T-01..T-21; BOARD PC-005|
|PM-016|Twin CLI gate T0: env + VOMEGA hashes|AION-META|BFF|P1|not started|claimed|TWIN-CLI-SPEC §10|
|PM-017|Twin CLI gates T1-T3: live Chrome attach, redacted capture, ChatGPT read twin|AION-META|BFF; AION verifies|P1|not started|claimed|TWIN-CLI-SPEC §10|
|PM-018|Twin CLI gates T4-T8: streaming, reversible edit, PM handoff, multi-app, resilience|AION-META|BFF; AION accepts|P2|not started|claimed|TWIN-CLI-SPEC §10|
|PM-019|PC-001 machine preflight / containment verification (PC HQ P0)|ops|PC HQ|P0|active-source-reported; current-host-unverified|claimed|https://github.com/owenservera/hq/issues/1 via BOARD.md|
|PM-020|Storage rescue quick wins T-01..T-04, T-12 (~10 GB est.)|ops|PC HQ / BFF|P1|ready, not executed|claimed|https://github.com/owenservera/hq/blob/main/projects/storage-rescue/PLAN.md|
|PM-021|Storage rescue heavy: T-06 opencode.db surgery (16.85 GB), T-09 Windows.old (11 GB, expires ~Oct 18, owner)|ops|Owen / PC HQ|P0|waiting on owner|claimed|https://github.com/owenservera/hq/blob/main/projects/storage-rescue/PLAN.md|
|PM-022|Storage rescue tooling/policy T-07,T-08,T-10,T-11,T-13..T-21|ops|PC HQ|P2|mixed ready/recon/optional|claimed|https://github.com/owenservera/hq/blob/main/projects/storage-rescue/PLAN.md|
|PM-023|ZCode UI acceptance: restart ZCode, confirm ccr-router + one live prompt (W01)|IANG|Owen|P1|blocked on human restart|verified (pending in tracker)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/TASKS.md; zcode-setup TRACKER Next #3-4|
|PM-024|SOFTWARE_HQ decisions D-a/D-b/D-c (CCR naming, new-provider-3, kit apply)|UAH|Owen|P1|open|verified (open in tracker)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/TASKS.md|
|PM-025|CCR per-provider emission (P2) then ZCode provider list cleanup to CCR only (P3)|UAH|orchestrator|P2|blocked by P1a + D-a/D-b|verified (pending)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/TASKS.md|
|PM-026|Migrate GPM owner-exec model channeler into SOFTWARE_HQ (P4)|UAH|orchestrator|P3|pending|verified (pending)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/TASKS.md|
|PM-027|SOFTWARE_HQ owner hygiene: prove safe-sync failure pre-existing, per-model context windows, disabled-provider policy, remove 2 worktrees, canonical .bridge-labs|UAH|Owen|P3|pending|verified (pending)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/TASKS.md|
|PM-028|Oracle alignment queue AQ-004..AQ-006 (CCR-ZCode gates, engine reuse, ZCode-OpenCode trace)|UAH|ZCode|P2|open|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/oracle-reconciliation/alignment/queue.csv|
|PM-029|zcode-opencode v1.0.0 live acceptance|IANG|ZCode|P2|packaged; live acceptance open|verified (status text)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/TRACKER.md|
|PM-030|CEO plan P0-001: complete ChatGPT conversation export / original-prompt sovereignty|IAM|AION / Owen|P1|open|verified (work order exists)|https://github.com/owenservera/001.PROJECTS.PM/blob/main/programs/uah-iang/CEO-RECONCILIATION-PLAN.md|
|PM-031|CEO plan milestones M2-M6 (periphery, IANG maturity, project tree, signals, convergence)|IAM|AION PM / ZCode|P3|not started|claimed|https://github.com/owenservera/001.PROJECTS.PM/blob/main/programs/uah-iang/CEO-RECONCILIATION-PLAN.md|
|PM-032|ACP P0 backlog: ACP-001,002,006,007,008,010,011,017,021,027,028,029,030 (constitution, security, authority, readiness, E2E session test, LocalGrokBot kernel)|UAH|ACP / ZCode|P1|backlog (status not in file)|claimed|https://github.com/owenservera/ACP/blob/main/backlog/TASKS.yaml|
|PM-033|ACP-038 bridge.request.v1 GitHub dispatch intake (Bun watcher) = PM-17 / ACP-019|AION-PC|ACP / ZCode|P0|backlog; = PM-014 consumer|claimed|https://github.com/owenservera/ACP/blob/main/backlog/TASKS.yaml|
|PM-034|ACP P1-P3 backlog (24 items: contracts, credentials, messaging, VOMEGA boundary, security residue, etc.)|UAH|ACP|P3|backlog|claimed|https://github.com/owenservera/ACP/blob/main/backlog/TASKS.yaml|
|PM-035|GPM programs PM-06..PM-20 (comms kit, governance, RACI, provider intel, capacity queue, Kanban, dashboards, NotebookLM)|GPM|Global PM|P3|proposed/partial; PM-01..05 done|verified (status text)|https://github.com/owenservera/001.PROJECTS.PM/blob/main/docs/WORKPLAN.md|
|PM-036|GPM board: SOFTWARE_HQ-APP-001, VOMEGA-D1 ratchet read, GPM-CHATGPT-DRYRUN-1, task notifications|GPM|various|P2|published / unknown receipt|claimed|https://github.com/owenservera/001.PROJECTS.PM/blob/main/reports/board.v0.1.json|
|PM-037|Product Hub W1-W4 + S0 storage audit (issues #1-#5)|ops|Product Hub|P2|acceptance unverified; 0/94 candidates actionable|claimed|https://github.com/owenservera/Product_Hub/blob/main/PROJECT_TRACKER.md|
|PM-038|zcode-setup next: bot schedules (brief 045), currency defects, OAuth providers (025), brief-023 acceptance, Q001-Q007|UAH|Owen / ZCode|P2|owner steps pending|claimed|https://github.com/owenservera/zcode-setup/blob/main/TRACKER.md|
|PM-039|Credential hygiene: plaintext keys in ZCode configs/backups (zcode-setup open problem; ACP-035)|ops|Owen|P1|open decision|claimed|https://github.com/owenservera/zcode-setup/blob/main/TRACKER.md|
|PM-040|atomic-1000 provisional inventory rollup: 1000 items, 100 parents, 10 workstreams (GPM 140, SW 140, BR 120, ACP/PC/AI 100, VO/UM/QG 80, PH 60); all Unverified/owner TBD/no deps; tracked as one roll-up, not imported|GPM|AION PM|P3|provisional; triage into verified tasks|claimed|https://github.com/owenservera/001.PROJECTS.PM/blob/main/intake/conversation-atomization-2026-10-14/atomic-1000.v0.1.json|
|PM-041|ZBot Host: native ACP tool behaviour not governed by Host approval layer (security gap)|AION-PC|ZCode|P1|open|claimed|AION-SELF-REFLECTION §2|
|PM-042|AION recorder / flight recorder (G2) + PWA phone reach (G1, Tailnet approvals pending)|AION-META|BFF|P2|partial, BFF-reported|claimed|AION-SELF-REFLECTION §3,§6|

## Unknowns
- UNKNOWN: Actual UAH CLI runtime behaviour
- UNKNOWN: Whether ChatGPT sandbox files are still downloadable
- UNKNOWN: ZCode version
- UNKNOWN: Current PC free disk
- UNKNOWN: Scope of 'AION self-reflection'
- UNKNOWN: ACP TASKS.yaml has no per-item status field; progress unknown
- UNKNOWN: Whether Windows.old auto-expired (~Oct 18)
- UNKNOWN: Whether any PC consumer reads aion inbox / publishes receipts (AION open question)

## Inbox
- Pinned: https://github.com/owenservera/aion/issues/4 · Test: #5 (closed)

## Top 10
1. P0#1 chatgpt.com -> ZCode on Owen's PC (PM-000)
2. Close receipt loop diagnostic-only: GitHub inbox -> PC consumer -> ZCode -> receipt (PM-014 = ACP-038 PM-033 = GPM PM-17)
3. PC disk: measure free space; T-09 Windows.old + T-06 opencode.db (PM-021, PM-015) and PC-001 preflight (PM-019)
4. ACP Bridge (PM-007)
5. Restart ZCode + ccr-router/live prompt acceptance (PM-023)
6. Recover IAM + UAH sqlite from original chats/Owen downloads (AION sandbox 0/5) (PM-004/005)
7. Owen decisions D-a/D-b/D-c then UAH CLI entry point (PM-024, PM-006)
8. Twin CLI T0-T3 (PM-016, PM-017)
9. Credential hygiene + ZBot Host approval gap (PM-039, PM-041)
10. Prove W01-W03 + merge schemas (PM-008, PM-009)

## Evidence
- `pm/evidence/2026-10-16-aion-capabilities.md` (claimed (AION self-report)): AION self-report: 0/5 lost files (IAM sqlite, schema.sql, build.py, UAH dispersion sqlite, project.yaml) in its sandbox; /mnt/data not durable; recommends closing receipt loop GitHub inbox -> PC consumer -> ZCode -> receipt, first test diagnostic-only

## Sources (path @ commit)
- 001.PROJECTS.PM: `reports/BOARD.md` @ 0f124f3
- 001.PROJECTS.PM: `reports/board.v0.1.json` @ 946f1e8
- 001.PROJECTS.PM: `docs/WORKPLAN.md` @ c65d01a
- 001.PROJECTS.PM: `programs/uah-iang/CEO-RECONCILIATION-PLAN.md` @ 5eb568b
- 001.PROJECTS.PM: `programs/integration-automation/workload-registry.json` @ e535928
- 001.PROJECTS.PM: `intake/conversation-atomization-2026-10-14/atomic-1000.v0.1.json` @ 648d5ea
- SOFTWARE_HQ: `TASKS.md` @ 5d41dec
- SOFTWARE_HQ: `TRACKER.md` @ 5d41dec
- SOFTWARE_HQ: `integrations/TRACKER.md` @ 5d41dec
- SOFTWARE_HQ: `integrations/oracle-reconciliation/alignment/TRACKER.md` @ c8eb320
- SOFTWARE_HQ: `integrations/oracle-reconciliation/alignment/queue.csv` @ 58e8801
- SOFTWARE_HQ: `integrations/oracle-reconciliation/alignment/signals.json` @ 2fa4d3d
- ACP: `backlog/TASKS.yaml` @ 1adf989
- Product_Hub: `PROJECT_TRACKER.md` @ bdcefe7
- hq: `projects/storage-rescue/PLAN.md` @ be5253f
- zcode-setup: `TRACKER.md` @ 301d82f
- aion: `canon/AION-SELF-REFLECTION.md` @ 9edc397
- aion: `canon/TWIN-CLI-SPEC.md` @ f8b20e9

## Source conflicts
- ID collision: GPM WORKPLAN uses PM-01..PM-20 (e.g. PM-17 = Bun auto-trigger); this ledger uses PM-000..PM-042. Refer to GPM ones as 'GPM PM-xx'.
- Receipt consumer appears 4x: ACP-038/ACP-019, GPM PM-17, BOARD PM-17-ISSUE-1, self-reflection G3 -> merged into PM-014/PM-033.
- UAH status: integrations/TRACKER.md 'NOT STARTED' vs SOFTWARE_HQ TASKS.md P1 'in_progress' (design only).
- Disk: canon/self-reflection 6.3 GB free (10-14) vs BOARD 'disk-free-current-unknown'; storage PLAN attributes -13 GB; no current reading.
- PC-001 is P0 on BOARD (PC HQ) but absent from prior ledger; now PM-019.
- atomic-1000 counts as 1000 'tasks' but all Unverified/owner TBD (AION itself flags as provisional).
- AION thread said /pm/ and /pm/inbox/ 404 on aion main vs ledger auto-pushed to workspace/aion/pm/ (path difference, not absence).
