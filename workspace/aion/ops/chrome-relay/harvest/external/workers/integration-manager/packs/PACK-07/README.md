# PACK-07 - artifact identity, transfer integrity, verify-before-apply

**Status:** staged for Development review. Not wired, not accepted, not live-verified. The fixtures in this pack **were** executed offline (`node --test`, 12/12 passing, Node 24.11.1). No donor test was run. No browser, network, file input or composer was touched.

## Provenance

Adapted from `chatgpt-bridge` at upstream **`0ffdae90239988f253058c05253226152acd55d2`** (MIT), retained in `harvest/external/landing/donors/chatgpt-bridge/`:

- `tools/chrome-bridge-extension/shared/transferIntegrity.js` — metadata bounds and the SHA-256 gate.
- `src/bridge/transferIntegrity.js` — `TransferAccumulator`: unchanged metadata, strictly next index, contiguous offset, exact encoded length, canonical decode, raw size, then hash.
- `tools/codex-chat-ui/ui-core.js` `artifactIdentity` (lines 163-182) — estuary content id, then SHA-256, then id, then source URL.

License: `LICENSE-CHATGPT-BRIDGE.txt` (Serhii Tkachenko, 2026 MIT).

The donor's own `test/transferIntegrity.test.js` was **not** run. Its cases (malformed metadata, loss, duplicates, order, offsets, truncation, corruption, mixed identity) are re-expressed here as offline fixtures.

## What it does

- `validateTransferMetadata` refuses a bad transfer id, a non-integer or out-of-range size, an encoded size above 178,956,972, more than 4,096 chunks, a missing chunk count, a non-64-hex SHA-256, an unknown encoding, or a binary transfer whose encoded size differs from its raw size. Raw bound is 128 MiB.
- `TransferAccumulator` accepts chunks only in order. A gap, a duplicate and a reorder are the same error. Metadata that changes mid-transfer is refused. `finish` joins the chunks, decodes, checks the raw size and the SHA-256, and only then returns `{ verified: true, bytes, content }`.
- `assertReadyToApply` returns those bytes only when `verified === true`. There is no partial-apply result.
- `artifactIdentity` returns `estuary:<id>`, `sha256:<hex>`, `id:<id>`, `source:<url>`, or `''`. Empty is not a match.

## What it does not do

- **Upload.** `file.attach` stays `AION_CUSTOM_BUILD`. The donor's composer path (`content/attachmentCommands.js` lines 44-48) catches a failed chip wait, emits `files.attach.warning`, and still emits `files.attach.done`. That fail-open is **not** adopted. This pack has no file input and no `files.attach.done`.
- **Conversation-record reconciliation.** The donor's optional same-origin GET, session token and `matched_complete` statuses are not ported. That evidence is not a completion gate, and this pack does not fetch anything.
- **Preview repair.** `reconcileArtifactItems` can rewrite an existing artifact item in place. Not ported.
- **Producer authentication.** A matching SHA-256 proves the bytes match the declared hash. It does not prove who produced them.

## Deliberate deviations

1. Plain ES module. Hashing uses `crypto.subtle`, which Node 24 and a browser both provide. No `node:crypto` import, so the file does not grow a Node-only dependency.
2. Base64 must be canonical: length multiple of 4, alphabet check, and `btoa(atob(content)) === content`. The donor's Node `Buffer` decoder is more lenient; AION refuses the lenient cases when they still fit the declared encoded size.
3. `finish` is async because `crypto.subtle.digest` is async. The donor server path hashes synchronously.
4. A settled transfer refuses further appends. The donor drops accumulator state when the command settles; this pack cannot see command lifetime, so it settles itself.

## Integration points (Development-owned)

1. Suggested destination: beside the existing artifact/download receive path, not a new store. If AION already hashes downloads, feed this checker; do not add a second blob registry.
2. Call `assertReadyToApply` before any consumer reads the bytes. A thrown `TRANSFER_INTEGRITY_INVALID` is a refusal, not a warning.
3. Use `artifactIdentity` only as a comparison key. Do not persist `''`, and do not treat two empty identities as the same artifact.
4. **This pack changes no `event/1` or `snapshot/1` field** and does not touch Bus, ledger or grants.

## Tests

```
cd harvest/external/workers/integration-manager/packs/PACK-07
node --test
```

12 fixtures: metadata bounds, one-chunk and two-chunk success, gap/reorder, changed metadata, bad offset, oversize chunk, incomplete finish, unverified apply, hash mismatch, canonical base64, settled-transfer refusal, and artifact identity precedence including a non-URL alias.

## Open questions for Development

1. Does the live download path already hash at the browser materialization boundary? If so, this checker should sit there, not earlier.
2. Should a URL attachment with no declared SHA-256 be refused outright? The donor allows a size-only check. This pack cannot verify such a URL because it never fetches.
3. Chrome download capture (filesystem identity, not a byte stream) is a different path. This accumulator must not be forced onto it.
