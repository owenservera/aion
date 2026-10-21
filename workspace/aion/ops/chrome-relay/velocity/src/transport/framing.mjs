// B-only local IPC framing: 4-byte LE byte count + UTF-8 JSON.
// This is NOT Chrome Native Messaging, which the existing bridge already handles.
// Incompatible and oversized frames are fatal to the peer connection.
export const FRAME_LIMIT = 256 * 1024;
// The READ-ONLY conversation plane carries a bounded canonical snapshot
// (P1: <= RECEIVE_LIMITS.messages entries, each <= RECEIVE_LIMITS.textChars).
// 1 MiB is the SAME ceiling the Chrome native-messaging plane already uses
// (bridge CHROME_MAX_HOST_MESSAGE_BYTES), so anything that can cross the
// native pipe can cross the local pipe. It is a hard bound, not a hint.
export const RECEIVE_FRAME_LIMIT = 1024 * 1024;
export class FrameError extends Error {
  constructor(code){super(code);this.code=code;}
}
export function encodeFrame(value,{limit=FRAME_LIMIT}={}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new FrameError('BAD_OBJECT');
  const payload=Buffer.from(JSON.stringify(value),'utf8');
  if (!payload.length || payload.length>limit) throw new FrameError('FRAME_TOO_LARGE');
  const header=Buffer.allocUnsafe(4);header.writeUInt32LE(payload.length,0);
  return Buffer.concat([header,payload]);
}
export function createFrameDecoder({limit=FRAME_LIMIT,onMessage}={}) {
  if (typeof onMessage!=='function' || !Number.isSafeInteger(limit) || limit<16 || limit>RECEIVE_FRAME_LIMIT)
    throw new TypeError('invalid frame decoder');
  let header=Buffer.alloc(4), headerUsed=0, expected=null, payload=null, payloadUsed=0, failed=false;
  function push(bytes) {
    if (failed) throw new FrameError('DECODER_CLOSED');
    if (!Buffer.isBuffer(bytes)) throw new TypeError('expected Buffer');
    let cursor=0;
    try {
      while(cursor<bytes.length){
        if(expected===null){
          const take=Math.min(4-headerUsed,bytes.length-cursor);
          bytes.copy(header,headerUsed,cursor,cursor+take);
          headerUsed+=take;cursor+=take;
          if(headerUsed===4){
            expected=header.readUInt32LE(0);
            if(expected===0 || expected>limit) throw new FrameError('FRAME_TOO_LARGE');
            payload=Buffer.allocUnsafe(expected);payloadUsed=0;
          }
        }else{
          const take=Math.min(expected-payloadUsed,bytes.length-cursor);
          bytes.copy(payload,payloadUsed,cursor,cursor+take);
          payloadUsed+=take;cursor+=take;
          if(payloadUsed===expected){
            let data;
            try{data=JSON.parse(payload.toString('utf8'));}catch{throw new FrameError('BAD_JSON');}
            if(!data || typeof data!=='object' || Array.isArray(data)) throw new FrameError('BAD_OBJECT');
            expected=null;payload=null;payloadUsed=0;headerUsed=0;
            onMessage(data);
          }
        }
      }
    }catch(error){failed=true;payload=null;throw error;}
  }
  return Object.freeze({push,get pending(){return expected!==null || headerUsed>0;},get failed(){return failed;}});
}
