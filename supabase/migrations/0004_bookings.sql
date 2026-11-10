-- =============================================================================
-- SILKX — 0004_bookings.sql
-- Заявки на онлайн-бронирование номеров в отелях (/hotels/[id] → /api/bookings).
-- Идемпотентна. Запуск: Supabase → SQL Editor → вставить → Run.
-- =============================================================================

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  hotel_id      text        not null,
  room_id       text        not null,
  check_in      date        not null,
  check_out     date        not null check (check_out > check_in),
  guests        smallint    not null check (guests between 1 and 10),
  guest_name    text        not null check (char_length(btrim(guest_name)) between 2 and 80),
  phone         text        not null check (phone ~ '^\+[0-9]{7,15}$'),
  comment       text        check (comment is null or char_length(comment) <= 500),
  nights        smallint    not null check (nights between 1 and 60),
  total_price   numeric(12,2) not null check (total_price >= 0),
  currency      text        not null check (currency in ('USD', 'UZS')),
  status        text        not null default 'new' check (status in ('new', 'confirmed', 'cancelled')),
  submitter_ip  text,
  created_at    timestamptz not null default now()
);

create index if not exists bookings_hotel_dates_idx on public.bookings (hotel_id, check_in);

-- Доступ только с сервера (service-role обходит RLS); анонимным клиентам — ничего.
alter table public.bookings enable row level security;
