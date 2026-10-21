# Capture Studio — live test runbook (Windows PowerShell)

A real, end-to-end test of the capture studio on a local Windows machine: from environment check
through a live capture, derivation, search, replay mirror, export, integrity verification and the
studio web UI.

Every command below is run from the **capture-studio root** (the folder that contains
`bin/studio.mjs`).

## 1. Prerequisites

| Requirement | Detail |
| --- | --- |
| Node.js | **>= 22** — the built-in `WebSocket` client is required. Verify with `node --version`. |
| Runtime | Use **`node`** for every command in this runbook. The project has **no runtime dependencies** and **no `npm install` step**; `bun` is not required and is not used here. |
| Chrome | Google Chrome (or Edge) for the capture browser. Auto-detected. Override with `$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"`. |
| Shell | PowerShell (Windows PowerShell 5.1 or PowerShell 7+). |
| Disk | The data directory holds raw captures in plain text — size it accordingly. |

### Data directory

Default: `%LOCALAPPDATA%\AION\capture-studio` (verified here as
`C:\Users\<user>\AppData\Local\AION\capture-studio`). Override with the `CAPTURE_STUDIO_HOME`
environment variable or the global `--data-dir` flag. Print the resolved layout with:

```powershell
node bin/studio.mjs paths
```

Layout: `sessions/` (one directory per recording), `profiles/`, `families/`, `learner/`,
`chrome-profile/` (the dedicated capture profile), `exports/`, `config.json`.

## 2. Safety notes

- **Loopback only.** The capture browser binds DevTools to `127.0.0.1`; the studio server refuses
  any non-loopback bind; the replay mirror serves on loopback only. Do not port-forward or expose
  these ports.
- **Authentication.** The studio prints a **tokenized URL**; the token is exchanged for an
  `HttpOnly`, `SameSite=Strict` cookie. Requests must carry that cookie or an `x-studio-token`
  header, and `Host`/`Origin` must be `127.0.0.1:<port>` or `localhost:<port>`. Do not share or
  paste the tokenized URL into issues.
- **Redaction defaults.** Cookie and auth headers are dropped, auth endpoints are recorded
  metadata-only, in-body tokens are masked in place, and every mask is recorded on its chunk. This
  is a default policy, not a guarantee — run `node bin/studio.mjs scan <file>` (exit code 4 when a
  credential is found) on any file you intend to publish.
- **Do not capture authenticated sessions you cannot store.** Raw bytes land unencrypted in the
  data directory. Use a dedicated Chrome profile (`studio launch`) with its own sign-ins, and only
  capture sites you are authorized to use.
- **Private content.** Captures are private transcripts. Do not commit them; the data directory is
  outside the repository by default.

## 3. Step-by-step

> **Automated first pass (run these before the manual steps):**
>
> ```powershell
> node bin/studio.mjs selftest            # preflight: imports, data dir, Chrome, Studio API (add --json)
> node scripts/live-e2e.mjs               # full loop against a local fixture site (add --no-browser to skip Chrome)
> node scripts/human-check.mjs            # typing harness on a local file:// fixture (add --json)
> ```
>
> `selftest` exits 0 when every required check passes; the `cdp-endpoint` check is informational and
> fails when no capture browser is running on the CDP port. `live-e2e` isolates its data directory
> (`CAPTURE_STUDIO_HOME` under the temp folder) and writes `live-e2e-result.json` there.
>
> `human-check` writes a data-only fixture page into the OS temp directory, opens it as a `file://`
> tab, types a sentence into a plain input and into a `contenteditable`, and checks nine properties
> of the typing: one insert per character, the exact text in both fields, one key sequence per
> character, no key gap under 15 ms, `navigator.webdriver === false`, focus present, and a user
> agent without `HeadlessChrome`. It touches no website. Exit 0 = all nine pass, 1 = a check failed,
> 2 = no DevTools endpoint on the port or the module is missing. A failure means the interaction
> layer changed behaviour — do not drive a real site until it passes again; see
> [HUMAN-INTERACTION.md](HUMAN-INTERACTION.md).
>
> Then look at what the driver *would* do, before spending an account on it:
>
> ```powershell
> node bin/studio.mjs drive chatgpt --dry-run     # resolved adapter, target URL, prompt, limits
> node bin/studio.mjs campaign                    # plan only: the nine sites in order, no interaction
> ```
>
> The steps below repeat the same flow by hand against a real site. `drive` and
> `campaign --execute` are the automated equivalents (drive, derive, build the site family) and are
> documented in [HUMAN-INTERACTION.md](HUMAN-INTERACTION.md).

### Step 0 — Environment pre-check

```powershell
node bin/studio.mjs doctor
```

**Expected:** exit code 0 and an `ok` report for `node`, `chrome`, `data-dir`, `sessions`,
`learner`, `config`; a `warn` for `devtools` is normal before the capture browser is running.

```powershell
node bin/studio.mjs doctor --json      # machine-readable form — keep this as the failure receipt
node --test "test/unit/**/*.test.mjs"  # unit tests, no browser needed
```

**Expected (tests):** all tests pass.

**If it fails:** capture the full stderr plus `node bin/studio.mjs doctor --json` output.
`doctor --fix` prints the suggested fix for every non-ok check.

### Step 1 — Launch the capture browser (Chrome + CDP)

```powershell
node bin/studio.mjs launch
node bin/studio.mjs targets
```

**Expected:** a separate Chrome window using its own profile; `targets` lists the tabs that can be
recorded (empty is fine before you open a page). Sign in to the site **inside that window** — the
profile persists between runs.

**If it fails:** capture stderr and `doctor --json` (the `chrome` check prints the detected binary
and the `devtools` check prints the expected endpoint, default `127.0.0.1:9222`).

### Step 2 — Live capture

```powershell
node bin/studio.mjs capture https://example.com --live --tabs all --follow
```

**Expected:** live decoded text/events streamed to stdout, then a result row with the new session
id. The page is reloaded once after attaching so connections opened during load are observed.
Stop early with `--duration <SECONDS>`; `--idle <SECONDS>` and `--timeout <SECONDS>` bound the run.

**If it fails:** capture stderr and `doctor --json`. Re-run with `--json` to separate progress
output from data.

### Step 3 — Derive

```powershell
node bin/studio.mjs derive latest --full
node bin/studio.mjs derive --missing --json
```

**Expected:** datasets, shapes, model, graph and the metadata receipt are rebuilt from the raw log
(`--full` forces every stage instead of reusing incremental artifacts); `--missing` covers every
saved session without a complete receipt.

**If it fails:** capture stderr and `doctor --json`.

### Step 4 — Search the derived corpus

```powershell
node bin/studio.mjs kb search example
node bin/studio.mjs kb search example --site example.com --layers entities,dom --json
```

(`kb` is the alias for `knowledge`; `studio help knowledge search` lists all options.)

**Expected:** a ranked table of hits with their source layer.

**If it fails:** capture stderr and `doctor --json`; confirm the session actually derived in
Step 3 (`node bin/studio.mjs session show latest`).

### Step 5 — Replay mirror

```powershell
node bin/studio.mjs mirror routes latest
node bin/studio.mjs mirror serve latest --port 8787
```

**Expected:** `mirror routes` lists the recorded routes; `mirror serve` binds a loopback HTTP server
and prints the URL. Open the printed URL (or a listed route path) in a browser and confirm the
captured response is replayed. Add `--speed 4`, `--instant` or `--synthesize` to change playback.
Press `Ctrl+C` to stop the server.

**If it fails:** capture stderr and `doctor --json`. Verify the port is free — `--port 0` selects a
free port automatically.

### Step 6 — Export

```powershell
node bin/studio.mjs export dataset latest --dataset events --format jsonl --out events.jsonl
node bin/studio.mjs export transcript latest --out transcript.md
node bin/studio.mjs export schemas latest --out schemas.json
node bin/studio.mjs export report latest --out report.html
```

**Expected:** each command writes its file (default output folder is
`<data-dir>/exports/<session>`; `-` writes to stdout). `export schemas` emits a draft-2020-12 JSON
Schema bundle; `export report` emits a single-file HTML report.

**If it fails:** capture stderr and `doctor --json`.

### Step 7 — Integrity verification

```powershell
node bin/studio.mjs integrity build latest
node bin/studio.mjs integrity verify latest
```

**Expected:** `integrity verify` exits 0 when the directory matches its `MANIFEST.json`; it exits 4
when it does not. `integrity verify ./some-dir --json` verifies any directory, not only a session.

**If it fails:** capture stderr, the exit code and `doctor --json`.

### Step 8 — Studio web UI (`/live/view` and `/platform`)

```powershell
node bin/studio.mjs start
```

**Expected:** the capture browser opens and the studio UI starts; a **tokenized URL** is printed.
Open it in the browser, then visit:

- `http://127.0.0.1:7878/live/view` — the minimal live text viewer (SSE of live-tap events).
- `http://127.0.0.1:7878/platform` — the platform page.

The UI is also reachable through the versioned API (`GET /api/v1/...`), and the optional
`/api/x/*` routes (`/api/x/stats`, `/api/x/registry`, `/api/x/autodetect`, `/api/x/csv`,
`/api/x/bench`, `/api/x/graph/{id}`, `/api/x/dedupe/{id}`, `/api/x/keyphrases/{id}`).

Use `node bin/studio.mjs serve` to run the UI only, without opening the capture browser.

**If it fails:** capture the browser console, stderr and `doctor --json`. Confirm the tokenized URL
was used (the cookie exchange must happen first).

### Step 9 — Read-only analysis commands (optional extra)

```powershell
node bin/studio.mjs detect events.jsonl --json
node bin/studio.mjs scan events.jsonl
node bin/studio.mjs csv events.csv
node bin/studio.mjs dedupe latest --threshold 0.8 --json
node bin/studio.mjs kb graph-stats latest
node bin/studio.mjs kb keyphrases latest --limit 10
node bin/studio.mjs platform stats
node bin/studio.mjs platform registry
```

**Expected:** each command prints its analysis; `scan` exits 4 if a credential is found
(exit 0 otherwise), `detect`/`csv` summarise the input, `dedupe` lists duplicate or near-duplicate
records, `graph-stats` prints PageRank/community statistics, `keyphrases` prints ranked phrases.

**If it fails:** capture stderr and `doctor --json`.

### Step 10 — MCP stdio server (optional extra)

```powershell
node src/mcp/server-stdio.mjs
```

**Expected:** the server logs `stdio server ready` on **stderr** and speaks newline-delimited
JSON-RPC 2.0 on **stdout** (`initialize`, `tools/list`, `tools/call`, `resources/list`,
`resources/read`). Stdout must contain JSON-RPC only — never redirect it to a file that also
receives logs.

## 4. Results checklist

| # | Step | Command | Expected | Result | Failure receipt captured |
| --- | --- | --- | --- | --- | --- |
| 0 | Environment | `studio doctor` | exit 0, node/chrome ok | ☐ pass ☐ fail | ☐ |
| 0b | Unit tests | `node --test "test/unit/**/*.test.mjs"` | all pass | ☐ pass ☐ fail | ☐ |
| 1 | Capture browser | `studio launch` + `studio targets` | Chrome window; tabs listed | ☐ pass ☐ fail | ☐ |
| 2 | Live capture | `studio capture <url> --live --tabs all --follow` | live text + session id | ☐ pass ☐ fail | ☐ |
| 3 | Derive | `studio derive latest --full` | datasets/model/graph/receipt rebuilt | ☐ pass ☐ fail | ☐ |
| 4 | Search | `studio kb search <term>` | ranked hits | ☐ pass ☐ fail | ☐ |
| 5 | Mirror | `studio mirror routes latest` + `mirror serve latest` | routes listed; replay serves in browser | ☐ pass ☐ fail | ☐ |
| 6 | Export | `studio export dataset/report/schemas/transcript` | files written | ☐ pass ☐ fail | ☐ |
| 7 | Integrity | `studio integrity build latest` + `verify latest` | exit 0 | ☐ pass ☐ fail | ☐ |
| 8 | Studio UI | `studio start` → `/live/view`, `/platform` | both pages render | ☐ pass ☐ fail | ☐ |
| 9 | Analysis | `detect`/`scan`/`csv`/`dedupe`/`graph-stats`/`keyphrases`/`platform stats` | each prints analysis | ☐ pass ☐ fail | ☐ |
| 10 | MCP | `node src/mcp/server-stdio.mjs` | `stdio server ready` on stderr | ☐ pass ☐ fail | ☐ |

**For every failed step, attach:** the exact command, the full stderr, the exit code, and
`node bin/studio.mjs doctor --json`.

## 5. Cleanup

```powershell
node bin/studio.mjs session list
node bin/studio.mjs session delete <id> --yes
node bin/studio.mjs session prune --older-than 7d --keep 5 --yes
```

Bulk prune is a dry run without `--yes`. Raw capture bytes stay in the data directory until the
session is deleted.
