"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { NativeSelect } from "@/components/ui/native-select";
import { DATA_REQUEST_RESPONSE_DAYS, DATA_REQUEST_TYPES, validateDataRequest } from "@/lib/data-request";
import type { DataRequestErrors, DataRequestType } from "@/lib/data-request";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60 focus:outline-none";

export function DataRequestForm() {
  const uid = useId();
  const [type, setType] = useState<DataRequestType>("delete");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");
  const [agree, setAgree] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<DataRequestErrors>({});
  const [sending, setSending] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { type, name, contact, details, agree, website: honeypot };
    const pre = validateDataRequest(payload);
    if (pre.ok === false) {
      setErrors(pre.errors);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/data-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => null)) as { ok: boolean; id?: string; error?: string; fieldErrors?: DataRequestErrors } | null;
      if (!res.ok || !data?.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors);
        toast.error(data?.error ?? "Не удалось отправить запрос. Попробуйте позже.");
        return;
      }
      setDoneId(data.id ?? "");
    } catch {
      toast.error("Нет соединения. Проверьте интернет.");
    } finally {
      setSending(false);
    }
  };

  if (doneId !== null) {
    return (
      <div className="terminal-panel mt-6 space-y-3 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <h3 className="text-lg">Запрос принят</h3>
        <p className="text-sm">
          Мы ответим по указанному контакту в течение {DATA_REQUEST_RESPONSE_DAYS} рабочих дней. Номер запроса: {doneId}.
        </p>
      </div>
    );
  }

  const label = "text-xs font-medium uppercase tracking-wider text-body";
  const err = (m?: string) => (m ? <p className="text-xs text-destructive">{m}</p> : null);

  return (
    <form onSubmit={onSubmit} noValidate className="terminal-panel relative mt-6 space-y-4 p-5 sm:p-6">
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-type`} className={label}>
          Что сделать
        </label>
        <NativeSelect id={`${uid}-type`} value={type} onChange={(e) => setType(e.target.value as DataRequestType)} className="border-input">
          {Object.entries(DATA_REQUEST_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-name`} className={label}>
            Имя
          </label>
          <input id={`${uid}-name`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={cn(INPUT, "h-12", errors.name ? "border-destructive" : "border-input")} />
          {err(errors.name)}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-contact`} className={label}>
            Телефон или e-mail
          </label>
          <input
            id={`${uid}-contact`}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Тот, что вы указывали в заявке"
            className={cn(INPUT, "h-12", errors.contact ? "border-destructive" : "border-input")}
          />
          {err(errors.contact)}
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-details`} className={label}>
          Подробности <span className="normal-case tracking-normal text-body/70">(необязательно)</span>
        </label>
        <textarea
          id={`${uid}-details`}
          rows={3}
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Номер заявки или объявления, что исправить…"
          className={cn(INPUT, "border-input py-2.5")}
        />
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
      <ConsentCheckbox checked={agree} onChange={(v) => { setAgree(v); setErrors((x) => ({ ...x, agree: undefined })); }} error={errors.agree} purpose="исполнения этого запроса" />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-6 font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        Отправить запрос
      </button>
    </form>
  );
}

export default DataRequestForm;
