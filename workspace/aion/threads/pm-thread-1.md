# IANG Integration Automation Planning

- Project: 001.PROJECTS.PM (ChatGPT project g-p-6ad11a203c5c8191830e60d8dd471200)
- Source: https://chatgpt.com/g/g-p-6ad11a203c5c8191830e60d8dd471200-001-projects-pm/c/6ad134b2-ba34-83ed-87fc-3b41b474f26c
- Captured: 2026-10-16 (read-only; page text, scrolled top to bottom, "Show more" expanded)

---

Yesterday 10:16 PM

**You said:**

All right, I'm starting a new thread, and I'll let the UAH project mapping design thread know, and you can let it know. I don't know how the fuck this shit works. But we're gonna set up. So here we're gonna set up the IA— what's it called? The integration automation, integration automation. What do you think? Well, you recall it. We need to start creating names. So that's like a mini, you know, side project, but, like, integration automation, like what's the right name? Anyway, so read what we did for what we're doing in the UAH project and start at the same level.

**ChatGPT said:** (Worked for 19s)

We're establishing a second design stream alongside UAH, not starting another disconnected project.

I've recovered the recent UAH mapping work, including the concentric boundaries, repository-by-repository discovery, shared SQLite database, alignment metrics, and integration convergence plan.

My recommendation: IANG — Integration Automation Network.

You've actually used IANG before, and there's already work behind that name. We should preserve it rather than invent a competing identity.

1. The two parallel workstreams

UAH — Universal Agent Hub — Architecture, integration boundaries, ownership, interfaces, and convergence

IANG — Integration Automation Network — Discovery, integration recipes, automation opportunities, execution, and evidence

Shared data, signals, alignment queue

UAH asks: How do these systems fit together?

IANG asks: How do we discover, connect, automate, validate, and maintain those integrations?

Neither replaces the other.

2. Same concentric discovery model

- L0: Existing IANG artifacts, collectors, recipes and execution contracts
- L1: Direct UAH integrations: ACP Bridge, ZCode, OpenCode, CCR
- L2: Infrastructure, providers, adapters, registries, Context7
- L3: Cross-repository dependencies and adjacent systems
- L4: Wider integration opportunities and candidate technologies

Lightweight discovery boundaries, not restrictive approval gates.

3. First-version alignment tracker

We already have an IANG v0.4 baseline in prior work, including a 30-task TODO register, 18-theme conversation crosswalk, evidence ledger, and integration planning graph. These should be reconciled, not recreated.

| Dimension | Initial signal |
|---|---|
| Discovery | Integration coverage and unknowns |
| Compatibility | Interface and protocol fit |
| Automation | Manual work that can be eliminated |
| Readiness | Implemented vs proposed vs tested |
| Reliability | Validation outcomes and failure evidence |
| Alignment | Consistency with UAH architecture |
| Value | Benefit, effort, and reusability |

These signals generate an IANG alignment queue, with source evidence and dependencies, rather than an arbitrary priority list.

4. Starting scope

- One database: UAH and IANG use the same SQLite database, with distinct logical domains and a shared graph of integrations, dependencies, evidence, and signals.
- One repository at a time: Start with SOFTWARE_HQ, then expand outward through recorded dependencies. Preserve existing authoritative repositories and components.
- One alignment interface: IANG publishes integration discoveries, readiness, blockers, and opportunities into the shared queue. UAH consumes these signals to guide architectural convergence.

5. Naming and responsibility

I'd use this hierarchy:

- IA — Integration Automation, the discipline.
- IANG — Integration Automation Network, this workstream and its system.
- IANG Mapper — Discovery, inventory, and dependency mapping.
- IANG Engine — Recipes, execution, testing, and evidence collection.

The previously established ChatGPT → tunnel → ACP Bridge → ZCode → OpenCode architecture remains intact, with CCR handling provider routing. ZCode remains the agent owner.

Thread designation: IANG — Integration Automation Network (DESIGN)

Initial work package: IANG-D01 — Integration Mapping & Alignment.

This is now our working design baseline in this conversation. I can use the shared UAH context, but I cannot directly send a message into the other conversation. The durable way to synchronize them is through their shared, Git-backed project artifacts.

No repository changes, commits, or pushes have been performed in this turn.

**You said:**

All right, so now, um, so I gotta create a third thread that's the kind of integration of both of you. So you're gonna be you, the IAM thread. So the first thing you're gonna do is, so your concentric circle, the center of it, just like the CLI was the center of the other one, yours, your central node, is actually the data model, okay? The data model that has a purpose. That's, you know, that's currently separate purpose as the CLI, but they will converge. And so what you have right now is a lot of documentation, okay? And yes, and, you know, you will have project management, so add to the SQL the project management side of it. It's important. But your work, I think, is a lot more self-contained. But I do need you to do a first pass, and I'll ask, you know, I'll probably ask another thread to do a deeper dive. But your real task here is, you know, your real kind of first milestone task, is that data model, okay? And that data model is for now gonna go into SQLite, because we're not actually gonna build the graph until we need it, or until we use it. So first, build that data model, identify kind of everything that you put in, and know that we talked, like today we talked about a million things, and there's gonna be stuff that's important that we miss, right? So that's a little bit of a, you know, that's one. You know, one, your first concentric circle, if you will, is getting everything that we talked about today into one— no, your second. Your second concentric circle is everything we talked about today into this one cohesive data model. So just, you know, just do the first version, and that'll be kind of the core. So think about how you're gonna, like, where you're gonna go for the core. You know, the first core is gonna be, you know, we had already listed the nodes.

**ChatGPT said:** (Worked for 2m 45s)

IAM — Core Data Model v0.1
SQLite prototype validated

IAM is now the dedicated data-model-centered stream. UAH remains CLI-centered, and the third thread will coordinate their eventual convergence.

I've created the first SQLite database and executable schema, including the project management layer. This is the starting structure—not a claim that everything discussed today has already been ingested.

Metrics: 33 SQLite tables (including FTS internals); 27 seed nodes; 5 initial queue entries.

SQLite integrity check: Passed
Foreign-key validation: Passed

Generated files: IAM SQLite database (.sqlite3), SQL schema (.sql), Reproducible builder (.py)

**The concentric model**

Center: purposeful SQLite model. Subsequent rings expand the evidence and coverage, not the complexity of the technology stack.

**What is inside the first data model**

| Domain | Core objects |
|---|---|
| Identity and graph | Nodes, node types, edges, edge types, aliases |
| Evidence | Sources, excerpts, claims, claim evidence |
| Integration | Systems, interfaces, integrations, recipes, execution runs |
| Inventory | Repositories, artifacts, providers, models, tools |
| Intelligence | Variables, objectives, metrics, signals |
| Project management | Initiatives, milestones, work items, decisions, risks |
| Alignment | Prioritized queue, dependencies, coverage |
| Acquisition | Ingestion batches, freshness, source provenance |

The important architectural decision is that the graph is represented as ordinary SQLite rows. Nodes have stable IDs and typed attributes. Relationships are stored as edges. We can evaluate graph queries and algorithms without introducing Neo4j, a graph server, or a second authoritative datastore.

The project-management records are part of this same model, so work items can be linked directly to their systems, sources, dependencies, risks, and acceptance evidence.

**First milestone: database foundation**

The first version also includes a preliminary inventory drawn from today's discussions:

- ZCode, OpenCode, CCR, ACP Bridge, Context7, GitHub, ChatGPT, and SOFTWARE_HQ.
- The previously discussed 100-variable catalog, 192-repository census, and 1,000 provisional work records.
- The earlier IANG v0.4 graph, reconciliation work, and evidence ledger.

The last three datasets are referenced, not yet populated. The next pass must reconcile them with the existing 23-table IANG schema so we do not create competing definitions.

**GitHub persistence**

Baseline handoff committed and verified on main

Repository: owenservera/SOFTWARE_HQ
Commit: 85476c3
[Link: View IAM v0.1 baseline on GitHub]

Persistence distinction: The design handoff has been committed. The SQLite database, SQL schema, and builder remain downloadable conversation artifacts; those three files are not yet in GitHub.

**Next milestone:** Make the second concentric ring evidence-complete by reconciling every relevant conversation, document, existing schema, and dataset from October 15 into the unified model.

That gives the third coordination thread a clear separation of responsibilities: UAH owns architectural convergence; IAM owns the data foundation; the third thread owns their alignment.

---

(End of captured page content. "ChatGPT can make mistakes. Check important info." UI footer omitted.)
