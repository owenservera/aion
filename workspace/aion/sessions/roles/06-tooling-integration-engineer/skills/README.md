# TOOLSMITH Skills — Discoverable Runbooks
All skills are repository-owned instructions (not automatically installed tools). Each folder has a SKILL.md that a ChatGPT role or OpenCode/ZCode executor can load for matching tasks. A skill is NOT proof the corresponding tool is installed.

| Skill | Use when | Artifact |
|---|---|---|
| [tool-discovery](./tool-discovery/SKILL.md) | Identifying installed tools, ownership, versions and capability gaps | Qualified tool-inventory record |
| [environment-bootstrap](./environment-bootstrap/SKILL.md) | Preparing Windows/Linux runtimes and reproducible setups | Authorized install/test/rollback plan + receipt |
| [acp-interop](./acp-interop/SKILL.md) | Connecting UAH to OpenCode/ZCode or evaluating ACP protocols | Capability matrix and safe handshake |
| [chrome-acp-relay](./chrome-acp-relay/SKILL.md) | Building/debugging AION Chrome MV3 ACP edge relay | Tested transport and fallback matrix |
| [verification-proof](./verification-proof/SKILL.md) | Evaluating a delivery, source hashes, negative tests and receipts | Independent VERIFIED/REJECTED decision |
| [context7-harvest](./context7-harvest/SKILL.md) | Researching current tool documentation for compatibility | Source-indexed docs in SOFTWARE_HQ |
| [incident-recovery](./incident-recovery/SKILL.md) | Recovering from broken hosts/transports, fallbacks and retries | Diagnostic and reversible runbook |
| [model-capability-routing](./model-capability-routing/SKILL.md) | Choosing economical capable OpenCode/ZCode model routes | Measured compatibility and cost table |

## Skill discipline
- Open BOOTSTRAP.md and AGENTS.md first.
- Read only the applicable skill and the real project's current contract; avoid stuffing irrelevant documentation into a worker prompt.
- Treat install commands as proposals unless approved and executors actually run them.
- Write current observed versions, target host, proof links, negative case and rollback.
- Update skills only when new field evidence or official protocol changes justify it.
- No broad automatic transcripting, unsafe browser injection, secret copying, or pretending tabs equal active ChatGPT model work.

## Shared objective
One problem → select skill → verify environment → run authorized implementation through OpenCode/ZCode → test → evidence → feed reusable finding back into relevant skill.
