"use client";

import { ChevronDown, RotateCcw, SearchX, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { DealTypeSwitch } from "@/components/DealTypeSwitch";
import { PropertyCard } from "@/components/PropertyCard";
import { NativeSelect } from "@/components/ui/native-select";
import {
  DEFAULT_FILTERS,
  PRICE_HINTS,
  ROOM_OPTIONS,
  SORT_OPTIONS,
  applyFilters,
  countActiveFilters,
  getPriceBounds,
  isSortOption,
  parseFilters,
  serializeFilters,
} from "@/lib/catalog-filters";
import type { CatalogFilters, RoomOption } from "@/lib/catalog-filters";
import { pluralize } from "@/lib/format";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { DISTRICT_SLUGS, TASHKENT_DISTRICTS, isDistrictSlug } from "@/lib/types";
import type { DealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const URL_SYNC_DELAY_MS = 300; // не спамим историю/роутер на каждый символ цены
const MAX_PRICE_DIGITS = 9;

const OBJECT_FORMS = { one: "объект", few: "объекта", many: "объектов" } as const;

function FilterGroup({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  const labelClass = "block text-xs font-medium uppercase tracking-wider text-body";
  return (
    <div className="space-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      ) : (
        <p className={labelClass}>{label}</p>
      )}
      {children}
    </div>
  );
}

export function CatalogView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  const [filters, setFilters] = useState<CatalogFilters>(() => parseFilters(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Последняя строка URL, которую мы сами записали — чтобы отличать свои изменения от «Назад/Вперёд»
  const lastSyncedRef = useRef(searchString);

  const panelId = useId();
  const districtId = useId();
  const priceMinId = useId();
  const priceMaxId = useId();
  const sortId = useId();

  // URL изменился извне (кнопка «Назад», ссылка из шапки) → подтягиваем фильтры
  useEffect(() => {
    if (searchString === lastSyncedRef.current) return;
    lastSyncedRef.current = searchString;
    setFilters(parseFilters(new URLSearchParams(searchString)));
  }, [searchString]);

  // Фильтры изменились → пишем в URL (replace: не засоряем историю браузера)
  useEffect(() => {
    const next = serializeFilters(filters).toString();
    if (next === lastSyncedRef.current) return;
    const timer = window.setTimeout(() => {
      lastSyncedRef.current = next;
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, URL_SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [filters, pathname, router]);

  // ---- Обработчики ----
  const setType = useCallback((type: DealType) => {
    // У продажи и аренды разный масштаб цен — старый диапазон даст пустую выдачу
    setFilters((prev) => (prev.type === type ? prev : { ...prev, type, priceMin: null, priceMax: null }));
  }, []);

  const toggleRoom = useCallback((room: RoomOption) => {
    setFilters((prev) => ({
      ...prev,
      rooms: prev.rooms.includes(room)
        ? prev.rooms.filter((r) => r !== room)
        : [...prev.rooms, room].sort((a, b) => a - b),
    }));
  }, []);

  const handlePriceChange = useCallback(
    (key: "priceMin" | "priceMax") => (e: ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);
      const value = digits ? Number(digits) : null;
      setFilters((prev) => ({ ...prev, [key]: value !== null && value > 0 ? value : null }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, type: prev.type, sort: prev.sort }));
  }, []);

  // ---- Производные данные ----
  const results = useMemo(() => applyFilters(MOCK_PROPERTIES, filters), [filters]);
  const totalForType = useMemo(
    () => MOCK_PROPERTIES.filter((p) => p.type === filters.type).length,
    [filters.type],
  );
  const activeCount = countActiveFilters(filters);
  const { swapped } = getPriceBounds(filters);
  const hints = PRICE_HINTS[filters.type];

  const inputClass =
    "h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-heading tabular placeholder:text-body/50 transition-colors hover:border-line/20 focus:border-gold/60 focus:outline-none";

  return (
    <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
      {/* ================= ФИЛЬТРЫ ================= */}
      <aside className="w-full md:sticky md:top-20 md:w-1/4 md:min-w-[260px]" aria-label="Фильтры">
        {/* Кнопка раскрытия — только мобильные */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls={panelId}
          className="terminal-panel flex h-12 w-full items-center justify-between px-4 text-sm font-semibold text-heading md:hidden"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gold" aria-hidden="true" />
            Фильтры
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] text-graphite">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-body transition-transform", filtersOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        <div
          id={panelId}
          className={cn("terminal-panel mt-3 space-y-6 p-4 md:mt-0 md:block", filtersOpen ? "block" : "hidden")}
        >
          <FilterGroup label="Тип сделки">
            <DealTypeSwitch value={filters.type} onChange={setType} fullWidth />
          </FilterGroup>

          <FilterGroup label="Район" htmlFor={districtId}>
            <NativeSelect
              id={districtId}
              value={filters.district ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((prev) => ({ ...prev, district: isDistrictSlug(v) ? v : null }));
              }}
            >
              <option value="">Все районы</option>
              {DISTRICT_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {TASHKENT_DISTRICTS[slug]}
                </option>
              ))}
            </NativeSelect>
          </FilterGroup>

          <FilterGroup label="Комнатность">
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Комнатность">
              {ROOM_OPTIONS.map((o) => {
                const active = filters.rooms.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    aria-label={o.value === 0 ? "Студия" : `${o.label} комнат`}
                    onClick={() => toggleRoom(o.value)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                      active
                        ? "border-gold bg-gold text-graphite"
                        : "border-input bg-background text-body hover:border-line/20 hover:text-heading",
                    )}
                  >
                    {o.value === 0 ? "Ст." : o.label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup label={`Цена, ${hints.unit}`}>
            <div className="grid grid-cols-2 gap-2">
              <label htmlFor={priceMinId} className="sr-only">
                Цена от
              </label>
              <input
                id={priceMinId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={hints.min}
                value={filters.priceMin ?? ""}
                onChange={handlePriceChange("priceMin")}
                className={inputClass}
              />
              <label htmlFor={priceMaxId} className="sr-only">
                Цена до
              </label>
              <input
                id={priceMaxId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={hints.max}
                value={filters.priceMax ?? ""}
                onChange={handlePriceChange("priceMax")}
                className={inputClass}
              />
            </div>
            {swapped && (
              <p role="status" className="text-xs text-gold">
                «От» больше, чем «до» — ищем в обратном диапазоне.
              </p>
            )}
          </FilterGroup>

          <div className="flex flex-col gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line/10 text-sm font-medium text-body transition-colors hover:border-line/20 hover:text-heading"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Сбросить фильтры
              </button>
            )}
            {/* На мобильных — закрыть панель и сразу увидеть результат */}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="flex h-11 items-center justify-center rounded-lg bg-gold text-sm font-semibold text-graphite transition-colors hover:bg-gold-hover md:hidden"
            >
              Показать {results.length} {pluralize(results.length, OBJECT_FORMS)}
            </button>
          </div>
        </div>
      </aside>

      {/* ================= ВЫДАЧА ================= */}
      <section className="w-full md:w-3/4" aria-label="Результаты поиска">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" aria-live="polite" aria-atomic="true">
            Найдено <span className="tabular font-semibold text-heading">{results.length}</span>{" "}
            {pluralize(results.length, OBJECT_FORMS)} из {totalForType}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor={sortId} className="sr-only">
              Сортировка
            </label>
            <NativeSelect
              id={sortId}
              value={filters.sort}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortOption(v)) setFilters((prev) => ({ ...prev, sort: v }));
              }}
              className="h-10 text-sm"
              wrapperClassName="w-48"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p, index) => (
              <PropertyCard
                key={p.id}
                id={p.id}
                type={p.type}
                title={p.title}
                district={p.district}
                price={p.price}
                currency={p.currency}
                imageUrl={p.imageUrl}
                tags={p.tags}
                status={p.status}
                rooms={p.rooms}
                areaM2={p.areaM2}
                has3dTour={Boolean(p.tour?.length)}
                priority={index < 2}
              />
            ))}
          </div>
        ) : (
          <div className="terminal-panel flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-muted">
              <SearchX className="h-6 w-6 text-gold" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg">Ничего не найдено</h2>
            {activeCount > 0 ? (
              <>
                <p className="mt-2 max-w-sm text-sm">
                  Под выбранные параметры пока нет объектов. Сбросьте фильтры или расширьте диапазон цены.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 flex h-11 items-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-graphite transition-colors hover:bg-gold-hover"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Сбросить фильтры
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-sm text-sm">В этой категории пока нет объектов — скоро добавим.</p>
                <button
                  type="button"
                  onClick={() => setType(filters.type === "sale" ? "rent" : "sale")}
                  className="mt-6 flex h-11 items-center rounded-lg bg-gold px-6 text-sm font-semibold text-graphite transition-colors hover:bg-gold-hover"
                >
                  Смотреть {filters.type === "sale" ? "аренду" : "новостройки"}
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default CatalogView;
