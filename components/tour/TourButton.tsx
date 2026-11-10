"use client";

import { Box, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { TourScene } from "@/lib/types";
import { cn } from "@/lib/utils";

// WebGL-вьюер грузится только по клику — не утяжеляет первую загрузку карточки.
const PanoramaViewer = dynamic(() => import("@/components/tour/PanoramaViewer").then((m) => m.PanoramaViewer), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-none" />,
});

export interface TourButtonProps {
  scenes: TourScene[];
  title: string;
  className?: string;
  variant?: "primary" | "overlay";
}

/** Кнопка «3D-тур» + полноэкранное окно с панорамой 360°. Esc и клик по фону закрывают. */
export function TourButton({ scenes, title, className, variant = "primary" }: TourButtonProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // фон не скроллится под модалкой
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      trigger?.focus(); // возвращаем фокус туда, откуда открыли
    };
  }, [open]);

  if (scenes.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-heading font-semibold transition-colors",
          variant === "primary"
            ? "h-12 rounded-lg border border-gold/40 bg-gold-muted px-5 text-gold hover:border-gold hover:bg-gold/20"
            : "h-10 rounded-full bg-black/60 px-4 text-sm text-white backdrop-blur hover:bg-black/80",
          className,
        )}
      >
        <Box className="h-4 w-4" aria-hidden="true" />
        3D-тур 360°
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`3D-тур: ${title}`}
          className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-gold-bright">3D-тур 360°</p>
              <h2 className="truncate text-base text-white sm:text-lg">{title}</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Закрыть 3D-тур"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 px-0 pb-0 sm:px-6 sm:pb-6">
            <PanoramaViewer scenes={scenes} className="h-full w-full sm:rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}

export default TourButton;
