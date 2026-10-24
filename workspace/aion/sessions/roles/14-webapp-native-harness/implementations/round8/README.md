# AION Agent 14 — Round 8: Capture Studio Automated Webapp Adapter Factory

## Core correction, 2026-10-24
**One generic harness, self-learning per-webapp adapters generated and maintained by Capture Studio intelligence.** Existing hand-maintained `src/profiles/sites/*.mjs` are bootstrap seeds / fallbacks; they must not be the only way to add a webapp.

The factory consumes Capture Studio's existing, source-qualified DOM/a11y/network/stream and intelligence observations, produces a **data-only** provider/site/surface-specific adapter candidate, evaluates it in shadow replay, recommends read-only preview or more evidence, and detects drift. It must never install a second browser actor or self-authorize effects.

## Executable supplier (standalone, no dependencies)
- `adaptive-adapter-factory.mjs`: exports `synthesizeWebappAdapter()` and `shadowEvaluateAdapter()`.
- `adaptive-adapter-factory.test.mjs`: adversarial synthetic fixtures for evidence boundaries, conflict, drift, wrong origin, fake support and no-effect authority.
- Run `node --test adaptive-adapter-factory.test.mjs` (Node >= 22).

This is a *pure compilation and shadow-evaluation slice*, not the full adapter factory or a runtime integration. It does not automatically extract selectors from real DOM captures, publish to VersionedStore, activate an adapter, or verify webapp interactions. Those are **Z.ai/Core integration work**.

## Reuse existing source, do not duplicate
- `src/shapes/infer.mjs` and `src/intel/schema.mjs`/`discover.mjs`: derive candidate structures and semantic roles.
- `src/intel/correlate.mjs` and `src/intel/join.mjs`: action-stream-rendering attribution; do not convert proximity into verified effect.
- `src/intel/learn.mjs`: scoped overrides, corrections and calibration.
- `src/families/build.mjs`, `src/store/versioned.mjs`: candidate families / versioned profiles, rollback.
- `src/profiles/sites/index.mjs` and `src/capture/actions.mjs`: current seed adapters, generic action heuristics and existing Studio actor.
- `src/capture/conversation-thread.mjs`: currently ChatGPT-only exact thread parser; migrate identity parsing behind site-specific rule, not into new actor.

## Z.ai integration objectives
1. **Capture to normalized probes:** extend existing DOM/a11y and stream readers to emit *bounded, source-qualified candidate probes*: `(siteId, canonical origin, surface, feature, type, candidate, outcome, coverage, captureId, seq, carrier, evidenceClass)`; do not record private input text in Git. Distinguish a complete probe from an unloaded/virtualized DOM.
2. **Intelligence to candidate:** feed trustworthy proposals from existing inference/discovery/learner, with strong weighting for distinct real capture sessions; generate declarative adapters per `(site, origin, surface)`. Keep unknown fields opaque. Preserve exceptions requiring provider-specific decoder modules (e.g. Claude Connect/protobuf) rather than flattening to plain text.
3. **Shadow evaluation and auto-improvement:** compare candidates against separate held-out saved sessions; retain versions and fallback if regression/drift observed. Accepted observations may update selector weights automatically. A profile should be scoped to provider version/account/surface where evidence demands.
4. **Activation:** do not make `shadow-ready` a send grant. Activate safe read-only capabilities only after existing producer verifies evidence and held-out fidelity; execute browser effects *only via Studio's single runtime, lease, exact binding, journal and current page preflight*. Autonomic capability learning must not start arbitrary prompts or retry uncertain sends.
5. **Live learning loop:** observed failure -> explicitly report drift/unknown -> replay from immutable raw data -> synthesize patch -> held-out shadow evaluation -> versioned profile promotion/rollback -> measure successful user goal. Avoid developer intervention for routine UI changes, while exceptional unknowns remain diagnosable.
6. **Test a previously unseen webapp:** begin with an unregistered synthetic host to prove zero handwritten adapter required; then use saved-site observations and a distinct real page/browser when authorized. Measure time-to-useful-read, native identity success, coverage, replay agreement, false-positive rate and recovery after UI mutation.

## Deliberate boundaries
- This pure module scores *declared input probes*: it is not proof that an individual event was captured, source-accepted, or page-verified. The producer must establish authenticity and preserve reference to raw capture.
- `shadow-ready` is merely a candidate ranking outcome, not acceptance, runtime installation, browser capability or permission to send.
- Provider API payloads never substitute for actual webapp network/DOM evidence.
- The factory cannot safely invent thread IDs from URL titles, positions, reply text or timestamps, and cannot claim private hidden thinking.
- Keep one provider registration/catalog and one site adapter model: preferably evolve the current `sites` registry to load additional versioned data-only candidates. No extra competing registry or dashboard.

**Success criterion:** after several observed interactions on an unseen site, AION creates a usable read-only adapter without manual site-specific code, continues learning its native response structure, and later can use Studio-authorized effects only after the same independent safety/evidence conditions as handwritten adapters.