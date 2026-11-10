import {
  ArrowRight,
  BadgePercent,
  Box,
  GraduationCap,
  KeyRound,
  Luggage,
  Plus,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { AIAssistant } from "@/components/AIAssistant";
import { HeroPoints } from "@/components/home/HeroPoints";
import { HeroSearch } from "@/components/home/HeroSearch";
import { LightHeroBackground } from "@/components/home/LightHeroBackground";
import { TashkentSky } from "@/components/home/TashkentSky";
import { HotelCard } from "@/components/hotels/HotelCard";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TourEmbed } from "@/components/tour/TourEmbed";
import { HOTELS } from "@/lib/hotels";
import { DEMO_TOUR, getFeaturedProperties } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: { absolute: "SILKX — цифровой бутик недвижимости Ташкента" },
  description:
    "Новостройки, аренда и жильё для студентов в Ташкенте: проверенные объекты, 3D-туры 360°, карта и AI-ассистент. Разместите свой объект бесплатно.",
};

const AUDIENCES: ReadonlyArray<{ icon: LucideIcon; title: string; text: string; href: string; cta: string }> = [
  {
    icon: KeyRound,
    title: "Покупателям",
    text: "Новостройки по прямым ценам застройщиков, рассрочка и ипотека. Осмотр в 3D до поездки на объект.",
    href: "/catalog",
    cta: "Новостройки",
  },
  {
    icon: GraduationCap,
    title: "Студентам",
    text: "Квартиры и комнаты рядом с вузами — с понятными условиями: срок, депозит, коммунальные платежи.",
    href: "/catalog?type=rent",
    cta: "Жильё у вузов",
  },
  {
    icon: Luggage,
    title: "Гостям Ташкента",
    text: "Отели с 3D-турами номеров и бронированием онлайн, посуточная аренда с честными фото и точкой на карте.",
    href: "/hotels",
    cta: "Отели",
  },
  {
    icon: Plus,
    title: "Собственникам",
    text: "Разместите объект бесплатно: точка на карте, фото и 3D-тур. Модерация за 24 часа.",
    href: "/add",
    cta: "Разместить",
  },
];

const ADVANTAGES: ReadonlyArray<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: BadgePercent,
    title: "Прямые цены застройщиков",
    text: "Без наценок посредников: цены и условия рассрочки — напрямую из отдела продаж.",
  },
  {
    icon: ShieldCheck,
    title: "Проверенные объекты",
    text: "До публикации проверяем документы и репутацию застройщика или собственника.",
  },
  {
    icon: Box,
    title: "3D-туры вместо лишних поездок",
    text: "Осмотрите каждую комнату в 360° с телефона — на показ едете только к тем, что понравились.",
  },
];

export default function HomePage() {
  const featured = getFeaturedProperties(4);

  return (
    <>
      <SiteHeader overlay />

      <main className="pb-10">
        {/* ---------------- HERO ---------------- */}
        <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden sm:items-center">
          {/* Светлая тема — тёплый фон с силуэтом города, тёмная — анимированный «ночной Ташкент» */}
          <LightHeroBackground />
          <TashkentSky className="hidden dark:block" />

          <div className="container w-full pb-12 pt-28 sm:pb-24 sm:pt-32">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card/70 px-3 py-1 text-xs font-medium text-gold backdrop-blur dark:bg-black/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" aria-hidden="true" />
              Новостройки · Аренда · Посуточно — Ташкент
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Найдите дом в Ташкенте&nbsp;— <span className="text-gold">и осмотрите его в 3D</span> до визита
            </h1>
            <p className="mt-5 max-w-xl text-base text-heading/80 sm:text-lg">
              Цифровой бутик недвижимости: проверенные объекты, точка на карте и 3D-тур по каждой комнате.
            </p>

            <HeroPoints className="mt-6" />

            <div className="mt-8 max-w-4xl">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* ---------------- ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ ---------------- */}
        <section aria-labelledby="hot-offers-title" className="container py-10 sm:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gold">Отбор SILKX</p>
              <h2 id="hot-offers-title" className="mt-1 text-2xl sm:text-3xl">
                Горячие предложения
              </h2>
            </div>
            <Link
              href="/catalog"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gold transition-colors hover:text-gold-hover"
            >
              Весь каталог
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <PropertyCard
                  key={p.id}
                  id={p.id}
                  type={p.type}
                  title={p.title}
                  district={p.district}
                  price={p.price}
                  currency={p.currency}
                  imageUrl={p.imageUrl}
                  tags={p.tags}
                  status={p.status}
                  rooms={p.rooms}
                  areaM2={p.areaM2}
                  has3dTour={Boolean(p.tour?.length)}
                />
              ))}
            </div>
          ) : (
            <p className="terminal-panel p-6 text-center text-sm">
              Подборка обновляется. Загляните в{" "}
              <Link href="/catalog" className="text-gold underline-offset-4 hover:underline">
                каталог
              </Link>
              .
            </p>
          )}
        </section>

        {/* ---------------- ОТЕЛИ ---------------- */}
        <section aria-labelledby="hotels-title" className="container py-10 sm:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gold">Гостям Ташкента</p>
              <h2 id="hotels-title" className="mt-1 text-2xl sm:text-3xl">
                Отели с 3D-туром номеров
              </h2>
            </div>
            <Link
              href="/hotels"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gold transition-colors hover:text-gold-hover"
            >
              Все отели
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOTELS.slice(0, 3).map((h) => (
              <HotelCard key={h.id} hotel={h} />
            ))}
          </div>
        </section>

        {/* ---------------- 3D-ТУР ---------------- */}
        <section id="tour" aria-labelledby="tour-title" className="container scroll-mt-20 py-10 sm:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gold">Новое на SILKX</p>
              <h2 id="tour-title" className="mt-1 text-2xl sm:text-4xl">
                Осмотрите квартиру до визита
              </h2>
              <p className="mt-4 max-w-md leading-relaxed">
                Поворачивайтесь, приближайте, переходите из комнаты в комнату — как будто вы уже внутри. Работает на телефоне
                и компьютере, без приложений.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Перетащите картинку пальцем или мышью", "Щипок или колесо — приблизить", "Переключайте комнаты внизу"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-heading">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/add"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-hover"
              >
                Добавить 3D-тур к своему объекту
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <TourEmbed scenes={DEMO_TOUR} className="aspect-[4/3] w-full shadow-panel ring-1 ring-gold/20 sm:aspect-video" />
          </div>
        </section>

        {/* ---------------- ДЛЯ КОГО ---------------- */}
        <section aria-labelledby="audience-title" className="container py-10 sm:py-14">
          <h2 id="audience-title" className="mb-6 text-2xl sm:text-3xl">
            SILKX для каждого
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map(({ icon: Icon, title, text, href, cta }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="group terminal-panel flex h-full flex-col p-6 transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-gold-glow"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-muted">
                    <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed">{text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold">
                    {cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- ПОЧЕМУ SILKX ---------------- */}
        <section id="why" aria-labelledby="why-title" className="container scroll-mt-20 py-10 sm:py-14">
          <h2 id="why-title" className="mb-6 text-2xl sm:text-3xl">
            Почему SILKX
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {ADVANTAGES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="terminal-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-muted">
                  <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- CTA СОБСТВЕННИКАМ ---------------- */}
        <section className="container py-10 sm:py-14">
          <div className="relative isolate overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,rgba(188,163,127,0.22),transparent_60%),linear-gradient(135deg,#F3EEE6,#FFFFFF)] dark:bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,rgba(188,163,127,0.22),transparent_60%),linear-gradient(135deg,#1A2A3A,#1C1C1E)] p-8 sm:p-12">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-4xl">Сдаёте или продаёте?</h2>
              <p className="mt-3 text-heading/80">
                Разместите объект бесплатно — с точкой на карте и 3D-туром. После модерации (обычно до 24 часов) его увидят
                покупатели, студенты и гости города.
              </p>
              <Link
                href="/add"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-6 font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Разместить объект
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <AIAssistant />
    </>
  );
}
