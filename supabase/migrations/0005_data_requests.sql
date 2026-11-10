-- =============================================================================
-- SILKX — 0005_data_requests.sql
-- Запросы субъектов персональных данных (/data-request → /api/data-requests):
-- удаление, доступ, исправление, отзыв согласия, отписка. Журнал нужен, чтобы подтвердить исполнение.
-- Идемпотентна. ВАЖНО: по закону РУз «О персональных данных» (ст. 27-1) база с данными граждан
-- Узбекистана должна физически находиться в Узбекистане — запускайте на сервере в РУз.
-- =============================================================================

create table if not exists public.data_requests (
  id          uuid primary key default gen_random_uuid(),
  type        text        not null check (type in ('delete', 'access', 'correct', 'withdraw', 'unsubscribe')),
  name        text        not null check (char_length(btrim(name)) between 2 and 80),
  contact     text        not null,
  details     text        check (details is null or char_length(details) <= 1000),
  status      text        not null default 'new' check (status in ('new', 'in_progress', 'done', 'rejected')),
  resolution  text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.data_requests enable row level security;
