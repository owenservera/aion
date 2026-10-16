# AION project briefing (AION BFF)
Written: 2026-10-16 02:25 CEST · Sources: `gh` read-only, plus /workspace/aion files · Legend: **[V]** = BFF checked it in GitHub · **[C]** = claimed (by AION, a doc, or a chat) and not checked against the bytes

## 1. Mission and north star
- AION ($e$) is Owen's Digital CEO in ChatGPT project 001.PROJECTS.PM. Mandate: own the management burden, act, verify, and need less of Owen's attention over time. [V: canon/AION-BOOTSTRAP-2026-10-16.md]
- North star: **anyone should be able to auto-bootstrap their own bots and full agentic team from the PWA screen just by typing.**
- Delivery path: AION and BFF both code on Owen's Windows PC through ZCode (zcode-acp hub + pocket-link, reached over tailnet HTTPS). Plan: bff/ZCODE-PATH.md. **Nothing live yet.** [V: plan doc says PLAN ONLY]
- Owen can only be reached through his Android phone and the PWA. He keeps authority over privileged Windows actions and credentials.

## 2. Portfolio overview (Owen's 13 in-scope repos, most recent push first)
| Repo | Role | Last commit (CEST) | Open issues/PRs | Health |
|---|---|---|---|---|
| grokbot-telemetry | Box telemetry / agent traces | 10-16 02:21 | 0/0 | Healthy, auto-updating |
| aion | AION+BFF workspace / canon | 10-16 (auto every min) | 3/0 | Active; autopush risk (see §5) |
| zcode-bots | ZBot roster/host | 10-08 06:32 (default branch) | 0/1 draft | Stale on main; PR #1 waiting for review |
| 001.PROJECTS.PM | Global PM hub (read-only observer) | 10-16 01:28 | 20 (incl. #16–20 bridge:dispatch)/0 | Active; dispatch issues piling up with no consumer |
| SOFTWARE_HQ | App intelligence + IAM/UAH home | 10-15 22:24 | 4/0 | Docs only; DBs missing |
| ACP | Agent Control Plane constitution | 10-15 01:30 | 0/0 | Docs/backlog (39 items) |
| Product_Hub | Productization discovery | 10-14 23:07 | 5/0 | Design/seed |
| hq | HP PC HQ (hardware/OS/net/peripherals) | 10-14 23:01 | 7/0 | Design v1; P0 keyboard issue |
| machine-steward | Windows sitreps/storage ledger | 10-14 22:44 | 0/0 | No README |
| zcode-setup | ZCode Playbook/toolkit (hub, pocket-link) | 10-14 | 1/0 | Key source for ZCODE-PATH |
| VOMEGA | VIVIM-Ω autonomous build | 10-14 19:07 | 0/0 | Quiet |
| zcode-pocket | Android app + PWA (web/) | 10-14 00:17 | 0/0 | P0 shell deployed; no transport |
| hermes-company-os | Hermes company org/agent DNA | 10-12 06:43 | 0/0 | Dormant since bootstrap |
Context only (not in scope): 000.PROJECTS.PM and repos named UAH/IANG/GPM-Cognitive-OS/DCB do **not exist** under owenservera [V]. UAH exists only as a mirror inside SOFTWARE_HQ. Org NOVA0AI holds only 2 trivial 2025 repos.

## 3. Per-repo sections
### aion
- Purpose: AION+BFF canon, recorder, store, BFF tooling. main only.
- State: canon/AION-BOOTSTRAP + aion-source-map.v1.json [V]. recorder/ (6 tests, 8 receipts) [V files; test pass status C]. store/ relay JSONL + replay/part-01.md (ends at prompt 23 of 24) [C per canon]. bff/ZCODE-PATH.md plan.
- Issues: #1 AION-01 PWA P0→P1, #2 AION-02 flight recorder, #3 AION-03 ChatGPT→bridge→ZBot receipt (all open) [V].
- Next: fix replay gap/README; rerun recorder tests; post check-ins on #1–#3.
### zcode-bots
- Purpose: ZBot named-teammate host, upgrade gates (56 packets, 7 exit gates).
- State: last main commit 10-08 "G0.01: ACP tool restriction measured — the flag exists and does nothing" [V]. That means a known security gap.
- PR #1 (draft): diagnostic-only AION local MCP bridge, fail-closed. Branch `aion/local-mcp-diagnostics-v0-20261016` [V].
- Next: review PR #1 and run `node --test`. Keep execution off until the G0 gates pass.
### 001.PROJECTS.PM
- Purpose: read-only, evidence-driven portfolio observer (pulse `global-pm.pulse.v1`).
- State: active 10-15/16 (aion ops, governance) [V].
- Issues: #20 ACP bridge first live delivery probe; #19 GPM-IA-01; #16–18 unattended GPM-EXEC dispatches. All are PUBLISHED with no RECEIVED evidence.
- Next: don't add more dispatches until a consumer exists. Triage #16–18.
### SOFTWARE_HQ
- Purpose: local-first app intelligence (APP-001 = ZCode); home for IAM/UAH.
- **Commit 85476c3 [V]:** exists, 2026-10-15 22:24 CEST, "docs(iam): establish SQLite-centered integration model baseline". It adds **only** `integrations/iam/IAM_CORE_V0_1.md`.
- **No `.db`/`.sqlite` files, no IAM 33-table schema/builder, no UAH v0.2 DB, no `project.yaml` anywhere in the tree [V].** UAH exists as a doc/CLI mirror at `integrations/oracle-reconciliation/mirror/UAH/`: only `fsx.mjs`, `gate.mjs` and `safety.mjs` are present, with no entry point. That matches the UAH thread's "design > implementation".
- Issues #1–#4: APP-001 waves 00/01/01B and KNOW-01F doc pull.
- Next: commit the IAM DB/schema/builder and the UAH DB + project.yaml from the ChatGPT sandboxes, or record them as lost.
### ACP
- Purpose: parent Agent Control Plane. Not the same thing as zcode-acp (Agent Client Protocol). [V README]
- State: discovery continuation; G-01/04/05 closed; bridge.request.v1 contract; backlog 39 [V commit msg].
- Next: link bridge.request.v1 to the 001.PROJECTS.PM #20 consumer design.
### zcode-setup
- Purpose: ZCode Playbook, dogfood rule. Toolkit has zcode-acp and pocket-link (server.mjs, launcher.ps1, acceptance.mjs).
- Issue #1: ACP Universal Bridge Kit v1 adoption + live proof gate.
- Next: run pocket-link acceptance against a Linux mock hub (ZCODE-PATH step 0).
### zcode-pocket
- Purpose: Android app (Kotlin) + PWA `web/`.
- State: last commit 10-14 "fix(pwa): mirror valid install start URL". Vercel deployment READY with SSO protection on, as AION queried it [C by AION, not rechecked by BFF]. P0 has no transport.
- Next: build P1 transport (Settings URL+token, health, WS session/prompt), then verify on Android.
### Product_Hub
- Purpose: discover reusable products hiding in the work; O1 catalog by default.
- Issues: W1–W4, storage audit (#1–#5). Next: W1 verify real ZCode session intake.
### hq
- Purpose: PC HQ for hardware, OS, networking and peripherals; sits above ACP without replacing it.
- Issues: #1 P0 keyboard phantom input, #7 storage (C: 6.3 GB free, −13.1 GB in 2 days), #5 ChatGPT↔ZCode handoff, plus #2–4 and #6.
- **Next: #7 storage risk could break ZCode/hub installs. Raise it with AION.**
### machine-steward
- Purpose: read-only Windows sitreps and storage ledger. No README [V]. Next: add a README; link it to hq #7.
### grokbot-telemetry
- Purpose: box telemetry mirror; always-on commits. Healthy. Next: none.
### VOMEGA
- Purpose: VIVIM-Ω autonomous ZCode build. Last commit is an oracle-bridge review-only handoff. Next: confirm whether it's still active.
### hermes-company-os
- Purpose: Hermes company organization and agent DNA. Only the bootstrap commit, 10-12. Next: ask AION whether it's in or out of the current plan.

## 4. Workstreams (verified state)
| WS | Claimed/target | Verified |
|---|---|---|
| AION-01 PWA | P0 deployed; P1 one real turn | Vercel READY only [C-AION]. No phone install, no transport [V code says shell] |
| AION-02 Recorder | hash-chained, tests pass | Files + 6 tests exist [V]; pass not rerun; replay missing prompt 24 |
| AION-03 Bridge | ChatGPT→ZBot receipt | #20 PUBLISHED [V]; PR #1 draft [V]; no consumer, no receipt |
| AION-04 Canon | bootstrap + source map | Committed on main [V] |
| ZCode path | phone/AION/BFF drive ZCode | Plan only; needs Owen's ~15 min PC session (Tailscale, script) |
| IANG/UAH/IAM | one SQLite model | Doc only in SOFTWARE_HQ [V]; DBs only in ChatGPT sandboxes [C] |

## 5. Risks and drift
1. **Schema drift:** three different SQLite models are each claimed as "the one DB": UAH v0.2 (8 tables), IANG (23), IAM v0.1 (33). None is in Git.
2. **Naming drift:** UAH is called both "Universal ACP Hub" and "Universal Agent Hub". ACP (control plane) also gets confused with zcode-acp (protocol).
3. **Sandbox-only artifacts:** IAM DB/builder, UAH DB + project.yaml, the GPM-Cognitive-OS package, 100-variable catalog, 192-repo census, 1,000 provisional records.
4. **Dispatch without a consumer:** 001.PROJECTS.PM #16–20 are piling up.
5. **Autopush:** the canon says the script pushes without pulling. The current `bff/aion-autopush` does run `pull --rebase` [V]. But it has no lock, no failure surfacing (errors go to /var/log only), and no handling for a rebase conflict.
6. **Security:** zcode-bots G0.01 ACP tool restriction doesn't work. Once P1 is live, a single token gives full control.
7. **PC disk:** C: is at 6.3 GB free and falling (hq #7) [C from issue].
8. Projects that appear stalled or orphaned: hermes-company-os, VOMEGA, zcode-bots main.

## 6. Keep-AION-on-track checklist
- [ ] Don't accept "one database" until a single schema file + DB + builder are committed (SOFTWARE_HQ) with table counts. Today that's 8/23/33 tables, all uncommitted.
- [ ] Commit 85476c3 is doc-only. Don't treat it as "IAM model built".
- [ ] "UAH CLI" has no entry point. Treat it as design until `node cli/... --help` runs.
- [ ] Pick one UAH expansion (Universal Agent Hub per summary) and fix the canon.
- [ ] W01 CCR→ZCode and W02 ZCode↔OpenCode are unverified. W03 ChatGPT→local is partial at best.
- [ ] 000.PROJECTS.PM replication: the repo doesn't exist. Keep it deprioritized.
- [ ] Vercel READY ≠ phone install. Issue PUBLISHED ≠ RECEIVED. Demand the state transitions defined in the canon.
- [ ] Recorder "tests pass" comes from a BFF receipt. Rerun the tests independently.
- [ ] The replay must reach prompt 24 from the original source (no reconstruction).
- [ ] The GPM-Cognitive-OS artifacts must not be cited as present in aion.
- [ ] Every AION status claim needs a repo SHA or a tool readback attached.
