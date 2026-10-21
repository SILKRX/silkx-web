import type { DistrictSlug, GeoPoint } from "@/lib/types";

/** Центр Ташкента (площадь Амира Темура). */
export const TASHKENT_CENTER: GeoPoint = { lat: 41.3111, lng: 69.2797 };

/** Примерные центры районов — стартовая точка карты при выборе района. */
export const DISTRICT_CENTERS: Record<DistrictSlug, GeoPoint> = {
  "mirzo-ulugbek": { lat: 41.3405, lng: 69.335 },
  yunusabad: { lat: 41.365, lng: 69.287 },
  chilanzar: { lat: 41.275, lng: 69.203 },
  yakkasaray: { lat: 41.285, lng: 69.256 },
  mirabad: { lat: 41.2925, lng: 69.276 },
  shaykhantahur: { lat: 41.322, lng: 69.229 },
  almazar: { lat: 41.35, lng: 69.215 },
  sergeli: { lat: 41.226, lng: 69.22 },
  uchtepa: { lat: 41.3, lng: 69.17 },
  bektemir: { lat: 41.209, lng: 69.334 },
  yashnabad: { lat: 41.29, lng: 69.335 },
  yangihayot: { lat: 41.205, lng: 69.18 },
};

/** Грубые границы Большого Ташкента — защита от «случайной точки в океане». */
export const TASHKENT_BOUNDS = { minLat: 41.1, maxLat: 41.5, minLng: 69.05, maxLng: 69.55 } as const;

export function isInTashkent({ lat, lng }: GeoPoint): boolean {
  return (
    lat >= TASHKENT_BOUNDS.minLat &&
    lat <= TASHKENT_BOUNDS.maxLat &&
    lng >= TASHKENT_BOUNDS.minLng &&
    lng <= TASHKENT_BOUNDS.maxLng
  );
}

/** Ссылка «Открыть в Яндекс Картах» (ll = lng,lat — у Яндекса долгота первой). */
export function yandexMapsUrl({ lat, lng }: GeoPoint, zoom = 16): string {
  const ll = `${lng.toFixed(6)},${lat.toFixed(6)}`;
  return `https://yandex.uz/maps/?ll=${ll}&z=${zoom}&pt=${ll},pm2rdm`;
}
