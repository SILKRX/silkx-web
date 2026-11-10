import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AIAssistant } from "@/components/AIAssistant";
import { HotelDetails } from "@/components/hotels/HotelDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HOTELS, getHotelById } from "@/lib/hotels";

interface Params {
  params: { id: string };
}

export function generateStaticParams() {
  return HOTELS.map((h) => ({ id: h.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const h = getHotelById(decodeURIComponent(params.id));
  if (!h) return { title: "Отель не найден" };
  return {
    title: `${h.name} — номера, 3D-тур и бронирование`,
    description: `${h.name}, ${h.stars}★ в Ташкенте: ${h.rooms.map((r) => r.name).join(", ")}. 3D-тур номеров, телефон ${h.phone}, онлайн-бронирование.`,
    openGraph: { images: [{ url: h.imageUrl }] },
  };
}

export default function Page({ params }: Params) {
  const hotel = getHotelById(decodeURIComponent(params.id));
  if (!hotel) notFound();
  return (
    <>
      <SiteHeader />
      <HotelDetails hotel={hotel} />
      <SiteFooter />
      {/* На мобильном снизу липкая панель брони — поднимаем кнопку ассистента над ней */}
      <div style={{ ["--ai-offset" as string]: "4.5rem" }}>
        <AIAssistant propertyId={hotel.id} />
      </div>
    </>
  );
}
