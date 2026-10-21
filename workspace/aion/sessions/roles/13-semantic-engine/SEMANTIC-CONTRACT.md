# AION Semantics — Source Reality, Contract & First Experiments

**Initial evidence pass:** 2026-10-21 · **Maturity:** source-inspected design, not Windows-tested or installed.

## 1 — Evidence reality map

| Source | Confirmed from source | Not established |
|---|---|---|
| [VOMEGA `symbols.ts`](https://github.com/owenservera/VOMEGA/blob/main/omega-baseline/plugins/vivim-nlcl-pure/src/symbols.ts) | 17 families: `/ @ # ! ? + - & $ * % ∆ ✓ = ^ ~ →`; alternate glyph normalization for Δ/✔ | That every possible family composition executes |
| [VOMEGA pure package](https://github.com/owenservera/VOMEGA/tree/main/omega-baseline/plugins/vivim-nlcl-pure/src) | `interpret(text, world)`, lexer, frames/grammar, grounding, semantic IR and token/effect projection are implemented as source | End-to-end AION compatibility or complete runtime |
| [VOMEGA Semantic Data Engine](https://github.com/owenservera/VOMEGA/blob/main/seed-docs/SEMANTIC-DATA-ENGINE.md) and [Runtime Laboratory](https://github.com/owenservera/VOMEGA/blob/main/seed-docs/SEMANTIC-RUNTIME-LAB.md) | Explicit design distinction among identity, world state, capability/realization, policy/evidence, lab experimentation | Adopted/live product architecture or validated lab |
| [AION 2026-10-20 VOMEGA harvest](../../../ops/chrome-relay/harvest/landing/sources/vomega/RETENTION-ASSESSMENT.md) | Pinned source analysis: 6 NLCL KEEP candidates, 5 ADAPT candidates, D1 validation/IR ideas; existing Bus V1/V2 retained | Runtime acceptance, Windows testing, virtual execution (D1 `executeVirtual` still stub) |
| [AION command-language adapter](../../../shared/command-language/protocol.json) | Versioned `aion.command-protocol/1` instructions for `#AION`, `@agent`, `+/sitrep`, `∆/sitrep`, etc. | A native ChatGPT-installed command parser or executor |

**Known failure to guard:** AION's VOMEGA harvest reports NLCL may label interpretation `ok` despite an unresolved Account. The semantic engine must require a separate declaration-grounded readiness validator. Do not transplant Omega's host/router/ledger as a second writer.

## 2 — One shared semantic meaning, distinct operational planes

```text
Human expression [natural language | symbols | corrected text]
  -> VOMEGA-compatible lexical/grammar interpretation, with alternatives and trace
  -> AION context snapshot [project, role, entities, capabilities, source versions]
  -> Grounded typed canonical IR [operation, targets, parameters, unresolved alternatives]
  -> Declaration validator [required fields, identity, account/session, effect, authority]
  -> AION capability/realization match + consequence preview
  -> Authorized plan/data handoff to existing AION Bus V1/V2
  -> Existing runtime/adapter dispatch -> observed receipts/evidence
  -> Explainability/correction/replay; feedback can amend meaning, never silently grant authority
```

**Invariant:** `intent != interpretation != ready command != authorized execution != observed success`.
**Capability identity** remains independent of implementation platform and mutable risk/consent policy. Version each mapping/evidence claim. Do not create another product bus, grant store, ledger, or independent parser authority.

## 3 — AION composition overlay (not VOMEGA parser behavior)

| AION expression | Intended AION profile | Source-defined primitive meaning retained |
|---|---|---|
| `#AION @SEMANTICS /SITREP` | scoped context refresh | tag, reference, operation |
| `#AION @SEMANTICS +/SITREP` | add missing or revised bootstrap stages | add + operation |
| `#AION @SEMANTICS ∆/SITREP` | reconcile existing context | change existing |
| `#AION @SEMANTICS ?/SITREP` | read-only status | query |
| `#AION @SEMANTICS !/SITREP` | run now within actual permissions | force/immediate, not bootstrap or permission bypass |
| `#AION @SEMANTICS */SITREP` | comprehensive bounded refresh | wildcard/all within scope |
| `#AION @SEMANTICS /BOOTSTRAP` | explicit full bootstrap | operation |

Literal aliases `@semantic` and `@semantics` resolve to this role only in AION's instruction profile. Never tell users these compositions are shipped in VOMEGA's runtime until a compatibility test proves it.

## 4 — Responsibility interfaces

- **Semantics (this agent):** canonical meaning contracts, symbol/grammar fidelity, source map, ambiguity and identity grounding, IR/validation acceptance tests, explainable correction and versioned semantic evaluations.
- **Development:** source implementation, integration with Bus V1/V2, actual tests, local execution and acceptance. No Semantics-issued runtime permission.
- **Integration + Harvest:** compatibility contracts and pinned donor evidence/adaptation without second runtime; provenance remains with existing landing files.
- **Toolsmith:** OpenCode V2/ZCode local skill discovery and harness evidence.
- **Research:** external standards, compiler/parser/ontology research when it changes concrete design decisions.
- **Planning/Chief:** scope or ownership conflict and prioritization. GitHub notes do not wake their conversations.

## 5 — Evidence-prioritized bounded experiments

1. **E1 Symbol fidelity:** machine-check 17 symbol families and normalized glyphs against VOMEGA `symbols.ts`; distinguish parser-supported from AION-instruction-only compositions.
2. **E2 Semantic equivalence corpus:** compare `#AION @SEMANTICS +/SITREP`, case variants, separated `+ /SITREP`, plain language, and negative cases against typed IR expectations, without asserting native VOMEGA support.
3. **E3 Readiness invariants:** unresolved Account/role, ambiguous entity, stale World, missing required parameter and authorization must each block dispatch, regardless of NLCL `ok`, `!` or `✓`.
4. **E4 One-bus adapter proof:** Development evaluates pure-compiler output against existing AION command contract, preserving one writer, effect locks, idempotency and observable receipts.
5. **E5 Correction and replay:** compare identical meaning across plain/symbolic inputs, document versioned choices and observable divergence.

**Acceptance scale:** source-read → static contract check → offline unit tests → local harness invocation → authorized end-to-end observed effect; never promote a lower rung by wording alone. No standing automation without a separate owner request.
