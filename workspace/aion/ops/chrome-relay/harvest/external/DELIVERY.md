# Nine external repositories — discovery and categorization delivery to AION Development

**Current direction (2026-10-20):** AION Development owns all runtime design, implementation, contracts and tests. The nine-repo worker's **initial role is discovery and categorization aligned with Development needs**, not supplier selection, code transplantation, P1 implementation or a competing architecture. [Development Master](../../DEVELOPMENT-MASTER.md) · [Development Index](../../DEVELOPMENT-INDEX.json) · [shared exchange contract](../EXCHANGE.md) · [live records](../EXCHANGE.jsonl).

## Observed status and custody
- All **nine** pinned donor trees have received a breadth-first source inspection; source ownership/roles are recorded in [REPO-ROLES.csv](landing/triage/REPO-ROLES.csv) and [FIRST-PASS-DEV-HANDOFF.md](landing/triage/FIRST-PASS-DEV-HANDOFF.md). This is **not** full exhaustive review of 2,484 imported files or all 19 P0 commands.
- Evidence-backed offers **AX-0016** (receive identity), **AX-0017** (cursor/transport/replay hazards) and **AX-0018** (safe-Send correlation test methodology) are **SOURCE_OBSERVED** only. No donor code, live app, or AION integration was tested in Harvest.
- **I0–I3 and AION owned implementation remain outstanding.** Reading a code path is not verification of AION compatibility.

## Discovery taxonomy and order

For each relevant `DEV-...` area, classify:
1. **AION need and current reality:** exact code/contract seam, accepted design gate, whether on main / candidate / design only / unknown, and existing proof tier.
2. **External finding classification:** `METHOD_PATTERN` (algorithms / architectural approach), `NEGATIVE_TEST_OR_FAILURE_MODE` (counterexamples, fixtures and hazards), or `SPECIFIC_PROTOCOL_CONTRACT_CANDIDATE` (actual documented, versioned interop surface and obligations). Multiple complementary options can coexist.
3. **Fit and limits:** pinned repo/ref/path, observed behavior, tradeoffs, provider/session fidelity, licensing/security constraints, and which AION-owned test or design question this might inform.
4. **Unresolved need:** `NO_APPLICABLE_FINDING`, `UNASSESSED`, or a sharply scoped follow-up. No forced primary donor, no import recommendation, no assumed readiness.

**Priority:** I0 identity/event-snapshot/terminal semantics → I1 read-only observer/IPC/cursor and coverage → I2 Send correlation and no-resend negative cases → later provider differences, lifecycle, files/attachments and specific native protocol questions. The 19-P0 rubric is a useful breadth view but must not delay relevant developer-facing discovery or AION source development.

## Delivery through the *one* existing exchange

Keep lane-owned detail in `landing/triage/`, reference the pinned source and evidence. Publish/update **one concise OFFER/GAP on the matching `topic`** in [EXCHANGE.jsonl](../EXCHANGE.jsonl). Optional `discovery_class`, `aion_capability_ids`, `protocol_contract`, `implementation_owner` and `adoption_status` distinguish reference intelligence from accepted AION source. A developer must be able to answer **what exists, what it teaches, where it fits, where it doesn't, and what remains unknown** without reading all donor source trees.

**Protocol candidates are selective.** A bridge's internal SSE cursor mechanism, a private endpoint, or a particular DOM journal is a *methodology*, **not automatically a standard or wire contract AION should adopt**. A true contract recommendation must name actual versioned protocol/spec endpoints, normative frame/identity semantics, interoperability need and authentication/fidelity/entitlement constraints; otherwise put `protocol_contract: null`.

**No transplant by default.** External code may be examined for methods, risks and test design, not incorporated in Development as normal Harvest output. Any exceptional external-code use needs a separate explicit Development decision, license/security review, and retained AION ownership.

## Current next source questions
- **AX-0016 / DEV-04:** categorize the exact conditions that distinguish valid bound conversation, message revision, epoch, response completion and ambiguity.
- **AX-0017 / DEV-06:** capture the potential silent replay-loss and ahead-of-stream same-epoch cursor faults as source-inspected negative scenarios; AION must prove its own contiguous replay/gap handling.
- **AX-0018 / DEV-08:** compare DOM confirmation and message-anchoring *methods*; private backend lookup is not interchangeable with an authenticated bound web thread.
- **AX-0004:** expand only those 19-P0 classifications that uncover actual developer gaps or differentiated methodologies/contracts; retain unsupported entries as UNKNOWN, not hypothetical new build scope.

The worker may autonomously organize investigations and use the existing [DELIVERABLES.md](workers/nine-repo/DELIVERABLES.md) and [WORKLOG](workers/nine-repo/WORKLOG.md); it does not own a product backlog, dependency queue, or runtime implementation. No Playwright/Puppeteer, no secret/cookie extraction, no unapproved live browser mutations, no re-cloning already pinned trees.

## Own-capture reuse mapping (2026-10-21)

**What changed.** [reference/capability-universe.csv](reference/capability-universe.csv) keeps all 105 rows with their original 8 fields, values and order, and gains three appended analytical columns: `own_capture_status`, `own_capture_refs`, `own_capture_caveat`. No new registry, no second capability database, no change to the 40-row planning catalog.

**Scope of assessment.** Own captures only — the three pinned trees already in the harvest capture tree: [vomega](../landing/sources/vomega/index.jsonl) (37 index rows), [vivim-omega](../landing/sources/vivim-omega/index.jsonl) (38 rows), [vivim-final](../landing/sources/vivim-final/index.jsonl) (27 rows). Their source files were **read**. No donor test, runtime, script or live browser was executed, and no donor code was imported. Everything below is a method, a hazard or a negative fixture — not an adopted contract and not live proof.

**Inventory derivation (exact, recomputed from the index files).** 102 index rows = 37 + 38 + 27. Independent on-disk artifacts = **84** (VOMEGA 31 whole-module copies + vivim-omega 26 byte captures + vivim-final 27 excerpts). The remaining 18 rows have no independent artifact: 6 VOMEGA `DUPLICATE_POINTER` rows (VM-CLI-0032…0037) and 12 vivim-omega `FLAGGED` rows (VO-GH-0016…0027). Removing the duplicate pointers leaves **96 candidates, of which 84 carry an artifact** — so 84/96, not 102. A duplicate pointer is not a second observation: VM-CLI-0036 and VM-CLI-0037 carry exactly the same git blob as VO-GH-0004 (`contracts/src/port.ts`) and VO-GH-0005 (`contracts/src/surface.ts`), so citing both sides is one lineage, not independent corroboration. The same rule applies inside vivim-final: VF-0008/0009, VF-0006/0007/0026, VF-0001/0002 and VF-0003/0004 share one upstream blob each.

**Row tally (exact, not approximate).** 105 rows = 40 catalog + 65 future, one primary status per row:

- 40 catalog rows → `not_assessed_this_pass` — nothing asserted or denied.
- 65 future rows → **8 `source_backed_method` + 11 `partial_reference` + 46 `no_applicable_finding`** (8+11+46 = 65, checked programmatically).

**Families** derived from the actual `scope` values in the file, not from any prior aggregate: **21** distinct scope families across the 65 future rows (account 3, agents 3, artifacts 4, automation 3, browser 2, conversation 6, evidence 1, export 1, files 3, generation 4, identity 2, integrations 3, memory 2, message 5, model 2, multimodal 8, protocol 3, receive 3, settings 2, tools 3, workspace 2) and **2** across the 40 catalog rows (CORE_BASELINE 29, EXISTING_REGISTRY 11) — 23 distinct in the file.

**Status semantics.**

- `source_backed_method` — an own-capture file contains a reusable technique for that operation. Refs point at the exact captured file under the common harvest root: `landing/sources/vomega/items/VM-CLI-NNNN/source/…`, `landing/sources/vivim-omega/items/VO-GH-NNNN/source/…`, `landing/sources/vivim-final/items/VF-NNNN/excerpt.ts`.
- `partial_reference` — the capture supports only part of the operation, or shows a hazard to reject; the caveat names the part.
- `no_applicable_finding` — no applicable finding **in the own captures**. That is a statement about the own-capture set only. It is **not** a claim about all nine external repositories or the wider ecosystem, and not a claim that the capability is unnecessary. These rows carry no refs, because no capture supports them.
- `not_assessed_this_pass` — catalog rows were not assessed here.

**Method is not a missing feature.** The strongest reusable patterns are redact-then-hash (the integrity hash is computed over the already-redacted bytes — the only bytes that exist), by-reference capture (a session cites its capture row and never embeds bytes), and world-digest stale-result negatives (a result computed against another World is refused). AION already owns the cursor/coverage contract, the PACK-01/02 journal fix, the passive classifiers and the Bus grants/ledger/no-resend. Nothing in this mapping adds an enum, a store or an authority.

**Limits to carry forward.** The D1 compiler is prompt.send-specific, not a universal runtime parser; its declared carrier is `params.prompt` to `route.provider` with the provider derived from the account (the pair may never disagree), and its execution path is a `NotImplemented` stub whose receipts are `SIMULATED`. Two captures are fail-open cases to reject rather than adopt: a contract with no declared risk binds as READ (ungated), and an unknown provider class is coerced to `SIMULATOR`. The strongest send-correlation material is a COUNTEREXAMPLE — a second send after reconnect — which AION's no-resend rule already forbids.

**This is not the 65-record crosswalk.** [crosswalk-ledger.jsonl](../landing/synthesis/crosswalk-ledger.jsonl) holds 65 records covering the existing Omega/Final capture set only. The 65 rows scored here are the `FUTURE_CANDIDATE` rows of the capability universe. The two 65s are unrelated, and neither is exhaustive.

**Validation.** Programmatic and local, data only: RFC4180 parse of the updated CSV; `semantic_id` unique across all 105 rows; the original 8 columns, values and order preserved row by row; every one of the 39 appended refs resolved to an existing file under the harvest root; status counts 40 / 8 / 11 / 46 checked exactly; `git diff --check` clean on both owned files.
