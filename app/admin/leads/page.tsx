import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { LEAD_CONTACT_VIA, LEAD_INTENTS, LEAD_STATUSES } from "@/lib/lead";
import type { LeadStatus } from "@/lib/lead";
import { formatUzPhone } from "@/lib/listing";
import { isLeadStatus, listLeads } from "@/lib/server/leads-admin";
import type { PropertyLeadRow } from "@/lib/server/leads-admin";
import { isSupabaseConfigured, updateRow } from "@/lib/server/supabase-rest";
import { propertyPath } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Заявки — админка SILKX", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** Смена статуса / заметки менеджера. Доступ к странице (и к этому POST) закрыт паролем в proxy.ts. */
async function updateLead(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!UUID_RE.test(id) || !isLeadStatus(status)) return;
  await updateRow("property_leads", id, { status, manager_note: note || null });
  revalidatePath("/admin/leads");
}

const kindPath = (r: PropertyLeadRow) =>
  propertyPath({ id: r.property_id, type: r.property_kind === "rent" ? "rent" : "sale", market: r.property_kind === "secondary" ? "secondary" : "new_build" });

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status: LeadStatus | undefined = isLeadStatus(sp.status) ? sp.status : undefined;

  if (!isSupabaseConfigured()) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl">Заявки</h1>
        <p className="mt-4 text-body">Supabase не подключён: задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY и примените миграцию 0006.</p>
      </main>
    );
  }

  let rows: PropertyLeadRow[] = [];
  let loadError = "";
  try {
    rows = await listLeads({ status });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Ошибка загрузки";
  }

  const tabs: Array<{ key?: LeadStatus; label: string }> = [{ label: "Все" }, ...Object.entries(LEAD_STATUSES).map(([k, v]) => ({ key: k as LeadStatus, label: v }))];

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Админка SILKX</p>
          <h1 className="mt-1 text-2xl">Заявки по объектам</h1>
        </div>
        <a
          href={`/api/admin/leads?format=csv${status ? `&status=${status}` : ""}`}
          className="rounded-lg border border-gold/40 bg-gold-muted px-4 py-2 text-sm font-semibold text-gold hover:border-gold"
        >
          Скачать CSV (Excel)
        </a>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Фильтр по статусу">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/admin/leads?status=${t.key}` : "/admin/leads"}
            className={
              t.key === status
                ? "rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-graphite"
                : "rounded-full border border-line/10 px-3 py-1.5 text-sm text-body hover:border-gold/40"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {loadError && <p className="mt-6 text-destructive">Не удалось загрузить заявки: {loadError}</p>}
      {!loadError && rows.length === 0 && <p className="mt-6 text-body">Заявок пока нет.</p>}

      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="terminal-panel grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-1 text-sm">
              <p className="text-xs text-body">
                {fmtDate(r.created_at)} · {LEAD_INTENTS[r.intent as keyof typeof LEAD_INTENTS] ?? r.intent} · источник: {r.source ?? "—"}
              </p>
              <p className="font-heading text-base font-semibold text-heading">
                {r.name} ·{" "}
                <a href={`tel:${r.phone}`} className="text-gold hover:underline">
                  {formatUzPhone(r.phone)}
                </a>{" "}
                <span className="text-xs font-normal text-body">({LEAD_CONTACT_VIA[r.contact_via as keyof typeof LEAD_CONTACT_VIA] ?? r.contact_via})</span>
              </p>
              <p className="truncate">
                <Link href={kindPath(r)} target="_blank" className="hover:text-gold hover:underline">
                  {r.property_title ?? r.property_id}
                </Link>
                {r.agency && <span className="text-body"> · {r.agency}</span>}
              </p>
              {r.comment && <p className="whitespace-pre-line text-body">«{r.comment}»</p>}
            </div>
            <form action={updateLead} className="space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm text-heading">
                {Object.entries(LEAD_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <textarea
                name="note"
                rows={2}
                defaultValue={r.manager_note ?? ""}
                placeholder="Заметка менеджера"
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-heading"
              />
              <button type="submit" className="h-9 w-full rounded-lg bg-gold text-sm font-semibold text-graphite hover:bg-gold-hover">
                Сохранить
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
