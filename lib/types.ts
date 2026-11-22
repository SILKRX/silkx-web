import type { PropertyDetails } from "@/lib/property-details";

// Общие доменные типы SILKX. Единый источник правды для UI, моков и (позже) Supabase.

export type DealType = "sale" | "rent";

/** Рынок продажи: новостройка (от застройщика) или вторичное жильё (от собственника / агентства). */
export type Market = "new_build" | "secondary";

/**
 * Раздел каталога — то, что видит пользователь: «Новостройки», «Вторичка», «Аренда».
 * new и secondary — это продажа (DealType "sale") на разных рынках.
 */
export type CatalogKind = "new" | "secondary" | "rent";

export const CATALOG_KINDS: Record<CatalogKind, { label: string; one: string; all: string }> = {
  new: { label: "Новостройки", one: "Новостройка", all: "Все новостройки" },
  secondary: { label: "Вторичка", one: "Вторичка", all: "Всё вторичное жильё" },
  rent: { label: "Аренда", one: "Аренда", all: "Вся аренда" },
};

export function isCatalogKind(value: unknown): value is CatalogKind {
  return value === "new" || value === "secondary" || value === "rent";
}

/** К какому разделу каталога относится объект. */
export function catalogKindOf(p: { type: DealType; market?: Market }): CatalogKind {
  if (p.type === "rent") return "rent";
  return p.market === "secondary" ? "secondary" : "new";
}

/** Публичный путь объекта на сайте. Чистая функция — можно и на сервере, и в браузере. */
export function propertyPath(p: { id: string; type: DealType; market?: Market }): string {
  const id = encodeURIComponent(p.id);
  const kind = catalogKindOf(p);
  if (kind === "rent") return `/rent/${id}`;
  return kind === "secondary" ? `/secondary/${id}` : `/complex/${id}`;
}

/** Ссылка на раздел каталога. */
export const catalogHref = (kind: CatalogKind) => (kind === "new" ? "/catalog" : `/catalog?type=${kind}`);

export type Currency = "USD" | "UZS";

/** Статус объекта, который показывается бейджем на карточке. */
export type PropertyStatus =
  | "hot"        // горячий старт продаж / горячее предложение
  | "new"        // новинка в каталоге
  | "verified"   // проверено SILKX
  | "available"  // свободна (аренда)
  | "reserved";  // забронировано / сдано

/** Районы Ташкента. Ключ — стабильный slug для URL, значение — подпись в UI. */
export const TASHKENT_DISTRICTS = {
  "mirzo-ulugbek": "Мирзо-Улугбекский",
  yunusabad: "Юнусабадский",
  chilanzar: "Чиланзарский",
  yakkasaray: "Яккасарайский",
  mirabad: "Мирабадский",
  shaykhantahur: "Шайхантахурский",
  almazar: "Алмазарский",
  sergeli: "Сергелийский",
  uchtepa: "Учтепинский",
  bektemir: "Бектемирский",
  yashnabad: "Яшнабадский",
  yangihayot: "Янгихаётский",
} as const;

export type DistrictSlug = keyof typeof TASHKENT_DISTRICTS;

export const DISTRICT_SLUGS = Object.keys(TASHKENT_DISTRICTS) as DistrictSlug[];

export function isDistrictSlug(value: string): value is DistrictSlug {
  return Object.prototype.hasOwnProperty.call(TASHKENT_DISTRICTS, value);
}

/** Категория объекта — для размещения собственниками и фильтров. */
export const PROPERTY_CATEGORIES = {
  apartment: "Квартира",
  house: "Дом / коттедж",
  room: "Комната (студентам)",
  commercial: "Коммерческая",
  land: "Участок",
} as const;

export type PropertyCategory = keyof typeof PROPERTY_CATEGORIES;

export const PROPERTY_CATEGORY_KEYS = Object.keys(PROPERTY_CATEGORIES) as PropertyCategory[];

/** Срок аренды: помесячно (жильё, студенты) или посуточно (туристы). */
export type RentTerm = "month" | "day";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Одна «комната» 3D-тура — равнопромежуточная (equirectangular) 360°-фотография 2:1. */
export interface TourScene {
  id: string;
  title: string;
  src: string;
  /** Запасная панорама, если основная не загрузилась (например, файл ещё не добавлен). */
  fallbackSrc?: string;
}

export interface Property {
  id: string;
  type: DealType;
  /** Только для продажи: новостройка или вторичка. Нет значения — новостройка. */
  market?: Market;
  /** Объявление собственника/агентства из базы (а не демо-объект из кода). */
  fromListing?: boolean;
  /** Продавец объявления: собственник или агентство (для вторички и аренды от людей). */
  seller?: { type: "owner" | "agent"; company?: string };
  title: string;
  district: DistrictSlug;
  /** Для sale — цена «от», для rent — цена в месяц. Целое число в единицах валюты. */
  price: number;
  currency: Currency;
  imageUrl: string | null;
  tags: string[];
  status: PropertyStatus;
  /** Комнатность (0 = студия). Для новостроек — минимальная доступная. */
  rooms: number;
  /** Площадь в м² (для новостроек — минимальная). */
  areaM2: number;
  category?: PropertyCategory;
  rentTerm?: RentTerm;
  address?: string;
  location?: GeoPoint;
  description?: string;
  /** Дополнительные фото для галереи (imageUrl — обложка). */
  gallery?: string[];
  /** 3D-тур 360°. Пусто — кнопки «3D-тур» нет. */
  tour?: TourScene[];
  floor?: number;
  floorsTotal?: number;
  /** Подробности: дом, коммуникации, рядом, условия аренды/продажи, для иностранцев. */
  details?: PropertyDetails;
}
