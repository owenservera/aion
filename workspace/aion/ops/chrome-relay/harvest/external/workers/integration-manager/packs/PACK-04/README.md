# PACK-04 - pure DOM-to-text response serialization

**Status:** staged for Development review. Not wired into the runtime, not accepted, not live-verified. The fixtures in this pack **were** executed offline (`node --test`, 13/13 passing, Node 24.11.1); no donor test was run and no browser or network was touched.

## Provenance

- Adapted from `multi-ai-chat/src/content/responseSerializer.ts` at upstream **`cdcf6a7fb05609b219fd85395a116f26476a7f92`** (MIT), retained in `harvest/external/landing/donors/multi-ai-chat/`.
- License: `LICENSE-MULTI-AI-CHAT.txt` (Theodore Huang, 2026 MIT).
- Donor test worth reading for fixture inspiration, **not run**: `multi-ai-chat/test/responseSerializer.test.mts`.

## What it does

- `serializeResponseText(root, { tokenNonce })` converts a response subtree to Markdown-ish text: headings, paragraphs, bold/italic/strike, inline code, fenced code with language, nested ordered/unordered lists, blockquotes, tables (pipes and backslashes escaped), links restricted to `http(s)`, `BR`/`HR`, and omission of `SCRIPT`, `STYLE`, `NOSCRIPT`, `SVG`, `TEMPLATE`, `BUTTON` and `aria-hidden="true"`.
- `extractResponseContent(response, selectContentRoot)` returns that text, or an explicit `[Image generated]` / `[Image generated: alt]` marker when the turn is media-only. Media is never silently dropped.
- `longerResponseText(cached, fresh)` returns `fresh` only when it is **strictly longer** than `cached`.

## Why `longerResponseText` exists

Measured on ChatGPT by the donor: the stop control disappears while only 39 of the eventual 301 characters have rendered, and the rest lands about 1s later. The "still generating" signal can end before the final render commits, so shipping text cached mid-stream truncates the answer - in the worst case down to its opening line. Streaming is append-only, so the longer of the two is the complete one. This is the read-side half of the rule; it is **not** a completion classifier and must not be used as one.

## Deliberate deviations from the donor

1. **Per-call protection nonce.** The donor used a fixed sentinel (`\uE000MAC_PRE_<n>\uE001`) to protect code blocks while the rest of the tree is normalized. AION keeps the technique but adds a per-call nonce so provider text cannot collide with the sentinel. Restoration still uses a replacer **function**, because `$&`, `$'` and `` $` `` inside a code block are `String.replace` substitution patterns and would rewrite the code being restored.
2. **Plain ES module, no TypeScript.** The pack follows PACK-01/02 style and declares the node contract in the module header instead of `Element` types: `nodeType`, and for elements `tagName`, `childNodes`, `textContent`, `getAttribute(name)`. Real DOM nodes satisfy it; the tests use a minimal fake tree.
3. **No types, no build step.** `package.json` exists only to mark the folder `"type": "module"` so `node --test` can run it. It is private and is not a workspace member.

## Integration points (Development-owned)

1. Destination suggested by the strategy: `extension/src/providers/chatgpt/response-serializer.js` (or the provider-neutral read boundary). The file is not present on `main` at packaging time.
2. Call it where turn text is read, with the provider's stable response element and, where the provider nests text under a narrower root, a `selectContentRoot` callback. Feed the result into the existing snapshot/text path; do **not** add a new field for it.
3. At finalization, compare the cached mid-stream text with the freshly extracted text via `longerResponseText` before publishing.
4. **This pack changes no `event/1` and no `snapshot/1` field.** It emits no event, owns no identity, performs no retry and has no effect.

## What it must not be used for

- Proving that a response is complete. Terminality still requires positive generation/final/blocker evidence; `longerResponseText` only prevents a late render from being discarded.
- Proving message identity or correlation. Text is not an ID.
- Trusting provider HTML as Markdown-equivalent. Tables flatten `rowspan`/`colspan`, media becomes a marker, and code language detection is a class/attribute heuristic.

## Tests

```
cd harvest/external/workers/integration-manager/packs/PACK-04
node --test
```

Covered: longer-text rule (including equal-length rewrite), code fences containing `$&` / `` $` `` / `$'`, fence growth for embedded backticks, table escaping (pipe and backslash), media-only markers (with and without alt), nested and ordered lists, blockquotes, headings, inline-code padding, safe/unsafe links, omitted tags and `aria-hidden`, inline emphasis whitespace.

## Unknowns for Development

- Real ChatGPT DOM shapes (the pack was not run against a page); shadow roots and iframes are out of scope.
- Behaviour on very large turns and on virtualized/offscreen content.
- `rowspan`/`colspan`, nested tables, definition lists and MathML are not modelled.
- Provider-specific code-language markup beyond `language-*` / `data-language`.
- Whether the AION read path already normalizes whitespace before this serializer runs; double normalization is harmless but should be checked at integration.
