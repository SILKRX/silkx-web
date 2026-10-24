import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { assessCredit } from "@/lib/property-details";
import { TASHKENT_DISTRICTS, isDistrictSlug } from "@/lib/types";
import type { Currency, DealType, DistrictSlug, Property } from "@/lib/types";

/**
 * Единый слой данных об объектах. Сейчас читает демо-данные (lib/mock-data.ts).
 * Задача №2 Романа: заменить тело этих функций чтением из Supabase — сайт, бот и API
 * переключатся на реальные объекты автоматически (сигнатуры не меняются).
 */

export interface PropertyQuery {
  type?: DealType;
  district?: DistrictSlug;
  rooms?: number;
  /** Цена «до», в валюте объекта. */
  maxPrice?: number;
  currency?: Currency;
  /** Свободный текст: ищем в названии, адресе, тегах и районе. */
  q?: string;
  limit?: number;
}

const visible = (p: Property) => p.status !== "reserved";

export async function listProperties(query: PropertyQuery = {}): Promise<{ items: Property[]; total: number }> {
  const q = query.q?.trim().toLowerCase();
  const filtered = MOCK_PROPERTIES.filter(visible).filter((p) => {
    if (query.type && p.type !== query.type) return false;
    if (query.district && p.district !== query.district) return false;
    if (query.rooms !== undefined && (query.rooms >= 4 ? p.rooms < 4 : p.rooms !== query.rooms)) return false;
    if (query.maxPrice !== undefined && (query.currency ? p.currency === query.currency : true) && p.price > query.maxPrice) return false;
    if (q) {
      const hay = [p.title, p.address ?? "", TASHKENT_DISTRICTS[p.district], ...p.tags].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
  return { items: filtered.slice(0, limit), total: filtered.length };
}

export async function getProperty(id: string): Promise<Property | null> {
  const p = MOCK_PROPERTIES.find((x) => x.id === id);
  return p && visible(p) ? p : null;
}

/** Публичный путь объекта на сайте. */
export const propertyPath = (p: Property) =>
  p.type === "sale" ? `/complex/${encodeURIComponent(p.id)}` : `/rent/${encodeURIComponent(p.id)}`;

/** Компактное представление для бота / внешних клиентов (абсолютные ссылки). */
export function toPublicJson(p: Property, siteUrl: string, full = false) {
  const url = new URL(propertyPath(p), siteUrl).toString();
  const credit = assessCredit(p);
  const base = {
    id: p.id,
    type: p.type,
    rentTerm: p.type === "rent" ? (p.rentTerm ?? "month") : null,
    category: p.category ?? null,
    title: p.title,
    district: p.district,
    districtName: TASHKENT_DISTRICTS[p.district],
    address: p.address ?? null,
    price: p.price,
    currency: p.currency,
    rooms: p.rooms,
    areaM2: p.areaM2,
    tags: p.tags,
    status: p.status,
    image: p.imageUrl ? new URL(p.imageUrl, siteUrl).toString() : null,
    url,
    has3dTour: Boolean(p.tour?.length),
    tourUrl: p.tour?.length ? `${url}#tour-title` : null,
    location: p.location ?? null,
    credit: credit ? { verdict: credit.verdict, headline: credit.headline, monthlyUzs: credit.calc.monthlyUzs } : null,
  };
  return full ? { ...base, details: p.details ?? null, tour: p.tour ?? [], credit: credit ?? null } : base;
}

export function parseQuery(sp: URLSearchParams): PropertyQuery {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v === null || v.trim() === "") return undefined;
    const n = Number(v.replace(/\s/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const type = sp.get("type");
  const district = sp.get("district") ?? "";
  const currency = sp.get("currency");
  return {
    type: type === "sale" || type === "rent" ? type : undefined,
    district: isDistrictSlug(district) ? district : undefined,
    rooms: num("rooms"),
    maxPrice: num("maxPrice"),
    currency: currency === "USD" || currency === "UZS" ? currency : undefined,
    q: sp.get("q")?.slice(0, 100) || undefined,
    limit: num("limit"),
  };
}
