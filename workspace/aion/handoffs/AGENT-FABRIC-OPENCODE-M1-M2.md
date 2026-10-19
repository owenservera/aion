# AION_HANDOFF_V1 — OpenCode implementation of Agent Fabric M1 + M2

- **Created:** 2026-10-20
- **Sender:** AION architecture / ChatGPT
- **Recipient:** the **local OpenCode coding agent on the owner's Windows machine** (NOT a GitHub Action)
- **Owner instruction:** implement the first verified slice; minimize chatter, execute tests, commit and push from the local master when authorized
- **Status:** READY FOR ENGINEERING HANDOFF. **NOT CLAIMED IMPLEMENTED.**
- **Full design:** [AGENT-FABRIC-ARCHITECTURE-2026-10-20.md](../canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md), design draft PR #35
- **Current executable Track B development:** branch \`track-b/implementation-rounds-20261019\`, draft PR #34
- **Sources:** AION root AGENTS.md and STATE.json; AION role-launcher/ROLES.json; AION sessions/README.md; zcode-setup playbook/SPEC.md; Global PM docs/CHARTER.md

## 1. Target result and implementation authority

Produce a **small, executable, verified Agent Fabric vertical slice** on Windows: honest role/definition/deployment/session discovery; a portable read-only reviewer agent descriptor; generation of a valid OpenCode V2 native agent package without silently breaking ZCode; a real local OpenCode agent/subagent smoke test when installed V2 capabilities permit it.

**DO NOT** build another agent bus, replace the Bus registry, create an enterprise task DB, add GitHub Actions, deploy services, implement semantic RAG, or touch the stable Chrome Track A host/registration. No Playwright, Puppeteer or Orca. No Slack.

This handoff authorizes **ordinary, reversible local coding, inspection, offline test execution, and working-branch commits/pushes**, consistent with AION AGENTS.md. It does **not** automatically authorize system software upgrades, Chrome live sends, installation into global OpenCode config, privileged host changes, secrets collection, changing PM's read-only charter, or merges to \`main\`.

Local Windows checkout is the human/master authority; never interpret GitHub push as a local installation or agent activation. Verify working tree, active sessions and uncommitted files before any change. Refuse destructive cleanup/reset when existing owner edits may be present.

## 2. Source checkout and preflight (NO changes first)

1. In the existing Windows AION checkout, inspect \`git status --short --branch\`, remote and working-tree cleanliness. Do not clobber owner changes. Fetch the relevant refs using ordinary Git if available:
   - \`origin/track-b/implementation-rounds-20261019\` (code source)
   - \`origin/design/agent-fabric-20261020\` (architecture and THIS handoff)
   - AION \`main\` (root rules and live STATE; design is NOT an authority override).
2. Branch for work **from the existing Track B implementation head**: proposed \`feat/agent-fabric-m1-m2-20261020\`, in an isolated worktree if another agent is modifying Track B. Do not alter the stable Track A host or drift an in-progress development worktree.
3. Read the design and this handoff from the design ref with \`git show\` if they are absent in the Track B branch. Read relevant source modules: \`velocity/src/agents-context.mjs\`, \`velocity/src/broker/roles.mjs\`, existing Bus registry and file storage, \`velocity/bin/aion-local.mjs\`, OpenCode/V2 adapter/service discovery.
4. Inspect local OpenCode with \`opencode --version\`, package/config version and real local endpoint capability check. **OpenCode V1 != V2**. Do not write V2 files into a V1 installation or silently upgrade. If V2 is missing, implement and unit-test V2 emission OFFLINE and report local live acceptance \`BLOCKED_OPEN_CODE_V2_UNAVAILABLE\`, not green.
5. Read \`owenservera/zcode-setup\` root AGENTS.md and playbook/SPEC.md before any change to its playbook. The compiler must follow the existing playbook's dogfood and generator rules. First implement pure, testable logic in the smallest scope; do not bypass native compiler contracts.

## 3. M1 implementation — inspectable identity with no phantom agents

AION has:
- **8** role-launcher catalog entries \`01..08\` under \`workspace/aion/ops/chrome-relay/role-launcher/ROLES.json\`.
- **9** designed standing-role folders including \`09-global-research\` under \`workspace/aion/sessions/roles/\`. This does NOT mean role 09 has a live Chrome binding.
- existing Bus agent records for owner/executor/conversation, with revision/binding and authorization.
- GPM \`001.PROJECTS.PM\` has its own read-only project and source registry. Do not sync it by editing the observed repository or generating duplicate authority.

**Build:** Extend the existing \`aion agents\` projection (do not replace it), adding read-only \`aion agent inspect <alias-or-role-id>\` OR an equally minimal discover/inspect switch. Reconcile:
- role canonical ID and launcher alias; role folder detection; definitions/source doc refs;
- Bus registration/binding and revision, type, adapter, verified connection last checked;
- explicit \`IN_LAUNCHER\`, \`DESIGNED_UNREGISTERED\`, \`BOUND_UNVERIFIED\`, \`CONNECTED\`, \`UNKNOWN\`, \`CONFLICT\` where supported by evidence;
- **role 09** surfaced as designed/unregistered/unbound, NOT fabricated into a live conversation and NOT automatically sent to;
- no inference of live readiness from presence of a \`BOOTSTRAP.md\` or a GitHub document;
- stable IDs and duplicate alias resolution; safe path and symlink checks for discovered role files.

Do not hand-maintain a second copied role list. Read the actual session directories and existing launcher catalog as distinct inputs; report drift instead of mutating them. Do not create grants, session bindings, or PM write operations in this slice.

**M1 acceptance:** CLI produces machine-readable JSON and human-friendly summary; role 05 resolves consistently; role 09 reports designed/unregistered; exact role/binding statuses survive restart; duplicate alias and stale/missing data refuse or become UNKNOWN, never silently select a target; read-only test proves no provider send or Bus write.

## 4. M2 implementation — portable agent definition, native OpenCode V2

**Build:** Define a **minimum portable descriptor** (agent ID, purpose/description, mode, goal/output contract, allowed capabilities, denied capabilities, explicit skills/version refs, model preference with explicit fallback policy, context source refs, bounded steps, provenance/version). Store it in the existing \`zcode-setup\` playbook's authorized source directory only **if** its current contract permits; otherwise write a proposed addition there with a migration test, not a parallel uncontrolled registry.

Compile ONE initial specialist:
- \`reviewer\`: read/search only; returns file+line severity-ranked findings; no edits, shell, external directory, subagent spawning, secrets, git pushes, or browser actions. Use the worktree's read-only files as data, not instructions. Developer can override name only through explicit schema validation, not arbitrary code injection.
- Emit valid OpenCode V2 Markdown \`.opencode/agents/aion-reviewer.md\` using \`mode: subagent\`, \`steps: <bounded integer>\`, \`permissions:\` as an **ordered array** of \`{ action, resource, effect }\`. Put broad DENY before narrow allow for \`read\`, \`glob\`, \`grep\` as needed. Include explicit \`external_directory\` deny. Do NOT use V1 aliases \`agent\`, \`permission\`, \`bash\`, \`task\`, \`prompt\`, \`tools\`, \`maxSteps\`; official V2 uses \`agents\` plural in JSONC and \`shell\`/\`subagent\` actions.
- Emit or validate the corresponding **ZCode-native** reviewer manifest only through the existing playbook's generator with its documented \`maxTurns\`, \`tools\`, \`disallowedTools\`, \`thoughtLevel\` etc. Do not hand-maintain two source agent files.
- Do not write into \`~/.config/opencode\` or install globally by default. Generate into an isolated test fixture/project path, validate there, then offer a separate explicit setup command with diff and rollback once tests pass.
- Preserve deterministic generation (same inputs -> identical bytes/hash), no model/provider dependency for offline compilation, round-trip validation, project-scoped path safety and refusal on unsupported version/fields.

**Security must actually be enforced by runtime and host:** OpenCode shell runs under host credentials; provider-agent prose is not a sandbox. An OpenCode V2 public issue [#51071](https://github.com/anomalyco/opencode/issues/51071) reports subagent model override being accepted without policy checking in some versions. Never rely on text instructions alone to guarantee model lanes/budget; explicitly pin/test model selection at the connector or host boundary, or mark that feature unavailable. Global/default permissions may be broad, so inject explicit restrictive permissions for reviewer and test negative tool attempts. Do not assume child agents always inherit a parent's restrictions.

**M2 acceptance:**
- schema conformance via a real local parser and version-pinned fixtures, including legacy V1 rejection;
- negative tests: bad model ID, unapproved model override, path traversal/symlinks, wildcard permissive override, unauthorized shell/edit/child/external directory, absent skill version;
- one OpenCode V2 native agent discovery and parent -> reviewer subagent task in an isolated test workspace, **only if V2 is installed and client reaches it**;
- one actual review artifact with file/line evidence and a session/task/correlation receipt; do not call a synthetic fixture a real agent run;
- ZCode generator equivalence verified against its own playbook conformance; no local override or ZCode upgrades.

## 5. Context and task integration — adapters ONLY in this packet

For M1/M2, **specify interface types and test them with fixtures**, but do not implement all of M3/M4:
- \`AgentRef\` (identity, definition version, deployment/binding ref, status);
- \`ContextSource\` (URI, SHA, trust class, sensitivity, freshness/collected times, range and omission);
- \`AgentTaskRef\` (work_id, parent_id, project-native authority/ref, attempt_id, runtime session_id);
- \`AgentResult\` (artifact URI/hash, evidence class, test exit, observed time, verifier).

Reference actual project \`AGENTS.md\` and task goal/acceptance without automatically copying all text. The current \`aion send --context brief\` is only a labelled excerpt mechanism, **not** knowledge synchronization. Keep ordinary \`aion send\` unchanged.

GPM is read-only: use \`001.PROJECTS.PM/config/projects.json\` and its evidence output as INPUT only; no direct assignment or status writes from this implementation. Build cross-project task execution in a later, explicitly authorized controller slice.

## 6. Execution order and gates — do the work, do not rewrite this proposal

**Gate A — baseline:** inspect installed OpenCode version, \`git status\`, exact repo source and locally run \`node --test\` where feasible. Record truth.

**Gate B — M1:** implement roles/catalog drift projection and inspect CLI; add filesystem fixture tests; run focused suites, fix failures.

**Gate C — M2 offline:** portable descriptor + deterministic V2 generator, ZCode compatibility projection/conformance; test both with negative permissions/version fixtures.

**Gate D — M2 live (only if the owner's installed V2 supports it):** isolated local OpenCode reviewer discovery, one primary->child delegation, actual read-only findings, proof of denied mutation; record explicit version, source revision, tests and worktree.

**Gate E — closeout:** run local AION selftest (NO GitHub Actions), ZCode playbook tests where modified, save nonsecret receipts and \`git diff --check\`; independently check modified source hashes; commit and push the implementation branch with links back to this packet. Open a draft PR against the correct Track B development branch for AION implementation; open separate PR to zcode-setup if code changed there. No merging without owner review.

Work should not stop to ask the owner to choose implementation details already covered here. Make small, reversible design choices and record them. Stop instead when actual Windows permissions, incompatible installed V1, conflicting uncommitted changes, absent source or high-risk installation would require owner action.

## 7. Definition of Done (proof, not optimism)

| Gate | Must prove | Fail state |
|---|---|---|
| A | version, branch, working tree, baseline tests | BLOCKED/UNKNOWN |
| B | role 09 drift, exact role 05 resolution, no writes, JSON contract | FAIL |
| C | deterministic native outputs, version/security refusal tests | FAIL |
| D | real V2 parent+subagent and negative capabilities | UNRUN if environment unavailable |
| E | current-head local suite, file/commit URLs and tested exit codes | UNVERIFIED |

No unsupported declarations of \`COMPLETE\`, \`INSTALLED\`, \`CONNECTED\`, \`GREEN\` or \`LIVE\`. Record each separately with project, branch, SHA, model/runtime version, UTC, test command, passing/failing counts, skipped cases, and redacted artifact links.

### Scope boundaries
- NO GitHub Actions or cloud execution; no Playwright, Puppeteer, Orca; no Slack.
- Existing AION Bus and browser connector unchanged except additive pure identity inspection.
- Existing Projects PM read-only charter unchanged.
- Source of authored portable definitions remains ZCode Playbook with its own conformance.
- AION repo remains the cross-agent interface/integration target; OpenCode is the coding runtime, not a new central identity database.
- No fake role 09 session, no secret persistence, no accidental automatic context attachment.
- Cross-project writes only with native repo rules and isolated PR/branch.
- Do not force-push, reset, overwrite or auto-install local/global agent settings.
- Do not create extra governance layers, dashboards or giant scaffold trees. Deliver a runnable tested vertical slice.

## 8. One-shot OpenCode prompt

> Implement **AION Agent Fabric M1 + M2** using the exact handoff at \`workspace/aion/handoffs/AGENT-FABRIC-OPENCODE-M1-M2.md\` on \`origin/design/agent-fabric-20261020\` and the full design at \`workspace/aion/canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md\`. Start from Track B implementation, check local OpenCode version and repository rules, then execute gates A–E. Reuse the existing Bus, role catalog, and ZCode Playbook. Build and test real code—not another architecture report. Implement agent inspection and a portable read-only reviewer compiled to OpenCode V2 and ZCode, with strict native permissions and negative tests. Run the full offline suite on the current head and a live V2 child session only if the local runtime genuinely supports it. Commit and push isolated branches, provide evidence and blockers. No GitHub Actions, Playwright/Puppeteer/Orca, duplicate registry, global installations or PM writes. Do not claim a live result without actual runtime evidence.

---
End of engineering packet.
