# AION Skills — 12 owned libraries + one builder

The shared native **Master Skills Builder** is at [.opencode/skills/aion-skill-builder/SKILL.md](../../../../.opencode/skills/aion-skill-builder/SKILL.md) in the AION repo. It is a reusable OpenCode V2 skill with an executable Node helper, discovery/validation commands and optional references.

Each of the twelve core agents owns skills under its **existing role workspace**. The project root opencode.jsonc lists their source directories for V2 when started at this repository root. Skills are on-demand instructions; their scripts still need actual installed runtimes, permissions and local execution evidence. Existing role skill libraries are preserved, not duplicated.

## First pass for each agent
Review recurring work, memory-based failure/correction patterns, current responsibilities and available tools. Determine the few reusable capabilities that would materially reduce repeated guidance or errors; improve existing skills before creating new ones. Create useful skill definitions and optional scripts/references/tests, validate, report source readiness vs actual harness usability, and leave a next real integration step.

## Ongoing SITREP
Check whether your skills are discoverable and useful for the **current** task. Detect missing recurring capability, broken reference, outdated instructions, duplicate skills and opportunities to reuse another agent's skill. Make material changes only; no quota, registry bureaucracy, weekly skill rewrites or mandatory receipts database.

Full V2 contract and harness caveats: [OpenCode V2 reference](../../../../.opencode/skills/aion-skill-builder/references/OPENCODE-V2.md).

### ZCode compatibility
ZCode supports a native `SKILL.md` package under `.zcode/skills/<name>/SKILL.md` and an in-app **Settings → Skills** import flow from external agents; select import mode and enable skills in the actual client. This provides a documented reuse path rather than an automatic install. See [ZCode official skill docs](https://zcode.z.ai/en/docs/skill). Do not copy or link skills onto the owner's PC without an authorized local executor, and avoid claiming activation without a real load test.
