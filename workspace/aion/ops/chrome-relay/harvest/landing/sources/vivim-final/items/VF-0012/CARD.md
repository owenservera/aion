# VF-0012 — Conversation and artifact normalization

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/provider-conversation-adapter.ts:14-100](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/provider-conversation-adapter.ts#L14-L100)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `b6ca6bdd412ebdfe3bd3a811f295a31e5d427271`

**Whole-source SHA256:** `1e79e6bd95f47adc4955fa57f2cfec62fdde26749e68add054f873f0d31ecdd9`

**Excerpt SHA256:** `ead8d7445bb03fa13cce995b9fb367dc3fc18543a849cec1ea696acd90569ad1`

**Domains:** conversation-identity, provider-adapters, message-schema | **Prior lead:** FINAL-08

## Source intelligence
Normalizes conversation/message IDs, DAG linkage, artifacts and pagination.

## Hazards
Pre-extracted credentials and REST/RPC patterns must not be imported.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
