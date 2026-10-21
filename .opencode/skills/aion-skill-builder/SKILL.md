---
name: aion-skill-builder
description: Design, repair, validate, discover, and publish reusable AION agent skills for OpenCode V2 and compatible local harnesses. Use when repeated agent work, corrections, failures or missing capabilities should become a reusable workflow.
---

# AION Master Skills Builder

Build capabilities that agents actually use, rather than folders with instructions nobody loads.

## When to use
On role bootstrap, after repeated user corrections or failed patterns, whenever work becomes repetitive, or when SITREP reveals a missing, duplicated, outdated, or ineffective skill. Do not manufacture a skill for a one-off question.

## Skill factory loop
1. **Discover the cost:** inspect CANON, Immediate, previous work, existing skills, live task needs and shared intelligence. Identify recurring triggers, time lost, avoidable human correction and expected benefit.
2. **Reuse before creating:** inspect current role skills and all core-agent skills. Run the audit helper; prefer an existing skill, a supporting reference or a small script over duplicating an entire workflow.
3. **Choose the real capability shape:** plain SKILL.md guidance; on-demand references; tested deterministic scripts; verified fixture/example; executable tool/MCP/plugin integration **only when separately provided by the host**. A skill is not a permission grant or an installed daemon.
4. **Create or evolve:** use the builder helper for a new standard skill or improve the canonical existing one. Keep description specific for model discovery; scope steps and stop conditions; link existing source of truth instead of copying it.
5. **Verify:** validate syntax and discovery, test scripts and representative positive/negative cases with available tools. Distinguish remote-source-only verification from actual Windows/OpenCode/ZCode runtime validation.
6. **Make usable:** confirm the relevant skill root is registered in the actual harness. OpenCode V2 registration is in the project config; ZCode and other harnesses require separately confirmed supported adapters. Prove the skill can be invoked before claiming activation.
7. **Learn from use:** update the skill when new field evidence or recurring corrections warrant it, not on every SITREP. Retire superseded behavior without deleting needed provenance.

## Native helper (Node, from AION repo root)

- Audit discoverability and duplicate IDs: node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs audit
- Inspect machine-readable inventory: node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs catalog
- Create a skill: node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs new 10-development safe-release "Verify current changes before release"
- Validate a skill: node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs validate path/to/SKILL.md
- Show explicit OpenCode V2 skill directories: node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs sources

The helper does not install harnesses, change permissions, execute generated skills, or silently rewrite existing ones.

## Read only when relevant
- references/OPENCODE-V2.md: verified V2 discovery/config/permission contract.
- references/QUALITY.md: low-ceremony lifecycle, scripts, test surfaces, cross-agent ownership, safe promotion.

## Ownership
Every agent owns the skills it actually needs in its existing role folder. Toolsmith stewards this shared builder and cross-harness compatibility; Development verifies integration paths and actual runtime evidence where relevant. Other agents can contribute improvements through normal Git commits. No central approval queue, quota, duplicate skill registry or mandatory new-skill creation.
