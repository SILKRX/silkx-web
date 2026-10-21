/**
 * Контакты и соцсети SILKX — ЕДИНСТВЕННОЕ место, где их нужно менять.
 * Пустая строка = иконка показывается неактивной (до появления аккаунта).
 */
export interface SiteConfig {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  socials: Record<"telegram" | "instagram" | "linkedin" | "facebook", string>;
  /**
   * Видео-фон первого экрана. Приоритет: mp4 (свой файл) → YouTube → анимированный «ночной Ташкент».
   *  • mp4: положите файл в /public/video и укажите путь, напр. "/video/tashkent-hero.mp4" — лучший вариант
   *    (быстро, без логотипов YouTube). Рекомендуется 1920×1080, 10–20 сек, без звука, H.264, до ~8 МБ.
   *  • youtubeId: ID ролика YouTube (часть ссылки после v=). Используйте свои ролики или с разрешения автора.
   */
  heroVideo: { mp4: string; poster: string; youtubeId: string; startSec: number };
}

export const SITE: SiteConfig = {
  name: "SILKX",
  tagline: "Цифровой бутик недвижимости Ташкента",
  phone: "", // например "+998 90 123-45-67"
  email: "", // например "hello@silkx.uz"
  socials: {
    telegram: "https://t.me/+Fc0-KgY6aoBlNTMy",
    instagram: "", // https://instagram.com/<аккаунт>
    linkedin: "", // https://www.linkedin.com/company/<компания>
    facebook: "", // https://facebook.com/<страница>
  },
  heroVideo: {
    mp4: "", // например "/video/tashkent-hero.mp4"
    poster: "", // кадр-заставка, напр. "/video/tashkent-hero.jpg"
    youtubeId: "kkMUORKQRxM", // «Tashkent 4K» — ролик, который вы прислали
    startSec: 0,
  },
};

export type SocialKey = keyof SiteConfig["socials"];
