# OpenCode free-model playbook

How to list free models, choose one for a task, and retarget agents quickly — without guessing IDs or breaking config.

Scope: owner Windows machine, OpenCode v2.0.32. Model catalog changes silently; every claim below is stamped with the date it was observed. Re-check before trusting an ID.

## 1. List free models in ten seconds

**Fastest (in-agent):** call the catalog through the Code Mode tool.

```js
// execute
const r = await tools.opencode.models({ query: 'free', limit: 60 });
return r.providers.flatMap(p => p.models.map(m => ({
  id: m.id, variants: m.variants, status: m.status
})));
```

This is the route to prefer: it returns the exact provider-prefixed ID, the valid **variant** names, status, and cost in one call. On 2026-10-19 it returned **23 free entries**.

**Fastest (shell):**

```powershell
opencode models | Select-String -Pattern 'free'
```

POSIX: `opencode models | grep free`.

Caveat: the CLI prints IDs only — no variants, no status. Use the catalog call when you need to know whether `high`, `xhigh`, or `max` exists for that model.

## 2. Catalog snapshot — 2026-10-19

`opencode` provider free models:

| ID | Variants | Best for |
| --- | --- | --- |
| `opencode/deepseek-v4.1-flash-free` | low, high, max | orchestration, review triage, reasoning |
| `opencode/minimax-m3.1-flash-free` | low, medium, high, xhigh, max | agentic implementation, fixer lanes; failover default |
| `opencode/mimo-v2.6-flash-free` | — | mechanical edits, summaries, bounded chores |
| `opencode/glm-5.3-flash-free` | low, high, max | general fallback |
| `opencode/beam-free` | low, medium, high, xhigh, max | general fallback |
| `opencode/nemotron-3.5-super-vl-free` | none…xhigh | multimodal experiments |
| `opencode/longcat-2.5-preview-free` | — | preview only |

Also present: `free/free/*` (5 entries) and `openrouter/*:free` (11 entries). Those are different providers; their auth and behavior differ from `opencode/*`.

**Retired:** `opencode/space-bunny-free` returned **0 catalog results** on 2026-10-19. Any config still pointing at it is broken. The owner preset was corrected to `opencode/deepseek-v4.1-flash-free` on 2026-10-19.

## 3. Which model for what

| Work | Model | Variant |
| --- | --- | --- |
| Orchestration, briefs, synthesis | `opencode/deepseek-v4.1-flash-free` | high |
| Implementation, multi-file fixer lanes | `opencode/minimax-m3.1-flash-free` | high |
| Mechanical bulk edits, summaries | `opencode/mimo-v2.6-flash-free` | — |
| Explorer / read-only search | `opencode/deepseek-v4.1-flash-free` | low |
| Independent review / oracle | `opencode/deepseek-v4.1-flash-free` | high |
| High-stakes acceptance, M1, architecture | `openai/gpt-6.1-sol#medium` (paid) | medium |

Rules of thumb:

- Free "flash" models are for throughput, not acceptance. Never let one sign off M1 or a security boundary.
- MiniMax is the strongest free implementer observed in this repo; DeepSeek is the better planner/reviewer; MiMo is fastest for unambiguous mechanical work.
- If a lane needs more than ~2 rounds of self-correction, escalate to Sol medium rather than looping a free model.

## 4. Where agent models are configured

Two files, both under `%USERPROFILE%\.config\opencode\`:

1. **`opencode.json`** — core OpenCode agents: `agent.<name>.model` (and optional `variant`). Currently only `build` and `plan` are declared, both without a model override.
2. **`oh-my-opencode-slim.json`** — preset routing used by the slim plugin:
   - `presets.<preset>.<agent>.model` and `.variant` for `orchestrator`, `oracle`, `council`, `explorer`, `librarian`, `designer`, `fixer` (active preset: `zen-free`).
   - `council.presets.default.{alpha,beta,gamma,delta}.model` for the four council seats.

Precedence, in practice: agent-specific config beats preset defaults; project-level config beats global config for the same key. When in doubt, check what the running agent reports rather than assuming.

## 5. Retarget recipes

Always back up first. The directory already uses timestamped `.bak-<reason>-<date>` files; follow that convention.

### 5a. Inspect what is configured now

```powershell
$cfg = "$env:USERPROFILE\.config\opencode\oh-my-opencode-slim.json"
(Get-Content -Raw $cfg | ConvertFrom-Json).presets.'zen-free' |
  Select-Object orchestrator, oracle, fixer, council
```

### 5b. Change one agent (example: fixer → MiniMax)

```powershell
$cfg = "$env:USERPROFILE\.config\opencode\oh-my-opencode-slim.json"
Copy-Item $cfg "$cfg.bak-route-$(Get-Date -Format yyyyMMdd-HHmmss)"
$env:AION_CFG = $cfg
bun -e "const fs=require('fs');const p=process.env.AION_CFG;const j=JSON.parse(fs.readFileSync(p,'utf8'));const a=j.presets['zen-free'].fixer;a.model='opencode/minimax-m3.1-flash-free';a.variant='high';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"
```

### 5c. Change every slim lane at once

```powershell
$cfg = "$env:USERPROFILE\.config\opencode\oh-my-opencode-slim.json"
Copy-Item $cfg "$cfg.bak-routing-$(Get-Date -Format yyyyMMdd-HHmmss)"
$env:AION_CFG = $cfg
bun -e "const fs=require('fs');const p=process.env.AION_CFG;const j=JSON.parse(fs.readFileSync(p,'utf8'));const preset=j.presets['zen-free'];for(const n of ['orchestrator','oracle','council','explorer','librarian','designer','fixer'])if(preset[n]){preset[n].model='opencode/deepseek-v4.1-flash-free';preset[n].variant='high'}fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"
```

### 5d. Change the council seats

```powershell
$env:AION_CFG = "$env:USERPROFILE\.config\opencode\oh-my-opencode-slim.json"
bun -e "const fs=require('fs');const p=process.env.AION_CFG;const j=JSON.parse(fs.readFileSync(p,'utf8'));for(const s of ['alpha','beta','gamma','delta']){j.council.presets.default[s].model='opencode/deepseek-v4.1-flash-free';j.council.presets.default[s].variant='high'}fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"
```

### 5e. Core agents

Add or edit a key in `opencode.json`, for example:

```json
"agent": {
  "fixer": { "model": "opencode/minimax-m3.1-flash-free" }
}
```

Keep the file valid JSON; validate with `Get-Content -Raw opencode.json | ConvertFrom-Json`.

## 6. Apply and verify

1. **Restart the background server** so new sessions read the config:

   ```powershell
   opencode service restart
   opencode service status
   ```

   Config is read at session start. A running session keeps its old model until switched; do not assume a live lane changed underneath you.

2. **Read the config back** (never trust the edit alone):

   ```powershell
   (Get-Content -Raw $cfg | ConvertFrom-Json).presets.'zen-free'.fixer
   ```

3. **Smoke the provider/model** (free, no side effects):

   ```powershell
   $null | opencode run -m opencode/minimax-m3.1-flash-free "Reply with exactly: OPENCODE_OK"
   ```

   Observed `OPENCODE_OK`, exit 0, 2026-10-19T12:52:38Z. The `$null |` closes stdin so a non-interactive shell does not hang.

4. **Smoke the exact agent type.** A model-level smoke does not prove a subagent entrypoint can use it. On 2026-10-19 the `council` synthesis agent returned `403 FreeTierError` (“free tier can only be used from within OpenCode”) while the same model worked from the CLI and from councillor seats. Dispatch a trivial task through the real agent before routing a long lane to a new free model.

## 7. Pitfalls learned the hard way

- **Catalog ≠ access.** Free-tier availability is entrypoint-dependent (see the 403 above). Always smoke the agent, not just the model.
- **Variant names differ.** `mimo-v2.6-flash-free` has no variants; `minimax` has `xhigh`; `deepseek` stops at `max`. Reusing an old variant after changing model can silently produce an invalid selection.
- **Exact IDs only.** IDs are provider-prefixed (`opencode/...`). A bare `minimax-m3.1-flash-free` is not a valid model reference.
- **Free models disappear.** `space-bunny-free` was preferred on 2026-10-17 and gone on 2026-10-19. Audit configs when a lane starts failing for no code reason.
- **Don't rewrite JSON by hand** if you can avoid it; parse → mutate → write. A malformed config can disable routing silently.
- **Back up before every edit.** The config directory also contains write-lock directories (`.opencode.json.write-lock`), so avoid concurrent writers while the app is saving.

## 8. Failover alignment

The staged supervisor (`workspace/aion/ops/model-failover/supervisor.js`) uses:

- primary `openai/gpt-6.1-sol#medium`
- fallback `opencode/minimax-m3.1-flash-free`

If you change the production fallback, update `FALLBACK` there and run `bun run test` in `workspace/aion/ops/model-failover` (33 pass as of 2026-10-19). The supervisor is **inactive** and must stay inactive until its host contract is validated (see `COMPATIBILITY.md`).

## 9. Receipts

| Date (UTC) | Fact |
| --- | --- |
| 2026-10-19T12:29:28Z | failover fallback switched to `opencode/minimax-m3.1-flash-free`; 33/33 pass |
| 2026-10-19T12:52:38Z | CLI smoke `opencode/minimax-m3.1-flash-free` → `OPENCODE_OK`, exit 0 |
| 2026-10-19T12:52:57Z | owner preset backup created; orchestrator changed from retired `space-bunny-free` to `deepseek-v4.1-flash-free` |
| 2026-10-19 | catalog query: 23 free entries; `space-bunny-free` 0 results; council synthesis 403 FreeTierError |
