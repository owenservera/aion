# SPEC — Sprint 01 "Trustworthy Continuity"

Valid for main f1bab393 (product source = RECON SHA 9d2fe0cd). Product root: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/` (paths below are relative to it). See DECISION.md for rationale.

**Global invariants (every chunk):**
- I1 Raw logs (`raw/`) are never written or rewritten by derive.
- I2 Existing datasets and kv keys keep their names and record shapes: `events`, `streams`, `timeline`, `records-*`, `family-*`, `SHAPES`, `ASSEMBLED`, `DOM_BLOCKS`, `RECEIPT`. Only additive fields are allowed.
- I3 `derive(session, profile)` called with no third argument must keep working (e2e tests call it that way). Return fields are additive only.
- I4 Exported signatures used by tests/eval stay compatible: `discoverModel`, `resolveType`, `linkage`, `buildCorpus`, `modelSignature` (eval), `Recorder`, `ProfileStore`, `FamilyStore`, `applySuggestion`, `Session`, `streamBytes`.
- I5 Every derived record keeps a pointer back to raw evidence (`session`, `sid`, `seq` and/or `domId`). Any sampling or truncation is disclosed in output, never silent.
- I6 No test files are created or modified, and no suites are run.

Chunk order: C1 → C2 → C3 → C4. C1 and C2 are independent of each other. C3 needs both. C4 needs C3.

---

## C1 — Full-evidence corpus and family event extraction

**Files:** `src/intel/corpus.mjs`, `src/families/families.mjs`, `src/replay/derive.mjs`

**corpus.mjs**: keep `buildCorpus` and `discriminatorOf` unchanged. Add:

```js
export class CorpusCollector {
  constructor({ session, site, maxPerGroup = 20000 } = {})
  addEvent(ev, stream)           // call for EVERY derived L2 event, in seq order
  addDomTurns(domTurns)          // same mapping as buildCorpus's domTurns loop
  addDomItems(domItems)          // same mapping as buildCorpus's domItems loop
  result(reducer)                // -> { samples, patchGroups:Set<string>, stats }
}
```

- `addEvent`: skip unless `ev.json` is a non-null object. The endpoint and group are computed exactly as `buildCorpus` does (`${method ?? (ws ? 'WS':'GET')} ${templateUrl(url)}`, `${endpoint} :: ${discriminatorOf(ev)}`). Push `{ value: ev.json, source: { kind:'event', group, endpoint, sid, seq, t, session, site } }`. Remember `sid → group` membership for the patch decision.
- **Deterministic decimation per group** (I5): each group keeps `list`, `stride=1`, `seen=0`, `shapes:Set`, `dropped=0`. On each candidate, `seen++`. Keep it if its `shapeKey(value)` (import from `./schema.mjs`) is new for the group, or if `seen % stride === 0`. Otherwise `dropped++`. When `list.length > maxPerGroup`: `stride *= 2`, then thin `list` by keeping elements whose shape is the first occurrence of that shape in the list, or whose position index is even. Add the removed count to `dropped`. Samples stay in seq order.
- `result(reducer)`:
  - Patch sids are streams in `reducer.streams` whose `_delta.detected` intersects `PATCH_DIALECTS`.
  - `patchGroups` is every group that has at least one patch sid.
  - For each patch stream with `_delta.revisions > 0` and an object `doc`, append an assembled sample with the same source as `buildCorpus` plus `seqFrom`/`seqTo`. These are the min and max `seq` of the events this collector saw for that sid; use `null` if none were seen.
  - Return `stats: { groups, samples, dropped: {group: n} (only n>0), maxPerGroup }`.

**families.mjs**: add

```js
export function familyRecordsFromEvent(profile, ev, stream, session) // -> Array<{ dataset, record }>
```

It returns exactly what the `fm.source.kind === 'event'` branch of `extractFamilyRecords` would push for this single event, for every such mapping. Same `applyMapping`, same `_family/_entity/_provenance` (`seq: ev.seq, t: ev.t`). Dataset name: `family-${profile.family}-${fm.entity}`. Return `[]` if `!profile?.family`.

Change `extractFamilyRecords(profile, reducer, { session, domTurns = [], eventRecords } = {})`: when `eventRecords` (an object `{dataset: record[]}`) is given, skip the `kind === 'event'` branch and instead push those records, in their order, into `out` before the network/DOM linking step. Without `eventRecords`, behaviour is unchanged (the studio preview relies on that).

**derive.mjs**:
- Create `const corpus = new CorpusCollector({ session, site })`, where `site = siteOf(hostname of session.meta.target?.url)` (`siteOf` from `../profiles/profiles.mjs`; use `''` on parse failure).
- Create `const famEvents = {}`.
- In the per-event loop, call `corpus.addEvent(ev, st)`. For each `{dataset, record}` from `familyRecordsFromEvent(profile, ev, st, session)`, push into `famEvents[dataset]`.
- After the loop, call `corpus.addDomTurns(domTurns)`.
- Call `extractFamilyRecords(profile, reducer, { session, domTurns, eventRecords: famEvents })`.
- Keep `const corpusResult = corpus.result(reducer)` in a local for C3. C1 itself persists only `session.kv.set('CORPUS_STATS', corpusResult.stats)`.
- **Behaviour:** family records from event-source mappings now cover every event, not the last 400 per stream.

**Invariants:** I2 (family dataset shape unchanged; only coverage grows), I3, I4 (`buildCorpus` untouched).

---

## C2 — Stable, scoped identity and honest edge semantics

**Files:** `src/intel/identity.mjs`, `src/intel/graph.mjs`

**identity.mjs `buildEntities`**: the existing member sort (`t`, then `seq`, then `instanceSig`) is kept, and `inst[0]` is the earliest observation.
- Keyless eid becomes `` `${type.id}:e:${sha(anchorOf(inst[0]))}` `` with
  `const anchorOf = (i) => \`${instanceSig(i)}|${i.prov.index ?? ''}|${i.prov.mapKey ?? ''}|${i.prov.snapshot ?? ''}\``.
  The keyed eid is unchanged.
- Add these fields to every entity:
  - `idBasis: method === 'key' ? 'key' : 'first-observation'`
  - `anchor: { session, sid, seq, domId, t }`, taken from `inst[0].prov`, each defaulting to `null`
- **Behaviour:** appending later observations never changes a keyless entity's id. Only evidence earlier than the current anchor can change it, and that is genuine new history. The id format is unchanged. Results stay independent of input order (the sort is total).

**graph.mjs `buildGraph`**:
- `keyIndex` key becomes `` `${e.type}|${e.scope}|${e.key}` ``. The reference lookup uses the source entity's scope: `` keyIndex.get(`${rel.to}|${e.scope}|${String(v)}`) ``.
- In `contains`, the `bySeq` key becomes `` `${rv.session ?? ''}|${rv.sid}|${rv.seq}` `` on both the parent and child side.
- Action hypotheses: always `kind: 'preceded'`, `evidence: { ...h.features, scoredRelation: h.relation, score: h.score }`.
- `upsertEntity` evidence: also pass `t: rev.t`. Graph node creation: also set `node.idBasis = e.idBasis` and `node.anchor = e.anchor`.

**Invariants:** I4 (`resolveType`, `linkage` signatures unchanged; entity fields additive), I5. The keyed path must stay unchanged.

---

## C3 — Wire intelligence into derive and expose it  ⚠ stuck-risk (integration and failure isolation)

**Files:** `src/config.mjs`, `src/replay/derive.mjs`, `src/studio/server.mjs`, `bin/studio.mjs`

**config.mjs**: in `dataPaths`, add `learner: path.join(dataDir, 'learner')`.

**derive.mjs**: the signature becomes `derive(session, profile, { onProgress, families, learner } = {})`. After the C1 family step and the existing SHAPES/receipt work, run the whole block below inside `try { ... } catch (e) { session.kv.set('MODEL', { error: String(e?.message ?? e), stage }); knowledge = { error: ... } }`, updating a `stage` string before each step. A failure must never prevent writing any I2 output, so put this block after `RECEIPT` is first computed, then re-set `RECEIPT` with the additive `knowledge` field.

1. `stage='discover'`:
   ```js
   const L = learner ?? new ScopedLearner();
   const model = discoverModel(corpusResult.samples, {
     learner: L,
     ctx: { site, family: profile?.family ?? undefined },
     families: familyList,
     patchGroups: corpusResult.patchGroups,
   });
   ```
2. `stage='identity'`: `const resolutions = resolveModel(model);`
3. `stage='correlate'`:
   - `entities = resolutions.flatMap(r => r.entities)`.
   - `subjects` = the top 500 entities by `observations` (ties by eid), mapped to `{ id: eid, kind: 'entity', attrs, t0: first, t1: last }`.
   - `elements` = `DOM_BLOCKS` filtered to `!removed && (text?.length ?? 0) >= 20`, last 2000, mapped to `{ id, text, firstT, lastT }`.
   - `renderedHyps = correlateRendered(subjects, elements)`
   - `actionHyps = correlateActions(reducer.actions, summary.streams)`
   - Record the caps applied: `{ subjectsTotal, subjectsUsed, elementsTotal, elementsUsed }`.
4. `stage='graph'`: `const graph = buildGraph({ model, resolutions, renderedHyps, actionHyps, session });`
5. `stage='persist'`:
   - `session.kv.set('MODEL', { ...modelSummary(model), corpus: corpusResult.stats })`
   - `session.dataset('entities').reset()`, then `.push(entities)`
   - `session.kv.set('GRAPH', graph.toJSON())`
   - `session.kv.set('HYPOTHESES', { rendered: renderedHyps, actions: actionHyps, caps })`
   - `knowledge = { types: model.types.length, entities: entities.length, edges: graph.edges.size, corpusSamples: corpusResult.stats.samples, corpusDropped: sum(dropped), unmodelledGroups: model.unmodelled.length }`

Then set `receipt.knowledge = knowledge`, re-set `RECEIPT`, and add `knowledge` to derive's return object.

Imports: `discoverModel`, `modelSummary` (discover), `resolveModel` (identity), `correlateRendered`, `correlateActions` (correlate), `buildGraph` (graph), `ScopedLearner` (learn), `siteOf` (profiles).

**server.mjs**:
- Construct `const learner = new ScopedLearner(paths.learner ?? path.join(paths.root, 'learner'))` before the Recorder, and set `famOpt = { families: familyStore, learner }`.
- Add routes under `sessions/:id`:
  - `model` → `kv MODEL ?? null`
  - `graph` → `kv GRAPH ?? null`
  - `hypotheses` → `kv HYPOTHESES ?? null`
- Entities are already reachable via `sessions/:id/dataset/entities`.

**bin/studio.mjs**:
- Add `const learner = () => new ScopedLearner(paths.learner)`. Pass `learner: learner()` in every `derive(...)` call (record finish, derive, receipt, shapes, profile apply).
- New command `model <id|latest>`. It reads kv MODEL, deriving first if missing. It prints one line per type: `name`, `key.field` or `(keyless)`, `support`, `confidence`, and the entity count from the `entities` dataset grouped by `type`. Then it prints counts of relationships by kind, unmodelled groups, corpus dropped totals, or the `error`/`stage` if present.
- Add `model <id|latest>` to HELP under Sessions.

**Invariants:** I2, I3 (no third argument → in-memory prior learner), I5 (entities carry revisions with session/sid/seq/domId and anchor), I1.

**Stuck-risk notes:** keep the try/catch boundary exact. Do not let `discoverModel` see `corpusResult.samples` being mutated afterwards. `ScopedLearner(dir)` creates the dir on load, which is fine. Do not call `learner.save()` in derive (C3 learns nothing).

---

## C4 — Close the confidence loop

**Files:** `src/shapes/infer.mjs`, `src/capture/recorder.mjs`, `src/replay/derive.mjs`, `src/studio/server.mjs`, `bin/studio.mjs`, `src/studio/ui/index.html`

- **infer.mjs `report(reducer, opts)`**: accept `opts.calibrator`. After suggestions are final (after decided marking, before sorting), set `g.calibratedConfidence = opts.calibrator ? opts.calibrator.calibrate(\`suggestion:${g.kind}\`, g.confidence) : g.confidence`. Do not change `g.confidence` or the sort key.
- **derive.mjs**: pass `calibrator: learner?.calibrator` into `shapes.report(...)`.
- **recorder.mjs**: the constructor accepts optional `learner` (stored as `this.learner`). `liveReport()` passes `calibrator: this.learner?.calibrator`.
- **server.mjs**:
  - Pass `learner` into `new Recorder({...})`.
  - In `profiles/:name/apply`, after a successful save:
    ```js
    learner.calibrator.observe(`suggestion:${body.suggestion.kind}`, Number(body.suggestion.confidence), body.action !== 'reject');
    learner.save();
    ```
    Use the raw `confidence`, never the calibrated one.
- **bin/studio.mjs**:
  - `profile apply`: same observe and save after `store.save`, with a single `learner()` instance.
  - `record`: pass `learner: learner()` into `new Recorder`.
- **index.html** line 428: display `Math.round((g.calibratedConfidence ?? g.confidence) * 100)` and add `title="raw ${Math.round(g.confidence * 100)}%"` on the `.conf` span.

**Invariants:** suggestion ids, ordering and raw confidence are unchanged. The calibrator shrinks toward raw when evidence is thin (existing `Calibrator.calibrate`), so with no feedback the displayed value equals raw. I2, I3.

---

## Out of scope (record, do not build)

Temporal graph v2 (W8), cross-session entity linking, compound keys (W1), consumption of `shapes.retention`, `stateAt` checkpoints, causal mechanism evidence (W6), security hardening.
