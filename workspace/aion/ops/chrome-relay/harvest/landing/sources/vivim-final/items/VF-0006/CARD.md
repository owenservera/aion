# VF-0006 — Resolved capability and gating contract

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/capability-resolution.ts:14-94](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/capability-resolution.ts#L14-L94)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `323876f0cd4895ae11035c08781a70c8a27c4c46`

**Whole-source SHA256:** `c8149b9b42c5a0ae31bf49258853a1f7550a2006e5ffa5bf3830ddb8cf242c49`

**Excerpt SHA256:** `577b1ed4719a37fb2ccf8b19ef015613ad66e772c4412922089d06d5216ccde4`

**Domains:** availability, provider-binding, capability-semantics | **Prior lead:** FINAL-02

## Source intelligence
Separates dependencies, UI state, binding status, confirmation and contextual gating.

## Hazards
Declared or resolved capability is not authorization or current action availability.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
