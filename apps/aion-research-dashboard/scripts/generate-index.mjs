// AION RESEARCH: deterministic, evidence-gated projection into a dashboard view.
// Authoritative analysis lives in Role 09 FRONTIER-STATUS.json and linked source docs.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,"../../..");
const app=path.resolve(here,"..");
const role="workspace/aion/sessions/roles/09-global-research";
const sourcePath=path.join(repo,role,"FRONTIER-STATUS.json");
const outPath=path.join(app,"research-index.json");
const snapshots=path.join(app,"snapshots");
const urlBase="https://github.com/owenservera/aion";
const statuses=new Set(["ACTIVE","WATCH","PILOT","EVALUATE","SHORTLIST","DEFER","REJECT"]);
const stages=["DISCOVERED","EVIDENCE_REVIEWED","SYNTHESIZED","ROUTED","ACKNOWLEDGED","APPLIED","VERIFIED"];
const sha=s=>createHash("sha256").update(s).digest("hex");
function ok(test,message){if(!test)throw new Error("Invalid research evidence: "+message)}
function date(s,where){ok(typeof s==="string"&&/^\d{4}-\d\d-\d\d$/.test(s)&&!Number.isNaN(Date.parse(s)),where+" invalid YYYY-MM-DD");ok(s<=new Date().toISOString().slice(0,10),where+" is in future");return s}
function https(s,where){try{const u=new URL(s);ok(u.protocol==="https:",where+" must be HTTPS");return u.href}catch{throw new Error(where+" must be an absolute HTTPS URL")}}
function local(p,where){ok(typeof p==="string"&&p.length>0&&!p.startsWith("/")&&!p.includes("\\")&&!p.split("/").includes(".."),where+" must be a safe repo-relative path");const full=path.resolve(repo,p);ok(full.startsWith(repo+path.sep),where+" escapes repository");ok(fs.existsSync(full)&&fs.statSync(full).isFile(),where+" does not exist: "+p);return{path:p,sha256:sha(fs.readFileSync(full))}}
const doc=JSON.parse(fs.readFileSync(sourcePath,"utf8"));
ok(doc.schema_version===1,"source schema_version must equal 1");
ok(Array.isArray(doc.frontiers)&&doc.frontiers.length>0,"frontiers must be populated");
https(doc.canonical_issue,"canonical_issue");
const seen=new Set();
const frontiers=doc.frontiers.map(f=>{
ok(typeof f.id==="string"&&/^[a-z][a-z0-9-]{1,30}$/.test(f.id),"invalid frontier id");ok(!seen.has(f.id),"duplicate id "+f.id);seen.add(f.id);
for(const field of ["name","summary","why","risk","next","recipient","icon"]){ok(typeof f[field]==="string"&&f[field].trim().length>0,field+" missing for "+f.id)}
ok(statuses.has(f.status),"unknown status "+f.id);ok(stages.includes(f.stage),"unknown stage "+f.id);ok(["HIGH","MEDIUM","LOW","UNKNOWN"].includes(f.confidence),"confidence missing "+f.id);
date(f.reviewed_at,f.id+" reviewed_at");date(f.status_updated_at,f.id+" status_updated_at");
ok(f.status_updated_at<=f.reviewed_at,"status updated after last review "+f.id);
https(f.primary_url,f.id+" primary_url");
ok(Array.isArray(f.evidence)&&f.evidence.length>0,f.id+" requires source-linked evidence");
const evidence=f.evidence.map((e,i)=>{
https(e.url,f.id+" evidence "+i);date(e.observed_at,f.id+" evidence "+i);
ok(e.observed_at<=f.reviewed_at,f.id+" has future-to-review evidence");
ok(typeof e.kind==="string"&&/^[A-Z_]+$/.test(e.kind),f.id+" evidence kind missing");
ok(typeof e.claim==="string"&&e.claim.length>=10,f.id+" evidence claim missing");
const file=e.source_file?local(e.source_file,f.id+" evidence "+i):null;
return {url:e.url,kind:e.kind,observed_at:e.observed_at,claim:e.claim,source_file:file?.path||null,source_sha256:file?.sha256||null};
});
if(["ACKNOWLEDGED","APPLIED","VERIFIED"].includes(f.stage)){ok(evidence.some(e=>e.kind==="INDEPENDENT_RECEIPT"||e.kind==="INDEPENDENT_TEST"),f.id+" higher stage requires independent receipt/test");}
let folder=null;if(f.folder){ok(typeof f.folder==="string"&&!f.folder.includes(".."),f.id+" unsafe folder");const readme=local(f.folder+"/README.md",f.id+" folder README");folder={path:f.folder,url:urlBase+"/tree/main/"+f.folder,readme_sha256:readme.sha256}}
return {id:f.id,name:f.name,icon:f.icon,status:f.status,stage:f.stage,confidence:f.confidence,summary:f.summary,why:f.why,risk:f.risk,next:f.next,recipient:f.recipient,reviewed_at:f.reviewed_at,status_updated_at:f.status_updated_at,primary_url:f.primary_url,folder,evidence,evidence_count:evidence.length};
});
const content={schema_version:1,authority:doc.authority,source_url:urlBase+"/blob/main/"+role+"/FRONTIER-STATUS.json",canonical_issue:doc.canonical_issue,assessed_through:frontiers.reduce((m,x)=>m>x.reviewed_at?m:x.reviewed_at,"0000-00-00"),frontiers,totals:{frontiers:frontiers.length,watch:frontiers.filter(f=>f.status==="WATCH").length,active:frontiers.filter(f=>["ACTIVE","EVALUATE","SHORTLIST","PILOT"].includes(f.status)).length,archived_evidence:frontiers.filter(f=>f.evidence.some(e=>e.source_sha256)).length}};
const revision=sha(JSON.stringify(content)).slice(0,16);
const existing=fs.existsSync(outPath)?JSON.parse(fs.readFileSync(outPath,"utf8")):null;
const snapshot={...content,revision,generated_at:existing?.revision===revision?existing.generated_at:new Date().toISOString()};
if(process.argv.includes("--check")){ok(existing?.revision===revision,"generated index out of sync with evidence; run node scripts/generate-index.mjs");console.log("PASS verified research index",revision);process.exit(0)}
if(existing?.revision!==revision){fs.writeFileSync(outPath,JSON.stringify(snapshot,null,2)+"\n");fs.mkdirSync(snapshots,{recursive:true});const snap=path.join(snapshots,revision+".json");if(!fs.existsSync(snap))fs.writeFileSync(snap,JSON.stringify(snapshot,null,2)+"\n");console.log("Updated evidence index",revision,"and immutable snapshot");}
else console.log("No material changes",revision);
