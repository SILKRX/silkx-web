"use client";

import { ArrowRight, Box, Check, Heart, Scale, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MAX_COMPARE, removeFavorite, useFavorites } from "@/lib/favorites";
import { formatNumber, formatPrice, formatRooms } from "@/lib/format";
import type { Currency, DealType, PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FavoriteItem {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  kind: string;
  isNew: boolean;
  type: DealType;
  district: string;
  price: number;
  currency: Currency;
  rentTerm: string | null;
  rooms: number;
  areaM2: number;
  floor: number | null;
  floorsTotal: number | null;
  has3dTour: boolean;
  status: PropertyStatus;
  tags: string[];
  demo: boolean;
}

const STATUS_LABEL: Record<PropertyStatus, string> = {
  hot: "Горячий старт",
  new: "Новинка",
  verified: "Проверено SILKX",
  available: "Свободна",
  reserved: "Забронировано",
};

const priceText = (p: FavoriteItem) => {
  const t = formatPrice(p.price, p.currency, p.type, { from: p.isNew });
  return p.rentTerm === "day" ? t.replace("/ мес", "/ сутки") : t;
};
const perM2 = (p: FavoriteItem) =>
  p.type === "sale" && p.currency === "USD" && p.price > 0 && p.areaM2 > 0 ? Math.round(p.price / p.areaM2 / 10) * 10 : null;

export function FavoritesView({ items }: { items: FavoriteItem[] }) {
  const ids = useFavorites();
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const saved = ids.map((id) => byId.get(id)).filter((x): x is FavoriteItem => Boolean(x));

  const [picked, setPicked] = useState<string[]>([]);
  const compare = picked.map((id) => byId.get(id)).filter((x): x is FavoriteItem => Boolean(x) && ids.includes(x!.id));

  const togglePick = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_COMPARE ? cur : [...cur, id]));

  // Лучшее значение в строке сравнения подсвечиваем
  const minPerM2 = Math.min(...compare.map((c) => perM2(c) ?? Infinity));
  const minPrice = Math.min(...compare.filter((c) => c.price > 0).map((c) => c.price));
  const maxArea = Math.max(...compare.map((c) => c.areaM2));

  const rows: Array<{ label: string; render: (p: FavoriteItem) => React.ReactNode; best?: (p: FavoriteItem) => boolean }> = [
    { label: "Цена", render: priceText, best: (p) => p.price === minPrice && compare.length > 1 },
    { label: "Цена за м²", render: (p) => (perM2(p) ? `≈ $${formatNumber(perM2(p)!)}` : "—"), best: (p) => perM2(p) === minPerM2 && compare.length > 1 },
    { label: "Район", render: (p) => p.district },
    { label: "Тип", render: (p) => p.kind },
    { label: "Комнат", render: (p) => formatRooms(p.rooms) },
    { label: "Площадь", render: (p) => `${p.isNew ? "от " : ""}${Math.round(p.areaM2)} м²`, best: (p) => p.areaM2 === maxArea && compare.length > 1 },
    { label: "Этаж", render: (p) => (p.floor !== null ? (p.floorsTotal ? `${p.floor} из ${p.floorsTotal}` : String(p.floor)) : "—") },
    { label: "Статус", render: (p) => STATUS_LABEL[p.status] },
    { label: "3D-тур", render: (p) => (p.has3dTour ? <Check className="h-4 w-4 text-success" aria-label="Есть" /> : <X className="h-4 w-4 text-body/60" aria-label="Нет" />) },
    { label: "Особенности", render: (p) => (p.tags.length ? p.tags.join(", ") : "—") },
  ];

  return (
    <main className="container pb-16 pt-8">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">Ваш выбор</p>
      <h1 className="mt-1 text-2xl sm:text-3xl">Избранное и сравнение</h1>
      <p className="mt-2 max-w-2xl text-sm text-body">
        Отметьте до {MAX_COMPARE} объектов — сравним цену, цену за м², площадь и условия рядом. Список хранится на этом устройстве.
      </p>

      {saved.length === 0 ? (
        <div className="terminal-panel mt-8 flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-muted">
            <Heart className="h-6 w-6 text-gold" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl">Пока пусто</h2>
          <p className="mt-2 max-w-sm text-sm">Нажмите на сердечко на карточке объекта — он появится здесь.</p>
          <Link href="/catalog" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 font-heading font-semibold text-graphite hover:bg-gold-hover">
            Перейти в каталог
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => {
              const isPicked = picked.includes(p.id);
              const full = !isPicked && picked.length >= MAX_COMPARE;
              return (
                <li key={p.id} className={cn("terminal-panel flex gap-3 p-3", isPicked && "ring-1 ring-gold")}>
                  <Link href={p.href} className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md bg-card text-[0px]">
                    {p.imageUrl && <Image src={p.imageUrl} alt={p.title} fill sizes="112px" className="object-cover" />}
                    {p.has3dTour && (
                      <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-gold-bright">
                        <Box className="h-3 w-3" aria-hidden="true" />
                        3D
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={p.href} className="line-clamp-2 font-heading text-sm font-semibold text-heading hover:text-gold">
                      {p.title}
                    </Link>
                    <p className="truncate text-xs text-body">
                      {p.district} · {p.kind}
                      {p.demo ? " · пример" : ""}
                    </p>
                    <p className="tabular mt-1 font-heading text-base font-bold text-heading">{priceText(p)}</p>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => togglePick(p.id)}
                        disabled={full}
                        aria-pressed={isPicked}
                        title={full ? `Можно сравнить до ${MAX_COMPARE} объектов` : undefined}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors disabled:opacity-40",
                          isPicked ? "border-gold bg-gold text-graphite" : "border-line/10 text-heading hover:border-gold/50",
                        )}
                      >
                        <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                        {isPicked ? "В сравнении" : "Сравнить"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeFavorite(p.id);
                          setPicked((cur) => cur.filter((x) => x !== p.id));
                        }}
                        aria-label={`Убрать «${p.title}» из избранного`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-body transition-colors hover:bg-line/5 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="compare-title" className="mt-10">
            <h2 id="compare-title" className="text-xl sm:text-2xl">
              Сравнение {compare.length > 0 && <span className="text-body">· {compare.length}</span>}
            </h2>
            {compare.length < 2 ? (
              <p className="mt-3 text-sm text-body">Отметьте «Сравнить» хотя бы у двух объектов.</p>
            ) : (
              <div className="terminal-panel mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="w-36 p-3 text-left text-xs font-medium uppercase tracking-wider text-body">
                        <span className="sr-only">Параметр</span>
                      </th>
                      {compare.map((p) => (
                        <th key={p.id} scope="col" className="p-3 text-left align-top">
                          <Link href={p.href} className="font-heading text-sm font-semibold text-heading hover:text-gold">
                            {p.title}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.label} className="border-t border-line/5">
                        <th scope="row" className="p-3 text-left text-xs font-medium uppercase tracking-wider text-body">
                          {r.label}
                        </th>
                        {compare.map((p) => (
                          <td key={p.id} className={cn("tabular p-3 text-heading", r.best?.(p) && "font-semibold text-gold")}>
                            {r.render(p)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-line/5 px-3 py-2 text-xs text-body">Золотым выделено лучшее значение в строке.</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
