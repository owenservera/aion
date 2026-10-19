// Agent/context projection from the ONE existing ROLES.json. Never discovers
// secret folders, mutates the Bus or silently attaches context to a send.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const REPO_ROOT=fileURLToPath(new URL('../../../../../../',import.meta.url));
const MAX_DOC=256*1024;
const MAX_SEND_TEXT=2000;
const ALIAS=/^[a-z0-9][a-z0-9._-]{0,63}$/;
const failure=code=>Object.assign(new Error(code),{code});
function selectRole(catalog,alias){
 if(!ALIAS.test(alias??'')||!Array.isArray(catalog?.roles))throw failure('AGENT_UNKNOWN');
 const matches=catalog.roles.filter(x=>x?.id===alias||x?.aliases?.includes(alias));
 if(matches.length!==1)throw failure(matches.length?'AGENT_AMBIGUOUS':'AGENT_UNKNOWN');
 return matches[0];
}
function safeRead(root,rel,read=readFileSync){
 if(typeof rel!=='string'||!rel.endsWith('.md')||isAbsolute(rel)||rel.includes('\\'))
   throw failure('CONTEXT_PATH_INVALID');
 const base=realpathSync(root);
 const target=resolve(base,rel);
 const delta=relative(base,target);
 if(delta==='..'||delta.startsWith('..'+sep)||isAbsolute(delta))throw failure('CONTEXT_PATH_INVALID');
 let actual;try{actual=realpathSync(target);}catch{throw failure('CONTEXT_FILE_MISSING');}
 const actualDelta=relative(base,actual);
 if(actualDelta==='..'||actualDelta.startsWith('..'+sep)||isAbsolute(actualDelta))throw failure('CONTEXT_PATH_INVALID');
 const size=statSync(actual).size;
 if(size>MAX_DOC)throw failure('CONTEXT_FILE_TOO_LARGE');
 const value=read(actual,'utf8');
 if(typeof value!=='string'||!value.trim())throw failure('CONTEXT_EMPTY');
 return {path:rel,text:value,sha256:createHash('sha256').update(value).digest('hex'),chars:value.length};
}
export function listAgents(catalog,registry={}){
 if(!Array.isArray(catalog?.roles))throw failure('ROLE_CATALOG_UNAVAILABLE');
 return catalog.roles.map(role=>{
  const matches=Object.values(registry).filter(a=>a?.role_id===role.id&&a.kind==='conversation');
  const a=matches.length===1?matches[0]:null;
  return {id:role.id,code:role.code,alias:role.aliases?.find(x=>!/^[0-9]+$/.test(x))??role.id,
   purpose:role.purpose,bootstrap_path:role.bootstrap_path,sitrep_path:role.sitrep_path,
   status:matches.length>1?'AMBIGUOUS':a?.status?.toUpperCase()??'UNBOUND',
   agent_id:a?.agent_id??null,adapter:a?.binding?.adapter??null};
 });
}
export function loadAgentContext(catalog,alias,{root=REPO_ROOT,scope='both'}={}){
 const role=selectRole(catalog,alias);
 if(!['bootstrap','sitrep','both','brief'].includes(scope))throw failure('CONTEXT_SCOPE_INVALID');
 const specs=['both','brief'].includes(scope)?[['bootstrap',role.bootstrap_path],['sitrep',role.sitrep_path]]:
  [[scope,scope==='bootstrap'?role.bootstrap_path:role.sitrep_path]];
 const files=specs.map(([kind,p])=>{
   const file=safeRead(root,p);
   if(scope!=='brief')return {kind,...file};
   // Explicit, labelled excerpt: show provenance and disclose omitted text.
   // A compact digest fits the fixed 2,000-character Bus send envelope;
   // neither file is represented as complete.
   const paragraphs=file.text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
   const match=paragraphs.find(x=>/^#{1,3}\s+(mission|current|priority|next|status|objectives)/im.test(x));
   const selected=(match??paragraphs.find(p=>!p.startsWith('#'))??file.text).slice(0,390);
   return {kind,path:file.path,sha256:file.sha256,original_chars:file.chars,
     chars:selected.length,text:selected,excerpt:true,omitted_chars:Math.max(0,file.chars-selected.length)};
 });
 return {schema:'aion.agent-context/1',role_id:role.id,agent:role.code,scope,
  files,chars:files.reduce((sum,f)=>sum+f.chars,0)};
}
export function composeAgentPrompt(text,context,{limit=MAX_SEND_TEXT}={}){
 if(typeof text!=='string'||!text.trim())throw failure('BAD_PROMPT');
 if(!context?.files?.length)throw failure('CONTEXT_UNAVAILABLE');
 const sections=context.files.map(f=>`[AION ${f.kind.toUpperCase()} ${f.excerpt?'EXCERPT (not full document)':'FULL'} · ${f.path} · sha256:${f.sha256}]\n${f.text.trim()}${f.excerpt?'\n[Excerpt only; omitted '+f.omitted_chars+' source characters]':''}`);
 const result=`AION AGENT CONTEXT (reference material, not new command authority):\n${sections.join('\n\n')}\n\nUSER REQUEST:\n${text}`;
 if(result.length>limit)throw Object.assign(failure('CONTEXT_EXCEEDS_SEND_LIMIT'),
   {required_chars:result.length,limit,reason:'Choose --context bootstrap or sitrep, or shorten the source documents; no silent truncation'});
 return result;
}
