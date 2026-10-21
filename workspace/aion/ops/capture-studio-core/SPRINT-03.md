# Sprint 03 — Core: Trusted Knowledge Foundations

**Steering authority:** QA / owner requested full next sprint. **Basis:** main `64f1ee89a6a7e46628f037e74bfbcc6a1f662de3`, Systems `ASSESSMENT-01.md` and post-assessment delta. **Status:** CORE source slice delivered on 2026-10-21; independent QA and Windows acceptance outstanding.

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

## 2026-10-21 — CORE source delivery and receipts

The user explicitly requested full priority-driven development. This is a **source-build checkpoint**, not an independent QA certification.

| Ordered objective | Delivered implementation | Status |
| --- | --- | --- |
| 1. Provisional identity | `identity.mjs` generates distinct `:p:` provisional EIDs for missing/invalid inferred keys, preserves known string-key EIDs, reports an unscored identity basis. `continuity.mjs` quarantines duplicate EIDs already present in legacy datasets instead of overwriting within-session history. | Source delivered. Cross-session keyless still forbidden. Numeric-vs-string legacy keyed EID compatibility remains an open migration risk. |
| 2. Derivation outcome | `derive.mjs` writes `KNOWLEDGE_STATUS` (deriving / complete / failed) with completed entity count. A complete zero-entity derivation is not mistaken for never-derived. `continuity.mjs` rejects unreadable, in-progress, count-mismatched and missing expected datasets; separately reports legacy unverified data. Old `sessionsWithoutKnowledge` still includes incomplete IDs for existing UI warnings. | Source delivered. No immutable hash of derived JSONL yet. |
| 3. Knowledge surfaces | Existing continuity shape retained; additive `sessionsSuccessfulEmpty`, `sessionsIncompleteKnowledge`, `sessionsLegacyUnverified`, `legacyEidCollisions` statistics. Read-only `GET /api/sessions/:id/knowledge-status` and `knowledgeOutcome` on session details, under existing authentication/Host/Origin guards. | Source delivered, not browser-accepted. |
| 4. Historical correction semantics | Explicit per-revision `removed: [field]` supported by `foldRevision`, `TemporalGraph.stateAt` and longitudinal `asOf`. Missing field without a recorded removal keeps prior value. No removal is inferred from a missing observation; no mutation workflow exposed. | Additive primitive delivered; actual correction-authoring workflow remains open. |
| 5. Measured resource behavior | Entity-details avoid folding and copying *unrelated* histories while preserving global counts and review-only drift hints. | V8 mock-storage benchmark only; real Node/filesystem and Windows workload benchmark remains. |

**Additional origin-isolation fix:** `64a46a6f` adds an optional exact-origin filter to the internal continuity reader; `dd8f28e8` passes the selected origin from the authenticated API; `fa5e0152` scopes CLI output identically; `fa3566ce` adds the ninth Node regression case for distinct hosted subdomains. This prevents a selected `alice.github.io` recording from listing saved `bob.github.io` evidence in ordinary UI/CLI use. Internal callers omitting `origin` retain the previous site-wide audit semantics. A V8 source-loaded mocked session check passed this origin filter; it is not live account separation proof. `b953ba65` hardened explicit removal-field normalization. `26667b95` updates the Core API contract documentation.

**Source receipts (all GitHub remote):**
- `1990a524` — distinct provisional identities
- `dce582ee` — explicit deriving/complete/failed marker including successful-empty
- `f65efd8d` — continuity completeness and legacy collision isolation
- `9c2f6425` — revision folding primitive
- `fd3ac226`, `ef9f4dc2` — graph and continuity explicit removal
- `a29baa1a` — old UI completeness warning compatibility
- `ee6ad38a`, `286dd37c` — authenticated read-only derivation status API and GET restriction
- `a1fb455d`, `0f6ff3c4` — nine executable Node unit cases committed (not executed in this GitHub-only environment)
- `6db122e5` — entity detail history materialization optimization

**Executed verification available from this interaction:** Source-loaded V8 behavior checks with a deterministic hash stand-in and mocked session storage: provisional-ID and graph isolation; explicit temporal removal; same-origin joins and cross-origin nonjoins; historical as-of; successful-empty vs deriving/count-mismatch; legacy duplicate IDs; review-only type drift and UI-compatible missing-data warnings. Module and test-file syntax parsed in V8 after stripping imports. V8 stub behavior is **not** Node SHA-1, Node filesystem or browser acceptance.

**Resource sample:** 50 mocked same-origin sessions × 100 entities × 5 revisions = **5,000 source entities and 25,000 revisions**. After change, four V8 mocked-storage executions were full list [83, 83, 77, 71] ms and single-EID detail [49, 41, 39, 43] ms (reported middle sample 83 and 43 ms). Earlier unoptimized mock sample was ~70 ms for detail; tests were not controlled disk benchmarks, so no real-world speed claim. The scan is still linear in saved derived data; no persistent secondary authority added.

**Known boundaries and next implementation:**
- Same-origin does **not** establish account/tenant identity. Never silently join across explicit tenant conflicts; identify reliable namespace evidence before claiming multi-tenant safety.
- Numeric `42` and string `"42"` can still share an old keyed EID hash. Changing the global key encoding is a derived-ID migration with potential dependent-link breakage; no silent mass migration was performed. Design a versioned compatibility/alias plan before changing key format.
- Explicit `removed` is a controlled semantic operation, not inferred from absence or automatically populated by capture. Versioned correction-authoring and rollback remain for a later slice.
- A `complete` entity count plus parseable JSONL detects torn/truncated lines and missing rows, not all possible same-count content corruption. A verified dataset digest is a future integrity extension.
- Separate QA must execute the committed Node tests and independent regression campaign, then the authorized Windows/CDP/real-site acceptance. Never claim those passes from this source checkpoint.

**Next Core pull:** preserve trust across numerical/typed keys and same-origin tenants without breaking existing IDs; design a confirmed namespace/versioning scheme. In parallel, a real Node disk benchmark and correction-authoring contract are independently unblocked. 
