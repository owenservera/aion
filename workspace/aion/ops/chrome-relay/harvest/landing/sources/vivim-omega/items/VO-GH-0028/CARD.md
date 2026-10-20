# VO-GH-0028 — Evidence-backed promotion evaluation

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/discovery-verification/src/evaluate.ts#L1-L161
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `0df956094545543c52354b50d00c02f532a3078d`
- **Source line coverage:** 1-161; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0028/source/evaluate.ts`
- **Exact copied bytes SHA-256:** `75d7fb3b8ae6cf63ca7efeb291107a45492a37d81eaefd55fc38b1cef8c217cc`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** evaluatePromotion; isValidProbe

## Source value
Pure evaluation of postcondition probe score/count/evidence, carrying confidence without using it as proof.

## Candidate transfer, not approved design
Keep proof threshold checks and evidence resolvability separate from confidence.

## Explicit hazard
Probe status is past-source verification; not current browser readiness or Send authority.

## Acceptance falsifier
Confidence 0.99 with failing probes never promotes.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
