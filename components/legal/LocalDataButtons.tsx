"use client";

import { Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { clearLocalSiteData, openConsentSettings } from "@/lib/consent";
import { cn } from "@/lib/utils";

const BTN =
  "inline-flex h-11 items-center gap-2 rounded-lg border border-line/15 px-4 font-heading text-sm font-semibold text-heading transition-colors hover:border-gold/60";

export function CookieSettingsButton({ className, label = "Изменить настройки cookies" }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={cn(BTN, className)}>
      <Settings2 className="h-4 w-4 text-gold" aria-hidden="true" />
      {label}
    </button>
  );
}

/** Мгновенное удаление всего, что SILKX сохранил в этом браузере. */
export function ClearDeviceDataButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!window.confirm("Удалить с этого устройства тему, язык, черновик объявления, профиль продавца и выбор cookies?")) return;
        const n = clearLocalSiteData();
        toast.success(n > 0 ? "Данные на этом устройстве удалены" : "На этом устройстве нет сохранённых данных SILKX");
        window.setTimeout(() => window.location.reload(), 800);
      }}
      className={cn(BTN, "hover:border-destructive/60", className)}
    >
      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
      Удалить данные на этом устройстве
    </button>
  );
}

/** Кнопка-ссылка для подвала. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={cn("text-left text-body transition-colors hover:text-gold", className)}>
      Настройки cookies
    </button>
  );
}
