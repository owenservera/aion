# VF-0023 — ChatGPT message DAG normalization

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/adapters/chatgpt-adapter.ts:297-365](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/adapters/chatgpt-adapter.ts#L297-L365)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `6467c06bbb952452bde7d44be4021baa322b674b`

**Whole-source SHA256:** `fcd0e0df965e6735ddb890574324c91db12b909ef964867ad983bd15606c7d0e`

**Excerpt SHA256:** `27ec889268fed518d91d5d524c77d1568d6bf3f06ea9a75e8dd5eef671dcc92d`

**Domains:** provider-specific, conversation-identity, message-schema | **Prior lead:** FINAL-08

## Source intelligence
Parses parent-linked provider message graph into normalized conversation form.

## Hazards
Old private backend REST architecture and cookie extraction must not be adopted or executed.

## Coverage and acceptance
Only the cited selected lines were read/captured. Donor execution, browser activity, tests and local checkout inspection are not claimed. Not accepted as AION product specification; inspect owners/tests and independently approve before promotion.
