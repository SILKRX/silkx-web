"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Баннер cookies. Без тёмных паттернов: «Принять» и «Только необходимые» — равнозначные кнопки,
 * ничего не отмечено заранее, выбор можно изменить в любой момент (ссылка «Настройки cookies» в подвале).
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [maps, setMaps] = useState(false);
  const titleId = useId();
  const mapsId = useId();

  useEffect(() => {
    const current = readConsent();
    if (!current) setOpen(true);
    const onOpen = () => {
      setMaps(readConsent()?.maps ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const choose = (m: boolean) => {
    saveConsent({ maps: m });
    setOpen(false);
  };

  const btn = "inline-flex h-11 flex-1 items-center justify-center rounded-lg px-4 font-heading text-sm font-semibold transition-colors sm:flex-none";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-xl border border-line/10 bg-card p-5 shadow-panel sm:inset-x-6 sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id={titleId} className="text-base">
            Cookies и сторонние сервисы
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed">
            Мы не используем рекламные и аналитические cookies. В браузере сохраняются только тема, язык и черновики.
            Карты Яндекса ставят свои cookies — включим их только с вашего согласия, иначе покажем карту OpenStreetMap.{" "}
            <Link href="/cookies" className="text-gold underline-offset-4 hover:underline">
              Подробнее
            </Link>
          </p>
        </div>
      </div>

      {details && (
        <fieldset className="mt-4 space-y-3 rounded-lg border border-line/10 p-4">
          <legend className="px-1 text-xs font-medium uppercase tracking-wider text-body">Настройки</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked disabled className="mt-0.5 h-5 w-5 shrink-0 accent-gold" />
            <span>
              <span className="font-medium text-heading">Необходимые</span> — выбор в этом окне, тема, язык, черновики форм.
              Всегда включены.
            </span>
          </label>
          <label htmlFor={mapsId} className="flex cursor-pointer items-start gap-3 text-sm">
            <input id={mapsId} type="checkbox" checked={maps} onChange={(e) => setMaps(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-gold" />
            <span>
              <span className="font-medium text-heading">Карты Яндекса</span> — интерактивная карта и поиск адреса Яндекса
              (ООО «Яндекс», Россия; ставит cookies).
            </span>
          </label>
        </fieldset>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {details ? (
          <button type="button" onClick={() => choose(maps)} className={cn(btn, "bg-gold text-graphite hover:bg-gold-hover")}>
            Сохранить выбор
          </button>
        ) : (
          <>
            <button type="button" onClick={() => choose(true)} className={cn(btn, "bg-gold text-graphite hover:bg-gold-hover")}>
              Принять все
            </button>
            <button type="button" onClick={() => choose(false)} className={cn(btn, "bg-gold text-graphite hover:bg-gold-hover")}>
              Только необходимые
            </button>
            <button
              type="button"
              onClick={() => setDetails(true)}
              className={cn(btn, "border border-line/15 text-heading hover:border-gold/60")}
            >
              Настроить
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CookieBanner;
