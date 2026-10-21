# PACK-05 - core-operation facets from the pinned Bridge manifest

**Status:** generated metadata for Development review. Not wired, not accepted, not live-verified. The generator ran offline and its output was validated (45 rows, 15 columns, 29 core operations, 0 missing proposals). No donor code was executed and no donor test was run.

## Provenance

- Donor columns are parsed from `chatgpt-bridge/tools/chrome-bridge-extension/shared/commandManifest.js` at upstream **`0ffdae90239988f253058c05253226152acd55d2`** (MIT), retained in `harvest/external/landing/donors/chatgpt-bridge/`.
- No donor source is copied into this pack. The CSV is derived metadata; the generator is kept so the donor side is reproducible rather than hand-transcribed.
- AION side is aligned to `workspace/aion/ops/command-space/CORE-OPERATIONS.csv` (29 operations: 19 P0 + 10 P1).

## Files

- `build-facets.mjs` - parser + mapping + proposals. Fails if the manifest does not yield exactly 29 definitions, if a mapped command is missing, or if a core operation has no proposal.
- `command-facets.csv` - one row per core operation (29) plus every donor command with no AION equivalent (16).

## What the donor side contains

The manifest gives each command four facet axes plus three effect/recovery facts:

| Axis | Values seen |
|---|---|
| scope | `REQUEST`, `STANDALONE`, `EITHER` |
| mode | `RESULT`, `EFFECT`, `RELEASE` |
| operation | `READ`, `WRITE`, `CONTROL`, `MAINTENANCE` |
| retry | `never`, `if_unconfirmed`, `always` |
| reconcile target | e.g. `submitted_turn`, `conversation_identity`, `current_turns`, `composer_attachments` |
| reload recovery | `SAFE_REPEAT`, `BROWSER_EFFECT`, `READ_PROBE`, `OBSERVATION`, `TYPED_UNCERTAINTY`, `CONTENT_EPOCH`, `LEASE_BARRIER`, `TARGET_COMMAND`, `DOWNLOAD_CAPTURE`, `MAINTENANCE_EPOCH` |
| `allowDuringLease` | `true` on release/read/identify/diagnostic commands only |

## Counts and mapping facts (machine-derived)

- 29 donor definitions = 7 request-scope + 22 standalone (`EITHER` counted in standalone).
- 15 core operations map to **13 distinct** donor commands: `model.select` and `thinking.level.set` both use `intelligence.apply`; `observe` and `recover` both use `request.resume`.
- **14 core operations are `NOT_LOCATED`:** `session.bind`, `file.attach`, `chat.rename`, `message.edit`, `response.regenerate`, `chat.search`, `chat.archive`, `chat.share`, `branch.create`, `message.copy`, `tool.toggle`, `project.select`, `chat.export`, `mode.select`.
- 16 donor commands have no AION core operation in this contract: release/lease, effect reconcile, command cancel, passive submit, five browser-tab commands, layout capture, extension reload, two artifact commands, `efforts.list`, and `composer.attachments.clear`.

## Invariants the table enforces

1. Every core operation has an explicit `proposed_aion_retry`, `proposed_aion_reconcile` and `proposed_aion_reload`. There are no blanks and no "TBD".
2. No mutation is proposed `retry: always`. Mutations are `never` or `if_unconfirmed`.
3. Reads are `always` + `SAFE_REPEAT`; a read may not adopt a browser-effect recovery value.
4. A destructive operation (`chat.delete`) is `never`, reconciles on observed absence, and uses `TYPED_UNCERTAINTY` on reload.
5. `allowDuringLease` is donor information only. AION Bus grant/lease authority is unchanged and is not modelled here.

## Integration notes (Development-owned)

1. Suggested destination: `extension/src/lib/command-facets.js` (or the existing op metadata module) as a frozen table keyed by semantic id. Do not create a second command registry; if AION already has per-op policy, this table is an input to it, not a replacement.
2. Use it for three things only: (a) table-driven negative tests, (b) a completeness check that every op declares retry/reconcile/reload, (c) review of any op whose handler omits its declared reconcile target.
3. **This pack changes no `event/1` or `snapshot/1` field and contains no Bus, ledger, grant or retry executor.** The `proposed_aion_*` columns are proposals; Development owns the final policy and may override any row.
4. Regenerate with:

```
cd harvest/external/workers/integration-manager/packs/PACK-05
node build-facets.mjs
```

## Deliberate differences from the donor

- Donor `intelligence.apply` is `never` but its implementation is fail-open (warns and continues). The AION proposal keeps `never` and adds the rule **fail closed if the selection is unconfirmed**; the donor's behaviour is explicitly not adopted.
- Donor `sessions.new` may report success before a durable conversation exists. The AION proposal requires a durable conversation identity before success.
- Donor `composer.attachments.clear` is not treated as `file.attach`; the upload side remains `AION_CUSTOM_BUILD`.

## Open questions

1. Does AION already bind retry policy to its Bus grant, making the `proposed_aion_retry` column descriptive rather than operative?
2. For `chat.delete`, is the required confirmation AION's own typed confirmation, the donor's `expectedSessionId` + `expectedUrl` + observed absence, or both?
3. Should `recover` reconcile on `request_projection` or on `effect_evidence` when a prior effect is unconfirmed?
4. Is `always` acceptable for `reply.read` when the underlying text may have changed between attempts, or should reads that return text be `if_unconfirmed`?
5. Which of the 16 donor-only commands, if any, should become AION core operations in a future contract revision? This pack deliberately does not add any.
