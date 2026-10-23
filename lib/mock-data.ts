import type { Property, PropertyStatus, TourScene } from "@/lib/types";

// Временные данные до подключения Supabase. Названия ЖК вымышленные.
// При переходе на БД заменяется одной функцией загрузки — типы уже совпадают.

const img = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=70`;

// Демо-тур: реальные 360°-фотографии интерьеров с Poly Haven (лицензия CC0 — можно для любых целей,
// включая коммерческие, без указания автора): Cayley Interior, Cabin, Blinds. Файлы: /public/tours/real/.
// Если реальных файлов нет — показываются сгенерированные комнаты (fallbackSrc).
// Собственники загружают свои — снятые камерой 360° (Insta360, Ricoh Theta) или приложением-«сферой» на телефоне.
export const DEMO_TOUR: TourScene[] = [
  { id: "living", title: "Гостиная", src: "/tours/real/living.jpg", fallbackSrc: "/tours/living.jpg" },
  { id: "bedroom", title: "Спальня", src: "/tours/real/bedroom.jpg", fallbackSrc: "/tours/bedroom.jpg" },
  { id: "kitchen", title: "Кухня", src: "/tours/real/kitchen.jpg", fallbackSrc: "/tours/kitchen.jpg" },
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
    details: {
      building: { yearBuilt: 2027, material: "monolith", floors: 16, elevator: true, parking: "underground", ceilingM: 3, security: true },
      utilities: { heating: "gas-boiler", gas: true, hotWater: "boiler", internet: true, ac: true },
      interior: { renovation: "none", furnished: false, balcony: true, view: "Парк и горы Чимган на горизонте", windowsFacing: "S" },
      nearby: [
        { kind: "metro", name: "Буюк Ипак Йули", minutes: 7, walk: true },
        { kind: "university", name: "Национальный университет (НУУз)", minutes: 10 },
        { kind: "park", name: "Парк Мирзо Улугбека", minutes: 5, walk: true },
        { kind: "chinese", name: "Китайские рестораны и супермаркет на Буюк Ипак Йули", minutes: 8 },
      ],
      sale: {
        market: "primary",
        documents: { title: true, encumbrance: "none" },
        bankAccredited: true,
        partnerBanks: ["Ipoteka-bank", "Hamkorbank", "Asakabank"],
        installment: { months: 24, downPct: 30, interestFree: true },
      },
      international: { languages: ["ru", "uz", "en", "zh"], wechat: "silkx_tashkent", payments: ["cash", "visa", "unionpay", "swift"] },
    },
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
    details: {
      building: { yearBuilt: 2026, commissionedYear: 2026, material: "monolith", floors: 24, elevator: true, parking: "underground", ceilingM: 3.2, security: true },
      utilities: { heating: "central", gas: false, hotWater: "central", internet: true, ac: true },
      interior: { renovation: "euro", furnished: false, balcony: true, view: "Панорама Tashkent City", windowsFacing: "SE" },
      nearby: [
        { kind: "metro", name: "Ойбек", minutes: 6, walk: true },
        { kind: "business", name: "Tashkent City / Международный бизнес-центр", minutes: 10 },
        { kind: "mall", name: "Next / Magic City", minutes: 8 },
        { kind: "hospital", name: "Akfa Medline", minutes: 12 },
      ],
      sale: {
        market: "primary",
        documents: { title: true, encumbrance: "none" },
        bankAccredited: true,
        partnerBanks: ["Kapitalbank", "NBU"],
        installment: { months: 18, downPct: 40, interestFree: true },
      },
      international: { languages: ["ru", "en", "zh", "ko", "tr"], wechat: "mirabad_heights", payments: ["cash", "visa", "unionpay", "alipay", "swift"] },
    },
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
    details: {
      building: { yearBuilt: 2027, material: "monolith", floors: 12, elevator: true, parking: "underground", ceilingM: 2.9, security: true },
      utilities: { heating: "gas-boiler", gas: true, hotWater: "boiler", internet: true },
      interior: { renovation: "none", furnished: false, balcony: true, windowsFacing: "E" },
      nearby: [
        { kind: "school", name: "Школа во дворе комплекса", minutes: 2, walk: true },
        { kind: "metro", name: "Шахристан", minutes: 12, walk: true },
        { kind: "bazaar", name: "Юнусабадский базар", minutes: 7 },
      ],
      sale: {
        market: "primary",
        documents: { title: true, encumbrance: "none" },
        bankAccredited: true,
        partnerBanks: ["Orient Finans Bank", "InfinBank"],
        installment: { months: 36, downPct: 20, interestFree: false },
      },
      international: { languages: ["ru", "uz"], payments: ["cash", "card-uz"] },
    },
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
    details: {
      building: { yearBuilt: 2019, commissionedYear: 2019, material: "panel", floors: 9, elevator: true, parking: "yard" },
      utilities: { heating: "central", gas: true, hotWater: "central", internet: true },
      interior: { renovation: "basic", furnished: false, balcony: false, windowsFacing: "W" },
      nearby: [
        { kind: "metro", name: "Новза", minutes: 4, walk: true },
        { kind: "bazaar", name: "Чиланзарский базар", minutes: 10 },
      ],
      sale: {
        market: "secondary",
        documents: { title: true, encumbrance: "pledge" },
        bankAccredited: false,
      },
      international: { languages: ["ru", "uz"], payments: ["cash"] },
    },
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
    details: {
      building: { yearBuilt: 2025, commissionedYear: 2025, material: "brick", floors: 7, elevator: true, parking: "underground", ceilingM: 3.2, security: true },
      utilities: { heating: "gas-boiler", gas: true, hotWater: "boiler", internet: true, ac: true },
      interior: { renovation: "designer", furnished: true, appliances: ["кухня Bosch", "посудомойка", "стиральная машина"], balcony: true, view: "Тихий двор", windowsFacing: "S" },
      nearby: [
        { kind: "metro", name: "Ойбек", minutes: 9, walk: true },
        { kind: "park", name: "Парк Бабура", minutes: 10 },
        { kind: "chinese", name: "Посольство и бизнес-офисы КНР рядом с Яккасараем", minutes: 12 },
      ],
      sale: {
        market: "primary",
        documents: { title: true, encumbrance: "unknown" },
        bankAccredited: true,
        partnerBanks: ["Ipoteka-bank"],
        installment: { months: 12, downPct: 50, interestFree: true },
      },
      international: { languages: ["ru", "en", "zh"], wechat: "yakkasaray_loft", payments: ["cash", "visa", "unionpay", "wechatpay"] },
    },
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
    details: {
      building: { yearBuilt: 2018, material: "brick", floors: 9, elevator: true, parking: "yard" },
      utilities: { heating: "central", gas: true, hotWater: "central", internet: true, ac: true },
      interior: { renovation: "euro", furnished: true, appliances: ["холодильник", "стиральная машина", "Smart TV"], balcony: true, windowsFacing: "SE" },
      nearby: [
        { kind: "metro", name: "Минор", minutes: 3, walk: true },
        { kind: "mall", name: "Samarqand Darvoza", minutes: 15 },
      ],
      rent: { minTermMonths: 6, depositMonths: 1, prepayMonths: 1, utilitiesIncluded: false, registrationHelp: true, pets: false, kids: true, contract: "notarized" },
      international: { languages: ["ru", "uz", "en"], payments: ["cash", "card-uz", "visa"] },
    },
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
    details: {
      building: { yearBuilt: 2021, material: "monolith", floors: 12, elevator: true, parking: "yard" },
      utilities: { heating: "central", gas: false, hotWater: "central", internet: true, ac: true },
      interior: { renovation: "euro", furnished: true, appliances: ["холодильник", "стиральная машина", "рабочий стол"], balcony: false, windowsFacing: "S" },
      nearby: [
        { kind: "university", name: "НУУз и ТУИТ", minutes: 6, walk: true },
        { kind: "university", name: "Westminster / Inha University", minutes: 15 },
        { kind: "metro", name: "Буюк Ипак Йули", minutes: 9, walk: true },
        { kind: "chinese", name: "Китайская кухня и магазины", minutes: 8 },
      ],
      rent: { minTermMonths: 10, depositMonths: 1, prepayMonths: 2, utilitiesIncluded: true, registrationHelp: true, pets: false, kids: false, students: true, contract: "simple" },
      international: { languages: ["ru", "uz", "en", "zh", "ko"], wechat: "silkx_students", payments: ["cash", "card-uz", "visa", "unionpay", "alipay"] },
    },
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
    details: {
      building: { yearBuilt: 2015, material: "brick", floors: 2, elevator: false, parking: "yard", ceilingM: 3.4, security: true },
      utilities: { heating: "gas-boiler", gas: true, hotWater: "boiler", internet: true, ac: true },
      interior: { renovation: "designer", furnished: true, appliances: ["полностью оборудованная кухня", "посудомойка", "сушилка"], balcony: true, view: "Терраса с видом на старый город", windowsFacing: "S" },
      nearby: [
        { kind: "bazaar", name: "Чорсу", minutes: 8 },
        { kind: "metro", name: "Гафур Гулям", minutes: 10, walk: true },
        { kind: "business", name: "Посольский район", minutes: 12 },
      ],
      rent: { minTermMonths: 12, depositMonths: 2, prepayMonths: 3, utilitiesIncluded: false, registrationHelp: true, pets: true, kids: true, contract: "notarized" },
      international: { languages: ["ru", "en", "zh", "tr"], wechat: "silkx_premium", payments: ["cash", "visa", "unionpay", "swift"] },
    },
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
    details: {
      building: { yearBuilt: 2010, material: "panel", floors: 9, elevator: true, parking: "yard" },
      utilities: { heating: "central", gas: true, hotWater: "central", internet: true, ac: true },
      interior: { renovation: "basic", furnished: true, balcony: true, windowsFacing: "E" },
      nearby: [
        { kind: "park", name: "Парк Чиланзар", minutes: 4, walk: true },
        { kind: "school", name: "Школа №271", minutes: 6, walk: true },
      ],
      rent: { minTermMonths: 12, depositMonths: 1, prepayMonths: 1, utilitiesIncluded: false, registrationHelp: false, pets: false, kids: true, contract: "simple" },
      international: { languages: ["ru", "uz"], payments: ["cash", "card-uz"] },
    },
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
