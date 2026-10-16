# ZCODE-PATH — minimal path: Phone PWA + AION + BFF → ZCode on Owen's Windows PC
Author: AION BFF · 2026-10-16 02:30 (Paris) · Status: UPDATED 2026-10-16 02:35 Paris with PC facts + Linux work done

## 0. Verified state (2026-10-16 02:20 Paris, reported from PC DESKTOP-9KB03LU)
- Tailscale installed + up on PC (100.118.170.70, tailnet user owservera@). Phone oppo-cph2577 (100.110.245.9) on tailnet, offline 2d. → Step 1 DONE.
- ZCode hub LISTENING 0.0.0.0:8377; token file present. pocket-link :8392 NOT running (not needed for P1: PWA + BFF talk to hub directly).
- BFF box: tailscaled running (userspace, SOCKS5 localhost:1055, state /var/lib/tailscale); `tailscale up --hostname=aion-bff` awaiting Owen's login approval.
- Built: `bff/zcode/{acp-core.mjs,mock-hub.mjs,zcode-driver.mjs,zcode-driver.test.mjs}` (5/5 pass); PWA P1 in zcode-pocket/web working tree (uncommitted; selftest + 4/4 mock-hub tests pass).
- Revised Windows step 3/4: only `tailscale serve --bg --https=443 --set-path /hub http://127.0.0.1:8377` (hub already up; HTTPS certs must be enabled in tailnet admin). Hub binds 0.0.0.0 → restrict via Windows firewall/tailnet ACL later.
- Revised Owen involvement: (1) approve aion-bff login URL, (2) enable HTTPS certs + run the one `tailscale serve` line, (3) open Tailscale on phone, enter hub URL + token in PWA once.

## 1. What already exists (verified from source, not from live probes)
| Piece | Where | Facts |
|---|---|---|
| ZCode ACP hub | npm `zcode-acp-server` 0.65.x (github william0wang/zcode-acp), node>=22 | REST + WS on Windows `127.0.0.1:8377` (pocket-link default `POCKET_LINK_HUB_PORT`). Bearer token at `%USERPROFILE%\.config\zcode-acp\token` (48 chars). REST: `/api/health` (no auth), `/api/instances[?probe=1]`, `POST /api/instances {workspacePath[,sessionId]}` → instance id, `/api/projects`, `/api/projects/sessions`, `/api/settings/agents`, `/api/quota`. ACP JSON-RPC over WS `/acp?instance=<id>` (one msg per frame): `initialize` → `session/new` → `session/prompt`, streamed `session/update`, server→client permission requests. (Kotlin ref: zcode-pocket `HubApi.kt`, `AcpClient.kt`) |
| Hub env blockers (Windows) | zcode-setup `research/findings/020…`, `playbook/toolkit/zcode-acp/README.md` | Needs `ZCODE_BIN` (C:\Program Files\ZCode\resources\glm\…), `ZCODE_NODE` (real node.exe), `ZCODE_PROVIDER`/`ZCODE_MODEL` (default zai-coding-plan → 401; grok-build-oauth / openrouter / claude-code-oauth proven). `acp-check.mjs` = real-turn proof. |
| pocket-link | zcode-setup `playbook/toolkit/pocket-link/` (server.mjs, launcher.ps1, acceptance.mjs) | Node HTTP on `0.0.0.0:8392`, same bearer as hub (header or `?token=`), CORS `*`. Wraps hub. `POST /api/sessions/send {sessionId,text}` (accepted≠acted), `/api/pane`, `/api/sessions`, audited to `.logs/pocket-link-audit.jsonl`. `launcher.ps1 start|status|install-login`. Refuses to start without token file. |
| PWA P0 | zcode-pocket `web/` → https://zcode-pocket-p0.vercel.app | Pure shell: "no hub transport, secret, send". Must add transport in P1. |
| ZBot MCP bridge | zcode-bots PR #1 (open draft) | stdio MCP, diagnostic-only (`aion_ping`, `zbot_capabilities`, opt-in `zbot_doctor`). No prompt execution. Not a coding path; it's the receipt/safety boundary. |
| Dispatch | 001.PROJECTS.PM Issue #20 (`bridge.request.v1`, review-only, `requires_local_approval`) | PUBLISHED only; no local watcher exists → no receipt. |

## 2. Hard constraints that shape the path
1. **Mixed content**: the Vercel PWA is HTTPS; browsers block `fetch`/`ws` to `http://100.x.y.z:8392`. → The PC must expose **HTTPS on the tailnet**: `tailscale serve` (auto TLS cert on `https://<pc>.<tailnet>.ts.net`). This is the single cleanest fix; no public port, no Funnel.
2. **ChatGPT (AION) cannot join a tailnet** and must not hold the full-control token. → AION drives via **GitHub (repo/issues) → BFF**, BFF holds the tailnet session and executes. (Remote MCP from ChatGPT = later, after PR #1 review + security gate.)
3. **One token = full control** (hub = pocket-link token). Acceptable for P1 only if: tailnet-only, token entered by Owen in PWA Settings (localStorage, never in JS/Git/Vercel env), BFF copy stored 0600 outside the git-tracked tree. Scoped token = follow-up.
4. Tailnet ACL must restrict BFF node to `pc:443` only.

## 3. What must run on Windows (the whole list)
- Tailscale client (signed in to Owen's tailnet).
- zcode-acp hub on 127.0.0.1:8377 with ZCODE_BIN/ZCODE_NODE/ZCODE_PROVIDER/ZCODE_MODEL set, token file present.
- pocket-link on :8392 (`launcher.ps1 start`, optionally `install-login`).
- `tailscale serve` mapping: `https://<pc>.ts.net/` → `http://127.0.0.1:8392`, and `/acp` (+ hub `/api/instances`, `/api/projects*`) → `http://127.0.0.1:8377`. (Simplest: serve path `/hub/` → 8377, root → 8392.)
Nothing else. No inbound firewall rule, no public exposure.

## 4. Steps
| # | WHAT | HOW | WHEN | OWNER | PROOF |
|---|---|---|---|---|---|
| 0 | Linux-side prep (no approval needed) | Run hub locally on BFF box with a fixture/`openrouter` provider OR mock hub matching HubApi/AcpClient contract; build PWA P1 transport (`web/main.js`: Settings URL+token, `/api/health`, instances, WS `/acp` `session/prompt` streaming, cancel, honest "Connected"=authed health); run `pocket-link/acceptance.mjs` vs local stack; run PR #1 `node --test`. Write `bff/zcode-driver.mjs` (CLI: create instance → prompt → stream → transcript). | Now | BFF | Tests green; commit SHAs; PWA preview sends a turn to local mock/hub on Linux |
| 1 | **Tailscale on PC + phone** | Owen installs Tailscale on Windows + Android, signs in same account | Owen's next PC moment (~5 min) | **Owen** | Both devices listed in admin console |
| 2 | BFF joins tailnet | Owen creates a one-time tagged auth key (`tag:bff`) via admin console secure flow, or approves BFF node login URL BFF sends him; BFF runs `tailscaled --tun=userspace-networking`. ACL: `tag:bff → <pc>:443` only | With step 1 | Owen approves (1 click); BFF executes | `tailscale status` on BFF shows PC; `curl https://<pc>.ts.net/api/health` once step 4 done |
| 3 | Hub + pocket-link live on Windows | One PowerShell block BFF prepares (from zcode-setup toolkit): set env, start hub, `pocket-link\launcher.ps1 start`, `acp-check.mjs --provider grok-build-oauth --expect 391`. Owen runs it in ZCode/PowerShell (or ZCode's own agent runs it on his say-so) | Same session as step 1 | Owen runs (paste-free: `git pull` zcode-setup + one script) | acp-check green line; `launcher.ps1 status` health ok |
| 4 | HTTPS on tailnet | `tailscale serve --bg --https=443 http://127.0.0.1:8392` and `tailscale serve --bg --https=443 --set-path /hub http://127.0.0.1:8377` (HTTPS certs must be enabled in admin console) | Same session | Owen (part of step-3 script) | `https://<pc>.ts.net/api/health` → ok from phone browser |
| 5 | PWA P1 Send live | Deploy P1 transport build (BUILD/CACHE bump) to Vercel; Owen enters `https://<pc>.ts.net` + token in Settings once (token read on PC, typed/QR'd on phone — never sent through chat) | After 0 & 4 | BFF deploy (needs go from AION/Owen); Owen enters token | One real turn: message → server-accepted id → streamed reply → transcript row in hub; logged in flight recorder |
| 6 | BFF drives ZCode | `bff/zcode-driver.mjs --hub https://<pc>.ts.net/hub --workspace C:\…\repo --prompt …`; token at `~/.config/aion-bff/zcode-token` (0600, gitignored) | After 2 & 4 | BFF | Created instance id, streamed reply, file change visible in PC repo commit |
| 7 | AION drives ZCode | AION writes orders as issues/files in owenservera/aion (label `zcode:task`); BFF watcher (authenticated, dedupe by issue+digest, allowlisted workspaces) relays to step-6 driver and posts results back as issue comment. Permission prompts → surface to Owen's PWA, never auto-allow (no `yolo`) | After 6 | AION authors; BFF relays | Issue → instance id → reply comment chain, correlation id in recorder |
| 8 | Later (not minimal) | Scoped token per client; ZBot MCP (PR #1) behind authenticated relay for ChatGPT direct; Issue #20 receipt watcher on Windows | After P1 proven | AION/BFF | Security review |

## 5. Owen's total involvement (minimized)
One PC session (~15 min): install Tailscale (PC + phone), enable HTTPS certs + approve BFF node, run one prepared script (hub + pocket-link + serve + acp-check), type the token into the PWA once. Everything else is BFF/AION.

## 6. Open unknowns (must verify, not assume)
- Whether hub/pocket-link are already installed & running on the PC today (docs are historical).
- Exact hub route prefix for WS through `tailscale serve` set-path (verify hub tolerates `/hub` prefix; else use a second port `--https=8443`).
- Which provider currently works on the PC (grok-build-oauth was proven 2026-10-07).
- `?token=` on WS URL for browser (browsers can't set WS headers) — confirm hub accepts query token; pocket-link does.

## 7. Live findings 2026-10-16 02:30 Paris (BFF via tailnet + SOCKS)
- Hub reachable at `https://desktop-9kb03lu.taild7271a.ts.net/hub` — `/api/health` ok, `/api/instances` `[]` (no bridge running), `/api/projects` lists 19 registered workspaces. The `/hub` prefix works for REST.
- `POST /api/instances` with an unregistered dir → 403 `unknown project` (only registered ZCode projects are accepted; temp dirs are not).
- `POST /api/instances {workspacePath:"C:\0-BlackBoxProject-0\001.PROJECTS.PM"}` → 502 from tailscale serve; the hub dropped for ~5 s, then health was ok again and instances was still `[]`. **The hub crashes or restarts when it spawns a bridge.** WS `/acp` is untested (no instance yet).
- Diagnose on the PC: newest `playbook\toolkit\zcode-pocket\.logs\hub-*.err.log` / `serve-*.err.log` (zcode-setup checkout), then `powershell -File playbook\toolkit\zcode-pocket\launcher.ps1 status`. Likely culprits: ZCODE_BIN/ZCODE_NODE/ZCODE_PROVIDER env not present in the hub process if the hub was started outside launcher.ps1.
- Driver now: SOCKS5 (`ZCODE_SOCKS=localhost:1055`) for REST + WS; it polls until the new instance registers (≤30 s) before `/acp`.
