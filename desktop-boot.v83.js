/* V83: render the editor before loading remote sync; do not clear any local data. */
(function(){
'use strict';
var loading=null;
window.FitLoadSync=function(){
 if(window.supabase&&window.supabase.createClient)return Promise.resolve();
 if(loading)return loading;
 loading=new Promise(function(resolve,reject){
  var sources=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','https://unpkg.com/@supabase/supabase-js@2'],index=0;
  function next(){
   if(window.supabase&&window.supabase.createClient){resolve();return;}
   if(index===sources.length){reject(new Error('Sync could not load. Local editing still works. Check network access, then click Create Session to retry.'));return;}
   var s=document.createElement('script'),settled=false;s.src=sources[index++];s.async=true;
   var timer=setTimeout(fail,7000);
   function fail(){if(settled)return;settled=true;clearTimeout(timer);s.remove();next();}
   s.onerror=fail;s.onload=function(){if(settled)return;if(!window.supabase||!window.supabase.createClient){fail();return;}settled=true;clearTimeout(timer);resolve();};document.head.appendChild(s);
  }next();
 }).catch(function(e){loading=null;throw e;});
 return loading;
};
window.FitShowQR=function(src){document.getElementById('largeQRImage').src=src;document.getElementById('largeQRDialog').hidden=false;};
window.FitCopyPhoneLink=function(text){
 var field=document.getElementById('phoneLinkText'),status=document.getElementById('phoneLinkStatus');field.value=text;
 function fallback(){field.hidden=false;field.focus();field.select();status.textContent='Select and copy the complete private link. Do not post it publicly.';}
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){status.textContent='Private phone link copied. Open it in the phone browser.';},fallback);}else fallback();
};
window.addEventListener('keydown',function(e){if(e.key==='Escape'){var q=document.getElementById('largeQRDialog');if(q)q.hidden=true;}});
})();
