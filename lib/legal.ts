/**
 * Юридические данные SILKX — ЕДИНСТВЕННОЕ место, где их нужно заполнить.
 * Пустая строка = на сайте показывается «уточняется». Все поля из этого файла выводятся
 * на страницах /requisites, /offer, /privacy и в подвале.
 *
 * ⚠ Тексты документов — шаблон. Перед запуском их должен проверить юрист (см. COMPLIANCE.md).
 */

export const LEGAL_EDITION = "4 ноября 2026 г.";

export interface Requisites {
  /** Полное наименование: ООО «…» / ИП … */
  companyName: string;
  /** ИНН (СТИР) */
  inn: string;
  /** Юридический адрес */
  legalAddress: string;
  /** Почтовый / фактический адрес */
  postalAddress: string;
  director: string;
  bankName: string;
  /** МФО банка */
  mfo: string;
  /** Расчётный счёт */
  account: string;
  /** ОКЭД (вид деятельности) */
  oked: string;
  email: string;
  phone: string;
  /** E-mail для запросов по персональным данным */
  privacyEmail: string;
  /** Номер записи в Государственном реестре баз персональных данных (после регистрации) */
  pdRegistryNumber: string;
  /** Где физически хранятся персональные данные (после переезда — город/дата-центр в Узбекистане) */
  dataStorageLocation: string;
}

export const REQUISITES: Requisites = {
  companyName: "", // например: ООО «SILKX»
  inn: "",
  legalAddress: "", // например: 100000, г. Ташкент, …
  postalAddress: "",
  director: "",
  bankName: "",
  mfo: "",
  account: "",
  oked: "",
  email: "",
  phone: "",
  privacyEmail: "",
  pdRegistryNumber: "",
  dataStorageLocation: "",
};

export const PENDING = "уточняется";
export const req = (v: string): string => v.trim() || PENDING;

/** Сторонние сервисы: что получают, где находятся, зачем. Выводится в политике конфиденциальности и cookies. */
export interface ThirdParty {
  name: string;
  purpose: string;
  data: string;
  country: string;
  /** Где происходит обмен: в браузере посетителя или с нашего сервера */
  side: "browser" | "server";
  /** Ставит ли cookies / требует согласия на cookies */
  cookies: boolean;
  whenUsed: string;
  policyUrl: string;
}

export const THIRD_PARTIES: readonly ThirdParty[] = [
  {
    name: "Netlify, Inc.",
    purpose: "Хостинг сайта и серверных функций",
    data: "IP-адрес, данные браузера, технические журналы запросов",
    country: "США",
    side: "server",
    cookies: false,
    whenUsed: "При каждом посещении сайта",
    policyUrl: "https://www.netlify.com/privacy/",
  },
  {
    name: "Anthropic PBC (Claude API)",
    purpose: "Ответы AI-ассистента SILKX AI",
    data: "Текст сообщений в чате (телефоны и e-mail автоматически скрываются перед отправкой), язык интерфейса",
    country: "США",
    side: "server",
    cookies: false,
    whenUsed: "Только когда вы пишете ассистенту вопрос, на который нет готового ответа",
    policyUrl: "https://www.anthropic.com/legal/privacy",
  },
  {
    name: "Telegram (Telegram Messenger Inc.)",
    purpose: "Уведомление менеджера о новой заявке",
    data: "Данные заявки: имя, телефон (может быть частично скрыт — см. настройки), даты, комментарий",
    country: "ОАЭ / распределённая инфраструктура",
    side: "server",
    cookies: false,
    whenUsed: "При отправке заявки на бронирование, объявления или запроса по данным",
    policyUrl: "https://telegram.org/privacy",
  },
  {
    name: "Supabase Inc.",
    purpose: "База данных и хранилище фото объявлений (если подключено)",
    data: "Данные объявлений и заявок, загруженные фотографии",
    country: "Зависит от выбранного региона проекта (должен быть заменён на сервер в Узбекистане)",
    side: "server",
    cookies: false,
    whenUsed: "При отправке объявления или заявки",
    policyUrl: "https://supabase.com/privacy",
  },
  {
    name: "ООО «Яндекс» (Яндекс Карты)",
    purpose: "Интерактивная карта и поиск адреса",
    data: "IP-адрес, данные браузера, cookies Яндекса, координаты просматриваемой точки",
    country: "Россия",
    side: "browser",
    cookies: true,
    whenUsed: "Только если вы разрешили «Карты Яндекса» в настройках cookies и на сайте подключён ключ Яндекса",
    policyUrl: "https://yandex.ru/legal/confidential/",
  },
  {
    name: "CARTO и OpenStreetMap (карта по умолчанию)",
    purpose: "Картографическая подложка и поиск адреса при размещении объекта",
    data: "IP-адрес, данные браузера, запрашиваемый фрагмент карты или адрес",
    country: "Испания / Великобритания",
    side: "browser",
    cookies: false,
    whenUsed: "Когда на странице показывается карта или вы ищете адрес",
    policyUrl: "https://carto.com/privacy",
  },
  {
    name: "unpkg (Cloudflare, Inc.)",
    purpose: "Загрузка библиотеки карт Leaflet",
    data: "IP-адрес, данные браузера",
    country: "США",
    side: "browser",
    cookies: false,
    whenUsed: "Когда на странице показывается карта",
    policyUrl: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Распознавание речи браузера (Google / Apple)",
    purpose: "Голосовой ввод в чате SILKX AI",
    data: "Запись голоса во время нажатой кнопки микрофона",
    country: "США",
    side: "browser",
    cookies: false,
    whenUsed: "Только когда вы нажимаете кнопку микрофона",
    policyUrl: "https://policies.google.com/privacy",
  },
];

/** Что сайт хранит в браузере посетителя. Cookies сайт сам не ставит — только localStorage. */
export interface StoredItem {
  key: string;
  purpose: string;
  category: "necessary" | "functional" | "maps";
  lifetime: string;
}

export const BROWSER_STORAGE: readonly StoredItem[] = [
  { key: "silkx:consent", purpose: "Ваш выбор в баннере cookies", category: "necessary", lifetime: "12 месяцев" },
  { key: "silkx:theme", purpose: "Светлая или тёмная тема", category: "functional", lifetime: "Пока вы не очистите данные" },
  { key: "silkx:assistant-lang", purpose: "Язык AI-ассистента", category: "functional", lifetime: "Пока вы не очистите данные" },
  { key: "silkx:add-listing-draft:v1", purpose: "Черновик объявления, чтобы не потерять введённое", category: "functional", lifetime: "До отправки объявления" },
  { key: "silkx:my-listings:v1", purpose: "Список «Мои объекты» в профиле — только на вашем устройстве", category: "functional", lifetime: "Пока вы не удалите" },
  { key: "silkx:seller-profile:v1", purpose: "Профиль продавца (имя, телефон, фото) — только на вашем устройстве", category: "functional", lifetime: "Пока вы не удалите профиль" },
  { key: "Cookies Яндекса (yandexuid и др.)", purpose: "Работа Яндекс Карт", category: "maps", lifetime: "По правилам Яндекса" },
];

/** Лицензии на шрифты, изображения и библиотеки — страница /licenses. */
export interface LicenseItem {
  name: string;
  usage: string;
  license: string;
  url: string;
  note?: string;
  status: "ok" | "check";
}

export const LICENSES: readonly LicenseItem[] = [
  { name: "Inter", usage: "Основной шрифт", license: "SIL Open Font License 1.1", url: "https://github.com/rsms/inter", status: "ok", note: "Подключён локально через next/font — без запросов к Google" },
  { name: "Montserrat", usage: "Шрифт заголовков", license: "SIL Open Font License 1.1", url: "https://github.com/JulietaUla/Montserrat", status: "ok", note: "Подключён локально через next/font" },
  { name: "Панорамы 360° Poly Haven", usage: "Демо 3D-туры (интерьеры квартиры и отеля)", license: "CC0 1.0 (общественное достояние)", url: "https://polyhaven.com/license", status: "ok", note: "Это примеры интерьеров, не снимки конкретных объектов" },
  { name: "Фото Unsplash", usage: "Демо-фото объектов и отелей", license: "Unsplash License", url: "https://unsplash.com/license", status: "check", note: "Коммерческое использование разрешено, но фото не являются снимками реальных объектов — заменить на фото партнёров до запуска" },
  { name: "Lucide", usage: "Иконки", license: "ISC", url: "https://lucide.dev/license", status: "ok" },
  { name: "Leaflet", usage: "Карта по умолчанию", license: "BSD 2-Clause", url: "https://leafletjs.com", status: "ok" },
  { name: "Данные OpenStreetMap", usage: "Карта и поиск адреса", license: "ODbL 1.0 (требуется указание авторства — выводится на карте)", url: "https://www.openstreetmap.org/copyright", status: "ok", note: "Поиск Nominatim: не более 1 запроса в секунду, без массовых запросов" },
  { name: "Картоподложка CARTO", usage: "Тайлы карты", license: "Условия CARTO Basemaps (указание авторства на карте)", url: "https://carto.com/basemaps", status: "check", note: "Проверить условия бесплатного использования для коммерческого сайта; альтернатива — Яндекс Карты по ключу" },
  { name: "Next.js, React", usage: "Фреймворк сайта", license: "MIT", url: "https://github.com/vercel/next.js/blob/canary/license.md", status: "ok" },
  { name: "Tailwind CSS", usage: "Стили", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE", status: "ok" },
  { name: "Sonner", usage: "Всплывающие уведомления", license: "MIT", url: "https://github.com/emilkowalski/sonner", status: "ok" },
  { name: "Anthropic SDK", usage: "Подключение AI-ассистента", license: "MIT", url: "https://github.com/anthropics/anthropic-sdk-typescript", status: "ok" },
  { name: "Логотип и фирменный стиль SILKX", usage: "Логотип, иконка сайта", license: "Собственность SILKX", url: "/requisites", status: "ok" },
];
