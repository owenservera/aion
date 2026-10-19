# AION Box Readiness (aion-bff-1)

Last run: 2026-10-16 03:40 CEST. Re-run: `/workspace/aion/ops/box-readiness.sh` (idempotent; never restarts autopush, never starts a Tailscale login, never prints secrets).

Node tooling: /home/box/aion-tools (playwright 1.64.1 + chromium, chrome-remote-interface 0.34.0, puppeteer-core 25.14.0). Desktop Chrome 154 exposes CDP at localhost:9244/9245; otherwise launch with --remote-debugging-port=9222.

Notes: Node v20 is maintenance LTS; tailscale to PC is via DERP (mad, ~200ms), no direct connection.

```
PASS  git log: 8aa0193 2026-10-16 03:37:17 +0200
PASS  gh auth owenservera
PASS  autopush loop running
PASS  tailscale ping desktop-9kb03lu
PASS  token file 0600/48B
PASS  node v20.19.2
PASS  npm 9.2.0
PASS  pnpm 10.34.6
PASS  bun 1.4.2
PASS  python3 Python 3.13.5
PASS  uv uv 0.12.23 (x86_64-unknown-linux-gnu)
PASS  sqlite3 3.46.1 2024-08-13 09:16:08 c9c2ab54ba1f5f46360f1b4f35d849cd3f080e6fc2b6c60e91b16c63f69aalt1 (64-bit)
PASS  jq jq-1.7
PASS  curl curl 8.14.1 (x86_64-pc-linux-gnu) libcurl/8.14.1 OpenSSL/3.5.7 zlib/1.3.1 brotli/1.1.0 zstd/1.5.7 libidn2/2.3.8 libpsl/0.21.2 libssh2/1.11.1 nghttp2/1.64.0 nghttp3/1.8.0 librtmp/2.3 OpenLDAP/2.6.10
PASS  websocat websocat 1.14.1
PASS  playwright chromium smoke: Example Domain
PASS  CDP libs (chrome-remote-interface, puppeteer-core)
PASS  desktop Chrome CDP on :9244
SUMMARY pass=18 fail=0
```

## OpenCode CLI
- Installed via official script (`curl -fsSL https://opencode.ai/install | bash`) at `/home/box/.opencode/bin/opencode`; PATH set in `~/.bashrc` and `~/.profile`.
- Version 1.19.1 (2026-10-16). `box-readiness.sh` checks presence + version.
- Free OpenCode-provider models work without login. Current set (2026-10-19): `opencode/deepseek-v4.1-flash-free` (orchestration/reasoning), `opencode/minimax-m3.1-flash-free` (agentic implementation, failover default), `opencode/mimo-v2.6-flash-free` (mechanical work), plus `glm-5.3-flash-free`, `beam-free`, `nemotron-3.5-super-vl-free`, `longcat-2.5-preview-free`. **`opencode/space-bunny-free` is retired** (no longer in the catalog). Full list: `opencode models | grep free`.
- Smoke: `$null | opencode run -m opencode/minimax-m3.1-flash-free "Reply with exactly: OPENCODE_OK"` → `OPENCODE_OK` (verified on Windows 2026-10-19T12:52:38Z). On Linux redirect stdin from `/dev/null` in non-interactive shells or `run` hangs waiting on stdin.
- Playbook: `workspace/aion/ops/OPENCODE-FREE-MODEL-PLAYBOOK.md`.
