// AION donor corpus integrity audit, read-only and entirely local.
// Hash checks prove copied landing bytes match the recorded capture hashes;
// they DO NOT prove donor runtime functionality or current website behavior.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../../../../../',import.meta.url));
const ledger = new URL('../../../harvest/landing/synthesis/crosswalk-ledger.jsonl',import.meta.url);
const prefix = 'workspace/aion/ops/chrome-relay/harvest/landing/sources/';
const statuses = new Set(['COPIED_EXCERPT','COPIED_MODULE','FLAGGED']);
const idPattern = /^(?:VF-\d{4}|VO-GH-\d{4})$/;
const sha256 = body => createHash('sha256').update(body).digest('hex');

export function auditHarvestLedger(ledgerText, {
  repoRoot=root,readCopy=path=>readFileSync(path)
}={}) {
  const issues=[],counts={COPIED_EXCERPT:0,COPIED_MODULE:0,FLAGGED:0};
  let matching=0,missing=0,mismatched=0,approved=0;
  if(typeof ledgerText!=='string'||ledgerText.length>15_000_000) return {
    schema:'aion.platform.harvest-audit/1',ok:false,code:'INVALID_LEDGER',issues:['invalid_ledger']};
  const lines=ledgerText.split(/\r?\n/).filter(Boolean);
  if(lines.length>5000) return {schema:'aion.platform.harvest-audit/1',ok:false,
    code:'LEDGER_OVER_LIMIT',issues:['too_many_records']};
  const seen=new Set();
  for(let i=0;i<lines.length;i++){
    let item;
    try{item=JSON.parse(lines[i]);}catch{issues.push('line_'+(i+1)+':bad_json');continue}
    if(!item||typeof item!=='object'||Array.isArray(item)
      ||typeof item.id!=='string'||!idPattern.test(item.id)
      ||seen.has(item.id)||!statuses.has(item.capture_status)){
      issues.push('line_'+(i+1)+':invalid_record');continue;
    }
    seen.add(item.id);counts[item.capture_status]++;
    if(item.aion_integration_approved===true)approved++;
    if(item.capture_status==='FLAGGED'){
      if(item.copied_path)issues.push(item.id+':flagged_has_copy');
      continue;
    }
    const rel=item.copied_path;
    if(typeof rel!=='string'||!rel.startsWith(prefix)
      ||rel.split('/').some(p=>!p||p==='.'||p==='..')
      ||typeof item.copy_sha256_reported!=='string'
      ||!/^[0-9a-f]{64}$/.test(item.copy_sha256_reported)){
      issues.push(item.id+':unsafe_or_missing_copy_path_or_hash');continue;
    }
    const absolute=resolve(repoRoot,rel);
    if(!absolute.startsWith(resolve(repoRoot)+sep)){
      issues.push(item.id+':path_escape');continue;
    }
    try {
      const body=readCopy(absolute);
      const hash=sha256(body);
      if(hash===item.copy_sha256_reported)matching++;
      else {mismatched++;issues.push(item.id+':hash_mismatch')}
    }catch{missing++;issues.push(item.id+':copy_unreadable')}
  }
  if(approved)issues.push('donor_candidate_approval_flag_is_not_runtime_authority');
  const copied=counts.COPIED_EXCERPT+counts.COPIED_MODULE;
  const ok=issues.length===0&&copied===matching;
  return {schema:'aion.platform.harvest-audit/1',ok,
    code:ok?'LANDING_HASHES_MATCH':'HARVEST_REVIEW_REQUIRED',
    records:seen.size,counts,copied,flagged:counts.FLAGGED,
    checked_copies:matching+mismatched+missing,matching,missing,mismatched,
    research_approval_flags:approved,live_provider_verification:'NOT_ESTABLISHED',
    execution_authority:false,issues:issues.slice(0,80)};
}

export function auditHarvestLanding() {
  try{return auditHarvestLedger(readFileSync(ledger,'utf8'))}
  catch(error){return {schema:'aion.platform.harvest-audit/1',ok:false,
    code:'HARVEST_LEDGER_UNREADABLE',reason:error?.code??'UNKNOWN',execution_authority:false}}
}
