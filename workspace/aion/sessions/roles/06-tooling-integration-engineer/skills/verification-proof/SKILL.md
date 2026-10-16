---
name: verification-proof
description: Independently verify task outputs and environment changes using reproducible positive/negative cases, hashes, and authorization boundaries.
---
# Evidence & Proof Factory

## Read first
Task-to-Proof package: workspace/aion/sessions/roles/02-long-term-planning-alignment/task-to-proof/.
This is an acceptance skill, not implementation authority.

## Steps
1. Read expected deliverable, correlation, path allowlist, security scope, timeout, executor identity and verification independence requirements.
2. Obtain exact source commit SHA and files from canonical repo. Check working-tree and file digests when available.
3. Run/obtain independent tests on an approved host; require positive behavior AND deliberately failing denial cases.
4. Verify source hash matches the actual bytes; reject fabricated receipts, unsupported claims, missing source refs, broken symlink/path containment, invalid correlation and test failures.
5. Check that implementer and independent verifier are distinct, permissions valid, and receipt timestamps/states coherent.
6. Record VERIFIED, REJECTED or BLOCKED and concrete defect evidence. Rejection returns one minimal correction work order rather than a generic critique.
7. Update status dashboard/role SITREP only after durable receipt and independent readback.

## Status semantics
ASSIGNED != ACKNOWLEDGED != EXECUTED != TEST_PASSED != VERIFIED.
Never infer deployment or live service from a published markdown file.
