import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, CheckCircle2, MapPin, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function EventDetailPage() {
  const { slug } = useParams();
  const {
    events,
    groups,
    addEventRegistration,
    addGroupRegistration,
    getEventRegistrationCount,
    getGroupRegistrationCount,
  } = useAppContext();

  const event = events.find((item) => item.slug === slug);
  const group = groups.find((item) => item.id === slug);
  const isGroupFlow = Boolean(group) && !event;
  const activeItem = event ?? group;

  const defaultPreferredDate = event?.date ?? group?.date ?? "";
  const defaultPreferredTime = isGroupFlow ? (group?.time ?? "") : (event?.startTime ?? "");

  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: defaultPreferredDate,
    preferredTime: defaultPreferredTime,
    guests: 1,
    notes: "",
  });

  if (!activeItem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
        <div className="rounded-[28px] border border-forest/10 bg-white/60 p-8 text-center">
          <h1 className="font-serif text-3xl text-forest">Az esemény vagy csoport nem található.</h1>
          <Link to="/esemenyek" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2.5 font-sans text-sm font-semibold text-paper">
            Vissza az eseményekhez
          </Link>
        </div>
      </div>
    );
  }

  const currentCount = isGroupFlow
    ? getGroupRegistrationCount(group!.id)
    : getEventRegistrationCount(event!.id);
  const remainingSpots = Math.max((isGroupFlow ? group!.capacity : event!.capacity) - currentCount, 0);
  const itemStatus = isGroupFlow ? "Csoport" : event?.status ?? "published";

  const handleSubmit = (eventSubmit: FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault();

    if (isGroupFlow) {
      const result = addGroupRegistration({
        groupId: group!.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        preferredDate: form.preferredDate || group!.date,
        preferredTime: form.preferredTime || group!.time,
        notes: form.notes || undefined,
      });

      setStatus({ ok: result.ok, message: result.message });
      if (result.ok) {
        setForm({
          name: "",
          email: "",
          phone: "",
          preferredDate: group!.date,
          preferredTime: group!.time,
          guests: 1,
          notes: "",
        });
      }
      return;
    }

    const result = addEventRegistration({
      eventId: event!.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      preferredDate: form.preferredDate || event!.date,
      preferredTime: form.preferredTime || event!.startTime,
      guests: form.guests,
      notes: form.notes || undefined,
    });

    setStatus({ ok: result.ok, message: result.message });

    if (result.ok) {
      setForm({
        name: "",
        email: "",
        phone: "",
        preferredDate: event!.date,
        preferredTime: event!.startTime,
        guests: 1,
        notes: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-forest/10 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="font-serif text-2xl text-forest">Mesegombolyag</Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-forest/80">
            <Link to="/">Kezdőlap</Link>
            <Link to="/foglalas">Foglalás</Link>
            <Link to="/esemenyek">Események</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <section className="overflow-hidden rounded-[30px] border border-forest/10 bg-white/60">
          <img src={activeItem.image} alt={activeItem.title} className="h-72 w-full object-cover" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-paper">{itemStatus}</span>
              <span className="rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold text-terracotta">Jelentkezés</span>
            </div>

            <h1 className="mt-5 font-serif text-4xl text-forest">{activeItem.title}</h1>
            <p className="mt-4 text-base text-ink/75">{isGroupFlow ? (group!.description) : (event!.description)}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <InfoChip icon={<CalendarDays className="h-4 w-4" />} label="Dátum" value={activeItem.date} />
              <InfoChip icon={<MapPin className="h-4 w-4" />} label="Helyszín" value={activeItem.location} />
              <InfoChip icon={<Users className="h-4 w-4" />} label="Férőhely" value={`${remainingSpots} szabad`} />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-forest p-6 text-paper">
            <p className="text-xs uppercase tracking-[0.25em] text-ochre">Jelentkezés</p>
            <h2 className="mt-4 font-serif text-3xl">{isGroupFlow ? "Jelentkezz a csoportos programra" : "Jelentkezz az eseményre"}</h2>
            <div className="mt-5 space-y-3 text-sm text-paper/80">
              <div className="flex items-center gap-3"><Users className="h-4 w-4" /> {remainingSpots} szabad hely</div>
              <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4" /> {activeItem.date} · {isGroupFlow ? (group?.time ?? "") : (event?.startTime ?? "")}</div>
            </div>
          </div>

          <form className="rounded-[28px] border border-forest/10 bg-white/60 p-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="font-medium text-forest">Név</span>
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base" required />
              </label>
              <label className="block space-y-2">
                <span className="font-medium text-forest">E-mail</span>
                <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base" required />
              </label>
              <label className="block space-y-2">
                <span className="font-medium text-forest">Telefonszám</span>
                <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base" required />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-medium text-forest">Preferált dátum</span>
                  <input
                    type="date"
                    value={form.preferredDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
                    className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base"
                    min={activeItem.date}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-medium text-forest">Preferált idő</span>
                  <input
                    type="time"
                    value={form.preferredTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, preferredTime: event.target.value }))}
                    className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base"
                    required
                  />
                </label>
              </div>

              {!isGroupFlow && (
                <label className="block space-y-2">
                  <span className="font-medium text-forest">Létszám</span>
                  <select value={form.guests} onChange={(event) => setForm((prev) => ({ ...prev, guests: Number(event.target.value) }))} className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>{count} fő</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block space-y-2">
                <span className="font-medium text-forest">Megjegyzés</span>
                <textarea rows={4} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base" />
              </label>
            </div>

            {status && (
              <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${status.ok ? "border-emerald-700/20 bg-emerald-50 text-emerald-800" : "border-rose-700/20 bg-rose-50 text-rose-800"}`}>
                {status.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <Users className="mt-0.5 h-5 w-5" />}
                <span>{status.message}</span>
              </div>
            )}

            <button type="submit" className="mt-6 w-full rounded-full bg-forest px-6 py-3.5 font-sans font-semibold text-paper hover:bg-terracotta">
              {isGroupFlow ? "Jelentkezés elküldése" : "Jelentkezés elküldése"}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-paper p-4">
      <div className="flex items-center gap-2 text-sm text-terracotta">{icon} {label}</div>
      <p className="mt-2 font-medium text-forest">{value}</p>
    </div>
  );
}
