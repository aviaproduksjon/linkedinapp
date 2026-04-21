-- =============================================================================
-- Row Level Security policies
-- =============================================================================
--
-- Every user-owned table has a uniform policy: the user can only see and modify
-- rows where user_id = auth.uid(). This enforces multi-user scoping (A5) from
-- day one.
--
-- Tables with no direct user_id (post_categories) inherit access through the
-- parent (posts.user_id).
-- =============================================================================

-- Enable RLS on everything
alter table public.categories          enable row level security;
alter table public.pain_points         enable row level security;
alter table public.companies           enable row level security;
alter table public.usps                enable row level security;
alter table public.personas            enable row level security;
alter table public.sources             enable row level security;
alter table public.ideas               enable row level security;
alter table public.hooks               enable row level security;
alter table public.posts               enable row level security;
alter table public.post_categories     enable row level security;
alter table public.attachments         enable row level security;
alter table public.suggestions         enable row level security;
alter table public.post_metrics        enable row level security;
alter table public.events              enable row level security;
alter table public.language_corpus     enable row level security;
alter table public.algorithm_insights  enable row level security;
alter table public.ai_usage            enable row level security;
alter table public.budget_settings     enable row level security;

-- Helper: create standard CRUD policies for a user-scoped table
create or replace function public._owner_policies(tbl regclass)
returns void
language plpgsql
as $$
begin
  execute format($f$
    create policy "owner_select" on %s
      for select using (user_id = auth.uid());

    create policy "owner_insert" on %s
      for insert with check (user_id = auth.uid());

    create policy "owner_update" on %s
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());

    create policy "owner_delete" on %s
      for delete using (user_id = auth.uid());
  $f$, tbl, tbl, tbl, tbl);
end;
$$;

select public._owner_policies('public.categories');
select public._owner_policies('public.pain_points');
select public._owner_policies('public.companies');
select public._owner_policies('public.usps');
select public._owner_policies('public.personas');
select public._owner_policies('public.sources');
select public._owner_policies('public.ideas');
select public._owner_policies('public.hooks');
select public._owner_policies('public.posts');
select public._owner_policies('public.attachments');
select public._owner_policies('public.suggestions');
select public._owner_policies('public.post_metrics');
select public._owner_policies('public.events');
select public._owner_policies('public.language_corpus');
select public._owner_policies('public.algorithm_insights');
select public._owner_policies('public.ai_usage');

-- budget_settings uses user_id as primary key, no user_id column duplicate needed.
create policy "owner_select" on public.budget_settings
  for select using (user_id = auth.uid());
create policy "owner_insert" on public.budget_settings
  for insert with check (user_id = auth.uid());
create policy "owner_update" on public.budget_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner_delete" on public.budget_settings
  for delete using (user_id = auth.uid());

-- post_categories inherits from posts
create policy "parent_select" on public.post_categories
  for select using (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "parent_insert" on public.post_categories
  for insert with check (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "parent_update" on public.post_categories
  for update using (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "parent_delete" on public.post_categories
  for delete using (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

-- Clean up helper
drop function public._owner_policies(regclass);

-- =============================================================================
-- Storage policies
-- =============================================================================

-- Audio files for ideas (idea-bank)
create policy "audio_owner_select"
  on storage.objects for select
  using (bucket_id = 'audio' and owner = auth.uid());
create policy "audio_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'audio' and owner = auth.uid());
create policy "audio_owner_update"
  on storage.objects for update
  using (bucket_id = 'audio' and owner = auth.uid());
create policy "audio_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'audio' and owner = auth.uid());

-- Post attachments (images, carousel slides, documents)
create policy "attachments_owner_select"
  on storage.objects for select
  using (bucket_id = 'attachments' and owner = auth.uid());
create policy "attachments_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and owner = auth.uid());
create policy "attachments_owner_update"
  on storage.objects for update
  using (bucket_id = 'attachments' and owner = auth.uid());
create policy "attachments_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'attachments' and owner = auth.uid());
