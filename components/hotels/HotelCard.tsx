"use client";

import { BedDouble, Box, Hotel as HotelIcon, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatNumber } from "@/lib/format";
import { hotelMinPrice, hotelRoomsCount } from "@/lib/hotels";
import type { Hotel } from "@/lib/hotels";
import { TASHKENT_DISTRICTS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${count} звёзд`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
      ))}
    </span>
  );
}

/** Карточка отеля для списка /hotels и главной. */
export function HotelCard({ hotel: h, priority = false, className }: { hotel: Hotel; priority?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const { price } = hotelMinPrice(h);
  const hasTour = Boolean(h.tour?.length) || h.rooms.some((r) => r.tour?.length);

  return (
    <Link
      href={`/hotels/${h.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-line/10 bg-card shadow-panel transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-gold-glow dark:border-line/5",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-panel to-deep-blue">
        {failed ? (
          <div className="flex h-full items-center justify-center text-body/60" aria-hidden="true">
            <HotelIcon className="h-8 w-8" />
          </div>
        ) : (
          <Image
            src={h.imageUrl}
            alt={h.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            onError={() => setFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {h.rating && (
          <span className="absolute right-3 top-3 rounded-full bg-graphite/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {h.rating.score.toFixed(1)}/{h.rating.outOf} · {formatNumber(h.rating.count)} отзывов · {h.rating.source}
          </span>
        )}
        {hasTour && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-gold-bright ring-1 ring-gold/40 backdrop-blur-sm">
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
            3D-тур номеров
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <Stars count={h.stars} />
          <h3 className="font-heading text-lg font-semibold leading-snug text-heading">{h.name}</h3>
          <p className="flex items-center gap-1 text-sm text-body">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate">{TASHKENT_DISTRICTS[h.district]} р-н</span>
          </p>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {h.tags.map((t) => (
            <li key={t} className="rounded-md bg-gold-muted px-2 py-1 text-[11px] font-medium leading-none text-gold">
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/10 pt-3 dark:border-line/5">
          <p className="font-heading text-lg font-bold leading-none text-heading">
            <span className="text-sm font-medium text-body">от </span>${formatNumber(price)}
            <span className="text-sm font-medium text-body"> / ночь</span>
          </p>
          <p className="flex shrink-0 items-center gap-1 text-xs text-body">
            <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
            {hotelRoomsCount(h)} номеров
          </p>
        </div>
      </div>
    </Link>
  );
}

export default HotelCard;
