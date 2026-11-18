import {SITE,PRICE,PORTAL,corsFor,allowedOrigin,json,clients,userFor,rowFor,freshRow,entitled} from '../_shared/core.js';
Deno.serve(async req=>{
 const reply=(data,status=200)=>json(data,status,req);
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsFor(req)});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 if(!allowedOrigin(req))return reply({error:'Origin not allowed'},403);
 try{
  const {db,stripe}=clients(),user=await userFor(req,db);
  const {action}=await req.json();
  let row=await freshRow(db,stripe,user.id);
  if(action==='status')return reply({access:entitled(row),status:row?.risk_hold?'review':row?.status||'none',trialUsed:row?.trial_used||false,trialEnd:row?.trial_end,periodEnd:row?.period_end,cancelAtPeriodEnd:row?.cancel_at_period_end||false});
  if(action==='portal'){
   if(!row)return reply({error:'No subscription to manage yet'},404);
   const p=await stripe.billingPortal.sessions.create({customer:row.customer_id,configuration:PORTAL,return_url:SITE+'/app.html'});return reply({url:p.url});
  }
  if(action!=='checkout')return reply({error:'Unknown action'},400);
  if(row?.risk_hold)return reply({error:'Your account needs a billing review. Contact support.'},403);
  if(row&&['active','trialing','past_due','unpaid','paused','incomplete'].includes(row.status))return reply({error:'You already have a subscription. Use Manage billing.'},409);
  if(!row){
   const customer=await stripe.customers.create({email:user.email},{idempotencyKey:'macrodivide-customer-'+user.id});
   const {error}=await db.from('md_billing').upsert({user_id:user.id,customer_id:customer.id},{onConflict:'user_id',ignoreDuplicates:true});if(error)throw error;row=await rowFor(db,user.id);
  }
  // Reuse an open checkout rather than creating parallel trials.
  const open=await stripe.checkout.sessions.list({customer:row.customer_id,status:'open',limit:10});
  const existing=open.data.find(s=>s.mode==='subscription'&&s.client_reference_id===user.id);
  if(existing?.url)return reply({url:existing.url});
  const subscription_data=row.trial_used?{}:{trial_period_days:14,trial_settings:{end_behavior:{missing_payment_method:'cancel'}}};
  const session=await stripe.checkout.sessions.create({mode:'subscription',customer:row.customer_id,client_reference_id:user.id,line_items:[{price:PRICE,quantity:1}],subscription_data:{...subscription_data,billing_mode:{type:"flexible"}},managed_payments:{enabled:true},payment_method_collection:'always',integration_identifier:'macrodivide_web_xqntplza',success_url:SITE+'/app.html?checkout=success',cancel_url:SITE+'/app.html?checkout=canceled'},{idempotencyKey:'macrodivide-checkout-'+user.id+'-'+Math.floor(Date.now()/60000)});
  return reply({url:session.url});
 }catch(e){console.error('Billing request failed',e?.type||e?.name);return reply({error:e.status===401?e.message:'Billing is temporarily unavailable. Please try again.'},e.status||503)}
});
