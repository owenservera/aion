# VF-0007 — Concrete resolution filter

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/capability-resolution.ts:160-226](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/capability-resolution.ts#L160-L226)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `323876f0cd4895ae11035c08781a70c8a27c4c46`

**Whole-source SHA256:** `c8149b9b42c5a0ae31bf49258853a1f7550a2006e5ffa5bf3830ddb8cf242c49`

**Excerpt SHA256:** `332e4dc652ff63304f9c6d67cd9538046442fc9f10bf5438e2b18b849acc9211`

**Domains:** availability, rule-evaluation, provider-binding | **Prior lead:** FINAL-02

## Source intelligence
Implementation filters tiers, existential rules and bound dependencies before UI grouping.

## Hazards
Rule evaluator and store need follow-up; not per-turn Send/Stop proof.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
