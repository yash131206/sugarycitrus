-- Sugary Citrus single-admin CMS
-- Run in Supabase SQL Editor after creating the project.
-- Create the first admin user in Authentication > Users, then insert that user's UUID
-- into public.cms_admins using the final INSERT statement below.

create extension if not exists pgcrypto;

create table if not exists public.cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  featured_image text not null default '',
  category text not null,
  author text not null default 'Sugary Citrus',
  publish_date date not null default current_date,
  description text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_publish_date_idx
  on public.articles (status, publish_date desc);

create or replace function public.set_article_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_article_updated_at();

alter table public.cms_admins enable row level security;
alter table public.articles enable row level security;

grant select on public.cms_admins to authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

-- An authenticated user can only discover their own admin row.
drop policy if exists "Admins can read own admin record" on public.cms_admins;
create policy "Admins can read own admin record"
on public.cms_admins for select to authenticated
using (user_id = (select auth.uid()));

-- Public visitors can read published content only.
drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles for select to anon, authenticated
using (status = 'published');

-- The single admin can read every article, including drafts.
drop policy if exists "CMS admin can read all articles" on public.articles;
create policy "CMS admin can read all articles"
on public.articles for select to authenticated
using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "CMS admin can insert articles" on public.articles;
create policy "CMS admin can insert articles"
on public.articles for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
);

drop policy if exists "CMS admin can update articles" on public.articles;
create policy "CMS admin can update articles"
on public.articles for update to authenticated
using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "CMS admin can delete articles" on public.articles;
create policy "CMS admin can delete articles"
on public.articles for delete to authenticated
using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- Public read access for published featured images; writes remain admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-images', 'cms-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "Public can view CMS images" on storage.objects;
create policy "Public can view CMS images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'cms-images');

drop policy if exists "CMS admin can upload images" on storage.objects;
create policy "CMS admin can upload images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cms-images'
  and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
);

drop policy if exists "CMS admin can update images" on storage.objects;
create policy "CMS admin can update images"
on storage.objects for update to authenticated
using (bucket_id = 'cms-images' and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
with check (bucket_id = 'cms-images' and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

drop policy if exists "CMS admin can delete images" on storage.objects;
create policy "CMS admin can delete images"
on storage.objects for delete to authenticated
using (bucket_id = 'cms-images' and exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

-- AFTER creating the first Auth user, run this with their actual UUID:
-- insert into public.cms_admins (user_id) values ('PASTE-AUTH-USER-UUID-HERE');
