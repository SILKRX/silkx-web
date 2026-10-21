import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { LISTING_LIMITS } from "@/lib/listing";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { isSupabaseConfigured, publicStorageUrl, uploadToStorage } from "@/lib/server/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRAFT_ID_RE = /^[a-z0-9-]{8,64}$/;

/** Определяем тип по «магическим байтам», а не по присланному Content-Type (его легко подделать). */
function sniffImage(buf: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return { ext: "webp", mime: "image/webp" };
  return null;
}

const fail = (status: number, error: string, headers?: Record<string, string>) =>
  NextResponse.json({ ok: false, error }, { status, headers });

/**
 * POST /api/listings/upload — загрузка ОДНОГО файла (фото или 360°-панорамы).
 * Файлы грузятся по одному: так каждый запрос < 4,5 МБ (лимит Vercel) и есть прогресс по файлам.
 * Файлы кладутся в pending/<draftId>/… и становятся публичными только после модерации объявления.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`upload:${clientIp(req)}`, 40, 10 * 60_000);
  if (!limit.ok) return fail(429, "Слишком много загрузок. Попробуйте через несколько минут.", { "Retry-After": String(limit.retryAfterSec) });

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > LISTING_LIMITS.uploadMaxBytes + 64 * 1024) return fail(413, "Файл слишком большой");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Некорректный запрос");
  }

  const draftId = form.get("draftId");
  const file = form.get("file");
  if (typeof draftId !== "string" || !DRAFT_ID_RE.test(draftId)) return fail(400, "Некорректный черновик");
  if (!(file instanceof File)) return fail(400, "Файл не передан");
  if (file.size === 0) return fail(400, "Пустой файл");
  if (file.size > LISTING_LIMITS.uploadMaxBytes) return fail(413, "Файл слишком большой");

  const buffer = await file.arrayBuffer();
  const type = sniffImage(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
  if (!type) return fail(415, "Поддерживаются только JPG, PNG и WebP");

  const path = `pending/${draftId}/${randomUUID()}.${type.ext}`;

  if (!isSupabaseConfigured()) {
    // Демо-режим (нет ключей Supabase): файл не сохраняем, но форма проходит весь путь.
    return NextResponse.json({ ok: true, path, url: null, demo: true });
  }

  try {
    await uploadToStorage(path, buffer, type.mime);
  } catch (err) {
    console.error("[upload] storage error", err);
    return fail(502, "Хранилище временно недоступно. Попробуйте ещё раз.");
  }
  return NextResponse.json({ ok: true, path, url: publicStorageUrl(path) });
}
