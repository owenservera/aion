# AION Intelligence Bench — 2026-10-25

## Identity and scope
- Repository: owenservera/aion
- Inspected baseline: main f7a485ccc2d7cfc9f0880c046901db4e4a5669b8
- Isolated branch: bench/intelligence-adversarial-20261025
- Files edited: one new offline Node 22 test and the existing CI test command. No product, browser actor, adapter registry or runtime code changed.
- Fixtures are all synthetic. No private captures, real accounts or live browser operations.
- Existing communications reviewed: role AGENTS.md and SITREP.md, capture-studio-systems WORKLOG.md, and the S1 campaign brief. No separate matching role-to-role message folder was present in the main tree scan.

## Reproduce on a Node 22 checkout
Working directory:
workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio

Command:
node --test test/unit/adapter-intelligence-bench.test.mjs

Seven tests cover unknown-site adapter discovery, known-site selector drift and flapping, held-out lineage/account/digest leakage, typed native stream component fidelity, explicitly bounded lossy rich transcript previews, 20,000-offer long-stream projection cost, and append-only compare-and-swap rollback. The existing .github/workflows/capture-studio-intel.yml now includes the new file in the Node 22 regression command. Tests emit structured AION_BENCH output.

## Source-level measurements (actual execution, not full Node suite)
The unchanged src/studio/systems-probes.mjs was fetched from main and executed in an isolated JavaScript runtime:
- Clean heldout: qualified; reused lineage: EVIDENCE_LINEAGE_REUSED; other account: SCOPE_MISMATCH.
- Standalone qualifyHoldout DID accept duplicate sourceDigest when id and lineage were independently forged. This is a probe-local weakness, not verified end-to-end promotion: adapter-improvement-pipeline.mjs also rejects overlapping rawDigests and the manifest provider verifies persisted evidence.
- Drift with 3 candidate-positive lineages and 2 incumbent-negative lineages across 2 consecutive windows: shadow-revalidate-read-only. Nonconsecutive windows: MORE_INDEPENDENT_EVIDENCE_REQUIRED.
- Projection (20,000 offers over 80 ids, maxStreams=32, maxChars=256): 8,000 accepted, 12,000 overflow, 20,000 UI gaps, 32 retained. Elapsed three JS-isolate iterations: 40, 38, 45 ms. NOT Node 22 throughput or raw-capture performance.
- Synthetic concurrency explorer: 20 possible schedules, 12 duplicate-dispatch schedules with unsafe read/write, zero with modeled atomic admission.
- Adaptive factory source was separately executed using stub URL/hash utilities because Node builtins are absent from the JS isolate: two generic read-role candidates remained provisional; one unknown route was not invented; simulated drift generated replacement and warning. This is not cryptographic testing nor whole-pipeline validation.

## Test execution limits
- Node v22.16.0 syntax check passed on the locally authored equivalent of the benchmark file.
- The exact GitHub file parsed after ESM import/meta substitution in an isolated JS runtime.
- GitHub Actions runs 40201058255 and 40201074734 both completed as failure BEFORE any runner steps started (runner_id 0, no steps). The job-log redirect returned 404 BlobNotFound. Root cause (quota, runner provisioning, policy etc.) remains unverified.
- Therefore: no claim of seven passing Node tests. Real-disk rollback, native stream test, full Studio test suite, Node memory/CPU, real-site/browser capture, and genuine heldout acceptance remain unrun.

## Integration and rollback
When a Node 22 runner is available, execute the command above; collect AION_BENCH output and full TAP pass/fail totals. Only then treat test acceptance as verified. Do not repair the diagnostic sourceDigest alias gap by trusting caller-provided manifests; assess real trusted lineage first. Use the branch as a reviewable PR. Revert by deleting the new test file and removing it from the one CI test command. No product migration required.
