# Capture Studio — Immediate QA Handoff

This is the **single rolling pre-commit note** for independent ChatGPT QA. Opus replaces this content immediately before each *implementation* commit and includes it in that same commit. **No separate thinking, checking, tests, or reasoning pass.** Historical snapshots live in Git.

## Next implementation commit — W3 audit fixes (identity), graph state, expanded priors · PENDING INDEPENDENT QA

- **Changed:**
  - `src/intel/identity.mjs` — targets all 8 issue #63 W3 findings:
    - snapshot keys never inferred from time buckets (explicit `prov.snapshot` or session|sid|seq only);
    - blocks larger than 400 use a sorted-neighbourhood window (25) instead of being skipped;
    - keyed identity scoped by site (`prov.site`, else endpoint host from `prov.group`);
    - keyless linkage cannot link across different `prov.session`, and exact matches are term-frequency adjusted (`u = max(u_level, value frequency)`);
    - leading-5-words blocking key for long text, with MinHash raised to 4 keys;
    - canonical content-signature ordering; entity IDs derived from content (keyed: `type:k:sha(scope|key)`; keyless: `type:e:sha(min member signature)`);
    - every entity has `confidence` + `confidenceBasis` (keyed: key score; merged: weakest-link posterior; singleton: 1 − best candidate posterior);
    - state is folded across revisions (partial updates keep earlier fields), each revision carries `values` of changed fields, and a subset re-observation counts as a duplicate.
  - `src/intel/corpus.mjs` — samples carry `site`; DOM turns get an explicit `snapshot` id per capture.
  - `src/intel/graph.mjs` — revisions store values; `stateAt(t)` returns materialised `attrs`; nodes carry identity confidence.
  - `src/intel/priors.mjs` — explicit `[role, …]` format, roughly 200 cross-domain prior fields (was 124). Role-classifier behaviour changes everywhere.
- **What ChatGPT should test:**
  - Re-run the exact #63 reproductions:
    - 20 ms vs 100 ms rerenders;
    - more than 400 observations in one block;
    - same ID value on two unrelated sites;
    - generic text ("Thanks!", "OK") across sessions;
    - streaming prefix vs grown text;
    - shuffled-input entity IDs;
    - confidence present on all outputs;
    - partial updates keeping prior fields.
  - Role accuracy (dev / held-out v1 / v2) before and after the prior change, and keys and relationships for regressions (priors feed key scoring through `dist`).
  - Order invariance of linkage output (entity IDs *and* membership) under permutations.
- **Likely edge cases / cross-system risks:**
  - Session cannot-link now prevents **any** keyless cross-session merge, so cross-session continuity of keyless entities is intentionally gone (keyed only). Check this doesn't break expectations in the eval harness or families.
  - `scopeOf` from the group host: two sessions on the same site share scope (intended). Instances without `group` or `site` get scope `''` (old behaviour).
  - Keyed entity IDs changed format (`:k:` hash), so anything persisting or reading old eids (graph keyIndex, eval clusterMembership) may disagree.
  - Removing time-bucket snapshots means keyless DOM samples *without* explicit snapshot ids (old fixtures) lose the same-snapshot cannot-link. Near-duplicate fixtures may regress unless fixtures set `prov.snapshot`.
  - The TF adjustment uses the value frequency of instance `a` only. Asymmetric if normalisation differs; low risk.
  - Duplicate detection now treats a strict-subset observation as a duplicate. A legitimate field removal is never recorded as a change.
  - Singleton confidence semantics differ from merged-cluster semantics (different meanings under one field name).
- **Concrete input → expected behavior:**
  - Two keyed instances `{id:'7'}`, one from group `GET a.com/x :: …` and one from `GET b.com/x :: …`, in one type → 2 entities.
  - Keyless turns `{role:'user', text:'Thanks!'}` in sessions S1 and S2 → 2 entities.
  - Instances `{id:'x', a:1, b:2}` then `{id:'x', b:3}` → `attrs = {id:'x', a:1, b:3}`, revision 2 `values = {b:3}`.
  - The same instance set in any order → identical sorted eids.
- **Uncertainty:** Untested. All items are intuitive possibilities, not verified defects. Implementation reasoning was virtual; only `node --check` (syntax) was run.
