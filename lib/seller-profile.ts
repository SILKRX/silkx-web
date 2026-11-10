import { normalizeTelegram, normalizeUzPhone } from "@/lib/listing";

/**
 * Профиль продавца: собственник или риелтор/агентство (с данными компании).
 * Пока нет авторизации — профиль хранится в браузере (localStorage) и подставляется
 * в форму размещения. Правила валидации общие для формы профиля и API объявлений.
 */

export type SellerType = "owner" | "agent";

export const SELLER_TYPES: Record<SellerType, string> = {
  owner: "Собственник",
  agent: "Риелтор / агентство",
};

export interface CompanyInfo {
  name: string;
  position: string;
  phone: string | null; // E.164
  website: string | null;
  address: string;
  /** ИНН или номер лицензии — для отметки «Проверено SILKX». */
  license: string;
  about: string;
  /** data:URL логотипа (только в браузере, на сервер не отправляется). */
  logo: string | null;
}

export interface SellerProfile {
  sellerType: SellerType;
  name: string;
  phone: string; // E.164
  telegram: string | null;
  about: string;
  experienceYears: number | null;
  /** data:URL фото (только в браузере). */
  avatar: string | null;
  company: CompanyInfo | null;
  updatedAt: string;
}

/** То, что уходит вместе с объявлением на сервер — без картинок. */
export interface SellerSnapshot {
  sellerType: SellerType;
  company: Omit<CompanyInfo, "logo"> | null;
}

export const PROFILE_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  aboutMax: 600,
  companyNameMin: 2,
  companyNameMax: 120,
  positionMax: 60,
  addressMax: 200,
  licenseMax: 40,
  websiteMax: 200,
  experienceMax: 60,
  imageMaxSide: 320,
  imageMaxBytes: 60 * 1024,
} as const;

export const PROFILE_STORAGE_KEY = "silkx:seller-profile:v1";
/** Событие в том же окне после сохранения (storage-событие срабатывает только в других вкладках). */
export const PROFILE_EVENT = "silkx:seller-profile";

export type ProfileField =
  | "sellerType" | "name" | "phone" | "telegram" | "about" | "experienceYears"
  | "companyName" | "companyPosition" | "companyPhone" | "companyWebsite" | "companyAddress" | "companyLicense" | "companyAbout";
export type ProfileErrors = Partial<Record<ProfileField, string>>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

export function normalizeWebsite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!url.hostname.includes(".")) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export type ProfileValidation =
  | { ok: true; data: Omit<SellerProfile, "avatar" | "updatedAt" | "company"> & { company: Omit<CompanyInfo, "logo"> | null } }
  | { ok: false; errors: ProfileErrors };

/** Валидирует «сырой» профиль. Компания обязательна только для риелтора/агентства. */
export function validateSellerProfile(raw: Record<string, unknown>): ProfileValidation {
  const e: ProfileErrors = {};
  const L = PROFILE_LIMITS;

  const sellerType = str(raw.sellerType);
  if (sellerType !== "owner" && sellerType !== "agent") e.sellerType = "Выберите, кто вы";

  const name = str(raw.name).replace(/\s+/g, " ");
  if (name.length < L.nameMin || name.length > L.nameMax) e.name = "Как к вам обращаться?";

  const phone = normalizeUzPhone(str(raw.phone));
  if (!phone) e.phone = "Номер в формате +998 90 123-45-67";

  const telegram = normalizeTelegram(str(raw.telegram));
  if (telegram === "") e.telegram = "Ник Telegram: 5–32 символа, латиница, цифры и _";

  const about = str(raw.about);
  if (about.length > L.aboutMax) e.about = `Максимум ${L.aboutMax} символов`;

  const expRaw = str(raw.experienceYears);
  const experienceYears = expRaw === "" ? null : Number(expRaw);
  if (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > L.experienceMax)) {
    e.experienceYears = "Укажите стаж целым числом лет";
  }

  let company: Omit<CompanyInfo, "logo"> | null = null;
  if (sellerType === "agent") {
    const c = (typeof raw.company === "object" && raw.company !== null ? raw.company : {}) as Record<string, unknown>;

    const cName = str(c.name).replace(/\s+/g, " ");
    if (cName.length < L.companyNameMin) e.companyName = "Укажите название компании (или «Частный риелтор»)";
    else if (cName.length > L.companyNameMax) e.companyName = `Максимум ${L.companyNameMax} символов`;

    const position = str(c.position);
    if (position.length > L.positionMax) e.companyPosition = `Максимум ${L.positionMax} символов`;

    const cPhoneRaw = str(c.phone);
    const cPhone = cPhoneRaw ? normalizeUzPhone(cPhoneRaw) : null;
    if (cPhoneRaw && !cPhone) e.companyPhone = "Номер в формате +998 71 123-45-67";

    const website = normalizeWebsite(str(c.website));
    if (website === "" || (website && website.length > L.websiteMax)) e.companyWebsite = "Например: silkx.uz";

    const address = str(c.address);
    if (address.length > L.addressMax) e.companyAddress = "Слишком длинный адрес";

    const license = str(c.license);
    if (license.length > L.licenseMax) e.companyLicense = `Максимум ${L.licenseMax} символов`;

    const cAbout = str(c.about);
    if (cAbout.length > L.aboutMax) e.companyAbout = `Максимум ${L.aboutMax} символов`;

    company = { name: cName, position, phone: cPhone, website: website || null, address, license, about: cAbout };
  }

  if (Object.keys(e).length > 0) return { ok: false, errors: e };

  return {
    ok: true,
    data: {
      sellerType: sellerType as SellerType,
      name,
      phone: phone as string,
      telegram: telegram || null,
      about,
      experienceYears,
      company,
    },
  };
}

/** Данные о продавце в объявлении (необязательны — старые клиенты шлют без них → «собственник»). */
export function parseSellerSnapshot(raw: unknown): { ok: true; data: SellerSnapshot } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: true, data: { sellerType: "owner", company: null } };
  const r = raw as Record<string, unknown>;
  if (r.sellerType !== "agent") return { ok: true, data: { sellerType: "owner", company: null } };
  // Имя/телефон берутся из контактов объявления — здесь проверяем только компанию.
  const res = validateSellerProfile({ sellerType: "agent", name: "xx", phone: "+998901234567", company: r.company });
  if (res.ok === false) return { ok: false, error: Object.values(res.errors)[0] ?? "Проверьте данные компании" };
  return { ok: true, data: { sellerType: "agent", company: res.data.company } };
}

// ---------------------------------------------------------------------------
// Хранение в браузере
// ---------------------------------------------------------------------------
export function loadSellerProfile(): SellerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SellerProfile;
    return p && (p.sellerType === "owner" || p.sellerType === "agent") && typeof p.name === "string" ? p : null;
  } catch {
    return null;
  }
}

export function saveSellerProfile(profile: SellerProfile): boolean {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event(PROFILE_EVENT));
    return true;
  } catch {
    return false; // квота / приватный режим
  }
}

export function clearSellerProfile(): void {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch {
    /* ignore */
  }
}

export function toSellerSnapshot(p: SellerProfile | null): SellerSnapshot {
  if (!p || p.sellerType !== "agent" || !p.company) return { sellerType: "owner", company: null };
  const { logo: _logo, ...company } = p.company;
  return { sellerType: "agent", company };
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}
