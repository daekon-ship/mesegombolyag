import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { services, availability } from "../lib/siteData";
import { useAppContext } from "../context/AppState";

const initialForm = {
  serviceId: services[0]?.id ?? "meseterapia",
  date: availability[0]?.date ?? "",
  slot: "",
  name: "",
  email: "",
  phone: "",
  childName: "",
  notes: "",
};

export function BookingPage() {
  const { addBooking, getAvailableSlots } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const availableSlots = useMemo(
    () => (form.date ? getAvailableSlots(form.date, form.serviceId) : []),
    [form.date, form.serviceId, getAvailableSlots],
  );

  const selectedService = services.find((service) => service.id === form.serviceId) ?? services[0];

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "serviceId" ? { slot: "" } : {}),
      ...(key === "date" ? { slot: "" } : {}),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = addBooking({
      serviceId: form.serviceId,
      date: form.date,
      slot: form.slot,
      name: form.name,
      email: form.email,
      phone: form.phone,
      childName: form.childName || undefined,
      notes: form.notes || undefined,
    });

    setStatus({ ok: result.ok, message: result.message });

    if (result.ok) {
      setForm({ ...initialForm, serviceId: form.serviceId, date: form.date });
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

      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <section className="rounded-[32px] border border-forest/10 bg-white/60 p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3 text-terracotta">
            <ArrowLeft className="h-4 w-4" />
            <Link to="/" className="font-medium">Vissza a főoldalra</Link>
          </div>

          <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            Egyéni időpontfoglalás
          </p>
          <h1 className="mt-4 font-serif text-4xl text-forest">Jelentkezz be egy személyre szabott alkalomra</h1>
          <p className="mt-4 max-w-xl text-base text-ink/75">
            Válaszd ki a számításra eső alkalmat, majd add meg a szükséges adataidat. A foglalások ellenőrzése után Johanna visszaigazolja a megerősítést.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => handleChange("serviceId", service.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.serviceId === service.id
                      ? "border-terracotta bg-terracotta/5 shadow-sm"
                      : "border-forest/10 bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-xl text-forest">{service.name}</span>
                    <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-paper">
                      {service.duration} min
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{service.description}</p>
                  {service.price && (
                    <p className="mt-3 text-sm font-semibold text-terracotta">{service.price.toLocaleString("hu-HU")} Ft</p>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="font-medium text-forest">Dátum</span>
                <select
                  value={form.date}
                  onChange={(event) => handleChange("date", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                >
                  {availability.map((entry) => (
                    <option key={entry.date} value={entry.date}>
                      {new Date(`${entry.date}T12:00:00`).toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="font-medium text-forest">Időpont</span>
                <select
                  value={form.slot}
                  onChange={(event) => handleChange("slot", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                  disabled={!availableSlots.length}
                >
                  <option value="">Válassz időpontot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="font-medium text-forest">Név</span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-medium text-forest">E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="font-medium text-forest">Telefonszám</span>
                <input
                  value={form.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-medium text-forest">Gyermek neve (opcionális)</span>
                <input
                  value={form.childName}
                  onChange={(event) => handleChange("childName", event.target.value)}
                  className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="font-medium text-forest">Megjegyzés</span>
              <textarea
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink"
              />
            </label>

            {status && (
              <div
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  status.ok ? "border-emerald-700/20 bg-emerald-50 text-emerald-800" : "border-rose-700/20 bg-rose-50 text-rose-800"
                }`}
              >
                {status.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <CalendarDays className="mt-0.5 h-5 w-5" />}
                <span>{status.message}</span>
              </div>
            )}

            <button type="submit" className="w-full rounded-full bg-forest px-6 py-3.5 font-sans font-semibold text-paper transition hover:bg-terracotta">
              Foglalás elküldése
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-forest p-6 text-paper">
            <p className="text-xs uppercase tracking-[0.25em] text-ochre">Foglalás előtti ellenőrzés</p>
            <div className="mt-5 space-y-4 text-sm text-paper/85">
              <div className="flex items-center gap-3"><Clock3 className="h-4 w-4" /> {selectedService ? `${selectedService.duration} perces alkalom` : "Időtartam"}</div>
              <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4" /> {form.date ? new Date(`${form.date}T12:00:00`).toLocaleDateString("hu-HU", { month: "long", day: "numeric", year: "numeric" }) : "Válassz dátumot"}</div>
              <div className="flex items-center gap-3"><Clock3 className="h-4 w-4" /> {form.slot || "Még nincs kiválasztva időpont"}</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-paper-dim p-6">
            <h2 className="font-serif text-2xl text-forest">Mire számíthatsz?</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink/75">
              <li>• személyes, bizalmas hangulat</li>
              <li>• pontos és nyugodt időpontfoglalás</li>
              <li>• kényelmes és egyértelmű visszaigazolás</li>
              <li>• csak a szükséges adatok bekérése</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
