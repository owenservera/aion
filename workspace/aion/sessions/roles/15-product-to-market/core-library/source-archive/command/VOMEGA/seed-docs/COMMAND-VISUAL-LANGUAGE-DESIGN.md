# Command Visual Language — Real-Time Interpretation and Guidance

Status: **INITIAL DESIGN PROPOSAL / ACTIVE BRAINSTORMING**  
Started: 2026-10-05  
Scope: product interaction blueprint and conceptual protocol; no implementation or usability proof claimed.

## 1. Purpose and authority

The owner requested a real-time visual feedback system for natural-language commands: a suite of UI and interaction tools that exposes what VOMEGA has interpreted and lets the person guide it. The owner explicitly added icons and other visual elements as tooling, including a computer marker for Windows commands versus an AI identity when interacting with an AI service.

The owner further requires reprogrammability and customization, including simple replacement of one icon library with another (section 13).

Those are owner-directed requirements. The particular marks, colors, layouts, timing, fields and examples below are candidate designs developed in conversation. Recording them does not freeze a schema, select a UI framework, establish new authority, or claim that the owner has approved every proposed treatment.

This document elaborates [First Product Release Design](FIRST-PRODUCT-RELEASE-DESIGN.md), especially sections 3, 6, 12–17 and 22. It follows [Vision](VISION.md) and [Invariants](INVARIANTS.md). The existing [floating shell workstream](../.project/roadmap/workstreams/WS-SHL-floating-shell.md) is an integration point, not evidence that these interactions exist.

Core promise:

> You can see what your words will cause, and correct the interpretation before it causes the wrong thing.

A companion design principle is the [Negative Intent Signal Engine](NEGATIVE-INTENT-SIGNAL-ENGINE.md): the visual system should be able to expose the **highest-value plausible counterfactual** before the leading interpretation becomes expensive to unwind. The renderer does not generate alternatives; it projects revision-bound negative-frontier data produced from the same semantic candidate space as the runtime compiler.

## 2. Product shape

The first surface remains a small floating Windows command box. Ordinary language is primary. The visual system is an editable reflection of the shared semantic command representation.

Use three levels of disclosure:

1. **On the expression:** quiet annotations identify interpreted phrases, unresolved choices and scope.
2. **Below the expression:** a short “I understand…” effect preview exposes targets, material assumptions and missing information.
3. **On demand:** an expanded view exposes exact Accounts, parameters, inputs, dependencies, authority, realization and evidence.

Keep the original wording recoverable. Do not silently replace the person's prose with machine shorthand. Typing, selecting a menu item and manipulating a visual handle must converge on the same semantic command path. Pure presentation gestures remain presentation.

## 3. Distinctions the visual system must preserve

| Dimension | Question answered | Example |
| --- | --- | --- |
| Interpretation | What does Ω think the expression means? | Send this prompt |
| Grounding | Which real entity does it refer to? | Claude, specific work Account |
| Availability | Can this capability be used now? | Known Account, session needs login |
| Authority | Is this operation allowed within this scope? | Covered by standing authorization, or consent needed |
| Consequence / risk | What changes or leaves the machine? | Prompt content is sent to an external service |
| Execution | What is happening or has been attempted? | Sending, paused, failed, cancelled |
| Evidence | What was actually observed, and how recently? | Submission observed; answer not yet observed |

These are independent dimensions, not one green/red readiness score. An understood command can be unavailable. An authorized action can fail. A provider logo proves neither Account identity nor connectivity. Confidence is not proof.

Represent unknown, stale and unsupported explicitly. Do not use a completion animation, elapsed timer or absence of errors as evidence of success.

## 4. Candidate visual vocabulary

Color reinforces meaning; labels and shapes must carry it without color.

| Primitive | Candidate meaning | Interaction |
| --- | --- | --- |
| Solid underline | Phrase has an assigned interpretation | Inspect meaning or change it |
| Dashed enclosure | Materially unresolved choice | Open alternatives relevant to that phrase |
| Bracket / shaded region | Scope, grouping, quoted payload or exclusion | Inspect exactly what is included |
| Labeled assumption | Value supplied by inference, default or policy | Inspect origin; change or reject where allowed |
| Temporary outline / circle | Current focus or correction target | Direct attention without permanent visual clutter |
| Identity icon + concrete label | Object, service, device or Account involved | Inspect or select the bound entity |
| Status badge + words | Availability, permission or execution state | Explain state and offer a valid next action |
| Connector / arrow | Dependency, fan-out or data movement | Expand the relationship and its direction |
| Preview / thumbnail | Referenced content or object | Inspect the exact input before use |

Use a small vocabulary consistently. Avoid syntax-highlighting every word. A circle should have a stable purpose, not alternately mean ambiguity, execution and success.

Assumptions without a source phrase need their own visible field. Uninterpreted material must not disappear: expose it when it may affect meaning, rather than making partial recognition look complete.

## 5. Icons as interactive tools

Every meaningful command object is a candidate for a visual handle through which the user can inspect and guide it.

| Entity family | Candidate marker | Minimum useful identity |
| --- | --- | --- |
| Local computer / OS | Computer icon | This PC / actual selected device; Windows where relevant |
| Installed application | App icon | Application and relevant document/window |
| AI provider | Provider logo or labeled service icon | Provider plus selected Account |
| Website / browser | Site icon or globe | Site and relevant browser/session context |
| File / folder | Type icon or thumbnail | Concrete item and inspectable location |
| Person / group | Person or group icon | Resolved recipient or audience |

Exact assets are undecided. Provider logos need a generic fallback. Icons require accessible labels and must not depend on brand recognition.

Selecting a handle may expose identity, alternatives, supported actions, state, permissions or evidence. It must not execute merely because the handle was selected.

Keep three concepts distinct:

- **Target:** what receives the command or changes.
- **Executor:** what performs the operation.
- **Location:** where processing and effects occur.

AI and computer are not mutually exclusive categories. AI may interpret a Windows action; a browser may realize an external AI request; a local model may process a local file. Derive markers from known command and realization state, not the presence of AI-sounding words.

For “Ask Claude to explain this file,” show the file and the external recipient, with the proposed content transfer made explicit. A computer icon alone must not imply that all processing stays local.

Identity stays stable while status changes. Add “Needs login” beside an Account rather than replacing its identity with an unexplained warning symbol.

## 6. Interaction protocol

1. **Compose:** preserve caret, selection and ordinary editing. Partial text is not automatically invalid.
2. **Interpret:** generate candidate meaning tied to the current input revision. Update at useful pauses without disruptive flicker or focus theft.
3. **Project:** show recognized objects, scope, assumptions and a concise effect preview.
4. **Challenge early:** when the semantic layer supplies a high-value negative-frontier signal, attach the smallest useful counterfactual to the relevant phrase/field. Prefer one discriminating alternative over an N-best dump. Do not interrupt merely because another candidate exists.
5. **Clarify:** attach required choices to the relevant phrase or missing field. Prefer interaction-triggered menus; interrupt only where needed to resolve a material blocker.
6. **Refine:** accept either wording changes or visual/counterfactual choices into the same semantic representation. Recompute affected fields and visibly invalidate obsolete bindings.
7. **Validate:** check capability, targets, Account identity, freshness, parameters and authority through the shared command machinery.
8. **Commit:** bind execution to the concrete command revision and applicable authorization. Interpretation selection alone is not execution consent.
9. **Observe:** render host execution and evidence events; distinguish attempted action, observed submission, result arrival and verified outcome.
10. **Recover:** explain the smallest valid next action. Preserve partial outcomes and uncertainty. A retry must account for possibly completed external effects.

Late results from older text revisions must not overwrite the current interpretation. If a material edit changes targets, payload, scope or side effects, reassess affected validation and authorization. Existing valid standing authorization should not generate redundant confirmation ceremonies.

Editing a new draft while an earlier command runs must not silently retarget the running command. Cancelling work does not undo an already observed external effect.

## 7. Relationships and language boundaries

Recognizing nouns is insufficient. Project relationships such as:

- “and” — multiple targets or grouped inputs;
- “then” / “after” — ordering and dependencies;
- “only” / “except” — scope restriction;
- “don't” — negation and its scope;
- “until” — a stop condition, where supported;
- quoted text — content to send rather than instructions to Ω.

Example: “Send Claude this prompt: ‘delete the old draft.’” The quoted instruction is payload for Claude; it is not a local deletion request. Its enclosure must make that boundary inspectable.

For “Ask ChatGPT and Claude to critique this, then compare their answers,” expose two critiques and a dependent comparison. Resolve who performs comparison, what inputs are shared and what happens if one target fails. Do not silently append synthesis or forwarding steps.

These are extensibility tests. Fan-out and generalized workflows are not added first-release prerequisites.

## 8. Walkthroughs

### First-release Account disambiguation

Expression: “Ask Claude to explain this error.”

- Underline the interpreted operation.
- Show Claude with an unresolved Account handle if more than one valid Account fits.
- Mark the exact error text as payload; if “this” has no grounded referent, request it.
- Choosing Work binds that Account and updates the effect preview.
- Show conversation destination/defaults where relevant, session state and authorization.
- After execution, distinguish submission observed from answer observed and target verified.

### Local Windows command — future design probe

Expression: “Lower my volume.”

Show a computer handle labeled “This PC · Windows,” a proposed system-volume action and an unresolved amount unless a valid visible default applies. Typing “to 20 percent” and selecting 20% through a control should converge semantically.

Do not advertise Windows volume control as implemented or as a first-release requirement. This example tests whether the language generalizes beyond AI services.

### Fan-out — future design probe

Expression: “Ask ChatGPT and Claude: suggest three names for my project.”

Show the exact Accounts and shared payload. Preserve per-target outcomes: one can complete while another needs login. Do not collapse partial completion into global success. Retrying the blocked target should not resend to the completed target by accident.

### Stale grounding

A familiar Account remains identified, but its session evidence is stale. Show both facts. The menu offers grounded recovery options, and the effect preview must not imply that fresh identity verification has already happened.

## 9. Conceptual projection contract

This is a list of information needs, not a new frozen wire format. Inspect and reuse existing command/session/VisualSpec contracts before implementation.

A visual annotation or handle may require:

- stable semantic field/object identity;
- optional source span, tied to an input revision;
- command revision / semantic reference;
- role and interpreted value;
- alternatives and unresolved requirements;
- origin: explicit words, direct selection, configured default, policy or inference;
- grounding references and freshness;
- availability and authority state, represented separately;
- risk/effect and data-movement information;
- permitted inspection/correction actions;
- accessible label and explanatory text;
- execution/evidence references when relevant.

Fields without source spans remain representable. Multiple spans may contribute to one meaning, and one span may affect multiple fields. Character positions alone cannot provide durable semantic identity.

The semantic system supplies interpretation and validation. Registry/evidence sources supply actual capability and entity state. The visual projection renders them. Interaction produces semantic edits or commands; the renderer does not become another interpreter or authority engine.

Equivalent typing and visual selection should produce equivalent canonical meaning under the same context. The existing roadmap names a VisualSpec projector; this proposal should be reconciled with it rather than implemented as a parallel model.

## 10. Accessibility and timing

- Support keyboard-only completion, correction, inspection and dismissal.
- Keep essential meaning available without hover.
- Pair icons, colors and animation with readable labels.
- Preserve focus and caret while feedback arrives; respect text composition and ordinary undo behavior.
- Announce meaningful interpretation changes without reading every keystroke.
- Honor reduced motion and accommodate magnification, high contrast and narrow layouts.
- Keep tentative feedback distinguishable from resolved meaning.
- Measure typing disruption and comprehension before selecting debounce timing, animation or automatic-menu rules.

The correct latency target is open. A fast misleading preview is not a success.

## 11. Smallest useful first-release experiment

Prototype the supported Account-registration and single-Account prompt.send journeys with:

1. interpreted phrase;
2. unresolved choice;
3. payload/scope boundary;
4. visible assumption;
5. interactive provider/Account identity;
6. effect preview;
7. evidence-based outcome.

Use explicitly labeled mocked state to test interaction only, then connect the same projection to real command and evidence sources. The earlier in-conversation sketch was a local choice demonstration, not a parser, connected provider or Windows proof.

Candidate observations and falsifiers:

| Experiment | What to observe | Failure signal |
| --- | --- | --- |
| Deliberately wrong Account | Whether user detects and corrects it before execution | Familiar provider logo hides the wrong identity |
| Hidden default / assumption | Whether user predicts the actual effect | User cannot see a consequential supplied value |
| Ambiguous scope or quoted payload | Whether interpreted boundaries are understood | Content is mistaken for an Ω instruction |
| Keyboard correction | Ability to complete without pointer use | Essential handle or choice cannot be reached |
| Delayed interpretation | Whether an old result affects a newer draft | Preview or execution reverts to stale meaning |
| Unavailable Account | Whether understood and available remain distinct | Underline/logo is interpreted as operational readiness |
| Typed vs selected equivalent | Semantic equivalence in identical context | Different path, scope or authority |
| Partial result, when fan-out is tested | Accurate target-level outcome and retry choice | Global success or duplicate sends conceal failure |

Record prediction accuracy, correction success, disruption and task completion. Establish thresholds from experiments rather than claiming unmeasured usability. Prototype tests do not replace live execution evidence.

## 12. Open design questions and next work

- Which annotations remain visible during typing versus after a pause?
- Should resolved objects stay annotated prose or become optional chips?
- How should direct visual corrections appear in the original wording?
- Which assumptions deserve compact visibility, and which can remain expanded?
- How should overlapping scope, negation and nested relationships be shown?
- Which icon family communicates device, service, Account and locality most clearly?
- When does a menu help rather than interrupt?
- How should unsupported phrases be explained without implying hidden capability?
- Which outcome details fit in the small floating surface?
- How should contextual Wiki help attach to a handle without crowding the command?

Next: compare a small number of treatments using the same realistic tasks, record what fails, and revise this document. Harvest existing editor/annotation/accessibility mechanisms before building a custom one. No spatial canvas, large dashboard, generalized Windows automation or new mandatory release gate is established here.

## 13. Reprogrammability and customization

**Owner requirement:** this visual system must adhere to Ω's reprogrammability and customization principles. It should be simple to swap one icon library for another. This applies to the interaction language as a whole, not only its colors or decorative assets.

The exact mechanisms below are proposals. The requirement is a replaceable, user-customizable surface whose semantics and governed behavior survive replacement.

### Separate meaning from its visual realization

Semantic identity, command state and available actions must not depend on an icon library, component framework or theme. The shared system describes what an object means and what can be done; a replaceable presentation mapping determines how it appears.

For example, a conceptual role such as `device.computer` can map to one library's monitor symbol, another library's laptop symbol, or a user-supplied asset. That mapping does not change the selected device, command, authority or evidence. These role names illustrate the boundary; they do not establish a new mandatory schema.

The candidate underline, circle and badge treatments in section 4 are defaults to test, not permanent universal glyph assignments. A selected visual profile should remain internally consistent and explainable while being replaceable.

### Customization surfaces

| Surface | What should be replaceable or configurable | What must survive |
| --- | --- | --- |
| Icon assets | Library, pack, individual semantic-role overrides, provider artwork | Entity identity, accessible label, action binding |
| Visual styling | Color, typography, contrast, size, spacing and motion | Legibility and distinguishable states |
| Annotation grammar | Underline, enclosure, badge or other treatment for each semantic role/state | Meaning and inspectable scope |
| Layout and disclosure | Compact/expanded arrangement, information density, help placement | Access to consequential targets, assumptions and effects |
| Interaction bindings | Supported shortcuts, menu placement and gestures mapped to commands | Explicit behavior, command parity and authority checks |
| Renderers/components | Replaceable visual handles or interaction components | Projection inputs, semantic outputs and continuity |

Interaction reprogramming can intentionally change what a gesture invokes. Such a change must be inspectable and use ordinary semantic command and authorization machinery. Cosmetic replacement must never silently change behavior. A new capability is a governed extension, not permission hidden inside an icon pack.

### Simple icon-library replacement

The intended user journey is: select an installed compatible icon pack, preview representative command states, apply it, and revert if desired. The same change should be expressible through the semantic command system once customization is exposed as a product action.

A successful replacement should not require editing individual components, changing business logic, rebuilding the command model, migrating Accounts, or losing a draft. Adding a previously unsupported library may require one reusable adapter or mapping; choosing between compatible installed packs should be an ordinary preference change.

Keep library-specific asset names/imports at the replaceable presentation boundary. Semantic objects and persisted commands should not contain those imports or rely on a particular pack's naming convention.

Missing icons should degrade to a known generic marker plus a concrete text label. Pack failure or removal must not leave an unlabeled control, corrupt meaning, or require the missing library to understand historical commands. Replacing provider artwork must still preserve explicit Provider and Account labels.

### User ownership and continuity

Customization should be locally owned, inspectable, persistent, exportable/importable and resettable. Preserve preferences across compatible renderer or library upgrades. Surface incompatible mappings and retain recoverability rather than silently discarding user choices.

A candidate precedence model is built-in defaults, selected profile, then explicit user overrides. Its exact scope and storage are open; avoid competing hidden defaults. Keep presentation preferences distinct from canonical commands, identity and execution history.

Preview changes against unresolved, unavailable, unauthorized, running, partial, failed and completed states. Users may change the expression of those states, but the system must retain access to their actual meaning and must not manufacture evidence or authority. Customization may change display density; it must preserve access to material command facts and accessible controls.

### Small replacement proof

During the first visual prototype, exercise two materially different icon packs through the same semantic mappings. Do not build a marketplace or broad theme framework first.

Verify:

- switching packs requires no command/resolver/business-logic edits;
- the same target, Account, command meaning and action binding survive;
- a per-role user override works without forking the whole pack;
- absent assets fall back to an accessible, labeled representation;
- switching preserves the current draft and never triggers execution;
- restart retains the preference and reverting restores the previous presentation;
- keyboard and screen-reader operation remain usable with either pack.

This is a proposed proof of the owner's replacement requirement, not a claim that customization exists today. Apply the same boundary to future annotation, layout and interaction customization as real use cases justify it. Reprogrammability must be considered from the first design; the breadth of the first customization UI remains an MVP decision.

## 14. Change record

- **2026-10-05:** Captured the owner's command-feedback brief and explicit icon/tooling addition. Recorded candidate visual grammar, semantic distinctions, interaction protocol, examples, conceptual projection contract, first experiments and open questions. Documentation only; implementation and usability remain unproven.

- **2026-10-05, customization follow-up:** Added the owner's reprogrammability requirement, replaceable visual/interaction mappings, semantic-role icon indirection, portable preferences, fallback behavior, and a two-pack replacement experiment. Specific mechanisms remain proposals; no implementation claimed.


## 15. Semantic Runtime Lab relationship

The owner subsequently defined a standalone modular testing environment for the broader language → interpretation → machine command → execution → feedback problem. See [VOMEGA Semantic Runtime Laboratory](SEMANTIC-RUNTIME-LAB.md).

The Lab is the intended experimental home for comparing the candidate visual grammar in this document. It should be possible to replay the same semantic trace through different annotation, icon, disclosure and interaction packs without changing canonical command meaning. Conversely, language/grounding/executable variants should be testable while holding the visual treatment constant.

This relationship does not make the Lab part of the shipped VIVIM runtime. It creates a deterministic development bench where this visual language can evolve against realistic Worlds, command corpora, execution events and evidence.


## 16. MVP Visualization Sandbox and VisualSpec vNext

The next design/proof environment is defined in [MVP Visualization Sandbox](MVP-VISUALIZATION-SANDBOX.md).

The sandbox should evolve the current preliminary `VisualSpec` rather than create a parallel UI truth model.

Current baseline reality:

- `nlcl-pure/src/types.ts` already defines Interpretation, token annotations, IR, effects, suggestions, gaps and preliminary VisualSpec types;
- `nlcl-pure/src/project.ts` currently projects token annotations and coarse effect previews only;
- Provider / Account / Model identity, semantic Wiki handles, interpretation revision identity and multidimensional consequence/evidence projection are not yet expressed strongly enough for the owner-directed MVP;
- `surfaces/web` provides an existing semantic API path but not the intended floating-box visual product.

### VisualSpec evolution target

A future VisualSpec candidate should carry, without becoming execution authority:

- interpretation session + revision;
- World version;
- exact input annotation spans;
- semantic handles;
- capability;
- Provider;
- Account;
- Model;
- realization where relevant;
- typed parameters/payload;
- validation state;
- unresolved choices;
- consequence facets;
- expected evidence;
- contextual Wiki references;
- permitted semantic interaction actions.

The renderer should consume this projection and nothing more semantic.

### Provider / Account / Model distinction

The first MVP must visually distinguish:

```
Provider
  ↓
Account
  ↓
Model (optional/selected route dimension)
  ↓
Capability
```

This is a relationship, not an identity collapse.

A Model should not be rendered as if it were an Account or a Provider.

### Consequence projection refinement

Recent OS-taxonomy harvest exposed that a single READ/MUTATION/EXTERNAL_MUTATION badge is too coarse for human explanation.

The visual system should be able to present independent consequence concepts such as:

- external data transfer;
- destructive local effect;
- secret reveal;
- network interaction;
- physical effect;
- session-ending effect;
- authority/consent requirement;
- realization fidelity;
- evidence maturity.

Current law risk remains a useful input. It should not become the entire visual semantic model.

### Interaction parity

Clicks that change meaning become semantic edits.

Examples:

```
click Claude Work
→ route.account = account:claude-work

click another Model
→ route.model = model:<id>
```

The command is then recompiled and revalidated.

The UI must not keep a hidden routing truth outside the semantic session.

### Research lineage

The old VIVIM symbolic harvest is useful evidence for:

- ambiguity as an interactive handle;
- progressive disclosure;
- compact semantic chips;
- explicit risk gates;
- distinct confidence/proof representation;
- structural rather than prose-only interpretation feedback.

Historical claims such as “canvas is the source of truth” do not carry forward. In current Ω, a surface is a projection, never canonical reality.

### Design experiments

Visual refinements should be tested through [Automated Semantic Experiments](AUTOMATED-SEMANTIC-EXPERIMENTS.md), including semantic-churn measurement, ambiguity honesty, multiple presentation packs and contextual Wiki relevance.

## 17. Semantic Data Engine relationship

The semantic identities displayed by the visual system are defined by [Semantic Data Engine](SEMANTIC-DATA-ENGINE.md).

The visual layer should not own:

- Provider inventory;
- Account inventory;
- Model inventory;
- capability schemas;
- route validity;
- consequence semantics;
- source/Wiki truth.

It projects them.
