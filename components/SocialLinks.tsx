import type { SocialKey } from "@/lib/site-config";
import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Простые монохромные глифы соцсетей (inline SVG — без иконочных пакетов и внешних запросов). */
const ICONS: Record<SocialKey, { label: string; path: string }> = {
  telegram: {
    label: "Telegram",
    path: "M21.2 4.6 2.9 11.7c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.6-1.4ZM8.5 14.3l9.6-6.1c.5-.3.9-.1.5.2l-8 7.3-.3 3.2-1.8-4.6Z",
  },
  instagram: {
    label: "Instagram",
    path: "M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4.6c2.4 0 2.7 0 3.6.1 2.4.1 3.6 1.2 3.7 3.7.1.9.1 1.2.1 3.6s0 2.7-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-2.5-.1-3.6-1.3-3.7-3.7-.1-.9-.1-1.2-.1-3.6s0-2.7.1-3.6C4.8 5.9 5.9 4.8 8.4 4.7c.9-.1 1.2-.1 3.6-.1ZM12 3c-2.4 0-2.8 0-3.7.1C5 3.2 3.2 5 3.1 8.3 3 9.2 3 9.6 3 12s0 2.8.1 3.7c.1 3.3 1.9 5.1 5.2 5.2.9.1 1.3.1 3.7.1s2.8 0 3.7-.1c3.3-.2 5.1-1.9 5.2-5.2.1-.9.1-1.3.1-3.7s0-2.8-.1-3.7c-.1-3.3-1.9-5.1-5.2-5.2C14.8 3 14.4 3 12 3Z",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M6.9 8.9H3.6V20h3.3V8.9ZM5.3 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 13.6c0-3-.6-5-4-5-1.7 0-2.8.9-3.2 1.8h-.1V8.9H10V20h3.3v-5.5c0-1.5.3-2.9 2.1-2.9s1.8 1.7 1.8 3V20h3.3l-.1-6.4Z",
  },
  facebook: {
    label: "Facebook",
    path: "M13.4 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.6V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.4H7.5V13h2.7v8h3.2Z",
  },
};

const ORDER: SocialKey[] = ["telegram", "instagram", "linkedin", "facebook"];

export function SocialLinks({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <ul className={cn("flex items-center gap-3", className)} aria-label="SILKX в соцсетях">
      {ORDER.map((key) => {
        const { label, path } = ICONS[key];
        const href = SITE.socials[key];
        const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
        const icon = (
          <svg viewBox="0 0 24 24" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill="currentColor" aria-hidden="true">
            <path d={path} />
          </svg>
        );
        return (
          <li key={key}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`SILKX в ${label}`}
                className={cn(
                  box,
                  "flex items-center justify-center rounded-full border border-gold/30 text-gold transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-graphite",
                )}
              >
                {icon}
              </a>
            ) : (
              <span
                role="img"
                aria-label={`${label} — скоро`}
                title={`${label} — скоро`}
                className={cn(box, "flex items-center justify-center rounded-full border border-white/10 text-body/60")}
              >
                {icon}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default SocialLinks;
