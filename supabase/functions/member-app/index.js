import {CORS,json,clients,userFor,freshRow,entitled} from '../_shared/core.js';
import app from './app.js';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
 if(req.method!=='GET')return json({error:'Method not allowed'},405);
 try{const {db,stripe}=clients();const user=await userFor(req,db);const row=await freshRow(db,stripe,user.id);
  if(!entitled(row))return json({error:'An active subscription or trial is required'},403);
  return new Response(app,{headers:{...CORS,'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}});
 }catch(e){return json({error:e.status===401?e.message:'Access verification is temporarily unavailable'},e.status||503)}
});
