import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import path from "node:path";import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const app=path.join(root,"apps/aion-research-dashboard");
const idx=JSON.parse(fs.readFileSync(path.join(app,"research-index.json"),"utf8"));
const source=JSON.parse(fs.readFileSync(path.join(root,"workspace/aion/sessions/roles/09-global-research/FRONTIER-STATUS.json"),"utf8"));
test("semantic status comes exclusively from research-owned source",()=>{
 assert.equal(idx.schema_version,1);
 assert.equal(idx.frontiers.length,source.frontiers.length);
 for(const f of idx.frontiers){const s=source.frontiers.find(x=>x.id===f.id);assert.ok(s,"unknown frontier "+f.id);assert.equal(f.status,s.status);assert.equal(f.stage,s.stage);assert.equal(f.reviewed_at,s.reviewed_at);assert.equal(f.status_updated_at,s.status_updated_at);assert.equal(f.evidence_count,s.evidence.length);}
});
test("every status contains validated cited evidence",()=>{
 for(const f of idx.frontiers){
  assert.ok(f.evidence.length>0);
  for(const e of f.evidence){assert.ok(e.url.startsWith("https://"));assert.ok(e.claim.length>=10);if(e.source_file)assert.ok(fs.existsSync(path.join(root,e.source_file)));}
  assert.ok(!["ACKNOWLEDGED","APPLIED","VERIFIED"].includes(f.stage)||f.evidence.some(e=>["INDEPENDENT_TEST","INDEPENDENT_RECEIPT"].includes(e.kind)));
 }
});
test("snapshot matches current version; no fake monitored-run claims",()=>{
 assert.match(idx.revision,/^[a-f0-9]{16}$/);
 const snap=path.join(app,"snapshots",idx.revision+".json");
 assert.ok(fs.existsSync(snap));assert.deepEqual(JSON.parse(fs.readFileSync(snap,"utf8")),idx);
 assert.ok(idx.frontiers.every(f=>f.reviewed_at<=new Date().toISOString().slice(0,10)));
 assert.ok(!JSON.stringify(idx).includes("All systems operational"));
});
