"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";

import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/catalog", label: "Новостройки", short: "Купить", match: (p: string, t: string | null) => p === "/catalog" && (!t || t === "new") || p.startsWith("/complex"), cls: "hidden min-[400px]:inline-flex" },
  { href: "/catalog?type=secondary", label: "Вторичка", match: (p: string, t: string | null) => (p === "/catalog" && t === "secondary") || p.startsWith("/secondary"), cls: "hidden md:inline-flex" },
  { href: "/catalog?type=rent", label: "Аренда", match: (p: string, t: string | null) => (p === "/catalog" && t === "rent") || p.startsWith("/rent"), cls: "hidden sm:inline-flex" },
  { href: "/hotels", label: "Отели", match: (p: string) => p.startsWith("/hotels"), cls: "inline-flex" },
] as const;

function Links({ type }: { type: string | null }) {
  const pathname = usePathname() ?? "/";
  return (
    <>
      {LINKS.map((l) => {
        const active = l.match(pathname, type);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              l.cls,
              "relative rounded-md px-2 py-2 transition-colors sm:px-3",
              active ? "text-gold" : "text-body hover:bg-line/5 hover:text-heading",
            )}
          >
            {"short" in l ? (
              <>
                <span className="sm:hidden">{l.short}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </>
            ) : (
              l.label
            )}
            {active && <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-gold sm:inset-x-3" aria-hidden="true" />}
          </Link>
        );
      })}
    </>
  );
}

function LinksWithType() {
  const type = useSearchParams()?.get("type") ?? null;
  return <Links type={type} />;
}

/** Ссылки разделов с активным состоянием. useSearchParams — внутри Suspense, чтобы страницы оставались статическими. */
export function HeaderLinks() {
  return (
    <Suspense fallback={<Links type={null} />}>
      <LinksWithType />
    </Suspense>
  );
}

/** Избранное со счётчиком. */
export function FavoritesLink() {
  const count = useFavorites().length;
  return (
    <Link
      href="/favorites"
      aria-label={count ? `Избранное: ${count}` : "Избранное"}
      title="Избранное и сравнение"
      className="relative ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line/10 bg-card/70 text-heading backdrop-blur transition-colors hover:border-gold/60 hover:text-gold"
    >
      <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-graphite">
          {count}
        </span>
      )}
    </Link>
  );
}

const subscribeScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};

/** Шапка главной: прозрачная поверх Hero, при прокрутке — с фоном и размытием. */
export function ScrollHeader({ overlay, children }: { overlay: boolean; children: React.ReactNode }) {
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 24, () => false);
  const solid = !overlay || scrolled;
  return (
    <header
      className={cn(
        "z-40 w-full transition-[background-color,border-color] duration-300",
        overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
        solid ? "border-b border-line/10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70" : "border-b border-transparent",
      )}
    >
      {children}
    </header>
  );
}
