-- =============================================================================
-- Deniz LinkedIn Hub — initial schema
-- =============================================================================
--
-- Scope: core domain tables. All user-owned tables include `user_id` for RLS.
-- See docs/03-datamodell.md for domain-level reasoning.
--
-- Conventions:
--   * All ids are UUIDs (gen_random_uuid()).
--   * Timestamps are `timestamptz`, default now().
--   * Enums live in the `public` schema.
--   * RLS policies are in a separate migration (20260420000002_rls_policies.sql).
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type post_status as enum (
  'draft',
  'suggested',
  'approved',
  'scheduled',
  'published',
  'failed',
  'archived'
);

create type source_type as enum (
  'rss',
  'scrape',
  'manual',
  'internal_avia',
  'report',
  'idea_bank'
);

create type hook_status as enum ('new', 'reviewed', 'used', 'archived');
create type idea_status as enum ('new', 'refined', 'used', 'archived');
create type idea_input_type as enum ('text', 'voice');
create type cta_mode as enum ('none', 'soft', 'direct');
create type attachment_type as enum ('image', 'carousel_slide', 'document');
create type usp_status as enum ('suggested', 'active', 'archived');
create type algorithm_insight_section as enum ('technical', 'b2b_practice', 'cultural');

create type ai_usage_module as enum (
  'generator',
  'tuner',
  'filter',
  'evaluator',
  'research',
  'usp_extractor',
  'transcription',
  'idea_postprocess',
  'text_polisher',
  'marketer_review',
  'classifier'
);

-- -----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- categories (per-user, seeded on signup with the four core categories)
-- -----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  display_name text not null,
  description text,
  color text not null default '#64748b',
  generation_guidance text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- pain_points
-- -----------------------------------------------------------------------------

create table public.pain_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  priority int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.pain_points
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- companies (one global company per user — Avia for Deniz)
-- -----------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  legal_name text,
  tagline text,
  services text[] not null default '{}',
  core_model text,
  target_segments text[] not null default '{}',
  scraped_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- usps
-- -----------------------------------------------------------------------------

create table public.usps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text not null,
  proof text,
  related_pain_point_ids uuid[] not null default '{}',
  status usp_status not null default 'suggested',
  source_url text,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.usps
  for each row execute function public.set_updated_at();
create index usps_user_status_idx on public.usps(user_id, status);

-- -----------------------------------------------------------------------------
-- personas
-- -----------------------------------------------------------------------------

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  active boolean not null default false,
  tone_of_voice text not null default '',
  hard_rules text[] not null default '{}',
  guidance text[] not null default '{}',
  snippets text[] not null default '{}',
  target_audience_notes text,
  preference_weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.personas
  for each row execute function public.set_updated_at();
create index personas_user_active_idx on public.personas(user_id, active);

-- -----------------------------------------------------------------------------
-- sources (RSS feeds, scrape configs, ...)
-- -----------------------------------------------------------------------------

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type source_type not null,
  name text not null,
  url text,
  fetch_config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.sources
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ideas (idea bank — text + voice)
-- -----------------------------------------------------------------------------

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  raw_transcription text,
  audio_url text,
  audio_duration_seconds int,
  input_type idea_input_type not null,
  ai_summary text,
  suggested_category_ids uuid[] not null default '{}',
  suggested_pain_point_ids uuid[] not null default '{}',
  suggested_usp_ids uuid[] not null default '{}',
  tags text[] not null default '{}',
  status idea_status not null default 'new',
  used_in_post_ids uuid[] not null default '{}',
  created_via text not null default 'keyboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();
create index ideas_user_status_idx on public.ideas(user_id, status);

-- -----------------------------------------------------------------------------
-- hooks (knagger — unified handle for external sources and ideas)
-- -----------------------------------------------------------------------------

create table public.hooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  idea_id uuid references public.ideas(id) on delete set null,
  url text,
  title text,
  summary text not null,
  raw_content text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  category_ids uuid[] not null default '{}',
  relevance_score real,
  status hook_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hooks_source_or_idea_check check (
    (source_id is not null) or (idea_id is not null)
  )
);
create trigger set_updated_at before update on public.hooks
  for each row execute function public.set_updated_at();
create index hooks_user_status_idx on public.hooks(user_id, status, relevance_score desc);

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.personas(id) on delete restrict,
  pain_point_id uuid references public.pain_points(id) on delete set null,
  related_usp_ids uuid[] not null default '{}',
  hook_ids uuid[] not null default '{}',
  status post_status not null default 'draft',
  body text not null default '',
  body_history jsonb not null default '[]'::jsonb,
  cta_mode cta_mode not null default 'none',
  algorithm_score real,
  algorithm_notes text,
  algorithm_insight_version int,
  tuner_diff jsonb,
  scheduled_for timestamptz,
  published_at timestamptz,
  linkedin_urn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create index posts_user_status_idx on public.posts(user_id, status);
create index posts_scheduled_for_idx on public.posts(scheduled_for)
  where status = 'scheduled';

-- -----------------------------------------------------------------------------
-- post_categories (many-to-many, with exactly one primary per post)
-- -----------------------------------------------------------------------------

create table public.post_categories (
  post_id uuid not null references public.posts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  primary key (post_id, category_id)
);
create unique index post_categories_one_primary_idx
  on public.post_categories(post_id)
  where is_primary = true;

-- -----------------------------------------------------------------------------
-- attachments
-- -----------------------------------------------------------------------------

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  type attachment_type not null,
  order_index int not null default 0,
  url_or_placeholder text not null,
  alt_text text,
  ai_suggested_description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index attachments_post_order_idx on public.attachments(post_id, order_index);

-- -----------------------------------------------------------------------------
-- suggestions (the N forslag per generation, kept for learning)
-- -----------------------------------------------------------------------------

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid not null,
  persona_id uuid not null references public.personas(id) on delete cascade,
  body text not null,
  algorithm_score real,
  algorithm_notes text,
  chosen boolean not null default false,
  chosen_at timestamptz,
  generator_meta jsonb not null default '{}'::jsonb,
  tuner_diff jsonb,
  created_at timestamptz not null default now()
);
create index suggestions_generation_idx on public.suggestions(generation_id);
create index suggestions_user_chosen_idx on public.suggestions(user_id, chosen);

-- -----------------------------------------------------------------------------
-- post_metrics (from LinkedIn over time)
-- -----------------------------------------------------------------------------

create table public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  measured_at timestamptz not null default now(),
  impressions int not null default 0,
  reactions int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  clicks int not null default 0,
  follower_delta int not null default 0,
  raw_payload jsonb
);
create index post_metrics_post_measured_idx on public.post_metrics(post_id, measured_at desc);

-- -----------------------------------------------------------------------------
-- events (audit + training log)
-- -----------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  actor text not null,
  ref_type text,
  ref_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_user_type_idx on public.events(user_id, type, created_at desc);

-- -----------------------------------------------------------------------------
-- language_corpus (for style mirroring via pgvector)
-- -----------------------------------------------------------------------------

create table public.language_corpus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  chunk text not null,
  embedding vector(1536),
  topic_tags text[] not null default '{}',
  collected_at timestamptz not null default now()
);
create index language_corpus_embedding_idx
  on public.language_corpus using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- -----------------------------------------------------------------------------
-- algorithm_insights (panel content, versioned)
-- -----------------------------------------------------------------------------

create table public.algorithm_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  section algorithm_insight_section not null,
  bullets text[] not null,
  sources text[] not null default '{}',
  approved_by text,
  approved_at timestamptz not null default now(),
  active_from timestamptz not null default now(),
  active_to timestamptz,
  next_review_due timestamptz
);
create index algorithm_insights_active_idx
  on public.algorithm_insights(user_id, section, version desc)
  where active_to is null;

-- -----------------------------------------------------------------------------
-- ai_usage (per-call cost tracking)
-- -----------------------------------------------------------------------------

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  module ai_usage_module not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_cents int not null default 0,
  ref_type text,
  ref_id uuid,
  prompt_version text,
  created_at timestamptz not null default now()
);
create index ai_usage_user_created_idx on public.ai_usage(user_id, created_at desc);
create index ai_usage_user_module_idx on public.ai_usage(user_id, module, created_at desc);

-- -----------------------------------------------------------------------------
-- budget_settings (one row per user)
-- -----------------------------------------------------------------------------

create table public.budget_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_cap_cents int not null default 50000,
  warn_at_percent int not null default 80,
  hard_stop_at_percent int not null default 100,
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.budget_settings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- End initial schema
-- =============================================================================
