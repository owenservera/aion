// AION Chrome Relay Station — role registry.
//
// Static mirror of workspace/aion/ops/chrome-relay/role-launcher/ROLES.json
// (schema aion.role-launcher/0.1, version 2026-10-16, role_count 8).
// An unpacked extension cannot read the repository at runtime, so the registry
// is duplicated here deliberately and kept to the fields the console renders.
//
// Role count is 8. Other AION documents in this directory still say "five".
// ROLES.json is authoritative. If this list and ROLES.json ever disagree,
// ROLES.json wins and this file is wrong.

export const ROLE_SCHEMA = 'aion.role-launcher/0.1';
export const ROLE_REGISTRY_VERSION = '2026-10-16';
export const ROLE_COUNT = 8;

/**
 * launch_policy values matter to the UI: a role whose policy requires owner
 * confirmation must never be presented as launchable-without-a-gesture.
 */
export const ROLES = Object.freeze([
  {
    id: '01',
    code: 'DASHBOARD',
    display_title: 'AION — 01 DASHBOARD',
    short_title: '01 DASHBOARD',
    purpose: 'Dashboard and Tracking',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/01-dashboard-tracking',
    bootstrap_path: 'workspace/aion/sessions/roles/01-dashboard-tracking/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/01-dashboard-tracking/SITREP.md',
    optional_launch_prompt_path: null,
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '02',
    code: 'PLANNING',
    display_title: 'AION — 02 PLANNING',
    short_title: '02 PLANNING',
    purpose: 'Long-term Planning and Alignment',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/02-long-term-planning-alignment',
    bootstrap_path: 'workspace/aion/sessions/roles/02-long-term-planning-alignment/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/02-long-term-planning-alignment/SITREP.md',
    optional_launch_prompt_path: null,
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '03',
    code: 'COS',
    display_title: 'AION — 03 CHIEF OF STAFF',
    short_title: '03 CHIEF OF STAFF',
    purpose: 'Chief of Staff and Operations',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/03-chief-of-staff-operations',
    bootstrap_path: 'workspace/aion/sessions/roles/03-chief-of-staff-operations/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/03-chief-of-staff-operations/SITREP.md',
    optional_launch_prompt_path: null,
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '04',
    code: 'EFFICIENCY',
    display_title: 'AION — 04 EFFICIENCY',
    short_title: '04 EFFICIENCY',
    purpose: 'OpenCode Output and Team Efficiency',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/04-opencode-output-efficiency',
    bootstrap_path: 'workspace/aion/sessions/roles/04-opencode-output-efficiency/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/04-opencode-output-efficiency/SITREP.md',
    optional_launch_prompt_path: null,
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '05',
    code: 'COC',
    display_title: 'AION — 05 CHIEF OF CHIEFS',
    short_title: '05 CHIEF OF CHIEFS',
    purpose: 'Chief of Chiefs',
    launch_policy: 'new_session_requires_owner_confirmation',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/05-chief-of-chiefs',
    bootstrap_path: 'workspace/aion/sessions/roles/05-chief-of-chiefs/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/05-chief-of-chiefs/SITREP.md',
    optional_launch_prompt_path: null,
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '06',
    code: 'TOOLSMITH',
    display_title: 'AION — 06 TOOLSMITH',
    short_title: '06 TOOLSMITH',
    purpose: 'Tools and Integration',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/06-tooling-integration-engineer',
    bootstrap_path: 'workspace/aion/sessions/roles/06-tooling-integration-engineer/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/06-tooling-integration-engineer/SITREP.md',
    optional_launch_prompt_path: 'workspace/aion/sessions/roles/06-tooling-integration-engineer/LAUNCH-PROMPT.md',
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '07',
    code: 'INTAKE',
    display_title: 'AION — 07 INTAKE',
    short_title: '07 INTAKE',
    purpose: 'Technical Proposal Intake',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/07-proposal-intake-commons',
    bootstrap_path: 'workspace/aion/sessions/roles/07-proposal-intake-commons/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/07-proposal-intake-commons/SITREP.md',
    optional_launch_prompt_path: 'workspace/aion/sessions/roles/07-proposal-intake-commons/LAUNCH-PROMPT.md',
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  },
  {
    id: '08',
    code: 'Z-FORGE',
    display_title: 'AION — 08 Z-FORGE',
    short_title: '08 Z-FORGE',
    purpose: 'Z.ai Sandbox Turn Strategist',
    launch_policy: 'explicit_user_trigger',
    launch_state: 'CONFIGURED_NOT_LIVE',
    session_url: null,
    session_url_status: 'UNKNOWN_UNTIL_ACTUAL_SESSION',
    workspace_dir: 'workspace/aion/sessions/roles/08-zai-sandbox-strategist',
    bootstrap_path: 'workspace/aion/sessions/roles/08-zai-sandbox-strategist/BOOTSTRAP.md',
    sitrep_path: 'workspace/aion/sessions/roles/08-zai-sandbox-strategist/SITREP.md',
    optional_launch_prompt_path: 'workspace/aion/sessions/roles/08-zai-sandbox-strategist/LAUNCH-PROMPT.md',
    context_scope: 'BOOTSTRAP+SITREP+relevant linked skills'
  }
]);

export function getRole(id) {
  return ROLES.find((role) => role.id === id) || null;
}

/**
 * Roles that carry an owner-confirmation gate. The panel must render these as
 * blocked pending approval, never as ready to fire.
 */
export function ownerConfirmationRoles() {
  return ROLES.filter((role) => role.launch_policy === 'new_session_requires_owner_confirmation');
}