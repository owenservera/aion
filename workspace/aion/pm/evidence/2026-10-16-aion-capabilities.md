# AION capabilities interview (2026-10-16 02:50 Paris)
Chat: https://chatgpt.com/g/g-p-6ad11a203c5c8191830e60d8dd471200-001-projects-pm/c/6ad1744a-b024-83ed-af6d-793830ab22e6
Source: AION self-report (claimed unless marked V by AION).
- Tools: web search, Python/container sandbox (300s max/call, no outbound net), files, GitHub (read V; write untested), Drive, Gmail/Calendar, memory, project files, scheduled tasks (max hourly), image gen. Canvas N. Local Windows exec N. ZCode C (needs gateway).
- Persistence: sandbox /mnt/data NOT durable; GitHub is canonical.
- PC/ZCode reach today: none verified end to end.
- Recovery check: 0/5 of IAM SQLite, schema.sql, build.py, UAH dispersion SQLite, project.yaml present in sandbox. Likely only in original chats or Owen's downloads.
- AION's recommended next step: close receipt loop: GitHub inbox -> trusted PC consumer -> ZCode -> receipt -> GitHub; first test diagnostic-only.
- Open question from AION: is there an existing consumer reading the inbox and publishing receipts?
