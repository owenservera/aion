---
name: model-capability-routing
description: Route authorized OpenCode/ZCode work to empirically suitable available provider/model/tool combinations with quality and cost evidence.
---
# Model Capability Routing

## Seed routing order
Use AION owner preference from OPERATING-RULES.md: OpenCode free models first, then Space Bunny (free), Muse Spark 1.3, DeepSeek Flash 4.1, MiMo 2.6—subject to actual availability, supported tools and task success evidence. This is a preference, not a guarantee of model access.

## Procedure
1. Parse bounded task: domain, required context, tool use, modification scope, test requirements, latency/budget ceiling and privilege limits.
2. Discover current provider/model availability and quotas through approved connector or OpenCode/ZCode capability probe; don't estimate remaining credits from prior screenshots.
3. Choose lowest-cost route with verified compatible capabilities. Explicitly separate model quality from executor toolchain/host quality.
4. Execute one authorized evaluation with reproducible acceptance tests. Capture model ID, runtime/host, session ID, elapsed time, genuine token/cost metrics if provided and exact PASS/FAIL output.
5. On failure, categorize tool mismatch vs model insufficiency; escalate model only with justification. Reuse session/context when it actually works.
6. Update registry/routing scorecard with evidence; no invented efficiency ratios or automatic credential distribution.

## Success
Task meets independent proof with recorded time/cost/rework. Do not recommend one model simply because its name or benchmark is familiar.
