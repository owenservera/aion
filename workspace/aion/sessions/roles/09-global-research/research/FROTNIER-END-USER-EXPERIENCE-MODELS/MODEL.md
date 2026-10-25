# Frontier End-User Experience Model (FEUXM) — research ontology v0.1

**Status:** working research model, not an official standard or reverse-engineered description of any vendor's internals.

## Thesis

An answer generated through an AI product is not determined solely by the chosen LLM. A useful starting causal decomposition is:

```text
Observed end-user experience E =
  f(underlying model M,
    hidden and visible application orchestration O,
    context assembly and persistence C,
    tools, retrieval and execution T,
    interaction affordances and workflow W,
    output structure and renderer R,
    safety / permissions / quota constraints P,
    device, latency and environment D,
    user objective, habits and expectations U)
```

These variables interact. This is a **conceptual framework**, not an empirically estimated equation. Do not pretend product and model effects are independently identifiable if the same model is unavailable on both surfaces.

## Distinct experience axes

| Code | Layer | What changes for the human | Example observation to record |
|---|---|---|---|
| X01 | Entry / conversation grammar | chat-first, document-first, canvas-first, search-first, agent-first | How many actions before first useful result? |
| X02 | User control and agency | prompt, gesture, drag, select, edit, command, approvals | Can I directly manipulate the result? |
| X03 | Context boundary | thread, project, workspace, cross-chat memory, source links | What context was actually available? |
| X04 | Navigation / discoverability | sidebar, history, search, branches, tabs, artifact catalog | Can I find and resume a prior decision? |
| X05 | Response morphology | prose, tables, cards, citations, widgets, native objects, files | What exact content types did the app render? |
| X06 | Rich output lifecycle | live preview, inspect, revise, download, publish, reuse | Is output an editable object or flattened text? |
| X07 | Tool boundary | search, apps/connectors, code execution, browser, file tools | What could the app actually act upon? |
| X08 | Temporal behavior | streaming, interrupts, scheduled tasks, background work | Can I supervise/interrupt/resume? |
| X09 | Memory / personalization | explicit preferences, inferred habits, continuity | What did the app remember, with what provenance? |
| X10 | Transparency / trust | citations, readback, tool traces, permission prompts | Can I verify a claim/action? |
| X11 | Sensory / multimodal | image, audio, video, uploads, camera/screen | Can I express input without converting it to text? |
| X12 | Spatial / visual structure | panes, canvas, graph, infinite scroll, information density | Does topology suit my way of thinking? |
| X13 | Transfer / portability | export, API, copy, source file, Git, deep links | Can I continue outside this app? |
| X14 | Constraints / friction | plan limits, latency, login, device-specific gaps | When does the experience break? |
| X15 | Accessibility / interaction continuity | mobile parity, keyboard/voice navigation, readability | Does the same workflow survive device switching? |
| X16 | Output shaping mechanisms | system-level instructions, tool outputs, post-processing, rendering | Which layers *could* explain visible differences? |

## Crucial distinction: different outputs may not mean different models

Examples of hypotheses worth experimentally separating:

- Same model, different app prompts/tool schemas/context -> different **content and decisions**.
- Same text/structured result, different renderer -> different **perceived clarity and affordance**.
- Same app, different model or model version -> different **reasoning/content**.
- Same app/model, different device/account flags -> different **experience**.
- Same conversation, different artifact or editable-object modes -> different **user workflow**.

If model identity cannot be held constant, report the confound explicitly. Do not use UI appearance alone to infer model intelligence or native output structure.

## Structural/native content preservation

AI webapps often expose more than a plaintext answer: links, source citations, interactive artifacts, rich document surfaces, file attachments, streaming increments, tool progress and hierarchical conversation links. Research should distinguish:

1. **Native application object / semantic relationship** (if legitimately observable).
2. **Rendered representation** (DOM or screenshot, with limits).
3. **Export representation** (copied Markdown, PDF, JSON, download).
4. **Observed transformation loss** between these layers.

This is particularly relevant to VIVIM's eventual ability to preserve meaningful content relationships, but AION RESEARCH does **not** build or alter the Harness capture runtime.

## Research questions

- What UX affordances give an individual more leverage even when model quality stays fixed?
- Which webapp shapes cause content loss or hallucinated certainty?
- What interactions create an illusion of agency or continuity versus verifiable execution?
- Which interaction patterns transfer across personal knowledge, research and coding tasks?
- How can design preserve trust, provenance, agency and source fidelity without burdening the user?
- Can useful experience motifs be composed into VIVIM without cloning any vendor's interface or depending on closed internals?

## Reuse rule

A strong finding includes vendor/version/date, direct observation, confounders, explanatory hypothesis, falsification, and one *small* personally useful design implication. No claim of causal influence without a controlled test.
