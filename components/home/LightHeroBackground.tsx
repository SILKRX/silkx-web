import { cn } from "@/lib/utils";

/**
 * Фон Hero для светлой темы: тёплый белый, мягкие золотые блики, тонкая сетка
 * и линейный силуэт Ташкента (телебашня, купола, высотки Tashkent City).
 * Только CSS + один SVG-путь: 0 запросов, ничего не грузит. В тёмной теме скрыт — там «ночной Ташкент».
 */
export function LightHeroBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden dark:hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_90%_5%,rgba(188,163,127,0.30),transparent_60%),radial-gradient(ellipse_55%_45%_at_0%_95%,rgba(188,163,127,0.16),transparent_65%),linear-gradient(180deg,#FFFFFF_0%,#FAF8F4_100%)]" />
      {/* Тонкая сетка, растворяющаяся к краям */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(28,28,30,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(28,28,30,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_60%_40%,black,transparent)]" />
      {/* Силуэт города */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[38%] w-full text-gold"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient id="lightSkylineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BCA37F" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#BCA37F" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d="M0 320V250h60v-30h40v30h50v-60h30v60h40v-20h30v20h30V160h8V60l6-30 6 30v100h8v90h40v-40h50v40h30v-70a40 40 0 0 1 80 0v70h40v-50h20v-25h40v25h20v50h40V170h60v80h30v-110h70v110h40v-60h50v60h40V120l40-30 40 30v130h30v-70h60v70h40v-40a35 35 0 0 1 70 0v40h40V190h50v60h40v-30h40v30h30v-80h60v80h50v-50h40v50h60v70Z"
          fill="url(#lightSkylineFill)"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

export default LightHeroBackground;
