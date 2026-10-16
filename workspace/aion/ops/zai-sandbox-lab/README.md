# AION Z.ai Agent Mode Sandbox Laboratory
Owner: Role 08 Z-FORGE (mission research/packaging), Role 03 CoS (approved dispatch), Role 06 TOOLSMITH (compatibility), Role 04 Efficiency (measured performance), Role 05 Chief (priority/proof), Role 07 Intake (proposal source custody).
Status: SCAFFOLD ONLY; no live Z.ai turn initiated.

## Critical product distinction
We target **chat.z.ai web Full-Stack / Agent Mode** as described by the owner, NOT automatically ZCode desktop, its built-in browser panel, AutoClaw, the Z.ai API or a local OpenCode session. Public Z.ai web product confirms a 'Full-Stack' entry but detailed sandbox promises should be validated on the actual account. Sources:
- https://chat.z.ai/?mode=agent
- https://zcode.z.ai/en/docs/welcome (separate related product)
- https://zcode.z.ai/en/docs/agents (separate related product)

## Intent
A web turn is treated as a scarce bounded *production-sized* development work unit. Have the AION specialist prepare inputs, repo refs, acceptance tests, subagent decomposition and export/recovery *before* pressing Send. Preserve results in existing AION repository; don't make cloud sandbox state the source of truth.

## Lab files
- `CAPABILITY-LEDGER.md`: evidence qualification of actual Z.ai web functionality and unknowns.
- `RESEARCH-BACKLOG.md`: 30 ordered research questions with measurable deliverables and likely efficient experiment.
- `RESEARCH-TASKS.json`: canonical structured research feed for planning/review.
- `TURN-FEED.json`: proposed mission candidates READY/WAITING/NO_AUTH, with no fabricated runs.
- `MISSION-TEMPLATE.md`: prompt format for a single heavyweight turn.
- `FIRST-MISSION.md`: initial bounded experiment, not a claim that the owner has pasted it.
- `RESULT-RECEIPT.md`: required evidence format and promotion states.

## Turn packet flow
Research task -> CAPABILITY CLAIM (OWNER_REPORTED/EXTERNAL_DOC/DIRECT_OBSERVATION/UNKNOWN) -> required preflight -> ready mission -> owner manually submits in existing Z.ai web UI -> agent runs sandbox development and (if supported) bounded subagents -> on-screen response and verified artifact export -> code/test/evidence review -> AION repo entry -> tool/skill learning -> next mission.
Failure/permission boundary -> diagnostic result + fallbacks; don't burn multiple turns chasing the same error without a changed hypothesis.

## Default sandbox rules
Read-only repository clone at pinned revision. Avoid copying secrets/sensitive user files into third-party sandboxes. Dedicated disposable test repo/fixture when needed; no push/production deployment unless separately approved. Minimal permissions and network access. Make artifacts recoverable via Git (after approval), patch or ZIP and cryptographic hashes. No Playwright or Puppeteer. Prefer native browser preview, Chrome DevTools, deterministic unit/e2e contract tests, and manual browser inspection where automation is unsupported.

## Business metric
Useful, independently verified AION capabilities per successful Z.ai Agent Mode turn, including defects and recovery. Not token count, raw output length or 'agents spawned' vanity counts. Count savings and repeatability only with real evidence.
