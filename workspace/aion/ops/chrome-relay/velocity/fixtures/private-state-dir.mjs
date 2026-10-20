// Owner-private TEMP fixtures for the Track B test suite.
//
// Production code (src/security.mjs) REFUSES a state directory whose ACL is
// not owner-private: POSIX needs mode 0700, Windows needs a DACL that grants
// nobody except the current user, SYSTEM and Administrators.
//
// A directory created with mkdtemp() under %TEMP% inherits the parent DACL.
// On Windows that inherited DACL contains foreign principals (other local
// users, "Users", application-package SIDs, ...), so the production check
// rejects it even though the test asked for 0700. chmod() is a no-op for DACLs
// on Windows, so the fixture has to provision a NATIVE owner-private ACL.
//
// This helper changes NOTHING in production: it only creates the fixture
// directory the tests use. The check that runs afterwards is still the
// production one (src/security.mjs is never stubbed, relaxed or bypassed).
import {mkdtempSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// The exact principal set src/security.mjs accepts on Windows.
const SYSTEM_SID='S-1-5-18';                 // NT AUTHORITY\SYSTEM
const ADMINISTRATORS_SID='S-1-5-32-544';     // BUILTIN\Administrators

// Every fixture subprocess is BOUNDED: on a saturated Windows host a child
// start can take many seconds, and an unbounded spawnSync would hang the
// whole suite instead of failing with evidence.
const FIXTURE_TIMEOUT_MS=30_000;

/**
 * Run one fixture subprocess and classify the outcome.
 * A TIMEOUT is host saturation; it is NOT an ACL denial and is reported as
 * such. The raw r.status / r.error / r.stderr are always kept so a failure
 * can be told apart from a refusal.
 */
function runTool(program,args,{timeoutMs=FIXTURE_TIMEOUT_MS}={}){
  const started=Date.now();
  const r=spawnSync(program,args,{encoding:'utf8',timeout:timeoutMs,windowsHide:true,shell:false});
  const elapsed=Date.now()-started;
  const evidence=`status=${r.status} error=${r.error?r.error.code:'-'} elapsed=${elapsed}ms stderr=${JSON.stringify((r.stderr??'').trim())}`;
  if(r.error?.code==='ETIMEDOUT')
    throw new Error(`${program} timed out after ${timeoutMs}ms (${evidence}) - host saturation, NOT an ACL denial`);
  if(r.error||r.status!==0)
    throw new Error(`${program} failed (${evidence})`);
  return r.stdout??'';
}

let cachedUserSid=null;
/** SID of the account this process actually runs as (never a guess). */
export function currentUserSid(){
  if(cachedUserSid)return cachedUserSid;
  const out=runTool('whoami.exe',['/user','/fo','csv','/nh']);
  const m=out.match(/S-1-5-21(?:-\d+)+/);
  if(!m)throw new Error('whoami returned no user SID');
  cachedUserSid=m[0];
  return cachedUserSid;
}

/**
 * Replace the directory DACL with a native owner-private one:
 * inherited ACEs are removed and access is granted ONLY to the current user,
 * SYSTEM and Administrators - the same set the production check allows.
 * One icacls invocation, so the fixture adds as little process load as
 * possible to an already busy Windows test host.
 */
export function makeWindowsPrivate(dir){
  const sid=currentUserSid();
  runTool('icacls.exe',[dir,'/inheritance:r','/grant:r',
    `*${sid}:(OI)(CI)F`,`*${SYSTEM_SID}:(OI)(CI)F`,`*${ADMINISTRATORS_SID}:(OI)(CI)F`]);
  if(process.env.AION_FIXTURE_VERIFY_ACL==='1')assertPrivateAclListing(dir);
  return dir;
}

/**
 * Optional, pwsh-free proof that the DACL really is owner-private.
 * Off by default (one extra process per fixture); enable with
 * AION_FIXTURE_VERIFY_ACL=1 when the ACL itself is in question.
 */
export function assertPrivateAclListing(dir){
  const out=runTool('icacls.exe',[dir]);
  const aces=out.split(/\r?\n/).map(s=>s.trim()).filter(l=>/:\(/.test(l));
  if(aces.length!==3)
    throw new Error(`${dir} has ${aces.length} ACEs, expected 3: ${aces.join(' | ')}`);
  if(aces.some(l=>l.includes('(I)')))
    throw new Error(`${dir} still carries an inherited ACE: ${aces.join(' | ')}`);
  return aces;
}

/**
 * One relaxed, throw-away pwsh start per test process.
 *
 * The production ACL check (src/security.mjs) starts pwsh and gives it a
 * bounded budget. On a busy Windows host the FIRST pwsh start of a session is
 * much slower than the following ones (cold image / scanner), and a cold
 * start can eat the whole budget and fail the check closed with
 * STATE_ACL_UNVERIFIED even though the directory really is owner-private.
 * This warm-up only makes the OS/AV cache hot; it decides nothing and is
 * never used to accept a directory (the production check still runs,
 * unchanged, for every call).
 */
let warmed=false;
function warmPwsh(){
  if(warmed)return;
  warmed=true;
  try{
    spawnSync('pwsh',['-NoProfile','-NonInteractive','-Command','exit 0'],
      {encoding:'utf8',timeout:30000,windowsHide:true,shell:false});
  }catch{}
}

/**
 * Create a TEMP directory that the production private-state check accepts.
 * POSIX: mode 0700. Windows: native owner-private DACL.
 */
export function privateStateDir(prefix='aion-private-',{platform=process.platform}={}){
  const dir=mkdtempSync(join(tmpdir(),prefix));
  if(platform==='win32'){
    warmPwsh();
    makeWindowsPrivate(dir);
  }else chmodSync(dir,0o700);
  return dir;
}
