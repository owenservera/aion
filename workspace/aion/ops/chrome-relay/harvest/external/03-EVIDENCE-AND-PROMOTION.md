# Simple evidence-card and promotion protocol (for later deep harvest only)

**Scope:** Deep-harvest workers can begin only after Worker 2's donor ownership schedule. This file is a schema; it is not an instruction to harvest now.

**One source, one owner, one capability decision.** Same semantics in multiple repos: choose a primary donor and record backups as links, not duplicated excerpts. All donor code remains quarantined outside AION; landing artifacts contain references, hashes and minimal legally permitted excerpts.

## Required card fields

```yaml
card_id: EXT-<DONOR>-<0001>
source: <original GitHub URL>
source_sha: <40 char commit>
source_file: <path:line range>
source_file_sha256: <hash>
license: <SPDX or UNKNOWN>
semantic_ids: [<exact existing IDs>]
candidate_ids: [<unapproved future IDs, if relevant>]
provider_surfaces: [<chatgpt-web | claude-web | api | ...>]
route_origin: <AION_CUSTOM_BROWSER | PROVIDER_NATIVE | APP_INGRESS | PROTOCOL_PRIMITIVE>
observed_behavior: <what the specific source does>
evidence: <CODE_INSPECTED | DOCS_REPORTED | FIXTURE | LIVE_VERIFIED>
confidence: <HIGH | MEDIUM | LOW>
risk: <no-resend | ambiguity | source auth | dynamic selectors | privacy |...>
primary_or_backup: <PRIMARY | BACKUP>
decision: <KEEP_AION | ADAPT_PATTERN | COPY_AFTER_LICENSE_AND_TEST | REBUILD | REJECT_UNSAFE | RESEARCH_GAP>
aion_destination: <actual existing source seam or PENDING>
tests_required: <deterministic positive/negative>
```

## Five admission rules

1. **Identity, provenance, licensing:** Source pin + line + hash + license must exist. Documentation ≠ implementation; offline ≠ account-live.
2. **No effect confusion:** A browser operation may execute exactly once; network loss after possible Send must never produce blind retry or Enter fallback. No ranked selection of ambiguous Send controls.
3. **Session fidelity:** Existing ChatGPT/Claude/Gemini web conversation ≠ new API session ≠ a local app-owned transcript.
4. **Reference first:** Harvest cards/fixtures, not entire donor projects. Never push secrets, cookies, private endpoints, transcripts or bulk upstream source into AION.
5. **Integration only via new reviewed PR:** Owner accepts specific module+tests and compatible license. Before that, all donor findings remain untrusted research. No direct automatic promotion from cards.

## Status progression

`UNSCANNED → PINNED → TRIAGED → CARD_CAPTURED → CROSSWALKED → OWNER_ACCEPTED → AION_IMPLEMENTED_OFFLINE → LIVE_VERIFIED`

`REJECT_UNSAFE` and `BLOCKED` are legitimate terminal research outcomes. Every worker returns SHA/PR/counts and open gaps.
