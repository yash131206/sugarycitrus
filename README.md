# Sugary Citrus — Version 2

Premium editorial multi-page website for an Indian D2C growth agency. Built with HTML, CSS and vanilla JavaScript for static hosting on Vercel or GitHub Pages.

## Pages
- `index.html` — Home
- `about.html` — About
- `services.html` — Six service overview
- `performance-marketing.html` — Performance marketing / Meta Ads
- `google-ads.html` — Google Ads
- `creative-strategy.html` — Creative strategy / UGC
- `seo-organic-growth.html` — SEO, AEO and GEO
- `case-studies.html` — Case studies (add verified work only)
- `insights.html` / `article.html` — Blog listing and article template
- `contact.html` — Contact
- `admin/` — Custom local Content Studio

## Local preview
Open `index.html` in a browser. For a local server, run `npx serve .`.

## Content Studio (current v2)
Open `/admin/`. It supports article creation/editing, browser-local drafts, preview, JSON import/export and Markdown export. The CMS fields are exactly: TITLE, FEATURED IMAGE, CATEGORY, AUTHOR, PUBLISH DATE, DESCRIPTION and BODY.

**Important:** This dashboard is a browser-local authoring tool, not yet a secure production CMS. It does not provide authentication, shared storage or remote publishing. For a true production admin, connect a backend (for example Supabase or a custom authenticated API), configure access control and store image uploads in managed storage. Do not put service-role keys or private API tokens in browser JavaScript.

### Publish a blog post (current workflow)
1. Create or edit an article in `/admin/`.
2. Select **Export content**. This downloads a JSON backup and individual `.md` files.
3. Add the `.md` files to `content/blog/posts/`.
4. Run `npm install` once, then `npm run build`.
5. Commit and deploy the generated site.

The Markdown frontmatter uses the CMS field names expected by `scripts/build-blog.js`.

## SEO / AEO / GEO / LLM readiness
Includes page-level titles/descriptions, social metadata, Organization/Service structured data on selected pages, `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt`. These are foundations, not a guarantee of rankings or AI citations. Replace `YOUR-DOMAIN` placeholders and add canonical URLs after choosing a domain. Ensure every sitemap URL is live before submitting it to search engines.

## Before production launch
- Choose and connect the primary domain; update sitemap, robots and canonical metadata.
- Configure a secure contact form endpoint and email delivery.
- Connect secure CMS authentication + database + image storage if remote editing is required.
- Add real case studies, team details, contact email, privacy policy and terms.
- Test keyboard access, mobile layouts, Core Web Vitals, forms and all links.
- Add analytics/consent controls only after deciding the tracking stack and privacy requirements.

## Brand
- Orange: `#FF5520`
- Warm cream: `#F9F2E4`
- Ink: `#1B1B1B`
- White: `#FFFFFF`
- Positioning: Sweet Strategy. Sharp Execution.
