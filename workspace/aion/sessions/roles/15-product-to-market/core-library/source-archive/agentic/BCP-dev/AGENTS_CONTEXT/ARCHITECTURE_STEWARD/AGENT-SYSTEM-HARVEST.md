# Agent-System Harvest — 2026-09-25

> Classification: DERIVED — STEWARD HARVEST

The former cooperative-agent documentation layer is being retired as a live coordination subsystem. Its durable architectural lessons are absorbed by the Architecture Steward. The complete source remains recoverable from Git history.

## Retained lessons

- Repository-visible context should replace hidden conversation memory.
- LAW, EVIDENCE, DERIVED STATE, TRANSCRIPT, PROPOSAL, HISTORY, and AGENT OPINION are distinct epistemic classes.
- Never create a competing authority, ontology, provenance store, session ledger, or task manager when a canonical mechanism already exists.
- Fresh participants should load the smallest current authority/context set needed for the task, not read the repository indiscriminately.
- Summaries must preserve stable lineage to their evidence; lossy compression without pointers is a defect.
- Contradictions remain explicit until a governing authority resolves them.
- Attempt/staging is not proof.
- For independence tests, define the allowed bootstrap and pass rubric before the run.
- Historical transcripts, handoffs, packets, and old workstream state are evidence/history, not current authority unless explicitly promoted.
- Integration decisions should remain repository-visible and traceable.

## Proven dogfood lessons

The former P1-01 dogfood exercised the cooperative substrate. Its durable findings included 7 GREEN, 2 PARTIAL, and 1 NOT-PROVEN falsifier results; a real link-maintenance defect (D-DOG-01); unnecessary tip-marker churn; and an explicit refusal to treat staged independent-agent or fresh-ChatGPT closers as proof before the independent runs existed. The fresh-session closer also demonstrated that bounded repository context could recover mission/status/authority distinctions without hidden conversational context.

These findings inform Steward behavior: selective cold start, authority/lineage discipline, contradiction preservation, proof-vs-proposal separation, reversible compression, minimal coordination, and documentation cleanup.

## Explicitly retired

The Steward does not preserve the former folder structure or operate its mission board, inbox/outbox, packet/handoff/session/transcript machinery, or coordinator-centric workflow as active infrastructure.

The retirement removes live copies without rewriting history. The complete former tree remains recoverable from Git history.

## Cleanup-layer harvest

The former cleanup layer contributed one durable lesson: authority maps and conflict registers are useful as transitional reconciliation tools, but should not become permanent parallel authorities.

Important findings carried forward:
- historical-versus-current conflicts must be resolved by dated evidence and current authority, not by document recency alone;
- denominator differences can explain apparent count contradictions (for example split Prisma schemas versus unique model names, and recursive TypeScript files versus top-level engine counts);
- stale capability maturity claims must be checked against the current state and source tree rather than accepted from a tracker;
- the former authority map correctly separated Ω law, BCP state, destination research, the legacy mine, and archive genealogy;
- open cleanup questions included model-count reconciliation, interrupted Prompt-4 work, and legacy engine-count semantics;
- the 2026-09-25 conflict register established a direct contradiction between stale FAM-07/FAM-08 L2 state claims and the absence of corresponding implementation in the current repository; those claims must not be treated as proof;
- the former authority-pointer pilot cited by WS-002 was not recoverable on current main and must not be treated as evidence unless a repository object is later recovered.

The former cleanup report's strongest reusable rule is: preserve evidence and lineage, repair references, classify conflicts explicitly, and avoid deletion or promotion based only on appearance of cleanliness.


## Former build-day context and experimental-path harvest

The retired `docs/CONTEXT-*.md` and `docs/EXPERIMENTAL-PATHS.md` were build-day coordination snapshots, not current architecture authority. Their durable lessons are now represented by current BCP state, destination research, Ω law, and the Steward model.

Retained from the build-day material:
- BCP is a tracking/control substrate; Ω remains the product/destination authority.
- Fixture-proven work must not be described as live-proven; "merging" is not equivalent to integrated or proven.
- External verification is stronger than builder-local claims.
- The original experimental framing separated three useful patterns: a thin Chrome vertical slice, a deterministic intent/control plane, and a bounded legacy airlock. These are historical design lineage, not current sequencing authority.
- The thin-slice rule was valuable: get an honest smallest executable path and measure real cost before expanding scope.
- Deterministic intent work established a durable principle: probabilistic perception may assist at the ambiguous tail, but canonical intent, policy/law, consent, and execution meaning should remain deterministic and inspectable.
- Legacy migration should preserve behavior/data where useful without turning the adapter into the destination; import/search can precede bidirectional synchronization.
- The historical build-day board contained stale maturity claims and count discrepancies. Those claims are deliberately not carried forward as current proof. Current BCP state and current repository evidence must be checked instead.

## Early conversation/archive harvest

The retired raw conversation exports contained several ideas that remain useful as historical lineage:
- unified typed capabilities as a shared semantic operation across surfaces;
- a canonical graph/object model with provenance and evolution;
- natural-language command concepts constrained by a closed mutation grammar;
- Chrome Governor as a quarantined provider-realization mechanism rather than canonical truth;
- separation of system configuration from user-owned data;
- ActionPlan/Work-like orchestration concepts, later reframed under the destination Work research;
- self-description/auto-librarian concepts, later reframed as evidence-backed Self-Knowledge;
- the warning that planning ceremony can expand faster than executable evidence;
- walking-skeleton / characterization-test / strangler patterns as useful engineering patterns, not architectural authority.

The raw exports are now redundant as active repository knowledge. Their complete contents remain recoverable from Git history.

## Retired raw-session evidence

The old build-day session transcripts contained useful empirical lessons: live-state sweeps exposed stale leases and test isolation problems; re-running tests from outside the builder process mattered; and concurrency/torn-state failures were evidence about the control-plane implementation rather than proof of product behavior. These remain historical evidence only.
