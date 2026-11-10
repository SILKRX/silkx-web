/**
 * Кэш ответов SILKX AI в памяти процесса (LRU + TTL).
 * Ключ — язык + текущий объект + НОРМАЛИЗОВАННЫЙ вопрос, поэтому «Есть ипотека?», «есть ипотека» и
 * «ЕСТЬ ИПОТЕКА!!!» — один и тот же ответ без повторного запроса к Claude API.
 * Кэшируются только первые вопросы диалога: у последующих смысл зависит от истории переписки.
 * На serverless (Netlify) у каждого инстанса своя память — это best-effort, как и rate-limit.
 */
export interface CachedAnswer {
  reply: string;
  ids: string[];
}

const TTL_MS = 6 * 60 * 60_000; // каталог меняется не чаще — 6 часов достаточно свежо
const MAX_ENTRIES = 500;

const store = new Map<string, { value: CachedAnswer; expires: number }>();

export function getCachedAnswer(key: string): CachedAnswer | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  // LRU: перемещаем в конец
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

export function setCachedAnswer(key: string, value: CachedAnswer): void {
  store.delete(key);
  store.set(key, { value, expires: Date.now() + TTL_MS });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
