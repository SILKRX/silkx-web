"use client";

import { Building2, Home, KeyRound } from "lucide-react";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { CATALOG_KINDS } from "@/lib/types";
import type { CatalogKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: ReadonlyArray<{ value: CatalogKind; label: string; icon: LucideIcon }> = [
  { value: "new", label: CATALOG_KINDS.new.label, icon: Building2 },
  { value: "secondary", label: CATALOG_KINDS.secondary.label, icon: Home },
  { value: "rent", label: CATALOG_KINDS.rent.label, icon: KeyRound },
];

export interface DealTypeSwitchProps {
  value: CatalogKind;
  onChange: (value: CatalogKind) => void;
  /** Растянуть на всю ширину на любых экранах (для боковой панели фильтров). */
  fullWidth?: boolean;
  className?: string;
}

/** Сегментный переключатель «Новостройки / Вторичка / Аренда». Клавиатура: ← → переключают. */
export function DealTypeSwitch({ value, onChange, fullWidth = false, className }: DealTypeSwitchProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + dir + OPTIONS.length) % OPTIONS.length;
    const next = OPTIONS[nextIndex];
    if (!next) return;
    onChange(next.value);
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Раздел каталога"
      className={cn(
        "inline-flex w-full rounded-xl border border-line/10 bg-card/80 p-1 shadow-panel backdrop-blur dark:bg-graphite/70",
        !fullWidth && "sm:w-auto",
        className,
      )}
    >
      {OPTIONS.map((option, index) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => {
              if (!active) onChange(option.value);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg font-semibold sm:gap-2",
              "transition-colors duration-200",
              // В узкой боковой панели три вкладки — мельче шрифт и поля, чтобы «Аренда» не обрезалась
              fullWidth ? "px-1 text-[13px]" : "px-2 text-sm sm:flex-none sm:px-4",
              active ? "bg-gold text-graphite shadow-sm" : "text-body hover:bg-line/5 hover:text-heading",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", fullWidth ? "hidden" : "hidden min-[420px]:block")} aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default DealTypeSwitch;
