# Cloneable native-Node smoke fixture (MOCK ONLY)
Source is self-contained and requires only Node >=20, no installs or external APIs. Use in detached read-only AION clone or copied sandbox:
- node --test mock.test.mjs  (16 deterministic tests, 16/16 run locally in Role 08's Linux fixture)
- node mock.mjs demo out
- node mock.mjs verify out
- sha256sum mock.mjs mock.test.mjs out/mock.json

The MOCK_ONLY fixture is a minimal live Node source reference inside the GitHub clone. The separately supplied offline ZIP contains a larger, independently executed 18-test reference plus prompt/contract/export files. Do not confuse their source hashes or pretend either ran in Z.ai.

Never import existing Playwright-based M0.5 adapter, paste credentials, access chatgpt.com, or claim simulated readback establishes M1. No Python, browser automated testing framework, or npm install is required. The fake grant is not real authorization.
