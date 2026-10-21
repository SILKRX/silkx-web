-- =============================================================================
-- SILKX — 0001_init.sql
-- Таблицы complexes / leads + RLS + защита от спама на уровне БД.
-- Идемпотентна: можно безопасно прогонять повторно в SQL Editor.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM-типы (жёстко ограничиваем значения — никаких опечаток в данных)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.complex_class as enum ('economy', 'comfort', 'business', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum ('new', 'sent_to_developer', 'in_progress', 'won', 'lost', 'spam');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Общий триггер updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- COMPLEXES — жилые комплексы
-- ---------------------------------------------------------------------------
create table if not exists public.complexes (
  id               uuid primary key default gen_random_uuid(),
  title            text        not null check (char_length(btrim(title)) between 2 and 120),
  developer        text        not null check (char_length(btrim(developer)) between 2 and 120),
  price_from       bigint      not null check (price_from > 0),            -- в минимальных единицах валюты (без float!)
  currency         text        not null default 'USD' check (currency in ('USD', 'UZS')),
  completion_year  smallint    not null check (completion_year between 2000 and 2100),
  class_type       public.complex_class not null,
  location         text        not null check (char_length(btrim(location)) between 2 and 200),
  description      text        not null default '' check (char_length(description) <= 10000),
  main_image_url   text        check (main_image_url is null or main_image_url ~* '^https://'),
  -- Служебные поля для витрины (MVP-главная):
  is_published     boolean     not null default false,   -- черновики не видны анонимам
  is_hot           boolean     not null default false,   -- карусель «Горячие старты»
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.complexes.price_from is 'Цена «от» в целых единицах валюты (USD/UZS). Не используем numeric/float для денег на фронте.';

drop trigger if exists trg_complexes_updated_at on public.complexes;
create trigger trg_complexes_updated_at
  before update on public.complexes
  for each row execute function public.set_updated_at();

-- Индексы под фильтры каталога и карусели главной
create index if not exists idx_complexes_published_class on public.complexes (class_type)        where is_published;
create index if not exists idx_complexes_published_price on public.complexes (price_from)        where is_published;
create index if not exists idx_complexes_published_year  on public.complexes (completion_year)   where is_published;
create index if not exists idx_complexes_hot             on public.complexes (sort_order)        where is_published and is_hot;

-- ---------------------------------------------------------------------------
-- LEADS — заявки
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  complex_id  uuid        not null references public.complexes (id) on delete restrict, -- лид = деньги, каскадно не удаляем
  name        text        not null check (char_length(btrim(name)) between 2 and 60),
  phone       text        not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),              -- строго E.164, нормализуем на сервере
  status      public.lead_status not null default 'new',
  source      text        check (source is null or char_length(source) <= 100),        -- utm_source / reels и т.п.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create index if not exists idx_leads_complex_id       on public.leads (complex_id);
create index if not exists idx_leads_status_created   on public.leads (status, created_at desc);
create index if not exists idx_leads_phone_complex    on public.leads (phone, complex_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Анти-спам на уровне БД (последний рубеж, даже если API обойдут):
--  1) тот же телефон + тот же ЖК — не чаще 1 раза в 10 минут
--  2) один телефон — не более 5 заявок в час суммарно
--  3) лид можно создать только на опубликованный ЖК
-- Ошибки с SQLSTATE P0001 + понятным message — API отдаст их как 429/400.
-- ---------------------------------------------------------------------------
create or replace function public.guard_lead_insert()
returns trigger
language plpgsql
security definer           -- нужен доступ к leads, который анониму закрыт RLS
set search_path = public
as $$
begin
  if not exists (select 1 from public.complexes c where c.id = new.complex_id and c.is_published) then
    raise exception 'COMPLEX_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.leads l
    where l.phone = new.phone
      and l.complex_id = new.complex_id
      and l.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'DUPLICATE_LEAD' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.leads l
    where l.phone = new.phone
      and l.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  -- Клиент не имеет права выставить себе статус/время
  new.status     := 'new';
  new.created_at := now();
  new.updated_at := now();
  new.name       := btrim(new.name);
  return new;
end;
$$;

drop trigger if exists trg_leads_guard on public.leads;
create trigger trg_leads_guard
  before insert on public.leads
  for each row execute function public.guard_lead_insert();

revoke all on function public.guard_lead_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.complexes enable row level security;
alter table public.leads     enable row level security;
alter table public.complexes force row level security;
alter table public.leads     force row level security;

-- Гранты: минимально необходимые. RLS без грантов не работает, гранты без RLS — дыра.
revoke all on public.complexes from anon, authenticated;
revoke all on public.leads     from anon, authenticated;
grant select on public.complexes to anon, authenticated;
grant insert (complex_id, name, phone, source) on public.leads to anon, authenticated; -- только эти колонки

-- complexes: все читают только опубликованные
drop policy if exists "complexes_public_read" on public.complexes;
create policy "complexes_public_read"
  on public.complexes
  for select
  to anon, authenticated
  using (is_published = true);

-- leads: анонимы могут только вставлять. SELECT/UPDATE/DELETE политик нет → запрещено.
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert"
  on public.leads
  for insert
  to anon, authenticated
  with check (status = 'new');

-- Чтение/управление лидами — только service_role (наш серверный API и админка),
-- он обходит RLS по определению. Отдельные политики не нужны.

-- ---------------------------------------------------------------------------
-- ВАЖНО для клиента: при insert НЕ вызывать .select() после .insert(),
-- иначе PostgREST попытается вернуть строку и упрётся в отсутствие SELECT-политики.
-- В нашем API вставка идёт через service_role, это касается только прямых вызовов.
-- ---------------------------------------------------------------------------
