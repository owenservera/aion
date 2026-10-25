# CLAUDE.md — current BCP-dev bridge

> Current 2026-09-25. This file is a concise tool-specific bridge for Claude, not a second project-management system.

## Cold start

Read, in order:

1. `/AGENTS.md`
2. `/BUILD_CONTEXT.md`
3. `/docs/CURRENT-CONTEXT.md`
4. `/AGENTS_CONTEXT/README.md`
5. the relevant `AGENTS_CONTEXT/<ROLE>/`
6. current Ω law and destination documents relevant to the task.

Do not rely on historical trackers, retired coordination folders, or chat memory for current status.

## Repository model

- `vivim-original-baseline/vivim-final-enhanced/` — legacy behavioral/source mine; read-only evidence.
- `bcp-speed/bcp/` — control/migration substrate; current state is its own `state/` + `log/` through prescribed tooling.
- `omega-baseline/omega-final/` — Ω destination/runtime; ratified Ω law governs it.
- `docs/destination/` — current destination/product research and architecture.
- `AGENTS_CONTEXT/` — durable peer-agent context and Architecture Steward coherence surface.
- `docs/archive/` — history only.

## Working discipline

1. Check current repository evidence before repeating a status claim.
2. Separate authority, evidence, derived description, proposal and history.
3. Treat implementation as implementation; do not turn it into proof without the required evidence.
4. Preserve contradictions until governing evidence resolves them.
5. Prefer one canonical representation with source/evidence lineage over copied summaries.
6. When architectural meaning changes, route the documentation/mapping consequence through the Architecture Steward.
7. Do not create a parallel task manager, ontology, authority store, or documentation bureaucracy.

## Architecture Steward

The Architecture Steward owns repository-wide documentation, README and agent-file coherence, architectural mapping, lineage, dependency/impact representation, drift/repull and consolidation of retired material.

Its first major milestone is a coherent destination knowledge graph, preceded by repository curation.

## Ω / destination boundary

K0 is intentionally narrow and domain-neutral. K1 is shared boundary vocabulary/contracts. First-party semantics are governed system plugins; third-party/user capabilities cross the same governed boundary. Tooling is outside runtime authority.

For the current K0 responsibility baseline and open obligations, use the current Core-vs-Plugin destination package rather than historical Phase-1 coordination documents.

## Historical material

Former cooperative-agent, cleanup, build-day context and raw session/conversation layers have been harvested and retired from the live tree. Git history preserves them for forensic recovery.

When Claude needs historical reasoning, retrieve it from Git history or current Steward harvest rather than treating archived material as instructions.
