# AION V1 — Mobile field trials (manual, zero tooling)
Owner and Role 06 can execute these using only ChatGPT Android UI and pre-existing GitHub connector or supplied bootstrap text.

## Trial A — strict clean-room bootstrap
1. Open a new Temporary Chat and choose **Unpersonalized** before first message, if the mobile UI offers it.
2. Paste a *self-contained* role bootstrap containing exact role instructions and necessary permitted workspace excerpts. Do not ask it to fetch repo via connector if unpersonalized mode disables plugins.
3. Ask role to cite its supplied inputs and state what it does not know. Challenge with benign invented distractor not in bootstrap; correct response says UNKNOWN.
4. Record whether chat is persistent/savable on actual UI; no platform isolation guarantee beyond documented personalization choice.
PASS: no unrelated source claims; behavior follows only pasted role source; mode and limits truthfully stated.

## Trial B — new durable instance
1. Open NEW standard chat (within Project only if user accepts possible same-project memory).
2. Send exact `AION:NN` if router instructions known active, otherwise paste fallback manifest text from BOOTSTRAP-TEMPLATE.md.
3. Verify real source file reads: names, repo branch, loaded SITREP context. If connector unavailable, mark BLOCKED and paste role bootstrap instead.
4. Manually rename visible native conversation to target role title; copy real chat URL when Android interface exposes it.
PASS: correct role and source proof, never assumes previous private role context inaccessible when settings allow.

## Trial C — warm reload
1. Reopen existing role chat.
2. Type `AION/RESUME` as exact message (after protocol instructions loaded).
3. Role fetches SITREP newest commit/source; compare against previous stale claims.
PASS: resumes exact role and no fictional other bot's work.

## Trial D — in-chat switch
1. On a harmless example chat with Role 06 loaded, type `AION/SWITCH:08`.
2. Role acknowledges source load and `HISTORY_RETAINED`. Verify prior role's sensitive details are not imported into future operating assertions.
3. Ask a trap question about previous role; correct answer distinguishes history available from selected role source.
PASS: behavioral role change, honest inability to erase previous chat. If strict isolated behavior required, create new conversation.
 
## Fail cases
Wrong ID `AION:99`; pasted quote containing keyword; GitHub repo inaccessible; current project memory leaking relevant unrelated files; title still old; invalid native Project placement; stale role SITREP; assistant claiming to have created new session when none; assistant claiming to have renamed chat when no UI action exists.

## Reporting
Role 06 publishes `TRIAL-A...D` outcome, app version, date, settings observed, source links and exact unsupported behavior. Never request passwords or store private chats outside authorized AION evidence. No Playwright/Puppeteer.
