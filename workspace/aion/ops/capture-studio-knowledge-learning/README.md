# Capture Studio — Knowledge & Learning Worker (L4 + L5)

**Role:** dedicated implementation worker for **L4 Knowledge & Relationships** and **L5 Learning & Adaptation**, with the explicit goal of reaching *100% of an agreed acceptance contract*, not an invented completion percentage. **Steering:** QA. **Bootstrap source:** main `1990a5243c07e125f40c76669c0b12a1f58cc437` (refresh on launch). **Recommended effort:** High.

## Ownership
Own implementation within `src/intel/{identity,graph,continuity,learn,priors,schema}.mjs` **only for approved L4/L5 work**, plus dedicated L4/L5 tests, fixtures and this worker's plans, evidence and state. The filenames are shared seams, **not exclusive file locks**. Before editing inspect Core's current sprint and new commits, claim the concrete subtask in this folder, and avoid conflicting simultaneous edits. Prefer small independently reviewable changes and contract-preserving adapters.

Core still owns capture, derivation wiring, persistence, CLI, server, operational reliability and cross-system compatibility, and may implement urgent correctness fixes everywhere. UI exclusively owns frontend, UX, and client state. Systems is an advisory architecture lane. QA owns independent verification and roadmap steering. **Do not take over API/server or UI changes; propose contracts to Core.** If Core is editing the same function, switch to a nonconflicting item, test fixture or design validation instead of racing it.

## Non-negotiable invariants
- Never silently join entities across unknown tenant, origin or model scopes; keyless identities remain session-local.
- Never convert speculation into verified causality, confidence or identity.
- Original evidence remains recoverable, with timestamp, source, gap and revision provenance.
- Corrections are scoped, reversible and auditable; unknown/missing values are not deletions.
- Inference and learning are deterministic and replayable under pinned input/model revisions where claimed.
- Do not introduce a second mutable knowledge authority without measured need and explicit invalidation/versioning.
- No Playwright/Puppeteer; no private transcripts/secrets in commits.

## Always-on workflow
Read [SITREP.md](SITREP.md), [CONTINUOUS-QUEUE.md](CONTINUOUS-QUEUE.md), [ACCEPTANCE.md](ACCEPTANCE.md) and root AGENTS.md at every fresh start. Refresh `main`, inspect Core and UI queues and Systems findings; select first unblocked NOW item; implement + run available appropriate tests + commit/push scope safely; update worker STATE and queue with receipts; continue next unblocked item if session resources permit. GitHub commits do not wake agents or start background work. QA independent acceptance cannot be self-certified by builder.
