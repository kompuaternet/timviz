create table if not exists public.bookings (
  id text primary key,
  salon_slug text not null,
  salon_name text not null,
  service_name text not null,
  appointment_date date not null,
  appointment_time text not null,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null,
  customer_notes text not null default '',
  status text not null default 'confirmed',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_accounts (
  email text primary key,
  given_name text not null default '',
  family_name text not null default '',
  full_name text not null default '',
  phone text not null default '',
  birthday text not null default '',
  gender text not null default '',
  addresses jsonb not null default '[]'::jsonb,
  favorite_business_ids jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.professionals (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  password_hash text not null,
  avatar_url text not null default '',
  phone text not null,
  country text not null,
  timezone text not null,
  language text not null,
  currency text not null default 'USD',
  booking_credits_total integer not null default 100,
  wallet_balance integer not null default 0,
  plan text not null default 'free',
  premium_status text not null default 'inactive',
  premium_until timestamptz,
  owner_mode text not null,
  account_status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.professionals
  add column if not exists avatar_url text not null default '';
alter table if exists public.professionals
  add column if not exists account_status text not null default 'active';

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
  allow_online_booking boolean not null default false,
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
  created_by_professional_id text references public.professionals(id) on delete set null,
  source text not null default 'catalog',
  moderation_status text not null default 'approved',
  moderated_at timestamptz,
  is_blocked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.global_service_catalog (
  id text primary key,
  category text not null,
  group_key text not null,
  name text not null,
  localized_name_ru text,
  localized_name_uk text,
  localized_name_en text,
  duration_minutes integer not null default 60,
  price integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_categories (
  id text primary key,
  name text not null,
  localized_name jsonb not null default '{}'::jsonb,
  slug text not null unique,
  sort_order integer not null default 500,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_memberships (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  professional_id text not null references public.professionals(id) on delete cascade,
  role text not null,
  scope text not null,
  work_schedule_mode text,
  work_schedule jsonb,
  custom_schedule jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_join_requests (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  professional_id text not null references public.professionals(id) on delete cascade,
  role text not null default 'Specialist',
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  viewed_at timestamptz
);

create table if not exists public.business_staff_invitations (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  email text not null,
  role text not null default 'Specialist',
  invited_by_professional_id text references public.professionals(id) on delete set null,
  accepted_professional_id text references public.professionals(id) on delete set null,
  token text not null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.plans (
  id text primary key,
  code text not null unique,
  name text not null,
  description text not null default '',
  price_monthly_uah integer,
  price_yearly_uah integer,
  apple_product_id_monthly text,
  apple_product_id_yearly text,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create table if not exists public.monobank_payments (
  id text primary key,
  user_id text not null references public.professionals(id) on delete cascade,
  invoice_id text not null unique,
  plan_code text not null,
  amount integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'created',
  period_months integer not null default 1,
  active_from timestamptz,
  active_until timestamptz,
  mono_modified_date timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  event_id text not null,
  event_type text not null default '',
  user_id text references public.professionals(id) on delete set null,
  processed boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  unique(provider, event_id)
);

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

create table if not exists public.telegram_connections (
  id text primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  connect_token text not null,
  connect_token_expires_at timestamptz not null,
  chat_id text,
  telegram_user_id bigint,
  telegram_username text not null default '',
  telegram_first_name text not null default '',
  telegram_last_name text not null default '',
  language text not null default 'en',
  timezone text not null default 'UTC',
  notifications_new_booking boolean not null default true,
  notifications_cabinet_booking boolean not null default true,
  notifications_rescheduled boolean not null default true,
  notifications_cancelled boolean not null default true,
  notifications_reminder boolean not null default true,
  notifications_today boolean not null default true,
  forwarding_enabled boolean not null default true,
  reminder_lead_minutes integer not null default 120,
  connected_at timestamptz,
  last_interaction_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.telegram_reminder_events (
  id text primary key,
  appointment_id text not null,
  professional_id text not null references public.professionals(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  chat_id text not null,
  reminder_type text not null default '2h',
  sent_at timestamptz not null default timezone('utc', now())
);

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

alter table public.professionals add column if not exists currency text not null default 'USD';
alter table public.professionals add column if not exists booking_credits_total integer not null default 100;
alter table public.professionals add column if not exists wallet_balance integer not null default 0;
alter table public.professionals add column if not exists plan text not null default 'free';
alter table public.professionals add column if not exists premium_status text not null default 'inactive';
alter table public.professionals add column if not exists premium_until timestamptz;

alter table public.businesses add column if not exists photos jsonb not null default '[]'::jsonb;
alter table public.businesses add column if not exists allow_online_booking boolean not null default false;
alter table public.bookings add column if not exists customer_email text not null default '';

alter table public.business_services add column if not exists price integer not null default 0;
alter table public.business_services add column if not exists category text not null default '';
alter table public.business_services add column if not exists duration_minutes integer not null default 60;
alter table public.business_services add column if not exists color text;
alter table public.business_services add column if not exists sort_order integer not null default 0;
alter table public.business_services add column if not exists created_by_professional_id text references public.professionals(id) on delete set null;
alter table public.business_services add column if not exists source text not null default 'catalog';
alter table public.business_services add column if not exists moderation_status text not null default 'approved';
alter table public.business_services add column if not exists moderated_at timestamptz;
alter table public.business_services add column if not exists is_blocked boolean not null default false;
alter table public.global_service_catalog add column if not exists localized_name_ru text;
alter table public.global_service_catalog add column if not exists localized_name_uk text;
alter table public.global_service_catalog add column if not exists localized_name_en text;
alter table public.service_categories add column if not exists localized_name jsonb not null default '{}'::jsonb;
alter table public.service_categories add column if not exists sort_order integer not null default 500;
alter table public.service_categories add column if not exists is_system boolean not null default true;
alter table public.business_memberships add column if not exists work_schedule_mode text;
alter table public.business_memberships add column if not exists work_schedule jsonb;
alter table public.business_memberships add column if not exists custom_schedule jsonb;
alter table public.business_join_requests add column if not exists viewed_at timestamptz;
alter table public.telegram_connections add column if not exists chat_id text;
alter table public.telegram_connections add column if not exists telegram_user_id bigint;
alter table public.telegram_connections add column if not exists telegram_username text not null default '';
alter table public.telegram_connections add column if not exists telegram_first_name text not null default '';
alter table public.telegram_connections add column if not exists telegram_last_name text not null default '';
alter table public.telegram_connections add column if not exists language text not null default 'en';
alter table public.telegram_connections add column if not exists timezone text not null default 'UTC';
alter table public.telegram_connections add column if not exists notifications_new_booking boolean not null default true;
alter table public.telegram_connections add column if not exists notifications_cabinet_booking boolean not null default true;
alter table public.telegram_connections add column if not exists notifications_rescheduled boolean not null default true;
alter table public.telegram_connections add column if not exists notifications_cancelled boolean not null default true;
alter table public.telegram_connections add column if not exists notifications_reminder boolean not null default true;
alter table public.telegram_connections add column if not exists notifications_today boolean not null default true;
alter table public.telegram_connections add column if not exists forwarding_enabled boolean not null default true;
alter table public.telegram_connections add column if not exists reminder_lead_minutes integer not null default 120;
alter table public.telegram_connections add column if not exists connected_at timestamptz;
alter table public.telegram_connections add column if not exists last_interaction_at timestamptz;
alter table public.telegram_connections add column if not exists updated_at timestamptz not null default timezone('utc', now());

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

create index if not exists bookings_salon_date_idx on public.bookings (salon_slug, appointment_date, appointment_time);
create index if not exists bookings_salon_status_created_idx on public.bookings (salon_slug, status, created_at desc);
create index if not exists bookings_customer_email_idx on public.bookings (customer_email, created_at desc);
create unique index if not exists professionals_email_normalized_uidx
  on public.professionals (lower(btrim(email)))
  where btrim(email) <> '';
create index if not exists plans_code_idx on public.plans (code);
create index if not exists user_entitlements_user_status_idx on public.user_entitlements (user_id, status, active_until desc);
create index if not exists user_entitlements_source_idx on public.user_entitlements (source, updated_at desc);
create index if not exists apple_subscriptions_user_idx on public.apple_subscriptions (user_id, expires_at desc);
create index if not exists monobank_payments_user_idx on public.monobank_payments (user_id, active_until desc);
create index if not exists monobank_subscriptions_user_idx on public.monobank_subscriptions (user_id, active_until desc);
create index if not exists monobank_subscriptions_status_idx on public.monobank_subscriptions (status, next_charge_at desc);
create index if not exists webhook_events_provider_created_idx on public.webhook_events (provider, created_at desc);
create index if not exists business_memberships_professional_idx on public.business_memberships (professional_id);
create index if not exists business_memberships_business_professional_idx on public.business_memberships (business_id, professional_id);
create index if not exists business_memberships_business_scope_idx on public.business_memberships (business_id, scope);
create index if not exists business_join_requests_business_status_viewed_idx on public.business_join_requests (business_id, status, viewed_at, created_at desc);
create index if not exists business_services_business_idx on public.business_services (business_id, sort_order, created_at);
create index if not exists business_services_blocked_idx on public.business_services (is_blocked, created_at desc);
create index if not exists business_services_source_idx on public.business_services (source, moderation_status, is_blocked, created_at desc);
create index if not exists service_categories_sort_order_idx on public.service_categories (sort_order, name);
create index if not exists business_staff_invitations_business_idx on public.business_staff_invitations (business_id, created_at desc);
create index if not exists business_staff_invitations_business_status_email_idx on public.business_staff_invitations (business_id, status, email);
create unique index if not exists business_staff_invitations_token_uidx on public.business_staff_invitations (token);
create index if not exists app_notifications_professional_unread_idx on public.app_notifications (professional_id, read_at, created_at desc);
create index if not exists app_notifications_business_idx on public.app_notifications (business_id, created_at desc);
create index if not exists calendar_appointments_professional_day_idx on public.calendar_appointments (professional_id, appointment_date, start_time);
create index if not exists calendar_appointments_professional_kind_date_idx on public.calendar_appointments (professional_id, kind, appointment_date);
create index if not exists calendar_appointments_professional_kind_created_idx on public.calendar_appointments (professional_id, kind, created_at desc);
create index if not exists calendar_appointments_business_day_idx on public.calendar_appointments (business_id, appointment_date, start_time);
create index if not exists calendar_appointments_business_kind_recent_idx on public.calendar_appointments (business_id, kind, appointment_date desc, start_time desc, created_at desc);
create index if not exists customer_accounts_updated_idx on public.customer_accounts (updated_at desc);
create index if not exists global_service_catalog_category_idx on public.global_service_catalog (category, group_key, sort_order);
create index if not exists pro_clients_professional_idx on public.pro_clients (professional_id, created_at desc);
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
create unique index if not exists support_messages_telegram_update_uidx on public.support_messages (telegram_update_id) where telegram_update_id is not null;
create unique index if not exists support_messages_telegram_message_uidx on public.support_messages (telegram_message_id) where telegram_message_id is not null;
create unique index if not exists telegram_connections_professional_uidx on public.telegram_connections (professional_id);
create unique index if not exists telegram_connections_connect_token_uidx on public.telegram_connections (connect_token);
create index if not exists telegram_connections_telegram_user_idx on public.telegram_connections (telegram_user_id, updated_at desc);
create index if not exists telegram_connections_business_idx on public.telegram_connections (business_id);
create index if not exists telegram_connections_chat_idx on public.telegram_connections (chat_id);
create unique index if not exists telegram_reminder_events_unique_idx on public.telegram_reminder_events (appointment_id, professional_id, reminder_type);
create index if not exists telegram_reminder_events_sent_idx on public.telegram_reminder_events (sent_at desc);
create unique index if not exists mobile_push_tokens_token_uidx on public.mobile_push_tokens (expo_push_token);
create index if not exists mobile_push_tokens_professional_idx on public.mobile_push_tokens (professional_id, active, updated_at desc);
create index if not exists mobile_push_tokens_business_idx on public.mobile_push_tokens (business_id, active);
create unique index if not exists mobile_push_events_unique_idx on public.mobile_push_events (appointment_id, professional_id, event_type);
create index if not exists mobile_push_events_sent_idx on public.mobile_push_events (sent_at desc);

-- Security hardening
--
-- This app talks to Supabase only through server-side routes using the
-- service-role key. Public browser clients should not be able to read or
-- mutate these tables directly, so we lock them down with RLS and revoke
-- broad anon/authenticated grants.

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

alter table if exists public.bookings enable row level security;
alter table if exists public.customer_accounts enable row level security;
alter table if exists public.professionals enable row level security;
alter table if exists public.businesses enable row level security;
alter table if exists public.business_services enable row level security;
alter table if exists public.global_service_catalog enable row level security;
alter table if exists public.business_memberships enable row level security;
alter table if exists public.business_join_requests enable row level security;
alter table if exists public.business_staff_invitations enable row level security;
alter table if exists public.plans enable row level security;
alter table if exists public.user_entitlements enable row level security;
alter table if exists public.apple_subscriptions enable row level security;
alter table if exists public.monobank_payments enable row level security;
alter table if exists public.monobank_subscriptions enable row level security;
alter table if exists public.webhook_events enable row level security;
alter table if exists public.app_notifications enable row level security;
alter table if exists public.calendar_appointments enable row level security;
alter table if exists public.pro_clients enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.support_messages enable row level security;
alter table if exists public.telegram_connections enable row level security;
alter table if exists public.telegram_reminder_events enable row level security;
alter table if exists public.mobile_push_tokens enable row level security;
alter table if exists public.mobile_push_events enable row level security;
