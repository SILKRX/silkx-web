import type { Property } from "@/lib/types";

/**
 * Подробные характеристики объекта + правила «можно ли купить в кредит».
 * Один источник правды для страницы объекта, формы размещения и AI-ассистента.
 */

export const ASSISTANT_LANGS = ["uz", "ru", "en", "zh", "ko", "tr"] as const;
export type AssistantLang = (typeof ASSISTANT_LANGS)[number];

export const LANG_LABELS: Record<AssistantLang, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
  zh: "中文",
  ko: "한국어",
  tr: "Türkçe",
};

export type Renovation = "none" | "basic" | "euro" | "designer";
export type Heating = "central" | "gas-boiler" | "electric";
export type Parking = "underground" | "yard" | "none";
export type Material = "monolith" | "brick" | "panel";
export type NearbyKind = "metro" | "university" | "school" | "park" | "mall" | "hospital" | "bazaar" | "chinese" | "business";
export type Payment = "cash" | "card-uz" | "visa" | "unionpay" | "alipay" | "wechatpay" | "swift";

export interface PropertyDetails {
  building?: {
    yearBuilt?: number;
    /** Год ввода в эксплуатацию (для правила «иностранцы — только новое жильё»). */
    commissionedYear?: number;
    material?: Material;
    floors?: number;
    elevator?: boolean;
    parking?: Parking;
    ceilingM?: number;
    security?: boolean;
  };
  utilities?: {
    heating?: Heating;
    gas?: boolean;
    hotWater?: "central" | "boiler";
    internet?: boolean;
    ac?: boolean;
  };
  interior?: {
    renovation?: Renovation;
    furnished?: boolean;
    appliances?: string[];
    balcony?: boolean;
    view?: string;
    /** Окна выходят на юг и т.п. — важно для многих покупателей из Китая (фэн-шуй, свет). */
    windowsFacing?: "S" | "SE" | "SW" | "E" | "W" | "N" | "NE" | "NW";
  };
  nearby?: { kind: NearbyKind; name: string; minutes: number; walk?: boolean }[];
  rent?: {
    minTermMonths: number;
    depositMonths: number;
    prepayMonths: number;
    utilitiesIncluded: boolean;
    /** Помощь с временной регистрацией иностранца по месту пребывания. */
    registrationHelp: boolean;
    pets: boolean;
    kids: boolean;
    students?: boolean;
    contract: "notarized" | "simple";
  };
  sale?: {
    market: "primary" | "secondary";
    documents: {
      /** Кадастровый паспорт / право собственности (вторичка) или разрешение на строительство (новостройка). */
      title: boolean;
      encumbrance: "none" | "pledge" | "unknown";
    };
    /** Застройщик/объект аккредитован банками-партнёрами по ипотеке. */
    bankAccredited?: boolean;
    partnerBanks?: string[];
    installment?: { months: number; downPct: number; interestFree: boolean };
  };
  international?: {
    languages: AssistantLang[];
    wechat?: string;
    payments?: Payment[];
    notes?: string;
  };
}

// ---------------------------------------------------------------------------------------------
// Подписи для UI (RU — основной язык сайта; китайские дублируются там, где важно)
// ---------------------------------------------------------------------------------------------
export const RENOVATION_LABEL: Record<Renovation, string> = {
  none: "Без ремонта (черновая)",
  basic: "Косметический",
  euro: "Евроремонт",
  designer: "Дизайнерский",
};
export const HEATING_LABEL: Record<Heating, string> = {
  central: "Центральное",
  "gas-boiler": "Газовый котёл",
  electric: "Электрическое",
};
export const PARKING_LABEL: Record<Parking, string> = {
  underground: "Подземный паркинг",
  yard: "Во дворе",
  none: "Нет",
};
export const MATERIAL_LABEL: Record<Material, string> = {
  monolith: "Монолит",
  brick: "Кирпич",
  panel: "Панель",
};
export const NEARBY_LABEL: Record<NearbyKind, string> = {
  metro: "Метро",
  university: "Университет",
  school: "Школа",
  park: "Парк",
  mall: "ТРЦ",
  hospital: "Клиника",
  bazaar: "Базар",
  chinese: "Китайский район / 中餐",
  business: "Деловой центр",
};
export const PAYMENT_LABEL: Record<Payment, string> = {
  cash: "Наличные",
  "card-uz": "Uzcard / Humo",
  visa: "Visa / Mastercard",
  unionpay: "UnionPay 银联",
  alipay: "Alipay 支付宝",
  wechatpay: "WeChat Pay 微信支付",
  swift: "SWIFT-перевод",
};
export const FACING_LABEL: Record<NonNullable<NonNullable<PropertyDetails["interior"]>["windowsFacing"]>, string> = {
  S: "Юг · 朝南",
  SE: "Юго-восток · 东南",
  SW: "Юго-запад · 西南",
  E: "Восток · 朝东",
  W: "Запад · 朝西",
  N: "Север · 朝北",
  NE: "Северо-восток · 东北",
  NW: "Северо-запад · 西北",
};

// ---------------------------------------------------------------------------------------------
// Правила кредитования (обновлять при смене условий банков). Источник: условия ипотеки на
// первичном рынке (Указ УП-26, 2025): взнос от 25%, срок до 20 лет, до 800 млн сум в Ташкенте,
// ставка ≈ ставка ЦБ + маржа, DTI ≤ 50%, заёмщик — гражданин РУз 18–60 лет.
// ---------------------------------------------------------------------------------------------
export const CREDIT_RULES = {
  minDownPct: 25,
  maxTermYears: 20,
  maxLoanUzsTashkent: 800_000_000,
  approxRatePct: 19.5,
  maxDtiPct: 50,
  borrowerAge: [18, 60] as const,
  /** Ориентировочный курс для расчётов на сайте. Обновляйте раз в месяц. */
  usdToUzs: 12_700,
  /** Иностранцы покупают только «новое» жильё: строящееся или введённое не более 3 лет назад. */
  foreignerNewBuildYears: 3,
} as const;

export type CriterionStatus = "pass" | "fail" | "unknown";

export interface Criterion {
  id: string;
  label: string;
  status: CriterionStatus;
  hint: string;
}

export interface CreditAssessment {
  verdict: "yes" | "partly" | "no";
  headline: string;
  criteria: Criterion[];
  calc: {
    priceUzs: number;
    downPaymentUzs: number;
    loanUzs: number;
    monthlyUzs: number;
    /** Максимальная цена, при которой кредит укладывается в лимит. */
    maxPriceUzs: number;
  };
  installment?: { months: number; downPct: number; interestFree: boolean };
  foreigners: { canBuy: CriterionStatus; text: string };
}

const toUzs = (p: Property) => (p.currency === "UZS" ? p.price : p.price * CREDIT_RULES.usdToUzs);

/** Аннуитетный платёж. */
export function monthlyPayment(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function assessCredit(p: Property, now = new Date()): CreditAssessment | null {
  if (p.type !== "sale") return null;
  const d = p.details;
  const sale = d?.sale;
  const R = CREDIT_RULES;

  const priceUzs = toUzs(p);
  const downPaymentUzs = Math.ceil((priceUzs * R.minDownPct) / 100);
  const loanUzs = Math.max(0, priceUzs - downPaymentUzs);
  const maxPriceUzs = Math.floor(R.maxLoanUzsTashkent / (1 - R.minDownPct / 100));

  const criteria: Criterion[] = [];

  criteria.push({
    id: "market",
    label: "Первичный рынок (новостройка)",
    status: !sale ? "unknown" : sale.market === "primary" ? "pass" : "fail",
    hint:
      sale?.market === "secondary"
        ? "Льготная программа — только для новостроек. По вторичке — коммерческая ипотека отдельных банков, уточняйте."
        : "Ипотека по госпрограмме выдаётся на жильё на первичном рынке.",
  });

  criteria.push({
    id: "accredited",
    label: "Застройщик работает с банками-партнёрами",
    status: sale?.bankAccredited === undefined ? "unknown" : sale.bankAccredited ? "pass" : "fail",
    hint: sale?.partnerBanks?.length ? `Банки: ${sale.partnerBanks.join(", ")}` : "Уточняем у застройщика список банков.",
  });

  criteria.push({
    id: "limit",
    label: `Сумма кредита до ${(R.maxLoanUzsTashkent / 1_000_000).toFixed(0)} млн сум (Ташкент)`,
    status: loanUzs <= R.maxLoanUzsTashkent ? "pass" : "fail",
    hint:
      loanUzs <= R.maxLoanUzsTashkent
        ? `Нужно ≈ ${fmtMln(loanUzs)} млн сум кредита при взносе ${R.minDownPct}%.`
        : `Кредит ≈ ${fmtMln(loanUzs)} млн сум больше лимита — нужен взнос больше ${R.minDownPct}% (≈ ${fmtMln(priceUzs - R.maxLoanUzsTashkent)} млн сум).`,
  });

  criteria.push({
    id: "title",
    label: "Документы в порядке (разрешение / право собственности)",
    status: !sale ? "unknown" : sale.documents.title ? "pass" : "fail",
    hint: "Банк проверяет разрешение на строительство (новостройка) или кадастровый паспорт (вторичка).",
  });

  criteria.push({
    id: "encumbrance",
    label: "Без обременений (залог, арест)",
    status: !sale || sale.documents.encumbrance === "unknown" ? "unknown" : sale.documents.encumbrance === "none" ? "pass" : "fail",
    hint: "Объект в залоге у другого банка нельзя повторно оформить в ипотеку до снятия залога.",
  });

  const objectFails = criteria.filter((c) => c.status === "fail");
  const objectUnknown = criteria.filter((c) => c.status === "unknown");

  // Требования к покупателю — информационно (зависят от человека, а не от объекта)
  criteria.push({
    id: "borrower",
    label: `Покупатель: гражданин РУз ${R.borrowerAge[0]}–${R.borrowerAge[1]} лет, платежи ≤ ${R.maxDtiPct}% дохода`,
    status: "unknown",
    hint: `Платёж ≈ ${fmtMln(monthlyPayment(loanUzs, R.approxRatePct, R.maxTermYears))} млн сум/мес → нужен подтверждённый доход от ≈ ${fmtMln(
      (monthlyPayment(loanUzs, R.approxRatePct, R.maxTermYears) * 100) / R.maxDtiPct,
    )} млн сум/мес.`,
  });

  const verdict: CreditAssessment["verdict"] = objectFails.length > 0 ? (sale?.installment ? "partly" : "no") : objectUnknown.length > 0 ? "partly" : "yes";

  const headline =
    verdict === "yes"
      ? "Объект подходит под ипотеку"
      : verdict === "partly"
        ? sale?.installment && objectFails.length
          ? "Ипотека — с ограничениями, но есть рассрочка от застройщика"
          : "Скорее подходит — часть данных уточняется"
        : "Ипотека на этот объект не подходит";

  // Иностранцы: только новое жильё (строящееся или введённое ≤ 3 лет назад), без земли
  const commissioned = d?.building?.commissionedYear;
  const isNew =
    sale?.market === "primary" || (commissioned !== undefined && now.getFullYear() - commissioned <= R.foreignerNewBuildYears);
  const foreigners: CreditAssessment["foreigners"] = {
    canBuy: !sale && commissioned === undefined ? "unknown" : isNew ? "pass" : "fail",
    text: isNew
      ? "Иностранцы из стран утверждённого списка могут купить этот объект без вида на жительство (новое жильё). Оплата — наличными или рассрочкой застройщика; ипотека банков обычно только для граждан РУз."
      : "Иностранцы покупают только новое жильё (строящееся или введённое не более 3 лет назад). Этот объект под правило не подходит — подойдёт аренда.",
  };

  return {
    verdict,
    headline,
    criteria,
    calc: {
      priceUzs,
      downPaymentUzs,
      loanUzs,
      monthlyUzs: Math.round(monthlyPayment(loanUzs, R.approxRatePct, R.maxTermYears)),
      maxPriceUzs,
    },
    installment: sale?.installment,
    foreigners,
  };
}

export function fmtMln(uzs: number): string {
  return (uzs / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: uzs < 10_000_000 ? 1 : 0 });
}

/** Короткое текстовое описание объекта для AI-ассистента (без лишних токенов). */
export function propertyToContext(p: Property): string {
  const d = p.details;
  const parts: string[] = [
    `id=${p.id}`,
    `${p.type === "sale" ? "SALE" : p.rentTerm === "day" ? "RENT/day" : "RENT/month"}`,
    p.title,
    `district=${p.district}`,
    p.address ? `address=${p.address}` : "",
    `price=${p.price} ${p.currency}${p.type === "sale" ? " (from)" : p.rentTerm === "day" ? "/day" : "/month"}`,
    `rooms=${p.rooms === 0 ? "studio" : p.rooms}`,
    `area=${p.areaM2}m2`,
    p.tags.length ? `tags=${p.tags.join("; ")}` : "",
    p.tour?.length ? "3D tour: yes" : "",
  ];
  if (d?.building) parts.push(`building=${JSON.stringify(d.building)}`);
  if (d?.utilities) parts.push(`utilities=${JSON.stringify(d.utilities)}`);
  if (d?.interior) parts.push(`interior=${JSON.stringify(d.interior)}`);
  if (d?.nearby?.length) parts.push(`nearby=${d.nearby.map((n) => `${n.kind}:${n.name} ${n.minutes}min${n.walk ? " walk" : ""}`).join(", ")}`);
  if (d?.rent) parts.push(`rentTerms=${JSON.stringify(d.rent)}`);
  if (d?.sale) parts.push(`saleTerms=${JSON.stringify(d.sale)}`);
  if (d?.international) parts.push(`international=${JSON.stringify(d.international)}`);
  const credit = assessCredit(p);
  if (credit) {
    parts.push(
      `credit=${credit.verdict} (${credit.headline}); down25%=${fmtMln(credit.calc.downPaymentUzs)}mln UZS; loan=${fmtMln(
        credit.calc.loanUzs,
      )}mln UZS; monthly≈${fmtMln(credit.calc.monthlyUzs)}mln UZS/20y; failing=${credit.criteria
        .filter((c) => c.status === "fail")
        .map((c) => c.id)
        .join(",") || "none"}; foreignersCanBuy=${credit.foreigners.canBuy}`,
    );
  }
  return parts.filter(Boolean).join(" | ");
}
