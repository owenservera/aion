# AGENTS.md — BCP-dev repository working agreements

## Repository purpose

BCP-dev is the migration, reconciliation, proof, and destination-development repository for VIVIM.

VIVIM legacy source mine → BCP control/migration substrate → Ω destination → final VIVIM product.

The legacy tree is evidence and is read-only. Ω ratified law is technical authority. Destination docs define the working end-state. AGENTS_CONTEXT defines durable agent roles/context. Archive material is genealogy only.

## Current boundary

K0 Ω Core = minimum non-bypassable, domain-neutral runtime mechanism.
K1 = shared boundary protocol/reference vocabulary.
System plugins = first-party VIVIM capabilities and semantics.
Extension plugins = user/third-party capabilities through the same governed path.
Tooling = authoring, analysis, diagnostics and CI outside runtime authority.

Fundamental to VIVIM does not imply fundamental to K0.

The current destination responsibility baseline is the expanded 125-row inventory in docs/destination/core-vs-plugin-boundary/DESTINATION-RESPONSIBILITY-MATRIX.md.

Before substantive implementation, classify the responsibility and record its invariant, semantic owner, canonical data owner, authority boundary, evidence, dependencies, replacement seam, and falsifier.

## Authority hierarchy

1. Ω ratified law — omega-baseline/omega-final/docs/decisions/CURRENT-INVARIANTS.md, docs/BUILD-DECISIONS.md and D-records.
2. BCP enforced state/vocabulary — bcp-speed/bcp/state, log, taxonomy and reconciliation tooling.
3. Current repository code/tests/evidence.
4. docs/destination working product/architecture model.
5. AGENTS_CONTEXT durable role context.
6. docs/archive historical genealogy.

A document's folder does not make it authoritative.

## Current cold start

Read /AGENTS.md → /BUILD_CONTEXT.md → /docs/CURRENT-CONTEXT.md → /AGENTS_CONTEXT/README.md → the relevant peer-agent context → current Ω/destination authority.

## Historical project material

The former root construction/project-management layer is archived under docs/archive/project-history/.

Do not execute archived prompts or trackers.

## Repository access and tool selection

When connected GitHub integration/access is available, use it as the **primary path for repository work**: reading files, resolving current refs/SHAs, inspecting branches/commits, verifying changes, and writing changes.

Do **not** use general web search as a substitute for direct connected GitHub access merely because a GitHub URL was provided. Use web search for external research or independent corroboration. Use it for repository content only when direct GitHub access is genuinely unavailable, and treat that as a fallback rather than repository proof.

At cold start, determine the repository-access capabilities available to the session before choosing the access method.

## Persistent agent task queue

Every standing agent home maintains a persistent `TASKS.md` owned by that agent. It records unfinished work, next actions, verified dependencies, blockers, and completion state across ChatGPT conversations. `TASKS.md` is distinct from `STATE.md` (what is currently true) and `LESSONS.md` (reusable learning), and it is not architectural authority.

Fresh sessions read and reconcile `TASKS.md`; unfinished work must not depend on chat history for recovery.

## Agent operating rule

For substantive changes:
1. identify governing authority;
2. preserve evidence and lineage;
3. update durable context;
4. keep research/documentation and production-code changes explicit;
5. commit coherent changes with a clear status.

## Decision authority (owner directive 2026-09-30)

**No human answer ever blocks work.** The engineering team decides and moves forward: a
question that would otherwise park a lane is turned into a team decision in the same session,
by a panel spawned per severity (S1 = 1 member, S2 = proposer + challenger, S3 = 3 members with
rollback; never more than 3 deliberating agents). Decisions are effective immediately,
recorded in `.zcode/board/DECISIONS.md` with reason, evidence, alternatives, rollback and
revisit condition, and reported to the owner as **OWNER-INFORM** items. The owner may override
any decision at any time; silence means it stands. Only the owner-reserved class (irreversible
external commitments, credentials, material financial commitments, legal/compliance, product
intent) is never actioned irreversibly without them — and even then the team takes the most
conservative reversible step and keeps everything else moving. Full policy:
`.zcode/DECISIONS-POLICY.md`.

## Windows / PowerShell command execution (non-hanging protocol)

This machine is Windows 11 with PowerShell 7 (`pwsh`). A hung tool call is a **session-ending event**: the agent cannot recover, and the user must terminate `opencode.exe` manually, losing all in-memory context. Treat every command as a potential hang source and verify the risk class before running it.

### Why commands hang — mechanism, not folklore

The `bash` tool gates completion on **stdout/stderr pipe EOF**, not on process exit (`core/src/process.ts`: `Effect.all([collectStream(handle.all), handle.exitCode])`). If any child, grandchild, or daemon still holds the inherited write-end of the pipe, EOF never arrives and the tool stays `status: "running"` **forever**.

Windows makes this materially worse than POSIX:

- `cross-spawn-spawner.ts` uses **overlapped** pipes on `win32`, which fail to emit `end` when a grandchild inherits the handle.
- The Windows pipe buffer is **8KB** (vs 64KB on Linux), so a producer blocks on write far sooner — a full-pipe deadlock.
- Children inherit the parent's **Job Object**. `detached: true` + `unref()` in Node/Python is **not a real detach on Windows**; the shell tool waits on the whole Job Object. Measured: parent exits in 0.05s, tool returns *never* for an infinite-lived child.

**The `timeout` parameter does not fire on a silent held-open pipe.** It is insurance for slow-but-producing commands, not a fix for this class. Never treat "I set a timeout" as "this cannot hang".

PowerShell adds its own distinct failure:

- `Select-Object -First` / `-Last` (and `Select-Object` generally) **abort the upstream pipeline** via `StopUpstreamCommandsException`. PowerShell stops draining the producer's stdout; the producer then blocks writing into the full 8KB pipe; the pipeline is wedged in a state that will never self-resolve.

Tracking: anomalyco/opencode #20902, #24731, #24784, #29822, #32504, #36799, #37838, #42524. Fixes landed in PR #29831, #42756, #44601, #46085; startup package-manager probe timeouts in PR #11724. Still not fully closed — assume the bug is present.

### The five hard bans

1. **Never `Select-Object -First`, `-Last`, or any output-truncation cmdlet on a command's stdout.** The shell tool already captures full output and persists overflow to a file. Truncation is never necessary and is a direct hang trigger.
2. **Never `-NoNewWindow` on `Start-Process`.** It lets the child inherit the tool's stdout/stderr handles.
3. **Never spawn a background/daemon/long-lived process and chain `;`-separated synchronous commands after it in the same call.** Split into two tool calls: one to spawn, one to verify.
4. **Never use `&` / `Start-Job` to background a dev server, watcher, or `npm run dev`.** `Start-Job` has its own CPU-bound hang signature (~140% CPU, unbounded memory growth).
5. **Never run a test or script that spawns a server/daemon as an ordinary tool call** without first stating the kill step and confirming it exists in the code.

### Output discipline — the default pattern

Redirect to a file, then read the file with the Read/Grep tools. This yields **more** information than truncation, at **zero** hang risk.

```powershell
<command> *> "$env:TEMP\<name>.log"
```

Then `Read` / `Grep` the log. Do not chain a summary echo after it. If you need the exit code, capture it in the same call *inside* the redirect target, or accept that the log plus tool-reported status is sufficient.

If output must be bounded at the source, bound it in the **producing command** (e.g. a test's own reporter flag, `--reporter`, `head -n` inside a `cmd`/WSL context) — never in the receiving PowerShell pipeline.

### Spawn discipline — if you must background something

```powershell
# correct: no pipe inheritance, stdio goes to files
Start-Process -FilePath "node" -ArgumentList "server.js" `
    -WorkingDirectory "C:\path\to\project" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "C:\Temp\app.log" `
    -RedirectStandardError  "C:\Temp\app.err" `
    -PassThru
```

Then in a **separate** tool call, poll for readiness. Do not sleep-and-check in the same call.

> Evidence note: community reports conflict on whether `-RedirectStandard*` alone is sufficient — #32504 measured an immediate return, while #37838 and #33028 reproduced hangs with the same construct. Treat redirect-to-file as **necessary but not sufficient**. The split-call rule is what actually holds.

### Prefer cmdlets over native commands for inspection

`Get-Process`, `Get-CimInstance`, `Get-ChildItem`, `Select-Object`, `Get-Content` are in-process cmdlets. They create **no OS child process and hold no pipe**, so they cannot hang the tool. Use them for all state inspection.

```powershell
Get-Process -Name opencode,bun -ErrorAction SilentlyContinue |
    Format-Table Id,ProcessName,StartTime,CPU -AutoSize

Get-CimInstance Win32_Process -Filter "Name = 'opencode.exe'" |
    Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | Format-List
```

Reserve native executables (`git`, `bun`, `npm`, `dotnet`, `python`) for work that genuinely requires them, and always redirect their output.

### Test discipline

- Assume a test that spawns a long-lived child **leaks it** until the source proves otherwise.
- Read the teardown path before running. Confirm the child is actually killed on the failure path, not just the success path.
- On Windows, a cleanup that relies on `process.kill(-pid)` is a **no-op** — negative-PID signalling is POSIX process-group semantics. `taskkill /T /F /PID <pid>` is the only reliable tree kill. Suspect any `src/` teardown using `process.kill(-pid)` without a `win32` branch.
- A `const` referenced inside a callback defined *before* its declaration is a temporal-dead-zone leak: the async callback throws `ReferenceError` and the resource is never released. This exact defect was observed at `runtime/vendor/opencode-swarm/src/runner.ts:135` (`void close()` referencing a `const close` declared at line 161), orphaning `opencode serve --port=27082` on 2026-09-28. Verify cleanup runs on the **timeout/reject** path, not only the happy path.
- If a run may leak, capture the PIDs **before** running (`Get-CimInstance ... | Select-Object ProcessId,CommandLine`) so you can prove what was left behind.

### Recovery from an existing hang

1. `Esc` aborts the stuck tool fiber. The agent resumes normally; the model is not stuck, only the tool layer was.
2. `opencode resume` restores the session with its context intact.
3. Identify orphans by `CommandLine`, not by name — `--auto` processes are live sessions and must **not** be killed:

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'opencode.exe'" |
    Select-Object ProcessId,ParentProcessId,CommandLine | Format-List
```

**Preferred: use the repo cleanup tool.** It applies every gate automatically and re-verifies afterwards.

```powershell
pwsh tools/Cleanup-OpencodeServe.ps1             # report only, side-effect free, exit 1 if dirty
pwsh tools/Cleanup-OpencodeServe.ps1 -Kill       # terminate confirmed orphans, then verify
pwsh tools/Cleanup-OpencodeServe.ps1 -Json       # machine-readable, for agent/CI assertions
```

It only ever considers processes carrying a `serve` token (never `--auto`), classifies a serve as ORPHANED only when its supervisor PID is absent from the process table, hard-excludes its own ancestor chain, kills tree-wide, and re-reads the process table to confirm rather than assume. A serve whose supervisor is alive is reported `ATTACHED` and needs both `-IncludeAttached` and `-Kill` to touch. Requires `-Kill` to terminate anything. Exit 0 = clean, 1 = orphans present or survived the kill.

Manual fallback, only for a process the tool did not classify:

```powershell
taskkill /T /F /PID <pid>
```

4. `EBUSY` on a temp-dir cleanup is corroborating evidence of a live handle — treat it as proof of a leak, not as a flaky test.

### OpenCode CLI startup hangs (distinct root causes)

Diagnose with `opencode --print-logs` or `opencode --log-level DEBUG` before assuming anything else. Logs: `%USERPROFILE%\.local\share\opencode\log\`.

- `error code 126` loading `opentui-*.dll` — **Windows Security/antivirus is blocking the unpacked native binary.** Allow it. This is not npm, not fnm, not a TTY problem.
- Window title stuck on `npm list` / `npm config get registry` — `%TEMP%`/`%TMP%` points at a **RAM disk** (OSFMount and similar). Repoint to real NTFS.
- Stuck on "Loading plugin..." — pin **exact** plugin versions (never `@latest`, which forces an npm resolve every startup), do not run multiple opencode instances concurrently, and be aware of the two competing `node_modules` layers: `~/.cache/opencode/packages/` vs `~/.config/opencode/node_modules/`.
- `0xC000001D STATUS_ILLEGAL_INSTRUCTION` — pre-Haswell CPU; the binary requires AVX2. Roll back to a build without it.
- Desktop app blank window — install/update the **Microsoft Edge WebView2 Runtime**.
- Desktop app hangs on launch — set `"plugin": []`, then clear `%USERPROFILE%\.cache\opencode`. Unset `OPENCODE_PORT` if set.
- Plugin misbehaviour — move `%USERPROFILE%\.config\opencode\plugins` aside, and check `<project>/.opencode/plugins/`.

Keep the CLI current (`opencode upgrade`); several hang classes are version-fixed. Note the project auto-updates on some installs, so a version regression can arrive without a deliberate action.

### Durable fix

The real remedy is **WSL**. It is the officially recommended environment and eliminates this entire bug class. When a task is hang-sensitive or long-running, run it under WSL rather than accumulating workarounds.

## Agent Git / GitHub / Commons

**Branches are for changes. Commons is for communication. Do not merge to communicate.**

Use Agent Commons for agent-to-agent communication and durable communication history. Use persistent `commons/AGENT-ID` refs for agent-owned communication streams; they are not code branches and are never merged into main. Use short-lived `work/AGENT-ID/TASK` branches for production implementation. Do not merge peer branches merely to read work, exchange research, answer questions, or synchronize context. Fetch and inspect peer refs directly; integrate coherent code at explicit work boundaries.

Detailed rules: `AGENTS_CONTEXT/GIT-AND-GITHUB-AGENT-PROTOCOL.md`.
