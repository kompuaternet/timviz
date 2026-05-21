create table if not exists public.service_categories (
  id text primary key,
  name text not null,
  localized_name jsonb not null default '{}'::jsonb,
  slug text not null unique,
  sort_order integer not null default 500,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.service_categories add column if not exists localized_name jsonb not null default '{}'::jsonb;
alter table public.service_categories add column if not exists sort_order integer not null default 500;
alter table public.service_categories add column if not exists is_system boolean not null default true;

insert into public.service_categories (id, name, localized_name, slug, sort_order, is_system)
values
  ('cat_nails', 'Ногти', '{"uk": "Нігті", "ru": "Ногти", "en": "Nails", "fr": "Ongles", "pl": "Paznokcie", "cs": "Nehty", "es": "Uñas", "de": "Nägel"}'::jsonb, 'nails', 10, true),
  ('cat_hair', 'Волосы', '{"uk": "Волосся", "ru": "Волосы", "en": "Hair", "fr": "Cheveux", "pl": "Włosy", "cs": "Vlasy", "es": "Cabello", "de": "Haare"}'::jsonb, 'hair', 20, true),
  ('cat_brows_lashes', 'Брови и ресницы', '{"uk": "Брови та вії", "ru": "Брови и ресницы", "en": "Brows & Lashes", "fr": "Sourcils et cils", "pl": "Brwi i rzęsy", "cs": "Obočí a řasy", "es": "Cejas y pestañas", "de": "Augenbrauen und Wimpern"}'::jsonb, 'brows-lashes', 30, true),
  ('cat_massage', 'Массаж', '{"uk": "Масаж", "ru": "Массаж", "en": "Massage", "fr": "Massage", "pl": "Masaż", "cs": "Masáž", "es": "Masaje", "de": "Massage"}'::jsonb, 'massage', 40, true),
  ('cat_cosmetology', 'Косметология', '{"uk": "Косметологія", "ru": "Косметология", "en": "Cosmetology", "fr": "Cosmétologie", "pl": "Kosmetologia", "cs": "Kosmetologie", "es": "Cosmetología", "de": "Kosmetologie"}'::jsonb, 'cosmetology', 50, true),
  ('cat_face', 'Лицо', '{"uk": "Обличчя", "ru": "Лицо", "en": "Face Care", "fr": "Visage", "pl": "Twarz", "cs": "Obličej", "es": "Rostro", "de": "Gesicht"}'::jsonb, 'face-care', 60, true),
  ('cat_hair_removal', 'Депиляция', '{"uk": "Депіляція", "ru": "Депиляция", "en": "Hair Removal", "fr": "Épilation", "pl": "Depilacja", "cs": "Depilace", "es": "Depilación", "de": "Haarentfernung"}'::jsonb, 'hair-removal', 70, true),
  ('cat_body_spa', 'Тело', '{"uk": "Тіло", "ru": "Тело", "en": "Body / SPA", "fr": "Corps / SPA", "pl": "Ciało / SPA", "cs": "Tělo / SPA", "es": "Cuerpo / SPA", "de": "Körper / SPA"}'::jsonb, 'body-spa', 80, true),
  ('cat_makeup', 'Макияж', '{"uk": "Макіяж", "ru": "Макияж", "en": "Makeup", "fr": "Maquillage", "pl": "Makijaż", "cs": "Make-up", "es": "Maquillaje", "de": "Make-up"}'::jsonb, 'makeup', 90, true),
  ('cat_permanent_makeup', 'Перманентный макияж', '{"uk": "Перманент", "ru": "Перманентный макияж", "en": "Permanent Makeup", "fr": "Maquillage permanent", "pl": "Makijaż permanentny", "cs": "Permanentní make-up", "es": "Maquillaje permanente", "de": "Permanent Make-up"}'::jsonb, 'permanent-makeup', 100, true),
  ('cat_tattoo', 'Тату', '{"uk": "Тату", "ru": "Тату", "en": "Tattoo", "fr": "Tatouage", "pl": "Tatuaż", "cs": "Tetování", "es": "Tatuaje", "de": "Tattoo"}'::jsonb, 'tattoo', 110, true),
  ('cat_education', 'Обучение', '{"uk": "Навчання", "ru": "Обучение", "en": "Education", "fr": "Formation", "pl": "Szkolenia", "cs": "Školení", "es": "Formación", "de": "Schulung"}'::jsonb, 'education', 120, true),
  ('cat_repair', 'Ремонт', '{"uk": "Ремонт", "ru": "Ремонт", "en": "Repair", "fr": "Réparation", "pl": "Naprawa", "cs": "Opravy", "es": "Reparación", "de": "Reparatur"}'::jsonb, 'repair', 130, true),
  ('cat_other', 'Другое', '{"uk": "Інше", "ru": "Другое", "en": "Other", "fr": "Autre", "pl": "Inne", "cs": "Jiné", "es": "Otro", "de": "Andere"}'::jsonb, 'other', 900, true),
  ('cat_no_category', 'Без категории', '{"uk": "Без категорії", "ru": "Без категории", "en": "No Category", "fr": "Sans catégorie", "pl": "Bez kategorii", "cs": "Bez kategorie", "es": "Sin categoría", "de": "Ohne Kategorie"}'::jsonb, 'no-category', 999, true)
on conflict (id) do update
set
  name = excluded.name,
  localized_name = excluded.localized_name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system;

update public.service_categories
set sort_order = case
  when lower(name) in ('нігті', 'ногти', 'nails', 'ongles', 'paznokcie', 'nehty', 'uñas', 'unas', 'nägel', 'nagel') then 10
  when lower(name) in ('волосся', 'волосы', 'hair', 'cheveux', 'włosy', 'wlosy', 'vlasy', 'cabello', 'haare', 'парикмахерская', 'парикмахер', 'перукарня', 'перукар', 'hair salon', 'salon de coiffure', 'salon fryzjerski', 'kadeřnictví', 'kadernictvi', 'peluquería', 'peluqueria', 'friseursalon') then 20
  when lower(name) in ('брови та вії', 'брови и ресницы', 'brows & lashes', 'brows and lashes', 'sourcils et cils', 'brwi i rzęsy', 'brwi i rzesy', 'obočí a řasy', 'oboci a rasy', 'cejas y pestañas', 'cejas y pestanas', 'augenbrauen und wimpern', 'ресницы', 'вії', 'lashes', 'cils', 'rzęsy', 'rzesy', 'řasy', 'rasy', 'pestañas', 'pestanas', 'wimpern') then 30
  when lower(name) in ('масаж', 'массаж', 'massage', 'masaż', 'masaz', 'masáž', 'masaje', 'массажный салон', 'масажний салон', 'massage studio', 'salon de massage', 'gabinet masażu', 'gabinet masazu', 'masážní salon', 'masazni salon', 'centro de masajes', 'massagestudio') then 40
  when lower(name) in ('косметологія', 'косметология', 'cosmetology', 'cosmétologie', 'cosmetologie', 'kosmetologia', 'kosmetologie', 'cosmetología', 'cosmetologia', 'медспа', 'medspa', 'салон красоты', 'салон краси', 'beauty salon', 'institut de beauté', 'institut de beaute', 'salon beauty', 'kosmetický salon', 'kosmeticky salon', 'salón de belleza', 'salon de belleza', 'kosmetikstudio') then 50
  when lower(name) in ('обличчя', 'лицо', 'face care', 'face', 'visage', 'twarz', 'obličej', 'oblicej', 'rostro', 'gesicht') then 60
  when lower(name) in ('депіляція', 'депиляция', 'hair removal', 'depilation', 'épilation', 'epilation', 'depilacja', 'depilace', 'depilación', 'depilacion', 'haarentfernung', 'салон депиляции', 'салон депіляції', 'hair removal salon', 'salon d''épilation', 'salon depilation', 'salon depilacji', 'depilační salon', 'depilacni salon', 'centro de depilación', 'centro de depilacion', 'haarentfernungsstudio') then 70
  when lower(name) in ('тіло', 'тело', 'body / spa', 'body', 'corps / spa', 'corps', 'ciało / spa', 'cialo / spa', 'ciało', 'cialo', 'tělo / spa', 'telo / spa', 'tělo', 'telo', 'cuerpo / spa', 'cuerpo', 'körper / spa', 'korper / spa', 'körper', 'korper', 'спа-салон и сауна', 'спа-салон і сауна', 'spa and sauna', 'spa et sauna', 'spa i sauna', 'spa a sauna', 'spa y sauna', 'spa und sauna', 'студия загара', 'студія засмаги', 'tanning studio', 'studio de bronzage', 'studio opalania', 'solární studio', 'solarni studio', 'centro de bronceado', 'sonnenstudio') then 80
  when lower(name) in ('макіяж', 'макияж', 'makeup', 'make-up', 'maquillage', 'makijaż', 'makijaz', 'maquillaje') then 90
  when lower(name) in ('перманент', 'перманентный макияж', 'permanent makeup', 'permanent make-up', 'тату / перманент', 'maquillage permanent', 'makijaż permanentny', 'makijaz permanentny', 'permanentní make-up', 'permanentni make-up', 'maquillaje permanente') then 100
  when lower(name) in ('тату', 'tattoo', 'tatouage', 'tatuaż', 'tatuaz', 'tetování', 'tetovani', 'tatuaje', 'тату и пирсинг', 'тату та пірсинг', 'tattoo and piercing', 'tatouage et piercing', 'tatuaż i piercing', 'tatuaz i piercing', 'tetování a piercing', 'tetovani a piercing', 'tatuajes y piercing', 'tattoo und piercing') then 110
  when lower(name) in ('навчання', 'обучение', 'education', 'training', 'formation', 'szkolenia', 'školení', 'skoleni', 'formación', 'formacion', 'schulung') then 120
  when lower(name) in ('ремонт', 'repair', 'réparation', 'reparation', 'naprawa', 'opravy', 'reparación', 'reparacion', 'reparatur') then 130
  when lower(name) in ('інше', 'другое', 'другая', 'other', 'autre', 'inne', 'jiné', 'jine', 'otro', 'otra', 'andere') then 900
  when lower(name) in ('без категорії', 'без категории', 'no category', 'uncategorized', 'sans catégorie', 'sans categorie', 'bez kategorii', 'bez kategorie', 'sin categoría', 'sin categoria', 'ohne kategorie') then 999
  else sort_order
end;

update public.service_categories
set localized_name = case
  when lower(name) in ('нігті', 'ногти', 'nails', 'ongles', 'paznokcie', 'nehty', 'uñas', 'unas', 'nägel', 'nagel') then '{"uk": "Нігті", "ru": "Ногти", "en": "Nails", "fr": "Ongles", "pl": "Paznokcie", "cs": "Nehty", "es": "Uñas", "de": "Nägel"}'::jsonb
  when lower(name) in ('волосся', 'волосы', 'hair', 'cheveux', 'włosy', 'wlosy', 'vlasy', 'cabello', 'haare', 'парикмахерская', 'парикмахер', 'перукарня', 'перукар', 'hair salon', 'salon de coiffure', 'salon fryzjerski', 'kadeřnictví', 'kadernictvi', 'peluquería', 'peluqueria', 'friseursalon') then '{"uk": "Волосся", "ru": "Волосы", "en": "Hair", "fr": "Cheveux", "pl": "Włosy", "cs": "Vlasy", "es": "Cabello", "de": "Haare"}'::jsonb
  when lower(name) in ('брови та вії', 'брови и ресницы', 'brows & lashes', 'brows and lashes', 'sourcils et cils', 'brwi i rzęsy', 'brwi i rzesy', 'obočí a řasy', 'oboci a rasy', 'cejas y pestañas', 'cejas y pestanas', 'augenbrauen und wimpern', 'ресницы', 'вії', 'lashes', 'cils', 'rzęsy', 'rzesy', 'řasy', 'rasy', 'pestañas', 'pestanas', 'wimpern') then '{"uk": "Брови та вії", "ru": "Брови и ресницы", "en": "Brows & Lashes", "fr": "Sourcils et cils", "pl": "Brwi i rzęsy", "cs": "Obočí a řasy", "es": "Cejas y pestañas", "de": "Augenbrauen und Wimpern"}'::jsonb
  when lower(name) in ('масаж', 'массаж', 'massage', 'masaż', 'masaz', 'masáž', 'masaje', 'массажный салон', 'масажний салон', 'massage studio', 'salon de massage', 'gabinet masażu', 'gabinet masazu', 'masážní salon', 'masazni salon', 'centro de masajes', 'massagestudio') then '{"uk": "Масаж", "ru": "Массаж", "en": "Massage", "fr": "Massage", "pl": "Masaż", "cs": "Masáž", "es": "Masaje", "de": "Massage"}'::jsonb
  when lower(name) in ('косметологія', 'косметология', 'cosmetology', 'cosmétologie', 'cosmetologie', 'kosmetologia', 'kosmetologie', 'cosmetología', 'cosmetologia', 'медспа', 'medspa', 'салон красоты', 'салон краси', 'beauty salon', 'institut de beauté', 'institut de beaute', 'salon beauty', 'kosmetický salon', 'kosmeticky salon', 'salón de belleza', 'salon de belleza', 'kosmetikstudio') then '{"uk": "Косметологія", "ru": "Косметология", "en": "Cosmetology", "fr": "Cosmétologie", "pl": "Kosmetologia", "cs": "Kosmetologie", "es": "Cosmetología", "de": "Kosmetologie"}'::jsonb
  when lower(name) in ('обличчя', 'лицо', 'face care', 'face', 'visage', 'twarz', 'obličej', 'oblicej', 'rostro', 'gesicht') then '{"uk": "Обличчя", "ru": "Лицо", "en": "Face Care", "fr": "Visage", "pl": "Twarz", "cs": "Obličej", "es": "Rostro", "de": "Gesicht"}'::jsonb
  when lower(name) in ('депіляція', 'депиляция', 'hair removal', 'depilation', 'épilation', 'epilation', 'depilacja', 'depilace', 'depilación', 'depilacion', 'haarentfernung', 'салон депиляции', 'салон депіляції', 'hair removal salon', 'salon d''épilation', 'salon depilation', 'salon depilacji', 'depilační salon', 'depilacni salon', 'centro de depilación', 'centro de depilacion', 'haarentfernungsstudio') then '{"uk": "Депіляція", "ru": "Депиляция", "en": "Hair Removal", "fr": "Épilation", "pl": "Depilacja", "cs": "Depilace", "es": "Depilación", "de": "Haarentfernung"}'::jsonb
  when lower(name) in ('тіло', 'тело', 'body / spa', 'body', 'corps / spa', 'corps', 'ciało / spa', 'cialo / spa', 'ciało', 'cialo', 'tělo / spa', 'telo / spa', 'tělo', 'telo', 'cuerpo / spa', 'cuerpo', 'körper / spa', 'korper / spa', 'körper', 'korper', 'спа-салон и сауна', 'спа-салон і сауна', 'spa and sauna', 'spa et sauna', 'spa i sauna', 'spa a sauna', 'spa y sauna', 'spa und sauna', 'студия загара', 'студія засмаги', 'tanning studio', 'studio de bronzage', 'studio opalania', 'solární studio', 'solarni studio', 'centro de bronceado', 'sonnenstudio') then '{"uk": "Тіло", "ru": "Тело", "en": "Body / SPA", "fr": "Corps / SPA", "pl": "Ciało / SPA", "cs": "Tělo / SPA", "es": "Cuerpo / SPA", "de": "Körper / SPA"}'::jsonb
  when lower(name) in ('макіяж', 'макияж', 'makeup', 'make-up', 'maquillage', 'makijaż', 'makijaz', 'maquillaje') then '{"uk": "Макіяж", "ru": "Макияж", "en": "Makeup", "fr": "Maquillage", "pl": "Makijaż", "cs": "Make-up", "es": "Maquillaje", "de": "Make-up"}'::jsonb
  when lower(name) in ('перманент', 'перманентный макияж', 'permanent makeup', 'permanent make-up', 'тату / перманент', 'maquillage permanent', 'makijaż permanentny', 'makijaz permanentny', 'permanentní make-up', 'permanentni make-up', 'maquillaje permanente') then '{"uk": "Перманент", "ru": "Перманентный макияж", "en": "Permanent Makeup", "fr": "Maquillage permanent", "pl": "Makijaż permanentny", "cs": "Permanentní make-up", "es": "Maquillaje permanente", "de": "Permanent Make-up"}'::jsonb
  when lower(name) in ('тату', 'tattoo', 'tatouage', 'tatuaż', 'tatuaz', 'tetování', 'tetovani', 'tatuaje', 'тату и пирсинг', 'тату та пірсинг', 'tattoo and piercing', 'tatouage et piercing', 'tatuaż i piercing', 'tatuaz i piercing', 'tetování a piercing', 'tetovani a piercing', 'tatuajes y piercing', 'tattoo und piercing') then '{"uk": "Тату", "ru": "Тату", "en": "Tattoo", "fr": "Tatouage", "pl": "Tatuaż", "cs": "Tetování", "es": "Tatuaje", "de": "Tattoo"}'::jsonb
  when lower(name) in ('навчання', 'обучение', 'education', 'training', 'formation', 'szkolenia', 'školení', 'skoleni', 'formación', 'formacion', 'schulung') then '{"uk": "Навчання", "ru": "Обучение", "en": "Education", "fr": "Formation", "pl": "Szkolenia", "cs": "Školení", "es": "Formación", "de": "Schulung"}'::jsonb
  when lower(name) in ('ремонт', 'repair', 'réparation', 'reparation', 'naprawa', 'opravy', 'reparación', 'reparacion', 'reparatur') then '{"uk": "Ремонт", "ru": "Ремонт", "en": "Repair", "fr": "Réparation", "pl": "Naprawa", "cs": "Opravy", "es": "Reparación", "de": "Reparatur"}'::jsonb
  when lower(name) in ('інше', 'другое', 'другая', 'other', 'autre', 'inne', 'jiné', 'jine', 'otro', 'otra', 'andere') then '{"uk": "Інше", "ru": "Другое", "en": "Other", "fr": "Autre", "pl": "Inne", "cs": "Jiné", "es": "Otro", "de": "Andere"}'::jsonb
  when lower(name) in ('без категорії', 'без категории', 'no category', 'uncategorized', 'sans catégorie', 'sans categorie', 'bez kategorii', 'bez kategorie', 'sin categoría', 'sin categoria', 'ohne kategorie') then '{"uk": "Без категорії", "ru": "Без категории", "en": "No Category", "fr": "Sans catégorie", "pl": "Bez kategorii", "cs": "Bez kategorie", "es": "Sin categoría", "de": "Ohne Kategorie"}'::jsonb
  else localized_name
end;

create index if not exists service_categories_sort_order_idx on public.service_categories (sort_order, name);
