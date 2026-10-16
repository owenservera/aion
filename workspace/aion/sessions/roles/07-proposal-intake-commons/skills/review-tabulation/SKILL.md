---
name: review-tabulation
description: Recompute transparent multi-reviewer proposal scores and rankings from genuine structured GitHub comments while preserving dissent.
---
# Evidence-Based Review & Rank

## Role limitation
Employee 07 facilitates and *calculates*. The council and role leads author reviews and make substantive priority decisions. No auto-adoption or false consensus.

## Steps
1. Fetch the actual proposal issue and relevant comments. Extract explicit AION_PROPOSAL_REVIEW_V1 ... END_AION_PROPOSAL_REVIEW_V1 blocks.
2. Validate reviewer identity/source comment URL, matching proposal_id, five integer 0–5 ratings, confidence and review timestamp. Noncompliant reviews remain ordinary discussion and count as 0 formal reviews.
3. If same verified reviewer submits multiple complete reviews, take the latest one as current while preserving history; do not merge identities by self-asserted `reviewer_role` alone.
4. Compute individual weighted total = .30 leverage + .25 feasibility + .20 reuse + .15 verification + .10 effort_efficiency. Scores can be shown to two decimals, alongside author/comment link.
5. Aggregate using median of valid reviewer totals. Show low/high disagreement, reviewer count, confidence and last-review time.
6. N=0: UNSCORED; N=1: PROVISIONAL; N>=2 distinct real reviewer identities: COMPARABLE. Never give definite rank from a single assessment.
7. Rebuild RANKINGS.md and INDEX derived scoring fields from comments; include calculation date, rubric version and source URLs; no fabricated timestamps.
8. Any malformed score or suspected impersonation remains an explicit review-integrity exception.

## Output
Reproducible leaderboard with evidence and dissent, not an intake-worker recommendation. Provide drilldown links to GitHub discussion.

## v0.2 small reviews, useful decisions
A useful ordinary reviewer comment answers a concrete sourced question but is **not** a scored review. Preserve and reference it; never create numeric ratings from prose. Only complete genuine `AION_PROPOSAL_REVIEW_V1` blocks contribute scores. In urgent M1 work, route the evidence plus remaining uncertainty to Role 02/05 without waiting for numerical scores; reflect UNSCORED accurately. Distinguish mere REQUESTED from reviewer ACKNOWLEDGED using a real reply URL. Record decision/implementation links only after actual authorized external receipts.
