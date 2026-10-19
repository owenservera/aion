# opencode.models — global model routing system for OpenCode

**Status:** ACTIVE_SYSTEM (docs + machine-readable routing + read-only audit). Config was **not mutated** by the design lane; one live drift is intentionally surfaced by the audit until the owner applies the ready-made recipe.
**Owner scope:** OWNER_WINDOWS_MASTER, all OpenCode sessions (global). Compatible with OpenCode **v2.0.32** (verified `opencode --version` 2026-10-19).
**Contract:** the model catalog changes silently — every observed claim in this system carries a timestamp; re-verify IDs before route changes. Primary playbook: [`OPENCODE-FREE-MODEL-PLAYBOOK.md`](../OPENCODE-FREE-MODEL-PLAYBOOK.md).

## 1. TL;DR — fastest routes, in order

| You want to… | Fastest route | Effect boundary |
| --- | --- | --- |
| Check which models/variants exist **right now** | Code Mode: `tools.opencode.models({ query, limit })` (exact IDs + variants + status) | read-only |
| Send one subagent lane on a different model | pass `model` at dispatch time (`subagent(agent, {model:'provider/model#variant'})`) | that lane only, nothing persists |
| Change model of a session you already have | `POST /api/session/{sessionID}/model` body `{"model":{"providerID","id"}}` → 204 | **subsequent turns** of that session; public spec — smoke on installed binary before relying |
| Change which model an agent*always* uses | edit config (`opencode.json` `agent.<name>.model` or slim preset) → backup → read-back → `opencode service restart` for new sessions | new sessions only; a live session keeps its old model |
| Survive a paid-quota wall on a task root | staged supervisor in `model-failover/` (**inactive**) | activation is gated; see §6 |

Rule first learned in the playbook and re-proven 2026-10-19: **catalog ≠ access** — smoke the exact agent type before routing a real lane at a model; free-tier availability is entrypoint-dependent (council synthesis returned `403 FreeTierError` while the same model answered from the CLI).

## 2. Source of truth

- **[`ROUTING.json`](./ROUTING.json)** — machine-readable routing: lanes → model + variant, precedence list, failover pair, embedded catalog snapshot (id/variants/status per observed timestamp).
- **[`RECEIPTS.md`](./RECEIPTS.md)** — append-only observed-at receipts (catalog snapshots, smokes, audits).
- **[`audit.mjs`](./audit.mjs)** — read-only drift audit, zero dependencies:

```powershell
bun workspace/aion/ops/opencode-models/audit.mjs   # exit 0 = ok/warn (warns listed), exit 1 = error
```

Precedence the audit assumes (in order): in-session switch → dispatch-time override → agent-specific config (**project beats global**) → slim preset default → failover supervisor. Never assume a running agent changed underneath you: config is read at session start.

## 3. Always-the-right-model automatically

| Lane | Declared model | Variant | Tier |
| --- | --- | --- | --- |
| orchestration / synthesis / oracle review | `opencode/deepseek-v4.1-flash-free` | `high` | free |
| implementation / multi-file fixer | `opencode/minimax-m3.1-flash-free` | `high` | free |
| mechanical bulk edits / summaries | `opencode/mimo-v2.6-flash-free` | — | free |
| explorer / read-only search / librarian | `opencode/deepseek-v4.1-flash-free` | `low` | free |
| designer | `opencode/deepseek-v4.1-flash-free` | `high` | free |
| council seats (α β γ δ) | `opencode/deepseek-v4.1-flash-free` | `high` | free |
| high-stakes acceptance / M1 / architecture | `openai/gpt-6.1-sol` | `medium` | paid |
| general fallback / degradation | `opencode/glm-5.3-flash-free` / `opencode/beam-free` | `low`/`high` | free |

Automatic mechanisms, existing today, no new runtime:

1. **Global preset routing** (`~/.config/opencode/oh-my-opencode-slim.json`, active preset `zen-free`) routes the orchestrator/oracle/council/explorer/librarian/designer/fixer agents at session start.
2. **Dispatch-time override** — the delegator passes `model` per subagent call when a lane needs something else than the default; this is the zero-persistence on-the-fly switch.
3. **Session switch** for a live session (§4) when mid-task the model proves wrong.
4. **Escalation rule** — if a free lane needs more than ~2 rounds of self-correction, escalate to the paid acceptance lane; do not loop a free model (playbook §3).
5. **Failover** (staged, inactive) — see §6.

Nothing in this system launches sessions or changes permissions; selection is data + procedure, idempotent to re-run.

## 4. Switching contracts (verified public docs, 2026-10-19 Context7 pulls → SOFTWARE_HQ `context7/raw/2026-10-19T13-03-*`)

Sources: https://opencode.ai/v2/docs/api, https://opencode.ai/v2/docs/build/plugins (effect), https://opencode.ai/v2/docs/cli/acp. Public-spec ≠ installed-server until smoked (house rule); receipts so far cover the CLI smoke and the catalog call only.

- **HTTP:** `POST /api/session/{sessionID}/model` body `{"model":{"providerID":"…","id":"…"}}` → `204`; errors `400/401/404`. Affects **subsequent** provider turns. Doubles as the natural carrier for the playbook's failover `switchModel` step.
- **Plugin API:** `ctx.session.switchModel({ sessionID, model: { providerID, id } })` — same subsequent-turns semantics.
- **ACP:** request `session/set_config_option` with `configId:"model"`, `value:"provider/model"`; OpenCode notifies `config_option_update` when models/agents change or another client switches. Load/resume/fork need matching `cwd` — switching cwd-bound sessions accordingly.
- **Variant syntax:** V2-native joins variant into the model reference: `provider/model#variant`; legacy per-agent `model` + `variant` keys still work on the installed 2.0.32 live config (observed). Suffix only with variants present in the embedded catalog snapshot (`mimo` has none; `minimax` reaches `xhigh`; `deepseek` stops at `max`).

## 5. Catalog truth procedure (do this before any route change)

1. In-agent snapshot: `await tools.opencode.models({ query:'free', limit:60 })` — copy id/variants/status providers into new `ROUTING.json` `catalog_snapshot` with a fresh UTC stamp.
2. Cross-check in shell: `opencode models | Select-String free` (IDs only — no variants).
3. Run `audit.mjs`; resolve ERROR before anything else; decide WARN items with the owner.
4. Smoke ladder (playbook §6): model smoke via CLI `$null | opencode run -m <id> "Reply with exactly: OPENCODE_OK"` → then the **exact agent type** → read config back → restart for new sessions.

Churn is **bidirectional**: `opencode/space-bunny-free` returned 0 results at 12:29Z on 2026-10-19 (owner preset corrected away from it) and reappeared `active` with full variants at 13:01Z the same day. A gone-then-back model is not a route; only a fresh catalog + smoke is. Keep `catalog_snapshot` current and never trust a week-old route.

## 6. Failover alignment

`workspace/aion/ops/model-failover/supervisor.js` declares primary `openai/gpt-6.1-sol` variant `medium` and sticky fallback `opencode/minimax-m3.1-flash-free`. The supervisor is **staging-only and must remain inactive** until its host contract is validated (`COMPATIBILITY.md`): no installed-plugin seam, no pre-dispatch task-root fence, provisional provider-error markers. When you change the production fallback, change `FALLBACK` in `supervisor.js` **and** `failover.fallback` in `ROUTING.json` together — the audit compares both.

## 7. Session knowledge injection

Every OpenCode session reads `~/.config/opencode/AGENTS.md` at start. The "Model routing (quick card)" section there is the runtime-facing copy of this system (catalog call, lane table, switch routes, pointers here). Keep that section a **mirror**, never a fork: change routes here first (ROUTING.json), then push into the quick card and playbook.

## 8. Files

| File | Role |
| --- | --- |
| `ROUTING.json` | declared routing, precedence, failover pair, catalog snapshot |
| `audit.mjs` | read-only drift audit (configs vs routing; variant validity; fallback alignment) |
| `RECEIPTS.md` | observed-at receipts |
| [`../opencode-2/MODELS-AND-ROUTING.md`](../opencode-2/MODELS-AND-ROUTING.md) | V2 model-layer dossier entry (evidence-graded) |
| [`../OPENCODE-FREE-MODEL-PLAYBOOK.md`](../OPENCODE-FREE-MODEL-PLAYBOOK.md) | full retarget/smoke recipes |
