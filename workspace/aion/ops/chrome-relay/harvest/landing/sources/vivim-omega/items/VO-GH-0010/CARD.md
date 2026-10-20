# VO-GH-0010 — Conversation/message/stream provenance

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/contracts/src/chat.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `967580df2ce316b87b7079dcb31209ca79e70864`
- **Source lines:** 1–136; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0010/source/chat.ts`
- **SHA-256, source/copy:** `9ed2bcf7c386ebd45fdf1c0fe5e54898302d63f46960601603e52816bebd2414`
- **Kind / priority:** schema / CORE
- **Original terminology:** ChatConversation; ChatMessage; ChatStreamRef
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Message records carry conversation identity, principal, realization and optional ordered-stream refs.

## AION application candidate (not accepted)
Separate transcript record lineage from operation submission/completion.

## Critical caveat
Omega chat is its own vault pilot, not ChatGPT UI turn-state evidence.

## Proposed acceptance falsifier
Conversation message creation cannot prove remote send.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
