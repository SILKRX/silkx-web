-- =============================================================================
-- 0006 — Заявки по объектам (новостройки, вторичка, аренда) + входящие лиды для агентства.
-- В отличие от leads (0001, только ЖК по uuid), здесь property_id — текстовый id объекта каталога
-- (демо-объекты и одобренные объявления). Пишет только сервер (service role); аноним не имеет доступа.
-- Идемпотентна.
-- =============================================================================

create table if not exists public.property_leads (
  id                uuid primary key default gen_random_uuid(),
  property_id       text        not null check (char_length(property_id) between 1 and 120),
  property_title    text        check (property_title is null or char_length(property_title) <= 200),
  property_kind     text        check (property_kind in ('new', 'secondary', 'rent')),
  agency            text        check (agency is null or char_length(agency) <= 120), -- для маршрутизации на агентство
  name              text        not null check (char_length(btrim(name)) between 2 and 60),
  phone             text        not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  contact_via       text        not null default 'call' check (contact_via in ('call', 'telegram', 'whatsapp')),
  intent            text        not null default 'viewing' check (intent in ('viewing', 'consult', 'mortgage', 'documents')),
  comment           text        check (comment is null or char_length(comment) <= 1000),
  source            text        check (source is null or char_length(source) <= 100),   -- form / assistant / utm_source
  utm               jsonb,
  locale            text        check (locale is null or char_length(locale) <= 10),
  status            public.lead_status not null default 'new',
  manager_note      text        check (manager_note is null or char_length(manager_note) <= 2000),
  submitter_ip      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_property_leads_updated_at on public.property_leads;
create trigger trg_property_leads_updated_at
  before update on public.property_leads
  for each row execute function public.set_updated_at();

create index if not exists idx_property_leads_status_created on public.property_leads (status, created_at desc);
create index if not exists idx_property_leads_property       on public.property_leads (property_id, created_at desc);
create index if not exists idx_property_leads_phone          on public.property_leads (phone, created_at desc);
create index if not exists idx_property_leads_agency         on public.property_leads (agency, created_at desc);

-- Анти-спам на уровне БД: тот же телефон + тот же объект — не чаще раза в 10 минут; телефон — до 8 заявок в час.
create or replace function public.guard_property_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.property_leads l
    where l.phone = new.phone and l.property_id = new.property_id
      and l.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'DUPLICATE_LEAD' using errcode = 'P0001';
  end if;
  if (select count(*) from public.property_leads l
      where l.phone = new.phone and l.created_at > now() - interval '1 hour') >= 8 then
    raise exception 'TOO_MANY_LEADS' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_property_lead on public.property_leads;
create trigger trg_guard_property_lead
  before insert on public.property_leads
  for each row execute function public.guard_property_lead_insert();

-- RLS: включён, политик для anon/authenticated нет → доступ только у service role (сервер SILKX).
alter table public.property_leads enable row level security;
revoke all on public.property_leads from anon, authenticated;
