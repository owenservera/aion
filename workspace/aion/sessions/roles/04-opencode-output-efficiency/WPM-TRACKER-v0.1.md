# Role 04 — OpenCode WPM Tracker v0.1
Date: 2026-10-16
Owner directive: continuously observe the OpenCode bot(s) on BFF Linux, calculate visible assistant-output words per minute per session, publish a privacy-safe GitHub feed via the existing ~one-minute Git auto-sync. Start with the single bot currently reported; scale by session ID without new infrastructure.
Status: IMPLEMENTATION DESIGN + LINUX REFERENCE TESTED; BFF runtime deployment NOT YET VERIFIED.

## Exact operational contract
1. Local sampler: Python 3 stdlib utility. On BFF Linux, resolve actual OpenCode version and working directory. Every 5 seconds enumerate `opencode session list --format json` (explicitly per workspace) and read each session using `opencode export SESSION_ID --sanitize`. The installed CLI must be probed: flags/JSON shape are version dependent. Never fall back to unsanitized exports in the Git working tree. Process/tool output, human prompts and reasoning parts are excluded from words counted. Include visible assistant `text` parts only. One bot now, one row per session later.
2. Each text-part stable ID is measured incrementally. On first observation establish a historical baseline (zero newly emitted words). At later observations count positive growth only, deduplicate unchanged/replayed parts, and maintain a rolling 60-second bucket. Metric: `assistant_text_wpm_60s = newly observed visible assistant-text words in last 60 seconds`; don't conflate this with output tokens, source-code productivity, or exact server-side generation speed. At 5-second sampling the rate is a near-real-time estimate, not per-token timing. State `unknown` if no runtime evidence; session existence does not mean active.
3. Durable local private state, e.g. `/workspace/aion-bff-state/opencode-wpm-state.json`, file mode 0600, outside Git. No secrets, raw messages or tool output are allowed in the Git artifact. Atomic write of sanitized `workspace/aion/telemetry/bff/opencode/current.json` no more than every ~50 seconds; existing BFF autopush may propagate it on its ~60-second tick (when safe/operational). Never commit per-token or per-sample events.
4. JSON top-level `schema_version`, `generated_at_utc`, `metric`, `window_seconds:60`, `sessions[]`. Each session entry: `project`, `session_id`, `observed_at_utc`, `sampling_status`, `active_state:unknown` until independently observed, `new_words`, `words_60s`, `wpm_rolling_60s`, `total_observed_words`; omit numerical rates on fetch failure and use `status:source_unavailable`. Timestamp all feed production.
5. The repository feed is pull-based for AION; existing ~one-minute Git sync does NOT notify or wake the ChatGPT conversation. Role 04 queries `main` while active and can later connect event alerts to Issue #17's verified push infrastructure. Do not create a second alert service.
6. Safety: no host-browser activity, no arbitrary GitHub comment execution, no public inbound listener, no extra repository, no new branch, no modification of the current autopush script as a shortcut. Existing BFF host stop/order policy and OpenCode-only code-implementation rule remain gating constraints for deployment.

## Local Linux reference validation (not BFF proof)
A portable stdlib Python reference was implemented in the ChatGPT Linux sandbox at `/mnt/data/opencode-wpm/opencode_wpm.py` with `/mnt/data/opencode-wpm/test_opencode_wpm.py`. Linux CPython unittest discovery: 9/9 PASS on 2026-10-16:
- word parsing and assistant-only text filtering
- first-sample baseline, incremental rolling 60-second count and replay dedup
- multiple distinct session IDs
- missing runtime and failed export reported as unknown, not 0 WPM
- complete `--once` file emission and 0600 private state using absent binary; 4.7-second continuous loop with fake growing bot and refreshed WPM feed
- mocked OpenCode CLI subprocess integration using `session list --format json` and `export ID --sanitize`
SHA256 reference: `opencode_wpm.py` 62984f9a2de22ecfc52becb70548fe364d9b9bc7dc928a8bff7ef6ca426ce282 ; `test_opencode_wpm.py` 8065ca1e4a783058416227f258691013c6ff1f30949e1dabb0ada120d0ff39f7.
Caveat: ChatGPT's sandbox is Linux but does NOT have OpenCode installed and cannot see BFF host; mock and negative-path tests are NOT evidence of actual BFF runtime compatibility, active sessions, successful 1-minute sync, or live feed reachability. Reference artifact must be adopted/reviewed or reauthored through OpenCode/ZCode for BFF production.

## Runtime deployment package for BFF / OpenCode after scoped operating approval
- OpenCode/ZCode owns producing an audited utility under the existing `workspace/aion` folder; BFF does not author or edit code.
- BFF verifies `opencode --version`, feature/CLI flags, working-directory scope; read-only probe first.
- Run bounded `--once` twice with a harmless bot completion between samples; confirm positive output change in correct session, zero on repeat, correct rolling expiry, no private text in `current.json`.
- Run continuous sampler with restart policy on BFF Linux; collect service PID/start timestamp/log without credentials. No claim running until checked.
- Observe actual `workspace/aion/telemetry/bff/opencode/current.json` commit on GitHub main after a sync tick; independent Role 04 readback and hash verification. Time feed age and note routine Git delivery latency.
- Validate idle, one active session, two independent sessions, failed export/disconnect and auto-restart. Current user expectation is one bot; only add fan-out tests when appropriate.
- Do not use GitHub auto-sync as a <5s alert path. Later integrate event-driven error/permission notifications through the existing #17 transport once it has independently verified delivery.
- GitHub is a safe aggregate feed, not a transcript dump and not a push event into ChatGPT.

## Acceptance gates
G0: public spec, source limitations, local mocked Linux tests and GitHub handoff verified.
G1: BFF-host running utility verified + samples show correct session identity/counts.
G2: exact current.json remote main content readback from ~minute sync + accurate feed age.
G3: fresh activity reflects within bounded sample/sync lag, restarts recover, no secret exposures.
G4: AION automatically notified (future; requires supported inbound channel and live endpoint, not delivered by GitHub alone).

References: https://github.com/owenservera/aion/issues/14 ; https://github.com/owenservera/aion/issues/15 ; https://github.com/owenservera/aion/issues/17 ; https://docs.opencode.ai/docs/cli/ ; https://dev.opencode.ai/changelog .
