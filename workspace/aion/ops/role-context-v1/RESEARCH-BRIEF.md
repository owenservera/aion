# AION Role Context V1 — Mobile-first isolation and role instantiation research
Status: RESEARCH/OPERATING SEED, not product feature deployed.
Date: 2026-10-16.
**Accountable specialist:** Role 06 TOOLSMITH (tooling, app behavior, current ChatGPT memory/session mechanics).
**Review partner:** Role 02 Planning (role boundaries and evaluation).
**Coordinator:** Role 03 Chief of Staff (activation and acknowledgment).
**Executive acceptance:** Role 05 Chief of Chiefs.
**Dashboard:** Role 01 optional status display; NOT a gate.
**Naming note (2026-10-19):** "V1" in this brief means **RC-1**, "V2" means **RL-001**; neither is Bus V1/V2 ([decision](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md)).
**Separate RL-001 (formerly "V2"):** [Chrome ACP Role Launcher RL-001](../chrome-relay/role-launcher/README.md), [issue #22](https://github.com/owenservera/aion/issues/22).
Scope: The user and ChatGPT **mobile app only**. No Chrome extension, developer tooling, shell, automation, new platform or hidden API required to test V1. GitHub workspace is the role canon, accessed through connected tools when present or explicit text/file when not.

## Core research question
How can one user on mobile create, launch, resume and switch specialized ChatGPT employee conversations with the smallest possible contamination from unrelated context, truthful acknowledgment of what was loaded, correct stable identity and minimal manual effort? Distinguish what prompts can influence vs what product settings or new conversations actually isolate. No claim that a role prompt creates native chat, renames native title or clears the existing chat history.

## Current account-agnostic product facts from official OpenAI documentation (check freshness before rollout)
1. **Project-only memory** can reference other conversations in the same Project, but not conversations outside it. It is a Project boundary, NOT a per-employee boundary. Do not promise workspace-only in a shared AION Project even with Project-only enabled.
   Source: https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt ; https://help.openai.com/en/articles/8590148-memory-in-chatgpt
2. **Temporary Chat (Unpersonalized)** does not use memory, custom instructions or plugins; its initial personalization choice must be selected before first message; it may be saved later. Because it disables plugins, loading a private repo via GitHub connector may be unavailable in that mode. Check UI before assuming. It can still receive explicitly pasted workspace contents. Source: https://help.openai.com/en/articles/8914046
3. **Standard chats** can have memory/custom instructions personalization and cross-chat context depending on user/Project settings; project instructions alone do not guarantee that memory of other chats is never used. Source: https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt ; https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
4. **Conversation prompts cannot delete previous turn history from the same chat**, regardless of 'forget previous role' wording. Context reset is a cooperative behavioral boundary, not a proven low-level memory reset.
5. A keyword sent to an **existing** ChatGPT chat cannot natively create another chat and rename it through the ordinary text-response channel. First-message keyword routing can change current-chat behavior only if relevant role instructions are present.
6. Role title self-description is not verified native conversation renaming; title must be changed through actual supported user UI unless separately supported capability is verified. Project membership and Project instructions must be checked from the actual conversation UI; do not assume from a repo path.

## Four distinct use cases / acceptance standards
**A — Fresh clean room / zero external context:** Start a new Temporary Chat in Unpersonalized mode (if available) and paste self-contained `BOOTSTRAP` plus only required role resources; use if true minimal personalization matters more than connector access and persistence. Do NOT assume it can use connected GitHub or is listed durably in history. The initial prompt and user-provided text are still context, as are system-level instructions. If retaining the worker is essential, test 'Save chat' behavior and memory effects before relying on it.
**B — Launch named employee with dynamic GitHub:** Start a **new standard conversation** and send `AION:NN` with explicit resolver/source paths, or full one-message bootstrap if router instructions are not loaded. Use connected GitHub tool to read the role's required BOOTSTRAP/AGENTS/WORKSPACE/SITREP/skills. The worker must provide evidence of actual reads, active role, workspace-only operating boundary and external-memory caveat. Treat role isolation as BEST EFFORT if account memory is enabled; **inside a shared AION Project, other same-Project chats are potentially retrievable**.
**C — Hot-switch active role in existing conversation:** Operator enters `AION/SWITCH:NN`. Assistant checkpoints prior role task/state (only if requested/authorized), marks old role SUSPENDED in *behavioral* state, fetches target role workspace (never assumes cached data), acknowledges target role and uses only target role materials for subsequent task framing. It must explicitly say **HISTORY_RETAINED**: prior messages are still conversation history, and memory may still apply. For privacy/conflict/high-assurance work, STOP and recommend a fresh chat instead of claiming actual reset.
**D — Resume existing role after time/changes:** Reopen same native chat when convenient, issue `AION/RESUME` to check current canonical SITREP, bootstrap and last actual evidence. Or create fresh standard chat, send `AION:NN --resume` with canonical source and newest checkpoint; do not duplicate ongoing work or assume prior session's state is globally known. Reopen original retains prior conversation history; fresh resume uses only checkpoint and any model memory within current product controls.

## Isolation levels (use explicit names)
- `L0_ROLE_ONLY`: same chat, role-switch instructions; history remains.
- `L1_NEW_CHAT_STANDARD`: fresh chat transcript, but memory/project context may reach other history depending on settings.
- `L2_PROJECT_BOUNDARY`: dedicated Project with Project-only memory can exclude other Projects/outside memory, but SAME-PROJECT chats may contribute. May isolate each employee with one Project per role when operationally worth it; cost is manual Project management and duplication. Requires actually checking/setting Project mode, not assuming.
- `L3_TEMP_UNPERSONALIZED`: new temporary unpersonalized chat; no saved memory/custom instructions/plugins, but less persistence and possible no connected GitHub. Load explicit workspace text; still not a policy/system context reset.
No level promises that assistant or platform internal mechanics are literally stripped to 'only workspace'; enforce *user-level sources and observable behavior*.

## Practical v1 test plan (mobile only, no install)
T1. Create brand-new normal chat, send first-message `AION:06` with bootstrap manifest; independently confirm exact fetched files or connector blocker.
T2. Test shared Project chat with Project-only enabled if owner permits, ask for unrelated same-Project fact; assess unexpected retrieval, without leaking sensitive details or intentionally copying outside work.
T3. Create Temporary Unpersonalized chat and paste minimal role bootstrap (no plugin); evaluate isolation, persistent title/history and any save-as-regular option.
T4. In non-sensitive test conversation, send `AION/SWITCH:08`; verify correct role response BUT mark HISTORY_RETAINED and demonstrate no claim of true wipe.
T5. Reopen and `AION/RESUME`; verify source freshness/role ID and correct next action without fabricating worker ACKs.
T6. Compare wrong-role activation, unknown codes, quote/codeblock false triggers, stale repo paths, conflicting Project memory, and manual native title rename.
T7. Check 8 role-specific contexts for wrong workspace references and measurable steps (new chat taps, amount typed, errors).
T8. Test actual Android app UI options; distinguish documented behavior from observed account features; note options may vary.

## Decision artifacts required from TOOLSMITH
1. A table of product behaviors: documented, user-observed, unverified, unavailable.
2. Exact mobile flows for A/B/C/D, including steps and visible UI state.
3. One canonical command grammar and a short safety/ambiguity policy.
4. Evidence-backed isolation matrix incl. memory, Projects, custom instructions, Temporary Chat, connector/tool availability and title control.
5. Three fallback launch packets: minimal code word, GitHub resolver message, fully self-contained standalone bootstrap.
6. First reproducible test execution receipts with pass/fail and truthful limitations.
7. A precise V1 completion gate and explicit handoff to V2 RL-001 only for functionality V1 genuinely cannot provide.

## V1 acceptance
Not 'true no other context loaded' unless platform explicitly proves it for the chosen setting. Rather: role behaves exclusively according to selected workspace; no unrelated assumptions in 3 contrasting test queries; actual current workspace files were read (or explicit full paste); native chat identified and manually renamed; historical-context caveats reported truthfully; fresh clean-room method demonstrably functions with pasted standalone role input. Only a real live mobile test may mark V1 VERIFIED.

## High-value conclusion to test
For fastest durable employees, new regular chat + pinned GitHub workspace + exact first-message bootstrap + manual title likely wins on usability, but it is **behavioral role isolation, not perfect underlying context isolation**. For strictest app-level personalization separation, use unpersonalized Temporary Chat with standalone pasted content, accepting limitations. In-chat switches are cheaper but weakest isolation.
