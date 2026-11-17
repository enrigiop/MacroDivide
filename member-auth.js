import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.95.0';
const sb=createClient('https://jgmzkzhgxieswcrekmew.supabase.co','sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin');
const base='https://jgmzkzhgxieswcrekmew.supabase.co/functions/v1/';
const $=id=>document.getElementById(id),message=s=>{$('message').textContent=s};
const ready=()=>{$('signin').disabled=false;$('signup').disabled=false};
let loading=false,recovery=false;
async function api(action){const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Please sign in first.');const {data,error}=await sb.functions.invoke('billing',{body:{action}});if(error)throw Error(data?.error||'Billing is temporarily unavailable. Please try again.');if(data?.error)throw Error(data.error);return data}
async function load(){
 if(loading||recovery)return;loading=true;
 try{const {data:{session}}=await sb.auth.getSession();$('auth').style.display=session?'none':'block';$('account').style.display=session?'block':'none';if(!session)return;
 $('identity').textContent=session.user.email;
 const status=await api('status');$('status').textContent=status.access?'Opening your workspace…':status.status==='none'?'Your account is ready. Start your free trial below.':status.status==='review'?'Your billing account needs review. Please contact support.':'Subscription status: '+status.status;
 $('start').textContent=status.status==='none'&&!status.trialUsed?'Start 14-day free trial':'Subscribe — €5.99/month';
 if(status.access){const r=await fetch(base+'member-app',{headers:{Authorization:'Bearer '+session.access_token,apikey:'sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin'}});if(!r.ok)throw Error('Could not verify workspace access. Please refresh.');const html=await r.text();document.open();document.write(html);document.close()}
 }catch(e){message(e.message)}finally{loading=false}
}
$('form').onsubmit=async e=>{e.preventDefault();$('signin').disabled=true;try{const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await load()}catch(e){message(e.message)}finally{ready()}};
$('signup').onclick=async()=>{if(!$('form').reportValidity())return;$('signup').disabled=true;try{const {error}=await sb.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:location.origin+'/MacroDivide/app.html'}});if(error)throw error;message('Check your email to confirm your account, then sign in.')}catch(e){message(e.message)}finally{ready()}};
$('reset').onclick=async()=>{if(!$('email').reportValidity())return;const {error}=await sb.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:location.origin+'/MacroDivide/app.html'});message(error?error.message:'If the account exists, a password-reset email is on its way.')};
$('start').onclick=async()=>{try{$('start').disabled=true;const d=await api('checkout');location.assign(d.url)}catch(e){message(e.message);$('start').disabled=false}};
$('manage').onclick=async()=>{try{const d=await api('portal');location.assign(d.url)}catch(e){message(e.message)}};
$('refresh').onclick=()=>load();$('logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
sb.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){recovery=true;$('email').value=session?.user.email||'';$('email').readOnly=true;$('password').autocomplete='new-password';$('signup').hidden=true;$('reset').hidden=true;$('auth').style.display='block';$('account').style.display='none';message('Choose a new password (12 characters minimum).');$('signin').textContent='Save new password';$('form').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:$('password').value});if(error)message(error.message);else{recovery=false;location.assign('./app.html')}}}else if(event==='SIGNED_IN')setTimeout(()=>load(),0)});
if(new URLSearchParams(location.search).has('signout')){await sb.auth.signOut();location.replace('./app.html')}else await load();
