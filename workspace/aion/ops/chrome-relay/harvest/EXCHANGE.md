# AION — Development ⇄ Harvest/Research Exchange

**One queue, one lightweight contract, on `main`.** This document and [EXCHANGE.jsonl](EXCHANGE.jsonl) are the only cross-workstream intake/delivery surface. Do not create a second registry, project board, permanent branch, or separate inbox per agent. [Repository governance](../../../../../REPOSITORY-GOVERNANCE.md) remains authoritative.

## Why this exists

Development (formerly Track B) must expose what it **needs now or anticipates later**. Each research/harvest lane must expose what it **actually found**, why it matters to AION, and the smallest safe next move. Donor code and provider documentation are evidence, **not** AION execution authority. Both directions use **one record shape** and the same stable `topic` key, so matching is mechanical and deduplicated.

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

An approach is an **option**, not a requirement. `candidate_approaches` supports 0..N choices, and a donor can supply one or several competing patterns (even two valid ways to solve one problem). Keep their own safety, license, completeness, compatibility, evidence and provider/session fidelity separate. Decision on use belongs to Development: SELECT / ADAPT / EXPERIMENT / DEFER / REJECT, recorded in a linked DECISION record and, for a technical architecture change, in accepted design 12 and its code-contract tests. Never adopt an approach automatically; a live Send uses only **one** explicitly admitted actuator, never an uncertain-effect fallback. Existing source cards retain raw detail; this exchange captures their small developer-actionable synthesis.

**Joining:** `topic` stays the dedup key, `AX-...` remains the exchange identity, `DEV-...` refers to one master area, `P1–P8/I0–I3` to accepted architecture gates, and `source_refs` to provenance. An offer may match several development needs; use `links` rather than duplicating prose or creating a permanent per-lane inbox. When the same topic appears in multiple donor repos, designate one *evidence-backed* primary owner after nine-repo triage, at most one justified backup; unverified hypotheses must remain unassigned.

## Four-step loop

1. **Development posts NEED** with one topic, existing AION seam, urgency, useful acceptance test and foreseeable dependency. This is not an instruction to implement donor code.
2. **Harvest/research posts OFFER or GAP on the same topic.** Each lane conducts its investigation internally in its existing folder, pins source commit + module/path, checks licensing and safety, and links relevant cards, source excerpts, comparisons, or docs. Publish **one synthesized delivery** instead of forwarding dozens of cards to Development.
3. **Development dispositions**: ACCEPT for a bounded candidate implementation (still subject to tests), DEFER or REJECT with reason; update the record or create a DECISION linking the OFFER and NEED. An OFFER can be proactive without a NEED, and remains discoverable by topic.
4. **Close only on verified outcome**: link implementation commit/test evidence (or explicit no-reuse decision). Keep the original source evidence immutable; refresh stale claims via a new revision/update rather than pretending upstream is unchanged.

**Routing:** start with existing local/crosswalk/command-space research; external-nine performs a single repo-by-repo capability ownership sweep **before any deep harvest**. One primary donor per topic and at most one genuinely differentiated backup. Do not duplicate evidence across donor repos. No source snapshot re-cloning; nine source trees already exist on `main`. The first nine-repo delivery should resolve **which donor owns which capability and why**, not just inventory files.

## Lane-owned investigation vs shared delivery

| Lane | Internal research/custody (existing paths) | What Development receives |
| --- | --- | --- |
| **Omega + VIVIM Final** | `landing/sources/vivim-omega/`, `landing/sources/vivim-final/`, `landing/synthesis/` | The prior C-003 prioritized queue and 65-ID dedup crosswalk, condensed to topic-matched OFFER/GAP/DECISION records |
| **VOMEGA semantic CLI** | `landing/sources/vomega/` including retention assessment | Keep/adapt/reject module decision, parser/validator seam, failure risks and concrete tests |
| **Nine external repos** | `external/landing/donors/`, `external/sources.json`, `external/reference/`, `external/02-REPO-PRIORITIZATION.md` | A **new** repo-role + topic-primary-donor synthesis with pinned file paths, duplicate avoidance, license and transfer risks; then bounded deep findings |
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

The seeded [exchange](EXCHANGE.jsonl) contains grounded Omega/VIVIM and VOMEGA offers, one Development receive need, and a pending nine-repo triage request. Their states are **research-only**. They are not claims of tested compatibility, completed external triage, or live ChatGPT operations.
