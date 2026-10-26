# R3 — Deep reconciliation: VIVIM Harness implementation vs Product inventory

**Date:** 2026-10-26 · **Product Agent:** Role 15 · **Status:** source-based audit, no local/browser/full-suite execution. **Harness recent indexed head:** `32b7021e99aedb3bedb21daae9e7983676ef4771`. **Tracking snapshot:** `docs/track/worklog.yaml` claims HEAD `007e357`; it predates later source commits.

## Evidence ladder

- Source observed: current GitHub files/commits. Not automatically runtime tested.
- Fixture tested: Harness ledger claims focused T0/T1/T2 tests; reports must preserve individual suite/commit provenance.
- Local OS/browser/owner data: **not verified** by this audit.
- **No W item marked release accepted** merely because `implemented_committed`.

## Old vs current worklog

Harness `docs/track/worklog.yaml`: **8 implemented_committed, 6 partial, 1 deferred** for W00–W14; all implemented items recorded at fixture level. Its `W07` gap is stale because later `src/studio/world-search.mjs` now has `attributedPartPath()` (lines ~85 and ~297–299) and part-qualified hit sources. Its `W11` gap predates Workspace peer-reader improvements and `W09/W10` gap predates provider URL sanitization and import-conflict tests. **Do not promote the source to fully complete without integration acceptance.**

**Work item outcomes and next proof:**

| Work | Current reality | Evidence | Remaining integration/acceptance |
|---|---|---|---|
| W00 | Session/replay/knowledge/world routes, code and tests exist | source; ledger partial | concise route/service owner inventory, not an exhaustive local audit |
| W01 | scoped IDs, account unknown by design, imports foreign | fixture | collisions and real account/thread matching; no false account attachment |
| W02 | saved DOM_TURNS read, imported snapshots and metadata | fixture | actual independent OS restart and owner-compatible captures |
| W03 | typed blocks and unknown fallback; reasoning/tool labels | fixture | render native citations, artifacts and media beyond placeholders; binary custody/value tradeoff |
| W04 | source, coverage and selection fingerprints | fixture | source provenance of derived intelligence; real capture gap examples |
| W05 | durable projects, links, selections, notes, workspace peer reader | fixture; recent UI source | ensure user can create and associate actual content entirely through UI and restart |
| W06 | versioned notes, CAS conflicts | fixture | edit history, author identity and explicit correction semantics if V1 needs them |
| W07 | bounded search, Find UI and now partPath producer/consumer | source latest + fixture prior | verify real emitted partPath enters UI and focuses correct DOM block; avoid stale claim it is dormant |
| W08 | graph map and Relations view | fixture | data refresh and inferred temporal claims, only if J3 requires |
| W09 | selective export modes, preview and downloadable JSON | fixture | actual file download, sensitive data review, real owner project |
| W10 | validate, dry-run, confirm, restore, conflict reporting | fixture; recent security fix | real UI import, clean profile, partial/error states and repeated restore |
| W11 | /chat has peer views including Workspace and Relations; recent reader/review fixes | source + synthetic DOM | browser rendering, keyboard, spatial composure, stable first-run |
| W12 | deterministic J1–J4 tests exist and focused runs reported | T0/T1/T2; ledger partial | separate-OS-process restart, real export→import UI, full suite, real saved data, browser proof |
| W13 | existing CDP/provider subsystem | source | owner-deferred until stable core |
| W14 | read-only agentic file discovery and preview-only commands committed | fixture; unmounted | choose whether safe read-only mounting provides sufficient V1 benefit; no action executor by default |

## Eighteen-cluster atlas overlay

| Cluster | Source-based status | Integration opportunity |
|---|---|---|
| C01 Entry/navigation | PARTIAL | one coherent first-run, real browser interaction and honest states |
| C02 Local conversations | PARTIAL | process restart, multi-session identity, direct from real saved source |
| C03 Native parts | PARTIAL | citations/artifacts/images/files full fidelity or explicit durable missing |
| C04 Provenance | PARTIAL | source-qualified intelligence links across all user work |
| C05 Notes/artifacts | IMPLEMENTED FOUNDATION | attachment selection flow + actual asset custody as needed |
| C06 Workspace/relations | IMPLEMENTED FOUNDATION | compose several owned objects in one real usable Workspace |
| C07 Search | PARTIAL/ADVANCING | partPath now source-generated; verify end-to-end UI use and honest index scope |
| C08 Memory/knowledge | PARTIAL | derived claims qualified and opt-in user curation; no second engine |
| C09 Export/import | IMPLEMENTED FOUNDATION | real cross-profile roundtrip, conflict/privacy tests |
| C10 Commands | PARTIAL | preview catalog exists, unmounted; deep command execution deferred |
| C11 Agentic files | PARTIAL | bounded catalog exists, unmounted; decide mounting/precedence value |
| C12 Capability/Work honesty | PARTIAL | unify UI capability availability with journal evidence and consent |
| C13 External provider actor | EXISTING / DEFERRED NEW WORK | existing CDP actor, later controlled Chrome evidence |
| C14 Canvas | NOT STARTED / DEFERRED | no V1 need without measured cognitive benefit |
| C15 Network/sync | NOT STARTED / DEFERRED | require portable local data first |
| C16 Reliable recovery | PARTIAL | process crashes, full-suite/OS-restart, real storage sizes |
| C17 Harvest intelligence | PARTIAL | map exists, analyst dispositions not user-approved |
| C18 Mobile intake | NOT STARTED / DEFERRED | after stable local object model |

## Atlas inventory reconciliation

The original `VIVIM-CAPABILITY-ATLAS.yaml` contains 116 **interest signals** from 82 distinct repo/path locations, not 116 executable components. The Harness `docs/track/atlas.yaml` is an analyst-derived crosswalk of overlap. It explicitly says BUILD/ADAPT/HARVEST labels are **NOT owner decisions**. The 18-cluster `docs/track/crosswalk.yaml` was last surveyed at old `803d165`, making it historical rather than latest truth.

**Important source updates after ledger:** `bb9b025` search partPath attribution; `1b59837` Workspace peer view; `fb783cb` provider URL userinfo/query/fragment sanitization + import hardening; `01c290a` Workspace review fixes; `32b7021` bootstrap document only. Current `src/studio/world-search.mjs` contains `attributedPartPath()`; current `src/studio/ui/world-view.mjs` contains Workspace peer reading and part focus. No independent complete real-browser proof given.

**Security concerns grounded in commit:** URL sanitizer removes userinfo, query, fragment on world reads/exports, but path segments can contain sensitive content and raw message text isn't redacted; user-selected transcript/full-saved modes naturally include private content. Collisions may be reported via partial `200` with `failed[]`, so all consumers must treat per-record failure as failure/partial—not HTTP success.

## Strongest next integration work (value and risk)

1. **Acceptance debt first:** run actual app in a browser (without Playwright/Puppeteer) on one disposable local profile using real OS restart and actual import/export file flow; record screen-visible and service receipts. This is not a separate PC-wide audit.
2. **Core UX composition:** complete selecting, saving and opening source parts/artifacts within Workspace without developer-created fixture items; use recent reader improvements; ensure keyboard and provenance.
3. **Fidelity priority:** real citation/artifact rendering and asset handling or explicit limitations, not new content engines.
4. **Truthful portability:** validate exported file contents, sensitive URL paths/message bodies, repeated import conflicts and safe partial-failure UI.
5. **Refresh live work register:** reconcile W07/W11/W09/W10 to newer commits with exact test tier and unresolved user value; don't overwrite historical test receipts or prematurely close W12.
6. **Commands and agentic files:** retain as tested preview/read-only components, mount only after explicit value/permissions decision. No imperative to build complete command execution now.
7. **No NEW browser/provider automation before local stable G5.** Existing Browser CDP actor remains canonical.

## Conflicting repo-level prompt discovered

`PROMPT.md` in Harness tells a local engineer to prioritize 3 live provider-native turns, successive sends, and browser-readiness blocker fixes. This conflicts with the owner's more recent **personal-world-first G5** direction from P1–P5. It is not safe to treat every repo prompt as current authoritative project scope. **Recommend owner explicit scope authority**: for V1 personal-world lane, P1–P5 and live accepted user intent control; provider-turn effort belongs a separate later lane. Do not silently delete PROMPT.md or mutate current worktrees.

## Source reference paths

- Original [P5 worklog](P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md) / [machine register](P5-V1-INTEGRATION-WORKLOG.yaml).
- Original [116-signal atlas](discovery/VIVIM-CAPABILITY-ATLAS.yaml), [18-cluster map](discovery/V1-VALUE-CHAIN-CROSSWALK.yaml).
- Harness `docs/track/worklog.yaml`, `docs/track/crosswalk.yaml`, `docs/track/atlas.yaml`, `docs/FORMAL-TEST-PREP.md`.
- `src/studio/world-service.mjs`, `world-relations.mjs`, `world-search.mjs`, `world-transfer.mjs`, `world-url.mjs`, `src/studio/ui/world-view.mjs`.
- GitHub new code commits `bb9b025`, `1b59837`, `fb783cb`, `01c290a`.

**No product or engineering changes made by this audit.** No tests executed, no local agent started, no live browser data inspected. Actual running OpenCode may have uncommitted updates not covered by GitHub.
