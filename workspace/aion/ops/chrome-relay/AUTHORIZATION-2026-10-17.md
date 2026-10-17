# AION_AUTHORIZATION_V1 — Windows master, Chrome relay + chatgpt.com access

Status: **GRANTED by owner, 2026-10-17.** Scope-limited on purpose. Anything outside this scope
needs its own authorization.

## Grants

| # | Grant | Scope |
|---|---|---|
| G1 | Register the native messaging host `com.aion.relay` under `HKCU\Software\Google\Chrome\NativeMessagingHosts` | host: `OWNER_WINDOWS_MASTER`; the `aion` relay bridge only |
| G2 | Add the `nativeMessaging` permission to the AION relay extension manifest | privilege increase over the shipped CR-001 MVP |
| G3 | Add `https://chatgpt.com/*` host permission and a content script to that extension | **read-only presence probe only** — see the limits below |

## Hard limits on G3 — what this authorization does NOT permit

G3 is deliberately narrower than "ChatGPT access", because the honest Milestone 1 goal is proving the
components communicate, not automating ChatGPT.

**Permitted under G3:**
- load the unpacked extension in a Chrome profile on this host;
- run a content script on `chatgpt.com` that reports **presence and identity only** — is a ChatGPT tab
  open, what is the page title, is the composer present (boolean);
- surface that presence to the side panel and into the relay envelope.

**NOT permitted under G3. Each needs a separate, explicit instruction:**
- typing into or submitting to the ChatGPT composer;
- reading assistant message text, conversation content, or history;
- exporting cookies, tokens, session identifiers or the access token;
- automated login, session renewal, captcha/Cloudflare handling, or rate-limit behaviour;
- opening, closing or focusing any tab not explicitly named.

Those are the M1 real-introspection actions. When they are wanted, the authorization must name the
browser target, the tab, the number of messages, and a rollback — per
`DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md` §5.

## Profile

The ChatGPT-capable profile is **Profile 3**. Preference order:

1. a profile that is **not** signed into ChatGPT, to prove plumbing first;
2. only then Profile 3, for a presence-only check.

Loading an extension into a signed-in profile is the step that puts code into an authenticated
session's origin. G3 does not make that step free of consequence, only bounded and reversible.

## Rollback

| Step | Undo |
|---|---|
| G1 | `Remove-Item 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay'` |
| G2 / G3 | `git revert` the manifest commit, or remove the unpacked extension from `chrome://extensions` |
| All | unload the extension + remove the registry key. No repository data is affected. |

The bridge writes no durable state outside the repo; durable evidence belongs in the GitHub ledger, not
in a live session.

## Recording rule

This file records **consent**, not completion. Each grant is only *exercised* when its own receipt is
recorded in `workspace/aion/agents/windows-master/`. Issuing this authorization does not mean any step
has been performed or verified.