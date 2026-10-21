# Universal Website Capture Studio — Capability One-Pager

**Vision:** Point the kit at an **active, user-authorized website**. As I navigate and interact normally, it observes what is available, recognizes meaningful **data shapes**, proposes an editable capture/record/parse model, and learns a reusable **site-specific profile**. Start with `chatgpt.com`; support other sites without redesigning the tool.

**Experience:** **Point → Discover → Show shapes → Suggest fields/relationships → Tweak → Live preview → Save profile → Record/replay/export.** Default to useful suggestions and one-click corrections—not a blank selector editor.

| Capability the tool needs | Observable result / user-facing control |
| --- | --- |
| **1. Point at an active site** | Attach to a specific authorized browser tab/session; identify site, page type, account/session context where legitimately available, and selected capture scope without disrupting the session. |
| **2. Learn by watching me use it** | Detect navigation, prompts, scrolling, pagination, expanding sections, uploads, replies, edits, tool results, loading and completion; explain what each action revealed about the page. |
| **3. Discover all *available* data layers** | Inventory browser-received response chunks, SSE/WS/events, decoded JSON, page state, DOM/accessibility content, metadata and attachments; show **source, fidelity, confidence and gaps** for each. No claim to server-only data. |
| **4. Identify meaningful data *shapes*** | Suggest page, conversation, message, turn, content block, table, row, card, citation, link, file, image, code block, equation, chart, timeline, navigation item, control, status, error and streaming event shapes. Discover unfamiliar shapes rather than forcing fixed categories. |
| **5. Recognize nested and mixed structures** | Understand a reply as an ordered tree of headings, paragraphs, lists, tables, links, embeds, callouts, media, interactive elements and invisible protocol envelopes—not one flattened text string. |
| **6. Infer entities, fields and relationships** | Propose keys, labels, types, timestamps, IDs, parent-child hierarchies, ordering, conversation-turn associations, revisions, references and links; distinguish observed values from inferred meaning. |
| **7. Suggest capture rules automatically** | For each shape propose **what to capture, from which layer, when it begins/changes/ends**, whether to save raw/parsed/rendered forms, and how to handle repeated or optional elements. |
| **8. Visual inspect and fine-tune** | Hover/select an element or event to highlight it in both page and captured view; rename fields, split/merge shapes, include/exclude content, change nesting, set identity rules and override a mistaken suggestion. |
| **9. Live, evolving preview** | As the page changes, display **raw stream ↔ parsed event ↔ structured record ↔ rendered page** side by side, with timestamps, incremental changes and explicit uncertainty. |
| **10. Full-fidelity session recording** | Preserve **all observed permitted raw bytes/events** without arbitrary truncation, alongside parsed records, ordering, revisions, capture provenance and source references; show gaps, missed starts, overflow and unknown history honestly. |
| **11. Stateful streaming semantics** | Detect starts, deltas, updates, replacements, finalization, deleted/retracted elements, loading/tool activity, interruptions, reconnects and duplicate/replayed events; retain both intermediate and final states. |
| **12. Adaptive site profiles** | Save a versioned **generic core + per-site/per-page capture profile**. Reopen it automatically, learn new variants, propose profile changes and allow rollback when a site redesign breaks rules. |
| **13. Calibration and quality scoring** | Suggest confidence per shape/field, compare raw/parsed/UI views, reveal missing fields and schema drift, and allow user confirmation/correction of discoveries. |
| **14. Search, replay and time travel** | Find any session, event, object or field; reconstruct what was visible and received at any time; compare edits/versions and replay a captured sequence without live website access. |
| **15. Local data ownership and interoperability** | User-controlled local storage; queryable canonical records and raw originals; selectable exports to JSON/JSONL, structured tables, Markdown, media references and downstream APIs/AI/agent tools. |
| **16. Privacy, permissions and resource control** | Per-site/tab scope, clear capture indicators, sensitive-field masking, inspect-before-export, local-only defaults, pause/stop/delete, disk quotas, bounded memory and explicit backpressure/loss reporting. |

## What it should auto-suggest from **this ChatGPT response**

**Conversation → assistant turn → ordered content blocks:** title / paragraph / multi-level heading / comparison table with column headers and rows / numbered list / bold emphasis / inline code / citations and URLs / file and GitHub links / icons, visual diagrams and cards where observable. Connect **source record ↔ decoded network events ↔ DOM content block ↔ displayed UI** when evidence supports the link. Suggest data types, row identities, parent-child relationships and stable references automatically.

The user should see editable proposals such as: **“Comparison table: 6 options × 4 fields; retain row records and raw table markup?”**, **“Six source links detected; capture destination and surrounding claim?”**, **“Streaming answer revised 12 times; retain all revisions or just final?”**, and **“UI block has no corresponding raw event yet; mark correlation unknown?”** These are *examples of the desired interface*, not claims that this tool currently exists or has discovered them.

## Acceptance definition

A user can open an unfamiliar site, perform ordinary actions, see the tool propose **accurate data shapes and relationships**, correct them without writing selectors/code, save a reusable site profile, and later reproduce an **honest, searchable, time-ordered local record**. For `chatgpt.com`, it must distinguish actual raw browser-received payload from DOM-rendered output and disclose uncaptured/server-only content; it must never equate “unbounded capture” with limitless storage or guaranteed completeness.

**Explicitly out of scope for this one-pager:** implementation language, frameworks, browser automation architecture, permissions bypass, UI mockups, sprint plan or tooling recommendation.
