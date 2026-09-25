import { type FormEvent, useState } from "react";
import { Mail, Phone, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { formatDate, formatDateTime, formatTime, todayInBudapest } from "../../lib/format";
import type { AdminBooking, RecordStatus } from "../../lib/types";
import { Alert, inputClass } from "../../components/ui/forms";
import { AdminCard, ConfirmButton, StatusBadge, dangerBtn, ghostBtn, primaryBtn, useAdmin, useAdminAction } from "./AdminLayout";

const FILTERS: { value: "upcoming" | RecordStatus | "all"; label: string }[] = [
  { value: "upcoming", label: "Közelgő aktív" },
  { value: "pending", label: "Visszaigazolásra vár" },
  { value: "confirmed", label: "Visszaigazolva" },
  { value: "cancelled", label: "Lemondva" },
  { value: "rejected", label: "Elutasítva" },
  { value: "all", label: "Mind" },
];

export function AdminBookingsPage() {
  const { data } = useAdmin();
  const act = useAdminAction();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("upcoming");
  const [showPastSlots, setShowPastSlots] = useState(false);
  if (!data) return null;
  const now = new Date().toISOString();

  const bookings = data.bookings
    .filter((b) =>
      filter === "all" ? true : filter === "upcoming" ? b.startsAt > now && (b.status === "pending" || b.status === "confirmed") : b.status === filter,
    )
    .sort((a, b) => (filter === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt)));
  const slots = data.slots.filter((s) => showPastSlots || s.startsAt > now);
  const bookingById = new Map(data.bookings.map((b) => [b.id, b]));

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-forest sm:text-4xl">Időpontok és foglalások</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AdminCard title="Egyéni foglalások">
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Szűrés állapot szerint">
            {FILTERS.map((f) => (
              <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)} className={`${filter === f.value ? primaryBtn : ghostBtn} shrink-0`}>
                {f.label}
              </button>
            ))}
          </div>
          {bookings.length === 0 ? (
            <p className="text-ink/60">Ebben a nézetben nincs foglalás.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <BookingRow key={b.id} booking={b} past={b.startsAt <= now} onStatus={(status) => act(() => api.setBookingStatus(b.id, status))} />
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-6">
          <NewSlotsForm />
          <AdminCard
            title="Meghirdetett időpontok"
            actions={
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" checked={showPastSlots} onChange={(e) => setShowPastSlots(e.target.checked)} className="h-4 w-4 accent-forest" />
                Elmúltak is
              </label>
            }
          >
            {slots.length === 0 ? (
              <p className="text-ink/60">Nincs meghirdetett időpont. Adj hozzá újat fent.</p>
            ) : (
              <ul className="divide-y divide-forest/10">
                {slots.map((s) => {
                  const booking = s.activeBookingId ? bookingById.get(s.activeBookingId) : null;
                  const past = s.startsAt <= now;
                  return (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <p className={`font-semibold ${past ? "text-ink/50" : "text-forest"}`}>
                          {formatDate(s.startsAt)} {formatTime(s.startsAt)} <span className="font-normal text-ink/55">· {s.durationMin} perc</span>
                        </p>
                        <p className="text-sm text-ink/65">
                          {booking ? `Foglalva: ${booking.name}` : past ? "Elmúlt" : s.status === "open" ? "Szabad, foglalható" : "Lezárva, nem foglalható"}
                        </p>
                      </div>
                      {!past && (
                        <div className="flex flex-wrap gap-2">
                          {s.status === "open" ? (
                            <button type="button" className={ghostBtn} onClick={() => act(() => api.setSlotStatus(s.id, "closed"))}>Lezárás</button>
                          ) : (
                            <button type="button" className={ghostBtn} onClick={() => act(() => api.setSlotStatus(s.id, "open"))}>Megnyitás</button>
                          )}
                          {s.bookingCount === 0 && <ConfirmButton label="Törlés" onConfirm={() => act(() => api.deleteSlot(s.id)).then(() => undefined)} />}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking: b, past, onStatus }: { booking: AdminBooking; past: boolean; onStatus: (s: RecordStatus) => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const run = async (s: RecordStatus) => {
    setBusy(true);
    await onStatus(s);
    setBusy(false);
  };
  return (
    <li className="rounded-2xl border border-forest/10 bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-forest">{formatDateTime(b.startsAt)}</p>
          <p className="text-[15px] text-ink">{b.name}</p>
        </div>
        <StatusBadge status={b.status} />
      </div>
      <div className="mt-2 flex flex-col gap-1 text-sm text-ink/75 sm:flex-row sm:flex-wrap sm:gap-x-4">
        <a href={`mailto:${b.email}`} className="focus-ring inline-flex items-center gap-1.5 break-all hover:text-terracotta"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{b.email}</a>
        <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="focus-ring inline-flex items-center gap-1.5 hover:text-terracotta"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{b.phone}</a>
      </div>
      {b.notes && <p className="mt-2 whitespace-pre-line rounded-xl bg-white/70 p-3 text-sm text-ink/80">{b.notes}</p>}
      <p className="mt-2 text-xs text-ink/50">Beérkezett: {formatDateTime(b.createdAt)}</p>
      {!past && (
        <div className="mt-3 flex flex-wrap gap-2">
          {b.status === "pending" && (
            <>
              <button type="button" disabled={busy} className={primaryBtn} onClick={() => run("confirmed")}>Visszaigazolás</button>
              <button type="button" disabled={busy} className={dangerBtn} onClick={() => run("rejected")}>Elutasítás</button>
            </>
          )}
          {b.status === "confirmed" && <ConfirmButton label="Lemondás" question="Lemondod? A vendég e-mailt kap." onConfirm={() => run("cancelled")} />}
          {(b.status === "cancelled" || b.status === "rejected") && (
            <button type="button" disabled={busy} className={ghostBtn} onClick={() => run("pending")}>Visszaállítás</button>
          )}
        </div>
      )}
    </li>
  );
}

function NewSlotsForm() {
  const { reload, notify } = useAdmin();
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>(["10:00"]);
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!date || times.some((t) => !t)) {
      setError("Adj meg dátumot és legalább egy kezdési időt.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await api.createSlots({ date, times, durationMin: Number(duration) });
    setBusy(false);
    if (res.ok) {
      notify("success", res.message || "Időpontok létrehozva.");
      setTimes(["10:00"]);
      await reload();
    } else setError(res.message || "Nem sikerült menteni.");
  }

  return (
    <AdminCard title="Új szabad időpont">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/80">Nap</span>
            <input type="date" min={todayInBudapest()} value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} border-forest/15`} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink/80">Időtartam</span>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputClass} border-forest/15`}>
              {[45, 50, 60, 75, 90, 120].map((m) => (
                <option key={m} value={m}>{m} perc</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink/80">Kezdési idő(k) — budapesti idő szerint</legend>
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={t}
                aria-label={`${i + 1}. kezdési idő`}
                onChange={(e) => setTimes((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                className={`${inputClass} border-forest/15 max-w-[12rem]`}
              />
              {times.length > 1 && (
                <button type="button" className={ghostBtn} onClick={() => setTimes((prev) => prev.filter((_, j) => j !== i))}>Eltávolítás</button>
              )}
            </div>
          ))}
          <button type="button" className={ghostBtn} onClick={() => setTimes((prev) => [...prev, ""])}>
            <Plus className="h-4 w-4" aria-hidden="true" /> További időpont ezen a napon
          </button>
        </fieldset>
        {error && <Alert tone="error">{error}</Alert>}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Mentés…" : "Időpont(ok) meghirdetése"}</button>
      </form>
    </AdminCard>
  );
}

