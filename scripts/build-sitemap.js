#!/usr/bin/env node
/* Regenerates sitemap.xml from the pages that actually exist.
   Run after adding or publishing a page:  node scripts/build-sitemap.js
   Excludes noindex and utility pages. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://yash131206.github.io/sugarycitrus').replace(/\/$/, '');

const SKIP = new Set(['404.html', 'thank-you.html', 'article.html']);

function urlFor(file) {
  // articles/foo.html -> /articles/foo ; index.html -> /
  let p = file.split(path.sep).join('/');
  if (p === 'index.html') return SITE + '/';
  p = p.replace(/\.html$/, '');
  return SITE + '/' + p;
}

function collect() {
  const out = [];
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.endsWith('.html')) continue;
    if (SKIP.has(name)) continue;
    out.push(name);
  }
  const artDir = path.join(ROOT, 'articles');
  if (fs.existsSync(artDir)) {
    for (const name of fs.readdirSync(artDir)) {
      if (name.endsWith('.html')) out.push('articles/' + name);
    }
  }
  return out;
}

const files = collect();
const today = new Date().toISOString().slice(0, 10);

const body = files
  .map(f => `  <url><loc>${urlFor(f)}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${files.length} urls`);
files.forEach(f => console.log('  ' + urlFor(f)));
