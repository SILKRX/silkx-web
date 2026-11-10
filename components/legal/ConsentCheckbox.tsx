"use client";

import Link from "next/link";
import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Согласие на обработку персональных данных — НЕ отмечено заранее (свободное, конкретное, информированное).
 * Включает условие о возрасте: до 14 лет — заявку подаёт родитель, 14–18 — с согласия законного представителя.
 */
export function ConsentCheckbox({
  checked,
  onChange,
  error,
  purpose,
  extra,
  className,
  id: idProp,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  /** Для чего данные: «обработки заявки на бронирование» и т. п. */
  purpose: string;
  /** Дополнительное утверждение перед согласием (например, «Я собственник…») */
  extra?: ReactNode;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-body">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cn("mt-0.5 h-5 w-5 shrink-0 accent-gold", error && "outline outline-2 outline-destructive")}
        />
        <span className="leading-relaxed">
          {extra ? <>{extra} </> : null}
          Я ознакомлен(а) с{" "}
          <Link href="/privacy" target="_blank" className="text-gold underline-offset-4 hover:underline">
            Политикой конфиденциальности
          </Link>{" "}
          и{" "}
          <Link href="/offer" target="_blank" className="text-gold underline-offset-4 hover:underline">
            Офертой
          </Link>{" "}
          и даю согласие на обработку моих персональных данных для {purpose}. Мне исполнилось 14 лет; если мне меньше 18 —
          действую с согласия родителя или законного представителя.
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default ConsentCheckbox;
