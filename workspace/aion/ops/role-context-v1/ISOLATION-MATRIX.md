# AION V1 — Context Isolation Matrix
All degrees of isolation describe observable product behavior, not ability to override assistant instructions or fully erase hidden internal context.

| Approach | New transcript? | Cross-chat memory potential? | Role workspace via private GitHub connector? | Durable later reuse? | Native title auto rename? |
|---|---|---|---|---|---|
| Switch role in same chat | NO, history retained | Yes, depending account/project | Potentially, if connected | Same chat can be reopened | NO |
| Fresh regular chat outside Project | YES | Possible if memory/personalization enabled | Yes if connector installed and authorized | YES | NO |
| Fresh regular chat in shared AION Project default memory | YES | Possible from project and potentially outside | Yes if authorized | YES | NO |
| Fresh regular chat in shared AION Project project-only memory | YES | SAME PROJECT CHAT HISTORY can be referenced | Yes if authorized | YES | NO |
| Fresh chat in per-role Project with project-only memory | YES | Other chats in that SAME per-role Project can be referenced; excludes outside project | Yes if authorized | YES | NO |
| Temporary Unpersonalized chat | YES | No memory/custom instructions/plugins for personalization; separate limited safety context still possible | Plugins/connectors disabled in this mode per current docs, so not rely on GitHub | Not normally, unless saved as regular (changes future behavior) | NO |

## Notes
- Official source, Projects: https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt
- Official source, Temporary Unpersonalized: https://help.openai.com/en/articles/8914046
- Official source, custom instructions: https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
- Saved memory model can change. Recheck exact product UI and settings. Never recommend switching the whole AION Project's memory mode without owner's informed decision—it affects other chats.
- The fresh-start prompt can ask the model not to use irrelevant memory, but cannot forcibly remove latent history, memories or global/project context.
- No guarantees for native ChatGPT title control or automatic new chat creation from in-chat keyword. User performs these UI operations for V1.
