import type { Metadata } from "next";

import { AIAssistant } from "@/components/AIAssistant";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { Property } from "@/lib/types";

/** Общая страница объекта для /complex, /secondary и /rent. */
export function PropertyPage({ property }: { property: Property }) {
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

export function propertyMetadata(p: Property | null): Metadata {
  if (!p) return { title: "Объект не найден" };
  return {
    title: p.title,
    description: `${p.title} в Ташкенте${p.tour?.length ? " — 3D-тур 360°" : ""}. Фото, цена, расположение на карте.`,
    openGraph: p.imageUrl ? { images: [{ url: p.imageUrl }] } : undefined,
  };
}
