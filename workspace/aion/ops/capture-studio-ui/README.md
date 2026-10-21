# Capture Studio — UI / Client Integration

**Role:** Owner of the user-facing Studio application and client-side integration. **Bootstrap:** 2026-10-21. **State:** active lane scaffold; runtime acceptance not claimed.

## Source and mission
- Source: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.
- Frontend: `src/studio/ui/index.html`; consume existing authenticated loopback API served by `src/studio/server.mjs`.
- Make capture, sessions, entities, longitudinal continuity, graph and historical evidence navigable, understandable and controllable without exposing backend complexity.

## Own
- Studio frontend screens, navigation, visual design, responsive layout, interactions, accessibility and client state.
- Frontend adapters for existing endpoints, explicit loading/empty/error states, truthful evidence/provenance labels and user-facing wording.
- User workflows for capture control, session exploration, cross-session entity history, search and model/graph inspection when supported by current APIs.
- UI-side tests and mock fixtures in own frontend scope; distinguish static checks from live verification.

## Boundaries
- Core owns intelligence/capture/replay/identity/continuity, CLI, server, auth, APIs, persistence, integrity and their contracts. Do not edit these except an expressly coordinated narrow compatibility fix.
- Systems/Algorithms/Usability is advisory and isolated; do not treat proposals as development gates.
- QA is independent and does not automatically interrupt work. Do not modify QA evidence.
- API additions: file a concise endpoint/response proposal for Core; mock integration until available. Never fabricate backend capabilities or silently edit server routes.
- Do not use Playwright or Puppeteer. Protect security boundaries, token/cookie handling and private capture content.

## Current checkpoint
- Sprint 02 source includes exact-keyed cross-session continuity, as-of view, local API, CLI and an opt-in UI explorer; independent QA remains pending.
- The continuity UI is an existing feature to improve, not a blank-slate rewrite.
- Explicit omissions: keyless cross-session joins, inferred retractions, type-rename alignment, confidence without evidence and claims of verified runtime behavior.

**Standing pull queue:** [CONTINUOUS-QUEUE.md](CONTINUOUS-QUEUE.md) (high-level priorities). [TASK-QUEUE.md](TASK-QUEUE.md) retains the detailed active breakdown. On finishing a slice, pull the next unblocked NOW item without waiting for QA.

## Initial work sequence
1. Read current repository governance, this lane, Core and Systems boundaries, latest Sprint 02 build/state, Studio frontend and API contract.
2. Inventory existing frontend features and problems without redirecting Core.
3. Independently improve the UI in small frontend-only changes. Prioritize navigation, cross-session continuity provenance, loading/empty/error clarity and keyboard/mobile usability.
4. Run available frontend-safe tests, record evidence, commit and push approved ordinary changes to main after checking current remote; never force-push.
5. Maintain short status: shipped / next / blocked / owner action. Keep unsupported QA/runtime claims explicitly pending.

## Coordination
GitHub is the durable record; issues or files are not automatic agent wakeups. Core boundary: [README](../capture-studio-core/README.md). Systems boundary: [README](../capture-studio-systems/README.md). Sprint state: [STATE](../capture-studio-build-sprints/STATE.json).
