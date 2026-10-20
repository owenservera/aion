# VF-0013 — Legal session lifecycle transitions

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/session-lifecycle-manager.ts:17-114](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/session-lifecycle-manager.ts#L17-L114)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `b87f9ea37d20227d722abea914452861b31f83e4`

**Whole-source SHA256:** `c6238183eecbac4ef1c9ef3a24b5257b1f59bd44308afd5271c5c0bc32ce8edf`

**Excerpt SHA256:** `dd2cabd650a92356c3b49341a62a5a4ae720dca9fd36f9814794a4fbfa811d3a`

**Domains:** session-state, transition-law, lifecycle | **Prior lead:** FINAL-06

## Source intelligence
Session state and legal transition table inform one independent state axis.

## Hazards
Idle or recovered session never proves turn submitted/completed.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
