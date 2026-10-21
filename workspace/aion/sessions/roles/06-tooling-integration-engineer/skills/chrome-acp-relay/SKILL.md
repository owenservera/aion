---
name: chrome-acp-relay
description: Diagnose and verify the AION Windows Chrome MV3 extension, native messaging relay, fixed registration codes, exact-thread binding and ACP transport with read-only evidence first.
---

# Chrome MV3 / native-host relay — Toolsmith skill

**Trigger:** AION's Chrome service worker, native messaging host, CLI registration, exact-thread watch-only readback, reconnect or ACP relay behaves unexpectedly; or the Windows-installed source version is uncertain. This extends the existing skill rather than inventing a separate registration or incident platform.

**Do not use for:** rebuilding product observers/routers, probing private ChatGPT session payloads, making a Send, installing browser hooks without scope, or declaring end-to-end I1/I2 acceptance. Development owns those product tests and integration decisions. Root [AGENTS.md](../../../../../../AGENTS.md) and [Development working desk](../../../../ops/chrome-relay/workers/development/DELIVERABLES.md) define current safety and objectives; the original [relay architecture](../../../../ops/chrome-relay/ARCHITECTURE.md) remains useful for architecture background, not necessarily current install reality.

## Fast path — current registration failure

1. Determine the actual Windows local AION checkout and the operator-verified installed **native host file** and **dev worker file**. Do not equate a matching file on disk with what Chrome's service worker currently loaded.
2. Run the **read-only Node helper** from AION repository root. It reports the Git revision/dirty state, compares **the two candidate file snapshots** with the source, and classifies only allow-listed registration diagnostics. No network, browser, accounts, registration, Send or file writes.

   ```powershell
   node workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/chrome-acp-relay/scripts/registration-triage.mjs --repo .
   ```

   When the *actual* candidate files have been identified by an authorized Windows agent:

   ```powershell
   node workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/chrome-acp-relay/scripts/registration-triage.mjs --repo . --installed-host "C:\verified\host\relay.mjs" --installed-worker "C:\verified\extension\receive-router.js" --code REGISTRATION_FAILED
   ```

   The paths in this example are placeholders, **not discovered or installed paths**. `--diagnostic` accepts only fixed allow-listed tokens such as `fetch_rejected`, not session response bodies, email addresses or browser messages. Inspect the returned `FILE_MATCH`/`FILE_MISMATCH` and `READ_ONLY_FILE_SNAPSHOT_NOT_LOADED_RUNTIME` semantics; do not describe a match as live loaded-code proof.
3. If Development/local Windows agent performs one **explicit authorized** `aion account register chief`, accept only redacted `code` and allow-listed `diagnostic` as evidence for this helper. If generic `REGISTRATION_FAILED` has no diagnostic, **check for stale loaded files as a hypothesis**, not a conclusion. If a fixed diagnostic exists, trace only that layer: CLI `velocity/bin/aion-local.mjs` → host `velocity/src/native-host/relay.mjs` → worker `velocity/extension-dev/receive-router.js` → page `extension/src/chatgpt/receive.js` → read-only account reader `extension/src/providers/chatgpt/account-registration.js`.
4. Development repairs only a proven failing seam, runs focused negative/positive tests, and obtains a new independently originated message from the **exact bound** ChatGPT thread through watch-only CLI before claiming I1. A successful IPC ping is not I1.

## Other transport / recovery use

- Verify Chrome actual version, extension ID, requested MV3 permissions, native messaging origin pin and actual loaded worker/host provenance, using supported host tools; inspect existing ACPX before building replacements.
- Expect MV3 worker shutdown/restart and reconnect. Persistent cursors and Bus dedupe are Development-owned implementation; never retry an uncertain mutating effect.
- For ACP or OpenCode/ZCode session problems, use [acp-interop](../acp-interop/SKILL.md), [tool-discovery](../tool-discovery/SKILL.md) and [incident-recovery](../incident-recovery/SKILL.md) rather than expanding this skill into a second protocol registry.
- Do not assume a GitHub commit makes a tool available in Windows/OpenCode/ZCode; a real harness skill-load and runtime receipt are separately required. Toolsmith only maintains capability evidence and the integration diagnostic.
- **Stop:** unexpected privilege requests, unapproved permission broadening, credentials/transcripts in logs, the wrong exact thread or unknown state of a previous Send. Preserve existing owner-local changes; no Playwright/Puppeteer.

## Verify this skill's executable component

```powershell
node --test workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/chrome-acp-relay/scripts/registration-triage.test.mjs
node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs validate workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/chrome-acp-relay/SKILL.md
```

A fixture test validates read-only behavior in that **test environment only**. On Windows, separately verify installed Node, repo path, host candidate paths, correct loaded extension provenance, harness discovery/invocation and actual I1 receipt. Update this skill for meaningful failures, not maintenance quotas.

**Historical note:** The former fixture-only six-role-card MVP and blanket pre-authorizations in this skill are superseded by the current twelve-agent, Windows-local owner direction. The original [issue #18](https://github.com/owenservera/aion/issues/18) is retained for provenance; do not reopen a duplicate relay project.
