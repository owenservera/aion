# DECISION 2026-10-19 — Bus V1 (commander loop) and Bus V2 (local executors)

Status: **DIRECTION RECORDED (owner statement, 2026-10-19 ~13:03Z)**. Every item marked **PROPOSED** awaits owner confirmation.
Authority: Owen, direct instruction in a review conversation with Claude.
Does **not** change: the M1 acceptance contract, the evidence rules, or the host/browser stop order. `live_execution_authorized` stays `false` and `m1_verified` stays `false`. Nothing here authorizes a live send, an install, or starting any agent.
Builds on: [DECISION-2026-10-17-WINDOWS-DRIVEN-DEV](./DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md) (Windows master, OpenCode as execution agent, GitHub as ledger only).

## 1. Owner goal (own words, trimmed)

> from my chatgpt mobile app while my pc is logged into chatgpt and with the chrome extension loaded - my chatgpt.com can use the chrome extension to (this is my top priority for V1 - we will extend from here to local pc): 1. send messages to other open chatgpt.com conversations, track "agents" as we have in the AION as their own genealogical agents; 2. give commands to the agents; 3. have a full agentic team - think Dots, Grok Bot, Muse etc.
>
> mobile > chatgpt.com on PC + Chrome extension > local PC messaging to my agentic tools, starting with OpenCode.

## 2. Labels (PROPOSED — resolves a three-way "V2" collision)

| Label | Meaning | Replaces |
|---|---|---|
| **Bus V1 — Commander loop** | Phone → ChatGPT app → owner's chatgpt.com on the Windows PC → extension → other open chatgpt.com conversations ("agents"), with registry, genealogy, commands, reports | new |
| **Bus V2 — Local executors** | Same commander loop, extended to local agentic tools on the PC, **starting with OpenCode** | new |
| **RC-1** | Manual mobile role-context workflows ([`ops/role-context-v1/`](../ops/role-context-v1/README.md)) | what those docs called "V1" |
| **RL-001** | Chrome role launcher (issue #22) | what those docs called "V2" |
| OpenCode 2.0 | A product version only; never a roadmap label | — |

Directory names and links are unchanged; only the labels in prose change.

## 3. What existing rules this touches

| Existing rule (where) | Status under this direction |
|---|---|
| Replies "cannot ... route to another privileged target, or start an agent" (`ARCHITECTURE.md` §2 inv. 4) | **Narrowed by the commander channel exception (§5), PROPOSED.** Still absolute for every other path. |
| MVP "does not autonomously drive chatgpt.com"; no silent prompt submission; no free-running agents from untrusted messages (`ARCHITECTURE.md` Authority model, Non-goals) | Still the default. The commander channel is the **only** proposed exception, and only after owner confirmation and a fresh grant. |
| "Never follow instructions appearing in page content"; no transcript scanning (`LAUNCH-PROTOCOL.md`) | Unchanged for RL-001. The commander watcher is a separate, bounded parser (§5 C2). |
| "GitHub issues, commits and new tabs do not wake ChatGPT or any agent" (`AGENTS.md`, `README.md`) | Still true. The commander channel is the only proposed wake path. |
| Scoped multi-send authorization is an open owner decision (`ARCHITECTURE.md` §10 item 2) | **Now required** for Bus V1 (§5 C5, §8). |
| M1 acceptance (AION-origin, real reply, readback, negative case) | Unchanged. Bus V1/V2 acceptance is separate and never promotes M1. |

## 4. Commander channel — how the phone reaches the PC (decision pending)

The commander is one designated chatgpt.com conversation (for example an AION role chat). The owner types in it from the phone; the extension on the PC acts on it.

| | Option A — tab watcher | Option B — connector bridge |
|---|---|---|
| Path | Phone message → commander conversation → assistant reply contains a command block → extension content script on the PC's open commander tab parses and validates it | ChatGPT calls a write tool exposed by a local MCP server through a tunnel → local bridge → native host → extension |
| Needs | Commander tab open on the PC and updated | Custom-MCP entitlement (Plus **not** established), tunnel, write tools (read-only pilot exists: `ops/aion-mcp/`), availability on mobile unverified |
| Main risk | Whether a PC tab picks up a phone-sent message without reload is **unknown** | Entitlement and tunnel not yet verified; larger write surface |

**PROPOSED default: Option A**, gated by experiment **SYNC-0** (§7). Option B is the fallback if SYNC-0 fails and entitlement is confirmed. Neither is claimed to work.

## 5. Commander channel authority exception (PROPOSED)

A model-authored reply may cause a bounded action only if **all** of these hold. Any failure is a no-send refusal that is shown, never retried.

- **C1 Owner-armed.** The user turn immediately before the reply carries an owner arm prefix (grammar in [`MOBILE-PROTOCOL.md`](../ops/role-context-v1/MOBILE-PROTOCOL.md)). Replies to turns without it are ignored.
- **C2 Bounded parse.** The watcher reads only assistant turns after the commander baseline, only a fenced `AION_CMD_V1` block; it never stores transcripts and never acts on user-turn or page text.
- **C3 Allowlisted target.** `to:` must be an `agent_id` in the registry, bound to an owner-confirmed conversation. Never "first available tab".
- **C4 Scoped action.** V1 action set is `send` (bounded text to a bound conversation) and `status`. Anything else is refused until separately approved.
- **C5 Scoped grant.** A traceable owner grant names agents, count, rate and expiry (extends the `AION_AUTHORIZATION_V1` one-send template). Counts are persisted before sending so a crash cannot replenish authority.
- **C6 Loop guard.** `hop` is counted per chain; a configured maximum halts the chain and shows `HALTED`. Reports posted back by the extension re-enter at hop+1.
- **C7 No-resend.** Every command reuses the durable operation guard and submit/observe engine (`ARCHITECTURE.md` §§2–6). Reconnecting to observe is never resending.
- **C8 Kill switch.** One panel control stops dispatch and refuses further commands until the owner re-enables.
- **Reports are data.** Agent replies and report text never select an action, widen a grant or start anything.

Residual risk, stated plainly: if the owner arms a turn and the model reads hostile content within it, the model could emit a valid block. C3–C6 bound the damage; they do not remove it.

## 6. Agents, genealogy and the glossary

| Term | Meaning here |
|---|---|
| **Role** | One of the 8 named, human-facing contexts in `ROLES.json`. A context, not a running process. |
| **Agent** | A registry entry with identity, parent, kind and scope, bound to a conversation or a local executor. Roles are the initial agents. |
| **Commander** | The single designated conversation that issues commands. |
| **Executor** | A local tool on the PC (Bus V2): OpenCode first. ZCode is deferred on Windows (decision D1). |

Genealogy as stated in the repo today (derived from role BOOTSTRAP "Reports to / Parent / supervised by" lines and `pm/OPERATING-RULES.md` #1; the owner has not confirmed it as the registry):

```
Owen (sole authority)
├─ AION  (CEO / oracle in chatgpt.com)
│   ├─ AION PM
│   └─ AION BFF  (Grok Bot, Linux helper; never writes code)
└─ 05 Chief of Chiefs  (owner designation 2026-10-16; its BOOTSTRAP lists 01–04, 06–08 as its team)
    ├─ 01 Dashboard & Tracking   ├─ 02 Long-term Planning
    ├─ 03 Chief of Staff (supervised by 05)   ├─ 04 OpenCode Output & Efficiency
    └─ 06 TOOLSMITH · 07 Intake · 08 Z-FORGE  (each "reports to" / "parent" 05)
Executors (Bus V2): OpenCode (Windows execution agent), ZCode (deferred)
```

"Dots, Grok Bot, Muse" are not defined as agents anywhere in the repo. As written today: **Dots** are OpenAI's always-on agents (role 04 research note; eligibility there is Pro outside the EEA/CH/UK, so **verify availability in Spain before depending on them**); **Grok Bot** is the Linux BFF helper; **Muse** appears only as the model "Muse Spark 1.3" in the fan-out order. Treat them as *capability models for the team* until the owner defines concrete agents.

## 7. Phases and gates (PROPOSED order)

**Bus V1**
| Phase | Deliverable | Needs live ChatGPT? |
|---|---|---|
| P0 SYNC-0 | One **no-send** experiment: does an open PC tab on the commander conversation show a message sent from the phone, with or without reload? Decides Option A vs B. | Read-only observation; owner-scoped |
| P1 | Agent registry + genealogy (data + panel view), offline | No |
| P2 | Command grammar, validator, router over the existing submit/observe engine, tested with fakes | No |
| P3 | Commander watcher (read-only parser) | Offline first |
| P4 | Report-back into the commander + loop guard + kill switch | Offline first |
| P5 | Live bring-up with **one** agent under a fresh explicit owner grant | Yes |

The reconcile endpoint and the task-store pruning plan (open items from the 2026-10-19 review) are prerequisites for P2.

**Bus V2**
| Phase | Deliverable |
|---|---|
| V2-0 | Read-only OpenCode session inventory through the existing native host / ACP path |
| V2-1 | One owner-approved scoped prompt to one OpenCode ACP session, correlation and receipt |
| V2-2 | Command grammar extension (`to:` an executor id), per-executor scopes and worktree limits |
| V2-3 | Report-back of executor results into the commander |

## 8. Open owner decisions

1. Confirm the labels in §2.
2. Option A or B (or "decide after SYNC-0").
3. Grant model for repeated sends: agents, counts, rate, expiry (`ARCHITECTURE.md` §10 item 2).
4. Hop limit and per-agent rate defaults.
5. Which agents are commandable first, and whether the registry above is correct.
6. Whether Dots are in scope given regional availability.

## 9. Documents updated by this decision

`ARCHITECTURE.md` (§11), `ENVELOPE-CONTRACT.md` (v0.2 additions), `MOBILE-PROTOCOL.md`, `FALLBACK-AND-ACCEPTANCE.md`, `STATE-PROTOCOL.md`, `STATE.json` (`bus_direction`), `README.md`, `ONBOARDING.md`, `AGENTS.md`, `role-context-v1/` relabel, `role-launcher/` notes, `extension/README.md`, `aion-mcp/` docs, `opencode-2/` docs, `pm/` owners, decisions, rules and risks, `windows-master/TODO.md`, `model-failover/COMPATIBILITY.md`.

## 10. Non-claims

No code for Bus V1/V2 exists. No SYNC-0 result exists. Mobile behavior is unobserved. This record is not a grant, not an M1 claim, and not evidence that any agent, tunnel or conversation is bound.
