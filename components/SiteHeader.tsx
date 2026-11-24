import { Plus, UserRound } from "lucide-react";
import Link from "next/link";

import { FavoritesLink, HeaderLinks, ScrollHeader } from "@/components/HeaderNav";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

import { SITE } from "@/lib/site-config";

export interface SiteHeaderProps {
  /** Прозрачная шапка поверх Hero (главная), с фоном после прокрутки. Иначе — липкая с размытием фона. */
  overlay?: boolean;
}

export function SiteHeader({ overlay = false }: SiteHeaderProps) {
  return (
    <ScrollHeader overlay={overlay}>
      {SITE.demoContent && (
        <p className="bg-gold px-4 py-1.5 text-center text-xs font-medium text-graphite">
          Демо-версия: объекты, отели, цены и телефоны — примеры, а не реальные предложения.
        </p>
      )}
      <div className="container flex h-16 items-center justify-between">
        <Logo height={30} priority />
        <nav aria-label="Основная навигация" className="flex items-center gap-0.5 text-sm font-medium sm:gap-1">
          <HeaderLinks />
          <ThemeToggle className="ml-1" />
          <FavoritesLink />
          <Link
            href="/profile"
            aria-label="Профиль и мои объекты"
            title="Профиль и мои объекты"
            className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line/10 bg-card/70 text-heading backdrop-blur transition-colors hover:border-gold/60 hover:text-gold"
          >
            <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <Link
            href="/add"
            aria-label="Разместить объект"
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-lg border border-gold/40 bg-gold-muted px-3 font-heading font-semibold text-gold transition-colors hover:border-gold hover:bg-gold hover:text-graphite sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Разместить объект</span>
          </Link>
        </nav>
      </div>
    </ScrollHeader>
  );
}

export default SiteHeader;
