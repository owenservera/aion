# VF-0015 — Message identity and deduplication

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/message-identity.ts:1-71](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/message-identity.ts#L1-L71)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `1ee8692953b4942a909865f03cf27ff546cd1220`

**Whole-source SHA256:** `fcc7230daa02bcc34dd90482f3e1f710dbf895ceedc95875288a4fa2dd8e20f1`

**Excerpt SHA256:** `eb478f3522b9b78c0cc6c911090cc49a95119f36d83f91da77ac5e0c00bddbd7`

**Domains:** message-identity, provenance, duplicate-suppression | **Prior lead:** FINAL-08

## Source intelligence
Source supports durable provider/account/conversation-level message correlation.

## Hazards
Content hashes are not idempotent operation IDs or exactly-once dispatch.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
