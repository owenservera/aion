# AION RESEARCH | Specialist skills

Skills are reusable runbooks for the **same research agent**, not separately launched employees. Read the relevant SKILL.md before nontrivial work.

| Skill | Trigger | Evidence/output |
|---|---|---|
| [01 source intake](../01-source-intake/SKILL.md) | URL/file/question/media/user interest | canonical deduped candidate and provenance |
| [02 repository discovery](../02-repo-discovery/SKILL.md) | fresh launch or cross-project implications | verified current repo coverage and match matrix |
| [03 scientific assessment](../03-evidence-assessment/SKILL.md) | experiments/papers/benchmarks | claim ledger with confidence/counterevidence |
| [04 docs intelligence](../04-docs-intelligence/SKILL.md) | API/SDK/standards/manual | versioned source packet to SOFTWARE_HQ |
| [05 media intelligence](../05-media-intelligence/SKILL.md) | YouTube/podcast/article | source-grounded extracted ideas and applicability |
| [06 transfer analysis](../06-cross-project-transfer/SKILL.md) | any substantive finding | recipient-by-repo fit and action |
| [07 NotebookLM](../07-notebooklm/SKILL.md) | multi-source synthesis needs grounded notebook | validated capability tier, source plan, output citations |
| [08 closure loop](../08-delivery-loop/SKILL.md) | finding ready for recipient | GitHub task/back-link, ACK/acceptance check |
| [09 SITREP](../09-session-sitrep/SKILL.md) | every new session/scheduled task | fresh evidence-based state and next work |
| [Research evidence checker](../research-evidence-check/SKILL.md) | when publishing research maturity or recipient/implementation claims | offline Node CLI, tested receipt/schema validator with sanitized fixture |

Resolve available tools from current session. None of these skills grants new permissions or creates a new autonomous scheduler.

## Shared native skills builder

Reuse and modernize these existing skills. The [AION builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md) supports V2 discovery, repeatable creation and validation; review older runbooks for missing descriptions without blindly rewriting them. Maintain skills only when useful to this role or the team.


## Local harness readiness (evidence levels)

- All 10 Research skills have V2-style YAML frontmatter with a discoverable description, and [root OpenCode V2 config](https://github.com/owenservera/aion/blob/main/opencode.jsonc) includes this role's skills source from the **repo root working directory**.
- The former root `skills/README.md` was preserved as this reference so V2 no longer mistakes a documentation README for a flat `readme` skill.
- [Evidence checker CLI](../research-evidence-check/scripts/check-packet.mjs), [tests](../research-evidence-check/scripts/check-packet.test.mjs) and [fixture](../research-evidence-check/fixtures/example-published.json) have isolated Node 22 tests (8/8 PASS); their byte-identical GitHub blobs were checked against the tested copies. This is **offline Node execution**, not OpenCode or ZCode runtime activation.
- OpenCode V2 must actually launch with the repo root as working directory and effective config/permissions; verify its skill catalog and explicitly load `research-evidence-check` before claiming discovery. ZCode requires an actual Skills import or workspace-native link and user enablement, followed by a real `$research-evidence-check` load/test. Do not silently modify the local machine.
