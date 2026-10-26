# Poppy — single-user applicability assessment

**As of 2026-10-25.** Evidence: [source manifest](SOURCE-MANIFEST.md), [official live changelog](https://personalagentprotocol.org/docs/changelog), [official spec](https://personalagentprotocol.org/docs/spec), [official project](https://github.com/personal-agent-protocol/personal-agent-protocol), [Datalayer SDK](https://github.com/datalayer/personal-agent-protocol). The official website is newer than the pinned historic GitHub source snapshot.

## What is valuable

Poppy attempts to define the boundary **personal agent → participating company**: discover `/.well-known/poppy.json`, bind a session and identity, receive authorized access, then use company-declared APIs, web flows or company conversations. It is not a code-writing agent, OpenCode remote client, model router or replacement for AION's local control plane. For one individual, the eventual value would be safer delegated work with third-party services without each vendor needing an unrelated adapter.

## Relationship to existing stack

| Current system | Relevance | Adoption decision |
|---|---|---|
| AION / ACP / UAH | Internal authority, orchestration, receipt and local host execution | **Complement**, add consumer Poppy adapter only when a real service/task exists |
| OpenCode 2.0 / ZCode | Developer agents operating local code and sessions | Could **build/test** a Poppy consumer, but protocol does not itself connect an Android app to OpenCode |
| MCP / OpenAPI | Tool/API access | Poppy can advertise MCP/OpenAPI among company interfaces; not a replacement |
| A2A and PACT | Adjacent agent interoperability efforts | Compare real-world adoption and trust semantics before selecting |
| VIVIM / personal AI | Potential future natural consumer | Research applicability; no integration accepted or implemented |
| VIVIM Harness | Observation/capture component lives solely in `owenservera/vivim-harness` | **Do not** move, copy or implement Harness code in AION |

## Material version risks

The official [draft 0.3 changelog](https://personalagentprotocol.org/docs/changelog) explicitly changes how sign-in types are discovered, removes built-in `poppy:read` and `poppy:write` scopes, moves to session-specific DPoP keys instead of `session_id`, changes browser session joining to one-time codes, and strengthens separation of agent secrets from model context. This is highly relevant to permission safety and a direct risk to code hardwired to historic 0.1/0.2 drafts. **Do not implement 0.2 semantics as current without a version compatibility check.**

## Implementation evidence

- [Official source repository](https://github.com/personal-agent-protocol/personal-agent-protocol) is a static documentation site, not an executable production service.
- The official company implementation kit is a **company-side** skill, schemas and validator, not a universal personal-agent client.
- [Datalayer Python/TypeScript SDK](https://github.com/datalayer/personal-agent-protocol) offers a community implementation and example flows. Retrieved npm metadata identifies v0.26.0 as targeting 0.2. Live 0.3 compatibility and end-to-end results on the owner's host are **UNVERIFIED**.
- A named design partner is not an independently verified live `poppy.json` service. Do not promise connections to Stripe/Shopify/other named partners.

## Smallest falsifiable pilot (future optional, not executed)

1. Select a synthetic, non-production example supported by the community SDK (no accounts or payments).
2. Confirm source version/SDK compatibility and DPoP key handling; keep all tokens and private keys out of model prompts.
3. Run discovery → signed-out session → a read-only example operation or conversation with traceable local receipts.
4. Negative cases: mismatched company domain, expired/reused token, insufficient scope, bad redirect, replay, SDK/spec version mismatch.
5. Stop if there is no compatible sample and no real business offering a Poppy endpoint. **Do not build a bridge to invent adoption.**

## Evidence delta — 2026-10-26: publicly reachable discovery, not proven end-to-end adoption

- **Direct public observation (2026-10-26; no credentials):** https://crosswalk.to/.well-known/poppy.json returns a Poppy `protocol_version: 0.2` discovery document for `crosswalk.to`, issuer `https://crosswalk.to/poppy`, and advertised remote MCP URL `https://mcp.crosswalk.to`. This establishes **one reachable company-side discovery artifact**, not a verified OAuth handshake, issuer metadata, scope enforcement, usable MCP operation, agent-side interoperability, or production adoption by the major listed design partners. Attempts to inspect OAuth metadata and MCP protected-resource metadata via the available public web reader were inaccessible; **inaccessible != absent**. Source document publication date not exposed; first verified read here 2026-10-26.
- **Limited deployment counterexample (vendor claim; published/updated 2026-10-10):** https://x1wealth.com/resources/x1-poppy-personal-agent-protocol says X1 tested a private, read-only estate-review MCP pilot with a client and QA account. This is a **private pilot claim**, not independently tested or generally accessible production integration.
- **Official maturity boundary (checked 2026-10-26):** https://personalagentprotocol.org/docs/path-to-1 describes design partners as implementation collaborators and lists self-hosted personal agents, payments, push, version negotiation and attachments as open topics. https://personalagentprotocol.org/docs/changelog still labels 0.3 **draft**, with breaking scope/sign-in/session-key/browser-join changes; frozen 0.2 was published 2026-10-24.
- **SDK implementation gap (maintainer self-report, checked 2026-10-26):** https://github.com/datalayer/personal-agent-protocol documents 0.2 support but explicitly lists Account Token exchange, MCP Bearer transport, device/mediated sign-in, conversation SSE and handoff as unimplemented. A package/version label is not full protocol conformance; 0.3 compatibility and independent tests are unverified.
- **VIVIM product decision:** **WATCH ONLY for V1**; no new browser controller, credentials or production adapter. If the owner later selects an actual reachable company capability, isolate one optional, version-pinned `PoppyDiscoveryCapability` (read-only, no effects), map external issuer+company user/session/account/conversation IDs to existing ProviderAccount/ProviderThread/Work/EvidenceRefs **without substituting provider IDs for VIVIM IDs**. Smallest offline fixture: accept a valid 0.2 discovery JSON, reject unsupported 0.3, wrong `organization.domain`/issuer mismatch, malformed endpoint, private-network redirect, and any attempted credential/effect operation; log source version, origin and verdict. Estimated work: small isolated read-only parser/validator, but full auth/DPoP/adapter integration effort **UNKNOWN** until a real provider and supported SDK exist. Native recipient: https://github.com/owenservera/vivim-harness/issues/2 . No implementation or recipient ACK claimed.

## Decision

**WATCH / NO PRODUCTION INTEGRATION.** Continue existing AION Research Frontier monitoring for released 1.0, verifiable businesses, SDK conformance changes and practical single-user savings. Keep protocol discovery as read-only intelligence. GPM/native owners decide whether implementation ever becomes warranted.

**Evidence state:** source files copied and read back on GitHub; no local runtime installation, service integration, user-account sign-in or functional conformance claim.
