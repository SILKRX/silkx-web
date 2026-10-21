import { formatNumber } from "@/lib/format";
import { MOCK_PROPERTIES, getPropertyById } from "@/lib/mock-data";
import { assessCredit, fmtMln } from "@/lib/property-details";
import type { AssistantLang } from "@/lib/property-details";
import { TASHKENT_DISTRICTS } from "@/lib/types";
import type { Property } from "@/lib/types";

/**
 * Ответы без LLM (нет ANTHROPIC_API_KEY или API недоступен): распознаём намерение по ключевым словам
 * на 6 языках и отвечаем по тем же данным каталога. Не так гибко, как ИИ, но всегда по фактам.
 */

type Intent = "credit" | "student" | "rent" | "buy" | "foreign" | "other";

const KW: Array<[Intent, RegExp]> = [
  ["credit", /ипотек|кредит|рассроч|kredit|ipoteka|nasiya|mortgage|loan|installment|贷款|按揭|分期|대출|할부|kredi|taksit/i],
  ["student", /студент|универ|talaba|universitet|student|universit|学生|大学|학생|대학|öğrenci|üniversite/i],
  ["foreign", /иностран|китай|chet|xorij|xitoy|chinese|foreign|china|中国|外国|华人|외국|중국|yabancı|çin/i],
  ["rent", /аренд|снять|сним|ijara|rent|lease|租|월세|전세|임대|kira/i],
  ["buy", /куп|новостро|sotib|yangi uy|buy|purchase|new build|买|购|新房|구매|매매|분양|satın|almak|yeni konut/i],
];

const detect = (text: string): Intent => KW.find(([, re]) => re.test(text))?.[0] ?? "other";

const price = (p: Property) =>
  `${p.currency === "USD" ? "$" : ""}${formatNumber(p.price)}${p.currency === "UZS" ? " UZS" : ""}${
    p.type === "rent" ? (p.rentTerm === "day" ? "/day" : "/mo") : ""
  }`;

// Латиница для районов (для всех языков, кроме русского)
const DISTRICT_LATIN: Record<Property["district"], string> = {
  "mirzo-ulugbek": "Mirzo-Ulugbek",
  yunusabad: "Yunusabad",
  chilanzar: "Chilanzar",
  yakkasaray: "Yakkasaray",
  mirabad: "Mirabad",
  shaykhantahur: "Shaykhantahur",
  almazar: "Almazar",
  sergeli: "Sergeli",
  uchtepa: "Uchtepa",
  bektemir: "Bektemir",
  yashnabad: "Yashnabad",
  yangihayot: "Yangihayot",
};

const ROOMS_WORD: Record<AssistantLang, (n: number) => string> = {
  ru: (n) => (n === 0 ? "Студия" : `${n}-комн. квартира`),
  uz: (n) => (n === 0 ? "Studiya" : `${n} xonali kvartira`),
  en: (n) => (n === 0 ? "Studio" : `${n}-room apartment`),
  zh: (n) => (n === 0 ? "开间公寓" : `${n}居室公寓`),
  ko: (n) => (n === 0 ? "원룸" : `방 ${n}개 아파트`),
  tr: (n) => (n === 0 ? "Stüdyo daire" : `${n} odalı daire`),
};
const COMPLEX_WORD: Record<AssistantLang, string> = { ru: "ЖК", uz: "TJM", en: "", zh: "楼盘", ko: "단지", tr: "Site" };

const district = (p: Property, lang: AssistantLang = "ru") => (lang === "ru" ? TASHKENT_DISTRICTS[p.district] : DISTRICT_LATIN[p.district]);

/** Название объекта на языке ответа: у ЖК — латинское имя комплекса, у квартир — тип по комнатам. */
function localName(p: Property, lang: AssistantLang): string {
  if (lang === "ru") return p.title;
  const complex = /^ЖК\s+(.+)$/.exec(p.title)?.[1];
  if (complex) return [COMPLEX_WORD[lang], complex].filter(Boolean).join(" ").trim();
  return `${ROOMS_WORD[lang](p.rooms)}, ${p.areaM2} m²`;
}

interface Tpl {
  hello: string;
  noMatch: string;
  rentList: (items: string) => string;
  studentList: (items: string) => string;
  buyList: (items: string) => string;
  creditList: (items: string) => string;
  foreignList: (items: string) => string;
  creditOne: (name: string, verdict: string, down: string, monthly: string, installment: string) => string;
  rentOne: (name: string, priceText: string, terms: string) => string;
  verdict: Record<"yes" | "partly" | "no", string>;
  installment: (months: number, down: number) => string;
  rentTerms: (min: number, deposit: number, utilities: boolean, reg: boolean) => string;
  bankNote: string;
}

const T: Record<AssistantLang, Tpl> = {
  ru: {
    hello: "Здравствуйте! Я SILKX AI. Подберу квартиру для покупки или аренды, проверю, можно ли взять её в ипотеку, и расскажу об условиях для иностранцев. Что ищете?",
    noMatch: "Уточните, пожалуйста: покупка или аренда, район и бюджет? Ещё могу проверить ипотеку и условия для иностранцев.",
    rentList: (i) => `Сейчас свободны: ${i}. Хотите подробности по условиям аренды?`,
    studentList: (i) => `Студентам подойдут: ${i}. Лучше бронировать до сентября — цены растут.`,
    buyList: (i) => `Новостройки по прямым ценам застройщиков: ${i}.`,
    creditList: (i) => `Под ипотеку подходят: ${i}. Взнос от 25%, срок до 20 лет.`,
    foreignList: (i) => `Для иностранных клиентов, с WeChat и UnionPay: ${i}. Иностранцы могут купить новое жильё без вида на жительство.`,
    creditOne: (n, v, d, m, ins) => `${n}: ${v} Первый взнос около ${d} млн сум, платёж около ${m} млн сум в месяц на 20 лет.${ins}`,
    rentOne: (n, pr, t) => `${n}, ${pr}. ${t}`,
    verdict: { yes: "объект подходит под ипотеку.", partly: "ипотека возможна с оговорками.", no: "под ипотеку не подходит." },
    installment: (m, d) => ` Есть рассрочка от застройщика до ${m} месяцев с взносом от ${d}%.`,
    rentTerms: (min, dep, u, r) => `Минимальный срок ${min} мес., залог ${dep} мес., коммунальные ${u ? "включены" : "отдельно"}${r ? ", собственник поможет с регистрацией иностранца" : ""}.`,
    bankNote: " Окончательное решение принимает банк.",
  },
  uz: {
    hello: "Assalomu alaykum! Men SILKX AI. Sotib olish yoki ijara uchun uy topaman, ipotekaga mosligini tekshiraman va chet elliklar uchun shartlarni aytaman. Nima qidiryapsiz?",
    noMatch: "Iltimos, aniqlashtiring: sotib olish yoki ijara, tuman va byudjet? Ipoteka va chet elliklar uchun shartlarni ham tekshira olaman.",
    rentList: (i) => `Hozir bo'sh: ${i}. Ijara shartlari haqida batafsil aytaymi?`,
    studentList: (i) => `Talabalar uchun mos: ${i}. Sentyabrgacha band qilgan ma'qul — narxlar oshadi.`,
    buyList: (i) => `Quruvchidan to'g'ridan-to'g'ri narxlardagi yangi uylar: ${i}.`,
    creditList: (i) => `Ipotekaga mos: ${i}. Boshlang'ich to'lov 25% dan, muddat 20 yilgacha.`,
    foreignList: (i) => `Chet ellik mijozlar uchun, WeChat va UnionPay bilan: ${i}. Chet elliklar yangi uyni yashash ruxsatnomasisiz sotib olishi mumkin.`,
    creditOne: (n, v, d, m, ins) => `${n}: ${v} Boshlang'ich to'lov taxminan ${d} mln so'm, oylik to'lov taxminan ${m} mln so'm, 20 yilga.${ins}`,
    rentOne: (n, pr, t) => `${n}, ${pr}. ${t}`,
    verdict: { yes: "ipotekaga mos.", partly: "ipoteka shartli ravishda mumkin.", no: "ipotekaga mos emas." },
    installment: (m, d) => ` Quruvchidan ${m} oygacha muddatli to'lov bor, boshlang'ich to'lov ${d}% dan.`,
    rentTerms: (min, dep, u, r) => `Minimal muddat ${min} oy, garov ${dep} oy, kommunal to'lovlar ${u ? "narxga kiritilgan" : "alohida"}${r ? ", egasi chet ellikni ro'yxatdan o'tkazishga yordam beradi" : ""}.`,
    bankNote: " Yakuniy qarorni bank qabul qiladi.",
  },
  en: {
    hello: "Hello! I'm SILKX AI. I can find a home to buy or rent in Tashkent, check if it qualifies for a mortgage, and explain the rules for foreigners. What are you looking for?",
    noMatch: "Could you tell me: buying or renting, which district and your budget? I can also check mortgage eligibility and rules for foreigners.",
    rentList: (i) => `Available now: ${i}. Want the rental terms?`,
    studentList: (i) => `Good options for students: ${i}. Book before September — prices go up.`,
    buyList: (i) => `New developments at direct developer prices: ${i}.`,
    creditList: (i) => `Mortgage-eligible: ${i}. Down payment from 25%, up to 20 years.`,
    foreignList: (i) => `Best for international clients, with WeChat and UnionPay: ${i}. Foreigners can buy new housing without a residence permit.`,
    creditOne: (n, v, d, m, ins) => `${n}: ${v} Down payment about ${d} million sum, around ${m} million sum per month over 20 years.${ins}`,
    rentOne: (n, pr, t) => `${n}, ${pr}. ${t}`,
    verdict: { yes: "it qualifies for a mortgage.", partly: "a mortgage is possible with conditions.", no: "it doesn't qualify for a mortgage." },
    installment: (m, d) => ` The developer offers an installment plan up to ${m} months with ${d}% down.`,
    rentTerms: (min, dep, u, r) => `Minimum term ${min} months, deposit ${dep} month(s), utilities ${u ? "included" : "extra"}${r ? ", and the owner helps foreigners with registration" : ""}.`,
    bankNote: " The bank makes the final decision.",
  },
  zh: {
    hello: "您好！我是 SILKX AI。我可以帮您在塔什干找房（购房或租房），评估能否贷款，并介绍外国人购房规定。您在找什么样的房子？",
    noMatch: "请告诉我：购房还是租房？哪个区？预算多少？我也可以帮您评估贷款和外国人购房条件。",
    rentList: (i) => `目前可租：${i}。需要了解租赁条件吗？`,
    studentList: (i) => `适合学生的房源：${i}。建议九月前预订，届时价格会上涨。`,
    buyList: (i) => `开发商直售新房：${i}。`,
    creditList: (i) => `可申请按揭的房源：${i}。首付25%起，最长20年。`,
    foreignList: (i) => `适合外国客户，支持微信和银联：${i}。外国人无需居留许可即可购买新房。`,
    creditOne: (n, v, d, m, ins) => `${n}：${v}首付约${d}百万苏姆，20年期月供约${m}百万苏姆。${ins}`,
    rentOne: (n, pr, t) => `${n}，${pr}。${t}`,
    verdict: { yes: "符合按揭条件。", partly: "有条件地可以申请按揭。", no: "不符合按揭条件。" },
    installment: (m, d) => `开发商提供最长${m}个月分期，首付${d}%起，外国人也可使用。`,
    rentTerms: (min, dep, u, r) => `最短租期${min}个月，押金${dep}个月，水电费${u ? "已含" : "另付"}${r ? "，房东可协助外国人办理临时登记" : ""}。`,
    bankNote: "最终由银行审批。",
  },
  ko: {
    hello: "안녕하세요! SILKX AI입니다. 타슈켄트에서 매매·임대 주택을 찾아드리고, 대출 가능 여부와 외국인 구매 규정을 안내해 드립니다. 어떤 집을 찾으세요?",
    noMatch: "매매인지 임대인지, 지역과 예산을 알려주세요. 대출 가능 여부와 외국인 조건도 확인해 드릴 수 있어요.",
    rentList: (i) => `현재 임대 가능: ${i}. 임대 조건을 알려드릴까요?`,
    studentList: (i) => `학생에게 좋은 매물: ${i}. 9월 전에 예약하세요 — 가격이 오릅니다.`,
    buyList: (i) => `분양가 그대로의 신축: ${i}.`,
    creditList: (i) => `대출 가능 매물: ${i}. 계약금 25%부터, 최대 20년.`,
    foreignList: (i) => `외국인 고객용 매물: ${i}. 외국인은 거주허가 없이 신축 주택을 살 수 있습니다.`,
    creditOne: (n, v, d, m, ins) => `${n}: ${v} 계약금 약 ${d}백만 숨, 20년 기준 월 약 ${m}백만 숨입니다.${ins}`,
    rentOne: (n, pr, t) => `${n}, ${pr}. ${t}`,
    verdict: { yes: "대출 조건에 맞습니다.", partly: "조건부로 대출이 가능합니다.", no: "대출 조건에 맞지 않습니다." },
    installment: (m, d) => ` 시공사 할부: 최대 ${m}개월, 계약금 ${d}%부터.`,
    rentTerms: (min, dep, u, r) => `최소 ${min}개월, 보증금 ${dep}개월분, 공과금 ${u ? "포함" : "별도"}${r ? ", 집주인이 외국인 등록을 도와줍니다" : ""}.`,
    bankNote: " 최종 결정은 은행이 합니다.",
  },
  tr: {
    hello: "Merhaba! Ben SILKX AI. Taşkent'te satılık veya kiralık ev bulur, krediye uygunluğu kontrol eder ve yabancılar için kuralları anlatırım. Ne arıyorsunuz?",
    noMatch: "Lütfen belirtin: satın alma mı kiralama mı, hangi semt ve bütçe? Kredi uygunluğunu ve yabancılar için şartları da kontrol edebilirim.",
    rentList: (i) => `Şu an müsait: ${i}. Kira şartlarını anlatayım mı?`,
    studentList: (i) => `Öğrenciler için uygun: ${i}. Eylülden önce ayırtın — fiyatlar artıyor.`,
    buyList: (i) => `Müteahhitten doğrudan fiyatlı yeni konutlar: ${i}.`,
    creditList: (i) => `Krediye uygun: ${i}. Peşinat %25'ten, vade 20 yıla kadar.`,
    foreignList: (i) => `Yabancı müşteriler için uygun: ${i}. Yabancılar oturma izni olmadan yeni konut satın alabilir.`,
    creditOne: (n, v, d, m, ins) => `${n}: ${v} Peşinat yaklaşık ${d} milyon sum, 20 yıl vadede aylık yaklaşık ${m} milyon sum.${ins}`,
    rentOne: (n, pr, t) => `${n}, ${pr}. ${t}`,
    verdict: { yes: "krediye uygun.", partly: "kredi şartlı olarak mümkün.", no: "krediye uygun değil." },
    installment: (m, d) => ` Müteahhit ${m} aya kadar taksit sunuyor, peşinat %${d}'den.`,
    rentTerms: (min, dep, u, r) => `En az ${min} ay, depozito ${dep} ay, faturalar ${u ? "dahil" : "ayrı"}${r ? ", ev sahibi yabancı kaydında yardımcı oluyor" : ""}.`,
    bankNote: " Nihai kararı banka verir.",
  },
};

const short = (p: Property, lang: AssistantLang) => `${localName(p, lang)} (${district(p, lang)}, ${price(p)})`;

export function fallbackReply(text: string, lang: AssistantLang, currentId: string | null): { reply: string; ids: string[] } {
  const t = T[lang];
  const intent = detect(text);
  const current = currentId ? getPropertyById(currentId) : null;
  const available = MOCK_PROPERTIES.filter((p) => p.status !== "reserved");

  // Вопрос про объект, который пользователь сейчас смотрит
  const aboutCurrent =
    current &&
    (intent === "credit" ||
      intent === "other" ||
      intent === "foreign" ||
      (intent === "rent" && current.type === "rent") ||
      (intent === "buy" && current.type === "sale"));
  if (current && aboutCurrent) {
    if (current.type === "sale") {
      const c = assessCredit(current);
      if (c) {
        const ins = c.installment ? t.installment(c.installment.months, c.installment.downPct) : "";
        return {
          reply: t.creditOne(localName(current, lang), t.verdict[c.verdict], fmtMln(c.calc.downPaymentUzs), fmtMln(c.calc.monthlyUzs), ins) + t.bankNote,
          ids: [current.id],
        };
      }
    } else if (current.details?.rent) {
      const r = current.details.rent;
      return { reply: t.rentOne(localName(current, lang), price(current), t.rentTerms(r.minTermMonths, r.depositMonths, r.utilitiesIncluded, r.registrationHelp)), ids: [current.id] };
    }
  }

  const pickIds = (list: Property[]) => list.slice(0, 3);
  let list: Property[] = [];
  let build: ((items: string) => string) | null = null;

  switch (intent) {
    case "credit":
      list = available.filter((p) => assessCredit(p)?.verdict === "yes");
      build = t.creditList;
      break;
    case "student":
      list = available.filter((p) => p.type === "rent" && (p.details?.rent?.students || p.details?.nearby?.some((n) => n.kind === "university")));
      build = t.studentList;
      break;
    case "foreign":
      list = available.filter((p) => p.details?.international?.languages.includes("zh") || p.details?.international?.wechat);
      build = t.foreignList;
      break;
    case "rent":
      list = available.filter((p) => p.type === "rent").sort((a, b) => a.price - b.price);
      build = t.rentList;
      break;
    case "buy":
      list = available.filter((p) => p.type === "sale").sort((a, b) => a.price - b.price);
      build = t.buyList;
      break;
    default:
      return { reply: text.trim().length < 12 ? t.hello : t.noMatch, ids: [] };
  }

  const top = pickIds(list);
  if (!top.length || !build) return { reply: t.noMatch, ids: [] };
  return { reply: build(top.map((p) => short(p, lang)).join("; ")) + (intent === "credit" ? t.bankNote : ""), ids: top.map((p) => p.id) };
}
