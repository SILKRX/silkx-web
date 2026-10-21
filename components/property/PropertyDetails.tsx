import { ArrowLeft, Building2, Layers, MapPin, Maximize2, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PropertyMap } from "@/components/map/PropertyMap";
import { TourButton } from "@/components/tour/TourButton";
import { TourEmbed } from "@/components/tour/TourEmbed";
import { formatPrice, formatRooms } from "@/lib/format";
import { DEMO_GALLERY } from "@/lib/mock-data";
import { SITE } from "@/lib/site-config";
import { PROPERTY_CATEGORIES, TASHKENT_DISTRICTS } from "@/lib/types";
import type { Property } from "@/lib/types";

const DEFAULT_DESCRIPTION =
  "Подробное описание появится после проверки объекта модератором SILKX. Оставьте заявку — пришлём планировки, документы и актуальные условия.";

export function PropertyDetails({ property: p }: { property: Property }) {
  const district = TASHKENT_DISTRICTS[p.district];
  const images = [p.imageUrl, ...(p.gallery ?? DEMO_GALLERY)].filter((x): x is string => Boolean(x)).slice(0, 5);
  const [cover, ...rest] = images;
  const tour = p.tour ?? [];
  const price = p.rentTerm === "day" ? formatPrice(p.price, p.currency, p.type).replace("/ мес", "/ сутки") : formatPrice(p.price, p.currency, p.type);

  const facts = [
    p.category && { icon: Building2, label: "Тип", value: PROPERTY_CATEGORIES[p.category] },
    { icon: Layers, label: "Комнат", value: formatRooms(p.rooms) },
    { icon: Maximize2, label: "Площадь", value: `${p.type === "sale" ? "от " : ""}${Math.round(p.areaM2)} м²` },
    p.floor !== undefined && { icon: Layers, label: "Этаж", value: p.floorsTotal ? `${p.floor} из ${p.floorsTotal}` : String(p.floor) },
  ].filter((f): f is { icon: typeof Building2; label: string; value: string } => Boolean(f));

  const contactHref = SITE.socials.telegram || (SITE.phone ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}` : "");

  return (
    <main className="container pb-cta-safe pt-6 sm:pb-16">
      <Link
        href={p.type === "sale" ? "/catalog" : "/catalog?type=rent"}
        className="inline-flex items-center gap-1.5 text-sm text-body transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {p.type === "sale" ? "Все новостройки" : "Вся аренда"}
      </Link>

      {/* Галерея */}
      <div className="mt-4 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-card sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[420px]">
          {cover && <Image src={cover} alt={p.title} fill priority sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />}
          {tour.length > 0 && (
            <div className="absolute bottom-3 left-3">
              <TourButton scenes={tour} title={p.title} variant="overlay" />
            </div>
          )}
        </div>
        {rest.map((src, i) => (
          <div key={src} className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-card sm:block">
            <Image src={src} alt={`${p.title} — фото ${i + 2}`} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <header>
            <h1 className="text-2xl sm:text-4xl">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              {district} р-н{p.address ? ` · ${p.address}` : ""}
            </p>
            {p.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li key={t} className="rounded-md bg-gold-muted px-2.5 py-1.5 text-xs font-medium text-gold">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </header>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="terminal-panel p-4">
                <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-body">
                  <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1.5 font-heading text-lg font-semibold text-heading">{value}</dd>
              </div>
            ))}
          </dl>

          {tour.length > 0 && (
            <section aria-labelledby="tour-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">Осмотр онлайн</p>
                  <h2 id="tour-title" className="mt-1 text-xl sm:text-2xl">
                    3D-тур 360°
                  </h2>
                </div>
                <p className="hidden text-sm sm:block">{tour.length} комнаты · перетаскивайте, чтобы осмотреться</p>
              </div>
              <TourEmbed scenes={tour} className="aspect-[4/3] w-full sm:aspect-video" />
            </section>
          )}

          <section aria-labelledby="about-title">
            <h2 id="about-title" className="text-xl sm:text-2xl">
              Описание
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{p.description ?? DEFAULT_DESCRIPTION}</p>
          </section>

          {p.location && (
            <section aria-labelledby="map-title">
              <h2 id="map-title" className="mb-4 text-xl sm:text-2xl">
                Расположение
              </h2>
              <PropertyMap point={p.location} address={p.address ? `${district} р-н, ${p.address}` : undefined} />
            </section>
          )}
        </div>

        {/* Цена и действия: на десктопе — липкая колонка, на мобильном — панель снизу */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="terminal-panel hidden space-y-4 p-6 lg:block">
            <p className="text-xs uppercase tracking-wider text-body">{p.type === "sale" ? "Стоимость" : "Аренда"}</p>
            <p className="tabular font-heading text-3xl font-bold text-heading">{price}</p>
            {tour.length > 0 && <TourButton scenes={tour} title={p.title} className="w-full" />}
            {contactHref && (
              <a
                href={contactHref}
                target={contactHref.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Записаться на просмотр
              </a>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-white/5 bg-background/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <p className="tabular min-w-0 flex-1 truncate font-heading text-lg font-bold text-heading">{price}</p>
        {tour.length > 0 && (
          <TourButton scenes={tour} title={p.title} className="h-11 px-3 text-sm" />
        )}
        {contactHref && (
          <a
            href={contactHref}
            target={contactHref.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 rounded-lg bg-gold px-4 font-heading text-sm font-semibold text-graphite"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Написать
          </a>
        )}
      </div>
    </main>
  );
}

export default PropertyDetails;
