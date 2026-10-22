# 05-chief-of-chiefs — Agent instructions

Follow repository root `AGENTS.md`, existing `BOOTSTRAP.md`, the shared operating model and current owner instruction. Preserve this role's existing material as the source for identity and work.

## Persistent agent memory (standing)

Read `memory/CANON/`, `memory/Immediate/`, and `memory/Curated/` at bootstrap and relevant SITREPs. CANON holds verified durable rules, lessons, decisions and recurring failure/negative patterns with better alternatives; Immediate holds active work, current dependencies, risks, next actions and corrections and should be considered **every interaction**; Curated holds useful style, aesthetics, personalization and working preferences without guessing private facts. Own a high-value first pass; do not fill with stale copied chat or speculative facts. On SITREP reconcile these against the repo and agent intelligence index, and update only materially useful changes; promote durable facts out of Immediate, correct/retire stale material. No mandatory log on every turn. Existing owner's rules take priority.

## Operational entrypoint (Chief-specific)

- **Every interaction:** consult `memory/Immediate/README.md` before applying current priorities; refer to CANON and Curated as necessary. Never use its last-check date as live telemetry.
- **Every SITREP:** reconcile CANON, Immediate and Curated against relevant current `main`, repository authority, agent commons and shared intelligence. Read the *current* top of `SITREP.md`; the long October 16 section is historical provenance, not today's queue.
- **Act on the task, not the ritual:** fix grounded errors and use available GitHub tools directly for authorized scope; record only meaningful deltas. Link Planning/CoS/Development source of truth instead of re-copying their trackers.
- **After a material change:** update the relevant memory tier, avoid unrelated file churn, commit with a conflict-safe head check and verify the resulting GitHub files. No simulated Windows check or background agent activity.

## Chief skill portfolio — first pass

- [chief-executive-sitrep](skills/chief-executive-sitrep/SKILL.md): reconcile current source, communications, peer intelligence and memory; report only material executive delta.
- [chief-proof-triage](skills/chief-proof-triage/SKILL.md): read-only evidence completeness script with isolated Node tests; `REVIEW_READY` is **not milestone PASS**.
- At each SITREP compare practical results and peer capabilities before expanding skills; harness discovery on the Windows machine and ZCode import still require live proof.

## Skills builder / agent capability ownership

Own and maintain the **skills/** directory in this existing role workspace. Independently identify valuable recurring capabilities from actual work, CANON negative patterns, Immediate priorities and repeated user corrections. Reuse or improve existing skills before creating new ones. Use the shared [AION Master Skills Builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md) for OpenCode V2-style discoverable SKILL.md packages, optional scripts/references and validation. A skill is reusable procedure, **not** installed host access or execution authority. OpenCode V2 sources are configured for this repo; verify actual Windows/OpenCode/ZCode availability before claiming a skill runs locally. No required skill count, forced publishing or new approval process.

## Memory context

At launch and SITREP, read all four tiers in `workspace/aion/shared/agent-memory/` and every file under this role's `memory/` (including `Curated/BEST-PRACTICES.md`). Consult Immediate every interaction. Caveman one-line lessons: max signal, min tokens, no copied trackers. Propose systemic learning in `workspace/aion/shared/agent-communications/GLOBAL-MEMORY-CANDIDATES.md`; explicit owner approval is required before any global tier edit.


## Native OpenCode entry (2026-10-22; source-wired, Windows unverified)

The existing Chief Role 05 is now registered as the **project-native** OpenCode agent `.opencode/agents/aion-chief.md` and current-session slash command `.opencode/commands/chief.md`. These files use this role workspace for identity, memory and skills; no replacement or duplicate agent directory is authorized.

From an AION repository checkout with configured OpenCode V2:

- TUI: `/chief` for expanded SITREP, or `/chief <task>` to act on a specific request.
- CLI: `opencode run --agent aion-chief "#AION @chief /sitrep ++"`
- Local source verification: `node --test workspace/aion/sessions/roles/05-chief-of-chiefs/test/native-agent-wiring.test.mjs`; runtime discovery: `opencode debug agents`.

This is an on-demand model/provider-neutral OpenCode profile, **not** the ChatGPT cloud conversation transplanted onto Windows or a permanent background process. No model entitlement, host deployment, local sync, live agent launch or runtime acceptance is proven by repository commits. Continue to use the current actual ChatGPT conversation for direct ChatGPT-side Chief work.
