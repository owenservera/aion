# Discovery-to-Read V1 — Autonomous Webapp Understanding

**AION initiative — opened 2026-10-24. Source baseline:** main at `fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9`.
**Development branch:** `initiative/discovery-to-read-v1-20261024`. **Status:** independent design and offline executable workbench; **not installed, promoted or live-browser accepted**.

## Mission

Demonstrate a previously unsupported website progressing from existing generic Capture Studio capture to a validated, versioned **read-only** adapter, without handwritten provider-specific code. Preserve provider-native structured messages, evidence identity and an unaltered single browser effect authority. Then show interface drift, a validated replacement proposal and rollback.

This initiative **does not replace** existing Capture Studio, the Round 8 adapter compiler, Round 9 holdout gate, I1 Intelligence pipeline, ProfileStore or the /chat shell. It supplies the missing cross-cutting contracts, deterministic integration workbench and acceptance criteria for the next implementation pass.

## Delivery structure

- `AGENTS.md` — initiative scope and non-overlap contract
- `ARCHITECTURE.md` — native object model, evidence tiers, promotion and integration seams
- `QUEUE.md` — ordered build and acceptance milestones
- `STATE.json` — machine-readable status with verified-vs-proposed distinction
- `src/evidence-receipts.mjs` — source-bound observation and independent held-out verification contract
- `src/native-projection.mjs` — evidence-preserving native conversation event materializer
- `src/workbench.mjs` — integrates existing Agent 14 Round 8/9 candidate and holdout logic without duplicating a factory
- `test/workbench.test.mjs` — synthetic adversarial Node 22 tests
- `fixtures/unknown-site.mjs` — fictional, synthetic unknown-site captures for reproducible replay
- `package.json` — no dependency installation required

## Quickstart

From this folder on Node 22 or later:

    npm test
    npm run demo

All fixtures are explicitly synthetic and cannot authorize or prove production profile activation. A passing offline workbench is **not** a passing Windows/Chrome live acceptance.

## Source of truth and coexistence

- Canonical Studio: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`
- Existing Round 8–9 code: `workspace/aion/sessions/roles/14-webapp-native-harness/implementations/`
- Consolidated four-lane input / Z.ai integration: PR #77, branch `integration/agent14-four-lane-20261024` (separate).
- Z.ai owns integration, 23-patch reconciliation and production collisions. This initiative owns the **future discovery-to-read contract and replay proof** until that baseline is verified.
- GitHub files and tests may be written in this folder only. No Playwright, Puppeteer, duplicate browser actor, parallel registry, new sender or write permission derived from observations.

## Exit acceptance

(1) Unknown-site candidate generated from verified-original source receipts; (2) truly independent train/heldout lineage; (3) observed semantics can become a read-only preview; (4) provider-native blocks retain exact source identity/revisions; (5) drift/rollback, including adversarial failures; (6) actual Studio wiring and Chrome/Windows evidence, **separate from offline success**.

**Do not merge to main or activate learned profiles merely because this folder exists.**


## Second development pass — integrated intake and transaction candidate

The following code is now **committed in this initiative**. It is not mounted in production Studio.

- `src/studio-source-reader.mjs`: direct import of canonical Studio `Session`, `rawDigest`, `domDigest`, and `readAcceptance`; original session exact-ID, finalization, manifest/sequence integrity, account/acquisition identity, twice-hashed source verification and receipt minting. A mandatory internal `resolveTrustedIdentity` callback must bind account/lineage from the original Studio run/journal; those fields are not presently derivable automatically from an arbitrary capture.
- `src/structural-read-verdict.mjs`: independent native-reference-versus-candidate interpretation score on each heldout source; selectors matching the wrong assistant/native ID cannot pass. This requires an independent Studio truth reader; fixture results are not production proof.
- `src/discovery-intake.mjs`: one callable pipeline consuming saved training/heldout capture IDs, trusted source receipts, bound structural probes, Round8/9 shadow and semantic validation. Returns a candidate or quarantine; **no dispatch, send, promotion or goal verdict**.
- `src/profile-cas-owner.mjs`: optional lock-and-expected-version adapter over existing `VersionedStore`. Saves immutable snapshots and supports atomic pointer replacement for rollback. It cannot protect writes that bypass its lock; full crash durability and Windows NTFS acceptance remain unproven.
- `test/{studio-source-reader,structural-read-verdict,discovery-intake,profile-cas-owner}.test.mjs`: 41 additional cases; total **62 committed**.

**Verification:** 52 cases passed with GitHub-source V8 contract shims; 10 CAS cases passed with an in-memory V8 filesystem shim = **62/62 simulated source-level assertions**. Neither run is an actual Node22 test, full real disk I/O verification, Windows acceptance or authenticated website capture. `npm test` remains the authoritative next check in a checked-out repo.

`npm run demo` now exercises the full fictional intake → Round8/9 → independent semantic fixture → native graph rather than only Round8/9. It never writes a live profile.

**Next actual dependencies:** a server-internal `resolveTrustedIdentity` grounded in original run metadata, a genuine independent native role/reference reader, all existing profile writers routed to a single CAS owner, and integration inside the already-existing `/chat` read path after Z.ai PR #77 reconciliation.
