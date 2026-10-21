"use client";

import { Crosshair, Loader2, MapPin, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { TASHKENT_CENTER, isInTashkent } from "@/lib/geo";
import { MAP_ENGINE, createMap, geocode, reverseGeocode } from "@/lib/maps";
import type { GeocodeResult, MapHandle } from "@/lib/maps";
import type { GeoPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface LocationValue {
  point: GeoPoint | null;
  address: string;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Куда центрировать карту, пока точка не выбрана (центр выбранного района). */
  fallbackCenter?: GeoPoint;
  error?: string;
}

const REVERSE_DEBOUNCE_MS = 600; // Nominatim: не чаще 1 запроса/сек

/**
 * Выбор местоположения «как в Яндекс Картах»: поиск адреса, «Моё местоположение»,
 * клик по карте или перетаскивание пина. Адрес подставляется автоматически, но его можно поправить.
 */
export function LocationPicker({ value, onChange, fallbackCenter, error }: LocationPickerProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MapHandle | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseAbort = useRef<AbortController | null>(null);

  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [outside, setOutside] = useState(false);

  const searchId = useId();
  const addressId = useId();

  /** Точка выбрана → проверяем город, подтягиваем адрес (с дебаунсом и отменой прошлого запроса). */
  const pick = useCallback((point: GeoPoint, address?: string) => {
    setOutside(!isInTashkent(point));
    onChangeRef.current({ point, address: address ?? valueRef.current.address });
    if (address !== undefined) return;
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(() => {
      reverseAbort.current?.abort();
      const ctrl = new AbortController();
      reverseAbort.current = ctrl;
      reverseGeocode(point, ctrl.signal)
        .then((addr) => {
          if (addr && !ctrl.signal.aborted) onChangeRef.current({ point, address: addr });
        })
        .catch(() => {
          /* адрес можно ввести вручную — не шумим */
        });
    }, REVERSE_DEBOUNCE_MS);
  }, []);

  // Инициализация карты (и повтор по кнопке после ошибки сети)
  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;
    let cancelled = false;
    setMapState("loading");
    createMap(el, {
      center: valueRef.current.point ?? fallbackCenter ?? TASHKENT_CENTER,
      zoom: valueRef.current.point ? 16 : 13,
      interactive: true,
      onPick: (p) => pick(p),
    })
      .then((h) => {
        if (cancelled) {
          h.destroy();
          return;
        }
        handleRef.current = h;
        setMapState("ready");
      })
      .catch(() => !cancelled && setMapState("error"));
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // fallbackCenter обрабатывается отдельным эффектом — не пересоздаём карту
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, pick]);

  // Сменили район, а точку ещё не ставили → переносим карту в этот район
  useEffect(() => {
    if (!fallbackCenter || valueRef.current.point) return;
    handleRef.current?.setPoint(fallbackCenter, { zoom: 14 });
  }, [fallbackCenter]);

  useEffect(
    () => () => {
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      reverseAbort.current?.abort();
    },
    [],
  );

  const onSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3 || searching) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await geocode(q);
      setResults(found);
      if (found.length === 0) setSearchError("Ничего не нашли. Уточните улицу и дом или поставьте пин на карте.");
      if (found.length === 1 && found[0]) choose(found[0]);
    } catch {
      setSearchError("Поиск временно недоступен — поставьте пин на карте вручную.");
    } finally {
      setSearching(false);
    }
  };

  const choose = (r: GeocodeResult) => {
    setResults([]);
    handleRef.current?.setPoint(r.point, { zoom: 17 });
    pick(r.point, r.address);
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      setSearchError("Геолокация не поддерживается этим браузером.");
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        handleRef.current?.setPoint(p, { zoom: 17 });
        pick(p);
      },
      (err) => {
        setLocating(false);
        setSearchError(
          err.code === err.PERMISSION_DENIED
            ? "Доступ к геолокации запрещён. Разрешите его в настройках браузера или найдите адрес поиском."
            : "Не удалось определить местоположение. Попробуйте поиск по адресу.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="space-y-3">
      {/* Поиск. Не <form>, т.к. компонент живёт внутри формы объявления (вложенные формы запрещены). */}
      <div className="flex gap-2" role="search">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Поиск адреса
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onSearch(e);
            }}
            placeholder="Улица, дом или ориентир — например, «Амира Темура 107»"
            autoComplete="off"
            className="h-12 w-full rounded-lg border border-white/10 bg-background pl-10 pr-3 text-heading placeholder:text-body/70 focus:border-gold/60"
          />
        </div>
        <button
          type="button"
          onClick={(e) => void onSearch(e)}
          disabled={searching || query.trim().length < 3}
          className="flex h-12 items-center gap-2 rounded-lg bg-gold px-4 font-heading font-semibold text-graphite transition-colors hover:bg-gold-hover disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Найти</span>
        </button>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-card text-heading transition-colors hover:border-gold/60 disabled:opacity-60"
          aria-label="Моё местоположение"
          title="Моё местоположение"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Crosshair className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {results.length > 1 && (
        <ul className="terminal-panel divide-y divide-white/5 overflow-hidden" aria-label="Найденные адреса">
          {results.map((r) => (
            <li key={`${r.point.lat},${r.point.lng}`}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm text-heading transition-colors hover:bg-white/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                {r.address}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchError && (
        <p className="text-sm text-gold" role="status">
          {searchError}
        </p>
      )}

      {/* Карта */}
      <div className={cn("relative h-72 overflow-hidden rounded-lg border sm:h-96", error ? "border-destructive" : "border-white/10")}>
        <div ref={mapElRef} className="absolute inset-0" />
        {mapState === "loading" && <div className="skeleton absolute inset-0 rounded-none" aria-label="Загружаем карту" />}
        {mapState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
            <p className="text-sm">Не удалось загрузить карту. Проверьте интернет.</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold hover:bg-gold-muted"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Повторить
            </button>
          </div>
        )}
        {mapState === "ready" && !value.point && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-white backdrop-blur">
              Нажмите на карту или перетащите пин
            </span>
          </div>
        )}
      </div>

      {outside && (
        <p className="text-sm text-gold" role="status">
          Точка за пределами Ташкента. Сейчас мы принимаем объекты только в Ташкенте.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor={addressId} className="text-xs font-medium uppercase tracking-wider text-body">
          Адрес <span className="text-gold">*</span>
        </label>
        <input
          id={addressId}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Подставится автоматически — можно поправить"
          maxLength={200}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-12 w-full rounded-lg border bg-background px-3 text-heading placeholder:text-body/70 focus:border-gold/60",
            error ? "border-destructive" : "border-white/10",
          )}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-body">
            {value.point
              ? `Координаты: ${value.point.lat.toFixed(5)}, ${value.point.lng.toFixed(5)}`
              : MAP_ENGINE === "yandex"
                ? "Карта: Яндекс"
                : "Точный адрес покупатели увидят после подтверждения модератором."}
          </p>
        )}
      </div>
    </div>
  );
}

export default LocationPicker;
