# Z.ai web Full-Stack Agent — Capability Ledger
Date of initial desk research: 2026-10-16.
**Web account has not been inspected by this assistant.** Distinguish service surface from separately documented ZCode desktop / AutoClaw products.

| Capability | Status | Basis | Validation |
|---|---|---|---|
| Web interface has Full-Stack option | OFFICIAL PUBLIC PAGE | https://chat.z.ai/?mode=agent | Confirm current account UI |
| Chat mode and Agent mode | USER_REPORTED | Owner describes two modes | Screenshot mode switch and settings |
| Full sandbox Linux computer per spin-up | USER_REPORTED | Owner has used it | Safe `uname`, `pwd`, process/runtime inventory (no sensitive paths) |
| Full-stack builder tools and internet access | USER_REPORTED | Owner's experience | Test approved public docs fetch and isolated local app build |
| One model chosen for each spin-up | USER_REPORTED | Owner's observed selection | Capture model choice before run and changes across follow-ups |
| Agent internally fans out to multiple agents | USER_REPORTED | Owner's observation | Ask one turn for two independent bounded findings and evidence of delegation |
| Can clone repository | USER_REPORTED | Owner's direct use | Clone an approved public disposable repo at pinned commit |
| Can build/test Chrome extensions | USER_REPORTED | Owner indicates feasible | Generate MV3 fixture and test manifest/static runtime; inspect actual browser extension load if UI permits |
| Sandbox persists across turns | UNKNOWN | Could be temporary or scoped | Save marker and compare next turn/session; do not assume |
| GitHub push from sandbox | UNKNOWN | No verified permission/feature | Explore non-sensitive export and optional scoped push under separate approval |
| File artifact download, ZIP, patch | UNKNOWN | Browser UI capability unverified | Observe supported export UI and verify downloaded hash |
| Usable built-in browser preview | UNKNOWN IN WEB APP | ZCode desktop docs describe its browser; not proof of web mode | Verify web Agent actual UI behavior |
| Automatic signed-in browser reuse | UNKNOWN | No claim to reuse personal browser sessions | Do not transfer credentials |
| MCP/ACP endpoint access inside sandbox | UNKNOWN | Related product ecosystems exist | Capability probe and scoped localhost dummy endpoint only |
| Subagent count, concurrency, turn/model budget | UNKNOWN | No account-level data | Record actual UI quota and single-run evidence |
| Agent run can continue after browser closes | UNKNOWN | No tested persistence | Do not infer from live browser tab |
| ZCode desktop agent/browser/subagents | OFFICIAL ZCODE DOCS / SEPARATE PRODUCT | https://zcode.z.ai/en/docs/welcome | Never transfer to web sandbox without direct test |

## Provenance vocabulary
USER_REPORTED: owner's own observed interaction; OFFICIAL_PUBLIC: official product claim; OFFICIAL_OTHER_PRODUCT: true only for named sibling software; DIRECT_WEBAPP_OBSERVED: genuine screenshot/UI/turn receipt; INDEPENDENTLY_VERIFIED: external reviewer can reproduce exact evidence; UNKNOWN: do not assume.

## Update discipline
On each actual experiment, add timestamp, exact model, mode, run/session handle (when visible), test and artifact URL. Replace UNKNOWN only after real observation. Don't paste account billing tokens, cookies, authentication or workspace secrets.
