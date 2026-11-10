-- =============================================================================
-- SILKX — 0003_listing_seller.sql
-- Кто разместил объявление: собственник или риелтор/агентство (+ данные компании).
-- Идемпотентна: можно безопасно прогонять повторно в SQL Editor.
-- =============================================================================

alter table public.listings
  add column if not exists seller_type text not null default 'owner',
  add column if not exists company     jsonb;

do $$ begin
  alter table public.listings
    add constraint listings_seller_type_check check (seller_type in ('owner', 'agent'));
exception when duplicate_object then null; end $$;

do $$ begin
  -- Компания есть только у риелтора, и у неё обязательно есть название
  alter table public.listings
    add constraint listings_company_check check (
      (seller_type = 'owner' and company is null)
      or (seller_type = 'agent' and company ? 'name' and char_length(btrim(company ->> 'name')) between 2 and 120)
    );
exception when duplicate_object then null; end $$;

comment on column public.listings.company is
  'Данные агентства риелтора: {name, position, phone, website, address, license, about}. NULL у собственников.';

create index if not exists idx_listings_seller_type on public.listings (seller_type) where status = 'published';
