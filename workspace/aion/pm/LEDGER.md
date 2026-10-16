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

## Running atomic tasks (100)

**Canonical machine ledger:** [`ledger.json`](./ledger.json) → `atomic_tasks`. This table is a human-readable mirror; the machine ledger wins.

**100 assigned owners, 0 agent acknowledgments recorded.** Status `assigned_unacknowledged` is not execution. PM verifies independently before advancing any task. Owen does not maintain this list.

**Priority distribution:** P0: 26 · P1: 44 · P2: 30. **Existing 43 PM work items remain in place; these 100 tasks are atomic execution steps linked to them, not replacements.**

| ID | Priority | Owner | Atomic deliverable | Existing seed | Acceptance | Status |
|---|---|---|---|---|---|---|
| AT-001 | P0 | AION PM | Identify exact canonical ChatGPT conversation URL | ACP / AION communications (PM-000) | URL recorded and confirmed from owner-provided thread | Unacknowledged |
| AT-002 | P0 | AION BFF | Inspect BFF browser session for target conversation access | ACP / AION communications (PM-000) | Access result and timestamp recorded | Unacknowledged |
| AT-003 | P0 | AION BFF | Test opening canonical conversation in BFF browser | ACP / AION communications (PM-000) | Actual page URL and access result captured | Unacknowledged |
| AT-004 | P0 | AION BFF | Post identity-prefixed BFF presence message in target conversation | ACP / AION communications (PM-000) | Message visibly appears in target conversation | Unacknowledged |
| AT-005 | P0 | AION PM | Identify PM browser session and its access path | ACP / AION communications (PM-000) | PM session access path recorded | Unacknowledged |
| AT-006 | P0 | AION PM | Test opening canonical conversation in PM browser | ACP / AION communications (PM-000) | Actual page URL and access result captured | Unacknowledged |
| AT-007 | P0 | AION PM | Post identity-prefixed PM presence message in target conversation | ACP / AION communications (PM-000) | Message visibly appears in target conversation | Unacknowledged |
| AT-008 | P0 | AION | Confirm BFF message in this conversation | ACP / AION communications (PM-000) | Exact sender text observed by AION | Unacknowledged |
| AT-009 | P0 | AION | Confirm PM message in this conversation | ACP / AION communications (PM-000) | Exact sender text observed by AION | Unacknowledged |
| AT-010 | P0 | AION PM | Record rendezvous acceptance and unresolved delivery gaps | ACP / AION communications (PM-000) | Ledger contains source-linked evidence and remaining gaps | Unacknowledged |
| AT-011 | P0 | AION BFF | Locate OpenCode binary on BFF Linux host | OpenCode / SOFTWARE_HQ (PM-000) | Command path or absent result captured | Unacknowledged |
| AT-012 | P0 | AION BFF | Run OpenCode version command on BFF Linux | OpenCode / SOFTWARE_HQ (PM-000) | Actual version stdout and exit code captured | Unacknowledged |
| AT-013 | P0 | AION BFF | Inspect official OpenCode install instructions if missing | OpenCode / SOFTWARE_HQ (PM-000) | Official installation source and compatibility recorded | Unacknowledged |
| AT-014 | P0 | AION BFF | Install OpenCode on BFF Linux only if absent | OpenCode / SOFTWARE_HQ (PM-000) | Install exit code and binary path captured | Unacknowledged |
| AT-015 | P0 | AION BFF | List configured OpenCode model providers without secrets | OpenCode / SOFTWARE_HQ (PM-000) | Redacted provider inventory captured | Unacknowledged |
| AT-016 | P0 | AION BFF | Identify first working free model in approved routing order | OpenCode / SOFTWARE_HQ (PM-000) | Model ID and availability evidence recorded | Unacknowledged |
| AT-017 | P0 | AION BFF | Run harmless OpenCode free-model completion probe | OpenCode / SOFTWARE_HQ (PM-000) | Prompt, response, model, timestamp and exit status recorded | Unacknowledged |
| AT-018 | P0 | AION BFF | Measure first free-model probe latency | OpenCode / SOFTWARE_HQ (PM-000) | Elapsed time measured and recorded | Unacknowledged |
| AT-019 | P1 | AION BFF | Document any required trusted-host login blocker | OpenCode / SOFTWARE_HQ (PM-000) | Specific provider login blocker recorded without credentials | Unacknowledged |
| AT-020 | P1 | AION PM | Independently validate OpenCode installation and free-model proof | OpenCode / SOFTWARE_HQ (PM-000) | PM marks verified only after inspecting raw evidence | Unacknowledged |
| AT-021 | P1 | AION BFF | Read ACP bridge contract source at pinned commit | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Source path and SHA recorded | Unacknowledged |
| AT-022 | P1 | AION BFF | Read zcode-setup pocket-link adapter documentation | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Existing reusable adapter entry points recorded | Unacknowledged |
| AT-023 | P1 | AION BFF | Read zcode-bots diagnostic MCP draft PR source | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Exact files and commit SHA recorded | Unacknowledged |
| AT-024 | P1 | AION BFF | Read existing 001.PROJECTS.PM issue transport contract | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Contract version and hash recorded | Unacknowledged |
| AT-025 | P1 | AION BFF | Inspect current Linux receipt consumer implementation | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Consumer exists or absent, with source evidence | Unacknowledged |
| AT-026 | P1 | AION BFF | Inspect VOMEGA browser CDP integration candidate | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Reusable files and maturity classified | Unacknowledged |
| AT-027 | P1 | AION BFF | Check existing ZCode/OpenCode integration status | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Observed implementation distinguished from design | Unacknowledged |
| AT-028 | P1 | AION PM | Map five transport options against existing seeds | ACP / UAH / zcode-setup / VOMEGA (PM-000) | One evidence-backed comparison matrix added to ledger | Unacknowledged |
| AT-029 | P1 | AION | Select smallest authorized path for diagnostic roundtrip | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Chosen path and rationale recorded | Unacknowledged |
| AT-030 | P1 | AION PM | Record rejected duplicate gateway proposals | ACP / UAH / zcode-setup / VOMEGA (PM-000) | Ledger contains no-build decision and links to reused seeds | Unacknowledged |
| AT-031 | P0 | OpenCode via BFF | Specify bridge.request.v1 diagnostic allowlist | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Machine-checkable allowlist schema created | Unacknowledged |
| AT-032 | P0 | OpenCode via BFF | Implement authenticated GitHub inbox read | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Read-only fetch passes local fixture test | Unacknowledged |
| AT-033 | P0 | OpenCode via BFF | Implement source principal validation | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Untrusted actor fixture rejected | Unacknowledged |
| AT-034 | P0 | OpenCode via BFF | Implement dispatch label validation | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Missing-label fixture rejected | Unacknowledged |
| AT-035 | P0 | OpenCode via BFF | Implement exact issue body digest check | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Modified-body fixture rejected | Unacknowledged |
| AT-036 | P1 | OpenCode via BFF | Implement durable issue-and-digest deduplication | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Duplicate fixture produces one receipt | Unacknowledged |
| AT-037 | P1 | OpenCode via BFF | Implement correlation ID propagation | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Correlation ID unchanged across fixture stages | Unacknowledged |
| AT-038 | P1 | OpenCode via BFF | Implement UTC timestamped read-only receipt | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Receipt contains required timestamps and source hash | Unacknowledged |
| AT-039 | P1 | OpenCode via BFF | Implement fail-closed unknown request rejection | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Unknown request test denies action | Unacknowledged |
| AT-040 | P1 | AION PM | Independently review consumer tests and negative cases | ACP-038 / GPM PM-17 / PM-014 (PM-014) | Test outputs and code revision independently checked | Unacknowledged |
| AT-041 | P1 | AION BFF | Identify exact Windows ZCode runtime version | ZCode / zcode-bots / UAH (PM-000) | Version and host identity captured without secrets | Unacknowledged |
| AT-042 | P1 | AION BFF | Identify installed ZBot diagnostic capabilities | ZCode / zcode-bots / UAH (PM-000) | Actual command inventory recorded | Unacknowledged |
| AT-043 | P1 | AION BFF | Identify supported ACP admission mechanism | ZCode / zcode-bots / UAH (PM-000) | Documented admission path and restrictions recorded | Unacknowledged |
| AT-044 | P1 | OpenCode via BFF | Wire read-only diagnostic request to existing adapter | ZCode / zcode-bots / UAH (PM-000) | Fixture passes without host mutation | Unacknowledged |
| AT-045 | P1 | OpenCode via BFF | Implement denial for unsupported ACP native tools | ZCode / zcode-bots / UAH (PM-000) | Negative test proves unsupported tool denied | Unacknowledged |
| AT-046 | P1 | OpenCode via BFF | Implement sanitized diagnostic output | ZCode / zcode-bots / UAH (PM-000) | No secrets in test receipt | Unacknowledged |
| AT-047 | P1 | OpenCode via BFF | Implement ZCode timeout handling | ZCode / zcode-bots / UAH (PM-000) | Timeout produces explicit failed receipt | Unacknowledged |
| AT-048 | P1 | OpenCode via BFF | Implement ZCode process failure handling | ZCode / zcode-bots / UAH (PM-000) | Failure exit code preserved in receipt | Unacknowledged |
| AT-049 | P1 | AION BFF | Test diagnostic adapter on isolated Linux fixture | ZCode / zcode-bots / UAH (PM-000) | Reproducible test command and logs captured | Unacknowledged |
| AT-050 | P1 | AION PM | Validate adapter provenance and no privilege expansion | ZCode / zcode-bots / UAH (PM-000) | PM verifies tests and exact source SHA | Unacknowledged |
| AT-051 | P0 | AION BFF | Draft exact harmless Windows diagnostic request for approval | ACP / UAH / ZCode / PM-014 (PM-000) | Scope, expected result and rollback documented | Unacknowledged |
| AT-052 | P0 | AION | Present only the specific Windows diagnostic approval if needed | ACP / UAH / ZCode / PM-014 (PM-000) | Explicit owner decision recorded or gate remains blocked | Unacknowledged |
| AT-053 | P0 | AION BFF | Verify Windows host identity and consumer version after approval | ACP / UAH / ZCode / PM-014 (PM-000) | Actual Windows receipt identifies authorized target | Unacknowledged |
| AT-054 | P1 | AION BFF | Submit one correlated read-only diagnostic after approval | ACP / UAH / ZCode / PM-014 (PM-000) | Request ID, source hash and UTC send time captured | Unacknowledged |
| AT-055 | P1 | AION BFF | Confirm authenticated Windows consumer RECEIVED event | ACP / UAH / ZCode / PM-014 (PM-000) | Host-side receive evidence captured | Unacknowledged |
| AT-056 | P1 | AION BFF | Confirm ACP admission decision for diagnostic | ACP / UAH / ZCode / PM-014 (PM-000) | Distinct admitted or denied receipt captured | Unacknowledged |
| AT-057 | P1 | ZCode via BFF | Execute permitted ZCode diagnostic on real Windows host | ACP / UAH / ZCode / PM-014 (PM-000) | Real host diagnostic output and exit status captured | Unacknowledged |
| AT-058 | P1 | AION BFF | Publish sanitized correlated result for readback | ACP / UAH / ZCode / PM-014 (PM-000) | Receipt retrievable without credentials | Unacknowledged |
| AT-059 | P1 | AION | Independently compare request ID, source digest and result | ACP / UAH / ZCode / PM-014 (PM-000) | Matching chain confirmed across stages | Unacknowledged |
| AT-060 | P1 | AION PM | Mark PM-000 and PM-014 verified only after full proof | ACP / UAH / ZCode / PM-014 (PM-000) | Evidence-backed verified or blocked status committed | Unacknowledged |
| AT-061 | P1 | AION BFF | Measure current Windows free disk space read-only | PC HQ / ACP / ZBot Host (PM-019) | Drive, free bytes and timestamp captured | Unacknowledged |
| AT-062 | P1 | AION PM | Compare current disk reading with stale risk entry | PC HQ / ACP / ZBot Host (PM-019) | R7 updated without assuming old reading is current | Unacknowledged |
| AT-063 | P1 | AION BFF | Check Windows recovery and login readiness read-only | PC HQ / ACP / ZBot Host (PM-019) | Preflight evidence captured without settings changes | Unacknowledged |
| AT-064 | P1 | AION BFF | Check for existing duplicate relay consumers | PC HQ / ACP / ZBot Host (PM-019) | Process and service inventory recorded | Unacknowledged |
| AT-065 | P1 | AION BFF | Check current dispatch freeze enforcement | PC HQ / ACP / ZBot Host (PM-019) | No unauthorized executable issue ingestion observed | Unacknowledged |
| AT-066 | P1 | OpenCode via BFF | Test denial of arbitrary shell request through bridge | PC HQ / ACP / ZBot Host (PM-019) | Shell request denied in fixture | Unacknowledged |
| AT-067 | P1 | OpenCode via BFF | Test denial of mutating desktop request | PC HQ / ACP / ZBot Host (PM-019) | Desktop mutation request denied in fixture | Unacknowledged |
| AT-068 | P1 | OpenCode via BFF | Test forged principal rejection | PC HQ / ACP / ZBot Host (PM-019) | Forged identity denied in fixture | Unacknowledged |
| AT-069 | P1 | AION PM | Review credential leakage in test artifacts | PC HQ / ACP / ZBot Host (PM-019) | No plaintext secrets in published evidence | Unacknowledged |
| AT-070 | P1 | AION | Review privilege expansion gates before any broad execution | PC HQ / ACP / ZBot Host (PM-019) | Explicit go/no-go and supporting proof recorded | Unacknowledged |
| AT-071 | P2 | AION PM | Keep ledger.json as sole machine-authoritative AION task register | AION PM / GPM Cognitive OS / IAM (PM-035) | Authoritative path documented | Unacknowledged |
| AT-072 | P2 | AION PM | Generate LEDGER.md view from ledger.json | AION PM / GPM Cognitive OS / IAM (PM-035) | Generated view matches machine task counts | Unacknowledged |
| AT-073 | P2 | AION PM | Assign exactly one accountable owner per atomic task | AION PM / GPM Cognitive OS / IAM (PM-035) | 100 of 100 owner fields populated | Unacknowledged |
| AT-074 | P2 | AION PM | Attach a planned-project seed to every atomic task | AION PM / GPM Cognitive OS / IAM (PM-035) | 100 of 100 seed fields populated | Unacknowledged |
| AT-075 | P2 | AION PM | Attach objective acceptance criteria to every atomic task | AION PM / GPM Cognitive OS / IAM (PM-035) | 100 of 100 acceptance fields populated | Unacknowledged |
| AT-076 | P2 | AION PM | Link each atomic task to existing PM work item | AION PM / GPM Cognitive OS / IAM (PM-035) | 100 of 100 cross-references populated | Unacknowledged |
| AT-077 | P2 | AION PM | Define blocked versus unacknowledged versus verified status | AION PM / GPM Cognitive OS / IAM (PM-035) | Status vocabulary and transition rules documented | Unacknowledged |
| AT-078 | P2 | AION PM | Prevent verification without independent evidence | AION PM / GPM Cognitive OS / IAM (PM-035) | Negative status transition test passes | Unacknowledged |
| AT-079 | P2 | AION PM | Record every verified artifact with immutable commit or receipt | AION PM / GPM Cognitive OS / IAM (PM-035) | Evidence references are retrievable | Unacknowledged |
| AT-080 | P2 | AION PM | Maintain append-only change history of task state changes | AION PM / GPM Cognitive OS / IAM (PM-035) | Task state transitions carry actor and UTC timestamp | Unacknowledged |
| AT-081 | P2 | AION PM | Map bridge transport artifacts to existing ACP work items | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Cross-project seed references recorded | Unacknowledged |
| AT-082 | P2 | AION PM | Map ZCode adapter artifacts to UAH integration graph | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | UAH integration edges proposed with provenance | Unacknowledged |
| AT-083 | P2 | AION PM | Map browser rendezvous to VOMEGA CDP candidate | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Reuse decision documented against source | Unacknowledged |
| AT-084 | P2 | AION PM | Map receipt events to GPM flight-recorder schema | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Event mapping recorded without second recorder | Unacknowledged |
| AT-085 | P2 | AION PM | Map correlation IDs to IAM provenance identifiers | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Identifier mapping and collision handling documented | Unacknowledged |
| AT-086 | P2 | AION BFF | Extract reusable receipt validator as a bounded component | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Single validator module passes tests | Unacknowledged |
| AT-087 | P2 | AION BFF | Extract reusable diagnostic fixture from bridge tests | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Fixture reused in at least two tests | Unacknowledged |
| AT-088 | P2 | AION PM | Check new code against existing repo before proposing new repo | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | No unnecessary repository creation approved | Unacknowledged |
| AT-089 | P2 | AION | Select next capability multiplier using proven dependency reduction | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | Decision names measurable reuse benefit | Unacknowledged |
| AT-090 | P2 | AION PM | Record component ownership and canonical source paths | IANG / IAM / VOMEGA / GPM Cognitive OS (PM-009) | No duplicate authoritative component declared | Unacknowledged |
| AT-091 | P2 | AION PM | Publish one-page live critical-path view from ledger | AION / ACP / GPM Cognitive OS (PM-000) | View shows P0 tasks, owners, blockers and evidence | Unacknowledged |
| AT-092 | P2 | AION BFF | Record OpenCode first-success receipt in canonical evidence store | AION / ACP / GPM Cognitive OS (PM-000) | Raw test output and source version persisted | Unacknowledged |
| AT-093 | P2 | AION PM | Independently validate OpenCode free-model receipt | AION / ACP / GPM Cognitive OS (PM-000) | Evidence checked, status advanced or blocked | Unacknowledged |
| AT-094 | P2 | AION BFF | Record bridge consumer first-success fixture receipt | AION / ACP / GPM Cognitive OS (PM-000) | Correlation and digest persisted | Unacknowledged |
| AT-095 | P2 | AION PM | Independently validate bridge consumer receipt | AION / ACP / GPM Cognitive OS (PM-000) | Source hash and negative tests checked | Unacknowledged |
| AT-096 | P2 | AION BFF | Record real Windows diagnostic receipt when authorized | AION / ACP / GPM Cognitive OS (PM-000) | Real host proof persisted, not simulated | Unacknowledged |
| AT-097 | P2 | AION PM | Independently validate real Windows receipt | AION / ACP / GPM Cognitive OS (PM-000) | All stage transitions and target identity checked | Unacknowledged |
| AT-098 | P2 | AION | Issue final PM-000 acceptance decision | AION / ACP / GPM Cognitive OS (PM-000) | Acceptance linked to real end-to-end evidence | Unacknowledged |
| AT-099 | P2 | AION BFF | Deliver concise exception-only report to Owen | AION / ACP / GPM Cognitive OS (PM-000) | Only verified outcomes and owner-only blockers included | Unacknowledged |
| AT-100 | P2 | AION PM | Select next ten ready tasks from dependency graph | AION / ACP / GPM Cognitive OS (PM-000) | Ready queue grounded in completed evidence | Unacknowledged |

**Running-list rule:** append AT-101 onward as new tasks arise; update `ledger.json` first, regenerate this view, and record actual receipts separately. No unverifiable green statuses. No GitHub issue text authorizes Windows execution.

## Tasks register (T-001..T-100, generated from ledger.json `tasks`)
All start status todo; evidence none unless a repo file is cited.

|ID|Title|Owner|Pri|Status|Parent|Seed|Deps|Acceptance|Evidence|
|-|-|-|-|-|-|-|-|-|-|
|T-001|Verify OpenCode installation on Owen's PC|AION BFF|P0|todo|PM-029|ZCode/OpenCode||`opencode --version` output captured from PC with timestamp; binary path exists|none|
|T-002|Free-model availability check (OpenCode free > Space Bunny > Muse Spark 1.3 > DeepSeek Flash 4.1 > MiMo 2.6)|AION BFF|P0|todo|PM-029|ZCode/OpenCode|T-001|each of 5 models has a recorded probe result in pm/evidence/|none|
|T-003|BFF connectivity to the AION ChatGPT thread|AION BFF|P0|todo|PM-000|GPM Cognitive OS||BFF quotes the latest AION message verbatim with timestamp, PM confirms match|none|
|T-004|Discover existing bridges (ACP, VOMEGA, zcode-setup, uah_implementation_kit MCP-INGRESS)|AION BFF|P0|todo|PM-007|ACP/UAH||each of 4 bridges has path+SHA or explicit NOT FOUND|none|
|T-005|Select authorized transport for AION->PC|AION PM|P0|todo|PM-000|ACP/UAH|T-004|DECISIONS.md entry exists with AION acceptance and Owen approval quoted|none|
|T-006|ZCode adapter on chosen transport|AION BFF|P0|todo|PM-007|ZCode/OpenCode|T-005|zcode-driver.test.mjs passes against mock-hub and one real PC ZCode session|workspace/aion/bff/zcode/zcode-driver.mjs (scaffold only; not live)|
|T-007|Execute diagnostic-only command via adapter|AION BFF|P0|todo|PM-014|ACP/UAH|T-006|AION-originated diagnostic returns PC hostname DESKTOP-9KB03LU and free-disk value|none|
|T-008|Generate execution receipt|AION BFF|P0|todo|PM-014|ACP/UAH|T-007|receipt file exists, schema-valid, hash matches stdout|none|
|T-009|Independent verification of receipt|AION PM|P0|todo|PM-014|GPM Cognitive OS|T-008|PM re-derives hash/hostname independently from a second channel; mismatch = fail|none|
|T-010|Live team communication path in ChatGPT web app|AION BFF|P0|todo|PM-000|GPM Cognitive OS|T-003,T-009|AION posts a message, BFF+PM reply in-thread within 10 min, no side room used|none|
|T-011|Measure current PC free disk|Owen|P0|todo|PM-015|GPM Cognitive OS||screenshot/command output of C: free space dated today|none|
|T-012|Disk cleanup: remove Windows.old (T-09, ~11 GB)|Owen|P0|todo|PM-021|GPM Cognitive OS|T-011|free space increases >=10 GB vs T-011 reading|none|
|T-013|opencode.db surgery plan (T-06, 16.85 GB)|AION PM|P1|todo|PM-021|ZCode/OpenCode|T-011|runbook reviewed by Owen; backup step precedes any delete|none|
|T-014|Execute opencode.db surgery|Owen|P1|todo|PM-021|ZCode/OpenCode|T-013,T-001|OpenCode starts and lists history after; size reduced|none|
|T-015|Storage quick wins T-01..T-04,T-12|AION BFF|P1|todo|PM-020|GPM Cognitive OS|T-011|~10 GB freed, logged per step|none|
|T-016|Storage tooling/policy triage T-07..T-21|AION PM|P2|todo|PM-022|GPM Cognitive OS||each item tagged with owner+decision|none|
|T-017|PC-001 machine preflight/containment check|AION BFF|P0|todo|PM-019|GPM Cognitive OS|T-001|report lists OS, disk, Tailscale, ZCode/OpenCode versions|none|
|T-018|Restart ZCode|Owen|P0|todo|PM-023|ZCode/OpenCode||ZCode UI shows running after restart, Owen confirms|none|
|T-019|ccr-router + one live prompt acceptance (W01)|AION BFF|P1|todo|PM-023|ZCode/OpenCode|T-018|one prompt answered via ccr-router, logged|none|
|T-020|Prove W01 CCR routing|AION PM|P1|todo|PM-008|ZCode/OpenCode|T-019|repo receipt for W01 run|none|
|T-021|Prove W02 workload|AION PM|P2|todo|PM-008|GPM Cognitive OS||repo receipt for W02 run|none|
|T-022|Prove W03 ChatGPT->local execution unattended|AION PM|P0|todo|PM-008|ACP/UAH|T-009|unattended receipt equals T-009 verified|none|
|T-023|ACP Bridge: reconcile spec vs acp-core.mjs|ZCode|P0|todo|PM-007|ACP/UAH|T-004|every ACP Bridge requirement mapped to code or gap|none|
|T-024|ACP Bridge minimal implementation|ZCode|P1|todo|PM-007|ACP/UAH|T-023,T-006|tests pass; T-007 runs through it|none|
|T-025|ACP-038 bridge.request.v1 intake watcher (Bun)|ZCode|P0|todo|PM-033|ACP/UAH|T-005|watcher picks up a test request and emits receipt|none|
|T-026|Resolve D4 dispatch freeze for #16,#17,#18,#20|AION PM|P1|todo|PM-014|ACP/UAH|T-009|each issue marked unfrozen/closed with receipt|none|
|T-027|VOMEGA gh-bridge retirement status check|AION PM|P1|todo|PM-000|VOMEGA||status with commit SHA, not UNKNOWN|none|
|T-028|ACP P0 backlog triage (ACP-001..030 P0 set)|AION PM|P1|todo|PM-032|ACP/UAH||13 items each with owner+status|none|
|T-029|ACP P1-P3 backlog triage (24 items)|AION PM|P3|todo|PM-034|ACP/UAH|T-028|24 items tagged|none|
|T-030|Recover iam_core_v0_1.sqlite3 (missing)|Owen|P0|todo|PM-004|IANG/IAM||file present, integrity_check ok, 33 tables|none|
|T-031|Recover IAM schema.sql + build.py|Owen|P0|todo|PM-004|IANG/IAM||files present; build.py rebuilds a db|none|
|T-032|Recover uah_integration_dispersion_v0_1.sqlite3 (missing)|Owen|P0|todo|PM-005|ACP/UAH||file present, integrity ok|none|
|T-033|Recover UAH project.yaml + regen script|Owen|P1|todo|PM-005|ACP/UAH||files present|none|
|T-034|Inspect recovered uah_integration_project_v0_3.sqlite3|AION PM|P1|todo|PM-005|ACP/UAH||integrity_check ok; table list in evidence|none|
|T-035|Inspect oracle_alignment_v0_1.zip|AION PM|P2|todo|PM-028|GPM Cognitive OS||file list+hashes in evidence|none|
|T-036|Inspect oracle_reconciliation_program_v0_3.zip|AION PM|P2|todo|PM-028|GPM Cognitive OS||file list+hashes in evidence|none|
|T-037|Locate the 3/5 recovered text files (not in recovered-incoming/)|AION PM|P1|todo|PM-004|IANG/IAM||3 files located with paths or declared missing|none|
|T-038|Reconcile UAH 8/IANG 23/IAM 33 schemas|ZCode|P1|todo|PM-009|IANG/IAM|T-030,T-032,T-034|every table mapped/dropped with reason|none|
|T-039|Build unified IAM DB|ZCode|P2|todo|PM-009|IANG/IAM|T-038,T-031|builder reproducible; integrity+FK pass|none|
|T-040|AION accepts unified IAM DB|AION|P2|todo|PM-009|IANG/IAM|T-039|AION acceptance quoted in thread|none|
|T-041|Populate 100-variable catalog|ZCode|P2|todo|PM-010|IANG/IAM|T-039|100 variables queryable|none|
|T-042|Populate 192-repo census|OpenCode|P2|todo|PM-010|IANG/IAM|T-039|192 repos with SHA|none|
|T-043|Load 1,000 work records|OpenCode|P3|todo|PM-010|IANG/IAM|T-039,T-086|1000 rows; counts match source|none|
|T-044|W01 wave: enumerate all 19 UAH files|OpenCode|P1|todo|PM-011|ACP/UAH||19 files with path+SHA|none|
|T-045|Index remaining integration files (123 of 146)|OpenCode|P2|todo|PM-011|ACP/UAH|T-044|146/146 indexed|none|
|T-046|IANG-D01 mapping & alignment work package definition|AION PM|P2|todo|PM-001|IANG/IAM||scope+acceptance agreed by AION|none|
|T-047|IANG-D01 execution|ZCode|P2|todo|PM-001|IANG/IAM|T-046|map reviewed by PM|none|
|T-048|Verify IAM v0.1 baseline handoff doc (85476c3)|AION PM|P3|todo|PM-002|IANG/IAM||file read at SHA|none|
|T-049|Re-verify IAM v0.1 sandbox claims (33 tables, 27 nodes)|AION PM|P1|todo|PM-003|IANG/IAM|T-030|counts match claim or claim downgraded|none|
|T-050|UAH CLI entry point spec|AION PM|P1|todo|PM-006|ACP/UAH|T-054|spec lists commands mapped to existing modules|none|
|T-051|UAH CLI entry point build|ZCode|P1|todo|PM-006|ACP/UAH|T-050|`uah --help` and one command work on PC|none|
|T-052|Observe actual UAH CLI runtime behaviour (unknown)|OpenCode|P2|todo|PM-006|ACP/UAH|T-051|log of run, closes unknown|none|
|T-053|Owen decision D-a CCR naming|Owen|P1|todo|PM-024|ZCode/OpenCode||recorded in DECISIONS.md|none|
|T-054|Owen decisions D-b new-provider-3, D-c kit apply|Owen|P1|todo|PM-024|ZCode/OpenCode||recorded in DECISIONS.md|none|
|T-055|CCR per-provider emission (P2)|ZCode|P2|todo|PM-025|ZCode/OpenCode|T-053,T-054|each provider emitted & routable|none|
|T-056|ZCode provider list cleanup to CCR only|ZCode|P3|todo|PM-025|ZCode/OpenCode|T-055|only CCR providers listed; ZCode starts|none|
|T-057|Migrate GPM owner-exec channeler into SOFTWARE_HQ|ZCode|P3|todo|PM-026|GPM Cognitive OS||tests pass in new home|none|
|T-058|SOFTWARE_HQ safe-sync failure provenance|Owen|P3|todo|PM-027|GPM Cognitive OS||failure shown pre-existing|none|
|T-059|Oracle AQ-004 CCR-ZCode gates|ZCode|P2|todo|PM-028|ZCode/OpenCode|T-035|gates pass/fail recorded|none|
|T-060|Oracle AQ-005 engine reuse / AQ-006 ZCode-OpenCode|ZCode|P2|todo|PM-028|ZCode/OpenCode|T-035|both items closed with evidence|none|
|T-061|zcode-opencode v1.0.0 live acceptance|AION BFF|P1|todo|PM-029|ZCode/OpenCode|T-001,T-018|ZCode hands task to OpenCode, result returned|none|
|T-062|Fan-out test: PM hands spec to OpenCode|AION PM|P1|todo|PM-029|ZCode/OpenCode|T-002,T-061|OpenCode completes trivial spec with free model|none|
|T-063|ChatGPT conversation export (P0-001)|Owen|P1|todo|PM-030|GPM Cognitive OS||export zip downloaded, hash recorded|none|
|T-064|Index ChatGPT export for original prompts|OpenCode|P2|todo|PM-030|GPM Cognitive OS|T-063|AION confirms key prompts found|none|
|T-065|Search export for missing IAM/UAH artifacts|OpenCode|P1|todo|PM-004|IANG/IAM|T-063|hits for each missing file or none|none|
|T-066|CEO milestones M2-M6 plan|AION PM|P3|todo|PM-031|GPM Cognitive OS||each milestone has owner+gate|none|
|T-067|AION self-reflection gaps G0-G7 closure plan|AION|P2|todo|PM-012|GPM Cognitive OS||each gap has task id|none|
|T-068|Twin CLI T0: env + VOMEGA hashes|AION BFF|P1|todo|PM-016|VOMEGA||env + hashes recorded|none|
|T-069|Twin CLI T1: live Chrome attach|AION BFF|P1|todo|PM-017|vivim-omega|T-068|CDP attaches to Chrome|none|
|T-070|Twin CLI T2: redacted capture|AION BFF|P1|todo|PM-017|vivim-omega|T-069|capture w/o secrets, AION verifies|none|
|T-071|Twin CLI T3: ChatGPT read twin|AION BFF|P1|todo|PM-017|vivim-omega|T-070|twin reads thread equal to UI|none|
|T-072|Twin CLI T4: streaming|AION BFF|P2|todo|PM-018|vivim-omega|T-071|stream captured live|none|
|T-073|Twin CLI T5: reversible edit|AION BFF|P2|todo|PM-018|vivim-omega|T-072|edit + undo works|none|
|T-074|Twin CLI T6-T8: PM handoff, multi-app, resilience|AION BFF|P2|todo|PM-018|vivim-omega|T-073|AION accepts T8|none|
|T-075|Credential hygiene: inventory plaintext keys in ZCode configs|AION BFF|P1|todo|PM-039|ZCode/OpenCode||file list only, no secrets in repo|none|
|T-076|Credential rotation/move decision|Owen|P1|todo|PM-039|ZCode/OpenCode|T-075|DECISIONS.md entry|none|
|T-077|ZBot Host: govern native ACP tools by approval layer|ZCode|P1|todo|PM-041|ACP/UAH||ungated tool call rejected in test|none|
|T-078|zcode-setup bot schedules (brief 045)|ZCode|P2|todo|PM-038|ZCode/OpenCode||schedule fires once, logged|none|
|T-079|zcode-setup OAuth providers (025) + currency defects|Owen|P2|todo|PM-038|ZCode/OpenCode||providers authed|none|
|T-080|zcode-bots draft PR #1 status reconcile|AION PM|P3|todo|PM-038|ZCode/OpenCode||PR status w/ SHA|none|
|T-081|AION recorder (G2) status verify|AION PM|P2|todo|PM-042|GPM Cognitive OS||recorder output file exists and is recent|none|
|T-082|PWA phone reach: Tailnet approvals|Owen|P2|todo|PM-042|GPM Cognitive OS||phone 100.110.245.9 online on tailnet|none|
|T-083|zcode-pocket transport hookup|AION BFF|P2|todo|PM-042|ZCode/OpenCode|T-082,T-009|phone sends diagnostic, receipt returned|none|
|T-084|GPM programs PM-06..PM-20 triage|AION PM|P3|todo|PM-035|GPM Cognitive OS||each program owner/state|none|
|T-085|GPM board items receipt check|AION PM|P2|todo|PM-036|GPM Cognitive OS||each board item has receipt or UNKNOWN|none|
|T-086|atomic-1000 triage into verified/claimed|AION PM|P3|todo|PM-040|GPM Cognitive OS||100 parents tagged|none|
|T-087|Product Hub W1-W4 acceptance|AION PM|P2|todo|PM-037|GPM Cognitive OS||each issue has receipt|none|
|T-088|Product Hub S0 storage audit (0/94)|OpenCode|P2|todo|PM-037|GPM Cognitive OS||94/94 checked|none|
|T-089|Re-read sources[] at pinned commits|AION PM|P2|todo|PM-000|GPM Cognitive OS||each source re-read, tag updated|none|
|T-090|Close ledger unknowns (8)|AION PM|P2|todo|PM-000|GPM Cognitive OS||each unknown resolved or owner assigned|none|
|T-091|Dashboard: show tasks register|AION PM|P2|todo|PM-000|GPM Cognitive OS||100 tasks rendered as rings by owner|none|
|T-092|Evidence capture: AION capabilities report reconcile|AION PM|P2|todo|PM-012|GPM Cognitive OS||claims mapped to tasks|none|
|T-093|Inbox/outbox protocol for task assignment|AION PM|P2|todo|PM-000|GPM Cognitive OS||one task assigned+returned via outbox|none|
|T-094|Heartbeat/autopush health check|AION BFF|P2|todo|PM-000|GPM Cognitive OS||last push <5 min old|none|
|T-095|Daily verification sweep of todo->done claims|AION PM|P1|todo|PM-000|GPM Cognitive OS||no task done without evidence link|none|
|T-096|Owen approval gate list for privileged Windows steps|AION PM|P1|todo|PM-000|GPM Cognitive OS||Owen confirms list|none|
|T-097|Seed audit: confirm every task has existing seed|AION PM|P1|todo|PM-000|GPM Cognitive OS||0 tasks without seed|none|
|T-098|AION weekly acceptance review of P0 tasks|AION|P1|todo|PM-000|GPM Cognitive OS||AION signs off P0 statuses in thread|none|
|T-099|Owen: free disk for OpenCode/ZCode working dirs if T-011 < 20 GB|Owen|P1|todo|PM-015|GPM Cognitive OS|T-012|>=20 GB free recorded|none|
|T-100|Receipt schema registration in ACP contracts|ZCode|P1|todo|PM-033|ACP/UAH|T-008|schema validates T-008 receipt|none|
