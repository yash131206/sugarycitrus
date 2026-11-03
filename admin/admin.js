(async () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.SUGARY_SUPABASE || {};
  const configured = cfg.url && !cfg.url.includes('YOUR-PROJECT') && cfg.publishableKey && !cfg.publishableKey.includes('REPLACE_ME');
  const supabase = (window.supabase && configured) ? window.supabase.createClient(cfg.url, cfg.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  let viewStats = {};
let fbStats = {};
let reviewList = [];
  let posts = [], currentUser = null, toastTimer;
  const toast = (message, bad=false) => { const el=$('toast'); el.textContent=message; el.classList.toggle('error',bad); el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3600); };
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slugify = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'article';
  const setView = name => { ['Overview','Articles','Editor'].forEach(v=>$('view'+v).classList.toggle('hidden',v.toLowerCase()!==name)); document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name)); $('pageTitle').innerHTML=(name==='editor'?'Content editor':name[0].toUpperCase()+name.slice(1))+'<span>.</span>'; if(name==='articles'||name==='overview') refresh(); };
  async function isAdmin(user){ const {data,error}=await supabase.from('cms_admins').select('user_id').eq('user_id',user.id).maybeSingle(); if(error) throw error; return !!data; }
  async function enter(user){ try { if(!await isAdmin(user)){ await supabase.auth.signOut(); $('loginMessage').textContent='This account does not have CMS administrator access.'; return; } currentUser=user; $('loginScreen').classList.add('hidden'); $('appShell').classList.remove('hidden'); await refresh(); } catch(e){ $('loginMessage').textContent='CMS access check failed: '+e.message; } }
  async function triggerRebuild(){ try { const {data:{session}}=await supabase.auth.getSession(); if(!session?.access_token)return; const r=await fetch('/api/rebuild',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}}); if(!r.ok){const body=await r.json().catch(()=>({})); toast('Article saved. Static article page is generated on the next build (npm run build).');return;} toast('Website rebuild requested.'); } catch { toast('Article saved. Static article page is generated on the next build (npm run build).'); } }
  async function refresh(){ if(!currentUser)return; const {data,error}=await supabase.from('articles').select('*').order('updated_at',{ascending:false}); if(error){toast('Could not load articles: '+error.message,true);return;} posts=data||[]; try{const {data:st}=await supabase.from('article_stats').select('slug,views'); viewStats={}; (st||[]).forEach(r=>viewStats[r.slug]=Number(r.views)||0);}catch(e){viewStats={};}
  try{const {data:fb}=await supabase.from('article_feedback').select('slug,helpful,not_helpful'); fbStats={}; (fb||[]).forEach(r=>fbStats[r.slug]=r);}catch(e){fbStats={};}
  try{const {data:rv}=await supabase.from('article_reviews').select('slug,body,name,created_at').order('created_at',{ascending:false}); reviewList=rv||[];}catch(e){reviewList=[];} const published=posts.filter(p=>p.status==='published').length; $('totalCount').textContent=posts.length; $('publishedCount').textContent=published; $('draftCount').textContent=posts.length-published; $('recentList').innerHTML=renderList(posts.slice(0,5)); $('articleList').innerHTML=renderList(posts); }
  
  function fbLine(slug){
    const f = fbStats[slug] || {helpful:0, not_helpful:0};
    const reviews = reviewList.filter(r=>r.slug===slug);
    const bits = [];
    if (f.helpful || f.not_helpful) bits.push(`${f.helpful||0} helpful · ${f.not_helpful||0} not`);
    if (reviews.length) bits.push(`<button class="ghost linkish" data-reviews="${esc(slug)}">${reviews.length} review${reviews.length===1?'':'s'}</button>`);
    return bits.length ? ' · ' + bits.join(' · ') : '';
  }
  function reviewBlock(slug){
    const reviews = reviewList.filter(r=>r.slug===slug);
    if (!reviews.length) return '';
    return `<div class="review-panel hidden" data-panel="${esc(slug)}">` + reviews.map(r =>
      `<div class="review-item"><p>${esc(r.body)}</p><span>${esc(r.name||'Anonymous')} · ${esc((r.created_at||'').slice(0,10))}</span></div>`).join('') + '</div>';
  }
  function renderList(items){ if(!items.length)return '<div class="empty">No articles yet. Create your first one.</div>'; return items.map(p=>`<article class="post-item"><div><h3>${esc(p.title)}</h3><p>${esc(p.category)} · ${esc(p.publish_date)} · <span class="pill ${p.status}">${p.status==='published'?'Published':'Draft'}</span> · ${(viewStats[p.slug]||0).toLocaleString('en-IN')} views${fbLine(p.slug)}</p>${reviewBlock(p.slug)}</div><div class="post-tools"><button class="ghost" data-edit="${p.id}">Edit</button><button class="ghost" data-toggle="${p.id}">${p.status==='published'?'Unpublish':'Publish'}</button><button class="ghost danger" data-delete="${p.id}">Delete</button></div></article>`).join(''); }
  function reset(){ $('postForm').reset(); $('postId').value=''; $('author').value='Sugary Citrus'; $('status').value='draft'; $('editorHeading').textContent='Create an article'; $('saveState').textContent='Cloud CMS · Ready'; $('imagePreview').classList.add('hidden'); $('preview').classList.add('hidden'); }
  function fill(p){ $('postId').value=p.id; ['title','category','author','description','body'].forEach(k=>$(k).value=p[k]||''); $('image').value=p.featured_image||'';if($('audio'))$('audio').value=p.audio_url||''; $('date').value=p.publish_date||''; $('status').value=p.status||'draft'; $('editorHeading').textContent='Edit article'; if(p.featured_image){$('imagePreview').src=p.featured_image;$('imagePreview').classList.remove('hidden')}else $('imagePreview').classList.add('hidden'); setView('editor'); }
  function formData(){const title=$('title').value.trim();const existing=$('postId').value?posts.find(x=>x.id===$('postId').value):null;const slug=existing&&existing.slug?existing.slug:slugify(title);return {slug,title,featured_image:$('image').value.trim(),audio_url:($('audio')?$('audio').value.trim():''),category:$('category').value.trim(),author:$('author').value.trim(),publish_date:$('date').value,description:$('description').value.trim(),body:$('body').value.trim(),status:$('status').value,created_by:currentUser.id};}
  $('loginForm').addEventListener('submit',async e=>{e.preventDefault();
    if(!supabase){$('loginMessage').textContent='Supabase config missing: add your project URL and publishable key in admin/supabase-config.js.';return;}
    $('loginMessage').textContent='Signing in…';
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
      if(error){$('loginMessage').textContent=error.message||'Sign-in failed.';return;}
      await enter(data.user);
    }catch(err){
      $('loginMessage').textContent='Network error: this browser could not reach Supabase ('+(err&&err.message?err.message:'request blocked')+'). Check your internet or firewall, then reload.';
    }
  });
  if(!window.supabase){$('loginMessage').textContent='Admin library failed to load. Reload the page; if it repeats, tell the site owner (build v3.2).';}
  else if(!supabase){$('loginMessage').textContent='Supabase config missing in admin/supabase-config.js (build v3.2).';}
  else{fetch(cfg.url.replace(/\/$/,'')+'/auth/v1/health',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);$('loginMessage').textContent='Connected. Sign in to continue. (v3.2)';}).catch(()=>{$('loginMessage').textContent='Cannot reach Supabase from this browser. A network, firewall or ad-blocker is blocking '+cfg.url+' (build v3.2).';});}
  $('logoutBtn').onclick=async()=>{await supabase.auth.signOut();currentUser=null;$('appShell').classList.add('hidden');$('loginScreen').classList.remove('hidden');};
  document.querySelectorAll('[data-view],[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view||b.dataset.go)));
  $('postForm').addEventListener('submit',async e=>{e.preventDefault();const p=formData();const previous=posts.find(x=>x.id===$('postId').value);const needsRebuild=p.status==='published'||previous?.status==='published';$('saveButton').disabled=true;$('saveState').textContent='Saving to cloud…';let result; if($('postId').value){const {created_by,...updates}=p;result=await supabase.from('articles').update(updates).eq('id',$('postId').value).select().single();}else result=await supabase.from('articles').insert(p).select().single();$('saveButton').disabled=false;if(result.error){$('saveState').textContent='Save failed';toast(result.error.message,true);return;} $('postId').value=result.data.id;$('saveState').textContent='Saved securely · '+new Date().toLocaleTimeString();$('editorHeading').textContent='Edit article';toast(p.status==='published'?'Article published.':'Draft saved.');await refresh();if(needsRebuild)await triggerRebuild();});
  $('resetForm').onclick=reset;
  $('image').addEventListener('input',()=>{const v=$('image').value.trim();if(v){$('imagePreview').src=v;$('imagePreview').classList.remove('hidden')}else $('imagePreview').classList.add('hidden')});
  $('imageFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024){toast('Image must be 5 MB or smaller.',true);return;}if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)){toast('Use JPG, PNG, WebP or AVIF.',true);return;}const path=`featured/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;toast('Uploading image…');const {error}=await supabase.storage.from('cms-images').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});

$('audioFile') && $('audioFile').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    toast('Uploading audio…');
    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
    const path = `audio/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
    const { error } = await supabase.storage.from('cms-audio').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || 'audio/mpeg' });
    if (error) throw error;
    const { data } = supabase.storage.from('cms-audio').getPublicUrl(path);
    $('audio').value = data.publicUrl;
    toast('Audio uploaded');
  } catch (err) {
    toast('Audio upload failed: ' + err.message, true);
  }
});if(error){toast('Upload failed: '+error.message,true);return;}const {data}=supabase.storage.from('cms-images').getPublicUrl(path);$('image').value=data.publicUrl;$('imagePreview').src=data.publicUrl;$('imagePreview').classList.remove('hidden');toast('Featured image uploaded.');e.target.value='';});
  $('previewPost').onclick=()=>{const p=formData();$('previewContent').innerHTML=`${p.featured_image?`<img class="hero-image" src="${esc(p.featured_image)}" alt="">`:''}<div class="eyebrow">${esc(p.category)} · ${esc(p.publish_date)}</div><h1>${esc(p.title||'Article title')}</h1><p>${esc(p.description)}</p><pre class="markdown-preview">${esc(p.body)}</pre>`;$('preview').classList.remove('hidden');}; $('closePreview').onclick=()=>$('preview').classList.add('hidden');
  document.addEventListener('click',e=>{const rv=e.target.closest('[data-reviews]');if(rv){const pn=document.querySelector(`[data-panel="${rv.dataset.reviews}"]`);if(pn){pn.classList.toggle('hidden');}return;}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-edit],[data-toggle],[data-delete]');if(!b)return;const id=b.dataset.edit||b.dataset.toggle||b.dataset.delete;const p=posts.find(x=>x.id===id);if(!p)return;if(b.dataset.edit){fill(p);return;}if(b.dataset.toggle){const status=p.status==='published'?'draft':'published';const {error}=await supabase.from('articles').update({status}).eq('id',id);if(error)toast(error.message,true);else{toast(status==='published'?'Article published.':'Article moved to drafts.');await refresh();await triggerRebuild();}}if(b.dataset.delete&&confirm(`Permanently delete “${p.title}”?`)){const {error}=await supabase.from('articles').delete().eq('id',id);if(error)toast(error.message,true);else{toast('Article deleted.');await refresh();if(p.status==='published')await triggerRebuild();}}});
  const statusSel=$('status'), saveBtn=$('saveButton');
  if(statusSel&&saveBtn){const label=()=>{saveBtn.textContent=statusSel.value==='published'?'Publish article':'Save draft';};statusSel.addEventListener('change',label);label();}
  $('year').textContent=new Date().getFullYear();
  if(!configured){$('loginMessage').textContent='CMS backend not connected yet. Add your Supabase project URL and publishable key in admin/supabase-config.js.';}else{const {data:{session}}=await supabase.auth.getSession();if(session?.user)await enter(session.user);supabase.auth.onAuthStateChange((_event,session)=>{if(!session){currentUser=null;$('appShell').classList.add('hidden');$('loginScreen').classList.remove('hidden');}});}
})();
