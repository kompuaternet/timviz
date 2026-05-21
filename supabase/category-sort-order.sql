create table if not exists public.service_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  sort_order integer not null default 500,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.service_categories add column if not exists sort_order integer not null default 500;
alter table public.service_categories add column if not exists is_system boolean not null default true;

insert into public.service_categories (id, name, slug, sort_order, is_system)
values
  ('cat_nails', 'Ногти', 'nails', 10, true),
  ('cat_hair', 'Волосы', 'hair', 20, true),
  ('cat_brows_lashes', 'Брови и ресницы', 'brows-lashes', 30, true),
  ('cat_massage', 'Массаж', 'massage', 40, true),
  ('cat_cosmetology', 'Косметология', 'cosmetology', 50, true),
  ('cat_face', 'Лицо', 'face-care', 60, true),
  ('cat_hair_removal', 'Депиляция', 'hair-removal', 70, true),
  ('cat_body_spa', 'Тело', 'body-spa', 80, true),
  ('cat_makeup', 'Макияж', 'makeup', 90, true),
  ('cat_permanent_makeup', 'Перманентный макияж', 'permanent-makeup', 100, true),
  ('cat_tattoo', 'Тату', 'tattoo', 110, true),
  ('cat_education', 'Обучение', 'education', 120, true),
  ('cat_repair', 'Ремонт', 'repair', 130, true),
  ('cat_other', 'Другое', 'other', 900, true),
  ('cat_no_category', 'Без категории', 'no-category', 999, true)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

update public.service_categories
set sort_order = case
  when lower(name) in ('нігті', 'ногти', 'nails') then 10
  when lower(name) in ('волосся', 'волосы', 'hair', 'парикмахерская', 'парикмахер') then 20
  when lower(name) in ('брови та вії', 'брови и ресницы', 'brows & lashes', 'brows and lashes') then 30
  when lower(name) in ('масаж', 'массаж', 'massage', 'массажный салон') then 40
  when lower(name) in ('косметологія', 'косметология', 'cosmetology', 'медспа', 'салон красоты') then 50
  when lower(name) in ('обличчя', 'лицо', 'face care', 'face') then 60
  when lower(name) in ('депіляція', 'депиляция', 'hair removal', 'салон депиляции') then 70
  when lower(name) in ('тіло', 'тело', 'body / spa', 'body', 'спа-салон и сауна', 'студия загара') then 80
  when lower(name) in ('макіяж', 'макияж', 'makeup') then 90
  when lower(name) in ('перманент', 'перманентный макияж', 'permanent makeup', 'тату / перманент') then 100
  when lower(name) in ('тату', 'tattoo', 'тату и пирсинг') then 110
  when lower(name) in ('навчання', 'обучение', 'education') then 120
  when lower(name) in ('ремонт', 'repair') then 130
  when lower(name) in ('інше', 'другое', 'другая', 'other') then 900
  when lower(name) in ('без категорії', 'без категории', 'no category', 'uncategorized') then 999
  else sort_order
end;

create index if not exists service_categories_sort_order_idx on public.service_categories (sort_order, name);
