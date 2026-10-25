# CFA-03 — M1 Semantic / Identity / State / Terminology Crosswalk

> Date: 2026-09-27
> Classification: CFA-owned bounded crosswalk; not a universal ontology and not Ω law.
> Current main during M1 work: 5675dafd9da30855b3ddcd91402df51a2f054755

## 1. Plane crosswalk

| Plane | Meaning | Owner dimension | Status | Contrast |
|---|---|---|---|---|
| WorldModel | bounded derived grounding/self-knowledge model | World/self-knowledge input | CURRENT / DERIVED | not canonical World or data authority |
| Grounding | resolution of mention/reference to World subjects or candidates | World ↔ Semantic Continuity | CURRENT / DETERMINISTIC | not authorization |
| Interpretation | deterministic command meaning/result | Semantic Continuity | CURRENT | not execution |
| Canonical IR | executable-semantic interpretation shape | Semantic Continuity | CURRENT / DERIVED | not permission |
| Intent | persisted requested-goal artifact | Intent seam | RATIFIED D-411 | not Work |
| Authority decision | current permission evaluation | Authority | RATIFIED / CURRENT | not meaning |
| Plan | execution-oriented decomposition/version | Intent/Work seam | CURRENT / SCOPED | not user text |
| Work | durable execution lifecycle | Work | CURRENT / PARTIAL continuity | not parser result |
| Evidence | material supporting claim/derivation/result | evidence/data plane | CURRENT | not authority |
| Context assembly | cited bounded evidence window | context substrate | RATIFIED / CURRENT | not WorldModel |
| VisualSpec | deterministic projection of Interpretation | Representation | CURRENT / DERIVED | not second grammar |
| Self-description | human/agent-readable derived description | self-knowledge | CURRENT / DERIVED | not authority |
| CANON | bounded terminology/crosswalk instrument | CFA-03 | PROVISIONAL | not universal ontology |

## 2. Identity crosswalk

| Identity dimension | Example | Meaning | Must not become |
|---|---|---|---|
| Semantic identity | concept/meaning reference | what a concept means | durable record ID |
| World reference | subjectRef/entity ID | addressed World subject/candidate | permission |
| Record identity | namespace + id | durable record | semantic equivalence |
| Revision identity | record + revision | durable version | new semantic identity by itself |
| Intent identity | intent:<hex> | canonical requested artifact | authority |
| Plan identity | plan type/version | immutable plan revision | user intent |
| Work identity | work_* | durable execution lifecycle | semantic interpretation |
| Attempt identity | attempt record | execution occurrence | authorization |
| Evidence identity | provenance/evidence reference | supporting material | permission |
| Authority citation identity | authority/invocation/standing refs | historical/live authority corridor reference | current permission without re-resolution |
| Representation identity | visual/surface reference | projection/edit artifact | canonical meaning |

M1 relation principle:
semantic meaning ↔ World reference ↔ record/revision ↔ Intent ↔ Plan/Work/Attempt ↔ evidence ↔ representation

These are explicit relations, not one universal identifier.

## 3. State crosswalk

| Dimension | Representative values | Answers | Does not answer |
|---|---|---|---|
| Interpretation | empty / ok / partial / ambiguous / unknown / invalid | did semantic interpretation resolve? | may it execute? |
| Grounding | resolved / ambiguous / stale / unresolvable / conflicted | what World reference is supported? | may actor cause effect? |
| Confidence | numeric | candidate ranking | proof |
| Epistemic status | OBSERVED / INFERRED / ASSUMED / VERIFIED | relation to evidence | authority |
| Intent resolution | UNDERSTOOD / AMBIGUOUS / REFUSED / EXECUTED | resolution evidence | current permission |
| Authority | allow / deny / require-consent + live standing/delegation state | may effect occur now? | command meaning |
| Risk | READ / MUTATION / EXTERNAL_MUTATION / ENGINE | effect class | permission by itself |
| Intent lifecycle | submitted … executing … terminal | requested artifact lifecycle | external proof |
| Work lifecycle | work/run/attempt states | execution lifecycle | semantic interpretation |
| Freshness | current / stale / unresolvable | basis currency | truth or authority |
| Representation | projection fields / badges / token roles | what is shown | canonical authority |

Critical non-equivalences:
confidence ≠ proof
evidence ≠ authority
grounding ≠ authorization
Intent ≠ Work
authorization ≠ execution
representation ≠ canonical meaning
stale ≠ nonexistent
unknown ≠ failed
refused ≠ nonexistent

## 4. Terminology collision map

### T1 — NCLL vs NLCL
Use Natural Command Language Layer (NCLL) for the architectural capability. Retain nlcl-pure as implementation/package lineage. Do not broad-rename.

Status: PROPOSED / bounded.

### T2 — compiler vs interpreter
Use interpreter for the deterministic interpret(text, world) stage. Use canonical semantics for the normalized semantic result. Reserve compiler for an explicitly defined representation-to-representation transformation.

Status: PROPOSED.

### T3 — WorldModel vs World
Use World for domain/world semantic ownership. Use WorldModel for the bounded derived runtime grounding/self-knowledge projection.

Status: DERIVED / CURRENT.

### T4 — self-knowledge / self-description / snapshot / portrait
Use self-knowledge as the umbrella semantic category; snapshot for bounded state view; portrait for unified explanatory view; control.describe for bounded API description; self-description for the representation of such knowledge.

Status: PROPOSED / BOUNDED.

### T5 — grounding / resolution / binding
Use grounding or World reference resolution for mapping a mention to World candidates; command interpretation resolution for NCLL outcome; Intent resolution for D-411 resolution rows; authority resolution for live permission.

Status: PROPOSED.

### T6 — canonical
Always qualify: canonical semantics, canonical Intent, canonical record identity, canonical writer path. The word canonical does not mean universally authoritative.

Status: PROPOSED / HIGH-RISK TERM.

### T7 — confidence / proof
Confidence ranks candidates. Proof/verification establishes a property under a defined test/probe. Never merge them.

Status: CURRENT / INVARIANT.

### T8 — evidence / authority
Evidence supports a claim. Authority determines what may occur. A cited authority record is not current permission without required live re-resolution.

Status: CURRENT / INVARIANT.

### T9 — representation / semantic truth
VisualSpec, symbols, labels and text are projections. They do not become semantic authority merely because they are visible.

Status: CURRENT / DERIVED.

### T10 — Intent / Plan / Work / Attempt
Intent = requested goal artifact.
Plan = execution decomposition/version.
Work = durable execution lifecycle.
Attempt = execution occurrence.

Status: CURRENT / BOUNDED; complete live semantic continuity remains PARTIAL / UNKNOWN.

### T11 — trace / provenance / evidence / citation
Trace = derivation or replay path.
Provenance = lineage relationship.
Evidence = supporting material.
Citation = reference used by a contract to connect an artifact to supporting or authority material.

Status: PROPOSED / BOUNDED.

### T12 — stale / unknown / failed / conflicted
Stale means a previously valid basis no longer matches.
Unknown means insufficient knowledge.
Failed means an attempted process did not succeed.
Conflicted means incompatible claims or paths coexist.

Status: DERIVED / CURRENT.

## 5. Symbol-family lineage

The 17 family symbols in contracts/src/lang.ts remain current. Historical SVG symbolism is input to future representation design, not a source of new semantic authority.

Safe rule:
symbol/glyph → representation of a canonical distinction
never:
symbol/glyph → new authority state

## 6. M1 decision gates

1. Do not create identity infrastructure until explicit relations prove insufficient.
2. Do not finalize grounding shape before World-side state/evidence semantics are accepted.
3. Do not finalize Plan/Work continuity before the Work and Authority corridors are verified.
4. Prove one visual semantic round-trip before broad visual implementation.
5. Promote terminology only when meaning, owner, authority and lineage are clear.

## 7. M1 open decisions

- final multi-step Plan/Work continuity;
- exact generalized freshness basis;
- final durable relation vocabulary in implementation;
- supported visual-edit classes and round-trip invariant;
- Event/State first-class identity question;
- whether product-facing use of self-knowledge should remain the umbrella term.

## Conclusion

One meaning, many representations; many identities, explicit relations; current permission remains live; evidence remains evidence.

No new semantic database or second grammar is justified by M1.
