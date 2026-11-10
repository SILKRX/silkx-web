import Link from "next/link";

import { CookieSettingsLink } from "@/components/legal/LocalDataButtons";
import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/SocialLinks";
import { REQUISITES } from "@/lib/legal";
import { SITE } from "@/lib/site-config";

const COLUMNS: ReadonlyArray<{ title: string; links: ReadonlyArray<{ href: string; label: string }> }> = [
  {
    title: "Каталог",
    links: [
      { href: "/catalog", label: "Новостройки" },
      { href: "/catalog?type=rent", label: "Аренда" },
      { href: "/hotels", label: "Отели" },
      { href: "/catalog?type=rent", label: "Жильё для студентов" },
    ],
  },
  {
    title: "Собственникам",
    links: [
      { href: "/add", label: "Разместить объект" },
      { href: "/profile", label: "Профиль и мои объекты" },
      { href: "/add#step-5", label: "3D-тур 360°" },
    ],
  },
  {
    title: "Документы",
    links: [
      { href: "/privacy", label: "Политика конфиденциальности" },
      { href: "/offer", label: "Публичная оферта" },
      { href: "/refund", label: "Условия возврата" },
      { href: "/cookies", label: "Политика cookies" },
      { href: "/data-request", label: "Удалить мои данные" },
      { href: "/requisites", label: "Реквизиты" },
      { href: "/licenses", label: "Лицензии" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-10 border-t border-line/5 bg-[linear-gradient(180deg,rgba(188,163,127,0.10),transparent_60%)] dark:bg-[linear-gradient(180deg,rgba(26,42,58,0.25),transparent_60%)]">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_1.2fr]">
        <div>
          <Logo height={40} />
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            {SITE.tagline}. Проверенные объекты, 3D-туры и AI-ассистент — для жителей, студентов и гостей города.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-heading">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-body transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-heading">Мы в соцсетях</h3>
          <SocialLinks className="mt-4" />
          <ul className="mt-5 space-y-1.5 text-sm">
            {SITE.phone && (
              <li>
                <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="text-heading hover:text-gold">
                  {SITE.phone}
                </a>
              </li>
            )}
            {SITE.email && (
              <li>
                <a href={`mailto:${SITE.email}`} className="text-body hover:text-gold">
                  {SITE.email}
                </a>
              </li>
            )}
            <li className="text-body">Ташкент, Узбекистан</li>
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/5">
        <div className="container flex flex-col gap-2 py-5 pb-24 text-xs text-body sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <p>
            © {year} {REQUISITES.companyName || "SILKX"}. Все права защищены.
            {REQUISITES.inn ? ` ИНН ${REQUISITES.inn}.` : ""}{REQUISITES.legalAddress ? ` ${REQUISITES.legalAddress}.` : ""}
          </p>
          <p>Сделано в Ташкенте</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
