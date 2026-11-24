import { NextResponse } from "next/server";

import { formatPrice } from "@/lib/format";
import { getProperty } from "@/lib/data/properties";
import { LEAD_CONTACT_VIA, LEAD_INTENTS, validateLead } from "@/lib/lead";
import { formatUzPhone } from "@/lib/listing";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { phoneForNotification } from "@/lib/server/redact";
import { insertRow, isSupabaseConfigured } from "@/lib/server/supabase-rest";
import { notifyTelegram } from "@/lib/server/telegram";
import { catalogKindOf, propertyPath } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://silkx.app";

/**
 * POST /api/leads — заявка по объекту (просмотр, консультация, ипотека, проверка документов).
 * Сохраняется в Supabase (property_leads) и сразу уходит менеджеру в Telegram.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`lead:${ip}`, 8, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Слишком много заявок с вашего устройства. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;

  // Honeypot: боты заполняют скрытое поле — делаем вид, что всё хорошо
  if (typeof raw.website === "string" && raw.website.trim() !== "") return NextResponse.json({ ok: true, id: "ok" });

  const result = validateLead(raw);
  if (result.ok === false) {
    return NextResponse.json({ ok: false, error: "Проверьте поля формы", fieldErrors: result.errors }, { status: 422 });
  }
  const d = result.data;

  const property = await getProperty(d.propertyId);
  if (!property) {
    return NextResponse.json({ ok: false, error: "Объект не найден", fieldErrors: { propertyId: "Объект не найден" } }, { status: 422 });
  }
  const kind = catalogKindOf(property);
  const agency = property.seller?.type === "agent" ? (property.seller.company ?? null) : null;

  let id = `L-${Date.now().toString(36).toUpperCase()}`;
  if (isSupabaseConfigured()) {
    try {
      const row = await insertRow("property_leads", {
        property_id: property.id,
        property_title: property.title.slice(0, 200),
        property_kind: kind,
        agency,
        name: d.name,
        phone: d.phone,
        contact_via: d.contactVia,
        intent: d.intent,
        comment: d.comment || null,
        source: d.source,
        utm: d.utm,
        locale: (req.headers.get("accept-language") ?? "").slice(0, 2) || null,
        status: "new",
        submitter_ip: ip,
      });
      id = row.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("DUPLICATE_LEAD")) {
        // Повтор той же заявки за 10 минут — не дублируем, но и не пугаем пользователя
        return NextResponse.json({ ok: true, id: "duplicate" });
      }
      if (msg.includes("TOO_MANY_LEADS")) {
        return NextResponse.json({ ok: false, error: "Слишком много заявок с этого номера. Попробуйте позже." }, { status: 429 });
      }
      // Таблицы нет или БД недоступна — заявка всё равно уходит менеджеру в Telegram
      console.error("[leads] insert failed", err);
    }
  }

  await notifyTelegram([
    "🏠 Новая заявка по объекту",
    `${LEAD_INTENTS[d.intent]}`,
    `${property.title} — ${formatPrice(property.price, property.currency, property.type, { from: kind === "new" })}`,
    agency ? `🏢 Агентство: ${agency}` : "",
    `👤 ${d.name} · ${phoneForNotification(formatUzPhone(d.phone))} (${LEAD_CONTACT_VIA[d.contactVia]})`,
    d.comment ? `💬 ${d.comment}` : "",
    `🔗 ${SITE_URL}${propertyPath(property)}`,
    `Источник: ${d.source} · ID: ${id}`,
  ].filter(Boolean));

  return NextResponse.json({ ok: true, id });
}
