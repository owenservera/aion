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
