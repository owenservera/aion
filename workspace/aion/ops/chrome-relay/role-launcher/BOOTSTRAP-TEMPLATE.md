# Role Launch — Generated First Message Template

The extension inserts exact values from verified `ROLES.json`. Do not handwrite arbitrary aliases into the prompt. For role 08 the generated text is shown below; for other roles substitute registry values and optional launch prompt path only when present.

## For new chat, generated for `AION:08`

```
AION ROLE LAUNCH / BOOTSTRAP
Launch code: AION:08
Expected native chat title: AION — 08 Z-FORGE
Role: Z-FORGE — Z.ai Sandbox Turn Strategist
Canonical repository: owenservera/aion (private), branch main
Role source directory: workspace/aion/sessions/roles/08-zai-sandbox-strategist/
Read first: BOOTSTRAP.md, AGENTS.md, WORKSPACE.md, SITREP.md, TOOLS.json, skills/README.md, and LAUNCH-PROMPT.md where present.
Then read applicable SKILL.md for current task, source-linked canonical operating rules and the role's explicitly referenced task feed. Prioritize current SITREP over stale introductory text.
Use your authorized GitHub connector to read these exact repository paths, not public web search for private files. State any unavailable file/connector honestly and ask for a manual source paste only if needed.
Stay strictly within this role's ownership and the AION 70/30 execution standard. Do not infer that other chats woke up from GitHub commits.
Please confirm the exact files actually read, role boundaries, current verified status, current biggest blocker and next three concrete actions.
Use the title above as the desired conversation name. If you cannot actually rename this native conversation using a supported UI action, say TITLE_MANUAL_REQUIRED rather than claiming it was renamed.
When the conversation URL is actually available, record/confirm it through the authorized role SITREP GitHub workflow. Do not invent URLs.
AION ROLE LAUNCH END
```

## General placeholder map
`{role_id}` -> `ROLES.json.roles[].id`
`{title}` -> `display_title`
`{workspace_dir}` -> `workspace_dir`
`{bootstrap_path}` -> `bootstrap_path`
`{sitrep_path}` -> `sitrep_path`
`{optional_launch_prompt_path}` -> `optional_launch_prompt_path`
`{project}` -> user-confirmed actual Project (if available).
Do not place full unbounded GitHub file contents or conversation transcripts in the prompt. A single bootstrap message is a context *manifest*, then the agent fetches only relevant files.

## Manual initiation without extension
1. Open a **new** ChatGPT chat inside the intended AION Project.
2. Paste the generated bootstrap message above (or first `AION:08` if PROJECT-ROUTER-INSTRUCTIONS.md was added to project instructions).
3. Observe the role's fetched-file acknowledgment and any access blocker.
4. Rename the native conversation from its visible menu to `AION — 08 Z-FORGE`, if not already correct.
5. Supply real chat URL to the role SITREP.
