# First Field Experiment — Raw ChatGPT.com Response → Windows

**Research protocol written 2026-10-21. Not executed.** A narrow, reversible native Windows/browser test for Development/Toolsmith or another explicitly authorized local executor. The investigator **does not need to install a new permanent AION bridge** to run this experiment.

## Objective

Determine which browser-received payloads are available **as they arrive**, compare them against the rendered ChatGPT conversation, and assess whether the owner can preserve the entire **observed** stream to a local file without arbitrary truncation or silently losing updates.

Do not infer that a server event stream exists, that WebSocket notifications contain the model reply, or that browser-level capture reveals private server-side reasoning.

## Phase 0: Identify the actual browser and permissions

- Verify **actual** Windows/Chrome/extension/local-build versions and the source SHA on the machine (GitHub current `main` alone does not establish this). Preserve dirty local edits.
- Select **one** authorized signed-in `chatgpt.com` tab and record a non-sensitive conversation reference locally. Ensure no cross-site or other-account capture is enabled.
- Use a separate temporary local Chrome debugging attachment or dev-only extension/profile. **Do not** silently modify the live AION extension manifest, grant broad debugging permissions, install a root certificate, or expose a remote-debugging listener.
- For raw capture: be explicit whether data can be sensitive, and keep **all original bytes local** in an owner-controlled folder, not GitHub. Do not persist authorization headers, cookies, requests with user secrets, other tabs or private keys.

## Phase 1: Response transport discovery (read-only)

With an owner-originated short test reply (not an automated Send), observe the matching Chrome DevTools **Network** records. Classify each relevant connection with browser-observed evidence:

- `HTTP_Fetch_Streaming`: an HTTP response stays pending while incremental body data arrives.
- `EventSource`: actual protocol emits `Network.eventSourceMessageReceived`, if relevant.
- `WebSocket`: actual relevant `Network.webSocketFrameReceived` frames, carefully distinguishing ChatGPT notifications from the model reply.
- `Other/Unknown`: WebTransport, worker mediation, concurrent requests, browser extension instrumentation limits or no qualifying events.

Do not guess undocumented ChatGPT private endpoint names. Record only method, high-level MIME/transport, timestamps, request counts, and whether a particular connection correlates with the new visible answer.

## Phase 2: Attempt full available payload capture

1. On a selected observed response **requestId**, evaluate CDP experimental `Network.streamResourceContent` support. Note exactly when it is enabled and whether `bufferedData` was returned.
2. Collect `Network.dataReceived.data` incremental base64 strings **if exposed**, decode byte-for-byte and write to a bounded-memory append-only local sink; retain the raw bytes, times, request IDs and original chunk boundaries in private metadata.
3. Independently note actual EventSource/WS events for the same answer if present. Do **not** mistake parsed EventSource payloads for original SSE framing, or WS notifications for full response contents.
4. Compare the final decoded content with the **visible** completed answer and the current AION DOM observer if available. Keep unknown envelope types rather than dropping or normalizing them.
5. Verify captured bytes persist after the recording ends, with optional chunk count/digest, and that an intentionally slow sink is not silently dropping samples.

If `streamResourceContent` is missing, rejects the request, reports no payload or cannot produce a meaningful decoded answer, record that exact observation: it is a legitimate NEGATIVE result. Then research the MAIN-world Fetch stream path; do not automatically substitute an invasive `Fetch.takeResponseBodyAsStream` intermediary.

## Phase 3: Minimum negative and reliability checks

| Test | Expected honest outcome |
| --- | --- |
| Long response | All **observed** chunks are retained locally with total byte count and no self-imposed truncation; if incomplete, mark unknown/lost suffix |
| Attach after generation starts | Prefix marked **UNKNOWN** unless browser returns demonstrably complete buffered data |
| Reload/close tab | Stream ends with a clear lifecycle termination and coverage status, not a fictional final token |
| Detach/restart debugging | Capture gap flagged explicitly; avoid “lossless” claims |
| Concurrent unrelated request | Collector excludes unrelated payloads via request/tab correlation; no global log dump |
| Slow local sink | Bounded memory/backpressure or explicit drop/error, not silent unbounded queue growth |
| UI-vs-raw mismatch | Report it; the DOM and server-delivered envelope may encode different intermediate states |
| Changed account or wrong conversation | Stop and require owner-scoped rebinding; don't infer authenticated identity from a URL alone |

## Lab receipt (metadata only)

```text
date_utc:
windows_version_observed:
chrome_version_observed:
collector_source_sha:
attachment_method_and_scope:
actual_response_transport: HTTP_FETCH / EVENT_SOURCE / WEBSOCKET / MIXED / UNKNOWN
cdp_stream_resource_content: SUPPORTED_AND_DATA / NO_DATA / ERROR / NOT_TESTED
raw_chunks_received:
raw_bytes_received:
first_byte_observed_ms:
first_local_durable_write_ms:
last_response_or_terminal_ms:
final_visible_text_matches_decoded_payload: YES / NO / NOT_COMPARABLE
replay_and_gap_diagnostics:
data_retained_locally: YES / NO
other_account_or_sensitive_data_collected: NO / INVESTIGATE
live_evidence_reference_private_or_redacted:
verdict: A1_RAW_CAPTURE_VIABLE / A1_PARTIAL / A1_UNAVAILABLE / BLOCKED
```

**What the result proves:** only the specific tested browser, user-selected response, capture implementation and observed runtime state; not universal browser/version support, continuous indefinite capture or completeness of private server internals.

## Source and delivery ownership

- Authoritative experiment method: [raw capture options](RAW-STREAMING-OPTIONS.md).
- Existing source-only AION watch path: [lab entry](README.md), [AION Developer desk](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/workers/development/DELIVERABLES.md) and [Toolsmith Chrome relay skill](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/06-tooling-integration-engineer/skills/chrome-acp-relay/SKILL.md).
- Research findings: [AION Research issue #30](https://github.com/owenservera/aion/issues/30#issuecomment-6316115992) **metadata + links only**. Development/Toolsmith implementation acceptance remains separate and requires an actual Windows receipt.

Do not use Playwright or Puppeteer.
