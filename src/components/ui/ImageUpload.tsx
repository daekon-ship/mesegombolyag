import { type ChangeEvent, useId, useState } from "react";
import { ImagePlus } from "lucide-react";
import { api, mediaUrl } from "../../lib/api";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Képfeltöltés előnézettel. Csak JPG/PNG/WebP, legfeljebb 5 MB — a szerver is ellenőrzi. */
export function ImageUpload({ label, value, onChange, fallbackPreview }: { label: string; value: string; onChange: (url: string) => void; fallbackPreview?: string }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Csak JPG, PNG vagy WebP kép tölthető fel.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`A kép túl nagy (${(file.size / 1024 / 1024).toFixed(1)} MB). Legfeljebb 5 MB lehet.`);
      return;
    }
    setBusy(true);
    const res = await api.uploadImage(file);
    setBusy(false);
    if (res.ok && res.data) onChange(res.data.url);
    else setError(res.message || "A feltöltés nem sikerült.");
  }

  const preview = value ? mediaUrl(value) : fallbackPreview;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink/80">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        {preview ? (
          <img src={preview} alt="Kiválasztott kép előnézete" className="h-24 w-32 rounded-xl border border-forest/10 object-cover" />
        ) : (
          <div className="flex h-24 w-32 items-center justify-center rounded-xl border border-dashed border-forest/25 text-xs text-ink/50">Nincs kép</div>
        )}
        <div className="flex flex-wrap gap-2">
          <label htmlFor={id} className="focus-ring inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-forest/20 px-3.5 py-1.5 text-sm font-semibold text-forest hover:bg-forest/5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-terracotta">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {busy ? "Feltöltés…" : value ? "Kép cseréje" : "Kép feltöltése"}
            <input id={id} type="file" accept={ACCEPTED.join(",")} onChange={handleFile} disabled={busy} className="sr-only" />
          </label>
          {value && (
            <button type="button" onClick={() => onChange("")} className="focus-ring inline-flex min-h-10 items-center rounded-full border border-forest/20 px-3.5 py-1.5 text-sm font-semibold text-forest hover:bg-forest/5">
              Kép eltávolítása
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-ink/55">JPG, PNG vagy WebP, legfeljebb 5 MB. A változás a Mentés gombbal lesz végleges.</p>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
