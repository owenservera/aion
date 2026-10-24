# Native webapp capability evidence ledger

**As of 2026-10-24.** Do not confuse this agent's *research maturity* with provider-site feature availability. `SOURCE` = seen in AION code/older capture; `PRODUCT` = official provider docs advertise feature; `SYNTHETIC` = code or fixture tests; `REAL` = an actual live page interaction receipt; `UNKNOWN` = no sufficient evidence. The "latest export" below is from the user-reviewed Z.ai workspace and should be independently rechecked.

| Surface | ChatGPT | Claude | AION current source / note | Next source of proof |
| --- | --- | --- | --- | --- |
| Authenticated thread identity | SOURCE + SYNTHETIC for `/c/<uuid>` | UNKNOWN | `conversation-thread.mjs` only recognizes ChatGPT | Exact owner-browser page + wrong-thread negative |
| Transcript Read | SOURCE + SYNTHETIC | profile selectors only | `conversation-browser-adapter` + bounded Read | Real page zero-send Read / coverage |
| Multi-turn send/reply | SOURCE + SYNTHETIC | UNKNOWN | durable journal + reply polling; Z.ai reported real-site failures | Real user delivery and two correlated model replies |
| Reply stream transport | SAVED_REAL_CAPTURE for path-ops and mapped frames | SAVED_REAL_CAPTURE for Connect/proto shape leads | Stream maps + protobuf parser; Claude field inference unproven | fresh provider response + decode/DOM join |
| Native typed response parts | Product docs + partially captured source | Product docs + partially captured source | `stream-components`, `stream-map` and DOM blocks | Fidelity map incl. unknown block types |
| Visible thinking summary | PRODUCT, conditionally visible | PRODUCT, conditionally visible | Not independently parsed as native part | Real visible summary block, no hidden-reasoning claim |
| Citations/research | PRODUCT; historical fields | PRODUCT | Native semantic projection not accepted | Actual cited webapp result with source link |
| Rich editable content | PRODUCT writing/code block | PRODUCT Artifacts | No integrated native resource graph | Open/copy/edit/download/version evidence |
| Work/Cowork agent task | PRODUCT | PRODUCT | Persistent `harnessRun` and task graph not integrated | Real task progress and outcome |
| Project/workspace | PRODUCT; ChatGPT project support | PRODUCT; Claude project knowledge | AION currently lacks cross-provider project identity | Current URL/UI capability capsule |
| Model/mode changes | PRODUCT, availability varies | PRODUCT, availability varies | catalog only, no verified browser operation | actual page control and selection readback |
| Artifact/tool operations | PRODUCT, runtime varies | PRODUCT, runtime varies | nine Studio tools are **conversation controls**, not provider UI tool/artifact actions | Native block/affordance experiments |
| Role/team mapping | local design | local design | optional AION workload binding, not product boundary | local-private role binding |
| Network+DOM capture | SAVED_REAL_CAPTURE | SAVED_REAL_CAPTURE | AION recorder substantial; Z.ai real-site failure captures | successful real reply corpus and verified join |
| G1–G7 knowledge admission | SOURCE | SOURCE | Core freshness G1/G2 regression open; source qualification != live | pre/post baseline positive and negative |
| Outcome Packet | SOURCE + offline tests | SOURCE + offline tests | Value Oracle saved-session path | real accepted capture -> usable outcome |
| Crash/restart / unknown effect | SOURCE + SYNTHETIC | UNKNOWN | browser writer/lease and journal tests; Z.ai exported additions | local Windows recovery and no duplicate |
| Cross-provider goal continuation | design | design | no accepted persistent `harnessRun` | source-linked two-provider goal/evidence |

## Evidence points (living)
- `2026-10-22`: Generated `AI-CHAT-SHAPES.md` reports **26 ChatGPT and 11 Claude** historical derived sessions; denominator is saved family data, not real successful harness messages.
- `2026-10-23`: Core source has guarded follow-up and nine conversation tools; earlier Sol parent unit run **1187 pass**, later governing architecture records **1194 pass** after fresh-tab source, neither constitutes current live acceptance.
- `2026-10-24`: Prior Z.ai Round 3 export reportedly **1216 passing** units, **14/14 real-Chrome synthetic-site** E2E, real error-page capture with no attributable successful provider reply; its **10 commits** remain outside Github main at previous inspection. Recheck GitHub and original export before promoting this to live integrated reality.
- `2026-10-23`: QA issue #68/#72 confirmed a historical-match G1/G2 freshness weakness in synthetic source probes; actual real false-positive capture not shown.

**Boundary:** Some third-party browser access can be blocked by CAPTCHA, login, site/network rules or remote sandbox profile separation. Do not bypass challenges, invent success or silently swap to a paid API. HTML/http reachability ≠ actual chat response.
