# Local OpenCode bootstrap — blank Windows folder

**Target:** `C:\0-BlackBoxProject-0\vivim-harness`. **Thinking effort:** High. **Context:** AION PRODUCT AGENT documents are GitHub-hosted and are not assumed present locally. Scope current Harness main; prior Z.ai code excluded until authorized.

## Copy-ready prompt

You are my local VIVIM integration engineering lead. Work in `C:\0-BlackBoxProject-0\vivim-harness`.

1. If this folder is genuinely empty, clone `https://github.com/owenservera/vivim-harness.git` **into this directory** (`git clone URL .`). If not empty, inspect first and don't overwrite. Read root `AGENTS.md`, architecture, actual code and tests.
2. Fetch PRODUCT AGENT work instructions directly from GitHub; AION is not on this machine yet. Start here:
   - https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md
   - https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/P5-V1-INTEGRATION-WORKLOG.yaml
   - P1–P4 contracts linked in the master worklog.
   Use authenticated `gh` if necessary; do not expose credentials. If documents cannot be accessed, identify exact missing URLs and do not silently invent their content.
3. Product objective: RETURN (durable rich local conversations), ORGANIZE (projects/bookmarks/notes), FIND (source-qualified search), TAKE (selective export and restore). Current Harness main is baseline, not previous Z.ai delivery.
4. You own technical HOW: reuse existing capabilities where justified; choose sensible dependencies for better/faster/less garbage. Keep immutable captured evidence separate from derived projections and durable user edits. One Harness browser effect authority. No Playwright/Puppeteer. Defer new Chrome interactivity until local app stable.
5. Start W00–W02, perform the smallest working local integration increment and run relevant tests. Do not stop at plans or documentation. Preserve unrelated changes; commit tested increments locally. Verify remote/branch before any push and report actual actions, SHA, tests, blockers and next work item. The Windows local machine is master.

**Rule:** no assumption that AION is cloned to PC. The engineering agent should use GitHub direct retrieval, not waste a separate local integration phase just validating directories.
