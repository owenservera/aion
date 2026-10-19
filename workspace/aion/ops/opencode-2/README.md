# OpenCode 2.0 — AION research and adoption dossier

**Research date:** 2026-10-17 (Europe/Madrid)  
**Update:** 2026-10-19 — the Windows master now runs **OpenCode v2.0.32** live (`opencode --version`; receipts in `../model-failover/COMPATIBILITY.md` and `[windows-master/ENVIRONMENT.md](../../agents/windows-master/ENVIRONMENT.md)`). Stage progression is **observed receipts only**; gates G0–G5 are not all claimed — plugin-contract and host-port seams remain unresolved per COMPATIBILITY.md.  
**Repository:** `owenservera/aion` / `main`  
**Status:** RESEARCHED_AND_DOCUMENTED — **NOT INSTALLED, MIGRATED, BENCHMARKED OR HOST-TESTED** by this dossier's original lane.  
**Scope:** OpenCode V2 capability research and AION-specific adoption strategy. This is *not* a new orchestration service or execution authorization.

## Purpose and ownership
OpenCode is AION's current **Windows local code execution agent**, by owner decision of 2026-10-17, while ZCode execution on Windows is deferred. This supersedes older generalized ZCode-first execution statements for **this Windows host**, not ZCode's separate ACP/transport role. Source: `workspace/aion/agents/windows-master/BLOCKERS.md`, D1.

- Windows master: **OpenCode 1.18.35** last verified at `C:\ProgramData\chocolatey\bin\opencode.exe`. **Superseded 2026-10-19:** the npm shim executes `@opencode/cli` **v2.0.32** (`opencode --version`, `model-failover/COMPATIBILITY.md`).
- Linux box: **OpenCode 1.19.1** last reported in `workspace/aion/ops/BOX-READINESS.md` on 2026-10-16.
- Both are *historical repo observations*, not current interactive probes.
- Host disk pressure is handled by **PC HQ**, not by an AION migration command; Windows C: had **1.10 GB free** in the Windows master blocker record.
- This dossier does **not** authorize changes to the authenticated ChatGPT browser, machine packages, services, credentials or active workloads.
- No Playwright or Puppeteer.

> **2026-10-19 Context7 contract addendum:** [SOFTWARE_HQ V2 API / SDK / SSE / plugin research](https://github.com/owenservera/SOFTWARE_HQ/blob/main/context7/research/2026-10-19-opencode-v2-aion-contract-addendum.md). This complements the earlier `context7/raw/2026-10-19T13-03-*.json` harvest documented in this dossier, with V2 `@opencode/client`, volatile `GET /api/event` SSE, `Plugin.define` hook migration, agent permissions and a minimal Windows conformance probe. Source-backed docs, not a new Windows runtime verification. **Do not reimplement OpenCode's existing service/session/event infrastructure before testing it.**

## Contents
1. [RESEARCH-2026-10-17.md](./RESEARCH-2026-10-17.md) — released feature inventory, architecture, compatibility and provenance.
2. [MIGRATION-AND-VALIDATION.md](./MIGRATION-AND-VALIDATION.md) — read-only discovery, staged migration, test matrix and rollback.
3. [AION-INTEGRATION.md](./AION-INTEGRATION.md) — existing system boundaries, proposed high-leverage integration points, acceptance receipts, and the **2026-10-19 design proposal: V2 read-only observer (outside the bus delivery adapters) + future owner-bound HTTP control** — proposal only, not implemented, not authorized.
4. [ACP-AND-SERVICE-PROTOCOL.md](./ACP-AND-SERVICE-PROTOCOL.md) — native ACP v1 private-server mode versus shared V2 HTTP service.
5. [RISKS-AND-SOURCES.md](./RISKS-AND-SOURCES.md) — regressions, disputed/unknown claims, upstream primary documentation and issue trackers.
6. [MODELS-AND-ROUTING.md](./MODELS-AND-ROUTING.md) — V2 model layer: per-agent model config, `provider/model#variant`, per-session/model switch contract set, live routing state and rollback-free churn hazards.
7. Global routing system (live): [`../opencode-models/README.md`](../opencode-models/README.md) — ROUTING.json + read-only audit + receipts; user-facing playbook: [`../OPENCODE-FREE-MODEL-PLAYBOOK.md`](../OPENCODE-FREE-MODEL-PLAYBOOK.md).

## Operating decision
**Recommended: controlled V2 pilot, not an in-place bulk upgrade.** Verify versions and disk headroom; inventory API consumers/plugins; preserve V1 configuration and a recoverable state backup; exercise a standalone, mock-repository V2 evaluation where possible; only then change the production Windows/Linus runtime with an approved rollback. The V2 server API and plugin API are genuinely incompatible with V1.

## Five evidence stages
`RESEARCHED` -> `HOST_INVENTORIED` -> `ISOLATED_PILOT_PASS` -> `MIGRATED_AND_VALIDATED` -> `PRODUCTION_ACCEPTED`.

Only **RESEARCHED** is established by these files. Repo publication is not proof an employee chat has acknowledged a handoff, a runner has installed software, or a live workflow works.

## Existing AION neighbors
- [Windows execution owner and blockers](../../agents/windows-master/BLOCKERS.md)
- [Role 04 OpenCode output / WPM contract](../../sessions/roles/04-opencode-output-efficiency/WPM-TRACKER-v0.1.md)
- [BFF/Linux historical readiness](../BOX-READINESS.md)
- [AION Chrome relay fixture MVP](../chrome-relay/extension/README.md)
- [AION project ownership](../../pm/OWNERS.md)

**Important:** The V2 `@opencode/client` and OpenCode HTTP API are *not* ACP JSON-RPC, and neither is the AION relay envelope. A bridge must map these explicitly; do not blend their contracts.

**2026-10-19 addition.** The optional loopback HTTP adapter (`../chrome-relay/extension/src/bus/adapters/opencode-v2.js`) is **offline-built and not host-proven** (8 fake-service tests, independent pass 2026-10-19T15:55:24Z); the read-only observer, its hardening and any production integration are **not built**. The design proposal that supersedes the older "not built" wording is the design section at the end of [AION-INTEGRATION.md](./AION-INTEGRATION.md), sourced from the canonical pulls `2026-10-19T15-59-02-*.json`, `2026-10-19T16-01-03-*.json` and `2026-10-19T16-03-06-*.json` in `SOFTWARE_HQ/context7/raw/`. ACP (private per-process server) remains the primary route; the shared service inventory is a different surface. The design's open point: **reliable terminal attribution is a blocking conformance question** — no documented input-ID ↔ idle/terminal correlation (field, cardinality or ordering) exists in the evidence, so per-input outcomes stay `UNKNOWN` until a host run answers it; an isolated single-input session is an observation aid, not a protocol guarantee.
