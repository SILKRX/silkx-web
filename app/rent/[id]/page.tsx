import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyPage, propertyMetadata } from "@/components/property/PropertyPage";
import { getProperty } from "@/lib/data/properties";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { catalogKindOf } from "@/lib/types";

interface Params {
  params: { id: string };
}

const KIND = "rent" as const;

// Демо-объекты собираются заранее; объекты из базы рендерятся по запросу
export const revalidate = 60;

export function generateStaticParams() {
  return MOCK_PROPERTIES.filter((p) => catalogKindOf(p) === KIND).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProperty(decodeURIComponent(params.id));
  return propertyMetadata(p && catalogKindOf(p) === KIND ? p : null);
}

export default async function Page({ params }: Params) {
  const property = await getProperty(decodeURIComponent(params.id));
  if (!property || catalogKindOf(property) !== KIND) notFound();
  return <PropertyPage property={property} />;
}
