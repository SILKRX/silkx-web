"use client";

import { Bot, Loader2, MessageCircle, Mic, SendHorizonal, Square, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import { formatNumber } from "@/lib/format";
import { ASSISTANT_LANGS, LANG_LABELS } from "@/lib/property-details";
import type { AssistantLang } from "@/lib/property-details";
import { cn } from "@/lib/utils";

/**
 * SILKX AI — голосовой и текстовый ассистент на 6 языках (UZ / RU / EN / ZH / KO / TR).
 *  • Голос → текст: Web Speech API (Chrome, Edge, Safari; на iPhone — Safari 14.5+).
 *  • Текст → голос: speechSynthesis с голосом нужного языка, если он есть в системе.
 *  • Ответы — /api/assistant (Claude API или встроенные правила по данным каталога).
 */

interface Item {
  id: string;
  title: string;
  href: string;
  price: number;
  currency: "USD" | "UZS";
  type: "sale" | "rent";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  items?: Item[];
}

const MAX_MESSAGE_LENGTH = 500;
const LANG_STORAGE_KEY = "silkx:assistant-lang";

/** BCP-47 для распознавания и озвучки. */
const SPEECH_LANG: Record<AssistantLang, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
  zh: "zh-CN",
  ko: "ko-KR",
  tr: "tr-TR",
};

const UI: Record<
  AssistantLang,
  {
    greeting: string;
    subtitle: string;
    placeholder: string;
    listening: string;
    send: string;
    mic: string;
    stopMic: string;
    speakOn: string;
    speakOff: string;
    noVoice: string;
    noMic: string;
    micDenied: string;
    error: string;
    open: string;
    close: string;
    suggestions: string[];
  }
> = {
  ru: {
    greeting: "Здравствуйте! Я SILKX AI. Спросите голосом или текстом: подберу жильё, проверю ипотеку, расскажу условия аренды и для иностранцев.",
    subtitle: "Голос и чат · 6 языков",
    placeholder: "Вопрос или нажмите микрофон…",
    listening: "Слушаю…",
    send: "Отправить",
    mic: "Сказать голосом",
    stopMic: "Остановить запись",
    speakOn: "Озвучивать ответы",
    speakOff: "Не озвучивать",
    noVoice: "В этом браузере нет голоса для выбранного языка — ответ показан текстом.",
    noMic: "Голосовой ввод не поддерживается этим браузером. Попробуйте Chrome или Safari.",
    micDenied: "Нет доступа к микрофону. Разрешите его в настройках браузера.",
    error: "Не удалось получить ответ. Проверьте интернет и попробуйте ещё раз.",
    open: "Открыть SILKX AI",
    close: "Закрыть",
    suggestions: ["Квартира студенту у вузов", "Можно купить в ипотеку?", "Варианты для клиента из Китая"],
  },
  uz: {
    greeting: "Assalomu alaykum! Men SILKX AI. Ovoz yoki matn bilan so'rang: uy topaman, ipotekani tekshiraman, ijara va chet elliklar uchun shartlarni aytaman.",
    subtitle: "Ovoz va chat · 6 til",
    placeholder: "Savol yozing yoki mikrofonni bosing…",
    listening: "Tinglayapman…",
    send: "Yuborish",
    mic: "Ovoz bilan aytish",
    stopMic: "Yozishni to'xtatish",
    speakOn: "Javoblarni ovozda o'qish",
    speakOff: "Ovozsiz",
    noVoice: "Bu brauzerda tanlangan til uchun ovoz yo'q — javob matnda ko'rsatildi.",
    noMic: "Bu brauzer ovozli kiritishni qo'llab-quvvatlamaydi. Chrome yoki Safari'ni sinab ko'ring.",
    micDenied: "Mikrofonga ruxsat yo'q. Brauzer sozlamalarida ruxsat bering.",
    error: "Javob olinmadi. Internetni tekshirib, qayta urinib ko'ring.",
    open: "SILKX AI ni ochish",
    close: "Yopish",
    suggestions: ["Talaba uchun universitet yonida", "Ipotekaga olsa bo'ladimi?", "Xitoylik mijoz uchun"],
  },
  en: {
    greeting: "Hi! I'm SILKX AI. Ask by voice or text: I'll find a home, check mortgage eligibility, and explain rental terms and rules for foreigners.",
    subtitle: "Voice & chat · 6 languages",
    placeholder: "Ask a question or tap the mic…",
    listening: "Listening…",
    send: "Send",
    mic: "Speak",
    stopMic: "Stop recording",
    speakOn: "Read answers aloud",
    speakOff: "Mute",
    noVoice: "This browser has no voice for the selected language — the answer is shown as text.",
    noMic: "Voice input isn't supported in this browser. Try Chrome or Safari.",
    micDenied: "Microphone access is blocked. Allow it in your browser settings.",
    error: "Couldn't get an answer. Check your connection and try again.",
    open: "Open SILKX AI",
    close: "Close",
    suggestions: ["Student flat near universities", "Can I buy it with a mortgage?", "Options for a client from China"],
  },
  zh: {
    greeting: "您好！我是 SILKX AI。可以语音或文字提问：帮您找房、评估贷款、介绍租房条件和外国人购房规定。",
    subtitle: "语音与聊天 · 6种语言",
    placeholder: "输入问题或点击麦克风…",
    listening: "正在聆听…",
    send: "发送",
    mic: "语音输入",
    stopMic: "停止录音",
    speakOn: "语音播报回答",
    speakOff: "静音",
    noVoice: "当前浏览器没有该语言的语音，已以文字显示回答。",
    noMic: "此浏览器不支持语音输入，请使用 Chrome 或 Safari。",
    micDenied: "麦克风权限被拒绝，请在浏览器设置中允许。",
    error: "无法获取回答，请检查网络后重试。",
    open: "打开 SILKX AI",
    close: "关闭",
    suggestions: ["大学附近的学生公寓", "这套房可以贷款吗？", "适合中国客户的房源"],
  },
  ko: {
    greeting: "안녕하세요! SILKX AI입니다. 음성이나 텍스트로 물어보세요: 집을 찾아드리고, 대출 가능 여부와 임대·외국인 조건을 안내해 드려요.",
    subtitle: "음성 & 채팅 · 6개 언어",
    placeholder: "질문을 입력하거나 마이크를 누르세요…",
    listening: "듣고 있어요…",
    send: "보내기",
    mic: "음성으로 말하기",
    stopMic: "녹음 중지",
    speakOn: "답변 읽어주기",
    speakOff: "음소거",
    noVoice: "이 브라우저에는 선택한 언어의 음성이 없어 텍스트로 표시합니다.",
    noMic: "이 브라우저는 음성 입력을 지원하지 않습니다. Chrome이나 Safari를 사용해 보세요.",
    micDenied: "마이크 권한이 차단되었습니다. 브라우저 설정에서 허용해 주세요.",
    error: "답변을 받지 못했습니다. 인터넷 연결을 확인하고 다시 시도하세요.",
    open: "SILKX AI 열기",
    close: "닫기",
    suggestions: ["대학 근처 학생용 집", "대출로 살 수 있나요?", "중국 고객용 매물"],
  },
  tr: {
    greeting: "Merhaba! Ben SILKX AI. Sesle veya yazarak sorun: ev bulurum, kredi uygunluğunu kontrol ederim, kira ve yabancılar için şartları anlatırım.",
    subtitle: "Ses ve sohbet · 6 dil",
    placeholder: "Soru yazın veya mikrofona dokunun…",
    listening: "Dinliyorum…",
    send: "Gönder",
    mic: "Sesle söyle",
    stopMic: "Kaydı durdur",
    speakOn: "Cevapları sesli oku",
    speakOff: "Sessiz",
    noVoice: "Bu tarayıcıda seçilen dil için ses yok — cevap yazılı gösterildi.",
    noMic: "Bu tarayıcı sesli girişi desteklemiyor. Chrome veya Safari deneyin.",
    micDenied: "Mikrofon izni engellendi. Tarayıcı ayarlarından izin verin.",
    error: "Cevap alınamadı. İnternetinizi kontrol edip tekrar deneyin.",
    open: "SILKX AI'yi aç",
    close: "Kapat",
    suggestions: ["Üniversite yakını öğrenci evi", "Krediyle alabilir miyim?", "Çinli müşteri için seçenekler"],
  },
};

// --- Web Speech API: минимальные типы (их нет в lib.dom для webkit-префикса) -------------------
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickVoice(lang: AssistantLang): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const code = SPEECH_LANG[lang].toLowerCase();
  const prefix = code.split("-")[0] ?? code;
  return (
    voices.find((v) => v.lang.toLowerCase() === code) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix)) ??
    null
  );
}

function detectInitialLang(): AssistantLang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && (ASSISTANT_LANGS as readonly string[]).includes(saved)) return saved as AssistantLang;
  } catch {
    /* private mode */
  }
  if (typeof navigator !== "undefined") {
    const nav = navigator.language.slice(0, 2).toLowerCase();
    if ((ASSISTANT_LANGS as readonly string[]).includes(nav)) return nav as AssistantLang;
  }
  return "ru";
}

let seq = 0;
const nextId = () => `m-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export interface AIAssistantProps {
  className?: string;
  /** Объект, который сейчас открыт, — ассистент отвечает про «эту квартиру». */
  propertyId?: string;
}

export function AIAssistant({ className, propertyId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<AssistantLang>("ru");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceTurnRef = useRef(false);

  const panelId = useId();
  const titleId = useId();
  const t = UI[lang];
  const micSupported = typeof window !== "undefined" && getRecognitionCtor() !== null;

  // Язык: сохранённый или язык браузера (после монтирования — без рассинхрона SSR)
  useEffect(() => setLang(detectInitialLang()), []);
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // Голоса в Chrome подгружаются асинхронно
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [isOpen]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      recRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      const voice = pickVoice(lang);
      if (!voice) {
        setNotice(UI[lang].noVoice);
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = lang === "zh" || lang === "ko" ? 0.95 : 1;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [lang],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    recRef.current?.abort();
    stopSpeaking();
    toggleRef.current?.focus();
  }, [stopSpeaking]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!text || isTyping) return;
      const userMsg: ChatMessage = { id: nextId(), role: "user", text };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setIsTyping(true);
      setNotice(null);
      const viaVoice = voiceTurnRef.current;
      voiceTurnRef.current = false;

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, propertyId, messages: history.map(({ role, text: tx }) => ({ role, text: tx })) }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; reply?: string; items?: Item[] } | null;
        if (!res.ok || !data?.ok || !data.reply) throw new Error("bad response");
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: data.reply ?? "", items: data.items }]);
        if (autoSpeak || viaVoice) speak(data.reply);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: UI[lang].error }]);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsTyping(false);
        }
      }
    },
    [input, isTyping, messages, lang, propertyId, autoSpeak, speak],
  );

  // --- микрофон --------------------------------------------------------------------------------
  const startListening = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setNotice(t.noMic);
      return;
    }
    stopSpeaking();
    const rec = new Ctor();
    rec.lang = SPEECH_LANG[lang];
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((finalText + interim).slice(0, MAX_MESSAGE_LENGTH));
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setNotice(t.micDenied);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) {
        voiceTurnRef.current = true; // ответ на голосовой вопрос озвучиваем
        void send(finalText);
      }
    };
    recRef.current = rec;
    setNotice(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => recRef.current?.stop();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send();
  };

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") close();
  };

  const shown: ChatMessage[] = messages.length ? messages : [{ id: "greeting", role: "assistant", text: t.greeting }];

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
          onKeyDown={onPanelKeyDown}
          className={cn(
            "flex h-[34rem] w-[calc(100vw-2rem)] max-w-[23rem] flex-col overflow-hidden rounded-xl",
            "max-h-[calc(100dvh-7rem)] border border-white/10 bg-card shadow-panel",
            "animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-200",
          )}
        >
          {/* Заголовок */}
          <header className="space-y-2.5 border-b border-white/5 bg-deep-blue px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold-muted">
                  <Bot className="h-4 w-4 text-gold" aria-hidden="true" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-deep-blue" />
                </span>
                <div>
                  <h2 id={titleId} className="font-heading text-sm font-semibold leading-tight text-heading">
                    SILKX AI
                  </h2>
                  <p className="text-[11px] leading-tight text-body">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (speaking) stopSpeaking();
                    setAutoSpeak((v) => !v);
                  }}
                  aria-pressed={autoSpeak}
                  aria-label={autoSpeak ? t.speakOff : t.speakOn}
                  title={autoSpeak ? t.speakOff : t.speakOn}
                  className={cn(
                    "rounded-md p-1.5 transition-colors hover:bg-white/5",
                    autoSpeak ? "text-gold" : "text-body hover:text-heading",
                  )}
                >
                  {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.close}
                  className="rounded-md p-1.5 text-body transition-colors hover:bg-white/5 hover:text-heading"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Языки */}
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Language">
              {ASSISTANT_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  onClick={() => {
                    stopSpeaking();
                    recRef.current?.abort();
                    setLang(l);
                    setNotice(null);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    lang === l ? "bg-gold text-graphite" : "bg-white/5 text-body hover:text-heading",
                  )}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </header>

          {/* Сообщения */}
          <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {shown.map((m) => (
              <div key={m.id} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div className="group flex max-w-[88%] items-end gap-1.5">
                  <p
                    lang={m.role === "assistant" ? lang : undefined}
                    className={cn(
                      "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      m.role === "user" ? "rounded-br-sm bg-gold text-graphite" : "rounded-bl-sm bg-white/5 text-heading",
                    )}
                  >
                    {m.text}
                  </p>
                  {m.role === "assistant" && m.id !== "greeting" && (
                    <button
                      type="button"
                      onClick={() => speak(m.text)}
                      aria-label={t.speakOn}
                      className="mb-1 shrink-0 rounded-full p-1 text-body opacity-70 transition-opacity hover:text-gold group-hover:opacity-100"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {m.items?.length ? (
                  <ul className="mt-2 w-full max-w-[88%] space-y-1.5">
                    {m.items.map((it) => (
                      <li key={it.id}>
                        <Link
                          href={it.href}
                          className="flex items-center justify-between gap-2 rounded-lg border border-gold/25 bg-gold-muted px-3 py-2 text-xs transition-colors hover:border-gold"
                        >
                          <span className="truncate font-medium text-heading">{it.title}</span>
                          <span className="shrink-0 font-semibold text-gold">
                            {it.currency === "USD" ? "$" : ""}
                            {formatNumber(it.price)}
                            {it.currency === "UZS" ? " сум" : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {/* Быстрые вопросы на старте */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-body transition-colors hover:border-gold/50 hover:text-heading"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start" aria-label="SILKX AI…">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/5 px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-body" />
                </div>
              </div>
            )}
          </div>

          {notice && (
            <p className="border-t border-white/5 bg-gold-muted px-4 py-2 text-[11px] text-gold" role="status">
              {notice}
            </p>
          )}

          {/* Ввод */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/5 p-3">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              aria-label={listening ? t.stopMic : t.mic}
              aria-pressed={listening}
              title={micSupported ? (listening ? t.stopMic : t.mic) : t.noMic}
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                listening ? "border-destructive bg-destructive text-white" : "border-white/10 text-heading hover:border-gold/60",
                !micSupported && "opacity-50",
              )}
            >
              {listening ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-lg bg-destructive/40" aria-hidden="true" />
                  <Square className="relative h-3.5 w-3.5" fill="currentColor" />
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <label htmlFor={`${panelId}-input`} className="sr-only">
              {t.placeholder}
            </label>
            <input
              ref={inputRef}
              id={`${panelId}-input`}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={listening ? t.listening : t.placeholder}
              autoComplete="off"
              enterKeyHint="send"
              lang={lang}
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-heading placeholder:text-body/60 focus:border-gold/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label={t.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold text-graphite transition-colors hover:bg-gold-hover active:bg-gold-active disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}

      <button
        ref={toggleRef}
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={isOpen ? t.close : t.open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-graphite shadow-panel transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-gold-hover active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default AIAssistant;
