import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { fallbackReply } from "@/lib/assistant-fallback";
import { faqReply, normalizeQuestion } from "@/lib/assistant-faq";
import { HOTELS, getHotelById, hotelMinPrice } from "@/lib/hotels";
import { MOCK_PROPERTIES, getPropertyById } from "@/lib/mock-data";
import { ASSISTANT_LANGS, CREDIT_RULES, propertyToContext } from "@/lib/property-details";
import type { AssistantLang } from "@/lib/property-details";
import { getCachedAnswer, setCachedAnswer } from "@/lib/server/answer-cache";
import { redactPII } from "@/lib/server/redact";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { SITE } from "@/lib/site-config";
import { TASHKENT_DISTRICTS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
// Модель настраивается без правки кода: ASSISTANT_MODEL в .env.local
const MODEL = process.env.ASSISTANT_MODEL || "claude-haiku-5-5";
const MAX_MESSAGES = 16;
const MAX_CHARS = 1000;
const TIMEOUT_MS = 25_000;

const client = API_KEY ? new Anthropic({ apiKey: API_KEY, timeout: TIMEOUT_MS, maxRetries: 1 }) : null;

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

function hotelToContext(h: (typeof HOTELS)[number]): string {
  const rooms = h.rooms
    .map((r) => `${r.name} (rooms ${r.numbers.join("/")}, up to ${r.capacity} guests, ${r.areaM2} m², $${r.price}/night${r.breakfast ? ", breakfast" : ""})`)
    .join("; ");
  return `id=${h.id} | HOTEL ${h.name} ${h.stars}★${h.rating ? ` rating ${h.rating.score}/${h.rating.outOf} (${h.rating.count} reviews, source ${h.rating.source})` : " (no guest rating yet — never invent one)"} | ${TASHKENT_DISTRICTS[h.district]} district, ${h.address} | phone ${h.phone} | check-in ${h.checkIn}, check-out ${h.checkOut} | languages ${h.languages.join(", ")} | amenities ${h.amenities.join(", ")} | room types: ${rooms} | 3D tour of every room; online booking on the hotel page, no prepayment`;
}

/**
 * СТАБИЛЬНАЯ часть system prompt — одна и та же для всех запросов, поэтому кэшируется на стороне
 * Anthropic (prompt caching): повторные запросы платят ~10% за этот большой префикс.
 * Ничего изменчивого (язык, текущий объект, дата) сюда не добавлять — иначе кэш перестанет попадать.
 */
const STABLE_SYSTEM = (() => {
  const R = CREDIT_RULES;
  const catalog = MOCK_PROPERTIES.map((p) => `- ${propertyToContext(p)}`).join("\n");
  const hotels = HOTELS.map((h) => `- ${hotelToContext(h)}`).join("\n");
  return `You are SILKX AI, the voice-and-chat property assistant of SILKX — a digital real estate boutique in Tashkent, Uzbekistan
(new developments for sale, long-term rentals, student housing, short-term stays and hotels for visitors).

LANGUAGE: Reply in the language named in the "Session" note that follows, even if the catalog data is in Russian. Translate property facts naturally.

STYLE: Your reply may be read aloud by text-to-speech. Write 2–6 short sentences (max ~110 words), plain text,
no markdown, no tables, no URLs, no emoji. Prices: keep the original currency; for UZS say "million sum".
Be warm and precise, like a top real estate consultant.

FACTS — use ONLY the catalog and hotel list below. Never invent properties, hotels, prices, banks, documents or availability.
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
- Foreign renters must get temporary registration at their place of stay; mention if the owner helps (registrationHelp). Hotels register foreign guests themselves.
- For Chinese clients highlight when relevant: WeChat contact, UnionPay/Alipay/WeChat Pay, Chinese-speaking agent (languages contains zh),
  south-facing windows (windowsFacing S/SE/SW), nearby Chinese restaurants/shops, business district/embassy proximity, 3D tour to view remotely.

LONG-TERM RENT: explain minimum term, deposit, prepayment, utilities, kids/pets, contract type, registration help, nearby universities/metro.

HOTELS: compare room types by price, guests and breakfast; name room numbers if asked; give the reception phone; explain that booking is done on the hotel page without prepayment and the hotel confirms by phone.

RECOMMENDATIONS: When you recommend or discuss specific properties or hotels, end your reply with a final separate line exactly like:
IDS: id1, id2
(max 3 ids from the catalog or hotel list). Omit the line if nothing specific is relevant.

Telegram for viewings and requests: ${SITE.socials.telegram || "via the site form"}.

CATALOG:
${catalog}

HOTELS:
${hotels}`;
})();

/** Изменчивая часть — ПОСЛЕ точки кэширования, чтобы не ломать кэш стабильного префикса. */
function sessionNote(lang: AssistantLang, currentId: string | null): string {
  return `Session: reply in ${LANG_NAME[lang]}.${
    currentId ? ` The user is currently viewing id=${currentId}; "this apartment/hotel" refers to it.` : ""
  }`;
}

/** Если в вопросе есть название ЖК, отеля или район — это конкретный запрос, готовый FAQ-ответ не подходит. */
const firstWords = (s: string) => normalizeQuestion(s).split(" ").slice(0, 2).join(" ");
const SPECIFIC_RE = new RegExp(
  [
    // «Silk Garden», «Registan Garden»… — клиенты редко пишут название целиком
    ...MOCK_PROPERTIES.filter((p) => p.type === "sale").map((p) => firstWords(p.title.replace(/^ЖК\s+/i, ""))),
    ...HOTELS.map((h) => firstWords(h.name)),
    // Районы по-русски («юнусаб…») и латиницей («mirabad», «chilan…»)
    ...Object.values(TASHKENT_DISTRICTS).map((d) => normalizeQuestion(d).slice(0, 6)),
    ...Object.keys(TASHKENT_DISTRICTS).map((slug) => (slug.split("-")[0] ?? slug).slice(0, 6)),
  ]
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(Boolean)
    .join("|"),
  "i",
);

type Item = { id: string; title: string; href: string; price: number; currency: "USD" | "UZS"; type: "sale" | "rent" };

/** id → карточки-ссылки для чата (объекты каталога и отели). */
function toItems(ids: string[]): Item[] {
  return ids.flatMap((id): Item[] => {
    const p = getPropertyById(id);
    if (p) {
      return [{
        id: p.id,
        title: p.title,
        href: p.type === "sale" ? `/complex/${encodeURIComponent(p.id)}` : `/rent/${encodeURIComponent(p.id)}`,
        price: p.price,
        currency: p.currency,
        type: p.type,
      }];
    }
    const h = getHotelById(id);
    if (h) {
      const { price, currency } = hotelMinPrice(h);
      return [{ id: h.id, title: h.name, href: `/hotels/${encodeURIComponent(h.id)}`, price, currency, type: "rent" }];
    }
    return [];
  });
}

type Mode = "ai" | "cache" | "faq" | "offline";

function respond(reply: string, items: Item[], mode: Mode) {
  return NextResponse.json({ ok: true, reply, items, mode });
}

const KNOWN_IDS = new Set<string>([...MOCK_PROPERTIES.map((p) => p.id), ...HOTELS.map((h) => h.id)]);

function parseReply(raw: string): { reply: string; ids: string[] } {
  const m = /\n?\s*IDS:\s*([^\n]+)\s*$/i.exec(raw.trim());
  const ids = m?.[1]
    ? m[1]
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((id) => KNOWN_IDS.has(id))
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
  const currentId =
    typeof b.propertyId === "string" && (getPropertyById(b.propertyId) || getHotelById(b.propertyId)) ? b.propertyId : null;
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

  // 1) Готовые ответы на частые вопросы о сайте — мгновенно и бесплатно
  const normalized = normalizeQuestion(last.text);
  if (!SPECIFIC_RE.test(normalized)) {
    const faq = faqReply(last.text, lang);
    if (faq) {
      const links: Item[] = faq.links.map((l) => ({ id: `${faq.id}:${l.href}`, title: l.title, href: l.href, price: 0, currency: "USD", type: "rent" }));
      return respond(faq.reply, links, "faq");
    }
  }

  // Без ключа — работаем на встроенных правилах по тем же данным
  if (!client) {
    const r = fallbackReply(last.text, lang, currentId);
    return respond(r.reply, toItems(r.ids), "offline");
  }

  // 2) Кэш ответов ИИ: первый вопрос диалога с тем же смыслом → готовый ответ без запроса к API
  const isFirstQuestion = messages.length === 1;
  const cacheKey = `${lang}|${currentId ?? ""}|${normalized}`;
  if (isFirstQuestion) {
    const cached = getCachedAnswer(cacheKey);
    if (cached) return respond(cached.reply, toItems(cached.ids), "cache");
  }

  // 3) Claude API. Стабильный system prompt кэшируется Anthropic (prompt caching) — дешевле и быстрее
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000, // с запасом: размышления модели тоже входят в лимит
      output_config: { effort: "low" }, // чат: короткие ответы, низкая задержка
      system: [
        { type: "text", text: STABLE_SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: sessionNote(lang, currentId) },
      ],
      // Телефоны и e-mail ассистенту не нужны — не передаём их за рубеж
      messages: messages.map((m) => ({ role: m.role, content: redactPII(m.text) })),
    });

    if (response.stop_reason === "refusal") throw new Error("refusal");
    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    if (!text) throw new Error(`Empty reply (stop_reason=${response.stop_reason})`);

    const parsed = parseReply(text);
    if (isFirstQuestion) setCachedAnswer(cacheKey, parsed);
    return respond(parsed.reply, toItems(parsed.ids), "ai");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("[assistant] invalid ANTHROPIC_API_KEY");
    else if (err instanceof Anthropic.RateLimitError) console.error("[assistant] Claude API rate limited");
    else if (err instanceof Anthropic.APIError) console.error(`[assistant] Claude API ${err.status}:`, err.message);
    else console.error("[assistant]", err);
    // Сбой API — не оставляем человека без ответа
    const r = fallbackReply(last.text, lang, currentId);
    return respond(r.reply, toItems(r.ids), "offline");
  }
}
