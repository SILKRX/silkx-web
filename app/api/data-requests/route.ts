import { NextResponse } from "next/server";

import { DATA_REQUEST_TYPES, validateDataRequest } from "@/lib/data-request";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { phoneForNotification } from "@/lib/server/redact";
import { insertRow, isSupabaseConfigured } from "@/lib/server/supabase-rest";
import { notifyTelegram } from "@/lib/server/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/data-requests — запрос на удаление / доступ / исправление / отзыв согласия / отписку. */
export async function POST(req: Request) {
  const limit = rateLimit(`data-request:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > 8 * 1024) {
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
  if (typeof raw.website === "string" && raw.website.trim() !== "") return NextResponse.json({ ok: true, id: "ok" });

  const result = validateDataRequest(raw);
  if (result.ok === false) {
    return NextResponse.json({ ok: false, error: "Проверьте поля формы", fieldErrors: result.errors }, { status: 422 });
  }
  const d = result.data;

  let id = `R-${Date.now().toString(36).toUpperCase()}`;
  if (isSupabaseConfigured()) {
    try {
      const row = await insertRow("data_requests", { type: d.type, name: d.name, contact: d.contact, details: d.details || null, status: "new" });
      id = row.id;
    } catch (err) {
      console.error("[data-requests] insert failed", err);
    }
  }

  const contact = d.contact.startsWith("+") ? phoneForNotification(d.contact) : d.contact;
  await notifyTelegram([
    "🔐 Запрос по персональным данным",
    `Тип: ${DATA_REQUEST_TYPES[d.type]}`,
    `👤 ${d.name} · ${contact}`,
    d.details ? `💬 ${d.details}` : "",
    `ID: ${id}`,
    "Ответить и исполнить в установленный срок; результат зафиксировать.",
  ].filter(Boolean));

  return NextResponse.json({ ok: true, id });
}
