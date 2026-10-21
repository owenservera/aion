# AION — Master Autonomous Bootstrap Command

**Symbolic equivalent:** `#AION @<AGENT-ROLE> +/sitrep` (AION add-missing-bootstrap profile; `!` is not bootstrap).  
**Command:** `#AION @<AGENT-ROLE> BOOTSTRAP`  
**Short form in an established role conversation:** `#AION BOOTSTRAP`

This is an **instruction macro**, not an installed CLI, GitHub Action or background service. A supported agent invoked in a chat reads this entry point and executes the existing four-stage kit **sequentially within the current interaction** using only its available tools. Do not require the owner to paste four more prompts.

## Bootstrap tracker check

Read [BOOTSTRAP-TRACKER.md](BOOTSTRAP-TRACKER.md) first. Find your agent column and compare its completion versions against the current stage rows. Run missing or revised stages in sequence. After each stage, record your own status with UTC date and evidence; at closeout update last bootstrap and next outstanding stage. Preserve other agents' columns by reconciling latest main before writing. Existing folder scaffolding alone is not a completed stage. Normal SITREP checks and flags missing or newer stages without automatically running them.

## Resolve identity and scope

1. `#AION` selects the `owenservera/aion` GitHub repository. `@<AGENT-ROLE>` selects its **existing** canonical role workspace, instructions and scope. In an already-established role conversation, the short form inherits that role; no `@` means **do not presume Chief of Chiefs or the whole team**.
2. If the role cannot be reliably resolved, inspect the current conversation and repository roles; ask for the role only if it remains genuinely ambiguous. Do not create an unidentified or duplicate agent directory.
3. Read latest repository root `AGENTS.md`, the selected role's `AGENTS.md`, `SITREP.md`, optional `BOOTSTRAP.md`, memory, shared agent communications Living Operating Model, global memory guidance, and any relevant source evidence. Treat the repository as dynamic and preserve current user decisions.

## Run this kit, in order, without follow-up prompts

**Scaffold check:** Read [SCAFFOLD.md](SCAFFOLD.md). Reuse existing folders. Only create what is genuinely missing in this agent's canonical root; don't regenerate or overwrite populated resources.

**Stage 01 — Role SITREP / self-bootstrap:** Read and follow [01](prompts/01-SITREP-SELF-BOOTSTRAP.md). Reconcile active repo changes and communications, identify role boundaries, responsibilities, dependencies, working model, self-correction habits and useful voluntary 1:1 communications.

**Stage 02 — Owned shared intelligence:** Read and follow [02](prompts/02-SHARED-INTELLIGENCE.md). Discover high-value information this agent actually owns; update canonical sources and **its own** entry in the one active team index only when backed by substantive evidence. Do not overwrite other agents' entries.

**Stage 03 — Three-tier personal memory:** Read and follow [03](prompts/03-THREE-TIER-MEMORY.md). Establish or improve CANON, Immediate, Curated and personal Curated/BEST-PRACTICES. Immediate is consulted on every future interaction. Four thin global memory tiers are **owner-approved only**; nominate candidates outside those tiers without self-promoting.

**Stage 04 — Skills and capability ownership:** Read and follow [04](prompts/04-SKILLS-FIRST-PASS.md), including the [AION Master Skills Builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md). Independently select, reuse, improve or create **valuable** skills in the agent's own skills directory. Audit/validate where possible. Separate source readiness, discoverability and installed/local execution evidence.

Each stage **inherits** results from the previous stage. Do not demand separate `CONTINUE` messages, a handshake, an approvals queue or stage-by-stage owner instructions. A stage may legitimately conclude that no new files are needed. Do not expand scope into other agents' self-bootstraps.

## Execution and recovery rules

- Prefer concrete, useful changes over ceremonial reports, mandatory quotas or blanket rewrites. Preserve pre-existing work; do not recreate resources simply to satisfy the kit.
- After any shared-file write, reconcile concurrent Git changes; follow repository commit/push rules. Provide source links/commits for work actually verified. The owner's Windows environment is the local authority; GitHub content doesn't prove local harness installation.
- Don't automatically start ongoing tasks, host daemons or broad scheduled automation. Skill definitions are not extra permissions.
- If a tool/permission, ambiguous identity or real dependency blocks a step, finish every **independent** step still possible, identify the actual blocker precisely and leave reproducible resumption details in the agent's own Immediate memory **if permitted**. Never claim the whole sequence completed when blocked.
- If the interaction ends before completion due to limits, use the agent's normal context preservation method to save the **last verified completed stage and next precise step**, rather than claiming background execution.
- Repeat BOOTSTRAP intentionally only when asked; routine `SITREP` is a scoped refresh, **not** automatic replay of stages 01–04.

## Single closeout

Only after attempting the complete sequence, deliver **one concise closeout**: resolved role/workspace; meaningful new understanding; owned shared intelligence; role-memory changes; skills created/improved and validation level; collaboration requests; links to committed work; unresolved real blockers and the highest-value next action.

**Definition of done:** The four stages have been genuinely evaluated in order; useful work is committed and verified where possible; missing runtime/permissions are clearly distinguished from completed source changes. No obligatory file count.
