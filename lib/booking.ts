import { getHotelById } from "@/lib/hotels";
import type { Hotel, HotelRoom } from "@/lib/hotels";
import { normalizeUzPhone } from "@/lib/listing";

// Онлайн-бронирование номера. Одна валидация для формы (браузер) и /api/bookings (сервер).

export const BOOKING_LIMITS = { maxNights: 60, maxGuests: 10, nameMax: 80, commentMax: 500 } as const;

export interface BookingInput {
  hotelId: string;
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  name: string;
  phone: string;
  comment: string;
}

export type BookingField = keyof BookingInput | "agree";
export type BookingErrors = Partial<Record<BookingField, string>>;

export type BookingValidation =
  | { ok: true; data: BookingInput; hotel: Hotel; room: HotelRoom; nights: number; total: number }
  | { ok: false; errors: BookingErrors };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** "2026-11-05" → UTC-полночь; невалидная дата → NaN. */
function parseDate(s: string): number {
  if (!DATE_RE.test(s)) return NaN;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s ? t : NaN;
}

/** Сегодня (по Ташкенту, UTC+5) в формате YYYY-MM-DD. */
export function todayInTashkent(): string {
  return new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const t = parseDate(date);
  return Number.isFinite(t) ? new Date(t + days * DAY_MS).toISOString().slice(0, 10) : date;
}

export function countNights(checkIn: string, checkOut: string): number {
  const a = parseDate(checkIn);
  const b = parseDate(checkOut);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / DAY_MS) : 0;
}

/** Телефон: узбекский (+998…) или международный (7–15 цифр). */
export function normalizeAnyPhone(raw: string): string | null {
  const uz = normalizeUzPhone(raw);
  if (uz) return uz;
  const digits = raw.replace(/\D/g, "");
  return raw.trim().startsWith("+") && digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

export function validateBooking(raw: Record<string, unknown>): BookingValidation {
  const errors: BookingErrors = {};
  const hotel = getHotelById(str(raw.hotelId));
  const room = hotel?.rooms.find((r) => r.id === str(raw.roomId));
  if (!hotel) errors.hotelId = "Отель не найден";
  if (!room) errors.roomId = "Выберите номер";

  const checkIn = str(raw.checkIn);
  const checkOut = str(raw.checkOut);
  const today = todayInTashkent();
  if (!Number.isFinite(parseDate(checkIn))) errors.checkIn = "Укажите дату заезда";
  else if (checkIn < today) errors.checkIn = "Дата заезда уже прошла";
  const nights = countNights(checkIn, checkOut);
  if (!Number.isFinite(parseDate(checkOut))) errors.checkOut = "Укажите дату выезда";
  else if (nights < 1) errors.checkOut = "Выезд должен быть позже заезда";
  else if (nights > BOOKING_LIMITS.maxNights) errors.checkOut = `Не больше ${BOOKING_LIMITS.maxNights} ночей — для долгого проживания напишите отелю`;

  const guests = Number(str(raw.guests));
  if (!Number.isInteger(guests) || guests < 1 || guests > BOOKING_LIMITS.maxGuests) errors.guests = "Укажите число гостей";
  else if (room && guests > room.capacity) errors.guests = `В номере «${room.name}» — до ${room.capacity} гостей`;

  const name = str(raw.name).replace(/\s+/g, " ");
  if (name.length < 2) errors.name = "Как к вам обращаться?";
  else if (name.length > BOOKING_LIMITS.nameMax) errors.name = "Слишком длинное имя";

  const phone = normalizeAnyPhone(str(raw.phone));
  if (!phone) errors.phone = "Телефон в формате +998 90 123-45-67 или международный с «+»";

  const comment = str(raw.comment).slice(0, BOOKING_LIMITS.commentMax);

  // Согласие на обработку данных — обязательно и только явной отметкой (не заранее)
  if (raw.agree !== true) errors.agree = "Подтвердите согласие на обработку данных";

  if (Object.keys(errors).length > 0 || !hotel || !room || !phone) return { ok: false, errors };
  return {
    ok: true,
    data: { hotelId: hotel.id, roomId: room.id, checkIn, checkOut, guests, name, phone, comment },
    hotel,
    room,
    nights,
    total: nights * room.price,
  };
}
