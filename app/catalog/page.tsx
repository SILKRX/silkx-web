import type { Metadata } from "next";
import { Suspense } from "react";

import { AIAssistant } from "@/components/AIAssistant";
import { CatalogView } from "@/components/catalog/CatalogView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllProperties } from "@/lib/data/properties";

export const metadata: Metadata = {
  title: "Каталог недвижимости",
  description: "Новостройки, вторичное жильё и аренда в Ташкенте с фильтрами по районам, комнатности и цене.",
};

// Новые одобренные объявления появляются в каталоге в течение минуты
export const revalidate = 60;

function CatalogSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6 md:flex-row" aria-busy="true" aria-label="Загрузка каталога">
      <div className="skeleton h-12 w-full md:h-[520px] md:w-1/4" />
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:w-3/4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-line/5 bg-card">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CatalogPage() {
  const properties = await getAllProperties();
  return (
    <>
      <SiteHeader />
      <main className="container pb-10 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-3xl">Каталог недвижимости</h1>
        <p className="mt-1 text-sm">Новостройки, вторичное жильё и аренда в Ташкенте</p>

        {/* useSearchParams внутри CatalogView требует Suspense, иначе Next.js не соберёт страницу статически */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView properties={properties} />
        </Suspense>
      </main>
      <SiteFooter />
      <AIAssistant />
    </>
  );
}
