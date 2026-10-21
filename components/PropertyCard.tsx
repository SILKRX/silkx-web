"use client";

import { BadgeCheck, Box, Building2, Clock, Flame, ImageOff, KeyRound, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { formatPrice, formatRooms } from "@/lib/format";
import { TASHKENT_DISTRICTS } from "@/lib/types";
import type { Currency, DealType, DistrictSlug, PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PropertyCardProps {
  id: string;
  type: DealType;
  title: string;
  district: DistrictSlug;
  price: number;
  currency?: Currency;
  imageUrl?: string | null;
  tags?: string[];
  status: PropertyStatus;
  rooms?: number;
  areaM2?: number;
  /** Есть 3D-тур 360° — показываем бейдж на фото. */
  has3dTour?: boolean;
  /** Куда ведёт карточка. По умолчанию — страница объекта. */
  href?: string;
  /** true для карточек в первом экране — грузим картинку без lazy (лучше LCP). */
  priority?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<PropertyStatus, { label: string; icon: LucideIcon; className: string }> = {
  hot: {
    label: "Горячий старт",
    icon: Flame,
    className: "bg-gold text-graphite",
  },
  new: {
    label: "Новинка",
    icon: Sparkles,
    className: "bg-deep-blue text-heading ring-1 ring-white/10",
  },
  verified: {
    label: "Проверено SILKX",
    icon: BadgeCheck,
    className: "bg-graphite/80 text-gold ring-1 ring-gold/40",
  },
  available: {
    label: "Свободна",
    icon: KeyRound,
    className: "bg-success/90 text-success-foreground",
  },
  reserved: {
    label: "Забронировано",
    icon: Clock,
    className: "bg-graphite/80 text-body ring-1 ring-white/10",
  },
};

const TYPE_LABEL: Record<DealType, string> = {
  sale: "Новостройка",
  rent: "Аренда",
};

const MAX_VISIBLE_TAGS = 3;

function PropertyCardComponent({
  id,
  type,
  title,
  district,
  price,
  currency = "USD",
  imageUrl,
  tags = [],
  status,
  rooms,
  areaM2,
  has3dTour = false,
  href,
  priority = false,
  className,
}: PropertyCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;
  const districtLabel = TASHKENT_DISTRICTS[district] ?? "Ташкент";
  const link = href ?? (type === "sale" ? `/complex/${encodeURIComponent(id)}` : `/rent/${encodeURIComponent(id)}`);

  // Чистим теги: без пустых строк и дублей, не больше 3 — карточка не должна «расползаться».
  const uniqueTags = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
  const visibleTags = uniqueTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagsCount = uniqueTags.length - visibleTags.length;

  const showImage = Boolean(imageUrl) && !imageFailed;
  const isReserved = status === "reserved";

  const meta: string[] = [];
  if (typeof rooms === "number") meta.push(formatRooms(rooms));
  if (typeof areaM2 === "number" && areaM2 > 0) meta.push(`${type === "sale" ? "от " : ""}${Math.round(areaM2)} м²`);

  return (
    <Link
      href={link}
      aria-label={`${title}, ${districtLabel} район, ${formatPrice(price, currency, type)}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-white/5 bg-card",
        "transition-[box-shadow,transform,border-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-gold-glow",
        "focus-visible:shadow-gold-glow active:translate-y-0 active:scale-[0.99]",
        className,
      )}
    >
      {/* --- Медиа --- */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-panel to-deep-blue">
        {showImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            onError={() => setImageFailed(true)}
            className={cn(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
              isReserved && "grayscale-[60%]",
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-body/60" aria-hidden="true">
            {imageFailed ? <ImageOff className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
            <span className="text-xs">Фото скоро появится</span>
          </div>
        )}

        {/* Градиент снизу — чтобы бейджи читались на любом фото */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none backdrop-blur-sm",
              statusCfg.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {statusCfg.label}
          </span>
        </div>

        {has3dTour && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold leading-none text-gold ring-1 ring-gold/40 backdrop-blur-sm">
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
            3D-тур
          </span>
        )}

        <span className="absolute right-3 top-3 rounded-full bg-graphite/70 px-2.5 py-1 text-[11px] font-medium leading-none text-heading backdrop-blur-sm">
          {TYPE_LABEL[type]}
        </span>
      </div>

      {/* --- Контент --- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-heading">{title}</h3>
          <p className="flex items-center gap-1 text-sm text-body">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate">{districtLabel} р-н</span>
          </p>
        </div>

        {visibleTags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Особенности">
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-gold-muted px-2 py-1 text-[11px] font-medium leading-none text-gold"
              >
                {tag}
              </li>
            ))}
            {hiddenTagsCount > 0 && (
              <li className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium leading-none text-body">
                +{hiddenTagsCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/5 pt-3">
          <p className="tabular font-heading text-lg font-bold leading-none text-heading">
            {formatPrice(price, currency, type)}
          </p>
          {meta.length > 0 && <p className="shrink-0 text-xs text-body">{meta.join(" · ")}</p>}
        </div>
      </div>
    </Link>
  );
}

/** memo: в каталоге при смене фильтров не перерисовываем карточки с теми же пропсами. */
export const PropertyCard = memo(PropertyCardComponent);
export default PropertyCard;
