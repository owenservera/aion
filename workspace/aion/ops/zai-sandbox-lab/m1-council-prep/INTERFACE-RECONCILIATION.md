# M1 Z-FORGE — Interface reconciliation and source-status decisions
Status: Z-FORGE source-based integration, NOT a role 01/02/03/04/06/07 contribution. Not a live implementation. Owner: 08. Read alongside PACKAGE-MANIFEST.json and README.md.

## Evidence actually present
- Canonical M1: `workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` (Git blob `88195a974baf2c7e1f7d9c5077ede6b1a42c92a0`): only real AION-origin ChatGPT WEB APP reply, return and AION consumption establishes M1.
- M0.5: `workspace/aion/canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md` (blob `a076e45e75ce297b6e6645892db06c0c56759e87`): existing BFF Linux live route, separate approval; does not transfer authenticated sessions to Z.ai.
- Relay envelope: `workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md` (blob `474470d9d297f066b0b0798d13f5195dcc0ac29d`): **proposed** relay-level event fields and distinct delivery/task states; not ACP wire protocol.
- Relay architecture: `workspace/aion/ops/chrome-relay/ARCHITECTURE.md` (blob `63ef12b07f65c8f156c2460ae46c0c7952c8c156`): MV3 edge with explicit user gesture; native host performs authority checks; no installed extension claimed.
- Relay fallback/acceptance: `workspace/aion/ops/chrome-relay/FALLBACK-AND-ACCEPTANCE.md` (blob `334384f21a5166ac3c24010ff81dc692fe8f3252`): truthful connected/offline states, no automatic privileged fallback.
- Existing real role contribution M1C-05: `components/ACCEPTANCE-GATES.md` (blob `166b609a3354e03e437b93cebea6c2300c436d77`): pre-live vs authenticated-live promotion.
- M1C-01/02/03/04/06/07: **NOT RECEIVED AS EMPLOYEE REPORTS** in #24 or components directory at integration read. The following are integrator-derived fallbacks from the pinned canonical sources, NOT employee confirmations.

## Interface decision (source-derived fallback, not a deployed protocol)
The sandbox shall expose `acceptRequest`, `transportAck`, `observeMockReply`, `consumeAtOrigin`, `verifyMockProof` as separate independently testable operations. Wire payload fields follow the proposed relay envelope; only authorized native host can translate to ACP JSON-RPC after version/capability negotiation. The mock app and mock responder never call ACP or an actual ChatGPT account.

```json
{
  "schema_version":"relay.v0.1",
  "message_id":"unique-message-id",
  "correlation_id":"unique-correlation-id",
  "causation_id":null,
  "idempotency_key":"stable-request-key",
  "producer_node":"aion-fixture",
  "target_node":"mock-chatgpt",
  "target_role":"mock-responder",
  "event_type":"task.proposed",
  "created_at":"UTC ISO-8601",
  "expires_at":"UTC ISO-8601",
  "sequence":1,
  "priority":"test",
  "approved_scope_ref":"fixture-only",
  "payload_ref":"in-memory-or-local-fixture",
  "payload_hash":"sha256:computed-hex",
  "delivery_state":"OUTBOX",
  "task_state":"PROPOSED",
  "provenance":"MOCK_ONLY"
}
```

The snippet is a **shape example** with placeholders, not a valid signed executable work order or precomputed hash. A claimed `producer_node` in page JSON is untrusted until mapped to verified channel principal; a mock fixture must explicitly simulate that mapping and test forged claims.

## Non-equivalent lifecycle facts
1. `OUTBOX → SENT → ACKED` = delivery transport only; RETRY and DEAD_LETTER represent delivery recovery.
2. `PROPOSED → APPROVAL_PENDING → APPROVED → DISPATCHED → ACCEPTED → RUNNING → PROOF_SUBMITTED → VERIFIED/REJECTED` = the separately documented task lifecycle, NOT inferred from delivery ACK.
3. `MOCK_REPLY_OBSERVED` requires full mock-page reply text + exact conversation ID + correlated request + completion signal; merely seeing a DOM node or partial text does not qualify.
4. `RETURNED_TO_AION` requires the actual corresponding response bytes/reference arriving at the origin-side fixture, not sender echo.
5. `AION_READBACK` requires distinct origin-side assertion of returned response content; never equate return delivery with consumption.
6. `SANDBOX_PROOF_ACCEPTED` may only attest MOCK behavior after evidence hash and independent test checks; it can never emit `M1_VERIFIED`.
7. `UNKNOWN` is an allowed dashboard/observation result, not success.

## Contract between Z.ai outputs and existing architecture
| Sandbox module | Contract | Existing seed | Must not imply |
|---|---|---|---|
| mock destination | local-only HTTP page with loud MOCK banner, 2 distinct conversation IDs and deterministic reply | Z-FORGE M1-prelive P1/P2 | Real ChatGPT UI tested |
| relay state core | source hash, stable IDs, transitions, bounded repeat, no arbitrary command | relay ENVELOPE-CONTRACT | ACP/native command execution |
| fixture browser adapter | mock selected conversation and full response completion, explicit send gesture in UI | Chrome relay ARCHITECTURE | Production DOM compatibility |
| persist/recover | local test outbox, ACK cursor, replay dedupe, intentionally injected crash | relay FALLBACK-AND-ACCEPTANCE | Production delivery verified |
| independent verifier | reconstruct source→mock send→mock reply→origin readback, check digests | 05 ACCEPTANCE-GATES | M1 PASS |
| evidence/export | node:test logs, output file checksums, ZIP, clean-rerun guide | CLONE-AND-ASSEMBLY, RESULT-RECEIPT | Sandbox export or owner import happened |

**Conflict handling:** the relay design uses optional Chrome native messaging while M1 requires an actual response from a specific owner's authenticated web app. The sandbox tests only the abstraction/fixture; production selectors, login state, chat URL and permission are UNVERIFIED_ON_TARGET. Chrome content-script design must not trigger automatic prompts or scrape account-wide transcripts. No Playwright/Puppeteer. The existing Chrome role launcher is not a dependency.

## Dependency order / turns
Source freeze + one primary Z.ai build+test+export turn; optional one strictly repair-only turn if negative cases/export fail. No dedicated Z.ai research turn. Independent reviewer gates after actual artifact. Live authorization separate.

## Owner roles
01 event observability report missing; fallback above. 02 path report missing; fallback above. 03 CoS handoff/ACK report missing; fallback CLONE-AND-ASSEMBLY. 04 measurement report missing; assume costs UNKNOWN. 05 supplied real gates (not yet reviewing build). 06 adapter report missing; fallback relay source. 07 source map report missing; source locators retained. 08 owns this reconciliation and proof packaging.

Status at authoring: PACKAGE_PREPARED_FOR_REVIEW, NOT SANDBOX_TESTED, NOT LIVE_READY, NOT M1_VERIFIED.
