"use client";

import { Clock, Home, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/format";
import { MY_LISTINGS_EVENT, loadMyListings, removeMyListing } from "@/lib/my-listings";
import type { MyListing } from "@/lib/my-listings";
import { TASHKENT_DISTRICTS } from "@/lib/types";

/** Профиль → «Мои объекты»: объявления, отправленные с этого устройства, со статусом. */
export function MyListings() {
  const [items, setItems] = useState<MyListing[] | null>(null);

  useEffect(() => {
    const load = () => setItems(loadMyListings());
    load();
    window.addEventListener(MY_LISTINGS_EVENT, load);
    window.addEventListener("storage", load); // другая вкладка
    return () => {
      window.removeEventListener(MY_LISTINGS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <section aria-labelledby="my-listings-title" className="mx-auto mt-12 max-w-5xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Ваши объявления</p>
          <h2 id="my-listings-title" className="mt-1 text-2xl">
            Мои объекты
          </h2>
        </div>
        <Link
          href="/add"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 font-heading text-sm font-semibold text-graphite transition-colors hover:bg-gold-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Разместить объект
        </Link>
      </div>

      {items === null ? (
        <div className="skeleton h-24" />
      ) : items.length === 0 ? (
        <div className="terminal-panel flex flex-col items-center gap-3 p-8 text-center">
          <Home className="h-8 w-8 text-gold" aria-hidden="true" />
          <p className="text-sm">Вы ещё не размещали объекты с этого устройства.</p>
          <Link href="/add" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
            Разместить первый объект бесплатно
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="terminal-panel flex items-start gap-3 p-4 sm:items-center sm:gap-4">
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-muted sm:flex">
                <Home className="h-5 w-5 text-gold" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                <div className="min-w-0 sm:flex-1">
                  <p className="line-clamp-2 font-heading font-semibold text-heading">{it.title}</p>
                  <p className="mt-0.5 text-xs text-body">
                    {formatPrice(it.price, it.currency, it.dealType)}
                    {it.district ? ` · ${TASHKENT_DISTRICTS[it.district]} р-н` : ""} · №&nbsp;{it.id} ·{" "}
                    {new Date(it.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <span className="mt-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-muted px-3 py-1 text-xs font-medium text-gold sm:mt-0">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {it.demo ? "Демо: не сохранено" : "На модерации"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Убрать объявление из списка на этом устройстве? Чтобы снять его с сайта, отправьте запрос на удаление.")) {
                    removeMyListing(it.id);
                  }
                }}
                aria-label={`Убрать «${it.title}» из списка`}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-body transition-colors hover:bg-line/5 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-body">
        Список хранится на этом устройстве. Снять объявление с сайта —{" "}
        <Link href="/data-request" className="text-gold underline-offset-4 hover:underline">
          запрос на удаление
        </Link>
        .
      </p>
    </section>
  );
}

export default MyListings;
