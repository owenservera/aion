# P1 amendment: VIVIM local world and provider webapp worlds
Date: 2026-10-25. Product Agent Role 15. Scope: P1 only. No Harness code edits or other agents invoked.

## Product premise
VIVIM's local project is a richer, longer-lived, user-owned context than any one provider's project or chat. Every inbound provider has its own observable webapp structure, scope, limitations and action vocabulary. **Never force a one-to-one mapping between a VIVIM Project and a provider Project.** VIVIM must progressively learn provider world structure in evidence-qualified phases even though new interactive Chrome work remains after the internal stability gate.

## What exists conceptually
- VIVIM Project: user-owned container joining locally saved conversations, excerpts, artifacts, notes, knowledge and multiple origins.
- Provider world: provider, account, native container/project/folder IF SUPPORTED, native thread, messages, parts and provider-specific actions.
- Local saved projection: what VIVIM actually has, possibly incomplete, separate from external source and mutable user overlays.
- Evidence and coverage: observation time, source path, confidence/unknown, known gaps and whether referenced remote data is actually stored locally.
- Capability scope: operations are distinguished as LOCAL VIVIM, READ-ONLY PROVIDER, AUTHORIZED PROVIDER EFFECT or UNAVAILABLE/UNKNOWN, not inferred from similar names.

## Example: Export project XYZ
"Export VIVIM project XYZ" means exporting the user's locally collected selected project objects and notes, with source links, coverage and explicit omissions. This DOES NOT imply that ChatGPT exposes an equivalent per-project export control. ChatGPT's account-level export mechanisms, if available, have different semantics and should not silently substitute for VIVIM's project export. If linked content is only remotely referenced, show it as missing/not acquired in the manifest instead of implying the export contains it. A request to acquire more remote content would be a separate, explicitly authorized read/effect workflow once supported.

## Understanding the provider webapp in phases
W0 (now, offline): retain provider/account/native-container/thread/message/content-part relationships where actually evidenced by existing Harness records, fixtures or adapters. Unknown hierarchy stays unknown.
W1 (after internal gate): inspect provider-specific visible navigation, chat/project indices, object types, page and pagination coverage, account/thread bindings, available read operations. Source-qualified, time-stamped observations, not universal assumptions.
W2: reconcile observed provider objects into local projections; ambiguous links and unmapped constructs remain unresolved until qualified or user-confirmed.
W3: offer only validated provider-specific operations through the existing Harness authorized effect owner; do not invent a universal project-export action.

These are maturity stages for inbound understanding, not mandatory additional runtimes or four artificial coding rounds. Existing safe Harness reads need not be removed or disabled; only new interactive Chrome integration remains deferred.

## P1 user-journey implications
RETURN: display saved rich conversation plus known provenance breadcrumbs, including native container only when verified.
ORGANIZE: one local VIVIM Project may reference many providers and native containers; editing the local project NEVER edits a provider project.
FIND: local search can filter by provider/native structure when evidence supports that mapping, but must show scope and gaps.
TAKE: export local VIVIM objects with coverage manifest of included content, remote links, missing content, unresolved identity and excluded sensitive items. This is not a native provider-project export.

## Acceptance examples
1. A local project references two conversations from different providers with independently stable source identities.
2. A provider without observed project support does not get a fabricated provider-project node.
3. Rename/delete local project does not claim to rename/delete remote provider project.
4. Export works over locally present selected VIVIM data while the provider is disconnected.
5. Export manifest identifies remote-linked-but-not-local content accurately, without a claim of complete provider history.
6. An unavailable provider operation is not represented by a functioning button or silently translated into a different-scoped operation.

## What this changes in P1
Provider-world understanding is a CROSS-CUTTING PRODUCT CONTRACT from G1. What is postponed to G6 is the expansion of active browser interactions, not the honest representation of inbound source structure. This changes priority for P2's identity/relationship contract and P3's experience design, but those workstreams remain NOT STARTED. P1's four user journeys still stand.

## Open MAX risks
False equivalence of project/folder/collection terms across providers; accidental account/thread merges; inferred versus observed hierarchy; stale provider structure; selective local export versus partial remote coverage. Later MAX review must arbitrate identity and capability contracts; implementation HOW remains with engineering models.

See P1 Product Shape and Harness governing ARCHITECTURE.md for current stage-boundary tension. No governing Harness source changed in this amendment.
