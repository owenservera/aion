# CORE Sprint 1 / W4 — pre-write streaming credential containment

**Date:** 2026-10-22. **Owner:** CORE. **Source class:** GitHub committed and remote-read-back; exact remote source parsed and simulated in V8. **Not:** production Node suite, Windows Chrome runtime, real secret handling validation, or independent QA acceptance.

## Defect and implemented boundary

Previous `src/capture/network.mjs` scrubbed each `Network.dataReceived` chunk independently, while parsed `Network.eventSourceMessageReceived` and WebSocket frame payloads were similarly handled one message/frame at a time. A token spanning two or more independently appended units could evade single-unit masking; later raw replay/export would retain it.

New `src/capture/stream-guard.mjs` enforces a *bounded pre-persistence quarantine*:
- HTTP stream chunks hold back **128 bytes** and screen combined pending/new bytes before any safe prefix is appended. Successful completion releases the checked tail; failure/redirect/detach/reconnect discards the tail with explicit `body.excluded`.
- WebSocket frames retain whole-frame order and opcode/direction; no frame is appended while its last 128 bytes have not been followed by checked data. A suspicious marker discards queued frame bodies and makes following frames metadata-only; a normal close flushes checked frames.
- Browser-parsed `es.msg` events are independently frame-guarded; EventSource credential candidates stop both parsed-message and future raw-body capture.
- Credentials recognized as JSON credential-field names, Bearer/JWT and selected API-token prefixes trigger conservative **stream exclusion**, rather than writing incomplete values and claiming they were scrubbed. This may exclude harmless discussion *of* those patterns. No attempted content recovery from excluded payloads.
- A single uninspectable chunk/frame above **1 MiB**, or more than **4,096 queued frames**, also fails closed. The result is recorded as excluded rather than safely captured. Open-stream summaries disclose withheld byte counts and exclusion state.
- Existing completed-buffer `scrubSecrets` is still used for permitted bytes. The guard runs **before** the raw log and downstream tap/reducer; missing raw content therefore cannot be silently reconstructed in derived events/exports.
- Emission timing is delayed and marked `securityDelayed`. `ct` on coalesced HTTP chunks describes the triggering emission, not exact byte arrival; do not use it for high-resolution timing reconstruction. Coverage loss is explicit.

## Verification and regression

Remote source and test files were read back after each write. `src/capture/redact.mjs`, `stream-guard.mjs`, `network.mjs`, and `test/unit/stream-guard.test.mjs` passed V8 source syntax parsing. Source-loaded V8 harness with an ASCII Buffer shim and simulated CDP records passed:
1. Clean HTTP stream round-trip after delayed security-tail release.
2. **30** marker/split-step combinations across JSON password/access token, Bearer, JWT and API-token prefixes: no matched secret written.
3. HTTP `body.excluded` before sensitive raw append; WebSocket split-frame exclusion.
4. EventSource cross-message exclusion and bounded zero-length-frame queue.
5. Failed/abnormal tails are deliberately unpersisted in the committed Node fixture cases.

Nine deterministic `test/unit/stream-guard.test.mjs` tests were committed. They are **not** claimed as executed under Node in a full checkout. Run `node --test test/unit/stream-guard.test.mjs` and the full suite on the Windows-local master or authorized checkout; independent QA should inspect persisted raw, derived events, transcript exports, metadata and streaming latency.

## Explicit limitations / next steps

- This is **recognized-credential-marker containment**, not a guarantee that arbitrary passwords, custom token formats, encoded secrets, encrypted/escaped fields, or unrecognized opaque bytes can be discovered. Existing URL/header/request-body controls retain separate risks; the W4 security audit is **PARTIAL**, not independently closed.
- The conservative exclusion can reduce live capture fidelity and add 128-byte or one-frame latency. Measure real Node/Chrome SSE and WebSocket behavior before claiming acceptable interactive performance; keep exclusion/partial status visible to users and library eligibility decisions.
- Stop/session interruption may have a pending security tail excluded without a per-stream `done` event; `run.end` open-stream coverage and withheld bytes must be assessed together.
- Reconcile payload size/accounting and timing consumers; do not claim byte-faithful full raw capture of explicitly excluded bodies. Exclusion must disqualify automatic acceptance/learning eligibility in Sprint 2.
- Follow with actual Node+held-out evaluation, adversarial raw-to-export leak checks, and current-head capture latency/memory benchmarks. No live send authorization is implied.

## Commit receipts

- `a2b70565` stream guards; `5993f882` HTTP integration; `57f38386` WS frames
- `58f8052c` parsed EventSource; `ea3f3570` frame-count bound; `4b22dc1d` open-stream coverage
- `d38295cd`, `1dc5e6da` nine deterministic Node regression cases

**Open acceptance state:** source delivered, V8 checked; Node/Windows/QA not accepted.
