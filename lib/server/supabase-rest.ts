/**
 * Supabase через REST (PostgREST + Storage) — без @supabase/supabase-js.
 * Используется ТОЛЬКО на сервере: service-role ключ обходит RLS и не должен попасть в браузер.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const LISTINGS_BUCKET = "listings";

export function isSupabaseConfigured(): boolean {
  return Boolean(URL_ && SERVICE_KEY);
}

const authHeaders = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` });

export async function uploadToStorage(path: string, body: ArrayBuffer, contentType: string): Promise<void> {
  const res = await fetch(`${URL_}/storage/v1/object/${LISTINGS_BUCKET}/${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "max-age=31536000" },
    body,
  });
  if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text().catch(() => "")}`);
}

/** Публичный URL файла (бакет listings — public read). */
export function publicStorageUrl(path: string): string {
  return `${URL_}/storage/v1/object/public/${LISTINGS_BUCKET}/${path}`;
}

export async function insertRow<T extends Record<string, unknown>>(table: string, row: T): Promise<{ id: string }> {
  const res = await fetch(`${URL_}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Insert failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as Array<{ id: string }>;
  const first = data[0];
  if (!first) throw new Error("Insert returned no rows");
  return first;
}
