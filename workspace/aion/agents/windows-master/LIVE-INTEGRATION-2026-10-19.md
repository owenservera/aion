# LIVE-INTEGRATION-2026-10-19 — minimized live evidence receipt

**Type:** evidence receipt (not a design document).
**Date (UTC):** 2026-10-19, 16:44Z → 17:05Z.
**Host:** `OWNER_WINDOWS_MASTER`. **Machine authority:** owner.
**Approval refs:** `owner:20261019:fresh-live-test` (the one live test that was executed).
**Scope of this receipt:** one real live ChatGPT round trip, observed by native Windows UI
Automation, plus the bounded issues it exposed.

**Related:** `workspace/aion/agents/windows-master/TODO.md` (§1b is the authoritative status),
`workspace/aion/STATE.json` (`currentLiveOutcome`).

---

## 1. Canonical frozen source and its offline evidence

| Item | Value |
|---|---|
| Canonical frozen source | `fd347f22dba24e9282e8a39b01ed5f0c760bee14` (parents `9b07eab` + `7ffb434`, 13 code/test paths) |
| Extension suite | **736 passed** (2026-10-19T16:24:21Z) |
| Bridge suite | **126 passed / 1 documented opt-in skip** (16:24:41Z); targeted re-run passed 16:24:19Z |
| Bus runner suite | **8 passed / 2 opt-in skips** |
| MCP suite | **10 passed** |
| Adapter suite | **35 passed** (16:24:04–16:24:07Z) |
| Bus offline demo | **3/3** (16:24:18Z), output `OFFLINE_PASS D1/D2/D3` |
| Bridge change | **test-only** — `w.relay.host.ensureSession()` awaited before `HOLD`; 400 ms prompt timeout kept; production code unchanged |
| Branch HEAD at observation | `fc30efd` at the live session; HEAD later advanced to `389a928bd7bca1054fd8b2189ef29308a16bde5` (merge of main, carrying the original checkout's two research-doc files) — the tested source is unchanged, re-verified byte-identical (`git diff --quiet fd347f2 HEAD -- chrome-relay aion-mcp adapter` exits `0`) |

**Implementation is frozen — no more code fixes.** The source above is the canonical version to keep.

---

## 2. What happened (live timeline)

| Time (UTC) | Actor | Action | Observed |
|---|---|---|---|
| pre-16:44 | main agent (native UIA) | extension panel native ping | **CONNECTED**, status **VERIFIED** |
| 16:44:31 | extension submit path | submit marker `AION-INTEGRATION-20261019-01` | **refused before dispatch**: `conversation_locked: unmapped legacy reservation` |
| after 16:44:31 | owner | authorized archiving the old orphan; DevTools archive attempt | **failed** in `storage.get` keys **before any write** (suspected missing `ARCHIVE_KEY` in the loaded module; source paths **not proven**) — nothing written |
| after that | owner | requested start over | **AION extension removed and reinstalled** (extension only); ChatGPT tab refreshed |
| 16:59:35.797 | extension split Submit | fresh marker `AION-INTEGRATION-20261019-02`; prompt exactly `Reply with exactly these two lines:` / `AION-INTEGRATION-20261019-02` / `53+29=82` | output **UNCERTAIN** `turn_refused: generation_incomplete` by 17:00:09; read-only **Observe** returned the same |
| ~17:03 (owner-confirmed; no exact clock claimed) | owner | confirmed the prompt was filled correctly but **not sent** | — |
| 17:04:16.8683372 | **main agent (native UIA)** | exact composer readback, then invoked the **real ChatGPT Send button** via `InvokePattern` — **once** | prepared composer text length **73**; Send button enabled |
| 17:05:00.7053692 | **main agent (native UIA)** | read the UIA transcript nodes in order | **"You said"** + the exact prompt, then **"ChatGPT said"** + `AION-INTEGRATION-20261019-02` + `53+29=82`, with Copy / Read-aloud controls |

**Sender identity.** The send was performed by the **main agent** through native Windows UI
Automation on the ChatGPT Send control. It is **not** an owner manual send, and **not** the extension
submit path.

---

## 3. What this receipt claims — and what it does not

**Claims (supported by the observations above).**
- A real AION-originated prompt was submitted to the real ChatGPT service, and the **actual service
  reply was read back directly by the machine**, with **no owner copy/paste relay**.
- The reply **passed the correlation check**: it carries the marker `AION-INTEGRATION-20261019-02` and
  the computed answer `53+29=82`, and the reply was read from the transcript in order.
- Exactly **one** actual send occurred.

**Does not claim.**
- **Not** an extension submit-path success — the extension filled the composer but never activated
  Send.
- **Not** an accepted relay envelope.
- **Not** M1: no independent negative case, no independent review. `m1_verified` stays **false**.
- No claim about the loaded extension build (see issue P2 below — the path was never confirmed).
- No transcript dumps, no cookies, no tokens, no private data in this receipt.

**Execution authority.** The owner explicitly confirmed **FULL LIVE EXECUTION MODE** after this run.
`live_execution_authorized=true`; the completed trial does not consume ongoing authority. Exactly one
prompt was actually sent in this receipt. Reconcile uncertain operations rather than automatically
resending. `m1_verified=false` is an evidence status, not a denial of live permission.

---

## 4. Bounded issues (practical priorities — not new security tasks)

| Pri | Issue | Note |
|---|---|---|
| **P1** | Extension fills the composer but does not activate Send | the submit path stops short of the real control; this is why the extension leg failed while the native-UIA leg succeeded |
| **P1** | `generation_incomplete` emitted while the prompt was still unsent | the `submitted` field means *dispatch*, not *proven UI send* — a false-negative verdict is possible |
| **P2** | A fresh extension install requires a ChatGPT tab refresh, else `port_closed` | install-time step surfaced during the restart |
| **P2** | Suspected loaded-build mismatch (missing `ARCHIVE_KEY` vs integrated source) | **not proven** — the actual loaded extension path was never confirmed, and the DevTools archive attempt failed before any write |
| **P2** | Old legacy unmapped reservation locks all sends | blocked marker 01 before dispatch; the owner later authorized starting over with the AION extension only, and removed/reinstalled it |
| **UX** | Workflow too cumbersome | explicit owner feedback on the current procedure |
| V2 | OpenCode 2.0 research proposal | unimplemented; **next**, not blocking the current freeze |

No new security tasks are opened by this run.

---

## 5. Not claimed / not done

- No M1 promotion; `m1_verified` remains `false` in `STATE.json`.
- No accepted relay envelope, no extension consumer readback, no independent negative case, no
  independent review.
- No second live send, no retry, no ledger reset, no credential export, no bulk history read.
- No code fix, no source or config change, no git staging, commit or push from this receipt.
