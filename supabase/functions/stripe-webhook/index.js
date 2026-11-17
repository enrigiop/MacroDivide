import Stripe from 'npm:stripe@23.0.0';
import {clients,syncSubscription} from '../_shared/core.js';
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');if(!secret)return new Response('Not configured',{status:503});
 let event;const {db,stripe}=clients();
 try{event=await stripe.webhooks.constructEventAsync(await req.text(),req.headers.get('stripe-signature')||'',secret,undefined,Stripe.createSubtleCryptoProvider())}catch{return new Response('Invalid signature',{status:400})}
 try{
  const {data:seen,error:readError}=await db.from('md_stripe_events').select('id').eq('id',event.id).maybeSingle();if(readError)throw readError;if(seen)return Response.json({received:true});
  const o=event.data.object;
  if(event.type.startsWith('customer.subscription.'))await syncSubscription(db,stripe,o.id);
  else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
   // Only signed events with this customer's existing first-class mapping can grant access.
   if(o.mode==='subscription'&&o.subscription){const s=await stripe.subscriptions.retrieve(o.subscription);await syncSubscription(db,stripe,s)}
  }else if(['invoice.paid','invoice.payment_failed'].includes(event.type)){
   const id=o.parent?.subscription_details?.subscription||o.subscription;if(id)await syncSubscription(db,stripe,id);
  }else if(['charge.dispute.created','charge.refunded','radar.early_fraud_warning.created'].includes(event.type)){
   const charge=event.type==='charge.refunded'?o:await stripe.charges.retrieve(typeof o.charge==='string'?o.charge:o.charge.id);
   if(event.type!=='charge.refunded'||charge.refunded){const customer=typeof charge.customer==='string'?charge.customer:charge.customer?.id;if(customer){const {error}=await db.from('md_billing').update({risk_hold:true,updated_at:new Date().toISOString()}).eq('customer_id',customer);if(error)throw error}}
  }
  const {error}=await db.from('md_stripe_events').upsert({id:event.id,event_type:event.type},{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
  return Response.json({received:true});
 }catch(e){console.error('Webhook failed',event.type);return new Response('Retry event',{status:500})}
});
