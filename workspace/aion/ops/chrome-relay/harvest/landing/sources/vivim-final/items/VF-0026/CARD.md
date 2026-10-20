# VF-0026 — Existential rule evaluator fail-open branch

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/capability-resolution.ts:319-360](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/capability-resolution.ts#L319-L360)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `323876f0cd4895ae11035c08781a70c8a27c4c46`

**Whole-source SHA256:** `c8149b9b42c5a0ae31bf49258853a1f7550a2006e5ffa5bf3830ddb8cf242c49`

**Excerpt SHA256:** `26100cba784bdecc70aa38c8e0e0f4c46241ce24ecd39d79ab3deced45b463b6`

**Domains:** availability, rule-evaluation, fail-open-risk | **Prior lead:** FINAL-02

## Source intelligence
Actual evaluator fails closed when context absent, but returns true for unparseable expressions.

## Hazards
CRITICAL: malformed rules currently default to satisfied; must fail closed for any authority-sensitive decision.

## Coverage and acceptance
Only the cited selected lines were read/captured. Donor execution, browser activity, tests and local checkout inspection are not claimed. Not accepted as AION product specification; inspect owners/tests and independently approve before promotion.
