---
name: provenance-dedupe
description: Assign stable proposal IDs, capture source lineage and detect exact and related submissions without losing competing viewpoints.
---
# Provenance, Identity and Deduplication

## Steps
1. Read current INDEX.json and source/related hashes. Fetch latest before ID assignment, because other intake workers may have posted.
2. Assign next unused ATP-YYYYMMDD-NNNN (UTC captured date), and record origin kind, known author, locator, received/captured timestamps and preservation fidelity.
3. Compare exact raw SHA-256: if identical to an existing record, create an alias/source-link entry rather than duplicate, preserving attribution and separate submission event.
4. For semantically similar or conflicting ideas with different hashes, keep separate RAW proposals, then add `related_ids` with relationship `overlaps`/`alternative`/`contradicts`. Distinguish inference from source facts.
5. Preserve versions of edits as new source records and links; never overwrite prior published RAW.
6. Validate metadata against pool SCHEMA.md. Do not declare same-author duplicates without evidence.

## Output
Stable ID or alias to existing exact proposal, META with SHA/size/source/fidelity, and links to any related IDs. Integrity concerns recorded as BLOCKED.
