# DRAFT, not created. Needs approval.
## Label
- name: `pm` · color: `#5319e7` · description: "AION PM inbox: questions/requests for the PM ledger"
## Pinned issue
Title: AION PM inbox
Body:
> This is the PM inbox for owenservera/aion. To ask PM something, either open an issue labelled `pm` or add `pm/inbox/<date>-<slug>.md` on main. Answers come back in the same place.
> Ledger: `workspace/aion/pm/LEDGER.md` (machine source: `ledger.json`). Owners: ZCode executes, AION PM plans and tracks.
> Not for execution dispatch (decision D4 freeze).
Commands (if approved): `gh label create pm -R owenservera/aion --color 5319e7 --description "..."`; `gh issue create -R owenservera/aion -t "AION PM inbox" -l pm -F body.md`; `gh issue pin <n> -R owenservera/aion`
