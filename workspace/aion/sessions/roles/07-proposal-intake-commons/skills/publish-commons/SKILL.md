---
name: publish-commons
description: Land an authenticated, preserved and neutrally decomposed proposal in existing GitHub shared pool with review issue and searchable index.
---
# Publish to Common Pool

## Preconditions
Real RAW artifact, source META with hash, derived DECOMPOSITION, authorized private repo scope. If RAW unavailable, create an explicit partial record and seek original rather than claim full publication.

## Steps
1. Commit and fetch immutable RAW, then META and DECOMPOSITION with actual links and source identity.
2. Create exactly one GitHub issue for accepted proposal using TEMPLATES.md; pin links to commits where practicable; include raw integrity state, source kind, objective metadata, review instructions.
3. Fetch created issue and verify its URL, number, state and content. Record `issue_url` in META only after success.
4. Fetch latest INDEX.json and its SHA. Merge one item while preserving other writers' entries, update via compare-and-swap; on conflict refetch and merge. Do not force overwrite or create duplicate IDs.
5. Fetch INDEX and issue independently. Update summary RANKINGS only when real review data exists.
6. Publish a short intake receipt with ID, SHA, RAW/META/DECOMPOSITION issue URLs, captured timestamp and unresolved sources.
7. Link intake completion to Chief of Staff/council through existing channel; never assume they read a commit just because it exists.

## Acceptance
Accessible source, derivative, valid index, real review issue and readback. If any part fails, mark PARTIAL with exact succeeding/failed stages and recover using existing IDs.
