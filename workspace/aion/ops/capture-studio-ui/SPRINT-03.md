# UI Sprint 03 — Evidence Navigation and Review Workspace

**Owner:** UI / Client Integration. **Status:** integrated substream delivered in source during [Sprint 03 Integration](SPRINT-03-INTEGRATION.md); physical and independent acceptance pending. **Created:** 2026-10-21.
**Last delivered:** [Sprint 02 source closeout](SPRINT-02.md#delivery-closeout--2026-10-21) — UI Knowledge workspace, 24 V8 contract checks passed; no actual Windows/browser acceptance.
**Current Core boundary:** `../capture-studio-core/SPRINT-03.md` — provisional EID collision, derivation success/empty truth, origin/tenant scope, temporal correction contracts. UI must not preempt Core semantics.

## Mission
Close the last hop between inferred knowledge and exact recorded evidence; make unconfirmed type-drift hypotheses straightforward to compare side by side; preserve performance at larger graph sizes and make the user understand what is known versus uncertain.

## Ordered autonomous work
1. **Exact source navigation (read-only):** for graph and entity revisions with source session/SID/seq/DOM IDs, create direct routes or UI actions into existing recorded stream/event/DOM views; retain timestamps and provenance. Read source to distinguish available and unavailable IDs, and never invent clickable proof. Default to source session if no narrower route exists.
2. **Review-only comparison:** let the user select two origin-qualified drift candidates and compare observed field structures, history and provenance side by side. No auto-merge, no calibration implied, no mutating POST.
3. **Session/knowledge continuity:** keep selected recording, filters, as-of, selected entity and search context coherent across navigation; support back to prior evidence, with explicit state when a recording has been deleted/rederived.
4. **Legible dense data:** provide accessible table and graph list, bounded preview, truthful truncation and omission counts and optional user-requested loading; avoid unbounded graph rendering. Measure instead of guessing costs.
5. **Contract and acceptance:** as Core evolves, update UI adapters to actual origin/tenant, successful-empty, retraction semantics and identities. Use strict backward-compatible fallback; document unresolved differences for Core.
6. **Proof and queue:** add deterministic tests for false links, race conditions, data-borne HTML, absent timestamps and accessible navigation. Run Node 22/local browser if genuinely available, otherwise identify the exact missing runtime. Commit/push verified UI-owned changes, update this queue and pull the next unblocked step.

## Standing invariants
- Same detected origin never proves same account. Keyed match is not a human confirmation.
- Hypothesis / unconfirmed / rejected statuses remain explicit. Rejected graph edges must not be portrayed as active links.
- No inferred deletion or retraction from absent source observations.
- Do not silently change Core routes, authentication, identity resolver, CLI, persistence or QA receipts.
- GitHub is the record; Windows local execution is master. No Playwright or Puppeteer.
- UI read-only views must escape user-controlled text and guard stale asynchronous results.

## Acceptance
Working journey from saved recording to entity → revision → exact raw evidence when available; side-by-side non-mutating drift evidence; clear partial/incomplete/truncated status; traceable source commits and actual checks. Do not claim independent or local browser proof until performed.
