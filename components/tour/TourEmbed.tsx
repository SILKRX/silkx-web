"use client";

import dynamic from "next/dynamic";

import type { TourScene } from "@/lib/types";

// Встроенный тур на странице объекта. WebGL только на клиенте; пока грузится — скелетон.
const PanoramaViewer = dynamic(() => import("@/components/tour/PanoramaViewer").then((m) => m.PanoramaViewer), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

export function TourEmbed({ scenes, className }: { scenes: TourScene[]; className?: string }) {
  return <PanoramaViewer scenes={scenes} className={className} />;
}

export default TourEmbed;
