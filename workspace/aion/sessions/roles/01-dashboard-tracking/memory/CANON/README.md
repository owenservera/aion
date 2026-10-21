# CANON — Dashboard & Tracking

- Dashboard owns evidence-backed AION operations visibility, not agent execution or engineering acceptance. Sources: issue #16, role BOOTSTRAP.
- Reuse existing `workspace/aion/pm/dashboard/` and Vercel project; no second dashboard system. Source: issue #16.
- Three views: Overview; Machine = ACP; Human = visual-first/tap-to-detail, mobile/desktop, accessible without color alone. Source: issue #16.
- Never collapse requested, dispatched, ACKed, responded, read back, and independently VERIFIED into one success indicator. Source: issue #17 and root AGENTS.md.
- Prioritize measured real-event-to-visible ping (<5 seconds when connected) before UI polish; polling alone is insufficient. Source: issue #17.
- GitHub issues are task/receipt records, not proof that an agent has seen a message or is executing it. Source: root AGENTS.md.
