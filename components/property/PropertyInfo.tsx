import {
  BadgeCheck,
  Bus,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Globe,
  GraduationCap,
  Hospital,
  Landmark,
  MessageCircle,
  ShoppingBag,
  Store,
  Trees,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  CREDIT_RULES,
  FACING_LABEL,
  HEATING_LABEL,
  LANG_LABELS,
  MATERIAL_LABEL,
  NEARBY_LABEL,
  PARKING_LABEL,
  PAYMENT_LABEL,
  RENOVATION_LABEL,
  assessCredit,
  fmtMln,
} from "@/lib/property-details";
import type { CriterionStatus, NearbyKind } from "@/lib/property-details";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

const NEARBY_ICON: Record<NearbyKind, LucideIcon> = {
  metro: Bus,
  university: GraduationCap,
  school: GraduationCap,
  park: Trees,
  mall: ShoppingBag,
  hospital: Hospital,
  bazaar: Store,
  chinese: Utensils,
  business: Landmark,
};

const yesNo = (v: boolean | undefined) => (v === undefined ? undefined : v ? "Да" : "Нет");

function Section({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      {eyebrow && <p className="text-xs font-medium uppercase tracking-wider text-gold">{eyebrow}</p>}
      <h2 id={id} className="mt-1 text-xl sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: Array<[string, string | number | undefined]> }) {
  const visible = rows.filter((r): r is [string, string | number] => r[1] !== undefined && r[1] !== "");
  if (!visible.length) return null;
  return (
    <dl className="terminal-panel divide-y divide-white/5">
      {visible.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-body">{k}</dt>
          <dd className="text-right font-medium text-heading">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const STATUS_UI: Record<CriterionStatus, { icon: LucideIcon; cls: string; label: string }> = {
  pass: { icon: CircleCheck, cls: "text-success", label: "Да" },
  fail: { icon: CircleX, cls: "text-destructive", label: "Нет" },
  unknown: { icon: CircleHelp, cls: "text-gold", label: "Уточняется" },
};

/** Все подробности объекта. Блоки без данных не показываются. */
export function PropertyInfo({ property: p }: { property: Property }) {
  const d = p.details;
  const credit = assessCredit(p);

  return (
    <>
      {/* ---------- Подробно об объекте ---------- */}
      {d && (d.building || d.utilities || d.interior) && (
        <Section id="details-title" eyebrow="Характеристики" title="Подробно об объекте">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-body">Дом</h3>
              <Rows
                rows={[
                  ["Год постройки / сдачи", d.building?.yearBuilt],
                  ["Материал", d.building?.material && MATERIAL_LABEL[d.building.material]],
                  ["Этажей", d.building?.floors],
                  ["Лифт", yesNo(d.building?.elevator)],
                  ["Парковка", d.building?.parking && PARKING_LABEL[d.building.parking]],
                  ["Потолки", d.building?.ceilingM && `${d.building.ceilingM} м`],
                  ["Охрана / консьерж", yesNo(d.building?.security)],
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-body">Коммуникации</h3>
              <Rows
                rows={[
                  ["Отопление", d.utilities?.heating && HEATING_LABEL[d.utilities.heating]],
                  ["Газ", yesNo(d.utilities?.gas)],
                  ["Горячая вода", d.utilities?.hotWater && (d.utilities.hotWater === "central" ? "Центральная" : "Бойлер")],
                  ["Интернет", yesNo(d.utilities?.internet)],
                  ["Кондиционер", yesNo(d.utilities?.ac)],
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-body">Квартира</h3>
              <Rows
                rows={[
                  ["Ремонт", d.interior?.renovation && RENOVATION_LABEL[d.interior.renovation]],
                  ["Мебель", yesNo(d.interior?.furnished)],
                  ["Балкон / терраса", yesNo(d.interior?.balcony)],
                  ["Окна", d.interior?.windowsFacing && FACING_LABEL[d.interior.windowsFacing]],
                  ["Вид", d.interior?.view],
                ]}
              />
              {d.interior?.appliances?.length ? (
                <p className="mt-2 text-xs text-body">Техника: {d.interior.appliances.join(", ")}</p>
              ) : null}
            </div>
          </div>
        </Section>
      )}

      {/* ---------- Рядом ---------- */}
      {d?.nearby?.length ? (
        <Section id="nearby-title" eyebrow="Инфраструктура" title="Что рядом">
          <ul className="grid gap-3 sm:grid-cols-2">
            {d.nearby.map((n) => {
              const Icon = NEARBY_ICON[n.kind];
              return (
                <li key={`${n.kind}-${n.name}`} className="terminal-panel flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-muted">
                    <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-heading">{n.name}</p>
                    <p className="text-xs text-body">{NEARBY_LABEL[n.kind]}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gold">
                    {n.minutes} мин{n.walk ? " пешком" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {/* ---------- Условия долгосрочной аренды ---------- */}
      {p.type === "rent" && d?.rent && (
        <Section id="rent-title" eyebrow={p.rentTerm === "day" ? "Посуточно" : "Долгосрочная аренда"} title="Условия аренды">
          <div className="grid gap-4 md:grid-cols-2">
            <Rows
              rows={[
                ["Минимальный срок", `${d.rent.minTermMonths} мес.`],
                ["Залог", d.rent.depositMonths ? `${d.rent.depositMonths} мес. аренды` : "Без залога"],
                ["Предоплата", `${d.rent.prepayMonths} мес.`],
                ["Коммунальные", d.rent.utilitiesIncluded ? "Включены в цену" : "Оплачиваются отдельно"],
                ["Договор", d.rent.contract === "notarized" ? "Нотариальный" : "Простой письменный"],
              ]}
            />
            <Rows
              rows={[
                ["Можно с детьми", yesNo(d.rent.kids)],
                ["Можно с животными", yesNo(d.rent.pets)],
                ["Подходит студентам", d.rent.students ? "Да" : undefined],
                ["Помощь с регистрацией иностранца", yesNo(d.rent.registrationHelp)],
              ]}
            />
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-body">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
            Иностранцы обязаны оформить временную регистрацию по месту пребывания. Уточните у собственника, кто её оформляет.
          </p>
        </Section>
      )}

      {/* ---------- Можно ли купить в кредит ---------- */}
      {credit && (
        <Section id="credit-title" eyebrow="Ипотека и рассрочка" title="Можно ли купить в кредит?">
          <div
            className={cn(
              "terminal-panel flex items-start gap-3 border p-4",
              credit.verdict === "yes" ? "border-success/40" : credit.verdict === "partly" ? "border-gold/40" : "border-destructive/40",
            )}
          >
            {credit.verdict === "yes" ? (
              <BadgeCheck className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />
            ) : credit.verdict === "partly" ? (
              <CircleAlert className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
            ) : (
              <CircleX className="h-6 w-6 shrink-0 text-destructive" aria-hidden="true" />
            )}
            <div>
              <p className="font-heading text-lg font-semibold text-heading">{credit.headline}</p>
              <p className="mt-1 text-sm">
                Взнос от {CREDIT_RULES.minDownPct}% ≈ <b className="text-heading">{fmtMln(credit.calc.downPaymentUzs)} млн сум</b> · кредит ≈{" "}
                <b className="text-heading">{fmtMln(credit.calc.loanUzs)} млн сум</b> · платёж ≈{" "}
                <b className="text-heading">{fmtMln(credit.calc.monthlyUzs)} млн сум/мес</b> на {CREDIT_RULES.maxTermYears} лет под ~
                {CREDIT_RULES.approxRatePct}%
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {credit.criteria.map((c) => {
              const ui = STATUS_UI[c.status];
              return (
                <li key={c.id} className="terminal-panel flex items-start gap-3 p-4">
                  <ui.icon className={cn("mt-0.5 h-5 w-5 shrink-0", ui.cls)} aria-label={ui.label} />
                  <div>
                    <p className="text-sm font-medium text-heading">{c.label}</p>
                    <p className="mt-0.5 text-xs text-body">{c.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {credit.installment && (
            <div className="terminal-panel mt-4 flex items-start gap-3 p-4">
              <Wallet className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <p className="text-sm">
                <b className="text-heading">Рассрочка от застройщика:</b> до {credit.installment.months} мес., взнос от {credit.installment.downPct}%
                {credit.installment.interestFree ? ", без процентов" : ""}. Доступна и иностранцам.
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-body">
            Расчёт ориентировочный (курс ≈ {CREDIT_RULES.usdToUzs.toLocaleString("ru-RU")} сум/$, условия госпрограммы на первичном рынке).
            Окончательное решение принимает банк.
          </p>
        </Section>
      )}

      {/* ---------- Иностранным покупателям / 外国客户 ---------- */}
      {d?.international && (
        <Section id="intl-title" eyebrow="For international clients · 外国客户" title="Иностранцам">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="terminal-panel space-y-3 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-heading">
                <Globe className="h-4 w-4 text-gold" aria-hidden="true" />
                Языки общения · 服务语言
              </p>
              <ul className="flex flex-wrap gap-2">
                {d.international.languages.map((l) => (
                  <li key={l} className="rounded-md bg-gold-muted px-2.5 py-1 text-xs font-medium text-gold">
                    {LANG_LABELS[l]}
                  </li>
                ))}
              </ul>
              {d.international.wechat && (
                <p className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gold" aria-hidden="true" />
                  WeChat 微信: <b className="text-heading">{d.international.wechat}</b>
                </p>
              )}
              {d.international.payments?.length ? (
                <p>
                  <span className="text-body">Оплата · 付款方式: </span>
                  <span className="text-heading">{d.international.payments.map((x) => PAYMENT_LABEL[x]).join(", ")}</span>
                </p>
              ) : null}
            </div>

            <div className="terminal-panel space-y-2 p-4 text-sm">
              {credit ? (
                <>
                  <p className="font-medium text-heading">Покупка иностранцем · 外国人购房</p>
                  <p className="flex items-start gap-2">
                    {(() => {
                      const ui = STATUS_UI[credit.foreigners.canBuy];
                      return <ui.icon className={cn("mt-0.5 h-4 w-4 shrink-0", ui.cls)} aria-hidden="true" />;
                    })()}
                    {credit.foreigners.text}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-heading">Аренда для иностранцев · 外国人租房</p>
                  <p>
                    {d.rent?.registrationHelp
                      ? "Собственник помогает с временной регистрацией — можно заселяться сразу."
                      : "Временную регистрацию нужно оформить самостоятельно — поможем подсказать, как."}
                  </p>
                </>
              )}
              {d.interior?.windowsFacing && (
                <p className="text-body">
                  Окна · 朝向: <span className="text-heading">{FACING_LABEL[d.interior.windowsFacing]}</span>
                </p>
              )}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

export default PropertyInfo;
