"use client";

import { Bot, Box, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { openAssistant } from "@/components/AIAssistant";
import { cn } from "@/lib/utils";

const POINTS: ReadonlyArray<{ icon: LucideIcon; text: string; action: () => void }> = [
  { icon: Box, text: "3D-туры 360°", action: () => scrollToId("tour") },
  { icon: ShieldCheck, text: "Проверенные объекты", action: () => scrollToId("why") },
  { icon: Bot, text: "AI-ассистент 24/7", action: openAssistant },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Преимущества под заголовком Hero — кликабельные: тур, «Почему SILKX», открыть чат. */
export function HeroPoints({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {POINTS.map(({ icon: Icon, text, action }) => (
        <li key={text}>
          <button
            type="button"
            onClick={action}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line/10 bg-card/60 px-3.5 text-sm text-heading/90 backdrop-blur transition-colors hover:border-gold/50 hover:text-gold dark:bg-black/20"
          >
            <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
            {text}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default HeroPoints;
