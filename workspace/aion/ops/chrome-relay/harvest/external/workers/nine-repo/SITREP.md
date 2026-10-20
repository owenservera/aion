# External Nine Worker — verified launch SITREP

**Observed:** 2026-10-20 · **Source:** GitHub remote `owenservera/aion` · **Checked HEAD:** `8ad81dc4a035be1a5297164bd41ce8649320df9a` · **Scope:** static remote inspection only. This is a bootstrap snapshot, **not** a claim that the nine-repo code harvest has been executed.

## Executive state

- **Governance:** `main` is the sole permanent integration/development branch. Track A deprecated; Track B is Development workstream, not a permanent parallel track. Windows local workspace remains human-controlled master. Source snapshots/research on `main` are not runtime authorization.
- **Worker charter:** [LAUNCH-PROMPT.md](LAUNCH-PROMPT.md) exists on `main` and defines the full assignment, including flexible multi-approach schema evolution and Development-facing deliveries.
- **Source custody:** all **nine donor source directories exist on `main`** under `external/landing/donors/`: `cdpilot`, `cereon-browser-operator`, `chatall`, `chatgpt-bridge`, `chatgpt-web2api`, `chathub`, `council`, `multi-ai-chat`, `parallel-ai`. Exact upstream pinned SHAs and licenses require confirmation against custody records during the worker pass. Existing `sources.json` still contains stale `clone_status=PENDING_NOT_EXECUTED`; **do not mistake this metadata for the actual current directory state**.
- **Shared contract:** `harvest/EXCHANGE.md` and `harvest/EXCHANGE.jsonl` exist; six seeded JSONL records. The shared exchange is the outward request/delivery interface, **not proof of six completed implementation tasks**.
- **Prior intelligence:** `harvest/landing/synthesis/integration-queue.md` is C-003 with 27 VIVIM Final + 38 Omega/VIVIM source records and prioritized recommendations. VOMEGA retention assessment is source-observed, with 6 KEEP + 5 ADAPT NLCL module candidates, **not drop-in or live-validated**.
- **Nine-repo status:** source snapshots available; full cross-repo role allocation, approach comparison, code-level evidence cards and Development-ready offers **not independently verified complete**. The worker must inspect rather than presume.
- **Current open PRs at observation:** #33 (Track B velocity), #34 (Track B local engines), #35 (Agent Fabric, on hold), #46 (Track B candidate). #46 is **draft**, head `track-b/platform-local-candidate-20261020`, base `track-b/implementation-rounds-20261019`, head SHA `75d71cd3dcabed720db68ef04dda065a3f0f0ed2`. These historical branch relationships are not an instruction to develop on those branches.
- **Runtime state caution:** `workspace/aion/STATE.json` is dated **2026-10-19**, contains historical local Windows test/authorization claims and a source freeze. Do not infer today's Windows status or change runtime based on it; current owner scope for this worker is **research and delivery, not agent runtime implementation**.

## Immediate Development exchange (verified seeded entries)

| ID | Kind | Topic | Current meaning |
|---|---|---|---|
| AX-0001 | NEED · P0 | `receive.identity` | Reliable two-way conversation/message/operation identity, cursor/gap handling |
| AX-0002 | OFFER · P1 | `receive.identity` | Existing Omega/VIVIM identity and evidence vocabulary, research only |
| AX-0003 | OFFER · P1 | `semantic.command.compile` | VOMEGA deterministic NLCL parser/validator candidate, research only |
| AX-0004 | NEED · P0 | `external-nine.capability-ownership` | First-pass nine-donor capability ownership/deduplication |
| AX-0005 | NEED · P2 | `semantic.command.compile` | Future typed, authorized semantic CLI |
| AX-0006 | GAP · P0 | `receive.identity` | External donor primary receive implementation still unverified |

**Worker first response should advance AX-0004 and AX-0006**, then surface any missing proposed Development needs and real alternative approaches under canonical topics.

## What is already integrated — do not repeat

- External nine donor source snapshots merged via PR #54; selected source/catalog documentation via #57.
- Omega, VIVIM Final and VOMEGA research source trees merged via #58.
- Command Space P0 additions and updated matrix/guides merged via #47, #59 and #60.
- Existing synthesis/crosswalk merged via #61.
- Governance and shared exchange established on `main`.
- Prior source captures, old branches and draft PRs are **historical provenance**. No re-clone, re-import, new parallel branch program, duplicate registry or reharvest of the 65-row crosswalk.

## Risks and precedence corrections discovered during bootstrap

1. `external/02-REPO-PRIORITIZATION.md` still references the old `harvest/external-browser-donors-20261020` scaffold branch, a Worker 1 custody prerequisite, and a new triage PR to that branch. **Superseded** by `REPOSITORY-GOVERNANCE.md`, `external/DELIVERY.md`, and the saved worker charter: work from current `main`, preserve unique evidence, commit/reconcile to `main`.
2. `external/03-EVIDENCE-AND-PROMOTION.md` says one primary donor/one capability. Interpret as **primary research owner and deduplication default**, not prohibition on multiple valid implementations; compare meaningful competing/complementary approaches.
3. `external/sources.json` is an older planning manifest; verify current donor directories and actual pinned revisions from Git evidence before updating stale custody fields.
4. `STATE.json` reflects a prior runtime snapshot, not a fresh test result. Keep runtime implementation and agent fabric on hold under the owner's current instruction.
5. `EXCHANGE.jsonl` offers marked `SOURCE_OBSERVED` represent cited research, not live AION acceptance. Proposed Development needs must remain explicitly proposed.

## Launch readiness and boundaries

**Ready:** prompt, source directories, existing crosswalk, VOMEGA assessment, common exchange, repo policy and source-research protocols.

**Pending:** full nine-donor source-level sweep; module/approach ownership map; comparative engineering evidence; licenses/compatibility assessment; gap analysis; first Development OFFER/GAP/proposed NEED delivery; evidence-driven exchange extension; deep-harvest prioritization.

**Verification limits:** GitHub file/PR metadata checked; no local Windows checkout inspection, donor execution, offline tests or live browser tests performed during this SITREP.

## Source-of-truth pointers

- [Worker launch](LAUNCH-PROMPT.md)
- [Worker bootstrap](BOOTSTRAP.md)
- [Repository governance](../../../../../../../../REPOSITORY-GOVERNANCE.md)
- [Shared exchange contract](../../../EXCHANGE.md) and [records](../../../EXCHANGE.jsonl)
- [External lane delivery](../../DELIVERY.md)
- [External prioritization](../../02-REPO-PRIORITIZATION.md)
- [Source manifest](../../sources.json)
- [Existing integration queue](../../../../landing/synthesis/integration-queue.md)
- [VOMEGA retention assessment](../../../../landing/sources/vomega/RETENTION-ASSESSMENT.md)

**Next:** read [BOOTSTRAP.md](BOOTSTRAP.md), follow [LAUNCH-PROMPT.md](LAUNCH-PROMPT.md), then begin the nine-source reconnaissance.
