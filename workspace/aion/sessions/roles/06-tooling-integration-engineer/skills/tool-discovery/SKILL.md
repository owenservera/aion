---
name: tool-discovery
description: Identify real installed tools, capabilities, trusted source-of-truth and toolchain gaps across AION hosts before designing or installing.
---
# Tool Discovery & Evidence Qualification

## Trigger
A task refers to unknown versions, host tools, UAH/ACP endpoints, credentials readiness, or mismatching inventories.

## Procedure
1. Identify **host** (owner Windows / BFF Linux / connected cloud), operator, required task and permission class.
2. Read existing TOOL-REGISTRY.json, canonical AION docs and latest host evidence. Do not assume old versions are current.
3. Acquire scoped read-only version/path/status/capability checks through an authorized executor. Preserve exact command, timestamp, host and outcome.
4. Cross-check with official versioned product documentation; mark findings OBSERVED, REPORTED, DESIGNED, UNVERIFIED, or BLOCKED.
5. Produce a minimal capability matrix: supported protocol/methods, dependencies, free models, boundaries, ports, file paths as appropriate without sensitive values.
6. Identify one reproducible smoke test and negative case; assign an owner and next authorized action.
7. Update the registry and a task receipt after independent readback.

## Output contract
tool_id; version; host; install_path_if_public; observed_at_utc; observed_by; capability_set; authorization; status; evidence; blocker; next_test; confidence.
A GitHub file or user recollection is NOT a machine probe.
