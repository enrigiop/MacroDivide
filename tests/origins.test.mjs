import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
let source=await readFile(new URL('../supabase/functions/_shared/core.js',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'').replace(/^export \{entitled\}.*\n/gm,'').replace(/export /g,'');
const context={Response};vm.createContext(context);vm.runInContext(source+'\nglobalThis.api={allowedOrigin,corsFor,json,SITE};',context);
const {allowedOrigin,corsFor,json,SITE}=context.api;
assert.equal(SITE,'https://macrodivide.com');
for(const origin of ['https://macrodivide.com','https://www.macrodivide.com','https://enrigiop.github.io']){
 const req=new Request('https://example.test',{headers:{Origin:origin}});assert.equal(allowedOrigin(req),true);assert.equal(corsFor(req)['Access-Control-Allow-Origin'],origin);assert.equal(json({},200,req).headers.get('Vary'),'Origin');
}
for(const origin of ['https://macrodivide.com.evil.test','http://macrodivide.com','null']){
 const req=new Request('https://example.test',{headers:{Origin:origin}});assert.equal(allowedOrigin(req),false);assert.notEqual(corsFor(req)['Access-Control-Allow-Origin'],origin);
}
console.log('Migration origin checks passed: canonical domain, www, legacy site, and hostile origins.');
