import { BadgeCheck, Box, MapPinned } from "lucide-react";
import type { Metadata } from "next";

import { AddListingForm } from "@/components/listing/AddListingForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Разместить объект",
  description: "Бесплатно разместите квартиру, дом или комнату в Ташкенте: точка на карте, фото и 3D-тур 360°. Проверка модератором за 24 часа.",
};

const PERKS = [
  { icon: MapPinned, text: "Точка на карте — покупатели сразу видят район и инфраструктуру" },
  { icon: Box, text: "3D-тур 360° — осмотр квартиры онлайн до показа" },
  { icon: BadgeCheck, text: "Отметка «Проверено SILKX» после модерации" },
] as const;

export default function AddListingPage() {
  return (
    <>
      <SiteHeader />
      <main className="container pt-8 sm:pt-12">
        <div className="mx-auto mb-8 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Бесплатно для собственников</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Разместить объект</h1>
          <p className="mt-3 text-base">Квартира, дом, комната для студентов, коммерция или участок — в Ташкенте.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-lg border border-white/5 bg-card/60 p-3 text-sm text-body">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <AddListingForm />
      </main>
      <SiteFooter />
    </>
  );
}
