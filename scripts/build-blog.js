const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const source = path.join(root, 'content/blog/posts');
const output = path.join(root, 'content/blog');
const articlesDir = path.join(root, 'articles');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(articlesDir, { recursive: true });
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
    const html=markdownToHtml(post.body);const jsonPost={...post,html};
    fs.writeFileSync(path.join(output,`${post.slug}.json`),JSON.stringify(jsonPost,null,2));
    index.push({slug:post.slug,title:post.title,image:post.image,category:post.category,author:post.author,date:post.date,description:post.description});
    const schema={'@context':'https://schema.org','@type':'Article',headline:post.title,description:post.description,image:post.image||undefined,datePublished:post.date||undefined,author:{'@type':'Organization',name:post.author},publisher:{'@type':'Organization',name:'Sugary Citrus'}};
    const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(post.title)} | Sugary Citrus</title><meta name="description" content="${esc(post.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="article"><meta property="og:site_name" content="Sugary Citrus"><meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(post.description)}">${post.image?`<meta property="og:image" content="${esc(post.image)}">`:''}<meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="../assets/styles.css"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head><body><div data-header></div><main class="content-section"><article class="container article"><div class="eyebrow">${esc(post.category)} · ${esc(post.date)}</div><h1>${esc(post.title)}</h1><p class="intro">${esc(post.description)}</p>${post.image?`<img src="${esc(post.image)}" alt="${esc(post.title)}" style="width:100%;border-radius:20px;margin:30px 0">`:''}<div class="article-body">${html}</div><p class="notice">Written by ${esc(post.author)}</p></article></main><div data-footer></div><script src="../assets/content.js"></script><script src="../assets/render.js"></script><script src="../assets/site.js"></script></body></html>`;
    fs.writeFileSync(path.join(articlesDir,`${post.slug}.html`),page);
  }
  fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(index,null,2));
  const jsonKeep=new Set(posts.map(p=>`${p.slug}.json`).concat(['index.json']));for(const file of fs.readdirSync(output))if(file.endsWith('.json')&&!jsonKeep.has(file))fs.unlinkSync(path.join(output,file));
  const keep=new Set(posts.map(p=>`${p.slug}.html`));for(const file of fs.readdirSync(articlesDir))if(file.endsWith('.html')&&!keep.has(file))fs.unlinkSync(path.join(articlesDir,file));
  if(process.env.SITE_URL){const base=process.env.SITE_URL.replace(/\/$/,'');const paths=['','about.html','services.html','performance-marketing.html','google-ads.html','creative-strategy.html','seo-organic-growth.html','case-studies.html','insights.html','contact.html'];const urls=[...paths.map(p=>`${base}/${p}`),...posts.map(p=>`${base}/articles/${p.slug}.html`)];fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(u)}</loc></url>`).join('')}</urlset>`);fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);}
  console.log(`Built ${posts.length} published article(s)${rows?' from Supabase':' from local Markdown'}.`);
}
main().catch(error=>{console.error(error);process.exit(1);});
