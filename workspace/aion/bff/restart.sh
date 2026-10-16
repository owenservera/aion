#!/bin/bash
# Restores BFF runtime after box restart
pgrep -f aion-autopush-loop >/dev/null || sudo nohup setsid /usr/local/bin/aion-autopush-loop >/dev/null 2>&1 &
sudo git -C / status -sb | head -1
