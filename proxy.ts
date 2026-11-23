import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Защита админки (/admin, /api/admin) паролем — HTTP Basic Auth.
 * ADMIN_PASSWORD не задан → админка выключена (404), чтобы случайно не открыть её без пароля.
 * Следующий шаг — полноценные аккаунты агентов (Supabase Auth) вместо общего пароля.
 */
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? "admin";
  const pass = process.env.ADMIN_PASSWORD ?? "";
  if (pass.length < 12) return new NextResponse("Not found", { status: 404 });

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (safeEqual(u ?? "", user) && safeEqual(rest.join(":"), pass)) {
        const res = NextResponse.next();
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    } catch {
      /* битый заголовок — просим пароль заново */
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SILKX admin", charset="UTF-8"' },
  });
}
