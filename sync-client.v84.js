/* Fit Photo V84: small, first-party REST transport for the existing Supabase contracts.
 * Not the Supabase SDK. No CDN, schema changes, admin keys or RLS bypass.
 * Uses the existing SDK auth storage key and session shape to retain owner identity.
 */
(function(){
'use strict';
window.FitCreateSyncClient=function(api,key){
 api=api.replace(/\/$/,'');
 var project=new URL(api).hostname.split('.')[0],authKey='sb-'+project+'-auth-token';
 var memory=null,authFlight=null,storageWarning=false;
 function warnStorage(){if(storageWarning)return;storageWarning=true;window.dispatchEvent(new CustomEvent('fit-sync-storage-warning'));}
 function readSession(){
  if(storageWarning&&memory)return memory;
  var raw;
  try{raw=localStorage.getItem(authKey);}catch(e){warnStorage();return memory;}
  if(!raw)return null;
  try{var saved=JSON.parse(raw);if(!saved||!saved.access_token||!saved.user)throw new Error('invalid');return saved;}
  catch(e){throw new Error('Saved sign-in could not be read. Existing browser data has not been deleted. Contact the tool owner before resetting site data.');}
 }
 function writeSession(s){memory=s;try{localStorage.setItem(authKey,JSON.stringify(s));}catch(e){warnStorage();}}
 function error(message,status,code){var e=new Error(message);e.status=status||0;e.code=code||'';return e;}
 async function request(path,method,body,token,extra){
  var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort();},18000);
  var headers={apikey:key,Accept:'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  if(body!==undefined)headers['Content-Type']=body instanceof Blob?(body.type||'application/octet-stream'):'application/json';
  Object.assign(headers,extra||{});
  try{
   var res=await fetch(api+path,{method:method||'POST',headers:headers,body:body===undefined?undefined:body instanceof Blob?body:JSON.stringify(body),signal:ctl.signal,cache:'no-store'});
   var text=await res.text(),data=null;
   if(text){try{data=JSON.parse(text);}catch(e){if(res.ok)throw error('The photo service returned an unexpected response.',res.status);}}
   if(!res.ok)throw error(data&&(data.message||data.msg||data.error_description||data.error)||('Photo service returned HTTP '+res.status),res.status,data&&(data.code||data.error_code));
   return data;
  }catch(e){
   if(e.name==='AbortError')throw error('Photo service timed out. Your inputs and existing session are unchanged. Retry Connection when the network is available.',0,'timeout');
   if(e instanceof TypeError)throw error('Cannot reach the photo service. Check network access and use Retry Connection. Local editing and saved session names remain available.',0,'network');
   throw e;
  }finally{clearTimeout(timer);}
 }
 function authWork(create,forceToken){
  if(authFlight)return authFlight.then(function(s){
   if((create&&!s)||(forceToken&&s&&s.access_token===forceToken))return authWork(create,forceToken);
   return s;
  });
  async function run(){
   var s=readSession();
   // Reload inside the lock so another tab's refresh/signup is never overwritten.
   if(s&&(!forceToken||s.access_token!==forceToken)&&Number(s.expires_at)>Date.now()/1000+60)return s;
   if(s){
    if(!s.refresh_token)throw error('Saved sign-in cannot be renewed. Existing data was retained; contact the tool owner.',401,'auth_expired');
    var renewed;
    try{renewed=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:s.refresh_token});}
    catch(e){if(e.status===400||e.status===401)throw error('Saved sign-in has expired and could not be renewed. Existing photos and session links were retained. Contact the tool owner before resetting site data.',e.status,'auth_expired');throw e;}
    if(!renewed||!renewed.access_token||!renewed.user)throw error('Sign-in renewal returned no usable session.');
    renewed.expires_at=renewed.expires_at||Math.floor(Date.now()/1000)+(renewed.expires_in||3600);writeSession(renewed);return renewed;
   }
   if(!create)return null;
   var fresh=await request('/auth/v1/signup','POST',{data:{}});
   if(!fresh||!fresh.access_token||!fresh.user)throw error('Anonymous sign-in returned no usable session. Check the existing service configuration.');
   fresh.expires_at=fresh.expires_at||Math.floor(Date.now()/1000)+(fresh.expires_in||3600);writeSession(fresh);return fresh;
  }
  authFlight=(navigator.locks&&navigator.locks.request?navigator.locks.request('fit-photo:'+authKey,run):run());
  authFlight=authFlight.finally(function(){authFlight=null;});return authFlight;
 }
 async function authenticated(path,method,body,headers){
  var s=await authWork(true);
  try{return await request(path,method,body,s.access_token,headers);}
  catch(e){if(e.status!==401)throw e;s=await authWork(true,s.access_token);return request(path,method,body,s.access_token,headers);}
 }
 async function result(fn){try{return {data:await fn(),error:null};}catch(e){return {data:null,error:e};}}
 function Query(table){this.table=table;this.params=new URLSearchParams();this.method='GET';this.body=undefined;this.single=false;this.promise=null;}
 Query.prototype.select=function(cols){this.params.set('select',cols||'*');return this;};
 Query.prototype.eq=function(k,v){this.params.append(k,'eq.'+v);return this;};
 Query.prototype.order=function(k,opts){this.params.set('order',k+(opts&&opts.ascending===false?'.desc':'.asc'));return this;};
 Query.prototype.limit=function(n){this.params.set('limit',String(n));return this;};
 Query.prototype.maybeSingle=function(){this.single=true;return this;};
 Query.prototype.insert=function(row){this.method='POST';this.body=row;return this;};
 Query.prototype.update=function(row){this.method='PATCH';this.body=row;return this;};
 Query.prototype.then=function(resolve,reject){
  var self=this;
  if(!this.promise)this.promise=result(async function(){
   var tail=self.params.toString(),data=await authenticated('/rest/v1/'+encodeURIComponent(self.table)+(tail?'?'+tail:''),self.method,self.body,self.method==='GET'?{}:{Prefer:'return=minimal'});
   if(self.single){if(Array.isArray(data)&&data.length>1)throw error('The photo service returned more than one session.');return Array.isArray(data)?data[0]||null:data;}
   return data;
  });
  return this.promise.then(resolve,reject);
 };
 function objectPath(bucket,path){return encodeURIComponent(bucket)+'/'+String(path).split('/').map(encodeURIComponent).join('/');}
 return {
  transport:'fit-rest-v84',
  auth:{
   getSession:async function(){try{return {data:{session:await authWork(false)},error:null};}catch(e){return {data:{session:null},error:e};}},
   signInAnonymously:async function(){try{var s=await authWork(true);return {data:{session:s,user:s.user},error:null};}catch(e){return {data:{session:null,user:null},error:e};}}
  },
  rpc:function(name,args){return result(function(){return authenticated('/rest/v1/rpc/'+encodeURIComponent(name),'POST',args);});},
  from:function(table){return new Query(table);},
  storage:{from:function(bucket){return {
   createSignedUrl:function(path,seconds){return result(async function(){
    var data=await authenticated('/storage/v1/object/sign/'+objectPath(bucket,path),'POST',{expiresIn:seconds});
    var u=data&&(data.signedURL||data.signedUrl);if(!u)throw error('Photo service did not return a signed image URL.');
    var url=/^https?:\/\//i.test(u)?u:u.startsWith('/storage/v1/')?api+u:api+'/storage/v1'+(u.startsWith('/')?'':'/')+u;
    return {signedUrl:url};
   });}
  };}}
 };
};
})();
