import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AIAssistant } from "@/components/AIAssistant";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MOCK_PROPERTIES, getPropertyById } from "@/lib/mock-data";

interface Params {
  params: { id: string };
}

const TYPE = "rent" as const;

export function generateStaticParams() {
  return MOCK_PROPERTIES.filter((p) => p.type === TYPE).map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const p = getPropertyById(decodeURIComponent(params.id));
  if (!p || p.type !== TYPE) return { title: "Объект не найден" };
  return {
    title: p.title,
    description: `${p.title} в Ташкенте${p.tour?.length ? " — 3D-тур 360°" : ""}. Фото, цена, расположение на карте.`,
    openGraph: p.imageUrl ? { images: [{ url: p.imageUrl }] } : undefined,
  };
}

export default function Page({ params }: Params) {
  const property = getPropertyById(decodeURIComponent(params.id));
  if (!property || property.type !== TYPE) notFound();
  return (
    <>
      <SiteHeader />
      <PropertyDetails property={property} />
      <SiteFooter />
      {/* На мобильном снизу липкая панель цены — поднимаем кнопку ассистента над ней */}
      <div style={{ ["--ai-offset" as string]: "4.5rem" }}>
        <AIAssistant propertyId={property.id} />
      </div>
    </>
  );
}
