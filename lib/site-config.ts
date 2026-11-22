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
   * true — жёлтая полоса «Демо-версия» над шапкой. Сейчас выключена: вместо неё демо-объекты и демо-отели
   * помечены маленьким значком «Пример» прямо на карточке и странице (см. HOTELS_ARE_DEMO в lib/hotels.ts
   * и Property.fromListing). Значки исчезнут сами, когда демо-данные заменят реальными.
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
  demoContent: false,
};

export type SocialKey = keyof SiteConfig["socials"];
