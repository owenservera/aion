# P2 — Data & Knowledge Contract for VIVIM V1

**Date:** 2026-10-25 · **Product authority:** AION PRODUCT AGENT (Role 15), performing P2 specialist analysis · **Status:** P2 source-grounded proposal complete; not an implemented schema or owner-approved migration · **Effort:** MAX conceptual ownership/identity decisions; subsequent implementation may be HIGH or MED.

**Scope:** Current `owenservera/vivim-harness` main, not Z.ai's detached Round 1 bundle. P1 defines four journeys: RETURN, ORGANIZE, FIND, TAKE ([P1](../../P1-V1-PRODUCT-SHAPE-2026-10-25.md)). No other workstream, browser test, implementation, migration or external connector is authorized in P2.

## ERA 1 — Confirmed source behavior and boundaries

**Source evidence (read on 2026-10-25; paths are current-default-branch references, with inspected blob SHAs):**

| Subsystem | Observed implementation | Why it matters to the contract |
|---|---|---|
| [`capture/conversation-service.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-service.mjs), blob `3f78251056100efc7eb214caabf7a046ddab2aba` | Explicit one-conversation service instance, persisted lifecycle snapshots, turn/attempt journal, preflight/submit/reconcile and uncertainty safeguards | Operational Work/effect journal, **not** proof of complete local human-readable conversation |
| [`capture/conversation-runtime.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-runtime.mjs), blob `8aa8d1ff8592e309e3da46f1da027669ad489616` | Binds adapters, tab targets, captured sessions, conversation services, read/connect methods | Runtime binding is transient; provider account and native thread require independently qualified evidence |
| [`capture/conversation-thread.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-thread.mjs), blob `b1d502ad24ed3852febd58e4ce2e5f8c6c047f2c` | Recognizes only observed ChatGPT `/c/<uuid>` pattern, with identity states `bound/unbound/unverified`, bounded reads | A URL, tab title, unfamiliar provider route, or absent thread ID cannot establish universal conversation identity |
| [`store/session.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs), blob `cbbd469ed345720b63a8d71ec5ffdbe13cc11de4` | Session storage triad: append-only raw evidence, append-only JSONL datasets, local KV and session metadata; sparse derived indexes | Capture session is evidence custody, not a user project; session KV alone does not specify user-editable world semantics |
| [`store/raw-log.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/store/raw-log.mjs), blob `58e2c5d56953e60265361948c133646d7134d9c2` | Raw segmented append-only records, manifest/hash/index, bounded memory and explicit gap records | An incomplete capture must remain visibly incomplete; raw origin must not be silently rewritten |
| [`store/versioned.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/store/versioned.mjs), blob `e2df7184188d92577f465162a483b4d93b118bdd` | Immutable version snapshots + CURRENT, CAS, locks, rollback-as-new-version | Potentially useful pattern for safe user edits; its presence does NOT decide physical overlay implementation |
| [`studio/ui/universal-chat.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs), blob `0237ee33c4c3ff1683f71195bf8b1675437a8dea` | Provider/thread projection distinguishes tab and account index; known native block types, evidence reference display, unknown fallback | Preserve typed content and source uncertainty at product boundaries; UI projection is not durable personal world state |
| [`intel/identity.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/identity.mjs), blob `77e4a2f6e9351b63723a21fd7829c0f4bae1b04f` | Keyed and probabilistic keyless entity matching with scope/provenance | Probabilistic semantic linkage is not permission to coalesce saved conversations or provider accounts |
| [`intel/continuity.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs), blob `788bbdad73b6b1aede1f4d40d77d624b03cb914a` | Read-through cross-session view; joins only explicitly keyed identities in proven site/type scopes; scope-unknown remains session-local | Excellent precedent: source-grounded, conservative linkage rather than arbitrary global merging |
| [`intel/corpus.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/corpus.mjs), blob `9285156306906f39d38392cbc6df44a469bcd338` | Corpus samples retain session/stream/sequence/time/DOM provenance | Search results must retain enough origin to navigate back to evidence when available |
| [`intel/search.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs), blob `425dc57a44c41cd26b90895889876fb3d2535049` | Incremental removable BM25-style corpus index; records and query filters | Search index is a derived view, not independent source of authoritative user edits |
| [`export/export.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs), blob `153236fe122ee62ed949b7fdc1e891d9ce463f15` | Read-only session/dataset/transcript/knowledge/graph/bundle exporters | Portable personal-world **import and round-trip** are not proven by existence of exporters |
| [`studio/conversation-api.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/conversation-api.mjs), blob `5bc123a5ef2008071cd3d4597d042f3a066acde2` | Thin current-lifecycle API, explicit request validation | Existing routes may be reused; no implication that all personal-world operations already have endpoints |

**Evidence level:** inspected source text and exported contracts; no P2 unit tests, full-suite run, installed Windows run, Z.ai code assessment, account session, migration or import/restore runtime proof. The product objects below are **proposals**, not a declaration of existing source behavior.

## ERA 2 — Proposed minimal semantic contract (storage-agnostic)

### A. Authority domains: four kinds of truth

**T1 External provider identity (observed references, not our property).** Provider, independently supported account identity, native thread key (where observed), origin and time-bound browser attachment. Status: `verified | unverified | unavailable | conflict`. A provider's own remote truth remains external. Never infer same account from same registrable domain, browser tab, title or similar text.

**T2 Captured source evidence (immutable original).** Capture session + layer/stream/sequence/time + raw record, manifest, checksum and gap coverage. Evidence may be partially inaccessible or sensitive. Preserve original bytes/records and explain missing ranges; do not mutate the original when a user corrects something.

**T3 Derived projections (rebuildable where inputs exist).** Message ordering, rich content, parsed citations, search tokens, graph relationships, summaries and source-qualified knowledge suggestions. Each projection identifies the inputs and transform/version used. A re-derivation must not destroy user-authored annotations.

**T4 Durable user-owned information (user authority).** Projects, item associations, bookmarks, notes, user-assigned titles/tags, corrections, explicit selections and redactions. These must survive process restart, reindex, reconciliation and intentional reimport. Do not disguise a correction as an edit to raw provider output.

**Critical distinction:** a user can legitimately edit a *personal note* about a message; they cannot retroactively cause captured source evidence to have said something else. A source-derived record can be upgraded to better evidence but its old lineage remains inspectable.

### B. The minimum entity set and relationships

These names describe **contracts**, not mandatory tables, files, APIs or modules. Physical layout belongs to later implementation HOW.

| Object | Identity and minimum fields | Invariants / ownership |
|---|---|---|
| **LocalWorld** | Local namespace/owner, schema version, independent local object IDs, export origin ID where available | One individual's local world. Exported IDs must not be misused as current-account credentials or assumed globally authoritative |
| **ProviderAccountRef** | Provider identifier, opaque locally known account key if verified, state and evidence pointer for its provenance | Never make account equality from provider name or origin alone. Unknown account is not a wildcard matching every account |
| **NativeThreadRef** | Provider/account scope, native thread key if directly observed, origin and observation interval, verification state | A tab/URL is attachment evidence; unknown thread stays unknown. Same native key under different confirmed accounts must not automatically merge |
| **CaptureSessionRef** | Existing capture session ID, source format/revision, available evidence ranges and gaps | Refers to evidence custody, not local conversation identity |
| **Conversation** | Stable **local** ID, human-visible title, ordered messages/parts, source-ref associations, creation/import and revision metadata | One durable user reading object, not a browser tab or active service attempt; multiple captured sessions may support one Conversation **only via explicit qualified linkage** |
| **Message** | Stable local ID, parent Conversation ID, ordered position/revision, role and status with confidence/source qualification | Exact provider-native message ID is optional; never synthesize it as "verified." Preserve alternatives/uncertainty from conflicting evidence |
| **ContentPart** | Stable local part ID, parent message, ordered index, kind/payload/opaque fallback, source/evidence and availability | Rich content is not flattened into a single text source; unrecognized kinds remain storable and identifiable. Pointers to unavailable file data remain visibly missing |
| **Artifact** | Stable local ID, content/item type, optional local binary/path/hash/reference, originating part(s), ownership/privacy and content-availability state | A screenshot/file/code artifact is distinct from the message that references it; content hash is not identity of the user-owned artifact |
| **Workspace** | Stable local ID, user name and metadata, ordered association links to conversations, parts, artifacts and notes | Relationships are user-owned; deleting an association should not delete raw evidence or original conversation automatically |
| **KnowledgeItem / UserNote** | Stable local ID, content/claim, type `user-authored | derived | sourced`, references, revision and confidence/approval state | Derived claims are not automatically verified facts; a user edit to an AI-generated suggestion yields a distinct user-owned revision/annotation |
| **EvidenceRef** | Evidence namespace/session + layer, record range(s)/seq(s)/stream/time, manifest/hash where available, coverage and access state | Must identify the observed original or declare `missing/unqualified`; avoid inventing sequence numbers or raw byte offsets |
| **WorkAttemptRef** | Local attempt/turn ID, consent/target, effect/outcome states and journal reference | Captured action state is not source proof that the remote action completed; unknown effect remains unknown |

**Required links:** `Conversation → Message → ContentPart` ordered hierarchy; `ContentPart/Artifact/KnowledgeItem → EvidenceRef[]` as available; `Conversation → ProviderAccountRef?/NativeThreadRef?/CaptureSessionRef[]`; `Workspace → association[]` (not destructive ownership); `UserNote → target Ref`; `WorkAttemptRef → observed outcome/evidence`. All cross-domain links must preserve **basis + verification state**.

### C. Identity and matching — hard semantic invariants

1. **Separate namespaces:** local VIVIM IDs, source capture IDs, provider native conversation IDs and content hashes are different types. Never use one as another or infer equivalence by equal text.
2. **No unverifiable auto-merge:** title similarity, prompt overlap, same URL origin, browser target ID, nearby timestamps or embedding similarity can suggest candidates, never establish account/thread equality.
3. **Conservative source linkage:** a verified provider/site/account/thread key can support a linkage within a proven scope; only verified evidence establishes equality; unknown remains local. Keyless probabilistic identity from `intel/identity.mjs` is for suggestion/review, not default destructive coalescence.
4. **Imports do not confer authority:** an exported foreign local ID is a prior world reference; resolve/rekey into current namespace with an explicit mapping, preserving original namespace and provenance. Conflicting objects are not silently overwritten.
5. **Stable read objects:** rebuilding a derived index or renderer does not arbitrarily change user-stable object IDs, bookmarks or references. If remapping unavoidable, preserve redirects/migration receipt or surface unresolved.
6. **Revision awareness:** preserve message variants/incomplete streams instead of picking one guess and erasing uncertainty. Rendering order is separate from remote completion certainty.
7. **Never widen a verified account scope:** two accounts on the same provider may have colliding native identifiers and different privacy boundaries. Unknown account matches no account without an explicit validated decision.

### D. Persistence, recovery and portability (contract only)

- **Capture store:** authoritative for raw accepted evidence; original records + explicit gap markers, not a user annotation repository.
- **Operational journal:** authoritative for local action attempts, effects and reconciliation outcomes, **not** all native message content.
- **Personal overlay:** authoritative for user edits, workspace names/associations, bookmarks, tags and notes. Changes are atomic enough to avoid a note pointing to half-saved item; after interruption, restore prior valid state or explicitly mark an incomplete transaction.
- **Reading projection:** persisted or reconstructible locally, with stable IDs, source proofs and optional opaque/missing parts; must still open when remote provider is offline.
- **Search:** can be rebuilt from projected content + user overlay; content scope and freshness/index coverage are stated and user-visible.
- **Export:** owner selects objects and sees what will be included; structured versioned manifest, source/projection/revision relationships and optional self-contained sanitized content. Default excludes secrets, cookies, private browser profiles, raw auth headers and hidden unrelated data. Preserve missing-source qualifiers and known exclusions.
- **Import:** validates versions, object shapes, reference targets and hashes when present; disallows traversal and path injection; supports a non-destructive conflict outcome and clean-world restoration. Import is not proof of a linked live remote provider.
- **Delete:** removing an association, user note, local copy, raw capture and remote provider record are different operations with different consequences; V1 need only promise **unlink** and local user-owned item actions it truly implements.
- **Security:** user content may be sensitive even when no authentication cookie is present. Export selection/preview and local file boundaries matter even in a single-user app.

### E. Source qualification format (logical, flexible)

Every user-visible sourced item should be able to answer:
- **What is this?** `captured | derived | user_authored | imported`.
- **Where did it come from?** Provider/known account/thread (or `unknown`), local session and evidence pointer (or `not available`).
- **How complete is it?** `complete | partial | unknown` and source gap details where known.
- **When was it observed and/or edited?** Distinguish capture time from inferred publication time and from user edit time.
- **Is this assertion certain?** `verified_by_source | qualified_inference | user_claim | unverified`. **User claim is valuable personal knowledge but not proof of external truth**.
- **What can be done with it?** Read, user note, unlink, export as actual supported operations; external send/modify requires a separately authorized capability path.

### F. Ten-plus adversarial P2 cases (design acceptance)

| ID | Scenario | Required safe outcome |
|---|---|---|
| A01 | Two different provider accounts share a title and message text | Do not merge account/conversation; separate local IDs and source scopes |
| A02 | Two providers both produce native thread ID `123` | Different provider/account scopes remain distinct |
| A03 | ChatGPT native thread URL absent, changed or unrecognized | `unverified` thread; do not assign invented native key or use tab title |
| A04 | Two capture sessions contain duplicated streamed content | Recognize possible overlap without losing original observations or auto-merging user records |
| A05 | One raw capture segment contains a known gap | Project may render available parts with `partial` coverage; never report full fidelity |
| A06 | Provider emits rich unknown content type | Preserve opaque block/source ref with visible unsupported label, no silent flattening |
| A07 | Citation points to expired/unavailable URL, missing image/file | Keep reference and availability state; do not invent working URL or binary |
| A08 | User edits a note about an AI answer | Note revision changes, captured message/evidence remains byte-identical |
| A09 | User unlinks bookmarked passage from workspace | Bookmark/link disappears; original conversation and raw source remain intact |
| A10 | Reindex/replay produces changed derived knowledge | Preserve user annotations and prior source mapping; surface invalidated derivations |
| A11 | App crashes after writing project metadata but before adding item link | Recover either valid previous or complete coherent association; no phantom success |
| A12 | Import twice with colliding local IDs but different content | Non-destructive dedupe/rename/conflict reporting; no silent overwrite |
| A13 | Import contains `../` asset path, script URL or forged digest | Reject unsafe path/content and expose error without mutating unrelated local files |
| A14 | Export requested for one project but linked data includes cookies/private raw headers | Export excludes secrets and shows redaction/coverage summary, with no hidden extra material |
| A15 | Search indexed only a subset of stored captures | UI says local/indexed scope, does not claim complete history |
| A16 | Source claims an action was submitted, but no remote acceptance was observed | Work outcome remains attempted/uncertain; user library does not mislabel as completed response |
| A17 | An imported conversation names a different provider account that is signed into current Chrome | Import doesn't bind remote identity to current account or authorize provider actions |
| A18 | User correction conflicts with a new observed source revision | Present observed latest source and user correction separately, preserve provenance and revision |
| A19 | Two content parts have the same SHA-256 but different origins/permissions | Dedup storage may be considered, but ownership, access and citations remain distinct |
| A20 | Personal world is restored while one source capture is not included | Saved readable copy persists with missing-source notice; user notes and project links survive |

**V1 internal acceptance from P1:** J1 open saved rich content and reopen after restart; J2 save selected part into named workspace + edit note; J3 search both source and note and open right item; J4 selected portable export/import into clean world. At every step unknown identity and absent source remain honest. These are proposed test scenarios, **not tests run in P2**.

## ERA 3 — Product decisions, unknowns and P2 handoff

### Recommended MAX decisions now (subject to owner/P5 reconciliation)

1. **Adopt the four authority domains T1–T4** as the product semantic invariant.
2. **Adopt distinct typed ID namespaces and non-destructive, evidence-qualified links**; cross-provider account/thread auto-merge is forbidden absent verified identity.
3. **Adopt durable user overlay + rebuildable projections**; don't retrofit human corrections into source evidence or operational attempt journals.
4. **Adopt a versioned, selective export/import contract**, including safe default exclusions and collision behavior; physical file format undecided.
5. **Treat existing Harness components as evidence and candidate reuse**, not as completed personal-world functionality.

### Open decisions deliberately not taken in P2

- Which durable database/JSONL/SQLite/KV or object-store implementation best satisfies the above? **HOW, not selected**.
- Should locally imported conversations absent original raw capture be first-class `imported` records or wrapped in an evidence-like representation? Recommended first-class `imported`, but P5/owner should decide precise UX and source schema.
- Which assets need local byte custody versus durable references for V1 (e.g., image binaries)? Define the maximum first-user sample size and test fixture in P3.
- What exact identity evidence is sufficient to link **two real sessions from one provider account**? Need observed real examples and consent-aware account verification later.
- Whether local world can contain multiple human profiles in the future; out of scope for single-user V1.
- The physical export archive format, version compatibility period, import duplicate policy and local profile storage root.
- Any browser account authentication, live send or third-party sync; deferred until later stable integrated app gate.

### Owner of next work (none launched)

- **P3 Experience & Acceptance:** can turn this logical model into a user-flow specification and bounded fixture samples, but must not silently decide database or account matching.
- **P4 Local Harness Reality:** should verify whether the specific store/version/revision guarantees described here hold on the owner's machine and audit data corruption/resume behavior.
- **P5 Product synthesis:** reconcile this contract with P1 and any P3/P4 evidence before locking architecture and issuing a supplier brief.
- **Z.ai later:** choose implementation HOW and dependencies, then test the accepted contract. No need for a second browser actor or to copy donor backend schemas.

## Result

**P2 deliverable:** explicit authority and identity separation; minimum user-owned object relationships; storage-independent persistence/search/export/import semantics; 20 adversarial scenarios; current Harness source anchors; open MAX arbitration points. No code changes, no source migration, no Chrome/provider testing and no workstream other than P2 initiated.
