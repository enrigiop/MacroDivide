import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.95.0';
const sb=createClient('https://jgmzkzhgxieswcrekmew.supabase.co','sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin');
const base='https://jgmzkzhgxieswcrekmew.supabase.co/functions/v1/';
const redirectTo='https://macrodivide.com/app.html';
const $=id=>document.getElementById(id);
let mode=new URLSearchParams(location.search).get('mode')==='signup'?'signup':'signin';
let loading=false,recovery=false,workspaceOpened=false,busy=false,pendingEmail='',resendAt=0;
function message(text,error=false){if(!$('message'))return;$('message').textContent=text;$('message').dataset.error=String(error);if(error)$('message').setAttribute('role','alert');else $('message').setAttribute('role','status')}
function friendly(error){
 if(error?.code==='email_not_confirmed')return 'Confirm your email before signing in. Use Resend confirmation email below if you need another message.';
 if(error?.code==='invalid_credentials')return 'Email or password not recognised. Check your email spelling and password, or choose Forgot password.';
 if(error?.status===429||error?.code?.includes('rate_limit')||/seconds|rate limit/i.test(error?.message||''))return 'Too many attempts. Please wait a minute, then try again.';
 if(error?.code==='user_already_exists')return 'This email already has an account. Choose Sign in or Forgot password.';
 if(error?.code==='weak_password')return 'Choose a stronger password with at least 12 characters. A long, unique passphrase works well.';
 if(/fetch|network/i.test(error?.message||''))return 'Could not connect. Check your internet connection and try again.';
 return error?.message||'Something went wrong. Please try again.';
}
function lock(value){busy=value;for(const id of ['signin','signup','signin-tab','reset','resend','confirmed','change-email'])if($(id))$(id).disabled=value; if($('signin'))$('signin').textContent=value?'Please wait…':recovery?'Save new password':mode==='signup'?'Create account':'Sign in'}
function setMode(next){if(busy||recovery||workspaceOpened)return;mode=next;$('confirmation').hidden=true;$('form').hidden=false;$('signup').setAttribute('aria-selected',String(mode==='signup'));$('signin-tab').setAttribute('aria-selected',String(mode==='signin'));$('heading').textContent=mode==='signup'?'Create your account.':'Welcome back.';$('intro').textContent=mode==='signup'?'Save your prep. Confirm your email, then choose your 14-day trial.':'Sign in to open your meal prep workspace.';$('password').autocomplete=mode==='signup'?'new-password':'current-password';$('password-help').textContent=mode==='signup'?'At least 12 characters. Use a unique password or passphrase.':'Enter the password for your existing account.';$('signup-terms').hidden=mode!=='signup';$('reset').hidden=mode==='signup';$('signin').textContent=mode==='signup'?'Create account':'Sign in';message('')}
function validEmail(){const email=$('email').value.trim();$('email').value=email;if(!email||!$('email').validity.valid){message('Enter a valid email address, such as name@example.com.',true);$('email').focus();return null}return email}
function showConfirmation(email){pendingEmail=email;$('form').hidden=true;$('confirmation').hidden=false;$('confirmation-copy').textContent='A confirmation was requested for '+email+'.';$('heading').textContent='One more step.';$('intro').textContent='Confirm your email to finish creating your account.';$('password').value=''}
async function api(action){const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Please sign in first.');const {data,error}=await sb.functions.invoke('billing',{body:{action}});if(error)throw Error(data?.error||'Billing is temporarily unavailable. Please try again.');if(data?.error)throw Error(data.error);return data}
async function load(){
 if(loading||recovery||workspaceOpened)return;loading=true;
 try{const {data:{session},error}=await sb.auth.getSession();if(error)throw error;if(recovery)return;$('auth').style.display=session?'none':'block';$('account').style.display=session?'block':'none';if(!session)return;
 $('identity').textContent=session.user.email;
 const status=await api('status');message('');$('status').textContent=status.access?'Opening your workspace…':status.status==='none'?'Your account is ready. Choose your subscription below.':status.status==='review'?'Your billing account needs review. Please contact support.':'Subscription status: '+status.status;
 $('start').textContent=status.status==='none'&&!status.trialUsed?'Start 14-day free trial':'Subscribe — €5.99/month';
 if(status.access){const r=await fetch(base+'member-app',{headers:{Authorization:'Bearer '+session.access_token,apikey:'sb_publishable_pjU2i6GsIXFbVX_RHiRZcQ_ALEjlxin'}});if(!r.ok)throw Error('Could not verify workspace access. Please refresh.');const html=await r.text();workspaceOpened=true;document.open();document.write(html);document.close()}
 }catch(e){message(friendly(e),true)}finally{loading=false}
}
$('signup').onclick=()=>setMode('signup');$('signin-tab').onclick=()=>setMode('signin');
$('show-password').onclick=()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('show-password').textContent=show?'Hide':'Show';$('show-password').setAttribute('aria-label',show?'Hide password':'Show password');$('show-password').setAttribute('aria-pressed',String(show))};
$('form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;message('');const email=validEmail();if(!email)return;
 const password=$('password').value;if(!password){message('Enter your password.',true);$('password').focus();return}
 if((mode==='signup'||recovery)&&password.length<12){message('Your new password needs at least 12 characters. You have entered '+password.length+'.',true);$('password').focus();return}
 lock(true);
 try{
  if(recovery){const {error}=await sb.auth.updateUser({password});if(error)throw error;recovery=false;location.assign('./app.html');return}
  if(mode==='signup'){
   const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});if(error)throw error;
   if(data.session){await load()}else{resendAt=Date.now()+60000;showConfirmation(email);message('Open the newest confirmation email. If this address is already registered, use Sign in or Forgot password.')}
  }else{
   const {error}=await sb.auth.signInWithPassword({email,password});if(error){if(error.code==='email_not_confirmed')showConfirmation(email);throw error}await load();
  }
 }catch(e){message(friendly(e),true)}finally{lock(false)}
};
$('resend').onclick=async()=>{if(busy)return;const remaining=Math.ceil((resendAt-Date.now())/1000);if(remaining>0){message('Please wait '+remaining+' seconds before requesting another email.');return}lock(true);try{const {error}=await sb.auth.resend({type:'signup',email:pendingEmail,options:{emailRedirectTo:redirectTo}});if(error)throw error;resendAt=Date.now()+60000;message('Confirmation requested again. Use the newest email and check Spam.')}catch(e){message(friendly(e),true)}finally{lock(false)}};
$('confirmed').onclick=()=>setMode('signin');$('change-email').onclick=()=>{setMode('signup');$('email').focus()};
$('reset').onclick=async()=>{if(busy)return;const email=validEmail();if(!email)return;lock(true);try{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;message('If this account exists, a password-reset email is on its way. Check your inbox and Spam.')}catch(e){message(friendly(e),true)}finally{lock(false)}};
$('start').onclick=async()=>{try{$('start').disabled=true;const d=await api('checkout');location.assign(d.url)}catch(e){message(friendly(e),true);$('start').disabled=false}};
$('manage').onclick=async()=>{try{const d=await api('portal');location.assign(d.url)}catch(e){message(friendly(e),true)}};
$('refresh').onclick=()=>load();$('logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
sb.auth.onAuthStateChange((event,session)=>{
 if(event==='PASSWORD_RECOVERY'){
  recovery=true;$('email').value=session?.user.email||'';$('email').readOnly=true;$('password').value='';$('password').autocomplete='new-password';$('heading').textContent='Choose a new password.';$('intro').textContent='Use at least 12 characters for your new password.';$('password-help').textContent='At least 12 characters. Use a unique password or passphrase.';$('signup').hidden=true;$('signin-tab').hidden=true;$('reset').hidden=true;$('signup-terms').hidden=true;$('confirmation').hidden=true;$('form').hidden=false;$('auth').style.display='block';$('account').style.display='none';$('signin').textContent='Save new password';message('Enter your new password below.');
 }else if(['INITIAL_SESSION','SIGNED_IN'].includes(event))setTimeout(()=>load(),0);
});
setMode(mode);
const callbackError=new URLSearchParams(location.hash.slice(1)).get('error_description')||new URLSearchParams(location.search).get('error_description');
if(callbackError){message('This email link is invalid or has expired. Sign in if you have already confirmed, or create your account again to request a new confirmation. For a password reset, choose Forgot password.',true);history.replaceState(null,'',location.pathname)}
if(new URLSearchParams(location.search).has('signout')){await sb.auth.signOut();location.replace('./app.html')}else await load();
