"use client";

import type { ReactNode } from "react";

import { NativeSelect } from "@/components/ui/native-select";
import { ASSISTANT_LANGS, FACING_LABEL, HEATING_LABEL, LANG_LABELS, PARKING_LABEL, PAYMENT_LABEL, RENOVATION_LABEL } from "@/lib/property-details";
import type { Payment } from "@/lib/property-details";
import type { DealType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Значение формы «Подробности» — плоское, чтобы удобно хранить в state и валидировать. */
export interface DetailsForm {
  renovation: string;
  furnished: boolean;
  heating: string;
  parking: string;
  elevator: boolean;
  ac: boolean;
  windowsFacing: string;
  // аренда
  minTermMonths: string;
  depositMonths: string;
  utilitiesIncluded: boolean;
  registrationHelp: boolean;
  pets: boolean;
  kids: boolean;
  students: boolean;
  // продажа
  market: "primary" | "secondary";
  titleDocs: boolean;
  encumbrance: "none" | "pledge" | "unknown";
  installment: boolean;
  installmentMonths: string;
  installmentDownPct: string;
  // иностранцам
  languages: string[];
  wechat: string;
  payments: string[];
}

export const EMPTY_DETAILS: DetailsForm = {
  renovation: "",
  furnished: false,
  heating: "",
  parking: "",
  elevator: false,
  ac: false,
  windowsFacing: "",
  minTermMonths: "",
  depositMonths: "",
  utilitiesIncluded: false,
  registrationHelp: false,
  pets: false,
  kids: true,
  students: false,
  market: "primary",
  titleDocs: false,
  encumbrance: "unknown",
  installment: false,
  installmentMonths: "",
  installmentDownPct: "",
  languages: ["ru", "uz"],
  wechat: "",
  payments: ["cash"],
};

const INTL_PAYMENTS: Payment[] = ["cash", "card-uz", "visa", "unionpay", "alipay", "wechatpay", "swift"];

export function ListingDetailsFields({
  value,
  onChange,
  dealType,
}: {
  value: DetailsForm;
  onChange: (v: DetailsForm) => void;
  dealType: DealType;
}) {
  const set = <K extends keyof DetailsForm>(k: K, v: DetailsForm[K]) => onChange({ ...value, [k]: v });
  const toggleIn = (k: "languages" | "payments", item: string) =>
    set(k, value[k].includes(item) ? value[k].filter((x) => x !== item) : [...value[k], item]);

  return (
    <div className="space-y-6">
      {/* Квартира и дом */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Ремонт" value={value.renovation} onChange={(v) => set("renovation", v)} options={RENOVATION_LABEL} />
        <Select label="Отопление" value={value.heating} onChange={(v) => set("heating", v)} options={HEATING_LABEL} />
        <Select label="Парковка" value={value.parking} onChange={(v) => set("parking", v)} options={PARKING_LABEL} />
        <Select label="Окна выходят на" value={value.windowsFacing} onChange={(v) => set("windowsFacing", v)} options={FACING_LABEL} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip on={value.furnished} onClick={() => set("furnished", !value.furnished)}>С мебелью</Chip>
        <Chip on={value.elevator} onClick={() => set("elevator", !value.elevator)}>Лифт</Chip>
        <Chip on={value.ac} onClick={() => set("ac", !value.ac)}>Кондиционер</Chip>
      </div>

      {/* Аренда */}
      {dealType === "rent" && (
        <fieldset className="space-y-3 rounded-lg border border-line/10 p-4">
          <legend className="px-1 text-sm font-semibold text-heading">Условия аренды</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Минимальный срок, мес." value={value.minTermMonths} onChange={(v) => set("minTermMonths", v)} placeholder="6" />
            <NumberField label="Залог, мес. аренды" value={value.depositMonths} onChange={(v) => set("depositMonths", v)} placeholder="1" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip on={value.utilitiesIncluded} onClick={() => set("utilitiesIncluded", !value.utilitiesIncluded)}>Коммунальные включены</Chip>
            <Chip on={value.kids} onClick={() => set("kids", !value.kids)}>Можно с детьми</Chip>
            <Chip on={value.pets} onClick={() => set("pets", !value.pets)}>Можно с животными</Chip>
            <Chip on={value.students} onClick={() => set("students", !value.students)}>Студентам</Chip>
            <Chip on={value.registrationHelp} onClick={() => set("registrationHelp", !value.registrationHelp)}>Помогу с регистрацией иностранца</Chip>
          </div>
        </fieldset>
      )}

      {/* Продажа: кредит */}
      {dealType === "sale" && (
        <fieldset className="space-y-3 rounded-lg border border-line/10 p-4">
          <legend className="px-1 text-sm font-semibold text-heading">Документы и кредит — покажем покупателю, подходит ли объект под ипотеку</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Рынок"
              value={value.market}
              onChange={(v) => set("market", v === "secondary" ? "secondary" : "primary")}
              options={{ primary: "Новостройка (первичка)", secondary: "Вторичное жильё" }}
              allowEmpty={false}
            />
            <Select
              label="Обременения (залог, арест)"
              value={value.encumbrance}
              onChange={(v) => set("encumbrance", v === "none" || v === "pledge" ? v : "unknown")}
              options={{ none: "Нет", pledge: "Есть залог", unknown: "Не знаю" }}
              allowEmpty={false}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip on={value.titleDocs} onClick={() => set("titleDocs", !value.titleDocs)}>
              {value.market === "primary" ? "Есть разрешение на строительство" : "Есть кадастровый паспорт"}
            </Chip>
            <Chip on={value.installment} onClick={() => set("installment", !value.installment)}>Есть рассрочка</Chip>
          </div>
          {value.installment && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Рассрочка, мес." value={value.installmentMonths} onChange={(v) => set("installmentMonths", v)} placeholder="24" />
              <NumberField label="Первый взнос, %" value={value.installmentDownPct} onChange={(v) => set("installmentDownPct", v)} placeholder="30" />
            </div>
          )}
        </fieldset>
      )}

      {/* Иностранцам */}
      <fieldset className="space-y-3 rounded-lg border border-line/10 p-4">
        <legend className="px-1 text-sm font-semibold text-heading">Для иностранцев · 外国客户</legend>
        <p className="text-xs text-body">На каких языках вы (или ваш агент) можете общаться</p>
        <div className="flex flex-wrap gap-2">
          {ASSISTANT_LANGS.map((l) => (
            <Chip key={l} on={value.languages.includes(l)} onClick={() => toggleIn("languages", l)}>
              {LANG_LABELS[l]}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-body">Способы оплаты</p>
        <div className="flex flex-wrap gap-2">
          {INTL_PAYMENTS.map((p) => (
            <Chip key={p} on={value.payments.includes(p)} onClick={() => toggleIn("payments", p)}>
              {PAYMENT_LABEL[p]}
            </Chip>
          ))}
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-body">WeChat ID (необязательно)</span>
          <input
            value={value.wechat}
            onChange={(e) => set("wechat", e.target.value.replace(/[^\w-]/g, "").slice(0, 30))}
            placeholder="wxid_..."
            autoCapitalize="none"
            className="h-12 w-full rounded-lg border border-line/10 bg-background px-3 text-heading placeholder:text-body/60 focus:border-gold/60"
          />
        </label>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        on ? "border-gold bg-gold-muted text-gold" : "border-line/10 text-body hover:border-gold/40 hover:text-heading",
      )}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-body">{label}</span>
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {allowEmpty && <option value="">Не указано</option>}
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-body">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-line/10 bg-background px-3 text-heading placeholder:text-body/60 focus:border-gold/60"
      />
    </label>
  );
}

export default ListingDetailsFields;
