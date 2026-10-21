"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { DealTypeSwitch } from "@/components/DealTypeSwitch";
import { NativeSelect } from "@/components/ui/native-select";
import { DEFAULT_FILTERS, ROOM_OPTIONS, isRoomOption, serializeFilters } from "@/lib/catalog-filters";
import type { CatalogFilters, RoomOption } from "@/lib/catalog-filters";
import { DISTRICT_SLUGS, TASHKENT_DISTRICTS, isDistrictSlug } from "@/lib/types";
import type { DealType, DistrictSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Переключатель + быстрый поиск в Hero. Отправляет в /catalog с теми же URL-параметрами, что читает каталог. */
export function HeroSearch() {
  const router = useRouter();
  const [type, setType] = useState<DealType>("sale");
  const [district, setDistrict] = useState<DistrictSlug | "">("");
  const [rooms, setRooms] = useState<RoomOption | "">("");
  const [isPending, startTransition] = useTransition();

  const districtId = useId();
  const roomsId = useId();

  // Каталог подгружается заранее — переход по «Найти» мгновенный даже на 3G
  useEffect(() => {
    router.prefetch("/catalog");
  }, [router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return; // защита от повторных нажатий

    const filters: CatalogFilters = {
      ...DEFAULT_FILTERS,
      type,
      district: district || null,
      rooms: rooms === "" ? [] : [rooms],
    };
    const query = serializeFilters(filters).toString();
    startTransition(() => {
      router.push(query ? `/catalog?${query}` : "/catalog");
    });
  };

  return (
    <div className="space-y-4">
      <DealTypeSwitch value={type} onChange={setType} />

      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Быстрый поиск недвижимости"
        className="terminal-panel grid gap-3 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-4"
      >
        <div className="space-y-1.5">
          <label htmlFor={districtId} className="text-xs font-medium uppercase tracking-wider text-body">
            Район
          </label>
          <NativeSelect
            id={districtId}
            value={district}
            onChange={(e) => {
              const v = e.target.value;
              setDistrict(isDistrictSlug(v) ? v : "");
            }}
          >
            <option value="">Все районы Ташкента</option>
            {DISTRICT_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {TASHKENT_DISTRICTS[slug]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={roomsId} className="text-xs font-medium uppercase tracking-wider text-body">
            Комнатность
          </label>
          <NativeSelect
            id={roomsId}
            value={rooms === "" ? "" : String(rooms)}
            onChange={(e) => {
              const n = Number(e.target.value);
              setRooms(e.target.value !== "" && isRoomOption(n) ? n : "");
            }}
          >
            <option value="">Любая</option>
            {ROOM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value === 0 ? o.label : `${o.label} комн.`}
              </option>
            ))}
          </NativeSelect>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-lg bg-gold px-8 font-heading font-semibold text-graphite",
            "transition-colors hover:bg-gold-hover active:bg-gold-active disabled:cursor-wait disabled:opacity-70",
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          Найти
        </button>
      </form>
    </div>
  );
}

export default HeroSearch;
