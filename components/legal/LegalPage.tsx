import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LEGAL_EDITION } from "@/lib/legal";
import { cn } from "@/lib/utils";

export const LEGAL_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/offer", label: "Публичная оферта" },
  { href: "/refund", label: "Условия возврата и отмены" },
  { href: "/cookies", label: "Политика cookies" },
  { href: "/data-request", label: "Мои данные: удалить, изменить" },
  { href: "/requisites", label: "Реквизиты" },
  { href: "/licenses", label: "Лицензии" },
];

/** Каркас юридической страницы: заголовок, дата редакции, меню документов, читаемая типографика. */
export function LegalPage({ title, path, children, lead }: { title: string; path: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="container grid gap-10 pb-16 pt-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Правовые документы" className="order-2 lg:order-1">
          <ul className="space-y-1 text-sm lg:sticky lg:top-24">
            {LEGAL_NAV.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={l.href === path ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 transition-colors",
                    l.href === path ? "bg-gold-muted font-medium text-gold" : "text-body hover:text-heading",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="legal order-1 min-w-0 max-w-3xl lg:order-2">
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-body">Редакция от {LEGAL_EDITION}</p>
          {lead && <div className="mt-6 rounded-lg border border-gold/25 bg-gold-muted p-4 text-sm text-heading">{lead}</div>}
          <div className="mt-8">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export default LegalPage;
