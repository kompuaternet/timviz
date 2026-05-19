create table if not exists public.app_notifications (
  id text primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  action_url text not null default '',
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_notifications_professional_unread_idx
  on public.app_notifications (professional_id, read_at, created_at desc);

create index if not exists app_notifications_business_idx
  on public.app_notifications (business_id, created_at desc);

alter table if exists public.app_notifications enable row level security;
