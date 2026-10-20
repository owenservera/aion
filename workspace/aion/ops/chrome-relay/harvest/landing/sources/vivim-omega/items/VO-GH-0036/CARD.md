# VO-GH-0036 — Pure chat storage and indexing helpers

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/vivim-chat/src/chat.ts#L1-L208
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `ec6c8317d2f3db2db3a1208e2d554939fcf2ef5c`
- **Source line coverage:** 1-208; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0036/source/chat.ts`
- **Exact copied bytes SHA-256:** `d3e3fdb851a390e41d5148a2834af8341635e51841eb53a4e5ab46b2a6929ec9`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** parseAppendInput; checkStreamRef; nextChatIndex

## Source value
Validates principal, messages, provenance, stream refs and bounded per-conversation history index.

## Candidate transfer, not approved design
Map identity/evidence, not the chat vault store.

## Explicit hazard
Conversation persistence and stream sequence don't prove provider response completion.

## Acceptance falsifier
Recorded assistant text cannot bypass unresolved operation lock.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
