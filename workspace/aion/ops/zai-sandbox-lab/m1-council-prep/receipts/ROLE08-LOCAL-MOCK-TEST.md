# Role 08 — real local Linux mock test receipt (NOT Z.ai)
Run date: 2026-10-16 UTC (Europe/Madrid 2026-10-17 shortly after midnight); Node v22.16.0.
Provenance: Role 08 conversation isolated Linux container, not the user's Windows machine, BFF Linux runtime, Z.ai Full-Stack Agent or authenticated ChatGPT browser. Self-tests are NOT independent Chief 05 verification.

## Clone-facing runnable source now committed to AION main
- sandbox/mock.mjs: Git blob SHA1 `731a622eace4a89c45380e9457063d2bfb7b35b7`, SHA256 `019449ba6d2a00dc50740f9616bebf07e713ddb128473586e675de0c06843103`.
- sandbox/mock.test.mjs: Git blob SHA1 `c940814e659c9610be1b4feb3130943859f0f22a`, SHA256 `c915c6ed7ed5b8a80ed427750d25f71852cb53329f4b964d67eecec15583f46a`.
- The local test files' final newline was excluded solely for parity with the GitHub connector's actual published bytes. Git blob IDs were independently fetched from GitHub and matched using local `git hash-object --stdin`.
- Commands executed in Linux container: `node --test mock.test.mjs`, `node mock.mjs demo out`, `node mock.mjs verify out`.
- Actual local results: **16 tests / 16 pass / 0 fail**, demo created mock evidence and SHA256 manifest, verification printed `{"mock_export_verified":true}`. `CLONE-SMOKE-TEST.txt` in the downloadable ZIP-based work area is a local real stdout snapshot (SHA256 `4d7cc51cb032245069738dc97ae4dd4b7efc714e62512275d84e84b4c61605a9`).
- Negative paths tested: real target rejection, forged origin, missing mock grant, expiration, blank prompt, malformed JSON, wrong endpoint, duplicate, mismatched correlation, fake LIVE response, journal no raw prompt, tampered export, forged M1 flag and restart/replay.

## Expanded ZIP source capsule (separate layout, not GitHub sandbox/)
- Verified file: `AION-ZFORGE-M1C-001-source-capsule.zip`.
- ZIP SHA256 `2bcdc700ab2f0e2eada8a8a09871a16147b857c8687ceaf35e6d49f7dbb92e51`; bytes 24,072.
- Source uses `sandbox/src/experiment.mjs`, `sandbox/src/mock-server.mjs`, `sandbox/src/protocol.mjs` and `sandbox/test/m1.test.mjs`; tests: **18 pass / 0 fail**; actual `LOCAL-NODE-TEST.txt` SHA256 `74d89b9cb727be13c40cad6d2018ba18717ba8f85bb5890d001ade4eb0e4b03b`.
- Local synthetic receipt `mock-evidence.json` actual SHA256 `f22c24bf5b0af4c047a61e83ccc94c3d8ecaa9facd572280c0dc893727c69570` (1,056 bytes); generated manifest verified; receipt `m1_verified:false`.
- The ZIP is a **conversation-delivered download**, not a GitHub artifact or remotely uploaded archive. Z.ai can use it only if owner explicitly attaches it; no claim that the sandbox already accessed it.

## Outstanding proof
No real Z.ai web Full-Stack run, selected model, actual Z.ai exported ZIP, Z.ai exit-code/log receipt, independent second-person rerun, owner-browser authorization or genuine AION->authenticated ChatGPT->AION roundtrip. Therefore only `LOCAL_MOCK_TESTED` is supported. Six role-authored council reports still unreceived. Require independent Role 06/05 review before advancing executive gate.
