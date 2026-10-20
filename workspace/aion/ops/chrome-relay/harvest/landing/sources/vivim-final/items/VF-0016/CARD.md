# VF-0016 — Post-failure resend anti-pattern

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/send-resilience.ts:112-155](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/send-resilience.ts#L112-L155)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `00cda35a1bff318bd0ef3a1aea881f424ebfe391`

**Whole-source SHA256:** `03245fce57ba4e81a830216d18c63b0e0c3a2887ed87da293052691de7ff90d0`

**Excerpt SHA256:** `53516cc2f93e4771b661e0bf8fac5c51b3a8375b5673c4cd9ddf5125e4da3bda`

**Domains:** failure-classification, unknown-effect, recovery | **Prior lead:** FINAL-03

## Source intelligence
Concrete implementation exposes second sendFn after reconnect and recover replay.

## Hazards
REJECTED behavior; never automatically resend an uncertain external Send.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
