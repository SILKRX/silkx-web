"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { NativeSelect } from "@/components/ui/native-select";
import { LEAD_CONTACT_VIA, LEAD_INTENTS, validateLead } from "@/lib/lead";
import type { LeadContactVia, LeadErrors, LeadField, LeadIntent } from "@/lib/lead";
import { cn } from "@/lib/utils";

type ApiResponse = { ok: true; id: string } | { ok: false; error?: string; fieldErrors?: LeadErrors };

const INPUT =
  "h-12 w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60 focus:outline-none";
const LABEL = "text-xs font-medium uppercase tracking-wider text-body";

/** UTM-метки текущего визита (сохраняем в sessionStorage, чтобы не потерять при переходах по сайту). */
function readUtm(): Record<string, string> | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Object.fromEntries([...params.entries()].filter(([k]) => k.startsWith("utm_")));
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem("silkx:utm", JSON.stringify(fromUrl));
      return fromUrl;
    }
    const saved = sessionStorage.getItem("silkx:utm");
    return saved ? (JSON.parse(saved) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

/**
 * Форма заявки по объекту. Заявка сохраняется в базе и сразу приходит менеджеру в Telegram.
 * id="lead" — сюда ведёт кнопка «Оставить заявку» из мобильной панели.
 */
export function LeadForm({
  propertyId,
  defaultIntent = "viewing",
  className,
}: {
  propertyId: string;
  defaultIntent?: LeadIntent;
  className?: string;
}) {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;

  const [intent, setIntent] = useState<LeadIntent>(defaultIntent);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactVia, setContactVia] = useState<LeadContactVia>("call");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [utm, setUtm] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setUtm(readUtm()); // eslint-disable-line react-hooks/set-state-in-effect -- читаем URL только в браузере
  }, []);

  const clearError = (f: LeadField) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const payload = { propertyId, intent, name, phone, contactVia, comment, agree, utm, source: utm?.utm_source ?? "form", website: honeypot };
    const check = validateLead(payload);
    if (check.ok === false) {
      setErrors(check.errors);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok || !data || data.ok === false) {
        if (data && data.ok === false && data.fieldErrors) setErrors(data.fieldErrors);
        toast.error((data && data.ok === false && data.error) || "Не удалось отправить заявку. Попробуйте ещё раз.");
        return;
      }
      setDone(true);
      toast.success("Заявка отправлена");
    } catch {
      toast.error("Нет соединения. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div id="lead" className={cn("terminal-panel scroll-mt-24 space-y-3 p-6 text-center", className)} aria-live="polite">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <h2 className="text-xl">Заявка принята</h2>
        <p className="text-sm leading-relaxed">
          Менеджер свяжется с вами {contactVia === "call" ? "по телефону" : `в ${LEAD_CONTACT_VIA[contactVia]}`} в течение 15 минут в
          рабочее время (9:00–21:00).
        </p>
        <button type="button" onClick={() => setDone(false)} className="text-sm text-body underline-offset-4 hover:text-gold hover:underline">
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  const err = (f: LeadField) =>
    errors[f] ? (
      <p id={`${id(f)}-err`} className="text-xs text-destructive">
        {errors[f]}
      </p>
    ) : null;
  const aria = (f: LeadField) => ({ "aria-invalid": Boolean(errors[f]) || undefined, "aria-describedby": errors[f] ? `${id(f)}-err` : undefined });
  const border = (f: LeadField) => (errors[f] ? "border-destructive" : "border-input");

  return (
    <form id="lead" onSubmit={onSubmit} noValidate className={cn("terminal-panel scroll-mt-24 space-y-4 p-5 sm:p-6", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Заявка по объекту</p>
        <h2 className="mt-1 text-xl">Связаться с менеджером</h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("intent")} className={LABEL}>
          Что нужно
        </label>
        <NativeSelect id={id("intent")} value={intent} onChange={(e) => setIntent(e.target.value as LeadIntent)}>
          {Object.entries(LEAD_INTENTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("name")} className={LABEL}>
          Имя
        </label>
        <input
          id={id("name")}
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          placeholder="Как к вам обращаться"
          className={cn(INPUT, border("name"))}
          {...aria("name")}
        />
        {err("name")}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("phone")} className={LABEL}>
          Телефон
        </label>
        <input
          id={id("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
          placeholder="+998 90 123-45-67"
          className={cn(INPUT, border("phone"))}
          {...aria("phone")}
        />
        {err("phone")}
      </div>

      <fieldset className="space-y-1.5">
        <legend className={LABEL}>Как удобнее связаться</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LEAD_CONTACT_VIA) as LeadContactVia[]).map((k) => (
            <label
              key={k}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm transition-colors",
                contactVia === k ? "border-gold bg-gold-muted font-semibold text-gold" : "border-input text-body hover:border-gold/40",
              )}
            >
              <input type="radio" name={id("via")} value={k} checked={contactVia === k} onChange={() => setContactVia(k)} className="sr-only" />
              {LEAD_CONTACT_VIA[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={id("comment")} className={LABEL}>
          Комментарий <span className="normal-case tracking-normal text-body/70">(необязательно)</span>
        </label>
        <textarea
          id={id("comment")}
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Удобное время для просмотра, вопросы по рассрочке…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60 focus:outline-none"
        />
      </div>

      {/* Honeypot: скрыто от людей, боты заполняют */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        name="website"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <ConsentCheckbox
        id={id("agree")}
        checked={agree}
        onChange={(v) => {
          setAgree(v);
          clearError("agree");
        }}
        error={errors.agree}
        purpose="обработки заявки и передачи её продавцу или агентству по этому объекту"
      />

      <button
        type="submit"
        disabled={sending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover active:bg-gold-active disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        Отправить заявку
      </button>
      <p className="text-center text-xs text-body">Бесплатно и без обязательств. Ответим в течение 15 минут.</p>
    </form>
  );
}
