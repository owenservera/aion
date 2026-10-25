# Poppy primary-source pull manifest

**Pull performed:** 2026-10-25, via authenticated GitHub read and commit back to `owenservera/aion`.  
**Source custody:** AION RESEARCH, under this directory.  
**Source type:** public upstream documentation/source metadata. **This is not a local Windows git clone or an OpenCode installation.**

## Fetched, physically stored and read back

| Destination | Upstream source | Pinned upstream commit | Upstream blob SHA | License |
|---|---|---|---|---|
| [sources/official-draft-0.2-2026-10-19.mdx](sources/official-draft-0.2-2026-10-19.mdx) | [Official 0.2 spec source](https://github.com/personal-agent-protocol/personal-agent-protocol/blob/39b35bdf240fc07f157d6ca4e29b5a41d4b36b5d/content/versions/0.2/spec.mdx) | `39b35bdf240fc07f157d6ca4e29b5a41d4b36b5d` (2026-10-19) | `61668b7279cc6fdef7a10ce5d6d7c455df040fdc` | Apache-2.0 |
| [sources/official-changelog-2026-10-19.mdx](sources/official-changelog-2026-10-19.mdx) | [Official shared changelog](https://github.com/personal-agent-protocol/personal-agent-protocol/blob/39b35bdf240fc07f157d6ca4e29b5a41d4b36b5d/content/shared/changelog.mdx) | same | `c9774ffdb0e085981141e81ab33ba8a5da4ff224` | Apache-2.0 |
| [sources/LICENSE-official-Apache-2.0.txt](sources/LICENSE-official-Apache-2.0.txt) | [Official license](https://github.com/personal-agent-protocol/personal-agent-protocol/blob/39b35bdf240fc07f157d6ca4e29b5a41d4b36b5d/LICENSE) | same | `d645695673349e3947e8e5ae42332d0ac3164cd7` | Apache-2.0 |
| [sources/datalayer-sdk-package-0.26.0.json](sources/datalayer-sdk-package-0.26.0.json) | [Datalayer package.json](https://github.com/datalayer/personal-agent-protocol/blob/0ff43c55cc303c3165cb2d5841eca026e1c7c699/package.json) | `0ff43c55cc303c3165cb2d5841eca026e1c7c699` (2026-10-22) | `27f66d935820f463abe5a1dc269c077fc7c75374` | BSD-3-Clause |

Copied official docs are credited to their original authors and licensed under [Apache 2.0](sources/LICENSE-official-Apache-2.0.txt); SDK metadata originates with Datalayer (BSD-3-Clause). These are third-party originals, not AION-authored source.

## Freshness and conflicts — do not gloss over

- **Current website observed 2026-10-25:** official [changelog](https://personalagentprotocol.org/docs/changelog) shows **draft 0.3** underway, **0.2 published October 24**.
- **Retrieved pinned GitHub source at 2026-10-19 commit:** source states **draft 0.2**, and the repository's then-current `content/versions/versions.json` listed only published 0.1 and draft 0.2. This is a *historical snapshot* and NOT a frozen copy of final 0.2.
- **Datalayer SDK metadata at 2026-10-22 commit:** npm package version **0.26.0**, its description targets draft 0.2; independent compatibility with 0.3 has **not** been demonstrated here.
- GitHub connector commit search surfaced official source only through October 19 at time of this pull; the live official site is materially newer. This is a visibility/freshness limitation, not proof that upstream development stopped.

## Not pulled / not proved

- The **current 0.3 full source** and the final October 24 **published 0.2** full source were **not** copied. See the live URLs, which must take precedence for current semantics.
- No complete vendor repository fork/clone, installed executable, OAuth credentials, SDK package install, live company handshake, conformance run, or local Windows/Android action.
- The [official company-side implementation kit](https://github.com/personal-agent-protocol/personal-agent-protocol/tree/main/kit/company) and the [Datalayer SDK](https://github.com/datalayer/personal-agent-protocol) are indexed but not copied wholesale.
- Company design partnership is not evidence of a working deployment.

## Re-pull protocol

1. Fetch live upstream `content/versions/versions.json`, specification, changelog, kit and SDK release metadata. Record actual retrieved repo HEAD SHA, source blob SHA and UTC.
2. Compare live site against fetched GitHub data; if version states differ, preserve both and mark source freshness as limited.
3. For each materially new source, add a **new pinned snapshot**, not a replacement of old evidence.
4. Note practical delta in ASSESSMENT.md, then publish a linked change to [issue #30](https://github.com/owenservera/aion/issues/30) only if actionable.
5. Never run untrusted upstream scripts, copy credentials or change project execution permissions as part of a research pull.
