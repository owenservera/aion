# AION — verified seven-repository agent consolidation assessment
**Snapshot:** 2026-10-25, seven accessible GitHub `main` branches; 5,982 tracked files in **untruncated recursive trees**. This supersedes the initial partial matrix while retaining its prior version in Git history. [Machine-readable path-level source inventory](AGENT-CROSS-REPO-SOURCE-INDEX-2026-10-25.json).

**Evidence category:** REPO_INSPECTED. Each repository has its own recorded `tree_sha` in the machine inventory. Full default-branch path coverage **does not include** other branches, external local worktrees, live ChatGPT role registration, machine execution, actual OpenCode skill loading, Windows tasks, runtime health or deployment. Missing a `SKILL.md` is not inherently a role failure. No other repository was modified.

## A. Parent-repository matrix
| Parent repo | Tracked files | Root AGENTS | AGENTS / BOOTSTRAP / SITREP / SKILL file counts across repo | Primary scope |
|---|---:|:---:|---|---|
| [aion](https://github.com/owenservera/aion) | 4,146 | ✓ | 20 / 19 / 19 / 50 | 15 AION identities; research, coordination and legacy workspaces |
| [001.PROJECTS.PM](https://github.com/owenservera/001.PROJECTS.PM) | 274 | ✓ | 1 / 0 / 0 / 0 | GPM-CHATGPT + read-only portfolio contracts |
| [SOFTWARE_HQ](https://github.com/owenservera/SOFTWARE_HQ) | 194 | ✓ | 2 / 1 / 1 / 2 | Application intelligence; Global Harness Agent |
| [hq](https://github.com/owenservera/hq) | 33 | — | 0 / 0 / 0 / 0 | PC HQ host authority; INFRA research workspace |
| [vivim-harness](https://github.com/owenservera/vivim-harness) | 399 | ✓ | 1 / 0 / 0 / 0 | Canonical Harness implementation + 2 specialized OpenCode profiles |
| [vivim-omega](https://github.com/owenservera/vivim-omega) | 873 | ✓ | 1 / 0 / 0 / 0 | Omega codebase, session and build gates |
| [zcode-pocket](https://github.com/owenservera/zcode-pocket) | 63 | — | 1 / 0 / 0 / 0 | Android app + product-design-specific AGENTS.md |

**Source correction:** canonical [SOFTWARE_HQ](https://github.com/owenservera/SOFTWARE_HQ) uses an underscore; the previously assumed `software-hq` did not exist at the queried address. `001.PROJECTS.PM`, `SOFTWARE_HQ` and `hq` are private; this document stores **file-presence metadata only**, not their source contents.

## B. Fifteen AION agents — physical homes and core-file verification
**A / B / S** below are *files at that agent's actual workspace*: `AGENTS.md`, `BOOTSTRAP.md`, `SITREP.md`. Memory means a dedicated three-tier `memory/` structure, and tools means `TOOLS.json` or `TOOL-REGISTRY.json`. Skills counts are executable-format `SKILL.md` files, not generic README files.

| # | Agent and actual folder | A | B | S | Skills | Memory | Tools |
|---|---|:---:|:---:|:---:|---:|:---:|:---:|
| 01 | [Dashboard & Tracking](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/01-dashboard-tracking) | ✓ | ✓ | ✓ | 1 | ✓ | — |
| 02 | [Long-term Planning & Alignment](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/02-long-term-planning-alignment) | ✓ | ✓ | ✓ | 2 | ✓ | — |
| 03 | [Chief of Staff / Operations](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/03-chief-of-staff-operations) | ✓ | ✓ | ✓ | 0 | ✓ | — |
| 04 | [OpenCode Output / Efficiency](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/04-opencode-output-efficiency) | ✓ | ✓ | ✓ | 0 | ✓ | — |
| 05 | [Chief of Chiefs](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/05-chief-of-chiefs) | ✓ | ✓ | ✓ | 2 | ✓ | — |
| 06 | [TOOLSMITH](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/06-tooling-integration-engineer) | ✓ | ✓ | ✓ | 9 | ✓ | ✓ |
| 07 | [INTAKE / Proposal Commons](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/07-proposal-intake-commons) | ✓ | ✓ | ✓ | 7 | ✓ | ✓ |
| 08 | [Z-FORGE](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/08-zai-sandbox-strategist) | ✓ | ✓ | ✓ | 10 | ✓ | ✓ |
| 09 | [Global Research](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/09-global-research) | ✓ | ✓ | ✓ | 10 | ✓ | ✓ |
| 10 | [Development](https://github.com/owenservera/aion/tree/main/workspace/aion/ops/chrome-relay/workers/development) | ✓ | — | ✓ | 1 | ✓ | — |
| 11 | [Integration Manager](https://github.com/owenservera/aion/tree/main/workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager) | ✓ | — | ✓ | 1 | ✓ | — |
| 12 | [Harvest / Acceleration](https://github.com/owenservera/aion/tree/main/workspace/aion/ops/chrome-relay/harvest/external/workers/nine-repo) | ✓ | ✓ | ✓ | 1 | ✓ | — |
| 13 | [Semantic Engine](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/13-semantic-engine) | ✓ | ✓ | ✓ | 1 | ✓ | — |
| 14 | [Webapp Native Harness](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/14-webapp-native-harness) | ✓ | ✓ | ✓ | 1 | ✓ | — |
| 15 | [Product-to-Market](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/15-product-to-market) | — | ✓ | — | 0 | — | — |

**Completeness:** 41/45 core-file positions are present. The four missing at actual homes are: Role **10 BOOTSTRAP**; **11 BOOTSTRAP**; **15 AGENTS and SITREP**. Role 15 also has no role-local memory or SKILL.md. Roles **03, 04, 15** have zero SKILL.md; do not create filler skills for a numerical target. AION role-local tool manifests exist for **06** (`TOOL-REGISTRY.json`), **07–09** (`TOOLS.json`).

**Why old searches failed:** physical homes for roles 10–12 reside within AION's Chrome Relay development/harvest worker subtree, and each is referenced from the [active shared-intelligence roster](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/agent-communications/intelligence/ACTIVE.md). **Do not physically relocate them without reviewing imports/links/runtime discovery.** The 12 sessions/roles homes are roles 01–09 and 13–15.

**Registration drift:** [sessions/README](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/README.md) documents the initial nine, while [ACTIVE](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/agent-communications/intelligence/ACTIVE.md) covers thirteen. Roles [14](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/14-webapp-native-harness) and [15](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/15-product-to-market) are newer source workspaces but not evidence of live ChatGPT or local registration. [opencode.jsonc](https://github.com/owenservera/aion/blob/main/opencode.jsonc) registers skill directories for 01–13 (including off-path 10–12), not 14–15; this is a configuration finding, not an instruction to install those roles.

**Other AION AGENTS are not roles:** development/value-oracle/velocity project-level instructions and donor-snapshot `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` are different artifact classes. Vendor/donor files are tagged in the source index, not counted as AION staff.

## C. Other parent-repository agents / specialist surfaces
| Parent | Identity / location | Actual scaffold | Ownership / classification |
|---|---|---|---|
| [Global PM](https://github.com/owenservera/001.PROJECTS.PM) | [GPM-CHATGPT workstream](https://github.com/owenservera/001.PROJECTS.PM/blob/main/docs/GPM-CHATGPT-WORKSTREAM.md) | Root `AGENTS.md` only; no dedicated BOOTSTRAP/SITREP or three-tier agent memory | Observer/reconciler; **not** executor |
| [SOFTWARE_HQ](https://github.com/owenservera/SOFTWARE_HQ) | [Global Harness Agent](https://github.com/owenservera/SOFTWARE_HQ/tree/main/agents/global-harness-agent) | A/B/S all ✓, 2 SKILL.md, three-tier memory ✓; owns HARNESS-MAP/RESEARCH | Portfolio harness research/diagnostics; native owners implement |
| [SOFTWARE_HQ](https://github.com/owenservera/SOFTWARE_HQ) | [Application intelligence charter](https://github.com/owenservera/SOFTWARE_HQ/blob/main/docs/CHARTER.md) | Root AGENTS ✓, docs/knowledge/contracts | Domain authority, **not six E1–E6 staffed agents** |
| [PC HQ](https://github.com/owenservera/hq) | [INFRA research workspace](https://github.com/owenservera/hq/tree/main/research/infra) | BRIEF.md, STATUS.md, LOG.md, TOOLS.md, PRIORITIZATION.md; no AGENTS/BOOTSTRAP/SITREP | Research/operating surface, not a fully scaffolded autonomous agent |
| [PC HQ](https://github.com/owenservera/hq) | [Host authority](https://github.com/owenservera/hq/blob/main/architecture/CHARTER.md) | No root AGENTS, SKILL.md or core role files; has contracts and decisions | Four domains: hardware, OS, networking, peripherals |
| [VIVIM Harness](https://github.com/owenservera/vivim-harness) | [ChatGPT/AION specialist](https://github.com/owenservera/vivim-harness/blob/main/.opencode/agents/chatgpt-aion.md) | OpenCode subagent profile, inherits root AGENTS | Remote GitHub coordination and evidence |
| [VIVIM Harness](https://github.com/owenservera/vivim-harness) | [Local OpenCode specialist](https://github.com/owenservera/vivim-harness/blob/main/.opencode/agents/local-opencode.md) | OpenCode subagent profile, inherits root AGENTS | Windows runtime verification/cutover |
| [VIVIM Omega](https://github.com/owenservera/vivim-omega) | [Omega root contract](https://github.com/owenservera/vivim-omega/blob/main/AGENTS.md) | AGENTS only; gates/runbooks/tests | Native Omega code authority; no separate role-specific B/S |
| [ZCode Pocket](https://github.com/owenservera/zcode-pocket) | [Product-design instructions](https://github.com/owenservera/zcode-pocket/blob/main/product-design/AGENTS.md) | Nested AGENTS only; no root AGENTS or B/S | Android UX design; not backend/hub authority |

**SOFTWARE_HQ E1–E6 clarification:** the repository has one verified `agents/global-harness-agent` workspace. The E1–E6 labels from prior planning are **not** six agent directories or independent operating agents in the scanned tree. Its [intelligence model](https://github.com/owenservera/SOFTWARE_HQ/blob/main/docs/INTELLIGENCE-MODEL.md) describes data/capability layers, not staffing.

**PC HQ legacy taxonomy:** the five `domains/01–05` files are explicitly marked legacy/pending migration by [PC HQ README](https://github.com/owenservera/hq/blob/main/README.md). Current [PC HQ boundary](https://github.com/owenservera/hq/blob/main/contracts/PC-HQ-SCOPE-BOUNDARY.md) limits operational authority to **four** host-level domains. AI provider/model and application tool logic remain with their native owners.

## D. Cross-repository ownership and duplicate-risk matrix
| Capability / decision | One canonical owner | Related roles / boundary | Risk |
|---|---|---|---|
| Global external research intake | AION 09 | AION 07 technical proposals; SOFTWARE_HQ receives technical docs | Avoid second research queue |
| Product strategy and V1 release priorities | AION 15 | Harness implements; GPM observes | New role continuity files incomplete |
| Native webapp shape research | AION 14 | Software HQ Global Harness researches *general* harnesses | Overlapping topic, different mission |
| Harness **production** source/tests/CI | **vivim-harness** | AION legacy studio retained as historical proof/rollback | **HIGH** duplicate-run/cutover risk; no remote proof of Windows switchover |
| Cross-tool readiness, ACP integration | AION 06 in AION scope; native project owner for execution | SOFTWARE_HQ Global Harness benchmarks options | Avoid second adapter/execution stack |
| Portfolio status, Kanban/reporting | Global PM | AION 02/03 are AION-scoped | PM **never mutates monitored repos** |
| Windows host environment | PC HQ | machine-steward supplies dated host evidence; SOFTWARE_HQ app intelligence | Avoid host/app authority mixing |
| Omega code, policies, sessions/gates | vivim-omega | AION 13 supplies command semantics/reuse | Keep original code ownership |
| ZCode Pocket Android interface | zcode-pocket | ZCode ACP hub native owner outside this seven-repo scan | UI file is not backend authorization |

## E. Concrete findings to correct (ordered)
1. **AION roster split:** initial nine-role README vs thirteen-role active index vs fifteen actual identities. Publish one lightweight entry-point linking all role homes. No need to copy or move the 10–12 workspaces.
2. **Role 15 scaffolding:** current role has `README.md`, `BOOTSTRAP.md`, `LAUNCH.md`, product decisions and `core-library/`, but lacks `AGENTS.md`, `SITREP.md`, `memory/`, skill definition. Prioritize concise identity and status continuity, not ceremonial boilerplate.
3. **Role 10 and 11 references:** worker AGENTS files mention their existing BOOTSTRAP even though none exists in those exact homes; correct source references or supply a justified minimal bootstrap.
4. **SOFTWARE_HQ broken pointer:** [Global Harness README](https://github.com/owenservera/SOFTWARE_HQ/blob/main/agents/global-harness-agent/README.md) links AION `06-toolsmith`, but the real folder is `06-tooling-integration-engineer`.
5. **PM vs PC HQ scope drift:** older [GPM charter](https://github.com/owenservera/001.PROJECTS.PM/blob/main/docs/CHARTER.md) broadly routes software/provider inventory to PC HQ. Current [PC HQ four-domain boundary](https://github.com/owenservera/hq/blob/main/contracts/PC-HQ-SCOPE-BOUNDARY.md) supersedes that broader responsibility claim.
6. **Harness cross-link drift:** AION Role 14 README points to pre-centralization Capture Studio governance. [AION root AGENTS](https://github.com/owenservera/aion/blob/main/AGENTS.md) now says **vivim-harness owns code, tests, CI and implementations**, while old AION code remains for provenance/rollback.
7. **Source ≠ active:** 15 AION folders/workspaces, Software HQ specialist source and two Harness subagent profiles do **not** prove ChatGPT chat identity, OpenCode agent discovery, Windows installation or live app acceptance. Require separate actual runtime evidence before marking any of those completed.

## F. Minimal follow-through
- **Directory:** One AION role entry-point linking 01–15 with parent repo, actual path, owner, source/runtime evidence and status; machine source index remains the audit attachment.
- **Repair:** Fix the four concrete broken or outdated references without moving working sources or changing other projects from AION.
- **Only necessary agent files:** Role 15 identity/SITREP and appropriate worker 10/11 bootstrap pointers, *after* confirming their owner launch needs.
- **Operational proof:** separately check local OpenCode `opencode debug agents`, loaded skill discovery and the single real browser-effect owner. GitHub pushes aren't live proof.

**Audit method:** GitHub `GET /repos/{owner}/{repo}/git/trees/main?recursive=1`, seven results with `truncated=false`; filename/sha verification and governing docs fetched. This report is a complete seven-repo **default-branch agent-file census**, not a claim that all agents are active. No Playwright, Puppeteer, Windows changes, host access or execution tests were performed.
