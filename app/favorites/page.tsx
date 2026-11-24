import type { Metadata } from "next";

import { AIAssistant } from "@/components/AIAssistant";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import type { FavoriteItem } from "@/components/favorites/FavoritesView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllProperties } from "@/lib/data/properties";
import { CATALOG_KINDS, TASHKENT_DISTRICTS, catalogKindOf, propertyPath } from "@/lib/types";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Избранное и сравнение",
  description: "Сохранённые объекты SILKX: сравните цену, площадь, район и условия рядом.",
  robots: { index: false },
};

export default async function FavoritesPage() {
  const all = await getAllProperties();
  // В браузер отдаём только то, что нужно для карточки и сравнения
  const items: FavoriteItem[] = all.map((p) => ({
    id: p.id,
    title: p.title,
    href: propertyPath(p),
    imageUrl: p.imageUrl,
    kind: CATALOG_KINDS[catalogKindOf(p)].one,
    isNew: catalogKindOf(p) === "new",
    type: p.type,
    district: TASHKENT_DISTRICTS[p.district] ?? "Ташкент",
    price: p.price,
    currency: p.currency,
    rentTerm: p.rentTerm ?? null,
    rooms: p.rooms,
    areaM2: p.areaM2,
    floor: p.floor ?? null,
    floorsTotal: p.floorsTotal ?? null,
    has3dTour: Boolean(p.tour?.length),
    status: p.status,
    tags: p.tags.slice(0, 4),
    demo: !p.fromListing,
  }));

  return (
    <>
      <SiteHeader />
      <FavoritesView items={items} />
      <SiteFooter />
      <AIAssistant />
    </>
  );
}
