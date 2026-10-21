---
name: research-evidence-check
description: Validate a minimal AION research evidence packet and its delivery/verification receipts locally before publishing claims or routing to another agent.
---

# Research evidence packet check

**Use when:** Publishing a source-backed research finding, a benchmark result, an alleged live capability, or a handoff that could be mistaken for recipient acknowledgement. Particularly useful before [Research issue #30](https://github.com/owenservera/aion/issues/30) comments or project-owner recommendations.

**Do not use:** As a network fact checker, scientific peer review, account entitlement tester, or approval gate for ordinary answers. This script cannot inspect GitHub, external websites or the Windows host; it cannot establish that a cited receipt is truthful. Reuse [03 Evidence Assessment](../03-evidence-assessment/SKILL.md) for actual evaluation, [08 Delivery Loop](../08-delivery-loop/SKILL.md) for recipient routing, and [Toolsmith Verification Proof](../../../06-tooling-integration-engineer/skills/verification-proof/SKILL.md) for independent runtime acceptance.

## Local execution (Node 18+; no dependencies)

From repo root, with an actual metadata-only packet already prepared:

```powershell
node workspace/aion/sessions/roles/09-global-research/skills/research-evidence-check/scripts/check-packet.mjs check workspace/aion/sessions/roles/09-global-research/skills/research-evidence-check/fixtures/example-published.json
node --test workspace/aion/sessions/roles/09-global-research/skills/research-evidence-check/scripts/check-packet.test.mjs
```

Return codes: **0** valid structural metadata/receipts, **1** invalid content or missing proof, **2** wrong CLI invocation, unreadable input or JSON parsing error. Runs offline, reads one explicit path, creates no files, issues, network requests or host changes. A PASS is **only a schema/consistency check**, never primary-source validation or a live proof.

## Small input contract

Use the example fixture for field names. Main fields: `source_url` (HTTP(S) or DOI), concise `claim`, `basis` = SOURCE_CLAIM / REPO_OBSERVED / OFFLINE_TEST / LIVE_VERIFIED / INFERENCE / PROPOSAL, `confidence` = HIGH / MEDIUM / LOW / UNKNOWN, `status` = DRAFT / PUBLISHED / ACKNOWLEDGED / ADOPTED / IMPLEMENTED / VERIFIED / REJECTED / DEFERRED.

A published packet needs `publication_receipt`; ACK requires **its own** `ack_receipt`; ADOPTED, IMPLEMENTED, VERIFIED require their own decision/implementation/verification receipt respectively. REPO_OBSERVED, OFFLINE_TEST, LIVE_VERIFIED basis requires a matching `repo_receipt`, `test_receipt`, `live_receipt`; LIVE_VERIFIED additionally requires a valid `observed_utc`. These are distinct facts; no automatic promotion occurs. Active draft/publication needs `next_action`.

Never put credentials, cookies, private transcripts or secret-bearing URLs in a packet. The checker rejects common sensitive fields/query keys and limits the payload to 64 KiB; this is a precaution, **not** a substitute for review and source confidentiality rules.

## Recovery and evolution

If validation fails, correct the specific provenance/state mismatch; do **not** fabricate receipt links just to pass. If the tool runs successfully in a local harness, retain the Node test result and actual harness invocation output separately. On material failures, improve this skill/scripts and run the positive/negative tests; keep the schema small, avoid a rival research queue or general-purpose ontology.
