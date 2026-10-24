# Experimental bench — webapp-native ChatGPT / Claude shapes

**All rows are PLANNED unless tied to a linked run receipt.** Use the existing Capture Studio recorder, actor, decoders and local evidence store. Live tests require actual accessible page/authorization; do not use Playwright, Puppeteer or Orca. No paid provider API calls.

## Tier 0: Source and synthetic contracts (no webapp required)

| Case | Input | Pass | Critical negative |
| --- | --- | --- | --- |
| E00 native projection | Synthetic provider blocks: prose, code, citations, artifact, unknown | Source preserves block boundaries, refs, revisions and unknown raw links | Unknown part disappears or silently coerces to text |
| E01 independent task | Simulated Work/Cowork activity graph | Separate run/task/progress/artifact nodes not collapsed into answer | UI progress misreported as external tool invocation |
| E02 streaming reconciliation | Two streams with revisions and DOM remount | ordered, evidence-linked `content.updated` with no identity duplication | stale DOM or network terminal incorrectly finishes current generation |
| E03 identity | ChatGPT canonical thread, Claude unknown, guest transient session | exact matching and explicit unverified cases | title, ordinal, timestamp or text used as durable identity |
| E04 safe effect | delayed ack, interrupted typing, unknown send, same idempotency key | exactly-once admitted effect and no new-key retry on uncertainty | resend after ack lost, wrong tab or stale revision |
| E05 freshness | historical matching prompt/reply + new send with/without pre-send baseline | G1/G2 cannot accept old content as fresh; raw remains inspectable | historical match labeled `capture_accepted` |
| E06 derived evidence | raw sequence -> stream decode -> DOM join -> knowledge -> Oracle packet | all links grounded, limitations retained | synthetic model text substituted into raw site evidence |
| E07 artifact version | edits, version switch, download, deleted artifact | independent resource versions, truthful unavailability | newer version silently overwrites historical source |
| E08 site availability | sign-in wall, CAPTCHA, unsupported control | `unavailable` or `unverified` with observed reason | fake capability success/bypass challenge |
| E09 capture performance | lengthy streamed reply with capture on/off | byte fidelity, monotonic seq, measured lag and explicit gaps | unexplained truncation masked as accepted result |

## Tier 1: Real site, read-only
**B01** open exact existing ChatGPT chat without sending; ensure visible transcript read preserves draft, does not scroll, focus, navigate or write. Read rendered history *including content visible from before attach*; mark unloaded history unknown.

**B02** open authorized Claude chat/project page; classify thread/account/project refs from observed URL and page; do not borrow ChatGPT `/c/<uuid>` grammar. Compare open-tab attachment and actual account list.

**B03** inspect one citation-rich provider response; compare DOM citation/ref block against raw network parts where available. Capture pure read evidence no action.

**B04** inspect a ChatGPT writing/code block and a Claude Artifact; list versions, export controls, editable state, DOM visibility and possible native controls, without triggering editing.

**B05** inspect accessible Work/Cowork task; distinguish task progress/subtask, tool display, message answer and artifact. If feature unavailable, record actual surface/entitlement; no invented substitute.

**B06** inspect surface change or model/mode selector; record ability and effect class. Do not perform external mode changes without permitted scope.

## Tier 2: Real provider actions — only when allowed and actual provider responds
**L01** keyed first turn on a disposable thread: record baseline, exact user delivery, new assistant generation, live content and source stream. Readback must belong to this send; distinguish provisional samples from ready completion.

**L02** contextual follow-up in **same grounded conversation**; prove separate new generation/identity and no first-answer replay. If thread ID changes, classify continuity honestly.

**L03** interrupted generation (controlled fixture / disposable authorized thread): observe visible Stop and actual effect, partial reply and recovery. Never treat capture Finish as generation Stop.

**L04** edit/regenerate/branch on a disposable thread only if controls observed, with distinct generation/source reference and revised artifact if applicable. If unobservable, skip and mark `unverified`.

**L05** actual exported artifact/file: prove provider-delivered bytes, digests, linked turn/task, downloadable local file and version. Unsupported file feature remains an observed limitation.

**L06** actual end-to-end: real page send -> response -> raw stream and DOM -> decode -> join -> G1–G7 acceptance -> source-linked knowledge -> usable Outcome Packet. If any core gate missing, return `PARTIAL`, not success.

## Tier 3: Recovery and multi-provider orchestration
**H01** Chrome/CDP disconnected after dispatch and before ack: unknown-effect fence survives restart, no auto resend; read-only reconciliation cannot fabricate delivery.

**H02** two idle attached conversations share observation without duplicate writer lease; exact per-thread active foreground effect only; crash/stop preserves ownership.

**H03** provider A to provider B goal continuation: carry only actual retrieved/authorized output and explicit context ledger; never claim shared model memory, connected account or native API continuity.

**H04** agent Work/Cowork task pause/needs-user/resume: persist AION goal/run, provider task identity, output refs and recovery; no unintended new task run.

## Source and results protocol
For each case: `caseId`, `status=PLANNED|BLOCKED|SOURCE_TESTED|SYNTHETIC_TESTED|REAL_PAGE_READ|REAL_PROVIDER_REPLY|WINDOWS_ACCEPTED`, source commit and tool/runtime versions, observed UTC, provider/surface/session scope (sanitized), original sequence ranges or hashes, expected/observed outcome, coverage gaps, external account interaction class, repeatability, next bottleneck. Do not create bulk vanity receipts for unexecuted cases.

The authoritative acceptance gates for user-facing Capture Studio real use remain [LIVE-TEST.md §6](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/LIVE-TEST.md). This bench supplies supplementary native-shape experiments, not an overriding acceptance framework.
