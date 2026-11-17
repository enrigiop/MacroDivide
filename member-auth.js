import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.95.0';
const sb=createClient('https://jgmzkzhgxieswcrekmew.supabase.co','sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin',{auth:{flowType:'pkce'}});
const base='https://jgmzkzhgxieswcrekmew.supabase.co/functions/v1/';
const $=id=>document.getElementById(id),message=s=>{$('message').textContent=s};
let loading=false;
async function api(action){const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Please sign in first.');const {data,error}=await sb.functions.invoke('billing',{body:{action}});if(error)throw Error(data?.error||'Billing is temporarily unavailable. Please try again.');if(data?.error)throw Error(data.error);return data}
async function load(){
 if(loading)return;loading=true;
 try{const {data:{session}}=await sb.auth.getSession();$('auth').style.display=session?'none':'block';$('account').style.display=session?'block':'none';if(!session)return;
 $('identity').textContent=session.user.email;
 const status=await api('status');$('status').textContent=status.access?'Opening your workspace…':status.status==='none'?'Your account is ready. Start your free trial below.':status.status==='review'?'Your billing account needs review. Please contact support.':'Subscription status: '+status.status;
 $('start').textContent=status.status==='none'&&!status.trialUsed?'Start 14-day free trial':'Subscribe — €5.99/month';
 if(status.access){const r=await fetch(base+'member-app',{headers:{Authorization:'Bearer '+session.access_token,apikey:'sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin'}});if(!r.ok)throw Error('Could not verify workspace access. Please refresh.');const html=await r.text();document.open();document.write(html);document.close()}
 }catch(e){message(e.message)}finally{loading=false}
}
$('google').onclick=async()=>{
 $('google').disabled=true;message('Opening Google sign-in…');
 try{const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://enrigiop.github.io/MacroDivide/app.html',queryParams:{prompt:'select_account'}}});if(error)throw error}
 catch(e){message(e.message);$('google').disabled=false}
};
$('start').onclick=async()=>{try{$('start').disabled=true;const d=await api('checkout');location.assign(d.url)}catch(e){message(e.message);$('start').disabled=false}};
$('manage').onclick=async()=>{try{const d=await api('portal');location.assign(d.url)}catch(e){message(e.message)}};
$('refresh').onclick=()=>load();$('logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
sb.auth.onAuthStateChange((event)=>{if(['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED'].includes(event))setTimeout(()=>load(),0)});
const authError=new URLSearchParams(location.search).get('error_description')||new URLSearchParams(location.hash.slice(1)).get('error_description');
if(authError)message('Google sign-in could not finish: '+authError);
if(new URLSearchParams(location.search).has('signout')){await sb.auth.signOut();location.replace('./app.html')}else await load();
