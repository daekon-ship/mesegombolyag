import { type FormEvent, useMemo, useState } from "react";
import { ExternalLink, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { budapestParts, formatDate, formatSessionRange, todayInBudapest } from "../../lib/format";
import type { AdminData, RecordStatus } from "../../lib/types";
import { Alert, SelectField, TextAreaField, TextField, inputClass } from "../../components/ui/forms";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { StateBadge } from "../../components/ProgramBits";
import { AdminCard, ConfirmButton, StatusBadge, dangerBtn, ghostBtn, primaryBtn, useAdmin, useAdminAction } from "./AdminLayout";

type AdminProgram = AdminData["programs"][number];

const STATUS_TEXT = { draft: "Piszkozat", published: "Közzétéve", cancelled: "Elmarad" } as const;

export function AdminProgramsPage() {
  const { data } = useAdmin();
  if (!data) return null;
  const sorted = [...data.programs].sort((a, b) => (b.sessions[0]?.startsAt ?? "").localeCompare(a.sessions[0]?.startsAt ?? ""));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-forest sm:text-4xl">Programok és jelentkezők</h1>
        <Link to="/admin/programok/uj" className={primaryBtn}><Plus className="h-4 w-4" aria-hidden="true" />Új program</Link>
      </div>
      {sorted.length === 0 ? (
        <AdminCard>
          <p className="text-ink/70">Még nincs program. Hozz létre egy mesés workshopot vagy meseműhelyt az „Új program" gombbal.</p>
        </AdminCard>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {sorted.map((p) => {
            const pending = data.registrations.filter((r) => r.programId === p.id && r.status === "pending").length;
            return (
              <li key={p.id}>
                <Link to={`/admin/programok/${p.id}`} className="focus-ring block h-full rounded-[22px] border border-forest/10 bg-white/70 p-5 transition hover:border-forest/25">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-terracotta/10 px-2.5 py-1 font-semibold text-terracotta">{p.typeLabel}</span>
                    <span className="rounded-full bg-forest/10 px-2.5 py-1 font-semibold text-forest">{STATUS_TEXT[p.status]}</span>
                    {p.status !== "draft" && <StateBadge state={p.registrationState} />}
                  </div>
                  <p className="mt-3 font-serif text-xl text-forest">{p.title}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {p.sessions[0] ? `${formatDate(p.sessions[0].startsAt)}${p.sessions.length > 1 ? ` · ${p.sessions.length} alkalom` : ""}` : "Nincs időpont"}
                  </p>
                  <p className="mt-2 text-sm text-ink/70">
                    {p.seatsTaken}/{p.capacity} hely foglalt{pending ? ` · ${pending} visszaigazolásra vár` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type SessionDraft = { date: string; start: string; end: string };
type Draft = {
  type: "workshop" | "mesemuhely";
  title: string;
  summary: string;
  description: string;
  location: string;
  image: string;
  capacity: string;
  status: "draft" | "published" | "cancelled";
  registrationOpen: boolean;
  sessions: SessionDraft[];
};

function toDraft(p?: AdminProgram): Draft {
  if (!p) {
    return { type: "workshop", title: "", summary: "", description: "", location: "", image: "", capacity: "10", status: "draft", registrationOpen: true, sessions: [{ date: "", start: "17:00", end: "19:00" }] };
  }
  return {
    type: p.type,
    title: p.title,
    summary: p.summary,
    description: p.description,
    location: p.location,
    image: p.image,
    capacity: String(p.capacity),
    status: p.status,
    registrationOpen: p.registrationOpen,
    sessions: p.sessions.map((s) => ({ date: budapestParts(s.startsAt).date, start: budapestParts(s.startsAt).time, end: budapestParts(s.endsAt).time })),
  };
}

export function AdminProgramEditPage() {
  const { id } = useParams();
  const { data, reload, notify } = useAdmin();
  const navigate = useNavigate();
  const existing = data?.programs.find((p) => p.id === id);
  const [draft, setDraft] = useState<Draft>(() => toDraft(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = !id;

  if (!data) return null;
  if (!isNew && !existing) {
    return <Alert tone="error">A program nem található. <Link to="/admin/programok" className="underline">Vissza a programokhoz</Link></Alert>;
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setSession = (i: number, patch: Partial<SessionDraft>) => set("sessions", draft.sessions.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  async function save(e: FormEvent, statusOverride?: Draft["status"]) {
    e.preventDefault();
    if (busy) return;
    const body = { ...draft, status: statusOverride ?? draft.status, capacity: Number(draft.capacity) };
    setBusy(true);
    setError(null);
    setErrors({});
    const res = isNew ? await api.createProgram(body) : await api.updateProgram(id!, body);
    setBusy(false);
    if (res.ok && res.data) {
      notify("success", res.message || "Mentve.");
      await reload();
      if (statusOverride) set("status", statusOverride);
      if (isNew) navigate(`/admin/programok/${res.data.program.id}`, { replace: true });
    } else {
      setError(res.message || "A mentés nem sikerült.");
      setErrors(res.errors ?? {});
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/programok" className="focus-ring text-sm text-ink/60 hover:text-terracotta">← Vissza a programokhoz</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-forest sm:text-4xl">{isNew ? "Új program" : draft.title || "Program szerkesztése"}</h1>
        {existing && existing.status !== "draft" && (
          <a href={`#/esemenyek/${existing.slug}`} target="_blank" rel="noreferrer" className={ghostBtn}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />Nyilvános oldal
          </a>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AdminCard title="Program adatai">
          <form onSubmit={(e) => save(e)} noValidate className="space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-ink/80">Programforma</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {([
                  ["workshop", "Mesés workshop", "Egyalkalmas csoportos program felnőtteknek"],
                  ["mesemuhely", "Meseműhely", "Több, egymásra épülő találkozó, zárt csoport"],
                ] as const).map(([value, label, hint]) => (
                  <label key={value} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-terracotta ${draft.type === value ? "border-forest bg-forest/5" : "border-forest/15"}`}>
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={draft.type === value}
                      disabled={Boolean(existing && existing.seatsTaken > 0)}
                      onChange={() => {
                        set("type", value);
                        if (value === "mesemuhely" && draft.sessions.length < 2) set("sessions", [...draft.sessions, { date: "", start: draft.sessions[0]?.start ?? "17:00", end: draft.sessions[0]?.end ?? "19:00" }]);
                        if (value === "workshop" && draft.sessions.length > 1) set("sessions", draft.sessions.slice(0, 1));
                      }}
                      className="mt-1 h-4 w-4 accent-forest"
                    />
                    <span>
                      <span className="block font-semibold text-forest">{label}</span>
                      <span className="block text-sm text-ink/65">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {existing && existing.seatsTaken > 0 && <p className="mt-2 text-xs text-ink/55">A forma nem módosítható, mert már vannak jelentkezők.</p>}
            </fieldset>

            <TextField label="Cím" required value={draft.title} onChange={(e) => set("title", e.target.value)} error={errors.title} maxLength={140} />
            <TextAreaField label="Rövid leírás (a listában jelenik meg)" rows={2} value={draft.summary} onChange={(e) => set("summary", e.target.value)} error={errors.summary} maxLength={400} />
            <TextAreaField label="Részletes leírás" rows={6} value={draft.description} onChange={(e) => set("description", e.target.value)} error={errors.description} maxLength={6000} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Helyszín" value={draft.location} onChange={(e) => set("location", e.target.value)} error={errors.location} maxLength={200} />
              <TextField label="Férőhely (fő)" required type="number" min={1} max={200} inputMode="numeric" value={draft.capacity} onChange={(e) => set("capacity", e.target.value)} error={errors.capacity} />
            </div>
            <ImageUpload label="Kép" value={draft.image} onChange={(url) => set("image", url)} />
            {errors.image && <p className="text-sm text-rose-700">{errors.image}</p>}

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-ink/80">
                {draft.type === "workshop" ? "Időpont" : "Alkalmak (legalább kettő)"} — budapesti idő szerint
              </legend>
              {draft.sessions.map((s, i) => (
                <div key={i} className="rounded-2xl border border-forest/10 bg-paper p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
                    <label className="col-span-2 block space-y-1 sm:col-span-1">
                      <span className="text-xs font-semibold text-ink/70">{draft.type === "mesemuhely" ? `${i + 1}. alkalom napja` : "Nap"}</span>
                      <input type="date" min={isNew ? todayInBudapest() : undefined} value={s.date} onChange={(e) => setSession(i, { date: e.target.value })} className={`${inputClass} border-forest/15`} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-ink/70">Kezdés</span>
                      <input type="time" value={s.start} onChange={(e) => setSession(i, { start: e.target.value })} className={`${inputClass} border-forest/15`} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-ink/70">Befejezés</span>
                      <input type="time" value={s.end} onChange={(e) => setSession(i, { end: e.target.value })} className={`${inputClass} border-forest/15`} />
                    </label>
                    {draft.type === "mesemuhely" && draft.sessions.length > 2 && (
                      <button type="button" aria-label={`${i + 1}. alkalom törlése`} onClick={() => set("sessions", draft.sessions.filter((_, j) => j !== i))} className={`${dangerBtn} col-span-2 sm:col-span-1`}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {errors[`sessions.${i}`] && <p className="mt-2 text-sm text-rose-700">{errors[`sessions.${i}`]}</p>}
                </div>
              ))}
              {draft.type === "mesemuhely" && (
                <button type="button" className={ghostBtn} onClick={() => set("sessions", [...draft.sessions, { date: "", start: draft.sessions[draft.sessions.length - 1]?.start ?? "17:00", end: draft.sessions[draft.sessions.length - 1]?.end ?? "19:00" }])}>
                  <Plus className="h-4 w-4" aria-hidden="true" />Alkalom hozzáadása
                </button>
              )}
              {errors.sessions && <p className="text-sm text-rose-700">{errors.sessions}</p>}
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Állapot" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])} error={errors.status}>
                <option value="draft">Piszkozat (nem látható)</option>
                <option value="published">Közzétéve</option>
                <option value="cancelled">Elmarad</option>
              </SelectField>
              <label className="flex items-center gap-3 self-end rounded-2xl border border-forest/15 px-4 py-3">
                <input type="checkbox" checked={draft.registrationOpen} onChange={(e) => set("registrationOpen", e.target.checked)} className="h-5 w-5 accent-forest" />
                <span className="text-[15px] text-ink">Jelentkezés nyitva</span>
              </label>
            </div>

            {error && <Alert tone="error">{error}</Alert>}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Mentés…" : "Mentés"}</button>
              {draft.status === "draft" && (
                <button type="button" disabled={busy} className={ghostBtn} onClick={(e) => save(e as unknown as FormEvent, "published")}>Mentés és közzététel</button>
              )}
              {existing && existing.seatsTaken === 0 && data.registrations.every((r) => r.programId !== existing.id) && (
                <ConfirmButton
                  label="Program törlése"
                  question="Végleg törlöd?"
                  onConfirm={async () => {
                    const res = await api.deleteProgram(existing.id);
                    if (res.ok) {
                      notify("success", "Program törölve.");
                      await reload();
                      navigate("/admin/programok", { replace: true });
                    } else notify("error", res.message || "A törlés nem sikerült.");
                  }}
                />
              )}
            </div>
          </form>
        </AdminCard>

        {existing && <RegistrationsCard program={existing} data={data} />}
      </div>
    </div>
  );
}

function RegistrationsCard({ program, data }: { program: AdminProgram; data: AdminData }) {
  const act = useAdminAction();
  const regs = useMemo(() => data.registrations.filter((r) => r.programId === program.id), [data.registrations, program.id]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const run = async (regId: string, status: RecordStatus) => {
    setBusyId(regId);
    await act(() => api.setRegistrationStatus(regId, status));
    setBusyId(null);
  };
  const past = program.isPast;

  return (
    <AdminCard title={`Jelentkezők (${program.seatsTaken}/${program.capacity} hely)`}>
      <p className="mb-4 text-sm text-ink/65">
        A „Visszaigazolásra vár" és a „Visszaigazolva" jelentkezések foglalnak helyet; a lemondott és elutasított nem.
      </p>
      {program.sessions.length > 0 && (
        <ol className="mb-4 space-y-1 text-sm text-forest">
          {program.sessions.map((s, i) => (
            <li key={s.id}>{program.sessions.length > 1 ? `${i + 1}. ` : ""}{formatSessionRange(s.startsAt, s.endsAt)}</li>
          ))}
        </ol>
      )}
      {regs.length === 0 ? (
        <p className="text-ink/60">Még nincs jelentkező.</p>
      ) : (
        <ul className="space-y-3">
          {regs.map((r) => (
            <li key={r.id} className="rounded-2xl border border-forest/10 bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-forest">{r.name} <span className="font-normal text-ink/60">· {r.seats} fő</span></p>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-1 flex flex-col gap-1 text-sm text-ink/75 sm:flex-row sm:flex-wrap sm:gap-x-4">
                <a href={`mailto:${r.email}`} className="focus-ring inline-flex items-center gap-1.5 break-all hover:text-terracotta"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{r.email}</a>
                <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="focus-ring inline-flex items-center gap-1.5 hover:text-terracotta"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{r.phone}</a>
              </div>
              {r.notes && <p className="mt-2 whitespace-pre-line rounded-xl bg-white/70 p-3 text-sm text-ink/80">{r.notes}</p>}
              {!past && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <>
                      <button type="button" disabled={busyId === r.id} className={primaryBtn} onClick={() => run(r.id, "confirmed")}>Visszaigazolás</button>
                      <button type="button" disabled={busyId === r.id} className={dangerBtn} onClick={() => run(r.id, "rejected")}>Elutasítás</button>
                    </>
                  )}
                  {r.status === "confirmed" && <ConfirmButton label="Lemondás" question="Lemondod? A jelentkező e-mailt kap." onConfirm={() => run(r.id, "cancelled")} />}
                  {(r.status === "cancelled" || r.status === "rejected") && (
                    <button type="button" disabled={busyId === r.id} className={ghostBtn} onClick={() => run(r.id, "pending")}>Visszaállítás</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
