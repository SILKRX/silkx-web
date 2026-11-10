/**
 * Минимизация персональных данных перед передачей за рубеж.
 * Чат SILKX AI уходит в Claude API (США): телефоны и e-mail для ответа ассистенту не нужны — скрываем их.
 */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 7+ цифр с пробелами/скобками/дефисами: +998 90 123-45-67, 901234567, (71) 200 00 01
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;

export function redactPII(text: string): string {
  return text
    .replace(EMAIL_RE, "[e-mail скрыт]")
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[телефон скрыт]" : m));
}

/**
 * Телефон в уведомлении Telegram. TELEGRAM_PII=masked → «+998 90 ***-**-67» (полный номер — только в БД в Узбекистане).
 * По умолчанию full — пока БД в Узбекистане не подключена, менеджеру нужен номер, чтобы перезвонить.
 */
export function phoneForNotification(formatted: string): string {
  if ((process.env.TELEGRAM_PII ?? "full") !== "masked") return formatted;
  const digits = formatted.replace(/\D/g, "");
  const tail = digits.slice(-2);
  return `${formatted.slice(0, 7)}***-**-${tail}`;
}
