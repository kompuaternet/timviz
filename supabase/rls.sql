-- Supabase hotfix: close direct public access to app tables.
--
-- Run this once in the Supabase SQL editor for existing projects.
-- It is safe to re-run.

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
alter table if exists public.calendar_appointments enable row level security;
alter table if exists public.pro_clients enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.support_messages enable row level security;
