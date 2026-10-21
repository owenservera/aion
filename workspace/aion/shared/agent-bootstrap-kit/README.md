# AION — New Agent Bootstrap Kit

**Purpose:** Reusable, low-ceremony onboarding for a new AION agent or relaunch of an existing one. This kit is **instructions and copy/paste prompts only**. It is not an installer, scheduler, workflow runner or a new source of policy.

## Use in order

1. [Scaffolding](SCAFFOLD.md) — reuse an existing dedicated role root, or create the minimal folders for a new role.
2. [01 — SITREP + self-bootstrap](prompts/01-SITREP-SELF-BOOTSTRAP.md)
3. [02 — Agent-owned shared intelligence](prompts/02-SHARED-INTELLIGENCE.md)
4. [03 — Three-tier personal memory](prompts/03-THREE-TIER-MEMORY.md)
5. [04 — Skills and local capability first pass](prompts/04-SKILLS-FIRST-PASS.md)

**Launch convention:** Start a dedicated conversation with `#AION @<agent-role> SITREP`, then paste the entire Stage 01 prompt. Continue stages 02 → 04 in **that same conversation**, sequentially. The role prefix remains established; repeat it if starting a new chat. A generic `SITREP` in the established conversation thereafter means a scope-specific refresh, not a replay of all onboarding stages.

Read the latest [root AGENTS](https://github.com/owenservera/aion/blob/main/AGENTS.md) and [communications Living Operating Model](../agent-communications/LIVING-OPERATING-MODEL.md) before acting. These remain authoritative if the kit becomes stale. The [shared relaunch invitation](../agent-communications/NINE-ROLE-RELAUNCH.md) provides historical context, not another compulsory sequence.

**Ownership:** Agents decide their own working model, useful knowledge, memory contents and skills. Do not impose required deliverable counts, extra approval gates, periodic reports or duplicate files. Existing role workspaces and canonical sources win over this template.

**Concurrency:** Local Windows remains the human master. Use normal Git commits, check current `main` and changes by peers before editing shared index files, and never claim a push, install, skill invocation or local runtime test without evidence.

This kit has **no independent background process**; changes become visible to conversations when they actually reread GitHub.
