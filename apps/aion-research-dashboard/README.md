# AION Research — High-Signal Dashboard V2

A single-user, read-only research cockpit. Live at https://aion-research-dashboard.vercel.app

## Data architecture — research decisions determine status

```
Canonical original sources + AION research notes + issue #30
  → Role 09 evidence review / SITREP
  → workspace/aion/sessions/roles/09-global-research/FRONTIER-STATUS.json
  → scripts/generate-index.mjs (validates evidence and lifecycle)
  → research-index.json + immutable snapshots/<16hex-revision>.json
  → Vercel-hosted dashboard (automatically reads index from GitHub, 5-min refresh)
```

`FRONTIER-STATUS.json` is a **research-owned, dated, structured summary** of existing authoritative evidence, *not* a second intake queue/task tracker or an independent source of truth. Issue #30 remains the single intake/coordination surface. Role 09 updates a record only after a real source review and subsequent decision; **a new repo commit or scheduled task run does not advance status**.

## Generation and reproducible checks

From **AION repository root**:

```powershell
node apps/aion-research-dashboard/scripts/generate-index.mjs
node apps/aion-research-dashboard/scripts/generate-index.mjs --check
node --test apps/aion-research-dashboard/tests/*.test.mjs
node --check apps/aion-research-dashboard/dashboard.js
```

Node 22+; no npm packages needed. The generator:

- Validates required dated evidence, HTTPS URLs, local source-file existence, allowed dispositions and pipeline stages.
- Rejects ACKNOWLEDGED/APPLIED/VERIFIED without an independent receipt or test.
- Fingerprints the exact captured repo evidence with SHA-256 and emits a revision based on **content**, not build time. Preserves timestamp when source version is unchanged.
- Creates immutable `snapshots/<revision>.json` for source-backed history.
- Fails closed on missing sources or conflicting dates.

GitHub Actions [Research Evidence Index](../../.github/workflows/aion-research-index.yml) watches relevant research source and generator changes, regenerates and tests the index, and commits changes only when the content fingerprint changed. It does not install software locally, watch private accounts, perform a research SITREP autonomously or automatically infer evidence quality.

## Vercel hosting

The web interface is HTML/CSS/vanilla JS. It fetches the freshly validated same-origin Vercel `research-index.json` first, with a public GitHub fallback when unavailable; a five-minute poll only runs while a browser tab is open. Failures explicitly preserve the last *loaded version*, not fabricate an operational state.

Vercel is configured to build the **whole AION repository** with `node apps/aion-research-dashboard/scripts/generate-index.mjs` and tests, then publish only `apps/aion-research-dashboard/`. This ensures deploy-time index regeneration from authoritative status even if a GitHub Actions index commit has not yet landed. Vercel Git integration deploys source pushes when configured.

This is a **public research dashboard**: don't include credentials, private repo names, private notes, protected documents or unreleased secrets. No browser authentication token is used. The product does not run an agent, execute the owner's Windows tools or push research edits.

## Known evidence gates

- A deployed Vercel build is not proof GitHub Actions successfully committed the index; check actual Actions runs.
- A GitHub Actions commit is not proof the user's browser loaded that version; check the displayed revision.
- Sourced reports may be older than the dashboard's most recent network check. The UI separates `assessed_through` from `generated_at`.
- The current seed contains six reviewed research topics and should not be treated as an exhaustive repository or AION-agent inventory.

## Usage

- Review/focus frontier with search and status chips.
- Click a row for its hypothesis, confidence, evidence sources, risks, and immediate next small test.
- Open **Evidence** for citations; **History** for immutable revision/snapshot; **Decision** for disposition without implying authorization.
- To update: `#AION @RESEARCH +/SITREP` using [Role 09 protocol](../../workspace/aion/sessions/roles/09-global-research/RESEARCH-SITREP-PROTOCOL.md); agent updates structured source and confirms a successful generation receipt.

Never use Playwright, Puppeteer, or a second task queue. This dashboard cannot edit research status by itself.
