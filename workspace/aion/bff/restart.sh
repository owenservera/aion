#!/bin/bash
# Restores BFF runtime after box restart
pgrep -f aion-autopush-loop >/dev/null || sudo nohup setsid /usr/local/bin/aion-autopush-loop >/dev/null 2>&1 &
sudo git -C / status -sb | head -1

# Tailscale (userspace) — box joins Owen's tailnet as aion-bff; state persists in /var/lib/tailscale
if ! pgrep -x tailscaled >/dev/null; then
  sudo mkdir -p /var/lib/tailscale /var/run/tailscale
  sudo nohup /usr/sbin/tailscaled --tun=userspace-networking --socks5-server=localhost:1055 \
    --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock >/tmp/tailscaled.log 2>&1 &
  sleep 4
fi
sudo tailscale up --hostname=aion-bff --timeout=20s >/dev/null 2>&1 || echo "tailscale: needs login (sudo tailscale up --hostname=aion-bff)"
sudo tailscale status | head -3
