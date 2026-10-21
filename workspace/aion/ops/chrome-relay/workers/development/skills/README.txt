AION Development — agent-owned skills (first substantive pass: 2026-10-21 UTC)

Owned, source-ready:
- aion-dev-build-drift/SKILL.md
  Read-only Node 22+ six-file AION Track B source-versus-unpacked-extension comparison.
  scripts/probe.mjs and scripts/probe.test.mjs: isolated positive/negative cases.
  This reduces guessing about stale copied JS during I1 registration troubleshooting.
  No browser/session/network reads; disk MATCH != running Chrome/host proof.

Reuse existing tools rather than duplicating peer skills:
- Shared skill creator/audit/validator:
  .opencode/skills/aion-skill-builder/SKILL.md
  .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs
- Toolsmith: environment-bootstrap, incident-recovery, verification-proof,
  chrome-acp-relay, acp-interop, tool-discovery, under
  workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/
- Research: 02-repo-discovery, 03-evidence-assessment, 06-cross-project-transfer,
  under workspace/aion/sessions/roles/09-global-research/skills/
- Existing product code/test commands remain canonical; no duplicate test runner
  or new grant/Bus is introduced by this skill.

Discovery/runtime:
- Root opencode.jsonc includes this role's skill root for OpenCode V2 when it is
  the effective working-directory configuration. The master builder lives in
  .opencode/skills/. Committed source and valid YAML do NOT certify actual
  OpenCode skill advertisement, effective permissions or successful invocation.
- ZCode requires separate supported workspace ~/.zcode/skills or .zcode/skills
  import/enable workflow per version; not installed, copied or verified by
  these GitHub changes. Do not overwrite owner settings.

Next highest-value LOCAL integration:
- From an actual Track B Windows-local setup receipt, run the disk drift
  comparator; check the host/worker truly loaded those bytes using existing
  Toolsmith runtime inspection; then use the fixed allow-listed account
  registration diagnostic to isolate the failure and prove one independent I1
  receive. No automatic retry or Send and no secrets/transcripts in receipts.

Capability states: committed skill source; isolated Node fixture tests; V2
registration present in GitHub; actual Windows file probe, OpenCode invocation,
ZCode import/activation and live I1 execution UNVERIFIED.

SITREP: inspect actual use and recurring corrections, latest builder contracts,
role memory/Immediate, shared intelligence and relevant peer skills. Improve
only for a demonstrated need. No quotas, duplicate registries or unattended
installation/permission changes.
