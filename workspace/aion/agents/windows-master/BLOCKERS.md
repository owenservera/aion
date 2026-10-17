# Windows Master — Blockers and Decisions

Items that must not be self-resolved. Each names the decision owner, the evidence, and the options.

---

## D1 — Local execution agent: OpenCode · **DECIDED 2026-10-17 (owner)**

**Decision.** **OpenCode is the local Windows execution agent** for AION work on `OWNER_WINDOWS_MASTER`.
ZCode is deferred as an execution agent until it is working on Windows.

**Owner statement (2026-10-17):** "we are going change for now to opencode as the local windows
execution agent until we get zcode working."

**Verified present and functional on this host:**

| Tool | Version | Path |
|---|---|---|
| OpenCode | 1.18.35 | `C:\ProgramData\chocolatey\bin\opencode.exe` |
| ZCode | present | `C:\Users\VIVIM.inc\.local\bin\zcode.cmd`, upstream `zai-org/ZCode` |

OpenCode configuration is present (`~/.config/opencode/opencode.json`). This bootstrap was itself
executed through OpenCode, which is direct evidence the agent is operational here — not an assumption.

**Scope of the decision.** This routes *who writes and runs code*. It does not alter:
- `live_execution_authorized: false` — the signed-in ChatGPT browser remains unauthorized (B3);
- the M1 acceptance contract;
- the rule that Grok Bot never authors code;
- the preference to reuse existing components rather than build parallel ones.

**ZCode's status changed, but note carefully:** B1 (the POSIX permission defect) is now **fixed** and
`bff/zcode` is green at 6/6. ZCode's *driver* is therefore no longer the reason for deferring it.
Whether to return ZCode to the execution rotation is a fresh owner decision, not a consequence of this
record. ZCode also remains a transport path for the ACP/BFF work, independent of who authors code.

## B1 — zcode driver tests assume POSIX file permissions · **RESOLVED 2026-10-17**

**Was:** `bun test` in `workspace/aion/bff/zcode` → 1 pass, 4 fail, every failure aborting with
`token file ... must be mode 0600 (is 666)`.

**Root cause (verified empirically, not assumed).** Two separate defects, not one:

1. **The permission check was meaningless on Windows.** NTFS has no POSIX mode bits — Node reports
   `0o666` for *every* file, so `mode & 0o077` was non-zero unconditionally and the check rejected every
   token file on this host while proving nothing about its real permissions.
2. **The tracked-tree guard was dead code.** `path.resolve(file).startsWith("/workspace/aion")` can
   never match on Windows, where `resolve()` returns `C:\...`. That security rule had never once fired.

**Fix — controls replaced, not removed.** `assertTokenFileNotWorldReadable()` now enforces the actual
threat model on each platform:

| Platform | Control |
|---|---|
| POSIX | unchanged — rejects group/other mode bits (`mode & 0o077`) |
| Windows | reads the DACL via `icacls` and rejects grants to `Everyone`, `Authenticated Users`, `BUILTIN\Users`, `BUILTIN\Guests`. `SYSTEM` and `Administrators` are deliberately allowed — they can take ownership of any file anyway, so denying them buys nothing. |

The tracked-tree guard now compares **resolved** roots for both layouts and honours an
`AION_REPO_ROOT` override so it is testable without touching the real repo. A file inside the AION tree
is now correctly rejected on Windows — it previously was not.

**Result:** `bun test` → **6 pass / 0 fail.** Two new tests cover both rules, including a
negative case proving the tracked-tree rejection actually fires.

**Not a workaround:** the check is still enforced on Windows, now against the mechanism that platform
actually has.

---

## B2 — C: drive has 1.10 GB free · **OWNED BY PC HQ — not an AION action**

**Observed.** `Get-PSDrive C` → 469.70 GB used, **1.10 GB free**. The decision record
(`DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md` §6.3) noted 6.3 GB free at the time.

**Ownership (owner decision, 2026-10-17):** disk and local-infrastructure management belong to
**PC HQ**, which is the governing agent for local infra and is actively working on it. AION does not
manage, reclaim or optimise host storage. **Nothing was deleted during the AION bootstrap**, and no
AION task should do so.

**Relevance to AION (informational only, no action required here):** Git object stores, Bun/npm caches
and Chrome profiles share this volume. Under disk pressure a `git fetch` or the 5-minute sync can fail.
That failure would be visible in `logs/audit.ndjson` and would surface as exit code `40` or `50`
(see [`RUNBOOK.md`](RUNBOOK.md)) — **escalate to PC HQ rather than attempting a fix from an AION lane.**

**Explicitly out of AION scope:** deleting caches, archives, mirrors or any repository working tree.

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