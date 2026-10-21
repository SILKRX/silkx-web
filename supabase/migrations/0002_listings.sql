-- =============================================================================
-- SILKX — 0002_listings.sql
-- Объявления собственников («Разместить объект») + бакет для фото и 360°-панорам.
-- Идемпотентна. Запуск: Supabase → SQL Editor → вставить → Run.
-- =============================================================================

do $$ begin
  create type public.listing_status as enum ('moderation', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  category      text        not null check (category in ('apartment', 'house', 'room', 'commercial', 'land')),
  deal_type     text        not null check (deal_type in ('sale', 'rent')),
  rent_term     text        check (rent_term is null or rent_term in ('month', 'day')),
  title         text        not null check (char_length(btrim(title)) between 5 and 120),
  description   text        not null check (char_length(description) between 20 and 3000),
  price         bigint      not null check (price > 0),
  currency      text        not null check (currency in ('USD', 'UZS')),
  rooms         smallint    check (rooms is null or rooms between 0 and 20),
  area_m2       numeric(9,1) not null check (area_m2 > 0),
  floor         smallint,
  floors_total  smallint,
  district      text        not null,
  address       text        not null check (char_length(address) between 5 and 200),
  lat           double precision not null check (lat between 41.1 and 41.5),
  lng           double precision not null check (lng between 69.05 and 69.55),
  contact_name  text        not null,
  phone         text        not null check (phone ~ '^\+998[2-9][0-9]{8}$'),
  telegram      text,
  photos        jsonb       not null default '[]'::jsonb,   -- ["pending/<draft>/<uuid>.jpg", …]
  panoramas     jsonb       not null default '[]'::jsonb,   -- [{"path": "...", "title": "Гостиная"}, …]
  status        public.listing_status not null default 'moderation',
  moderator_note text,
  submitter_ip  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create index if not exists idx_listings_status_created on public.listings (status, created_at desc);
create index if not exists idx_listings_published_geo  on public.listings (lat, lng) where status = 'published';

-- RLS: аноним видит только опубликованные. Вставка — только через API (service role обходит RLS).
alter table public.listings enable row level security;

drop policy if exists "listings_public_read" on public.listings;
create policy "listings_public_read" on public.listings
  for select to anon, authenticated
  using (status = 'published');

-- Телефон собственника не отдаём анонимам напрямую — только через заявку/API.
revoke select (phone, telegram, submitter_ip, moderator_note) on public.listings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: бакет listings (публичное чтение, запись только сервером)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listings', 'listings', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
