# Agent 14 — Round 9: binding correctness and independent Adapter Factory qualification

Date: 2026-10-24. **Status: ready-to-integrate candidate, not a production runtime update.** These are narrow, source-backed improvements to the Z.ai Round 8 export (23-patch proposed head `23185932abc7615a25207111f07328ebfb2a0074` on AION main `e652a705e4dffe543a0c4ebcf402a6eed3e1d2bc`).

## What was actually reproduced

1. Z.ai `src/studio/harness-api.mjs` calls `recordSubmitIntent()` before `runs.step()`. The original Round 8 `src/studio/intent-bindings.mjs` rejects **any** second `record` of the same `(runId, stepKey)` with `INTENT_BINDING_EXISTS`, including an identical replay. An isolated invocation proved that failure. The run-store's idempotent replay never gets a chance to execute; therefore no same-key replay acceptance can be claimed for the integrated harness API.
2. `synthesizeWebappAdapter()` plus `shadowEvaluateAdapter()` recommends `candidate-read-only-preview` when the **identical three capture IDs** are supplied to both training and shadow evaluation. Round 8's service re-computes the receipt but does not check training-versus-held-out independence. This is not evidence of predictive generalization.
3. Original intent record creation is an `existsSync()` then tmp-rename without exclusive creation; concurrent writers can race. `complete()` has no short record lock. Neither path fsyncs the new file. These are code-inspected persistence weaknesses. They are **not** evidence of a witnessed real Windows incident.

## Deliverables

- `intent-bindings.mjs`: candidate *drop-in replacement* for Z.ai Round 8 `src/studio/intent-bindings.mjs`. Same `createIntentBindingStore({dir})` API and `record`/`complete`/`find`/`verify` methods. `record` uses exclusive file creation (`wx`) and returns the existing binding **only** for exactly the same verified intent; altered tool/args/conversation/thread fails. It does not grant execution. `complete` uses a short filesystem lock, per-record checksum, flushed writes and exact completion replay; corrupt/partial records fail closed. The existing run store and conversation journal remain the sole authority for effects.
- `adapter-holdout-gate.mjs`: `assertIndependentAdapterHoldout(candidate, heldoutSessionIds)` rejects missing, overlapping, or truncated training evidence. Call from the existing `createAdapterFactory(...).shadowEvaluate()` and `promote()` *before* re-computing the shadow check. The caller must pass authoritative **server-selected** saved session IDs, not invented client provenance.
- `guardrails.test.mjs`: 12 independent Node 22 checks, including same-key replay, changed-identity rejection, completion conflicts, corrupt record abstention, held-out reuse rejection, and an actual two-child-process race.

## Run in this directory

```powershell
node --test guardrails.test.mjs
```

## Integration checklist for Z.ai

1. Read the existing Round 8 `intent-bindings.mjs`, `harness-api.mjs`, `adapter-factory-service.mjs`, the owning journal and old tests before replacing anything. Preserve Canonical Studio's one runtime/actor. Consider reading pre-existing run-step metadata before calling `record`, but do not remove the durable pre-effect link for a **new** send.
2. Install the binding store after review. A repeated exact key must pass through to the hardened `runs.step()` replay path; a changed intent must conflict. Run the real harness API integration regression, including an identical replay after a successful submit, after a failed pre-dispatch validation, and after an uncertain effect; **never send a second effect**.
3. **Storage compatibility:** This supplier adds an integrity checksum to stored files while preserving the exported record shape returned by `find()`. Existing unchecksummed binding files become unreadable (fail-closed). Inventory/back up any existing stores first; do not silently overwrite or auto-migrate them. Qualification and migration belong to the integration owner.
4. Add `assertIndependentAdapterHoldout(candidate, sessions.map(s=>s.id))` to server-side `shadowEvaluate` and `promote`. Prove a client cannot choose the training session IDs as the validation set; ensure the training corpus is captured completely (the candidate's first 80 references is insufficient when truncated). Explicit separate held-out corpora are necessary but not alone sufficient for real-site acceptance.
5. Run the full product suites, real Chrome synthetic fixture, Windows/NTFS file-lock and process-crash recovery tests. Directory fsync is not portable on Windows; no claim of machine power-loss durability. No Playwright/Puppeteer, no new browser writer, no API substitute.
6. Keep promotion on a safe owner-controlled, evidence-qualified **read-only** path. Provider-native send/reply continuity, Claude identity/Connect decoding, rich blocks/artifacts and authenticated two-turn acceptance are still open.

**Evidence:** 23-patch export SHA256SUMS 24/24 OK; original extracted source inspected; 34 original pure supplier tests + 12 new guardrail tests independently executed in this audit (not the full product suite). Z.ai's 1325 passing unit tests, 14/14 existing Chrome checks and 15/15 previously unknown synthetic webapp demo are **integrator-reported**. None demonstrates a signed-in real ChatGPT/Claude two-turn harness acceptance, Windows live test or GitHub promotion of the 23 patches.