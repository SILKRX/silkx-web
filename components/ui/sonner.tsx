"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/lib/use-theme";

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * Тосты SILKX. Тема — как у сайта (светлая / тёмная).
 * На мобильных — сверху, чтобы не перекрывать sticky-CTA внизу экрана.
 */
export function Toaster(props: ToasterProps) {
  const theme = useTheme();
  return (
    <Sonner
      theme={theme}
      position="top-center"
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border !border-line/10 !shadow-panel !rounded-lg font-sans",
          title: "font-heading font-semibold",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
