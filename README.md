# Sugary Citrus — Version 3 CMS build

Premium editorial multi-page website for an Indian D2C growth agency. Static HTML/CSS/JS frontend, Vercel hosting, Supabase Auth + Postgres + Storage CMS.

## Pages
- Home, About, Services
- Performance Marketing / Meta Ads
- Google Ads
- Creative Strategy / UGC Marketing
- SEO / AEO / GEO
- Case Studies
- Insights and generated static article pages
- Contact
- `/admin/` — private single-admin Content Studio

## CMS architecture
- Supabase Auth: email/password sign-in. There is no public sign-up UI.
- Supabase Postgres: articles and the one-row-per-admin allowlist.
- Supabase Storage: public read for published featured images; upload/update/delete restricted to CMS admins.
- Vercel Function `/api/rebuild`: validates the user's Supabase session and admin allowlist membership before triggering the Vercel Deploy Hook.
- Build script fetches published articles from Supabase and generates static JSON plus crawlable `/articles/<slug>.html` pages with article metadata and JSON-LD.

The visible editorial fields remain exactly: TITLE, FEATURED IMAGE, CATEGORY, AUTHOR, PUBLISH DATE, DESCRIPTION, BODY. Slug, status and audit fields are system fields, not extra editorial fields.

## Setup (required once)

### 1. Create the Supabase project
Use a dedicated project for this website. Do not reuse unrelated application projects. Select the organization and region before creating it. Mumbai (`ap-south-1`) is the recommended region for an India-focused agency.

### 2. Apply the database schema
In Supabase Dashboard → SQL Editor, run `supabase/migrations/001_cms.sql`.

### 3. Create the single admin account
In Supabase Dashboard → Authentication → Users, create the owner's user with email/password. Keep public sign-ups disabled. Copy that user's UUID, then run:

```sql
insert into public.cms_admins (user_id)
values ('PASTE-AUTH-USER-UUID-HERE');
```

Do not expose a service-role or secret key in frontend files.

### 4. Configure browser-safe keys
Set the same project URL and **publishable key** in both:
- `admin/supabase-config.js`
- `assets/supabase-public-config.js`

These files are safe to publish only with the publishable key. Never paste a `service_role` key or `sb_secret_...` key here.

### 5. Configure Vercel environment variables
Add these to the Vercel project (Production and Preview as appropriate):
- `SUPABASE_URL` — project URL
- `SUPABASE_PUBLISHABLE_KEY` — publishable key
- `VERCEL_DEPLOY_HOOK_URL` — a Vercel Deploy Hook URL created for the production branch
- `SITE_URL` — final canonical site URL once the domain is chosen, e.g. `https://example.in`

The first three variables are used by the build/rebuild flow; `SITE_URL` generates the sitemap and robots file with real URLs. Do not commit deploy hook URLs or secrets to Git.

### 6. Deploy
Push the project to the connected Git repository and let Vercel deploy it. The build command is `npm run build`. The CMS calls `/api/rebuild` after publishing, unpublishing or deleting a published article. The endpoint verifies the Supabase session and admin allowlist before triggering the deploy hook.

### 7. Configure Auth URL allowlist
In Supabase → Authentication → URL Configuration, set the production Site URL and add the Vercel preview URL(s) as Redirect URLs. Keep email/password sign-in enabled and public sign-up disabled.

## Local development

```bash
npm install
npm run build
npx serve .
```

For a live CMS, configure the two browser config files with a Supabase project and run the SQL setup first. The `/api/rebuild` function requires Vercel to run; it will not trigger a deploy from a generic static file server.

## Security notes
- Only `cms_admins` members can create, update or delete articles and upload images.
- Public visitors can read only published articles.
- Storage writes are admin-only; the bucket is public-read so article images can load on the website.
- The browser receives only a Supabase publishable key. Never put service-role/secret keys in HTML, JavaScript, GitHub or Vercel public variables.
- Admin membership is bootstrapped manually through SQL. Do not add a public “create account” route.

## SEO / AEO / GEO / LLM
Published articles are generated as static HTML pages at build time, with unique title/description/Open Graph metadata and Article JSON-LD. Sitemap and robots files are generated with `SITE_URL`. `llms.txt` and `llms-full.txt` remain part of the project. These are technical foundations, not guarantees of rankings or AI citations.

## Before launch
- Choose and connect the domain; set `SITE_URL` and verify canonical URLs.
- Configure contact form delivery securely.
- Add real case studies only after verifying campaign data and client permissions.
- Test login, RLS, uploads, publish/unpublish/delete, rebuild, mobile layout, accessibility and Core Web Vitals.
