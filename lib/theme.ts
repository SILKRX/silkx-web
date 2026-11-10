/**
 * Тема сайта: "light" (по умолчанию) или "dark" — класс .dark на <html>.
 * Выбор хранится в localStorage; до гидрации его применяет THEME_INIT_SCRIPT (без «вспышки»).
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "silkx:theme";

const THEME_COLOR: Record<Theme, string> = { light: "#FAF8F4", dark: "#1C1C1E" };

/** Выполняется в <head> до отрисовки страницы; цвет панели браузера — после разбора <head>. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.classList.add("dark");document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${THEME_COLOR.dark}")})}}catch(e){}`;

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* приватный режим — тема просто не запомнится */
  }
}
