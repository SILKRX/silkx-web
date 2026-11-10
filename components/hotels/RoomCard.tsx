"use client";

import { BedDouble, CalendarCheck, Coffee, Maximize2, Users } from "lucide-react";
import Image from "next/image";

import { requestRoomBooking } from "@/components/hotels/BookingForm";
import { TourButton } from "@/components/tour/TourButton";
import { formatNumber } from "@/lib/format";
import type { HotelRoom } from "@/lib/hotels";

/** Категория номера: фото, номера комнат, удобства, цена, 3D-тур и «Забронировать». */
export function RoomCard({ room: r, hotelName }: { room: HotelRoom; hotelName: string }) {
  return (
    <article className="terminal-panel grid overflow-hidden sm:grid-cols-[260px_1fr]">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-panel to-deep-blue sm:aspect-auto sm:min-h-[220px]">
        <Image src={r.imageUrl} alt={`${hotelName} — ${r.name}`} fill sizes="(min-width: 640px) 260px, 100vw" className="object-cover" />
        {r.tour?.length ? (
          <div className="absolute bottom-3 left-3">
            <TourButton scenes={r.tour} title={`${hotelName} — ${r.name}`} variant="overlay" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">{r.name}</h3>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-body">
              <li className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-gold" aria-hidden="true" />
                {r.beds}
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gold" aria-hidden="true" />
                до {r.capacity} гостей
              </li>
              <li className="flex items-center gap-1.5">
                <Maximize2 className="h-4 w-4 text-gold" aria-hidden="true" />
                {r.areaM2} м²
              </li>
              {r.breakfast && (
                <li className="flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-gold" aria-hidden="true" />
                  завтрак включён
                </li>
              )}
            </ul>
          </div>
          <p className="text-right font-heading text-2xl font-bold leading-none text-heading">
            ${formatNumber(r.price)}
            <span className="block pt-1 text-xs font-medium text-body">за ночь</span>
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-body">Номера комнат ({r.numbers.length})</p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Номера комнат категории ${r.name}`}>
            {r.numbers.map((n) => (
              <li key={n} className="tabular rounded-md border border-line/10 px-2 py-1 font-heading text-xs font-semibold text-heading">
                № {n}
              </li>
            ))}
          </ul>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {r.amenities.map((a) => (
            <li key={a} className="rounded-md bg-gold-muted px-2 py-1 text-[11px] font-medium leading-none text-gold">
              {a}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => requestRoomBooking(r.id)}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 font-heading text-sm font-semibold text-graphite transition-colors hover:bg-gold-hover"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Забронировать
          </button>
          {r.tour?.length ? <TourButton scenes={r.tour} title={`${hotelName} — ${r.name}`} className="h-11 px-4 text-sm" /> : null}
        </div>
      </div>
    </article>
  );
}

export default RoomCard;
