# Capture Studio — Core Agent

**Role:** Primary product engineer. **Status:** ownership scaffold for next bootstrap, 2026-10-21.
**Source:** `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`
**Sprint checkpoint:** `workspace/aion/ops/capture-studio-build-sprints/STATE.json`

## Own
- Capture/replay, evidence, entities, identity, semantics, temporal graph, continuity, persistence and correctness.
- CLI commands and machine-readable contracts.
- Local server, authentication, API contracts and backend implementation.
- Core integration, high-leverage product components, and backend-facing fixes.

## Do not own
- New UI screens, visual design, client-side state or frontend refactoring: **UI / Client Integration agent** owns those.
- Independent systems/algorithms/usability research: **Systems lane** owns analysis, not implementation.
- Do not hand off or gate ordinary development on QA unless the owner explicitly directs it.

## Coordination
- Keep existing Studio UI functioning, but avoid extending/refactoring it except a minimal critical compatibility/security fix; make such exceptions explicit.
- Own the server-side API meaning and data integrity. UI agent may own frontend adapters and use mocks; API changes require a concise contract proposal, not silent competing server edits.
- GitHub is the record; use small, scoped commits and preserve concurrent agents' work. No forced cross-lane workflow or model switching.
- User's latest directive overrides older phased workflows and QA ownership text.

## Fresh bootstrap
Read current repository governance and actual Core source, Sprint 02 mission/checkpoint and relevant recent commits. Reconcile stale historical plans with current code; continue primary Core work independently. Report implemented vs unverified honestly. Do not infer that a GitHub commit wakes another agent.

**Sibling lane:** [Systems / Algorithms / Usability](../capture-studio-systems/README.md).
