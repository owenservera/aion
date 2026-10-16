#!/usr/bin/env bash
# Idempotent AION box readiness check/restore. Never prints secrets. Never restarts autopush.
set -u; P=0; F=0
ok(){ echo "PASS  $1"; P=$((P+1)); }; bad(){ echo "FAIL  $1"; F=$((F+1)); }
git config --global --get-all safe.directory | grep -qx / || git config --global --add safe.directory /
git -C / log -1 --format='%h %ci' >/tmp/.gl 2>&1 && ok "git log: $(cat /tmp/.gl)" || bad "git log"
gh auth status 2>&1 | grep -q 'account owenservera' && ok "gh auth owenservera" || bad "gh auth"
pgrep -f /usr/local/bin/aion-autopush-loop >/dev/null && ok "autopush loop running" || bad "autopush loop NOT running (not restarted by this script)"
if tailscale status >/dev/null 2>&1; then
  tailscale ping -c 2 --timeout 5s 100.118.170.70 2>&1 | grep -q pong && ok "tailscale ping desktop-9kb03lu" || bad "tailscale ping PC"
else bad "tailscale not up/logged in (manual login required)"; fi
T=/home/box/.zcode-token
[ -f $T ] && [ "$(stat -c %a $T)" = 600 ] && [ "$(stat -c %s $T)" = 48 ] && ok "token file 0600/48B" || bad "token file missing/wrong perms/size"
command -v sqlite3 >/dev/null || sudo apt-get install -y -qq sqlite3 >/dev/null 2>&1
command -v websocat >/dev/null || { sudo curl -fsSL -o /usr/local/bin/websocat https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-unknown-linux-musl && sudo chmod +x /usr/local/bin/websocat; }
for c in node npm pnpm bun python3 uv sqlite3 jq curl websocat; do
  v=$($c --version 2>/dev/null | head -1); [ -n "$v" ] && ok "$c $v" || bad "$c missing"; done
D=/home/box/aion-tools
[ -d $D/node_modules/playwright ] || { mkdir -p $D; cd $D; [ -f package.json ] || npm init -y >/dev/null; npm i -s playwright chrome-remote-interface puppeteer-core >/dev/null 2>&1; npx playwright install --with-deps chromium >/dev/null 2>&1; }
cd $D && t=$(timeout 60 node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('https://example.com');console.log(await p.title());await b.close()})()" 2>&1)
[ "$t" = "Example Domain" ] && ok "playwright chromium smoke: $t" || bad "playwright smoke: $t"
node -e "require('$D/node_modules/chrome-remote-interface');require('$D/node_modules/puppeteer-core')" 2>/dev/null && ok "CDP libs (chrome-remote-interface, puppeteer-core)" || bad "CDP libs"
port=$(pgrep -af chrome | grep -o 'remote-debugging-port=[0-9]*' | head -1 | cut -d= -f2)
[ -n "$port" ] && curl -s localhost:$port/json/version | grep -q Browser && ok "desktop Chrome CDP on :$port" || echo "INFO  no desktop CDP port; launch chrome with --remote-debugging-port=9222"
OC=/home/box/.opencode/bin/opencode; [ -x "$OC" ] || OC=$(command -v opencode)
[ -n "$OC" ] && v=$("$OC" --version 2>/dev/null) && [ -n "$v" ] && ok "opencode $v ($OC)" || bad "opencode missing (curl -fsSL https://opencode.ai/install | bash)"
echo "SUMMARY pass=$P fail=$F"; [ $F = 0 ]
