# Native shape / harness projection — candidate contracts v0.1

**STATUS:** Design only; no production schema or API authorization. Never use API model output as evidence of a browser webapp shape.

## Illustrative observation envelope
```json
{
  "schema":"aion.web-observation/1",
  "provider":"anthropic.claude.web",
  "surface":"chat",
  "account":{"state":"unknown","ref":null},
  "conversation":{"binding":"unverified","nativeRef":null},
  "browserAttachmentRef":"local-tab-ref",
  "turn":{"aionId":"turn-local-42","nativeMessageId":null},
  "event":{"kind":"content.updated","partType":"artifact","revision":3,"state":"streaming"},
  "native":{"shape":"claude-web-observed-v1","carrier":"dom","payloadRef":null},
  "evidence":{"captureRef":"local-capture-ref","sequence":456,
     "dom":"observed","network":"unmatched","attribution":"provisional","coverage":"partial"}
}
```
Everything above is fabricated example data. In the real system, private browser IDs, raw text and local paths belong only in local capture data.

## Primitive types
- `EvidenceRef`: capture/session/sequence, carrier, digest, original source, observed time, completeness, validity, no private payload exported to Git.
- `NativeShape`: provider + version + surface + source match evidence + raw/DOM structure with unprojectable portions retained.
- `SemanticPart`: `text | markdown | code | table | chart | image | file | citation | reference | visible-thinking-summary | progress | tool-activity-observed | artifact | error | interactive-native | unknown`. Provider-native type and source links always present.
- `Relationship`: `belongs-to | continues | branches-from | regenerates | produces | cites | renders-from | supersedes-version | recovered-from | evidence-for` with verified/provisional/ambiguous.
- `Availability`: `supported | unavailable | unverified` for current page/feature; evidence, effect class, scope, observedAt and expiration/remount awareness.
- `EffectReceipt`: target, AION key, expected revision, pre-send baseline, claimed delivery state, observed user turn, reply attribution, unknown-effect fence, no silent retry.
- `TaskActivity`: provider-native Work/Cowork subtask/activity/progress; distinguish AION invoked effect from page-reported activity.

## Lifecycle semantics
Message/content may `open`, `append`, `patch`, `replace`, `close`, `invalidate`; artifact may `created/revised/superseded/deleted/unavailable`. Completion states are distinct: `providerNetworkEnded`, `pageStable`, `turnAttributed`, `captureFinalized`, `captureAccepted`, `goalFulfilled`. A single boolean `done` is not enough.

## Candidate adapter interface (semantics; no prescribed implementation)
```text
detectSurface(page) -> observed | unknown
resolveNativeIdentities(page,target) -> grounded refs and missing evidence
observeNative(page,capture) -> raw-linked blocks/activities/resources
projectNative(observation) -> graph + loss/unknown markers
discoverCapabilities(page) -> page-specific affordances
performIntent(intent, existingStudioEffectOwner) -> receipt/uncertain
reconcile(capture, journal, page) -> evidence-linked state
```
Adapter may not acquire a separate browser writer or replay undocumented authenticated backend requests. The common projection must not erase provider-specific semantics to satisfy an API-shaped schema.

## Invariants to validate
One fresh user delivery per AION key; later reply/new content after baseline; distinct generations cannot claim same source evidence; same text across branches is not identity; DOM and network disagreement remains visible; a failed effect cannot be silently replayed; browser/tab remount does not automatically rebind the conversation; native artifact content and revisions remain available after projection.
