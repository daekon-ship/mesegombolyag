import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { useAppContext } from "../context/AppState";

const KEY = "mesegombolyag-preview-banner-collapsed";

/**
 * Tesztelőnézet-jelzés (PREVIEW_MODE=1). Az oldal alján tapad; összecsukható egy kis címkévé,
 * de teljesen nem tüntethető el, hogy mindig egyértelmű legyen: ez nem éles jelentkezési felület.
 */
export function PreviewBanner() {
  const { site } = useAppContext();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  if (!site.previewMode) return null;

  const toggle = (value: boolean) => {
    setCollapsed(value);
    try {
      sessionStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* privát mód: nem baj */
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => toggle(false)}
        className="focus-ring fixed bottom-3 left-3 z-40 inline-flex items-center gap-1.5 rounded-full bg-ochre px-3 py-1.5 text-xs font-semibold text-ink shadow-md"
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        Tesztelőnézet
      </button>
    );
  }

  return (
    <div role="note" aria-label="Tesztelőnézet" className="sticky bottom-0 z-40 border-t border-ink/10 bg-ochre text-ink">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-2.5 text-[13px] leading-snug sm:items-center sm:px-8">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">Tesztelőnézet — még nem éles jelentkezési felület.</strong>{" "}
          Kérjük, csak tesztadatot adj meg; a beküldések nem valódi foglalások
          {site.emailNotifications ? "." : ", és e-mail-értesítés nem megy ki."}
        </p>
        <button type="button" onClick={() => toggle(true)} aria-label="Sáv összecsukása" className="focus-ring shrink-0 rounded-full p-1 hover:bg-ink/10">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
