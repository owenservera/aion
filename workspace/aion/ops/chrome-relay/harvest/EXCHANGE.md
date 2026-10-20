# AION — Development ⇄ Harvest/Research Exchange

**One queue, one lightweight contract, on `main`.** This document and [EXCHANGE.jsonl](EXCHANGE.jsonl) are the only cross-workstream intake/delivery surface. Do not create a second registry, project board, permanent branch, or separate inbox per agent. [Repository governance](../../../../../REPOSITORY-GOVERNANCE.md) remains authoritative.

## Current shortcut supply line

**Discovery** proactively surfaces source modules with potential to leapfrog AION development (CDP, DOM, parsers, identity, transport, etc.) by pin/path and contract mapping, **without verifying donor functionality**. **Integration Manager** adapts Development-selected findings into real AION-ready staged code/patches. **Development** selects, integrates, tests and owns runtime behavior. See [Development desk](../workers/development/DELIVERABLES.md), [Discovery desk](external/workers/nine-repo/DELIVERABLES.md), [Integration Manager desk](external/workers/integration-manager/DELIVERABLES.md). Use the **existing AX topic/record** for handoffs and link staged files; no secondary queue. Value is engineering eliminated, not the number of records. New code reuse is a normal **Dev-selected** path, not implicit adoption from an OFFER; preserve source and licensing, Bus safety and fidelity. 

## Why this exists

Development (formerly Track B) first **discovers and categorizes its actual needs and current source reality**. Each research/harvest lane then maps its evidence to those needs: methodologies, pitfalls/negative tests, and where genuinely useful, specific external protocol/contract descriptions. **AION Development owns all implementation.** Donor code and provider documentation are evidence, not AION source ownership, an executable route or an instruction to copy code. Both directions use **one record shape** and the same stable `topic` key, so matching is mechanical and deduplicated.

## Shared record — one JSON object per line

```json
{
  "id":"AX-0001",
  "kind":"NEED",
  "lane":"development",
  "topic":"receive.identity",
  "title":"Correlate real replies to a unique conversation and operation",
  "priority":"P0",
  "status":"OPEN",
  "readiness":"NEEDS_EVIDENCE",
  "summary":"What is missing or offered; concrete, not aspirational",
  "aion_seam":"existing AION code path or documented contract",
  "value":"What becomes faster, safer or possible",
  "source_refs":["repo-relative/path.md"],
  "evidence":"NONE",
  "risks":["no unsafe resend"],
  "acceptance":"One independently inspectable proof or measurable outcome",
  "next_action":"Single bounded Development or Harvest action",
  "links":["AX-0002"],
  "updated_utc":"2026-10-20"
}
```

**Required fields:** all fields above; `source_refs`, `risks`, `links` may be empty arrays, but never fabricate evidence. `id` is permanent. `topic` is the shared semantic join key (reuse existing crosswalk/command-space terminology before inventing new names). `lane` = `development` | `omega-vivim` | `vomega` | `external-nine` | `research`. `kind` = `NEED` (requested by Development, including foreseeable needs) | `OFFER` (reusable research finding) | `GAP` (no justified implementation found) | `DECISION` (explicit disposition). `priority` = P0 now, P1 next, P2 later, P3 watch. `status` = OPEN, INVESTIGATING, DELIVERED, ACCEPTED, DEFERRED, REJECTED, CLOSED. `readiness` = NEEDS_EVIDENCE, SOURCE_OBSERVED, CONTRACT_READY, TESTED_OFFLINE, VALIDATED_LOCAL. `evidence` = NONE, DOC_ONLY, CODE_INSPECTED, TEST_RECEIPT, LIVE_RECEIPT. These are not interchangeable; source/code observed is not an AION production capability.

## Additive Development master linkage (v1.1, backwards compatible)

The top-down [Development Master](../DEVELOPMENT-MASTER.md) and [machine index](../DEVELOPMENT-INDEX.json) now project the implementation graph, integration seams, alternatives, decisions and I0–I3 / R5 gates **from existing authoritative sources**. They do **not** replace this exchange or duplicate the 1,000-row Command Space research registry. For status use these independent axes: main-integrated source, branch-candidate source, source inspection, offline test, local/live acceptance and Development adoption. Never set `ACCEPTED` merely because code exists in a donor or a research row says P0.

**Existing EXCHANGE.jsonl fields remain required and unchanged.** New records **may** include these optional cross-reference/approach fields, all omitted for records that don't need them:

```json
{
  "capability_ids": ["DEV-05"],
  "roadmap_gates": ["P2", "I1"],
  "depends_on_topics": ["receive.identity"],
  "candidate_approaches": [
    {
      "approach_id": "RX-PROVIDER-MV3",
      "summary": "One verified source-observer method",
      "origin": "AION|DONOR|NATIVE|EXPERIMENT",
      "source_refs": [],
      "pros": [], "cons": [],
      "license_risk": "UNKNOWN",
      "session_fidelity": "UNKNOWN",
      "state": "PROPOSED"
    }
  ],
  "implementation_refs": [],
  "proof_refs": [],
  "decision_refs": []
}
```

An approach is a **research reference**, not an AION implementation candidate. The existing optional `candidate_approaches` name is preserved for backward compatibility, but every external entry means a methodology/test/contract observation only. It supports 0..N competing or complementary lessons; each can be useful without choosing a donor as source supplier. Keep their own safety, license, completeness, compatibility, evidence and provider/session fidelity separate. Development may classify the lesson as ADOPT_METHOD / REVIEW_PROTOCOL / NOTE_ONLY / REJECT. Any actual AION implementation choice is separately recorded with AION-owned code contracts and tests; no harvested pattern is selected as a donor runtime. Never adopt an approach automatically; a live Send uses only **one** explicitly admitted actuator, never an uncertain-effect fallback. Existing source cards retain raw detail; this exchange captures their small developer-actionable synthesis.

**Joining:** `topic` stays the dedup key, `AX-...` remains the exchange identity, `DEV-...` refers to one master area, `P1–P8/I0–I3` to accepted architecture gates, and `source_refs` to provenance. An offer may match several development needs; use `links` rather than duplicating prose or creating a permanent per-lane inbox. When several repositories cover one topic, show complementary and competing **reference methods** with provenance. A first source to inspect may be chosen for research efficiency, but **no primary donor or backup is required for implementation**, and no external source owns a Development capability.

## Optional discovery classification — small, non-breaking schema

Retain every required legacy field. For newly inspected OFFER/GAP records, optional fields may distinguish these three research classes:

```json
{
  "discovery_class": ["METHOD_PATTERN", "NEGATIVE_TEST_OR_FAILURE_MODE"],
  "implementation_owner": "AION_DEVELOPMENT",
  "source_status": "CODE_INSPECTED",
  "protocol_contract": null,
  "aion_capability_ids": ["DEV-04"],
  "adoption_status": "RESEARCH_REFERENCE_ONLY"
}
```

`protocol_contract` is **non-null only for a specific, documented, versioned interoperability contract** (standard/native API, explicit frame or state contract) with fidelity and entitlement constraints. A donor's private helper, journal, DOM selector or SSE-style *approach* is **not** automatically a normative protocol AION should adopt. `candidate_approaches` remains backwards-compatible metadata for research alternatives; an AION implementation design lives in AION's own architecture/contracts. Additional optional fields are not a requirement for older exchange records.

**Initial role:** discovery, classification, alignment and identified open questions. When no useful outside method or contract matches a Development need, record `NO_APPLICABLE_FINDING` without blocking AION work. Coding, testing on Windows, importing libraries and deciding runtime defaults are outside this initial Harvest classification phase.

## Four-step loop

1. **Development first discovers/classifies NEED** with one topic, actual AION source status (main/candidate/design/future), integration seam, proof status and acceptance test. This is not an instruction to implement donor code.
2. **Harvest/research posts OFFER or GAP on the same topic.** Each lane conducts its investigation internally in its existing folder, pins source commit + module/path, checks licensing and safety, and links relevant cards, source excerpts, comparisons, or docs. Publish **one synthesized delivery** instead of forwarding dozens of cards to Development.
3. **Development selects valuable intelligence**; Integration Manager packages the corresponding source into AION-adapted code with explicit dependencies, license and destination seam. This step is adaptation, **not donor verification or final implementation acceptance**. OFFERs can be proactive, especially for leapfrogging primitives.
4. **Development integrates and tests in AION** and closes on its own code/test evidence, or explicit deferral. Neither discovery nor packaging has a separate functional verification obligation. Keep original source evidence immutable.

**Routing:** start from [Development's classified needs](../DEVELOPMENT-MASTER.md), existing internal sources and the research/crosswalk corpus; inspect the nine-repo evidence once and classify *which methods, failure cases and optionally protocol contracts relate to which AION need*. Do not duplicate equivalent evidence, force a donor winner or re-clone the nine source trees already on `main`. The first-stage output is discovery/categorization, **not** source transplantation.

## Lane-owned investigation vs shared delivery

| Lane | Internal research/custody (existing paths) | What Development receives |
| --- | --- | --- |
| **Omega + VIVIM Final** | `landing/sources/vivim-omega/`, `landing/sources/vivim-final/`, `landing/synthesis/` | The prior C-003 prioritized queue and 65-ID dedup crosswalk, condensed to topic-matched OFFER/GAP/DECISION records |
| **VOMEGA semantic CLI** | `landing/sources/vomega/` including retention assessment | Deterministic parse/ground/validate methodology, ambiguity handling and negative-test ideas; AION builds its own compiler if later admitted |
| **Nine external repos** | `external/landing/donors/`, `external/sources.json`, `external/reference/`, `external/02-REPO-PRIORITIZATION.md` | Development-need-aligned methodology, negative-test and explicit protocol-contract classification, with evidence, overlap and limits; no donor as implementation owner |
| **Internal / frontier research** | Existing `velocity/research/` and `ops/command-space/` | Verified provider-native path, applicability, freshness, confidence, AION gap and actionable recommendation |
| **Development** | Existing `velocity/design/`, code, tests and CLI contracts | NEEDs (including future needs), DECISIONs and actual acceptance evidence back to all supplying lanes |

Individual lanes may retain their own cards and detailed research. They **do not** maintain competing delivery queues. The single exchange file is the cross-lane summary and index, not a copy of every finding. Prefer existing evidence files to new documents.

## Keeping it small and useful

- One record per *distinct capability/problem*, not per donor or per snippet. Avoid topic synonyms and duplicate providers. Link existing records instead.
- Each OFFER must identify **what**, **where**, **why AION should care**, **limits**, and **what to do next**. If evidence is absent, use GAP/NEEDS_EVIDENCE and a narrow investigation task.
- No mandatory PR/issue per record; update EXCHANGE.jsonl in a normal scoped commit on `main`. Use a short-lived worktree/branch only for concurrent writers or reviews.
- Preserve current research cards/crosswalk; **don't rebuild** the 65-ID ledger or the 1000-row Command Space matrix in this queue.
- No automatic implementation, provider grant, browser action, or status promotion from an exchange record. Track A is deprecated; runtime/agent expansion is on hold.
- When Development asks for new intelligence, Harvest should reply in the same schema and cite `source_refs`; there is no separate prompt bus, agent orchestration system or scheduled poller.

## Practical examples

The live [exchange](EXCHANGE.jsonl) retains the original needs and subsequent nine-repo source-inspected offers AX-0016–0018. Those offers classify **methodologies and failure modes**, not adopted AION protocols or implementations. Nine-repo first-pass classification is delivered, while exhaustive provider-operation coverage and AION I0–I3 validation remain outstanding.
