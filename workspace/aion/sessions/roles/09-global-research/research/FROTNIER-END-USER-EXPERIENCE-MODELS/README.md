# FROTNIER-END-USER-EXPERIENCE-MODELS

**AION RESEARCH / Role 09 — frontier investigation**  
**Created:** 2026-10-25  
**Owner-specified directory name:** `FROTNIER-END-USER-EXPERIENCE-MODELS` (preserved verbatim)  
**Status:** Research framework initialized; vendor documentation examples linked, no cross-platform user trial performed.

## Founding observation

> The experience of using ChatGPT.com, Claude.ai, Gemini, and other AI webapps differs materially from the raw capabilities of their underlying large language models. Their interfaces, interaction grammar, memory/context systems, tools, rendered outputs and workflow design shape the experience and can influence what an end user receives.

The **front-end product is not the LLM**. Product UX and model behavior can be correlated, but they are not interchangeable measurements. Treat "experience model" as our research abstraction, not a vendor-defined standard.

## Mission

Investigate **end-user experience models** as independently evolving systems: interaction paradigms, webapp morphology, interface affordances, content/output representation, state continuity, tools, permissions, multimodality and user mental models. Discover mechanisms that make an AI product especially useful, intuitive, expressive and trustworthy **to one person**. Assess how product architecture shapes both the presentation **and the practically reachable behavior** of the model.

Explicitly disentangle:
1. **LLM substrate** (capabilities, model/version, sampling, training) — often opaque.
2. **Application intelligence/orchestration** (instructions, retrieval, tools, routing, memory).
3. **Interaction/experience layer** (interface, streaming, components, navigational structure, workflows).
4. **User/environment layer** (expectations, device, accessibility, preference, familiarity).

## Starting points

- [MODEL.md](MODEL.md) — causal layers, experience taxonomy and research questions.
- [PLATFORM-BASELINES.md](PLATFORM-BASELINES.md) — source-supported starting matrix: ChatGPT, Claude and Gemini; no subjective product rankings yet.
- [COMPARATIVE-EXPERIMENTS.md](COMPARATIVE-EXPERIMENTS.md) — observational and controlled comparisons; sample tasks, confounders, recording packet.
- [SOURCE-REGISTER.md](SOURCE-REGISTER.md) — current vendor primary documentation links and freshness requirements.
- [experience-observation.schema.json](experience-observation.schema.json) — machine-readable format for qualitative, dated first-hand observations.

## Why this matters to your ecosystem

- **AION RESEARCH:** identify generalizable interaction patterns, not just model leaderboards.
- **VIVIM / Vita / OpenScroll:** learn what end users actually experience and prefer. No product change is authorized by this research.
- **VIVIM Harness:** any native capture, source shape and fidelity testing must remain implementation-owned in `owenservera/vivim-harness`; research can supply taxonomy and evidence.
- **OpenCode / Android access:** assess radically different code-agent end-user experiences even with similar underlying models.
- **GPM:** track research-to-project transfer with source-based evidence in native tasks only, not a second queue.

## Research boundaries

Personal, single-user interest; not an enterprise/customer study. No pretense that screenshots reveal hidden system prompts, raw model architecture, or internal orchestration. Do not rank vendors by a single subjective session. Use official sources for feature claims; actual UX claims require dated first-hand test evidence. No proprietary content replication; no private chat export or credential capture; no banned Playwright/Puppeteer. No separate agent, database or scheduled task.

**Research intake/follow-through:** [AION RESEARCH #30](https://github.com/owenservera/aion/issues/30). This folder owns **evidence and hypotheses**, while product execution remains in its owner repository.
