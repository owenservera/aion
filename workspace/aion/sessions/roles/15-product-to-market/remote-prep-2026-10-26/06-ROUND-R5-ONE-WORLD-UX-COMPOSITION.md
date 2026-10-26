# R5 — One-World UX Composition & Task Contracts (READY PROMPT)

**Thinking effort: HIGH.** **Executor:** ChatGPT PRODUCT AGENT UX/integration analyst. **Work mode:** remote GitHub source and deterministic acceptance planning; report in AION only. **Not launched when prompt is prepared.**

## Copy-ready launch directive

`#AION @PRODUCT-AGENT +/EXECUTE /R5-ONE-WORLD-UX`

Think at **HIGH** effort. Audit the **current actual single-app user experience** in `owenservera/vivim-harness` main against P1 J1 RETURN → J2 ORGANIZE → J3 FIND → J4 TAKE and current peer `Workspace`, `Saved`, `Projects`, `Notes`, `Find`, `Transfer`, `Relations`. Source-based, no browser screenshot or live UI success claims. **Do not run local models, alter Harness files, take over Chrome or create a parallel frontend**. Save and verify only under AION Role 15 remote-prep.

**Mission:** remove the gap between independently working endpoints/components and a genuinely usable human flow. This is not a new visual design exercise: find missing actions, inconsistent object ownership and dead ends in *existing* world UI/API. The owner wants **fewer clicks, fewer abstractions, more reliable tangible product**.

Use source and tests: `src/studio/ui/chat.html`, `world-view.mjs`, `chat.mjs`, `src/studio/world-service.mjs`, `world-relations.mjs`, `world-search.mjs`, `world-transfer.mjs`, `src/studio/integration-hub.mjs`, `test/unit/world-ui*.test.mjs`, `world-journeys.test.mjs`, `world-search.test.mjs`, `world-import-hardening.test.mjs`. Inspect current commit/source first; newer Workspace peer-reader commits `1b59837` and `01c290a` should not be accidentally marked missing, and `bb9b025` already emits `partPath`.

**Mandatory task-state map:** for each J1–J4 and the **combined** journey, provide exact start screen/action; UI handler/function; HTTP method/path and payload; backing record ID; user-visible success/failure; persistence boundary; exact next navigation; blockers or extra cognitive overhead; test/fixture evidence tier. Include empty first use, offline/no provider, partial native content, missing source, imported foreign identity, stale index/hit, mid-import partial `200`, simultaneous note save/CAS, and save selection→project→re-find exact part.

**Focus points (prove from source):**
1. Can a user create a **selection from a visible saved message part** and immediately add it to a project without a seeded selection or API/CLI helper?
2. Can an ordinary user navigate from any project/note/object/reference to original conversation, and back, preserving source qualification? Does peer Workspace reduce or increase complexity?
3. Can a user understand **source-of-record vs imported vs derived vs user-authored** without seeing raw internal IDs or giant technical controls?
4. Are `Find` part focus and Workspace reader actually reached from emitted service responses? Design the smallest cross-surface integration test without changing search engine.
5. Identify underdeveloped first-use, keyboard/focus, error-state and manual browsing issues that fake DOM tests cannot prove.
6. Contrast **small patch in existing /chat** versus donor UI adoption (e.g. vivim-final) with a precise cost/risk rationale. Prefer no transplant.

**Deliverables:** `R5-HUMAN-JOURNEY-COMPOSITION-MAP.md` and, if useful, a concise `R5-UI-CONTRACTS.yaml` with exact event/action/API/target/observable state. Rank **five or fewer** independently deliverable UI increments by user value, code ownership, test specificity and dependencies. Assign W/C/Q/F IDs from existing registries, not a competing task system. Document a single 10-minute end-user demonstration script **without claiming it was run**. Commit and verify in AION only.

**Done means:** OpenCode can implement the missing minimal UI glue by referencing exact handlers, routes and tests; the full personal-world journey is clearly distinguishable from a collection of isolated passing APIs.

## Scope boundaries

- **R5 owns:** UX navigation, human task contracts, visible errors, composition and accessibility proof requirements.
- **R5 does not own:** rewriting capture/evidence formats (R4), security policy and hardening releases (R6), browser actor upgrades, new React app.
- **Inputs:** [Integration control](01-INTEGRATION-CONTROL-PACK.md), [Closure queue](03-ACCEPTANCE-SECURITY-CLOSURE-QUEUE.md), [P3 experience contract](../specialists/experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md).
