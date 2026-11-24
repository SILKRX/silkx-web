"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

/** Сердечко «В избранное» на карточке и странице объекта. */
export function FavoriteButton({ id, title, className, withLabel = false }: { id: string; title: string; className?: string; withLabel?: boolean }) {
  const active = useFavorites().includes(id);
  const router = useRouter();
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Убрать «${title}» из избранного` : `Добавить «${title}» в избранное`}
      title={active ? "Убрать из избранного" : "В избранное"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleFavorite(id);
        toast.success(added ? "Добавлено в избранное" : "Убрано из избранного", {
          action: added ? { label: "Открыть", onClick: () => router.push("/favorites") } : undefined,
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        withLabel ? "h-11 border border-line/10 bg-card px-4 text-sm font-semibold text-heading hover:border-gold/50" : "h-9 w-9 bg-black/45 text-white hover:bg-black/65",
        active && !withLabel && "bg-white text-red-500 hover:bg-white",
        className,
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", active && "fill-current text-red-500")} aria-hidden="true" />
      {withLabel && (active ? "В избранном" : "В избранное")}
    </button>
  );
}
