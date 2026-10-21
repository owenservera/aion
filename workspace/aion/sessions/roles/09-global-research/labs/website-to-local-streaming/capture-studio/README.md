# Capture Studio

Local, read-only capture studio for websites you are authorized to use. It attaches to a tab in a
**dedicated Chrome profile** over the Chrome DevTools Protocol, records what the browser actually
received (raw bytes, decoded protocol events, rendered DOM, your actions) into an append-only log on
your own disk, and then derives datasets, a data model, a temporal evidence graph and a metadata
receipt from that log.

Nothing is uploaded. There is no server, no account, no telemetry and no runtime dependency outside
Node.js itself. Captured data is private and lives **outside the repository** by default.

- Design principles, capability matrix and roadmap: [`ARCHITECTURE.md`](ARCHITECTURE.md) (root) and
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (module map and data flow).
- Review findings and worklog: [`ASSESSMENT-AND-WORKLOG.md`](ASSESSMENT-AND-WORKLOG.md).

## What it is

Three capture layers, kept separate on disk and recomputable from each other:

| Layer | What it is | Where it lands |
| --- | --- | --- |
| **L1 raw** | Byte-exact chunks, WebSocket frames, DOM batches, actions, gaps | `sessions/<id>/raw/*.jsonl` |
| **L2 events** | Decoded protocol envelopes (SSE, NDJSON, JSON, WebSocket, delta patches) | `sessions/<id>/datasets/events.jsonl` |
| **L3 rendered** | Visible text blocks, conversation turns, accessibility snapshot | `sessions/<id>/kv/DOM_*` |

Design rules that are enforced in code:

- **Read-only.** It uses `Network.*` plus an isolated-world DOM agent. It never intercepts with
  `Fetch`, never reads typed form values, never automates the page.
- **Honest coverage.** Gaps, pauses, masked spans, metadata-only streams and pre-attach blind spots
  are declared in the log and in the receipt, never hidden.
- **Credentials never reach disk.** Cookie and auth headers are dropped, auth endpoints are
  metadata-only, in-body tokens are masked in place and every mask is recorded on its chunk.
- **Raw is immutable.** Every derived artifact can be rebuilt from the raw log with `derive`.

## Requirements

- **Node.js >= 22** (the built-in `WebSocket` client is required). No `npm install` step — there are
  no runtime dependencies.
- **Google Chrome** (or Edge) for the capture browser. Auto-detected; override with `CHROME_PATH`.
- Windows, macOS or Linux. The tool is Windows-first but platform-neutral in code.

## Quick start

```powershell
cd <capture-studio>

node bin/studio.mjs doctor          # check Node, Chrome, DevTools, data folder, learner, profiles
node bin/studio.mjs start           # open the capture browser + the studio UI (prints a tokenized URL)
```

`start` launches a **separate Chrome profile** (its own window, its own sign-ins) with DevTools
bound to loopback only, then starts the local studio web UI. Sign in to the sites you want to
capture inside that window — the profile persists between runs.

Then, in another terminal:

```powershell
node bin/studio.mjs targets                       # list tabs that can be recorded
node bin/studio.mjs record --target claude.ai --duration 60
node bin/studio.mjs sessions                      # list saved recordings
node bin/studio.mjs receipt latest                # metadata-only receipt, safe to paste into an issue
node bin/studio.mjs shapes latest                 # profile suggestions inferred from the session
```

One-shot capture of a URL (opens a tab, records until the network goes quiet, derives, exports):

```powershell
node bin/studio.mjs capture https://example.com --export report,transcript
```

### Useful flags

| Flag | Meaning |
| --- | --- |
| `--data-dir <DIR>` | Where sessions, profiles and learner state live. Env: `CAPTURE_STUDIO_HOME`. |
| `--port <N>` | Chrome DevTools port. Env: `CAPTURE_STUDIO_CDP_PORT`, default `9222`. |
| `--json` | Machine-readable JSON on stdout; progress and errors go to stderr. |
| `--quiet` / `-q` | Suppress progress and decoration. |
| `--no-color` | Disable colored output (`NO_COLOR` is honored). |
| `--verbose` / `-v` | Show stack traces on errors. |
| `-h`, `--help` | Help for the command. `-V`, `--version` prints version + collector source hash. |

Persistent defaults live in `<data-dir>/config.json` and are resolved
**flags > environment > config file > defaults** (`studio config show` prints the effective values
and where each one comes from). Settings: `cdpPort`, `studioPort`, `exportFormat`, `defaultProfile`,
`maxMb`, `color`, `json`, `autoDerive`.

Exit codes are stable: `0` ok · `1` error · `2` usage · `3` not found · `4` integrity/state conflict ·
`5` environment (Chrome/Node) or a capability that is not in this build.

Session references accepted anywhere a session is expected: a full id, a unique id prefix or
suffix, `latest`, `latest~2` (third newest), `latest:claude.ai` (newest for that site).

## CLI command overview

`studio help` prints the live list; `studio help <command>` prints options and examples;
`studio commands --json` dumps every command machine-readably. Grouped by area:

### Get started
| Command | Purpose |
| --- | --- |
| `help [command]` | Command list, or options and examples for one command. |
| `doctor [--fix]` | Check Node, Chrome, DevTools, data folder, sessions, profiles, learner, config. |
| `start` | Open the capture browser and the studio UI (first-run friendly). |
| `serve` | Run the studio UI only. |

### Capture
| Command | Purpose |
| --- | --- |
| `launch [--url URL]` | Open the dedicated capture browser (loopback DevTools only). |
| `targets [--filter TEXT]` | List tabs in the capture browser that can be recorded. |
| `record [--target TAB] [--duration S] [--live --tabs all --follow]` | Record from the terminal; Ctrl+C stops, saves and derives. |
| `capture <url...>` | One shot: open the page, record until idle, derive and export. |

### Sessions
| Command | Purpose |
| --- | --- |
| `session list` (`sessions`) | List saved recordings, newest first. |
| `session show` | Everything about one session at a glance. |
| `session stats` · `session reindex` · `session compact` | Stream statistics, rebuild the raw seek index, compact the raw log. |
| `session datasets` · `session streams` · `session timeline` · `session events` | Inspect what was derived. |
| `session delete <id...> --yes` · `session prune --older-than 30d [--keep N] --yes` | Delete sessions (bulk prune is a dry run without `--yes`). |
| `verify [id]` | Integrity check: hashes, sequence accounting, declared gaps. |
| `receipt [id]` | Metadata-only lab receipt. |
| `shapes [id]` | Profile suggestions inferred from a session. |

### Replay and derive
| Command | Purpose |
| --- | --- |
| `derive [id] [--all\|--missing]` | Rebuild datasets, shapes, knowledge and the receipt from raw. |
| `replay [id] [--stream SID \| --at TIME \| --bytes]` | Replay a stream with its original timing, or time-travel to a moment. |
| `mirror serve [id]` · `mirror routes [id]` | Serve a saved session as a local HTTP mirror, or list its routes. |

### Export
| Command | Purpose |
| --- | --- |
| `export dataset [id] --dataset NAME [--format F] [--out FILE]` | One dataset as JSON, NDJSON, CSV, TSV, Markdown or HTML. |
| `export transcript` · `export knowledge` · `export graph` | Readable transcript, model+entities+graph artifact, graph in JSON/DOT/Mermaid/GraphML. |
| `export report` · `export bundle` · `export schemas` · `export graph-ranked` | Single-file HTML report, portable folder, JSON Schema bundle, confidence-ranked graph. |
| `export formats` | Which formats each export supports. |

### Knowledge
| Command | Purpose |
| --- | --- |
| `knowledge status` · `knowledge sites` | Derivation state per session; sites and origins you have captured. |
| `knowledge types` (`model`) | The discovered data model: types, keys, fields, relationships. |
| `knowledge entities` · `knowledge entity <eid>` | Keyed entities; one entity with revision history and neighbours. |
| `knowledge graph` · `knowledge at --t TIME` | Temporal evidence graph, and its state at a moment. |
| `knowledge hypotheses` | Rendered-as and action-to-stream correlation hypotheses. |
| `knowledge query <term…>` | Filter entities across sessions (`type=Message role=assistant text~hello observations>3`). |
| `knowledge search <text…>` | Ranked search over the derived session corpus. |
| `knowledge schema <type>` | Observed schema for one type. |
| `knowledge continuity` | Join safely keyed entities across sessions of the same origin. |

### Learning
| Command | Purpose |
| --- | --- |
| `learn status` · `learn corrections` · `learn proposals` · `learn audit` | Learner revision, scoped models, what it has been taught, pending proposals, audit trail. |
| `learn calibration` · `learn versions` · `learn promotions` | Per-kind calibration and ECE, immutable revisions, cross-site promotion candidates. |
| `learn roles` · `learn predict` | The role/scope vocabulary; what role the learner would assign to a field and why. |
| `learn propose` · `learn teach` · `learn review` | Propose a correction for review, apply one immediately, accept/reject a proposal. |
| `learn revert` · `learn rollback` | Undo an accepted correction; restore an earlier learner revision. |

### Profiles and families
| Command | Purpose |
| --- | --- |
| `profile list` · `profile show` · `profile versions` · `profile diff` | Inspect site profiles, their version history and what changed. |
| `profile rollback` · `profile apply` | Make an earlier version current; accept/reject an inferred suggestion into a new version. |
| `profile new` · `profile clone` · `profile set` · `profile hosts` | Author and edit a profile. |
| `profile match <url>` · `profile lint` | Which profile a URL would use and why; check profiles for invalid or risky settings. |
| `profile export` · `profile import` · `profile op` | Portable JSON profile files; apply a semantic model operation. |
| `family list` · `family show` · `family new` · `family records` · `family detect` | Provider families: shared data models many sites map into. |

### System
| Command | Purpose |
| --- | --- |
| `version` | Version and collector source hash. |
| `paths` | Print the data folder layout. |
| `config show` · `config get/set/unset` · `config path` | Persistent defaults in `<data-dir>/config.json`. |
| `completion <bash\|zsh\|pwsh>` | Print a shell completion script. |
| `commands` | List every command (machine-readable with `--json`). |

## Studio web UI and the `/api/v1` API

`studio start` / `studio serve` runs a loopback-only web UI on `127.0.0.1:7878` (override with
`--studio-port` or `CAPTURE_STUDIO_PORT`). It prints a **tokenized URL**; opening it exchanges the
token for an `HttpOnly`, `SameSite=Strict` cookie. Requests must carry that cookie or an
`x-studio-token` header, and the `Host`/`Origin` headers must match `127.0.0.1:<port>` or
`localhost:<port>` — this is what defeats DNS rebinding and cross-site requests. The server refuses
any non-loopback bind.

`GET /api/v1/openapi.json` returns an OpenAPI 3.1 description of the versioned routes.

### Route families

| Family | Routes |
| --- | --- |
| Health / capability | `GET /health`, `GET /integrations`, `GET /openapi.json`, `GET /integrations/tools`, `POST /integrations/tools/call` |
| Sessions | `GET /sessions`, `GET /sessions/{id}`, `GET /sessions/{id}/datasets`, `GET /sessions/{id}/datasets/{dataset}`, `GET /sessions/{id}/receipt`, `POST /sessions/{id}/derive` |
| Replay | `GET /sessions/{id}/replay/records`, `.../replay/state`, `.../replay/streams/{sid}`, `.../replay/events` |
| Knowledge | `GET /sessions/{id}/knowledge`, `.../knowledge/entities`, `.../knowledge/entities/{eid}`, `.../knowledge/graph`, `.../knowledge/neighbors/{eid}`, `.../knowledge/continuity` |
| Learning | `GET /learning`, `POST /learning/predict`, `GET /learning/{proposals,corrections,audit,versions,promotions}`, `POST /learning/proposals`, `POST /learning/proposals/{id}/review`, `POST /learning/corrections/{id}/revert`, `POST /learning/rollback`, `POST /learning/calibration`, `GET /sessions/{id}/learning/questions` |
| Event stream | `GET /events` — resumable SSE (supports `Last-Event-ID` / `after` cursors, heartbeat, gap reset) |
| Live capture | `GET /live` — SSE of live-tap events; `GET /live/view` — minimal live text viewer |
| Webhooks | `GET /integrations/webhooks`, `POST /integrations/webhooks`, `GET /integrations/webhooks/{id}/deliveries`, `DELETE /integrations/webhooks/{id}` |
| Optional capabilities | `POST /sessions/{id}/derive-all`, `GET /sessions/{id}/{artifacts,schemas,graph/ranked,timelines}`, `GET /search`, `GET/POST/DELETE /mirrors…` |

Notes on the optional capabilities:

- **Optional means optional.** Each backend module is imported on demand. If the module or the
  required export is not in the build, the endpoint answers **HTTP 501 `CAPABILITY_UNAVAILABLE`**
  and everything else keeps working. In the current tree the live-tap backend
  (`src/capture/live-tap.mjs`) is present; the full-derivation backend (`src/replay/derive-all.mjs`)
  and the mirror entry point (`src/mirror/index.mjs`) are not, so `derive-all`, `artifacts`,
  `schemas`, `graph/ranked`, `timelines`, `search` and the mirror routes currently return 501, and
  the CLI commands that depend on them (`studio derive`, `studio mirror …`, `studio knowledge
  search`, `studio export schemas`) exit with code 5. The in-tree derivation path
  (`src/replay/derive.mjs`) is used by `record --derive`, by the studio's `POST …/derive` and by
  `POST /api/record/stop`.
- **Tools endpoint.** `GET /integrations/tools` publishes an MCP-style manifest (JSON input
  schemas plus read-only/destructive annotations); `POST /integrations/tools/call` invokes a
  declared tool. It is a manifest and invocation adapter, not a full MCP transport.
- **Mirrors** are process-local, literal-loopback-only and capped at 8 concurrent instances. Studio
  authentication protects the *management* endpoints; the mirror backend itself serves captured
  replay data on the port it returns.
- **Webhooks** are loopback-only, process-lifetime subscriptions (max 16) with one delivery attempt
  and metadata-only payloads by default. Including captured preview data requires an explicit
  opt-in.

### Legacy UI routes

The studio UI also uses unversioned `/api/*` routes implemented in `src/studio/server.mjs`
(`/api/status`, `/api/targets`, `/api/chrome/launch`, `/api/record/start`, `/api/record/stop`,
`/api/live/*`, `/api/sessions/*`, `/api/search`, `/api/profiles/*`, `/api/families/*`,
`/api/preview`). They are not part of the versioned contract and are not described in the OpenAPI
document.

## Data directory layout

Default location: `%LOCALAPPDATA%\AION\capture-studio` on Windows,
`~/Library/Application Support/AION/capture-studio` on macOS,
`${XDG_DATA_HOME:-~/.local/share}/aion-capture-studio` elsewhere. Override with
`CAPTURE_STUDIO_HOME` or `--data-dir`. `studio paths` prints the resolved paths.

```
<data-dir>/
  config.json              persistent defaults (see `studio config`)
  sessions/                one directory per recording
  profiles/                site profiles, versioned
  families/                provider families, versioned
  learner/                 adaptive-learner state and revision history
  chrome-profile/          the dedicated Chrome profile used for capture
  exports/                 default output folder for `--export`
```

### One session

```
sessions/<session-id>/
  session.json             run metadata, status, transport and integrity summary
  raw/                     L1: append-only source of truth
    manifest.json          segments with byte counts, seq ranges and sha256
    NNNNNN.jsonl           append-only records, one JSON object per line
    NNNNNN.idx.jsonl       sparse seek index ({s: seq, o: byteOffset, t: wallTime})
    streams.json           per-stream locator (first/last seq, counts, bytes, segments)
  datasets/                L2: derived, append-only JSONL, always rebuildable
    events.jsonl           decoded protocol events
    streams.jsonl          observed streams and requests
    timeline.jsonl         actions, navigations, lifecycle and gaps over time
    records-<rule>.jsonl   records extracted by a profile record rule
    family-<family>-<entity>.jsonl  canonical records for a provider family
    entities.jsonl         resolved entities from the knowledge layer
  kv/                      L3 and derived state, named JSON values
    INPUT  PROFILE_SNAPSHOT  STATE  SHAPES  ASSEMBLED  RECEIPT
    DOM_BLOCKS  DOM_TURNS  DOM_INSPECT  CORPUS_STATS
    MODEL  GRAPH  HYPOTHESES  KNOWLEDGE_STATUS
```

The raw seek index and the stream locator are **derived data**: they can always be rebuilt
(`studio session reindex`) and their absence never blocks a read.

### Versioned stores

`profiles/<name>/` and `families/<name>/` each hold `v0001.json`, `v0002.json`, … — every save is a
new immutable version — plus a `CURRENT` file naming the active one. Rollback just moves the
pointer; history is kept.

### Learner state

`learner/learner.json` holds the current state with an integrity digest; `learner/history/rev-*.json`
holds every past revision; `learner/.learner-write-lock/` is the exclusive write lock. Writes use
optimistic concurrency: a caller supplies the revision it expects, and a mismatch is rejected
rather than silently overwritten.

## Running the tests

```powershell
node --test "test/unit/**/*.test.mjs"     # unit tests (no browser)
node --test "test/e2e/**/*.test.mjs"       # e2e tests (need Chrome)
node eval/run.mjs                          # intelligence evaluation
```

The e2e suite needs a Chrome binary; set `CHROME_PATH` if it is not auto-detected.
