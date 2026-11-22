import type { PropertyDetails } from "@/lib/property-details";
import { isSupabaseConfigured, publicStorageUrl, selectRows } from "@/lib/server/supabase-rest";
import { isDistrictSlug, PROPERTY_CATEGORY_KEYS } from "@/lib/types";
import type { Currency, Property, PropertyCategory, TourScene } from "@/lib/types";

/**
 * Опубликованные объявления собственников и агентств (таблица listings, status = published)
 * → объекты каталога. Продажа от людей = вторичное жильё, аренда — обычная аренда.
 *
 * Телефон, Telegram и IP продавца НЕ запрашиваем: в браузер они не уходят,
 * связь идёт через заявку SILKX (сначала модерация и проверка, потом контакт).
 */

interface ListingRow {
  id: string;
  category: string;
  deal_type: "sale" | "rent";
  rent_term: "month" | "day" | null;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  rooms: number | null;
  area_m2: number;
  floor: number | null;
  floors_total: number | null;
  district: string;
  address: string;
  lat: number;
  lng: number;
  photos: unknown;
  panoramas: unknown;
  details: unknown;
  seller_type: "owner" | "agent" | null;
  company: { name?: string } | null;
  created_at: string;
}

const COLUMNS =
  "id,category,deal_type,rent_term,title,description,price,currency,rooms,area_m2,floor,floors_total,district,address,lat,lng,photos,panoramas,details,seller_type,company,created_at";

const MAX_LISTINGS = 500;

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function toUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : publicStorageUrl(pathOrUrl);
}

function panoramasToTour(v: unknown): TourScene[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x, i): TourScene[] => {
    if (typeof x !== "object" || x === null) return [];
    const { path, title } = x as { path?: unknown; title?: unknown };
    if (typeof path !== "string") return [];
    return [{ id: `scene-${i + 1}`, title: typeof title === "string" && title.trim() ? title.trim() : `Комната ${i + 1}`, src: toUrl(path) }];
  });
}

export function listingToProperty(row: ListingRow): Property | null {
  if (!isDistrictSlug(row.district)) return null;
  const photos = strings(row.photos).map(toUrl);
  const isSale = row.deal_type === "sale";
  const category = (PROPERTY_CATEGORY_KEYS as readonly string[]).includes(row.category) ? (row.category as PropertyCategory) : undefined;
  const sellerType = row.seller_type === "agent" ? "agent" : "owner";
  const company = sellerType === "agent" && row.company?.name ? row.company.name : undefined;

  const rawDetails = (typeof row.details === "object" && row.details !== null ? row.details : {}) as PropertyDetails;
  // У вторички — пометка рынка (влияет на правила ипотеки: госпрограмма только для новостроек)
  const details: PropertyDetails =
    isSale && rawDetails.sale ? { ...rawDetails, sale: { ...rawDetails.sale, market: "secondary" } } : rawDetails;

  const tags = [sellerType === "agent" ? (company ? `Агентство: ${company}` : "Агентство") : "От собственника"];
  if (isSale) tags.push("Вторичное жильё");
  if (row.rent_term === "day") tags.push("Посуточно");

  return {
    id: row.id,
    type: isSale ? "sale" : "rent",
    market: isSale ? "secondary" : undefined,
    fromListing: true,
    seller: { type: sellerType, company },
    title: row.title,
    district: row.district,
    price: Number(row.price),
    currency: row.currency === "UZS" ? "UZS" : "USD",
    imageUrl: photos[0] ?? null,
    gallery: photos.slice(1),
    tags,
    // Опубликовано = прошло модерацию SILKX
    status: "verified",
    rooms: row.rooms ?? 0,
    areaM2: Number(row.area_m2),
    category,
    rentTerm: isSale ? undefined : (row.rent_term ?? "month"),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    description: row.description,
    tour: panoramasToTour(row.panoramas),
    floor: row.floor ?? undefined,
    floorsTotal: row.floors_total ?? undefined,
    details,
  };
}

/**
 * Все опубликованные объявления. Ошибки базы (проект на паузе, нет сети) не ломают сайт:
 * каталог просто покажет остальные объекты, а в логах Vercel будет причина.
 */
export async function fetchPublishedListings(): Promise<Property[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const rows = await selectRows<ListingRow>(
      "listings",
      `status=eq.published&select=${COLUMNS}&order=created_at.desc&limit=${MAX_LISTINGS}`,
    );
    return rows.map(listingToProperty).filter((p): p is Property => p !== null);
  } catch (err) {
    console.error("[listings] read failed", err);
    return [];
  }
}
