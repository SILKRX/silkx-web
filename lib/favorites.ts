"use client";

/**
 * Избранное: id объектов в localStorage (без аккаунта). Подписка через useSyncExternalStore —
 * все сердечки, счётчик в шапке и страница /favorites обновляются синхронно, в том числе между вкладками.
 */
import { useSyncExternalStore } from "react";

const KEY = "silkx:favorites";
const EVENT = "silkx:favorites-change";
export const MAX_FAVORITES = 50;
export const MAX_COMPARE = 4;

const EMPTY: readonly string[] = [];
let cache: { raw: string | null; ids: readonly string[] } = { raw: null, ids: EMPTY };

function read(): readonly string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.ids;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_FAVORITES) : [];
    cache = { raw, ids };
    return ids;
  } catch {
    return EMPTY;
  }
}

function write(ids: readonly string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
  } catch {
    /* приватный режим / переполнено — избранное просто не сохранится */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites(): readonly string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleFavorite(id: string): boolean {
  const ids = read();
  const has = ids.includes(id);
  write(has ? ids.filter((x) => x !== id) : [id, ...ids]);
  return !has;
}

export function removeFavorite(id: string) {
  write(read().filter((x) => x !== id));
}
