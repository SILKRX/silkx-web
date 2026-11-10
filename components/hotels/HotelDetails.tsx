import { ArrowLeft, Clock, Globe, Languages, Mail, MapPin, Phone, Send, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BookingForm } from "@/components/hotels/BookingForm";
import { Stars } from "@/components/hotels/HotelCard";
import { RoomCard } from "@/components/hotels/RoomCard";
import { PropertyMap } from "@/components/map/PropertyMap";
import { TourButton } from "@/components/tour/TourButton";
import { TourEmbed } from "@/components/tour/TourEmbed";
import { formatNumber, pluralize } from "@/lib/format";
import { hotelMinPrice, hotelRoomsCount, telHref } from "@/lib/hotels";
import type { Hotel } from "@/lib/hotels";
import { TASHKENT_DISTRICTS } from "@/lib/types";

export function HotelDetails({ hotel: h }: { hotel: Hotel }) {
  const district = TASHKENT_DISTRICTS[h.district];
  const [cover, ...rest] = [h.imageUrl, ...h.gallery].slice(0, 5);
  const tour = h.tour ?? [];
  const { price } = hotelMinPrice(h);
  const roomsTotal = hotelRoomsCount(h);

  const contacts = [
    { icon: Phone, label: "Телефон ресепшена", value: h.phone, href: telHref(h.phone) },
    h.telegram && { icon: Send, label: "Telegram", value: `@${h.telegram}`, href: `https://t.me/${h.telegram}` },
    h.email && { icon: Mail, label: "E-mail", value: h.email, href: `mailto:${h.email}` },
    h.website && { icon: Globe, label: "Сайт", value: h.website.replace(/^https?:\/\//, ""), href: h.website },
  ].filter((c): c is { icon: typeof Phone; label: string; value: string; href: string } => Boolean(c));

  const facts = [
    h.rating
      ? { icon: Star, label: `Оценка (${h.rating.source})`, value: `${h.rating.score.toFixed(1)} / ${h.rating.outOf}` }
      : { icon: Star, label: "Категория", value: `${h.stars} ${pluralize(h.stars, { one: "звезда", few: "звезды", many: "звёзд" })}` },
    { icon: Clock, label: "Заезд / выезд", value: `${h.checkIn} / ${h.checkOut}` },
    { icon: Sparkles, label: "Номеров", value: `${roomsTotal} · ${h.rooms.length} ${pluralize(h.rooms.length, { one: "тип", few: "типа", many: "типов" })}` },
    { icon: Languages, label: "Языки", value: h.languages.join(", ") },
  ];

  return (
    <main className="container pb-cta-safe pt-6 sm:pb-16">
      <Link href="/hotels" className="inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-gold">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Все отели
      </Link>

      {/* Галерея */}
      <div className="mt-4 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-card sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[420px]">
          {cover && <Image src={cover} alt={h.name} fill priority sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />}
          {tour.length > 0 && (
            <div className="absolute bottom-3 left-3">
              <TourButton scenes={tour} title={h.name} variant="overlay" />
            </div>
          )}
        </div>
        {rest.map((src, i) => (
          <div key={src} className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-card sm:block">
            <Image src={src} alt={`${h.name} — фото ${i + 2}`} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          <header>
            <Stars count={h.stars} />
            <h1 className="mt-2 text-2xl sm:text-4xl">{h.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {district} р-н · {h.address}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {h.tags.map((t) => (
                <li key={t} className="rounded-md bg-gold-muted px-2.5 py-1.5 text-xs font-medium text-gold">
                  {t}
                </li>
              ))}
            </ul>
          </header>

          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="terminal-panel p-4">
                <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-body">
                  <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1.5 font-heading text-base font-semibold text-heading">{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="about-title">
            <h2 id="about-title" className="text-xl sm:text-2xl">
              Об отеле
            </h2>
            <p className="mt-3 leading-relaxed">{h.description}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {h.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm text-heading">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>
          </section>

          {tour.length > 0 && (
            <section aria-labelledby="tour-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">Осмотр онлайн</p>
                  <h2 id="tour-title" className="mt-1 text-xl sm:text-2xl">
                    3D-тур по отелю
                  </h2>
                </div>
                <p className="hidden text-sm sm:block">Лобби, ресторан и номер — в 360°</p>
              </div>
              <TourEmbed scenes={tour} className="aspect-[4/3] w-full sm:aspect-video" />
            </section>
          )}

          <section aria-labelledby="rooms-title">
            <h2 id="rooms-title" className="text-xl sm:text-2xl">
              Номера и цены
            </h2>
            <p className="mt-1 text-sm">У каждого номера — 3D-тур 360°: осмотрите комнату до заезда.</p>
            <div className="mt-5 space-y-4">
              {h.rooms.map((r) => (
                <RoomCard key={r.id} room={r} hotelName={h.name} />
              ))}
            </div>
          </section>

          <section aria-labelledby="map-title">
            <h2 id="map-title" className="mb-4 text-xl sm:text-2xl">
              Расположение
            </h2>
            <PropertyMap point={h.location} address={`${district} р-н, ${h.address}`} />
          </section>
        </div>

        {/* Контакты и бронирование: на десктопе — липкая колонка */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="terminal-panel space-y-3 p-5">
            <p className="text-xs uppercase tracking-wider text-body">Контакты отеля</p>
            <ul className="space-y-2.5">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-line/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-muted">
                      <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-body">{label}</span>
                      <span className="block truncate font-medium text-heading group-hover:text-gold">{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <BookingForm hotel={h} />
        </aside>
      </div>

      {/* Мобильная панель: цена + позвонить + забронировать */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line/10 bg-background/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <p className="min-w-0 flex-1 truncate font-heading text-lg font-bold text-heading">
          от ${formatNumber(price)}
          <span className="text-xs font-medium text-body"> / ночь</span>
        </p>
        <a
          href={telHref(h.phone)}
          aria-label={`Позвонить в отель: ${h.phone}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold-muted text-gold"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
        <a href="#booking" className="flex h-11 items-center rounded-lg bg-gold px-4 font-heading text-sm font-semibold text-graphite">
          Забронировать
        </a>
      </div>
    </main>
  );
}

export default HotelDetails;
