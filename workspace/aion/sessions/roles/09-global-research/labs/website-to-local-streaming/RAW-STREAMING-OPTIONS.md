# ChatGPT.com → Windows: full-fidelity streaming options

**Research owner:** AION Global Research 09  
**Updated:** 2026-10-21  
**New highest priority:** Observe **all available browser-received response payloads incrementally and loss-consciously**, before reconstructing rendered conversation text. **Status: source/official-documentation research, not live ChatGPT capture.**

This is a research comparison of an **authorized browser session**, not instructions to recreate a ChatGPT login, acquire private credentials or bypass entitlements. No existing AION production source/Chrome permissions were changed.

## Define what "full raw realtime unbounded" can and cannot mean

1. **L0 — on-the-wire bytes:** TLS-encrypted packets, compression/HTTP framing, network retransmissions. CDP *does not ordinarily provide exact encrypted wire bytes*. OS packet captures see encrypted application payload absent separately authorized TLS decryption.
2. **L1 — browser-received application payload:** incremental response-body bytes, WebSocket frames or other browser-delivered events *as exposed by the browser instrumentation*. This is the primary lab target. Preserve original order, boundaries, timestamps, request/stream identity, and raw byte sequences. Do not reduce immediately to final answer text.
3. **L2 — protocol envelopes:** SSE `event`/`data` records, JSON messages, WebSocket frame metadata, revisions and server-supplied fields *actually delivered to the browser*. Maintain both L1 and independently decoded L2; avoid flattening arrays, unknown message types or provider metadata.
4. **L3 — rendered document state:** what chatgpt.com presents or leaves in the DOM, including partial text revisions. This is a separate lower-fidelity observation layer, valuable as an oracle/cross-check, **not equivalent to L1/L2**.
5. **Never available by browser observation:** server-only hidden state, model internals, undisclosed reasoning, data never transmitted to this signed-in browser, or history absent from the current loaded session. A complete network stream is **not a guarantee** of those categories.

**Operational use of “unbounded”:** do not arbitrarily truncate or summarize captured chunks, and preserve the *entire observed live session* via append-only local file segments. Memory and transport buffers **must be bounded** with backpressure and explicit gap/error reporting; disk quota, host crash, attach timing, provider frame limits and retention remain finite. Never falsely promise infinite storage or 100% delivery through a browser crash.

## Ranked capture methods for the user's new target

| Rank | Method | What is potentially captured live | Fidelity, limits and intrusiveness | Recommendation |
| --- | --- | --- | --- | --- |
| **A1** | **Chrome DevTools Protocol (CDP) Network events** from the owner's exact Chrome tab (isolated local CDP client or Chrome `debugger` API) | `Network.streamResourceContent(requestId)` can cause `Network.dataReceived` to supply base64 response-body chunks; method returns `bufferedData` from before capture activation. `Network.webSocketFrameReceived` exposes received frames, and `Network.eventSourceMessageReceived` parsed EventSource messages. | Experimental streaming command: availability and completeness/version must be proven in the real Chrome build; attach privilege is broad and may conflict with DevTools; `EventSource` events may not cover a `fetch()` response consumed as ReadableStream. CDP application bytes are not original TLS packets. | **First experimental candidate**: do a short, read-only, same-tab capture with one permitted user-originated reply and compare raw event count/bytes against UI; no production permission broadening yet. [CDP Network contract](https://chromedevtools.github.io/devtools-protocol/tot/Network/), [Chrome debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger). |
| **A2** | **MAIN-world page `fetch`/ReadableStream observation**, injected at `document_start` in an explicitly authorized extension | Can in principle copy the response bytes as the page consumes them, including text/event chunks prior to UI rendering; direct mapping to its initiating request can be useful. `WebSocket` requires a separate listener/wrapper if needed. | High page-coupling and patching risk; races on injection, service workers/workers and page changes; copies of large streams can cause buffering. `ReadableStream.tee()` queues unbounded data in the slower branch, so it is **not** an unbounded-storage design. | **Second candidate** if CDP misses the actual stream; test only in a throwaway dev profile, ensuring page behavior/latency unaffected. [Chrome content-script worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts), [MDN tee behavior](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/tee). |
| **A3** | **Local HTTPS inspection proxy**, with explicit user-installed trusted CA on a dedicated test profile | Can observe the HTTP application payload for traffic that actually traverses the proxy; potentially inspect multiple response types and frame boundaries | High setup and breakage risk; TLS interception, HTTP/2/3, websocket upgrade, browser certificate rules and connectivity issues. Captures especially sensitive request material. No default capture of cookies/headers; never install a root CA without specific owner approval. | **Third/fallback only**, if browser methods fail and scope allows it. Avoid broad system-wide interception and full account traffic. |
| **A4** | **Chrome DevTools Network/HAR** or CDP `Network.getResponseBody` | Request metadata; for supported completed responses, a response body / per-request HAR analysis | Often **after the request finishes**, so it does not constitute live streaming; DevTools may miss requests initiated before it opened. HAR may omit body by default. | **Fast transport-discovery / ground truth aid**, not the end-state stream. [DevTools network API](https://developer.chrome.com/docs/extensions/reference/api/devtools/network). |
| **A5** | **Existing AION MV3 passive DOM observer → native host → named pipe** | Exact-bound rendered message snapshots/revisions, data-only hints, validated replay/journal | Observes current DOM only, initial baseline is silent, 4/s sampling cap, 100-message bounded sample, 200-message CLI inbox. Not raw browser response or all network envelopes. | **Parallel comparison and recovery control**, not primary raw stream. [AION source](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/extension/src/chatgpt/receive.js). |
| **Not equivalent** | **Official OpenAI API SSE/WebSocket**, ChatGPT export, `webRequest` headers or `declarativeNetRequest` | API stream for separately initiated API generations; asynchronous account data; request/header events | None creates a documented raw real-time subscription to an already open `chatgpt.com` web conversation. Chrome `webRequest` does not supply response body chunks. | Do not conflate with the exact-web-thread streaming objective. [OpenAI API streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [Chrome webRequest](https://developer.chrome.com/docs/extensions/reference/webRequest). |

**Transport discovery must come before a final method selection.** OpenAI's own network guidance confirms ChatGPT also uses WebSocket for some **conversation updates and notifications**, and distinguishes other products' WebSocket model streaming. This **does not verify** how a particular chatgpt.com text reply is delivered in the current signed-in session. [OpenAI network requirements](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps).

## CDP detail that changes the feasibility assessment

- `Network.enable` plus request/response events identify observed network traffic. For a qualifying `requestId`, try experimental `Network.streamResourceContent`; its `bufferedData` and subsequent `Network.dataReceived.data` are **base64-encoded content** in the CDP JSON representation. Validate incremental order/bytes and exactly when capture was armed.
- Treat `Network.eventSourceMessageReceived` as a **parsed SSE message view** when Chrome actually identifies an EventSource, not as guaranteed byte-perfect event-stream data for every Fetch-based SSE implementation.
- `Network.webSocketFrameReceived` carries frame details for WebSockets accessible to the selected target; capture both payload and timing, and keep binary vs text semantics. Chrome's WebSocket use on `ws.chatgpt.com` cannot simply be labeled “the full model response.”
- `Network.getResponseBody` or the Chrome DevTools `getContent` after completion are **retrospective**; they may fail, buffer, or be inapplicable to an indefinite stream.
- **Do not shortcut to `Fetch.takeResponseBodyAsStream` and assume pass-through**: CDP explicitly says after taking the intercepted stream, the request cannot be continued *as-is*; it requires cancelation or supplying a response body. That turns a diagnostic read into an invasive proxy/replacement path. [CDP Fetch contract](https://chromedevtools.github.io/devtools-protocol/tot/Fetch/).
- `chrome.debugger` requires `debugger` permission; AION's existing [manifest](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/extension/manifest.json) **does not declare it**. Prefer a **separate, temporary research-only collector/isolated browser** over broadening AION's live extension just to test viability. Any CDP remote-debugging port must be bound and authenticated/isolated; no exposure to LAN/public interfaces.

## Capture architecture to assess, not prematurely implement

```text
Owner-authorized signed-in Chrome / exact chatgpt.com tab
    |
    +--> [research-only CDP capture] -- per-request raw chunks / WS frames
    |                                   |
    |                          [bounded queue, gap signals]
    |                                   |
    |                          [local append-only raw segments]
    |                                   |
    |                       [protocol decoder + timestamp/index]
    |                                   |
    +--> [existing AION DOM receive] ---+-- compare visible output / message IDs
                                        |
                                [local read-only query API]
```

The *raw local capture* is sensitive. Keep on the owner's Windows machine; explicit retention/volume controls are a storage design constraint, not a justification to silently truncate. Research docs/issue comments may include only **aggregate non-sensitive diagnostics, code/status hashes and synthetic fixtures**. No authentication headers, cookies, account addresses, hidden/private transcripts or HAR uploads to GitHub.

## First falsifiable experiment

**Before coding another bridge:** in a dedicated authorized Chrome test session, capture **one short and one long ordinary model response** from an explicitly selected pre-existing chatgpt.com conversation with CDP read-only Network instrumentation. Measure:

1. **Actual transport:** HTTP streamed response vs native EventSource vs WebSocket vs multiple sources; identify type from browser-observed request IDs and MIME/protocol, *not from guessed private endpoint names*.
2. **L1/L2 capture feasibility:** does `Network.streamResourceContent` work on the observed response? Did it yield `bufferedData` + incremental `dataReceived.data`; did WebSocket/SSE events arrive? Are chunks ordered and decodable, with no observed missing bytes?
3. **Completeness vs UI:** compare final visible reply with decoded received content while preserving raw bytes and all unknown envelopes. Preserve redacted diagnostic receipt only in GitHub.
4. **Latency:** timestamp first browser chunk, first raw local receipt, first DOM update and final completion; p50/p95 requires many trials, not two.
5. **Negative tests:** attach after stream start (can prefix be recovered?), tab reload, extension/target detach, browser pause, slow local disk/backpressure, mixed simultaneous requests, large answer; **do not** infer losslessness if untested.
6. **Stop conditions:** capture unexpectedly includes sensitive other-site/account traffic; a privilege prompt is broader than authorized; page rendering changes/fails due to observation; untrusted payload treated as an instruction.

**Evidence standard:** exact Chrome/Windows version, source/build SHA of collector, permission scope, transport-class counts, timestamps and byte counts, which capture API succeeded, and known gaps; all raw payload stays local. The result determines whether A1 is viable or A2 should be tested. Development and Toolsmith take ownership of any selected implementation and host acceptance.

## Research disposition

**Source readiness:** platform protocol documentation supports the candidate methods. **Product/site viability:** UNKNOWN until exact ChatGPT browser transport is observed. **Current AION capability:** DOM-based, bounded watch-only source merged, not “full raw streaming.” **Recommendation:** prioritize a small isolated CDP **Network** feasibility test, parallel DOM oracle, then make a measured capture-path decision; do not add a new permanent proxy or rewrite current native host on speculation.
