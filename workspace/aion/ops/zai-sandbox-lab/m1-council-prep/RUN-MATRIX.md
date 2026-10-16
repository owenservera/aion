# M1 sandbox run matrix — optimized
**Expected paid turns:** 1 primary, at most 1 corrective follow-up by default. Costs/model choice UNKNOWN until observed.
**Input:** AION private main at pinned SHA if approved, otherwise self-contained prompt/source capsule. Never assume Z.ai access to GitHub or owner credentials.

| Run | Trigger | Outcome | Proof |
|---|---|---|---|
| ZFT-M1-01 | Immediately once source capsule/frozen SHA available | Mock destination + typed relay envelope + finite state machine + replay/persistence + test runner + export | Node tests incl negatives; actual stdout; artifact ZIP; SHA256 manifest; no Playwright/Puppeteer |
| ZFT-M1-02 | Only if first run cannot cover MV3 mock adapter, browser controls or recovery | Add isolated fixture-only MV3/browser adapter and missing negative tests; re-export | Actual rerun and independent checks |
| LIVE | NOT a Z.ai turn | Authorized AION → authenticated ChatGPT web app → AION readback | Real response correlation + negative case + reviewer approval |

## Minimum portable contract
Message `schema_version=relay.v0.1`; IDs and UTC times required, `provenance=MOCK` in sandbox. Distinguish `OUTBOX/SENT/ACKED/RETRY/DEAD_LETTER` from `PROPOSED/APPROVED/DISPATCHED/ACCEPTED/RUNNING/PROOF_SUBMITTED/VERIFIED`; response observed and AION consumed are independent proof fields. Reject expired, wrong-source, wrong-correlation, duplicate, replay, empty/partial reply and unauthorized dispatch.

## Verification and recovery
First run uses `node --test`, records node version/commands/exit codes, saves `manifest.json` with input SHA and actual per-file SHA256. ZIP must be readable and `sha256sum -c` match. Reviewer extracts into clean directory and reruns tests. Failure produces logs and recoverable source, not fabricated PASS. No private-source publication or git push from sandbox without separate authorization.
