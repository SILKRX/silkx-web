import { NextResponse } from "next/server";

import { fallbackReply } from "@/lib/assistant-fallback";
import { MOCK_PROPERTIES, getPropertyById } from "@/lib/mock-data";
import { ASSISTANT_LANGS, CREDIT_RULES, propertyToContext } from "@/lib/property-details";
import type { AssistantLang } from "@/lib/property-details";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { SITE } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
// Модель настраивается без правки кода: ASSISTANT_MODEL в .env.local
const MODEL = process.env.ASSISTANT_MODEL || "claude-haiku-5-5";
const MAX_MESSAGES = 16;
const MAX_CHARS = 1000;
const TIMEOUT_MS = 25_000;

const LANG_NAME: Record<AssistantLang, string> = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  en: "English",
  zh: "Simplified Chinese",
  ko: "Korean",
  tr: "Turkish",
};

interface InMessage {
  role: "user" | "assistant";
  text: string;
}

function systemPrompt(lang: AssistantLang, currentId: string | null): string {
  const R = CREDIT_RULES;
  const catalog = MOCK_PROPERTIES.map((p) => `- ${propertyToContext(p)}`).join("\n");
  return `You are SILKX AI, the voice-and-chat property assistant of SILKX — a digital real estate boutique in Tashkent, Uzbekistan
(new developments for sale, long-term rentals, student housing, short-term stays for visitors).

LANGUAGE: Always reply in ${LANG_NAME[lang]}, even if the catalog data is in Russian. Translate property facts naturally.

STYLE: Your reply may be read aloud by text-to-speech. Write 2–6 short sentences (max ~110 words), plain text,
no markdown, no tables, no URLs, no emoji. Prices: keep the original currency; for UZS say "million sum".
Be warm and precise, like a top real estate consultant.

FACTS — use ONLY the catalog below. Never invent properties, prices, banks, documents or availability.
If something isn't in the data, say you'll check with the owner/manager and suggest leaving a request on Telegram.

CREDIT / MORTGAGE RULES (Uzbekistan, state mortgage program for the primary market):
- down payment from ${R.minDownPct}%, term up to ${R.maxTermYears} years, loan up to ${R.maxLoanUzsTashkent / 1_000_000} million sum in Tashkent,
  rate about ${R.approxRatePct}%, monthly payments ≤ ${R.maxDtiPct}% of confirmed income, borrower: citizen of Uzbekistan aged ${R.borrowerAge[0]}–${R.borrowerAge[1]}.
- The property must be on the primary market, have valid documents and no encumbrance (pledge/arrest); the developer should work with partner banks.
- Each sale item in the catalog already has a "credit=" verdict and failing criteria — explain them simply.
- Foreigners usually can't get these bank mortgages: suggest the developer's installment plan or cash.
- Always add that the final decision is made by the bank.

FOREIGN BUYERS & RENTERS:
- Citizens of the approved list of countries may buy NEW housing (under construction or commissioned ≤ ${R.foreignerNewBuildYears} years ago) without a residence permit; land plots are not allowed. Advise confirming country eligibility with a lawyer.
- Foreign renters must get temporary registration at their place of stay; mention if the owner helps (registrationHelp).
- For Chinese clients highlight when relevant: WeChat contact, UnionPay/Alipay/WeChat Pay, Chinese-speaking agent (languages contains zh),
  south-facing windows (windowsFacing S/SE/SW), nearby Chinese restaurants/shops, business district/embassy proximity, 3D tour to view remotely.

LONG-TERM RENT: explain minimum term, deposit, prepayment, utilities, kids/pets, contract type, registration help, nearby universities/metro.

RECOMMENDATIONS: When you recommend or discuss specific properties, end your reply with a final separate line exactly like:
IDS: id1, id2
(max 3 ids from the catalog). Omit the line if no specific property is relevant.

${currentId ? `The user is currently viewing property id=${currentId}. Questions like "this apartment" refer to it.\n` : ""}
Telegram for viewings and requests: ${SITE.socials.telegram || "via the site form"}.

CATALOG:
${catalog}`;
}

/** id → карточка-ссылка для чата. */
function toItems(ids: string[]) {
  return ids
    .map((id) => getPropertyById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      title: p.title,
      href: p.type === "sale" ? `/complex/${encodeURIComponent(p.id)}` : `/rent/${encodeURIComponent(p.id)}`,
      price: p.price,
      currency: p.currency,
      type: p.type,
    }));
}

function respond(r: { reply: string; ids: string[] }, mode: "ai" | "offline") {
  return NextResponse.json({ ok: true, reply: r.reply, items: toItems(r.ids), mode });
}

function parseReply(raw: string): { reply: string; ids: string[] } {
  const m = /\n?\s*IDS:\s*([^\n]+)\s*$/i.exec(raw.trim());
  const ids = m?.[1]
    ? m[1]
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((id) => MOCK_PROPERTIES.some((p) => p.id === id))
        .slice(0, 3)
    : [];
  const reply = (m ? raw.trim().slice(0, m.index) : raw).trim();
  return { reply, ids };
}

export async function POST(req: Request) {
  const limit = rateLimit(`assistant:${clientIp(req)}`, 30, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  const lang: AssistantLang = (ASSISTANT_LANGS as readonly string[]).includes(String(b.lang)) ? (b.lang as AssistantLang) : "ru";
  const currentId = typeof b.propertyId === "string" && getPropertyById(b.propertyId) ? b.propertyId : null;
  const messages: InMessage[] = (Array.isArray(b.messages) ? b.messages : [])
    .filter(
      (m): m is InMessage =>
        typeof m === "object" && m !== null && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim() !== "",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_CHARS) }));

  // API требует, чтобы диалог начинался с user
  while (messages.length && messages[0]?.role !== "user") messages.shift();
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  // Без ключа — работаем на встроенных правилах по тем же данным
  if (!API_KEY) {
    return respond(fallbackReply(last.text, lang, currentId), "offline");
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt(lang, currentId),
        messages: messages.map((m) => ({ role: m.role, content: m.text })),
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("\n");
    if (!text) throw new Error("Empty reply");
    return respond(parseReply(text), "ai");
  } catch (err) {
    console.error("[assistant]", err);
    // Сбой API — не оставляем человека без ответа
    return respond(fallbackReply(last.text, lang, currentId), "offline");
  }
}
