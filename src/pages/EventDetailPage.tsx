import { type FormEvent, useEffect, useState } from "react";
import { CalendarDays, MapPin, Send, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { ManageLink } from "../components/ManageLink";
import { api, mediaUrl, type FollowUp } from "../lib/api";
import { formatSessionRange } from "../lib/format";
import type { Program } from "../lib/types";
import {
  Alert,
  Honeypot,
  PageShell,
  PrivacyNote,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  pageTitleClass,
  useSubmission,
  validateContactFields,
} from "../components/ui/forms";
import { StateBadge, TypeBadge, seatsText } from "../components/ProgramBits";

type RegResult = { registration: { id: string; status: string; statusLabel: string; seats: number; programTitle: string } } & FollowUp;

const CLOSED_TEXT: Record<string, string> = {
  full: "Ez a program betelt. Érdeklődj a következő alkalomról — Johanna szól, ha felszabadul hely vagy új csoport indul.",
  closed: "Erre a programra a jelentkezés jelenleg nem lehetséges. Írj Johannának, ha kérdésed van.",
  past: "Ez a program már lezajlott. Érdeklődj a következő alkalomról!",
  cancelled: "Ez a program elmarad. Érdeklődj a következő alkalomról!",
};

export function EventDetailPage() {
  const { slug = "" } = useParams();
  const { refreshPublic } = useAppContext();
  const [program, setProgram] = useState<Program | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [form, setForm] = useState({ name: "", email: "", phone: "", seats: "1", notes: "", website: "" });
  const { sending, error, fieldErrors, result, submit } = useSubmission<RegResult>();
  const set = (field: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  async function load() {
    const res = await api.program(slug);
    if (res.ok && res.data) {
      setProgram(res.data.program);
      setLoadState("ready");
    } else setLoadState(res.status === 404 ? "missing" : "error");
  }
  useEffect(() => {
    setLoadState("loading");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!program) return;
    const res = await submit(
      (idempotencyKey) => api.createRegistration({ programId: program.id, ...form, seats: Number(form.seats), idempotencyKey }),
      validateContactFields(form, { phoneRequired: true }),
    );
    if (res && (res.ok || res.status === 409)) {
      load();
      refreshPublic();
    }
  };

  if (loadState === "loading") {
    return <PageShell backTo="/esemenyek" backLabel="Vissza a programokhoz"><p className="mt-10 text-ink/60" role="status">Betöltés…</p></PageShell>;
  }
  if (loadState !== "ready" || !program) {
    return (
      <PageShell backTo="/esemenyek" backLabel="Vissza a programokhoz">
        <div className="mt-8 space-y-4">
          <Alert tone={loadState === "missing" ? "info" : "error"}>
            {loadState === "missing" ? "Ez a program nem található, vagy már nem érhető el." : "A program adatait most nem sikerült betölteni. Kérlek, próbáld újra később."}
          </Alert>
          <Link to="/esemenyek" className="focus-ring inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-paper hover:bg-terracotta">Összes program</Link>
        </div>
      </PageShell>
    );
  }

  const isOpen = program.registrationState === "open";
  const seatOptions = Array.from({ length: Math.min(program.maxSeatsPerRegistration, program.seatsLeft) }, (_, i) => i + 1);

  return (
    <PageShell wide backTo="/esemenyek" backLabel="Vissza a programokhoz">
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge program={program} />
            <StateBadge state={program.registrationState} />
          </div>
          <h1 className={pageTitleClass}>{program.title}</h1>
          {program.summary && <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-ink/80">{program.summary}</p>}
          {program.image && (
            <img src={mediaUrl(program.image)} alt="" className="mt-6 aspect-[16/10] w-full rounded-[24px] object-cover" />
          )}
          {program.description && (
            <div className="mt-6 max-w-[62ch] whitespace-pre-line text-[16px] leading-relaxed text-ink/75">{program.description}</div>
          )}

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-forest/10 bg-white/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-terracotta">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {program.sessions.length > 1 ? `${program.sessions.length} alkalom — a jelentkezés a teljes folyamatra szól` : "Időpont"}
              </h2>
              <ol className="mt-3 space-y-1.5 text-[15px] text-forest">
                {program.sessions.map((s, i) => (
                  <li key={s.id}>
                    {program.sessions.length > 1 && <span className="mr-1 text-ink/55">{i + 1}.</span>}
                    {formatSessionRange(s.startsAt, s.endsAt)}
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-forest/10 bg-white/60 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-terracotta"><MapPin className="h-4 w-4" aria-hidden="true" />Helyszín</p>
                <p className="mt-2 text-[15px] text-forest">{program.location || "Egyeztetés alatt"}</p>
              </div>
              <div className="rounded-2xl border border-forest/10 bg-white/60 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-terracotta"><Users className="h-4 w-4" aria-hidden="true" />Férőhely</p>
                <p className="mt-2 text-[15px] text-forest">{program.registrationState === "cancelled" ? "—" : seatsText(program)}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-w-0">
          <div className="rounded-[28px] border border-forest/10 bg-white/70 p-6 shadow-sm sm:p-7 lg:sticky lg:top-6">
            <h2 className="font-serif text-2xl text-forest">{isOpen ? "Jelentkezés" : "Érdeklődés"}</h2>
            {result?.ok && result.data ? (
              <div className="mt-5 space-y-3">
                <Alert tone="success">
                  <p className="font-semibold">{result.message}</p>
                  <p className="mt-1 text-sm">
                    Állapot: {result.data.registration.statusLabel} · {result.data.registration.seats} fő
                  </p>
                </Alert>
                {result.data.emailNotifications && <p className="text-sm text-ink/65">A részleteket és a lemondási lehetőséget e-mailben is elküldtük.</p>}
                <ManageLink url={result.data.manageUrl} kind="registration" />
              </div>
            ) : isOpen ? (
              <form onSubmit={handleSubmit} noValidate className="relative mt-5 space-y-4">
                <Honeypot value={form.website} onChange={set("website")} />
                {program.type === "mesemuhely" && (
                  <p className="rounded-2xl bg-sage/30 px-4 py-3 text-sm leading-relaxed text-forest">
                    A meseműhely zárt csoport: a jelentkezés mind a(z) {program.sessions.length} alkalomra szól.
                  </p>
                )}
                <TextField label="Név" required value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" error={fieldErrors.name} maxLength={100} />
                <TextField label="E-mail" type="email" required value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" inputMode="email" error={fieldErrors.email} />
                <TextField label="Telefonszám" type="tel" required value={form.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" placeholder="+36 30 123 4567" error={fieldErrors.phone} />
                {seatOptions.length > 1 && (
                  <SelectField label="Létszám" value={form.seats} onChange={(e) => set("seats")(e.target.value)} error={fieldErrors.seats}>
                    {seatOptions.map((n) => (
                      <option key={n} value={n}>{n} fő</option>
                    ))}
                  </SelectField>
                )}
                <TextAreaField label="Megjegyzés" optional rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} error={fieldErrors.notes} maxLength={2000} />
                {error && <Alert tone="error">{error}</Alert>}
                <SubmitButton sending={sending}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Jelentkezem
                </SubmitButton>
                <PrivacyNote />
              </form>
            ) : (
              <div className="mt-4 space-y-5">
                {error && <Alert tone="error">{error}</Alert>}
                <p className="text-[15px] leading-relaxed text-ink/75">{CLOSED_TEXT[program.registrationState]}</p>
                <Link
                  to={`/erdeklodes?program=${program.slug}&tema=${program.type}`}
                  className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 font-sans text-sm font-semibold text-paper transition-colors hover:bg-terracotta"
                >
                  Érdeklődöm
                </Link>
              </div>
            )}
            {isOpen && !result?.ok && (
              <p className="mt-4 text-xs text-ink/55">
                Kérdésed van előtte?{" "}
                <Link to={`/erdeklodes?program=${program.slug}`} className="focus-ring underline hover:text-terracotta">Írj Johannának</Link>
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
