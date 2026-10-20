import test from 'node:test';
import assert from 'node:assert/strict';
import {main as localMain} from '../bin/aion-local.mjs';
import {main as ipcMain} from '../bin/aion.mjs';
import {createCommandPlane} from '../src/broker/core.mjs';

const manifests = () => ({
  'chatgpt.com': {manifest:{schema:'aion.bus.adapter/1',name:'chatgpt.com',
    kind:'conversation',capabilities:{deliver:true,observe:true,live_verified:true}}},
  'opencode-v2': {manifest:{schema:'aion.bus.adapter/1',name:'opencode-v2',
    kind:'executor',capabilities:{deliver:true,observe:true}}}
});

test('local CLI validates the actual checked-in semantic master without opening a Bus',async()=>{
  const lines=[];let opens=0;
  const rc=await localMain(['platform','validate'],{
    open:async()=>{opens++;throw new Error('no runtime permitted')},
    print:x=>lines.push(JSON.parse(x))
  });
  assert.equal(rc,0,JSON.stringify(lines));assert.equal(opens,0);
  assert.equal(lines[0].code,'SEED_VALID_DESIGN_ONLY');
  assert.equal(lines[0].execution_authority,false);
  assert.equal(lines[0].semantic_capabilities,7);
});

test('IPC CLI can inspect design seed with no broker and no transport',async()=>{
  const lines=[];let calls=0;
  const rc=await ipcMain(['platform','inspect','--json'],{
    socketPath:null,transport:async()=>{calls++;throw Error('unexpected transport')},
    write:x=>lines.push(JSON.parse(x))
  });
  assert.equal(rc,0,JSON.stringify(lines));assert.equal(calls,0);
  assert.equal(lines[0].schema,'aion.platform.inspect/1');
  assert.equal(lines[0].dispatchable,false);
  assert.equal(lines[0].providers.length,4);
});

test('direct local capabilities adds read-only provider semantics without changing existing fields',async()=>{
  const output=[];let closed=0;
  const bus={adapters:manifests(),store:{read:async()=>({agents:{}})}};
  const rc=await localMain(['capabilities'],{print:x=>output.push(JSON.parse(x)),
    open:async()=>({bus,engine:{ok:false,status:'UNAVAILABLE'},
      browser:{ok:false,state:'HOST_NOT_CONNECTED'},
      refresh:async()=>false,close:async()=>{closed++}})});
  assert.equal(rc,0);assert.equal(closed,1);
  const view=output[0];
  assert.equal(view.schema,'aion.capabilities/1');
  assert.equal(view.platform.schema,'aion.platform.capabilities/1');
  assert.equal(view.platform.can_dispatch,false);
  assert.equal(view.platform.adapters.length,2);
  assert.equal(view.platform.adapters[0].capabilities[0].semantic_id,'conversation.send');
  assert.equal(view.platform.adapters[0].capabilities[0].runtime_readiness,'NOT_OBSERVED');
  assert.equal(view.platform.adapters[1].capabilities[0].semantic_id,'executor.prompt');
  assert.equal(view.opencode_submit,'BLOCKED');
});

test('broker capabilities projects existing adapters without ingesting or dispatching',async()=>{
  let writes=0;const bus={adapters:manifests(),store:{read:async()=>({})},
    ingestStructured:async()=>{writes++;throw Error('no')},
    dispatch:async()=>{writes++;throw Error('no')},
    readCommand:async()=>null};
  const plane=createCommandPlane({bus,roleCatalog:{roles:[]},
    capabilities:{get:()=>({actions:{submit:'UNKNOWN'}}),list:()=>[]},
    events:{publish:()=>{}}});
  const r=await plane.handle('capabilities');
  assert.equal(r.schema,'aion.capabilities/1');
  assert.equal(r.platform.can_authorize,false);
  assert.equal(r.platform.adapters.length,2);
  assert.equal(writes,0);
});

test('catalog cannot invent a Claude adapter or advertise a live Chrome send',async()=>{
  const data=[];
  const bus={adapters:{'claude.ai':{manifest:{schema:'aion.bus.adapter/1',name:'claude.ai',
    kind:'conversation',capabilities:{deliver:true,live_verified:true}}}},
    store:{read:async()=>({agents:{}})}};
  const rc=await localMain(['capabilities'],{print:x=>data.push(JSON.parse(x)),
    open:async()=>({bus,engine:null,browser:null,refresh:async()=>false,close:async()=>{}})});
  assert.equal(rc,0);
  const a=data[0].platform.adapters[0];
  assert.equal(a.application_family,'unknown');
  assert.equal(a.capabilities.length,0);
  assert.equal(a.live_availability,'NOT_OBSERVED');
});
