# 🟪 Capture Studio UI — Windows handoff (2026-10-22)

**Owner:** UI / Integration · **Scope:** last short remote source pass, not another speculative feature cycle.  
**Runbook authority:** [QA L0–L5 / evidence contract](https://github.com/owenservera/aion/blob/main/workspace/aion/qa/capture-studio/LOCAL-INTEGRATION-ROUNDS-2026-10-22.md).  
**Git authority:** Windows checkout is local operator master. Pin `git rev-parse HEAD` on the machine; never assume its code equals GitHub main. This document is not a claim of installed or executed local software.

## Shipped last-pass behavior

1. **Existing Chat and Drive provenance remains conservative:** both link to the exact saved `sessionId`; when Core provides only a session, UI does **not** invent a raw stream or event sequence. Saved session and derived Knowledge remain separate; a matched reply is not capture acceptance.
2. **Exact evidence permalink:** `/#session=<encoded-session-id>&view=streams&sid=<encoded-stream-id>&seq=<nonnegative-seq>`. Both `sid` and `seq` are optional *as a pair only for the sequence*: `view=streams` may open a stream list without SID; `sid` may open a verified stream without sequence. Existing `/#session=...` and `&view=knowledge` links still work.
3. **Verification before navigation:** session detail resolves through the actual saved-session API; the stream list must include the requested SID. No substitution on 404, missing SID, malformed parameters, duplicate parameters or mismatched session. No replay/derive/send API call is part of the deep-link handler.
4. **Precise original observation:** Knowledge revision provenance and Search hits show a shareable `Open stream` link **only when both a saved session and SID exist**. A valid Core-provided numeric sequence is included; otherwise only the stream is linked. For a decoded event or raw chunk with matching sequence, focus the exact item. When the bounded preview lacks that sequence, display this limitation rather than claiming an exact match.
5. **Stale-response containment:** stream reads and the exact-link handler check the active session/request epoch, so a slower older read cannot overwrite a different selected recording's stream details. Opening a permalink does not accidentally initiate two stream-list fetches.
6. **Local-first compatibility:** no added auth checkbox, security ceremony, cloud service, CDP actuator, or new backend capability; all links use the existing same-origin session APIs.

## UI-owned source edits

- `src/studio/ui/index.html` — deep-link parser, exact stream/SID ownership check, sequence focus or missing-preview disclosure, shareable Knowledge and Search links, stale-read invalidation.
- `test/unit/studio-handoff-ui.test.mjs` — additional source-handoff fixtures for valid encoded locators, missing/mismatched SID, invalid/duplicate locator arguments, failed stream read, and bounded-view sequence gaps.

**Verification:** 67/67 UI contract cases executed on GitHub-readback code in a V8 compatibility harness (Studio 6, Knowledge 18, Search 6, Integration 7, Handoff 14, Recovery 16). The editor also parsed the complete Studio inline script. This is NOT native Node 22 `node --test`, local Windows/Chrome, or independent QA acceptance.

## First local diagnostic run (UI portion of L0/L1)

From the Windows **Capture Studio root** (not the AION repository root), record command, exit code, exact Git SHA, and any exceptions:

```powershell
node --test test/unit/studio-handoff-ui.test.mjs
node --test test/unit/studio-integration-ui.test.mjs test/unit/studio-recovery-ui.test.mjs test/unit/studio-search-ui.test.mjs
```

In local Studio, select an existing or disposable fixture recording and exercise the routes using its actual ID/SID: saved session, derived Knowledge, exact Streams link and optional actual sequence. Record the observed URL, API status, displayed session, stream IDs, raw chunk/decoded event count, focus result, missing evidence note and screen evidence under the QA local-only evidence directory. No live provider sends are required for this UI round.

**Minimum regression matrix:**

| Case | Expected behavior |
| --- | --- |
| Valid saved session ID; legacy hash | Display exactly that session; never auto-derive or send |
| Knowledge hash for saved session | Select recording first; warn if derivation is missing/incomplete |
| Actual saved session + real SID | Stream shown only if the session's stream list contains that SID |
| Valid SID and sequence present in visible decoded events or raw chunks | Exact observed source item focused; no inferred acceptance |
| Sequence not present in bounded preview | Recording/stream still open, missing precise sequence labelled |
| Wrong SID / missing session / malformed or duplicate params | No unrelated source displayed; visible diagnostic and recovery |
| Two links requested rapidly | Latest requested session wins; no stale results |
| L0 local access and reconnection | No token needed by default; failures remain explicit |

## Explicit deferrals for local feedback

- **DOM-only deep links:** Core's durable DOM block locator has not been proven for this handoff. Do not turn an unverified DOM node ID into a stream SID or fake a raw sequence. Open the recording and label source detail unavailable until a real evidence locator is furnished.
- **Type-drift side-by-side tool:** review-only structure hints are already in source; broader comparison UI is deferred pending L4 evidence of actual need. No inferred identity merge or automatic corrections.
- **Large histories/mobile/latency:** do not optimize speculatively. Measure with L5 replay and feed owner-specific bottlenecks back to UI.
- **Native/browser acceptance:** pending on the owner's Windows machine; QA owns independent decision.

**Ownership loop:** failures in UI deep-link parsing/render/focus belong to UI. Missing or ambiguous Core locator/API data belongs to Core. Derivation identity/time-truth behavior belongs to Knowledge. QA collects `run.json`, `steps.jsonl`, `failures.jsonl`, `metrics.json`, `summary.md` locally and supplies sanitized minimal reproductions. This note is not an agent wake-up.

**Next action:** stop broad remote UI changes; use actual L0/L1 Windows feedback to prioritize the next patch.
