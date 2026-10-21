# Capture Studio — Systems Deep Assessment 01 (SYS1–SYS6)

**Date:** 2026-10-21. **Lane:** Systems / Algorithms / Usability. **Repository:** `owenservera/aion`, main. **Source checkpoint:** `90fc6aa19e0b6b3378943a768a08cd53c9e108ac`. **Evidence class:** static source tracing and existing dated QA receipts only; **no new tests executed**. This report is advisory; it does not change Core/UI/QA ownership or impose delivery gates.

## Executive determination

The product has substantial capture, raw evidence and replay mechanisms, plus a real derived-intelligence pipeline and a first continuity UI. The central discontinuity is **identity × semantics × time × provenance**: generated identifiers can collide, a domain is not a verified account boundary, historical folds cannot represent removals, and UI labels must not turn conservative inferences into verified facts. Continue incremental vertical slices; prioritize preservation of meaning over building another knowledge database.

**Freshness delta:** While this assessment was underway UI shipped source commits `33da29e`, `097bd5e`, and `90fc6aa`: keyboard-operated session filtering/mobile layout, provenance-oriented continuity rendering, and concurrent selection/error-state guards. These are real source changes, *not* browser QA or Windows acceptance. Core's delivered identity guard `cc536481` and contract `229678df` remain the latest identified relevant backend changes. The standing QA roadmap is steering context, not a test receipt.

## SYS1 — Seven layers and four vertical threads

| Layer | Source-grounded state | Why incomplete |
|---|---|---|
| L1 Capture & Observation | Substantial: CDP network, DOM, actions and replay | Real-site/Windows completeness not independently accepted |
| L2 Evidence & Memory | Substantial: raw segmented log, gap/integrity accounting, session datasets | Provenance and completeness do not automatically survive every derived transformation |
| L3 Interpretation & Derivation | Wired: corpus, schemas, discovery and priors | Corpus can thin samples; some heuristics retain only 400 events/stream; semantic drift unjoined |
| L4 Knowledge & Relationships | Wired but partial: resolver, graph and read-through continuity | Same-session missing-key EID collision, weak scope and type drift |
| L5 Learning & Adaptation | Partial: scoped learner and calibration | Cross-process stale writes and end-to-end correction/reversion semantics need validation |
| L6 Behavior & Reconstruction | Partial: historical graph and action/render correlations | Explicit removal/retraction, process state transitions and reconciliation loop incomplete |
| L7 Experience & Control | Real UI/CLI/API, current UI improvements | Coverage and identity provenance must remain legible; user correction still partial |

**Vertical threads:** (1) identity across sessions and representations, (2) time/evidence, (3) meaning/semantics, (4) feedback/correctability. The separate foundation is local runtime, CDP, privacy, storage, packaging and recovery; it is not an eighth intelligence layer. Use a traceable event→entity→revision→UI journey as a cross-layer acceptance illustration.

Sources: [derive](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/derive.mjs), [corpus](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/corpus.mjs), [identity](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/identity.mjs), [graph](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/graph.mjs), [continuity](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs), [Studio UI](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/ui/index.html).

## SYS2 — Identity correctness, adversarial scenarios

### F1 — HIGH, source-determined mechanism: missing-key EID alias *inside one session*

`resolveType` gives each absent key its own `__missing_<instance hash>` cluster. `buildEntities` then generates the final EID from `String(inst[0].obj[type.key.field])`, which is identical `"undefined"` (or `"null"`) for different missing-key instances of the same type and site. The entities remain distinct **rows** in the returned array, but share their final EID. `buildGraph` uses `Map<eid,node>`, so distinct histories can land in the same node. `buildSiteContinuity` isolates non-joinable records *across sessions* yet groups all records with the same `['session',sessionId,eid]` key **within one session**. The `cc536481` guard handles cross-session collisions, not this underlying collision. The result can be mixed attributes, misleading entity totals and lost graph distinctness.

Adversarial input: same inferred record type, same site, two observations `{id: undefined,title:"A"}` and `{id: undefined,title:"B"}` with different provenance. **Expected:** two independently addressable provisional identities; **source-derived risk:** same EID and folded graph/continuity output. Not runtime-executed.

**Suggested Core remedy:** missing or invalid key => explicit provisional/keyless identity path with per-observation/session-scoped EID and `identityBasis` that never asserts a valid key. Preserve old EID compatibility via versioned derived-data rebuild/alias mapping; avoid silent graph migration. **Verification suggestion for QA:** construct two missing-key records and inspect resolver entities, graph node count, continuity entries, then rederive and compare.

Source: [identity: buildEntities/resolveType](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/identity.mjs), [graph: Map/upsert/buildGraph](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/graph.mjs), [continuity: groupKey](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs).

### F2 — HIGH, architectural risk: site scope cannot prove tenant or hosted-site identity

`siteFromSession` uses `siteOf(host)`; `siteOf` returns the last two labels except for a small hard-coded multi-suffix table. Thus unrelated `alice.github.io` and `bob.github.io` can both be scoped to `github.io`, while same-domain accounts on an ordinary SaaS origin cannot be distinguished either. If type and key match, downstream keyed join can be proposed as exact site identity with no tenant evidence. This is a *conditional incorrect-join path*, not evidence that a private user account leaked.

**Suggested Core remedy:** fail closed for unverified multi-host aggregation; prefer exact origin/host by default plus explicit stable account/tenant namespace when observable. Only cross-host merge with user-visible positive evidence. If registrable-domain policy is needed, use a maintained public-suffix mechanism instead of a partial hard-coded list, but **PSL does not solve multiple accounts on one domain**. Offer a migration/compatibility story for previously site-scoped EIDs. **QA:** two hosted subdomains with identical type/key; same-origin different accounts; legitimate same-account across sessions.

Source: [profiles.siteOf](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/profiles/profiles.mjs), [continuity.siteFromSession/safeJoin](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs).

### F3 — MEDIUM, predictable false splits and typed collisions

`discover.mjs` derives a type ID from `group|path` and can choose different representative types after within-session merges. A changed endpoint/discriminator/path can split a genuine entity across sessions; `schemaSimilarity` / `schemaDiff` are present but not wired to continuity as reviewable alignment hypotheses. Conversely, resolver grouping stringifies values, so numeric `42` and textual `"42"` can alias when their declared meaning differs.

**Recommendation:** treat source type ID as an observation-type version; propose a separate reviewable canonical semantic mapping, retaining source type, source key, scope and evidence; never automatically rewrite previous EIDs or silently fuzzy-join. Consider typed key canonicalization. **QA:** renamed field/path, numeric/string key pair, and reversal of a proposed alignment.

Sources: [discover.buildType](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/discover.mjs), [schema alignment](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/schema.mjs), [identity.resolveType](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/identity.mjs).

## SYS3 — Temporal truth and provenance

### F4 — HIGH semantic limitation: absence is not retraction

`buildEntities` records changed **present** fields, retains prior attributes across partial observations; `TemporalGraph.stateAt` and continuity `attrs` fold values via assignment. Thus an absent field cannot mean deletion or removal without an explicit operation. This is deliberately conservative, but a current UI presenting old attrs as a complete latest state would overclaim. Source deletion/rederive changes the read-through view; it is not an immutable independent longitudinal archive.

**Invariant:** maintain separate `observedAt`, `validFrom/validTo` only when justified, `learnedAt`, event sequence, provenance and status. Unknown timestamps never imply epoch zero. Missing data never means deleted; explicit removal should be its own typed event and reversible decision. Present as-of state as *state supported by observations at/before T*, not guaranteed actual truth at T.

**Source positives:** `graph.stateAt` now excludes undated edges, `setEdgeStatus` retains timestamped status history, and continuity includes timestamp-sorted revision provenance. Historical independent QA at `8218e6c`: 6 tests, 3 passed/3 failed for undated edges/rejection history. Later code changes exist but the recorded six cases have not been independently rerun on this source checkpoint. No runtime pass claim.

**QA suggestions:** future edge hidden at earlier T; rejected relationship still historically present before rejection; same-T tie determinism; missing/untimed evidence, explicit field removal, deleted/rederived source, as-of before first observation.

Sources: [graph](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/graph.mjs), [identity revisions](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/identity.mjs), [continuity](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs), [historic QA receipt](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/qa/capture-studio/evidence/2026-10-21-sprint01-graph-node22.md).

### F5 — MEDIUM-HIGH source-determined completeness classification edge case

A successful `derive` with zero extracted entities calls `dataset('entities').reset()` and subsequently `push([])`. `Dataset.push` returns early on empty arrays and creates no file; `continuity` classifies any absent entities JSONL file as `sessionsWithoutKnowledge` even if `MODEL` was successfully produced with zero entities. Hence **successful-empty** and **not derived** may be conflated despite the Core contract stating these are distinct. This is a deterministic static code path; actual runtime fixture has not been run.

**Remedy options:** persist a dataset-presence/derivation-success marker independently of nonempty rows (preferred) or ensure empty datasets create a zero-byte file; do not infer success from mere file presence after abrupt interruption. **QA:** successful zero-entity capture vs never derived vs failed derive.

Sources: [derive](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/derive.mjs), [Dataset.push/reset](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/session.mjs), [continuity dataset check](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs).

## SYS4 — Cost and bounded evidence

`buildSiteContinuity` calls `listSessions` (which also stats raw segment files), scans all matching entities, stores their revision histories in Maps/arrays, sorts each group's history and folds it, **then** applies `eid` and `limit`. Approximate repeated-query time `O(S + E + Σ R_i log R_i)`, memory `O(E + R)`, with filesystem cost of enumerating/stating raw segments. A request for just one `eid` still scans all records. No load test run; asymptotic source analysis only.

`derive` replays every raw record and writes all decoded events, but `CorpusCollector` defaults to 20,000 samples/group and explicitly thins excess; some heuristics still inspect the reducer's 400 most recent events/stream. These are **different completeness levels**, not contradictory if disclosed. `derive` also caps rendered correlation subjects at 500 and DOM candidates at 2,000 (with coverage counters).

**Order of mitigation:** (1) benchmark representative session counts and history lengths, (2) lazy-build per-entity history and avoid full fold for list response, (3) paginate the surface and retain coverage counts, (4) optional invalidatable per-site read cache keyed by session/derivation versions, (5) only after evidence consider persistent secondary index. Do not introduce a new writable knowledge authority without a measured need and a clear invalidation/deletion contract.

Sources: [continuity](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs), [session listing](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/session.mjs), [corpus](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/corpus.mjs), [derive](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/derive.mjs), [bounded reducer](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/replay/reducer.mjs).

**Watch item, not top-five:** `ScopedLearner` loads JSON state into memory and `save()` replaces a shared `learner.json` through the same `.tmp` path. Simultaneous CLI and server processes have no visible compare-and-swap or multi-process lock; stale last-write-wins learning data is possible. Propose version checking / lock and merge/reload on future implementation, with an interleaved two-writer QA scenario. [learn.mjs](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/learn.mjs).

## SYS5 — User's minimal mental model; present vs planned

The UI agent's latest three commits materially improved session keyboard operation, responsive layout, filters, continuity/loading/errors, revision provenance, and stale-response protections. A latest-source inspection saw HTML escaping for inserted evidence text and a clear latest-200-revisions disclosure. These are valid **source-delivered** improvements, not visual/browser acceptance.

Give users four plain-language evidence levels:
- **Recorded** — directly captured, with source session/time, gap/redaction indicators.
- **Inferred** — interpretation or identity guess; never call inferred site/tenant identity verified.
- **Linked by key** — exact match in the current **detected website + inferred type + key** scope; *not* verified same account/person.
- **Unavailable / incomplete** — no matching entities **versus** no successful derivation **versus** known capture gap **versus** view truncated. Display separate labels.

Specific wording mismatch: current continuity UI says `"same verified site"` and `"Exact site + type + key + identity"`, while backend site identity is a hostname-reduction heuristic. Prefer `"same detected website and inferred record type"` with a detail disclosure that account identity has not been established. The UI should not "fix" identity; Core owns the contract. UI can adjust its own explanation without changing backend behavior.

Recommend one bounded investigation journey: **Recorded session → detected entities → identity basis → observed history → raw/source evidence.** Readiness signal: the UI always explains *why this object is grouped, from which sessions, what is missing, and which claims are only inferred*. No new graph canvas required for the first trusted vertical slice.

Sources: [latest UI](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/ui/index.html), [Core endpoint](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/server.mjs), [Core continuity response](https://github.com/owenservera/aion/blob/90fc6aa19e0b6b3378943a768a08cd53c9e108ac/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/intel/continuity.mjs).

## SYS6 — Ranked cross-lane leverage decisions (recommendations, NOT tasks assigned)

| Rank | Intervention | Benefit / risk | Owner | Dependency / suggested independent check |
|---|---|---|---|---|
| 1 | Repair provisional/missing-key EID uniqueness, preserve migration semantics | Stops identity aliasing within a session; EID compatibility risk | Core | Before/after two missing-key entities; graph and continuity counts and EID stability |
| 2 | Tighten join scope to defensible origin/account boundary | Prevents unsafe cross-host/account joins; may temporarily under-join legitimate observations | Core | Hosted subdomains, different-account same host, same-account repeat |
| 3 | Distinguish successful empty derivation from missing dataset | Makes completeness truthful; low implementation complexity | Core; UI consumes | Empty result / failed result / never derived matrix |
| 4 | Define explicit temporal removal and knowledge provenance semantics | Honest historical state and user trust; needs contract/versioning | Core, UI for wording | Before/after correction, removed field, undated and delete/rederive |
| 5 | Deliver evidence-first continuity journey without claiming verified identity | Converts backend value into user value; avoid misleading certainty | UI; Core contract | Keyboard/mobile manual inspection and evidence trails |

**Second-wave candidates:** type-alignment hypotheses without automatic merges; measured read-through optimization; reliable scoped correction persistence. QA/Steering alone decides whether to elevate these to the team roadmap and owns independent verification. Systems has **not** edited Core, UI, or QA, nor dispatched work.

## Evidence boundaries and closeout

- Reviewed current source: `src/intel/{identity,continuity,graph,discover,schema,corpus,learn,correlate}`, `src/replay/{derive,reducer}`, `src/store/session`, `src/studio/{server,ui/index.html}`, `src/profiles/profiles`, `bin/studio.mjs`, plus existing team queues, layered map, Sprint 02 and QA evidence.
- This is **targeted source inspection, not a line-by-line full repository audit**.
- No source/runtime tests were run in this Systems lane; existing QA execution receipt only covers an older pinned graph blob.
- No claim of Chrome/Windows/live-site fidelity, cross-account incident or verified runtime failure.
- Findings F1/F5 are strong **deterministic source traces requiring reproduction**; F2/F3/F4 are architecture/conditional behavior analyses; scaling is asymptotic, not benchmarked.
- Project's local Windows machine remains runtime acceptance authority.
- Await owner/QA regrouping; do not interrupt ordinary independent development.

**Systems result:** first-pass SYS1–SYS6 assessment completed; source-ranked and advisory. Recommended ChatGPT effort for follow-on focused analysis: **Medium**, for implementation-oriented architecture changes **High**.

## Post-checkpoint Core delta — 2026-10-21, `974632647398`

**Important supersession of F2/F3:** After the pinned `90fc6aa` assessment, Core committed [origin-qualified automatic joins and review-only type-drift hints](https://github.com/owenservera/aion/commit/974632647398c260178434e6e39a5012478296cf). This is genuine forward progress and materially narrows the earlier F2 hosted-subdomain risk:

- `originFromSession` now supplies the exact HTTP(S) URL origin. Automatic keyed joins require this origin, a model key field, site, type, keyed value and EID; the grouping key and public entity ID include origin. Thus two different origins that used to share a naive last-two-label `siteOf` bucket should **no longer be joined automatically** by this read-through view.
- The remaining F2 concern is **different accounts/tenants sharing exactly one origin**. No account/tenant namespace is proven by origin equality; the new response limitation explicitly acknowledges this. F2's *hosted-subdomain subcase* is mitigated in source; keep the *same-origin tenant subcase* open for independent QA and product policy.
- Review-only type-drift hints now compare same-origin, same key field/value records with structural overlap, without merging entity identities. The implementation caps group comparison inputs at 32, returned hints at 25, and reports omissions. This partially addresses F3 without committing to potentially incorrect fuzzy merges.
- `origin + "::" + eid` changes the public entity ID; Core retained the raw `eid` filter for compatibility. UI/CLI consumers should prefer the full returned `id` and expect that one bare EID might refer to multiple origins.
- **F1 missing-key aliases, F5 successful-empty misclassification, explicit retractions, same-origin tenant ambiguity, and measured scalability remain unresolved based on this patch.** No new execution evidence accompanies this assessment.

**Revised rank-2 framing:** tenant-qualified identity within a shared origin and explicit user-visible identity evidence. Do **not** characterize different-host false joining as still present at current source. The report retains its pinned pre-change analysis for provenance, with this delta taking precedence.
