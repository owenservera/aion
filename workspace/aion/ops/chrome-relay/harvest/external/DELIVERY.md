# Nine external repositories — delivery to AION Development

**Delivery contract:** [shared exchange](../EXCHANGE.md) · [open need AX-0004](../EXCHANGE.jsonl) · [repository governance](../../../../../../REPOSITORY-GOVERNANCE.md).

**Current state:** nine pinned source snapshots are already stored under [`landing/donors/`](landing/donors/); the catalog and reference files are on `main`. **Cross-repo capability ownership and code-level suitability are not yet verified.** Do not advertise candidates as ready to integrate.

## Lane's internal research (kept here, not dumped on Development)

Use the existing [repo prioritization brief](02-REPO-PRIORITIZATION.md), [source list](sources.json), [reference taxonomy](reference/) and [evidence protocol](03-EVIDENCE-AND-PROMOTION.md). Inspect all nine sources once; for each capability cluster, select **one primary**, at most one meaningful backup, and explicit uncovered gaps. Prioritize receive cursor/message identity, safe Send/correlation, provider adapters, conversation lifecycle, attachments, CDP/fixtures, and native API/ACP seams.

When findings exist, record the *internal* evidence in existing `landing/triage/`: `REPO-ROLES.csv`, `CAPABILITY-DONOR-OWNERS.csv`, `DEEP-HARVEST-LANES.md`, `GAPS-AND-DUPLICATES.md`. These are output targets from the already-existing prioritization brief; **not evidence of completed research**. If only a subset is needed, publish just that subset rather than empty scaffolds.

## Lane's outward delivery (what Development actually reads)

Add/update a small number of OFFER or GAP entries in [`../EXCHANGE.jsonl`](../EXCHANGE.jsonl), using the [same fields](../EXCHANGE.md) as Development NEEDs and matching their `topic`. Every offer must say:

- exact donor, source revision and file(s), actual behavior inspected, one primary owner, and overlap eliminated;
- recommended `ADAPT_PATTERN | COPY_AFTER_LICENSE_AND_TEST | REBUILD | REJECT | RESEARCH_GAP`, with license, safety and compatibility limitations;
- relevant AION seam, expected engineering leverage, narrow acceptance test, and **one next action**.

**Delivery threshold:** an engineer can immediately decide whether to use the finding, commission one bounded follow-up, or reject it, **without reading nine repositories**. A record grounded only in README/guesswork stays `DOC_ONLY / NEEDS_EVIDENCE`.

**First assignment:** resolve [AX-0004](../EXCHANGE.jsonl) and then [AX-0006](../EXCHANGE.jsonl). The nine source folders are already available—do not re-clone, run donor code, or start overlapping deep-harvest tasks merely to produce the triage.
