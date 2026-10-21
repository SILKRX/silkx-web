import type { Property, PropertyStatus, TourScene } from "@/lib/types";

// Временные данные до подключения Supabase. Названия ЖК вымышленные.
// При переходе на БД заменяется одной функцией загрузки — типы уже совпадают.

const img = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=70`;

// Демо-тур: 360°-панорамы лежат в /public/tours (сгенерированы, CC0).
// Собственники загружают свои — снятые в режиме «Панорама 360°» на телефоне или камерой 360.
export const DEMO_TOUR: TourScene[] = [
  { id: "living", title: "Гостиная", src: "/tours/living.jpg" },
  { id: "bedroom", title: "Спальня", src: "/tours/bedroom.jpg" },
  { id: "kitchen", title: "Кухня", src: "/tours/kitchen.jpg" },
];

export const MOCK_PROPERTIES: readonly Property[] = [
  // ---------- Новостройки ----------
  {
    id: "silk-garden-residence",
    type: "sale",
    title: "ЖК Silk Garden Residence",
    district: "mirzo-ulugbek",
    price: 78_000,
    currency: "USD",
    imageUrl: img("photo-1545324418-cc1a3fa10c00"),
    tags: ["Бизнес-класс", "Рассрочка 0%", "Сдача 2027"],
    status: "hot",
    rooms: 1,
    areaM2: 42,
    category: "apartment",
    address: "ул. Мирзо Улугбека, 56",
    location: { lat: 41.3415, lng: 69.3362 },
    tour: DEMO_TOUR,
  },
  {
    id: "mirabad-heights",
    type: "sale",
    title: "ЖК Mirabad Heights",
    district: "mirabad",
    price: 145_000,
    currency: "USD",
    imageUrl: img("photo-1486406146926-c627a92ad1ab"),
    tags: ["Премиум", "Вид на город", "Консьерж"],
    status: "hot",
    rooms: 2,
    areaM2: 68,
    category: "apartment",
    address: "ул. Амира Темура, 107",
    location: { lat: 41.2932, lng: 69.2771 },
    tour: DEMO_TOUR,
  },
  {
    id: "yunusabad-park",
    type: "sale",
    title: "ЖК Yunusabad Park",
    district: "yunusabad",
    price: 64_000,
    currency: "USD",
    imageUrl: img("photo-1460317442991-0ec209397118"),
    tags: ["Комфорт-класс", "Подземный паркинг", "Школа во дворе"],
    status: "new",
    rooms: 1,
    areaM2: 38,
    category: "apartment",
    address: "Юнусабад, 11-й квартал",
    location: { lat: 41.3662, lng: 69.2884 },
  },
  {
    id: "chilanzar-avenue",
    type: "sale",
    title: "ЖК Chilanzar Avenue",
    district: "chilanzar",
    price: 41_000,
    currency: "USD",
    imageUrl: img("photo-1574362848149-11496d93a7c7"),
    tags: ["Эконом", "Ипотека", "У метро"],
    status: "verified",
    rooms: 0,
    areaM2: 28,
    category: "apartment",
    address: "Чиланзар, 9-й квартал",
    location: { lat: 41.2761, lng: 69.2041 },
  },
  {
    id: "yakkasaray-loft",
    type: "sale",
    title: "ЖК Yakkasaray Loft",
    district: "yakkasaray",
    price: 98_000,
    currency: "USD",
    imageUrl: img("photo-1512917774080-9991f1c4c750"),
    tags: ["Бизнес-класс", "Потолки 3,2 м", "Тихий центр"],
    status: "verified",
    rooms: 3,
    areaM2: 85,
    category: "apartment",
    address: "ул. Шота Руставели, 12",
    location: { lat: 41.2861, lng: 69.2552 },
    tour: DEMO_TOUR,
  },
  // ---------- Аренда ----------
  {
    id: "rent-minor-2k",
    type: "rent",
    title: "2-комн. квартира у метро «Минор»",
    district: "yunusabad",
    price: 650,
    currency: "USD",
    imageUrl: img("photo-1522708323590-d24dbb6b0267"),
    tags: ["Свежий ремонт", "Мебель и техника", "Можно с детьми"],
    status: "available",
    rooms: 2,
    areaM2: 64,
    category: "apartment",
    address: "ул. Осиё, 4 (м. «Минор»)",
    location: { lat: 41.3253, lng: 69.2865 },
    tour: DEMO_TOUR,
  },
  {
    id: "rent-mu-studio",
    type: "rent",
    title: "Студия рядом с университетами",
    rentTerm: "month",
    district: "mirzo-ulugbek",
    price: 380,
    currency: "USD",
    imageUrl: img("photo-1502672260266-1c1ef2d93688"),
    tags: ["Для студентов", "Свежий ремонт", "Wi-Fi"],
    status: "hot",
    rooms: 0,
    areaM2: 30,
    category: "room",
    address: "ул. Университетская, 2",
    location: { lat: 41.3482, lng: 69.3418 },
    tour: DEMO_TOUR,
  },
  {
    id: "rent-shaykhantahur-4k",
    type: "rent",
    title: "4-комн. апартаменты в историческом центре",
    district: "shaykhantahur",
    price: 1_500,
    currency: "USD",
    imageUrl: img("photo-1560448204-e02f11c3d0e2"),
    tags: ["Премиум", "Свой паркинг", "Терраса"],
    status: "available",
    rooms: 4,
    areaM2: 140,
    category: "house",
    address: "ул. Себзор, 21",
    location: { lat: 41.3256, lng: 69.2308 },
    tour: DEMO_TOUR,
  },
  {
    id: "rent-chilanzar-3k",
    type: "rent",
    title: "3-комн. квартира для семьи",
    district: "chilanzar",
    price: 700,
    currency: "USD",
    imageUrl: img("photo-1493809842364-78817add7ffb"),
    tags: ["Рядом парк", "Кондиционеры"],
    status: "reserved",
    rooms: 3,
    areaM2: 82,
    category: "apartment",
    address: "Чиланзар, 19-й квартал",
    location: { lat: 41.2731, lng: 69.1985 },
  },
];

// Порядок показа в «Горячих предложениях»: горячие → проверенные → новинки → остальные.
const FEATURED_WEIGHT: Record<PropertyStatus, number> = {
  hot: 0,
  verified: 1,
  new: 2,
  available: 3,
  reserved: 99,
};

/** Подборка для главной. Забронированные не показываем — на них нельзя оставить заявку. */
export function getFeaturedProperties(limit: number): Property[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  return MOCK_PROPERTIES.filter((p) => p.status !== "reserved")
    .slice() // sort мутирует — работаем с копией, исходник readonly
    .sort((a, b) => FEATURED_WEIGHT[a.status] - FEATURED_WEIGHT[b.status])
    .slice(0, safeLimit);
}

/** Объект по id или null. Для страниц /complex/[id] и /rent/[id]. */
export function getPropertyById(id: string): Property | null {
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}

// Общие интерьерные фото для галереи демо-объектов (до подключения БД).
export const DEMO_GALLERY: readonly string[] = [
  img("photo-1600210492486-724fe5c67fb0"),
  img("photo-1600585154340-be6161a56a0c"),
  img("photo-1556911220-bff31c812dba"),
  img("photo-1616594039964-ae9021a400a0"),
];
