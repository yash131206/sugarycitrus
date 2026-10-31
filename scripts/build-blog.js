const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const source = path.join(root, 'content/blog/posts');
const output = path.join(root, 'content/blog');
const articlesDir = path.join(root, 'articles');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(articlesDir, { recursive: true });
const HEADER=`<div class="nav-wrap"><nav class="nav"><a class="brand" href=".././"><span class="brand-mark" aria-hidden="true"></span><span class="brand-word">Sugary <em>Citrus</em></span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button><div class="nav-links"><a class="" href=".././">Home</a><a class="" href="../about">About</a><a class="" href="../services">Services</a><a class="" href="../insights">Articles</a><a href="../contact">Contact</a></div><button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false"><svg class="i-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button><a class="nav-cta" href="../contact">Let's talk <span><svg class="ico-arrow" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a></nav></div>`;
const FOOTER=`<footer class="footer"><div class="footer-card"><div class="footer-top"><div class="footer-brand"><div class="eyebrow footer-eyebrow">Make your next move count</div><div class="footer-title">Let's make something <em>move.</em></div></div><div class="footer-cols"><div class="footer-col"><h4>Services</h4><a href="../performance-marketing">Performance marketing</a><a href="../google-ads">Google Ads</a><a href="../creative-strategy">Creative & UGC</a><a href="../seo-organic-growth">SEO / AEO / GEO</a><a href="../services">All services</a></div><div class="footer-col"><h4>Company</h4><a href="../about">About</a><a href="../insights">Articles</a><a href="../case-studies">Case studies</a><a href="../faq">FAQs</a><a href="../contact">Contact</a></div><div class="footer-col"><h4>Connect</h4><a href="../https://www.instagram.com/sugarycitrus.co/" target="_blank" rel="noopener">Instagram <svg class="ico-arrow" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a><a href="../contact">Email us</a></div></div></div><div class="footer-bottom"><span>© <span data-year></span> Sugary Citrus</span><a class="footer-tagline" href=".././">Sweet Strategy. Sharp Execution.</a></div></div></footer>`;
const srcsetOf = u => { const m = String(u||'').match(/^(.*)-1600\.(jpg|jpeg|png|webp)$/i); return m ? `${m[1]}-480.${m[2]} 480w, ${m[1]}-900.${m[2]} 900w, ${m[1]}-1600.${m[2]} 1600w` : u; };

function fmtDate(d){
  if(!d) return '';
  const dt = new Date(d);
  if(isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function readMins(body){
  const words = String(body||'').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words/200));
}
function audioBlockFor(url, title){
  if(!url) return '';
  return `<div class="audio-card"><div class="audio-label"><b>Listen to this article</b><span>Audio version</span></div><audio controls preload="none" src="${esc(url)}">Your browser does not support audio.</audio></div>`;
}


function faqToCards(html){
  const i = html.search(/<h2[^>]*>\s*FAQ/i);
  if(i === -1) return html;
  const head = html.slice(0, i);
  const tail = html.slice(i).replace(
    /<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>/gs,
    (m,q,a)=>`<details class="faq-card"><summary><span>${q}</span><svg class="faq-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="faq-answer"><p>${a}</p></div></details>`
  );
  return head + tail;
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'article';
function parseMarkdownFile(raw, file) {
  let front = {}, body = raw;
  if (raw.startsWith('---\n')) {
    const end = raw.indexOf('\n---', 4);
    if (end >= 0) {
      const yaml = raw.slice(4, end);
      for (const line of yaml.split(/\r?\n/)) {
        const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
        if (m) front[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
      }
      body = raw.slice(end + 4).trim();
    }
  }
  return { slug: slugify(path.basename(file, '.md')), title: front.title || path.basename(file, '.md'), image: front.featured_image || '', category: front.category || 'Insight', author: front.author || 'Sugary Citrus', date: front.publish_date || '', description: front.description || '', body };
}
function markdownToHtml(src='') {
  const lines=String(src).split(/\r?\n/);let out='',para=[],list=false;
  const flush=()=>{if(para.length){out+=`<p>${para.map(esc).join('<br>')}</p>`;para=[];}};
  for(const line of lines){if(/^#{1,3}\s/.test(line)){flush();if(list){out+='</ul>';list=false;}const n=line.match(/^#+/)[0].length;out+=`<h${n}>${esc(line.replace(/^#{1,3}\s/,''))}</h${n}>`;}else if(/^[-*]\s/.test(line)){flush();if(!list){out+='<ul>';list=true;}out+=`<li>${esc(line.replace(/^[-*]\s/,''))}</li>`;}else if(!line.trim()){flush();if(list){out+='</ul>';list=false;}}else para.push(line);}
  flush();if(list)out+='</ul>';return out;
}
async function getPublishedFromSupabase() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const endpoint = `${url.replace(/\/$/,'')}/rest/v1/articles?select=slug,title,featured_image,category,author,publish_date,description,body&status=eq.published&order=publish_date.desc`;
  const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Supabase content fetch failed (${response.status}): ${await response.text()}`);
  return response.json();
}
async function main() {
  let rows = await getPublishedFromSupabase();
  let posts = rows ? rows.map(row => ({slug:slugify(row.slug||row.title),title:row.title,image:row.featured_image||'',category:row.category||'Insight',author:row.author||'Sugary Citrus',date:row.publish_date||'',description:row.description||'',body:row.body||''})) : [];
  if (!rows) { const files=fs.existsSync(source)?fs.readdirSync(source).filter(f=>f.endsWith('.md') && f.toLowerCase() !== 'readme.md'):[]; posts=files.map(f=>parseMarkdownFile(fs.readFileSync(path.join(source,f),'utf8'),f)); }
  posts.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const index=[];
  for(const post of posts){
    const html=faqToCards(markdownToHtml(post.body));const jsonPost={...post,html};
    fs.writeFileSync(path.join(output,`${post.slug}.json`),JSON.stringify(jsonPost,null,2));
    index.push({slug:post.slug,title:post.title,image:post.image,category:post.category,author:post.author,date:post.date,description:post.description});
    const schema={'@context':'https://schema.org','@type':'Article',headline:post.title,description:post.description,image:post.image||undefined,datePublished:post.date||undefined,author:{'@type':'Organization',name:post.author},publisher:{'@type':'Organization',name:'Sugary Citrus'}};
    const faqs=[];const faqBlock=post.body.split(/\n##\s+FAQ\s*\n/i)[1];if(faqBlock){const parts=faqBlock.split(/\n###\s+/).slice(1);for(const part of parts){const lines=part.split(/\n/);const q=lines.shift().trim();const a=lines.join(' ').replace(/\s+/g,' ').trim();if(q&&a)faqs.push({q,a});}}
    const faqSchema=faqs.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))}:null;
    const base=process.env.SITE_URL?process.env.SITE_URL.replace(/\/$/,''):'';
    const breadcrumb=base?{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:base+'/'},{'@type':'ListItem',position:2,name:'Articles',item:base+'/insights'},{'@type':'ListItem',position:3,name:post.title,item:`${base}/articles/${post.slug}`}]}:null;
    const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>(function(){try{var s=localStorage.getItem("theme");var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",s||(d?"dark":"light"));}catch(e){}})();</script><title>${esc(post.title)} | Sugary Citrus</title><meta name="description" content="${esc(post.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="article"><meta property="og:site_name" content="Sugary Citrus"><meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(post.description)}">${post.image?`<meta property="og:image" content="${esc(post.image)}">`:''}<meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="../assets/styles.css?v=11.0"><link rel="icon" href="../assets/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../assets/apple-touch-icon.png"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>${faqSchema?`<script type="application/ld+json">${JSON.stringify(faqSchema).replace(/</g,'\\u003c')}</script>`:''}${breadcrumb?`<script type="application/ld+json">${JSON.stringify(breadcrumb).replace(/</g,'\\u003c')}</script>`:''}${base?`<link rel="canonical" href="${base}/articles/${post.slug}">`:''}</head><body>${HEADER}<main class="content-section"><article class="container article"><div class="eyebrow">${esc(post.category)}</div><h1>${esc(post.title)}</h1><div class="article-meta"><time datetime="${esc(post.date||'')}">${fmtDate(post.date)}</time><span class="sep">·</span><span>${readMins(post.body)} min read</span></div><p class="intro">${esc(post.description)}</p>${audioBlockFor(post.audio_url||'', post.title)}${post.image?`<figure class="article-hero"><img src="${esc(post.image)}" srcset="${esc(srcsetOf(post.image))}" sizes="(max-width:780px) 100vw, 780px" alt="${esc(post.title)}" width="1600" height="900" decoding="async"></figure>`:''}<div class="article-body">${html}</div></article></main>${FOOTER}<script src="../assets/content.js?v=11.0"></script><script src="../assets/render.js?v=11.0"></script><script src="../assets/supabase-public-config.js?v=11.0"></script><script src="../assets/article-audio.js?v=11.0"></script><script src="../assets/audio-player.js?v=11.0"></script><script src="../assets/site.js?v=11.0"></script></body></html>`;
    fs.writeFileSync(path.join(articlesDir,`${post.slug}.html`),page);
  }
  fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(index,null,2));
  const jsonKeep=new Set(posts.map(p=>`${p.slug}.json`).concat(['index.json']));for(const file of fs.readdirSync(output))if(file.endsWith('.json')&&!jsonKeep.has(file))fs.unlinkSync(path.join(output,file));
  const keep=new Set(posts.map(p=>`${p.slug}.html`));for(const file of fs.readdirSync(articlesDir))if(file.endsWith('.html')&&!keep.has(file))fs.unlinkSync(path.join(articlesDir,file));
  if(process.env.SITE_URL){const base=process.env.SITE_URL.replace(/\/$/,'');const paths=['','about','services','performance-marketing','google-ads','creative-strategy','seo-organic-growth','case-studies','insights','faq','contact'];const urls=[...paths.map(p=>`${base}/${p}`),...posts.map(p=>`${base}/articles/${p.slug}`)];fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(u)}</loc></url>`).join('')}</urlset>`);fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);}
  console.log(`Built ${posts.length} published article(s)${rows?' from Supabase':' from local Markdown'}.`);
}
main().catch(error=>{console.error(error);process.exit(1);});
