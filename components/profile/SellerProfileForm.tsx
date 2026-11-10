"use client";

import { Briefcase, Building2, CheckCircle2, Globe, ImagePlus, Loader2, MapPin, Phone, Send, Trash2, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

import { compressImage } from "@/lib/image-compress";
import { ACCEPTED_IMAGE_TYPES, formatUzPhone } from "@/lib/listing";
import {
  PROFILE_LIMITS,
  SELLER_TYPES,
  clearSellerProfile,
  initials,
  loadSellerProfile,
  saveSellerProfile,
  validateSellerProfile,
} from "@/lib/seller-profile";
import type { ProfileErrors, ProfileField, SellerProfile, SellerType } from "@/lib/seller-profile";
import { cn } from "@/lib/utils";

interface TextFields {
  name: string;
  phone: string;
  telegram: string;
  about: string;
  experienceYears: string;
  companyName: string;
  companyPosition: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  companyLicense: string;
  companyAbout: string;
}

const EMPTY_TEXT: TextFields = {
  name: "",
  phone: "",
  telegram: "",
  about: "",
  experienceYears: "",
  companyName: "",
  companyPosition: "",
  companyPhone: "",
  companyWebsite: "",
  companyAddress: "",
  companyLicense: "",
  companyAbout: "",
};

const FIELD_ORDER: ProfileField[] = [
  "sellerType", "name", "phone", "telegram", "experienceYears", "about",
  "companyName", "companyPosition", "companyPhone", "companyWebsite", "companyAddress", "companyLicense", "companyAbout",
];

const TYPE_OPTIONS: { value: SellerType; icon: LucideIcon; hint: string }[] = [
  { value: "owner", icon: User, hint: "Продаю или сдаю свою недвижимость" },
  { value: "agent", icon: Briefcase, hint: "Работаю с объектами клиентов, есть компания" },
];

function profileToText(p: SellerProfile): TextFields {
  return {
    name: p.name,
    phone: formatUzPhone(p.phone),
    telegram: p.telegram ?? "",
    about: p.about,
    experienceYears: p.experienceYears === null ? "" : String(p.experienceYears),
    companyName: p.company?.name ?? "",
    companyPosition: p.company?.position ?? "",
    companyPhone: p.company?.phone ? formatUzPhone(p.company.phone) : "",
    companyWebsite: p.company?.website ?? "",
    companyAddress: p.company?.address ?? "",
    companyLicense: p.company?.license ?? "",
    companyAbout: p.company?.about ?? "",
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  const { blob } = await compressImage(file, {
    maxWidth: PROFILE_LIMITS.imageMaxSide,
    maxHeight: PROFILE_LIMITS.imageMaxSide,
    maxBytes: PROFILE_LIMITS.imageMaxBytes,
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    reader.readAsDataURL(blob);
  });
}

export function SellerProfileForm() {
  const [sellerType, setSellerType] = useState<SellerType>("owner");
  const [text, setText] = useState<TextFields>(EMPTY_TEXT);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [processing, setProcessing] = useState<"avatar" | "logo" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const id = useId();
  const fid = (name: string) => `${id}-${name}`;

  useEffect(() => {
    const p = loadSellerProfile();
    if (p) {
      setSellerType(p.sellerType);
      setText(profileToText(p));
      setAvatar(p.avatar);
      setLogo(p.company?.logo ?? null);
      setSavedAt(p.updatedAt);
    }
    setLoaded(true);
  }, []);

  const set = <K extends keyof TextFields>(key: K, value: TextFields[K]) => {
    setText((t) => ({ ...t, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const pickImage = (kind: "avatar" | "logo") => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Нужен JPG, PNG или WebP");
      return;
    }
    setProcessing(kind);
    try {
      const url = await fileToDataUrl(file);
      (kind === "avatar" ? setAvatar : setLogo)(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось обработать изображение");
    } finally {
      setProcessing(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = validateSellerProfile({
      sellerType,
      name: text.name,
      phone: text.phone,
      telegram: text.telegram,
      about: text.about,
      experienceYears: text.experienceYears,
      company: {
        name: text.companyName,
        position: text.companyPosition,
        phone: text.companyPhone,
        website: text.companyWebsite,
        address: text.companyAddress,
        license: text.companyLicense,
        about: text.companyAbout,
      },
    });
    if (res.ok === false) {
      setErrors(res.errors);
      const first = FIELD_ORDER.find((f) => res.errors[f]);
      if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Проверьте выделенные поля");
      return;
    }
    const updatedAt = new Date().toISOString();
    const profile: SellerProfile = {
      ...res.data,
      avatar,
      company: res.data.company ? { ...res.data.company, logo } : null,
      updatedAt,
    };
    if (!saveSellerProfile(profile)) {
      toast.error("Браузер не дал сохранить профиль (приватный режим?)");
      return;
    }
    setText(profileToText(profile));
    setSavedAt(updatedAt);
    toast.success("Профиль сохранён — контакты подставятся в новые объявления");
  };

  const onDelete = () => {
    clearSellerProfile();
    setSellerType("owner");
    setText(EMPTY_TEXT);
    setAvatar(null);
    setLogo(null);
    setErrors({});
    setSavedAt(null);
    setConfirmDelete(false);
    toast.success("Профиль удалён с этого устройства");
  };

  if (!loaded) return <div className="skeleton mx-auto h-96 max-w-5xl rounded-lg" />;

  const isAgent = sellerType === "agent";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {/* 1. Кто вы */}
        <Panel title="Кто вы?" subtitle="От этого зависит, как покупатели видят ваши объявления.">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Тип продавца" data-field="sellerType">
            {TYPE_OPTIONS.map(({ value, icon: Icon, hint }) => {
              const active = sellerType === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSellerType(value)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                    active ? "border-gold bg-gold-muted shadow-gold-glow" : "border-line/10 hover:border-gold/40",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-gold" : "text-body")} aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-heading">{SELLER_TYPES[value]}</span>
                    <span className="mt-0.5 block text-sm text-body">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* 2. Личные данные */}
        <Panel title={isAgent ? "Данные риелтора" : "Ваши данные"} subtitle="Подставляются в форму размещения объекта.">
          <ImagePicker
            label="Фото"
            image={avatar}
            fallback={initials(text.name)}
            busy={processing === "avatar"}
            onPick={pickImage("avatar")}
            onClear={() => setAvatar(null)}
            round
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={fid("name")} label="Имя и фамилия" required error={errors.name} field="name">
              <input
                id={fid("name")}
                value={text.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                maxLength={PROFILE_LIMITS.nameMax}
                className={inputCls(errors.name)}
              />
            </Field>
            <Field id={fid("phone")} label="Телефон" required error={errors.phone} field="phone">
              <input
                id={fid("phone")}
                type="tel"
                inputMode="tel"
                value={text.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^\d+()\s-]/g, "").slice(0, 20))}
                autoComplete="tel"
                placeholder="+998 90 123-45-67"
                className={cn(inputCls(errors.phone), "tabular")}
              />
            </Field>
            <Field id={fid("telegram")} label="Telegram" error={errors.telegram} field="telegram">
              <input
                id={fid("telegram")}
                value={text.telegram}
                onChange={(e) => set("telegram", e.target.value)}
                placeholder="@username"
                autoCapitalize="none"
                autoCorrect="off"
                className={inputCls(errors.telegram)}
              />
            </Field>
            {isAgent && (
              <Field id={fid("exp")} label="Стаж в недвижимости, лет" error={errors.experienceYears} field="experienceYears">
                <input
                  id={fid("exp")}
                  inputMode="numeric"
                  value={text.experienceYears}
                  onChange={(e) => set("experienceYears", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className={cn(inputCls(errors.experienceYears), "tabular")}
                />
              </Field>
            )}
          </div>
          <Field
            id={fid("about")}
            label="О себе"
            error={errors.about}
            hint={`${text.about.length}/${PROFILE_LIMITS.aboutMax}`}
            field="about"
          >
            <textarea
              id={fid("about")}
              value={text.about}
              onChange={(e) => set("about", e.target.value)}
              rows={3}
              maxLength={PROFILE_LIMITS.aboutMax}
              placeholder={isAgent ? "Специализация, районы, языки" : "Например: удобное время для звонков"}
              className={textareaCls(errors.about)}
            />
          </Field>
        </Panel>

        {/* 3. Компания — только для риелтора */}
        {isAgent && (
          <Panel title="Компания" subtitle="Название, контакты и реквизиты агентства. Без компании — укажите «Частный риелтор».">
            <ImagePicker
              label="Логотип"
              image={logo}
              fallback={initials(text.companyName)}
              busy={processing === "logo"}
              onPick={pickImage("logo")}
              onClear={() => setLogo(null)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={fid("cname")} label="Название компании" required error={errors.companyName} field="companyName">
                <input
                  id={fid("cname")}
                  value={text.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  autoComplete="organization"
                  maxLength={PROFILE_LIMITS.companyNameMax}
                  className={inputCls(errors.companyName)}
                />
              </Field>
              <Field id={fid("cpos")} label="Должность" error={errors.companyPosition} field="companyPosition">
                <input
                  id={fid("cpos")}
                  value={text.companyPosition}
                  onChange={(e) => set("companyPosition", e.target.value)}
                  autoComplete="organization-title"
                  placeholder="Менеджер по продажам"
                  maxLength={PROFILE_LIMITS.positionMax}
                  className={inputCls(errors.companyPosition)}
                />
              </Field>
              <Field id={fid("cphone")} label="Телефон офиса" error={errors.companyPhone} field="companyPhone">
                <input
                  id={fid("cphone")}
                  type="tel"
                  inputMode="tel"
                  value={text.companyPhone}
                  onChange={(e) => set("companyPhone", e.target.value.replace(/[^\d+()\s-]/g, "").slice(0, 20))}
                  placeholder="+998 71 123-45-67"
                  className={cn(inputCls(errors.companyPhone), "tabular")}
                />
              </Field>
              <Field id={fid("cweb")} label="Сайт" error={errors.companyWebsite} field="companyWebsite">
                <input
                  id={fid("cweb")}
                  type="url"
                  inputMode="url"
                  value={text.companyWebsite}
                  onChange={(e) => set("companyWebsite", e.target.value)}
                  placeholder="company.uz"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={inputCls(errors.companyWebsite)}
                />
              </Field>
              <Field id={fid("caddr")} label="Адрес офиса" error={errors.companyAddress} field="companyAddress">
                <input
                  id={fid("caddr")}
                  value={text.companyAddress}
                  onChange={(e) => set("companyAddress", e.target.value)}
                  autoComplete="street-address"
                  maxLength={PROFILE_LIMITS.addressMax}
                  className={inputCls(errors.companyAddress)}
                />
              </Field>
              <Field id={fid("clic")} label="ИНН / № лицензии" error={errors.companyLicense} field="companyLicense">
                <input
                  id={fid("clic")}
                  value={text.companyLicense}
                  onChange={(e) => set("companyLicense", e.target.value)}
                  maxLength={PROFILE_LIMITS.licenseMax}
                  className={cn(inputCls(errors.companyLicense), "tabular")}
                />
              </Field>
            </div>
            <Field
              id={fid("cabout")}
              label="О компании"
              error={errors.companyAbout}
              hint={`${text.companyAbout.length}/${PROFILE_LIMITS.aboutMax}`}
              field="companyAbout"
            >
              <textarea
                id={fid("cabout")}
                value={text.companyAbout}
                onChange={(e) => set("companyAbout", e.target.value)}
                rows={3}
                maxLength={PROFILE_LIMITS.aboutMax}
                className={textareaCls(errors.companyAbout)}
              />
            </Field>
          </Panel>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={processing !== null}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-gold font-heading text-base font-semibold text-graphite transition-colors hover:bg-gold-hover active:bg-gold-active disabled:opacity-80"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Сохранить профиль
          </button>
          {savedAt &&
            (confirmDelete ? (
              <div className="flex h-14 items-center gap-2 rounded-lg border border-destructive/50 px-3 text-sm">
                <span className="text-heading">Удалить профиль?</span>
                <button type="button" onClick={onDelete} className="rounded-md bg-destructive px-3 py-1.5 font-medium text-destructive-foreground">
                  Да
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md px-3 py-1.5 text-body hover:text-heading">
                  Нет
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-line/10 px-5 text-body transition-colors hover:border-destructive/60 hover:text-heading"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Удалить
              </button>
            ))}
        </div>
        <p className="text-xs text-body">
          Профиль хранится только в этом браузере. С объявлением на модерацию уходят имя, контакты и данные компании — без фото и
          логотипа.
        </p>
      </form>

      {/* Превью карточки продавца */}
      <aside className="space-y-3 lg:sticky lg:top-24">
        <p className="text-xs font-medium uppercase tracking-wider text-body">Так вас увидят покупатели</p>
        <SellerCard
          sellerType={sellerType}
          name={text.name}
          phone={text.phone}
          telegram={text.telegram}
          about={text.about}
          experienceYears={text.experienceYears}
          avatar={avatar}
          company={
            isAgent
              ? { name: text.companyName, position: text.companyPosition, phone: text.companyPhone, website: text.companyWebsite, address: text.companyAddress, logo }
              : null
          }
        />
        {savedAt && (
          <Link
            href="/add"
            className="flex h-12 items-center justify-center rounded-lg border border-gold/40 bg-gold-muted font-heading font-semibold text-gold transition-colors hover:border-gold hover:bg-gold hover:text-graphite"
          >
            Разместить объект
          </Link>
        )}
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Карточка продавца (превью)
// ------------------------------------------------------------------------------------------------
function SellerCard({
  sellerType,
  name,
  phone,
  telegram,
  about,
  experienceYears,
  avatar,
  company,
}: {
  sellerType: SellerType;
  name: string;
  phone: string;
  telegram: string;
  about: string;
  experienceYears: string;
  avatar: string | null;
  company: { name: string; position: string; phone: string; website: string; address: string; logo: string | null } | null;
}) {
  const tg = telegram.trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  const exp = Number(experienceYears);
  return (
    <div className="terminal-panel space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar image={avatar} fallback={initials(name)} round />
        <div className="min-w-0">
          <p className="truncate font-heading font-semibold text-heading">{name.trim() || "Ваше имя"}</p>
          <p className="text-sm text-body">
            {company?.position.trim() || SELLER_TYPES[sellerType]}
            {sellerType === "agent" && exp > 0 && ` · стаж ${exp} ${pluralYears(exp)}`}
          </p>
        </div>
      </div>

      {company && (
        <div className="flex items-center gap-3 rounded-lg border border-line/5 bg-background/60 p-3">
          <Avatar image={company.logo} fallback={initials(company.name)} small />
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium text-heading">{company.name.trim() || "Название компании"}</p>
            {company.address.trim() && <p className="truncate text-body">{company.address}</p>}
          </div>
        </div>
      )}

      {about.trim() && <p className="line-clamp-4 text-sm leading-relaxed">{about}</p>}

      <ul className="space-y-1.5 text-sm">
        <CardRow icon={Phone} text={phone.trim() || "+998 __ ___-__-__"} />
        {tg && <CardRow icon={Send} text={`@${tg}`} />}
        {company?.phone.trim() && <CardRow icon={Building2} text={company.phone} />}
        {company?.website.trim() && <CardRow icon={Globe} text={company.website.replace(/^https?:\/\//, "")} />}
        {company?.address.trim() && <CardRow icon={MapPin} text={company.address} />}
      </ul>
    </div>
  );
}

function CardRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-2 text-heading">
      <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
      <span className="truncate tabular">{text}</span>
    </li>
  );
}

function pluralYears(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "год";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "года";
  return "лет";
}

// ------------------------------------------------------------------------------------------------
// Мелкие презентационные компоненты
// ------------------------------------------------------------------------------------------------
const inputCls = (error?: string) =>
  cn(
    "h-12 w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60",
    error ? "border-destructive" : "border-line/10",
  );

const textareaCls = (error?: string) =>
  cn(
    "w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60",
    error ? "border-destructive" : "border-line/10",
  );

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="terminal-panel space-y-5 p-5 sm:p-6">
      <header>
        <h2 className="text-lg sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  field,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  field: ProfileField;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field={field}>
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-body">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-body">{hint}</p>
      ) : null}
    </div>
  );
}

function Avatar({ image, fallback, round, small }: { image: string | null; fallback: string; round?: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-gold/30 bg-gold-muted font-heading font-semibold text-gold",
        round ? "rounded-full" : "rounded-lg",
        small ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg",
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- data:URL, next/image не нужен
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        fallback
      )}
    </span>
  );
}

function ImagePicker({
  label,
  image,
  fallback,
  busy,
  onPick,
  onClear,
  round,
}: {
  label: string;
  image: string | null;
  fallback: string;
  busy: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  round?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <Avatar image={image} fallback={fallback} round={round} />
      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line/10 px-3 text-sm font-medium text-heading transition-colors hover:border-gold/50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" /> : <ImagePlus className="h-4 w-4 text-gold" aria-hidden="true" />}
        {image ? `Заменить ${label.toLowerCase()}` : `Загрузить ${label.toLowerCase()}`}
        <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={onPick} disabled={busy} className="sr-only" />
      </label>
      {image && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Удалить ${label.toLowerCase()}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-body transition-colors hover:text-heading"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default SellerProfileForm;
