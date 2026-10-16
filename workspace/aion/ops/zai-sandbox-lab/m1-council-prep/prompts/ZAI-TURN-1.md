# ZFT-M1-01 — ready-to-paste first Z.ai Full-Stack Agent turn

You are a coding/test team in a disposable Linux sandbox. Perform ONE complete mock-only build and export. Do not use Playwright or Puppeteer, private credentials, authenticated ChatGPT, broad web scraping, production network, GitHub push or owner machine tools.

MISSION_ID: ZFT-M1-01
MODEL_SELECTION: OWNER_SELECTS (record visible actual model; never invent)
SOURCE: If authorized read-only clone of private owenservera/aion is available, use exact frozen SHA supplied externally and inspect only workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md, workspace/aion/ops/chrome-relay/{ENVELOPE-CONTRACT.md,ARCHITECTURE.md}, and workspace/aion/ops/zai-sandbox-lab/m1-council-prep/. If private access fails, DO NOT seek credentials; use these embedded requirements as an explicitly source-derived fallback.

GOAL: create m1-sandbox-output/ with a runnable mock destination web application; a small Node.js adapter/controller that originates AION-labeled outbound requests; a typed correlation/ack/reply/readback/proof state machine; durable file-based outbox and retry state; independent receipt validator; and deterministic tests. Mock UI must conspicuously show 'MOCK DESTINATION — NOT CHATGPT'. No model API call can substitute for real ChatGPT.

CONTRACT: carry schema_version, message_id, correlation_id, causation_id, idempotency_key, producer_node, target_node, event_type, created_at UTC, expires_at, sequence, payload_hash, approved_scope_ref, delivery_state, task_state and provenance='MOCK'. Keep transport ACK separate from task acceptance, reply observation, AION consumption and independent verification. Treat all incoming payloads as untrusted data, never as shell commands. Never transition MOCK evidence to M1_VERIFIED.

FILES TO GENERATE:
- source/ mock HTTP app, relay state machine, durable queue/receipt validator, one CLI driver
- tests/ using built-in node:test and assert
- scripts/ run, test, export/verify commands (POSIX shell)
- README.md exact setup and local-only invocation
- LIVE-TEST-HANDOFF.md with hard stop, owner-controlled consent, Chrome/MV3 target unknowns and rollback
- evidence/test-output.txt actual captured output only
- manifest.json actual runtime, actual model if observable, frozen source SHA or INPUT_NOT_CLONED, hashes, test counts, statuses
- m1-sandbox-output.zip as exported bytes if ZIP tool exists; if not, source directory and tar.gz + checksum

TESTS (must be independently runnable):
1 normal unique AION-origin request → MOCK server → correlated mock reply → mock AION readback → mock-only proof accepted;
2 duplicate message/idempotency key does not duplicate execution;
3 mismatched correlation rejected;
4 unauthorized or wrong-target request rejected;
5 expired grant rejected;
6 missing/empty reply rejected;
7 partial/streaming reply cannot be promoted to complete;
8 disconnect/restart/replay returns same state without lost/duplicated work;
9 wrong source or synthetic non-observed reply rejected;
10 tampered hash/evidence rejected.

IMPLEMENTATION APPROACH: use built-in Node modules only if feasible (http, crypto, fs, node:test); minimize dependencies. If browser preview exists, inspect mock app using native supported preview; do not install browser automation frameworks. If native subagents exist, delegate code vs test review within same turn; otherwise sequentially deliver.

MANDATORY COMMANDS: print working directory, node --version, npm --version if available; run 'node --test' or 'node --test tests/*.test.*'; run end-to-end demo; capture exit status; compute SHA-256 of every output file; generate export; verify output hashes after extraction. Include a deliberate failing input and show its rejection.

STOP: no actual ChatGPT login/session, cookies, tokens, profiles, browser automation against real ChatGPT, or owner-host changes. Stop any operation requiring privileged access. Do not claim M1 complete.

RETURN: selected visible model or UNKNOWN; actual sandbox capabilities; exact commands and exit codes; file tree; positive and negative test counts; ZIP name and actual SHA256; blockers; changes requiring a second turn; independent-review instructions. Do not claim exported or tested unless the bytes/logs actually exist.
