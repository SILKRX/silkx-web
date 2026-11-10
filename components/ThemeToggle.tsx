"use client";

import { Moon, Sun } from "lucide-react";

import { setTheme } from "@/lib/theme";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

/** Кнопка «светлая / тёмная тема» для шапки. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line/10 bg-card/70 text-heading backdrop-blur transition-colors hover:border-gold/60 hover:text-gold",
        className,
      )}
    >
      <Sun
        className={cn("absolute h-[18px] w-[18px] transition-all duration-300", isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")}
        aria-hidden="true"
      />
      <Moon
        className={cn("absolute h-[18px] w-[18px] transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")}
        aria-hidden="true"
      />
    </button>
  );
}

export default ThemeToggle;
