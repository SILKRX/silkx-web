import { Plus } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";

import { cn } from "@/lib/utils";

export interface SiteHeaderProps {
  /** Прозрачная шапка поверх Hero (главная). Иначе — липкая с размытием фона. */
  overlay?: boolean;
}

export function SiteHeader({ overlay = false }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "z-40 w-full",
        overlay
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Logo height={30} priority />
        <nav aria-label="Основная навигация" className="flex items-center gap-1 text-sm font-medium">
          <Link href="/catalog" className="rounded-md px-3 py-2 text-body transition-colors hover:text-heading">
            Новостройки
          </Link>
          <Link href="/catalog?type=rent" className="hidden rounded-md px-3 py-2 text-body transition-colors hover:text-heading sm:inline-flex">
            Аренда
          </Link>
          <Link
            href="/add"
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-lg border border-gold/40 bg-gold-muted px-3 font-heading font-semibold text-gold transition-colors hover:border-gold hover:bg-gold hover:text-graphite sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Разместить объект</span>
            <span className="sm:hidden">Разместить</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;
