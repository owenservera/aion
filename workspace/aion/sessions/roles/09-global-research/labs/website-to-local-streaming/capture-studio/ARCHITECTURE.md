# Capture Studio — Master Architecture and Development Roadmap

**Owner:** AION Global Research 09 · **Updated:** 2026-10-23 · **Product contract:** [UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md](../UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md)

This is the single architecture and roadmap document for the tool. It separates what is **verified**, what is **source only**, and what is **not built**. Nothing here has run on the owner's Windows PC or against chatgpt.com yet.

## 1. Product in one line

Point the studio at a website you are authorized to use. It then:

- observes every available layer (raw bytes, protocol events, rendered page, your actions);
- discovers that site's data model without site-specific rules;
- learns from your corrections;
- records honestly and replays, searches and exports what it captured.

## 2. Principles

1. **Raw evidence is immutable and separate from inference.** Everything derived can be recomputed from the raw log.
2. **Read-only observation by default.** Capture uses CDP `Network.*`, an isolated-world DOM agent and the accessibility tree. It never uses `Fetch` interception and never stores typed form values. Page interaction is a separate, opt-in layer (`src/capture/actions.mjs` + `src/capture/human.mjs`) that types with real key events and runs only for `studio drive` or `campaign --execute`; a plain `record`/`capture` never touches the page. Playwright and Puppeteer are excluded.
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
                               actions.mjs (opt-in drive primitives: composer, send, reply, login wall)
                               human.mjs (human pacing: key events, pauses, mouse, focus prep)
                               campaign.mjs (sequential multi-site run: drive -> derive -> family)
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
                src/families/  build.mjs (site consolidation: one normalised shape set + signature),
                               family registry, evidence-based detection, mapping proposals
                src/intel/     v2 engine (see §4)
   ▼
 SURFACES       bin/studio.mjs (CLI, including drive, campaign, library)
                src/studio/server.mjs + ui/index.html (localhost UI, token + Host/Origin checks)
                exports: json, jsonl, csv, md, transcript
```

### Capture -> derive -> family

One pipeline, used by `campaign --execute` and reproducible by hand:

1. **Drive.** `src/capture/actions.mjs` (`driveSite()`) finds the composer — adapter selectors
   first, the generic heuristic second, so a site with no adapter still works — brings the tab to
   the front, types the prompt with `src/capture/human.mjs`, sends it, waits until the reply stops
   changing and reads it back. The exchange is recorded by the same `src/capture/recorder.mjs` the
   `record` command uses, so it lands as an ordinary session.
2. **Derive.** `src/replay/derive.mjs` produces datasets, `SHAPES` and `ASSEMBLED` (dialects) from
   that session, exactly as for a captured one.
3. **Consolidate.** `src/families/build.mjs` `buildFamily()` inspects all saved sessions but publishes only G1–G7 `capture_accepted` same-origin, fully derived sessions (unassessed/failed evidence remains accessible). It previously collected every derived session of the
   host, groups streams by transport and endpoint path (ids normalised to `{id}`), unions the field
   paths with occurrence counts, sorts everything and hashes the normalised shape set into a
   deterministic signature. `writeFamily()` persists it through `FamilyStore`, so each build is a
   new immutable `vNNNN.json` plus `CURRENT`.

`library build` runs step 3 alone over whatever sessions already exist; `library show` and
`library list` read the store. The pipeline is idempotent: two builds over the same sessions give
the same objects and the same signature.

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

### 2026-10-23 update — offline work since 617f1067

Owner decision 2026-10-23: offline work only; fresh controlled captures are deferred. Code observed at main `75e7b882` (working tree clean at observation). Evidence labels: **Build** = source exists; **Integrated** = wired into derive, API or UI; **Locally demonstrated on synthetic data** = run locally on synthetic fixtures or in-process; **Observed on saved real sessions (read-only)** = counts only. Nothing below is a live-site, real-Chrome or Windows result, and nothing is independently accepted.

Commit note: the stated range `617f1067..5bcbc5bf` does not cover every commit cited here. Commits on main after `5bcbc5bf` are `ac87148d`, `56eed0dc`, `7b7e3306`, `3ec67e46`, `7cd1fb50` and `4106b785`; items 4–7 and 10 below cite them. The Records panel commit `1b3904d1` predates the `617f1067` base.

1. **Event identity** (`23c43e2c`): the reducer stamps `n`; event id is `sid#seq.n` (`src/replay/event-id.mjs`). Locally demonstrated on synthetic data (unit tests).
2. **Stable join keys** (`bc1be28e`, `82a83ffa`): DOM blocks carry `ord`; assembled stream blocks carry `key = messageId:index` and `parentIndex`. Message id comes from `message_start`, `response.created`, an `item_id` fallback, or the first full-document snapshot (`source 'snapshot'`, not written to `doc.meta`). Locally demonstrated on synthetic data.
3. **Stream-to-DOM join** (`bd42ade3`, `183a463f`, `99242658`; `src/intel/join.mjs`): statuses verified / partial / near_match / ambiguous / text_mismatch / unlinked_stream / unlinked_dom; role, markdown, entity and citation normalisation; blocks pair by rank order and inherit message finality; identical duplicate DOM elements are ambiguous. Synthetic fixtures only. Locally demonstrated on synthetic data.
4. **Derive steps and routes** (`61b880fd`, `bc2e946e`, `a81b82c5`): guarded, deterministic `STREAM_DOM_JOIN` (160-character stream preview and sid), `STREAM_COMPONENTS` (stream map applied), and an acceptance label (`acceptance.json`; label only, not used by family builds). Routes `/join`, `/components`, `/acceptance`. Integrated; the session record gives no separate test count for these steps.
5. **Stream-to-component maps** (`f6ae8750`, `56eed0dc`; `src/profiles/stream-map.mjs`): claude-typed-events, chatgpt-path-ops (ignore and finalize rules derived from a survey; semantics inferred) and openai-responses. Build.
6. **Decoders and capture bounds** (`ba251fab`, `ac87148d`, `07664233`): exact byte spans when CRLF is split across chunks (RF-1; Locally demonstrated on synthetic data); zero-dependency schema-less protobuf decoder (`src/decode/protobuf.mjs`); Connect/gRPC frames inflate (gzip, deflate, deflate-raw via `node:zlib`) and expose proto strings; live-only 2 MiB JSON cap with an oversize marker (derive is uncapped); streaming byte cap splits at the boundary; pre-raw arming buffer bounded. Build, except RF-1.
7. **Capture-path performance** (`f88d116f`, `ef66536f`, `07664233`, `4106b785`): live shape observation moved off the append path (deferred, time-sliced, sampled under load); events dataset was already buffered; DOM block normalisation cached per report. Measured on synthetic in-process runs only:
   - the saturation lab is too noisy to claim a p99 gain (CV 23–40%);
   - realistic chat scenario (paced SSE, DOM bursts, 6 MB JSON burst; n=3): event-loop p99 about 27–33 ms and queue-age p99 about 65–92 ms, within targets;
   - **longest single stall 101-105 ms (n=3, CV about 2%) misses the 100 ms target by 1-5%; it was 114-146 ms before the periodic STATE/SHAPES snapshots were written asynchronously (fc72fcb2)** (reference with capture disabled, i.e. the load generator alone: 24–53 ms; this is not a before/after of a fix);
   - remaining synchronous owners at the 5 s persist tick: the evidence walk (gatherEvidence) 41-56 ms, suggest 15-25 ms, profiler 6-22 ms; the STATE and SHAPES writes now run asynchronously.

   No real-Chrome performance number exists. Locally demonstrated on synthetic data; the 100 ms target is not met.
8. **UI** (`1b3904d1`, `4bfdf814`, `e87a4672`): read-only Records panel, Stream-to-page panel, Page components panel, and cursor-paged events scrubbing. Build: source and vm-stub tests only; no browser run.
9. **Tests**: `bun run test` (node --test unit suite) reports 817 tests, 816 pass, 0 fail and 1 pre-existing todo at the last full run. QA suites outside the unit suite: replay-fidelity (`617f1067`, 10/10 reported in `034d0e21`) shows 10 of 10 finished synthetic sessions byte- and event-faithful, with 2 sessions having an unfinished stream correctly excluded and one open todo (S1-F1: family build does not require an acceptance verdict). native-shape-fidelity (`2062f9f4`) shows 6 of 6 variants faithful at stream, components and page layers, with 3 cut variants correctly non-final. Locally demonstrated on synthetic data.

Defect fixes and their commits are listed in `workspace/aion/qa/capture-studio/FINDINGS.md` (2026-10-23 section).

## 6. Capability matrix (16 families)

States: NOT IMPLEMENTED · SOURCE IMPLEMENTED · TESTED SYNTHETIC (headless Chromium + fixtures) · TESTED SAVED REAL SESSIONS (read-only survey) · TESTED REAL WEBSITE · VERIFIED WINDOWS.

`TESTED SAVED REAL SESSIONS (read-only survey)` means counts computed read-only over the owner's saved sessions, with no live run and no text recorded. It is not a real-website test. `TESTED REAL WEBSITE` and `VERIFIED WINDOWS` stay empty.

| # | Capability | State |
| --- | --- | --- |
| 1 | Point at an active site | TESTED SYNTHETIC |
| 2 | Learn by watching (actions, navigation) | TESTED SYNTHETIC |
| 3 | Discover data layers (L1/L2/L3, a11y, media) | TESTED SYNTHETIC; TESTED SAVED REAL SESSIONS (read-only survey): Connect/protobuf transport observed in claude.ai traffic (reply-field path is a lead, not a parse) |
| 4 | Identify data shapes | TESTED SYNTHETIC (v1); v2 SOURCE IMPLEMENTED |
| 5 | Nested and mixed structures (blocks, tagged unions, maps) | TESTED SYNTHETIC (blocks, unit-tested unions) |
| 6 | Entities, fields, relationships | SOURCE IMPLEMENTED (v2); stream-to-DOM join TESTED SYNTHETIC; TESTED SAVED REAL SESSIONS (read-only survey): join linked 0 of 60 ChatGPT assistant turns in 11 sessions (old DOM extractor) |
| 7 | Suggested capture rules | TESTED SYNTHETIC |
| 8 | Visual inspect and fine-tune | SOURCE IMPLEMENTED (API + model ops); UI not yet updated for v2, families or model editor. Read-only Records, Stream-to-page and Page components panels: Build (source + vm-stub tests, no browser run) |
| 9 | Live evolving preview | SOURCE IMPLEMENTED (preview and draft API) |
| 10 | Full-fidelity recording | TESTED SYNTHETIC (split-CRLF exact byte spans fixed, RF-1; replay-fidelity 10 of 10 finished synthetic sessions) |
| 11 | Streaming semantics | TESTED SYNTHETIC; dialect detection TESTED SAVED REAL SESSIONS (read-only survey): chatgpt-path-ops matched 28 sessions; claude.ai connect+proto traffic is not matched by the claude typed-events map |
| 12 | Adaptive site profiles (versioned, rollback, drift) | TESTED SYNTHETIC (profiles, families); drift repair SOURCE |
| 13 | Calibration and quality scoring | SOURCE IMPLEMENTED |
| 14 | Search, replay, time travel | TESTED SYNTHETIC (replay-fidelity: 10 of 10 finished synthetic sessions faithful); cursor-paged events scrubbing Build (vm-stub only) |
| 15 | Local ownership and interoperability | TESTED SYNTHETIC (datasets, exports) |
| 16 | Privacy, permissions, resource control | TESTED SYNTHETIC; default local-raw capture mode bypasses stream credential guards by design, per owner direction in issue #65; issue #64 open |

No row is TESTED REAL WEBSITE or VERIFIED WINDOWS yet.

### Real-data findings and open items (2026-10-23)

**Observed on saved real sessions (read-only).** Read-only survey scripts (`scripts/fidelity-survey.mjs`, `scripts/proto-field-search.mjs`) over the owner's 107 saved sessions: 107 ok, 0 errors, no writes detected, 29 with finished status. Only counts were recorded; no text, URLs or session ids.

- **ChatGPT dialect:** real ChatGPT uses the path-ops dialect (28 sessions matched `chatgpt-path-ops`). After the map update about 590 previously unmapped protocol events are recognised; A later value-type check (types only, no values) showed that the events the survey labelled "redacted-shape" are routine message-open frames (a message object in `v.message` with null `error` and `error_code`), not errors. With message-open rules (`75e7b882`), a replay of the 27 replayable ChatGPT sessions leaves 3 of the 329 previously unmapped events unmapped, and no false error signals. An earlier inference that they were error envelopes, made from the key names alone, was wrong and was corrected before commit.
- **Stream-to-DOM join links nothing on real ChatGPT data:** 0 verified, partial or near-match links across the 60 ChatGPT assistant turns in 11 sessions that have saved DOM turns (the survey diagnosed 68 assistant turns in 19 sessions in total; the other 8 turns are Claude, whose protocol produces no stream message to join). The saved DOM turns came from the old turn extractor; every saved ChatGPT turn is exactly 13 characters (a hidden heading label). The extractor fix (generic, text-aware ranking) is verified only on synthetic DOM structures. Its effect on the real page is unverified until a fresh capture.
- **claude.ai:** conversation traffic is `application/connect+proto`, partly gzip-compressed. No server-sent-events reply stream was found in the 8 Claude sessions with DOM turns, and the claude typed-events map cannot match claude.ai. Reply text is carried partly in protobuf string field path `1.1.5.9` (top-5 in 8 of 8 sessions; best aggregation unionAll; median token Dice 0.66; presence coverage 0.71–0.73). This is a **lead, not an established parse**: the sample holds only about 2 distinct conversations (7 of 8 sessions repeat one prompt).
- **Stream arm:** 29 of 47 stream-arm attempts in one Claude session fell back to whole-body capture (small JSON responses).

**Open list (not verified):**

- Any live run on a real site after these changes.
- Real-Chrome performance (no number exists).
- The turn-extractor effect on the real ChatGPT page.
- Claude reply reconstruction.
- The 100 ms longest-stall target (synthetic: 101-105 ms, missed by 1-5%).
- Independent acceptance: none; L4/L5 0/7 unchanged.
- Development / Track B acknowledgement of the Studio consolidation: AX-0022/0023 still absent from `EXCHANGE.jsonl`.
- Issue #64 (credential masking): open. The default capture mode is local-raw, which bypasses the stream credential guards by design per owner direction in issue #65.
- S1-F1 (family build does not require an acceptance verdict): OPEN.
- Owner decision 2026-10-23: offline work only; fresh controlled captures deferred.

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
