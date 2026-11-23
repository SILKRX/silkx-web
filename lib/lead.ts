/**
 * Заявка по объекту: общая валидация для формы (браузер) и API (сервер).
 */
import { normalizeUzPhone } from "@/lib/listing";

export const LEAD_INTENTS = {
  viewing: "Записаться на просмотр",
  consult: "Консультация",
  mortgage: "Ипотека / рассрочка",
  documents: "Проверка документов",
} as const;
export type LeadIntent = keyof typeof LEAD_INTENTS;

export const LEAD_CONTACT_VIA = { call: "Звонок", telegram: "Telegram", whatsapp: "WhatsApp" } as const;
export type LeadContactVia = keyof typeof LEAD_CONTACT_VIA;

export const LEAD_STATUSES = {
  new: "Новая",
  in_progress: "В работе",
  sent_to_developer: "Передана застройщику",
  won: "Сделка",
  lost: "Отказ",
  spam: "Спам",
} as const;
export type LeadStatus = keyof typeof LEAD_STATUSES;

export interface LeadInput {
  propertyId: string;
  name: string;
  phone: string; // E.164
  contactVia: LeadContactVia;
  intent: LeadIntent;
  comment: string;
  source: string;
  utm: Record<string, string> | null;
}

export type LeadField = "name" | "phone" | "comment" | "agree" | "propertyId";
export type LeadErrors = Partial<Record<LeadField, string>>;

const str = (v: unknown, max = 2000): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isKey = <T extends object>(obj: T, k: string): k is Extract<keyof T, string> => Object.prototype.hasOwnProperty.call(obj, k);

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function validateLead(raw: Record<string, unknown>): { ok: true; data: LeadInput } | { ok: false; errors: LeadErrors } {
  const errors: LeadErrors = {};

  const propertyId = str(raw.propertyId, 120);
  if (!propertyId || !/^[\w.-]+$/.test(propertyId)) errors.propertyId = "Объект не найден";

  const name = str(raw.name, 60).replace(/\s+/g, " ");
  if (name.length < 2) errors.name = "Укажите имя";

  const phone = normalizeUzPhone(str(raw.phone, 30));
  if (!phone) errors.phone = "Номер в формате +998 90 123-45-67";

  const comment = str(raw.comment, 1000);
  if (raw.agree !== true) errors.agree = "Нужно согласие на обработку данных";

  const intentRaw = str(raw.intent, 20);
  const viaRaw = str(raw.contactVia, 20);

  let utm: Record<string, string> | null = null;
  if (raw.utm && typeof raw.utm === "object" && !Array.isArray(raw.utm)) {
    const u = raw.utm as Record<string, unknown>;
    const picked = Object.fromEntries(UTM_KEYS.map((k) => [k, str(u[k], 100)]).filter(([, v]) => v));
    if (Object.keys(picked).length) utm = picked;
  }

  if (Object.keys(errors).length || !phone) return { ok: false, errors };
  return {
    ok: true,
    data: {
      propertyId,
      name,
      phone,
      comment,
      intent: isKey(LEAD_INTENTS, intentRaw) ? intentRaw : "viewing",
      contactVia: isKey(LEAD_CONTACT_VIA, viaRaw) ? viaRaw : "call",
      source: str(raw.source, 100) || utm?.utm_source || "form",
      utm,
    },
  };
}
