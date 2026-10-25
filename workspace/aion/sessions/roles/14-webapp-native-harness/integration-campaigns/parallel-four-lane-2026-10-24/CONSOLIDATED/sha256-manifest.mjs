// Run from this bundle directory on Node >=22 to emit an independently computed SHA256 receipt.
import { readdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=[];async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await scan(p);else if(e.isFile())files.push(p);}}
await scan('lanes');for(const f of ['integration-gates.mjs','integration-gates.test.mjs','SOURCE-LEDGER.json','README.md','ZAI-INTEGRATION.md','package.json'])files.push(f);
const rows=[];for(const f of files.sort()){const b=await readFile(f);rows.push({path:f,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile('SHA256-MANIFEST.json',JSON.stringify({schema:'aion.bundle-sha256/1',records:rows},null,2)+'\n');
console.log('SHA256 records:',rows.length,'(recompute/commit from verified checkout)');
