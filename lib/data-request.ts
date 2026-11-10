import { normalizeAnyPhone } from "@/lib/booking";

// Запросы субъекта персональных данных: удаление, доступ, исправление, отзыв согласия, отписка.

export const DATA_REQUEST_TYPES = {
  delete: "Удалить мои данные",
  access: "Узнать, какие данные обо мне хранятся",
  correct: "Исправить мои данные",
  withdraw: "Отозвать согласие на обработку",
  unsubscribe: "Отписаться от сообщений и рассылок",
} as const;

export type DataRequestType = keyof typeof DATA_REQUEST_TYPES;

export interface DataRequestInput {
  type: DataRequestType;
  name: string;
  /** Телефон (E.164) или e-mail — по нему мы найдём данные и ответим */
  contact: string;
  details: string;
}

export type DataRequestField = keyof DataRequestInput | "agree";
export type DataRequestErrors = Partial<Record<DataRequestField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function validateDataRequest(
  raw: Record<string, unknown>,
): { ok: true; data: DataRequestInput } | { ok: false; errors: DataRequestErrors } {
  const errors: DataRequestErrors = {};
  const type = str(raw.type);
  if (!Object.prototype.hasOwnProperty.call(DATA_REQUEST_TYPES, type)) errors.type = "Выберите тип запроса";
  const name = str(raw.name).replace(/\s+/g, " ").slice(0, 80);
  if (name.length < 2) errors.name = "Укажите имя, которое вы указывали на сайте";
  const contactRaw = str(raw.contact);
  const contact = EMAIL_RE.test(contactRaw) ? contactRaw.toLowerCase() : normalizeAnyPhone(contactRaw);
  if (!contact) errors.contact = "Телефон, указанный в заявке, или e-mail";
  const details = str(raw.details).slice(0, 1000);
  if (raw.agree !== true) errors.agree = "Нужно подтверждение";
  if (Object.keys(errors).length > 0 || !contact) return { ok: false, errors };
  return { ok: true, data: { type: type as DataRequestType, name, contact, details } };
}

/** Срок ответа на запрос субъекта данных (уточнить у юриста по действующей редакции закона). */
export const DATA_REQUEST_RESPONSE_DAYS = 10;
