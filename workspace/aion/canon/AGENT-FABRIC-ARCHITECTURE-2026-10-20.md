# AION Agents — a natural extension of what already works
**Status:** IMPLEMENTATION GUIDANCE, NOT AN INSTALLED FEATURE · 20 October 2026
**Design correction:** This supersedes the preceding 35 KB "Agent Fabric" architecture proposal in this file's Git history. That proposal introduced too many abstractions and a compulsory implementation path. **Do not implement it as written.** This file is the lean replacement. History remains recoverable in Git.
**Execution owner:** the local Windows agent in the existing AION Track B development checkout. This document authorizes no new local side effects by itself.

## 1. The entire mental model

**An agent is simply an existing thing we can ask to do work.** A ChatGPT conversation, a ZCode Bot, a running OpenCode agent or subagent, an ACP session, a research specialist, or another native tool can all be presented as agents *when actually reachable*. We do not move them into a new runtime.

For AION to work with one, it needs to know only what is available:

| Question | Everyday meaning | Existing source |
|---|---|---|
| **Who?** | A name, role or native identity | AION ROLES.json, existing Bus agents, ZBot/native agent definitions |
| **Where?** | How to reach it, if currently connected | Existing Bus binding, Chrome dev host, OpenCode/ACP, ZCode bridge |
| **What?** | What it can actually do and is allowed to do | Runtime feature probes, native permission controls, Bus grants |
| **What does it need to know?** | Relevant project and role context | Existing AGENTS.md, BOOTSTRAP.md, SITREP.md, PM evidence, SOFTWARE_HQ, runtime skills |
| **What happened?** | Optional progress/result when work was requested | Native task/session receipt, Bus command/attempt, project issue or artifact |

That's it. Fields may be **missing**. An agent can exist with a name and no connection; it is UNBOUND, not broken. An OpenCode builtin may have no AION organizational role. A Research chat may have no executable local tools. A user task may finish in one message without becoming a tracked multi-agent program.

**AION is the directory and common entry point, not the agent's employer, brain, jail or replacement runtime.**

The concrete interaction stays familiar:

~~~text
aion agents                          # Who is around? What is actually connected?
aion context chief                   # What information do we already have for Chief?
aion send chief "Give me the status" # The existing command, unchanged
aion send chief "Status" --context brief  # Attach existing excerpts by explicit request
~~~

These four are existing Track B Round 9 development commands, not a guarantee that Chrome is live on Windows. There is NO requirement that every send be a task, start a child agent, assemble a ContextPack, compile a manifest, or pass through a portfolio database.

## 2. How this fits the actual repos

| Existing home | What it already owns | AION should do, naturally |
|---|---|---|
| **AION / Chrome Relay** | Existing role launcher, ChatGPT binding, Bus grants, durable no-resend command path | List reachable roles/conversations, route a requested send, observe actual outcome |
| **OpenCode V2** | Native primary agents, subagents, skills, sessions and tool permissions | Discover the installed version and its native agents; call the native SDK/ACP/HTTP adapter when verified; do NOT rebuild subagents |
| **ZCode + zcode-bots** | Named bots, CLI sessions, the ZBot durable-task design, native tooling | Describe existing bots and use verified native control. Do not migrate them into AION |
| **zcode-setup** | Versioned Playbook agents, skills, workflows and distributable tooling | Reuse a playbook unit when a reusable definition is actually needed, never mandate compilation for a standing chat |
| **001.PROJECTS.PM (Global PM)** | Read-only project/source registry, provenance, freshness and executive assessments | Read PM as OPTIONAL project context/evidence. No task assignment or PM writes without a separately approved change |
| **SOFTWARE_HQ** | Application docs, OpenCode/ZCode protocol research, technical knowledge | Read relevant reference material on demand, not as global prompt text |
| **hq** | Host OS/network/storage stability and local machine evidence | Read host status when the task depends on it; no ownership of agents merely because they run there |
| **Product_Hub / VOMEGA** | Reusable capability discoveries / semantic capabilities | Offer optional reusable tools or skills only after verified availability |
| **ZCode Pocket** | Mobile ACP client experience | Another view/control surface; no new agent identity authority |

**Known discrepancy:** AION's sessions README includes Role 09 Research, but the Chrome role launcher ROLES.json has only eight roles. Report the discrepancy as "role configured in sessions, not registered/bound in launcher"; do NOT fabricate a live connection or change the launcher without a straightforward compatible change and its test. The existing Bus registry is a runtime binding, not a claim that every role is executing.

**Important PM boundary:** today's checked-in Global PM charter is read-only. A more proactive "digital CEO" can be an existing authorized AION/ACP coordinator *using PM's evidence* to send work to a project owner. The current PM collector must not silently become an execution engine.

## 3. Integration pattern: small optional facets on existing agents

Don't introduce a compulsory nine-entity ontology, a new global agent DB, a central compiler, a task graph service, an orchestration daemon or cross-app transcript replication.

When needed, expose an **AgentView**, a read-only projection over native sources, not a new authoritative record:

~~~json
{
  "name": "chief",
  "source": "aion-role-launcher",
  "role": "05",
  "connection": { "status": "UNBOUND" },
  "capabilities": [],
  "context_refs": ["workspace/aion/sessions/roles/05-chief-of-chiefs/BOOTSTRAP.md"],
  "project_refs": [],
  "observed_at": null
}
~~~

This is an illustrative shape, not a claim Chief is unbound right now. Missing properties are fine. Native IDs, provenance, status and last-check timestamps remain native; keep source refs. An agent may have several native appearances; record exact target identity when dispatching instead of trying to forcibly merge all instances.

Optional capability when actually supported: a binding to a session, skills that the runtime advertises, a model preference, resource/safety limits, native task IDs and receipt references. **Each adds value independently.** A user can use an agent that has none of the optional extras.

Internally preserve only these safety distinctions where actions require them:
- A **role** describes a responsibility; a **connection** is the actual route; a **task** is optional tracked work; a **send attempt** is one external action. These are different but NOT new universal layers that every operation must traverse.
- Discovering an agent/tool != authorizing a side effect. Keep the existing Bus grants and runtime/host permissions.
- A native reply != verified project completion. Keep project-native source truth and PM evidence vocabulary.
- Sending with an unknown result must never auto-repeat or route to a fallback actor.

## 4. Context is a convenient attachment, not a mandatory subsystem

Use ordinary sources already present: AGENTS.md, role BOOTSTRAP/SITREP, PM project registry and read-only pulse, project issues/commits, verified skills, Software HQ notes, and native conversation/task context.

Start with **existing** \`aion context chief\` and \`--context brief\`. The current implementation shows provenance and omitted text, refuses >2,000-char sends, and leaves ordinary sends unchanged. That is a reasonable V0. Don't hold live Chrome verification hostage to advanced context work.

When the user asks for additional context:
- Pick only sources relevant to that request and project, respecting accessible permissions.
- Prefer a live source to a stale SITREP; label source type, freshness, unverified claims and omitted material.
- Preserve original source refs/hash when practical. Do not turn untrusted docs or task text into owner authority.
- For a larger context, prefer native OpenCode file/API context where available; **never** silently cut down text or split it into several Chrome sends.
- Allow "no extra context" as a legitimate mode.
- Optional future retrieval/indexing is driven by observed problems, not a prerequisite.

There is no compulsory ContextPack manifest or memory architecture. A small source list plus read-only preview is enough unless a real cross-agent use case needs more.

## 5. OpenCode V2 integration: let OpenCode be OpenCode

Official OpenCode V2 agents already have modes \`primary\` / \`subagent\` / \`all\`, native session creation, own child-session context, skill discovery, and ordered \`permissions\` rules with \`action\`, \`resource\`, \`effect\`. See:
- https://opencode.ai/v2/docs/agents
- https://dev.opencode.ai/v2/docs/permissions/
- https://dev.opencode.ai/v2/docs/skills/

AION should simply connect to those **existing** native agents where the owner's installed OpenCode version really supports them. Use the existing direct OpenCode/ACP route and native APIs. There is no reason to reimplement primary/subagent dispatch in AION.

If we later have a *real need* to share a specialist definition across OpenCode and ZCode, zcode-setup's playbook can compile one source into their different native formats. That is **optional reuse**, not a required migration or step in agent discovery. Never silently translate V1 permissions to V2: confirm the exact installed version and schema first.

## 6. What the local agent should do with the current code

**Primary branch:** \`track-b/implementation-rounds-20261019\` (draft PR #34). This design remains a separate draft PR; it must NOT replace the source branch or break the prelive Chrome connector.

Start with a read-only check of the actual checkout, version, uncommitted changes, live grants and test suite. The owner's Windows checkout is the only local master. No GitHub Actions, Slack, Playwright, Puppeteer or Orca. No installation claims unless executed on Windows.

Then implement in **the smallest useful increments**, stopping when a useful natural experience is achieved:

**A. Make the existing roster accurate (small first improvement).**
- Inspect \`velocity/src/agents-context.mjs\`, \`src/broker/roles.mjs\`, ROLES.json, sessions/README.md and native Bus registry.
- Add missing-context/binding-status distinctions to existing \`aion agents\`; show each native source. Report Role 09 as "configured in sessions, not yet launcher bound" rather than forcing it into the eight-role launcher.
- Leave role aliases and \`aion send chief\` behavior unchanged. Do not overwrite existing agent records.

**B. Let native agents appear without a migration.**
- If local OpenCode V2 is installed, inspect/version-probe and list its built-in/custom agents from a native API/config. If absent, report unavailable and proceed normally.
- Do the same for ZCode/ZBot only if a verified local read-only interface is already available. No daemon, login, GitHub issue or provisioning prerequisite.
- Merge *views* for display; keep native IDs. Don't confuse a known definition, an installed executable, a connected session and a permission to send.

**C. Give the operator the best relevant context, only on request.**
- Extend the existing \`aion context <name>\` preview to optionally include the owning project's read-only status/PM refs and useful role docs, with provenance. Keep \`--context brief\` working exactly as it does today.
- Don't introduce an indexed database, automatic "full memory" sync, prompts that override project authority or context compilation gates. Only add richer context selection when an observed task needs it.

**D. Prove one real loop.**
- \`aion agents\` shows Chief and the installed local OpenCode agent truthfully.
- \`aion context chief\` previews original docs and marks unknowns/staleness.
- \`aion send chief "Reply with OK"\` follows existing exact target/no-resend behavior, only after separately verified browser setup/preflight.
- A native OpenCode request uses an existing agent and returns a correlated result. No new subagent engine.
- PM still reads and reports; source data are not rewritten.

These are opportunities, NOT required milestones, "all-or-nothing" gates, or a new prescribed user workflow. Favor implementation only when it improves an actual command.

## 7. Acceptance in plain English

A useful extension meets the following checks:
- Old commands and existing role bindings still work; full local \`aion selftest\` is green on the actual new head.
- No new service/database/role/permissions framework required to use a known agent.
- Discovered agents are honest: **known**, **installed**, **connected**, and **authorized** are not synonymous.
- Context is inspectable and provenance-bearing, never silently truncated, fabricated or leaked across project permissions.
- One external send cannot be silently duplicated, sent to the wrong conversation, or claimed successful after only a transport ACK.
- OpenCode continues to own native primary/subagent behavior; ZCode continues to own its native bots; PM continues to own read-only evidence.
- No mandatory task IDs, ContextPacks, definition compilation, runtime migrations, new dashboards or orchestration workflow for an ordinary request.

**Done means the user can naturally discover, talk to and understand their existing agents with less effort.** AION should feel like one convenient pane of glass over the systems they already use.

## 8. Handoff to local Windows agent

Read this file with the CURRENT \`origin/track-b/implementation-rounds-20261019\` source and its \`velocity/AGENTS.md\`. The design PR is an input, not a branch to merge blindly.

Suggested PowerShell read-only start:

~~~powershell
git status --short
git branch --show-current
git log -1 --oneline
node --version
$Aion = ".\workspace\aion\ops\chrome-relay\velocity\bin\aion.ps1"
pwsh -NoProfile -File $Aion selftest
pwsh -NoProfile -File $Aion agents
pwsh -NoProfile -File $Aion context chief --scope brief
pwsh -NoProfile -File $Aion connections
~~~

Verify actual source, preserve dirty work, run the offline suite before modifications, and deliver the smallest compatible enhancement in the existing CLI. Do not modify PM/ZCode repos in place merely to conform to an AION shape. Record commit SHA, exact tests passed/skipped/failed, verified runtime state, outstanding risks and next meaningful test. GitHub issues/PRs are durable evidence, not executable transports.

**Final direction:** No agent platform. Just existing agents, naturally reachable through AION, with useful context and optional capabilities whenever they exist.
