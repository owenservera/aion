# Value Oracle issue #71 — canonical saved-session Outcome Packet adapter

**Status (2026-10-23):** source delivered and isolated Linux Node v22.16.0 tests executed (20/20 across old V1 and this adapter); **Windows saved-session execution, canonical Core imports in this environment, user consumption, and independent QA acceptance NOT TESTED**. Owner: Value Oracle. No Core/UI/L4 source edits.

## One command from AION checkout (Windows PowerShell)

```powershell
node workspace/aion/ops/capture-studio-value-oracle/prototypes/saved-session-outcome.mjs --session YOUR_EXACT_SAVED_SESSION_ID
```

Optional `--home "C:\path\to\capture-studio-data"` overrides `CAPTURE_STUDIO_HOME` / Studio's canonical default location. Optional `--out "C:\safe\private\outcome-folder"` changes the local output directory, and `--source-sha` supplies the *verified local checkout SHA* for QA. No Studio server, Chrome, remote provider, database, login or dependencies beyond the existing repository and Node 22.

1. Adapter opens the exact requested *saved* session via Core `Session.open`, invokes canonical `buildTranscript` (not a homegrown export), reads the bound `readAcceptance` verdict and `KNOWLEDGE_STATUS`.
2. Existing V1 `generatePacket` extracts **only explicitly labelled** summaries, decisions, actions, questions and unknowns. No generic semantic synthesis. Assistant-stated decisions are never owner-approved; proposed actions are never assigned or completed.
3. A **private local** `source-transcript.json` snapshot is saved alongside the outputs so JSON pointers/hashes remain resolvable. For DOM turns, the adapter additionally verifies the original `kv/DOM_TURNS.json` entry and records its exact local JSON pointer. If a source changed or is unmatched, it records `canonical.verified=false`, not false precision.
4. `acceptance.verdict` comes from **Core's bound reader**, which fails closed for missing/stale/malformed evidence. Even `capture_accepted` is an advisory capture-fidelity label, not permission to publish, user approval or semantic correctness.
5. The QA-style receipt is a generator receipt only. No external action or private capture upload occurs.

## Outputs (all LOCAL; may contain private captured text)

Default: `<Studio data home>/outcome-packets/<saved session ID>/`

| File | Purpose |
| --- | --- |
| `source-transcript.json` | Local copy of canonical transcript export for evidence pointers |
| `outcome-packet.json` | Summary/decision/action records, unknowns, exact hash/pointers, acceptance, derivation and UI locator |
| `outcome-packet.md` | Ready-to-read packet without a manual export/reformat step |
| `qa-v1/round-L4/run.json` | Source pin, runner and status; self-test only |
| `qa-v1/round-L4/steps.jsonl`, `metrics.json`, `failures.jsonl`, `summary.md` | QA L4 generator-level receipt |

## UI consumer seam — request, not UI implementation

A UI "Make useful" action can invoke this one-shot read-only consumer for the *selected saved session ID*, then open the local Markdown packet. No added background service or second server. `evidence[].canonical.ui_href` is a relative link for the existing Studio UI. For DOM-only evidence, **only** `/#session=<id>` is justified (original exact JSON location is in `canonical.local_file` + `canonical.json_pointer`, but UI has no exact DOM-line navigation contract). For assembled stream fallback, when a source SID exists the link is `/#session=<id>&view=streams&sid=<sid>`; **no `seq` is invented**. UI verifies actual session/SID membership; stream previews may be bounded.

UI team owns invocation/UX if approved. Core owns session/acceptance APIs; QA owns independent L4 acceptance. No cross-team edit or active assignment is implied by this note.

## Runnable synthetic saved-session demonstration (no real captures)

```powershell
node workspace/aion/ops/capture-studio-value-oracle/prototypes/demo-saved-session-runner.mjs
```

This uses **injected synthetic Core-reader doubles** and creates a disposable `aion-oracle-71-synthetic-*` directory under the OS temporary folder, with `sessions/synthetic-session-001` and `output/source-transcript.json`, `outcome-packet.md`, `outcome-packet.json`, and QA L4 files. Expected: **6 original DOM references verified**, `acceptance.verdict=unassessed` (no canonical raw digest), proposed actions unexecuted, no provider/browser/GitHub actions. This is *not* a demonstration that real Core acceptance or Windows saved-session imports work; the real command above is the subsequent required step.

## Run and check (focus on evidence/abstention)

```powershell
node --test workspace/aion/ops/capture-studio-value-oracle/prototypes/outcome-packet.test.mjs workspace/aion/ops/capture-studio-value-oracle/prototypes/saved-session-outcome.test.mjs
```

Offline mock-canonical fixture cases: six exact DOM citations; accepted verdict does not approve the assistant claim; rejected/incomplete/failing derive warns; stream SID has no fabricated seq; unknown session aborts before output; active recording aborts; changed DOM is marked unverified. Original V1 has 13 positive/negative extractor tests. **All adapter tests use injected synthetic Core reader doubles**; full real Core module import and actual local captured saved data remain Windows requirements, not passed tests here.

Windows QA must record `git rev-parse HEAD`, `node --version`, actual data directory, session status, command exit and all output paths. Compare `outcome-packet.json` refs to `source-transcript.json` and to the original `kv/DOM_TURNS.json` where `canonical.verified=true`. Confirm omitted claims stay omitted, negative cases abstain, readAcceptance verdict and its reasons agree with Core, and private output stayed on PC. Mark L4 as independent acceptance **only after a separate QA replay/consumption trial**; do not claim saved-user steps or minutes saved until measured.

**Remaining gap:** a live saved session on the owner's machine, and a UI-owned hook. V2/V3 scope is reserved in issue #71; **not built**.
