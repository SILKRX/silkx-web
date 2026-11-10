/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Набор ширин под реальные макеты (карточки 1–4 в ряд, галерея, обложка) — меньше лишних вариантов
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 260, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // оптимизированные копии храним 30 дней
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage (фото ЖК) — подставится автоматически из env
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [{ protocol: "https", hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname }]
        : []),
    ],
  },
  // Статика без хеша в имени: кэш на неделю + фоновое обновление
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/tours/:path*", headers: cache },
      { source: "/brand/:path*", headers: cache },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
