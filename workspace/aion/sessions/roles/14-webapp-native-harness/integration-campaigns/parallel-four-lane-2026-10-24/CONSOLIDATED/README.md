# AION Webapp-Native Harness — Consolidated Four-Lane Bundle
**2026-10-24 • Source compiled, not installed, not QA accepted, not merged into main.**

One provider-independent harness, one existing Capture Studio Chrome/CDP actor, one existing /chat shell, automatically versioned **read-only** webapp adapters. No parallel sender, registry, driver or browser service is added.

**Contents:** frozen Core C1 (4 files), UI U1 (4), Intelligence I1 (8), Systems S1 (6), plus the new read-only `integration-gates.mjs` and tests. Exact supplier commits, original file paths and Git blob SHAs are in `SOURCE-LEDGER.json`. The only copied supplier modification is the Intelligence Studio bridge's relative import paths, explicitly recorded there.

## Offline commands on Node >=22
```sh
cd workspace/aion/sessions/roles/14-webapp-native-harness/integration-campaigns/parallel-four-lane-2026-10-24/CONSOLIDATED
npm test
npm run fixture
npm run bench
npm run hash
```
No dependency installation is needed. `npm run hash` generates `SHA256-MANIFEST.json` in the checked-out folder; not run by this remote compiler. The suppliers separately report 32 Core + 43 UI + 26 committed Intelligence + 32 Systems passing Linux synthetic tests (**133 supplier-reported**); the new 8 cross-lane tests and full combined run **have not been executed here**. No Windows Chrome, real provider, independent G1-G7 or proposed Z.ai 23-patch test was executed.

## Integration order (Z.ai)
1. Reconcile owner-local Windows dirty/unpushed work, current main and 23 proposed Z.ai patches; no blind merge.
2. Verify acceptance by existing Core producer: raw+DOM digest, exact account/origin, raw lineage, original SID/sequence, full G1-G7. Call `qualifyIndependentEvidence` before I1/round8/9 synthesis.
3. Preserve single Studio lease/journal/effect actor. C1 `effectBoundary` returns `dispatch:false` EVEN on `defer-to-studio`; unknown delivery never authorizes resend.
4. Connect I1 using `createGuardedStudioLearner`; source manifests must be server-verified, with independent train/heldout lineage, current-page read proof, atomic existing profile CAS and rollback. Missing proof => seed fallback.
5. Mount U1 inside existing `src/studio/ui/chat.mjs`; map exact Core state conservatively with `projectForUniversalChat`. Native blocks must carry real source IDs; never infer from text or tab labels.
6. Apply S1 diagnostic checks, bounded UI projections separate from raw captures, and provenance eligibility before knowledge/outcomes. Run QA #72 L0–L4 and owner-authorized real Windows L5 separately.

**Unresolved:** real source acceptance adapter, trusted immutable lineage provider, cross-process profile CAS, original-native-event feed, Z.ai's separate 23 patches and live two-turn Chrome acceptance. No accepted promotion or production source files are changed by this package.
See `ZAI-INTEGRATION.md` and `lanes/*/HANDOFF.md`.
