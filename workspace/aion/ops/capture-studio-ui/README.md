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

**Current integration authority and delivery receipt:** [SPRINT-03-INTEGRATION.md](SPRINT-03-INTEGRATION.md) — source-delivered coherent workflows, Core derivation-status adapter, shared context, evidence drilldown, auth/recovery and 37 passing V8 UI checks; actual browser/Windows/Node/QA acceptance pending.

**Standing pull queue:** [CONTINUOUS-QUEUE.md](CONTINUOUS-QUEUE.md) (high-level priorities). [TASK-QUEUE.md](TASK-QUEUE.md) retains the detailed active breakdown. On finishing a slice, pull the next unblocked NOW item without waiting for QA.

## Initial work sequence
1. Read current repository governance, this lane, Core and Systems boundaries, latest Sprint 02 build/state, Studio frontend and API contract.
2. Inventory existing frontend features and problems without redirecting Core.
3. Independently improve the UI in small frontend-only changes. Prioritize navigation, cross-session continuity provenance, loading/empty/error clarity and keyboard/mobile usability.
4. Run available frontend-safe tests, record evidence, commit and push approved ordinary changes to main after checking current remote; never force-push.
5. Maintain short status: shipped / next / blocked / owner action. Keep unsupported QA/runtime claims explicitly pending.

## Coordination
GitHub is the durable record; issues or files are not automatic agent wakeups. Core boundary: [README](../capture-studio-core/README.md). Systems boundary: [README](../capture-studio-systems/README.md). Sprint state: [STATE](../capture-studio-build-sprints/STATE.json).

## Sprint 01 — delivery (2026-10-21)

**State:** frontend source delivered and pushed to main; six deterministic V8 source-contract checks passed. **Not yet live Windows/browser accepted or independently QA certified.**

### Delivered
- Saved-session filter by title, website and session ID; refresh and count; tab-select buttons work via keyboard.
- Reliable selected-session loading/error states, stale-response guards and accessible active-section semantics.
- Narrow-screen layout, responsive session/evidence reading, polite screen-reader status feedback.
- Same-site continuity explorer with keyed versus session-local identity, incomplete derivation warnings, truthful as-of and truncation notices, readable attributes plus source revision provenance.
- Historical/source confidence caveats retained; selection race protection; renders at most 200 history rows while disclosing limit; no server/CLI/storage changes.

### Commits and verifiable evidence
- Session UX: [33da29e](https://github.com/owenservera/aion/commit/33da29e26966e4166500d118923d4856b10f88d5).
- Continuity UI: [097bd5e](https://github.com/owenservera/aion/commit/097bd5ea2cc10fae7e12dadc3faed7f96ceb50c3).
- Stale/error hardening: [90fc6aa](https://github.com/owenservera/aion/commit/90fc6aa19e0b6b3378943a768a08cd53c9e108ac).
- Unit contract suite: [17c4cca](https://github.com/owenservera/aion/commit/17c4cca53436a12a6808e1640b9c8525903e9f13), expanded race test [399451c](https://github.com/owenservera/aion/commit/399451c6f8848b0d9a6130ba19a1d1cabb02ea85).
- Six tests in `test/unit/studio-ui.test.mjs`: inline syntax; keyboard/filter; incomplete/truncated evidence; escaping/provenance; cautious uncertainty; latest-request-wins. **All six passed in the connected JavaScript V8 execution harness using current committed source/test contents**. This was not the Node 22 runner or live browser. No independent QA result is asserted.

### Remaining acceptance
- Run `node --test test/unit/studio-ui.test.mjs` on local Windows with Node 22 and the full existing package suites; confirm actual Studio browser workflows, history rows and mobile sizes.
- Independent QA may independently examine Sprint 02 backend behavior; do not transfer its acceptance responsibility to this lane.
- Future UX work: navigate graph/model information visually (only via supported APIs), richer sorting/pagination for larger sites, and end-user evidence drilldown beyond latest 200 preview rows. Core retains any required API contract decisions.

**Next sprint recommendation:** a visual knowledge workspace connecting sessions → entities → graph, using existing read-only API responses before proposing server changes.

## Sprint 02 — Trusted Knowledge Workspace (2026-10-21)

**Delivered in source; not Windows/browser accepted.** New accessible Knowledge view unites saved sessions, origin-qualified linked entities, historical attributes, source recording references, static bounded relationship map, graph node/edge details, inferred type summaries, review-only drift candidates and cross-recording recorded-text search.

- **Full result and commit trail:** [Sprint 02](SPRINT-02.md#delivery-closeout--2026-10-21).
- **Execution queue:** [Continuous Queue](CONTINUOUS-QUEUE.md) and [Detailed Tasks](TASK-QUEUE.md).
- **Current sprint:** [Sprint 03 — Integrated Capture Studio](SPRINT-03-INTEGRATION.md). [Evidence-navigation substream](SPRINT-03.md) is integrated, not a competing sprint.
- **Verification:** 6 previous Studio contracts + 12 Knowledge contracts + 6 Search contracts = 24/24 executed in isolated V8 compatibility harness with committed source/test readback; no failures. Native Node runner, real browser/mobile/keyboard and independent QA remain unperformed in this lane.
- **Core contract consumed:** authenticated read-only session model/graph/continuity and search endpoints. UI has not modified Core API or source.
- **Safety:** no inference of same account from same origin, no silent type-drift merge, no invented deletion/retraction and rejected links omitted from active visual map. Mock/fixture checks are not live validation.

