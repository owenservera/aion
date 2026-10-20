# AION External Repository Harvest — launch order

**State: scaffold only; no clones or harvest performed here.**
**AION branch:** `harvest/external-browser-donors-20261020`.
**Rule:** Clone/mirror once → survey ALL repos briefly → choose one best owning donor per capability cluster → only then start deep harvest.

## Two immediate worker chats

**Worker 1 — Clone Custodian:** [01-CLONE-CUSTODIAN.md](01-CLONE-CUSTODIAN.md). Clone all nine candidate repositories, pin source revisions, and push each source into **an isolated, owner-controlled GitHub fork/mirror** if authorized and feasible; publish exact mirror links and receipts. The raw source never enters AION runtime or this branch. AION receives manifest, tree/license overview and links only. Must report failures honestly. This worker does **not** inspect features deeply.

**Worker 2 — Portfolio Triage:** [02-REPO-PRIORITIZATION.md](02-REPO-PRIORITIZATION.md). Starts once source identities/mirror links are present. Rapidly skim each pinned source for actual module ownership. Build a single cross-repository comparison; assign **one primary donor** per AION capability cluster, one backup, and explicit source-uniqueness rationale. No deep module harvest and no run tests yet.

**Deep harvest workers:** Only launch from triage's ranked deduplicated assignments, one deep lane per primary donor and non-overlapping ownership. Use [03-EVIDENCE-AND-PROMOTION.md](03-EVIDENCE-AND-PROMOTION.md). Do not have all nine repositories harvest the same send/receive implementation.

## Canonical reference already staged

- [reference/command-matrix-1000.csv](reference/command-matrix-1000.csv): all 40 registry commands across 25 provider-native/custom/ingress routes.
- [reference/core-operations.csv](reference/core-operations.csv): 19 P0 + 10 P1 core operations.
- [reference/route-origins.csv](reference/route-origins.csv): native versus AION custom versus ingress.
- [reference/capability-universe.csv](reference/capability-universe.csv): 40 registry commands plus 65 **unapproved research candidates**, including receive.cursor, receive.identity and send.correlation. Candidate ≠ implemented or officially documented provider feature.
- [sources.json](sources.json): nine intended upstream source repositories; all clone statuses remain unexecuted until Worker 1 receipts.

## Planned landing structure

```
external/
  00-START-HERE.md
  01-CLONE-CUSTODIAN.md
  02-REPO-PRIORITIZATION.md
  03-EVIDENCE-AND-PROMOTION.md
  sources.json
  reference/                   # frozen command catalog; read-only worker input
  landing/
    custody/                   # worker 1: immutable refs/mirror links/license manifests
    triage/                    # worker 2: repo × capability comparison; ranked donor ownership
    sources/<donor>/           # later: source-owned cards/excerpts, not full clones
    synthesis/                 # later: deduped candidates and integration decisions
```

**No part of the donor source becomes executable AION code through this branch.** When an item is useful, a separate implementation PR must justify compatibility, license, security, tests, and exact session fidelity. Use GitHub task/PR communication, not a second message bus.

## Quick launch

Paste the complete instructions in 01 into Chat 1. When its receipt PR lands, paste 02 into Chat 2. AION development and Claude architecture review can continue independently.
