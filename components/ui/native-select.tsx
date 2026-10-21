import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

/**
 * Нативный <select> в стиле SILKX.
 * Осознанно не Radix Select: на телефоне открывается системный пикер (привычно, быстро,
 * доступно), и это 0 КБ JS в бандле.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "h-12 w-full cursor-pointer appearance-none truncate rounded-lg border border-input bg-background pl-3 pr-10 text-heading",
          "transition-colors hover:border-white/20 focus:border-gold/60 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>option]:bg-card [&>option]:text-heading",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body"
        aria-hidden="true"
      />
    </div>
  );
});
