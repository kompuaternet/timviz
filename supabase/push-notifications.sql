-- Timviz mobile push notifications.
-- Run once in Supabase SQL editor. Safe to re-run.

create table if not exists public.mobile_push_tokens (
  id text primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default '',
  device_name text not null default '',
  language text not null default 'en',
  timezone text not null default 'UTC',
  notifications_new_booking boolean not null default true,
  notifications_cabinet_booking boolean not null default false,
  notifications_rescheduled boolean not null default true,
  notifications_cancelled boolean not null default true,
  notifications_reminder boolean not null default false,
  notifications_today boolean not null default false,
  reminder_lead_minutes integer not null default 120,
  active boolean not null default true,
  last_registered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mobile_push_events (
  id text primary key,
  appointment_id text not null,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  event_type text not null,
  sent_at timestamptz not null default timezone('utc', now())
);

alter table public.mobile_push_tokens add column if not exists platform text not null default '';
alter table public.mobile_push_tokens add column if not exists device_name text not null default '';
alter table public.mobile_push_tokens add column if not exists language text not null default 'en';
alter table public.mobile_push_tokens add column if not exists timezone text not null default 'UTC';
alter table public.mobile_push_tokens add column if not exists notifications_new_booking boolean not null default true;
alter table public.mobile_push_tokens add column if not exists notifications_cabinet_booking boolean not null default false;
alter table public.mobile_push_tokens add column if not exists notifications_rescheduled boolean not null default true;
alter table public.mobile_push_tokens add column if not exists notifications_cancelled boolean not null default true;
alter table public.mobile_push_tokens add column if not exists notifications_reminder boolean not null default false;
alter table public.mobile_push_tokens add column if not exists notifications_today boolean not null default false;
alter table public.mobile_push_tokens alter column notifications_new_booking set default true;
alter table public.mobile_push_tokens alter column notifications_cabinet_booking set default false;
alter table public.mobile_push_tokens alter column notifications_reminder set default false;
alter table public.mobile_push_tokens alter column notifications_today set default false;
alter table public.mobile_push_tokens add column if not exists reminder_lead_minutes integer not null default 120;
alter table public.mobile_push_tokens add column if not exists active boolean not null default true;
alter table public.mobile_push_tokens add column if not exists last_registered_at timestamptz not null default timezone('utc', now());
alter table public.mobile_push_tokens add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists mobile_push_tokens_token_uidx on public.mobile_push_tokens (expo_push_token);
create index if not exists mobile_push_tokens_professional_idx on public.mobile_push_tokens (professional_id, active, updated_at desc);
create index if not exists mobile_push_tokens_business_idx on public.mobile_push_tokens (business_id, active);
create unique index if not exists mobile_push_events_unique_idx on public.mobile_push_events (appointment_id, professional_id, event_type);
create index if not exists mobile_push_events_sent_idx on public.mobile_push_events (sent_at desc);

alter table if exists public.mobile_push_tokens enable row level security;
alter table if exists public.mobile_push_events enable row level security;
