import { formatUzPhone } from "@/lib/listing";
import { isLeadStatus, listLeads } from "@/lib/server/leads-admin";
import { isSupabaseConfigured } from "@/lib/server/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Защита от CSV-инъекций в Excel (=, +, -, @ в начале ячейки)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** GET /api/admin/leads?format=csv&status=new — выгрузка заявок (защищено proxy.ts). */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return Response.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const agency = url.searchParams.get("agency") ?? undefined;
  const rows = await listLeads({ status: isLeadStatus(status) ? status : undefined, agency, limit: 1000 });

  if (url.searchParams.get("format") !== "csv") return Response.json({ ok: true, items: rows });

  const header = ["Дата", "Статус", "Имя", "Телефон", "Связь", "Запрос", "Объект", "ID объекта", "Агентство", "Источник", "Комментарий", "Заметка"];
  const lines = rows.map((r) =>
    [r.created_at, r.status, r.name, formatUzPhone(r.phone), r.contact_via, r.intent, r.property_title, r.property_id, r.agency, r.source, r.comment, r.manager_note]
      .map(csvCell)
      .join(","),
  );
  const csv = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="silkx-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
