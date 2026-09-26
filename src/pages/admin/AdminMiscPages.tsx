import { type FormEvent, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { heroPhoto } from "../../lib/photos";
import type { InquiryKind, SiteContent } from "../../lib/types";
import { useAppContext } from "../../context/AppState";
import { Alert, TextAreaField, TextField } from "../../components/ui/forms";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { AdminCard, ghostBtn, primaryBtn, useAdmin, useAdminAction } from "./AdminLayout";

const KIND_LABELS: Record<InquiryKind, string> = {
  general: "Általános kérdés",
  individual: "Egyéni alkalom",
  workshop: "Mesés workshop",
  mesemuhely: "Meseműhely",
  program: "Konkrét program",
};

export function AdminInquiriesPage() {
  const { data } = useAdmin();
  const act = useAdminAction();
  const [showHandled, setShowHandled] = useState(false);
  if (!data) return null;
  const list = data.inquiries.filter((i) => showHandled || i.status === "new");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-forest sm:text-4xl">Érdeklődések</h1>
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={showHandled} onChange={(e) => setShowHandled(e.target.checked)} className="h-4 w-4 accent-forest" />
          Megválaszoltak is
        </label>
      </div>
      {list.length === 0 ? (
        <AdminCard><p className="text-ink/60">{showHandled ? "Még nem érkezett érdeklődés." : "Nincs megválaszolatlan érdeklődés."}</p></AdminCard>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((i) => (
            <li key={i.id} className={`rounded-[22px] border p-5 ${i.status === "new" ? "border-forest/15 bg-white/80" : "border-forest/10 bg-white/40"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                  {i.kind === "program" && i.programTitle ? `Program: ${i.programTitle}` : KIND_LABELS[i.kind]}
                </span>
                <span className="text-xs text-ink/55">{formatDateTime(i.createdAt)}</span>
              </div>
              <p className="mt-3 font-semibold text-forest">{i.name}</p>
              <div className="mt-1 flex flex-col gap-1 text-sm text-ink/75 sm:flex-row sm:flex-wrap sm:gap-x-4">
                <a href={`mailto:${i.email}`} className="focus-ring inline-flex items-center gap-1.5 break-all hover:text-terracotta"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{i.email}</a>
                {i.phone && <a href={`tel:${i.phone.replace(/\s/g, "")}`} className="focus-ring inline-flex items-center gap-1.5 hover:text-terracotta"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{i.phone}</a>}
              </div>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{i.message}</p>
              <div className="mt-4">
                {i.status === "new" ? (
                  <button type="button" className={primaryBtn} onClick={() => act(() => api.setInquiryStatus(i.id, "handled"), "Megválaszoltnak jelölve.")}>Megválaszoltnak jelölöm</button>
                ) : (
                  <button type="button" className={ghostBtn} onClick={() => act(() => api.setInquiryStatus(i.id, "new"), "Újként jelölve.")}>Vissza újnak</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CONTENT_FIELDS: { key: keyof SiteContent; label: string; rows?: number; max: number }[] = [
  { key: "heroTitle", label: "Főcím (nyitókép)", max: 120 },
  { key: "heroSubtitle", label: "Alcím (nyitókép)", max: 160 },
  { key: "heroDescription", label: "Bevezető szöveg (nyitókép)", rows: 4, max: 600 },
  { key: "introTitle", label: "Meseterápia bemutató — cím", max: 160 },
  { key: "introText", label: "Meseterápia bemutató — szöveg", rows: 6, max: 1500 },
  { key: "contactEmail", label: "Kapcsolati e-mail-cím", max: 254 },
  { key: "contactPhone", label: "Telefonszám (üresen hagyva nem jelenik meg)", max: 40 },
  { key: "location", label: "Helyszín / város", max: 120 },
  { key: "privacyPolicy", label: "Adatkezelési tájékoztató (teljes szöveg — jogilag ellenőrzött változatot illessz be)", rows: 14, max: 30000 },
  { key: "impressum", label: "Impresszum (szolgáltató neve, székhely, nyilvántartási szám, adószám, elérhetőség, tárhelyszolgáltató)", rows: 8, max: 10000 },
];

export function AdminContentPage() {
  const { data, reload, notify } = useAdmin();
  const { setSiteContent } = useAppContext();
  const [draft, setDraft] = useState<SiteContent | null>(data?.siteContent ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data || !draft) return null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.siteContent);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || !draft) return;
    setBusy(true);
    setError(null);
    setErrors({});
    const res = await api.saveSiteContent(draft);
    setBusy(false);
    if (res.ok && res.data) {
      setSiteContent(res.data.siteContent);
      notify("success", res.message || "Mentve.");
      await reload();
    } else {
      setError(res.message || "A mentés nem sikerült.");
      setErrors(res.errors ?? {});
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-forest sm:text-4xl">Oldaltartalom</h1>
      <AdminCard>
        <form onSubmit={save} noValidate className="max-w-3xl space-y-5">
          <ImageUpload label="Nyitókép (Johanna portréja)" value={draft.heroImage} onChange={(url) => setDraft({ ...draft, heroImage: url })} fallbackPreview={heroPhoto.src} />
          {errors.heroImage && <p className="text-sm text-rose-700">{errors.heroImage}</p>}
          {CONTENT_FIELDS.map((f) =>
            f.rows ? (
              <TextAreaField key={f.key} label={f.label} rows={f.rows} maxLength={f.max} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} error={errors[f.key]} />
            ) : (
              <TextField key={f.key} label={f.label} maxLength={f.max} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} error={errors[f.key]} />
            ),
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy || !dirty} className={primaryBtn}>{busy ? "Mentés…" : "Mentés és közzététel"}</button>
            {dirty ? <span className="text-sm text-ochre">Nem mentett változások</span> : <span className="text-sm text-ink/55">Minden változás mentve</span>}
          </div>
        </form>
      </AdminCard>
    </div>
  );
}

export function AdminEmailsPage() {
  const { data } = useAdmin();
  const act = useAdminAction();
  const [busyId, setBusyId] = useState<number | null>(null);
  if (!data) return null;
  const statusText = { pending: "Küldés alatt", sent: "Elküldve", failed: "Sikertelen" } as const;
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-forest sm:text-4xl">Levélnapló</h1>
      <Alert tone={data.mailMode === "smtp" ? "info" : "error"}>
        {data.mailMode === "smtp"
          ? "A levélküldés élesítve van (SMTP). Az „Elküldve” állapot azt jelenti, hogy a levelezőszolgáltató átvette a levelet; a kézbesítést a szolgáltató végzi."
          : `A levélküldés nincs élesítve (mód: ${data.mailMode}). A foglalások és jelentkezések ettől függetlenül mentődnek, de értesítő levél nem megy ki.`}
      </Alert>
      {data.emails.length === 0 ? (
        <AdminCard><p className="text-ink/60">Még nem készült levél.</p></AdminCard>
      ) : (
        <AdminCard>
          <ul className="divide-y divide-forest/10">
            {data.emails.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest">{m.subject}</p>
                  <p className="break-all text-sm text-ink/70">{m.recipient} · {formatDateTime(m.createdAt)}</p>
                  {m.lastError && <p className="mt-1 text-sm text-rose-700">{m.lastError}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.status === "sent" ? "bg-emerald-700/10 text-emerald-800" : m.status === "failed" ? "bg-rose-700/10 text-rose-800" : "bg-ochre/20 text-[#7a5a1f]"}`}>
                    {statusText[m.status]}
                  </span>
                  {m.status === "failed" && (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      className={ghostBtn}
                      onClick={async () => {
                        setBusyId(m.id);
                        await act(() => api.retryEmail(m.id));
                        setBusyId(null);
                      }}
                    >
                      {busyId === m.id ? "Küldés…" : "Újraküldés"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}
