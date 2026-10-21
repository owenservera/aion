# AGENTS.md — read this first (ChatGPT, Claude, local Windows agents)

**Updated 2026-10-20 precedence:** [REPOSITORY-GOVERNANCE.md](REPOSITORY-GOVERNANCE.md) governs main-only development and the Dev/Harvest/Research workstreams. Track B source may be authored via GitHub, but the **owner's Windows local machine remains master for actual runtime/live execution and acceptance**. Start with [Development Master](workspace/aion/ops/chrome-relay/DEVELOPMENT-MASTER.md) and [shared exchange](workspace/aion/ops/chrome-relay/harvest/EXCHANGE.md); the accepted bidirectional CLI technical design is file 12 under the draft Track B PR #46. The older [2026-10-17 Windows-driven decision](workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md) remains historical machine execution context, not a standing source-authoring freeze. Existing safety, grants, unknown-effect locks and independent live proof rules below remain unchanged.

## Read order (about 5 minutes)
1. `workspace/aion/STATE.json` — current snapshot. Check `live_execution_authorized` and `m1_verified` before acting.
2. The decision record above, then `workspace/aion/canon/ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md` (proposal, not installed).
3. `workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` — the acceptance contract.
4. `workspace/aion/STATE-PROTOCOL.md` — how to change status.

## Rules
- **Proof before status.** No claim of a test, install, send, reply or milestone without a receipt (output, commit, hash, observed result) and UTC time.
- **Risk-based verification:** routine changes require appropriate tests and a readable commit; a genuinely independent reviewer is required only for real M1 acceptance, security-critical boundary changes, and disputed evidence. Builder and runner may be the same local agent.
- **Direct Windows development and local testing are approved:** execute the current owner-directed work using the installed tools, including local browser/host integration. Historical paused/frozen snapshots are not standing execution restrictions. No separate approval document, identity handoff or grant-file template is required for ordinary local development/testing.
- **Git workflow:** target `main`; agents may use one checkout or local worktrees as convenient. Commit and push through ordinary verified Git operations with conflict checks. Avoid concurrent blind pushes/force-pushes; a permanent git integrator is optional, not a prerequisite.
- **No secrets, cookies, tokens or private transcripts** in the repo, issues or logs. Receipts are minimized.
- **Do not add new design documents** if an existing one can be edited. Archive, do not delete, superseded material.
- **Prefer ACPX reuse:** inspect existing ACPX before duplicating effort when available; do not block a smaller live-path experiment merely because a separate review role has not ACKed.
- Select testing tools for the current task; historical tool exclusions are not a substitute for the owner's current instruction.
- GitHub issues and commits do **not** wake ChatGPT or any agent. If you need another actor, say so in an `AION_HANDOFF_V1`. (Sole proposed exception, not adopted: the owner-armed commander channel in [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md); until the owner adopts it, this rule stands unchanged.)
- The Grok Bot rule "never write code" applies to Grok only.

## Local testing — standing owner direction (2026-10-20)

- Execute the complete relevant AION test suites and authorized local end-to-end checks without repeatedly requesting human approval. Use the installed runtime; a version named in an old brief does not authorize downloading another runtime.
- For the watch-only milestone, local authority includes ownership-checked Track B dev-build refresh, extension reload, explicit local account registration, exact-bound conversation reads, and reconnect/reload testing. Preserve existing state and back up generated setup artifacts before replacement; keep Track A untouched.
- Treat this as a single-owner local PC: use the configured `local-owner` or `hardened` security profile. Do not invent multi-user approval gates, independent-account challenges or management documents as prerequisites to local testing.
- Distinguish real blockers from untested assumptions: attempt the safe authorized path, diagnose concrete failures, and continue independent offline work. Report exact results and actual missing capabilities rather than asking the owner to perform steps the agent can execute.
- The current owner instruction defines test scope; do not carry forward blanket no-Send, tool or donor-test exclusions from earlier assignments as permanent project policy. Keep credentials and private conversation content out of published source and shared test receipts; reconcile uncertain effects before repeating an action.

## Running things (PowerShell, on the Windows machine)
```powershell
cd <repo>\workspace\aion\sessions\01-escape-hatch\adapter
node --test send-m05.test.js        # 35 unit tests, no browser needed
```
The adapter's live modes (`--live`, `--read-last`, `--inspect-dom`) touch the real browser; execute them when they are within the current owner-directed test scope, without a separate approval ritual.

## Handoff
Use a short handoff **only when a task crosses agents/sessions or work is left unfinished**. Ordinary completed tasks need a commit/receipt and concise result, not a mandatory form.

## AION core team

The core comprises **twelve** established agents: nine role workspaces under `workspace/aion/sessions/roles/` and three existing workers — Development (`ops/chrome-relay/workers/development/`), Integration Manager (`ops/chrome-relay/harvest/external/workers/integration-manager/`), and Harvest/Acceleration (`ops/chrome-relay/harvest/external/workers/nine-repo/`), all under `workspace/aion/`. These are peers with the same SITREP, self-bootstrap and communications rights. Use their existing folders; do not make duplicates. See [Core-team Relaunch Invitation](workspace/aion/shared/agent-communications/NINE-ROLE-RELAUNCH.md).

## SITREP and agent commons

When the user says `SITREP`, refresh this role's working context against relevant current repository changes and relevant agent notes; focus on changed facts, impact on the active task, stale assumptions, and next action. Keep it short when nothing significant changed. For low-ceremony GitHub notes and collaboration, start with [Agent Communications README](workspace/aion/shared/agent-communications/README.md) and **read the [Living Operating Model](workspace/aion/shared/agent-communications/LIVING-OPERATING-MODEL.md) before using the communications system**. Notes are not work orders or execution authority.

## Agent-maintained intelligence — SITREP standing check

On every scoped `SITREP`, check the [single active team intelligence index](workspace/aion/shared/agent-communications/intelligence/ACTIVE.md), the agent's [dedicated intelligence home](workspace/aion/shared/agent-communications/intelligence/agents/), and relevant peer entries. Independently decide what high-value knowledge this role needs to maintain for other agents. Update the canonical sources and the owner's ACTIVE.md row/changelog **only when substantive facts or useful sources change**. Respect other owners' rows and concurrent Git edits; link rather than duplicate authoritative material. No artificial refresh schedule, quantity targets or reporting ceremony.

## Three-tier local role memory

Every core agent has `memory/CANON/`, `memory/Immediate/`, and `memory/Curated/` **inside its existing agent workspace**, linked from local `AGENTS.md` and `SITREP.md`. Read relevant CANON and Curated context on launch/SITREP, and **consult Immediate at every interaction**, updating material active changes rather than emitting mandatory logs. CANON preserves verified durable lessons, decisions, user corrections, negative patterns and better alternatives; Immediate tracks live work and next steps; Curated is independently chosen, evidence-based style/aesthetics/personalization. Each agent owns a first pass. SITREP checks for stale or contradicted memory and updates tiers when useful. Agent memory is local role context; publicly reusable intelligence belongs in the shared team index. No sensitive inferred user profiles or automatic claims of cross-session recall.

## Skills ownership and harness readiness

All **twelve core agents** maintain `skills/` in their existing workspaces. At first bootstrap and each relevant SITREP, identify valuable recurring procedures and missing skills, review useful existing peer skills, and improve only what reduces repeated guidance, mistakes or manual work. The [native AION Master Skills Builder](.opencode/skills/aion-skill-builder/SKILL.md) provides OpenCode V2-friendly SKILL.md packages, an audit/new/validate CLI and harness references. The repo-root [opencode.jsonc](opencode.jsonc) declares all twelve source folders **for OpenCode V2 when running from the repo root**. ZCode requires its own verified enable/import workflow; never claim a skill has been installed, invoked or given local permissions merely because GitHub contains files. Toolsmith stewards the builder; all roles own their skills. No mandatory count, bureaucracy or recurring refresh writes.

## Agent memory: thin global + role-owned (always consult)

**Every new session/bootstrap and SITREP:** read **all four** files in [global agent memory](workspace/aion/shared/agent-memory/CANON/README.md) (`CANON/`, `Immediate/`, `Curated/`, `BestPractices/`) and the active agent's **entire personal `memory/`**, including `Curated/BEST-PRACTICES.md`. Keep this relevant context available while working; **consult personal Immediate every interaction** and update when active facts change. Do not load other agents' personal memory by default.

**Caveman memory:** one-line bullets, highest signal/fewest tokens. Preserve actionable rule + condition, not backstory. Link canonical sources; do not duplicate trackers, root policy, full logs or history. CANON = durable; Immediate = current; Curated = grounded style/insight; personal Curated/BEST-PRACTICES = distilled practical lessons. Compress existing memory without losing decision-critical context. SITREP corrects negative patterns and stale material; no meaningful change means no write.

**Global promotion requires explicit owner interview/approval.** Any agent may nominate a high-value systemic lesson in [global candidates](workspace/aion/shared/agent-communications/GLOBAL-MEMORY-CANDIDATES.md) with evidence and proposed one-line wording. **Never modify the four loaded global tier files without explicit owner approval of that specific change.** Silence, peer agreement or a Git commit does not grant approval. Keep proposals **outside** the loaded folder. GitHub instructions require agents to load these files; this is not proof of automatic injection by an unverified local harness.

## New agent bootstrap kit

For onboarding or relaunching an AION agent, `#AION @<AGENT-ROLE> BOOTSTRAP` invokes the [Master Autonomous Bootstrap Command](workspace/aion/shared/agent-bootstrap-kit/MASTER-BOOTSTRAP.md), which reads the [Agent Bootstrap Kit](workspace/aion/shared/agent-bootstrap-kit/README.md): minimal folder-scaffolding instructions and four sequential prompts executed autonomously (SITREP/self-bootstrap → shared intelligence → three-tier memory → skills). Reuse an existing role root, respect the current repo guidance, and do not rerun onboarding on ordinary SITREPs.

## Standing owner authorization: commit and push

**2026-10-21 owner directive:** When the owner instructs any AION agent to perform work, that instruction **includes authorization to commit and push its resulting in-scope, ordinary safe changes** to the appropriate repository. Do not ask for a second approval just to commit or push. Verify the actual remote commit/branch before claiming success; respect Windows local-master state and protect concurrent/uncommitted work. **Exception:** if the agent identifies a concrete potentially unsafe or destructive effect (e.g. cascading deletion, dependency/link breakage, broad structural rewrite, secret exposure, data loss, irreversible or uncertain-effect action), pause that risky portion, explain the effect and seek explicit owner decision. Continue independent safe work when possible. This is approval for Git publishing of directed work, **not** blanket permission to override separately explicit owner-only decisions (e.g. approving changes to four global memory tiers), safety/security boundaries, or runtime capabilities. Unless the owner says otherwise, this applies to all AION agents.


## Bootstrap stage status

On BOOTSTRAP and SITREP, consult the [single team bootstrap tracker](workspace/aion/shared/agent-bootstrap-kit/BOOTSTRAP-TRACKER.md). Its **columns are agents** and its **rows are scaffold and bootstrap stages**, with versioned self-reports, dates and evidence. BOOTSTRAP runs missing or newly revised stages in order and updates only its own column after reconciling concurrent Git changes. SITREP identifies pending stages but does not rerun full onboarding without an explicit request. Do not infer prior completion from existing files alone.

## AION symbolic commands (VOMEGA-compatible interpretation profile)

Use the [versioned command protocol](workspace/aion/shared/command-language/protocol.json) and [reading guide](workspace/aion/shared/command-language/README.md). `/sitrep` is the scoped refresh, `+/sitrep` is the AION bootstrap composition (add missing work), `/bootstrap` is its explicit equivalent, and `!/sitrep` is immediate SITREP **not** bootstrap. Read the current role instructions and tool state; symbols never confer execution permission or prove local installation.
