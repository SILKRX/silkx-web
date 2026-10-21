import type { Currency, DealType } from "@/lib/types";

// Форматтеры создаются один раз на модуль: Intl.NumberFormat дорогой в конструировании,
// а карточек в каталоге десятки.
const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

const CURRENCY_LABEL: Record<Currency, { prefix: string; suffix: string }> = {
  USD: { prefix: "$", suffix: "" },
  UZS: { prefix: "", suffix: " сум" },
};

/** 85000 → "85 000". Некорректные значения не роняют рендер. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return numberFormatter.format(Math.round(value));
}

/**
 * Цена для карточки:
 *  sale → "от $85 000"
 *  rent → "$600 / мес"
 * Невалидная цена (0, NaN, отрицательная) → "Цена по запросу" — это ещё и повод оставить заявку.
 */
export function formatPrice(price: number, currency: Currency, type: DealType): string {
  if (!Number.isFinite(price) || price <= 0) return "Цена по запросу";
  const { prefix, suffix } = CURRENCY_LABEL[currency];
  const amount = `${prefix}${formatNumber(price)}${suffix}`;
  return type === "sale" ? `от ${amount}` : `${amount} / мес`;
}

const pluralRules = new Intl.PluralRules("ru-RU");

/** pluralize(5, { one: "объект", few: "объекта", many: "объектов" }) → "объектов" */
export function pluralize(count: number, forms: { one: string; few: string; many: string }): string {
  const rule = pluralRules.select(count);
  if (rule === "one") return forms.one;
  if (rule === "few") return forms.few;
  return forms.many;
}

/** 0 → "Студия", 2 → "2-комн." */
export function formatRooms(rooms: number): string {
  if (!Number.isFinite(rooms) || rooms < 0) return "—";
  return rooms === 0 ? "Студия" : `${Math.floor(rooms)}-комн.`;
}
