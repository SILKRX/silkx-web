import { DEMO_TOUR } from "@/lib/mock-data";
import type { Currency, DistrictSlug, GeoPoint, TourScene } from "@/lib/types";

// Отели Ташкента. Временные данные до подключения БД: названия, телефоны и адреса — ДЕМО
// (вымышленные). Перед запуском замените на реальные данные отелей-партнёров.

/** Категория (тип) номера: «Стандарт», «Делюкс»… и конкретные номера комнат этой категории. */
export interface HotelRoom {
  id: string;
  name: string;
  /** Номера комнат этой категории, напр. ["201", "202"]. */
  numbers: string[];
  beds: string;
  /** Максимум гостей. */
  capacity: number;
  areaM2: number;
  /** Цена за ночь. */
  price: number;
  currency: Currency;
  breakfast: boolean;
  amenities: string[];
  imageUrl: string;
  /** 3D-тур 360° по номеру. */
  tour?: TourScene[];
}

export interface Hotel {
  id: string;
  name: string;
  stars: 1 | 2 | 3 | 4 | 5;
  /**
   * Оценка гостей — ТОЛЬКО из проверяемого источника (Google, Booking.com, собственные отзывы с подтверждённым
   * проживанием) с указанием источника. Выдуманные оценки и отзывы запрещены (закон о рекламе, защита потребителей).
   */
  rating?: { score: number; outOf: 5 | 10; count: number; source: string; url?: string };
  district: DistrictSlug;
  address: string;
  location: GeoPoint;
  /** Телефон ресепшена в международном формате. */
  phone: string;
  email?: string;
  telegram?: string;
  website?: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  /** 3D-тур по лобби и общим зонам. */
  tour?: TourScene[];
  checkIn: string;
  checkOut: string;
  languages: string[];
  amenities: string[];
  tags: string[];
  rooms: HotelRoom[];
}

const img = (photoId: string, w = 1200): string =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=70`;

const [LIVING, BEDROOM, KITCHEN] = DEMO_TOUR as [TourScene, TourScene, TourScene];

// Реальные 360°-фотографии интерьеров с Poly Haven (лицензия CC0 — коммерческое использование без указания
// автора): hotel_room, modern_bathroom, entrance_hall, warm_restaurant, lythwood_lounge. Файлы: /public/tours/real/.
// Это ПРИМЕРЫ интерьеров, а не снимки конкретных отелей — отель-партнёр загружает свои 360°-снимки.
const real = (file: string, fallback: TourScene) => ({ src: `/tours/real/${file}.jpg`, fallbackSrc: fallback.fallbackSrc });

const ROOM_TOUR: TourScene[] = [
  { id: "room", title: "Номер", ...real("hotel-room", BEDROOM) },
  { id: "bathroom", title: "Ванная", ...real("bathroom", KITCHEN) },
];
const SUITE_TOUR: TourScene[] = [
  { id: "suite-living", title: "Гостиная", ...real("lounge", LIVING) },
  { id: "suite-bedroom", title: "Спальня", ...real("hotel-room", BEDROOM) },
  { id: "suite-bathroom", title: "Ванная", ...real("bathroom", KITCHEN) },
];
const LOBBY_TOUR: TourScene[] = [
  { id: "lobby", title: "Лобби", ...real("lobby", LIVING) },
  { id: "restaurant", title: "Ресторан", ...real("restaurant", KITCHEN) },
  { id: "sample-room", title: "Номер", ...real("hotel-room", BEDROOM) },
];

export const HOTELS: readonly Hotel[] = [
  {
    id: "silk-road-boutique",
    name: "Silk Road Boutique Hotel",
    stars: 5,
    district: "yunusabad",
    address: "ул. Амира Темура, 1 (демо-адрес)",
    location: { lat: 41.3265, lng: 69.2849 },
    phone: "+998 71 200-00-01",
    email: "booking@silkroad-demo.uz",
    telegram: "silkroad_demo",
    description:
      "Бутик-отель в восточном стиле в 10 минутах от Tashkent City. Номера с панорамными окнами, авторская кухня, " +
      "спа с хаммамом и трансфер из аэропорта. Персонал говорит на русском, узбекском, английском и китайском.",
    imageUrl: img("photo-1566073771259-6a8506099945"),
    gallery: [
      img("photo-1542314831-068cd1dbfeeb", 800),
      img("photo-1582719478250-c89cae4dc85b", 800),
      img("photo-1590490360182-c33d57733427", 800),
      img("photo-1611892440504-42a792e24d32", 800),
    ],
    tour: LOBBY_TOUR,
    checkIn: "14:00",
    checkOut: "12:00",
    languages: ["Русский", "O'zbekcha", "English", "中文"],
    amenities: ["Бесплатный Wi-Fi", "Завтрак включён", "Спа и хаммам", "Фитнес-зал", "Трансфер из аэропорта", "Парковка", "Ресторан", "Круглосуточная стойка"],
    tags: ["5 звёзд", "Спа", "Трансфер"],
    rooms: [
      {
        id: "standard",
        name: "Стандарт",
        numbers: ["201", "202", "203", "204", "205"],
        beds: "1 двуспальная или 2 односпальные",
        capacity: 2,
        areaM2: 24,
        price: 120,
        currency: "USD",
        breakfast: true,
        amenities: ["Кондиционер", "Сейф", "Чайная станция"],
        imageUrl: img("photo-1631049307264-da0ec9d70304", 800),
        tour: ROOM_TOUR,
      },
      {
        id: "deluxe",
        name: "Делюкс с видом на город",
        numbers: ["301", "302", "303", "401", "402"],
        beds: "1 кровать king-size",
        capacity: 2,
        areaM2: 32,
        price: 165,
        currency: "USD",
        breakfast: true,
        amenities: ["Панорамные окна", "Ванна", "Кофемашина"],
        imageUrl: img("photo-1618773928121-c32242e63f39", 800),
        tour: ROOM_TOUR,
      },
      {
        id: "suite",
        name: "Люкс Silk Suite",
        numbers: ["501", "502"],
        beds: "1 кровать king-size + диван",
        capacity: 4,
        areaM2: 58,
        price: 290,
        currency: "USD",
        breakfast: true,
        amenities: ["Гостиная", "Мини-кухня", "Вид на Tashkent City", "Халаты и тапочки"],
        imageUrl: img("photo-1596394516093-501ba68a0ba6", 800),
        tour: SUITE_TOUR,
      },
    ],
  },
  {
    id: "registan-garden",
    name: "Registan Garden Hotel",
    stars: 4,
    district: "mirabad",
    address: "ул. Шахрисабз, 12 (демо-адрес)",
    location: { lat: 41.2995, lng: 69.2742 },
    phone: "+998 71 200-00-02",
    email: "hello@registan-demo.uz",
    telegram: "registan_demo",
    description:
      "Уютный отель с внутренним садом и чайханой в тихом центре. Рядом метро «Ойбек», рестораны и Бродвей. " +
      "Подойдёт для деловых поездок и путешествий с семьёй.",
    imageUrl: img("photo-1551882547-ff40c63fe5fa"),
    gallery: [
      img("photo-1520250497591-112f2f40a3f4", 800),
      img("photo-1590490360182-c33d57733427", 800),
      img("photo-1631049307264-da0ec9d70304", 800),
      img("photo-1582719478250-c89cae4dc85b", 800),
    ],
    tour: LOBBY_TOUR,
    checkIn: "14:00",
    checkOut: "12:00",
    languages: ["Русский", "O'zbekcha", "English"],
    amenities: ["Бесплатный Wi-Fi", "Завтрак", "Сад и чайхана", "Семейные номера", "Парковка", "Прачечная"],
    tags: ["4 звезды", "Центр", "Метро рядом"],
    rooms: [
      {
        id: "economy",
        name: "Эконом",
        numbers: ["101", "102", "103"],
        beds: "1 двуспальная кровать",
        capacity: 2,
        areaM2: 18,
        price: 55,
        currency: "USD",
        breakfast: false,
        amenities: ["Кондиционер", "Душ"],
        imageUrl: img("photo-1611892440504-42a792e24d32", 800),
        tour: ROOM_TOUR,
      },
      {
        id: "comfort",
        name: "Комфорт",
        numbers: ["201", "202", "203", "204"],
        beds: "2 односпальные кровати",
        capacity: 2,
        areaM2: 22,
        price: 75,
        currency: "USD",
        breakfast: true,
        amenities: ["Рабочий стол", "Холодильник", "Вид в сад"],
        imageUrl: img("photo-1631049307264-da0ec9d70304", 800),
        tour: ROOM_TOUR,
      },
      {
        id: "family",
        name: "Семейный",
        numbers: ["301", "302"],
        beds: "1 двуспальная + 2 односпальные",
        capacity: 4,
        areaM2: 36,
        price: 110,
        currency: "USD",
        breakfast: true,
        amenities: ["Две комнаты", "Детская кроватка по запросу", "Ванна"],
        imageUrl: img("photo-1618773928121-c32242e63f39", 800),
        tour: SUITE_TOUR,
      },
    ],
  },
  {
    id: "chimgan-view",
    name: "Chimgan View Hotel",
    stars: 4,
    district: "mirzo-ulugbek",
    address: "ул. Мирзо Улугбека, 80 (демо-адрес)",
    location: { lat: 41.3389, lng: 69.3341 },
    phone: "+998 71 200-00-03",
    email: "stay@chimgan-demo.uz",
    description:
      "Современный отель у парка Мирзо Улугбека с видом на горы. Бассейн на крыше, коворкинг и номера для долгого проживания " +
      "со скидкой от 7 ночей — удобно для студентов, стажёров и командировок.",
    imageUrl: img("photo-1542314831-068cd1dbfeeb"),
    gallery: [
      img("photo-1566073771259-6a8506099945", 800),
      img("photo-1596394516093-501ba68a0ba6", 800),
      img("photo-1611892440504-42a792e24d32", 800),
      img("photo-1520250497591-112f2f40a3f4", 800),
    ],
    tour: LOBBY_TOUR,
    checkIn: "15:00",
    checkOut: "11:00",
    languages: ["Русский", "O'zbekcha", "English", "한국어"],
    amenities: ["Бесплатный Wi-Fi", "Бассейн на крыше", "Коворкинг", "Фитнес-зал", "Парковка", "Скидка от 7 ночей"],
    tags: ["4 звезды", "Бассейн", "Долгое проживание"],
    rooms: [
      {
        id: "studio",
        name: "Студия",
        numbers: ["110", "111", "112", "113"],
        beds: "1 двуспальная кровать",
        capacity: 2,
        areaM2: 26,
        price: 70,
        currency: "USD",
        breakfast: false,
        amenities: ["Мини-кухня", "Рабочее место", "Стиральная машина"],
        imageUrl: img("photo-1590490360182-c33d57733427", 800),
        tour: SUITE_TOUR,
      },
      {
        id: "mountain-view",
        name: "Делюкс с видом на горы",
        numbers: ["701", "702", "801", "802"],
        beds: "1 кровать king-size",
        capacity: 3,
        areaM2: 30,
        price: 95,
        currency: "USD",
        breakfast: true,
        amenities: ["Балкон", "Вид на горы", "Кофемашина"],
        imageUrl: img("photo-1582719478250-c89cae4dc85b", 800),
        tour: ROOM_TOUR,
      },
    ],
  },
];

export function getHotelById(id: string): Hotel | null {
  return HOTELS.find((h) => h.id === id) ?? null;
}

/** Минимальная цена за ночь — для карточки «от $55 / ночь». */
export function hotelMinPrice(h: Hotel): { price: number; currency: Currency } {
  const cheapest = h.rooms.reduce((min, r) => (r.price < min.price ? r : min), h.rooms[0] ?? { price: 0, currency: "USD" as Currency });
  return { price: cheapest.price, currency: cheapest.currency };
}

export function hotelRoomsCount(h: Hotel): number {
  return h.rooms.reduce((sum, r) => sum + r.numbers.length, 0);
}

/** "+998 71 200-00-01" → "tel:+998712000001" */
export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, "")}`;
