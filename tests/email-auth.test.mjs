import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../member-auth.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
async function setup(query='?mode=signup'){
 const els=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{value:'',hidden:false,style:{},dataset:{},textContent:'',type:'password',validity:{valid:true},setAttribute(k,v){this[k]=v},focus(){this.focused=true}}]));
 const calls=[];let signupError=null,loginError=null,resetError=null,clock=1000,session=null,eventHandler,assigned;
 const auth={getSession:async()=>({data:{session}}),signUp:async x=>{calls.push(['signup',x]);return {data:{session:null},error:signupError}},signInWithPassword:async x=>{calls.push(['signin',x]);return {error:loginError}},resend:async x=>{calls.push(['resend',x]);return {error:null}},resetPasswordForEmail:async x=>{calls.push(['reset',x]);if(resetError)throw resetError;return {error:null}},onAuthStateChange(fn){eventHandler=fn},updateUser:async x=>{calls.push(['update',x]);return {error:null}},signOut:async()=>({})};
 const context={createClient:()=>({auth,functions:{invoke:()=>{throw Error('Unexpected billing request')}}}),document:{getElementById:id=>els[id]},location:{search:query,hash:'',pathname:'/app.html',assign(x){assigned=x},reload(){},replace(){}},history:{replaceState(){}},URLSearchParams,Date:{now:()=>clock},setTimeout:()=>{},fetch:()=>{throw Error('unexpected fetch')}};
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 return {els,calls,submit:()=>els.form.onsubmit({preventDefault(){}}),time:n=>clock=n,error:e=>signupError=e,loginError:e=>loginError=e,resetError:e=>resetError=e,event:(name,s)=>{session=s;eventHandler(name,s)},assigned:()=>assigned};
}
const a=await setup();a.els.email.value='test@example.com';a.els.password.value='short';await a.submit();assert.equal(a.calls.length,0);assert.match(a.els.message.textContent,/at least 12/);assert.equal(a.els.password.focused,true);
a.els.password.value='long-test-passphrase';await a.submit();assert.equal(a.calls[0][0],'signup');assert.equal(a.els.form.hidden,true);assert.equal(a.els.confirmation.hidden,false);assert.match(a.els['confirmation-copy'].textContent,/test@example.com/);assert.equal(a.els.password.value,'');await a.els.resend.onclick();assert.equal(a.calls.length,1);a.time(62000);await a.els.resend.onclick();assert.equal(a.calls[1][0],'resend');assert.equal(a.calls[1][1].options.emailRedirectTo,'https://macrodivide.com/app.html');
const b=await setup();b.els.email.value='test@example.com';b.els.password.value='long-test-passphrase';b.error({message:'Error sending confirmation email'});await b.submit();assert.equal(b.els.form.hidden,false);assert.equal(b.els.confirmation.hidden,true);assert.match(b.els.message.textContent,/Error sending/);assert.equal(b.els.signin.disabled,false);
const c=await setup('');c.els.email.value='test@example.com';c.els.password.value='existing-pass';c.loginError({code:'email_not_confirmed'});await c.submit();assert.equal(c.els.confirmation.hidden,false);assert.match(c.els.message.textContent,/Confirm your email/);
c.els['signin-tab'].onclick();c.resetError(Error('network failure'));await c.els.reset.onclick();assert.match(c.els.message.textContent,/Could not connect/);assert.equal(c.els.reset.disabled,false);
const d=await setup();d.els.email.validity.valid=false;d.els.email.value='bad-email';await d.submit();assert.equal(d.calls.length,0);assert.match(d.els.message.textContent,/valid email/);
const recovery=await setup();recovery.event('PASSWORD_RECOVERY',{user:{email:'test@example.com'}});await recovery.els.refresh.onclick();assert.equal(recovery.els.email.readOnly,true);assert.equal(recovery.els.signup.hidden,true);recovery.els.password.value='new-long-passphrase';await recovery.submit();assert.equal(recovery.calls[0][0],'update');assert.equal(recovery.assigned(),'./app.html');
console.log('Registration checks passed: inline validation, successful signup, SMTP failure, resend cooldown, unconfirmed login, and reset network recovery.');
