# Skill quality and useful capability design

A skill is worthwhile when an agent is likely to need the same knowledge or sequence again and reuse reduces user guidance, corrections, mistakes or repeated research. Look for triggers in memory/Immediate, CANON failure patterns, SITREP drift, shared intelligence, tests and local-harness friction.

Choose the smallest useful package:
- SKILL.md: tight trigger/anti-trigger, steps, tools and boundaries, verified result and failure/recovery.
- references/: optional source contracts, runbooks, richer examples. Read them only as needed.
- scripts/: deterministic safe helpers, preferably with tests. Scripts need their runtime and separately granted host permissions.
- assets/ or fixtures/: small sanitized templates, inputs and expected outputs.
- External MCP, ACP, custom tools, plugins, hooks and scheduled automation are **not** magically installed by a skill. Add a verified integration contract and appropriate tests before offering those effects.

Before adding: search existing skills for overlap. Prefer fixing or extending a proven skill. Use portable lowercase kebab-case IDs with a description precise enough for OpenCode to advertise it correctly; the directory name is the OpenCode V2 ID. Avoid premature auto-invocation for dangerous or highly specialized behavior.

Evidence distinctions: SOURCE READY (valid files), DISCOVERABLE (harness advertises it), RUNNABLE (host tools exist), TESTED (with test receipt), FIELD PROVEN (used successfully in the relevant Windows environment). Never collapse these states into one blanket 'done'.

SITREP: inspect current needs, recent corrections, skill usage/failures and staleness. Act only on material improvements. An empty first-pass skills folder is acceptable if nothing valuable has yet been identified; an existing high-value skill can be the entire first pass.
