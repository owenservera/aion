# Z-FORGE — Clone / Run / Test Assembly Instructions (staging)
**Status:** BUILD PACKAGE DESIGN, not eight received employee components or Z.ai-executed code. Integrator: Role 08. Work-order issue: https://github.com/owenservera/aion/issues/24
**Human/master machine:** user's local Windows source; Z.ai Linux sandbox is disposable experimental executor.
**Canonical repo:** `owenservera/aion` main, private; no new repository/branch mandated.

## Repo access and initial sandbox preflight
If Z.ai Agent Mode has an owner-authorized **read-only** clone capability to this private repo, clone at a **frozen SHA** that Z-FORGE supplies only after all artifacts/inputs are verified:
```sh
git clone --filter=blob:none --no-checkout <authorized-repo-url> aion
cd aion
git fetch origin <PINNED_COMMIT_SHA>
git checkout --detach <PINNED_COMMIT_SHA>
git rev-parse HEAD
```
Do not paste GitHub PATs, browser cookies, private user sessions or SSH keys into a prompt, exported log or code. If Z.ai cannot reach the private repo without credentials, stop remote clone and instead prepare an **explicitly approved minimum source capsule** (ZIP+SHA-256) on the authorized local machine and upload it through the user-visible Z.ai attachment flow. Do not assume that flow was tested or that a ZIP was already created.
**Do not assume clone authorization, sandbox persistence, Chrome extension installation, or GitHub push capabilities.**

## Source resolution after authorized clone
Read exactly:
- `workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` and `AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md`.
- `workspace/aion/ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md`, `MISSION-TEMPLATE.md`, `RESULT-RECEIPT.md`.
- `workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md`, `ARCHITECTURE.md`, `FALLBACK-AND-ACCEPTANCE.md`.
- `m1-council-prep/README.md` + `PACKAGE-MANIFEST.json`.
- Available genuine `components/` only; missing role artifacts remain pending, not fabricated.

## Z.ai build objectives — smallest turn sequence, optimize after role feedback
**Turn S1:** Implement an isolated MOCK destination web page (not ChatGPT) plus request/return envelope and typed correlation/state machine with `node --test` positive/negative cases; export build+tests.
**Turn S2:** If required, implement browser adapter MV3 fixture for only mock origin and observable message/response capture, with login/selector/partial-stream/duplicate/timeout negative cases; native browser preview only if actually supported. No Playwright or Puppeteer.
**Turn S3:** Only if not achieved by S1/S2, connect simulated bridge+recoverable outbox + proof validator and produce repeatable handoff/rollback bundle.
**Owner-controlled live trial is not a Z.ai turn**: separate authorized local browser/ChatGPT account test AFTER independent artifact verification.

## Required artifact layout after Z.ai actually produces it
```
m1-sandbox-output/
  README.md
  source/                  # actual generated code, never fake placeholders
  tests/                   # actual runnable positive/negative tests
  scripts/                 # actual run/test/clean commands if needed
  evidence/                # real stdout, runtime info and screenshots if present
  manifest.json            # exact model/run/input commit/files/tests/hashes
  LIVE-TEST-HANDOFF.md     # target installation, approval, manual stop and rollback
```
These are **future outputs**, not files already in repo.

## Z-FORGE final compilation gate
A deliverable is READY_FOR_ZAI only when:
1. Role 08 has read and reconciled actual contributor evidence or source-based fallbacks clearly labeled.
2. A frozen commit SHA (or approved minimal source capsule SHA) identifies every input.
3. There is one primary per-turn objective, exact file paths to produce, runnable test commands and negative cases.
4. The sandbox output and proof formats are explicit; no made-up tests or hashes.
5. Z.ai's inability to touch the owner's authenticated ChatGPT session is explicit.
6. Source changes have no automatic permission to update the owner's master.
7. Chief (05) accepts staged scope and CoS (03) confirms owner-submission mechanism.

Actual outputs are promoted through CREATED -> SANDBOX_TESTED -> EXPORTED -> INDEPENDENTLY_VERIFIED -> READY_FOR_AUTHORIZED_LIVE_TEST. Only separate authenticated AION -> real ChatGPT -> AION evidence can demonstrate M1 PASS.
