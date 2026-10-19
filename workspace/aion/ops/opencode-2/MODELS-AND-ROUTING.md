# OpenCode 2.0 — model layer and routing (V2 dossier entry)

**Updated:** 2026-10-19 (OWNER_WINDOWS_MASTER, OpenCode v2.0.32 verified live).
**Method:** official V2 documentation via Context7 (`/websites/opencode_ai_v2`, raw pulls preserved at SOFTWARE_HQ `context7/raw/2026-10-19T13-03-*.json`), primary pages `v2/docs/api`, `v2/docs/build/plugins` (+`/effect`), `v2/docs/cli/acp`, `v2/docs/models`, `v2/docs/agents`, `v2/docs/migrate-v1`; cross-checked against observed live config. Every fact is graded below. Complementary primary research: [model-failover/COMPATIBILITY.md](../model-failover/COMPATIBILITY.md).

## Why this entry exists

This dossier was written 2026-10-17 when OpenCode was still 1.18.35 and models were out of scope. Since then the host runs v2.0.32, a free-model playbook appeared with hard-won receipts (catalog churn, entrypoint-dependent free tier, variant pitfalls), and the machine now needs one routing system instead of ad-hoc retargets. This page records the model-layer contracts; the live system lives in [`../opencode-models/`](../opencode-models/README.md).

## Model-layer facts (evidence-graded)

| ID | Fact | Grade | Boundary |
|---|---|---|---|
| F-M1 | Per-agent model override is configuration: `"agent" / "agents" <name> .model` with `provider/model-id`; documented for opencode.json and for agent markdown frontmatter (`~/.config/opencode/agent/*.md`) | OFFICIAL FEATURE | not yet exercised by this host's config (only slim presets override models today) |
| F-M2 | V2-native form: `agents` map, `prompt`→`system`, and **model reference gains the variant suffix: `provider/model#variant`**; `variant` as a separate legacy key is accepted by the installed 2.0.32 (observed live) | OFFICIAL FEATURE | migration is optional; installed config still uses legacy keys and works |
| F-M3 | Custom variants: a model can declare a `variants` array (id + settings/headers/body) replacing/adding catalog variants | OFFICIAL FEATURE | not exercised on this host |
| F-M4 | Per-session switch: `POST /api/session/{sessionID}/model` body `{"model":{"providerID","id"}}` → `204`; errors 400/401/404 | OFFICIAL FEATURE (public spec) | affects **subsequent turns only**; public spec ≠ installed binary until smoked (COMPATIBILITY.md keeps this unverified deliberately) |
| F-M5 | Plugin API: `ctx.session.switchModel({sessionID, model:{providerID, id}})`, same subsequent-turns semantics | OFFICIAL FEATURE | no plugin on this host uses it yet; the staged supervisor models it as a mocked port |
| F-M6 | ACP: `session/set_config_option` with `configId:"model"` value `provider/model`; `config_option_update` notified on change (incl. by other clients) | OFFICIAL FEATURE | ACP runs a private server; do not assume the switch is visible to the shared service session inventory |
| F-M7 | Background subagents can carry **alternate models per lane** | OFFICIAL FEATURE | lane-scoped, nothing persists |
| F-M8 | Model catalog changes silently; free models can disappear **and reappear**: `space-bunny-free` 0 results at 12:29Z, `active` again at 13:01Z on 2026-10-19; free entries observed 23 → 22 intra-day | AION HOST RECEIPT | never trust a stale week-old route; re-snapshot before route changes |
| F-M9 | Free-tier access is entrypoint-dependent: council synthesis agent `403 FreeTierError` while the same model answered via CLI and councillor seats | AION HOST RECEIPT | smoke the exact agent type, not just the model |
| F-M10 | Variants are model-specific: `mimo-v2.6-flash-free` has none; `minimax-m3.1-flash-free` up to `xhigh`; `deepseek-v4.1-flash-free` up to `max` | AION HOST RECEIPT | reusing a variant after a model swap is silently invalid |

## How the host routes models today (observed 2026-10-19)

- `~/.config/opencode/oh-my-opencode-slim.json` (active preset `zen-free`) routes the seven agent lanes; all currently on `opencode/deepseek-v4.1-flash-free` (`high`, council seats + designer included; explorer/librarian `low`).
- Known drift: playbook best-practice routes **fixer/implementation at `minimax-m3.1-flash-free#high`**, live preset has fixer on deepseek without variant — prescription lives in [`../opencode-models/ROUTING.json`](../opencode-models/ROUTING.json), and `audit.mjs` reports it until applied (owner-call, backup + read-back + restart per playbook §6).
- Per-session and per-lane switching routes are documented in [opencode-models README §4](../opencode-models/README.md) — the fast paths are dispatch-time model override (lane-scoped) and `POST /api/session/{id}/model` (session-scoped).

## Routing decision reference (owner table)

Declares what each lane uses and why — machine-readable in ROUTING.json: orchestration/synthesis = deepseek `high`; implementation = minimax `high`; mechanical = mimo; read-only search = deepseek `low`; high-stakes acceptance = paid `openai/gpt-6.1-sol#medium` (unverified on host); general fallback glm/beam. Escalation rule: >~2 self-correction rounds on a free lane → escalate, do not loop. **Failover** is staging-only ([COMPATIBILITY.md](../model-failover/COMPATIBILITY.md)): keep inactive; its `FALLBACK` and ROUTING `failover.fallback` must be edited together when the production fallback changes.

## What still needs a host probe (do not assume)

- `POST /api/session/{id}/model` against the installed 2.0.32 server (status code, body shape `{"model":{"providerID","id"}}` vs string form).
- Plugin `ctx.session.switchModel` availability on the installed plugin runtime (plugin declarations absent per COMPATIBILITY.md inspection).
- `openai/gpt-6.1-sol#medium` availability/cost on this host (catalog + one-shot agent smoke before ever routing acceptance to it).
- Council-seat behavior after any model change (403 FreeTierError history in this exact agent class).
