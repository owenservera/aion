import sqlite3, pathlib, json, csv
root=pathlib.Path(__file__).parent
conn=sqlite3.connect(root/'iam_core_v0_1.sqlite3');conn.executescript((root/'schema.sql').read_text())
types={
'initiative':'pm','milestone':'pm','work_item':'pm','decision':'pm','risk':'pm',
'system':'architecture','component':'architecture','interface':'architecture','integration':'integration','recipe':'automation','trigger':'automation',
'repository':'inventory','artifact':'inventory','document':'inventory','conversation':'inventory','provider':'inventory','model':'inventory','tool':'inventory',
'variable':'measurement','metric':'measurement','signal':'measurement','objective':'measurement',
'dataset':'data','schema':'data','entity_type':'data','connector':'integration','protocol':'integration','actor':'organization','multipliers_accelerators':'integration'
}
for k,v in types.items():conn.execute('INSERT OR IGNORE INTO node_types(id,domain) VALUES (?,?)',(k,v))
for k in ['depends_on','implements','integrates_with','exposes','consumes','owned_by','stored_in','documented_by','evidenced_by','measured_by','generates','supersedes','part_of','routes_to','executes_via','compatible_with','blocks','references','derived_from','tracks','proposes','connects_to']:
 conn.execute('INSERT OR IGNORE INTO edge_types(id) VALUES (?)',(k,))
seed=[
('iam','initiative','IAM — Integration Automation Model','Purposeful SQLite-centered integration intelligence and operational alignment'),
('uah','initiative','UAH — Universal Agent Hub','CLI-centered architectural convergence; separate but interoperable scope'),
('core_sqlite','schema','IAM SQLite Core','Canonical relational data model with typed graph-compatible nodes and edges'),
('today_reconciliation','milestone','Today discussion reconciliation','Import and map all October 15 discussions, keeping coverage gaps explicit'),
('software_hq','repository','owenservera/SOFTWARE_HQ','Software inventory, Context7 and integration documentation repository'),
('gpm','repository','001.PROJECTS.PM','Global project management and reporting'),
('zcode','system','ZCode','User-facing and execution harness'),
('opencode','system','OpenCode','Model-driven execution and sessions'),
('ccr','component','CCR','General-purpose model router, not Claude Code'),
('acp_bridge','component','ACP Bridge','ChatGPT to local agent access bridge'),
('zcode_acp','component','zcode-acp-server','ACP adapter for ZCode'),
('context7','system','Context7','Documentation enrichment and provenance'),
('github','system','GitHub','Repository and change provenance'),
('chatgpt','system','ChatGPT','Conversation-driven design and orchestration'),
('objective_functions','objective','Objective functions','Model integration quality, feasibility, utility and tradeoffs'),
('variables100','dataset','100 variable catalog','Previously reported catalog, data population unverified'),
('repo192','dataset','192 repository census','Previously reported census, current completeness unverified'),
('backlog1000','dataset','1000 provisional work records','Previously reported backlog, not imported into this v0.1'),
('iang_v04','artifact','IANG integrated v0.4','Prior graph and toolkit with crosswalk, TODO and ledger, content reconciliation pending'),
('alignment_queue','component','IAM alignment queue','Signals, evidence and project tasks prioritized for reconciliation and automation'),
]
for id,t,name,purpose in seed:conn.execute('INSERT OR IGNORE INTO nodes(id,node_type,name,purpose,lifecycle) VALUES(?,?,?,?,?)',(id,t,name,purpose,'reported' if False else 'discovered'))
for id,source,target,kind in [('core_iam','core_sqlite','iam','part_of'),('alignment_iam','alignment_queue','iam','part_of'),('uahtoI','iam','uah','integrates_with'),('zcode_open','zcode','opencode','integrates_with'),('bridge_zcode','acp_bridge','zcode_acp','routes_to'),('zacp_z','zcode_acp','zcode','routes_to'),('opc_ccr','opencode','ccr','routes_to'),('z_ccr','zcode','ccr','routes_to'),('c7_hq','context7','software_hq','integrates_with'),('rec_iam','today_reconciliation','iam','part_of')]:conn.execute('INSERT OR IGNORE INTO edges(id,source_id,target_id,edge_type) VALUES (?,?,?,?)',(id,source,target,kind))
for i in ('iam','uah'):conn.execute('INSERT OR IGNORE INTO initiatives(node_id,objective) VALUES (?,?)',(i,'Model-first integration automation' if i=='iam' else 'CLI-first architecture convergence'))
conn.execute("INSERT OR IGNORE INTO milestones(node_id,initiative_id,acceptance_criteria) VALUES ('today_reconciliation','iam','All Oct 15 conversations enumerated, source-linked, imported or flagged as missing')")
for id,title,criteria in [('wi_schema','Implement SQLite v0.1','Schema executes, integrity checks pass'),('wi_harvest','Reconcile Oct 15 conversations','Enumerate conversations and files; evidence coverage ledger'),('wi_merge','Reconcile existing 23-table schema','Diff against existing repo and preserve prior structure'),('wi_vars','Load 100-variable catalog','100 definitions actually loaded and source linked'),('wi_repos','Import 192-repo census','Count and provenance verified'),('wi_backlog','Import 1000 work records','Deduplicated work items with evidence'),('wi_validate','Validate graph compatibility','Nodes/edges queryable from SQLite')]:
 conn.execute('INSERT OR IGNORE INTO nodes(id,node_type,name,purpose) VALUES (?,"work_item",?,?)',(id,title,criteria))
 conn.execute('INSERT OR IGNORE INTO work_items(node_id,initiative_id,acceptance_criteria,status) VALUES (?,?,?,?)',(id,'iam',criteria,'done' if id=='wi_schema' else 'backlog'))
for id,name,kind,reason in [('q_harvest','wi_harvest','coverage','Missing verified comprehensive Oct 15 source inventory'),('q_schema','wi_merge','reconciliation','Prior 23-table schema must be compared'),('q_variables','wi_vars','population','Referenced but unimported variable catalog'),('q_repo','wi_repos','population','Referenced but unimported repository census'),('q_backlog','wi_backlog','population','Referenced but unimported work records')]:
 conn.execute('INSERT OR IGNORE INTO queue_items(id,work_item_id,kind,reason) VALUES (?,?,?,?)',(id,name,kind,reason))
conn.execute('INSERT OR IGNORE INTO coverage(id,scope_node_id,period_start,period_end,scan_state,gap_notes) VALUES (?,?,?,?,?,?)',('oct15','iam','2026-10-15','2026-10-15','partial','Seeded from conversation context; exhaustive transcripts/docs not ingested'))
conn.execute("INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0.1')")
conn.commit()
print('tables',len(conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()))
print('integrity',conn.execute('PRAGMA integrity_check').fetchone(),'foreign_keys',conn.execute('PRAGMA foreign_key_check').fetchall())
print('nodes',conn.execute('select count(*) from nodes').fetchone(),'queue',conn.execute('select count(*) from queue_items').fetchone())
conn.close()