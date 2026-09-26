import { type FormEvent, useMemo, useState } from "react";
import { CalendarCheck2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { api } from "../lib/api";
import { budapestParts, formatDate, formatDateTime, formatTime } from "../lib/format";
import {
  Alert,
  Honeypot,
  PageShell,
  PrivacyNote,
  SubmitButton,
  TextAreaField,
  TextField,
  cardClass,
  eyebrowClass,
  pageTitleClass,
  useSubmission,
  validateContactFields,
} from "../components/ui/forms";

type BookingResult = { booking: { id: string; status: string; statusLabel: string; startsAt: string; durationMin: number } };

/**
 * Személyes kísérés mesékkel — egyéni időpontfoglalás a Johanna által meghirdetett szabad időpontokból.
 * A foglalás visszaigazolásra vár, amíg Johanna jóvá nem hagyja az adminban.
 */
export function BookingPage() {
  const { slots, publicState, refreshPublic } = useAppContext();
  const [slotId, setSlotId] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", website: "" });
  const { sending, error, fieldErrors, result, submit } = useSubmission<BookingResult>();
  const set = (field: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const days = useMemo(() => {
    const map = new Map<string, typeof slots>();
    for (const slot of slots) {
      const key = budapestParts(slot.startsAt).date;
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return [...map.entries()];
  }, [slots]);
  const selected = slots.find((s) => s.id === slotId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clientErrors = validateContactFields(form, { phoneRequired: true });
    if (!selected) clientErrors.slotId = "Kérlek, válassz egy szabad időpontot.";
    const res = await submit((idempotencyKey) => api.createBooking({ slotId, ...form, idempotencyKey }), clientErrors);
    if (res && !res.ok && (res.code === "SLOT_TAKEN" || res.code === "SLOT_UNAVAILABLE")) {
      setSlotId("");
      await refreshPublic();
    } else if (res?.ok) {
      refreshPublic();
    }
  };

  if (result?.ok && result.data) {
    const b = result.data.booking;
    return (
      <PageShell>
        <section className={`mt-6 ${cardClass}`}>
          <p className={eyebrowClass}>Személyes kísérés mesékkel</p>
          <h1 className={pageTitleClass}>Foglalásod megérkezett</h1>
          <div className="mt-6 space-y-4">
            <Alert tone="info">
              <p className="font-semibold">Állapot: {b.statusLabel}</p>
              <p className="mt-1">
                {formatDateTime(b.startsAt)} · {b.durationMin} perc
              </p>
              <p className="mt-2 text-sm">
                Johanna hamarosan visszaigazolja az időpontot. A részleteket és a lemondási lehetőséget e-mailben is elküldjük.
              </p>
            </Alert>
            <p className="text-sm text-ink/70">
              <Link to="/" className="focus-ring underline hover:text-terracotta">Vissza a főoldalra</Link>
            </p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className={`mt-6 ${cardClass}`}>
        <p className={eyebrowClass}>Személyes kísérés mesékkel</p>
        <h1 className={pageTitleClass}>Egyéni időpontfoglalás</h1>
        <p className="mt-4 max-w-[58ch] font-sans text-[15.5px] leading-relaxed text-ink/75">
          Válassz a meghirdetett szabad időpontok közül. A foglalás Johanna visszaigazolásával válik véglegessé — erről e-mailt kapsz.
        </p>

        {publicState === "loading" && <p className="mt-8 text-ink/60" role="status">Szabad időpontok betöltése…</p>}
        {publicState === "error" && (
          <div className="mt-8">
            <Alert tone="error">
              A szabad időpontokat most nem sikerült betölteni.{" "}
              <button type="button" onClick={() => refreshPublic()} className="focus-ring font-semibold underline">Újrapróbálom</button>
            </Alert>
          </div>
        )}

        {publicState === "ready" && slots.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-dashed border-forest/25 bg-sage/25 p-6 text-center sm:p-8">
            <h2 className="font-serif text-2xl text-forest">Jelenleg nincs meghirdetett szabad időpont</h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-[15px] leading-relaxed text-ink/70">
              Írd meg, milyen napszak és időszak lenne jó neked, és Johanna egyeztet veled.
            </p>
            <Link
              to="/erdeklodes?tema=individual"
              className="focus-ring mt-5 inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 font-sans text-sm font-semibold text-paper transition-colors hover:bg-terracotta"
            >
              Egyéni alkalomról érdeklődöm
            </Link>
          </div>
        )}

        {publicState === "ready" && slots.length > 0 && (
          <form onSubmit={handleSubmit} noValidate className="relative mt-8 space-y-7">
            <Honeypot value={form.website} onChange={set("website")} />
            <fieldset aria-describedby={fieldErrors.slotId ? "slot-error" : undefined}>
              <legend className="font-sans text-sm font-semibold text-ink/80">
                Időpont <span aria-hidden="true" className="text-terracotta">*</span>
              </legend>
              <div className="mt-3 space-y-4">
                {days.map(([day, daySlots]) => (
                  <div key={day}>
                    <p className="mb-2 text-sm font-semibold text-forest">{formatDate(daySlots[0].startsAt)}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => {
                        const active = slot.id === slotId;
                        return (
                          <label
                            key={slot.id}
                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[15px] transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                              active ? "border-forest bg-forest text-paper" : "border-forest/20 bg-paper text-forest hover:border-forest/50"
                            }`}
                          >
                            <input type="radio" name="slot" value={slot.id} checked={active} onChange={() => setSlotId(slot.id)} className="sr-only" />
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {formatTime(slot.startsAt)}
                            <span className={`text-xs ${active ? "text-paper/75" : "text-ink/50"}`}>{slot.durationMin} perc</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {fieldErrors.slotId && (
                <p id="slot-error" className="mt-2 text-sm text-rose-700">{fieldErrors.slotId}</p>
              )}
            </fieldset>

            {selected && (
              <p className="flex items-center gap-2 rounded-2xl bg-sage/30 px-4 py-3 text-[15px] text-forest">
                <CalendarCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Választott időpont: <strong className="font-semibold">{formatDateTime(selected.startsAt)}</strong>
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Név" required value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" error={fieldErrors.name} maxLength={100} />
              <TextField label="E-mail" type="email" required value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" inputMode="email" error={fieldErrors.email} />
            </div>
            <TextField label="Telefonszám" type="tel" required value={form.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" placeholder="+36 30 123 4567" error={fieldErrors.phone} />
            <TextAreaField
              label="Üzenet"
              optional
              rows={4}
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Ha szeretnéd, írd meg pár mondatban, mi hozott ide."
              error={fieldErrors.notes}
              maxLength={2000}
            />
            {error && <Alert tone="error">{error}</Alert>}
            <SubmitButton sending={sending}>
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              Időpont foglalása
            </SubmitButton>
            <PrivacyNote />
          </form>
        )}
      </section>
    </PageShell>
  );
}
