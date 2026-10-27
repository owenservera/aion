"use strict";
const BASE="https://github.com/owenservera/aion";
const INDEX_PATH="apps/aion-research-dashboard/research-index.json";
const SNAPSHOTS=BASE+"/tree/main/apps/aion-research-dashboard/snapshots";
let rows=[],filter="All",query="",selected=null,tab="Overview",index=null,readSource="not checked",lastChecked=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:null}catch{return null}};
const link=(url,label)=>safeUrl(url)?'<a href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':"";
const nice=s=>String(s).toLowerCase().replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const badge=s=>["WATCH","ACTIVE","PILOT","EVALUATE","SHORTLIST"].includes(s)?s.toLowerCase():"";
const $=id=>document.getElementById(id);
function field(label,value){return '<div class="field"><b>'+esc(label)+'</b><div>'+esc(value)+'</div></div>'}
function totals(){
 $("nFrontiers").textContent=index?.totals?.frontiers??"—";
 $("nActive").textContent=index?.totals?.active??"—";
 $("nWatch").textContent=index?.totals?.watch??"—";
 $("nFolders").textContent=index?.totals?.archived_evidence??"—";
 $("nSource").textContent=index?"Loaded":"Unavailable";
 $("nFresh").textContent=index?.assessed_through||"Unknown";
 const card=$("nFresh").parentElement.querySelector("span");if(card)card.textContent="Last evidence review";
}
function renderList(){
 const filters=["All","ACTIVE","PILOT","WATCH","EVALUATE","SHORTLIST"];
 $("filters").innerHTML=filters.map(x=>'<button class="chip '+(x===filter?"on":"")+'" data-filter="'+x+'">'+esc(nice(x))+'</button>').join("");
 document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;renderList()}));
 const matched=rows.filter(f=>(filter==="All"||f.status===filter)&&[f.name,f.summary,f.risk,f.next].join(" ").toLowerCase().includes(query.toLowerCase()));
 $("list").innerHTML=matched.map(f=>'<button class="frontier '+(f.id===selected?"selected":"")+'" data-id="'+esc(f.id)+'"><span class="namecell"><span class="icon">'+esc(f.icon)+'</span><span><b>'+esc(f.name)+'</b><small>'+esc(f.summary)+'</small></span></span><span><span class="pill '+badge(f.status)+'">'+nice(f.status)+'</span></span><span class="evidence"><b>'+esc(f.evidence_count)+' cited source(s)</b><small>'+esc(nice(f.stage))+' · '+esc(f.confidence)+' confidence</small></span><span class="next"><b>'+esc(f.next)+'</b><small>Reviewed '+esc(f.reviewed_at)+'</small></span></button>').join("")||'<div class="empty">'+(index?"No matching research.":"Evidence index unavailable. Retry refresh; no inferred status is shown.")+'</div>';
 document.querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.id;tab="Overview";renderList();renderDetail()}));
}
function renderDetail(){
 const f=rows.find(x=>x.id===selected);if(!f){$("detail").innerHTML='<p class="muted">Select a research area after the evidence index loads.</p>';return}
 const evidence=f.evidence||[];
 $("detail").innerHTML='<div class="top"><span class="icon">'+esc(f.icon)+'</span><div><h2>'+esc(f.name)+'</h2><span class="muted">Reviewed '+esc(f.reviewed_at)+'</span></div><span class="pill '+badge(f.status)+'">'+nice(f.status)+'</span></div><div class="tabs">'+["Overview","Evidence","History","Decision"].map(t=>'<button data-tab="'+t+'" class="tab '+(tab===t?"current":"")+'">'+t+'</button>').join("")+'</div><div id="tabbody"></div><div class="links">'+(f.folder?link(f.folder.url,"Open research folder"):"")+link(f.primary_url,"Primary source")+link(index?.source_url,"Research-owned status")+'</div>';
 document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;renderDetail()}));
 let body="";
 if(tab==="Overview")body='<div class="subnote">'+esc(f.summary)+'</div>'+field("Why it matters",f.why)+field("Evidence level",f.confidence+" (research assessment)")+field("Verified stage",nice(f.stage))+field("Risk / uncertainty",f.risk)+field("Next step",f.next)+field("Recipient",f.recipient);
 if(tab==="Evidence")body='<div class="subnote">Evidence is cited, not equivalent to independent runtime testing.</div>'+evidence.map((e,i)=>'<div class="log"><b>'+esc(e.kind)+' · '+esc(e.observed_at)+'</b><p>'+esc(e.claim)+'</p><p>'+link(e.url,"Source "+(i+1))+'</p>'+(e.source_sha256?'<small>Verified repository source fingerprint: '+esc(e.source_sha256.slice(0,12))+'</small>':"")+'</div>').join("");
 if(tab==="History")body='<div class="subnote">This view uses versioned research snapshots; it does not invent a timeline of actions.</div>'+field("Snapshot revision",index.revision)+field("Index generated",index.generated_at)+field("Status last changed",f.status_updated_at)+field("Last research review",f.reviewed_at)+'<div class="links">'+link(SNAPSHOTS,"Historical snapshots")+link(SNAPSHOTS+"/"+index.revision+".json","Current immutable snapshot")+'</div>';
 if(tab==="Decision")body='<div class="subnote">Disposition: '+esc(nice(f.status))+'. Decisions are not approvals to install, spend or alter other projects.</div>'+field("Acceptance evidence",f.next)+field("Risk",f.risk)+field("Owner",f.recipient)+'<p>'+link(index.canonical_issue,"Review in issue #30")+'</p>';
 $("tabbody").innerHTML=body;
}
function renderBottom(){
 if(!index)return;
 const sorted=[...rows].sort((a,b)=>b.reviewed_at.localeCompare(a.reviewed_at));
 $("deliveries").innerHTML=sorted.slice(0,4).map(f=>'<div class="log"><b>'+esc(f.reviewed_at)+'</b> · '+esc(f.name)+'<br><span class="muted">Reviewed · '+esc(nice(f.stage))+'</span></div>').join("");
 $("pipeline").innerHTML=rows.map(f=>'<div class="log"><span class="pill '+badge(f.status)+'">'+esc(nice(f.stage))+'</span> '+esc(f.name)+'</div>').join("");
 $("lastIssue").innerHTML='Research intake: '+link(index.canonical_issue,"Issue #30")+'<p class="muted">Snapshot '+esc(index.revision)+' · generated '+esc(index.generated_at)+'</p>';
}
function readIndexDoc(doc){
 if(doc.schema_version!==1||!Array.isArray(doc.frontiers)||!doc.revision||!doc.totals||doc.frontiers.some(f=>!f.id||!f.name||!f.status||!Array.isArray(f.evidence)))throw new Error("Invalid generated research-index schema");
 return doc;
}
async function refresh(){
 const b=$("sync");b.disabled=true;b.textContent="↻ Refreshing index…";
 const sources=[
 "./research-index.json?t="+Date.now(),
 "https://raw.githubusercontent.com/owenservera/aion/main/"+INDEX_PATH+"?t="+Date.now()
 ];
 let err="unavailable",loaded=null;
 for(let i=0;i<sources.length;i++){
  try{const response=await fetch(sources[i],{cache:"no-store",signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error("HTTP "+response.status);loaded=readIndexDoc(await response.json());readSource=i?"GitHub published index fallback":"Vercel validated build";break}
  catch(e){err=String(e.message||e)}
 }
 if(loaded){index=loaded;rows=index.frontiers;if(!rows.some(f=>f.id===selected))selected=rows[0]?.id||null;lastChecked=new Date();const msg="Index "+index.revision+" · "+readSource+" · checked "+lastChecked.toLocaleTimeString()+" · research assessed through "+index.assessed_through;$("sourceStatus").innerHTML='<span class="dot"></span> '+esc(msg)}
 else{$("sourceStatus").textContent="Index refresh failed ("+err+"). "+(index?"Showing last loaded revision "+index.revision:"No unverified status substituted.");}
 b.disabled=false;b.textContent="↻ Refresh GitHub";totals();renderList();renderDetail();renderBottom();
}
$("search").addEventListener("input",e=>{query=e.target.value;renderList()});
$("sync").addEventListener("click",refresh);
renderList();renderDetail();refresh();
setInterval(refresh,300000);
