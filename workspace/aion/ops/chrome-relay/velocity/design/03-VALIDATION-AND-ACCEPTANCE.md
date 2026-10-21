# AION Track B — validation, fault matrix, Windows activation and independent acceptance

**Status:** Test design only. No live or hosted test success claimed in this document.  
**Source:** [Architecture](00-SOLUTION-ARCHITECTURE.md), [Contracts](01-PROTOCOL-AND-STATE-CONTRACTS.md), [Roadmap](02-BUILD-ROADMAP.md).  
**Operating facts:** Existing frozen integrated A source `fd347f22` passed extension 736, bridge 126 + one opt-in skip, bus 8 + two opt-in skips, MCP 10, adapter 35, demos 3/3 offline on 2026-10-19. A real UIA ChatGPT round trip succeeded but **extension native submit failed**. Track B PR#33 is a source-only bootstrap and its GitHub Actions ran zero jobs because of startup_failure. **No live B evidence exists.**

## 1. Acceptance proof levels

| Level | Meaning | Evidence minimum |
|---|---|---|
| `SPECIFIED` | code/spec contract written only | source link and review notes |
| `OFFLINE_TESTED` | Node tests and fake/browser fixture adapter | exact command, git SHA, OS/runtime, counts, stdout/stderr/hash |
| `WINDOWS_IPC_TESTED` | actual Windows broker/pipe and host transport | pipe security descriptor denial/allow test, native host origin pinned, request and reply |
| `CHROME_READ_ONLY_TESTED` | actual B extension dev profile tabs/port/observer | exact extension/profile/version, read-only ping, state and no side effects |
| `CHROME_SEND_OBSERVED` | real deterministic B extension triggered ChatGPT Send | real prompt, one send event, actual user transcript and receipt |
| `B_E2E_CORRELATED` | CLI→broker→native host→extension→real ChatGPT→extension→broker→CLI | one `aion send`, exact IDs, prompt digest, correlated reply and durable receipt |
| `NEGATIVE_AND_RECOVERY_PASS` | mismatched/repeated/uncertain sent cases | no second send; wrong bind/grant blocks; restart proof |
| `TRACK_A_ACCEPTED` | independent reviewer validates B source/cases | signed source SHA acceptance and defect disposition |
| `RELEASE_READY` | B activation/rollback + pane/MCP/CLI parity | verified release manifest and local receipt |

Promoting from level 2 to level 6 must not be inferred from the same tests. Transport handshake and ACP `initialize` **never** imply model processing. Human/agent testimony without evidence is not source proof.

## 2. Test harness selection — no prohibited tools

**Default**: Node 22 built-in `node:test`, fixtures, fake `chrome.*`, native framed host test streams, local IPC connections. PowerShell 7 for Windows install/preflight, test actions and rollback. **Native UI Automation / WinApp CLI** for actual Windows graphical validation, once Windows local agent is available. **Real Chrome dev extension** for the independent functional gate. No Playwright, Puppeteer, Orca, and no framework that bundles them as a hidden dependency.

**Acceptance test matrix**:

| Test ID | Area | Trigger | Must prove |
|---|---|---|---|
| T01 | parser | `send chief` without text; excessive text; wrong flag | explicit error, no reservation |
| T02 | alias | unregistered/unbound/ambiguous chief | no tab invented, no dispatch |
| T03 | grant | missing/expired/revoked grant; forged scope | denied before reservation, no grant debit |
| T04 | IPC peer | other Windows logon user and anonymous user connect | OS-level denial; not just application 401 |
| T05 | IPC frame | two partial frames, oversized >1MiB, invalid JSON, unknown schema | rejection without process crash or side effect |
| T06 | singleton | two simultaneous CLI starts | one authoritative broker/writer, no split brain |
| T07 | host origin | wrong Chrome extension ID or missing argv | host rejects and executes zero actions |
| T08 | channel | B client tries stable A host/channel/ledger | refused; Track A state byte-identical |
| T09 | content worker | MV3 worker restart, onDisconnect, tab navigation | capability goes STALE, observer survives, no send replay |
| T10 | selected tab | two matching tabs, wrong URL, changed target post-intent | fail closed or immutable verified binding, no wrong send |
| T11 | composer | nonempty pre-existing human draft | preserve draft; no destructive overwrite |
| T12 | real send | B command and exact bound clean ChatGPT tab | button invoked **once**, actual user turn appears |
| T13 | readback | actual assistant marker+answer | correlation acceptance, source identity and receipt |
| T14 | rejection | echo-only, mismatched token, wrong operation key, model partial | cannot mark SUCCEEDED |
| T15 | lost ACK | submit posted but port closes before ACK | OUTCOME_UNKNOWN, read-only reconciliation, no resend |
| T16 | no-send | host unavailable or verified no tab before attempt | NOT_SENT positively proven, no spent side effect |
| T17 | crash matrix | crash at every broker ledger mutation / browser task write | zero duplicate sends; unresolved preserved |
| T18 | UIA | stale HWND, locked desktop, duplicate control name | fail closed; no coordinate injection fallback |
| T19 | OpenCode | SDK health; wrong version; provider auth fails; SSE drops | correct FAILED_CONFIRMED/UNKNOWN, durable session readback |
| T20 | read-only | `status/doctor/capabilities/observe` | no browser fill/click/agent start or grant change |
| T21 | kill | stop while prior command dispatched | prevent new work; report in-flight uncertainty |
| T22 | panel parity | panel+CLI+MCP observe same OP | same ID, state and evidence revision |
| T23 | installer | dev install/rollback; stable host exists | only B-owned files and HKCU entries change |
| T24 | perf | 30 warmed reads/admissions, measured cold startup | p50/p95 with source and test fixture, not model speed assumptions |
| T25 | forbidden libs | audit lockfiles/transitives/executables | zero Playwright/Puppeteer/Orca in selected stack |
| T26 | version drift | different Chrome/OpenCode revisions | unknown/unavailable, not silent downgrade |
| T27 | owner lock | two commands same conversation concurrent | one admitted, second BUSY; no duplicate attempt |
| T28 | output | same operation `--json` and terminal readable | structured `aion.result/1`, exit semantics match state |

**Acceptance criteria:** T01–T17 + T20–T21, T23, T27–T28 mandatory for B-MVP; T18–T19/T22/T24–T26 required as respective optional layers are promoted. T12 and T13 require **genuine browser/server evidence**; mocked tests never satisfy them.

## 3. Browser native Send proof

Do not confuse composer filling with submission. Actual 2026-10-19 evidence: extension filled correctly but failed to invoke Send; later Windows UIA `InvokePattern` did actuate and read back reply. B must independently prove the **extension's** submit path:
1. Explicitly launch exact B dev Chrome profile and extension SHA under authorized Windows execution; Chrome tab has clean composer.
2. Read only preflight: exact conversation URL equality, unique eligible composer, no current generation, page observer arm, send target present.
3. CLI issues one fully defined intent; broker validates owner grant, atomically reserves/dispatched before externally executing.
4. Worker sends one existing `submit-turn` action; page returns receipt proving actual activation, not just setting text. Store page/worker epoch, operation ID and observer key.
5. Read-only `observe-turn` sees real user turn plus assistant response; token and independent computed answer both match. The reply's source must be real ChatGPT transcript order (not a mirrored test fixture).
6. Capture timestamps / minimized hashed proof. Do not publish raw unrelated chat content or credentials.
7. Run a distinct negative wrong-token/echo case. Confirm no false reply acceptance.
8. Inject a dropped port/restart scenario on offline fixture first; an already attempted command cannot be resubmitted.
9. Independent reviewer checks source SHA, receipt, environment and negative test; only then B-E2E acceptance; Track A M1 stays separate unless its own required exact scope is fulfilled.

## 4. Failure-classification truth table

| Observation | Delivery claim allowed | Prohibited |
|---|---|---|
| native port CONNECTED only | `TRANSPORT_CONNECTED` | "sent", "model alive", "reply verified" |
| Chrome editor contains intended draft | `COMPOSED_NOT_PROVEN_SENT` | `SUBMISSION_OBSERVED` |
| worker dispatch ack received | `DISPATCH_ATTEMPTED` | "website received" |
| actual user message in transcript | `SENT_OBSERVED` | success without assistant correlation |
| assistant response with validated identity+token | `REPLY_CHECKED` / `SUCCEEDED` | inferred model details not observed |
| timeout with possible send | `UNKNOWN` | `NOT_SENT`, automatic alternate transport send |
| explicit no-send before any external call | `NOT_SENT` | treating unrelated transport ack as send |
| OpenCode auth error before prompt | `NOT_SENT` or `FAILED_CONFIRMED` by actual cause | placeholder success |
| OpenCode terminal failed after admitted prompt | `FAILED_CONFIRMED` | empty success |
| absence of capability heartbeat | `STALE` / `UNKNOWN` | `READY` |

## 5. Windows activation runbook design (source to implement)

A clean **B-only** PowerShell activation must be idempotent and reversible:
- `-Mode Plan` or `doctor`: read-only verify git SHA, dirty checkout/worktrees, disk free, Windows user/session, Chrome version, extension install location, Chrome profiles/IDs, HKCU host keys, OpenCode binary/service version, current Node 22/Bun, `winapp`, ACL helper, local binds. Print no secrets.
- `-Mode InstallDev`: only after inventory and local authorization, create B-only extension signing identity and B profile, configure B host path and origin, provision restrictive IPC security helper, register `com.aion.relay.dev`, copy minimal dev files outside source checkout as needed. No change to stable `com.aion.relay` / Profile 3. Record before/after HKCU values and exact file hashes to local receipt.
- `-Mode Probe`: native-port read-only PING and then browser port; fail if B extension isn't loaded. Does not send a prompt.
- `-Mode Activate`: start broker, connect host, subscribe to capability changes, confirm one bound session and valid grant, do **not** automatically send during installation.
- `-Mode LiveChecklist`: guide local authorized target/one benign real turn and negative test; do not claim it happened by merely printing commands.
- `-Mode Rollback`: stop only B broker/host, preserve unresolved receipt and browser task journal, undo only owned B HKCU entry and owned artifacts. Never wipe Track A or all Chrome profiles.
- `-Mode VerifyRollback`: B is absent/disabled; A still intact, same hashes/registry values; no unowned edits.
- Installer must use bounded retries/transactions, preserve .log receipt locally, not force-pull worktree or reset Git. No browser credentials or cookies copied to isolated profile.

## 6. Actual target matrix / runner evidence

Always record:
```json
{
  "receipt_schema":"aion.test/1",
  "source_sha":"<exact git sha>",
  "branch":"track-b/velocity-command-plane-20261019",
  "runtime":{"os":"Windows","node":"<observed>","chrome":"<observed>","opencode":"<observed>"},
  "chrome":{"extension_id":"<B pinned id>","profile":"<B verified profile>","host":"com.aion.relay.dev"},
  "command":"<exact command without secrets>",
  "started_utc":"<actual>",
  "finished_utc":"<actual>",
  "tests":{"passed":0,"failed":0,"skipped":0},
  "result":"PASS | FAIL | UNRUN | BLOCKED",
  "evidence":["<local receipt or PR artifact URI>"],
  "m1_verified":false
}
```

The `0` values above are **template placeholders**, not test evidence. Redact exact personal Windows username/path and sensitive browser context before GitHub publication. Keep local machine as master; remote GitHub build may validate code but cannot claim native-host HKCU installation or real Chrome.

## 7. Benchmark and release gating

Performance target (hypothesis only): p95 warm `aion status` <=150ms; p95 warm command admission+immutable ID <=250ms; capability freshness <=2s or STALE; event-to-pane p95 <=1s if connection live; zero duplicate submissions. Measure cold-start separately. Model generation wait must be excluded from local overhead and included in total command-result elapsed. Collect at least 30 warm samples *per path* after warmup, and record p50, p95, failures/timeouts, memory/CPU idle load. Compare:
- process-per-command CLI vs persistent broker CLI;
- Chrome `runtime.connectNative` new vs kept port;
- Chrome tab port PING and preflight;
- OpenCode SDK SSE vs existing HTTP/ACP;
- WinApp CLI inspect/invoke vs existing direct UIA;
- Rust agent-browser direct CDP only in isolated dev browser, not live ChatGPT hot path.

Release candidate may be promoted only if source SHA, test suite, real native communication, real ChatGPT send + correlated readback, failure classification, isolated installer, rollback, and independent Track A review all have documentary receipts. No independent acceptance in this chat is implied by a committed document.

## 8. Review and owner handoff template

Reviewer should post a *single* consolidated issue receipt:
```text
AION_TRACK_B_ACCEPTANCE_V1
source_sha: <...>
windows_host: OWNER_WINDOWS_MASTER
dev_extension_id: <...>
node_version: <...>
tests_offline: <count pass/fail/skip>
ipc_acl_test: PASS/FAIL/UNRUN
chrome_read_only: PASS/FAIL/UNRUN
chrome_send_button_actuated: PASS/FAIL/UNRUN
chatgpt_reply_correlated: PASS/FAIL/UNRUN
negative_case: PASS/FAIL/UNRUN
restart_no_resend: PASS/FAIL/UNRUN
rollback: PASS/FAIL/UNRUN
source_review: ACCEPT/REJECT/PENDING
result: B_E2E_CORRELATED | BLOCKED | REJECTED | UNRUN
evidence_refs: <...>
END
```

If a checkpoint lacks proof, say `UNRUN` or `BLOCKED`; no "90% M1" in lieu of proof. Track A acceptance is independent of Track B implementation author.
