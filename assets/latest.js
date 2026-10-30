const cfg=window.SUGARY_SUPABASE||{};
const ready=cfg.url&&!cfg.url.includes('YOUR-PROJECT')&&cfg.publishableKey&&!cfg.publishableKey.includes('REPLACE_ME');
const supabase=(window.supabase&&ready)?window.supabase.createClient(cfg.url,cfg.publishableKey):null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ARROW='<svg class="ico-arrow" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
async function loadLatest(){
  const target=document.querySelector('[data-latest]');if(!target)return;
  let data=[];
  try{
    if(supabase){
      const r=await supabase.from('articles').select('slug,title,featured_image,category,publish_date,description').eq('status','published').order('publish_date',{ascending:false}).limit(3);
      if(r.error)throw r.error;data=r.data||[];
    }else{
      const r=await fetch('content/blog/index.json');if(!r.ok)throw new Error('no build');data=(await r.json()).map(p=>({...p,featured_image:p.image,publish_date:p.date})).slice(0,3);
    }
  }catch(e){console.error('Latest insights error:',e);}
  if(!data.length){
    target.innerHTML='<div class="latest-empty">No articles published yet. Once you publish from the Content Studio, the newest three show up here automatically. <a class="text-link" href="insights.html">Open insights '+ARROW+'</a></div>';
    return;
  }
  target.innerHTML=data.map(p=>`<a class="blog-card" href="articles/${encodeURIComponent(p.slug)}.html"><div class="blog-image">${p.featured_image?`<img src="${esc(p.featured_image)}" alt="${esc(p.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`:'✳'}</div><div class="blog-body"><small>${esc(p.category)} · ${esc(p.publish_date)}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="text-link">Read article ${ARROW}</span></div></a>`).join('');
}
loadLatest();
