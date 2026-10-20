# VOMEGA → AION unified CLI: semantic engine preservation assessment

**Evidence status:** SOURCE OBSERVED / RESEARCH PROPOSAL, NOT ACCEPTED-FOR-SPEC or LIVE VERIFIED.  
**Captured:** 2026-10-20T11:35:17.493Z.  
**Source:** [owenservera/VOMEGA](https://github.com/owenservera/VOMEGA) pinned at `12c853259f60cf3a883c7fb1c9f329d696606d64` (main, 2026-10-14).  
**Deliberate exclusion:** all `elephant-greenfield-omega/`, `seed-docs/`, elephant/elephas tracks, historical large chat SVG transcript, and generated or private data. No Windows dependency, test execution, provider/browser actions, or donor edits.

## Executive disposition

**Adopt the VOMEGA NLCL language engine as the deterministic semantic compiler front-end for AION. Do not transplant the Omega CLI/host/router/port law as the AION runtime protocol.** AION Bus V1/V2 remains the single command authority, durable operation ledger, adapter and unknown-effect/no-resend owner. VOMEGA's parser produces candidate command *data*.

This is **not a green light to directly copy the entire VOMEGA command runtime**: its D1 compiler is partly specialized to `prompt.send@1`, the interpreter may report false `ok` when required Account is unresolved, and D1 virtual execution is still a stub.

## How much should survive?

| Component | Preservation decision | Why |
|---|---|---|
| **Pure NLCL** (11 modules) | **6 KEEP candidates**: `index, lexer, text, symbols, ground, project`; **5 ADAPT candidates**: `types, frames, grammar, interpret, recognize` | Retain its deterministic scan/semantic IR/grounding/preview, but fit AION's declarations, account and dynamic action state |
| **D1 declaration validator** | **KEEP-LOGIC, priority 0** | Structural required fields and identity readiness are independent of NLCL confidence |
| **D1 canonical UseCommand + digest** | **ADAPT, priority 0** | World/source revision, explicit Account, unresolved alternatives, semantic identity and authority requirement |
| **D1 InterpretationSession** | **KEEP-PATTERN** | Revision lock, old-result suppression, typed/clicked correction converge on same semantic edit |
| **D1 custom compiler** | **SELECTIVE ADAPT** | Built for first-release prompt.send phrasing; avoid a second hard-coded language path |
| **Omega `surfaces/cli`** | **REFERENCE ONLY** | Explicit argv/JSON `call`, `msg`, `consent`, `status`, `daemon` then `router.callAsRoot`; not a NLCL→verified-runtime protocol |
| **Omega execution host/port** | **DO NOT TRANSPLANT** | AION already has bus/grants/idempotency/ledger; parallel runtime introduces conflicts |
| **Old symbolic harvest** | **REFERENCE + DUPLICATE POINTERS** | Vision documents only; four code copies match baseline Git object hashes |
| **Simulator / browser provider** | **REJECT as live proof** | `executeVirtual` still throws `NotImplemented(D1-063)`; only simulated provider evidence |

**Quantification:** the 6/11 and 5/11 figures are *module counts* for reuse triage, not verified drop-in compatibility or line-percentage. The harvest indexes **31 original whole-file copies** plus **6 byte-identical Git-object pointers**. Reuse must pass new AION tests before implementation acceptance.

## Evidence-backed command pipeline

```text
Explicit CLI args, symbols, or free-form text
                   │
      pure VOMEGA lex + NLCL interpretation
          (tokens, IR, slots, alternatives, stage trace)
                   │
      AION-scoped World snapshot / command resolver
    provider ≠ account ≠ model ≠ session; explicit target
                   │
     D1-derived required-field and identity validator
   unknown/stale/ambiguous cannot be READY; explanation
                   │
      Versioned AION canonical semantic command
    op + args + intended target + context/version refs
    command digest + consequence + approval requirement
                   │
           AION authorization + grants
      current action availability, unique control, no
      unresolved side-effect lock, evidence freshness
                   │
       AION Bus V1/V2 (one durable writer)
   existing RESERVED/DISPATCHED/SUBMISSION_OBSERVED/
    REPLY_CHECKED/UNRESOLVED/REPORTED transitions
                   │
          Approved provider adapter / observer
                   │
      one result/receipt → CLI + panel + MCP + phone
```

This creates one semantic command protocol at the **command contract** seam, **not another external communications bus**. The language compiler is pure and runs before any side effects. The runtime does not trust NCLL `status='ok'` or symbol `!` or `✓` as consent.

## Critical findings and negative evidence

**1 — Native NLCL is real and portable:** `omega-baseline/plugins/vivim-nlcl-pure/src/index.ts` exposes `interpret(text, world)`, `lex`, grounder, grammar, projection and 17 symbol families, with no imports outside that package. `vivim-nlcl/src/index.ts` calls `mind.snapshot@1` and returns interpretation data only; it never executes the returned IR.

**2 — The pure parser cannot be the execution readiness gate:** In `interpret.ts`, `ok` is based on heuristic confidence plus the candidate's required-missing flags. The test corpus explicitly preserves U1: `send 'x' to Gemini` can yield `ok` without grounded Account. The corrected D1 `validate.ts` recomputes required fields from declarations and blocks without a World/realization/compatible Account/authority. Adopt that split.

**3 — D1 chose to fork part of parsing, so consolidation is required:** The `experimental/d1/src/compile.ts` header states that the shared lexer and grounder were adapted but direct `interpret()` was rejected for the D1 journey because generic frames and natural registration phrasing were inadequate. Avoid installing both parsers as equal authorities. Reuse the D1 declarative validator and compiler ideas, then integrate under one canonical semantic pipeline.

**4 — Semantic command identity is valuable:** D1 `contract.ts` separates draft/command, Account/Provider/Model/Session, World revision, unresolved fields, realization, authority requirement, consequence and `expectedEvidence`. `compile.ts` derives a deterministic digest that excludes presentation-only correction mechanics and consent decision. Map those fields onto AION's existing command and immutable operation key rather than creating separate operation ledger.

**5 — Revisioned edits provide shared CLI/UI behavior:** `session.ts` is a pure state × Action reducer. Parsed text and UI chooser actions converge on typed semantic edits, with stale result suppression. Adapt draft-scoped revisions, not D1's simulated executor.

**6 — Existing Omega CLI is operationally different:** `surfaces/cli/src/cli.ts` parses `call <op> [json-args]`, `msg`, `consent`, `plugins`, `status`, `daemon` and calls the host router as root. It does not demonstrate a universal natural-language to validated UseCommand to AION-style operation lifecycle. Preserve command-line ergonomics and JSON output patterns only.

**7 — Streaming and grants already have an AION home:** VOMEGA `omega-baseline/contracts/src/{port,surface}.ts` are byte-identical Git objects to the earlier `owenservera/vivim-omega` donor. AION already has `extension/src/bus/{contracts,grammar,registry,ledger,grants,validate}.js` and `ENVELOPE-CONTRACT.md`. Do not double-count identical donors or replace the bus.

**8 — No proven live provider Send:** VOMEGA `.project/REALITY.md` explicitly denies live `prompt.send`. D1 `execute.ts` is `NotImplemented` and `expectedEvidence=SIMULATED`. Committed `.project/evidence/d1-ratchet.json` is historical: its 59/95-green probe points to `ef9497329e67`, **not** this `12c85325` commit; this harvest executed **zero** tests. `release-use-corpus.test.ts` uses `test.failing`; a green suite can still include accepted failures.

## Candidate stable AION CLI API (proposal, not implementation)

| Operation | Example CLI | Source of truth |
|---|---|---|
| Inspect available commands | `aion capabilities --json` | AION registry + current contextual readiness |
| Interpret text/symbols | `aion interpret "/send 'hi' → @chief" --json` | Pure NLCL, no side effects |
| Compile plan | `aion plan "send to Claude Work" --json` | Canonical command + unresolved alternatives + validation |
| Correct explicit target | `aion choose <command-id> --account <id>` | Semantic edit on versioned draft |
| Dispatch approved command | `aion execute <command-id> --confirm` | AION grants, bus lock, adapter |
| Observe proof | `aion status <operation-id> --json` | AION operation ledger, no-retry semantics |
| Explain command | `aion explain <command-id>` | NLCL stage trace + live evidence + authority requirement |

**Result type:** `CommandInterpretation` (candidate IR), `CommandValidation` (ready/needs-choice/needs-info/unavailable/refused), `CanonicalCommand` (versioned semantic intent), `OperationReceipt` (durable bus evidence). These are projections/contracts to reconcile with existing AION schema, not instructions to create four new databases or a second scheduler.

## Transfer tests, prioritized

1. Unknown Account U1 and missing payload never READY, irrespective of interpretation confidence.
2. Two Claude accounts remain ambiguous; priors cannot choose automatically.
3. Explicit `Work` cannot be retargeted by words `Personal` inside quoted payload.
4. Typed `use Work` and clicking Work produce equivalent command digest; stale revisions are rejected.
5. Unknown command, stale World, unavailable realization, disabled or ambiguous browser Send block before dispatch.
6. `! /send`, `✓`, `^ /send` cannot mint grants or bypass owner approval.
7. AION `UNKNOWN_EFFECT` / UNRESOLVED operation never retries Send, including through an NLCL restatement.
8. CLI and panel produce the same canonical command payload and route through the same ledger; same text on distinct authorized invocations can still be distinct operations.
9. Trace/status surfaces show original evidence, freshness, ambiguity and error stage without marking simulated or inferred effects LIVE_VERIFIED.
10. Existing O1/O2/G1 release corpus failures stay visible until fixed and independently verified.

## Recommended implementation order

**M1:** Pin the source contract and adapt 6 pure NLCL modules into a read-only `interpret` package; run corpus with known red cases explicitly reported. **M2:** Port declaration-derived validation and canonical UseCommand/digest; prove account ambiguity and no false READY. **M3:** Bind AION registry and current action observation to a scoped World adapter; map corrections to a single semantic draft state. **M4:** Wire CLI and panel into the existing AION Bus with existing grants and no-resend; no parallel Omega runtime. **M5:** Run negative and transport recovery tests before any promotion or live external Send.

AION's current `DUAL-TRACK-COMMAND-PLANE-2026-10-19.md` names one per-user AIOND service and no second bus; this harvest proposes the **semantic front-end as one reusable library** within that shape, without changing AION's existing specs in this research PR.
