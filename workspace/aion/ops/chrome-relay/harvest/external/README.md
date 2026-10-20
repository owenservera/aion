# AION one-time external-browser donor mega-harvest

**Isolation:** a dedicated branch `harvest/external-browser-donors-20261020`, based on the Track B candidate. Neither upstream donor repositories nor AION runtime are modified by this package. Donor code lives in **external read-only clones**; only sanitized, provenance-pinned research indexes/cards go into this branch. This is an executable harvest *setup*, not a claim that any upstream repo has been cloned in this environment.

## Objective

Turn one heavyweight donor sweep into durable provider/feature intelligence, reusable source exemplars, candidate code with license review, and clear build/adopt/reject decisions. Feed the existing command registry (PR #51, 40 semantics, 19 P0) and the interactive CLI architecture (PR #46), without merging donor code into the Bus or runtime.

**Review corrections from Claude:** PR #50 review and document `12-EXTERNAL-COVERAGE-RECONCILIATION-2026-10-20.md` (source currently on Claude's review branch, **not silently integrated**) identify `DrA1ex/chatgpt-bridge` as the best receiver/no-resend research donor and downgrade Multi-AI Chat's send confirmation for heuristic retry. Promote neither claim to live AION fact without source inspection. Use PR #51's conservative I/R/P/U matrix; add protocol-specific receiver dimensions `receive.cursor`, `receive.identity`, `send.correlation` as **research axes**, not automatic runtime commands.

## Inventory and tiers

[Source manifest](sources.json) lists **9 independent upstream repos**, prioritized:
- **P0:** `DrA1ex/chatgpt-bridge` (cursor/gap/no-resend); `TED-H-com/multi-ai-chat` (multi-provider MV3 selectors, response observer); `ParkerCai/parallel-ai-extension` (website breadth/files/temporary chats).
- **P1:** `RaheesAhmed/Council`, `chathub-dev/chathub`, `ai-shifu/ChatALL`, `Octo-Lex/ChatGPT-Web2API`.
- **P2:** `mehmetnadir/cdpilot`, `cereon-labs/cereon-browser-operator`.

No repo in this manifest is an approved dependency; individual upstream license, revision, provenance and effect safety must pass review.

## One-time clone and static indexing (run once by an authorized Git-enabled worker)

Preconditions: Python 3.10+, Git and network access to public GitHub. **Do not install or execute donor projects.** Use an external clean directory **outside** the AION checkout; for example Windows `D:\AION-DONORS-20261020`, Linux `~/aion-donors-20261020`. On user Windows, local agent is for verification only; harvest may run on any remote Git-enabled runner. The code in this folder works on Windows PowerShell or Linux Bash:

```powershell
# From the AION repository root on the harvest branch
$Harvest = 'workspace/aion/ops/chrome-relay/harvest/external'
$Donors = Join-Path $HOME 'aion-external-donors-20261020'
$Landing = Join-Path (Get-Location) 'workspace/aion/ops/chrome-relay/harvest/external/landing/indexes'
python "$Harvest/harvest.py" clone --clone-root "$Donors"
python "$Harvest/harvest.py" index --clone-root "$Donors" --landing "$Landing"
```

Actual clone receipt records each **real HEAD commit**, remote URL, and dirty state. Indexer records filename, file SHA256, byte size and operation keyword signals. These are **leads only**, not evidence that a feature works. It performs no donor imports, installs, browser actions, CDP connections, shell scripts or provider login. If a source is unreachable, preserve `SOURCE_ABSENT` and leave its evidence unverified.

The clone root is outside the AION checkout; the generated `landing/indexes/*.json` may be reviewed, committed and pushed. Never commit clone directories, secrets, conversation transcripts, captured tokens, session databases or gigantic third-party source snapshots.

### Three-pass mega-harvest

1. **Pass A — Pin and index:** clone all 9 into isolated folders; freeze commit SHA + license and tracked file listing; run the static keyword/index pass. Survey source owners, adapters, tests, fixtures, extension manifest, transport and authentication risks; tag `RESEARCHED`, `INDEXED` or `BLOCKED`.
2. **Pass B — Source-owned evidence cards:** one card per **material implementation**, not one card per guessed feature. Card IDs `EXT-<DONOR>-NNNN`. Pin repo/ref/commit/file path/line span/content hash; evidence `IMPLEMENTED_SOURCE`, `DOCS_ONLY`, `FIXTURE`, `LIVE_UNVERIFIED`. Describe exact behavior/contract, operation ID and target surface, session fidelity, inputs/outputs, failure paths and permission. Capture **short necessary excerpts** with license checked. **No raw bulk donor code**.
3. **Pass C — Crosswalk and decision:** map every reviewed donor feature to the 40 AION command operations and the three receive research axes; tag `KEEP_AION`, `ADAPT_PATTERN`, `COPY_AFTER_LICENSE_AND_TEST`, `REBUILD`, `REJECT_UNSAFE`, `RESEARCH_GAP`. Assess 0/2 targets, duplicate sends, ambiguous effect, cursor gaps, page restarts, exact conversation fidelity, provider-specific coverage. Produce one ranked integration queue, with runnable fixture expectations and owning AION seam.

### Isolation promotion gate

```text
upstream GitHub (read-only cloned/pinned)
   → static index (candidate paths/hashes)
   → evidence cards (source-reviewed)
   → crosswalk (40 semantics + 3 receive research axes)
   → decision (keep/adapt/reject)
   → separate AION implementation PR with isolated tests
   → offline conformance
   → authorized live Chrome/Windows test
```

The harvest branch is **not** a source-code import lane. A separate implementation PR must justify any code reuse and preserve Bus grants, exact binding and no-resend. No automatic PR merges, no donor package installs, no launch-on-import behavior. Preserve upstream copyrights/licenses and use source links where excerpt rights are unclear.

## Artifact layout

```text
external/
  README.md              # operating contract
  sources.json           # approved donor inventory; clone NOT implied
  harvest.py             # clone/index commands, no donor execution
  CARD-TEMPLATE.md       # evidence card schema
  WORKER-PROMPTS.md      # parallel branch ownership and prompts
  landing/
    indexes/<donor>-index.json            # generated, reviewable
    cards/EXT-<DONOR>-NNNN.md             # authored by research workers
    synthesis/command-coverage.csv       # reviewed 40-op overlay, later
    synthesis/integration-queue.md       # adoption decisions, later
```

**Source references:** [PR #46](https://github.com/owenservera/aion/pull/46) Track B, [PR #50](https://github.com/owenservera/aion/pull/50) Claude review and reconciliation, [PR #51](https://github.com/owenservera/aion/pull/51) command matrix. Workers must verify freshness and not assume their branches were merged.

## Acceptance receipt

Report: exactly which upstream Git repos were actually cloned (origin URL, HEAD SHA), any clone failures, counts indexed and review completed, number of card IDs created, AION operations mapped, real risk rejections, candidate implementation interfaces, tests **actually executed**, and explicit untested areas. Until the clone runner executes, **all 9 sources remain CLONE_PENDING**.
