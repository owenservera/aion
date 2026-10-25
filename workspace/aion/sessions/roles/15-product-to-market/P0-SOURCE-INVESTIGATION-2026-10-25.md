# P0 code investigation — beta shipping decision
**Observed:** 2026-10-25, GitHub connector default-branch source reads. **Evidence levels:** CODE-VERIFIED = file body inspected; REPOSITORY-REPORTED = owner's/repo historical test receipt; LIVE-VERIFIED = independently executed on target host (NONE newly obtained this pass).

## Executive decision — two-track, one beta
**Selected for the fastest friend-install feasibility gate: `vivim-final` Windows Tauri desktop alpha, CONDITIONALLY.**
Why: it already has explicit Windows install packaging, backend sidecar/SQLite, guided first-run UI, and a five-to-ten-friends alpha release plan, so its *distribution* trajectory is more advanced. Its current GitHub release workflow cannot guarantee installer asset creation; **no verified distributable release is asserted.** If clean-machine install plus first genuinely useful task fails, downgrade immediately, do not start wholesale cross-repo consolidation.

**Continue `aion` / `vivim-harness` as core differentiated Capture Studio** (native source-grounded capture/intelligence), not as simultaneous beta packaging winner until local first turn / user outcome is proved.

## Verified source-level matrix
| Repository | Product kind / current entrypoint | Source evidence | External beta gate | Status |
|---|---|---|---|---|
| [vivim-final](https://github.com/owenservera/vivim-final/tree/master) | Windows desktop AI application; Tauri shell, Bun sidecar, SQLite, Next frontend | `package.json` scripts `tauri:build`, `frontend/src/app/page.tsx` GuidedLanding/canvas, `src-tauri/tauri.conf.json` NSIS/currentUser, `src/desktop/sidecar-entry.ts` db bootstrap, `docs/alpha/00-ALPHA-RELEASE-PLAN.md` | Actual release installer, clean Windows first install, meaningful real-user message, persistence, logout/uninstall/rollback | CODE-VERIFIED components; beta UNKNOWN |
| [aion](https://github.com/owenservera/aion) + [vivim-harness](https://github.com/owenservera/vivim-harness) | Local Capture Studio via `bin/studio.mjs start`, `/chat`; browser-received network/DOM evidence | Their `package.json` blob SHA is the same (`dfc613ec...`), and `src/studio/ui/chat.mjs` blob SHA the same (`7797d123...`); Harness `src/capture/conversation-service.mjs` is `3f782510...` | Isolated install; a genuinely accepted capture / useful revisit + export; real first/second turn only when required; per-user authorized Chrome identity | CODE-VERIFIED overlapping copies; Windows run REPOSITORY-REPORTED blocked |
| [vivim-platform](https://github.com/owenservera/vivim-platform) | Broad Bun monorepo: PWA, server, network, admin, SDK, desktop | `package.json` multi-service scripts; `pwa/src/App.tsx` wraps `SupabaseAuthProvider`; `pwa/package.json` many dependencies | Multiple service/auth/deployment dependencies; inspect active external deployment before beta use | CODE-VERIFIED structure, live UNKNOWN |
| [vivim-live](https://github.com/owenservera/vivim-live) | Marketing/landing and interactive memory demo | `src/app/page.tsx` present; `src/app/demos/live-memory/page.tsx` hardcoded `DEMO_FLOWS` and scripted responses | Separate live memory product/backend is not established by this demo | CODE-VERIFIED *scripted demo*, not backend extraction proof |

**Exclusion:** repos ending `-VIVIM` remain excluded as third-party forks. Others' original authorship and own commits since 2025-10-25 remain NOT VERIFIED.

## P0 blocker V-REL-01 — broken evidence chain for downloadable installer
- [release.yml](https://github.com/owenservera/vivim-final/blob/master/.github/workflows/release.yml) runs `ubuntu-latest` (line 25); Windows condition contains `|| true` (line 54); `makensis installer.nsi || echo ...` masks packaging failure (line 60); release upload uses `fail_on_unmatched_files: false` (line 107). A green release therefore does **not** prove the advertised `vivim-desktop-setup.exe` exists.
- `scripts/tauri/installer.nsi` not found via exact path. This is not proof an alternative valid installer script or existing release asset is absent.
- `src-tauri/tauri.conf.json` is Windows NSIS bundle with current-user install. Build must use current supported Tauri/Windows path and verify the actual artifact.
- An [alpha plan](https://github.com/owenservera/vivim-final/blob/master/docs/alpha/00-ALPHA-RELEASE-PLAN.md) dated 2026-08-26 identifies critical unchecked full-desktop-loop and fresh VM tests; its text's WORKING labels are historical *source assessment*, not independent owner-tested proof now.
- **Action created:** [vivim-final issue #3](https://github.com/owenservera/vivim-final/issues/3), containing precise fail-closed packaging and native test acceptance contract.

## P0 blocker V-USER-02 — real useful task not established
- `frontend/src/app/page.tsx` integrates GuidedLanding and canvas UI, but default top-level initial user is `user:demo`; external-user identity and onboarding behavior need live inspection on a fresh install.
- `src/server/conversation-router.ts` has an actual /api/conversations/:id/send route calling ConversationManager.send with 30s timeout. Route existence alone does not prove real LLM response.
- The alpha plan explicitly scopes Claude/Gemini/DeepSeek to **conditional logged-in Chrome profiles**; ChatGPT/Qwen/Grok declared out of scope, Gateway simulator-only without model keys. These are constraints on first-friend promise. Do **not** advertise all providers available in alpha merely because registries declare them.
- `src/desktop/sidecar-entry.ts` logs and continues without embedded seed snapshot if no candidate is found. A fresh installer must verify DB boot, data directories, and an actual useful provider/task.
- Do not test private accounts or capture transcripts in public GitHub. Browser effect owner remains single; no Playwright/Puppeteer.

## P0 blocker C-LIVE-01 — Capture Studio live acceptance
- The [Windows 2026-10-24 receipt](https://github.com/owenservera/aion/blob/main/workspace/aion/agents/windows-master/CAPTURE-STUDIO-FIRST-TURN-2026-10-24.md) records one new target and blocked `BINDING_CHANGED` on connect; **0 provider sends**, read-only reconcile unsuccessful. Initial binding-change cause remained unknown.
- [aion issue #84](https://github.com/owenservera/aion/issues/84) is open and contains the owner-authorized bounded ChatGPT testing scope; [issue #72](https://github.com/owenservera/aion/issues/72) owns independent QA. Avoid creating duplicates.
- Current Harness code `src/capture/conversation-service.mjs` around line 279 calls `ensureCapture()` then adapter preflight, while `src/studio/ui/chat.mjs` around line 289 has differentiated first and subsequent turn readiness. It is **not safe** to declare an old first-turn bug unchanged from outdated issue prose without re-running actual host reproduction.
- Current Harness README specifies local Chrome/Edge profile setup, Node >=22, loopback Studio UI, read-only by default and separate authorized send path. This is a high-friction friend setup compared with a verified installer. Critical value as platform building block remains high.

## Deferred merge decisions
Do not combine the independent ChromeGovernor in `vivim-final` and the Capture Studio CDP controller into one product by running two concurrent browser actors. Any integration must choose a single effect owner, preserve explicit identities and evidence, and be separately acceptance-tested. Prefer importing knowledge/capture outputs through file/API contracts over controller mergers for first beta.

## Recommended no-bureaucracy shipping sequence
**S1 Release artifact (issue #3):** Windows build with fail-closed artifact validation and SHA256, check existing GitHub Releases actual assets. No claim of success until verified.
**S2 Real first-user value:** On clean independent Windows, install and show onboarding, connect one authorized provider/account or demonstrate real useful import/query, perform one task, restart to prove persistence. No simulator/demo claims.
**S3 Invite two friends:** one shared installer, one simple script, one feedback channel/form. Measure install success and unaided task completion; only then extend to five.

**Fallback trigger:** If S1+S2 cannot be made independently reliable without substantial architecture changes, reassess a *Capture Studio read-only capture/revisit/export* alpha or a narrow knowledge-import tool. Do not declare a winner based on code size or past aspirations.

## Tests performed this pass
GitHub read-only inspection and cross-repository blob SHA comparison. No builds, Node/Bun tests, installed app runs, release artifact download, or live account sends. The live evidence above is a dated repository report, not a fresh execution by this agent.

## Tracking
- P0 release blocker: [vivim-final issue #3](https://github.com/owenservera/vivim-final/issues/3) — created this pass.
- Capture first/second turn: [AION issue #84](https://github.com/owenservera/aion/issues/84) — existing.
- Capture QA: [AION issue #72](https://github.com/owenservera/aion/issues/72) — existing.
- This report is product launch coordination, not evidence that someone has been dispatched on a local PC.
