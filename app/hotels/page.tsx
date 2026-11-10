import { Box, CalendarCheck, Phone } from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

import { AIAssistant } from "@/components/AIAssistant";
import { HotelCard } from "@/components/hotels/HotelCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HOTELS } from "@/lib/hotels";

export const metadata: Metadata = {
  title: "Отели Ташкента — 3D-туры номеров и онлайн-бронирование",
  description:
    "Отели Ташкента на SILKX: номера с 3D-турами 360°, цены за ночь, адрес на карте, телефоны ресепшена и онлайн-бронирование без предоплаты.",
};

const POINTS: ReadonlyArray<{ icon: LucideIcon; text: string }> = [
  { icon: Box, text: "3D-тур каждого номера" },
  { icon: CalendarCheck, text: "Бронь онлайн без предоплаты" },
  { icon: Phone, text: "Прямой телефон ресепшена" },
];

export default function HotelsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container pb-16 pt-8 sm:pt-12">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Отели</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Отели Ташкента</h1>
        <p className="mt-3 max-w-2xl leading-relaxed">
          Осмотрите номер в 3D до заезда, сравните цены и забронируйте онлайн — отель подтвердит бронь по телефону.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-heading">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOTELS.map((h, i) => (
            <HotelCard key={h.id} hotel={h} priority={i < 3} />
          ))}
        </div>
      </main>
      <SiteFooter />
      <AIAssistant />
    </>
  );
}
