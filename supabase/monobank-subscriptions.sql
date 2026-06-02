create table if not exists public.monobank_subscriptions (
  id text primary key,
  user_id text not null references public.professionals(id) on delete cascade,
  subscription_id text not null unique,
  plan_code text not null,
  amount integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'created',
  interval text not null default '1m',
  period_months integer not null default 1,
  active_from timestamptz,
  active_until timestamptz,
  next_charge_at timestamptz,
  cancelled_at timestamptz,
  mono_modified_date timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists monobank_subscriptions_user_idx
  on public.monobank_subscriptions (user_id, active_until desc);

create index if not exists monobank_subscriptions_status_idx
  on public.monobank_subscriptions (status, next_charge_at desc);

alter table public.monobank_subscriptions enable row level security;
