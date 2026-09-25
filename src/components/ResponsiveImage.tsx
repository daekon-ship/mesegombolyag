
import { useSyncExternalStore } from "react";
import type { SitePhoto } from "../lib/photos";

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
}

function getWidthSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  return 1024;
}

/** Az aktuális viewport-szélesség — SSR-biztos módon. */
function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, getWidthSnapshot, getServerSnapshot);
}

type ResponsiveImageProps = {
  photo: SitePhoto;
  /** extra osztályok az <img> elemre */
  className?: string;
  /** felülírja a photo-ban tárolt képarányt (pl. grid-oszlopban) */
  ratioOverride?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
};

/**
 * Valódi fénykép megjelenítése a központi fotódefiníció alapján:
 * képarány, fókuszpont (képernyőméret szerint), alt szöveg és
 * helyfoglalás egy kézből, hogy betöltéskor ne ugráljon a layout.
 */
export function ResponsiveImage({
  photo,
  className = "",
  ratioOverride,
  loading = "lazy",
  sizes,
}: ResponsiveImageProps) {
  const width = useViewportWidth();

  const ratio = ratioOverride ?? (width >= 1024 ? photo.ratio.lg : width >= 640 ? photo.ratio.sm : undefined) ?? photo.ratio.base;
  const [rw, rh] = ratio.split("/").map((part: string) => Number(part.trim()));

  const focus = photo.focus
    ? width >= 1024
      ? photo.focus.desktop ?? photo.focus.base
      : width < 640
        ? photo.focus.mobile ?? photo.focus.base
        : photo.focus.base
    : "50% 50%";

  const aspectRatio = Number.isFinite(rw) && Number.isFinite(rh) ? `${rw} / ${rh}` : undefined;

  return (
    <div
      className={"relative w-full overflow-hidden bg-sage"}
      style={{ aspectRatio, maxHeight: photo.topSafe ? "min(72vh, 560px)" : undefined }}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        sizes={sizes}
        loading={loading}
        decoding="async"
        className={"absolute inset-0 h-full w-full object-cover " + className}
        style={{ objectPosition: focus }}
      />
    </div>
  );
}
