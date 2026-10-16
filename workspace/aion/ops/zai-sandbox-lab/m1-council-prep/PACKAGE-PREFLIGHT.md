# Z-FORGE M1 source-package static preflight — 2026-10-17

Verification: role 08 integrator GitHub-readback static checks, not independent sandbox build verification.
**Frozen input commit:** [`23251d0182f60d8f0055671a9efb226eca56a0a5`](https://github.com/owenservera/aion/commit/23251d0182f60d8f0055671a9efb226eca56a0a5).
**Owner work order:** https://github.com/owenservera/aion/issues/24

## Observed checks
- 14 exact source/package files fetched successfully at immutable ref `23251d0182f60d8f0055671a9efb226eca56a0a5`.
- Manifest parsed: eight distinct M1C role IDs; 05 Chief gates and 08 Z-FORGE integrator reports marked delivered AS DOCUMENTS; six missing reports (01/02/03/04/06/07).
- Mock vectors parsed: 16 distinct design scenarios (P01 plus N01–N15), expressly NOT executed tests.
- Source-derived interface reconciliation, two prompt packets, test/export and recovery instructions present and readable.
- Z.ai runtime, model, turn, tests, artifact ZIP/hash and actual authenticated ChatGPT session are NOT VERIFIED. The source manifest says sandbox NOT_STARTED.

## Immutable input file checksums
SHA-256 below is computed over UTF-8 content read at the pinned GitHub source commit. Git blob IDs are SHA-1 objects and are NOT SHA-256. No Z.ai output archive hash exists yet.

| File | SHA-256 (source bytes) | Git blob SHA-1 |
|---|---|---|
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/PACKAGE-MANIFEST.json | `c8bb1b92b68ec5a4d3c91dcabbd745fca1057405238f6a2b44e5dca67e9a2bb5` | `ec1fe455f3bd0821dc2b03398d0c4c426a77c745` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/fixtures/M1-MOCK-VECTORS.json | `4ad8a239b95d939d786deab5f18725c93f57358a8f737483974c582a9faf8f9a` | `3519de942240c4259f9c51007efe24ea204ad3d5` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/prompts/ZAI-TURN-1.md | `4196133b52efee6faf9ff387c322a85546ae5d85cbaff416314eef9534f167c6` | `67706340dea161a6cc5afbe0e2d9c50c119c8e89` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/prompts/ZAI-TURN-2-REPAIR-ONLY.md | `92bf916170da1ead7b89b808190dad3c389c7d4837d798ddc368438602987f18` | `e595b8a1b570faec4df6ae51cccb23ab32c445af` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/RUN-MATRIX.md | `fef7c2489154dc8760d2dd5e86ccae603e52324ee87b333fe8e06c6198b4d2dc` | `d979964aba65199867e19882e2b6a53074652f08` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/TEST-AND-EXPORT.md | `68fd4a3183ec6101dfc375cad0c05d2d5bc01e5162de184bab7faac627aa795d` | `218d44cdbfd399ac1b28dbdbf729fdd8fc47584c` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/INTERFACE-RECONCILIATION.md | `dec7f36c11e39c3b4f5a0e2a4193cc21c6eee3202dd1ff60d8eb0ad535381fe2` | `f802ae1687adc57cea819fc01d528d75b1e871a4` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/components/ACCEPTANCE-GATES.md | `a761f1310646c791dcf2f7a139b9d6443d451b60693072c231542f691bbe1dc2` | `166b609a3354e03e437b93cebea6c2300c436d77` |
| workspace/aion/ops/zai-sandbox-lab/m1-council-prep/components/PACKAGE-MANIFEST.md | `e6ab09e1e5258d1ad835fd21b824363ce527369fda0dbb1d27e01f5ba32b4d7c` | `876c44390c3066748d1e37096f655f791dc6c0f1` |
| workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md | `77894a7646d6c56a33d7a973fa8e317c906ba2f82f139fc3a2bcf688a0d9bb7c` | `88195a974baf2c7e1f7d9c5077ede6b1a42c92a0` |
| workspace/aion/canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md | `a3ce1c4832e6f2b8b34bc9977e552b2fd10ad4f04e35440b883fb524d9370831` | `a076e45e75ce297b6e6645892db06c0c56759e87` |
| workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md | `fe23490f96f7ef534fc9942f86ddbd2e6bdaa4c4e72f07722d88f814ca03819e` | `474470d9d297f066b0b0798d13f5195dcc0ac29d` |
| workspace/aion/ops/chrome-relay/ARCHITECTURE.md | `2980044e9ac99fb12c823be931bf63b850dae111d9d32fe41d9ab4852ef2a0f9` | `63ef12b07f65c8f156c2460ae46c0c7952c8c156` |
| workspace/aion/ops/chrome-relay/FALLBACK-AND-ACCEPTANCE.md | `97534840e06831b8b6f6dfb91d17f3b3c2c4d2721b828c233868fc2588128c24` | `334384f21a5166ac3c24010ff81dc692fe8f3252` |

## Readiness / action
**SOURCE_PACKAGE_PREPARED_AND_STATICALLY_VALIDATED**; NOT SANDBOX_TESTED, EXPORTED, INDEPENDENTLY_VERIFIED, LIVE_READY or M1_PASS.
Chief 05 still needs to accept the compiled staging scope; CoS 03 still needs to confirm the actual owner Z.ai submission path. Owner uses the [one-turn prompt](prompts/ZAI-TURN-1.md) with a frozen SHA and explicitly approved private read-only clone; if private access is unavailable, use approved minimal source capsule or self-contained mock-only instructions. Record observed model/version, actual node --test logs, 16 scenario outcomes, export ZIP/hash and clean independent rerun. Run repair prompt only for real failures.

**Hard boundary:** Z.ai cannot access owner's authenticated ChatGPT session. No Playwright/Puppeteer; no secrets/cookies/profile, unauthorized host actions or unapproved GitHub production writes. Only separately authorized genuine AION -> ChatGPT web app -> AION readback + negative case can establish M1.
