# VIVIM V1 — Clean-start product recommendation from Harness main

**Date:** 2026-10-25 · **Owner:** AION PRODUCT Agent, Role 15 · **Scenario:** Disregard Z.ai's delivered Round 1 UI and previous implementation rounds. Start with current `owenservera/vivim-harness` as product foundation. This is a product proposal, not an executed engineering change.

## The decision

**Build VIVIM as a persistent personal AI workspace before extending it as a better live chat client.** The first user value is to **keep, organize, find, understand, reuse and take away** source-linked AI work, even with no live authenticated provider connected. Add interactive Chrome once that local product is internally stable.

The source-grounded facts: Harness governing [ARCHITECTURE.md](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md) defines real AI webapp sessions, one CDP actor, explicit consent, source capture/replay and cautious uncertain sends. The proposed [V1 integrated app blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) defines a user-owned AI workspace around this runtime. [Universal chat projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) already models native content, provenance and identity. These are foundations, **not proof** of the complete personal world described here.

## First complete experience

A user launches VIVIM, sees saved locally available work, opens a rich conversation containing source links and artifacts, attaches a useful passage/artifact to a named project, adds a personal note, searches it later, closes/restarts the app, sees it again, exports selected project records and restores them in a clean local installation. **No real ChatGPT/Claude account and no new interactive Chrome code required to prove this internal workflow.**

This is the product's first concrete sovereignty demonstration, not a screenshot or data-model milestone.

## Product shape: six visible destinations, one local source of meaning

- **Home:** recently used projects, saved conversations, activities and truthful connection/coverage states.
- **Conversations:** readable full rich parts, citations, images/files/artifacts, status/unknowns; link to original provider thread separately.
- **Projects:** user's folders/collections/associations and annotations across providers, not copied transcripts.
- **Knowledge:** source-qualified reusable notes/entities/relationships; explicit user assertion vs captured fact vs inferred claim.
- **Search:** matches from local saved objects, scoped filters, evidence links and visible coverage limits.
- **Export/Restore:** selected portable structured content with manifest, identity, provenance and safe exclusions.

Future **Work / Commands / Agentic file library** should remain discoverable vision-level core capabilities, but implementation must not delay the first complete locally useful journey. The [two recovered toolkits](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/15-product-to-market/core-library) are preserved as product candidates.

## The hardest design contract (MAX decision)

Separate **four distinct records**:
1. **Captured evidence:** immutable original observations, sessions and receipts, owned by existing Harness capture/replay.
2. **Derived view:** normalized rich reading projections, extracted knowledge and search index; rebuildable from evidence when possible.
3. **User-owned overlay:** projects, tags, notes, saves, corrections, favorites, relationships and explicit curation; durable, editable and backed up.
4. **External identity:** provider, account, native thread, browser binding and time-bound session with verified/unknown link state.

Do not equate an operational conversation-service snapshot with a complete archived transcript. Do not infer account equality from a URL/title or permit interpretation to overwrite observed evidence. Technical storage engine, schema, framework and dependencies are implementation HOW decisions; optimize for *better, faster, less garbage*.

## Minimal implementation sequence (outcome gates, no imposed tech stack)

| Gate | Demonstrable outcome | Product acceptance |
|---|---|---|
| G0 — Source reality | Current Harness main inspected with actual feature map and test receipts | No legacy work assumed merged; existing components and gaps identified |
| G1 — Read | Fixture/evidence-backed heterogeneous conversation opens through one product UI | No plain-text flattening, false identity or misleading connected badge |
| G2 — Own | Save/bookmark artifact or message, add/edit note, assign a project | Human changes persist separately from raw evidence |
| G3 — Find | Search saved work and navigate back to exact original source | Search coverage and inferred knowledge transparently labeled |
| G4 — Recover | Restart and export selected project, import to clean installation | Content/source lineage survives; no tokens/cookies/private raw captures in portable bundle |
| G5 — Stabilize | Whole internal workflow reliable with negative/partial-write/migration tests | Integrated local app is coherent; only then unlock new Chrome work |
| G6 — Connect | Extend existing Harness CDP/authorized provider actor with real site interactions | Controlled Chrome Linux tests; owner-authenticated/Windows tests separately labeled |

Work is not divided into mandatory Z.ai round numbers. Z.ai or any implementer owns the LOW/MED/HIGH HOW, choosing relevant dependencies and parallel work organization. Product Agent/local models own MAX product boundaries and risky arbitration.

## Discoveries to leverage without blindly transplanting HOW

- Existing Harness: `src/studio/ui/universal-chat.mjs`, `src/studio/ui/chat.mjs`, `src/capture/conversation-service.mjs`, `src/store/`, `src/intel/`, `src/export/`, `src/studio/server.mjs`.
- Donor `vivim-final`: rich content types, human-first onboarding, saved knowledge/project UX. Compare individual behavior rather than importing its React/Next runtime or a second CDP actor automatically.
- Donor `vivim-platform`: personal ACU and conversation/project taxonomies, distinguish underlying what from legacy Rust/PWA stack.
- Donor `claude-export-hub-vivim`: selectable export UX; not proof of full VIVIM import.
- Existing [116-signal discovery atlas](discovery/VIVIM-CAPABILITY-ATLAS.yaml) and [18-cluster value chain](discovery/V1-VALUE-CHAIN-CROSSWALK.yaml) hold alternative WHAT/WHY/WHERE candidates; **BUILD OR HARVEST decisions are later**.
- Recovered semantic command and agentic naming toolkits are valuable but shouldn't create parallel execution authority.

## What I would explicitly NOT do first

- Build a beautiful onboarding wizard before the user can save and reopen work.
- Implement a second renderer, knowledge engine, database *authority* or browser actor merely because a donor contains one.
- Force a fixed framework or dependency-free ideology.
- Start full interactive Chrome testing, provider drift adaptation, multiple live providers, P2P sync, social publishing, infinite canvas or full CLI/MCP parity before the local internal product works.
- Call snapshots, README checkmarks, mocked provider responses or donor capability counts verified live acceptance.

## Biggest known failure traps

1. **MAX:** Identities: local VIVIM conversation versus provider thread/account and captured session.
2. **MAX:** Durable user annotations versus immutable source evidence versus rebuildable projections.
3. **HIGH:** UI shell feels complete but reads only in-memory fixture/list data.
4. **HIGH:** Renderer flattens rich content, invents support or drops unknown blocks.
5. **HIGH:** Search claims universality but indexes only one source collection.
6. **HIGH:** Export exists but import, rekeying and safe exclusion are not tested.
7. **HIGH:** Multi-agent implementation yields independently green features but no complete user journey.

## Recommendation

The **first engineering job** is not creating new capabilities. It is taking one real Harness-compatible saved/captured example and proving the entire **read → save → organize → find → restart → export/import** journey. It tests whether VIVIM is truly a product. Everything else is a subsequent multiplier.

**Product choice:** Start with local knowledge ownership; external browser is an attachable realization. **Not** approval to abandon Harness's provider-webapp vision. Real webapp interaction is the next phase after the internal world earns reliability.

**Assignment:** This is a Product Agent MAX-level proposal, not a Z.ai implementation prescription. Treat source findings as evidence and design HOW independently.
