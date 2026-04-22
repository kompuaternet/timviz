create table if not exists public.bookings (
  id text primary key,
  salon_slug text not null,
  salon_name text not null,
  service_name text not null,
  appointment_date date not null,
  appointment_time text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_notes text not null default '',
  status text not null default 'confirmed',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.professionals (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  password_hash text not null,
  phone text not null,
  country text not null,
  timezone text not null,
  language text not null,
  currency text not null default 'USD',
  booking_credits_total integer not null default 500,
  owner_mode text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.businesses (
  id text primary key,
  name text not null,
  website text not null default '',
  categories jsonb not null default '[]'::jsonb,
  account_type text not null,
  service_mode text not null,
  address text not null default '',
  address_details text not null default '',
  address_lat double precision,
  address_lon double precision,
  work_schedule_mode text not null default 'fixed',
  work_schedule jsonb not null default '{}'::jsonb,
  custom_schedule jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  owner_professional_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_services (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text not null,
  price integer not null default 0,
  category text not null default '',
  duration_minutes integer not null default 60,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_memberships (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  professional_id text not null references public.professionals(id) on delete cascade,
  role text not null,
  scope text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.calendar_appointments (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  professional_id text not null references public.professionals(id) on delete cascade,
  appointment_date date not null,
  start_time text not null,
  end_time text not null,
  kind text not null default 'appointment',
  customer_name text not null default '',
  customer_phone text not null default '',
  service_name text not null default '',
  notes text not null default '',
  attendance text not null default 'pending',
  price_amount integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pro_clients (
  id text primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  telegram text not null default '',
  notes text not null default '',
  notifications_telegram boolean not null default true,
  marketing_telegram boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_tickets (
  id text primary key,
  professional_id text references public.professionals(id) on delete set null,
  business_name text not null default '',
  user_name text not null default '',
  email text not null default '',
  phone text not null default '',
  page text not null default '',
  language text not null default 'en',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_messages (
  id text primary key,
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  source text not null,
  text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  telegram_message_id bigint,
  telegram_update_id bigint
);

alter table public.professionals add column if not exists currency text not null default 'USD';
alter table public.professionals add column if not exists booking_credits_total integer not null default 500;

alter table public.businesses add column if not exists photos jsonb not null default '[]'::jsonb;

alter table public.business_services add column if not exists price integer not null default 0;
alter table public.business_services add column if not exists category text not null default '';
alter table public.business_services add column if not exists duration_minutes integer not null default 60;
alter table public.business_services add column if not exists color text;
alter table public.business_services add column if not exists sort_order integer not null default 0;

create index if not exists bookings_salon_date_idx on public.bookings (salon_slug, appointment_date, appointment_time);
create index if not exists business_memberships_professional_idx on public.business_memberships (professional_id);
create index if not exists business_services_business_idx on public.business_services (business_id, sort_order, created_at);
create index if not exists calendar_appointments_professional_day_idx on public.calendar_appointments (professional_id, appointment_date, start_time);
create index if not exists calendar_appointments_business_day_idx on public.calendar_appointments (business_id, appointment_date, start_time);
create index if not exists pro_clients_professional_idx on public.pro_clients (professional_id, created_at desc);
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
create unique index if not exists support_messages_telegram_update_uidx on public.support_messages (telegram_update_id) where telegram_update_id is not null;
create unique index if not exists support_messages_telegram_message_uidx on public.support_messages (telegram_message_id) where telegram_message_id is not null;
