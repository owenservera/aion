# Windows Master — Blockers and Decisions

Items that must not be self-resolved. Each names the decision owner, the evidence, and the options.

---

## B1 — zcode driver tests assume POSIX file permissions · **OPEN**

**Observed.** `cd workspace/aion/bff/zcode && bun test` → **1 pass, 4 fail.**
The four failures all abort with:

```
error: token file ...\tok0.<n> must be mode 0600 (is 666)
```

The driver's tests create a token file and assert that an insecure mode is rejected. On Windows the
file mode is always reported as `666` because POSIX mode bits are not meaningful on NTFS, so the
security check fires before the test can reach the behaviour it means to exercise
(`auth` stage, `health` stage, full turn).

**Why this was not just fixed.** The check is a genuine security control. Making the tests pass on
Windows by relaxing it would silently weaken token-file protection for the ZCode transport. That is a
security decision, not a test fix.

**Options for the owner:**

| Option | Effect |
|---|---|
| **A. Gate the permission check on POSIX** — skip it when `process.platform !== 'win32'`, and instead assert the Windows equivalent (ACL restricted to the current user). | Recommended. Preserves the control's intent, makes the tests meaningful on Windows. |
| B. Leave as-is and record the 4 failures as a known Windows limitation | Honest but leaves the suite red, which erodes its signal. |
| C. Drop the token-file permission model in favour of the Windows Credential Manager | Larger change; touches the transport's security model. |

**Blocking:** the 4 zcode tests only. Not blocking M1 — the zcode driver is not on the ChatGPT
introspection path.

---

## B2 — C: drive has 1.10 GB free · **OPEN**

**Observed.** `Get-PSDrive C` → 469.70 GB used, **1.10 GB free**.
The decision record (`DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md` §6.3) noted 6.3 GB free at the time,
so this has degraded by roughly 5 GB and is now critical.

**Risk.** Git object stores, Bun's cache, npm caches, Chrome profiles and the sync system's logs all
compete for this volume. A full volume will silently break `git fetch`, the 5-minute sync, and Bun
installs — and a failed sync under disk pressure is exactly the case where an agent might otherwise
"fix" it destructively.

**Nothing was deleted.** Removing caches or archives is the owner's call.

**Suggested first targets** (all regenerable, none source-of-truth): Bun/npm/pip caches, the stale
`.gpm-sync` bare mirror, old Chrome profile caches. **Do not** delete any repository working tree.

---

## B3 — signed-in ChatGPT browser is not authorized · **OPEN (by design)**

`STATE.json` → `live_execution_authorized: false`. The host/browser stop order recorded in
`pm/UAH-COMMS-SPINE-PLAN-v0.1.md` stands. Per the decision record §5, a plain owner instruction naming
the browser target and the action is sufficient — no separate grant-file template is required.

**Blocking:** M1 acceptance, and any live exercise of the return-leg bridge.

**Not blocking:** writing and unit-testing `ops/chrome-relay/aion-bridge.ts` against local fixtures.

---

## B4 — ACPX source unavailable · **OPEN**

`owenservera/ACPX` returns 404 and `acpx-kit.zip` is not on this machine. `STATE.json` block
`ACPX_SOURCE` remains `NOT_SHARED_IN_REPO`; the recorded sha256
(`273c882f…dca3b75`) cannot be checked because the bytes are absent.

**Needed from the owner:** supply the artifact, or confirm AION proceeds without it. The plan in
[`M1-PATH.md`](M1-PATH.md) does not depend on it.

---

## B5 — pre-existing `.gpm-sync` system is stale and unrelated · **OPEN, low priority**

`C:\0-BlackBoxProject-0\.gpm-sync` mirrors only `001.PROJECTS.PM` and runs under scheduled task
`GPM-Sync-Detect`. Its last observed remote head (`9bd0082`) is behind the local checkout (`22b1c38`).

**Left untouched deliberately.** It is a separate Git integration service for a different repository;
the instruction is not to create or interfere with a competing one. Repairing or retiring it is a
separate decision.

---

## Non-blockers worth recording

- **Sibling repos carry uncommitted local work** — `VOMEGA` (23 files), `zcode-bots` (17),
  `SOFTWARE_HQ` (10), `hq` (6). Sync coverage was deliberately **not** extended to them; auto-committing
  another actor's in-progress work on a timer is exactly the failure mode to avoid.
- **`hq` and `machine-steward` are on `setup/net-egress-w0`,** not `main`. Any future coverage must
  respect their actual branches.
- **Stale native-messaging entry** — `com.vivim.core` is registered in HKCU but its manifest file is
  missing. Harmless to AION; worth cleaning separately.