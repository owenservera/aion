---
name: integration-seam-preflight
description: Check an Integration Manager source pack and its proposed AION insertion seam for static file presence, local Markdown link errors, path containment and evidence boundaries before handing code to Development.
---

# Integration Seam Preflight

Use when an existing Integration Manager PACK is being inspected, handed off, or considered for a **Development-selected** reuse seam, or when a SITREP/reference edit risks broken relative links. This is a targeted **read-only static check**, not a source integration, test runner, runtime validator, or second pack registry.

## Before running

1. Read current [Integration Immediate memory](../../memory/Immediate/README.md), [Development desk](../../../../../../workers/development/DELIVERABLES.md), and [single AX exchange](../../../../../EXCHANGE.jsonl); resolve actual Development selection and up-to-date status. These are authoritative, not this helper's output.
2. Check whether Toolsmith's existing \`verification-proof\` or \`tool-discovery\` skill better fits the task. Use this role skill **only** for our pack-specific source/seam/link preflight.
3. Run from the **AION repository root** in a host with Node.js available, or supply \`--root /path/to/aion\`. All commands below are read-only.

## Commands

\`\`\`sh
node workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/skills/integration-seam-preflight/scripts/preflight.mjs pack PACK-06 --seam workspace/aion/ops/chrome-relay/extension/src/providers/chatgpt/observer.js

node workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/skills/integration-seam-preflight/scripts/preflight.mjs links workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/SITREP.md

node --test workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/skills/integration-seam-preflight/scripts/preflight.test.mjs
\`\`\`

The helper emits JSON. \`source_state: FILES_PRESENT_ONLY\` proves only inspected local paths. A missing proposed seam is **information**, not permission to invent a parallel implementation. Exit 0 = static checks pass; 1 = relevant file/link problems; 2 = usage, missing repository root, traversal or filesystem-safety failure. It deliberately does not infer license compliance merely from a license filename; **inspect attribution and compatible terms manually**.

## Product handoff after preflight

Confirm exact donor pin/license and existing AION API, then provide Development **only** the selected module/symbol, destination seam, minimal dependencies, negative fixtures and commit SHA. Explicitly separate **captured**, **staged**, **Development-composed**, **named offline suite tested**, and **Windows/live observed**. A static preflight does not establish any of the latter three. Let Development own production wiring and live acceptance. Never run the helper as a prerequisite for an unrelated task or generate another pack just because its checks pass.

## Boundaries and availability

This skill reuses the [Master Skills Builder](../../../../../../../../../../.opencode/skills/aion-skill-builder/SKILL.md) and is registered as a role skill source by root [opencode.jsonc](https://github.com/owenservera/aion/blob/main/opencode.jsonc). Registration in a Git file is **not proof** that the owner's OpenCode V2 loaded it. For ZCode, a separate import under a supported \`.zcode/skills\` root and an actual invocation test are required; do not claim a local install based on this commit. No shell, filesystem edit, GitHub token, MCP, ACP, browser or Windows permissions are conferred by loading this skill.

On SITREP, reconsider this skill only if pack-preflight errors, link errors, peer feedback or harness results identify a material gap. Avoid mechanical revalidation and skill proliferation.
