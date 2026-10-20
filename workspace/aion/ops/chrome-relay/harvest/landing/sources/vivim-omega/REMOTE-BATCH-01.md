# Vivim-omega — GitHub remote harvest, batch 01

**Recorded:** 2026-10-20T10:55:18.402Z

**Source:** [owenservera/vivim-omega](https://github.com/owenservera/vivim-omega) at exact commit `79ee558d6c7ea77c20f220db2341adaa57b11d44` (main, 2026-09-21). The remote tree contains **873 blobs** at this revision. GitHub does not expose a dirty working-tree status; `dirty_state=unknown` means not applicable to an immutable remote commit.

**Important source split:** this remote repository has `contracts/`, `plugins/`, `host/`, `shim/`, `surfaces/`, and `docs/`. It does NOT contain the original worker brief's `Core/vivim-final-enhanced`, `BCP-dev`, or `FullTest` trees. The pre-existing OMEGA-01..08 findings from the local checkout are **neither revalidated nor replaced** by this batch. Similar concepts may have shared ancestry; do not double-count them as independent proof.

## Evidence and capture summary

- **Candidate records:** 27; **copied complete small owner modules/documents:** 15; **flagged but not copied:** 12.
- **Source copies:** 15 original text files, total 73858 UTF-8 bytes, each stored with SHA-256 and source Git blob SHA. **Cards:** 15.
- **Scope:** 873 remote blobs inventoried at tree level. Module-level reads/copies are limited to the 15 named owners. Flagged items are not fully analyzed.
- **Tests:** NONE executed; test files copied/read are not execution evidence. **No browser, CDP, CLI, network actuation, installation, or source modification** was performed. GitHub API read/writes apply only to remote source inspection and AION landing publication.
- **No private transcripts, fixtures containing planted secrets, credentials, bulk archives, or generated datasets copied.** No AION product code, existing `FINDINGS.md`, `SCHEMA.md`, or other worker area modified.

## Source-class inventory (remote)

| Area | Candidate intelligence | Boundaries |
|---|---|---|
| contracts/src | ProviderClass, ProviderRealization, stream/refusal/result envelope, chat/identity, command surface | Catalog and evidence are not live browser availability |
| plugins/vivim-providers | Realization-derived registry, liveness, lifecycle | Historical promotion cannot authorize Send |
| plugins/provider-browser | Fixture **email** browser mediation, session refs, redaction, four pre-send bars | Not a live ChatGPT adapter; no live CDP validated |
| plugins/vivim-chat | Deterministic command name resolution, conversation provenance | Interpretation is separate from action/effect |
| plugins/discovery-* | Perception, inference, mapping, verification, evidence promotion | Flagged implementations pending full-owner verification |
| surfaces/{mcp,cli} | A shared routed-op derivation rather than a second tool registry | Tools/list alone cannot establish external readiness |
| docs/decisions | Browser threat and fixture validation design history | Ratified Omega docs ≠ AION acceptance |

## Index / copies

- **VO-GH-0001** — `contracts/src/manifest.ts` (7906 bytes; SHA256 `5edd767efaa4…`)
- **VO-GH-0002** — `contracts/src/vocabulary.ts` (3231 bytes; SHA256 `903492f5af77…`)
- **VO-GH-0003** — `contracts/src/provider.ts` (8125 bytes; SHA256 `cd8e39c1d7ca…`)
- **VO-GH-0004** — `contracts/src/port.ts` (4384 bytes; SHA256 `8a7b7980d35f…`)
- **VO-GH-0005** — `contracts/src/surface.ts` (2022 bytes; SHA256 `fc690a728454…`)
- **VO-GH-0006** — `contracts/src/outcome.ts` (1624 bytes; SHA256 `53ab344c12ec…`)
- **VO-GH-0007** — `plugins/vivim-providers/src/registry.ts` (4358 bytes; SHA256 `80f2ba997ddd…`)
- **VO-GH-0008** — `plugins/provider-browser/src/session.ts` (6480 bytes; SHA256 `e6813a812ff7…`)
- **VO-GH-0009** — `plugins/vivim-chat/src/resolve.ts` (4835 bytes; SHA256 `f95f4ffaac35…`)
- **VO-GH-0010** — `contracts/src/chat.ts` (6182 bytes; SHA256 `9ed2bcf7c386…`)
- **VO-GH-0011** — `plugins/vivim-chat/test/resolve.test.ts` (3938 bytes; SHA256 `36763e9af070…`)
- **VO-GH-0012** — `plugins/provider-browser/plugin.json` (3515 bytes; SHA256 `19d4892969e0…`)
- **VO-GH-0013** — `docs/decisions/D-338-browser-realization.md` (2905 bytes; SHA256 `129e1325daae…`)
- **VO-GH-0014** — `docs/decisions/D-357-browser-realization.md` (6147 bytes; SHA256 `c92dea3a3b90…`)
- **VO-GH-0015** — `docs/SURFACES.md` (8206 bytes; SHA256 `bf929703df6a…`)

## Next waves

1. Deep read flagged owners `plugins/provider-browser/src/index.ts` + falsifier, `plugins/discovery-verification/src/index.ts` + policy and evaluation helpers; identify *preflight, dispatch, unknown-effect, evidence* boundaries without claiming reusable resend policy.
2. Crosswalk Omega's semantic provider class vs API-native, browser-mediated, simulator vs the distinct **AI chat webapp / bespoke provider webapp** classification AION needs. Do not treat class as app family.
3. Check variant/duplication versus prior local OMEGA-01..08 only if later source evidence is available; preserve both provenance roots.
4. Worker C should consume stable IDs `VO-GH-0001..0027` and publish provisional mapping under `synthesis/`, with no new AION authority semantics or product changes.

**Status:** HARVESTED_SOURCE_EVIDENCE, never ACCEPTED_FOR_SPEC or LIVE_VERIFIED.
