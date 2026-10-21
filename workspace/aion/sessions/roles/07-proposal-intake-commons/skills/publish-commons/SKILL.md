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

## v0.2 follow-through — publication to consumption
After the canonical issue and index have been fetched successfully, read `INFORMATION-FLOW.md`. If a review is useful, identify one domain-matched reviewer and (only if needed) a contrasting second reviewer. Post the five-line source-backed packet and `AION_INTAKE_REVIEW_REQUEST_V1` issue comment, with request timestamp and permalink. Don't invent notifications or presume another ChatGPT chat woke up. Keep request pending until actual reviewer-authored issue response; Chief of Staff is responsible for inter-role acknowledgement. For truly duplicate/low-relevance archival sources, record NO_REVIEW_NEEDED with explicit rationale (not a quality rejection). Update INDEX snapshot with actual route links and source freshness. Link back real decision/work receipt only if independently observed. This follow-through is **source logistics, not technical selection, implementation or priority decision**.

## Integrity check at publication

Before treating RAW/META/DECOMPOSITION as a complete proposal, run the read-only Node preflight from `../reconcile-recover/scripts/preflight.mjs` on the actual local package. After a verified INDEX write, rerun with `--index` and the canonical INDEX.json path. This checks stored hash, bytes, ID and index consistency; it does not prove source rights, external issue contents or reviewer acknowledgments. If Node/local checkout is unavailable, record NOT_RUN, keep honest partial status, and verify source/issue/index through the authorized GitHub connector instead.
