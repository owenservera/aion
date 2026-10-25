# Toolkit 01 — VIVIM Semantic Command System (Recovered Product Contract)

**2026-10-25 · PRODUCT Agent Role 15 · ADOPT AS CORE PRODUCT CAPABILITY · NOT SHIPPED.**

## 1. Actual recovered implementation and design lineage

| Layer | Existing owner and source | Evidence status |
| --- | --- | --- |
| Lexical symbol families and aliases | [VOMEGA `symbols.ts`](https://github.com/owenservera/VOMEGA/blob/main/omega-baseline/plugins/vivim-nlcl-pure/src/symbols.ts) | **Source verified:** 17 families + normalization `Δ→∆`, `✔→✓` |
| Lexer, grammar/frame extraction, grounding, interpretation, typed IR | [VOMEGA `vivim-nlcl-pure/src/`](https://github.com/owenservera/VOMEGA/tree/main/omega-baseline/plugins/vivim-nlcl-pure/src) | **Source present; not VIVIM-integrated proof** |
| Historical product / visual language research | [Command Symbol System](https://github.com/owenservera/VOMEGA/blob/main/harvests/old-vivim/symbolic/COMMAND-SYMBOL-SYSTEM.md), [Personal Agent Self-Knowledge and Command Language](https://github.com/owenservera/VOMEGA/blob/main/harvests/old-vivim/symbolic/PERSONAL-AGENT-SELF-KNOWLEDGE-AND-COMMAND-LANGUAGE.md), [Semantic Data Engine](https://github.com/owenservera/VOMEGA/blob/main/seed-docs/SEMANTIC-DATA-ENGINE.md), [Runtime Lab](https://github.com/owenservera/VOMEGA/blob/main/seed-docs/SEMANTIC-RUNTIME-LAB.md) | **Historical design**, not operational acceptance |
| Pinned AION recovery with retention assessment | [AION VOMEGA harvest](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/harvest/landing/sources/vomega/RETENTION-ASSESSMENT.md) | Evidence-qualified assessment from 2026-10-20 |
| AION-specific composition profile | [`workspace/aion/shared/command-language/protocol.json`](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/command-language/protocol.json) | **Version 0.1.0, 2026-10-21; instructions only**, not native VOMEGA grammar nor installed ChatGPT commands |
| AION semantic product/engineering boundary | [Role 13 SEMANTIC-CONTRACT.md](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/13-semantic-engine/SEMANTIC-CONTRACT.md) | Source-inspected design with explicit experiment/acceptance gates |

## 2. Preserve all 17 original symbol families

The definitions below are the **original VOMEGA glyph families**; AION's project/agent syntax *specializes* them without changing source meanings.

| Symbol | Family | Intended core meaning |
| --- | --- | --- |
| `/` | command | Invoke an operation |
| `@` | reference | Refer to a grounded entity |
| `#` | tag | Tag/label; AION leading project scope is a specialization |
| `!` | force | Immediate operation; never permission bypass |
| `?` | query | Ask/read |
| `+` | add | Create/include missing |
| `-` | remove | Remove/disable/exclude |
| `&` | combine | Compose/chain |
| `$` | value | Bind/reuse a value |
| `*` | wildcard | All within valid scope |
| `%` | config | Configure/tune |
| `∆` | delta | Update/reconcile existing state |
| `✓` | confirm | Confirm a pending action; only valid with actual authority |
| `=` | assert | Declare/teach semantic mapping |
| `^` | priority | Urgent/first |
| `~` | approximate | Fuzzy parse/search; never fabricate entity identity |
| `→` | direction | Route from source toward target |

**Aliases in source:** uppercase delta `Δ` normalizes to `∆`, heavy check `✔` normalizes to `✓`. Natural-language expansions are mutable lexicon data, not immutable parser operators. The source's `!` "skip confirmation card" concept is **not** approval to skip actual product authorization.

## 3. AION compositions: precise recovered state

These examples are in AION's versioned **instruction profile**, not guaranteed executable parser expressions:

| Composition | AION-specific interpretation |
| --- | --- |
| `#AION @CHIEF /SITREP` | Scope repo + role; refresh status |
| `#AION @CHIEF +/SITREP` | Add missing bootstrap elements when actually applicable |
| `#AION @CHIEF /BOOTSTRAP` | Explicit full bootstrap procedure |
| `#AION @CHIEF ∆/SITREP` | Reconcile existing context drift |
| `#AION @CHIEF ?/SITREP` | Read-only scoped status |
| `#AION @CHIEF !/SITREP` | Run now within actual authorization; **not** bootstrap |
| `#AION @CHIEF */SITREP` | Broad but bounded refresh |

Role aliases must be resolved against current registered agents; a string in the command does not conjure an agent, its software or privileges. Case normalization and spacing variants require explicit adapter tests.

## 4. VIVIM product surface (WHAT to preserve)

1. **One universal input:** plain spoken/written intention, compact symbols, or combinations — not a separate command-only application.
2. **Preview and correction:** show interpreted goal, grounded project/agent, chosen capability, targets, certainty and required approval; ask only about material ambiguity.
3. **Deterministic core:** visible typed IR for intent, proposed plan/effects, account/session identity, rationale, source versions and unresolved slots.
4. **Explicit effect boundary:** no mutation until authority/session/capability readiness is validated by existing VIVIM systems; compiler success `ok` does not imply dispatch readiness.
5. **Existing execution path:** send validated plan through existing authorized owner/bus into Harness runtime; no shadow browser owner, duplicate queue, grants database or journal.
6. **Receipts and provenance:** observed outcome, side-effect ID, retry/cancellation ambiguity and rollback/evidence linked to original command.
7. **Product integration:** reusable surface across desktop, PWA/phone, project, conversation and agent contexts; never assume those targets are already wired.

## 5. Known defect and non-negotiable acceptance checks

AION's [harvest](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/harvest/landing/sources/vomega/RETENTION-ASSESSMENT.md) explicitly documents an `interpret(...)` readiness mismatch: an utterance such as sending to Gemini may return an `ok` interpretation while no real compatible Account is grounded. Therefore maintain distinct stages:

```
user text/symbols
  → parse and explain candidates
  → ground current project / agent / account / concrete capability
  → declaration-derived required-fields and permission validator
  → explicit preview / approval if needed
  → EXISTING Harness authorized execution owner
  → observed journal receipt / error / ambiguity reconciliation
```

**Acceptance tests before "live":**
- 17 glyph names and alias normalization match VOMEGA source exactly.
- Plain text vs symbolized equivalent yields equivalent typed intent, with documented ambiguities.
- Unknown agent, account, target, scope, authority or stale context cannot dispatch even with `!`, `✓` or inferred selectors.
- `+` means add and `∆` change, with no destructive fallback or changed source semantics.
- An uncertain external effect never silently retries; side-effect/journal linkage proves exactly what happened.
- One end-to-end authorized Windows flow, including receipt and safe failure, is demonstrated in canonical VIVIM Harness. Unit tests and a remote commit alone do not satisfy that gate.

## 6. Product/engineering ownership

**This folder:** product interpretation, user journeys, accepted command contract and recovered-source links. **Role 13 Semantics:** versioned meaning/grammar/IR and compatibility claims. **`VOMEGA`:** original parser lineage, not automatically the new host. **`vivim-harness`:** any new production integration, tests and UI/API code after assessment; reuse existing effect/session owner. No more duplicate architecture stacks, parser forks, authorization stores or “autonomous” daemons.

**Current maturity:** historical implementation exists; AION mapping exists; VIVIM installed/validated compatibility **not established**.
