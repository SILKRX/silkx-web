import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

// Исходник: /public/brand/silkx-wordmark.png (640×209, прозрачный фон, белый SILK + золотой X)
const RATIO = 640 / 209;

export function Logo({ height = 30, className, priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="SILKX — на главную" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/brand/silkx-wordmark.png"
        alt="SILKX"
        width={Math.round(height * RATIO)}
        height={height}
        priority={priority}
        className="h-auto select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
        style={{ height, width: "auto" }}
      />
    </Link>
  );
}

export default Logo;
