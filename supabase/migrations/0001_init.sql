-- =====================================================================
-- Bug & Feature Tracker — initial schema, RLS, and storage
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles  (one row per user; id == auth.users.id)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  role       text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

-- Admin check helper. SECURITY DEFINER so it bypasses RLS on profiles and
-- avoids recursive policy evaluation when used inside other policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- invites  (admin-generated one-time signup links)
-- ---------------------------------------------------------------------
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null,
  role       text not null default 'user' check (role in ('admin','user')),
  note       text,
  created_by uuid references public.profiles(id) on delete set null,
  used_by    uuid references public.profiles(id) on delete set null,
  used_at    timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- issues  (bugs and feature requests)
-- ---------------------------------------------------------------------
create table if not exists public.issues (
  id                        uuid primary key default gen_random_uuid(),
  type                      text not null check (type in ('bug','feature')),
  title                     text,
  description               text not null,                       -- required "comment"
  status                    text not null default 'new'
                              check (status in ('new','pending_review','in_progress','completed','rejected')),
  raised_by                 uuid not null references public.profiles(id) on delete cascade,
  assigned_to               uuid references public.profiles(id) on delete set null,
  tentative_completion_date date,
  completed_at              timestamptz,
  review_comment            text,                                -- required when a feature is rejected
  reviewed_by               uuid references public.profiles(id) on delete set null,
  reviewed_at               timestamptz,
  created_at                timestamptz not null default now(),  -- system-generated "date raised" (UTC)
  updated_at                timestamptz not null default now()
);

create index if not exists issues_status_idx     on public.issues(status);
create index if not exists issues_type_idx        on public.issues(type);
create index if not exists issues_created_at_idx  on public.issues(created_at desc);
create index if not exists issues_assigned_idx    on public.issues(assigned_to);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists issues_set_updated_at on public.issues;
create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- attachments  (images / videos in the issue-media storage bucket)
-- ---------------------------------------------------------------------
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null references public.issues(id) on delete cascade,
  storage_path text not null,
  file_type    text not null check (file_type in ('image','video')),
  mime_type    text,
  file_name    text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists attachments_issue_idx on public.attachments(issue_id);

-- ---------------------------------------------------------------------
-- comments  (ongoing discussion thread per issue)
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_issue_idx on public.comments(issue_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.invites     enable row level security;
alter table public.issues      enable row level security;
alter table public.attachments enable row level security;
alter table public.comments    enable row level security;

-- profiles: everyone signed-in can read (needed for assignee lists / names);
-- only admins can change roles. Inserts happen via the service role (signup).
drop policy if exists profiles_select_auth on public.profiles;
create policy profiles_select_auth on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- invites: admin-only. Consumption (signup) runs server-side via service role.
drop policy if exists invites_admin_all on public.invites;
create policy invites_admin_all on public.invites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- issues: everyone reads (shared dashboard); anyone raises their own;
-- admins OR the assignee can update.
drop policy if exists issues_select_auth on public.issues;
create policy issues_select_auth on public.issues
  for select to authenticated using (true);

drop policy if exists issues_insert_self on public.issues;
create policy issues_insert_self on public.issues
  for insert to authenticated with check (raised_by = auth.uid());

drop policy if exists issues_update_admin_or_assignee on public.issues;
create policy issues_update_admin_or_assignee on public.issues
  for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin() or assigned_to = auth.uid());

drop policy if exists issues_delete_admin on public.issues;
create policy issues_delete_admin on public.issues
  for delete to authenticated using (public.is_admin());

-- attachments: everyone reads; uploader inserts own rows; admins delete.
drop policy if exists attachments_select_auth on public.attachments;
create policy attachments_select_auth on public.attachments
  for select to authenticated using (true);

drop policy if exists attachments_insert_self on public.attachments;
create policy attachments_insert_self on public.attachments
  for insert to authenticated with check (uploaded_by = auth.uid());

drop policy if exists attachments_delete_admin on public.attachments;
create policy attachments_delete_admin on public.attachments
  for delete to authenticated using (public.is_admin());

-- comments: everyone reads; users post as themselves.
drop policy if exists comments_select_auth on public.comments;
create policy comments_select_auth on public.comments
  for select to authenticated using (true);

drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments
  for insert to authenticated with check (author_id = auth.uid());

-- =====================================================================
-- Storage: private bucket for issue media
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('issue-media', 'issue-media', false)
on conflict (id) do nothing;

drop policy if exists issue_media_read_auth on storage.objects;
create policy issue_media_read_auth on storage.objects
  for select to authenticated using (bucket_id = 'issue-media');

drop policy if exists issue_media_insert_auth on storage.objects;
create policy issue_media_insert_auth on storage.objects
  for insert to authenticated with check (bucket_id = 'issue-media');

drop policy if exists issue_media_delete_admin on storage.objects;
create policy issue_media_delete_admin on storage.objects
  for delete to authenticated using (bucket_id = 'issue-media' and public.is_admin());
