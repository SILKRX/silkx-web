"use client";

import { Building2, KeyRound } from "lucide-react";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import type { DealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: ReadonlyArray<{ value: DealType; label: string; icon: LucideIcon }> = [
  { value: "sale", label: "Новостройки", icon: Building2 },
  { value: "rent", label: "Аренда", icon: KeyRound },
];

export interface DealTypeSwitchProps {
  value: DealType;
  onChange: (value: DealType) => void;
  /** Растянуть на всю ширину на любых экранах (для боковой панели фильтров). */
  fullWidth?: boolean;
  className?: string;
}

/** Сегментный переключатель «Новостройки / Аренда». Клавиатура: ← → переключают. */
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
      aria-label="Тип сделки"
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
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold",
              "transition-colors duration-200",
              !fullWidth && "sm:flex-none",
              active ? "bg-gold text-graphite shadow-sm" : "text-body hover:bg-line/5 hover:text-heading",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default DealTypeSwitch;
