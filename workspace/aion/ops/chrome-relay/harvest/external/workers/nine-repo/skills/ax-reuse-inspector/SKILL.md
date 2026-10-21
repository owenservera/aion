---
name: ax-reuse-inspector
description: Audit AION Harvest AX exchange offers, source references, evidence states and duplicate IDs before selecting a pinned donor shortcut or Development handoff.
---

# AX reuse inspector — Harvest / Acceleration

**Trigger:** A Development NEED, recurring Harvest SITREP, or requested source-reuse shortcut needs matching against existing AX offers and pinned source references. **Do not use** as proof that a donor works, source is installed, a pack is product-wired, or the Windows/ChatGPT conversation path is accepted. Do not replace Global Research's broader ecosystem intake or Integration Manager's packaging.

## Workflow

1. Read the role's `memory/Immediate/README.md`, the latest Development working desk, and `harvest/START-HERE.md` and `harvest/EXCHANGE.md`. Identify the specific AION NEED and avoid re-cloning or recreating existing matrices.
2. From the **AION repository root**, run the read-only script:
   - `node workspace/aion/ops/chrome-relay/harvest/external/workers/nine-repo/skills/ax-reuse-inspector/scripts/inspect-ax.mjs --topic receive.transport --json`
   - Omit `--topic` for a snapshot of all offers. Pass `--repo <path>` from a different working directory. Add `--strict-refs` only on a complete checkout; sparse checkouts can legitimately omit source files.
3. Resolve structural `errors` first; investigate `warnings` against current repository content, **not by inventing replacement citations**. Script performs no network access, source execution, or writes.
4. Choose **at most the specific offers relevant to the NEED**, inspect their true pinned donor source (from `harvest/external/sources.json`), license, negative cases and AION contract seam. Compare with existing PACKs and Development code before proposing an adaptation.
5. Provide a concise `NEED → pinned module/path → what work it may eliminate → license/dependency/safety caveat → source evidence → next Development decision`. If necessary, use an **existing AX topic** to deliver a bounded finding. Do not create a shadow tracker or automatically promote an OFFER to adopted/live.
6. End when the current need has a source-backed option or evidence is insufficient. For no material changes, no file edits.

## Evidence and permission boundaries

`readiness`, `evidence`, `adoption_status` are printed **as recorded**. They are different axes and must be checked against Development's authoritative local/test receipts. A valid source path proves a path is present in the inspected checkout, not that the code is safe, licensed for copy, currently installed, or functional. A GitHub commit does not dispatch another agent.

The skill only uses Node's standard library and the repository's existing AX file. It does not install permissions, run donors, activate ZCode/OpenCode, access browser sessions, call the Bus, or write user files. Observe owner prohibition on Playwright/Puppeteer. Use the peer Toolsmith `verification-proof` skill for separate actual verification needs.

## Validation and recovery

- `node --test workspace/aion/ops/chrome-relay/harvest/external/workers/nine-repo/skills/ax-reuse-inspector/tests/inspect-ax.test.mjs`
- `node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs validate workspace/aion/ops/chrome-relay/harvest/external/workers/nine-repo/skills/ax-reuse-inspector/SKILL.md`
- Exit **0** = structurally valid, warnings may exist; **1** = structural errors or `--strict-refs` warning; **2** = invalid arguments or unreadable path. Treat missing source in sparse checkouts as warning, not proof of removal.
- If current AX schema evolves, update the deterministic inspector **with regression fixtures** rather than silently discarding unknown fields.

**Deployment reality:** `opencode.jsonc` at repo root already declares this role's `skills/` source for OpenCode V2. This makes the committed skill *eligible for discovery when a compatible OpenCode instance uses that config*, not verified host discovery/activation. ZCode requires separate local import/enable and a real invocation receipt. Check the shared builder's V2 references before adapting harness paths.
