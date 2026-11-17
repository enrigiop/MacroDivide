import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../supabase/functions/stripe-webhook/index.js',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'');
async function run({signature=true,seen=false,failSync=false,type='customer.subscription.updated'}={}){
 let handler,syncs=0,writes=0,reads=0;
 const stripe={webhooks:{constructEventAsync:async()=>{if(!signature)throw Error();return {id:'evt_test',type,data:{object:{id:'sub_test'}}}}}};
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{reads++;return {data:seen?{id:'evt_test'}:null,error:null}}})}),upsert:async()=>{writes++;return {error:null}}})};
 vm.runInNewContext(source,{Deno:{env:{get:()=> 'test-only-secret'},serve:f=>handler=f},Stripe:{createSubtleCryptoProvider:()=>({})},clients:()=>({db,stripe}),syncSubscription:async()=>{syncs++;if(failSync)throw Error()},Response,console:{error:()=>{}}});
 const response=await handler(new Request('https://example.test',{method:'POST',body:'{}'}));
 return {status:response.status,syncs,writes,reads};
}
assert.deepEqual(await run({signature:false}),{status:400,syncs:0,writes:0,reads:0});
assert.deepEqual(await run({seen:true}),{status:200,syncs:0,writes:0,reads:1});
assert.deepEqual(await run(),{status:200,syncs:1,writes:1,reads:1});
assert.deepEqual(await run({failSync:true}),{status:500,syncs:1,writes:0,reads:1});
console.log('Webhook checks passed: invalid signature, replay, reconciliation, and retry on failure.');
