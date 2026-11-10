"use client";

import {
  ArrowRight,
  BedDouble,
  Box,
  Building2,
  CheckCircle2,
  Home,
  ImagePlus,
  Loader2,
  Star,
  Store,
  Trees,
  TriangleAlert,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

import { EMPTY_DETAILS, ListingDetailsFields } from "@/components/listing/ListingDetailsFields";
import type { DetailsForm } from "@/components/listing/ListingDetailsFields";
import { LocationPicker } from "@/components/map/LocationPicker";
import type { LocationValue } from "@/components/map/LocationPicker";
import { NativeSelect } from "@/components/ui/native-select";
import { DISTRICT_CENTERS } from "@/lib/geo";
import { compressImage, readImageSize } from "@/lib/image-compress";
import { ACCEPTED_IMAGE_TYPES, CATEGORIES_WITHOUT_ROOMS, LISTING_LIMITS, validateListing } from "@/lib/listing";
import type { ListingErrors, ListingField } from "@/lib/listing";
import { DISTRICT_SLUGS, PROPERTY_CATEGORIES, PROPERTY_CATEGORY_KEYS, TASHKENT_DISTRICTS, isDistrictSlug } from "@/lib/types";
import type { Currency, DealType, DistrictSlug, PropertyCategory, RentTerm } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { addMyListing } from "@/lib/my-listings";

const PanoramaViewer = dynamic(() => import("@/components/tour/PanoramaViewer").then((m) => m.PanoramaViewer), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

const CATEGORY_ICONS: Record<PropertyCategory, LucideIcon> = {
  apartment: Building2,
  house: Home,
  room: BedDouble,
  commercial: Store,
  land: Trees,
};

const DRAFT_KEY = "silkx:add-listing-draft:v1";
const PANORAMA_RATIO_TOLERANCE = 0.08; // 2:1 ± 8%

interface TextFields {
  category: PropertyCategory | "";
  dealType: DealType;
  rentTerm: RentTerm;
  title: string;
  description: string;
  price: string;
  currency: Currency;
  rooms: string;
  areaM2: string;
  floor: string;
  floorsTotal: string;
  district: DistrictSlug | "";
  contactName: string;
  phone: string;
  telegram: string;
}

const EMPTY_TEXT: TextFields = {
  category: "",
  dealType: "sale",
  rentTerm: "month",
  title: "",
  description: "",
  price: "",
  currency: "USD",
  rooms: "",
  areaM2: "",
  floor: "",
  floorsTotal: "",
  district: "",
  contactName: "",
  phone: "",
  telegram: "",
};

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  /** Путь в хранилище после успешной загрузки — при повторной отправке файл не грузится снова. */
  path?: string;
}

interface LocalPanorama extends LocalImage {
  title: string;
  ratioWarning: boolean;
}

type Phase = "edit" | "uploading" | "submitting" | "done";

const uid = (): string => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes); // работает и по http (в отличие от randomUUID)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

// Порядок полей = порядок на странице → прокрутка к первой ошибке
const FIELD_ORDER: ListingField[] = [
  "category", "dealType", "title", "description", "price", "currency", "rooms", "areaM2", "floor", "floorsTotal",
  "district", "address", "lat", "photos", "panoramas", "contactName", "phone", "telegram", "agree",
];

const PLACEHOLDER_PATH = "pending/00000000/00000000.jpg";

export function AddListingForm() {
  const [text, setText] = useState<TextFields>(EMPTY_TEXT);
  const [location, setLocation] = useState<LocationValue>({ point: null, address: "" });
  const [photos, setPhotos] = useState<LocalImage[]>([]);
  const [panoramas, setPanoramas] = useState<LocalPanorama[]>([]);
  const [details, setDetails] = useState<DetailsForm>(EMPTY_DETAILS);
  const [agree, setAgree] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<ListingErrors>({});
  const [phase, setPhase] = useState<Phase>("edit");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ id: string; demo: boolean } | null>(null);
  const draftLoaded = useRef(false);
  const draftIdRef = useRef<string>("");

  const ids = {
    title: useId(), description: useId(), price: useId(), rooms: useId(), area: useId(), floor: useId(),
    floorsTotal: useId(), district: useId(), name: useId(), phone: useId(), telegram: useId(), agree: useId(),
  };

  const set = <K extends keyof TextFields>(key: K, value: TextFields[K]) => {
    setText((t) => ({ ...t, [key]: value }));
    setErrors((e) => (e[key as ListingField] ? { ...e, [key]: undefined } : e));
  };

  // --- черновик: восстановление и автосохранение (только текст и точка, без файлов) ---------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { text?: Partial<TextFields>; location?: LocationValue; details?: Partial<DetailsForm> };
        if (parsed.text) setText((t) => ({ ...t, ...parsed.text }));
        if (parsed.location?.point) setLocation(parsed.location);
        if (parsed.details) setDetails((d) => ({ ...d, ...parsed.details }));
      }
    } catch {
      /* приватный режим / битый JSON — начинаем с чистого листа */
    }
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!draftLoaded.current || phase === "done") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, location, details }));
      } catch {
        /* квота / приватный режим */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [text, location, details, phase]);

  // Освобождаем object URL'ы при размонтировании
  const urlsRef = useRef<string[]>([]);
  urlsRef.current = [...photos, ...panoramas].map((p) => p.previewUrl);
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // Предупреждаем о потере данных при закрытии вкладки во время загрузки
  useEffect(() => {
    if (phase !== "uploading" && phase !== "submitting") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const noRooms = text.category !== "" && CATEGORIES_WITHOUT_ROOMS.has(text.category);
  const fallbackCenter = useMemo(() => (text.district ? DISTRICT_CENTERS[text.district] : undefined), [text.district]);
  const busy = phase === "uploading" || phase === "submitting";

  // --- файлы --------------------------------------------------------------------------------
  const acceptFile = (f: File): string | null => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type)) return `«${f.name}»: нужен JPG, PNG или WebP`;
    if (f.size > LISTING_LIMITS.sourceMaxBytes) return `«${f.name}»: файл больше 40 МБ`;
    return null;
  };

  const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // чтобы можно было выбрать тот же файл повторно
    const room = LISTING_LIMITS.photosMax - photos.length;
    if (files.length > room) toast.warning(`Можно добавить ещё ${Math.max(0, room)} фото`);
    const next: LocalImage[] = [];
    for (const f of files.slice(0, Math.max(0, room))) {
      const err = acceptFile(f);
      if (err) {
        toast.error(err);
        continue;
      }
      next.push({ id: uid(), file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (next.length) {
      setPhotos((p) => [...p, ...next]);
      setErrors((er) => ({ ...er, photos: undefined }));
    }
  };

  const addPanoramas = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = LISTING_LIMITS.panoramasMax - panoramas.length;
    if (files.length > room) toast.warning(`Можно добавить ещё ${Math.max(0, room)} панорам`);
    setProcessing(true);
    const next: LocalPanorama[] = [];
    for (const f of files.slice(0, Math.max(0, room))) {
      const err = acceptFile(f);
      if (err) {
        toast.error(err);
        continue;
      }
      let ratioWarning = false;
      try {
        const { width, height } = await readImageSize(f);
        ratioWarning = Math.abs(width / height - 2) > 2 * PANORAMA_RATIO_TOLERANCE;
      } catch {
        toast.error(`«${f.name}»: не удалось прочитать изображение`);
        continue;
      }
      next.push({
        id: uid(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        title: `Комната ${panoramas.length + next.length + 1}`,
        ratioWarning,
      });
    }
    setProcessing(false);
    if (next.length) setPanoramas((p) => [...p, ...next]);
    if (next.some((p) => p.ratioWarning)) {
      toast.warning("Некоторые фото не похожи на панораму 360° (нужны пропорции 2:1). Они будут выглядеть искажённо.");
    }
  };

  const removeImage = (id: string, kind: "photo" | "pano") => {
    const list = kind === "photo" ? photos : panoramas;
    const item = list.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    if (kind === "photo") setPhotos((p) => p.filter((x) => x.id !== id));
    else setPanoramas((p) => p.filter((x) => x.id !== id));
  };

  const makeCover = (id: string) =>
    setPhotos((p) => {
      const item = p.find((x) => x.id === id);
      return item ? [item, ...p.filter((x) => x.id !== id)] : p;
    });

  // --- отправка -------------------------------------------------------------------------------
  const rawPayload = useCallback(
    (photoPaths: string[], panoPaths: { path: string; title: string }[]) => ({
      ...text,
      rooms: noRooms ? "" : text.rooms,
      address: location.address,
      lat: location.point?.lat ?? "",
      lng: location.point?.lng ?? "",
      photos: photoPaths,
      panoramas: panoPaths,
      details,
      agree,
      website: honeypot,
    }),
    [text, noRooms, location, details, agree, honeypot],
  );

  const showErrors = (errs: ListingErrors) => {
    setErrors(errs);
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) {
      document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast.error("Проверьте выделенные поля");
  };

  const uploadOne = async (item: LocalImage, kind: "photo" | "pano"): Promise<string> => {
    if (item.path) return item.path;
    const compressed = await compressImage(
      item.file,
      kind === "pano"
        ? { maxWidth: 6144, maxHeight: 3072, maxBytes: LISTING_LIMITS.uploadMaxBytes, quality: 0.85 }
        : { maxWidth: 2000, maxHeight: 2000, maxBytes: 1.5 * 1024 * 1024, quality: 0.82 },
    );
    const body = new FormData();
    body.append("draftId", draftIdRef.current);
    body.append("file", compressed.blob, `${item.id}.jpg`);
    const res = await fetch("/api/listings/upload", { method: "POST", body });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; path?: string; error?: string } | null;
    if (!res.ok || !data?.ok || !data.path) throw new Error(data?.error ?? "Не удалось загрузить файл");
    item.path = data.path; // запоминаем — повторная отправка не перегрузит файл
    return data.path;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // 1) Проверка до загрузки файлов — не тратим трафик на форму с ошибками
    const pre = validateListing(
      rawPayload(
        photos.map(() => PLACEHOLDER_PATH),
        panoramas.map((p) => ({ path: PLACEHOLDER_PATH, title: p.title })),
      ),
    );
    if (!pre.ok) {
      showErrors(pre.errors);
      return;
    }

    // 2) Загрузка файлов по одному
    if (!draftIdRef.current) draftIdRef.current = uid();
    const total = photos.length + panoramas.length;
    setPhase("uploading");
    setProgress({ done: photos.concat(panoramas).filter((p) => p.path).length, total });
    let photoPaths: string[];
    let panoPaths: { path: string; title: string }[];
    try {
      photoPaths = [];
      for (const p of photos) {
        photoPaths.push(await uploadOne(p, "photo"));
        setProgress((pr) => ({ ...pr, done: Math.min(pr.total, pr.done + 1) }));
      }
      panoPaths = [];
      for (const p of panoramas) {
        panoPaths.push({ path: await uploadOne(p, "pano"), title: p.title });
        setProgress((pr) => ({ ...pr, done: Math.min(pr.total, pr.done + 1) }));
      }
    } catch (err) {
      setPhase("edit");
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки. Проверьте интернет и попробуйте ещё раз.");
      return;
    }

    // 3) Создание объявления
    setPhase("submitting");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawPayload(photoPaths, panoPaths)),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; id: string; demo?: boolean }
        | { ok: false; error?: string; fieldErrors?: ListingErrors }
        | null;
      if (!res.ok || !data || !data.ok) {
        setPhase("edit");
        if (data && !data.ok && data.fieldErrors) showErrors(data.fieldErrors);
        else toast.error((data && !data.ok && data.error) || "Не удалось отправить. Попробуйте ещё раз.");
        return;
      }
      setResult({ id: data.id, demo: Boolean(data.demo) });
      // Профиль → «Мои объекты»
      addMyListing({
        id: data.id,
        title: text.title.trim(),
        dealType: text.dealType,
        price: Number(text.price.replace(/s/g, "")) || 0,
        currency: text.currency,
        district: text.district,
        createdAt: new Date().toISOString(),
        demo: Boolean(data.demo),
      });
      setPhase("done");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setPhase("edit");
      toast.error("Нет соединения. Данные сохранены — попробуйте ещё раз.");
    }
  };

  const resetAll = () => {
    [...photos, ...panoramas].forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setText(EMPTY_TEXT);
    setLocation({ point: null, address: "" });
    setDetails(EMPTY_DETAILS);
    setPhotos([]);
    setPanoramas([]);
    setAgree(false);
    setErrors({});
    setResult(null);
    draftIdRef.current = "";
    setPhase("edit");
  };

  // --- экран успеха ----------------------------------------------------------------------------
  if (phase === "done" && result) {
    return (
      <div className="terminal-panel mx-auto max-w-xl p-8 text-center animate-in fade-in-0 zoom-in-95">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" />
        <h2 className="mt-4 text-2xl">Объявление отправлено на модерацию</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Мы проверим объект и документы в течение 24 часов и свяжемся с вами по телефону или в Telegram.
          После проверки объявление появится в каталоге с отметкой «Проверено SILKX».
        </p>
        {result.demo && (
          <p className="mt-4 rounded-lg border border-gold/30 bg-gold-muted p-3 text-xs text-gold">
            Демо-режим: база данных не подключена, объявление не сохранено. Добавьте ключи Supabase в .env.local.
          </p>
        )}
        <p className="mt-4 text-xs text-body">Номер заявки: {result.id}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/catalog"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gold px-6 font-heading font-semibold text-graphite hover:bg-gold-hover"
          >
            В каталог
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-line/10 px-6 font-medium text-heading hover:border-gold/50"
          >
            Разместить ещё
          </button>
        </div>
      </div>
    );
  }

  const panoScenes = panoramas.map((p) => ({ id: p.id, title: p.title, src: p.previewUrl }));

  // --- форма -------------------------------------------------------------------------------------
  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-6 pb-cta-safe sm:pb-10">
      {/* Honeypot — скрыт от людей и скринридеров */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Сайт
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
        </label>
      </div>

      {/* 1. Категория и сделка */}
      <Section step={1} title="Что размещаете?">
        <div data-field="category">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" role="radiogroup" aria-label="Категория">
            {PROPERTY_CATEGORY_KEYS.map((key) => {
              const Icon = CATEGORY_ICONS[key];
              const active = text.category === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set("category", key)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm font-medium transition-all",
                    active
                      ? "border-gold bg-gold-muted text-heading shadow-gold-glow"
                      : "border-line/10 bg-background text-body hover:border-gold/40 hover:text-heading",
                  )}
                >
                  <Icon className={cn("h-6 w-6", active ? "text-gold" : "text-body")} aria-hidden="true" />
                  {PROPERTY_CATEGORIES[key]}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.category} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented
            label="Тип сделки"
            value={text.dealType}
            onChange={(v) => set("dealType", v)}
            options={[
              { value: "sale", label: "Продажа" },
              { value: "rent", label: "Аренда" },
            ]}
          />
          {text.dealType === "rent" && (
            <Segmented
              label="Срок аренды"
              value={text.rentTerm}
              onChange={(v) => set("rentTerm", v)}
              options={[
                { value: "month", label: "Помесячно" },
                { value: "day", label: "Посуточно" },
              ]}
            />
          )}
        </div>
      </Section>

      {/* 2. Параметры */}
      <Section step={2} title="Параметры и цена">
        <Field id={ids.title} label="Заголовок" required error={errors.title} field="title" hint="Например: «2-комн. квартира с ремонтом у метро Минор»">
          <input
            id={ids.title}
            value={text.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={LISTING_LIMITS.titleMax}
            className={inputCls(errors.title)}
          />
        </Field>

        <Field
          id={ids.description}
          label="Описание"
          required
          error={errors.description}
          field="description"
          hint={`${text.description.length}/${LISTING_LIMITS.descriptionMax} · ремонт, мебель, инфраструктура, условия`}
        >
          <textarea
            id={ids.description}
            value={text.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={LISTING_LIMITS.descriptionMax}
            rows={5}
            className={cn(inputCls(errors.description), "h-auto py-3")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field
            id={ids.price}
            label={text.dealType === "sale" ? "Цена" : text.rentTerm === "day" ? "Цена за сутки" : "Цена в месяц"}
            required
            error={errors.price}
            field="price"
          >
            <input
              id={ids.price}
              inputMode="numeric"
              value={text.price}
              onChange={(e) => set("price", e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder={text.currency === "USD" ? "85 000" : "950 000 000"}
              className={cn(inputCls(errors.price), "tabular")}
            />
          </Field>
          <Segmented
            label="Валюта"
            value={text.currency}
            onChange={(v) => set("currency", v)}
            options={[
              { value: "USD", label: "$ USD" },
              { value: "UZS", label: "сум" },
            ]}
          />
        </div>

        <div className={cn("grid gap-4", noRooms ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
          {!noRooms && (
            <Field id={ids.rooms} label="Комнат" required error={errors.rooms} field="rooms" hint="0 — студия">
              <input
                id={ids.rooms}
                inputMode="numeric"
                value={text.rooms}
                onChange={(e) => set("rooms", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className={inputCls(errors.rooms)}
              />
            </Field>
          )}
          <Field id={ids.area} label="Площадь, м²" required error={errors.areaM2} field="areaM2" hint={text.category === "land" ? "1 сотка = 100 м²" : undefined}>
            <input
              id={ids.area}
              inputMode="decimal"
              value={text.areaM2}
              onChange={(e) => set("areaM2", e.target.value.replace(/[^\d.,]/g, ""))}
              className={inputCls(errors.areaM2)}
            />
          </Field>
          {text.category !== "land" && (
            <>
              <Field id={ids.floor} label="Этаж" error={errors.floor} field="floor">
                <input
                  id={ids.floor}
                  inputMode="numeric"
                  value={text.floor}
                  onChange={(e) => set("floor", e.target.value.replace(/[^\d-]/g, "").slice(0, 3))}
                  className={inputCls(errors.floor)}
                />
              </Field>
              <Field id={ids.floorsTotal} label="Этажей в доме" error={errors.floorsTotal} field="floorsTotal">
                <input
                  id={ids.floorsTotal}
                  inputMode="numeric"
                  value={text.floorsTotal}
                  onChange={(e) => set("floorsTotal", e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className={inputCls(errors.floorsTotal)}
                />
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* 3. Расположение */}
      <Section step={3} title="Где находится?" subtitle="Найдите адрес или поставьте пин — как в Яндекс Картах.">
        <Field id={ids.district} label="Район" required error={errors.district} field="district">
          <NativeSelect
            id={ids.district}
            value={text.district}
            onChange={(e) => set("district", isDistrictSlug(e.target.value) ? e.target.value : "")}
          >
            <option value="">Выберите район</option>
            {DISTRICT_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {TASHKENT_DISTRICTS[slug]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div data-field="address">
          <div data-field="lat">
            <LocationPicker
              value={location}
              onChange={(v) => {
                setLocation(v);
                setErrors((er) => (er.address || er.lat ? { ...er, address: undefined, lat: undefined } : er));
              }}
              fallbackCenter={fallbackCenter}
              error={errors.lat ?? errors.address}
            />
          </div>
        </div>
      </Section>

      {/* 4. Фото */}
      <Section step={4} title="Фотографии" subtitle={`До ${LISTING_LIMITS.photosMax} фото. Первое — обложка. Мы сожмём их без потери качества.`}>
        <div data-field="photos">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line/10 bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element -- локальный blob: URL, next/image тут не нужен */}
                <img src={p.previewUrl} alt={`Фото ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-graphite">Обложка</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(p.id)}
                    className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Сделать фото ${i + 1} обложкой`}
                    disabled={busy}
                  >
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(p.id, "photo")}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-destructive"
                  aria-label={`Удалить фото ${i + 1}`}
                  disabled={busy}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            {photos.length < LISTING_LIMITS.photosMax && (
              <DropTile accept={ACCEPTED_IMAGE_TYPES.join(",")} multiple onChange={addPhotos} disabled={busy} error={Boolean(errors.photos)}>
                <ImagePlus className="h-6 w-6 text-gold" aria-hidden="true" />
                <span>Добавить фото</span>
              </DropTile>
            )}
          </div>
          <FieldError message={errors.photos} />
        </div>
      </Section>

      {/* 5. 3D-тур */}
      <Section
        step={5}
        title="3D-тур 360° (необязательно)"
        subtitle="Покупатели «пройдут» по квартире до показа. Объявления с 3D-туром получают в среднем больше заявок."
      >
        <div data-field="panoramas" className="space-y-4">
          <details className="rounded-lg border border-line/10 bg-background p-4 text-sm">
            <summary className="cursor-pointer font-medium text-heading">Как снять панораму 360° на телефон?</summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body">
              <li>Лучше всего — камера 360° (Insta360, Ricoh Theta): один кадр снимает всю комнату. Без камеры подойдёт приложение для сферических панорам (ищите в магазине приложений «360 panorama» / «photo sphere»).</li>
              <li>Встаньте в центр комнаты, включите свет, откройте шторы.</li>
              <li>Снимайте по подсказкам приложения, поворачиваясь на месте, — телефон держите на уровне глаз.</li>
              <li>Сохраните результат: это фото с пропорциями 2:1 (например, 8000×4000). Загрузите его сюда.</li>
            </ol>
          </details>

          {panoramas.length > 0 && (
            <>
              <div className="aspect-video w-full">
                <PanoramaViewer scenes={panoScenes} compact className="h-full w-full" />
              </div>
              <ul className="space-y-2">
                {panoramas.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line/10 bg-background p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="h-12 w-24 shrink-0 rounded-md object-cover" />
                    <label className="sr-only" htmlFor={`pano-${p.id}`}>
                      Название комнаты {i + 1}
                    </label>
                    <input
                      id={`pano-${p.id}`}
                      value={p.title}
                      maxLength={40}
                      disabled={busy}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPanoramas((list) => list.map((x) => (x.id === p.id ? { ...x, title: v } : x)));
                      }}
                      className="h-10 min-w-0 flex-1 rounded-md border border-line/10 bg-card px-3 text-sm text-heading focus:border-gold/60"
                    />
                    {p.ratioWarning && (
                      <span title="Пропорции не 2:1 — панорама может выглядеть искажённо" className="shrink-0">
                        <TriangleAlert className="h-4 w-4 text-gold" aria-label="Пропорции не 2:1" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(p.id, "pano")}
                      disabled={busy}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body hover:bg-destructive/20 hover:text-destructive"
                      aria-label={`Удалить панораму «${p.title}»`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {panoramas.length < LISTING_LIMITS.panoramasMax && (
            <DropTile accept={ACCEPTED_IMAGE_TYPES.join(",")} multiple onChange={addPanoramas} disabled={busy || processing} wide>
              {processing ? <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden="true" /> : <Box className="h-6 w-6 text-gold" aria-hidden="true" />}
              <span>{panoramas.length ? "Добавить ещё комнату" : "Загрузить панорамы 360°"}</span>
              <span className="text-xs text-body">JPG/PNG/WebP · пропорции 2:1</span>
            </DropTile>
          )}
          <FieldError message={errors.panoramas} />
        </div>
      </Section>

      {/* 6. Подробности */}
      <Section
        step={6}
        title="Подробности (необязательно)"
        subtitle={
          text.dealType === "sale"
            ? "Покажем покупателю, можно ли купить объект в ипотеку, и ответим на вопросы иностранцев через AI-ассистента."
            : "Условия аренды и детали квартиры — AI-ассистент будет отвечать на вопросы арендаторов по ним."
        }
      >
        <ListingDetailsFields value={details} onChange={setDetails} dealType={text.dealType} />
      </Section>

      {/* 7. Контакты */}
      <Section step={7} title="Контакты" subtitle="Номер виден только модератору и покупателям, оставившим заявку.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={ids.name} label="Ваше имя" required error={errors.contactName} field="contactName">
            <input
              id={ids.name}
              value={text.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              autoComplete="name"
              maxLength={60}
              className={inputCls(errors.contactName)}
            />
          </Field>
          <Field id={ids.phone} label="Телефон" required error={errors.phone} field="phone">
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              value={text.phone}
              onChange={(e) => set("phone", e.target.value.replace(/[^\d+()\s-]/g, "").slice(0, 20))}
              autoComplete="tel"
              placeholder="+998 90 123-45-67"
              className={cn(inputCls(errors.phone), "tabular")}
            />
          </Field>
        </div>
        <Field id={ids.telegram} label="Telegram (необязательно)" error={errors.telegram} field="telegram">
          <input
            id={ids.telegram}
            value={text.telegram}
            onChange={(e) => set("telegram", e.target.value)}
            placeholder="@username"
            autoCapitalize="none"
            autoCorrect="off"
            className={inputCls(errors.telegram)}
          />
        </Field>

        <div data-field="agree">
          <ConsentCheckbox
            id={ids.agree}
            checked={agree}
            onChange={(v) => {
              setAgree(v);
              setErrors((er) => ({ ...er, agree: undefined }));
            }}
            error={errors.agree}
            extra="Я собственник или официальный представитель объекта, сведения достоверны."
            purpose="модерации и публикации объявления и связи со мной покупателей"
          />
        </div>
      </Section>

      {/* Отправка: на мобильном — липкая панель снизу */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/5 bg-background/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={busy || processing}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gold font-heading text-base font-semibold text-graphite transition-colors hover:bg-gold-hover active:bg-gold-active disabled:cursor-wait disabled:opacity-80"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {phase === "uploading" ? `Загружаем фото ${progress.done}/${progress.total}…` : "Отправляем…"}
            </>
          ) : (
            <>
              Отправить на модерацию
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
        {busy && progress.total > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------------------------------------------
// Мелкие презентационные компоненты формы
// ------------------------------------------------------------------------------------------------
const inputCls = (error?: string) =>
  cn(
    "h-12 w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60",
    error ? "border-destructive" : "border-line/10",
  );

function Section({ step, title, subtitle, children }: { step: number; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="terminal-panel space-y-5 p-5 sm:p-6" aria-labelledby={`step-${step}`}>
      <header className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-muted font-heading text-sm font-semibold text-gold">
          {step}
        </span>
        <div>
          <h2 id={`step-${step}`} className="text-lg sm:text-xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
        </div>
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
  field: ListingField;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field={field}>
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-body">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-xs text-body">{hint}</p> : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium uppercase tracking-wider text-body">{label}</span>
      <div className="flex h-12 rounded-lg border border-line/10 bg-background p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
              value === o.value ? "bg-gold text-graphite" : "text-body hover:text-heading",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DropTile({
  children,
  accept,
  multiple,
  onChange,
  disabled,
  error,
  wide,
}: {
  children: ReactNode;
  accept: string;
  multiple?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  wide?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center text-sm font-medium text-heading transition-colors hover:border-gold/60 hover:bg-gold-muted",
        wide ? "min-h-32 w-full" : "aspect-square",
        error ? "border-destructive" : "border-line/15",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {children}
      <input type="file" accept={accept} multiple={multiple} onChange={onChange} disabled={disabled} className="sr-only" />
    </label>
  );
}

export default AddListingForm;
