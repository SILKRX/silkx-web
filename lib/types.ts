// Общие доменные типы SILKX. Единый источник правды для UI, моков и (позже) Supabase.

export type DealType = "sale" | "rent";

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
}

export interface Property {
  id: string;
  type: DealType;
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
}
