# VF-0006 — Resolved capability and gating contract

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/capability-resolution.ts:14-94](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/capability-resolution.ts#L14-L94)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `323876f0cd4895ae11035c08781a70c8a27c4c46`

**Whole-source SHA256:** `456cc2bfdf44b51fd6972ef67d54130f75eae4bed091454a61389033e51986e6`

**Excerpt SHA256:** `57686b8bb97b6453dfe278956d88d02ee7911764d949dc84f27c92dedeccb0ed`

**Domains:** availability,provider-binding,capability-semantics | **Prior lead:** FINAL-02

## Source intelligence
Separates dependencies, UI state, binding status, confirmation and contextual gating.

## Hazards
Declared or resolved capability is not authorization or current action availability.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
