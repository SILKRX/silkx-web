-- SILKX — 0003: подробности объявления (дом, коммуникации, аренда/продажа, для иностранцев)
alter table public.listings add column if not exists details jsonb not null default '{}'::jsonb;
