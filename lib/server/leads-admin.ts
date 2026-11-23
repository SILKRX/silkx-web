import type { LeadStatus } from "@/lib/lead";
import { LEAD_STATUSES } from "@/lib/lead";
import { selectRowsFresh } from "@/lib/server/supabase-rest";

export interface PropertyLeadRow {
  id: string;
  property_id: string;
  property_title: string | null;
  property_kind: "new" | "secondary" | "rent" | null;
  agency: string | null;
  name: string;
  phone: string;
  contact_via: string;
  intent: string;
  comment: string | null;
  source: string | null;
  status: LeadStatus;
  manager_note: string | null;
  created_at: string;
}

const COLUMNS =
  "id,property_id,property_title,property_kind,agency,name,phone,contact_via,intent,comment,source,status,manager_note,created_at";

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(LEAD_STATUSES, v);
}

export async function listLeads(opts: { status?: LeadStatus; agency?: string; limit?: number } = {}): Promise<PropertyLeadRow[]> {
  const q = new URLSearchParams({ select: COLUMNS, order: "created_at.desc", limit: String(Math.min(opts.limit ?? 200, 1000)) });
  if (opts.status) q.set("status", `eq.${opts.status}`);
  if (opts.agency) q.set("agency", `eq.${opts.agency}`);
  return selectRowsFresh<PropertyLeadRow>("property_leads", q.toString());
}
