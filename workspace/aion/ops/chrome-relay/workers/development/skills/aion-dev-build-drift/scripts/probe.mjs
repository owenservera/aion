#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

// AION setup.mjs copies these files into an unpacked Track B dev extension.
// No manifest/key/config/account/transcript files are ever read or returned.
export const PAIRS = Object.freeze([
  ['workspace/aion/ops/chrome-relay/velocity/extension-dev/dev-link.js', 'src/dev/dev-link.js'],
  ['workspace/aion/ops/chrome-relay/velocity/extension-dev/dev-worker.js', 'src/dev/dev-worker.js'],
  ['workspace/aion/ops/chrome-relay/velocity/extension-dev/receive-router.js', 'src/dev/receive-router.js'],
  ['workspace/aion/ops/chrome-relay/extension/src/chatgpt/receive.js', 'src/chatgpt/receive.js'],
  ['workspace/aion/ops/chrome-relay/extension/src/providers/chatgpt/account-registration.js', 'src/providers/chatgpt/account-registration.js'],
  ['workspace/aion/ops/chrome-relay/extension/src/lib/conversation-contract.js', 'src/lib/conversation-contract.js'],
]);

function digest(file) {
  try {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) return {error:'SYMLINK_REFUSED'};
    if (!stat.isFile()) return {error:'NOT_REGULAR_FILE'};
    if (stat.size > 1024 * 1024) return {error:'FILE_TOO_LARGE'};
    return {hash:createHash('sha256').update(readFileSync(file)).digest('hex')};
  } catch (e) {
    return {error:e?.code === 'ENOENT' ? 'FILE_MISSING' : 'UNREADABLE'};
  }
}
export function probe({repoRoot, extensionDir}) {
  if (!repoRoot || !extensionDir) throw new TypeError('repoRoot and extensionDir are required');
  const rows = PAIRS.map(([source, built]) => {
    const a=digest(join(resolve(repoRoot),source));
    const b=digest(join(resolve(extensionDir),built));
    const status = a.error ? 'SOURCE_'+a.error : b.error ? 'BUILT_'+b.error : a.hash===b.hash ? 'MATCH' : 'DRIFT';
    return {source,built,status,...(status==='DRIFT'?{source_sha256:a.hash,built_sha256:b.hash}:{})};
  });
  return {schema:'aion.dev.build-drift/1',scope:'disk-files-only',loaded_in_chrome:'UNVERIFIED',native_host_running_revision:'UNVERIFIED',status:rows.every(r=>r.status==='MATCH')?'MATCH':rows.some(r=>r.status!=='DRIFT'&&r.status!=='MATCH')?'INCOMPLETE':'DRIFT',files:rows};
}
function runCli(argv) {
  if(argv.includes('--help')) {
    process.stdout.write('Usage: node probe.mjs [--repo-root <AION root>] (--extension-dir <unpacked Track B dir> | --setup-receipt <AION setup-receipt.json>)\nRead-only: compares six source/copied JS files; never proves running Chrome/host revision.\n');
    return 0;
  }
  const args = {};
  for(let i=0;i<argv.length;i+=2){
    if(!['--repo-root','--extension-dir','--setup-receipt'].includes(argv[i]) || !argv[i+1] || argv[i+1].startsWith('--')){
      process.stderr.write('INVALID_ARGUMENTS\n');return 2;
    }
    args[argv[i].slice(2)] = argv[i+1];
  }
  if(Boolean(args['extension-dir'])===Boolean(args['setup-receipt'])){
    process.stderr.write('PROVIDE_EXACTLY_ONE_EXTENSION_SOURCE\n');return 2;
  }
  let extensionDir=args['extension-dir'];
  if(args['setup-receipt']){
    try{
      const receipt=JSON.parse(readFileSync(resolve(args['setup-receipt']),'utf8'));
      if(receipt?.schema!=='aion.b.setup-receipt/1'||typeof receipt.extension_dir!=='string'||!receipt.extension_dir) throw new Error('bad receipt');
      extensionDir=receipt.extension_dir;
    }catch{process.stderr.write('SETUP_RECEIPT_UNVERIFIED\n');return 2;}
  }
  const result=probe({repoRoot:args['repo-root']??process.cwd(),extensionDir});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result.status==='MATCH'?0:1;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) process.exitCode=runCli(process.argv.slice(2));
