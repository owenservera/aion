# Always-on capture (runbook)

Short guide to the always-on supervisor of Capture Studio. No flags other than the ones listed here exist.

## What runs

`node scripts/always-on.mjs` is the supervisor. It:

1. attaches to a Chrome that is already serving DevTools on the configured CDP port,
   or launches the dedicated capture browser (separate profile, loopback DevTools) if none is listening;
2. runs the recorder against that browser, one recording session at a time;
3. restarts the recorder forever — if a session dies, the supervisor starts the next one.

The CDP port defaults to **9222** and can be changed with `--port N` or the environment variable
`CAPTURE_STUDIO_CDP_PORT` (see `src/config.mjs`, key `cdpPort`).

## Start it now

```powershell
node scripts\always-on.mjs
```

Flags: `--tabs all|one`, `--rotate-min N`, `--max-mb N`, `--port N`, `--status`, `--stop`.

```powershell
node scripts\always-on.mjs --status   # supervisor state
node scripts\always-on.mjs --stop     # stop the supervisor and the recorder
```

The supervisor runs in the foreground; close it with Ctrl+C.

## Install / remove autostart (per user, no admin)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Install
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Remove
```

The task is named `CaptureStudio-AlwaysOn`. It triggers at logon of the current user, runs
`node.exe scripts\always-on.mjs` hidden, with the capture-studio root as working directory, an
unlimited execution time limit, and restarts up to 999 times, once a minute. It is not stopped on
battery or idle. Running `-Install` again replaces the existing task.

## Where the data lives

The data directory is `%LOCALAPPDATA%\AION\capture-studio` on Windows (override with the
environment variable `CAPTURE_STUDIO_HOME`). `node bin\studio.mjs paths` prints the resolved paths.

| Item | Path |
| --- | --- |
| Supervisor log | `<data dir>\always-on.log` |
| Supervisor state | `<data dir>\always-on.json` |
| Sessions | `<data dir>\sessions\<session-id>\` (`session.json`, `raw\`) |
| Capture browser profile | `<data dir>\chrome-profile\` |

## How sessions rotate

A recording session ends when either limit is reached, whichever comes first:

- **duration** — `--rotate-min N`: the session is closed after N minutes and a fresh session starts;
- **size** — `--max-mb N`: the session is closed cleanly when its raw data reaches N MB.
  `--max-mb 0` means no size limit (the default per-session quota in `src/config.mjs` is `maxMb = 0`, unlimited).

Each finished session lands in `<data dir>\sessions\<session-id>\`.

## Verify it is really capturing

```powershell
node bin\studio.mjs session list
node bin\studio.mjs targets
```

`session list` shows the saved recordings (newest first); `targets` shows the tabs of the capture
browser that can be recorded.

## Failure triage

| Symptom | Action |
| --- | --- |
| Nothing captured / no browser seen | `node bin\studio.mjs doctor` (checks Node, Chrome, DevTools, data folder, learner, profiles) |
| CDP port busy or wrong browser attached | Use a different port: `node scripts\always-on.mjs --port 9333` |

## Security note

The DevTools port is bound to **127.0.0.1** (loopback only) and grants **full control of that
browser profile to any local process**. Any program running as any user on this machine can attach
to the port and read or drive the capture browser, including its signed-in sessions and cookies. Keep
the machine account trusted; close the capture browser when it is not needed.

## Browser closed vs. open

| Step | Capture browser |
| --- | --- |
| `-Install`, `-Status`, `-Remove`, `-Start`, `-Stop` of the task | may stay open |
| `node scripts\always-on.mjs` (start) | may stay open — the supervisor attaches to it |
| Changing the port (`--port`) | **close it first** — the dedicated profile cannot be opened twice, so a second Chrome on another port would fail to start |
| Uninstall (below) | **close it first** |

## Uninstall

```powershell
# 1. stop the supervisor and the scheduled task
node scripts\always-on.mjs --stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Remove

# 2. close the capture browser window (it holds the profile lock)

# 3. optionally delete the captured data
#    %LOCALAPPDATA%\AION\capture-studio
```

Removing the scheduled task stops the automatic start; deleting the data directory removes the
captured sessions, the logs and the capture browser profile.
