/** Уведомление модератору в Telegram. Ошибки не роняют запрос — заявка важнее уведомления. */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyTelegram(lines: string[]): Promise<void> {
  if (!TOKEN || !CHAT_ID) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: lines.map(escapeHtml).join("\n"), parse_mode: "HTML", disable_web_page_preview: true }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    console.error("[telegram] notify failed", err);
  }
}
