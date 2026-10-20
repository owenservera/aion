# VF-0025 — Newer lifecycle-aware provider plugin interface

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/providers/provider-plugin-interface.ts:12-110](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/providers/provider-plugin-interface.ts#L12-L110)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `0cab15095fe77fe998fc5103750005624862d300`

**Whole-source SHA256:** `87bbac2fbed1a778118864e71af1b38011f652e6bb178d93e81dccd5c76b5911`

**Excerpt SHA256:** `ae0d96de1c1667ee3af0bf186f57a1db26e133c30d4cc66b29b03baee75132ab`

**Domains:** provider-types, extension-points, lifecycle | **Prior lead:** new lead

## Source intelligence
Separate additive provider interface offers metadata, health, init, start and stop contracts.

## Hazards
Competing old ProviderPlugin interface exists: canonical provider registration unresolved; health is not action availability.

## Coverage and acceptance
Only the cited selected lines were read/captured. Donor execution, browser activity, tests and local checkout inspection are not claimed. Not accepted as AION product specification; inspect owners/tests and independently approve before promotion.
