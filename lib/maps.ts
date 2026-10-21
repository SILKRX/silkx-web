import { TASHKENT_BOUNDS } from "@/lib/geo";
import type { GeoPoint } from "@/lib/types";

/**
 * Карты без npm-зависимостей: скрипты грузятся в рантайме и только на страницах с картой.
 *
 *  • NEXT_PUBLIC_YANDEX_MAPS_API_KEY задан → настоящие Яндекс Карты 2.1 + геокодер Яндекса
 *    (ключ бесплатно: developer.tech.yandex.ru → «JavaScript API и HTTP Геокодер»).
 *  • ключа нет → Leaflet + тёмные тайлы OpenStreetMap/CARTO + геокодер Nominatim. Работает сразу.
 *
 * Компоненты работают с единым интерфейсом MapHandle и не знают, какой движок под капотом.
 */

export const YANDEX_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
export const MAP_ENGINE: "yandex" | "leaflet" = YANDEX_KEY ? "yandex" : "leaflet";

export interface MapHandle {
  setPoint(point: GeoPoint, opts?: { pan?: boolean; zoom?: number }): void;
  /** Пересчитать размер (контейнер изменился/стал видимым). */
  invalidate(): void;
  destroy(): void;
}

export interface CreateMapOptions {
  center: GeoPoint;
  zoom?: number;
  /** Пин можно перетаскивать и ставить кликом по карте. */
  interactive?: boolean;
  onPick?: (point: GeoPoint) => void;
}

export interface GeocodeResult {
  point: GeoPoint;
  address: string;
}

// ---------------------------------------------------------------------------
// Загрузчик скриптов (один раз на страницу, с кэшем промиса и повтором после ошибки)
// ---------------------------------------------------------------------------
const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scriptCache.delete(src); // разрешаем повторную попытку
      el.remove();
      reject(new Error(`Не удалось загрузить ${src}`));
    };
    document.head.appendChild(el);
  });
  scriptCache.set(src, promise);
  return promise;
}

function loadStyle(href: string): void {
  if (document.querySelector(`link[data-map-css="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.mapCss = href;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// Минимальные типы внешних API (без @types — нам нужна малая часть)
// ---------------------------------------------------------------------------
interface LeafletLatLng {
  lat: number;
  lng: number;
}
interface LeafletMarker {
  setLatLng(ll: [number, number]): LeafletMarker;
  getLatLng(): LeafletLatLng;
  on(event: string, fn: () => void): LeafletMarker;
}
interface LeafletMap {
  setView(ll: [number, number], zoom?: number, opts?: { animate?: boolean }): LeafletMap;
  panTo(ll: [number, number]): LeafletMap;
  getZoom(): number;
  on(event: string, fn: (e: { latlng: LeafletLatLng }) => void): LeafletMap;
  invalidateSize(): void;
  remove(): void;
}
interface LeafletNS {
  map(el: HTMLElement, opts: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, opts: Record<string, unknown>): { addTo(m: LeafletMap): void };
  marker(ll: [number, number], opts: Record<string, unknown>): LeafletMarker & { addTo(m: LeafletMap): LeafletMarker };
  divIcon(opts: Record<string, unknown>): unknown;
  control: { zoom(opts: Record<string, unknown>): { addTo(m: LeafletMap): void } };
}

interface YGeoObject {
  geometry: { getCoordinates(): [number, number]; setCoordinates(c: [number, number]): void };
  getAddressLine(): string;
  events: { add(event: string, fn: () => void): void };
}
interface YMap {
  geoObjects: { add(o: unknown): void };
  setCenter(c: [number, number], zoom?: number, opts?: Record<string, unknown>): void;
  getZoom(): number;
  events: { add(event: string, fn: (e: { get(k: string): [number, number] }) => void): void };
  container: { fitToViewport(): void };
  destroy(): void;
}
interface YMapsNS {
  ready(): Promise<void>;
  Map: new (el: HTMLElement, state: Record<string, unknown>, opts?: Record<string, unknown>) => YMap;
  Placemark: new (c: [number, number], props: Record<string, unknown>, opts: Record<string, unknown>) => YGeoObject;
  geocode(
    q: string | [number, number],
    opts?: Record<string, unknown>,
  ): Promise<{ geoObjects: { get(i: number): YGeoObject | undefined; getLength(): number } }>;
}

declare global {
  interface Window {
    L?: LeafletNS;
    ymaps?: YMapsNS;
  }
}

const toPair = (p: GeoPoint): [number, number] => [p.lat, p.lng];

// ---------------------------------------------------------------------------
// Leaflet + OSM
// ---------------------------------------------------------------------------
const LEAFLET_VERSION = "1.9.4";
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

// Золотой пин бренда (SVG, без картинок-ассетов)
const PIN_HTML = `<svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M18 45s15-15.2 15-27A15 15 0 1 0 3 18c0 11.8 15 27 15 27z" fill="#BCA37F" stroke="#1C1C1E" stroke-width="2"/>
<circle cx="18" cy="18" r="6" fill="#1C1C1E"/></svg>`;

async function createLeafletMap(el: HTMLElement, opts: CreateMapOptions): Promise<MapHandle> {
  loadStyle(LEAFLET_CSS);
  await loadScript(LEAFLET_JS);
  const L = window.L;
  if (!L) throw new Error("Leaflet не инициализировался");

  const map = L.map(el, {
    center: toPair(opts.center),
    zoom: opts.zoom ?? 15,
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: opts.interactive ?? false, // на странице объекта колесо листает страницу, а не карту
  });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  const icon = L.divIcon({ html: PIN_HTML, className: "", iconSize: [36, 46], iconAnchor: [18, 45] });
  const marker = L.marker(toPair(opts.center), { icon, draggable: opts.interactive ?? false, keyboard: false }).addTo(map);

  if (opts.interactive && opts.onPick) {
    const onPick = opts.onPick;
    marker.on("dragend", () => {
      const ll = marker.getLatLng();
      onPick({ lat: ll.lat, lng: ll.lng });
    });
    map.on("click", (e) => {
      marker.setLatLng([e.latlng.lat, e.latlng.lng]);
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }

  return {
    setPoint(point, o) {
      marker.setLatLng(toPair(point));
      if (o?.zoom) map.setView(toPair(point), o.zoom);
      else if (o?.pan !== false) map.panTo(toPair(point));
    },
    invalidate: () => map.invalidateSize(),
    destroy: () => map.remove(),
  };
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const viewbox = `${TASHKENT_BOUNDS.minLng},${TASHKENT_BOUNDS.maxLat},${TASHKENT_BOUNDS.maxLng},${TASHKENT_BOUNDS.minLat}`;

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

/** Убираем хвост «…, Ташкент, 100000, Узбекистан» — в UI он лишний. */
function shortenOsmAddress(full: string): string {
  return full
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !/^\d{5,6}$/.test(s) && !/Узбекистан|Uzbekistan|O'zbekiston/i.test(s))
    .slice(0, 4)
    .join(", ");
}

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const url = `${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=ru&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const items = (await res.json()) as NominatimItem[];
  return items
    .map((i) => ({ point: { lat: Number(i.lat), lng: Number(i.lon) }, address: shortenOsmAddress(i.display_name) }))
    .filter((r) => Number.isFinite(r.point.lat) && Number.isFinite(r.point.lng));
}

async function nominatimReverse(point: GeoPoint, signal?: AbortSignal): Promise<string | null> {
  const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=ru&lat=${point.lat}&lon=${point.lng}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<NominatimItem>;
  return data.display_name ? shortenOsmAddress(data.display_name) : null;
}

// ---------------------------------------------------------------------------
// Яндекс Карты 2.1
// ---------------------------------------------------------------------------
async function loadYandex(): Promise<YMapsNS> {
  await loadScript(`https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(YANDEX_KEY)}&lang=ru_RU`);
  const ymaps = window.ymaps;
  if (!ymaps) throw new Error("Яндекс Карты не инициализировались");
  await ymaps.ready();
  return ymaps;
}

async function createYandexMap(el: HTMLElement, opts: CreateMapOptions): Promise<MapHandle> {
  const ymaps = await loadYandex();
  const map = new ymaps.Map(
    el,
    { center: toPair(opts.center), zoom: opts.zoom ?? 15, controls: ["zoomControl", "geolocationControl"] },
    { suppressMapOpenBlock: true },
  );
  const placemark = new ymaps.Placemark(toPair(opts.center), {}, {
    preset: "islands#darkOrangeDotIcon",
    iconColor: "#BCA37F",
    draggable: opts.interactive ?? false,
  });
  map.geoObjects.add(placemark);

  if (opts.interactive && opts.onPick) {
    const onPick = opts.onPick;
    placemark.events.add("dragend", () => {
      const [lat, lng] = placemark.geometry.getCoordinates();
      onPick({ lat, lng });
    });
    map.events.add("click", (e) => {
      const [lat, lng] = e.get("coords");
      placemark.geometry.setCoordinates([lat, lng]);
      onPick({ lat, lng });
    });
  }

  return {
    setPoint(point, o) {
      placemark.geometry.setCoordinates(toPair(point));
      if (o?.pan !== false || o?.zoom) map.setCenter(toPair(point), o?.zoom ?? map.getZoom(), { duration: 300 });
    },
    invalidate: () => map.container.fitToViewport(),
    destroy: () => map.destroy(),
  };
}

const yandexBounds = [
  [TASHKENT_BOUNDS.minLat, TASHKENT_BOUNDS.minLng],
  [TASHKENT_BOUNDS.maxLat, TASHKENT_BOUNDS.maxLng],
];

async function yandexSearch(query: string): Promise<GeocodeResult[]> {
  const ymaps = await loadYandex();
  const res = await ymaps.geocode(`Ташкент, ${query}`, { results: 5, boundedBy: yandexBounds, strictBounds: true });
  const out: GeocodeResult[] = [];
  for (let i = 0; i < res.geoObjects.getLength(); i++) {
    const g = res.geoObjects.get(i);
    if (!g) continue;
    const [lat, lng] = g.geometry.getCoordinates();
    out.push({ point: { lat, lng }, address: g.getAddressLine().replace(/^Узбекистан,\s*/, "") });
  }
  return out;
}

async function yandexReverse(point: GeoPoint): Promise<string | null> {
  const ymaps = await loadYandex();
  const res = await ymaps.geocode(toPair(point), { results: 1 });
  const g = res.geoObjects.get(0);
  return g ? g.getAddressLine().replace(/^Узбекистан,\s*/, "") : null;
}

// ---------------------------------------------------------------------------
// Публичный API
// ---------------------------------------------------------------------------
export function createMap(el: HTMLElement, opts: CreateMapOptions): Promise<MapHandle> {
  return MAP_ENGINE === "yandex" ? createYandexMap(el, opts) : createLeafletMap(el, opts);
}

export function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  return MAP_ENGINE === "yandex" ? yandexSearch(query) : nominatimSearch(query, signal);
}

export function reverseGeocode(point: GeoPoint, signal?: AbortSignal): Promise<string | null> {
  return MAP_ENGINE === "yandex" ? yandexReverse(point) : nominatimReverse(point, signal);
}
