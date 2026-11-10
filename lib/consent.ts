/**
 * Согласие на cookies и сторонние сервисы. Хранится в localStorage (сайт сам cookies не ставит).
 * Категории:
 *  • necessary  — всегда включены (выбор в баннере, тема, язык, черновики) — без них сайт не работает как ожидается;
 *  • maps       — Яндекс Карты (ставят свои cookies). Без согласия используется карта OpenStreetMap без cookies.
 * Смена версии CONSENT_VERSION заново покажет баннер (например, при появлении аналитики).
 */
export const CONSENT_KEY = "silkx:consent";
export const CONSENT_VERSION = 1;
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60_000;
export const CONSENT_EVENT = "silkx:consent-change";
export const OPEN_CONSENT_EVENT = "silkx:open-consent";

export interface Consent {
  v: number;
  maps: boolean;
  /** ISO-дата выбора — для подтверждения согласия */
  at: string;
}

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION || typeof c.at !== "string") return null;
    if (Date.now() - Date.parse(c.at) > CONSENT_TTL_MS) return null; // раз в год спрашиваем снова
    return { v: CONSENT_VERSION, maps: c.maps === true, at: c.at };
  } catch {
    return null;
  }
}

export function saveConsent(choice: { maps: boolean }): Consent {
  const c: Consent = { v: CONSENT_VERSION, maps: choice.maps, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {
    /* приватный режим — выбор действует до перезагрузки */
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: c }));
  return c;
}

export const hasMapsConsent = (): boolean => readConsent()?.maps === true;

export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

/** Удалить всё, что SILKX сохранил в этом браузере (право на удаление данных на устройстве). */
export function clearLocalSiteData(): number {
  let removed = 0;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("silkx:")) {
        localStorage.removeItem(key);
        removed++;
      }
    }
    sessionStorage.clear();
  } catch {
    /* хранилище недоступно */
  }
  return removed;
}
