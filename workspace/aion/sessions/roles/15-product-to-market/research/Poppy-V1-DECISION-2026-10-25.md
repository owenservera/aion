# Poppy — PRODUCT AGENT V1 decision

**Date:** 2026-10-25 · **Owner:** Product-to-Market 15 · **Status:** DEFER / WATCH · **Implementation authorization:** NONE.

## Incoming research receipt and provenance
- [Research 09 Poppy archive](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/09-global-research/research/poppy) — seven pulled files, historical source snapshot and version metadata; not a complete archive of final 0.2 / current draft 0.3.
- [Research technical assessment](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/09-global-research/research/poppy/ASSESSMENT.md).
- [Canonical receipt in Research issue #30](https://github.com/owenservera/aion/issues/30#issuecomment-6400657767).
- [Product recipient issue](https://github.com/owenservera/vivim-harness/issues/2).

**Research reports:** Published Poppy 0.2 (2026-10-24); latest public draft 0.3 has changes to sign-in discovery, removal of built-in read/write scopes, session-bound DPoP handling, one-time browser joining codes and stricter separation of secrets from model context. The repository's copied Oct 19 spec/changelog snapshots are historic, *not final 0.2 or current 0.3*. Community SDK v0.26.0 targets 0.2; no verified live participating production company endpoint or VIVIM-compatible end-to-end test. Do not infer partner announcements mean usable service.

## Decision for integrated VIVIM V1
**DEFER a Poppy runtime adapter; maintain the existing Research 09 low-noise watch.** Poppy is a potential future typed connection to consenting company APIs/agents, complementary to MCP, native provider webapps and Harness CDP, but cannot presently improve the P0 first-user journey with proven behavior.

- **No change** to V1-A/B roadmap or Z.ai integration pass.
- **No new browser or HTTP effects executor**, no new token vault/authorization service and no speculative Poppy-first architecture.
- Preserve conceptual extensibility at the existing Intent → Capability → Authorization → Work → Outcome → Evidence boundary. A future Poppy adapter must use that exact governed command/journal contract, not acquire independent effects.
- Avoid implementing frozen 0.2 assumptions while draft 0.3 is breaking.

## Reopen criteria — all required
1. **Real personal-user use case** not reliably served by existing AI webapp/MCP/API options, with quantified benefit.
2. **Verified reachable company Poppy integration** (not logo/partner list), plus protocol version and independent discovery/auth behavior.
3. **Compatible SDK or reference and conformance tests**, with real issuer/audience/account/scope/DPoP behavior and negative authorization tests.
4. **Narrow architecture diff and owner authorization**: explicit account mapping, token isolation, effect idempotency/reconciliation, user consent and source provenance, plus estimate against the current beta critical path.

When these are met, evaluate one sandbox read-only pilot first. Z.ai must not auto-harvest Poppy code merely because it is in the research folder.

## Source and product ownership
- Research evidence stays in Research 09's `research/poppy/` and issue #30.
- Product decision and any next product-specific Poppy requirements live **here**, inside Role 15.
- Engineering acceptance and optional adapter implementation stay in `owenservera/vivim-harness` only once selected. Cross-reference Harness issue #2.
- The cross-agent communication note is discovery-only, not research authority or an independent product record.

**Proof class:** GitHub research source read + documented technical assessment. **No actual protocol/SDK installation, auth handshake, live company endpoint or browser interaction verified in this Product Agent turn.**
