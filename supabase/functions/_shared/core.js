import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import Stripe from 'npm:stripe@23.0.0';
export const SITE = 'https://enrigiop.github.io/MacroDivide';
export const PRICE = 'price_1Ucah3RYIvKi4dXuwLuEQWkD';
export const PORTAL = 'bpc_1UcahoRYIvKi4dXu43ZJz5rl';
export const CORS = {'Access-Control-Allow-Origin':'https://enrigiop.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,'Content-Type':'application/json'}})}
export function clients(){
 const url=Deno.env.get('SUPABASE_URL');
 const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
 const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)throw Error('Backend configuration missing');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const stripeKey=Deno.env.get('STRIPE_API_KEY');
 const stripe=stripeKey?new Stripe(stripeKey,{httpClient:Stripe.createFetchHttpClient()}):null;
 return {db,stripe};
}
export async function userFor(req,db){
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');
 if(!token)throw Object.assign(Error('Sign in to continue'),{status:401});
 const {data,error}=await db.auth.getUser(token);
 if(error||!data.user||!data.user.email_confirmed_at)throw Object.assign(Error('Sign in with a verified email'),{status:401});
 return data.user;
}
export async function rowFor(db,userId){const {data,error}=await db.from('md_billing').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return data}
export async function syncSubscription(db,stripe,subOrId){
 const triggering=typeof subOrId==='string'?await stripe.subscriptions.retrieve(subOrId):subOrId;
 const customer=typeof triggering.customer==='string'?triggering.customer:triggering.customer.id;
 const all=await stripe.subscriptions.list({customer,status:'all',limit:100});
 const matching=all.data.filter(s=>s.items.data.some(i=>i.price.id===PRICE));
 const sub=matching.find(s=>['active','trialing'].includes(s.status))||matching[0]||triggering;
 if(!sub.items.data.some(i=>i.price.id===PRICE))return;
 const ends=sub.items.data.map(i=>i.current_period_end).filter(Boolean);
 const end=Math.max(0,...ends,sub.current_period_end||0);
 const {error}=await db.from('md_billing').update({subscription_id:sub.id,status:sub.status,trial_used:true,trial_end:sub.trial_end?new Date(sub.trial_end*1000).toISOString():null,period_end:end?new Date(end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end,updated_at:new Date().toISOString()}).eq('customer_id',customer);
 if(error)throw error;
}
export {entitled} from './access.js';
export async function freshRow(db,stripe,userId){
 let row=await rowFor(db,userId);if(!row)return null;
 if(row.subscription_id){await syncSubscription(db,stripe,row.subscription_id);row=await rowFor(db,userId)}
 else {const subs=await stripe.subscriptions.list({customer:row.customer_id,status:'all',limit:100});const s=subs.data.find(s=>s.items.data.some(i=>i.price.id===PRICE)&&['active','trialing','past_due','unpaid','paused','incomplete'].includes(s.status));if(s){await syncSubscription(db,stripe,s);row=await rowFor(db,userId)}}
 return row;
}
