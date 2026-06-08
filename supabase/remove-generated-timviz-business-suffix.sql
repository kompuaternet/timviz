-- Removes the generated trailing "Timviz" suffix from existing business names.
-- Intended for historical social/mobile registrations that created names like "Vitaliy Timviz".

update public.businesses
set name = nullif(trim(regexp_replace(name, '\s+Timviz\s*$', '', 'i')), '')
where name ~* '\s+Timviz\s*$'
  and nullif(trim(regexp_replace(name, '\s+Timviz\s*$', '', 'i')), '') is not null;
