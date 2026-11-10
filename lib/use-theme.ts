"use client";

import { useEffect, useState } from "react";

import { getTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

/** Текущая тема с подпиской на изменения (MutationObserver на <html class>). */
export function useTheme(): Theme {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    setThemeState(getTheme());
    const obs = new MutationObserver(() => setThemeState(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}
