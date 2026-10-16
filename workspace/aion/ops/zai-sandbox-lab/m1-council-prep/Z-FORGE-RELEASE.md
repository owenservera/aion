# Z-FORGE 08 — AION M1 cloneable pre-live experiment release
Status: READY_FOR_ZAI_TURN_PREPARATION / NOT ZAI_TESTED / NOT M1_VERIFIED.
Source issue: https://github.com/owenservera/aion/issues/24
Authority: AION canon/M1 and Council README/CLONE-AND-ASSEMBLY; owner Windows machine remains master.

The one outcome is a MOCK ONLY AION-labeled message -> synthetic local destination -> distinct transport ACK -> synthetic reply -> simulated readback -> rejection/negative proof and export. It cannot pass real M1. The sandbox CANNOT access the owner's authenticated ChatGPT browser/session. No live ChatGPT login, credentials, browser profile, host authorization, GitHub push, production wire ACP or unstated model access.

Council intake (checked Issue #24 comments, manifest, all eight SITREPs): actual authored M1C-05 executive ACCEPTANCE-GATES.md only; role 08 authors this integration and its PACKAGE-MANIFEST.md. Role-authored M1C-01, 02, 03, 04, 06, 07 component reports are missing. They are SOURCE_FALLBACK_NOT_ROLE_REPORT, not implied acknowledgment or verified concurrence. CoS must collect real receipts and Chief 05 approves any provisional council waiver.

Where to start: sandbox/README.md and prompts/ZAI-TURN-01.md. Default one Z.ai Full-Stack Agent turn; second TURN-02-CONDITIONAL only after a concrete failure. Use Node >=20 and built-in test runner; no external dependencies or Playwright/Puppeteer. Existing escape-hatch browser adapter contains Playwright and is deliberately NOT a runtime dependency.

Reproducibility:
- Preferred: authorized read-only private clone at the exact commit SHA recorded in Z-FORGE's Issue #24 acknowledgment; detached checkout, with path workspace/aion/ops/zai-sandbox-lab/m1-council-prep/.
- If clone access cannot be authorized: owner uploads the complete minimal ZIP source capsule made available in the initiating ChatGPT response, verifies its SHA-256, then runs capsule/sandbox tests. Never paste GitHub tokens or cookies into Z.ai.
- For authorized GitHub clone: cd sandbox ; node --test mock.test.mjs (16 local PASS) ; node mock.mjs demo out ; node mock.mjs verify out. For the separately attached expanded ZIP capsule: cd sandbox ; node --test test/*.test.mjs (18 local PASS) ; node src/experiment.mjs demo ; node src/experiment.mjs verify. Choose ONE path and hash its actual source; they are distinct implementations with distinct file hashes. Generate actual logs and export manifest with SHA-256. No GitHub remote writes by sandbox.
- The clone-facing sandbox/mock.mjs and mock.test.mjs were locally run with 16/16 tests on Node v22.16.0 and their exact Git blob SHAs checked against local content (mock.mjs 731a622eace4a89c45380e9457063d2bfb7b35b7; mock.test.mjs c940814e659c9610be1b4feb3130943859f0f22a). The separately attached expanded ZIP capsule was independently authored and ran 18/18 Node v22.16.0 tests in an isolated ChatGPT Linux container; this is NOT a Z.ai run. Actual Z.ai tool availability, account model, usage, browser preview, archive export and real API are UNKNOWN.
- Local capsule artifact hash: 2bcdc700ab2f0e2eada8a8a09871a16147b857c8687ceaf35e6d49f7dbb92e51 (ZIP). An online clone has to test code fetched from its own frozen GitHub SHA, not assume a previous local log proves remote execution.

Return: real Z.ai model actually selected, run time, exact code/source SHA, test commands and negative outcomes, exported ZIP/patch+SHA256, actual stdout, blocker and next single action. Reviewer 06/05 independently reruns. Nothing called M1 PASS until separate owner-authorized genuine web-app send, real reply, and AION consumption with negative case. See canonical ACCEPTANCE-GATES.md.
