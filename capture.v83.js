/* Fit Photo V83 phone capture. No third-party JavaScript, no desktop editor dependencies.
 * Existing Supabase auth/RPC/storage contracts only; no RLS bypass or schema changes.
 * Uses ES2017 syntax; deliberately avoids optional chaining, :has and replaceChildren.
 */
(function(){
'use strict';
var BUILD='V83-20260908-R1',API='https://qrtfvatqrtliluwtkkxg.supabase.co',KEY='sb_publishable_tSBEuKB56T01zCJZxIadtw_MD7t6S6N';
var AUTH_KEY='fitPhotoCaptureAuthV83',q=function(id){return document.getElementById(id);};
var queue=[],ready=false,joining=false,pumping=false,lastJob=null,sessionId='',sessionToken='',lastError='',connectionState='starting',joinSequence=0;
var auth=null,authPromise=null,storageAvailable=true;
var storage={get:function(k){try{return localStorage.getItem(k);}catch(e){storageAvailable=false;return null;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){storageAvailable=false;}},remove:function(k){try{localStorage.removeItem(k);}catch(e){storageAvailable=false;}}};
try{auth=JSON.parse(storage.get(AUTH_KEY)||'null');}catch(e){}
function parseLink(raw){
 var url;
 try{url=new URL(String(raw).trim().replace(/&amp;/gi,'&'),location.href);}catch(e){throw new Error('This is not a complete phone link.');}
 if(!/^https?:$/.test(url.protocol))throw new Error('Use the deployed HTTPS phone link, not an attachment or file preview.');
 if(url.origin!==location.origin)throw new Error('This link belongs to a different website. Open the complete link directly in your browser.');
 var p=new URLSearchParams(url.search),hash=new URLSearchParams(url.hash.replace(/^#\??/,''));
 var sid=hash.get('session')||p.get('session')||'',token=hash.get('token')||p.get('token')||'';
 if(!/^[a-zA-Z0-9_-]{4,80}$/.test(sid)||!/^[a-zA-Z0-9_-]{8,256}$/.test(token))throw new Error('The session or private token is missing. Scan the current QR or paste Copy Phone Link from the desktop.');
 return {id:sid,token:token};
}
function privateURL(){var url=new URL('capture.html',location.href);url.search='?v=83-20260908-r1';url.hash=sessionId&&sessionToken?'session='+encodeURIComponent(sessionId)+'&token='+encodeURIComponent(sessionToken):'';return url.href;}
function diagnostics(){var policy=document.permissionsPolicy||document.featurePolicy,allowed='unknown';try{if(policy&&policy.allowsFeature)allowed=String(policy.allowsFeature('camera'));}catch(e){}var text=[BUILD,'Session link: '+(sessionId&&sessionToken?'present':'missing'),'Connection: '+connectionState,'HTTPS / secure context: '+String(window.isSecureContext),'Browser camera API: '+String(!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)),'Camera policy: '+allowed,'Local storage available: '+String(storageAvailable),'Online hint: '+String(navigator.onLine),'Queued photos: '+queue.filter(function(j){return j.state!=='uploaded';}).length,'Browser: '+navigator.userAgent];if(lastError)text.push('Last error: '+lastError);q('diagnostics').textContent=text.join('\n');return text.join('\n');}
function errorText(e){var message=e&&e.message?e.message:String(e);if(sessionToken)message=message.split(sessionToken).join('[private token]');if(auth&&auth.access_token)message=message.split(auth.access_token).join('[access token]');if(auth&&auth.refresh_token)message=message.split(auth.refresh_token).join('[refresh token]');return message.slice(0,650);}
function connection(state,message){connectionState=state;q('connectionStatus').setAttribute('data-state',state);q('connectionStatus').textContent=message;diagnostics();}
function request(path,body,token,options){
 options=options||{};
 return new Promise(function(resolve,reject){
  var x=new XMLHttpRequest();x.open(options.method||'POST',API+path,true);x.timeout=options.timeout||18000;
  x.setRequestHeader('apikey',KEY);if(token)x.setRequestHeader('Authorization','Bearer '+token);
  x.setRequestHeader('Content-Type',options.mime||'application/json');
  if(options.headers)Object.keys(options.headers).forEach(function(k){x.setRequestHeader(k,options.headers[k]);});
  x.onload=function(){var result=null;try{result=x.responseText?JSON.parse(x.responseText):null;}catch(e){result=null;}
   if(x.status>=200&&x.status<300){resolve(result);return;}
   var err=new Error(result&&(result.msg||result.message||result.error_description||result.error)||'Service returned HTTP '+x.status);err.status=x.status;err.code=result&&(result.code||result.error_code)||'';reject(err);
  };
  x.onerror=function(){reject(new Error('Network request failed. Check this browser can reach the secure photo service.'));};
  x.ontimeout=function(){var e=new Error('Connection timed out. Capture/save originals, then use Reconnect.');e.code='timeout';reject(e);};
  x.onabort=function(){reject(new Error('Connection interrupted. Use Reconnect.'));};
  x.send(body instanceof Blob?body:body===null?null:JSON.stringify(body));
 });
}
async function accessToken(force){
 if(authPromise)return authPromise;
 if(auth&&!force&&auth.access_token&&Number(auth.expires_at)>Date.now()/1000+90)return auth.access_token;
 authPromise=(async function(){
  var result;
  if(auth&&auth.refresh_token){
   try{result=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token});}
   catch(e){if(e.status!==400&&e.status!==401)throw e;auth=null;storage.remove(AUTH_KEY);}
  }
  if(!result)result=await request('/auth/v1/signup',{data:{}});
  if(!result||!result.access_token)throw new Error('Anonymous sign-in returned no session. Check the existing service settings.');
  auth={access_token:result.access_token,refresh_token:result.refresh_token,expires_at:result.expires_at||Math.floor(Date.now()/1000)+(result.expires_in||3600),user:result.user};storage.set(AUTH_KEY,JSON.stringify(auth));return auth.access_token;
 })();
 try{return await authPromise;}finally{authPromise=null;}
}
async function api(path,body,options){
 var token=await accessToken(false);
 try{return await request(path,body,token,options);}
 catch(e){if(e.status!==401)throw e;token=await accessToken(true);return request(path,body,token,options);}
}
async function join(){
 if(joining)return;
 if(!sessionId||!sessionToken){connection('error','No complete session link. You can take and save photos locally, but cannot upload yet.');q('joinHelp').open=true;return;}
 if(!window.isSecureContext){connection('error','Secure upload requires your deployed HTTPS website. Local camera/file selection may still work.');return;}
 joining=true;ready=false;var seq=++joinSequence;q('mobileRetryJoin').disabled=true;connection('connecting','Connecting to session... Camera and Save Original remain available.');
 try{
  var result=await api('/rest/v1/rpc/join_fit_session',{p_session_id:sessionId,p_token:sessionToken});
  if(seq!==joinSequence)return;
  if(!result||result.ok===false)throw new Error(result&&result.message||'This session is invalid or ended. Scan a current QR code.');
  ready=true;lastError='';var label=typeof result==='object'&&(result.session_name||result.name)||sessionId;q('mobileSessionCode').textContent=label;
  storage.set('fitPhotoLastMobileUrl',privateURL());storage.set('fitPhotoLastMobileLabel',label);
  connection('connected','Connected. Photos will upload to this desktop session.');summary();void pump();
 }catch(e){if(seq===joinSequence){lastError=errorText(e);connection('error','Not connected: '+lastError+' You can still take and save originals.');}}
 finally{if(seq===joinSequence){joining=false;q('mobileRetryJoin').disabled=false;}diagnostics();}
}
function summary(){var uploaded=queue.filter(function(j){return j.state==='uploaded';}).length,failed=queue.filter(function(j){return j.state==='failed';}).length,waiting=queue.length-uploaded-failed;
 q('mobileUploadState').textContent=queue.length?uploaded+' uploaded / '+waiting+(ready?' pending':' waiting for connection')+(failed?' / '+failed+' failed - retry below':''):'No photos added.';
 q('mobileDone').hidden=!uploaded;q('mobileDone').textContent=uploaded+' photo(s) uploaded to the desktop session.';diagnostics();}
function select(job){lastJob=job;q('mobileSaveLastBtn').disabled=!job;q('mobileShareLastBtn').disabled=!job;q('mobilePreviewImg').hidden=!job;q('mobilePreviewPlaceholder').hidden=!!job;if(job)q('mobilePreviewImg').src=job.url;else q('mobilePreviewImg').removeAttribute('src');}
function renderJob(job){job.status.textContent=job.message;job.status.className='queueStatus '+(job.state==='uploaded'?'ok':job.state==='failed'?'err':'busy');job.retry.hidden=job.state!=='failed';job.remove.disabled=job.state==='uploading';}
function removeJob(job){if(job.state==='uploading')return;var i=queue.indexOf(job);if(i<0)return;queue.splice(i,1);job.row.parentNode.removeChild(job.row);URL.revokeObjectURL(job.url);if(lastJob===job)select(queue[queue.length-1]||null);summary();}
function button(text,action){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.onclick=action;return b;}
function addJob(file){
 var job={file:file,url:URL.createObjectURL(file),session:sessionId,state:'queued',message:ready?'Queued':'Waiting for connection - not uploaded',storageDone:false,metadataAttempted:false,path:null,blob:null};
 var row=document.createElement('div');row.className='queueItem';var im=document.createElement('img');im.src=job.url;im.alt='Original photo';im.onclick=function(){select(job);};var meta=document.createElement('div');meta.className='queueMeta';meta.textContent=(file.name||'Camera photo')+' ('+(file.size/1024/1024).toFixed(1)+' MB)';var status=document.createElement('span');meta.appendChild(status);var actions=document.createElement('div');actions.className='row';
 var save=button('Save Original',function(){showDownload(file,file.name||'camera-original.jpg');});
 var retry=button('Retry Upload',function(){if(job.state!=='failed')return;job.state='queued';job.message='Queued for retry';renderJob(job);if(!ready)void join();else void pump();});
 var remove=button('Remove',function(){if(job.state==='uploaded'||confirm('Remove this unsent photo? Save Original first to keep a copy.'))removeJob(job);});actions.appendChild(save);actions.appendChild(retry);actions.appendChild(remove);row.appendChild(im);row.appendChild(meta);row.appendChild(actions);q('uploadQueue').appendChild(row);
 job.row=row;job.status=status;job.retry=retry;job.remove=remove;queue.push(job);renderJob(job);select(job);
}
function enqueue(files){
 var total=queue.reduce(function(n,j){return n+j.file.size;},0),rejected=[];
 files.forEach(function(file){
  if(!file.size){rejected.push('This file is empty. Choose another image.');return;}
  if(file.size>100*1024*1024||queue.length>=100||total+file.size>150*1024*1024){rejected.push('Phone queue limit reached. Save/remove completed photos before adding more.');return;}
  if(file.type&&file.type.indexOf('image/')!==0){rejected.push('Choose an image file, not a video or document.');return;}
  addJob(file);total+=file.size;
 });summary();if(rejected.length){q('inputError').hidden=false;q('inputError').textContent=rejected.join(' ');}else q('inputError').hidden=true;if(ready)void pump();
}
function imageCanvas(source,max){var w=source.naturalWidth||source.width,h=source.naturalHeight||source.height;if(!w||!h)throw new Error('Photo has no readable pixels.');var sc=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*sc));c.height=Math.max(1,Math.round(h*sc));var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(source,0,0,c.width,c.height);return c;}
function blobFromCanvas(c,quality){return new Promise(function(resolve,reject){try{c.toBlob(function(b){if(b)resolve(b);else reject(new Error('Photo encoding failed. Save Original and choose JPG/PNG.'));},'image/jpeg',quality);}catch(e){reject(e);}});}
async function optimise(file){
 var canvas=null;
 if(window.createImageBitmap){try{var bitmap=await createImageBitmap(file);try{canvas=imageCanvas(bitmap,1800);}finally{if(bitmap.close)bitmap.close();}}catch(e){}}
 if(!canvas)canvas=await new Promise(function(resolve,reject){var im=new Image(),url=URL.createObjectURL(file),ended=false;var timer=setTimeout(function(){end(new Error('Image decoding timed out.'));},20000);function end(err){if(ended)return;ended=true;clearTimeout(timer);try{if(err)reject(err);else resolve(imageCanvas(im,1800));}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}}im.onload=function(){end();};im.onerror=function(){end(new Error('This browser cannot decode this image. Use JPG/PNG or convert HEIC with the device photo app.'));};im.src=url;});
 return blobFromCanvas(canvas,.82);
}
function randomHex(){var a=new Uint8Array(12);if(!window.crypto||!crypto.getRandomValues)throw new Error('Secure random generation unavailable. Use a supported HTTPS browser.');crypto.getRandomValues(a);return Array.prototype.map.call(a,function(v){return ('0'+v.toString(16)).slice(-2);}).join('');}
async function alreadyRegistered(job){var rows=await api('/rest/v1/rpc/get_fit_session_photos',{p_session_id:job.session});return Array.isArray(rows)&&rows.some(function(row){return row.photo_path===job.path;});}
async function pump(){
 if(pumping||!ready)return;pumping=true;
 try{
  while(ready){
   var job=queue.find(function(j){return j.state==='queued';});if(!job)break;
   if(!job.session||job.session!==sessionId){job.state='failed';job.message='Not uploaded: this photo belongs to a different or unassigned session. Save Original and add it to the intended session explicitly.';renderJob(job);continue;}
   job.state='uploading';job.message='Optimising...';renderJob(job);summary();
   try{
    if(!job.blob)job.blob=await optimise(job.file);
    q('mobileOptimiseStats').textContent='Latest: '+Math.round(job.file.size/1024)+' KB original / '+Math.round(job.blob.size/1024)+' KB upload.';
    if(!job.path)job.path=job.session+'/'+Date.now()+'_'+randomHex()+'.jpg';
    if(!job.storageDone){
     job.message='Uploading securely...';renderJob(job);
     try{await api('/storage/v1/object/fit-photos/'+job.path,job.blob,{mime:'image/jpeg',timeout:45000,headers:{'x-upsert':'false','cache-control':'3600'}});}
     catch(e){if(!((e.status===400||e.status===409)&&/already exists|asset exists|duplicate/i.test(e.message)))throw e;}
     job.storageDone=true;
    }
    job.message='Registering with the desktop session...';renderJob(job);
    var registered=false;
    if(job.metadataAttempted){try{registered=await alreadyRegistered(job);}catch(e){throw new Error('Could not verify the previous upload. Reconnect and retry to avoid duplicate photos.');}}
    if(!registered){job.metadataAttempted=true;await api('/rest/v1/fit_photos',{session_id:job.session,photo_path:job.path},{headers:{Prefer:'return=minimal'}});}
    job.state='uploaded';job.message='Uploaded. Original remains available below.';
   }catch(e){job.state='failed';job.message='Not uploaded: '+errorText(e)+' Save Original or Retry Upload.';lastError=errorText(e);if(e.status===401||e.status===403){ready=false;connection('error','Upload access was rejected. Reconnect to the current session; originals remain available.');}}
   renderJob(job);summary();
  }
 }finally{pumping=false;summary();}
}
// Native input events are always bound before any connection request.
['mobileCameraInput','mobilePhotoInput'].forEach(function(id){q(id).addEventListener('change',function(e){var files=Array.prototype.slice.call(e.target.files||[]);e.target.value='';if(files.length)enqueue(files);});});
q('mobileRetryJoin').onclick=function(){void join();};
q('joinLinkBtn').onclick=function(){
 try{var parsed=parseLink(q('joinLinkInput').value);if(pumping||joining)throw new Error('Finish the current connection or upload before changing session.');
  var unsent=queue.filter(function(j){return j.state!=='uploaded';});
  if(unsent.some(function(j){return j.session&&j.session!==parsed.id;}))throw new Error('Pending photos belong to another session. Save/remove them before connecting to a different session.');
  var unassigned=unsent.filter(function(j){return !j.session;});if(unassigned.length&&!confirm('Upload these '+unassigned.length+' unassigned photo(s) to session '+parsed.id+'?'))return;
  unassigned.forEach(function(j){j.session=parsed.id;j.state='queued';});sessionId=parsed.id;sessionToken=parsed.token;ready=false;q('mobileSessionCode').textContent=sessionId;q('joinLinkError').textContent='';q('joinLinkInput').value='';
  try{history.replaceState(null,'',privateURL());}catch(e){}void join();
 }catch(e){q('joinLinkError').textContent=errorText(e);}
};
function copy(text,fallback){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).catch(fallback);}else fallback();}
q('copyLinkBtn').onclick=function(){var value=privateURL();copy(value,function(){q('joinHelp').open=true;q('copyLinkFallback').hidden=false;q('copyLinkFallback').value=value;q('copyLinkFallback').focus();q('copyLinkFallback').select();});};
q('copyDiagnosticsBtn').onclick=function(){copy(diagnostics(),function(){var range=document.createRange();range.selectNodeContents(q('diagnostics'));var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);});};
// Download / native share: file prepared first, explicit user click invokes the browser API.
var downloadURL=null,downloadFile=null,downloadName='',retired=[];
function safeName(v){return String(v||'camera-original.jpg').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,150);}
function closeDownload(){q('downloadDialog').hidden=true;if(downloadURL){var old=downloadURL;retired.push(old);setTimeout(function(){URL.revokeObjectURL(old);},90000);}downloadURL=null;downloadFile=null;q('downloadPreviewImage').removeAttribute('src');}
function showDownload(file,name){closeDownload();downloadFile=file;downloadName=safeName(name);downloadURL=URL.createObjectURL(file);q('downloadFilename').value=downloadName;q('readyDownloadLink').href=downloadURL;q('readyDownloadLink').download=downloadName;q('openPreviewLink').href=downloadURL;q('downloadPreviewImage').src=downloadURL;q('downloadPreviewImage').hidden=false;q('downloadProgressText').textContent='File ready. Choose Download, Open Preview or Share below.';var can=false;try{can=!!navigator.share&&(!navigator.canShare||navigator.canShare({files:[new File([file],downloadName,{type:file.type})]}));}catch(e){}q('readyShareBtn').hidden=!can;q('downloadDialog').hidden=false;q('downloadCloseBtn').focus();}
q('downloadCloseBtn').onclick=closeDownload;q('mobileSaveLastBtn').onclick=q('mobileShareLastBtn').onclick=function(){if(lastJob)showDownload(lastJob.file,lastJob.file.name||'camera-original.jpg');};
q('downloadFilename').oninput=function(){var ext=downloadName.match(/\.[a-z0-9]+$/i),name=safeName(q('downloadFilename').value);if(ext&&!name.toLowerCase().endsWith(ext[0].toLowerCase()))name+=ext[0];q('readyDownloadLink').download=name;};
q('readyDownloadLink').onclick=function(){q('downloadFilename').oninput();q('downloadProgressText').textContent='Download requested. Check Downloads / Files. This page cannot confirm that your device saved it.';};
q('readyShareBtn').onclick=function(){if(!downloadFile)return;q('downloadFilename').oninput();try{var f=new File([downloadFile],q('readyDownloadLink').download,{type:downloadFile.type});Promise.resolve(navigator.share({files:[f],title:f.name})).then(function(){q('downloadProgressText').textContent='File passed to the share service.';},function(e){q('downloadProgressText').textContent=e.name==='AbortError'?'Share cancelled. The original is still ready.':'Sharing blocked. Use Download or Open Preview.';});}catch(e){q('downloadProgressText').textContent='Sharing unavailable. Use Download or Open Preview.';}};
// Browser camera is an explicit alternative to the native camera input.
var stream=null,cameraSequence=0,cameraBusy=false;
function stop(s){if(s&&s.getTracks)s.getTracks().forEach(function(t){t.stop();});}
function closeCamera(){cameraSequence++;stop(stream);stream=null;q('cameraVideo').srcObject=null;q('cameraDialog').hidden=true;q('cameraCaptureBtn').disabled=true;}
function cameraError(e){var map={NotAllowedError:'Camera access was denied or blocked by this browser/app/company policy. Allow access or use your approved phone browser.',NotFoundError:'No camera was found. Use Take Photo or Choose Photos.',NotReadableError:'Camera is busy. Close other camera apps and retry.',OverconstrainedError:'This camera configuration is unavailable. Use Take Photo instead.'};return map[e.name]||errorText(e);}
async function openCamera(){
 closeCamera();var seq=++cameraSequence;q('cameraDialog').hidden=false;q('cameraStatus').textContent='Allow camera access in the browser prompt.';
 if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){q('cameraStatus').textContent='Browser camera needs a supported HTTPS browser. Try Take Photo or Choose Photos; in-app browsers may block camera access.';return;}
 var timer=setTimeout(function(){if(seq===cameraSequence){cameraSequence++;stop(stream);stream=null;q('cameraVideo').srcObject=null;q('cameraStatus').textContent='Camera permission or preview is pending. Allow access, then close and retry.';}},20000);
 try{
  var s;
  try{s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1440}}});}
  catch(e){if(e.name!=='OverconstrainedError')throw e;s=await navigator.mediaDevices.getUserMedia({audio:false,video:true});}
  if(seq!==cameraSequence){clearTimeout(timer);stop(s);return;}stream=s;var v=q('cameraVideo');v.srcObject=s;await v.play();clearTimeout(timer);if(seq!==cameraSequence)return;q('cameraCaptureBtn').disabled=false;q('cameraStatus').textContent='Position the sample, then tap Capture.';
 }catch(e){clearTimeout(timer);if(seq===cameraSequence){stop(stream);stream=null;q('cameraStatus').textContent=cameraError(e);lastError=cameraError(e);diagnostics();}}
}
q('mobileBrowserCameraBtn').onclick=function(){void openCamera();};q('cameraCloseBtn').onclick=closeCamera;
q('cameraCaptureBtn').onclick=async function(){if(cameraBusy||!stream)return;var v=q('cameraVideo');if(!v.videoWidth){q('cameraStatus').textContent='Camera is not ready yet.';return;}cameraBusy=true;q('cameraCaptureBtn').disabled=true;var seq=cameraSequence;
 try{var c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);var b=await blobFromCanvas(c,.94);if(seq!==cameraSequence)return;closeCamera();enqueue([new File([b],'camera-'+Date.now()+'.jpg',{type:'image/jpeg'})]);}catch(e){q('cameraStatus').textContent=cameraError(e);}finally{cameraBusy=false;if(stream)q('cameraCaptureBtn').disabled=false;}
};
window.addEventListener('beforeunload',function(e){if(queue.some(function(j){return j.state!=='uploaded';})){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',function(e){closeCamera();if(!e.persisted){queue.forEach(function(j){URL.revokeObjectURL(j.url);});if(downloadURL)URL.revokeObjectURL(downloadURL);retired.forEach(function(u){URL.revokeObjectURL(u);});}});
document.addEventListener('visibilitychange',function(){if(document.hidden&&stream)closeCamera();});
window.addEventListener('online',function(){if(!ready&&!joining)void join();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!q('cameraDialog').hidden)closeCamera();else closeDownload();}});
q('embeddedNotice').hidden=!(/; wv\)|\bwv\b|MicroMessenger|FBAN|FBAV|Instagram|Line\/|Teams\//i.test(navigator.userAgent));
try{var parsed=parseLink(location.href);sessionId=parsed.id;sessionToken=parsed.token;q('mobileSessionCode').textContent=sessionId;}catch(e){lastError=errorText(e);}
window.FitCaptureReady=true;
// Read-only diagnostics; no token or photo bytes exposed here.
window.FitCapture=Object.freeze({build:BUILD,diagnostics:diagnostics,status:function(){return {ready:ready,joining:joining,pumping:pumping,connection:connectionState,queued:queue.length,uploaded:queue.filter(function(j){return j.state==='uploaded';}).length};}});
void join();
})();
