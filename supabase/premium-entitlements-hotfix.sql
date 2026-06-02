create table if not exists public.user_entitlements (
  id text primary key,
  user_id text not null references public.professionals(id) on delete cascade,
  plan_code text not null,
  status text not null default 'free',
  source text not null default 'free',
  active_from timestamptz,
  active_until timestamptz,
  trial_until timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.apple_subscriptions (
  id text primary key,
  user_id text not null references public.professionals(id) on delete cascade,
  original_transaction_id text not null unique,
  transaction_id text,
  product_id text not null,
  environment text not null default '',
  status text not null default 'active',
  expires_at timestamptz,
  revoked_at timestamptz,
  auto_renew_status text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_entitlements_user_status_idx
  on public.user_entitlements (user_id, status, active_until desc);

create index if not exists user_entitlements_source_idx
  on public.user_entitlements (source, updated_at desc);

create index if not exists apple_subscriptions_user_idx
  on public.apple_subscriptions (user_id, expires_at desc);

alter table public.user_entitlements enable row level security;
alter table public.apple_subscriptions enable row level security;
