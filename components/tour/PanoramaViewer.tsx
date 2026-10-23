"use client";

import { Expand, Loader2, Minimize, Move3d, RotateCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { TourScene } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 3D-тур 360° на чистом WebGL — без three.js и других зависимостей (~0 КБ к бандлу сверх кода).
 * Принимает равнопромежуточные (equirectangular, 2:1) панорамы — формат режима «Панорама 360°»
 * камер Insta360 / Ricoh Theta и приложений сферических панорам.
 *
 * Управление: перетаскивание (мышь/палец), колесо и щипок — зум, стрелки и +/- с клавиатуры,
 * медленное автовращение до первого касания, полноэкранный режим.
 */

const FOV_MIN = 35;
const FOV_MAX = 100;
const FOV_DEFAULT = 80;
const PITCH_LIMIT = 85;
const AUTO_ROTATE_DEG_PER_SEC = 4;
const INERTIA_DAMPING = 0.92;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Для каждого пикселя строим луч камеры и переводим направление в (долгота, широта) → UV панорамы.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uYaw;
uniform float uPitch;
uniform float uTanHalfFov;
uniform float uAspect;
const float PI = 3.141592653589793;
void main() {
  vec3 dir = normalize(vec3(vUv.x * uTanHalfFov * uAspect, vUv.y * uTanHalfFov, -1.0));
  float cp = cos(uPitch), sp = sin(uPitch);
  dir = vec3(dir.x, dir.y * cp + dir.z * sp, -dir.y * sp + dir.z * cp);
  float cy = cos(uYaw), sy = sin(uYaw);
  dir = vec3(dir.x * cy - dir.z * sy, dir.y, dir.x * sy + dir.z * cy);
  float lon = atan(dir.x, -dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  gl_FragColor = texture2D(uTex, uv);
}`;

type Status = "loading" | "ready" | "error" | "unsupported";

interface Renderer {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture | null;
  buffer: WebGLBuffer | null;
  uniforms: {
    yaw: WebGLUniformLocation | null;
    pitch: WebGLUniformLocation | null;
    tanHalfFov: WebGLUniformLocation | null;
    aspect: WebGLUniformLocation | null;
  };
  maxTexture: number;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log ?? "unknown"}`);
  }
  return shader;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // Один треугольник, покрывающий экран, — дешевле квадрата из двух.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    program,
    texture: null,
    buffer,
    uniforms: {
      yaw: gl.getUniformLocation(program, "uYaw"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      tanHalfFov: gl.getUniformLocation(program, "uTanHalfFov"),
      aspect: gl.getUniformLocation(program, "uAspect"),
    },
    maxTexture: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, 8192),
  };
}

/** Слишком большие панорамы (телефоны снимают до 12 000 px) ужимаем под лимит GPU. */
function fitToTexture(img: HTMLImageElement, max: number): TexImageSource {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w <= max && h <= max) return img;
  const scale = max / Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(w * scale);
  canvas.height = Math.floor(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // панорамы из Supabase Storage / CDN
    img.decoding = "async";
    const onAbort = () => {
      img.src = "";
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    img.onload = () => {
      signal.removeEventListener("abort", onAbort);
      resolve(img);
    };
    img.onerror = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new Error(`Не удалось загрузить панораму: ${src}`));
    };
    img.src = src;
  });
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface PanoramaViewerProps {
  scenes: TourScene[];
  initialSceneId?: string;
  className?: string;
  /** Компактный режим (превью в форме): без полноэкранной кнопки и подписи. */
  compact?: boolean;
}

export function PanoramaViewer({ scenes, initialSceneId, className, compact = false }: PanoramaViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const rafRef = useRef<number | null>(null);

  // Состояние камеры в ref: меняется 60 раз/сек — React-ререндеры тут не нужны.
  const view = useRef({ yaw: 0, pitch: 0, fov: FOV_DEFAULT, vYaw: 0, vPitch: 0, auto: true, dirty: true });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);

  const [sceneId, setSceneId] = useState(() => initialSceneId ?? scenes[0]?.id ?? "");
  const [status, setStatus] = useState<Status>("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];

  // --- рендер-цикл ------------------------------------------------------------
  const draw = useCallback(() => {
    const r = rendererRef.current;
    const canvas = canvasRef.current;
    if (!r || !canvas || !r.texture) return;
    const { gl, uniforms } = r;
    const v = view.current;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uniforms.yaw, toRad(v.yaw));
    gl.uniform1f(uniforms.pitch, toRad(v.pitch));
    gl.uniform1f(uniforms.tanHalfFov, Math.tan(toRad(v.fov) / 2));
    gl.uniform1f(uniforms.aspect, canvas.width / Math.max(1, canvas.height));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, []);

  const tick = useCallback(
    (now: number) => {
      const v = view.current;
      const dt = lastTime.current === null ? 0 : Math.min(0.05, (now - lastTime.current) / 1000);
      lastTime.current = now;
      const dragging = pointers.current.size > 0;

      if (!dragging) {
        if (Math.abs(v.vYaw) > 0.01 || Math.abs(v.vPitch) > 0.01) {
          v.yaw += v.vYaw;
          v.pitch = clamp(v.pitch + v.vPitch, -PITCH_LIMIT, PITCH_LIMIT);
          v.vYaw *= INERTIA_DAMPING;
          v.vPitch *= INERTIA_DAMPING;
          v.dirty = true;
        } else if (v.auto) {
          v.yaw += AUTO_ROTATE_DEG_PER_SEC * dt;
          v.dirty = true;
        }
      }
      if (v.dirty) {
        v.yaw = ((v.yaw % 360) + 360) % 360;
        draw();
        v.dirty = false;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [draw],
  );

  // --- инициализация WebGL ------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer | null = null;
    try {
      renderer = createRenderer(canvas);
    } catch {
      renderer = null;
    }
    if (!renderer) {
      setStatus("unsupported");
      return;
    }
    rendererRef.current = renderer;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.max(1, Math.floor(clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(clientHeight * dpr));
      view.current.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Вкладка в фоне — не тратим батарею
    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (rafRef.current === null) {
        lastTime.current = null;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    rafRef.current = requestAnimationFrame(tick);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setStatus("error");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      const r = rendererRef.current;
      if (r) {
        if (r.texture) r.gl.deleteTexture(r.texture);
        if (r.buffer) r.gl.deleteBuffer(r.buffer);
        r.gl.deleteProgram(r.program);
      }
      rendererRef.current = null;
    };
  }, [tick]);

  // --- загрузка панорамы текущей комнаты -----------------------------------------
  useEffect(() => {
    const r = rendererRef.current;
    if (!r || !scene) return;
    const controller = new AbortController();
    setStatus("loading");

    loadImage(scene.src, controller.signal)
      .catch((err: unknown) => {
        // Основная панорама недоступна — пробуем запасную (если есть)
        if (scene.fallbackSrc && !(err instanceof DOMException && err.name === "AbortError")) {
          return loadImage(scene.fallbackSrc, controller.signal);
        }
        throw err;
      })
      .then((img) => {
        const { gl } = r;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // NPOT-текстуры в WebGL1: только CLAMP и без мипмапов
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fitToTexture(img, r.maxTexture));
        if (r.texture) gl.deleteTexture(r.texture);
        r.texture = tex;
        view.current.dirty = true;
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [scene]);

  // --- управление -----------------------------------------------------------------
  const stopAuto = () => {
    view.current.auto = false;
    setHintVisible(false);
  };

  const degPerPx = () => {
    const canvas = canvasRef.current;
    const h = canvas?.clientHeight || 1;
    return view.current.fov / h;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stopAuto();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    view.current.vYaw = 0;
    view.current.vPitch = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const v = view.current;

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current) {
        v.fov = clamp(v.fov * (pinchDist.current / dist), FOV_MIN, FOV_MAX);
        v.dirty = true;
      }
      pinchDist.current = dist;
      return;
    }

    const k = degPerPx();
    const dYaw = -(e.clientX - prev.x) * k;
    const dPitch = (e.clientY - prev.y) * k;
    v.yaw += dYaw;
    v.pitch = clamp(v.pitch + dPitch, -PITCH_LIMIT, PITCH_LIMIT);
    v.vYaw = dYaw;
    v.vPitch = dPitch;
    v.dirty = true;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  };

  // wheel с passive:false — иначе нельзя запретить прокрутку страницы
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAuto();
      const v = view.current;
      v.fov = clamp(v.fov + e.deltaY * 0.05, FOV_MIN, FOV_MAX);
      v.dirty = true;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const v = view.current;
    const step = 6;
    const handled: Record<string, () => void> = {
      ArrowLeft: () => (v.yaw -= step),
      ArrowRight: () => (v.yaw += step),
      ArrowUp: () => (v.pitch = clamp(v.pitch + step, -PITCH_LIMIT, PITCH_LIMIT)),
      ArrowDown: () => (v.pitch = clamp(v.pitch - step, -PITCH_LIMIT, PITCH_LIMIT)),
      "+": () => (v.fov = clamp(v.fov - 5, FOV_MIN, FOV_MAX)),
      "=": () => (v.fov = clamp(v.fov - 5, FOV_MIN, FOV_MAX)),
      "-": () => (v.fov = clamp(v.fov + 5, FOV_MIN, FOV_MAX)),
    };
    const fn = handled[e.key];
    if (!fn) return;
    e.preventDefault();
    stopAuto();
    fn();
    v.dirty = true;
  };

  // --- полноэкранный режим ----------------------------------------------------------
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* iOS Safari не поддерживает Fullscreen API для div — просто игнорируем */
    }
  };

  const resetView = () => {
    Object.assign(view.current, { yaw: 0, pitch: 0, fov: FOV_DEFAULT, vYaw: 0, vPitch: 0, dirty: true });
  };

  const canFullscreen = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);

  if (!scene) return null;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="3D-тур 360°"
      aria-label={`3D-тур: ${scene.title}. Перетаскивайте, чтобы осмотреться. Стрелки — поворот, плюс и минус — зум.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("relative isolate overflow-hidden rounded-lg bg-black outline-none", isFullscreen && "rounded-none", className)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden="true" />
          <span className="sr-only">Загружаем панораму…</span>
        </div>
      )}

      {(status === "error" || status === "unsupported") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card p-6 text-center">
          <TriangleAlert className="h-7 w-7 text-gold" aria-hidden="true" />
          <p className="text-sm">
            {status === "unsupported"
              ? "Ваш браузер не поддерживает 3D-просмотр (WebGL)."
              : "Не удалось загрузить панораму. Проверьте интернет и попробуйте ещё раз."}
          </p>
        </div>
      )}

      {status === "ready" && hintVisible && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-sm text-white backdrop-blur">
            <Move3d className="h-4 w-4 text-gold" aria-hidden="true" />
            Потяните, чтобы осмотреться
          </span>
        </div>
      )}

      {/* Панель управления */}
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={resetView}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
          aria-label="Сбросить вид"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
        </button>
        {!compact && canFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" aria-hidden="true" /> : <Expand className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Переключатель комнат */}
      {scenes.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-none" role="tablist" aria-label="Комнаты">
            {scenes.map((s) => {
              const active = s.id === scene.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (active) return;
                    resetView();
                    setSceneId(s.id);
                  }}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur transition-colors",
                    active
                      ? "border-gold bg-gold text-graphite"
                      : "border-white/20 bg-black/40 text-white hover:border-gold/60",
                  )}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PanoramaViewer;
