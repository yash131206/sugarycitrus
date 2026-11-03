const supabase=await window.getSupabase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ARROW='<svg class="ico-arrow" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

function srcset(url){
  const m=String(url||'').match(/^(.*)-1600\.(jpg|jpeg|png|webp)$/i);
  if(!m)return '';
  const ext=m[2];
  return `${m[1]}-480.${ext} 480w, ${m[1]}-900.${ext} 900w, ${m[1]}-1600.${ext} 1600w`;
}
function media(url,title,sizes){
  if(!url)return '<div class="post-media post-media--empty" aria-hidden="true"><span><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/></svg></span></div>';
  const ss=srcset(url);
  const dims=ss?' width="1600" height="900"':'';
  return `<div class="post-media"><img src="${esc(url)}"${ss?` srcset="${esc(ss)}" sizes="${sizes}"`:''}${dims} alt="${esc(title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentNode.classList.add('post-media--empty');this.parentNode.innerHTML='<span><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/></svg></span>'"></div>`;
}
function readTime(body){
  const words=String(body||'').trim().split(/\s+/).length;
  return Math.max(2,Math.round(words/200));
}
function meta(p){
  return `<div class="post-meta"><span class="pill">${esc(p.category||'Insight')}</span><time datetime="${esc(p.publish_date||'')}">${esc(p.publish_date||'')}</time><span>${readTime(p.body)} min read</span></div>`;
}
function card(p){
  return `<a class="blog-card" href="articles/${encodeURIComponent(p.slug)}">${media(p.featured_image,p.title,'(max-width:560px) 100vw, (max-width:1080px) 50vw, 33vw')}<div class="blog-body">${meta(p)}<h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="btn-outline btn-outline--sm">Read article ${ARROW}</span></div></a>`;
}
function featured(p){
  return `<a class="post-card--featured" href="articles/${encodeURIComponent(p.slug)}">${media(p.featured_image,p.title,'(max-width:850px) 100vw, 50vw')}<div class="post-body">${meta(p)}<h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><span class="btn-outline">Read article ${ARROW}</span></div></a>`;
}

async function loadPosts(){
  const target=document.getElementById('posts');
  if(!target)return;
  let data=[];
  try{
    if(supabase){
      const r=await supabase.from('articles').select('slug,title,featured_image,category,publish_date,description,body').eq('status','published').order('publish_date',{ascending:false});
      if(r.error)throw r.error;
      data=r.data||[];
    }else{
      const r=await fetch('content/blog/index.json');
      if(!r.ok)throw new Error('no build');
      data=(await r.json()).map(p=>({...p,featured_image:p.image,publish_date:p.date}));
    }
  }catch(e){console.error('Insights load error:',e);}

  if(!data.length){
    target.innerHTML='<div class="latest-empty"><strong>No articles yet.</strong> The first one is being written. Meanwhile, here is what we do: <a class="text-link" href="services">see the services '+ARROW+'</a></div>';
    return;
  }
  const [first,...rest]=data;
  target.innerHTML=featured(first)+(rest.length?`<div class="blog-grid blog-grid--posts">${rest.map(card).join('')}</div>`:'');
}
loadPosts();
