// AION P3 — the LOCAL ACCOUNT REGISTRATION of the owner.
//
// WHAT THIS FILE IS
//   One owner-private file that records WHICH ChatGPT account this machine's
//   registered lane belongs to, and WHICH lane that is. The registration is
//   local account METADATA: it is not a grant, not an effect, not a Bus
//   mutation and it never contains conversation text.
//
// WHAT IS STORED (and nothing else)
//   { schema: 'aion.account-registration/1',
//     extension_id, lane_id, email, registered_utc }
//
//   - `extension_id` is the PINNED dev extension, verified by the native
//     origin guard. It is NOT on its own an identity: one extension id is
//     installed in several Chrome profiles.
//   - `lane_id` is the worker's own random, persistent lane identity. Two
//     profiles of the same extension have DIFFERENT lanes.
//   - `email` is the account identifier the owner explicitly registered. The
//     local part keeps its case, the domain is lowercased.
//
// WHAT THIS FILE NEVER DOES
//   - it never writes a Bus file, an effects ledger, a grant or a transcript;
//   - it never prints the email, the lane or a token;
//   - it never retries: a partial or failed write leaves NO usable
//     registration, and an explicit re-register is required;
//   - it never invents an account: an address that does not canonicalize is
//     refused before anything is written.
import {existsSync,readFileSync,writeFileSync,renameSync,rmSync,chmodSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {assertPrivateStateDirAsync} from '../security.mjs';
import {canonicalizeEmail} from '../../../extension/src/providers/chatgpt/account-registration.js';

export const REGISTRATION_FILE='account-registration.json';
export const REGISTRATION_SCHEMA='aion.account-registration/1';

export const REGISTRATION_CODES=Object.freeze({
  REGISTRATION_ABSENT:'REGISTRATION_ABSENT',
  REGISTRATION_UNREADABLE:'REGISTRATION_UNREADABLE',
  REGISTRATION_INVALID:'REGISTRATION_INVALID',
  REGISTRATION_INVALID_EMAIL:'REGISTRATION_INVALID_EMAIL',
  REGISTRATION_INVALID_LANE:'REGISTRATION_INVALID_LANE',
  REGISTRATION_INVALID_EXTENSION:'REGISTRATION_INVALID_EXTENSION',
  REGISTRATION_WRITE_FAILED:'REGISTRATION_WRITE_FAILED',
  STATE_ACL_UNVERIFIED:'STATE_ACL_UNVERIFIED',
});

const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.length>0&&v.length<=512;
/** The lane id: a random opaque token, never a role, a path or an email. */
const LANE=/^[A-Za-z0-9_-]{16,128}$/;
const EXTENSION_ID=/^[a-p]{32}$/;

/** The one path of the registration file inside the private state dir. */
export function registrationPath(stateDir){
  return resolve(join(resolve(stateDir),REGISTRATION_FILE));
}

/** The canonical form of an address, or null. Re-exported for one source. */
export {canonicalizeEmail};

/**
 * READ the registration. The private-directory gate runs FIRST, exactly like
 * every other read of the Track B state directory.
 */
export async function readAccountRegistration({stateDir}={}){
  if(typeof stateDir!=='string'||!stateDir)return {ok:false,code:REGISTRATION_CODES.REGISTRATION_ABSENT};
  const file=registrationPath(stateDir);
  try{await assertPrivateStateDirAsync(file);}
  catch{return {ok:false,code:REGISTRATION_CODES.STATE_ACL_UNVERIFIED};}
  if(!existsSync(file))return {ok:false,code:REGISTRATION_CODES.REGISTRATION_ABSENT};
  let parsed;
  try{parsed=JSON.parse(readFileSync(file,'utf8'));}
  catch{return {ok:false,code:REGISTRATION_CODES.REGISTRATION_UNREADABLE};}
  if(!isPlain(parsed))return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID};
  if(parsed.schema!==REGISTRATION_SCHEMA)return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID};
  if(!EXTENSION_ID.test(String(parsed.extension_id??'')))
    return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_EXTENSION};
  if(!LANE.test(String(parsed.lane_id??'')))
    return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_LANE};
  if(canonicalizeEmail(parsed.email)!==parsed.email)
    return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_EMAIL};
  if(!text(parsed.registered_utc))return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID};
  // The projection is EXACTLY the five stored fields: nothing else survives.
  return {
    ok:true,
    registration:{
      schema:REGISTRATION_SCHEMA,
      extension_id:parsed.extension_id,
      lane_id:parsed.lane_id,
      email:parsed.email,
      registered_utc:parsed.registered_utc,
    },
  };
}

/**
 * WRITE the registration, atomically.
 *
 * The temporary file is written first and renamed into place, so a reader
 * never sees a half-written registration. A failure removes the temporary
 * file and leaves NO registration behind: the account is then simply not
 * registered and an explicit re-register is required.
 */
export async function writeAccountRegistration({
  stateDir,extension_id,lane_id,email,registered_utc=new Date().toISOString(),
}={}){
  if(typeof stateDir!=='string'||!stateDir)return {ok:false,code:REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};
  if(!EXTENSION_ID.test(String(extension_id??'')))
    return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_EXTENSION};
  if(!LANE.test(String(lane_id??'')))return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_LANE};
  const canonical=canonicalizeEmail(email);
  if(!canonical)return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_EMAIL};
  if(!text(registered_utc))return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID};

  const file=registrationPath(stateDir);
  try{await assertPrivateStateDirAsync(file);}
  catch{return {ok:false,code:REGISTRATION_CODES.STATE_ACL_UNVERIFIED};}

  const record={
    schema:REGISTRATION_SCHEMA,
    extension_id:String(extension_id),
    lane_id:String(lane_id),
    email:canonical,
    registered_utc:String(registered_utc),
  };
  const tmp=`${file}.${process.pid}.tmp`;
  try{
    writeFileSync(tmp,JSON.stringify(record),{mode:0o600});
    try{chmodSync(tmp,0o600);}catch{}
    renameSync(tmp,file);
  }catch{
    try{rmSync(tmp,{force:true});}catch{}
    return {ok:false,code:REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};
  }
  return {ok:true,registration:record};
}
