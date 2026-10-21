# OpenCode V2 skill integration — source-backed blueprint

Official documentation (check again on version changes):
- https://dev.opencode.ai/v2/docs/skills/
- https://dev.opencode.ai/v2/docs/config/
- https://dev.opencode.ai/v2/docs/permissions/
- https://dev.opencode.ai/v2/docs/agents/

OpenCode **V2** (not the incompatible V1 config contract) discovers project skills inside .opencode/skills and accepts additional source directories via the project opencode.jsonc 'skills' array. Each source root may contain named subdirectories with SKILL.md; one directory = one skill. It advertises only ID/name/description and loads full content on demand, while optional references/scripts can be read later. The path-derived directory name, not frontmatter 'name', is the operative ID. Use portable kebab-case IDs, avoid duplicates across twelve homes, and use explicit 'description' for discoverability.

This repo's root opencode.jsonc registers **all twelve agent skills directories** when the repo is the OpenCode V2 working directory. Paths are resolved from the active working directory, not necessarily the config file. OpenCode V2 also auto-discovers the master builder in .opencode/skills/aion-skill-builder. If launching OpenCode from a nested folder, verify path resolution and effective config; use an appropriate absolute/user-level source configuration if necessary. Do not blindly replace the owner's machine configuration.

OpenCode V2 permissions are ordered 'permissions' rules with action 'skill' and effect allow/ask/deny. They govern *loading the skill*, while shell/edit/network/external-directory actions retain their own host permissions. V1 'permission' and 'bash' examples are not drop-in V2 'permissions'/'shell' rules. Role skill instructions cannot override those controls.

The existing older runbooks in roles 06–09 must be **audited and upgraded in place selectively**. Some have no YAML description and may not be advertised; this is not a reason to rewrite their useful content or claim installation.

For ZCode, OpenCode V1, Claude Code or other harnesses, inspect actual installed version, agent-skill discovery locations, permission model, and bridge. Reuse SKILL.md when compatible, add a thin adapter/config only when needed, and run a small host-specific load/read/test receipt. **No automatic deployment to Windows or other harnesses has occurred merely because a Git commit exists.**
