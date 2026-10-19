# AION_HANDOFF_V1 — ONE-SHOT LOCAL MASTER IMPLEMENTATION BOOTSTRAP

**Date:** 2026-10-20
**Recipient:** active local OpenCode / Claude Opus / Oracle agent on the owner's Windows PC.
**Status:** READY TO PICK UP; implementation and local verification NOT PERFORMED from this design branch.
**Owner directive:** Fully integrate AION Agent Fabric across existing AION, Projects PM and related repositories, following the scoped implementation packets. Do the engineering, run tests, commit and push verified work. Minimize questions: choose reversible defaults and report blockers.
**Authority:** root AION AGENTS.md + current STATE.json + actual owner instructions. This document does not create credentials, new grants or Windows privileged rights.

## 1. YOUR SINGLE SOURCE ENTRY — READ IN ORDER

1. AION main: AGENTS.md, workspace/aion/STATE.json, workspace/aion/STATE-PROTOCOL.md (latest observed state; verify branch/UTC).
2. Design PR #35: workspace/aion/canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md (architectural authority proposal, not installed).
3. This file and companion handoffs:
   - workspace/aion/handoffs/AGENT-FABRIC-OPENCODE-M1-M2.md — exact implementation M1+M2.
   - workspace/aion/handoffs/AGENT-FABRIC-M3-M5-IMPLEMENTATION.md — detailed M3+M4+M5.
4. workspace/aion/agent-fabric/README.md, contracts/*.schema.json, fixtures/*, src/semantic-guards.mjs, test/contracts.test.mjs.
5. Current Track B executable branch (NOT main): origin/track-b/implementation-rounds-20261019 and velocity/AGENTS.md, velocity/README.md.
6. Cross-repo integration contracts, read native repo AGENTS.md BEFORE coding there:
   - zcode-setup draft PR #2: https://github.com/owenservera/zcode-setup/pull/2 (canonical agent/skill compiler, native conformance).
   - 001.PROJECTS.PM draft PR #21: https://github.com/owenservera/001.PROJECTS.PM/pull/21 (STRICTLY read-only evidence source).
   - SOFTWARE_HQ draft PR #6: https://github.com/owenservera/SOFTWARE_HQ/pull/6 (OpenCode V2/docs provenance).
   - zcode-bots draft PR #2: https://github.com/owenservera/zcode-bots/pull/2 (native Bot/task/attempt memory boundaries).

**No second source of truth:** AION role launcher + sessions inventory; Bus grants/operations; ZCode Playbook compiler; native OpenCode session; PM portfolio observations; Software HQ docs. Every cross link is a typed reference, not replicated authority.

## 2. Windows PowerShell preflight — no installations

From the existing AION Windows checkout (never assume a path):
    git rev-parse --show-toplevel
    git status --short --branch
    git worktree list --porcelain
    git remote -v
    git fetch origin main track-b/implementation-rounds-20261019 design/agent-fabric-20261020

Read the canonical design without checking out / merging it:
    git show origin/design/agent-fabric-20261020:workspace/aion/canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md
    git show origin/design/agent-fabric-20261020:workspace/aion/handoffs/AGENT-FABRIC-M3-M5-IMPLEMENTATION.md

Check the local toolchain without changing it:
    node --version
    bun --version
    opencode --version
    zcode --version
    pwsh --version

If a binary is absent, record ABSENT/UNRUN, not fabricated READY. Keep OpenCode V1 and V2 distinctly identified. Do not install or upgrade global tools without locally applicable owner authorization and environment protection.

**Branch strategy:** Make a separate worktree/branch based on origin/track-b/implementation-rounds-20261019, suggested name feat/agent-fabric-m1-m5-20261020. Reuse an existing worktree if another agent already started work; never reset, force push, or overwrite dirty owner files. Cherry-pick/import the design contracts and tests ONLY after reviewing their current-head versions; do not merge design PR #35 wholesale into Track B by default. Separate branches and PRs for zcode-setup native compiler. Projects PM/SOFTWARE_HQ/ZBot integration PRs are proposals; don't enable native writes for them.

## 3. Execute five milestones with no planning detour

**M1 — Inventory, identity and readiness.**
- Implement truthful dynamic AION agent inspection from 8 launcher entries + 9 designed session folders and Bus binding. Expose role 09 as DESIGNED_UNREGISTERED; not a live session. Preserve project-native IDs and evidence classifications.
- Capability probe separates installed/reachable/authenticated/ready/authorized, time and evidence.
- Test no writes, no send, duplicate alias ambiguity, stale version and restart.

**M2 — Native agent compiler and first agent.**
- In zcode-setup playbook/toolkit, author one canonical reviewer descriptor; use JSON Schema + pure semantic guards in AION's contract directory as compatibility inputs, with a REAL full Draft2020-12 validator in the compiler. Generate ZCode-native and OpenCode V2-native artifacts deterministically without copy/pasted sources.
- V2 read-only reviewer: broad DENY before allow read/glob/grep; deny edit/shell/subagent/execute/external_directory and external tools; native child permissions explicitly checked, not assumed inherited.
- Native V2 parent -> reviewer child live test in isolated worktree if installed and permitted; otherwise record BLOCKED_V2_RUNTIME, still complete offline fixtures/conformance.

**M3 — ContextPack and task source selection.**
- Implement task-aware, provenance-pinned ContextPack with audience ACL, relevance, task acceptance, freshness, token budgets and omitted-source reasoning. Do not reuse fixed excerpt as final. Read PM pulse and Software HQ as sources only.
- Explicit context plan/inspect; no automatic sends. Chrome Bus retains 2,000-character boundary; native OpenCode may use file references when verified. No secret crossing.

**M4 — Delegation and verified evidence.**
- Correlate project-native work -> child task -> attempt -> native session -> Bus operation ID -> artifact/result. No new Bus or task authority. Enforce effective permission intersection and unknown-side-effect no-retry.
- Prove one actual parent-to-reviewer subagent task, denied tool attempts, file-line review evidence and independent result check. If unavailable report OFFLINE_PASS not LIVE.

**M5 — Full connection / portfolio integration.**
- End-to-end AION command to selected existing runtime and linked evidence, with accurate engine capability, model lane and permission state. Integrate PM by read-only observed report, Software HQ by doc refs, ZBot via native refs when available, PC HQ via host resource signals and Pocket via existing ACP hub only where connected.
- Chrome dev profile/host remains isolated Track B. Never touch stable Track A and never send real browser prompts to test context without authorized native admission. Live Send/button defect requires actual evidence and no duplicate/retry.

STOP expanding scope once one fully verified critical path works. Do NOT build dashboards, new bus/daemon, general RAG/vector DB, A2A stack, Slack or GitHub Actions. No Playwright/Puppeteer/Orca anywhere.

## 4. Tests and evidence — sequential completion gates

A. Baseline local offline Track B full selftest, current head, raw counts. Node 22 required. Do NOT cite prior Opus 965-test run as current.
B. Cross-repo contract tests: from design tree run node --test workspace/aion/agent-fabric/test/contracts.test.mjs; full JSON Schema Draft2020-12 conformance by appropriate validator; negative permission and schema-version mutation tests.
C. M1 role state and READ-ONLY tests (8 vs 9), unknown/offline and target binding mismatch.
D. M2 native generator golden diff and native agent discovery; ZCode Playbook conformance. Verify child cannot shell/edit/external.
E. M3 content hashes, source freshness, audience and token bound; no hidden source omission; no use of untrusted data as instructions.
F. M4 real or explicitly UNRUN child task/correlation, no escalated tool grants and no-retry on uncertain delivery.
G. M5 isolated dev Chrome Send+reply if activated and owner authorized, exact operation result and independent review. Rollback and Track A negative case.
H. Verify git status, targeted source hashes, risk tests and actual commit+push to isolation branches. Cross-repo docs require no runtime install. Never merge to main without owner review.

Every milestone writes one focused local receipt: UTC, repo, branch, SHA, versions, test command/result counts, work/task/attempt IDs (redacted if needed), negative tests, skipped/live UNRUN, evidence URLs and source freshness.

## 5. Cross-repo authority and escalation

- AION controller coordinates explicit owner-approved execution; AION Bus keeps grant/no-resend. A role name is not authority.
- zcode-setup is the sole authored agent + skill package source. Generated native agent configs are disposable output.
- Global PM current charter is read-only. Never create issues in monitored repos on PM's behalf, run agents from PM scans or edit PM project's inputs. AION consumes PM observations and handles assignments under separate authenticated authority.
- SOFTWARE_HQ owns technical docs; when pulling Context7, save raw output AND the query scripts with source hash/UTC in its designated existing docs folder; do not claim stored until verified committed.
- zcode-bots native Host retains Bot identities, durable tasks, memories/approvals/attempts. AION only references native keys and requests bounded actions via authenticated Host.
- PC HQ owns OS/network/hardware health; Product Hub discovers candidate skills, not permission; VOMEGA owns signed recipe/capability patterns; zcode-pocket is a client not an independent executor.

No secret, private chat transcript, bearer token, signed grant material or credential in GitHub receipts or tests.

## 6. Closure and minimal owner burden

Do not ask the owner to choose mundane implementation details. If one runtime cannot be verified, continue parallel OFFLINE work on other slices and mark that gate unrun. Ask owner only when privileged host install/change, login, live external side effect, policy conflict or irreversible operation is genuinely required.

Final report must provide a table M1–M5 with status PROVEN / OFFLINE_PASS / BLOCKED / UNRUN / FAILED; exact changed file paths and Git commits/PRs; tested Node/OpenCode versions; native denial/evidence; unresolved work; next single owner action if any. GitHub issue/comments are task distribution only and do not awaken ChatGPT sessions.

## 7. ONE PROMPT FOR THE LOCAL AGENT

Implement AION Agent Fabric end-to-end through five evidence gates using the master handoff at origin/design/agent-fabric-20261020:workspace/aion/handoffs/AGENT-FABRIC-LOCAL-MASTER-START.md, M1/M2 and M3/M5 companion packets, and strict schemas/fixtures in workspace/aion/agent-fabric. Work from the real local Windows AION checkout, with implementation branch based on origin/track-b/implementation-rounds-20261019; don't alter stable Track A. Integrate the existing zcode-setup Playbook, read-only Projects PM, SOFTWARE_HQ docs and native ZBot contracts via their linked draft PRs without duplicating authorities. First detect installed OpenCode version and run baseline tests; build minimal native agent compiler, truthful identity/readiness, source-aware ContextPacks, narrowed child delegation and one verified command-to-result. Run all applicable local tests and live checks only when actually supported and authorized, commit/push isolated branches and post an evidence-based M1–M5 closeout. No GitHub Actions, new buses, Playwright/Puppeteer/Orca, Slack, silent context injection or false live claims. Continue independently on reversible tasks and surface only truly owner-required actions.
