-- Protect professional registration from duplicate emails.
--
-- Run the SELECT first in production. If it returns rows, merge or rename the
-- duplicate accounts manually before applying the UPDATE and CREATE INDEX.

select
  lower(btrim(email)) as normalized_email,
  count(*) as duplicate_count,
  array_agg(id order by created_at asc) as professional_ids,
  array_agg(created_at order by created_at asc) as created_at_values
from public.professionals
where btrim(email) <> ''
group by lower(btrim(email))
having count(*) > 1
order by duplicate_count desc, normalized_email;

do $$
begin
  if exists (
    select 1
    from public.professionals
    where btrim(email) <> ''
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise exception 'Duplicate professional emails exist. Resolve them before creating professionals_email_normalized_uidx.';
  end if;
end $$;

update public.professionals
set email = lower(btrim(email))
where email <> lower(btrim(email));

create unique index if not exists professionals_email_normalized_uidx
  on public.professionals (lower(btrim(email)))
  where btrim(email) <> '';
