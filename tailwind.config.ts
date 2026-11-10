import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // --- Бренд SILKX ---
        // graphite — всегда тёмный (текст на золотых кнопках); остальные токены зависят от темы
        graphite: "#1C1C1E",
        "deep-blue": "hsl(var(--deep-blue) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        gold: {
          DEFAULT: "#BCA37F",
          hover: "#C9B391",
          active: "#A88F6C",
          muted: "rgba(188, 163, 127, 0.12)",
        },
        heading: "hsl(var(--heading) / <alpha-value>)",
        body: "hsl(var(--body) / <alpha-value>)",
        // Тонкие линии и подложки: белый в тёмной теме, графит — в светлой (border-line/10, bg-line/5)
        line: "rgb(var(--line) / <alpha-value>)",

        // --- Семантические токены shadcn/ui (через CSS-переменные) ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // Золотой ТЕКСТ темнее в светлой теме (контраст ≥ 4.5:1); фон/рамки — прежнее золото
      textColor: {
        gold: {
          DEFAULT: "rgb(var(--gold-text) / <alpha-value>)",
          hover: "rgb(var(--gold-text-hover) / <alpha-value>)",
          active: "rgb(var(--gold-text-hover) / <alpha-value>)",
          // Золото для текста поверх фото/тёмных оверлеев — одинаковое в обеих темах
          bright: "#BCA37F",
        },
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", ...fontFamily.sans],
        sans: ["var(--font-inter)", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Безопасные зоны iPhone (чёлка / home-indicator) — для sticky-панели
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        "gold-glow": "0 0 0 1px rgba(188, 163, 127, 0.35), 0 8px 24px rgba(188, 163, 127, 0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "ai-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "70%, 100%": { transform: "scale(1.35)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.6s infinite",
        "ai-pulse": "ai-pulse 2.4s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
