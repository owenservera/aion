# AION M1-002 — Z.ai sandbox evidence independent review (2026-10-17)

**Result:** SANDBOX_BROWSER_MOCK_EVIDENCE_REVIEWED / NODE_SUITE_INDEPENDENTLY_RERUN / REAL_M1_NOT_VERIFIED.

## Submitted source and evidence
Owner-provided artifact: `AION-M1-002-ZFORGE-sandbox-evidence.zip`, 296,939 bytes, SHA256:
`b531ae8137521c331d25023396b10a9dbb6ec5ed7214d1bfdc1d74460a048db8`.
Submitted report: Z.ai mission `AION-M1-002-ZFORGE-08`, Node v24.21.0, agent-browser 0.39.0 browser run, selected model UNKNOWN. These environment facts are reported by submitting Z.ai session, not observed afresh by reviewer.

Read-only archive inspection in independent environment: ZIP has 37 entries (36 data entries plus `EXPORT-MANIFEST.json`), no traversal paths, manifest hashes and sizes match all 36 data entries. `sources/MANIFEST.sha256` independently verified its 15 source entries. The original source-packet digest declared is `a4a544cb127b8c615ab920ee2faf7cbe5046226b97affb731c97c636de146609`; reviewer did not re-run the earlier Z.ai browser session.

## Independent reproducible execution
Node v22.16.0:
- `cd sources && node verify-manifest.mjs` -> `MANIFEST_VERIFIED: 15 files, SHA-256`.
- `cd sources && node --test tests/core.test.mjs tests/http.test.mjs` -> **18/18 tests pass, 0 fail** (193.920905 ms, exit 0).
- Server and adapter source remain MOCK_ONLY, local loopback, disposable browser fixture, and mock consumer; no evidence of real authenticated ChatGPT traffic or ACPX/Chrome MV3 extension code in this artifact.

## Submitted browser session evidence read-back
- `evidence/digest-final.json` contains a six-event sequence with one correlation `5c922e1e70a84c2cbeef591e5a612ada`: `queued` -> `delivery.sent` -> `delivery.ack` -> `reply.partial` -> `reply.complete` -> `consumer.readback`.
- `evidence/status-roundtrip1-consumed.json` reports state CONSUMED and the same event chain, with readback at `2026-10-17T00:19:58.823Z`. Independently computing SHA256 on the returned reply string matches recorded `8cf708e1fd6a468cd2ce6011b82f4c586adb52eb69d5486857c51190f1c29dcd`.
- `evidence/fake-tab-adapter.png` visually shows correlated composer text, simulated response and ACK/partial/complete adapter log; `evidence/browser-adapter-log-roundtrip1.transcript-excerpt.txt` explicitly labels itself a reconstructed transcript excerpt, not original retained page-log bytes.
- `evidence/negative-cases.log` records 409 denials for wrong Origin, replay, wrong correlation, wrong adapter, forged LIVE, premature readback, disconnect/reconnect and a TIMED_OUT job. The evidence contains script `negative-battery.mjs` for reproduction. These were reported as live server HTTP negatives, not all browser-driven negatives.
- `evidence/reload-recovery-status.json` captures REPLIED after a real tab-reload claim, **not a CONSUMED state**; separate `evidence/reload-reply.txt` documents further readback, but exact combined post-reload server state is not independently re-performed here.

## Evidence correction — screenshot mismatch
`evidence/consumer-replied.png` and `evidence/consumer-consumed.png` have **identical SHA256** `de7feaab0fb0b4404f9e1a8761d14cf371e4077086ca3bf1b91341560529b895` and identical bytes. Both visibly show `state: REPLIED` and `readback: null`, despite the second filename. Therefore the screenshot set **does not independently show the CONSUMED UI state**. The CONSUMED event is supported by the separate saved server event/status JSON and matching reply digest; do not claim distinct REPLIED/CONSUMED browser screenshots or independent re-observation of Z.ai's browser. The attached report's claim of the latter screenshot should be corrected.

## Gate and next action
- **PASS:** ZIP/source hashes; independently re-run 18 Node tests; server-side saved mock event correlation and readback integrity.
- **SUPPORTED BY SUBMITTED EVIDENCE, NOT RERUN IN REVIEWER BROWSER:** Z.ai browser fake-page interaction, six-state mock cycle and a post-reload flow.
- **NOT PROVEN:** distinct CONSUMED screenshot, TOOLSMITH 06 ACK/contract, ACPX source integration, live ChatGPT authentication/session selectors, AION-originated *real* roundtrip, actual runtime-selected model.
- **M1_VERIFIED=false.** No real ChatGPT credentials, Playwright or Puppeteer used by the independent reviewer.

**Digital CEO priority recommendation:** Stop additional mock-only loops. First inspect original ACPX kit and existing BFF Linux/browser route for reuse; obtain TOOLSMITH 06 actual contract and explicit owner authorization to lift applicable host/browser execution stop order before smallest live AION -> ChatGPT web app -> AION proof. GitHub coordination does not wake employee chats.
