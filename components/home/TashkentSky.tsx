import { cn } from "@/lib/utils";

/**
 * «Видео-фон» Hero без видео: вечерний Ташкент — звёзды, полумесяц, силуэт города
 * (телебашня, купола и минареты, башни Tashkent City) и стаи птиц.
 *
 * Чистый SVG + CSS-анимации: ~0 КБ сети, мгновенный первый экран, чёткость на любом DPI,
 * не нужен JS (серверный компонент). prefers-reduced-motion останавливает всё (globals.css).
 * Все «случайные» элементы — из детерминированного PRNG, поэтому SSR и клиент совпадают.
 */

const W = 1440;
const H = 800;
const GROUND = H;

// --- детерминированный PRNG (mulberry32) ------------------------------------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

// --- звёзды -----------------------------------------------------------------
const STARS = (() => {
  const r = rng(7);
  return Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: round(r() * W),
    y: round(r() * H * 0.55),
    size: round(0.5 + r() * 1.3),
    delay: round(r() * 6),
    duration: round(3 + r() * 4),
    bright: r() > 0.85,
  }));
})();

// --- дальний план: силуэты массивов ----------------------------------------
const FAR_BUILDINGS = (() => {
  const r = rng(21);
  const list: { x: number; w: number; h: number }[] = [];
  let x = -20;
  while (x < W + 20) {
    const w = 24 + r() * 46;
    const h = 90 + r() * 150;
    list.push({ x: round(x), w: round(w), h: round(h) });
    x += w + r() * 6;
  }
  return list;
})();

// --- ближний план: здания с окнами ------------------------------------------
interface NearBuilding {
  x: number;
  w: number;
  h: number;
  /** Скошенная/ступенчатая крыша — для разнообразия силуэта. */
  roof: "flat" | "step" | "slant";
}

const NEAR_BUILDINGS: NearBuilding[] = [
  { x: 0, w: 70, h: 170, roof: "flat" },
  { x: 74, w: 54, h: 230, roof: "step" },
  { x: 132, w: 88, h: 150, roof: "flat" },
  // «Узбекистан»-подобный широкий отель с сеткой фасада
  { x: 360, w: 150, h: 200, roof: "flat" },
  { x: 515, w: 46, h: 260, roof: "slant" },
  { x: 566, w: 64, h: 180, roof: "flat" },
  { x: 760, w: 58, h: 210, roof: "step" },
  { x: 822, w: 74, h: 160, roof: "flat" },
  { x: 905, w: 62, h: 185, roof: "flat" },
  { x: 1112, w: 64, h: 175, roof: "step" },
  { x: 1384, w: 60, h: 235, roof: "slant" },
];

function buildingPath({ x, w, h, roof }: NearBuilding): string {
  const top = GROUND - h;
  if (roof === "step") {
    const s = w * 0.25;
    return `M${x} ${GROUND}V${top + 18}H${x + s}V${top}H${x + w - s}V${top + 18}H${x + w}V${GROUND}Z`;
  }
  if (roof === "slant") return `M${x} ${GROUND}V${top + 22}L${x + w} ${top}V${GROUND}Z`;
  return `M${x} ${GROUND}V${top}H${x + w}V${GROUND}Z`;
}

const WINDOWS = (() => {
  const r = rng(99);
  const list: { x: number; y: number; delay: number; flicker: boolean }[] = [];
  for (const b of NEAR_BUILDINGS) {
    const cols = Math.max(2, Math.floor((b.w - 10) / 11));
    const rows = Math.floor((b.h - 34) / 15);
    const gap = (b.w - cols * 5) / (cols + 1);
    for (let c = 0; c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        if (r() > 0.32) continue; // горит ~треть окон
        list.push({
          x: round(b.x + gap + c * (5 + gap)),
          y: round(GROUND - b.h + 28 + row * 15),
          delay: round(r() * 12),
          flicker: r() > 0.8,
        });
      }
    }
  }
  return list;
})();

// --- стаи птиц ---------------------------------------------------------------
interface Flock {
  id: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  birds: { dx: number; dy: number; flap: number; phase: number }[];
}

const FLOCKS: Flock[] = (() => {
  const r = rng(314);
  const configs = [
    { y: 170, scale: 1.1, duration: 38, delay: -6, count: 7 },
    { y: 260, scale: 0.75, duration: 52, delay: -30, count: 5 },
    { y: 120, scale: 0.55, duration: 64, delay: -48, count: 9 },
    { y: 330, scale: 0.9, duration: 46, delay: -18, count: 4 },
  ];
  return configs.map((cfg, id) => ({
    id,
    ...cfg,
    // V-образный клин: смещение по «крылу» стаи
    birds: Array.from({ length: cfg.count }, (_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const rank = Math.ceil(i / 2);
      return {
        dx: round(-rank * (26 + r() * 8)),
        dy: round(side * rank * (12 + r() * 6) + (r() - 0.5) * 6),
        flap: round(0.55 + r() * 0.35),
        phase: round(-r()),
      };
    }),
  }));
})();

/** Птица: два крыла-дуги. Взмах — scaleY вокруг тела (CSS). */
const BIRD_PATH = "M-12 0 Q-6 -7 0 0 Q6 -7 12 0";

export function TashkentSky({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#05080F" />
            <stop offset="45%" stopColor="#0F1B2B" />
            <stop offset="75%" stopColor="#1A2A3A" />
            <stop offset="100%" stopColor="#3A3328" />
          </linearGradient>
          <radialGradient id="horizonGlow" cx="0.5" cy="1" r="0.75">
            <stop offset="0%" stopColor="#BCA37F" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#BCA37F" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#BCA37F" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonGlow">
            <stop offset="0%" stopColor="#F3E6CF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F3E6CF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#BCA37F" stopOpacity="0" />
            <stop offset="50%" stopColor="#BCA37F" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#BCA37F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nearFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E0E10" />
            <stop offset="100%" stopColor="#1C1C1E" />
          </linearGradient>
          <mask id="crescent">
            <rect width="100%" height="100%" fill="black" />
            <circle cx="1180" cy="140" r="34" fill="white" />
            <circle cx="1194" cy="130" r="30" fill="black" />
          </mask>
        </defs>

        {/* Небо */}
        <rect width={W} height={H} fill="url(#sky)" />
        <rect width={W} height={H} fill="url(#horizonGlow)" />

        {/* Звёзды */}
        <g>
          {STARS.map((s) => (
            <circle
              key={s.id}
              cx={s.x}
              cy={s.y}
              r={s.bright ? s.size + 0.6 : s.size}
              fill={s.bright ? "#F3E6CF" : "#FFFFFF"}
              className="sky-star"
              style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
            />
          ))}
        </g>

        {/* Полумесяц */}
        <circle cx="1180" cy="140" r="110" fill="url(#moonGlow)" />
        <rect width={W} height={H} fill="#F3E6CF" mask="url(#crescent)" />

        {/* Медленная дымка */}
        <g className="sky-haze">
          <rect x={-W} y={470} width={W * 3} height={90} fill="url(#haze)" />
        </g>

        {/* Стаи птиц — за ближним планом города, перед небом */}
        {FLOCKS.map((f) => (
          <g key={f.id} className="sky-flock" style={{ animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}>
            <g transform={`translate(0 ${f.y}) scale(${f.scale})`}>
              <g className="sky-flock-bob" style={{ animationDelay: `${f.delay / 3}s` }}>
                {f.birds.map((b, i) => (
                  <g key={i} transform={`translate(${b.dx} ${b.dy})`}>
                    <path
                      d={BIRD_PATH}
                      className="sky-bird"
                      style={{ animationDuration: `${b.flap}s`, animationDelay: `${b.phase}s` }}
                      fill="none"
                      stroke="#E6D7B8"
                      strokeOpacity="0.75"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ))}
              </g>
            </g>
          </g>
        ))}

        {/* Дальний план — массивы */}
        <g fill="#1B2533" opacity="0.9">
          {FAR_BUILDINGS.map((b, i) => (
            <rect key={i} x={b.x} y={GROUND - b.h - 40} width={b.w} height={b.h + 40} />
          ))}
        </g>

        {/* Tashkent City — стеклянные башни с золотыми гранями */}
        <g>
          <path d="M640 800V330L668 300V800Z" fill="#141B26" />
          <path d="M668 800V300L700 318V800Z" fill="#101620" />
          <path d="M668 300V800" stroke="#BCA37F" strokeOpacity="0.35" strokeWidth="1.2" />
          <path d="M706 800V250L742 225L778 250V800Z" fill="#131A24" />
          <path d="M742 225V800" stroke="#BCA37F" strokeOpacity="0.4" strokeWidth="1.2" />
          <rect x="740" y="205" width="4" height="22" fill="#141B26" />
          <circle cx="742" cy="203" r="2.2" fill="#E5484D" className="sky-beacon" />
        </g>

        {/* Ближний план — здания с окнами */}
        <g fill="url(#nearFill)">
          {NEAR_BUILDINGS.map((b, i) => (
            <path key={i} d={buildingPath(b)} />
          ))}
        </g>
        <g fill="#E7C98F">
          {WINDOWS.map((w, i) => (
            <rect
              key={i}
              x={w.x}
              y={w.y}
              width="5"
              height="7"
              rx="0.6"
              className={w.flicker ? "sky-window-flicker" : "sky-window"}
              style={{ animationDelay: `${w.delay}s` }}
            />
          ))}
        </g>

        {/* Купола и минареты (мотив исламской архитектуры Ташкента) — справа от телебашни */}
        <g transform="translate(948 0)">
        <g fill="#0E0E10">
          {/* минарет слева */}
          <rect x="236" y="470" width="14" height="330" />
          <path d="M232 470h22l-4-14h-14z" />
          <path d="M238 456h10l-5-26z" />
          {/* главный купол на барабане */}
          <rect x="262" y="640" width="120" height="160" />
          <rect x="280" y="600" width="84" height="44" />
          <path d="M276 604C276 548 300 516 322 504C344 516 368 548 368 604Z" />
          <rect x="320" y="486" width="4" height="20" />
          {/* малые купола */}
          <path d="M262 642C262 618 274 604 286 600C298 604 310 618 310 642Z" />
          <path d="M334 642C334 618 346 604 358 600C370 604 382 618 382 642Z" />
          {/* минарет справа */}
          <rect x="394" y="470" width="14" height="330" />
          <path d="M390 470h22l-4-14h-14z" />
          <path d="M396 456h10l-5-26z" />
          {/* арки портала */}
          <path d="M300 800V700C300 676 344 676 344 700V800Z" fill="#1A1610" />
        </g>
        <path d="M276 604C276 548 300 516 322 504C344 516 368 548 368 604" fill="none" stroke="#BCA37F" strokeOpacity="0.45" strokeWidth="1.5" />
        <rect x="320" y="482" width="4" height="4" fill="#BCA37F" />
        </g>

        {/* Ташкентская телебашня */}
        <g fill="#0B0B0D">
          {/* три опоры-«ноги» */}
          <path d="M1010 800L1040 650H1048L1030 800Z" />
          <path d="M1090 800L1060 650H1052L1070 800Z" />
          <path d="M1045 800L1047 650H1053L1055 800Z" />
          {/* ствол */}
          <path d="M1043 650L1046 300H1054L1057 650Z" />
          {/* смотровая капсула */}
          <ellipse cx="1050" cy="372" rx="30" ry="16" />
          <rect x="1024" y="386" width="52" height="6" rx="3" />
          <ellipse cx="1050" cy="420" rx="16" ry="7" />
          {/* шпиль */}
          <path d="M1047.5 356L1049 150H1051L1052.5 356Z" />
        </g>
        <ellipse cx="1050" cy="372" rx="30" ry="16" fill="none" stroke="#BCA37F" strokeOpacity="0.5" strokeWidth="1.2" />
        <g fill="#E7C98F">
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={1026 + i * 5.6} y="369" width="3" height="4" className="sky-window" style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
        <circle cx="1050" cy="148" r="3" fill="#E5484D" className="sky-beacon" />
        <circle cx="1050" cy="148" r="10" fill="#E5484D" opacity="0.18" className="sky-beacon" />

        {/* Земля + мягкий переход в фон страницы */}
        <rect x="0" y={GROUND - 2} width={W} height="2" fill="#0B0B0D" />
      </svg>

      {/* Затемнение под текст и плавный переход к контенту страницы */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

export default TashkentSky;
