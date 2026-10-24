# Z.ai -> Agent 14 Round 8 integration receipt (adaptive adapter factory + Round 7 reconciler)

**Date:** 2026-10-24. **Integrator:** Z.ai sandbox (integration + full-system role).
**Source packages:** `implementations/round8/` (3 files) and `implementations/round7/` (3 files) on GitHub main, remote readback verified before integration.
**Source commits:** branch `studio/short-writer-lease` = origin/main `e652a70` + 22 commits; integration commits `654bed7` (Round 8) and `71b5f53` (Round 7); docs commit follows this receipt. Push remains impossible from this sandbox (no GitHub credentials) — artifacts regenerated as patches + bundle + SHA256SUMS.

## What was integrated (not rebuilt)

| Agent 14 artifact | Installed at | Verification |
|---|---|---|
| `adaptive-adapter-factory.mjs` | `src/studio/adaptive-adapter-factory.mjs` | verbatim; `node --check`; 17/17 package tests at `test/unit/adaptive-adapter-factory.test.mjs` (import path adjusted only) |
| `uncertain-step-reconciler.mjs` | `src/studio/uncertain-step-reconciler.mjs` | verbatim; 17/17 package tests at `test/unit/uncertain-step-reconciler.test.mjs` |

Both modules keep their contracts untouched: the factory is a pure compiler/shadow-evaluator,
the reconciler is a pure classifier. All integration-specific behavior lives in Z.ai-owned seams.

## Round 8 wiring (capture -> probes -> candidate -> shadow -> versioned read-only activation)

1. **Probes from real evidence (`src/studio/adapter-probes.mjs`).**
   - `SAVED_REAL_CAPTURE`: existing derive outputs only — `DOM_TURNS` (attribute selectors
     `[roleAttribute="role"]` for user/assistant + one bounded specific domId per role),
     `ASSEMBLED` stream endpoint paths (stream-map, network carrier), thread-route templates from
     `RECEIPT.pageUrl` / `DOM_INSPECT.url` / `meta.target.url` generalized over identity-shaped
     tokens (`:uuid`, `:id`). Presence votes only — saved captures cannot re-query their DOM.
   - `SANDBOX_REAL_BROWSER`: one bounded read-only in-page measurement via the existing
     DomObserver (`_evalInMain`, the capture agent's own isolated world; no second actor, no raw
     CDP session): generic candidate battery (mirrors `actions.mjs` fallbacks), the prior
     candidate's selectors measured raw (honest absence for drift), the capture agent's role scan
     (site-specific attribute selectors), and the thread URL. Absence requires
     `document.readyState === 'complete'`; the expression awaits agent re-injection (bounded 4s)
     and is proven free of dispatch/submit/network verbs by test.
   - Cross-origin teaching fails closed (`PROBE_ORIGIN_MISMATCH`); within-capture
     presence/absence conflicts are suppressed at the source (the factory would count them unknown).
2. **Lifecycle (`src/studio/adapter-factory-service.mjs`).** `synthesize` (pure; prior-scope
   checked by the factory), `shadowEvaluate` (pure), `promote` (server-side RE-COMPUTATION of the
   held-out shadow evaluation from the held-out sessions; client receipts are stored for audit but
   never trusted; `AUTHORITY_VIOLATION` / `SHADOW_MISMATCH` / `PROMOTION_NOT_EARNED` fail closed),
   `rollback` (VersionedStore pointer move), `list/load/loadRecord`. Learned adapters are
   data-only: no composer field at all, `send.strategy 'learned-readonly'`,
   `authority.sendPermission=false`, activation = held-out-confirmed ∩ READ_FEATURES ∩
   shadow-ready. Store: `<root>/learned-adapters/` (existing VersionedStore: immutable vNNNN
   files, CURRENT pointer).
3. **One registry, two views (`src/profiles/sites/index.mjs`).** `getAdapter` (drive/send path)
   is byte-identical to before and provably cannot resolve a learned adapter (test). New
   `getReadAdapter`/`listReadAdapters` expose seeds + learned for observation surfaces; provider
   resolution is lazy so promotions/rollbacks are immediately visible. `sendMessage` refuses
   `learned-readonly` before any CDP traffic (defense in depth, tested with an untouchable page).
4. **Surfaces (`src/studio/integration-hub.mjs`, `server.mjs`).** `POST /api/v1/adapters/learned/
   synthesize` (optional `live: true` measures the actively captured tab server-side),
   `shadow-evaluate`, `promote`, `GET list/get`, `POST rollback`, `GET .../transcript`
   (saved session, or `live=1` through the serve process's own recorder with the capture privacy
   scrubber and origin enforcement), `GET /api/v1/adapters/read[/{id}]`. MCP tool annotations:
   synthesize/shadow/transcript/list/read are read-only; promote/rollback are writes.
5. **Drift/relearn.** Synthesis with `priorName` + live measurement of the prior selectors:
   `PREVIOUS_CANDIDATE_NEGATIVE_OBSERVATION` + `PROPOSED_REPLACEMENT_REQUIRES_SHADOW_VALIDATION`
   -> re-shadow on held-out -> v2 promotion -> versioned rollback verified in both directions.

## Round 7 wiring (uncertain submit steps)

- `src/studio/intent-bindings.mjs`: durable pre-effect intent binding
  (`<root>/intent-bindings/<sha256(runId,stepKey)>.json`, atomic tmp+rename; fields are digests
  and identifiers only). `record()` happens in the harness API — the effect owner's own path —
  BEFORE `runs.step()` dispatches; the executor itself observes the binding already on disk
  (proven by test = pre-effect ordering). `complete()` reads the journal-side join from the
  OWNING journal (the submit args' durable request key IS the journal turn key) inside a
  `finally` block, because uncertain steps throw — that is precisely the case the binding must
  survive. A crash between dispatch and completion leaves an incomplete binding ->
  `still_unknown` (honest, never guessed).
- Read-only query `POST /api/v1/harness/runs/{run}/reconcile` (tool `harness_reconcile_step`,
  readOnlyHint): store snapshot (the store's own validated read) + binding + journal snapshot
  through the pure classifier. Zero mutation proven by test (journal and run unchanged).
- Journal access is a new read-only `journalSnapshot()` accessor on the conversation service
  (its own structured-clone read; pure snapshot via the existing `peek` when the conversation is
  not open) — no competing journal parser. The step digest comes from the store's own
  canonicalization (`argsDigestOf` now exported) — binding and step identity cannot diverge.

## Unseen-webapp demonstration (SANDBOX-DEMO, real Chrome for Testing 143.0.7499.4)

`node scripts/adapter-factory-demo.mjs` — 15/15 steps PASS. The host is an unregistered
synthetic HTTPS chat webapp (`scripts/adapter-fixture-site.mjs`: real TLS, SSE streaming, URL
thread identity, localStorage restore). No handwritten adapter exists for it at any point.

1. Four real `studio drive` exchanges through GENERIC heuristics (Studio's single actor; replies
   read back from the real rendered DOM).
2. Candidate synthesized from three captures: probes=9; user-turn/assistant-turn/thread-route all
   `shadow-ready` (`[data-role="user"]`, `[data-role="assistant"]`,
   `https://127.0.0.1:PORT/chat?chatID=:uuid`).
3. Held-out shadow evaluation: 3/3 positive -> `candidate-read-only-preview`.
4. Server-re-verified promotion -> v1, readFeatures = assistant-turn+thread-route+user-turn.
5. Saved-session read-only transcript: 2 turns, thread binding honestly `unverified` (no
   source-supported parser for the host — identity never fabricated).
6. LIVE transcript while the serve process records the tab (source=live-page).
7. Read view exposes the learned adapter; a dry-run drive still resolves generic heuristics —
   the execution path is untouched.
8. Site ships a v2 UI (role attribute renamed): three more real exchanges + a dedicated v2 tab
   measured live -> both drift reasons -> shadow 3/3 -> v2 promoted
   (`[data-msg-role="user"]`).
9. Versioned rollback v2->v1->v2 verified through the CURRENT pointer.

Demo-side defects found and fixed en route (all in the demo fixture, none in product evidence
paths): fixture SSE timer was cancelled by the request 'close' event (Node semantics), the
assistant streaming overwrote the persisted user turn (localStorage restore then showed one
turn), and the demo's tab lifecycle relied on localStorage across a UI mutation (now explicit
per-phase tabs recorded by id).

## Test receipts

- Unit suite at the Round 8+7 head: **1326 tests / 1325 pass / 0 fail / 1 pre-existing todo**
  (the loadlab todo predates this work). +63 tests vs the Round 6 baseline 1263/1262/0/1:
  Agent 14 packages 17+17 (verbatim), probes 14, factory service 5, registry 4, send fence 2,
  Round 7 product integration 4 (real journal fixture).
- live-e2e on real Chrome: **14/14 steps PASS** — the Round 8/7 changes did not disturb the
  existing capture->verify->derive->acceptance->harness flow.
- Both Agent 14 packages run their own adversarial suites unmodified at product paths.

## Remaining gaps (honest ledger)

- **Native response reconstruction:** provider-native encodings (Claude Connect/protobuf) remain
  a specialist decoder path (atlas B03); the factory consumes probes, not raw protocol decoders.
- **Scheduled drift sweeps:** drift fires on synthesis-with-prior (+ live measurement); no
  cron-like periodic re-probe of promoted sites yet.
- **Send/composer activation:** deliberately never for learned adapters (read-only authority).
  Owner-executed effects keep using handwritten seeds and the existing runtime gates
  (THREAD_SITES, journal fence, writer lease).
- **Windows/NTFS conformance** for the learned-adapters and intent-bindings stores: owner
  handoff (same command pattern as the Round 6 `harness-crash-probe.mjs`).
- **Read-only transcript identity** stays `unverified` for hosts without a source-supported
  thread parser (anti-fabrication by design; ChatGPT /c/<uuid> remains the only verified binding).
- **Live-provider learning loop:** "point AION at a new AI webapp" end-to-end on a real
  third-party provider needs the owner's Windows runtime (authenticated surfaces, non-datacenter
  IP); this round proves the loop on a real local webapp with the full product pipeline.
