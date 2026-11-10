import { NextResponse } from "next/server";

import { validateBooking } from "@/lib/booking";
import { formatNumber } from "@/lib/format";
import { formatUzPhone } from "@/lib/listing";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { insertRow, isSupabaseConfigured } from "@/lib/server/supabase-rest";
import { phoneForNotification } from "@/lib/server/redact";
import { notifyTelegram } from "@/lib/server/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;

/**
 * POST /api/bookings — заявка на бронирование номера в отеле.
 * Статус «new»: менеджер подтверждает наличие и перезванивает гостю (уведомление в Telegram).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`booking:${ip}`, 10, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Слишком много заявок с вашего устройства. Попробуйте позже или позвоните в отель." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "Слишком большой запрос" }, { status: 413 });

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

  // Honeypot для ботов
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json({ ok: true, id: "ok" });
  }

  const result = validateBooking(raw);
  if (result.ok === false) {
    return NextResponse.json({ ok: false, error: "Проверьте поля формы", fieldErrors: result.errors }, { status: 422 });
  }
  const { data: d, hotel, room, nights, total } = result;

  let id = `B-${Date.now().toString(36).toUpperCase()}`;
  if (isSupabaseConfigured()) {
    try {
      const row = await insertRow("bookings", {
        hotel_id: d.hotelId,
        room_id: d.roomId,
        check_in: d.checkIn,
        check_out: d.checkOut,
        guests: d.guests,
        guest_name: d.name,
        phone: d.phone,
        comment: d.comment || null,
        nights,
        total_price: total,
        currency: room.currency,
        status: "new",
        submitter_ip: ip,
      });
      id = row.id;
    } catch (err) {
      // Таблицы ещё нет или БД недоступна — заявка всё равно уходит менеджеру в Telegram
      console.error("[bookings] insert failed", err);
    }
  }

  await notifyTelegram([
    "🛎 Новая бронь отеля",
    `${hotel.name} — «${room.name}»`,
    `📅 ${d.checkIn} → ${d.checkOut} (${nights} ноч.)`,
    `👥 Гостей: ${d.guests}`,
    `💵 ≈ $${formatNumber(total)}`,
    `👤 ${d.name} · ${phoneForNotification(formatUzPhone(d.phone))}`,
    d.comment ? `💬 ${d.comment}` : "",
    `ID: ${id}`,
  ].filter(Boolean));

  return NextResponse.json({ ok: true, id, nights, total });
}
