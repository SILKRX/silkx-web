// Логика фильтров каталога: чистые функции без React — легко тестировать
// и переиспользовать (главная собирает ту же строку URL, что читает каталог).

import { isDistrictSlug } from "@/lib/types";
import type { DealType, DistrictSlug, Property } from "@/lib/types";

export const ROOM_OPTIONS = [
  { value: 0, label: "Студия" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
] as const;

export type RoomOption = (typeof ROOM_OPTIONS)[number]["value"];

const ROOM_VALUES: readonly number[] = ROOM_OPTIONS.map((o) => o.value);

export function isRoomOption(value: number): value is RoomOption {
  return ROOM_VALUES.includes(value);
}

export const SORT_OPTIONS = [
  { value: "default", label: "Рекомендуемые" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export function isSortOption(value: string | null): value is SortOption {
  return value !== null && SORT_OPTIONS.some((o) => o.value === value);
}

/** Подсказки диапазонов цен (USD) — у продажи и аренды разные масштабы. */
export const PRICE_HINTS: Record<DealType, { min: string; max: string; unit: string }> = {
  sale: { min: "от 30 000", max: "до 500 000", unit: "USD" },
  rent: { min: "от 300", max: "до 3 000", unit: "USD/мес" },
};

export interface CatalogFilters {
  type: DealType;
  district: DistrictSlug | null;
  rooms: RoomOption[];
  priceMin: number | null;
  priceMax: number | null;
  sort: SortOption;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  type: "sale",
  district: null,
  rooms: [],
  priceMin: null,
  priceMax: null,
  sort: "default",
};

const MAX_PRICE = 999_999_999;

/** Принимает и URLSearchParams, и ReadonlyURLSearchParams из next/navigation. */
interface ParamsReader {
  get(name: string): string | null;
}

function parsePrice(raw: string | null): number | null {
  if (!raw || !/^\d{1,9}$/.test(raw)) return null; // отсекаем "1e9", "-5", "abc", мусор из URL
  const value = Number(raw);
  return value > 0 && value <= MAX_PRICE ? value : null;
}

function parseRooms(raw: string | null): RoomOption[] {
  if (!raw) return [];
  const unique = new Set<RoomOption>();
  for (const part of raw.split(",").slice(0, ROOM_OPTIONS.length)) {
    const n = Number(part);
    if (part.trim() !== "" && Number.isInteger(n) && isRoomOption(n)) unique.add(n);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

/** URL → фильтры. Любой мусор в URL превращается в значение по умолчанию, а не в ошибку. */
export function parseFilters(params: ParamsReader): CatalogFilters {
  const district = params.get("district");
  const sort = params.get("sort");
  return {
    type: params.get("type") === "rent" ? "rent" : "sale",
    district: district && isDistrictSlug(district) ? district : null,
    rooms: parseRooms(params.get("rooms")),
    priceMin: parsePrice(params.get("priceMin")),
    priceMax: parsePrice(params.get("priceMax")),
    sort: isSortOption(sort) ? sort : "default",
  };
}

/** Фильтры → URL. Значения по умолчанию не пишем — ссылки короче и канонические. */
export function serializeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type !== "sale") params.set("type", filters.type);
  if (filters.district) params.set("district", filters.district);
  if (filters.rooms.length > 0) {
    params.set("rooms", [...filters.rooms].sort((a, b) => a - b).join(","));
  }
  if (filters.priceMin !== null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== null) params.set("priceMax", String(filters.priceMax));
  if (filters.sort !== "default") params.set("sort", filters.sort);
  return params;
}

/** Если пользователь ввёл «от» больше «до» — не показываем пустоту, а меняем границы местами. */
export function getPriceBounds(filters: CatalogFilters): {
  min: number | null;
  max: number | null;
  swapped: boolean;
} {
  const { priceMin, priceMax } = filters;
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    return { min: priceMax, max: priceMin, swapped: true };
  }
  return { min: priceMin, max: priceMax, swapped: false };
}

export function applyFilters(items: readonly Property[], filters: CatalogFilters): Property[] {
  const { min, max } = getPriceBounds(filters);

  const result = items.filter((p) => {
    if (p.type !== filters.type) return false;
    if (filters.district && p.district !== filters.district) return false;
    if (
      filters.rooms.length > 0 &&
      !filters.rooms.some((r) => (r === 4 ? p.rooms >= 4 : p.rooms === r))
    ) {
      return false;
    }
    if (min !== null && p.price < min) return false;
    if (max !== null && p.price > max) return false;
    return true;
  });

  if (filters.sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") result.sort((a, b) => b.price - a.price);
  return result;
}

/** Сколько фильтров активно (тип сделки и сортировка не считаются — это не сужение выдачи). */
export function countActiveFilters(filters: CatalogFilters): number {
  let count = 0;
  if (filters.district) count += 1;
  if (filters.rooms.length > 0) count += 1;
  if (filters.priceMin !== null || filters.priceMax !== null) count += 1;
  return count;
}
