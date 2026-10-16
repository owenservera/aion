---
name: model-and-turn-economics
description: Choose a model and improve delivered development output per Z.ai web Agent Mode turn using actual usage, wall time and proof outcomes.
---
# Model and Turn Economics
**Trigger:** Plan a costly new turn, choose among visible models, decide whether subagent fanout is useful.

1. Observe the exact account UI's selectable models, quotas, run limits and model switching policy. User reports one model per spin-up; mark as such until checked.
2. Characterize task complexity (repo size, multimodal/browser needs, allowed command/tools, independent tests and expected artifacts).
3. Predict difficulty/effort qualitatively, without fabricating precise credit costs.
4. Capture actual selected model, turn count, execution duration, output files, verified test cases, blockers, rework and billed/visible usage if provided.
5. Compare repeatable fixture tasks across models only if account budget allows and user requested that comparison; control for source commit and acceptance cases.
6. Score useful independently verified artifacts per turn, not agents spawned, raw lines, or unverified output claims. Include failed tests as engineering evidence.
7. Update Role 04 Efficiency with actual metrics and Role 08 TURN-FEED with evidence-based model choice.
**Unknown budget => UNKNOWN**, not free/unlimited.
