# VF-0022 — Presentation-only Send affordance

**Flag:** ADJACENT | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [frontend/src/components/chat/SendButton.tsx:1-33](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/chat/SendButton.tsx#L1-L33)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `4ecc911e2857d0b9cf89e5df41195d3066832d04`

**Whole-source SHA256:** `a3a913be8eb021816ad36ed157959947ad753d0e4ea1723b83f35c32b32d7ee1`

**Excerpt SHA256:** `31a61e4f478b654c8d4430e5f3fa48fad9b551bffff6cf7c5e4e4254c379a4cb`

**Domains:** ui-affordances, send-readiness, provider-realization | **Prior lead:** FINAL-05

## Source intelligence
Shows SendButton exposes click/disabled props rather than provider-side effect evidence.

## Hazards
Rendered enabled button does not prove active Send or submission.

## Coverage and acceptance
Only the cited selected lines were read/captured. Donor execution, browser activity, tests and local checkout inspection are not claimed. Not accepted as AION product specification; inspect owners/tests and independently approve before promotion.
