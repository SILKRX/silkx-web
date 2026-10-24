import { NextResponse } from "next/server";

import { getProperty, toPublicJson } from "@/lib/data/properties";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** GET /api/properties/:id — полная карточка: подробности, 3D-тур, проверка ипотеки. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const limit = rateLimit(`property:${clientIp(req)}`, 120, 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const p = await getProperty(decodeURIComponent(params.id));
  if (!p) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, item: toPublicJson(p, SITE_URL, true) }, { headers: { "Cache-Control": "public, s-maxage=60" } });
}
