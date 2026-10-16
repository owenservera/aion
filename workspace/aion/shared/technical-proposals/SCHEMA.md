# Proposal Commons — Artifact Contract v0.1

## Proposal ID
`ATP-YYYYMMDD-NNNN` where date is initial captured UTC date and NNNN increments without collision. Never recycle an ID, even after a submission is withdrawn. Inspect INDEX.json and current paths before assignment.

## Per-submission layout
```
proposals/ATP-YYYYMMDD-NNNN/
  RAW.md               # exact source as supplied (do not wrap/reformat)
  META.json             # who, when, where, byte/hash evidence, privacy and linkage
  DECOMPOSITION.md      # role-07 derived layer, editable and source-grounded
```
If source bytes cannot be safely published, leave RAW absent, mark META status `QUARANTINED` or `SOURCE_MISSING`, and do not claim COMPLETE.

## META.json minimum
- `schema_version`: `aion.proposal/0.1`
- `proposal_id`: stable ID
- `title`: display title; not evidence the title came from author unless specified
- `source_kind`: `paste`, `file`, `url`, `authorized_connector`, `agent_submission`
- `source_locator`: exact canonical link or source handle when shareable
- `submitted_by`: known identifier or `unknown`
- `received_at_utc`, `captured_at_utc`: exact timestamps (don't invent)
- `raw_sha256`: SHA-256 of *stored* RAW bytes, or null
- `raw_bytes`: raw UTF-8 bytes count, or null
- `raw_preservation`: `EXACT_SOURCE_BYTES` (original byte stream independently verified), `EXACT_CAPTURED_TEXT` (text exactly as received in intake, original upstream bytes not independently verified), `NOT_CAPTURED`, or `REDACTED_WITH_CONSENT` (not exact raw)
- `intake_status`: `SOURCE_CAPTURED`, `DECOMPOSED`, `PUBLISHED`, `REVIEW_OPEN`, `PARTIAL`, `QUARANTINED`, `SOURCE_MISSING`
- `issue_url`: populated only after confirmed GitHub issue creation
- `related_ids`: array of plausible or exact links with reason
- `claims_verified`: false by default; first pass is not independent research.
Optional: original_author_title, language, topic tags, parent_request, source_message_id, version, access restrictions.

## DECOMPOSITION.md headings
- Source identity and preservation status
- One-paragraph neutral abstract (derived)
- Atomic technical ideas (one per line, grounded in source)
- Architecture choices/options (clearly source-derived)
- Components and interfaces
- Preconditions/dependencies
- Measurable proposed outputs/acceptance (as stated)
- Open questions and claims requiring verification
- Existing AION seeds/reuse opportunities (derived; label inference)
- Crosslinks and candidate consumers
- **Not a score, recommendation, implementation or dispatch**

## INDEX.json contract
`schema_version`, `updated_at_utc` (null when no publish event), `items` array. Each item must contain ID, title, source-kind, captured date, status, tags, paths to actual artifacts, `issue_url`, `review_count`, `aggregate_score` (nullable), `aggregate_confidence` (NO_REVIEWS/LOW/MODERATE), `linked_tasks`. No path may be advertised if not verified. Update via optimistic blob-SHA conflict-safe merge; avoid parallel writers to same path.

## Proposal and review evidence
Issue comments, reviewers, timestamps, and immutable Git raw blobs are primary. Score aggregation is a derived computation. Use structured score comments in REVIEW-PROTOCOL.md; never attribute a score to a role without a real authored receipt.

## Status semantics
`PUBLISHED` = raw + metadata + derivative links present; it does not imply review.
`REVIEW_OPEN` = issue live for commentary. `REVIEWED` = enough genuine structured reviews, not consensus.
`ADOPTED` / `REJECTED` / `IN_PROGRESS` belong to downstream authority, not employee 07.

## v0.2 additive routing metadata (optional until first real pilot)
Keep existing `aion.proposal/0.1` and `aion.proposal-index/0.1` compatible; the following are **optional additive fields**, not retroactively required of empty/old records.
- `atomic_ideas`: list of `{idea_id, source_anchor, abstract, source_type}`, with IDs `ATP-YYYYMMDD-NNNN:A01` etc. `source_type` = `AUTHOR_CLAIM` or `INTAKE_INFERENCE` and source references must resolve to RAW text.
- `routing`: `{primary_role, optional_secondary_role, review_request_urls, requested_at_utc, ack_urls, acknowledged_at_utc, state}` where state in `NOT_NEEDED`, `NEEDS_REVIEW`, `REQUESTED`, `ACKNOWLEDGED`, `REVIEWED`, `BLOCKED`. A request without a reply remains REQUESTED.
- `decision_refs`: array of actual role 02/05 issue permalink + decision status; never asserted by role 07.
- `downstream_refs`: real approved task, implementation, skill, test or proof links; null/empty until evidence.
- `consumer_packet`: optional short 5-line briefing included in issue or decomposition, not a standalone file; traceable to source and addressed to one role.
- `relevance_labels`: source-derived/mapped keywords, not the worker's numerical judgment of value.
- `review_last_updated_at_utc`: actual source comment time, not guessed system time.
All fields stored in META/INDEX are snapshots of authoritative Git objects/issues and must retain source URLs. The GitHub issue remains the canonical event journal; no new per-event file or chat channel. Use optimistic conflict-safe index writes.

**Additional states are orthogonal:** source custody/complete, routing/review, executive decision and separately approved execution are different dimensions. `REVIEWED` does not imply `ADOPTED`, and `DECISION_RECORDED` does not imply `TASK_APPROVED` or `EXECUTION_VERIFIED`.
