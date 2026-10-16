# ZFT-M1-02 — Conditional corrective Z.ai turn (DO NOT SUBMIT by default)
Run this **only** if ZFT-M1-01 generated real files/tests but one named build, test or export gate failed. Preserve first-turn files, raw errors and same source SHA. No login, no Playwright/Puppeteer, no owner machine changes, no actual ChatGPT integration.

MISSION_ID: ZFT-M1-02
MODEL_SELECTION: OWNER_SELECTS; record observed model and turn duration, do not invent cost.
INPUT: Owner-supplied actual failed ZFT-M1-01 output, test logs, manifest and the pinned AION integration kit. If source cannot be imported, STOP with blocker; do not fabricate a first run.

TASK: Fix **only** the failures explicitly listed in the original test output, plus any new regression they caused. Keep the mock destination unmistakably MOCK. Do not redesign the architecture or add unrelated modules. Re-run all positive and negative tests and the export/recovery steps in `TEST-AND-EXPORT.md` from an isolated directory. Capture real stdout, UTC, Node version, command exit codes, changed file hashes and an updated ZIP/tar hash. The clean-room reviewer must be able to reproduce from exported bytes.

ACCEPTANCE: All previously failed named tests now run and pass AND all prior tests remain passing; no unauthorized privileges, cookies, account transfers, production selectors, hidden network services, fabricated employee contributions or M1 PASS claims. If unresolved, return a precise fail report and current recoverable source, not a partial success assertion.

STOP: actual authenticated ChatGPT session access, privileged host execution, auto-push/merge to owner master, or any procedure requiring missing approval.
RETURN: actual model, failing cases before/after, changed paths, exact test commands+exit statuses, artifact location/size/SHA256 and independent rerun instructions. Report failures explicitly.
