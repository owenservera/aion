# Capture Studio first-turn execution — blocked before Send

**Host:** owner Windows master. **Source:** clean `main` at `c3e3e2dae769bdaf7f12f2b22fd0360fb2b1b594`. **Scope:** one bounded ChatGPT first-turn journey under issue [#84](https://github.com/owenservera/aion/issues/84); second turn excluded. **Result:** `BLOCKED_BEFORE_SEND`; **actual sends = 0**. No independent L5 or M1 acceptance is claimed.

**Concurrent checkout receipt:** final verification observed HEAD `2197793ddda6d130803c7e4691a7df84c39575d8`, committed at **21:47:16Z** by another actor. Its sole changed path is Development `SITREP.md`; the Capture Studio subtree is unchanged from `c3e3e2d`. This execution lane did not create that commit or modify its file. Source-level findings and reproduction results therefore retain the initial product-source pin, not a claim that Git HEAD stayed fixed throughout.

## Verified preflight and backup

- Installed runtimes: Bun `1.4.2`, Node `v24.22.1`, PowerShell `7.6.3`, Chrome `155.0.8059.85`; Windows build `29695`.
- Collector source fingerprint: `b6c94839900fda79`. Bun invoked the project's existing scripts, which explicitly retain Node. The two narrow diagnostic tests used installed Node's native `node:test` runner, not Bun's different test runner. No runtime download, package installation or lockfile change.
- Initial state: no Studio listener on `7878`, no CDP listener on `9222`; regular owner Chrome was running separately. Existing Capture Studio home held **108 saved sessions**, eight old recording markers and two conversation snapshots. No existing conversation had an uncertain send attempt in the inspected snapshots. Existing state was not reset or repaired. `AION-Sync` was already **Disabled** and was left unchanged.
- Before runtime startup, the entire existing Capture Studio home—including sessions/raw data, profiles, Chrome profile, conversations/journals and any existing pointer/config files—was copied outside Git. **5,797 files / 6,089,277,690 bytes** matched SHA-256; every file was also copied back to a disposable restoration file and rehashed. Config was absent/default, not replaced. Verification completed **2026-10-24T21:45:25.4502102Z**.
- Backup manifest SHA-256: `4738831786f8de221c17e2f60dd8f14bc79afa9f8f66f2ab946149fa7d168dcd`. The first backup wrapper timed out at 120 seconds; a safe resumed copy/verification with no execution timeout completed before any runtime setup action.

**Private local evidence root:** `%LOCALAPPDATA%\Temp\opencode\aion-l5-first-turn-20261024T2140Z\`. Backup lives in its `backup\` folder. This folder includes private browser/profile data and must **not** be committed, uploaded or attached to an issue.

## Actual execution and UI observation

1. `bun run doctor -- --json` in the existing Capture Studio package: `ok:true`; stopped DevTools, old recording markers and profile warnings were reported honestly, not repaired.
2. `bun run studio -- version --json`: actual Node and collector fingerprint above.
3. `bun run studio -- start --no-open --studio-port 7878`: launched the existing dedicated Capture Studio Chrome profile and existing Studio server from the pinned checkout. OS process checks proved the expected profile, loopback CDP flag, and current Studio CLI command. Track A was untouched.
4. **21:45:57Z:** `/chat`, `/ui/chat.mjs`, `/api/v1/health` and `/api/status` each returned **HTTP 200**. Recorder was idle; Chrome was `155.0.8059.85`. Served `chat.mjs` SHA-256: `22e0f85968b601040701c9a917db2ce5f48313993eb3f236cc497f352d148a31`.
5. **21:46:02Z:** exactly one supported Studio `POST /api/v1/conversations` with `{site:"chatgpt",freshTab:true}` created a new Studio-owned target. **21:46:03Z:** HTTP **201**, revision **3**, state **blocked**, reason **`BINDING_CHANGED`**, identity **unbound / NEW_CHAT**, capture **idle**, session ID **null**, no turn.
6. On that exact new target only, metadata inspection initially found `https://chatgpt.com/`, complete document, profile control, no login controls, an empty composer and **0 user / 0 assistant turns**, with no observed challenge iframe. A later sample did not find the composer with the diagnostic selector; account/control availability is therefore **not certified**. No unrelated prior chat transcript was read. Exact authenticated account identity was **not established** from these indicators, and no account identifier is published.
7. **21:46:26Z:** one supported **read-only** reconcile request returned HTTP **200**, revision **4**, still blocked with the same readiness reason and no session. No new turn, typing or Send was requested.
8. Actual `/chat` rendering showed **“Step 2 of 5: Chat box not ready”**, **Blocked / Not ready to send / Capture: idle**, and **“This is no longer the tab you connected (different tab or site).”** With a harmless uniquely marked **68-character local Studio draft**, Send stayed **disabled**. This draft was never typed into the provider. The loaded UI had no observed JavaScript exception during the diagnostic reload and no horizontal overflow at the observed viewport. Screenshot is private local only.
9. **21:49:41Z:** fresh metadata comparison confirmed that the selected CDP target, page origin and stored binding agreed; target/page home paths also agreed. Native `/c/<uuid>` thread did not exist. The initial `BINDING_CHANGED` trigger is **unknown**; a redirect/navigation race is not claimed as proven.

**No `/turns` submission occurred. No alternate actuator, direct-send bypass, resend, cookie transfer, login bypass or unknown-effect lock clearing was attempted.**

## Concrete source-owned blocker

The existing idle-connect / deferred-capture contract is inconsistent with readiness recovery and UI send admission:

- `src/capture/conversation-browser-adapter.mjs:212–246` attaches an idle page and intentionally returns `deferredCapture:true`, `sessionId:null`; actual capture is armed inside submit.
- `src/capture/conversation-service.mjs:523` returns from reconcile immediately when `snapshot.sessionId` is absent, **before any adapter readiness inspection**. Therefore the supported “Check again” cannot refresh this fresh blocked idle connection. The live request above demonstrated the unchanged result.
- `src/studio/ui/chat.mjs:243` additionally requires `capture.state === 'recording'` before enabling Send, even for a ready first turn whose runtime intentionally defers capture. **This additional branch is source/offline evidence, masked by the earlier live readiness blocker—not a separately passed live branch.**

Paths above are relative to `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.

**Focused offline reproduction:** private `repro-deferred-readiness.test.mjs`, executed with `node --test`, produced **0 pass / 2 expected-red failures**, exit **1**: (1) zero readiness-adapter calls on Check again where one was expected; (2) `canSend` rejects a ready first turn with capture idle. These fixtures never touch a browser or provider and are **not live proof**. No product source was modified; repairing the lifecycle/UI contract and its neighboring safety tests is handed back to Core/UI rather than bypassed during this execution lane.

## Preservation, cleanup and unrun stages

- **21:50:04Z:** explicit finish returned HTTP **200**, conversation **closed**, finish phase **done**, capture **incomplete**, no session, uncertainty **null**, writer **inactive** with no release error. This is a no-capture closeout, **not G4 acceptance**.
- **21:51:35Z:** all **3,286 preexisting non-browser files** rehashed against the backup, **0 changed**; saved sessions remained **108**. One new closed no-send conversation snapshot is retained for diagnosis. Existing Chrome-profile bytes may change normally through browser startup/shutdown; the complete pre-run profile backup remains available.
- **21:52:18Z:** the dedicated browser launched by this run was closed through its exact CDP connection. After verifying recorder idle, closed conversation, released writer and CLI provenance, only this run's Studio Node process was stopped. Both test listeners were gone; the preexisting regular Chrome process remained running. The background Studio shell's nonzero exit resulted from this intentional process cleanup, **not startup failure**.
- **Passed:** verified backup/disposable restoration; pinned local startup; loopback API/static UI checks; actual blocker rendering; no-send finish/release; preexisting non-browser data preservation; bounded cleanup.
- **Blocked:** supported first-turn readiness/Send journey; exact account/native-thread acceptance was not reached or asserted.
- **Not run:** real send, provider response capture, fresh-session integrity/derive, raw↔derived↔visible reply fidelity, G1–G7, knowledge/Outcome Packet from a fresh turn, restart/recovery campaign. No fresh session exists to derive.
- **Second turn:** out of scope. **Independent L5/M1 acceptance:** not performed.

Private evidence includes `baseline.private.json`, `backup-summary.private.json`, `backup-manifest.private.json`, `smoke.private.json`, connect/reconcile/binding/UI/finish/cleanup JSON, screenshot, targeted reproduction/TAP, `steps.jsonl`, `metrics.json`, `failures.jsonl` and `summary.md`. Parent must review this sanitized repository receipt before commit/push; this lane performed neither.
