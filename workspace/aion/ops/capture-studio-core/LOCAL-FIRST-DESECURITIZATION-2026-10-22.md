# CORE — Local-PC de-securitization sweep

**Owner direction (2026-10-22):** Capture Studio is a single-user application running on the owner's local PC. Remove mandatory security theater, credential-based data deletion, unnecessary confirmations and artificially small limits that obstruct development, usability and evidence fidelity. Do not confuse retained *data integrity or effect sequencing* with security gates. This document is a source/architecture sweep, not proof of installation on Windows.

## Operating model

**Default:** `CAPTURE_STUDIO_CAPTURE_MODE=local-raw` (implicit), with immediate in-scope HTTP/WebSocket/EventSource raw capture. Preserve headers (including auth/cookies where observed), original URL/query, request body, response bytes, outgoing WS frames and recorder lifecycle URLs in the **local data directory**. No pattern quarantine or 128-byte holdback in this mode. Existing `filtered` mode and its scanner remain optional. Explicit `CAPTURE_STUDIO_CAPTURE_MODE=filtered` or profile `capture.privacyMode="filtered"` restores filtered capture.

**UI:** `CAPTURE_STUDIO_ACCESS_MODE=local` defaults to direct `http://127.0.0.1:<port>/` without a repeated token sign-in. Explicitly injected token or `CAPTURE_STUDIO_ACCESS_MODE=token` retains token access for scripts/deployments that request it. Server continues binding 127.0.0.1 and validating Host/Origin. This is access to a local app, not an internet-facing service.

**Network truth:** Captured data lives outside the Git repository by default. Studio does not itself include automatic cloud sync or telemetry. Explicit online AI sends still leave the PC through the real browser (provider's website), and GitHub source commits are remote; these are not equivalent to uploading session evidence. Local webhooks can explicitly include data, but their destinations remain literal loopback.

## Source sweep

| Surface | Prior friction | 2026-10-22 source disposition |
| --- | --- | --- |
| HTTP streaming | Per-chunk credential masking; suspicious marker drops rest of stream, delays bytes | **REMOVED from default raw path**; optional filtered mode retains scanner. `1ff8375d` |
| Auth/session URLs | Hard-coded metadata-only exclusions | **REMOVED in raw mode for in-scope targets**, filter available. `1ff8375d` |
| HTTP headers, query, request/response bodies | Cookies/auth hidden; token queries masked; POST bodies omitted | **PRESERVED locally by default** through capture privacy facade and NetworkRecorder. `6f2d852d`, `1ff8375d` |
| Outbound WS / WS and EventSource | Sent frames default metadata-only; marker-triggered delays/discards | **Raw body enabled and immediate** in local mode; filtered path remains. `1ff8375d` |
| Recorder lifecycle URLs | URLs redacted even for local raw | **Preserved locally** through privacy-aware recorder update by team, `0ed25231` |
| Rendered DOM / DOM snapshots | `DomObserver` still unconditionally invokes `scrubText` and `redactUrl` | **OPEN**: optional local-raw fidelity not yet integrated. An attempt to change this path was blocked by repository tool controls; no commit or claim of completion |
| Studio browser UI | Forced token URL, cookie login | **Local mode direct URL**; token opt-in, existing strict clients preserved. `135b7842`, `499ae71d`, `eb45360f` |
| Drive UI | Redundant checkbox beyond explicit user's action | **One-click user action** through UI lane, `f40da5d0`, `4a52641b`; real sends remain explicit |
| Prompt limits | ~2k-character arbitrary limit | **Raised to 250k characters** by parallel lane (source), subject to HTTP body size and browser/provider constraints |
| Drive target URLs | HTTPS only, disallowed URL query and local fixtures | **Allows localhost HTTP fixture URLs and queries**, arbitrary remote cleartext HTTP remains disallowed. `69f039e4` |
| Webhooks | Redundant `confirm:true`, fixed 16 subscriptions | **Removed**; registration itself is the user action. PC-only destinations remain. `e17fc725` |
| Data scope | Explicit site/target selection, third-party filters | **KEPT as useful user-selection/performance controls**, not a blanket security requirement. Broaden a profile's origins deliberately to see more |
| Capture quotas, API body size and 1-message runtime | Resource/implementation constraints | **NOT REMOVED by this pass**; 0 = unlimited raw session quota already available, but API body cap and one-turn conversation engine need product design/measurement rather than calling them security |
| Send-once / idempotency, browser lease, exact target, history truth | Prevent duplicate external sends, races, corrupt history | **KEPT**: correctness and effect accounting, not security rituals |
| 127.0.0.1 binding, Host/Origin validation, local-only webhooks | Prevent accidental remote exposure of unredacted local evidence | **KEPT** as required boundary for the owner's stated local-PC design |
| No mandatory CI/QA gate | QA reports evidence separately | **KEPT**: independent QA does not block daily development and source pushes |

## Evidence and next pull

Committed new CORE-owned Node fixtures:
- `test/unit/local-owner-capture.test.mjs` — default raw, opt-in filtered, sensitive in-scope URL/headers/request body, full HTTP bytes, outgoing WS, parsed SSE.
- `test/unit/drive-api.test.mjs` — local HTTP fixture URL + query accepted in mocked Drive; remote plaintext HTTP rejected.
- `test/unit/local-webhooks.test.mjs` — owner registration without duplicate confirmation, more than 16 hooks, literal loopback destination constraint.

**Executed in this chat:** GitHub remote readback for CORE edits; source-loaded V8 synthetic CDP exercised raw request/headers/body, split HTTP bytes, outgoing WS, parsed EventSource, and optional filtered mode. All listed V8 checks passed. **Not executed here:** full native Node suite, browser, Windows local installation, raw JSONL→exports across every surface, independent QA. CI startup failure is not a test result.

**Remaining useful CORE work (in order):**
1. Reconcile unrestricted DOM text/HTML capture through a supported authorized path; do not claim it is already done.
2. Run native Node suite + multi-stream capture tests on an actual checkout; verify downstream export preserves expected raw bytes, and check resource cost/storage.
3. Expose current mode and user-adjustable scope in one visible UI control rather than scattered config; preserve `filtered` as an optional user choice.
4. Remove remaining *usability* limits only after separating actual product invariants from arbitrary constants (including one-turn conversation lifecycle, body upload size).
5. Keep source-to-Windows provenance honest: no claimed local setup, browser login or captured-data migration until verified on the owner's PC.

**Bottom line:** Local raw is now the default for network and recorder URL evidence, and localhost UI/Drive/webhooks are significantly less ceremonial. This is a substantial sweep, **not total elimination of every restriction or full end-to-end DOM fidelity**.
