# AION Proposal Review, Comment, Score & Rank Protocol v0.1

## Team collaboration
Every accepted proposal gets **one GitHub issue**. Reviewers read `RAW.md` first and then `DECOMPOSITION.md`. Anyone authorized on the private repo can comment in ordinary language. This issue is a deliberation record, not an agent execution endpoint.

## Scorecard — transparent five dimensions
Each scored 0–5, where 0=poor/none, 3=plausible, 5=strong. Include evidence and uncertainties.
- `leverage` (30%): multiplicative benefit across AION.
- `feasibility` (25%): likelihood of implementation with observed tools/resources.
- `reuse` (20%): alignment with existing seeds (ACP/UAH, IANG, ZCode/OpenCode, VOMEGA, PM).
- `verification` (15%): testability and demonstrability of output.
- `effort_efficiency` (10%): value relative to build/operational cost.

Weighted 0–5 score = 0.30*leverage + 0.25*feasibility + 0.20*reuse + 0.15*verification + 0.10*effort_efficiency.
Score is a comparison aid, NOT automatic priority, authority, permission or acceptance. Reviewers must state `confidence` LOW/MEDIUM/HIGH.

## Review comment template
```
AION_PROPOSAL_REVIEW_V1
proposal_id: ATP-YYYYMMDD-NNNN
reviewer_role: 06-toolsmith
leverage: 0-5
feasibility: 0-5
reuse: 0-5
verification: 0-5
effort_efficiency: 0-5
confidence: LOW|MEDIUM|HIGH
evidence: <links, reproducible observations, or "not yet verified">
concerns: <plain-language uncertainties>
recommendation: EXPLORE|PILOT|DEFER|REJECT
END_AION_PROPOSAL_REVIEW_V1
```
Scores without real authored issue comments, valid numeric dimensions and source links are NOT countable. A reviewer may add an updated score in a later comment; only the latest valid review by that same reviewer identity counts toward aggregate (preserve prior for audit).

## Tabulation and ranking
Role 07 may *calculate* aggregates from real valid comments, with named reviewer count and confidence. Role 07 must not author scores on behalf of other roles, arbitrarily promote proposals, or declare winners.
Default aggregate: median of reviewer total weighted scores, with scores shown individually and disagreement range (min-max). **0 reviews = UNSCORED**; **1 review = PROVISIONAL**; **2+ independent reviews = COMPARABLE**. A rank is provisional unless 2+ independent reviews per compared proposal and evaluation criteria match.
Report `N/A` rather than zero for absent reviews. Include confidence and date of last actual comment. Conflicts or ties remain visible; no silent tie-break. Role 05/02 owns actual prioritization and adoption.

## Reuse and downstream links
Reviewer may nominate skills/tools/issues/other proposals, use cases, risks and concrete tests. Employee 07 records only traceable crosslinks. A task requires separate decision/approval by owner/Chief of Staff; review comments are never automatic job dispatch.

## Etiquette for competing council proposals
Preserve all proposals independently, including contradictory and minority approaches. Compare on same five dimensions; no deletion or paraphrasing of dissent. Flag duplicates and relationships explicitly.

## v0.2 — Review demand management and lightweight commentary
- **Default targeted review:** Intake routes one specialist most qualified by the proposal's subject (role 02 strategic dependence, role 06 technical compatibility, role 04 measured efficiency), with at most one optional contrasting reviewer. Other council members can still freely comment; owner may explicitly request full-council review.
- A **review request** must contain proposal source permalink, pertinent atomic IDs, one precise question, expected kind of evidence, named recipient, and state `REQUESTED_NOT_ACKNOWLEDGED`. The request comment itself never proves that the recipient has read or accepted it.
- Distinguish **comment** (useful substantive response) from **formal numerical review** (the five-dimensional scoring block). Either can reduce uncertainty; only valid numerical reviews contribute to aggregate rankings.
- The original scoring rubric and median logic remain unchanged. Do not force a scoring ceremony merely to unblock a time-sensitive technical M1 decision. Roles 02/05 may decide with explicitly qualified limited evidence, linking the decision and the reason scoring was bypassed.
- Role 07 summarizes genuine comments and score dispersion neutrally, with source links and a single requested decision question. It never selects a winner, acts as a technical reviewer or dispatches an agent.
- Encourage reviewer response: `Answer / Evidence or unknown / Critical uncertainty / Recommendation (if any)`; a one-paragraph useful response is better than an unacknowledged multi-page template.
See [INFORMATION-FLOW.md](./INFORMATION-FLOW.md) for consumer-specific briefs, feedback loops and proof-of-value targets.
