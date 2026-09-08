/* V84: same-origin transport only. The session form never waits for this loader. */
(function(){
'use strict';
var loading=null,script=document.currentScript;
var transportUrl=script&&script.src?new URL('sync-client.v84.js',script.src).href:'assets/sync-client.v84.js';
function factory(){
 // Retain compatibility with an already supplied SDK; otherwise use the packaged REST transport.
 if(window.supabase&&window.supabase.createClient)return window.supabase.createClient.bind(window.supabase);
 return window.FitCreateSyncClient||null;
}
window.FitLoadSync=function(){
 if(factory())return Promise.resolve(factory());
 if(loading)return loading;
 loading=new Promise(function(resolve,reject){
  var s=document.createElement('script'),settled=false;s.src=transportUrl;s.async=true;
  var timer=setTimeout(fail,8000);
  function fail(){if(settled)return;settled=true;clearTimeout(timer);s.remove();reject(new Error('The local sync component is missing or could not load. Deploy index.html, capture.html and the entire assets folder together, then Retry Connection. Session name/PIN fields and local editing remain available.'));}
  s.onerror=fail;s.onload=function(){if(settled)return;if(!factory()){fail();return;}settled=true;clearTimeout(timer);resolve(factory());};document.head.appendChild(s);
 }).catch(function(e){loading=null;throw e;});return loading;
};
window.FitShowQR=function(src){document.getElementById('largeQRImage').src=src;document.getElementById('largeQRDialog').hidden=false;};
window.FitCopyPhoneLink=function(text){
 var field=document.getElementById('phoneLinkText'),status=document.getElementById('phoneLinkStatus');field.value=text;
 function fallback(){field.hidden=false;field.focus();field.select();status.textContent='Select and copy the complete private link. Do not post it publicly.';}
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){status.textContent='Private phone link copied. Open it in the phone browser.';},fallback);}else fallback();
};
window.addEventListener('keydown',function(e){if(e.key==='Escape'){var q=document.getElementById('largeQRDialog');if(q)q.hidden=true;}});
})();
