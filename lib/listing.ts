import { isInTashkent } from "@/lib/geo";
import { PROPERTY_CATEGORIES, isDistrictSlug } from "@/lib/types";
import type { Currency, DealType, DistrictSlug, PropertyCategory, RentTerm } from "@/lib/types";

/**
 * Объявление собственника: единые правила для формы (клиент) и API (сервер).
 * Без zod — ноль новых зависимостей; правила простые и явные.
 */

export const LISTING_LIMITS = {
  titleMin: 5,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 3000,
  priceMax: 50_000_000_000, // UZS тоже влезает
  areaMax: 100_000,
  roomsMax: 20,
  floorMax: 120,
  photosMin: 1,
  photosMax: 12,
  panoramasMax: 6,
  /** После сжатия в браузере — укладываемся в лимит 4,5 МБ на запрос у Vercel. */
  uploadMaxBytes: 4 * 1024 * 1024,
  /** До сжатия — что пользователь может выбрать. */
  sourceMaxBytes: 40 * 1024 * 1024,
} as const;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Категории без комнат — поле «комнаты» скрываем и не валидируем. */
export const CATEGORIES_WITHOUT_ROOMS: ReadonlySet<PropertyCategory> = new Set(["land", "commercial"]);

export interface ListingInput {
  category: PropertyCategory;
  dealType: DealType;
  rentTerm: RentTerm | null;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  rooms: number | null;
  areaM2: number;
  floor: number | null;
  floorsTotal: number | null;
  district: DistrictSlug;
  address: string;
  lat: number;
  lng: number;
  contactName: string;
  phone: string; // E.164
  telegram: string | null;
  /** Пути в хранилище, полученные от /api/listings/upload. */
  photos: string[];
  panoramas: { path: string; title: string }[];
}

export type ListingField = keyof ListingInput | "agree";
export type ListingErrors = Partial<Record<ListingField, string>>;

export type ValidationResult = { ok: true; data: ListingInput } | { ok: false; errors: ListingErrors };

// ---------------------------------------------------------------------------
// Телефон: принимаем «90 123 45 67», «+998 (90) 123-45-67», «998901234567» → +998901234567
// ---------------------------------------------------------------------------
export function normalizeUzPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let national: string;
  if (digits.length === 12 && digits.startsWith("998")) national = digits.slice(3);
  else if (digits.length === 9) national = digits;
  else return null;
  // Коды операторов/городов Узбекистана начинаются с 2–9
  if (!/^[2-9]\d{8}$/.test(national)) return null;
  return `+998${national}`;
}

/** +998901234567 → «+998 90 123-45-67» */
export function formatUzPhone(e164: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+998 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : e164;
}

export function normalizeTelegram(raw: string): string | null {
  const v = raw.trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  if (!v) return null;
  return /^[A-Za-z0-9_]{5,32}$/.test(v) ? `@${v}` : "";
}

// ---------------------------------------------------------------------------
// Хелперы чтения «сырых» значений (FormData/JSON — всё приходит как unknown)
// ---------------------------------------------------------------------------
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

const num = (v: unknown): number | null => {
  const s = str(v).replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const isInt = (n: number | null): n is number => n !== null && Number.isInteger(n);

const STORAGE_PATH_RE = /^pending\/[a-z0-9-]{8,64}\/[a-z0-9-]{8,64}\.(jpg|png|webp)$/;
export const isStoragePath = (p: unknown): p is string => typeof p === "string" && STORAGE_PATH_RE.test(p);

/** Валидирует «сырой» объект. Возвращает нормализованные данные или ошибки по полям (на русском). */
export function validateListing(raw: Record<string, unknown>): ValidationResult {
  const e: ListingErrors = {};
  const L = LISTING_LIMITS;

  const category = str(raw.category);
  if (!Object.prototype.hasOwnProperty.call(PROPERTY_CATEGORIES, category)) e.category = "Выберите категорию";

  const dealType = str(raw.dealType);
  if (dealType !== "sale" && dealType !== "rent") e.dealType = "Выберите тип сделки";

  const rentTermRaw = str(raw.rentTerm);
  const rentTerm: RentTerm | null = dealType === "rent" ? (rentTermRaw === "day" ? "day" : "month") : null;

  const title = str(raw.title).replace(/\s+/g, " ");
  if (title.length < L.titleMin) e.title = `Минимум ${L.titleMin} символов`;
  else if (title.length > L.titleMax) e.title = `Максимум ${L.titleMax} символов`;

  const description = str(raw.description);
  if (description.length < L.descriptionMin) e.description = `Расскажите подробнее — минимум ${L.descriptionMin} символов`;
  else if (description.length > L.descriptionMax) e.description = `Максимум ${L.descriptionMax} символов`;

  const price = num(raw.price);
  if (!isInt(price) || price <= 0) e.price = "Укажите цену целым числом";
  else if (price > L.priceMax) e.price = "Слишком большая цена — проверьте нули";

  const currency = str(raw.currency);
  if (currency !== "USD" && currency !== "UZS") e.currency = "Выберите валюту";

  const noRooms = CATEGORIES_WITHOUT_ROOMS.has(category as PropertyCategory);
  const rooms = noRooms ? null : num(raw.rooms);
  if (!noRooms && (!isInt(rooms) || rooms < 0 || rooms > L.roomsMax)) e.rooms = "Укажите количество комнат (0 — студия)";

  const area = num(raw.areaM2);
  if (area === null || Number.isNaN(area) || area <= 0) e.areaM2 = "Укажите площадь";
  else if (area > L.areaMax) e.areaM2 = "Проверьте площадь";

  const floor = num(raw.floor);
  const floorsTotal = num(raw.floorsTotal);
  if (floor !== null && (!isInt(floor) || floor < -3 || floor > L.floorMax)) e.floor = "Некорректный этаж";
  if (floorsTotal !== null && (!isInt(floorsTotal) || floorsTotal < 1 || floorsTotal > L.floorMax)) e.floorsTotal = "Некорректная этажность";
  if (isInt(floor) && isInt(floorsTotal) && floor > floorsTotal) e.floor = "Этаж больше этажности дома";

  const district = str(raw.district);
  if (!isDistrictSlug(district)) e.district = "Выберите район";

  const address = str(raw.address);
  if (address.length < 5) e.address = "Укажите адрес";
  else if (address.length > 200) e.address = "Слишком длинный адрес";

  const lat = num(raw.lat);
  const lng = num(raw.lng);
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) e.lat = "Отметьте объект на карте";
  else if (!isInTashkent({ lat, lng })) e.lat = "Точка должна быть в Ташкенте";

  const contactName = str(raw.contactName);
  if (contactName.length < 2 || contactName.length > 60) e.contactName = "Как к вам обращаться?";

  const phone = normalizeUzPhone(str(raw.phone));
  if (!phone) e.phone = "Номер в формате +998 90 123-45-67";

  const telegram = normalizeTelegram(str(raw.telegram));
  if (telegram === "") e.telegram = "Ник Telegram: 5–32 символа, латиница, цифры и _";

  const photos = Array.isArray(raw.photos) ? raw.photos.filter(isStoragePath) : [];
  if (photos.length < L.photosMin) e.photos = "Добавьте хотя бы одно фото";
  else if (photos.length > L.photosMax) e.photos = `Не больше ${L.photosMax} фото`;

  const panoramas = (Array.isArray(raw.panoramas) ? raw.panoramas : [])
    .filter((p): p is { path: unknown; title: unknown } => typeof p === "object" && p !== null)
    .filter((p) => isStoragePath(p.path))
    .map((p, i) => ({ path: p.path as string, title: str(p.title).slice(0, 40) || `Комната ${i + 1}` }));
  if (panoramas.length > L.panoramasMax) e.panoramas = `Не больше ${L.panoramasMax} панорам`;

  if (raw.agree !== true && raw.agree !== "true" && raw.agree !== "on") e.agree = "Нужно согласие с правилами";

  if (Object.keys(e).length > 0) return { ok: false, errors: e };

  return {
    ok: true,
    data: {
      category: category as PropertyCategory,
      dealType: dealType as DealType,
      rentTerm,
      title,
      description,
      price: price as number,
      currency: currency as Currency,
      rooms: noRooms ? null : (rooms as number),
      areaM2: Math.round((area as number) * 10) / 10,
      floor: isInt(floor) ? floor : null,
      floorsTotal: isInt(floorsTotal) ? floorsTotal : null,
      district: district as DistrictSlug,
      address,
      lat: lat as number,
      lng: lng as number,
      contactName,
      phone: phone as string,
      telegram: telegram || null,
      photos,
      panoramas,
    },
  };
}
