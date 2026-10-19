# AION V1 Mobile Role Context Strategy
**Owner:** Role 06 TOOLSMITH. Partner Role 02 Planning; coordinator Role 03 CoS; independent acceptance Role 05 Chief.
**Status:** SPECIFICATION + RESEARCH STARTING POINT, not verified mobile behavior on the user's device.
**Purpose:** Manual/mobile-only conversation workflows before any extension exists. This is **RC-1** (formerly called "V1" in these docs). [Chrome ACP role launcher RL-001](../chrome-relay/role-launcher/README.md) and [issue #22](https://github.com/owenservera/aion/issues/22) (formerly called "V2") are **RL-001**. Do not conflate them with **Bus V1 (commander loop)** or **Bus V2 (local executors)**, the 2026-10-19 direction in [DECISION-2026-10-19-BUS-V1-V2-DIRECTION](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). Naming note: below, "V1"/"V2" mean RC-1/RL-001.

## Read first
1. [RESEARCH-BRIEF.md](./RESEARCH-BRIEF.md) — product mechanics, four use cases, research questions, V1 acceptance and ownership.
2. [ISOLATION-MATRIX.md](./ISOLATION-MATRIX.md) — standard Project, project-only, per-role Project, temporary Unpersonalized and same-chat switch tradeoffs.
3. [MOBILE-PROTOCOL.md](./MOBILE-PROTOCOL.md) — exact keyword grammar, behavioral role switching, source acknowledgment and truthful states.
4. [FIRST-MESSAGE-PACKETS.md](./FIRST-MESSAGE-PACKETS.md) — ready-to-paste bootstrap, first-message and switching text.
5. [SEED-TESTS.md](./SEED-TESTS.md) — four manual test scripts and negative cases.
6. Role 06 existing [BOOTSTRAP](../../sessions/roles/06-tooling-integration-engineer/BOOTSTRAP.md) / SITREP.

## Executive takeaway
- Clean room = start a distinct new Temporary Chat in Unpersonalized mode; explicitly paste full role instructions. No automatic GitHub connector or guaranteed persistence.
- Durable role launch = start new standard chat, load specified canonical GitHub role workspace with connected access, manually rename. Best-effort behavioral isolation; other memory/project context may be available.
- Switch in same conversation = change current role instruction and reread target role source; cannot erase old chat messages, not strict context isolation.
- Resume = reopen role chat or fresh chat with canonical SITREP/last verified checkpoint; not autonomous cross-chat awareness.
- The model cannot create a native separate conversation or perform a native title rename merely through a textual keyword.
- Do not recommend changing memory settings for the entire Project by default; first measure what is actually accessible and how much isolation the user wants.

## Ready-to-run 30-minute pilot
1. Role 06 reads current official OpenAI help and this repo research seed.
2. On mobile user starts one standard new chat with packet 2; report exact role fetch and whether title is user-changeable.
3. On separate test (only if desired) start Temporary Unpersonalized chat with packet 3 + pasted source; compare external-memory responses.
4. In a harmless demo chat, test AION/SWITCH:08 and whether role switching clearly states HISTORY_RETAINED.
5. Role 06 posts findings, failures, additional tested options and V1 acceptance to AION repo and recommends the default app workflow.
No Chrome/Playwright/Puppeteer or external automation. No new role/extra full program needed: Role 06 already owns integration and tool behaviors.

## Handoff to V2 (RL-001)
RL-001 is extension-based Chrome keyword -> new chat tab -> bootstrap -> optional tested native title UI. It can reduce mobile taps once available on supported browser, but V1 should stand alone. V2 cannot itself promise perfect context isolation either.
