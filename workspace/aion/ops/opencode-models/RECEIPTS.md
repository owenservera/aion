# opencode.models — receipts

Append-only observed-at receipts for the global model routing system. Every row gets a UTC stamp and the exact observation. Do not mark unverified items as done; do not remove rows.

| Date (UTC) | Fact |
| --- | --- |
| 2026-10-19T12:29:28Z | failover fallback switched to `opencode/minimax-m3.1-flash-free`; supervisor mock suite 33/33 pass (source: `../OPENCODE-FREE-MODEL-PLAYBOOK.md` §9 and `../model-failover/COMPATIBILITY.md`) |
| 2026-10-19T12:52:38Z | CLI smoke `opencode/minimax-m3.1-flash-free` → `OPENCODE_OK`, exit 0 (source: playbook §9) |
| 2026-10-19T12:52:57Z | owner preset backup created; orchestrator retarget from retired `space-bunny-free` to `deepseek-v4.1-flash-free` (source: playbook §9) |
| 2026-10-19T12:29Z | catalog query: 23 free entries; `space-bunny-free` 0 results; council synthesis agent 403 FreeTierError (source: playbook §9) |
| 2026-10-19T13:01:29Z | catalog snapshot via `tools.opencode.models({query:'free',limit:60})`: **22** free entries (delta vs 12:29Z: −1); **`space-bunny-free` back as `active`** with variants low/medium/high/xhigh/max — churn is bidirectional; snapshot captured into `ROUTING.json` |
| 2026-10-19T13:03:45Z | Context7 pulls recorded to SOFTWARE_HQ `context7/raw/2026-10-19T13-03-*` (`/websites/opencode_ai_v2`): agents/`model#variant` config contract + session switch-model contract set (HTTP/plugin/ACP); SOFTWARE_HQ commit `5714ba4` |
| 2026-10-19T13:06Z | global model routing system created: `ROUTING.json`, `audit.mjs` (read-only), this ledger quick card injected into `~/.config/opencode/AGENTS.md` (backup kept beside it) |
| 2026-10-19T13:09:26Z | targeted catalog probes: query `minimax` → `opencode/minimax-m3.1-flash-free` **absent** (0 results for that ID; plausible successor `opencode/minimax-m3` with **no variants**); query `gpt-6.1-sol` → `openai/gpt-6.1-sol` present, variants low…max. Results captured as ROUTING.json `catalog_snapshot.supplements`. Churn confirmed in both directions within one hour (space-bunny returned; minimax-m3.1-flash-free left). |
| 2026-10-19T13:11Z | first audit run `bun opencode-models/audit.mjs`: exit 1 with 2 errors → severity policy corrected (catalog absence = WARN, variant mismatch = ERROR), council gamma seat exempted (live preset diversity), supervisor check reads bare id (`FALLBACK = {providerID:'opencode', id:'minimax-m3.1-flash-free'}`). Final gate: **exit 0 — 18 ok, 2 info, 2 WARN (implement-lane catalog exit; fixer lane drift vs declared best practice), 0 error.** |
