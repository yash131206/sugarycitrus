/* Loads the Supabase library and config lazily, after the page has painted. */
(function(){
  var promise=null;
  function load(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  window.getSupabase=function(){
    if(promise)return promise;
    promise=(async function(){
      try{
        if(!window.SUGARY_SUPABASE)await load('assets/supabase-public-config.js?v=3.6');
        var cfg=window.SUGARY_SUPABASE||{};
        var ready=cfg.url&&cfg.url.indexOf('YOUR-PROJECT')<0&&cfg.publishableKey&&cfg.publishableKey.indexOf('REPLACE_ME')<0;
        if(!ready)return null;
        if(!window.supabase)await load('assets/vendor/supabase.js?v=3.6');
        if(!window.supabase)return null;
        return window.supabase.createClient(cfg.url,cfg.publishableKey);
      }catch(e){console.error('Supabase could not load:',e);return null;}
    })();
    return promise;
  };
  // start the download once the page is idle, so it never blocks first paint
  var kick=function(){setTimeout(function(){window.getSupabase();},1200);};
  if(document.readyState==='complete')kick();else window.addEventListener('load',kick);
})();
