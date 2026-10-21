import { NextResponse } from "next/server";

import { formatNumber } from "@/lib/format";
import { formatUzPhone, validateListing } from "@/lib/listing";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { insertRow, isSupabaseConfigured } from "@/lib/server/supabase-rest";
import { notifyTelegram } from "@/lib/server/telegram";
import { PROPERTY_CATEGORIES, TASHKENT_DISTRICTS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024; // JSON без файлов — файлы уже загружены отдельно

/**
 * POST /api/listings — создать объявление собственника. Статус всегда «moderation»:
 * на сайте оно появится только после проверки модератором (защита от мошенников и дублей).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`listing:${ip}`, 5, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Слишком много объявлений с вашего устройства. Попробуйте позже." },
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

  // Honeypot: невидимое поле, которое заполняют только боты. Отвечаем «успехом», чтобы бот не подбирал обход.
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json({ ok: true, id: "ok", status: "moderation" });
  }

  const result = validateListing(raw);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Проверьте поля формы", fieldErrors: result.errors }, { status: 422 });
  }
  const d = result.data;

  let id = `demo-${Date.now().toString(36)}`;
  if (isSupabaseConfigured()) {
    try {
      const row = await insertRow("listings", {
        category: d.category,
        deal_type: d.dealType,
        rent_term: d.rentTerm,
        title: d.title,
        description: d.description,
        price: d.price,
        currency: d.currency,
        rooms: d.rooms,
        area_m2: d.areaM2,
        floor: d.floor,
        floors_total: d.floorsTotal,
        district: d.district,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        contact_name: d.contactName,
        phone: d.phone,
        telegram: d.telegram,
        photos: d.photos,
        panoramas: d.panoramas,
        details: d.details,
        status: "moderation",
        submitter_ip: ip,
      });
      id = row.id;
    } catch (err) {
      console.error("[listings] insert error", err);
      return NextResponse.json({ ok: false, error: "Не удалось сохранить объявление. Попробуйте ещё раз." }, { status: 502 });
    }
  }

  await notifyTelegram([
    "🏠 Новое объявление на модерацию",
    `${PROPERTY_CATEGORIES[d.category]} · ${d.dealType === "sale" ? "Продажа" : d.rentTerm === "day" ? "Посуточно" : "Аренда"}`,
    d.title,
    `${formatNumber(d.price)} ${d.currency}${d.rentTerm === "day" ? " / сутки" : d.rentTerm === "month" ? " / мес" : ""}`,
    `${TASHKENT_DISTRICTS[d.district]}, ${d.address}`,
    `Фото: ${d.photos.length} · 3D-панорам: ${d.panoramas.length}`,
    `${d.contactName}: ${formatUzPhone(d.phone)}${d.telegram ? ` · ${d.telegram}` : ""}`,
    `ID: ${id}`,
  ]);

  return NextResponse.json({ ok: true, id, status: "moderation", demo: !isSupabaseConfigured() }, { status: 201 });
}
