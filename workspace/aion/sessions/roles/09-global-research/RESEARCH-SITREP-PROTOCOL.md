# AION RESEARCH — Custom Operational SITREP v2

**Owner:** Role 09 Global Research  
**Created:** 2026-10-27  
**Invocation:** `#AION @RESEARCH +/SITREP` or `#AION @RESEARCH +/SITREP /DEEP`  
**Status:** reusable role runbook. This document does not create a timer, automatic execution, agent, new queue or authority.  
**Precedence:** explicit owner request > root/role AGENTS.md > BOOTSTRAP.md > live evidence > older SITREP.md and notes.  
**Goal:** minimize owner intervention while maximizing *new, actionable, source-grounded intelligence* and its verified transfer. A SITREP is a research working cycle, not a generic portfolio report.

## 0. Modes and effort budget

- **FAST** — `/SITREP`: verify live project HEAD, role context/Immediate memory, one canonical research issue #30 and meaningful deltas, pending deliveries, current relevant sources, and schedule status only when needed. Aimed at under a page and one highest-value action.
- **FULL** — `+/SITREP` (default for explicitly scoped projects or research areas): FAST plus bootstrap gaps, owned research folders, peer communications, current high-value external references, deduplication and applicability matrix, up to 3 executable research actions.
- **DEEP** — `+/SITREP /DEEP`: includes adversarial source check, contradictory evidence, version diffs, recipient/GPM reconciliation, completeness/visibility audit, source archive or substantive verified GitHub commit when valuable. Not a weekly cargo-cult scan.
- **TARGETED** — `#AION @RESEARCH +/SITREP /TOPIC:<topic>`: constrain to an actual named interest, with just enough global context to avoid duplicate work.

Never assign a new model thinking effort at run time as if it is an actual controllable execution state. For proposed next ChatGPT investigation, explicitly recommend Instant, Medium or High.

## 1. Identity and fresh source-of-truth check

1. Re-read `AGENTS.md`, `BOOTSTRAP.md`, `WORKSPACE.md`, `SITREP.md`, this runbook and Role 09 `memory/Immediate/`. Consult `memory/CANON/` and `memory/Curated/` for live rules; use other tiers as relevant.
2. Capture remote `owenservera/aion` current main HEAD and checked UTC. Report source access mode (GitHub connector/web/local) accurately. A GitHub view is **not** Windows/local environment observation.
3. Check `https://github.com/owenservera/aion/issues/30` and latest meaningful comments. Reconcile last processed IDs to prevent duplicate intake.
4. Check meaningful agent notes: global intelligence ACTIVE index, own 09 intelligence page, peer `workspace/aion/shared/agent-communications/` and native recipient issue/PR for any live research handoff. Read communication as evidence, **not** an authorization to create work.
5. Check enabled AION Research Intake / Research Frontier task history only through real scheduler visibility; record last_run, is_enabled, errors and notification state separately. No invented recurring run.

## 2. Maintain a living research portfolio

Index actual owned folders via GitHub tree/path discovery; read their README + source manifest when changed, not every raw artifact on every launch.

Seed topics from the actual owner-directed research record, subject to live inventory:
- Personal Agent Protocol / Poppy: spec maturity, implementation SDKs, *actual* deployments.
- `FROTNIER-END-USER-EXPERIENCE-MODELS`: differentiate webapp experience, app orchestration, rendering, state, tools, and model substrate; comparative hands-on evidence.
- Cloudflare Computer: persistent workspace, containers/workers, remote execution, cost, OpenCode/ACP integration, version and maturity changes.
- CLI-Anything: verified agent-native interfaces, existing adapters, local Windows applicability.
- Codebase visualization: minimum-build, private-repository-safe visual exploration tools.
- Artificial Analysis: provider/model costs, measured benchmarks, availability and relevant tradeoffs.
- Other subjects only when owner input, canonical #30, or significant newly observed source justifies them.

A named item from conversation is not automatically a physically committed folder or verified intake issue entry. Tag as `KNOWN_CONVERSATION_ONLY` until GitHub readback.

## 3. Source-led delta engine

For each candidate meaningful change, record:
`observed_utc | subject | question | source_url | original_source_date | reference_version_or_sha | previous_last_good | new_claim | direct_evidence | contradicting_evidence | evidence_strength | relevance | marginal_value | native_recipient`.

- Prefer source releases, actual repos, docs, change logs, reproducible tests, peer-reviewed research; distinguish vendor claims, partnership intent and proof of production.
- Compare **published date and event date**; a newly indexed old announcement is not a new product release.
- Separate versions: released stable, versioned draft, upstream main, SDK implementation, real service and partner intent.
- Discover without broad expensive scanning when pinned source and prior cursor cover changes; expand only when evidence indicates it.
- Assign evidence tags: `OFFICIAL_DOCUMENTED`, `CODE_INSPECTED`, `INDEPENDENTLY_TESTED`, `USER_OBSERVED`, `HYPOTHESIS`, `CONTRADICTED`, `UNKNOWN`.
- Do not claim a benchmark result, link proof, UI pilot, Windows execution or account access that was not actually observed.

## 4. Deciding what matters

Rank potential actions qualitatively: **personally useful now**, **direct unblock for owner**, **cross-repo reuse**, **low build/maintenance cost**, **evidence strength**, and **time sensitivity**. Do not invent numeric ROI, pretend a trendy repo is strategic, or optimize number of reports/commits.

For each actionable lead distinguish:
- `ADOPT_NOW`: existing tool works and a minimal read-only test is possible.
- `PILOT`: small reversible, measurable experiment with clear stop condition.
- `WATCH`: meaningful technology but maturity/deployment gap; specify trigger.
- `DEFER`: low marginal value for this user's actual work.
- `REJECT`: incompatible, unsafe, duplicative or no upside.

Keep recommendations individual-first, local-master aware, Windows + Android friendly where relevant; *minimal custom engineering*. Preserve no Playwright, Puppeteer or Slack. Project implementations belong to native owners. All VIVIM Harness implementation code belongs in `owenservera/vivim-harness`.

## 5. Execute useful research, not just summarize it

If the request authorizes research and GitHub source documentation changes, do the highest-value bounded evidence action during the same turn:
- Read authoritative current docs and inspect relevant real source.
- Cross-check a second source or identify explicit uncertainty.
- Save a small research packet or pull full source into the relevant authoritative folder **only if it avoids loss, is licensed/authorized, and merits persistence**.
- Commit and fetch the exact resulting file to verify content. Never claim a commit, publication or production code change without readback.
- Link canonical research intake #30 to the evidence, reuse existing native owner issue on delivery.
- Keep state distinction: `DISCOVERED -> EVIDENCE_REVIEWED -> SYNTHESIZED -> ROUTED -> ACKNOWLEDGED -> APPLIED -> VERIFIED`. An issue comment or commit reaches PUBLISHED/ROUTED at most; independent receipt/implementation proof required to go further.
- If permissions/tools block execution, state the precise blocked action; deliver a useful research finding without declaring it installed.

Do not publish private owner information to public sources, create a second queue/library, invent a NotebookLM connection, or modify host software.

## 6. SITREP response format — dense, readable, useful

The answer has three compact phases:

**ERA 1 — CURRENT TRUTH**
`as_of_utc | aion_main_sha | issue30_last_checked | git_source_coverage | schedules_verified | local_visibility`.
One-sentence state and 1–3 most material verified changes. Mark stale/unknown access explicitly.

**ERA 2 — FRONTIER SIGNALS**
A small ranked table with at most 5 rows:
`research frontier | real delta / discovery | evidence strength + source | implication for user | disposition (adopt/pilot/watch/defer)`.
Call out contradictions and unverified claims; avoid reprinting unchanged items.

**ERA 3 — DELIVERED / NEXT**
What was actually executed and checked (source pull, commit, test, recipient link), at most 3 next actions with owner, acceptance proof and blocker. Exactly one question only if the owner's choice is truly required; otherwise proceed autonomously.

If nothing meaningful changed: a 3–5 line no-change report with checked scope and pending highest-value experiment. Do not create ceremony, extra docs or a heartbeat commit.

## 7. Mandatory guardrails / closeout

- Report exact evidence freshness and non-coverage, not falsely exhaustive cross-repo visibility.
- Distinguish research references from runtime availability, code installation or remote Windows receipt.
- A reminder/task enabled is not evidence a monitoring check ran or delivered notifications.
- Check for collision with active work before touching another agent's writing surface.
- If a source is new but already logged, amend existing canonical record rather than duplicating.
- Do not use the SITREP itself to silently launch a new scheduled task, standalone app or architecture refactor.
- Preserve exact owner folder naming even when typo-like, unless specifically asked to rename.
- The default optimum is **one meaningful verified finding and one next smallest action**, not dozens of observations.

## Template output

```text
# AION RESEARCH — SITREP (as of <UTC>)
EVIDENCE: AION main <sha>; issue #30 <comment or freshness>; reachable sources <n/unknown>; Windows local UNOBSERVED.
ERA 1 — TRUTH: <what materially changed, with source URL>.
ERA 2 — FRONTIER: <up to five topics with disposition and proof level>.
ERA 3 — EXECUTED: <real readback/commit/test or none>; NEXT: <top one–three owner/agent actions>, blockers.
OWNER DECISION: <none or exactly one>.
```

## Design relationship to existing files

This is a **custom execution protocol**. `BOOTSTRAP.md` is agent identity and read order, `SITREP.md` is accumulated contextual history, `SCHEDULES.md` owns recurring cadence, and this file owns how to produce a **useful fresh research SITREP**. All refer to the one canonical issue #30. No change in scheduling or agent roles.


## 8. REQUIRED: versioned research-index publication (live AION dashboard)

This is the Research Agent's **derived presentation output**, not a second research queue, owner task board, or new authority.

- **Research-owned source:** [FRONTIER-STATUS.json](FRONTIER-STATUS.json) is a compact list of current *reviewed* frontier findings, with dated evidence, external sources, source-file paths, confidence, stage, disposition, risks and next smallest evidence check. It summarizes existing research files and canonical issue #30; original research evidence remains authoritative.
- **Generated projection:** `apps/aion-research-dashboard/research-index.json` plus immutable `snapshots/<revision>.json` are produced by `node apps/aion-research-dashboard/scripts/generate-index.mjs`. The browser reads the generated index, not a hardcoded per-frontend array.
- **Automatic update trigger:** GitHub Actions `.github/workflows/aion-research-index.yml` runs on edits to the source status, researched source docs, script or workflow. It rejects invalid sources and unsupported higher lifecycle claims; commits new snapshot only if the revision changed. Vercel Git integration is expected to redeploy changed dashboard assets; the dashboard independently checks GitHub's latest index while open.
- **SITREP must do:** after verifying source changes and completing an evidence-backed research decision, edit only the relevant frontier's status/evidence field(s) in `FRONTIER-STATUS.json`. Update `reviewed_at` only when a real substantive assessment occurred; update `status_updated_at` only when disposition actually changed. Add immutable original URL, observation date, claim, and a source-file reference when present. Never advance ACKNOWLEDGED, APPLIED or VERIFIED without independently verifiable receipt/test evidence.
- **SITREP must validate:** run or confirm `node apps/aion-research-dashboard/scripts/generate-index.mjs`, then `--check` and `node --test apps/aion-research-dashboard/tests/*.test.mjs`; where only remote GitHub tools are available, rely on GitHub Actions **after inspecting real job success and regenerated output**, not on the mere publication of a workflow file.
- **Live status contract:** report `index revision`, `assessed_through`, last relevant source/commit, actual CI success or blocker, actual Vercel deployment status, and report frontend freshness separately. Deployment READY does not alone prove that the browser loaded the new index.
- **No busywork:** a SITREP with no changed finding must not touch the status file or trigger a new revision. Research status is never incremented from commit activity, scheduled-run presence, or a new web page's date alone.
- **MVP bootstrap caveat:** an initial seed snapshot may precede the first automated CI generation. The generator's cryptographic revision and source-file fingerprints become canonical only once the real validation job runs successfully.

