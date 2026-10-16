# AION PM Ledger v0.1
Generated 2026-10-16 02:45 CEST. Mirror of ledger.json (that file wins). Tags: **verified** = confirmed in repo bytes; **claimed** = not confirmed. Unknowns marked explicitly.

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
|ID|Title|Initiative|Owner|Status|Tag|Evidence|
|-|-|-|-|-|-|-|
|PM-000|P0 #1 GOAL: chatgpt.com text -> ZCode executes on Owen's PC (Grok Bot-style reach)|AION-PC|ZCode|not live; plan only (bff/ZCODE-PATH.md). Blocked by: ACP Bridge missing; No authenticated receipt consumer (D4); Tailscale/HTTPS approvals pending (reported by BFF, not observed); Owen Windows approval needed; PC disk ~6.3 GB free (R7); No real P1 ZCode session yet; Security model for AION shell/desktop on PC undefined. Linked: enabler/blocker: PM-007 ACP Bridge (missing); enabler: owenservera/zcode-setup (hub, pocket-link); enabler: VOMEGA gh-bridge retirement (status UNKNOWN, not checked); enabler: PM-013 CDP twin CLI (browser layer); PM-014 receipt consumer; aion#3 AION-03|claimed|bff/ZCODE-PATH.md; https://github.com/owenservera/aion/issues/3|
|PM-001|IANG-D01 Integration Mapping & Alignment work package|IANG|ZCode|defined, not started|claimed|threads/pm-thread-1.md|
|PM-002|IAM v0.1 baseline handoff doc (commit 85476c3)|IAM|ZCode|done|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/IAM_CORE_V0_1.md|
|PM-003|IAM v0.1 SQLite: 33 tables, 27 seed nodes, 5 queue entries, integrity/FK pass|IAM|ZCode|exists only in ChatGPT sandbox|claimed|threads/pm-thread-1.md; IAM_CORE_V0_1.md says not uploaded|
|PM-004|P0 RECOVER iam_core_v0_1.sqlite3 + schema.sql + build.py|IAM|ZCode (BFF per D1)|UNRECOVERED_FROM_CHECKED_SOURCES|verified (absence in SOFTWARE_HQ tree)|canon/EXECUTIVE-DECISIONS-2026-10-16-COS.md D1|
|PM-005|P0 RECOVER UAH dispersion sqlite v0.1/v0.2 + generated project.yaml + regen script|UAH|ZCode|unrecovered; ChatGPT sandbox only|claimed|threads/pm-thread-2.md (note: SOFTWARE_HQ/integrations/project.yaml exists but is a different inventory YAML per D1)|
|PM-006|UAH CLI entry point (P1 roadmap)|UAH|ZCode|missing; only safety/gate/fsx.mjs + DESIGN.md|verified|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/uah/cli|
|PM-007|ACP Bridge|UAH|ZCode|missing / blocks UAH P4|claimed|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/uah/MAP.md (file exists; content not re-read)|
|PM-008|Prove W01-W03|IANG|ZCode|unproven|verified|workload-registry.json|
|PM-009|Reconcile UAH 8 / IANG 23 / IAM 33 table schemas into one IAM DB|IAM|ZCode; AION accepts|blocked on PM-004/005|verified (decision exists)|https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/CANONICAL-MODEL-DECISION-2026-10-16.md|
|PM-010|Populate 100-variable catalog, 192-repo census, 1,000 work records into model|IAM|ZCode|referenced, not populated|claimed|threads/pm-thread-1.md|
|PM-011|W01 wave: enumerate all 19 UAH files (23 of 146 integration files indexed so far)|UAH|ZCode|pending|claimed|threads/pm-thread-2.md|
|PM-012|AION full self-reflection (Owen ask)|AION-META|AION|new; scope unknown|claimed|parent steering 2026-10-16|
|PM-013|Web-app twin CLI via CDP (ChatGPT first): auto-discovery, self-healing, streaming parsing|AION-META|ZCode|new; reuse candidates found in vivim-omega|verified (candidates exist)|owenservera/vivim-omega: docs/decisions/D-419-cdp-substrate-lane.md, plugins/provider-browser (CDP leg = future/fixtures only), docs/DISCOVERY.md, docs/HEALING.md, D-339/D-352 streaming, contracts/src/parser.ts, fixtures/import/chatgpt-conversations.json|
|PM-014|D4 dispatch freeze; receipt consumer for 001.PROJECTS.PM #16,#17,#18,#20|UAH|ZCode (BFF)|open|claimed|canon D4|
|PM-015|D5 PC storage P0 (6.3 GB free reported 10-14)|ops|BFF|open; current reading unknown|claimed|hq#7 via canon D5|

## Unknowns
- UNKNOWN: Actual UAH CLI runtime behaviour
- UNKNOWN: Whether ChatGPT sandbox files are still downloadable
- UNKNOWN: ZCode version
- UNKNOWN: Current PC free disk
- UNKNOWN: Scope of 'AION self-reflection'

## Inbox
- Pinned: https://github.com/owenservera/aion/issues/4 · Test: #5 (closed)
