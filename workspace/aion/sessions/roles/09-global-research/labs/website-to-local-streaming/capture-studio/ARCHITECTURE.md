# Capture Studio — Master Architecture and Development Roadmap

**Owner:** AION Global Research 09 · **Updated:** 2026-10-21 · **Product contract:** [UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md](../UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md)

This is the single architecture and roadmap document for the tool. It separates what is **verified**, what is **source only**, and what is **not built**. Nothing here has run on the owner's Windows PC or against chatgpt.com yet.

## 1. Product in one line

Point the studio at a website you are authorized to use. It then:

- observes every available layer (raw bytes, protocol events, rendered page, your actions);
- discovers that site's data model without site-specific rules;
- learns from your corrections;
- records honestly and replays, searches and exports what it captured.

## 2. Principles

1. **Raw evidence is immutable and separate from inference.** Everything derived can be recomputed from the raw log.
2. **Read-only observation.** It uses CDP `Network.*`, an isolated-world DOM agent and the accessibility tree. It never uses `Fetch` interception, never reads typed values, and never automates the page. Playwright and Puppeteer are excluded.
3. **Honest coverage.** Gaps, pauses, masking, metadata-only streams and pre-attach blind spots are declared, never hidden. "Unbounded" means no arbitrary truncation, not infinite storage.
4. **Credentials never reach disk.** Cookie and auth headers are dropped, auth endpoints are metadata-only, and in-body tokens are masked in place with each mask recorded.
5. **Inferences are hypotheses with evidence and confidence** until the user confirms them.
6. **Universal core, families as priors.** Nothing in the core names a website. `ai-chat`, `data-table` and the other families are reusable semantic guides, not classification gates.
7. **Zero-dependency Node ≥ 22** for Windows-first portability. Python or other languages are allowed later as optional sidecars only where measurement shows they beat the JS algorithms.

## 3. Layered architecture

```text
 Chrome (dedicated profile, DevTools on 127.0.0.1 only)
   │  CDP flatten sessions: page + child targets
   ▼
 CAPTURE        src/capture/   network.mjs (L1 raw chunks via streamResourceContent, WS, EventSource)
                               dom.mjs + page-agent.js (L3 DOM, turns, content blocks, actions, a11y)
                               redact.mjs (credential policy)   recorder.mjs (run lifecycle, pause, quota)
   ▼
 STORAGE        src/store/     raw-log.mjs (append-only segments, sha256 manifest, bounded queue,
                               hysteretic overflow → declared gap ranges)   session.mjs (Dataset / KV /
                               verify)   versioned.mjs (profiles & families, rollback)
   ▼
 DECODE / L2    src/decode/    SSE, NDJSON, JSON, WS + envelope sniffing for unknown formats;
                               delta assembly: json-patch, path-ops, typed-events
   ▼
 REPLAY         src/replay/    reducer.mjs (one reducer for live + offline; duplicates, out-of-order,
                               interruption, reconnect)   derive.mjs (datasets, receipt, fidelity
                               breakdown, time travel, revision replay, search)
   ▼
 INTELLIGENCE   src/shapes/    infer.mjs (v1 suggestion engine: endpoints, collections, drift, quality)
                src/families/  family registry, evidence-based detection, mapping proposals
                src/intel/     v2 engine (see §4)
   ▼
 SURFACES       bin/studio.mjs (CLI)   src/studio/server.mjs + ui/index.html (localhost UI, token +
                Host/Origin checks)   exports: json, jsonl, csv, md, transcript
```

### Canonical data model (three strata)

| Stratum | Contents | Where |
| --- | --- | --- |
| Observations | Immutable raw records (`seq`, `t`, `sid`, chunk bytes, frames, DOM batches, actions, gaps) | `sessions/<id>/raw/*.jsonl` + `manifest.json` |
| Semantic entities | Typed nodes with time-indexed revisions, identity key or linkage cluster | `src/intel/graph.mjs` (`TemporalGraph`) |
| Edges | `contains`, `references`, `rendered_as`, `caused` / `preceded`, `same_as`; each with confidence, status and evidence | same |

Derived datasets (`events`, `streams`, `timeline`, `records-*`, `family-*`) and KV entries (`SHAPES`, `ASSEMBLED`, `RECEIPT`, `DOM_TURNS`, `DOM_INSPECT`) are always rebuildable from the raw log.

## 4. Intelligence engine v2 (`src/intel/`)

| Module | Algorithm | Status |
| --- | --- | --- |
| `schema.mjs` | Online schema lattice in the style of genson/Spark: formats, enums, optionality, explicit unions, dynamic-key **map** detection, **tagged-union** detection, field alignment (name + value similarity, synonyms), schema similarity, drift diff with rename repair | TESTED (unit 6/6) |
| `learn.mjs` + `priors.mjs` | Naive Bayes role classifier over structural features, seeded from a cross-convention prior corpus. Scoped learner (instance > page > site > family > global) with revert and promotion candidates. Histogram calibrator with ECE. Active-learning ranking (entropy × impact) | SOURCE ONLY |
| `discover.mjs` | Record-type induction from repeated objects (arrays, maps, roots, assembled docs). Envelope and patch-stream exclusion. Key inference (role, uniqueness, revision stability). Type merging. Composition and inclusion-dependency references, including dangling references. Family priors as soft labels. Confidence per type | SOURCE ONLY |
| `identity.mjs` | Keyed grouping with revision diffs. Fellegi–Sunter-style keyless linkage (data-estimated u, blocking, union-find) | SOURCE ONLY |
| `correlate.mjs` | Action→request causal vs temporal scoring. Entity/stream→element matching by TF-IDF salient values + shingle containment + activity overlap. Ambiguity and conflict states. Payload↔UI final reconciliation | SOURCE ONLY |
| `graph.mjs` | Temporal evidence graph, `stateAt(t)`, instance-level reference and composition edges | SOURCE ONLY |
| `corpus.mjs` | Session → discovery corpus with provenance; DOM handles kept as provenance, not data | SOURCE ONLY |
| `eval/` | Ground-truth fixtures with dev and held-out splits (10 patterns), metrics runner | SOURCE ONLY — **not yet run**; `eval/learning.mjs` not yet written |

Intelligence levels: (1) deterministic heuristics; (2) adaptive statistical learning, implemented here; (3) optional LLM-assisted naming and interpretation, which is not built and must never be a hard dependency.

## 5. Verified state (headless Chromium 153, synthetic sites)

- **Unit tests:** 14/14 (core storage/integrity/redaction plus schema induction).
- **Capture E2E:** 4/4. This covers live raw SSE capture, byte-faithful framing, long responses, explicit slow-disk gaps and late-attach honesty.
- **Universality E2E:** 9/9.
  - chatgpt-style and claude-style protocols both unified into the `ai-chat` canonical message model;
  - rich content blocks;
  - data-table, content-feed, form-flow and article families detected;
  - typed form values never stored;
  - duplicate, out-of-order, interrupt and reconnect events flagged;
  - pause declared, not counted as loss.
- **Integrity:** `written + declared-dropped = issued` holds across segment rotation and a gap left open at shutdown, and tampering is detected.

A known limitation, verified: connections opened before attach are invisible to CDP. The coverage note states this, and a user-requested "reload to capture from start" action exists.

## 6. Capability matrix (16 families)

States: NOT IMPLEMENTED · SOURCE IMPLEMENTED · TESTED SYNTHETIC (headless Chromium + fixtures) · TESTED REAL WEBSITE · VERIFIED WINDOWS.

| # | Capability | State |
| --- | --- | --- |
| 1 | Point at an active site | TESTED SYNTHETIC |
| 2 | Learn by watching (actions, navigation) | TESTED SYNTHETIC |
| 3 | Discover data layers (L1/L2/L3, a11y, media) | TESTED SYNTHETIC |
| 4 | Identify data shapes | TESTED SYNTHETIC (v1); v2 SOURCE IMPLEMENTED |
| 5 | Nested and mixed structures (blocks, tagged unions, maps) | TESTED SYNTHETIC (blocks, unit-tested unions) |
| 6 | Entities, fields, relationships | SOURCE IMPLEMENTED (v2) |
| 7 | Suggested capture rules | TESTED SYNTHETIC |
| 8 | Visual inspect and fine-tune | SOURCE IMPLEMENTED (API + model ops); UI not yet updated for v2, families or model editor |
| 9 | Live evolving preview | SOURCE IMPLEMENTED (preview and draft API) |
| 10 | Full-fidelity recording | TESTED SYNTHETIC |
| 11 | Streaming semantics | TESTED SYNTHETIC |
| 12 | Adaptive site profiles (versioned, rollback, drift) | TESTED SYNTHETIC (profiles, families); drift repair SOURCE |
| 13 | Calibration and quality scoring | SOURCE IMPLEMENTED |
| 14 | Search, replay, time travel | SOURCE IMPLEMENTED (API); partially exercised by E2E |
| 15 | Local ownership and interoperability | TESTED SYNTHETIC (datasets, exports) |
| 16 | Privacy, permissions, resource control | TESTED SYNTHETIC |

No row is TESTED REAL WEBSITE or VERIFIED WINDOWS yet.

## 7. Roadmap (intelligence-first order)

> **Superseded in detail by [ASSESSMENT-AND-WORKLOG.md](ASSESSMENT-AND-WORKLOG.md)** (2026-10-21 step-back: measured baseline, review findings R1–R10, worklog W1–W18). The list below is kept for context.

1. **Measure v2.** Write `eval/learning.mjs` (learning loop: improvement after corrections, contamination check, promotion). Run `node eval/run.mjs`, commit the measured `eval/results/latest.md`, then fix the algorithms against the dev split only and report held-out numbers unchanged.
2. **Unit-test v2 modules** with adversarial cases: identity linkage, inclusion dependencies, correlation ambiguity and conflict, graph `stateAt`, scoped learner revert and promotion, calibrator.
3. **Integrate v2 into `derive`** to persist the graph, model, hypotheses and active-learning questions. Expose them in the server API and wire user corrections into `ScopedLearner` with explicit scope selection. *Status 2026-10-21 (Sprint 01, `8218e6c`, PENDING INDEPENDENT QA):* model, entities, hypotheses and graph are persisted by `derive` (kv `MODEL`/`GRAPH`/`HYPOTHESES`, dataset `entities`) and served at `/api/sessions/:id/model|graph|hypotheses` and `studio model`. Suggestion accept/reject feeds the calibrator. Still open: active-learning questions, field-role corrections with scope selection.
4. **Connector contract.** Formalize CDP network, DOM, accessibility and interaction as connectors that describe surfaces, fidelity, lifecycle and limits. Add a HAR-import connector (non-CDP, retrospective) and a reconciliation planner that deduplicates semantic events across connectors.
5. **Cross-session knowledge store.** Resolve entities across sessions per site; align types across sites (family transfer).
6. **UI for intelligence.** Model graph explorer, hypotheses with confirm/reject, active-learning questions, model editor with live preview, families library, fidelity breakdown panel, non-colour cues.
7. **Optional level 3.** LLM-assisted naming behind a provider interface (local Ollama or external key), off by default, with validated outputs and minimized data.
8. **Windows packaging and acceptance.** PowerShell launcher and first-run flow, a concise README, a real-browser run, a chatgpt.com field run per EXPERIMENTS.md, and receipts.

## 8. Running it

```powershell
node bin/studio.mjs doctor
node bin/studio.mjs start            # capture browser + studio UI
node bin/studio.mjs record --target chatgpt
node bin/studio.mjs sessions ; node bin/studio.mjs receipt latest
npm test                              # unit
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"; npm run test:e2e
node eval/run.mjs                     # intelligence evaluation (roadmap step 1)
```

Session data lives outside the repository, under `%LOCALAPPDATA%\AION\capture-studio`. Never commit captured data.
