"use client";

import { CalendarCheck, CheckCircle2, Loader2, Phone } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import { NativeSelect } from "@/components/ui/native-select";
import { addDays, countNights, todayInTashkent, validateBooking } from "@/lib/booking";
import type { BookingErrors, BookingField } from "@/lib/booking";
import { formatNumber } from "@/lib/format";
import { telHref } from "@/lib/hotels";
import type { Hotel } from "@/lib/hotels";
import { cn } from "@/lib/utils";

/** Событие «Забронировать» из карточки номера: выбирает номер в форме и прокручивает к ней. */
export const BOOK_ROOM_EVENT = "silkx:book-room";

export function requestRoomBooking(roomId: string): void {
  window.dispatchEvent(new CustomEvent<string>(BOOK_ROOM_EVENT, { detail: roomId }));
  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type ApiResponse = { ok: true; id: string; nights: number; total: number } | { ok: false; error?: string; fieldErrors?: BookingErrors };

const INPUT =
  "h-12 w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60 focus:outline-none";

export function BookingForm({ hotel, className }: { hotel: Hotel; className?: string }) {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;

  const [roomId, setRoomId] = useState(hotel.rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ id: string; nights: number; total: number } | null>(null);
  const [today, setToday] = useState("");

  // Даты по умолчанию — завтра на 2 ночи (считаем на клиенте, чтобы не было рассинхрона SSR)
  useEffect(() => {
    const t = todayInTashkent();
    setToday(t);
    setCheckIn(addDays(t, 1));
    setCheckOut(addDays(t, 3));
  }, []);

  useEffect(() => {
    const onBook = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (hotel.rooms.some((r) => r.id === detail)) {
        setRoomId(detail);
        setDone(null);
      }
    };
    window.addEventListener(BOOK_ROOM_EVENT, onBook);
    return () => window.removeEventListener(BOOK_ROOM_EVENT, onBook);
  }, [hotel.rooms]);

  const room = hotel.rooms.find((r) => r.id === roomId);
  const nights = useMemo(() => countNights(checkIn, checkOut), [checkIn, checkOut]);
  const total = room && nights > 0 ? room.price * nights : 0;
  const maxGuests = room?.capacity ?? 4;

  // Если выбран номер поменьше — уменьшаем число гостей
  useEffect(() => {
    if (Number(guests) > maxGuests) setGuests(String(maxGuests));
  }, [guests, maxGuests]);

  const clearError = (f: BookingField) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { hotelId: hotel.id, roomId, checkIn, checkOut, guests, name, phone, comment, agree, website: honeypot };
    const pre = validateBooking(payload);
    if (pre.ok === false) {
      setErrors(pre.errors);
      const first = Object.keys(pre.errors)[0];
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok || !data || data.ok === false) {
        if (data && data.ok === false && data.fieldErrors) setErrors(data.fieldErrors);
        toast.error((data && data.ok === false && data.error) || "Не удалось отправить заявку. Позвоните в отель.");
        return;
      }
      setDone({ id: data.id, nights: data.nights, total: data.total });
      toast.success("Заявка на бронь отправлена");
    } catch {
      toast.error("Нет соединения. Проверьте интернет или позвоните в отель.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div id="booking" className={cn("terminal-panel scroll-mt-24 space-y-4 p-6 text-center", className)} role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <h2 className="text-xl">Заявка принята</h2>
        <p className="text-sm leading-relaxed">
          {hotel.name} подтвердит наличие номера «{room?.name}» и свяжется с вами по указанному телефону.
          <br />
          {done.nights} ноч. · ≈ ${formatNumber(done.total)}
        </p>
        <p className="text-xs text-body">Номер заявки: {done.id}</p>
        <a
          href={telHref(hotel.phone)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold-muted font-heading font-semibold text-gold transition-colors hover:border-gold"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {hotel.phone}
        </a>
        <button type="button" onClick={() => setDone(null)} className="text-sm text-body underline-offset-4 hover:text-gold hover:underline">
          Новая заявка
        </button>
      </div>
    );
  }

  const err = (f: BookingField) =>
    errors[f] ? (
      <p id={`${id(f)}-err`} className="text-xs text-destructive">
        {errors[f]}
      </p>
    ) : null;
  const aria = (f: BookingField) => ({ "aria-invalid": Boolean(errors[f]) || undefined, "aria-describedby": errors[f] ? `${id(f)}-err` : undefined });
  const border = (f: BookingField) => (errors[f] ? "border-destructive" : "border-input");
  const label = "text-xs font-medium uppercase tracking-wider text-body";

  return (
    <form id="booking" onSubmit={onSubmit} noValidate className={cn("terminal-panel scroll-mt-24 space-y-4 p-5 sm:p-6", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Онлайн-бронирование</p>
        <h2 className="mt-1 text-xl">Забронировать номер</h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("roomId")} className={label}>
          Номер
        </label>
        <NativeSelect
          id={id("roomId")}
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            clearError("roomId");
          }}
          className={border("roomId")}
          {...aria("roomId")}
        >
          {hotel.rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — ${formatNumber(r.price)} / ночь
            </option>
          ))}
        </NativeSelect>
        {err("roomId")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={id("checkIn")} className={label}>
            Заезд
          </label>
          <input
            id={id("checkIn")}
            type="date"
            min={today || undefined}
            value={checkIn}
            onChange={(e) => {
              const v = e.target.value;
              setCheckIn(v);
              clearError("checkIn");
              if (v && (!checkOut || checkOut <= v)) setCheckOut(addDays(v, 1));
            }}
            className={cn(INPUT, border("checkIn"))}
            {...aria("checkIn")}
          />
          {err("checkIn")}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={id("checkOut")} className={label}>
            Выезд
          </label>
          <input
            id={id("checkOut")}
            type="date"
            min={checkIn ? addDays(checkIn, 1) : today || undefined}
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value);
              clearError("checkOut");
            }}
            className={cn(INPUT, border("checkOut"))}
            {...aria("checkOut")}
          />
          {err("checkOut")}
        </div>
      </div>
      <p className="-mt-2 text-xs text-body">
        Заезд с {hotel.checkIn}, выезд до {hotel.checkOut}
      </p>

      <div className="space-y-1.5">
        <label htmlFor={id("guests")} className={label}>
          Гостей
        </label>
        <NativeSelect
          id={id("guests")}
          value={guests}
          onChange={(e) => {
            setGuests(e.target.value);
            clearError("guests");
          }}
          className={border("guests")}
          {...aria("guests")}
        >
          {Array.from({ length: maxGuests }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </NativeSelect>
        {err("guests")}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("name")} className={label}>
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
        <label htmlFor={id("phone")} className={label}>
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

      <div className="space-y-1.5">
        <label htmlFor={id("comment")} className={label}>
          Пожелания <span className="normal-case tracking-normal text-body/70">(необязательно)</span>
        </label>
        <textarea
          id={id("comment")}
          rows={2}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Поздний заезд, трансфер, детская кроватка…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-heading placeholder:text-body/60 transition-colors focus:border-gold/60 focus:outline-none"
        />
      </div>

      {/* Honeypot — скрытое поле для ботов */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between rounded-lg bg-gold-muted px-4 py-3" aria-live="polite">
        <span className="text-sm text-body">{nights > 0 ? `${nights} ноч. × $${formatNumber(room?.price ?? 0)}` : "Выберите даты"}</span>
        <span className="tabular font-heading text-lg font-bold text-heading">{total > 0 ? `$${formatNumber(total)}` : "—"}</span>
      </div>

      <p className="-mt-2 text-xs leading-relaxed text-body">
        Сумма ориентировочная: цена за ночь × ночи. SILKX не берёт комиссию с гостя. Туристический сбор и доп. услуги, если
        есть, отель сообщит при подтверждении — до заезда.
      </p>

      <ConsentCheckbox
        id={id("agree")}
        checked={agree}
        onChange={(v) => {
          setAgree(v);
          clearError("agree");
        }}
        error={errors.agree}
        purpose="обработки заявки на бронирование и передачи её отелю"
      />

      <button
        type="submit"
        disabled={sending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover active:bg-gold-active disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
        Забронировать
      </button>
      <p className="text-center text-xs text-body">
        Без предоплаты. Отель подтвердит бронь по телефону.{" "}
        <a href={telHref(hotel.phone)} className="whitespace-nowrap text-gold hover:underline">
          {hotel.phone}
        </a>
      </p>
    </form>
  );
}

export default BookingForm;
