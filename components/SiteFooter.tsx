import Link from "next/link";

import { Logo } from "@/components/Logo";
import { SocialLinks } from "@/components/SocialLinks";
import { SITE } from "@/lib/site-config";

const COLUMNS: ReadonlyArray<{ title: string; links: ReadonlyArray<{ href: string; label: string }> }> = [
  {
    title: "Каталог",
    links: [
      { href: "/catalog", label: "Новостройки" },
      { href: "/catalog?type=rent", label: "Аренда" },
      { href: "/catalog?type=rent", label: "Жильё для студентов" },
    ],
  },
  {
    title: "Собственникам",
    links: [
      { href: "/add", label: "Разместить объект" },
      { href: "/add#step-5", label: "3D-тур 360°" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-10 border-t border-white/5 bg-[linear-gradient(180deg,rgba(26,42,58,0.25),transparent_60%)]">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
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
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container flex flex-col gap-2 py-5 pb-24 text-xs text-body sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <p>© {year} SILKX. Все права защищены.</p>
          <p>Сделано в Ташкенте</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
