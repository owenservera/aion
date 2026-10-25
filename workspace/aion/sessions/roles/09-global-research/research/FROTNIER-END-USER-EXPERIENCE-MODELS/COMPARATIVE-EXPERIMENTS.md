# Comparative experience experiments — light, falsifiable protocol

**Purpose:** reveal how AI product shells determine the shape and usefulness of an interaction, while guarding against attributing all differences to the LLM.

## Minimal observation procedure

1. Choose a single **personal task and the same input fixtures**, sanitized and non-sensitive.
2. Record date/time, platform URL/app build if visible, device, browser, account tier, enabled features, visible model selection (and whether actual model identity is unknown).
3. Record exact prompt and source/input manifest. Keep fixture stable across product surfaces.
4. Record the result at three levels: semantic content, visible/rendered UI components, and export/copy/download if available.
5. Measure observable friction: clicks/interventions, time-to-useful-result, editability, context recovery, provenance, interruptions, workarounds, cost/limits.
6. Repeat if comparing reliability; identify hidden tool/feature/account differences. Be candid about confounding.
7. Save user-selected screenshots or descriptions **only with permission** and without copying private conversations into a public repository.
8. State the smallest decision this evidence supports, and what would falsify the conclusion.

No login automation, no Playwright/Puppeteer, no speculative internal API capture or source exfiltration.

## Three tiny test cases

| Experiment | Shared input | What makes the UX meaningfully different? |
|---|---|---|
| A. Architecture as manipulable object | 12-node/15-edge anonymized system map | Editable graph vs static diagram vs prose; links to evidence; revise one wrong edge |
| B. Research provenance | 5 approved references with one contradiction | Source grounding; citations; reopening raw evidence; preserving competing claims |
| C. Stateful task | 5-step personal workflow interrupted after step 2 | Resume and memory; permission boundaries; actual work versus simulated work |

## Attribution matrix

| Observation | Plausible layer | Needed check |
|---|---|---|
| One UI shows a chart; another gives Markdown | renderer / available charting tool / prompt / model | Does same content export consistently? |
| One app retrieves project files automatically | product context assembly + connectors | What exact files were accessible? |
| One app changes a connected service | tools + delegated permissions + agent execution | Exact action receipt and rollback? |
| One answer differs materially in reasoning | model, prompt, retrieval, safety and orchestration | Hold as many factors fixed as possible |
| An artifact survives and can be revised | product object lifecycle | Does revision preserve structure/data? |

## Observation packet

Use [experience-observation.schema.json](experience-observation.schema.json) as a validation-oriented field guide. IDs must refer to dated tests; no placeholders marketed as measured evidence. A project-specific recommendation goes to its native task owner through [AION RESEARCH #30](https://github.com/owenservera/aion/issues/30); do not create shadow tasks.

## Acceptance for first research output

One **real** three-platform comparison or a smaller documented two-platform pair, **one repeated task**, screenshots/data only with permission, at least two non-LLM differentiators supported by observed interaction, and one recommendation usable by a person. No production product code from the research folder.
