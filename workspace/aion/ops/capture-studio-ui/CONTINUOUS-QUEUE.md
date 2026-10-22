> **2026-10-22 update:** [Sprint 2 — Lifecycle & Recovery](SPRINT-02-RECOVERY.md) source delivered with 62/62 UI contract bodies passing in V8. Native Node/browser/Windows and independent QA remain pending. **Next UI build: Sprint 3 Evidence Explorer** from [five-sprint plan](FIVE-SPRINT-WORKPLAN.md).

> **Current authority:** [SPRINT-03-INTEGRATION.md](SPRINT-03-INTEGRATION.md) — Integration source slice delivered with 37/37 deterministic V8 UI checks. **Native Node, local browser/Windows and independent QA acceptance pending.** [SPRINT-03.md](SPRINT-03.md) is the original evidence-navigation substream, not a competing active sprint.

# UI / Integration — Standing High-Level Queue

**Owner:** UI / Integration. **Steward:** QA / Steering. **Updated:** 2026-10-21 (UI Sprint 02 delivery). **Nature:** rolling outcome priorities, not a second detailed sprint tracker.

## NOW — Sprint 3 Evidence Explorer / remaining acceptance
- [x] **Sprint 1 Connected Journey:** Chat/Drive → exact saved recording and optional Knowledge, validated in source. [Receipt](FIVE-SPRINT-WORKPLAN.md#sprint-1-evidence-ledger).
- [x] **Sprint 2 Lifecycle & Recovery:** Chat and Drive concurrent-load guards, original-send outcome isolation, Chat lease owner wording, lost job/state uncertainty, stale Knowledge clearing, 62 UI tests passing in V8. [Receipt](SPRINT-02-RECOVERY.md).
- [ ] **Sprint 3 raw-evidence path:** navigate exact source stream/sequence or DOM evidence only when backed by Core provenance IDs; distinguish missing/truncated/source-unknown.
- [ ] **Sprint 3 type-drift review:** two-source read-only comparison, provenance/identity caveats, no automatic merge/correction.
- [ ] **Native and real-browser acceptance:** Node 22 full checkout tests, authorized local Chrome, keyboard/mobile and independent QA; old V8-only receipts never count as acceptance.

## Standing evidence and deeper exploration backlog
- [x] **Coherent application source path:** Capture → Session → Knowledge → History/Graph → source recording/stream; consistent recording + as-of context, breadcrumbs and stale response safety. Source only; real browser acceptance outstanding.
- [x] **Core correctness adapter:** status complete/zero-entities/deriving/failed/legacy; origin-qualified identities; incomplete and truncated evidence; explicit field removal and deleted-session handling. Source only.
- [ ] **Actual integration acceptance:** native Node 22 suite, authenticated local browser with saved recordings, keyboard/mobile and independent QA.
- [ ] **Exact observation drilldown — PARTIAL:** session + SID stream opens; source seq highlight when available. DOM-only evidence and precise unsupported seq fallbacks remain next.
- [ ] **Review-only drift comparison:** side-by-side two candidate structures/histories, no mutation or merge.
- [ ] **Measured large-data UX:** assess bigger histories and graph cost, paginate or virtualize only where supported by actual measurements.

## NEXT
- [ ] Versioned user correction/retraction workflow after Core provides explicit reversible APIs; never invent field removal from absence.
- [ ] Verified tenant/account namespace, numeric/string key versioning and Core contract compatibility (Core owns semantics; UI displays supported distinctions).
- [ ] Restore/retry UX for previously unavailable local source streams, retaining user context and clear provenance limits.

## LATER
- [ ] **Unified investigation workspace:** fluid browsing of evidence, derivations and reconstruction.
- [ ] **Reusable UI components and performance:** extract only when useful and measurable.

## Continuous pull rule
Keep the existing [detailed implementation queue](TASK-QUEUE.md) as current work breakdown. After shipping a slice, attach commit + observed test/UX evidence, update checkboxes, pick the highest-impact unblocked NOW item and promote NEXT as needed. Do not wait for QA approval for routine UI-only improvements; propose backend changes instead of editing Core code. QA steers queue priorities without gating development. No Playwright/Puppeteer.

**Source receipts 2026-10-21:** [Sprint 02](SPRINT-02.md#delivery-closeout--2026-10-21) and [Sprint 03 Integrated Studio](SPRINT-03-INTEGRATION.md#2026-10-21--ui-implementation-closeout-source-proof-not-browser-acceptance). Source checks 37/37 pass V8 mock harness; real Node/browser/local Windows and independent QA remain pending. GitHub notes do not wake an agent automatically.