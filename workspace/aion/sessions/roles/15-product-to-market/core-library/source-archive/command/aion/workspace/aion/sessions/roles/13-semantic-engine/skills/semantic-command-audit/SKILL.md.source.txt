---
name: semantic-command-audit
description: Audit AION symbolic or natural-language command mappings for VOMEGA 17-family fidelity, canonical IR, entity grounding, readiness gates, authority and one-bus execution boundaries. Use for new syntax, command-protocol revisions and semantic regression reviews.
---

# Semantic command audit

## Trigger

A proposed or changed `#AION @agent [modifier]/operation` expression, new DSL alias, parser adapter, intent-to-action behavior or failed command interpretation.

## Read first

1. Latest AION `workspace/aion/shared/command-language/protocol.json` and current role/operations mapping.
2. VOMEGA `omega-baseline/plugins/vivim-nlcl-pure/src/symbols.ts`, `lexer.ts`, `grammar.ts`, `ground.ts`, `interpret.ts`, `project.ts`; inspect source snapshots and provenance rather than treating drafts as runtime.
3. AION pinned `workspace/aion/ops/chrome-relay/harvest/landing/sources/vomega/RETENTION-ASSESSMENT.md` and current Bus/authority contracts.
4. Applicable local `AGENTS.md`, SITREP, memory and exact target capability declarations.

## Procedure

1. **Scope:** ground `#` project, `@` role/entity and `/` operation; refuse silent default to another repo or agent.
2. **Family fidelity:** account for all 17 source-declared primitive meanings. AION-specific compositions must be labeled **adapter mapping**, never falsely described as VOMEGA's compiled parser law.
3. **Candidates/IR:** build positive and negative examples with typed slots, identity/source revision, unresolved alternatives, effect class and expected evidence. Equivalent natural/symbolic forms should converge on the same intent model if proven.
4. **Readiness:** independently validate required fields, target identity, Account/Session, ambiguous/stale World, capability/realization availability, permission and side-effect locks. `ok`, `!` and `✓` do not bypass the gate.
5. **One-bus contract:** output command **data** for AION Bus V1/V2; do not call new routers, mutate private records, send or claim execution from this audit.
6. **Report:** concise pass/fail/unknown matrix including original source line/path, test input, observed or predicted output, blocking negative case and next implementer. Mark anything unrun **not tested**.

## Stop / recovery

Stop a proposed mapping that silently changes a VOMEGA primitive, ambiguously identifies a target, expands authority, or establishes a second ledger. Preserve alternatives and return a precisely scoped question or Development handoff. If live tools are unavailable, complete source/fixture review and explicitly reserve Windows end-to-end testing for an authorized local agent.

## Validation and maintenance

Validate frontmatter and source-path links with `.opencode/skills/aion-skill-builder/scripts/skill-kit.mjs validate <this-file>` in an actual checkout where Node is available. Run existing AION skill audit and the relevant NLCL/adapter test suites before claiming software validation. No Playwright/Puppeteer. Improve only when a real command failure/correction creates a reusable lesson.
