# VF-0024 — Regression test explicitly expects second Send

**Flag:** CORE | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [tests/integration/engines/send-resilience.test.ts:88-143](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/tests/integration/engines/send-resilience.test.ts#L88-L143)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `de3993aa3f9dc413d4b0d720c24054af91841345`

**Whole-source SHA256:** `854c56dbc55672fde63597315b16151c5d9a4f3610e8589c0caec55a1d0f3897`

**Excerpt SHA256:** `621239abb0fa90f775798521d9f232303a49734736ada60e582768941cea5d3d`

**Domains:** failure-taxonomy, tests, unsafe-replay | **Prior lead:** FINAL-03

## Source intelligence
Mocked test documents resend as intentional and expects two send calls after reconnect.

## Hazards
This test models forbidden behavior for Track B; test was read, NOT run.

## Coverage and acceptance
Mock-test source was read but not executed. Donor execution, browser activity, tests and local checkout inspection are not claimed. Not accepted as AION product specification; inspect owners/tests and independently approve before promotion.
