# ChatGPT Fresh-Agent Session Protocol

> Version: FSSP-1.3
> Date: 2026-09-27
> Scope: every new ChatGPT web-app conversation launched as an independent BCP-dev agent session.
> Status: PROPOSED / Steward operating protocol
> Authority: process protocol only; not Ω law and not semantic authority.
> Operating model: `CHATGPT-AGENT-OPERATING-MODEL.md`

## 1. Purpose

A new ChatGPT conversation is an independent **agent session instance**.

The repository contains the durable agent identity, state and lessons. The launch prompt is the task envelope for this one session.

The governing pattern is:

```
FRESH CHAT
→ BIND SESSION IDENTITY
→ VERIFY CURRENT MAIN
→ ENTER AGENT HOME
→ LOAD SESSION-CONTEXT
→ LOAD IDENTITY / SEED
→ LOAD STATE
→ LOAD LESSONS (when present)
→ LOAD RELEVANT AUTHORITY / PEERS
→ VERIFY PREDECESSOR
→ ASSESS EXECUTION STRATEGY
→ EXECUTE CHOSEN STRATEGY
→ VERIFY RESULT
→ PERSIST REQUIRED DURABLE CONTEXT
→ REPORT
```

## 2. Conversation-as-agent rule

The active ChatGPT conversation is the execution session.

Do not assume an external implementation agent exists.

If repository read/write capability is available, the session should perform the assigned work directly.

If a required capability is unavailable, report **BLOCKED** or **PARTIAL** with the exact limitation. Never invent a handoff, signature, commit, message ID, test result or repository change.

## 3. Durable source-of-truth hierarchy

Unless a more specific governing artifact says otherwise:

1. Ω ratified law.
2. BCP enforced state/vocabulary.
3. Current repository code/tests/evidence.
4. Current owner-aligned CFA identity and boundary artifacts.
5. Destination architecture/research.
6. Agent durable context and working artifacts.
7. Historical/archive material.

A prompt, chat transcript or conversation report does not outrank repository evidence.

## 4. Agent-home contract

A standing agent home is the durable operating memory of one role.

Expected structure:

```
SESSION-CONTEXT.md
CORE-AGENT.md            # or established AGENT.md
STATE.md
TASKS.md                 # persistent agent-owned work queue
LESSONS.md               # when durable lessons exist
OWNER-ALIGNMENT-*.md     # when applicable
IDENTITY-HISTORY.md      # when applicable
task / research artifacts
```

### Artifact meanings

**SESSION-CONTEXT.md**
- fresh-session front door;
- small and pointer-heavy;
- navigation only, not authority.

**CORE-AGENT.md / AGENT.md**
- durable identity;
- enduring responsibility;
- ownership and non-ownership;
- invariant/boundary references;
- authority references.

**STATE.md**
- current operating frontier;
- current unresolved items;
- recent durable progress.

**LESSONS.md**
- compact, cross-session operational memory;
- only lessons that materially change future behavior;
- not a transcript archive and not semantic authority.

**Owner-alignment / identity history**
- governance and lineage records, when applicable.

## 5. SESSION-CONTEXT requirements

Each session context should state:

- CFA / role;
- human-readable identity;
- agent_id;
- identity status;
- canonical workspace;
- durable identity artifact;
- current STATE;
- LESSONS when present;
- owner-alignment/history when applicable;
- relevant peers;
- current mission/frontier;
- unresolved seams;
- navigation pointers.

A last-known baseline SHA may be recorded for orientation, but it is informational only. **It never replaces verification of the current `main` tip.**

## 6. Fresh-session load order

### A. Repository

Read:

- `/AGENTS.md`
- `/BUILD_CONTEXT.md` if present
- `/docs/CURRENT-CONTEXT.md` if present
- `/AGENTS_CONTEXT/README.md`

Resolve the current `main` tip.

### B. Own home

Read:

1. `SESSION-CONTEXT.md`
2. `CURRENT-MISSION.md` when present; for the Architecture Steward this is the explicit current-phase / next-action artifact
3. `CORE-AGENT.md` or established `AGENT.md`; otherwise the current seed/design artifact
4. `STATE.md`
5. `LESSONS.md` when present
6. latest alignment/history artifacts as applicable
7. task-specific artifacts named by the task envelope

Read RECEIPTS.md; process any receipts whose commit is newer than LAST_VERIFIED_RECEIPTS_SHA; verify each against repository evidence; update status and LAST_VERIFIED_RECEIPTS_SHA.

### C. Relevant context

Load only the peers and Ω/destination authority needed for the current task.

Do not reconstruct the architecture indiscriminately.

## Repository-access and tool-selection gate

At fresh-session boot, determine whether connected GitHub integration/access is available.

When it is available, use it as the primary path for repository reads, current `main`/ref resolution, SHA verification, branch/commit inspection, and repository writes.

Do **not** use general web search to retrieve repository content merely because the task contains a GitHub URL. Web search is for external research/corroboration, or a repository fallback only when direct GitHub access is genuinely unavailable.

Do not conclude that repository access is unavailable until the connected GitHub capability has been checked.

## 7. Session identity

Every launch envelope should identify:

- `SESSION_ID`
- repository
- CFA / role
- identity
- agent_id
- workspace
- target branch/ref

Identity must be reconciled against repository evidence.

Never infer identity from:
- conversation title;
- Git author;
- branch name;
- user account;
- prior chat memory;
- folder name alone.

## 8. Boot receipt

Before substantive work, the session should establish:

```
SESSION_ID
IDENTITY
AGENT_ID
CURRENT_MAIN_SHA
IDENTITY_VERIFIED
PREDECESSOR_STATUS
```

This is a state check, not a semantic conclusion.

## 9. Verify predecessor claims

For every predecessor dependency:

```
reported SHA
→ verify on current main/ref
→ inspect expected artifact
→ validate expected semantic condition
→ continue only when satisfied
```

A report is a claim, not proof.

Do not silently skip a missing or contradictory predecessor.

## 10. Task envelope

The launch prompt is a **task envelope**, not durable memory.

It must contain:

- FSSP version/link;
- session identity;
- repository;
- workspace;
- target branch/ref;
- predecessor prerequisite when needed;
- read-first sequence;
- exact task;
- completion gate;
- non-actions;
- write/commit rule;
- report contract;
- STOP condition.

It should not copy the full architecture or repeat settled identity prose.

## 11. Owner dialogue

Owner dialogue is task-mode, not universal bootstrap.

Use it for:
- new identity/boundary alignment;
- unresolved owner policy;
- decisions repository evidence cannot determine.

Already-ratified identities are verified and reconciled, not repeatedly re-ratified.

## 12. Autonomous execution-strategy gate

Before substantive execution, the session must determine how the work should be executed from current repository evidence.

Assess:

- semantic dependency;
- authority/governance dependency;
- verified predecessor/read dependency;
- shared write-surface conflict;
- synchronization point;
- verification dependency;
- risk of parallel or out-of-order execution.

Classify the work:

- **INDEPENDENT** — work units can proceed without one another;
- **ORDERED** — one or more units genuinely require another's result first;
- **CONDITIONALLY DEPENDENT** — dependency exists only if an observed condition holds;
- **BLOCKED** — required authority, evidence, capability, or predecessor is absent.

The session must not infer dependency merely because a launch document, checklist, prior agent, or owner message presents work in an order. It must verify the dependency against the repository.

When work is independent, prefer safe parallelism. When only a subset is dependent, serialize only that subset. Distinguish semantic/authority dependency from branch/transport contention.

A healthy task may legitimately result in **no changes required**. Never manufacture changes or commits merely because the task was launched.

When the chosen execution strategy is not obvious, state the reason before acting.

## 13. Execution and write discipline

When writes are available:

- make only task-justified changes;
- preserve evidence and lineage;
- update durable context when future sessions need the information;
- verify changed files;
- commit to the specified branch/ref;
- report the exact resulting SHA.

Repository commits and refs establish repository lineage, not agent identity. GitHub username/committer is not agent identity; unless cryptographic attribution is separately verified, repository artifact authorship is an unattributed claim for Steward trust purposes.


For parallel sessions, use distinct write surfaces/branches where needed.

`main` is the shared synchronization point.

Never assume another session's uncommitted work exists.

## 14. Session result

A session produces:

1. repository evidence;
2. required durable state/lessons/history;
3. an exact commit/ref when changes occurred;
4. a completion report.

Do not create a transcript archive or session-log bureaucracy merely to preserve chats.

## 15. Failure states

Use the narrowest truthful status:

- `COMPLETE`
- `PARTIAL`
- `BLOCKED`
- `UNKNOWN`

A tool limitation is an environment fact.

A repository contradiction is a state/knowledge problem.

A missing owner decision is a governance stop.

Do not conflate them.

## 16. Commons discipline

Commons is communication state, not authority.

Only claim an operation when the available runtime/transport actually executed and its result is recoverable.

Never fabricate:
- identities;
- signatures;
- event IDs;
- message IDs;
- stream positions.

## 17. Completion report contract

Every substantive session returns the canonical report defined by AGENTS_CONTEXT/ARCHITECTURE_STEWARD/SESSION-RESULT-CONTRACT.md v1.1. That contract is the single source of truth for the field list and order. Report exactly those fields; do not add, remove, or reorder fields.

Every value must be evidence-backed.

## 18. Session handoff

Before ending a session, the agent must leave enough durable context for the next session to continue safely.

For every substantive session, the full completion report must also be persisted in the agent home as:

`<AGENT-HOME>/RESULTS/<SESSION_ID>.md`

See `AGENTS_CONTEXT/ARCHITECTURE_STEWARD/SESSION-RESULT-CONTRACT.md`. This repository receipt is the durable handoff surface. The session must not claim `COMPLETE` merely by returning a chat report.

## 19. Parallel conversation rule

Multiple sessions may coexist when the execution-strategy assessment establishes compatible independence.

For a given stable `agent_id`, parallel readers are permitted, but by default only one active publishing session may allocate the next Commons stream sequence at a time. This reconciles FSSP parallelism with `AGENTS_CONTEXT/AGENT-COMMONS/IDENTITY-AND-TRUST.md`: a publishing race must fail visibly rather than create competing valid events. Coordinated multi-publisher implementations must preserve one unbroken agent stream.

Each session must:
- verify current main/ref;
- maintain its own identity;
- avoid assumptions about uncommitted peer work;
- communicate through durable repository artifacts or genuinely supported Commons operations.

## 20. Anti-context-wall rule

Do not solve context loss by making prompts larger.

Use progressive disclosure:

```
SESSION-CONTEXT
→ IDENTITY
→ STATE
→ LESSONS
→ RELEVANT PEERS / AUTHORITY
→ TASK
→ EVIDENCE AS NEEDED
```


## Planning ownership and roadmap formation

A ratified domain agent is a **responsibility owner**, not merely a consumer of work selected elsewhere.

When a CFA's substantive work roadmap has not yet been established for the current planning stage:

1. the CFA must characterize its own domain frontier from repository evidence;
2. the CFA must propose/adopt its own bounded tasks in its persistent `TASKS.md`;
3. destination-wide programs, P1 workstreams, delivery cycles, prior Steward recommendations and historical launch queues are candidate inputs, not automatic mandates;
4. the Architecture Steward must not substitute a downstream implementation/product slice for the missing CFA roadmap;
5. after CFA roadmaps exist, the Architecture Steward reconciles them across boundaries and may derive a shared execution frontier.

Therefore a task state such as `CURRENT`, `READY`, or a named "next cycle" in a destination-wide plan is not, by itself, evidence that a particular CFA should execute that work now.

A roadmap-formation session is complete when the CFA has produced a durable domain roadmap, populated its task queue, classified relevant inherited plans, preserved unknowns/dependencies, and stopped without beginning production implementation.

The intended transition is:

```
HOME READY
→ CFA ROADMAP
→ CFA TASK QUEUE
→ CROSS-CFA RECONCILIATION
→ SHARED FRONTIER
→ EXECUTION
```

## 21. Protocol evolution

Fix the smallest layer that caused the failure:

- local operating lesson → agent `LESSONS.md` / `SESSION-CONTEXT.md`;
- task-envelope failure → shared launch template;
- repeated cross-agent execution failure → FSSP;
- semantic ownership failure → CFA reconciliation;
- owner-intent change → owner dialogue.

Do not introduce infrastructure merely to make one session easier.

## 22. Architectural success condition

A fresh session must be able to determine, without prior chat history:

```
WHO AM I?
WHAT DO I OWN?
WHAT IS CURRENT?
WHAT HAVE I LEARNED?
WHAT IS THIS SESSION TASK?
WHAT ARE THE ACTUAL DEPENDENCIES?
WHAT EXECUTION STRATEGY SHOULD I USE?
WHAT MUST I NOT DO?
WHAT PROVES COMPLETION?
WHERE DO I STOP?
```

That is the cold-start contract.


## Changelog

- FSSP-1.3 — 2026-09-27: added the Steward receipt pull/verification loop, standardized launcher-owned SESSION_ID handling, and made Session Result Contract 1.1 the sole completion-report schema.
