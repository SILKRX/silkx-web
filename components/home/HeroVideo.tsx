"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Видео-фон Hero поверх анимированного «ночного Ташкента» (TashkentSky остаётся подложкой):
 * пока видео грузится, при ошибке, при «Экономии трафика» и «Уменьшении движения» виден SVG-фон.
 * Видео плавно проявляется, только когда реально заиграло — без чёрного экрана и спиннера YouTube.
 */
export function HeroVideo({ className }: { className?: string }) {
  const { mp4, poster, youtubeId, startSec } = SITE.heroVideo;
  const [allowed, setAllowed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    if (!reduce && !slow) setAllowed(true);
  }, []);

  if (!allowed || (!mp4 && !youtubeId)) return null;

  const overlay = (
    <>
      {/* Затемнение: текст читается на любом кадре */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </>
  );

  const fade = cn("absolute inset-0 transition-opacity duration-[1500ms] ease-out", visible ? "opacity-100" : "opacity-0");

  if (mp4) {
    return (
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
        <video
          className={cn(fade, "h-full w-full object-cover")}
          src={mp4}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlaying={() => setVisible(true)}
          onError={() => setVisible(false)}
        />
        {visible && overlay}
      </div>
    );
  }

  return <YouTubeBackground id={youtubeId} start={startSec} visible={visible} onPlaying={() => setVisible(true)} overlay={overlay} className={className} fade={fade} />;
}

// ---------------------------------------------------------------------------------------------
// YouTube через официальный IFrame API: видео проявляется ТОЛЬКО в состоянии PLAYING.
// Если ролик недоступен (встраивание запрещено автором, YouTube заблокирован, нет сети) —
// плеер не показывается вовсе и остаётся анимированный «ночной Ташкент».
// ---------------------------------------------------------------------------------------------
interface YTPlayer {
  destroy(): void;
  playVideo(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars: Record<string, string | number>;
      events: { onReady?: (e: { target: YTPlayer }) => void; onStateChange?: (e: { data: number }) => void; onError?: () => void };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      ytApiPromise = null;
      reject(new Error("YouTube API недоступен"));
    };
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

function YouTubeBackground({
  id,
  start,
  visible,
  onPlaying,
  overlay,
  className,
  fade,
}: {
  id: string;
  start: number;
  visible: boolean;
  onPlaying: () => void;
  overlay: ReactNode;
  className?: string;
  fade: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onPlayingRef = useRef(onPlaying);
  onPlayingRef.current = onPlaying;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let player: YTPlayer | null = null;
    let cancelled = false;
    const mount = document.createElement("div"); // YT заменяет этот div на iframe
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId: id,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: id, // нужен, чтобы loop работал для одного ролика
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start,
          },
          events: {
            onReady: (e) => e.target.playVideo(),
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) onPlayingRef.current();
            },
          },
        });
      })
      .catch(() => {
        /* остаётся SVG-фон */
      });

    return () => {
      cancelled = true;
      player?.destroy();
      mount.remove();
    };
  }, [id, start]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      style={{ containerType: "size" }}
    >
      {/* «cover» для 16:9 в контейнере любой формы; scale прячет заголовок и логотип плеера по краям */}
      <div
        ref={hostRef}
        className={cn(fade, "[&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0")}
        style={{
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          width: "max(100%, calc(100cqh * 16 / 9))",
          height: "max(100%, calc(100cqw * 9 / 16))",
          transform: "translate(-50%, -50%) scale(1.2)",
        }}
      />
      {visible && overlay}
    </div>
  );
}

export default HeroVideo;
