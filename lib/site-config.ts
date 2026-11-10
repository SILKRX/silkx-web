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
   * true — объекты, отели, телефоны и фото на сайте ДЕМОНСТРАЦИОННЫЕ: над шапкой показывается предупреждение,
   * чтобы не вводить посетителей в заблуждение. Выключите (false), когда загрузите реальные данные партнёров.
   */
  demoContent: boolean;
}

export const SITE: SiteConfig = {
  name: "SILKX",
  tagline: "Цифровой бутик недвижимости Ташкента",
  phone: "", // например "+998 90 123-45-67"
  email: "", // например "hello@silkx.uz"
  socials: {
    telegram: "https://t.me/+Fc0-KgY6aoBlNTMy",
    instagram: "https://www.instagram.com/silkx_official/",
    linkedin: "https://www.linkedin.com/company/silkxofficial/",
    facebook: "https://www.facebook.com/profile.php?id=61595846581408",
  },
  demoContent: true,
};

export type SocialKey = keyof SiteConfig["socials"];
