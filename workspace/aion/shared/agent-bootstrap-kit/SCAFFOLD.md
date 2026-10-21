# Minimal role-folder scaffolding

Use the **existing** role directory if present. Never create a second home merely because the agent's name differs. Read `AGENTS.md`, `SITREP.md`, `BOOTSTRAP.md`, and existing material first, then add only what is missing. Keep role-specific content for the agent's own first pass.

For a **new** agent, choose one dedicated canonical root (`<ROLE_ROOT>`) under the existing AION workspace taxonomy. The exact path and name should be agreed with the existing project organization; don't force every role into `sessions/roles/`.

```text
<ROLE_ROOT>/
  AGENTS.md                  # role identity, links to global rules and SITREP
  SITREP.md                  # scoped refresh / resumption instructions
  BOOTSTRAP.md               # optional if existing role uses it
  memory/
    CANON/README.md          # enduring lessons and decisions
    Immediate/README.md      # active work, checked every interaction
    Curated/
      README.md              # preferences, aesthetics, working style
      BEST-PRACTICES.md      # concise practical lessons
  skills/
    README.txt               # owner first-pass guidance; new <slug>/SKILL.md as needed
```

An empty tier can begin with one short statement marking first-pass content pending. Git does not track empty directories, so initial README files serve as placeholders. Do not overwrite populated tiers or existing skills.

## Reuse the shared infrastructure

- **Communications:** `workspace/aion/shared/agent-communications/`; [Living Operating Model](../agent-communications/LIVING-OPERATING-MODEL.md) is read first. Temporary peer folders may become standing by mutual agreement.
- **Team intelligence:** `workspace/aion/shared/agent-communications/intelligence/ACTIVE.md` is the sole live index. Create one owner home or reuse the existing row/folder; do not silently invent an extra core-agent row or duplicate another agent's intelligence.
- **Personal memory:** the three tiers belong inside the role root. The **separate four-tier global memory** under `workspace/aion/shared/agent-memory/` is owner-approved only; place proposals in `GLOBAL-MEMORY-CANDIDATES.md` and do not self-promote.
- **Skills:** use [AION Master Skills Builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md). OpenCode V2 discovery may require registering a newly added skills source in the actual project config; check for conflicts and verify local loading. Never overwrite an existing `opencode.jsonc` or assume ZCode is automatically enabled.

## Minimal local AGENTS and SITREP pointers

In `AGENTS.md`, link the root AION rules and require role-specific bootstrap/SITREP, the three personal memory tiers, shared communications, the active intelligence index and the role's `skills/`. State role authority and what it must *not* duplicate.

In `SITREP.md`, define: current repo changes → relevant peer communications → memory and active work → agent-owned intelligence → skill gaps → concise impact and next action. Read the four global memory tiers on bootstrap/SITREP; consult personal `Immediate` **every interaction**, updating only material facts. No-change is an acceptable result. Don't turn SITREP into mandatory documentation.

Do not pre-fill decisions, trackers, personal preferences or invented skills. Stages 01–04 are where the new agent evaluates and creates only useful material.
