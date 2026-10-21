"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * Тосты SILKX. Тема зафиксирована на dark — next-themes не нужен (минус бандл).
 * На мобильных — сверху, чтобы не перекрывать sticky-CTA внизу экрана.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border !border-white/10 !shadow-panel !rounded-lg font-sans",
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
