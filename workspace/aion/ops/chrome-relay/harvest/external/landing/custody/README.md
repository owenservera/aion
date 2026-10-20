# Custody — Worker 1 output

**Canonical manifest:** [SOURCE-RECEIPTS.json](SOURCE-RECEIPTS.json). **Orientation:** [SOURCE-MAP.md](SOURCE-MAP.md).

## Result (2026-10-20)

| State | Count |
|---|---|
| Upstream identity verified (ls-remote) | 9 / 9 |
| `CLONED_LOCAL` (bare, full history, fsck OK) | 9 / 9 |
| `MIRRORED_VERIFIED` | **0** |
| `SOURCE_PINNED_ONLY` | 9 |
| `BLOCKED` (mirror step) | 9 |
| `FAILED` | 0 |

**Mirrors were not created.** The custodian session's GitHub credential is scoped to `owenservera/aion`; it has no repository-create or fork authority, and no `aion-donor-*` repos or existing forks of these upstreams exist under `owenservera`. All nine licenses (MIT ×7, Apache-2.0, GPL-3.0) permit mirroring, so the block is authority, not legal.

Local bare clones lived in an ephemeral cloud workspace and are not durable custody. **Until mirrors exist, the pinned upstream URL + 40-char SHA in each receipt is the custody record**; Worker 2 should fetch those exact SHAs and stop if any upstream rewrites history.

## To complete mirroring

Run from a host with owner credentials, per donor (no force, no rewrite):

```
gh repo fork <upstream> --clone=false --fork-name aion-donor-<id>
# then confirm HEAD == upstream_head_sha in the receipt; if upstream has moved, repin explicitly
```

Then set `mirror_repository_url`, `mirror_head_sha`, `mirror_branch`, `checks.mirror_readback`, and flip `status` to `MIRRORED`.
