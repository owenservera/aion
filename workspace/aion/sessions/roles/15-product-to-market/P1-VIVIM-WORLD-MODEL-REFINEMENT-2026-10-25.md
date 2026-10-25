# P1 — VIVIM local world versus inbound provider worlds
Date: 2026-10-25
Effort: INSTANT (owner-selected)
Scope: P1 only; conceptual product refinement, not P2 architecture or implementation.

## Governing idea
VIVIM owns the user's accumulated context. Each AI provider owns its native world. Harness observes and connects those worlds without falsely equating their objects or capabilities.

## Three conceptual layers
1. **VIVIM World** — independent user-owned projects, local conversations, knowledge, notes, artifacts, bookmarks, and cross-provider relationships.
2. **Harness Understanding Layer** — evidence-qualified provider structure, source identities, observed capabilities, coverage limits, temporal changes, and mappings to VIVIM objects. This is a conceptual responsibility of existing Harness, not authorization to build a new middleware subsystem.
3. **Inbound Provider Worlds** — each provider's native account, containers/projects if supported, threads, messages, content parts, attachments, permissions and operations. Structure varies by provider and can change over time.

## Five rules
- A VIVIM Project may link many provider accounts, projects, threads and artifacts; a native provider Project is not automatically a VIVIM Project.
- Preserve native terminology and structure where observed. No fabricated universal provider hierarchy.
- Relationships are observed, user-confirmed, inferred or unknown, with evidence/time/coverage attached. Inference never silently becomes observation.
- A local operation (e.g. export VIVIM Project XYZ) is not a claim of an equivalent provider operation (e.g. native per-project export).
- VIVIM can enrich, annotate and synthesize context while keeping the original captured evidence distinguishable.

## Phased understanding
- **W0 Represent, V1 Core:** retain known provider/account/container/thread/part relationships from existing evidence and typed unknowns, with no claim of complete provider history.
- **W1 Discover, after internal stability:** source-qualified read-only discovery of actual webapp structure, navigation, object relationships, coverage and available operations.
- **W2 Reconcile, incrementally:** map observed remote objects to local records with explicit ambiguity and provenance; user confirmation for uncertain joins.
- **W3 Operate, authorized later:** expose only validated provider-specific operations through the existing Harness effects authority, with preview and consent.

These are knowledge maturity phases, not rigid additional applications or four implementation teams.

## Journey implications
- **RETURN:** show original provider and known hierarchy without inventing missing project links.
- **ORGANIZE:** local projects may aggregate content from several unrelated native provider structures.
- **FIND:** search locally held data and show which providers/containers were actually covered.
- **TAKE:** export selected VIVIM-owned project objects and a coverage manifest; remote-only links and unavailable content must be disclosed, not silently represented as exported content.

## Product sinkholes
1. Semantic collision: same word, different provider object or operation.
2. False coverage: confusing locally observed content with a complete provider account/project.
3. Identity conflation: joining accounts or threads by title/URL similarity.
4. Action scope confusion: local rename/delete/export presented as remote operation.
5. Evidence drift: provider hierarchy changes over time and old mappings are treated as current.
6. Knowledge laundering: synthesized local conclusions displayed as provider-authored source.

## Minimal product acceptance examples
- One VIVIM Project links conversations from two distinct providers, retaining independent origins.
- A provider with no observed project feature gets no invented provider-project node.
- Rename/export a local VIVIM Project without touching remote accounts.
- Export manifest differentiates locally included content from remotely referenced/missing material.
- Unknown provider capabilities appear as unknown, not absent or supported.

## Ownership / status
This note refines P1 product intent only. It does not decide schemas, frameworks, migrations, storage engines, API contracts, browser actors or implementation HOW. P2–P6 remain unstarted. No Harness production changes are authorized.
