# Sprint 03 — Core: Trusted Knowledge Foundations

**Steering authority:** QA / owner requested full next sprint. **Basis:** main `64f1ee89a6a7e46628f037e74bfbcc6a1f662de3`, Systems `ASSESSMENT-01.md` and post-assessment delta. **Status:** queued for next Core session, not executed.

## Mission
Make entity identity, derivation completeness, historical evidence and read-only knowledge contracts trustworthy enough for UI's next investigation workspace. Preserve raw source and current CLI/API compatibility.

## Ordered delivery
1. **Provisional identity correctness (highest priority).** Inspect and repair same-session missing/null/invalid inferred-key EID collisions, including graph `Map<eid>` and continuity grouping. Explicitly distinguish provisional vs keyed identities; retain deterministic behavior, rederive/version compatibility and never merge keyless entities across sessions.
2. **Derivation outcome truth.** Distinguish successful-empty entities, never-derived, failed derivation, incomplete/corrupt dataset; expose explicit persistent success/presence metadata rather than relying solely on an entities file. Surface truthful API stats without breaking existing clients.
3. **Review-only knowledge interfaces.** Stabilize origin-qualified entity IDs, provenance, type-drift hints and existing history/graph read-only routes. Provide UI-readable contract examples and explicit unknown/partial status. Preserve no-auto-drift-merging.
4. **Historical correction contract.** Implement a minimal explicit representation for removed/retracted/unknown attribute state if safely additive; otherwise deliver a precise versioned contract and smallest viable implementation boundary. No inferred deletion from absence.
5. **Measured resource behavior.** Benchmark continuity by sessions/entities/revisions, including `eid` lookup and truncation; implement the smallest evidenced improvement (avoid extra mutable truth authority).

## Verification and closeout
- Appropriate Core-owned unit and contract checks for identity collision, successful-empty vs missing vs failed, origin/tenant negatives, timestamp/history/field removal, contract shape and request safety. State exactly which runtime was used; independent QA remains separate.
- Deliver small compatible commits, refresh main before writes and no force pushes. No Playwright/Puppeteer.
- Record shipped functionality, tests, exact SHAs, changed API semantics and untested Windows/Chrome gaps; update the continuous queue. Pull next unblocked item when done.

**Coordination:** UI may proceed independently on read-only endpoints and mock proposed shapes; Core owns all server, CLI, entity, graph and storage changes. Systems proposals are inputs, not acceptance gates. Avoid asserting same-origin means same account.
