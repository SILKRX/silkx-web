"use client";

import { Bot, Loader2, MessageCircle, SendHorizonal, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type Role = "bot" | "user";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
}

const MAX_MESSAGE_LENGTH = 500;
const MOCK_REPLY_DELAY_MS = 900;

// crypto.randomUUID недоступен по http (например, при тесте с телефона по 192.168.x.x),
// поэтому простой монотонный счётчик — надёжнее.
let messageSeq = 0;
const nextId = (): string => `m-${Date.now().toString(36)}-${(messageSeq++).toString(36)}`;

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "init-bot", role: "bot", text: "Здравствуйте! Ищете аренду или покупку?" },
  { id: "init-user", role: "user", text: "Покупку. Интересует 2-комнатная в Мирзо-Улугбекском районе." },
];

/**
 * Временный мок ответов, пока нет бэкенда ИИ.
 * При подключении LLM заменить тело на fetch("/api/assistant") — сигнатура не изменится.
 */
async function getMockReply(userText: string, signal: AbortSignal): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, MOCK_REPLY_DELAY_MS);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  const text = userText.toLowerCase();
  if (/аренд|снять|сним|rent/.test(text)) {
    return "Подберу аренду. Подскажите район и бюджет в месяц — покажу свободные варианты.";
  }
  if (/куп|новостро|ипотек|рассроч/.test(text)) {
    return "Отлично! Пришлю PDF-презентации подходящих ЖК с ценами. Оставьте номер в карточке объекта — менеджер свяжется в течение 15 минут.";
  }
  if (/цен|стоим|сколько/.test(text)) {
    return "Цены зависят от ЖК и этажа. Откройте карточку объекта и нажмите «Узнать цены» — пришлём актуальный прайс.";
  }
  return "Понял вас. Уточните, пожалуйста, район и бюджет — подберу лучшие варианты.";
}

export interface AIAssistantProps {
  className?: string;
}

/**
 * Плавающий виджет ИИ-ассистента.
 * На страницах со sticky-CTA задайте CSS-переменную --ai-offset (например, style={{ "--ai-offset": "5rem" }}
 * на обёртке страницы), чтобы кнопка не перекрывала панель заявки.
 */
export function AIAssistant({ className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const panelId = useId();
  const titleId = useId();

  const trimmed = input.trim();
  const canSend = trimmed.length > 0 && !isTyping;

  // Автоскролл к последнему сообщению
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // Фокус в инпут при открытии (на десктопе). На тач-устройствах не открываем клавиатуру сами.
  useEffect(() => {
    if (!isOpen) return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (isFinePointer) inputRef.current?.focus();
  }, [isOpen]);

  // Отмена «ответа» при размонтировании — без setState на размонтированном компоненте
  useEffect(() => () => abortRef.current?.abort(), []);

  const close = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || isTyping) return; // защита от двойной отправки

    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setInput("");
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await getMockReply(text, controller.signal);
      setMessages((prev) => [...prev, { id: nextId(), role: "bot", text: reply }]);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "bot", text: "Не удалось получить ответ. Проверьте соединение и попробуйте ещё раз." },
      ]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsTyping(false);
      }
    }
  }, [input, isTyping]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send();
  };

  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") close();
  };

  return (
    <div
      className={cn("fixed right-4 z-50 flex flex-col items-end gap-3", className)}
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom) + var(--ai-offset, 0px))" }}
    >
      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={handlePanelKeyDown}
          className={cn(
            "flex h-96 w-[calc(100vw-2rem)] max-w-[20rem] flex-col overflow-hidden rounded-xl",
            "max-h-[calc(100dvh-7rem)] border border-white/10 bg-card shadow-panel",
            "animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-200",
          )}
        >
          {/* Заголовок */}
          <header className="flex items-center justify-between border-b border-white/5 bg-deep-blue px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold-muted">
                <Bot className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-deep-blue" />
              </span>
              <div>
                <h2 id={titleId} className="font-heading text-sm font-semibold leading-tight text-heading">
                  SILKX AI
                </h2>
                <p className="text-[11px] leading-tight text-body">Онлайн · отвечает за секунды</p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть чат"
              className="rounded-md p-1.5 text-body transition-colors hover:bg-white/5 hover:text-heading"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Сообщения */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-sm bg-gold text-graphite"
                      : "rounded-bl-sm bg-white/5 text-heading",
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "Вы: " : "SILKX AI: "}</span>
                  {m.text}
                </p>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start" aria-label="SILKX AI печатает">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/5 px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body" />
                </div>
              </div>
            )}
          </div>

          {/* Ввод */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/5 p-3">
            <label htmlFor={`${panelId}-input`} className="sr-only">
              Сообщение для SILKX AI
            </label>
            <input
              ref={inputRef}
              id={`${panelId}-input`}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Напишите вопрос…"
              autoComplete="off"
              enterKeyHint="send"
              className={cn(
                "h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-heading",
                "placeholder:text-body/60 focus:border-gold/60 focus:outline-none",
              )}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Отправить сообщение"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold text-graphite",
                "transition-colors hover:bg-gold-hover active:bg-gold-active",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}

      {/* Кнопка-триггер */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={isOpen ? "Свернуть чат с SILKX AI" : "Открыть чат с SILKX AI"}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-gold text-graphite shadow-panel",
          "transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-gold-hover active:scale-95",
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default AIAssistant;
