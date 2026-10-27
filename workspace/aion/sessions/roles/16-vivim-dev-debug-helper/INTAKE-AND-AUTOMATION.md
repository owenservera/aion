# Transcript intake and automation design

## Current implementation status
This is an operational design and a manual triage contract. No local watcher, export hook, persistent indexer, scheduled automation or running service has been installed. Automation requires a local agent to implement and run it on the owner's PC.

## Input
One or more Markdown OpenCode/ZCode session exports. Intake accepts exports as attachments. Store privately; never commit raw transcripts or their message bodies. If future local integration can read OpenCode's official session-export mechanism or local session storage, prefer that supported read-only path over scraping a browser UI.

## Minimal derived schema (redacted)
session_id, created_at, updated_at, repo, git_head_observed, runtime_host, service_port_observed, cd_port_observed, tool_calls[{kind, timestamp_or_line, outcome}], events[{id, line_start, line_end, class, summary, evidence_tier, disposition}], suspected_defects[{title,severity,confidence,evidence,disproof_check,owner}], final_state, redaction_status.
Do not copy secret values or user prompts into the derived index.

## High-signal event categories
- ENVIRONMENT: cwd, Node, platform, services, ports, data-root, Chrome profile ownership.
- GIT: local/remote HEAD divergence, dirty files, worktrees, conflicts.
- TOOLING: command errors, unavailable tools, permission failures.
- CODE: actual runtime exception or reproducible assertion mismatch.
- BROWSER: target origin/thread binding, account/login walls, uncertain send/retry state.
- TEST: exact command, pass/fail/skips and tier, commit tested.
- LOOP: repeated tool call or unproductive diagnosis without discriminating test.
- BLOCKER: permissions, external service, owner decision, unsupported claims.

## Streamlined path
1. Local developer exports a session (or a future *read-only* local hook emits a safe export reference).
2. Intake filters commands/results, important state changes, errors and assertions; creates a compact metadata-only timeline.
3. Debug helper correlates events with source and prior accepted baseline. It marks resolved interim errors as RESOLVED, not P0.
4. If a real defect is established, produce one evidence-backed handoff with file/function, repro, expected/actual behavior and regression criterion.
5. Existing local agent applies changes; next transcript checks proof and convergence. No new execution owner.

## Candidate automation, not yet enabled
A lightweight local Node >=22 script can consume an explicitly selected OpenCode export, generate a JSON timeline, scrub sensitive fields, calculate a digest, and output only changed incidents since the previous index. Run on-demand first. Do not assume automatic background access to ChatGPT uploads. If on-demand proves valuable, the existing local agent may attach it to its export workflow; no additional dependency, daemon or scheduler is necessary.

## Seed diagnosis: BINDING_CHANGED
Historical 2026-10-27 export: failure at browser readiness before typing/sending, with existing Studio dataDir C:\VIVIM, CDP port 38702 and HTTP port 38703. Browser adapter checks target URL and page origin/path/thread. Mismatch metadata were not retained: root cause UNKNOWN.
Discriminating check: in existing browser actor's *read-only preflight*, capture redacted expected/actual origin, pathname/thread identifier, targetId, target URL and time; separately note whether a navigation occurred before the check. Never dump credentials, query tokens, complete conversation text or other users' tabs. Do not send or retry a prompt.
