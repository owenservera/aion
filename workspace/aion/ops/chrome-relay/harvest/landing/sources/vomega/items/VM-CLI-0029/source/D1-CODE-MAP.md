# D1 factual interpreter code map

Claim class: **observed source map / D1-002 artifact**  
Observed branch basis: `work/pm/acceleration-adherence-20261006`  
Date: 2026-10-06

This artifact names the existing interpreter path D1 must **adapt, not replace**. It is a source map, not an architecture proposal.

## End-to-end path

```text
interpret(input, world)
  omega-baseline/plugins/vivim-nlcl-pure/src/interpret.ts
    ↓ lex(raw)
  lexer.ts
    ↓ recognizers OR matchFrames(tokens, world)
  grammar.ts
    ↓ fillFrame(...)
  grammar.ts
    ↓ ground / groundPhrase / resolveContext
  ground.ts
    ↓ Candidate { ir, requiredMissing, entityAmbiguous, contextUnresolved, ... }
  grammar.ts
    ↓ scoreCandidate + deterministic sort
  interpret.ts
    ↓ primary IR + close alternatives
    ↓ assemble(...)
  interpret.ts
    ↓ projectTokens / projectEffects
  project.ts
    ↓ Interpretation
  types.ts
```

The browser/server/package entry surface re-exports this same machinery from
`omega-baseline/plugins/vivim-nlcl-pure/src/index.ts`.

## Exact source seams

| Stage | Source | Existing symbols / responsibility |
| --- | --- | --- |
| top-level pipeline | `plugins/vivim-nlcl-pure/src/interpret.ts` | exported `interpret(input, world)`; private `scoreCandidate`, `assemble`; records `StageTrace`; selects primary + close alternatives; assigns interpreter status |
| frame recognition / slot construction | `plugins/vivim-nlcl-pure/src/grammar.ts` | exported `matchFrames`, `fillFrame`, `buildPayload`, `buildCanonical`, `buildReading`; exported `Candidate` carries `requiredMissing`, `entityAmbiguous`, `contextUnresolved` |
| grounding | `plugins/vivim-nlcl-pure/src/ground.ts` | exported `ground`, `groundPhrase`, `resolveContext` and prior-aware ranking helpers; resolves entities/context against `WorldModel` |
| semantic projection | `plugins/vivim-nlcl-pure/src/project.ts` | exported `projectTokens`, `projectEffects`; projects the selected semantic state, does not own a second language parser |
| contracts | `plugins/vivim-nlcl-pure/src/types.ts` | `WorldModel`, `IR`, `IRSlot`, `Interpretation`, `OpFrame`, `StageTrace`, visual projection types |
| public package surface | `plugins/vivim-nlcl-pure/src/index.ts` | re-exports `interpret`, grounding, grammar, projection, frames and types |
| release corpus | `plugins/vivim-nlcl/test/fixtures/release-use-corpus.json` | candidate `prompt.send@1` frame, synthetic Account worlds and regression cases |
| corpus runner | `plugins/vivim-nlcl/test/release-use-corpus.test.ts` | injects candidate frame for tests; checks target, payload, ambiguity, effect gate and determinism |
| D1 validator seam | `experimental/d1/src/validate.ts` | D1-004/005/006 stub: declaration-derived required fields and authoritative D1 readiness validation |
| executable D1 gates | `experimental/d1/test/gates/a-truth.gate.test.ts` | reproduces U1 and defines red→green proof for declaration-derived required fields and READY behavior |

Paths above are relative to `omega-baseline/` unless prefixed otherwise.

## Where U1 false-READY comes from

Release corpus case `U1` is:

```text
input:  send 'x' to Gemini
world:  three-accounts
expect: Account unresolved; status must not be ok
```

The current interpreter can produce a primary `prompt.send@1` candidate whose required
`account` slot is unresolved while its aggregate confidence still crosses the interpreter's
`ok` threshold. `interpret.ts` does lower status when its own
`Candidate.requiredMissing` / `contextUnresolved` survives to the primary candidate, but
the release case demonstrates that interpreter status is not a sufficient D1 execution
validator.

That is why D1 deliberately adds a separate **command validation** seam rather than rewriting
the interpreter:

1. D1-004 derives required/optional command fields from the source declaration.
2. D1-005 validates the interpreter result against those declaration-derived requirements.
3. D1-006 locks missing Account, missing payload and incompatible Account behavior with
   executable tests.

The fix must not special-case the string "Gemini" or corpus case U1.

## World boundary relevant to D1

`WorldModel` in `types.ts` is the interpreter's grounding input. It keeps:

- ops/capabilities available to the interpreter;
- groundable entities;
- lexicon/rules;
- current context;
- optional ranking priors and later capability/focus state.

D1's own World representation may adapt this substrate, but Provider, Account, Model and
Session identities must remain distinct. A prior can rank; it must not silently decide a
materially ambiguous Account.

## Projection boundary

`projectTokens` and `projectEffects` are downstream of semantic interpretation. They do
not get authority to reparse raw language or create hidden routing state.

D1's richer projector/VisualSpec should consume canonical/session semantic state and emit
semantic edits back through the same command path.

## D1 implementation rule

For D1-004 onward:

- **REUSE/ADAPT** this interpreter and corpus;
- keep the D1 validator declaration-driven;
- do not create a parallel parser merely to make D1 pass;
- preserve `Interpretation.alternatives` and unresolved grounding data where possible;
- when the first-release command semantics need a new frame, prefer contributed/versioned
  language data over another global hard-coded special case.

This file satisfies the documentation obligation of D1-002 only. It does not claim any
D1-004+ implementation or proof.
