const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const root = process.cwd();
const source = path.join(root, 'content/blog/posts');
const output = path.join(root, 'content/blog');
fs.mkdirSync(output, { recursive: true });
const posts = fs.existsSync(source) ? fs.readdirSync(source).filter(f => f.endsWith('.md')) : [];
const index = [];
for (const file of posts) {
  const raw = fs.readFileSync(path.join(source, file), 'utf8');
  const parsed = matter(raw);
  const d = parsed.data;
  const slug = path.basename(file, '.md');
  const post = {
    slug,
    title: d.title || slug,
    image: d.featured_image || '',
    category: d.category || 'Insight',
    author: d.author || 'Sugary Citrus',
    date: d.publish_date || '',
    description: d.description || '',
    body: parsed.content,
    html: marked.parse(parsed.content)
  };
  fs.writeFileSync(path.join(output, `${slug}.json`), JSON.stringify(post, null, 2));
  index.push({ slug, title: post.title, image: post.image, category: post.category, author: post.author, date: post.date, description: post.description });
}
index.sort((a,b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(path.join(output, 'index.json'), JSON.stringify(index, null, 2));
console.log(`Built ${index.length} blog post(s).`);
