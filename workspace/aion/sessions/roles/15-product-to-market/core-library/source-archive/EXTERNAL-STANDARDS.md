# Official external file and skill conventions — Source bibliography

This bibliography preserves external upstream *references*; it does not copy whole vendor-owned documents with unclear reproduction rights. Recheck the official page at the time of implementation because versioned rules change.

| Source | Original URL | Relevant convention / verified caution |
| --- | --- | --- |
| AGENTS.md | https://agents.md/ | Common open convention for agent instructions; actual loading varies |
| OpenCode V2 instructions | https://opencode.ai/v2/docs/instructions | Recognizes AGENTS.md, **no CLAUDE.md fallback** in V2; nested discovery, updates and configured instructions |
| OpenCode V2 agents | https://opencode.ai/v2/docs/agents | Dedicated .opencode/agents/<name>.md roles; configuration is not interchangeable with AGENTS.md |
| Agent Skills specification | https://openagentskills.dev/docs/specification | Required SKILL.md metadata plus optional references/, scripts/, assets/ |
| Agent Skills upstream | https://github.com/agentskills/agentskills/blob/main/docs/home.mdx | Machine-consumable agent skill file/directory convention |
| Claude Code context | https://docs.anthropic.com/en/docs/claude-code/memory | CLAUDE.md and scoped rules; check installed version |
| Gemini CLI context | https://geminicli.com/docs/cli/gemini-md/ | GEMINI.md and configurable context filenames |
| GitHub Copilot custom instructions | https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions | .github/copilot-instructions.md and scoped .github/instructions/*.instructions.md |
| Cursor rules | https://cursor.com/docs/rules | .cursor/rules/*.mdc and AGENTS.md options; legacy .cursorrules |

Additional historical research leads mentioned on September 5: StudyBook, Tangled, AgentsCLI, Graft and harness.wtf. Those lead-specific original pages were not independently recovered in this archive, so they are not represented as verified source files.

The Product Agent’s [133-name catalog](../AGENTIC-FILE-CATALOG.json) differentiates provider-documented formats, previously recalled names and new VIVIM catalog extensions.
