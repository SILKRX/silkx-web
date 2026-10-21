"use client";

import { ExternalLink, MapPinned } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { yandexMapsUrl } from "@/lib/geo";
import { createMap } from "@/lib/maps";
import type { MapHandle } from "@/lib/maps";
import type { GeoPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Карта с пином объекта (только просмотр) + ссылка «Открыть в Яндекс Картах». */
export function PropertyMap({ point, address, className }: { point: GeoPoint; address?: string; className?: string }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Грузим карту, только когда блок доскроллили до экрана — экономим трафик и CPU
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !visible) return;
    let handle: MapHandle | null = null;
    let cancelled = false;
    createMap(el, { center: point, zoom: 15, interactive: false })
      .then((h) => {
        if (cancelled) h.destroy();
        else handle = h;
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, [point, visible]);

  return (
    <div className={cn("terminal-panel overflow-hidden", className)}>
      <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
        <div ref={elRef} className="absolute inset-0" />
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card text-center">
            <MapPinned className="h-7 w-7 text-gold" aria-hidden="true" />
            <p className="text-sm">Карта временно недоступна</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        {address && <p className="text-sm text-heading">{address}</p>}
        <a
          href={yandexMapsUrl(point)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-hover"
        >
          Открыть в Яндекс Картах
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export default PropertyMap;
