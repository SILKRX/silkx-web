import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import type { ReactNode } from "react";

import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import "./globals.css";

// next/font: self-hosting, без запросов к Google в рантайме, без layout shift.
// cyrillic обязателен — интерфейс на русском/узбекском (кириллица).
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SILKX — бутик новостроек",
    template: "%s | SILKX",
  },
  description:
    "SILKX — цифровой бутик первичной недвижимости. Проверенные новостройки, актуальные цены и PDF-презентации ЖК.",
  applicationName: "SILKX",
  formatDetection: { telephone: false, email: false, address: false }, // iOS не превращает цены в ссылки
  openGraph: {
    type: "website",
    siteName: "SILKX",
    locale: "ru_RU",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4", // обновляется переключателем темы
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // доступ к safe-area-inset для sticky-панели
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={cn(montserrat.variable, inter.variable)} suppressHydrationWarning>
      <head>
        {/* Тема применяется до отрисовки — без вспышки белого у тех, кто выбрал тёмную */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
        <CookieBanner />
      </body>
    </html>
  );
}
