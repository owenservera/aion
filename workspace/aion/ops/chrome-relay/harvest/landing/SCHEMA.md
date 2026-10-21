# Harvest landing record format
Each item is indexed in `sources/<source>/index.jsonl` and optionally materialized in `sources/<source>/items/<id>/`.

## Required candidate fields
- `id`: stable source-prefixed ID (e.g. VF-0001, VO-0001)
- `source_repo`, `source_checkout`, `source_revision` (or `UNKNOWN`), `dirty_state` (`clean|dirty|unknown`)
- `source_path`, `source_symbol`, `line_ranges`
- `original_title`, `original_terms`, `one_sentence_value`
- `domains`: one or more broad taxonomy tags
- `kind`: `concept|schema|implementation|test|reference|experiment|documentation`
- `capture_status`: `FLAGGED|COPIED_EXCERPT|COPIED_MODULE|BLOCKED|DUPLICATE_POINTER`
- `coverage`: `search_hit|excerpt_read|whole_module_read|tests_read|offline_tested`
- `copied_paths`: exact relative landing paths; empty until copying done
- `source_sha256` and `copy_sha256` when bytes were copied
- `dependencies`, `related_ids`, `suspected_duplicates`
- `hazards`, `confidence`, `operator_notes`
- `capture_utc`, `worker_id`; `test_command` and `test_result` only if actually run.

## Flag priority
`CORE`: directly relevant to Track B provider/capability/evidence architecture.
`ADJACENT`: likely valuable for future providers/features.
`EXPERIMENTAL`: novel but immature or incompletely validated.
`REFERENCE`: taxonomy, design, contracts, comparisons or educational source.
`EXCLUDE`: secret/private data, unrelated content, generated/vendor bulk.

## Copy policy
Use narrow, reviewable excerpts or complete *small* owning modules only when justified and rights/access allow. Preserve original bytes in a source file where practical; do not silently rewrite source code. Add `CARD.md` summarizing provenance, flags, original vocabulary, reader coverage, links, risks and reasons for capture. Document sanitization if necessary; never copy sensitive content first and sanitize later. Mark missing revisions and incomplete reads explicitly. Duplicate copies should point to an existing record and describe variant differences.

## Parallelism contract
Worker A writes only `sources/vivim-final/`; B only `sources/vivim-omega/`; C only `synthesis/`. They may read everything in landing and pre-existing FINDINGS.md. No shared index writes; cross-repo relations are maintained by C, not through edits of A/B indexes. Git pushes from parallel local checkouts require separate branches/worktrees and integration by fast-forward/cherry-pick/PR after conflict checks.

## Completion of a batch
Inventory coverage scope and gaps; list flagged and copied IDs separately; number of bytes/files; copy integrity checks; duplicate/variant notes; commit ID if committed; next bounded set of paths. No claim of live verification without live evidence.
