---
name: chief-proof-triage
description: Triage disputed AION milestone or agent-completion claims into source, local-host and independent-live evidence levels; run a deterministic receipt completeness check without granting acceptance.
---

# Chief proof triage

## Trigger
Use when a role requests executive acceptance of I1/I2/M1, a deployment, a worker execution, or another consequential milestone. Do **not** use for routine unit test gating, technical debugging or to override milestone contracts.

## Execute
1. Read the **actual milestone acceptance contract**, root governance and primary source/host receipts. Get the exact claimed outcome and its revision; ask Development/Windows for genuine missing host proof through CoS when needed.
2. If a sanitized JSON evidence summary exists, run from AION root: `node workspace/aion/sessions/roles/05-chief-of-chiefs/skills/chief-proof-triage/scripts/check-receipt.mjs evidence.json`. This is read-only and contains **no** credentials, conversation IDs, private transcript text or machine identifiers. Schema is documented below.
3. Compare program warnings with source records; challenge false evidence promotion (GitHub merge → installed, IPC ping → exact-thread read, first-pass Send → one-effect verified). Do not infer truth merely because an operator set a JSON boolean.
4. Decide **PASS / FAIL / UNKNOWN** using the *real* acceptance contract and independently inspectable evidence; send one concrete correction or missing proof to the responsible owner. A `REVIEW_READY` script result is **never** a PASS.
5. Persist a verdict only when new evidence materially changes an existing owner-maintained source. Chief owns disputed executive acceptance, Toolsmith owns mechanical proof and Development owns implementation/tests.

## Minimal JSON input
```json
{
  "milestone": "I1",
  "claim": "live-accepted",
  "source_ref": "https://github.com/owner/repo/commit/<full SHA>",
  "loaded_revision": "full SHA or verified build ID",
  "observed_utc": "2026-10-21T12:00:00Z",
  "receipt_ref": "link to sanitized independent host receipt",
  "exact_target_verified": true,
  "positive_case": true,
  "negative_case": true,
  "independent_review": true
}
```

All input claims are **assertions requiring external verification**. Omit any unverified field instead of inventing it. `claim` may be `source`, `offline-tested`, `host-loaded`, `live-observed`, `live-accepted`; the checker reports missing evidence for that *claimed* level, not a true maturity score. I2/M1 acceptance also requires contract-specific effect/correlation tests not represented by this minimal schema.

## Test and recovery
`node --test workspace/aion/sessions/roles/05-chief-of-chiefs/skills/chief-proof-triage/scripts/check-receipt.test.mjs`. Input is read-only; invalid or incomplete files receive nonzero status. If evidence source cannot be inspected or host unavailable, return `UNKNOWN`; never manufacture a PASS or trigger a Send. OpenCode V2 source registration is separate from actual invocation; ZCode requires native import/enable + host proof.
