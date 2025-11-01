-- Enable UUID generation utilities
create extension if not exists "pgcrypto";

-- Utility function to keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null check (platform in ('instagram', 'linkedin')),
  prompt text not null,
  aspect_ratio text not null check (aspect_ratio in ('1:1', '4:5', '16:9', '9:16')),
  tone text not null check (tone in ('friendly', 'professional', 'playful')),
  caption_draft text,
  caption_final text,
  status text not null default 'queued' check (
    status in (
      'queued',
      'generating',
      'awaiting_approval',
      'approved',
      'rejected',
      'posting',
      'posted',
      'failed'
    )
  ),
  selected_asset_id uuid,
  drive_file_url text,
  posted_ref text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  provider text not null,
  prompt text not null,
  aspect_ratio text not null,
  drive_file_url text not null,
  status text not null check (status in ('processing', 'ready', 'failed')),
  meta jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.posts
  add constraint posts_selected_asset_id_fkey
  foreign key (selected_asset_id) references public.assets (id) on delete set null;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete set null,
  type text not null check (type in ('image_generate', 'caption_generate', 'publish')),
  state text not null check (state in ('running', 'done', 'error')),
  input jsonb,
  output jsonb,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz
);

create index idx_posts_status_created_at on public.posts (status, created_at desc);
create index idx_assets_post_id_status on public.assets (post_id, status);

create trigger trg_posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

alter table public.posts enable row level security;
alter table public.assets enable row level security;
alter table public.jobs enable row level security;

create policy "Authenticated users manage posts"
  on public.posts
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users manage assets"
  on public.assets
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users manage jobs"
  on public.jobs
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.assets;
